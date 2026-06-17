---
title: "Indexing Blockchain Data for Arbitrage"
year: 2026
spec: "Polygon PoS · Rust · self-hosted node · atomic execution"
summary: "Self-hosted Polygon node and Rust block indexer that replaced a third-party RPC dependency, enabling real-time arbitrage detection across DEX liquidity pools on mainnet."
cover: "/images/arb/freezer.png"
order: 1
---

**2600 Blockchain** is a self-sponsored team running an automated arbitrage system on the Polygon proof-of-stake network. The system detects when the same token is mispriced across two or more DEX liquidity pools and captures the spread with a single atomic transaction — one that reverts automatically if the trade is unprofitable by the time it lands. The team had an existing system deployed on Berachain mainnet generating real revenue before this project began.

The prior system sourced all blockchain data from a commercial RPC provider. This was the dominant latency bottleneck: every block notification arrived through at least one extra network hop, and under high load, shared provider infrastructure introduced variable queuing delays that no software optimization could fix. This project replaced that dependency entirely with a self-hosted Polygon full node and a custom Rust block indexer.

---

## Background: how DEX pricing works

Traditional exchanges match buyers and sellers through an order book. Decentralized exchanges (DEXs) instead use automated market makers (AMMs): smart contracts that hold two tokens in a liquidity pool and price trades using a fixed formula.

The simplest is the constant-product AMM (Uniswap V2):

<p class="eq">x · y = k</p>

where `x` and `y` are the reserve balances of the two tokens and `k` is a constant. A trader depositing `Δx` of token X receives `Δy` of token Y:

<p class="eq">Δy = y · Δx · (1 − f) / (x + Δx · (1 − f))</p>

where `f` is the protocol fee (typically 0.3%). The effective exchange rate at any instant is fully determined by the current reserve pair `(x, y)`. This is the key property the indexer exploits: maintaining an accurate copy of every pool's reserves is sufficient to compute all arbitrage opportunities without any additional on-chain queries at detection time.

### Multi-hop arbitrage

Because each DEX operates its own pool for the same token pair, the same token can trade at different prices across pools simultaneously. Atomic arbitrage corrects these discrepancies: a single transaction buys the underpriced token on one pool and sells it on another, reverting automatically if the net result is unprofitable.

For a cycle A → B → C → A across three pools, the trade is profitable when the output of the final swap exceeds the initial input, net of all fees:

<p class="eq">∏ [ Rᵢᵒᵘᵗ · (1 − fᵢ) / (Rᵢⁱⁿ + Δᵢ · (1 − fᵢ)) ] · Δᵢₙ > Δᵢₙ</p>

where `Rᵢⁱⁿ` and `Rᵢᵒᵘᵗ` are the reserves of the input and output tokens for pool `i`, and `Δᵢ` is the trade size at each hop. The indexer's role is solely to keep reserve values current so this calculation reflects actual market state.

### Why third-party RPC is a structural problem

Most participants access blockchain data through commercial providers such as Alchemy or Infura, which expose a standard JSON-RPC interface from their own servers. This introduces at minimum one additional network hop between the blockchain and the client. Under high network load, shared provider infrastructure adds variable queuing delay on top of that baseline. For an arbitrage system where competitive advantage is measured in milliseconds, these are structural disadvantages that software optimization cannot overcome.

---

## System architecture

Five components form an integrated pipeline from the Polygon peer-to-peer network to on-chain execution:

**Polygon full node → Pool scraper → Rust block indexer → Detection engine → Execution contracts**

Blocks arrive at the local node from the Polygon P2P network. The indexer consumes block events from the node, decodes swap logs, and updates the in-memory pool state map. The detection engine reads that map after every update, and when a profitable route is found, submits an atomic execution transaction back through the local node.

<div class="fig">
  <img src="/images/arb/systemlevel.png" alt="System-level architecture diagram" />
  <p class="fig-caption">System-level architecture: blockchain P2P data flows into the local node, through the indexer's pool HashMap, and back out as signed execution transactions.</p>
