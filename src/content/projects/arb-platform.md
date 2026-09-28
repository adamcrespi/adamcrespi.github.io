---
title: "Indexing Blockchain Data for Arbitrage"
year: 2026
spec: "Polygon PoS · Rust · self-hosted node · atomic execution"
summary: "Self-hosted Polygon node and Rust block indexer that replaced a third-party RPC dependency, enabling real-time arbitrage detection across DEX liquidity pools on mainnet."
cover: "/images/arb/freezer.png"
order: 1
---

**2600 Blockchain** is a self-sponsored team — Lucas Berretta, Cian Geldenhuys, and I — running an automated arbitrage system on the Polygon proof-of-stake network, built and benchmarked as our UBC Engineering Physics Project Lab (ENPH 459) capstone. The system detects when the same token is mispriced across two or more DEX liquidity pools and captures the spread with a single atomic transaction — one that reverts automatically if the trade is unprofitable by the time it lands. The team had an existing version of this system deployed on Berachain mainnet generating real revenue before this project began.

The prior system sourced all blockchain data from a commercial RPC provider. This was the dominant latency bottleneck: every block notification arrived through at least one extra network hop, and under high load, shared provider infrastructure introduced variable queuing delays that no software optimization could fix. This project replaced that dependency entirely with a self-hosted Polygon full node and a custom Rust block indexer, then measured the result against the provider baseline on live mainnet traffic — no simulated or testnet data.

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

where `Rᵢⁱⁿ` and `Rᵢᵒᵘᵗ` are the reserves of the input and output tokens for pool `i`, and `Δᵢ` is the trade size at each hop. The indexer's role is solely to keep reserve values current so this calculation reflects actual market state — Section 6 covers how the live system actually searches for the optimal `Δᵢ` across an arbitrary number of markets at once, not just a fixed 3-hop cycle.

### Why third-party RPC is a structural problem

Most participants access blockchain data through commercial providers such as Alchemy or Infura, which expose a standard JSON-RPC interface from their own servers. This introduces at minimum one additional network hop between the blockchain and the client. Under high network load, shared provider infrastructure adds variable queuing delay on top of that baseline. For an arbitrage system where competitive advantage is measured in milliseconds, these are structural disadvantages that software optimization cannot overcome.

---

## System architecture

Five components form an integrated pipeline from the Polygon peer-to-peer network to on-chain execution, closing in a loop: the execution contracts submit back through the same local node that fed the pipeline in the first place, so the round trip never leaves infrastructure the team controls.

<div class="fig">
  <svg viewBox="0 0 1080 300" class="diagram-sys" role="img" aria-label="System architecture diagram: Polygon validators feed a local Bor and Heimdall node, which streams blocks to a Rust indexer maintaining pool state in memory, seeded at boot by an offline SQLite pool database. A detection engine reads that state and hands profitable routes to execution contracts, which submit signed transactions back through the same local node, closing the loop with zero external RPC hops.">
    <defs>
      <marker id="arr-sys" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
      </marker>
    </defs>
    <rect x="440" y="15" width="190" height="50" rx="6" class="box-mid"/>
    <text x="535" y="34" class="lbl-mid"><tspan x="535" dy="0">SQLite pool DB</tspan><tspan x="535" dy="14">offline scraper</tspan></text>
    <line x1="535" y1="65" x2="535" y2="98" class="edge" marker-end="url(#arr-sys)"/>
    <text x="645" y="80" class="lbl-edge" text-anchor="start"><tspan x="645" dy="0">top-N active</tspan><tspan x="645" dy="13">pools at boot</tspan></text>
    <rect x="20" y="100" width="150" height="60" rx="6" class="box-main"/>
    <text x="95" y="134" class="lbl-main">Polygon validators</text>
    <rect x="240" y="100" width="150" height="60" rx="6" class="box-main"/>
    <text x="315" y="127" class="lbl-main"><tspan x="315" dy="0">Bor + Heimdall</tspan><tspan x="315" dy="16">local full node</tspan></text>
    <rect x="460" y="100" width="150" height="60" rx="6" class="box-accent"/>
    <text x="535" y="127" class="lbl-accent"><tspan x="535" dy="0">Rust indexer</tspan><tspan x="535" dy="16">pool HashMap</tspan></text>
    <rect x="680" y="100" width="150" height="60" rx="6" class="box-main"/>
    <text x="755" y="127" class="lbl-main"><tspan x="755" dy="0">Detection engine</tspan><tspan x="755" dy="16">convex optimizer</tspan></text>
    <rect x="900" y="100" width="150" height="60" rx="6" class="box-accent"/>
    <text x="975" y="127" class="lbl-accent"><tspan x="975" dy="0">Execution</tspan><tspan x="975" dy="16">contracts</tspan></text>
    <line x1="170" y1="130" x2="236" y2="130" class="edge" marker-end="url(#arr-sys)"/>
    <text x="203" y="122" class="lbl-edge" text-anchor="middle">P2P blocks</text>
    <line x1="390" y1="130" x2="456" y2="130" class="edge" marker-end="url(#arr-sys)"/>
    <text x="423" y="122" class="lbl-edge" text-anchor="middle">logs</text>
    <line x1="610" y1="130" x2="676" y2="130" class="edge" marker-end="url(#arr-sys)"/>
    <text x="643" y="122" class="lbl-edge" text-anchor="middle">pool state</text>
    <line x1="830" y1="130" x2="896" y2="130" class="edge" marker-end="url(#arr-sys)"/>
    <text x="863" y="122" class="lbl-edge" text-anchor="middle">route</text>
    <path d="M975,160 C975,236 315,236 315,160" class="edge-loop" marker-end="url(#arr-sys)" fill="none"/>
    <text x="645" y="260" class="lbl-loop" text-anchor="middle"><tspan x="645" dy="0">eth_sendRawTransaction — signed tx returns through the same local node</tspan><tspan x="645" dy="15">zero external RPC hop at the moment of submission</tspan></text>
  </svg>
  <p class="fig-caption">System-level architecture. Blocks arrive from Polygon's P2P network at the local node; the Rust indexer turns them into live pool state; the detection engine and execution contracts close the loop back through that same node.</p>
