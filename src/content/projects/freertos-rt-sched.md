---
title: "Kernel-Level Real-Time Scheduling in FreeRTOS"
year: 2026
spec: "EDF · SRP · CBS · multiprocessor · RP2040 · Cortex-M0+"
summary: "Four real-time scheduling extensions implemented directly inside the FreeRTOS kernel, running on a Raspberry Pi Pico. Built for UBC CPSC 538G."
cover: "/images/rtos/test2_preemption.png"
order: 1
---

As part of **UBC CPSC 538G — Real-Time System Design**, this project implements four scheduling extensions directly inside the FreeRTOS kernel, each on its own branch. The target is a **Raspberry Pi Pico (RP2040)** — a dual-core Cortex-M0+ running at 133 MHz. All extensions are gated behind `FreeRTOSConfig.h` flags so that setting them to 0 compiles out all new code and restores unmodified FreeRTOS with zero overhead.

| Branch | Extension |
|--------|-----------|
| `edf` | Earliest Deadline First scheduling with admission control |
| `srp` | Stack Resource Policy — system ceiling, bounded blocking |
| `cbs` | Constant Bandwidth Server — aperiodic tasks alongside hard RT |
| `multiprocessor` | Global EDF and Partitioned EDF across both RP2040 cores |

---

## Hardware

| Component | Role |
|-----------|------|
| Raspberry Pi Pico (RP2040) | Target — dual-core Cortex-M0+ @ 133 MHz |
| Raspberry Pi Debug Probe | SWD flashing + UART serial output |
| Analog Discovery 2 | Logic analyzer — captures GPIO signals for Gantt chart generation |
| LEDs — Red (GP16), Yellow (GP17), Green (GP18) | One LED per task; HIGH = task executing |

The logic analyzer connection is what makes the schedule visible: each task drives a GPIO HIGH while it's running, and the AD2 samples all three channels at 10 kHz. A Python script (`capture_gantt.py`) reads the edge data over USB using `pydwf`, converts rising/falling edges into execution intervals, and renders a Gantt chart in matplotlib. This lets us verify preemption timing, deadline compliance, and core-parallel execution directly from hardware.

---

## EDF — Earliest Deadline First

EDF is the optimal single-core scheduler for periodic real-time tasks: any feasible task set (Σ Cᵢ/Tᵢ ≤ 1.0) is guaranteed schedulable. The implementation modifies FreeRTOS's `tasks.c` to replace the static-priority ready list with a deadline-sorted structure and adds a new `xTaskCreateEDF()` API that accepts period, relative deadline, and worst-case execution time (WCET) as parameters.

```c
BaseType_t xTaskCreateEDF(
    TaskFunction_t  pxTaskCode,
    const char     *pcName,
    uint32_t        usStackDepth,
    void           *pvParameters,
    TickType_t      xPeriod,
    TickType_t      xRelativeDeadline,
    TickType_t      xWCET,
    TaskHandle_t   *pxCreatedTask
);
```

Returns `pdPASS` if admitted and created, or an error code if rejected by admission control before any task is created.

### What was implemented

- **Deadline-sorted ready list** — the FreeRTOS ready list, normally indexed by static priority, is replaced with a structure sorted by absolute deadline. `O(1)` task selection; sorting cost paid at insertion and at each job release.
- **Per-tick re-prioritization** — absolute deadlines are updated on each job wakeup inside `xTaskIncrementTick`. A newly-released task with an earlier deadline than the running task triggers an immediate context switch.
- **Preemption** — when a task unblocks or is created with an earlier deadline than the currently running task, a context switch is pended immediately.
- **Deadline miss detection** — if a task's absolute deadline passes while it is still blocked or running, the miss is logged per-task and execution continues (log-and-continue, not panic).
- **Runtime task creation** — tasks added after `vTaskStartScheduler()` receive deadlines relative to their creation time and pass through admission control before being inserted.

### Admission control

Two tests are implemented and selected automatically based on task parameters:

**Liu & Layland (LL) bound** — used when D = T (deadline equals period). A task set is admitted if Σ Cᵢ/Tᵢ ≤ 1.0. Simple and O(n) to evaluate, but conservative when D < T.

**Processor demand analysis** — used when D < T (constrained deadline). Evaluates h(L) = Σ ⌊(L − Dᵢ)/Tᵢ + 1⌋ · Cᵢ ≤ L at every scheduling point L in [0, lcm(Tᵢ)]. Strictly less conservative than LL when deadlines are tighter than periods.

### Test 1 — Sequential execution, U = 0.450