</div>

---

## 1. Polygon full node

Deploying a local full node structurally changes how the system receives data. By participating directly in Polygon's peer-to-peer network, the local Bor client receives new blocks straight from network validators — eliminating the intermediary network hop and delivering block data within milliseconds of creation.

### Hardware

The node runs on a dedicated Ubuntu server:

- **64 GB DDR4 RAM** — provides headroom for Bor's PebbleDB state cache, which directly minimizes the latency of RPC calls served to the indexer
- **8 TB NVMe SSD** — storage I/O throughput is the binding constraint during initial chain synchronization and ongoing node operation; high-speed NVMe is strictly necessary

### Client architecture

The Polygon proof-of-stake network requires two coordinating clients:

- **Heimdall (v0.6.0)** — the consensus layer. Manages validator coordination, span details, and checkpoints block hashes to Ethereum.
- **Bor (v2.6.0)** — the execution layer. Manages execution-layer state using PebbleDB and exposes a local WebSocket endpoint for the indexer.

Both clients run as isolated `systemd` services with automatic restart policies and increased system file handle limits (1,048,576) to accommodate PebbleDB's extensive `.sst` file generation.

### Critical configuration decisions

**Client communication protocol:** Heimdall and Bor communicate via gRPC on port 9090. The standard REST API on port 1317 is deprecated in Heimdall v0.6.0 — relying on it causes the node to silently stall. This was a non-obvious failure mode that required tracing log output to diagnose.

**Network isolation:** The node's network interfaces are deliberately isolated. The RPC server is bound exclusively to localhost, and transaction pool broadcasting is disabled. This ensures the node functions purely as a dedicated data source rather than wasting compute acting as a public network relay.

### Bootstrapping: the snapshot problem

Operating a full Polygon node requires downloading and maintaining multiple terabytes of historical chain data. We initially selected Erigon as an alternative execution client — it's designed to reduce disk footprint through state compression and stateless sync. This approach was abandoned after discovering that the Polygon Erigon ecosystem had severe maintenance deficits: publicly available snapshots were several months out of date, meaning the node would require 1.5 months of continuous operation just to reach chain head.

We reverted to the standard Bor/Heimdall configuration and initialized using a 5.6 TB Stakecraft snapshot, downloaded and extracted via an `rclone` FUSE mount. The FUSE mount was selected out of necessity: streaming and extracting the archive on-the-fly bypasses local storage constraints, since the 8 TB SSD could not hold both the 5.6 TB compressed file and the extracted data concurrently. The FUSE layer also handles network retries, preventing transient connection drops from terminating the download.

### Discovering and patching a corrupted database

During initial latency profiling, we found a recurring ~7,000 ms latency spike exactly every 60 seconds. The subsequent three blocks were sequentially delayed by ~5,000 ms, ~3,000 ms, and ~1,000 ms as the node worked through the accumulated backlog before recovering.

Tracing this to Bor's **block freeze** operation: Bor periodically migrates historical blocks from the live PebbleDB to flat ancient files. The downloaded snapshot contained a corrupted block range starting at block **74,592,112** — blocks with headers and bodies but missing transaction receipts. When the freezer hit these blocks, it failed, triggered a database rollback, and held the database lock for ~7 seconds, entirely blocking the indexer pipeline on a 60-second cycle.

Rather than re-syncing from scratch, we wrote a custom **Go application** that:

1. Fetched the missing JSON receipts for the corrupted block range from a public RPC endpoint
2. Encoded them into Polygon's specific PebbleDB storage format
3. Injected the encoded bytes directly into the local database

Applying this patch to the corrupted block range allowed the freezer to process the historical data properly, permanently eliminating the latency spikes and stabilizing system performance.