</div>

---

## 1. Polygon full node

Deploying a local full node structurally changes how the system receives data. By participating directly in Polygon's peer-to-peer network, the local Bor client receives new blocks straight from network validators — eliminating the intermediary network hop and delivering block data within milliseconds of creation.

### Hardware

The node runs on a dedicated Ubuntu server:

- **64 GB DDR4 RAM** — provides headroom for Bor's PebbleDB state cache, which directly minimizes the latency of RPC calls served to the indexer
- **8 TB NVMe SSD** — storage I/O throughput is the binding constraint during initial chain synchronization and ongoing node operation; high-speed NVMe is strictly necessary

Total infrastructure cost came in at roughly **CAD $2,850** — an 8 TB NVMe SSD, an HDD enclosure, and networking gear funded by the team, plus RAM and a returned evaluation SSD funded through the UBC ENPH equipment budget.

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

### Protocol-specific state initialization

Each AMM protocol manages state differently, so `populate()` behaves differently per pool type:

**Uniswap V2** — calls `getReserves()` to retrieve the 112-bit reserve balances, converts them into native Rust `u128` integers. Fee is statically hardcoded to 0.3%.

**Uniswap V3 (concentrated liquidity)** — requires a more complex sequence. The indexer fetches the current `sqrtPriceX96` and `tick` from `slot0()`, the `fee()`, tick granularity from `tickSpacing()`, and the active `liquidity()`. It then computes the current 256-bit word index for the active tick and iterates over a compressed tick bitmap for ±10 words. For every initialized tick discovered in this window, it fetches the `liquidityNet` delta and stores it in a `HashMap<i32, i128>`.

**Algebra V3 / QuickSwap** — similar to Uniswap V3 but highly optimized. Uses a single `globalState()` call to fetch price, tick, and the current dynamic fee tier simultaneously. Fixed tick spacing of 1.

Pool initialization is fully serialized to respect RPC rate limits — startup time scales linearly with pool count.

### Main processing loop

For every new block header from the WebSocket stream, the indexer creates a block filter for that specific block number and issues a single `eth_getLogs` call — retrieving all swap/sync events emitted in that block across the entire network. The system applies **no address whitelist** to this call: it retrieves all logs, iterates them in `O(N)`, and performs an `O(1)` lookup against the `HashMap` to see if the emitting address is tracked. Unknown addresses are silently discarded. Filtering in memory this way is faster than filtering the RPC call itself, and the `O(1)` dispatch makes the per-log cost negligible even with the wider unfiltered sweep.

