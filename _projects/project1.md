---
layout: single
title: "Smart BLE Gesture Ring"
permalink: /projects/ring/
description: "Capacitive gesture ring with BLE, haptics, and heart rate monitoring"
image: /images/ring_cover.jpg
---

<!--
<div class="image-container">
  <img src="/images/ring_proto.jpg" alt="Ring Prototype" style="width: 70%; border-radius: 10px; margin-top: 10px;">
  <p class="image-label">Figure 1: First Prototype of the BLE Ring</p>
</div>
-->

<div class="toc-container">
  <div class="toc">
    <a href="#overview" class="toc-item">Project Goals</a>
    <a href="#hardware" class="toc-item">Hardware Stack</a>
    <a href="#firmware" class="toc-item">Firmware Development</a>
    <a href="#testing" class="toc-item">Testing & Next Steps</a>
  </div>
</div>

<!-- Project Sections -->
<section id="overview">
  <h2>Project Goals</h2>
  <ul>
    <li>Design a wearable smart ring with BLE connectivity</li>
    <li>Implement capacitive touch gesture recognition</li>
    <li>Integrate haptic feedback via linear resonant actuator (LRA)</li>
    <li>Stream heart rate data from an optical sensor over Bluetooth</li>
    <li>Enable phone control (media playback, volume, etc.) via BLE HID</li>
    <li>Optimize for ultra-low-power operation and minimal footprint</li>
  </ul>
</section>

<section id="hardware">
  <h2>Hardware Stack</h2>
  <ul>
    <li><strong>MCU:</strong> Nordic nRF52832 (BLE + low-power core)</li>
    <li><strong>Capacitive Sensing:</strong> MPR121 controller</li>
    <li><strong>Haptics:</strong> DRV2605L + 6mm LRA motor</li>
    <li><strong>Heart Rate:</strong> MAX30102 optical pulse sensor</li>
    <li><strong>Power:</strong> 3.7V LiPo cell + MCP73831 charger</li>
    <li><strong>PCB:</strong> Custom-designed 2-layer flex prototype</li>
  </ul>
</section>

<section id="firmware">
  <h2>Firmware Development</h2>
  <ul>
    <li>Set up peripheral drivers for I2C communication with sensors</li>
    <li>Implemented gesture state machine with tap/double-tap/long-press detection</li>
    <li>Used Nordic SDK and Zephyr RTOS to handle BLE stack, advertising, and HID media control</li>
    <li>Mapped gestures to media actions (play/pause, skip, volume) on connected phone</li>
    <li>Integrated heart rate streaming over custom BLE characteristic</li>
    <li>Added haptic feedback loop for gesture confirmation</li>
  </ul>
</section>

<section id="testing">
  <h2>Testing & Next Steps</h2>
  <ul>
    <li>Gesture detection validated on breadboard prototype</li>
    <li>BLE connection tested with iOS + Android using nRF Connect Mobile</li>
    <li>Next step: route and order custom PCB with optimized layout</li>
    <li>Begin battery life profiling and deep sleep tuning</li>
    <li>Integrate with a mobile app or explore gesture-to-voice bridging</li>
  </ul>
</section>