<div class="fig">
  <img src="/images/arb/latencySpikesFreezer.png" alt="Latency spikes caused by the Bor block freezer bug" />
  <p class="fig-caption">Block produced→received latency before the database patch. The local node (blue) shows periodic ~7,000 ms spikes on a 60-second cycle as the freezer stalls on corrupted receipts; Alchemy (orange) remains flat. After the Go patch the spikes disappear entirely.</p>
</div>

---

## 2. AMM pool scraper

Before the Rust indexer can maintain real-time state, the system needs to know which pools exist and which are worth tracking. The Polygon network has hundreds of thousands of deployed AMM pools — the vast majority with zero liquidity or negligible trading volume. Tracking every pool would exhaust the indexer's memory and RPC bandwidth.

This is handled offline by a Python scraper using `web3.py` and a local SQLite database. Decoupling pool discovery from real-time indexing keeps the latency-critical Rust application free from historical blockchain queries.

### Phase 1: incremental pool discovery

The scraper queries the local Bor node for historical factory contract creation events — `PairCreated` for Uniswap V2, `PoolCreated` for Uniswap V3. Factory addresses and event signatures are stored in a `pool_types` database table rather than hardcoded, so adding support for a new DEX requires only inserting a new row.

On each run, the scraper resumes from the highest previously recorded block number. For every matched creation log, it extracts token addresses from the event topics and decodes the ABI data to find the deployed pool address — accounting for protocol-specific byte padding (12-byte offset for V2, 44-byte offset for V3). It then issues synchronous RPC calls to fetch the `symbol` and `decimals` for both underlying tokens, skipping and logging any malformed or non-compliant ERC-20 tokens. Pools are written using `INSERT OR IGNORE`, ensuring overlapping runs never corrupt existing records.

### Phase 2: activity scoring and prioritization

The scraper executes a secondary pass that queries all `Swap` events emitted across the entire network over a rolling **5-day lookback window** (calculated assuming a 2.1-second average block time). It tallies the swap count for every discovered pool and updates a `txns` column in the database.

Scoring on a rolling 5-day window rather than lifetime transaction count ensures the system prioritizes pools with *current* economic activity rather than historical dominance. When the Rust indexer boots, it executes an `ORDER BY txns DESC` query, loading only the most actively traded pools into memory and ignoring all pools with zero recent swaps.

---

## 3. Rust block indexer

The indexer is a custom Rust application responsible for tracking the real-time state of the chosen AMM pools. It subscribes to the local node's block stream and processes every new block within a hard 2-second budget — Polygon's approximate block interval.

### Startup and database loading

At startup, the indexer opens a WebSocket connection to the local Bor node's `eth_subscribe newHeads` endpoint. Once the stream is live, it queries the local SQLite database for the top N most active pools (joined with token metadata, sorted by `txns DESC`). Token descriptors are interned using `Arc<Token>` — if dozens of pools share a common token (WETH, USDC), they all point to a single heap allocation rather than duplicating the struct.

### Pool abstraction and data model

The core data structure is a `HashMap<Address, Box<dyn Pool>>` mapping each on-chain contract address to a heap-allocated trait object. The `Pool` trait defines a uniform interface across all AMM architectures:

- **`populate()`** — async method that performs the initial RPC calls to fetch current on-chain state
- **`handle_event()`** — synchronous mutator that accepts a raw `Log` and applies the specific reserve changes
- **`price()`** — getter that derives the current decimal-adjusted mid-price
- **`equal()`** — diagnostic method for state validation against a fresh on-chain fetch

Dynamic dispatch via trait objects means all pool types live in a single collection and update through the same `handle_event()` call — no `match` arms on pool type in the hot path.

<div class="fig">
  <img src="/images/arb/indexerDiagram.png" alt="Rust indexer module diagram" />
  <p class="fig-caption">Indexer module flow: <code>main.rs</code> awaits each block and calls <code>index_logs</code> on <code>indexer.rs</code>, which dispatches each log through <code>mod.rs</code> to the protocol-specific handler. Each handler updates its own state store — reserves for V2, sqrtP + liquidity for V3 and Algebra.</p>
</div>