<div class="fig">
  <svg viewBox="0 0 920 380" class="diagram-idx" role="img" aria-label="Indexer internals: main.rs awaits each block and calls index_logs on indexer.rs, which updates the address-keyed pool HashMap and dispatches each matching log through mod.rs to a protocol-specific handler — uniswap_v2.rs, uniswap_v3.rs, or quickswap_v3.rs — each of which writes into its own state store.">
    <defs>
      <marker id="arr-idx" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
      </marker>
    </defs>
    <rect x="20" y="165" width="130" height="56" rx="6" class="box-main"/>
    <text x="85" y="190" class="lbl-main"><tspan x="85" dy="0">main.rs</tspan><tspan x="85" dy="15">await block</tspan></text>
    <rect x="190" y="165" width="130" height="56" rx="6" class="box-accent"/>
    <text x="255" y="190" class="lbl-accent"><tspan x="255" dy="0">indexer.rs</tspan><tspan x="255" dy="15">index_logs()</tspan></text>
    <rect x="170" y="262" width="170" height="50" rx="6" class="box-mid"/>
    <text x="255" y="282" class="lbl-mid"><tspan x="255" dy="0">index</tspan><tspan x="255" dy="14">HashMap&lt;Addr, Pool&gt;</tspan></text>
    <rect x="360" y="165" width="110" height="56" rx="6" class="box-main"/>
    <text x="415" y="190" class="lbl-main"><tspan x="415" dy="0">mod.rs</tspan><tspan x="415" dy="15">handle_log()</tspan></text>
    <rect x="530" y="35" width="170" height="50" rx="6" class="box-main"/>
    <text x="615" y="55" class="lbl-main"><tspan x="615" dy="0">uniswap_v2.rs</tspan><tspan x="615" dy="14">Sync → reserves</tspan></text>
    <rect x="530" y="168" width="170" height="50" rx="6" class="box-main"/>
    <text x="615" y="188" class="lbl-main"><tspan x="615" dy="0">uniswap_v3.rs</tspan><tspan x="615" dy="14">Swap / Mint / Burn</tspan></text>
    <rect x="530" y="300" width="170" height="50" rx="6" class="box-main"/>
    <text x="615" y="320" class="lbl-main"><tspan x="615" dy="0">quickswap_v3.rs</tspan><tspan x="615" dy="14">+ Fee event</tspan></text>
    <rect x="750" y="35" width="150" height="50" rx="6" class="box-mid"/>
    <text x="825" y="60" class="lbl-mid">reserve0, reserve1</text>
    <rect x="750" y="168" width="150" height="50" rx="6" class="box-mid"/>
    <text x="825" y="188" class="lbl-mid"><tspan x="825" dy="0">tick, √P,</tspan><tspan x="825" dy="14">liquidity_net</tspan></text>
    <rect x="750" y="300" width="150" height="50" rx="6" class="box-mid"/>
    <text x="825" y="320" class="lbl-mid"><tspan x="825" dy="0">tick, √P,</tspan><tspan x="825" dy="14">dynamic fee</tspan></text>
    <line x1="150" y1="193" x2="188" y2="193" class="edge" marker-end="url(#arr-idx)"/>
    <line x1="255" y1="221" x2="255" y2="260" class="edge" marker-end="url(#arr-idx)"/>
    <line x1="320" y1="193" x2="358" y2="193" class="edge" marker-end="url(#arr-idx)"/>
    <text x="339" y="185" class="lbl-edge" text-anchor="middle">handle_log</text>
    <line x1="470" y1="180" x2="528" y2="65" class="edge" marker-end="url(#arr-idx)"/>
    <line x1="470" y1="193" x2="528" y2="193" class="edge" marker-end="url(#arr-idx)"/>
    <line x1="470" y1="206" x2="528" y2="315" class="edge" marker-end="url(#arr-idx)"/>
    <line x1="700" y1="60" x2="748" y2="60" class="edge" marker-end="url(#arr-idx)"/>
    <line x1="700" y1="193" x2="748" y2="193" class="edge" marker-end="url(#arr-idx)"/>
    <line x1="700" y1="325" x2="748" y2="325" class="edge" marker-end="url(#arr-idx)"/>
  </svg>
  <p class="fig-caption">Indexer module flow: <code>main.rs</code> awaits each block and calls <code>index_logs</code> on <code>indexer.rs</code>, which updates the pool index and dispatches each matching log through <code>mod.rs</code> to its protocol-specific handler. Each handler owns its own state store — reserves for V2, sqrtP + liquidity for V3 and Algebra.</p>
</div>

---

## 4. Latency benchmarking

The indexer includes a compile-time profiling framework behind a feature gate (`--features log_latency`). This ensures all timestamping and logging code is entirely excluded from the production binary unless explicitly enabled — zero overhead in production.

The profiling system captures five sequential timestamps per block using `SystemTime::now()`: **block produced** (from the header), **header received**, **request dispatched**, **logs received**, and **state updated**. These produce four derived metrics — block reception latency, log fetch latency, state update latency, and end-to-end latency.

By toggling a single compile-time flag, the WebSocket connection switches between the local Bor node and the Alchemy RPC endpoint. Because both expose identical JSON-RPC interfaces — `eth_subscribe` for headers, `eth_getLogs` for events — the indexer executes identical code against both, so any measured delta is attributable purely to infrastructure. The benchmark ran continuously for **730 blocks (~25 minutes)** against both endpoints.