Three tasks with well-separated deadlines. Red (τ1) has the earliest deadline every period, so it always runs first. No preemption occurs — each task completes before any other task's deadline passes.

| Task | C (ms) | D (ms) | T (ms) | U |
|------|--------|--------|--------|---|
| Red (τ1) | 100 | 250 | 500 | 0.200 |
| Yellow (τ2) | 150 | 500 | 1000 | 0.150 |
| Green (τ3) | 200 | 1000 | 2000 | 0.100 |
| **Total** | | | | **0.450** |

<div class="fig">
  <img src="/images/rtos/test1_low_util.png" alt="EDF Gantt chart — U=0.450, no preemption" />
  <p class="fig-caption">Captured via Analog Discovery 2. Red runs first each period (earliest deadline D=250 ms), then Yellow, then Green. Tasks complete well before their deadlines with no preemption needed.</p>
</div>

### Test 2 — Preemption visible, U = 0.637

Green has a 400 ms execution time and a 1600 ms period. Red releases every 400 ms with a 200 ms deadline — well before Green's deadline. When Red releases mid-way through Green's execution, Red's absolute deadline is earlier, so the scheduler preempts Green immediately. On the AD2 this appears as Green's GPIO going LOW, Red going HIGH, then Green resuming.

| Task | C (ms) | D (ms) | T (ms) | U |
|------|--------|--------|--------|---|
| Red (τ1) | 80 | 200 | 400 | 0.200 |
| Yellow (τ2) | 150 | 400 | 800 | 0.188 |
| Green (τ3) | 400 | 1000 | 1600 | 0.250 |
| **Total** | | | | **0.637** |

<div class="fig">
  <img src="/images/rtos/test2_preemption.png" alt="EDF Gantt chart — U=0.637, preemption visible" />
  <p class="fig-caption">Green (τ3) is split into multiple segments each period — Red preempts it mid-execution when Red's new job releases with an earlier deadline. Preemption points are visible as breaks in Green's bar.</p>
</div>

### Overloaded system — U = 1.500

A task set with total utilization above 1.0 cannot be feasibly scheduled. EDF makes no guarantee and deadline misses accumulate. The admission control tests catch this before runtime, but here it's deliberately bypassed to demonstrate what failure looks like. Red deadline misses (red ▼ markers) appear on a regular cadence as the CPU falls behind.

<div class="fig">
  <img src="/images/rtos/test3_overloaded.png" alt="EDF Gantt chart — U=1.500, deadline misses" />
  <p class="fig-caption">U = 1.500 — EDF cannot satisfy all deadlines. Red ▼ markers show deadline misses occurring on a predictable cadence as the backlog grows. This is the failure mode the admission control gate prevents.</p>
</div>

### Admission control test — 100 tasks

A standalone binary (`edf_100test`) exercises admission control without creating any FreeRTOS tasks. It incrementally feeds 100 tasks with C = 5 ms, T = 250 ms, and deadlines staggered from 30 ms to 525 ms (D < T for most tasks), comparing LL bound and processor demand at each step.

<div class="fig fig-row">
  <div>
    <img src="/images/rtos/admissiontest1.png" alt="Admission control serial output — tasks 1–54" />
    <p class="fig-caption">Tasks 1–54. LL bound and processor demand agree until task 51, where LL fails (Σ Cᵢ/Tᵢ = 1.020 > 1.0) but processor demand still passes — staggered deadlines leave sufficient slack.</p>
  </div>
  <div>
    <img src="/images/rtos/admissiontest2.png" alt="Admission control serial output — tasks 48–100 + summary" />
    <p class="fig-caption">Summary: LL accepted 50/100 tasks, processor demand accepted 51/100 — exactly 1 extra task admitted by the tighter analysis. Confirms PD is strictly less conservative when D &lt; T.</p>
  </div>
</div>

---

## SRP — Stack Resource Policy

SRP prevents priority inversion by blocking a task from preempting a lower-priority task that holds a resource the higher-priority task will need. Unlike priority inheritance (which lets the lower task run at elevated priority), SRP simply blocks the higher task at the door — it never enters a resource region it cannot acquire immediately.

**System ceiling** — each semaphore has a static ceiling equal to the highest priority (earliest deadline) among all tasks that can acquire it. A global `system_ceiling` scalar tracks the maximum ceiling of all currently-held semaphores. Before any preemption, the scheduler checks: if the incoming task's deadline is not earlier than the system ceiling, preemption is blocked.