### Protocol-specific state initialization

Each AMM protocol manages state differently, so `populate()` behaves differently per pool type:

**Uniswap V2** — calls `getReserves()` to retrieve the 112-bit reserve balances, converts them into native Rust `u128` integers. Fee is statically hardcoded to 0.3%.

**Uniswap V3 (concentrated liquidity)** — requires a more complex sequence. The indexer fetches the current `sqrtPriceX96` and `tick` from `slot0()`, the `fee()`, tick granularity from `tickSpacing()`, and the active `liquidity()`. It then computes the current 256-bit word index for the active tick and iterates over a compressed tick bitmap for ±10 words. For every initialized tick discovered in this window, it fetches the `liquidityNet` delta and stores it in a `HashMap<i32, i128>`.

**Algebra V3 / QuickSwap** — similar to Uniswap V3 but highly optimized. Uses a single `globalState()` call to fetch price, tick, and the current dynamic fee tier simultaneously. Fixed tick spacing of 1.

Pool initialization is fully serialized to respect RPC rate limits — startup time scales linearly with pool count.

### Main processing loop

For every new block header from the WebSocket stream, the indexer creates a block filter for that specific block number and issues a single `eth_getLogs` call — retrieving all swap/sync events emitted in that block across the entire network.

The system applies no address whitelist to this call. It retrieves all logs, iterates them in O(N), and performs an O(1) lookup against the `HashMap` to see if the emitting address is tracked. Unknown addresses are silently discarded. When a log matches a tracked pool, it's delegated to `handle_event()`:

- **V2 pools** — parse the `Sync` event, which directly overwrites both reserve balances (this fires on every swap, deposit, and withdrawal, making it a complete state update)
- **V3 pools** — parse `Swap` events to update the current tick and `sqrtPrice`; parse `Mint` and `Burn` events to update the `liquidity_net` delta at specific upper and lower tick boundaries
- **Algebra pools** — parse equivalent events, plus a unique `Fee` event that adjusts the pool's dynamic fee tier in real time

This approach is deliberately broad: fetching all logs in a single call is faster than filtering by address, and the O(1) HashMap dispatch makes the per-log cost negligible.

---

## 4. Latency benchmarking

The indexer includes a compile-time profiling framework behind a feature gate (`--features log_latency`). This ensures all timestamping and logging code is entirely excluded from the production binary unless explicitly enabled — zero overhead in production.

The profiling system captures five sequential timestamps per block using `SystemTime::now()`:

| Timestamp | Meaning |
|---|---|
| Block Produced | Extracted from the block header itself |
| Header Received | WebSocket subscription delivers the block header |
| Request Dispatched | `eth_getLogs` call issued |
| Logs Received | `eth_getLogs` response returned |
| State Updated | In-memory HashMap fully updated |

These produce four derived metrics: **block reception latency** (P2P propagation + local validation), **log fetch latency** (`eth_getLogs` round-trip), **state update latency** (Rust processing time), and **end-to-end latency** (block creation to actionable state).

By toggling a single compile-time flag, the WebSocket connection switches between the local Bor node and the Alchemy RPC endpoint. Because both expose identical JSON-RPC interfaces — `eth_subscribe` for headers, `eth_getLogs` for events — the indexer executes identical code paths against both. Any observed performance delta is attributable purely to infrastructure rather than code differences.

Block reception latency dropped substantially with the local node. The `eth_getLogs` round-trip showed similar improvement. State update latency — pure Rust computation — was identical between configurations, confirming the bottleneck was always the network layer.

<div class="fig fig-row">
  <div>
    <img src="/images/arb/block_reception_chart.png" alt="Block propagation latency: Local Node vs Alchemy RPC" />
    <p class="fig-caption">Block propagation latency. Local mean ~530 ms vs. Alchemy mean ~780 ms; P99 is comparable since both are subject to occasional network variance.</p>
  </div>
  <div>
    <img src="/images/arb/logs_latency_chart.png" alt="Event log fetch latency: Local Node vs Alchemy RPC" />
    <p class="fig-caption">Event log fetch latency. Local mean ~88 ms vs. Alchemy mean ~194 ms; local P99 (~165 ms) is less than half Alchemy's P99 (~570 ms).</p>
  </div>
