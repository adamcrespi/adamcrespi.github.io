---
layout: single
title: "Kernel-Level Real-Time Scheduling in FreeRTOS"
permalink: /projects/freertos-rt-sched/
author_profile: true
---

<h3>UBC CPSC 538G — Real-Time System Design</h3>

<p>
  As part of Topics in Computer Systems: Real-Time Computing, I extended the FreeRTOS kernel to support
  Earliest Deadline First (EDF), Stack Resource Policy (SRP), and
  Constant Bandwidth Server (CBS) scheduling, bringing modern real-time theory into a working embedded kernel.
</p>

<h3>Overview</h3>

<p>
  The project explored how different real-time scheduling policies guarantee timing determinism across mixed task types.
  Each scheduler was implemented directly inside the FreeRTOS kernel, modifying its ready-queue management,
  context-switch logic, and task control block structure to support dynamic priorities, bounded resource access, and CPU bandwidth partitioning.
</p>

<ul>
  <li><strong>Earliest Deadline First (EDF):</strong> Implemented dynamic priority assignment with deadline-sorted ready queues and integrated it with FreeRTOS’s tick interrupt for preemption.</li>
  <li><strong>Stack Resource Policy (SRP):</strong> Added real-time locking to prevent priority inversion under EDF by using a system ceiling approach for shared resources.</li>
  <li><strong>Constant Bandwidth Server (CBS):</strong> Introduced temporal isolation for aperiodic tasks, enforcing execution budgets and deadlines per server.</li>
</ul>

<h3>Technical Highlights</h3>

<ul>
  <li>Modified <code>tasks.c</code> and <code>list.c</code> to support deadline-ordered ready lists and CBS accounting logic.</li>
  <li>Extended <code>TCB_t</code> to include <code>deadline</code>, <code>period</code>, and <code>budget</code> fields.</li>
  <li>Implemented deadline recalculation and replenishment hooks within the scheduler tick.</li>
  <li>Validated behavior with deterministic test workloads running on a STM32F4 target and simulated in QEMU.</li>
  <li>Measured preemption latency and response-time distributions under each policy to confirm theoretical schedulability bounds.</li>
</ul>

<h3>Concepts Explored</h3>

<ul>
  <li>Timing guarantees in hard and soft real-time systems.</li>
  <li>Formal schedulability analysis and deadline monotonic reasoning.</li>
  <li>Concurrency control under EDF with bounded blocking (SRP).</li>
  <li>Temporal isolation and mixed-criticality execution (CBS).</li>
  <li>Integration of mathematical scheduling theory with kernel-level systems code.</li>
</ul>

<h3>Skills & Tools</h3>

<ul>
  <li><strong>Languages:</strong> C, Python (test harness, timing analysis)</li>
  <li><strong>Platforms:</strong> FreeRTOS, QEMU ARM Cortex-M4, STM32 Nucleo</li>
  <li><strong>Concepts:</strong> real-time scheduling theory, task preemption, concurrency control, timing analysis</li>
  <li><strong>Tooling:</strong> GCC ARM toolchain, GDB/OpenOCD, custom latency profiler</li>
</ul>

<h3>Key Takeaways</h3>

<ul>
  <li>Learned to connect real-time scheduling theory directly to embedded kernel design and implementation.</li>
  <li>Developed intuition for how mathematical schedulability proofs translate into preemption, blocking, and timing behavior on hardware.</li>
  <li>Deepened understanding of FreeRTOS internals and kernel synchronization mechanisms.</li>
  <li>Strengthened low-level debugging and instrumentation skills for timing-critical systems.</li>
</ul>

