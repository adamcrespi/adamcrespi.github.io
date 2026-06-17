---
title: "Low-Latency Blockchain Arbitrage Engine"
year: 2024
spec: "Avalanche node · cross-DEX · graph search"
summary: "A latency-tuned Avalanche node with cross-DEX graph search for real-time on-chain arbitrage research."
cover: "/images/avax.png"
order: 2
---

The **CPU-Accelerated Arbitrage Research Platform (CARP)** is a research-focused platform for exploring on-chain market inefficiencies in real time. It's a capstone project built with a three-person team.

## Overview

Rather than depending on external APIs or black-box data providers, CARP interacts directly with the blockchain through a self-hosted Avalanche node and a lightweight indexing layer. This setup lets us study the structure, latency, and efficiency of decentralized finance networks using only local data.

The core question: how quickly do pricing inconsistencies emerge and collapse across different DEX liquidity pools, and what are the real latency bottlenecks in capturing them?

## Architecture

**Self-hosted node:** Running a full Avalanche node eliminates external API latency. State is read directly from local RPC — no third-party rate limits, no propagation delay from a relay.

**Cross-DEX indexing:** A lightweight indexer streams real-time swap events from multiple DEX contracts, normalizing prices to a common quote asset and maintaining a live price graph.

**Graph search:** Opportunity detection runs a directed graph search over the price graph looking for negative-weight cycles — the arbitrage condition. The search is tuned for latency, not exhaustiveness: it targets cycles that close within a single block.

**Transaction construction:** When an opportunity is found, the platform constructs and submits the transaction bundle on-chain, racing it against the block deadline.

## What we learned

The dominant bottleneck isn't compute — it's mempool propagation and block inclusion latency. Most opportunities visible from the RPC close before a transaction reaches the validators. The platform surfaced this empirically: we can detect cycles in microseconds but the round-trip to chain is orders of magnitude slower.
