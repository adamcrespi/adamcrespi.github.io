---
title: "Autonomous Driving Competition"
year: 2023
spec: "CNNs · drone control · computer vision"
summary: "CNN-based image classification for autonomous drone control in a sign-following competition."
cover: "/images/dronepic.jpg"
order: 1
---

A machine learning system for autonomous drone navigation using convolutional neural networks to classify road signs and direct flight control in real time.

## Gallery

![Competition scene](/files/last.gif)
![Sign recognition](/files/sign5.gif)
![Sign recognition 2](/files/sign6.gif)
![Black and white signs](/files/blackwhitesigns.gif)

## Overview

The system uses a CNN trained to classify directional signs from a downward-facing camera, translating predictions into flight commands for a quadrotor. The drone follows a course marked with signs, making turn decisions based on the classifier output.

## Approach

**Dataset:** Training images were collected from the physical competition course and augmented with rotations, crops, and brightness jitter to improve robustness to viewing angle variation and lighting changes.

**Model:** A lightweight CNN designed to run inference fast enough for real-time control. The architecture trades depth for throughput — inference runs in under 50 ms on the onboard compute, leaving headroom for the flight controller loop.

**Control interface:** Classifier output is mapped to velocity commands sent over the drone's SDK API. A state machine handles the sign sequence and timeouts for cases where the classifier is uncertain.

## Results

The system navigated the competition course autonomously, correctly responding to sign sequences. The main failure mode was ambiguous sign orientation at steep approach angles — an augmentation problem addressable with a larger dataset.

[Read the full report (PDF)](/files/Adam_Jordan_353_Final_Report.pdf)