<div class="fig fig-row">
  <div>
    <img src="/images/arb/block_reception_chart.png" alt="Block propagation latency: Local Node vs Alchemy RPC" />
    <p class="fig-caption">Block reception latency: median 413 ms local vs. 674 ms Alchemy (1.6× faster). At P99, both converge to ~1,490–1,590 ms — tail latency here is governed by Polygon's own P2P propagation variance, not infrastructure choice.</p>
  </div>
  <div>
    <img src="/images/arb/logs_latency_chart.png" alt="Event log fetch latency: Local Node vs Alchemy RPC" />
    <p class="fig-caption"><code>eth_getLogs</code> latency: median 83 ms local vs. 166 ms Alchemy (2.0×), widening to 161 ms vs. 573 ms at P99 (3.6×). Standard deviation: 29 ms local vs. 96 ms Alchemy — the local node is both faster and far more consistent.</p>
  </div>
</div>

State update latency — pure Rust log decoding and in-memory HashMap mutation — held at a median of 1 ms (P99: 2 ms) regardless of endpoint, confirming the entire gain comes from the network layer and that indexer processing itself is not a meaningful fraction of the 2-second block budget.

### Results: end-to-end pipeline

<table class="data-table">
  <thead><tr><th>Setup</th><th>Mean</th><th>Median</th><th>P95</th><th>P99</th></tr></thead>
  <tbody>
    <tr><td>Local node</td><td>610 ms</td><td>496 ms</td><td>1,487 ms</td><td>1,754 ms</td></tr>
    <tr><td>Alchemy RPC</td><td>975 ms</td><td>840 ms</td><td>1,820 ms</td><td>2,056 ms</td></tr>
    <tr class="savings"><td>Savings</td><td>365 ms</td><td>344 ms</td><td>333 ms</td><td>302 ms</td></tr>
  </tbody>
</table>

From block production to a completed in-memory state update, the local stack achieves a median of 496 ms against 840 ms for Alchemy — a 1.7× improvement and a 344 ms head start on every block over any competing system still reading through a third-party provider. Runs were conducted sequentially rather than concurrently, so the two setups saw slightly different blocks and network conditions; the 730-block sample size and the absence of any observed anomalous network events over that window keep this confound small.

---

## 5. Accuracy oracle

A fast indexer that silently misses events or applies them incorrectly is worse than a slow one: the detection engine evaluates routes against stale prices that no longer exist on-chain, generating phantom opportunities that revert on execution.

After processing all logs for a block, the indexer identifies which pools were touched by at least one relevant event. From this set, a random sample of up to `num_accuracy_samples` pools is selected. For each sampled pool, the indexer constructs a second, independent pool object by issuing fresh RPC calls directly to the blockchain (`slot0()`, `reserves()`, or `globalState()` depending on pool type), and compares the two field-by-field using the pool's `equal()` method. Any discrepancy increments the incorrect-state counter for that block. This runs continuously in production as a live correctness signal, independent of the latency measurement path.

**What each pool type checks:**

- **V2** — `reserve0`, `reserve1`, `fee`. A failure implies a dropped `Sync` event.
- **V3** — additionally checks `sqrt_p` (from `slot0()`), current `tick`, active `liquidity`, and the entire `liquidity_net` HashMap. `sqrt_p` catches swap-level drift; `liquidity_net` catches errors in `Mint`/`Burn` processing.
- **Algebra V3** — same logic as V3, substituting `globalState()` for `slot0()` and `tickTable()` for `tickBitmap()`.

### Results

Accuracy was benchmarked over a separate **450-block window** (~15 minutes), with `num_accuracy_samples` set to 50 so that every pool touched in a block gets checked. The indexer held a **mean accuracy above 99% per block**, at 100% for the large majority of blocks, with failures appearing as isolated spikes rather than sustained drift. The single worst block, 85105385, saw 14 of 19 sampled pools fail (26% accuracy) — outside that one event, no block fell below 60%.

Cross-referencing the failure log against the accuracy data attributed every failure in the window to five specific pools:

<div class="failure-table">
  <div class="failure-row"><span class="fp-addr">0x50eaEDB8…</span><span class="fp-proto">Uniswap v3</span><div class="fp-bar-wrap"><div class="fp-bar" style="width:100%"></div></div><span class="fp-count">15</span></div>
  <div class="failure-row"><span class="fp-addr">0x882df4B0…</span><span class="fp-proto">Uniswap v2</span><div class="fp-bar-wrap"><div class="fp-bar" style="width:27%"></div></div><span class="fp-count">4</span></div>
  <div class="failure-row"><span class="fp-addr">0x296b95DD…</span><span class="fp-proto">Uniswap v3</span><div class="fp-bar-wrap"><div class="fp-bar" style="width:20%"></div></div><span class="fp-count">3</span></div>
  <div class="failure-row"><span class="fp-addr">0xD36ec33c…</span><span class="fp-proto">Uniswap v3</span><div class="fp-bar-wrap"><div class="fp-bar" style="width:7%"></div></div><span class="fp-count">1</span></div>
  <div class="failure-row"><span class="fp-addr">0x9B08288C…</span><span class="fp-proto">Uniswap v3</span><div class="fp-bar-wrap"><div class="fp-bar" style="width:7%"></div></div><span class="fp-count">1</span></div>