</div>

---

## 5. Accuracy oracle

A fast indexer that silently misses events or applies them incorrectly is worse than a slow one: the detection engine evaluates routes against stale prices that no longer exist on-chain, generating phantom opportunities that revert on execution.

After processing all logs for a block, the indexer identifies which pools were touched by at least one relevant event. From this set, a random sample of up to `num_accuracy_samples` pools is selected. For each sampled pool, the indexer constructs a second, independent pool object by issuing fresh RPC calls directly to the blockchain (`slot0()`, `reserves()`, or `globalState()` depending on pool type). The two objects are compared field-by-field using the pool's `equal()` method. Any discrepancy increments the incorrect-state counter for that block.

**What each pool type checks:**

- **V2** — `reserve0`, `reserve1`, `fee`. An accuracy failure implies a dropped `Sync` event.
- **V3** — additionally checks `sqrt_p` (the `sqrtPriceX96` from `slot0()`), current `tick`, active `liquidity`, and the entire `liquidity_net` HashMap. `sqrt_p` catches swap-level drift; `liquidity_net` catches errors in `Mint` and `Burn` processing.
- **Algebra V3** — same logic as V3, substituting `globalState()` for `slot0()` and `tickTable()` for `tickBitmap()`.

This runs continuously in production as a live correctness signal, independent of the latency measurement path.

---

## 6. Arbitrage detection and execution

The detection algorithm searches the in-memory pool graph for profitable multi-hop cycles after every state update. The graph is a token-centric view: nodes are tokens, edges are pools. A profitable arbitrage is a cycle in this graph where traversing the edges in sequence yields more of the starting token than you put in.

<div class="fig">
  <img src="/images/arb/freezer.png" alt="Token graph showing arbitrage cycle routes" />
  <p class="fig-caption">Token graph across tracked Polygon pools. Hub tokens (USDC, WETH, USDT0, WPOL) connect to most pools and anchor the majority of detected arbitrage cycles. Peripheral tokens appear only on one or two edges.</p>
</div>

When a route is found, it constructs and submits an execution transaction.

The Solidity execution contracts enforce the profitability condition on-chain with `require(amountOut > amountIn, "Unprofitable")`. If market conditions change between route detection and block inclusion — because a competing transaction consumed the same opportunity — the contract reverts automatically. The caller loses only the gas cost of the failed call. Contracts are access-restricted to the team's wallet address to prevent front-running of the execution contract itself.

Transactions are submitted through the local node's `eth_sendRawTransaction` endpoint. Zero external RPC hops at the moment of submission.

---

## What's next

The dominant remaining bottleneck is propagation time between block finalization and transaction inclusion. The highest-impact improvements are:

- **Co-location** — moving the server into the same network segment as Polygon validator infrastructure to reduce P2P propagation delay
- **Mempool monitoring** — detecting opportunities in pending transactions before block finalization, effectively acting on state changes before they're confirmed
- **Broader pool coverage** — extending to concentrated liquidity pool types not currently tracked

<style>
.eq { font-family: var(--mono); font-size: 14px; background: var(--panel); border-left: 3px solid var(--accent); padding: 10px 16px; margin: 16px 0; border-radius: 4px; overflow-x: auto; }
.fig { margin: 28px 0; text-align: center; }
.fig img { max-width: 100%; border-radius: 8px; border: 1px solid var(--line); }
.fig-caption { font-size: 13px; color: var(--faint); margin-top: 8px; line-height: 1.5; }
.fig-row { display: flex; gap: 20px; align-items: flex-start; }
.fig-row > div { flex: 1; }
@media (max-width: 560px) { .fig-row { flex-direction: column; } }
</style>
