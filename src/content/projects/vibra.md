---
title: "Very Low Latency BLE Audio"
year: 2025
spec: "nRF52 · bare-metal · BLE audio transport"
summary: "Bare-metal, ultra-low-latency BLE audio transport on Nordic nRF52 dev kits."
cover: "/images/vibra/headerimage.jpg"
order: 2
---

**VIBRA** is a bare-metal, ultra-low-latency BLE audio transport built on Nordic nRF52 development kits. The goal: see how fast BLE can actually get.

[View on GitHub](https://github.com/adamcrespi/VIBRA-Very-Low-Latency-BLE-Audio-)

![nRF52 dev kit](/images/vibra/dk1.png)

## Hardware

- **MCUs:** Nordic nRF52 DKs (PCA10040) — TX and RX roles
- **Debug & Flash:** SEGGER J-Link (on-board)
- **Logic Analyzer:** Digilent Analog Discovery 2 for GPIO timing
- **Host:** Ubuntu 22.04 with nRF Connect SDK

## Approach

The system uses hardware TIMER, PPI/DPPI, DMA, and the SoftDevice BLE stack to minimize scheduling jitter and push end-to-end audio latency into the sub-10 ms range — with jitter bounded within ±200 µs under steady-state conditions.

Rather than layering on an RTOS, all timing-critical operations are driven directly by hardware peripherals chained through the PPI/DPPI crossbar: the ADC triggers DMA which triggers the radio, eliminating any CPU scheduling path from the hot loop.

## BLE Stack

![BLE stack diagram](/images/vibra/ble_stack.png)

The audio pipeline runs on top of a custom BLE connection with connection-interval and PHY parameters tuned for minimum round-trip latency. Radio scheduling is handled by the SoftDevice timeslot API, giving the application deterministic access to the air at precise intervals.

## Measurements

![Oscilloscope capture](/images/vibra/scope.jpg)

Latency measurements are taken with the AD2 logic analyzer probing GPIO toggles inserted at the ADC sample capture and PWM output stages on each side. End-to-end numbers are captured across hundreds of consecutive frames.