</div>

Four of the five failing pools are Uniswap V3, with failures concentrated around `Mint`, `Burn`, and `Collect` events — consistent with the theory that these specific contracts were modified by their deployers to skim reserves, which by construction the indexer can't model since it assumes the unmodified reference implementation. These pools should be filtered out rather than chased with more decoding logic.

One systematic quirk worth noting: after a missed event, subsequent blocks continue to register non-zero misses on the same pool even though no further event was actually dropped — the in-memory state simply stays wrong until the next real event overwrites it. That's a real correctness bug rather than a benchmarking artifact, and closing it (re-fetching the pool immediately on a detected mismatch, instead of waiting for the next event) is a clear next step toward the 100% target.

---

## 6. Arbitrage detection and execution

The detection algorithm searches the in-memory pool graph for profitable multi-hop cycles after every state update. The graph is a token-centric view: nodes are tokens, edges are pools. A profitable arbitrage is a cycle in this graph where traversing the edges in sequence yields more of the starting token than you put in.

<div class="fig">
  <svg viewBox="-20 -20 680 660" class="diagram-graph" role="img" aria-label="Token graph across tracked Polygon pools: four hub tokens, USDC, WETH, USDT0, and WPOL, sit at the center and connect to each other and to eight mid-tier tokens, which in turn connect out to twelve peripheral, low-liquidity tokens.">
    <line x1="320.0" y1="230.0" x2="250.0" y2="300.0" class="e-hub"/>
    <line x1="320.0" y1="230.0" x2="390.0" y2="300.0" class="e-hub"/>
    <line x1="320.0" y1="370.0" x2="250.0" y2="300.0" class="e-hub"/>
    <line x1="320.0" y1="370.0" x2="390.0" y2="300.0" class="e-hub"/>
    <line x1="250.0" y1="300.0" x2="158.3" y2="233.0" class="e-mid"/>
    <line x1="320.0" y1="230.0" x2="253.0" y2="138.3" class="e-mid"/>
    <line x1="320.0" y1="230.0" x2="387.0" y2="138.3" class="e-mid"/>
    <line x1="390.0" y1="300.0" x2="481.7" y2="233.0" class="e-mid"/>
    <line x1="390.0" y1="300.0" x2="481.7" y2="367.0" class="e-mid"/>
    <line x1="320.0" y1="370.0" x2="387.0" y2="461.7" class="e-mid"/>
    <line x1="320.0" y1="370.0" x2="253.0" y2="461.7" class="e-mid"/>
    <line x1="250.0" y1="300.0" x2="158.3" y2="367.0" class="e-mid"/>
    <line x1="158.3" y1="233.0" x2="58.0" y2="300.0" class="e-outer"/>
    <line x1="158.3" y1="233.0" x2="93.1" y2="169.0" class="e-outer"/>
    <line x1="253.0" y1="138.3" x2="189.0" y2="73.1" class="e-outer"/>
    <line x1="253.0" y1="138.3" x2="320.0" y2="38.0" class="e-outer"/>
    <line x1="387.0" y1="138.3" x2="451.0" y2="73.1" class="e-outer"/>
    <line x1="481.7" y1="233.0" x2="546.9" y2="169.0" class="e-outer"/>
    <line x1="481.7" y1="233.0" x2="582.0" y2="300.0" class="e-outer"/>
    <line x1="481.7" y1="367.0" x2="546.9" y2="431.0" class="e-outer"/>
    <line x1="387.0" y1="461.7" x2="451.0" y2="526.9" class="e-outer"/>
    <line x1="387.0" y1="461.7" x2="320.0" y2="562.0" class="e-outer"/>
    <line x1="253.0" y1="461.7" x2="189.0" y2="526.9" class="e-outer"/>
    <line x1="158.3" y1="367.0" x2="93.1" y2="431.0" class="e-outer"/>
    <circle cx="320.0" cy="230.0" r="27" class="n-hub"/>
    <text x="320.0" y="234.0" class="t-hub">WPOL</text>
    <circle cx="390.0" cy="300.0" r="27" class="n-hub"/>
    <text x="390.0" y="304.0" class="t-hub">WETH</text>
    <circle cx="320.0" cy="370.0" r="27" class="n-hub"/>
    <text x="320.0" y="374.0" class="t-hub">USDT0</text>
    <circle cx="250.0" cy="300.0" r="27" class="n-hub"/>
    <text x="250.0" y="304.0" class="t-hub">USDC</text>
    <circle cx="158.3" cy="233.0" r="19" class="n-mid"/>
    <text x="158.3" y="237.0" class="t-mid">SAND</text>
    <circle cx="253.0" cy="138.3" r="19" class="n-mid"/>
    <text x="253.0" y="142.3" class="t-mid">WBTC</text>
    <circle cx="387.0" cy="138.3" r="19" class="n-mid"/>
    <text x="387.0" y="142.3" class="t-mid">DAI</text>
    <circle cx="481.7" cy="233.0" r="19" class="n-mid"/>
    <text x="481.7" y="237.0" class="t-mid">AAVE</text>
    <circle cx="481.7" cy="367.0" r="19" class="n-mid"/>
    <text x="481.7" y="371.0" class="t-mid">LINK</text>
    <circle cx="387.0" cy="461.7" r="19" class="n-mid"/>
    <text x="387.0" y="465.7" class="t-mid">MATIC</text>
    <circle cx="253.0" cy="461.7" r="19" class="n-mid"/>
    <text x="253.0" y="465.7" class="t-mid">GHST</text>
    <circle cx="158.3" cy="367.0" r="19" class="n-mid"/>
    <text x="158.3" y="371.0" class="t-mid">QUICK</text>
    <circle cx="58.0" cy="300.0" r="4" class="n-outer"/>
    <text x="42.0" y="303.0" text-anchor="end" class="t-outer">IDL</text>
    <circle cx="93.1" cy="169.0" r="4" class="n-outer"/>
    <text x="79.2" y="164.0" text-anchor="end" class="t-outer">sLGNS</text>
    <circle cx="189.0" cy="73.1" r="4" class="n-outer"/>
    <text x="181.0" y="62.2" text-anchor="end" class="t-outer">AIPF</text>
    <circle cx="320.0" cy="38.0" r="4" class="n-outer"/>
    <text x="320.0" y="25.0" text-anchor="middle" class="t-outer">LGNS</text>
    <circle cx="451.0" cy="73.1" r="4" class="n-outer"/>
    <text x="459.0" y="62.2" text-anchor="start" class="t-outer">CES</text>
    <circle cx="546.9" cy="169.0" r="4" class="n-outer"/>
    <text x="560.8" y="164.0" text-anchor="start" class="t-outer">STTP</text>
    <circle cx="582.0" cy="300.0" r="4" class="n-outer"/>
    <text x="598.0" y="303.0" text-anchor="start" class="t-outer">SUT</text>
    <circle cx="546.9" cy="431.0" r="4" class="n-outer"/>
    <text x="560.8" y="442.0" text-anchor="start" class="t-outer">MAPU</text>
    <circle cx="451.0" cy="526.9" r="4" class="n-outer"/>
    <text x="459.0" y="543.8" text-anchor="start" class="t-outer">PIX</text>
    <circle cx="320.0" cy="562.0" r="4" class="n-outer"/>
    <text x="320.0" y="581.0" text-anchor="middle" class="t-outer">AS</text>
    <circle cx="189.0" cy="526.9" r="4" class="n-outer"/>
    <text x="181.0" y="543.8" text-anchor="end" class="t-outer">NLC</text>
    <circle cx="93.1" cy="431.0" r="4" class="n-outer"/>
    <text x="79.2" y="442.0" text-anchor="end" class="t-outer">USDL</text>
  </svg>
  <p class="fig-caption">Token graph across tracked Polygon pools. Hub tokens (USDC, WETH, USDT0, WPOL) connect to most pools and anchor the majority of detected arbitrage cycles; peripheral tokens sit one or two edges out, contributing far fewer routes.</p>
