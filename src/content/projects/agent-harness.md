---
title: "Embedded Agent Harness"
year: 2026
spec: "2× nRF52 DK · Zephyr · bare-metal nrfx rig · HIL benchmark for coding agents"
summary: "Harness and context engineering for a coding agent writing embedded firmware — a hand-built nRF52 rig emulates fictional sensors over real wires for real hardware feedback, with a fast, Jev-style classifier swapping models per decision for token efficiency."
tag: "In Progress"
order: 7
---

Coding agents improve by running code and reading the result. That loop is cheap for web code: run the tests, read the stack trace, retry. For firmware it breaks — a bad register write doesn't throw a stack trace, it corrupts RAM silently or drops a bus transaction that never happened. No log, no feedback, no improvement.

This is a hardware-in-the-loop bench built to close that loop. Two nRF52 DKs, wired together: one runs the agent's firmware, the other runs a hand-built emulator that answers as a sensor over real wires at real speed. A daemon owns every instrument on the bench; the agent sandbox has no USB access and reaches hardware only through typed tools. Every flash, bus transaction, and fault gets logged to one timeline.

The sensors are invented, not real parts. Frontier models have seen thousands of real driver implementations during training, so grading against real parts measures memorization as much as skill — **contamination**. A datasheet I wrote forces the agent to actually read a spec. On the same chip and RTOS, [IoT-SkillsBench](https://arxiv.org/abs/2603.19583) found human-written context lifted a Zephyr driver task from 28/42 to 41/42, while model-authored context scored 27 — curated, failure-grounded context beats more context, and that's the design brief below.

## Why hardware-in-the-loop, not simulation

The rig doesn't model a chip in software — it answers on real I2C and SPI lines at real clock speed, so EasyDMA, interrupts, and bus timing all get exercised instead of a mocked register read. A driver that passes against a software model can still fault against a real bus: clock stretching, a chip select held low a microsecond short, an interrupt arriving mid-transaction. Those failure modes only exist on wires.

## System architecture

One daemon (`hilbenchd`) owns every instrument — both J-Links, the rig's UART link, the logic analyzer, the switchable hub. The agent container has no USB passthrough and no vendor tools (`nrfutil`, `JLinkExe`); it reaches a board only through the daemon's socket, so every guardrail lives in one place instead of scattered across tools an agent could route around.

<div class="fig">
  <svg viewBox="0 0 1040 410" class="diagram-arch" role="img" aria-label="Three trust zones: the agent sandbox with no USB access on the left, talking over a socket to the bench daemon on the bench host in the middle, which is the only thing with USB permissions and drives the DUT and rig boards on the right over J-Link and a framed UART link; the DUT and rig are wired directly to each other over I2C, SPI, GPIO and a SYNC line, tapped by a logic analyzer.">
    <defs>
      <marker id="arr-arch" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
      </marker>
    </defs>
    <rect x="15" y="25" width="270" height="340" rx="8" class="zone"/>
    <text x="30" y="45" class="zone-label">AGENT SANDBOX — NO USB</text>
    <rect x="330" y="25" width="325" height="375" rx="8" class="zone"/>
    <text x="345" y="45" class="zone-label">BENCH HOST — OWNS ALL HARDWARE</text>
    <rect x="700" y="25" width="325" height="340" rx="8" class="zone"/>
    <text x="715" y="45" class="zone-label">BOARDS</text>
    <rect x="40" y="60" width="220" height="55" rx="6" class="box-main"/>
    <text x="150" y="82" class="lbl-main"><tspan x="150" dy="0">Coding agent</tspan><tspan x="150" dy="15">Claude Code, headless</tspan></text>
    <rect x="40" y="170" width="220" height="55" rx="6" class="box-mid"/>
    <text x="150" y="192" class="lbl-mid"><tspan x="150" dy="0">hil CLI + MCP adapter</tspan><tspan x="150" dy="15">same tool registry</tspan></text>
    <line x1="150" y1="115" x2="150" y2="170" class="edge" marker-end="url(#arr-arch)"/>
    <text x="165" y="145" class="lbl-edge" text-anchor="start">tool calls</text>
    <rect x="350" y="55" width="290" height="65" rx="6" class="box-accent"/>
    <text x="495" y="82" class="lbl-accent"><tspan x="495" dy="0">Bench daemon</tspan><tspan x="495" dy="16">hilbenchd — asyncio, one actor per board</tspan></text>
    <rect x="350" y="160" width="290" height="55" rx="6" class="box-mid"/>
    <text x="495" y="182" class="lbl-mid"><tspan x="495" dy="0">System 1</tspan><tspan x="495" dy="15">Jetson · llama.cpp triage</tspan></text>
    <rect x="350" y="250" width="290" height="50" rx="6" class="box-mid"/>
    <text x="495" y="270" class="lbl-mid"><tspan x="495" dy="0">Trace store</tspan><tspan x="495" dy="14">JSONL + content-addressed artifacts</tspan></text>
    <rect x="350" y="335" width="290" height="40" rx="6" class="box-mid box-dashed"/>
    <text x="495" y="359" class="lbl-mid">Hidden grader — graded after session ends</text>
    <line x1="260" y1="197" x2="350" y2="87" class="edge" marker-end="url(#arr-arch)"/>
    <text x="270" y="150" class="lbl-edge" text-anchor="start">Unix socket / TLS</text>
    <line x1="495" y1="120" x2="495" y2="160" class="edge" marker-end="url(#arr-arch)"/>
    <line x1="495" y1="215" x2="495" y2="250" class="edge" marker-end="url(#arr-arch)"/>
    <line x1="495" y1="300" x2="495" y2="335" class="edge-loop" marker-end="url(#arr-arch)"/>
    <rect x="720" y="55" width="290" height="60" rx="6" class="box-main"/>
    <text x="865" y="80" class="lbl-main"><tspan x="865" dy="0">DUT — nRF52 DK</tspan><tspan x="865" dy="15">agent's firmware, Zephyr</tspan></text>
    <rect x="720" y="185" width="290" height="60" rx="6" class="box-accent"/>
    <text x="865" y="210" class="lbl-accent"><tspan x="865" dy="0">Rig — nRF52 DK</tspan><tspan x="865" dy="15">device emulator, bare-metal nrfx</tspan></text>
    <rect x="720" y="300" width="290" height="50" rx="6" class="box-mid"/>
    <text x="865" y="320" class="lbl-mid"><tspan x="865" dy="0">Logic analyzer</tspan><tspan x="865" dy="14">sigrok — bus decode + timing</tspan></text>
    <line x1="640" y1="85" x2="720" y2="85" class="edge" marker-end="url(#arr-arch)"/>
    <text x="680" y="78" class="lbl-edge" text-anchor="middle">SWD + RTT</text>
    <line x1="640" y1="105" x2="720" y2="205" class="edge" marker-end="url(#arr-arch)"/>
    <text x="700" y="160" class="lbl-edge" text-anchor="middle">framed UART</text>
    <line x1="865" y1="115" x2="865" y2="185" class="edge-bold"/>
    <text x="880" y="150" class="lbl-edge" text-anchor="start">I2C · SPI · GPIO · SYNC</text>
    <line x1="865" y1="245" x2="865" y2="300" class="edge-loop"/>
  </svg>
  <p class="fig-caption">Three trust zones, one daemon. Only <code>hilbenchd</code> crosses from software into hardware, so every action — a flash, a capture, a power cycle — is checked, serialized and traced in one place, whichever client asked for it.</p>
</div>

## The rig: a data-driven device emulator

Hand-written, no agent involvement — it's the actual resume claim under the benchmark. One engine, fed a device description, answers on real I2C and SPI lines and logs every datasheet rule the DUT's driver breaks.

Nordic's slave peripherals set the constraints. TWIS clock-stretches automatically while the rig prepares a reply, so repeated-start register reads work naturally. SPIS is stricter: it takes a semaphore on CS-fall, and if the CPU still holds it the frame is ignored and a default byte clocks out — buffers only change *between* frames, never inside one. So the rig can't answer "read register X" inside the frame that asked for it; every fictional SPI device is designed around that instead of fought with extra hardware — pipelined reads (frame N returns frame N−1's answer), or two-frame reads with a minimum CS-high gap.

Each device is one YAML file — register map plus reusable quirk primitives (burst-only auto-increment, shadow-latched registers, power-up NACK windows, conversion delays, mode prerequisites, errata). Three generators turn it into the rig's C tables, the datasheet, and a Python model used only by hidden tests — checked against each other by a differential test replaying the same transaction script through both.

```yaml
device: TMPX-200
bus: {type: i2c, address: 0x48, max_hz: 400000}
power_up_ms: 5
registers:
  - {name: WHO_AM_I, addr: 0x0F, reset: 0xA5, access: ro}
  - {name: CTRL, addr: 0x10, reset: 0x00, access: rw, reserved_mask: 0xE0,
     fields: {ODR: [2, 0], BURST: [3], START: [4, self_clearing]}}
  - {name: DATA_H, addr: 0x02, access: ro, latch: DATA_L}
  - {name: DATA_L, addr: 0x03, access: ro}
quirks:
  auto_increment: burst_only
  conversion_ms: 8
  drdy_pin: {active: low, pulse_us: 50}
errata:
  - {id: E1, text: "First read after wake returns 0x00", enabled_by: scenario}
```

A GPIOTE→PPI→TIMER chain, no CPU in the path, times CS setup, CS-high gaps, and DRDY-to-first-read latency at 62.5 ns resolution — timing bugs get logged as a violation with a section number, same as protocol bugs.

## The bench daemon: hermetic runs, leases, and a recovery ladder

Every `run` flashes, resets, and captures from boot — nothing depends on prior board state, so runs are replayable and safe to share across concurrent sessions. Sessions hold a *lease*, not a lock; a background task drains RTT continuously so the buffer never overflows between tool calls.

Recovery escalates through a fixed ladder: core reset, pin reset, reopen the probe, erase-all if the debug port is locked, float the rig's outputs and power-cycle the DUT, full power-cycle plus bench self-test. Automatic steps are logged as events, not interventions — only the terminal "needs human" state records one, which keeps that metric honest rather than inflated by routine recoveries.

<div class="fig">
  <svg viewBox="0 0 1040 340" class="diagram-lifecycle" role="img" aria-label="DUT lifecycle state machine with seven states: Idle leads to Leased, Flashing, and Running in sequence; Running can loop back to Idle on a clean completion, or drop to Faulted on a fault or hang; Faulted leads to Recovering, which normally returns to Running, but escalates to Needs Human if the recovery ladder is exhausted, the only state where a physical intervention is logged.">
    <defs>
      <marker id="arr-life" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
      </marker>
    </defs>
    <path d="M585,80 C585,15 80,15 80,80" class="edge-loop" marker-end="url(#arr-life)" fill="none"/>
    <text x="330" y="28" class="lbl-loop" text-anchor="middle">run complete — lease released, next run is hermetic regardless</text>
    <rect x="20" y="80" width="120" height="50" rx="6" class="box-main"/>
    <text x="80" y="109" class="lbl-main">Idle</text>
    <rect x="180" y="80" width="120" height="50" rx="6" class="box-main"/>
    <text x="240" y="109" class="lbl-main">Leased</text>
    <rect x="340" y="80" width="130" height="50" rx="6" class="box-main"/>
    <text x="405" y="109" class="lbl-main">Flashing</text>
    <rect x="510" y="80" width="150" height="50" rx="6" class="box-accent"/>
    <text x="585" y="109" class="lbl-accent">Running</text>
    <line x1="140" y1="105" x2="180" y2="105" class="edge" marker-end="url(#arr-life)"/>
    <line x1="300" y1="105" x2="340" y2="105" class="edge" marker-end="url(#arr-life)"/>
    <line x1="470" y1="105" x2="510" y2="105" class="edge" marker-end="url(#arr-life)"/>
    <rect x="510" y="190" width="150" height="50" rx="6" class="box-mid"/>
    <text x="585" y="219" class="lbl-mid">Faulted</text>
    <rect x="330" y="190" width="150" height="50" rx="6" class="box-mid"/>
    <text x="405" y="219" class="lbl-mid">Recovering</text>
    <line x1="585" y1="130" x2="585" y2="190" class="edge" marker-end="url(#arr-life)"/>
    <text x="600" y="163" class="lbl-edge" text-anchor="start">fault / heartbeat hang</text>
    <line x1="510" y1="215" x2="480" y2="215" class="edge" marker-end="url(#arr-life)"/>
    <text x="495" y="180" class="lbl-edge" text-anchor="middle">ladder, steps 1–6</text>
    <line x1="405" y1="190" x2="555" y2="132" class="edge" marker-end="url(#arr-life)"/>
    <text x="450" y="155" class="lbl-edge" text-anchor="middle">responsive again</text>
    <rect x="330" y="275" width="240" height="45" rx="6" class="box-accent box-dashed"/>
    <text x="450" y="302" class="lbl-accent">Needs human</text>
    <line x1="405" y1="240" x2="440" y2="275" class="edge-loop" marker-end="url(#arr-life)"/>
    <text x="470" y="260" class="lbl-loop" text-anchor="start">ladder exhausted (rare)</text>
  </svg>
  <p class="fig-caption">The only state a physical intervention gets recorded in. Everything above it is automatic and logged, but doesn't count against the "interventions per task" metric.</p>
</div>

## Agent tool API

About 15 top-level tools, defined once with a typed schema, generated into a `hil` CLI (JSON output, works with any shell-based agent) and a thin MCP adapter from the same registry. Every tool returns one envelope: a one-sentence `summary`, a token-budgeted `data` block, suggested `next` commands, and `cost` split into wall, hardware, and lease-queue time.

`run` is the workhorse — build, flash, reset, capture, decode, and triage in one call, one round trip instead of five.

```json
{
  "ok": true, "tool": "run", "run_id": "r-0142",
  "summary": "Booted in 212 ms. 14 I2C transactions to 0x48, 1 rig protocol violation, no fault.",
  "bus": {"i2c": {"transactions": 14, "nacks": 0}},
  "rig": {"violations": [{"t_us": 211612, "code": "BURST_REQUIRED",
          "detail": "3-byte read from 0x02 without the BURST bit; device repeated register 0x02"}]},
  "fault": null,
  "triage": {"label": "real_bug", "confidence": 0.9, "by": "rules"},
  "next": ["hil docs register TMPX CTRL", "hil bus r-0142 --full"]
}
```

`rig.violations` is the highest-value line the harness produces: it turns "the data looks wrong" into "you broke this datasheet rule, here's the section" — feedback no compiler warning gives.

## Three tiers: reflex, System 1, System 2

Only deterministic checks — compiler, static analysis, rig, analyzer — can fail a build or a test. A small local model (System 1, on a Jetson) sits between that ground truth and the agent: it labels each run into a closed set (pass, real bug, regression, flaky, infrastructure, tool misuse), digests logs to the lines that matter, and matches failure signatures against precedent. It can't turn a fail into a pass — a wrong label costs a turn, never a false pass — and has to beat a rules-only baseline or it gets cut.

<div class="fig">
  <svg viewBox="0 0 900 380" class="diagram-tiers" role="img" aria-label="Three-tier loop: System 2, the coding agent, builds and flashes firmware to the reflex tier (compiler, tests, rig, analyzer), which produces ground-truth results that System 1 triages into a label and a digest, which System 2 reads on its next turn. Only the reflex tier can fail a build or test.">
    <defs>
      <marker id="arr-tier" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
      </marker>
    </defs>
    <rect x="40" y="40" width="260" height="80" rx="6" class="box-main"/>
    <text x="170" y="72" class="lbl-main"><tspan x="170" dy="0">System 2</tspan><tspan x="170" dy="18">coding agent — writes/edits firmware</tspan></text>
    <rect x="600" y="40" width="260" height="80" rx="6" class="box-accent"/>
    <text x="730" y="72" class="lbl-accent"><tspan x="730" dy="0">Reflex tier — ground truth</tspan><tspan x="730" dy="18">compiler · tests · rig · analyzer</tspan></text>
    <rect x="320" y="260" width="260" height="80" rx="6" class="box-mid"/>
    <text x="450" y="292" class="lbl-mid"><tspan x="450" dy="0">System 1 — triage</tspan><tspan x="450" dy="18">small local model, Jetson — labels only</tspan></text>
    <line x1="300" y1="80" x2="600" y2="80" class="edge" marker-end="url(#arr-tier)"/>
    <text x="450" y="72" class="lbl-edge" text-anchor="middle">build → flash → run</text>
    <line x1="700" y1="120" x2="520" y2="260" class="edge" marker-end="url(#arr-tier)"/>
    <text x="650" y="200" class="lbl-edge" text-anchor="middle">raw logs, faults, violations, timings</text>
    <line x1="320" y1="290" x2="175" y2="122" class="edge" marker-end="url(#arr-tier)"/>
    <text x="200" y="200" class="lbl-edge" text-anchor="middle">label + digest — never a verdict override</text>
  </svg>
  <p class="fig-caption">System 1 must beat a rules-only baseline to earn a place in the loop. Most labels are already deterministic — probe errors are infrastructure, rerun disagreement is flaky — the model only handles what rules can't: novel failures, fuzzy signature matches.</p>
</div>

## Evaluation design

Hidden, hardware-verified grading on tasks no model could have memorized, enough repeats for honest error bars, and every hidden check traced back to something the agent could read.

- **Tasks, not runs, are the unit of analysis** — three runs of one task aren't independent samples; intervals bootstrap over tasks first, runs within tasks second, conditions compared paired on the same tasks.
- **Every task ships mutants** — broken copies of the reference solution the grader must reject, plus a reference that must pass 10/10. A grader that can't catch its own known-bad code produces numbers that mean nothing.
- **Visible tests inform, hidden tests decide.** The hidden suite lives in a private repo never mounted into the agent's container, runs against a clean checkout of the final commit, and is compared against the agent's own `submit` claim to catch false success.
- **Debug tasks are seeded bugs in reference drivers** — an ISR/main-loop race with no lock, a dropped `volatile` that only hangs at `-O2`, a DMA buffer in flash, a stack overflow from a shrunk thread stack — each exposed by a specific harness component (heartbeat detection, fault decoder, DMA pointer check, rig fault injection).
- **Interventions are logged, not answered.** A per-task hint ladder serves one level of specificity per `ask_human` call, so help is reproducible and counted by category.

Planned v1 suite: 30 tasks across 8 fictional devices — 12 driver, 12 debug, 6 timing — against Claude Code headless and `mini-swe-agent` as a fixed scaffold for cross-model runs.

<style>
.fig { margin: 28px 0; text-align: center; }
.fig-caption { font-size: 13px; color: var(--faint); margin-top: 8px; line-height: 1.5; text-align: left; }

svg.diagram-arch, svg.diagram-lifecycle, svg.diagram-tiers {
  width: 100%; height: auto; max-width: 100%; margin: 4px 0;
}
.zone { fill: none; stroke: var(--line); stroke-width: 1.2; stroke-dasharray: 5 4; }
.zone-label { font-family: var(--mono); font-size: 10.5px; letter-spacing: .5px; fill: var(--faint); }
.box-main { fill: var(--bg); stroke: var(--ink); stroke-width: 1.3; }
.box-mid { fill: var(--panel); stroke: var(--soft); stroke-width: 1; }
.box-accent { fill: var(--accent); stroke: var(--accent); }
.box-dashed { stroke-dasharray: 4 3; }
.lbl-main { font-family: var(--mono); font-size: 12px; fill: var(--ink); text-anchor: middle; }
.lbl-mid { font-family: var(--mono); font-size: 11px; fill: var(--soft); text-anchor: middle; }
.lbl-accent { font-family: var(--mono); font-size: 12px; fill: #fff; text-anchor: middle; }
.edge { stroke: var(--faint); stroke-width: 1.2; }
.edge-bold { stroke: var(--ink); stroke-width: 1.6; }
.edge-loop { stroke: var(--faint); stroke-width: 1.2; stroke-dasharray: 3 3; }
.lbl-edge { font-family: var(--mono); font-size: 10px; fill: var(--faint); }
.lbl-loop { font-family: var(--mono); font-size: 10px; fill: var(--faint); }

code { font-family: var(--mono); font-size: 0.9em; background: var(--panel); padding: 1px 5px; border-radius: 4px; }
pre { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-size: 13px; line-height: 1.55; }
pre code { background: none; padding: 0; }
table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14.5px; }
th, td { text-align: left; padding: 7px 12px 7px 0; border-bottom: 1px solid var(--line); }
th { color: var(--faint); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: .4px; }
</style>
