---
layout: single
title: "VIBRA – Very Low Latency BLE Audio"
permalink: /projects/vibra/
description: "Deterministic, sub-10 ms BLE audio link using Nordic nRF52 DKs"
image: /images/vibra_cover.jpg
---

<div class="toc-container">
  <div class="toc">
    <a href="#overview" class="toc-item">Overview</a>
    <a href="#journal" class="toc-item">Build Journal</a>
  </div>
</div>

<section id="overview">
  <h2>Overview</h2>

  <p>
    <strong>VIBRA</strong> is a bare-metal, ultra-low-latency BLE audio transport built on Nordic
    nRF52 development kits. The goal is to see how fast BLE can get!
  </p>
  <h3 style="text-align: center; margin-top: 30px;">
  <a href="https://github.com/adamcrespi/VIBRA-Very-Low-Latency-BLE-Audio-" 
     target="_blank" 
     style="text-decoration: none; color: #007acc;">
     🔗 View the VIBRA GitHub Repository
  </a>
  </h3>
  <div style="text-align: center;">
      <img src="/images/vibra/dk.png" alt="devkit" style="width: 90%; border-radius: 10px; margin-top: 10px;">
  </div>

  <h3>Objectives</h3>
  <ul>
    <li>Achieve end-to-end audio latency &lt; <strong>5 ms</strong> (stretch target: &lt; <strong>2 ms</strong>).</li>
    <li>Keep jitter within <strong>±200 µs</strong> under steady-state conditions.</li>
    <li>Use hardware features (TIMER, PPI/DPPI, DMA, I²S, PWM) to minimize CPU scheduling.</li>
    <li>Turn the system into a reproducible testbed for deterministic wireless links.</li>
  </ul>

  <h3>Hardware</h3>
  <ul>
    <li><strong>MCUs:</strong> Nordic nRF52 DKs (PCA10040) – TX and RX roles.</li>
    <li><strong>Debug & Flash:</strong> SEGGER J-Link (on-board).</li>
    <li><strong>Logic Analyzer:</strong> Digilent Analog Discovery 2 (AD2) for GPIO timing.</li>
    <li><strong>Host:</strong> Ubuntu 22.04 with nRF Connect SDK</li>
  </ul>

  <h3>Current Status</h3>
  <ul>
    <li>Toolchain + nRF Connect SDK set up and validated.</li>
    <li>Custom <code>tx</code> and <code>rx</code> Zephyr apps derived from Nordic UART Service examples.</li>
    <li>GPIO timing markers added around BLE TX and RX paths.</li>
    <li>Measured one-way BLE latency of ≈ <strong>5 ms</strong> using AD2 logic analyzer.</li>
  </ul>

  <h3>Planned Phases</h3>
  <ol>
    <li><strong>Phase 0:</strong> Environment + board bring-up ✅</li>
    <li><strong>Phase 1:</strong> BLE link latency benchmarking (current).</li>
    <li><strong>Phase 2:</strong> DMA-driven ADC + PWM local audio loopback.</li>
    <li><strong>Phase 3:</strong> Integrate BLE link with audio pipeline.</li>
    <li><strong>Phase 4:</strong> Performance tuning (PPI/DPPI, DWT profiling, jitter reduction).</li>
    <li><strong>Phase 5:</strong> Stretch goals – custom codec, adaptive jitter buffer, I²S DAC.</li>
  </ol>
</section>

<section id="journal">
  <h2>Build Journal</h2>
  <p>
    This is a rolling log of work sessions. New entries are appended at the top with
    dates, notes, scope shots, and key findings.
  </p>

  <hr>

  <h3>2025-11-06 – First BLE Latency Measurement</h3>
  <ul>
    <li><strong>SDK & toolchain setup:</strong> Finished bringing up nRF Connect SDK on Ubuntu 22.04 (west workspace, Zephyr toolchain) and verified the toolchain by building the stock <code>hello_world</code> sample.</li>

    <li><strong>Board bring-up & blinky:</strong> Flashed a Zephyr <em>blinky</em> app to the nRF52 DK, confirmed a simple LED blink using the <code>DT_ALIAS(led0)</code> GPIO to prove GPIO + devicetree were wired correctly.</li>

    <li><strong>Shell workflow helpers (.bashrc):</strong> Updated <code>~/.bashrc</code> so that entering <code>~/ncs</code> or <code>~/vibra</code> auto-activates the NCS Python venv, and added custom bash functions for any easy workflow, turning the whole build/flash cycle into a couple of short shell commands.</li>

    <li>
  <pre><code class="language-bash">