</div>

### Optimal route sizing

Because every market's output is a deterministic function of its reserves and fee, the full set of markets can be modelled as a set of trades each one will accept. Summing the acceptable trades across every tracked market gives a single optimization problem: find the net trade `ψ` across all markets that maximizes utility

<p class="eq">U(ψ) = cᵀψ − I(ψ ≥ 0)</p>

where `I` is an indicator that is `∞` if any token is net tendered to the market and `0` otherwise, and the coefficients `c` are proportional to the value of each token the algorithm already holds (zero for tokens it doesn't). This makes the utility `−∞` for any trade that requires capital the system doesn't have, and linear in tokens received otherwise — so the resulting optimal `ψ` always decodes into a cycle that starts and ends on a token the algorithm holds. This is a convex optimization problem, solved efficiently with the **LBFGS-B** optimizer rather than an exhaustive search over cycles, which is what lets the detection engine scale past simple fixed-length loops to the full pool graph on every block.

### Execution contract architecture

<div class="fig">
  <svg viewBox="0 0 780 460" class="diagram-exec" role="img" aria-label="Execution contract call chain: the operator wallet calls the access-controlled ExecutorRouter, which delegates each hop to a ConstantProductExecutor, ClammExecutor, or AlgebraExecutor, which in turn calls the matching on-chain DEX router against a constant-product, CLAMM, or Algebra pool. All hops execute atomically in one transaction.">
    <defs>
      <marker id="arr-exec" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
      </marker>
    </defs>
    <rect x="290" y="10" width="200" height="50" rx="6" class="box-main"/>
    <text x="390" y="40" class="lbl-main">Operator wallet (EOA)</text>
    <line x1="390" y1="60" x2="390" y2="98" class="edge" marker-end="url(#arr-exec)"/>
    <rect x="270" y="100" width="240" height="60" rx="6" class="box-accent"/>
    <text x="390" y="127" class="lbl-accent"><tspan x="390" dy="0">ExecutorRouter</tspan><tspan x="390" dy="16">access-controlled entry point</tspan></text>
    <line x1="390" y1="160" x2="120" y2="208" class="edge" marker-end="url(#arr-exec)"/>
    <line x1="390" y1="160" x2="390" y2="208" class="edge" marker-end="url(#arr-exec)"/>
    <line x1="390" y1="160" x2="660" y2="208" class="edge" marker-end="url(#arr-exec)"/>
    <rect x="20" y="210" width="200" height="50" rx="6" class="box-main"/>
    <text x="120" y="230" class="lbl-main"><tspan x="120" dy="0">ConstantProduct</tspan><tspan x="120" dy="14">Executor</tspan></text>
    <rect x="290" y="210" width="200" height="50" rx="6" class="box-main"/>
    <text x="390" y="240" class="lbl-main">ClammExecutor</text>
    <rect x="560" y="210" width="200" height="50" rx="6" class="box-main"/>
    <text x="660" y="240" class="lbl-main">AlgebraExecutor</text>
    <line x1="120" y1="260" x2="120" y2="298" class="edge" marker-end="url(#arr-exec)"/>
    <line x1="390" y1="260" x2="390" y2="298" class="edge" marker-end="url(#arr-exec)"/>
    <line x1="660" y1="260" x2="660" y2="298" class="edge" marker-end="url(#arr-exec)"/>
    <rect x="20" y="300" width="200" height="50" rx="6" class="box-mid"/>
    <text x="120" y="320" class="lbl-mid"><tspan x="120" dy="0">Uniswap v2</tspan><tspan x="120" dy="14">Router</tspan></text>
    <rect x="290" y="300" width="200" height="50" rx="6" class="box-mid"/>
    <text x="390" y="320" class="lbl-mid"><tspan x="390" dy="0">Uniswap v3</tspan><tspan x="390" dy="14">SwapRouter</tspan></text>
    <rect x="560" y="300" width="200" height="50" rx="6" class="box-mid"/>
    <text x="660" y="320" class="lbl-mid"><tspan x="660" dy="0">Algebra</tspan><tspan x="660" dy="14">SwapRouter</tspan></text>
    <line x1="120" y1="350" x2="120" y2="378" class="edge"/>
    <line x1="390" y1="350" x2="390" y2="378" class="edge"/>
    <line x1="660" y1="350" x2="660" y2="378" class="edge"/>
    <text x="120" y="395" class="lbl-pool" text-anchor="middle">x · y = k pool</text>
    <text x="390" y="395" class="lbl-pool" text-anchor="middle">CLAMM pool</text>
    <text x="660" y="395" class="lbl-pool" text-anchor="middle">Algebra pool</text>
    <text x="390" y="430" class="lbl-note" text-anchor="middle">single atomic transaction — any hop reverting rolls back the entire route</text>
    <text x="390" y="448" class="lbl-code" text-anchor="middle">require(amountOut &gt; amountIn, "Unprofitable")</text>
  </svg>
  <p class="fig-caption">Execution contract call chain on Polygon PoS. The <code>ExecutorRouter</code> receives an encoded multi-hop route and delegates each hop to the matching executor, which calls the corresponding on-chain DEX router. All hops compose atomically within a single transaction.</p>
</div>

Execution contracts were deployed to Polygon PoS mainnet (chain ID 137) using a Foundry `DeployAll` script. Each specialized executor conforms to a shared `IExecutor`-style interface so the router can compose heterogeneous pool types within one atomic route: a single transaction can, for instance, buy on a Uniswap V2 pool and sell on a QuickSwap Algebra pool. The transaction enforces its own profitability on-chain, at the contract level, independent of anything the off-chain detection engine believed to be true:

<p class="eq eq-code">require(amountOut &gt; amountIn, "Unprofitable");</p>

If market conditions change between route detection and block inclusion — because a competing transaction consumed the same opportunity first — the contract reverts and the caller loses only the gas cost of the failed call. Contracts are access-restricted to the team's operator wallet to prevent front-running of the execution contract itself. Transactions are submitted through the local node's `eth_sendRawTransaction` endpoint, so there are zero external RPC hops at the moment of submission — the same advantage the rest of the pipeline was built around.

---

## What's next

The results confirm self-hosting the data path produces a measurable, stacking advantage — lower latency, more consistent latency, and a state model the team can actually audit for correctness. The next highest-leverage work, in priority order:

1. **Mempool monitoring.** Large pending swaps are visible before block inclusion. Watching them would let the system anticipate the resulting pool-state change and have a transaction ready the moment the triggering swap confirms — event-driven back-running instead of block-level scanning. This was the stretch goal for this phase and remains the single most impactful unexplored latency lever.
2. **Co-locate with the validator network.** Moving the server into a data center with a low-latency path to Polygon block producers removes the one remaining bottleneck no software change can touch: P2P propagation time. Standard practice among professional MEV searchers, and the highest-priority infrastructure investment for the next phase.
3. **Separate the indexer and detection engine onto dedicated hardware.** They currently share CPU on one machine; under high block activity, compute contention can delay state updates. Splitting them across a low-latency IPC channel would let each be tuned independently.
4. **Optimize execution contract gas consumption.** The contracts have not been gas-optimized beyond correctness. Lower gas improves profitability on marginal opportunities and can improve transaction ordering priority in blocks where producers order by effective gas price.

<style>
.eq { font-family: var(--mono); font-size: 14px; background: var(--panel); border-left: 3px solid var(--accent); padding: 10px 16px; margin: 16px 0; border-radius: 4px; overflow-x: auto; }
.eq-code { font-size: 13px; }
.fig { margin: 28px 0; text-align: center; }
.fig img { max-width: 100%; border-radius: 8px; border: 1px solid var(--line); }
.fig-caption { font-size: 13px; color: var(--faint); margin-top: 8px; line-height: 1.5; text-align: left; }
.fig-row { display: flex; gap: 20px; align-items: flex-start; }
.fig-row > div { flex: 1; }
@media (max-width: 560px) { .fig-row { flex-direction: column; } }

svg.diagram-sys, svg.diagram-idx, svg.diagram-exec, svg.diagram-graph {
  width: 100%; height: auto; max-width: 100%; margin: 4px 0;
}
.box-main { fill: var(--bg); stroke: var(--ink); stroke-width: 1.3; }
.box-mid { fill: var(--panel); stroke: var(--soft); stroke-width: 1; }
.box-accent { fill: var(--accent); stroke: var(--accent); }
.lbl-main { font-family: var(--mono); font-size: 12px; fill: var(--ink); text-anchor: middle; }
.lbl-mid { font-family: var(--mono); font-size: 11px; fill: var(--soft); text-anchor: middle; }
.lbl-accent { font-family: var(--mono); font-size: 12px; fill: #fff; text-anchor: middle; }
.lbl-pool { font-family: var(--mono); font-size: 11px; fill: var(--soft); }
.lbl-note { font-family: var(--sans); font-size: 12px; fill: var(--ink); }
.lbl-code { font-family: var(--mono); font-size: 11px; fill: var(--soft); }
.edge { stroke: var(--faint); stroke-width: 1.2; }
.edge-loop { stroke: var(--faint); stroke-width: 1.2; stroke-dasharray: 3 3; }
.lbl-edge { font-family: var(--mono); font-size: 10px; fill: var(--faint); }
.lbl-loop { font-family: var(--mono); font-size: 10px; fill: var(--faint); }

.e-hub { stroke: var(--accent); stroke-width: 1.6; }
.e-mid { stroke: var(--line); stroke-width: 1.2; }
.e-outer { stroke: var(--line); stroke-width: 1; }
.n-hub { fill: var(--accent); }
.t-hub { fill: #fff; font-family: var(--mono); font-size: 12px; font-weight: 500; text-anchor: middle; }
.n-mid { fill: var(--bg); stroke: var(--ink); stroke-width: 1.3; }
.t-mid { fill: var(--ink); font-family: var(--mono); font-size: 10.5px; text-anchor: middle; }
.n-outer { fill: var(--faint); }
.t-outer { fill: var(--faint); font-family: var(--mono); font-size: 10px; }

.data-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-family: var(--mono); font-size: 13px; }
.data-table th, .data-table td { padding: 8px 12px; text-align: right; border-bottom: 1px solid var(--line); }
.data-table th:first-child, .data-table td:first-child { text-align: left; }
.data-table thead th { color: var(--faint); font-weight: 500; text-transform: uppercase; font-size: 11px; letter-spacing: .5px; }
.data-table tr.savings td { color: var(--accent); font-weight: 500; }

.failure-table { display: flex; flex-direction: column; gap: 8px; margin: 20px 0; font-family: var(--mono); font-size: 12.5px; }
.failure-row { display: grid; grid-template-columns: 120px 90px 1fr 28px; align-items: center; gap: 10px; }
.fp-addr { color: var(--ink); }
.fp-proto { color: var(--faint); }
.fp-bar-wrap { height: 8px; background: var(--panel); border-radius: 4px; overflow: hidden; }
.fp-bar { height: 100%; background: var(--accent); border-radius: 4px; }
.fp-count { text-align: right; color: var(--soft); }
@media (max-width: 520px) {
  .failure-row { grid-template-columns: 96px 1fr 24px; }
  .fp-proto { display: none; }
}
</style>
