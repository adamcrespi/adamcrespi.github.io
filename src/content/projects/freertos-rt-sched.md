---
title: "Kernel-Level Real-Time Scheduling in FreeRTOS"
year: 2025
spec: "EDF / SRP / CBS schedulers · in-kernel"
summary: "EDF, SRP, and CBS schedulers implemented inside the FreeRTOS kernel for UBC CPSC 538G."
cover: "/images/rtos.png"
order: 1
---

As part of **UBC CPSC 538G — Real-Time System Design**, I extended the FreeRTOS kernel to support Earliest Deadline First (EDF), Stack Resource Policy (SRP), and Constant Bandwidth Server (CBS) scheduling, bringing modern real-time theory into a working embedded kernel.

## Overview

The project explored how different scheduling policies guarantee timing determinism across mixed task types. Each scheduler was implemented directly inside the FreeRTOS kernel — modifying its ready-queue management, context-switch logic, and task control block structure to support dynamic priorities, bounded resource access, and CPU bandwidth partitioning.

![FreeRTOS scheduling trace](/images/rtos.png)

## Schedulers

**EDF (Earliest Deadline First)** schedules tasks by absolute deadline, achieving full processor utilization for any feasible task set. This required changing FreeRTOS's static-priority ready queue into a deadline-ordered structure with per-tick re-prioritization. Tasks carry an absolute deadline in their TCB extension; the scheduler re-sorts on every tick and on any unblocking event.

**SRP (Stack Resource Policy)** prevents priority inversion by blocking a task from preempting a lower-priority task that holds a resource the higher-priority task will need. It eliminates unbounded blocking and enables tighter schedulability analysis — at the cost of banning preemption inside resource regions. The system ceiling is maintained as a global scalar and checked before every context switch.

**CBS (Constant Bandwidth Server)** isolates soft real-time or aperiodic tasks by giving them a reserved CPU budget that replenishes on a fixed period. A bursty task can't starve periodic tasks — when it exhausts its budget, it's deferred until the next replenishment. This is implemented as a kernel-managed task wrapper that intercepts the scheduler's bandwidth accounting.

## Results

All three schedulers were validated against synthetic task sets designed to stress the specific invariants of each policy: EDF was tested at utilizations near 100%, SRP against sets that would deadlock under priority inheritance, and CBS with a mix of bursty and periodic tasks at varying server parameters.