**What this guarantees:**
- A task that enters a resource region runs to completion of that region without being preempted by any task that shares the resource — eliminating the unbounded blocking chains possible with standard mutexes.
- At most one blocking event per task per job, giving a tight bound for schedulability analysis: Bᵢ = max over all resources Rⱼ that lower-priority tasks hold, of Cⱼ (the WCET of the critical section).

SRP semaphores are implemented as a wrapper over FreeRTOS binary semaphores with a `ceiling` field added. `xSRPSemaphoreTake()` checks the system ceiling before blocking; `xSRPSemaphoreGive()` decrements the ceiling and may unblock waiting tasks.

---

## CBS — Constant Bandwidth Server

CBS allows aperiodic or soft real-time tasks to run alongside hard real-time EDF tasks without starving periodic tasks. The server is defined by a budget Q and period P, giving a bandwidth U_s = Q/P. A CBS task is treated as an EDF task whose deadline is dynamically managed by the server.

**Replenishment rule:** when a CBS task exhausts its current budget, rather than being blocked, its deadline is postponed to (current time + P) and its budget is refilled to Q. This bounds the server's interference on hard RT tasks to exactly U_s of CPU time per unit interval — regardless of how bursty the workload is.

**What this provides:**
- Aperiodic tasks can run at up to U_s utilization without ever pushing a hard RT deadline past its bound.
- The server itself participates in EDF scheduling, so its deadline-driven priority rises and falls with competing tasks.
- Implementation: a kernel-managed task wrapper in `tasks.c` intercepts the EDF scheduler's bandwidth accounting. The CBS deadline is stored in the TCB extension alongside the EDF absolute deadline.

---

## Multiprocessor EDF

The multiprocessor branch extends the FreeRTOS SMP kernel to support two scheduling models across both RP2040 cores.

### Global EDF

A single shared ready list sorted by absolute deadline. Any task can run on any core; the two cores always pull from the same queue. Admission bound: Σ Cᵢ/Tᵢ ≤ 2.0 (full utilization of both cores).

Proof of parallel execution is visible on the AD2 as any time window where two different channel signals are simultaneously HIGH — two EDF tasks running on different cores at the same instant.

| Task | C (ms) | T (ms) | U |
|------|--------|--------|---|
| τ1 (GP16) | 300 | 500 | 0.600 |
| τ2 (GP17) | 350 | 700 | 0.500 |
| τ3 (GP18) | 360 | 900 | 0.400 |
| **Total** | | | **1.500 ≤ 2.0** |

### Partitioned EDF

Tasks are pinned to a core at creation time using `configUSE_CORE_AFFINITY`. Each core runs its own independent EDF scheduler with its own admission bound of Σ Cᵢ/Tᵢ ≤ 1.0. No migration occurs at runtime.

| Task | Core | C (ms) | T (ms) | U |
|------|------|--------|--------|---|
| τ1 (GP16) | 0 | 250 | 500 | 0.500 |
| τ2 (GP17) | 0 | 280 | 700 | 0.400 |
| τ3 (GP18) | 1 | 360 | 900 | 0.400 |
| **Core 0** | | | | **0.900 ≤ 1.0** |
| **Core 1** | | | | **0.400 ≤ 1.0** |

Key config flags for SMP:

```c
#define configNUMBER_OF_CORES            2
#define configRUN_MULTIPLE_PRIORITIES    1
#define configUSE_CORE_AFFINITY          1
#define GLOBAL_EDF_ENABLE                1   /* or PARTITIONED_EDF_ENABLE */
```

---

## Schedule capture tool

`capture_gantt.py` uses the Analog Discovery 2 to record all three GPIO channels simultaneously at 10 kHz for up to 5 seconds. Each channel is connected to one task's LED GPIO. The script converts the raw sample stream into rising/falling edge events, pairs them into execution intervals, and plots a color-coded Gantt chart using matplotlib. Deadline markers and deadline-miss indicators (red ▼) are overlaid from the serial output.

```
AD2 wiring: GP16 → DIO0 · GP17 → DIO1 · GP18 → DIO2 · GND → GND
```

This hardware-in-the-loop approach verifies that the scheduler is producing the correct execution order at the GPIO level, not just in simulated serial logs — preemption, task splits, and parallel core execution are all visible directly on the captured waveform.

<style>
.fig { margin: 28px 0; text-align: center; }
.fig img { max-width: 100%; border-radius: 8px; border: 1px solid var(--line); }
.fig-caption { font-size: 13px; color: var(--faint); margin-top: 8px; line-height: 1.5; }
.fig-row { display: flex; gap: 20px; align-items: flex-start; }
.fig-row > div { flex: 1; }
@media (max-width: 560px) { .fig-row { flex-direction: column; } }
</style>