# --- 1. Build Function ---
build() {
  source $HOME/ncs/zephyr/zephyr-env.sh 2>/dev/null

  local APP_NAME="${PWD##*/}"
  local BUILD_DIR_ABS="$HOME/ncs/build-$APP_NAME"

  echo "Building $APP_NAME for nrf52dk_nrf52832 (Output: $BUILD_DIR_ABS)"

  west build -b nrf52dk_nrf52832 \
    --pristine \
    --build-dir "$BUILD_DIR_ABS" \
    . \
    "$@"
}

# --- 2. Flash Helper ---
flash() {
  local APP_NAME="${PWD##*/}"
  local BUILD_DIR="build-$APP_NAME"

  echo "Flashing $APP_NAME (Build: $BUILD_DIR)"
  # build-&lt;app-name&gt;
  pushd "$HOME/ncs" > /dev/null && west flash -d "$BUILD_DIR" ; popd > /dev/null
}

# --- 3. Recover Helper ---
# Erases the board, then flashes.
recover() {
  local APP_NAME="${PWD##*/}"
  local BUILD_DIR="build-$APP_NAME"

  echo "!!! RECOVERING and Erasing All Flash Memory for $APP_NAME !!!"
  pushd "$HOME/ncs" > /dev/null && west flash --recover -d "$BUILD_DIR" ; popd > /dev/null
}
  </code></pre>
  </li>

    <li>Created dedicated <code>firmware/tx</code> and <code>firmware/rx</code> apps from
        Nordic <em>central_uart</em> / <em>peripheral_uart</em> samples.</li>
    <li>TX (central) modified to auto-send <code>PING</code> over Nordic UART Service once connected.</li>
    <li>Added GPIO “latency pins” on both boards using the LED0 alias.</li>
  <div style="text-align: center;">
      <img src="/images/vibra/scope.jpg" alt="scope" style="width: 90%; border-radius: 10px; margin-top: 10px;">
  </div>
    <li>TX pulses LED0 around <code>bt_nus_client_send()</code>;
        RX pulses LED0 inside the NUS receive callback.</li>
    <li>Connected AD2:
      <ul>
        <li>DIO0 → TX LED0 (P0.17)</li>
        <li>DIO1 → RX LED0 (P0.17)</li>
        <li>Shared GND between both DKs and AD2</li>
      </ul>
    </li>
  <div style="text-align: center;">
      <img src="/images/vibra/FIRST_BLE_EXAMPLE_LATENCY.png" alt="first latency example" style="width: 90%; border-radius: 10px; margin-top: 10px;">
  </div>
    <li>WaveForms configured at 10&nbsp;MHz sample rate with rising-edge trigger on DIO0.</li>
    <li>Measured one-way latency of ≈ <strong>4.96 ms</strong> (TX edge → RX edge) at 7.5&nbsp;ms BLE connection interval.</li>
  <div style="text-align: center;">
      <img src="/images/vibra/optimized1.png" alt="second latency example" style="width: 90%; border-radius: 10px; margin-top: 10px;">
  </div>
  </ul>

  <!-- Future entries go here -->
  <!--
  <h3>YYYY-MM-DD – Short Title</h3>
  <ul>
    <li>Key work done that day.</li>
    <li>Interesting timing results or bugs.</li>
    <li>Links to plots or scope screenshots in /images or /docs.</li>
  </ul>
  <hr>
  -->
</section>
