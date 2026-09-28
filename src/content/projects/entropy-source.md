---
title: "Ring-Oscillator Entropy Source — Build It, Then Break It"
year: 2026
spec: "Efinix FPGA · Verilog · ring-oscillator TRNG · NIST SP 800-90B / AIS-31"
summary: "ENPH 479 capstone sponsored by Node Labs: build an FPGA ring-oscillator entropy source, commit publicly to an entropy claim, then spend the year trying to break it and generate real private keys under adversarial observation."
tag: "In Progress"
order: 6
---

**ENPH 479 — Engineering Physics Project II**, running September 2026 – April 2027, sponsored by Node Labs Inc.

> How do you prove that a number is random?

On 30 July 2026 an attacker emptied 1,196 Bitcoin addresses in 41 minutes — about $70M — traced to a single hardware wallet's firmware. No device was touched: the private keys were simply guessable. Five years earlier, a Coldcard firmware update had routed key generation through a software pseudo-random generator instead of the hardware noise source, because a flag meant to disable that fallback was tested with `#ifndef` instead of `#if` — existence, not value. Keys meant to carry 128 bits of entropy carried about 40. Nobody noticed for five years, because a good software generator is statistically indistinguishable from physical noise: you can prove a generator *bad* by exhibiting something that predicts it, but no amount of testing proves one *good*.

That's the question this project sits on top of. We're building a ring-oscillator entropy source on an Efinix FPGA and playing both sides of it over the year.

## The project

| Phase | Role | What happens |
|---|---|---|
| 1 — Build & commit | Blue team | Design the ring-oscillator TRNG, model its jitter with the standard textbook model, and commit — publicly, with a sponsor sign-off and a git tag — to a claimed entropy rate of half a bit per raw bit, maximized for throughput. |
| 2 — Characterize & attack | Red team | Try to prove the commitment wrong: predict the next bit better than the claim allows, re-derive every calculation behind it, check the synthesized circuit against the model, and — stretch goal — pull in temperature, voltage, or EM side channels, or active frequency-injection attacks. |
| 3 — Crack & reckon | Both | Generate real private keys — our own, controlling nothing of value — from a ladder of raw-bit budgets, seal the seeds, then spend the rest of the term cracking up the ladder on ordinary compute until it stalls. Where the cracking stops is the measured entropy per raw bit, checked against the half-bit claim. |

The generator only has to beat a coin flip — that's the point of committing to half a bit instead of claiming perfection. The finding is *how much* better an attacker can actually do than that, and whether the gap is small enough to trust with real money.

