---
title: "Indexing Blockchain Data for Arbitrage"
year: 2026
spec: "Polygon PoS · Rust · self-hosted node · atomic execution"
summary: "Self-hosted Polygon node and Rust block indexer that replaced a third-party RPC dependency, enabling real-time arbitrage detection across DEX liquidity pools on mainnet."
cover: "/images/avax.png"
order: 2
---

**2600 Blockchain** is a self-sponsored team running an automated arbitrage system on the Polygon proof-of-stake network. The system detects when the same token is mispriced across two or more DEX liquidity pools and captures the spread with a single atomic transaction — one that reverts automatically if market conditions move before the trade lands.

The prior system sourced all blockchain data from a commercial RPC provider (Alchemy). This was the dominant latency bottleneck: every block notification arrived through at least one extra network hop, and under high load, shared provider infrastructure introduced variable queuing delays that no software optimization could fix.

This project replaced that dependency entirely.

---

## What we built

Five components form an integrated pipeline from the Polygon peer-to-peer network to on-chain execution:

1. **Local Polygon full node** — Bor (v2.6.0) and Heimdall (v0.6.0) running as isolated `systemd` services on a dedicated Ubuntu server with 64 GB DDR4 RAM and an 8 TB NVMe SSD. The node receives new blocks directly from network validators, with no intermediary.

2. **Python pool scraper** — an offline two-phase pipeline that discovers every deployed AMM pool on Polygon and scores it by rolling 5-day swap volume, writing results to a local SQLite database. This keeps the latency-critical indexer free from historical blockchain queries.

3. **Rust block indexer** — subscribes to the local node's `eth_subscribe newHeads` stream. On each block, it issues a single `eth_getLogs` call, iterates all returned logs in O(N) time, and dispatches matched events to tracked pool objects via a `HashMap<Address, Box<dyn Pool>>` lookup in O(1). Pool state is maintained entirely in memory.

4. **Arbitrage detection engine** — reads the in-memory pool graph after each state update and searches for profitable multi-hop routes. When one is found, it constructs an atomic execution transaction.

5. **On-chain execution contracts** — Solidity contracts deployed on Polygon mainnet that perform all swaps atomically and enforce the profitability condition: `require(amountOut > amountIn, "Unprofitable")`. If market conditions change between detection and block inclusion, the contract reverts and the caller loses only gas. Submitted through the local node's `eth_sendRawTransaction` endpoint, zero external RPC hops at execution time.

---

## The math: why reserve state is enough

The output of any Uniswap V2-style swap is fully determined by the current reserve pair (x, y) and input size:

```
Δy = y · Δx · (1 − f) / (x + Δx · (1 − f))
```

A `Sync` event encodes the new reserve balances after every swap. Applying these deltas to a cached reserve pair produces the updated state immediately, with no additional RPC call. A system that processes swap logs in real time maintains a complete, current model of every pool in memory — which the detection engine can query at zero network cost.

For multi-hop cycles, the trade is profitable when the product of swap outputs across all hops exceeds the initial input, net of fees. The indexer's only job is to keep reserve values accurate so this check reflects actual on-chain prices.

---

## Protocol support

The indexer handles three AMM architectures, unified under a single `Pool` trait:

- **Uniswap V2** — `getReserves()` on init; `Sync` events overwrite both reserve balances on every swap
- **Uniswap V3 (concentrated liquidity)** — `sqrtPriceX96`, `tick`, active `liquidity`, and a `HashMap<i32, i128>` of tick-level liquidity deltas; updated from `Swap`, `Mint`, and `Burn` events
- **Algebra V3 / QuickSwap** — similar to V3 but uses `globalState()` for a single-call init and a fixed tick spacing of 1

Dynamic dispatch via trait objects (`Box<dyn Pool>`) means all pool types live in a single collection and update through a unified `handle_event()` interface — no branching on pool type in the hot path.

---

## The hardest problem: a corrupted node database

During initial latency profiling, we found a recurring ~7,000 ms latency spike every 60 seconds — far larger than anything in the indexer code.

Tracing it to the Bor node: the spike was Bor's "block freeze" operation, which migrates historical blocks from the live PebbleDB to flat ancient files. The snapshot we'd used to initialize the node (a 5.6 TB Stakecraft snapshot loaded via `rclone` FUSE mount) contained a corrupted block range starting at block 74,592,112. These blocks had headers and bodies but were missing transaction receipts. When the freezer hit them, it failed, triggered a database rollback, and held the database lock for ~7 seconds — entirely blocking the indexer pipeline on a 60-second cycle.

Rather than re-sync from scratch, we wrote a custom Go application that fetched the missing JSON receipts from a public RPC, encoded them into Polygon's specific PebbleDB storage format, and injected them directly into the database. The patch permanently eliminated the spikes.

---

## Accuracy oracle

A fast indexer that silently misses events or applies them incorrectly is worse than a slow one — it causes the detection engine to evaluate routes against stale prices that no longer exist on-chain.

After processing each block, the indexer randomly samples pools that received events and independently re-fetches their state from the chain via RPC (`reserves()`, `slot0()`, or `globalState()` depending on type). It compares the fresh on-chain state to the in-memory state field-by-field using each pool's `equal()` method. Any mismatch is flagged and counted.

This runs continuously in production as a live correctness check.

---

## Latency benchmarking

The indexer was built with a compile-time profiling feature gate (`--features log_latency`) that captures five timestamps per block using `SystemTime::now()`: block produced, header received, request dispatched, logs received, and state updated. By toggling a single `DEFINE` flag, we could switch the WebSocket connection between the local node and Alchemy, executing identical code paths against both and attributing any performance delta purely to infrastructure.

Block reception latency — the time from block production to our indexer receiving the header — dropped significantly with the local node compared to Alchemy. `eth_getLogs` round-trip times followed the same pattern.

The system is live on Polygon mainnet.

---

## What's next

The biggest remaining bottleneck is propagation time between block finalization and transaction inclusion. The highest-impact next steps are co-locating the server with Polygon validator infrastructure to reduce P2P propagation delay, extending pool coverage to additional concentrated liquidity types, and implementing mempool monitoring to detect opportunities in pending transactions before blocks are finalized.
