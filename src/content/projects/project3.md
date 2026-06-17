---
title: "Neural Network Reactive Lighting System"
year: 2024
spec: "ESP32-S3 · edge AI · custom PCB"
summary: "Edge AI on ESP32-S3 using TensorFlow Lite to interpret voice commands and control an LED lighting system in real time."
cover: "/images/nn3dphoto.png"
order: 1
---

An intelligent lighting system that responds to verbal commands using an ESP32-S3 microcontroller and a TensorFlow Lite neural network — all running on a custom-designed PCB.

![3D render of the custom PCB](/images/nn3dphoto.png)

## Overview

The system runs concurrent audio processing and LED control under FreeRTOS. A neural network trained in TensorFlow Lite interprets spoken commands to dynamically adjust lighting settings. To keep the design compact, all components were integrated onto a custom PCB: the ESP32-S3, an I²S MEMS microphone, power regulation, and LED driver circuitry.

## PCB Design

![PCB schematic](/images/schematic.png)

The PCB was designed in KiCad. Key decisions:

- **ESP32-S3** handles both inference and peripheral control. Its dual-core architecture lets the ML pipeline run on one core while LED output runs on the other under FreeRTOS task isolation.
- **I²S MEMS microphone** feeds raw audio directly to the ESP32-S3 via I²S DMA, bypassing the CPU for sample capture.
- **Two USB ports:** one for power/flashing, one for serial debug — avoids the need to reflash for monitoring.
- Power regulation sized for the LED load, with filtering for the analog supply rail.

![Assembled PCB](/images/pcb.JPG)

## Software

**Audio pipeline:** Raw I²S samples stream into a ring buffer. A DSP stage applies windowing and computes a mel-frequency spectrogram frame on each 30 ms window.

**Inference:** The spectrogram is fed to a keyword-spotting model converted to TensorFlow Lite. The model was trained on a custom dataset of command words and quantized to int8 for the ESP32-S3.

**LED control:** On a recognized command, the LED task updates brightness and color parameters via a FreeRTOS queue. PWM output is handled by the LEDC peripheral.

## Results

The system reliably recognizes command words at conversational speaking distances with latency under 200 ms from utterance to LED response. False positive rate was acceptable in a quiet lab environment; performance degrades in noisy conditions as expected for a small on-device model.
