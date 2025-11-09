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
    <a href="#background" class="toc-item">Background / Theory</a>
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
      <img src="/images/vibra/dk1.png" alt="devkit" style="width: 90%; border-radius: 10px; margin-top: 10px;">
  </div>

  <!-- <h3>Objectives</h3>
  <ul>
    <li>Achieve end-to-end audio latency &lt; <strong>5 ms</strong> (stretch target: &lt; <strong>2 ms</strong>).</li>
    <li>Keep jitter within <strong>±200 µs</strong> under steady-state conditions.</li>
    <li>Use hardware features (TIMER, PPI/DPPI, DMA, I²S, PWM) to minimize CPU scheduling.</li>
    <li>Turn the system into a reproducible testbed for deterministic wireless links.</li>
  </ul> -->

  <h3>Hardware</h3>
  <ul>
    <li><strong>MCUs:</strong> Nordic nRF52 DKs (PCA10040) – TX and RX roles.</li>
    <li><strong>Debug & Flash:</strong> SEGGER J-Link (on-board).</li>
    <li><strong>Logic Analyzer:</strong> Digilent Analog Discovery 2 (AD2) for GPIO timing.</li>
    <li><strong>Host:</strong> Ubuntu 22.04 with nRF Connect SDK</li>
  </ul>

  <!-- <h3>Phases</h3>
  <ol>
    <li><strong>Phase 0:</strong> Environment + board bring-up ✅</li>
    <li><strong>Phase 1:</strong> BLE link latency benchmarking (current).</li>
    <li><strong>Phase 2:</strong> DMA-driven ADC + PWM local audio loopback.</li>
    <li><strong>Phase 3:</strong> Integrate BLE link with audio pipeline.</li>
    <li><strong>Phase 4:</strong> Performance tuning (PPI/DPPI, DWT profiling, jitter reduction).</li>
    <li><strong>Phase 5:</strong> Stretch goals – custom codec, adaptive jitter buffer, I²S DAC.</li>
  </ol> -->
</section>

<section id="background">
  <details>
    <summary class="collapsible-summary"><strong>BLE Stack Architecture</strong></summary>

    <h2>Background / Theory</h2>

    <h3>Full BLE Stack in VIBRA</h3>
    <div style="text-align: center;">
      <img src="/images/vibra/ble_stack.png"
           alt="VIBRA BLE stack overview"
           style="width: 90%; border-radius: 10px; margin-top: 10px;">
    </div>

    <p>
      VIBRA rides on a full Bluetooth Low Energy (BLE) stack that runs from our
      application code all the way down to the 2.4&nbsp;GHz RF waveform on the antenna.
      This section walks through each layer in that diagram and explains what it’s
      responsible for.
    </p>

    <h3>Application Layer</h3>
    <p>
      At the top is our <strong>VIBRA application</strong>, running as Zephyr threads.
      This is where we call functions like <code>bt_nus_send()</code>,
      <code>bt_gatt_notify()</code>, or <code>bt_conn_le_param_update()</code> to move
      audio frames over the Nordic UART Service (NUS) and tweak connection parameters.
      The app doesn’t see packets, access addresses, or RF details – it just deals with
      “send this buffer now” and reacts to callbacks when data arrives or connection
      events occur.
    </p>

    <h3>Zephyr BT Host Stack</h3>
    <p>
      Below the app sits the <strong>Zephyr Bluetooth Host</strong>
      (<code>zephyr/subsys/bluetooth/host</code>). This layer implements the BLE
      protocols that run on the host CPU: <strong>GATT</strong> and <strong>ATT</strong>
      for attributes, and <strong>L2CAP</strong> for transport and segmentation. 
      It takes our high-level calls, builds the right
      PDUs, manages attribute handles, and decides when/how those PDUs should be sent
      over an active BLE connection.
    </p>
    <div style="text-align: center;">
      <img src="/images/vibra/gatt_code.png" 
          alt="hardware" 
          style="width: 65%; border-radius: 10px; margin-top: 10px;">
      <p style="font-size: 0.9rem; color: #666; margin-top: 8px;">
        Zephyr GATT characteristic struct – the bt_gatt_chrc definition that VIBRA uses to describe each BLE characteristic’s UUID, value handle, and properties (read/write/notify). Inside /zephyr/bluetooth/gatt.h
      </p>
    </div>

    <h3>Controller / Link Layer</h3>
    <p>
      The <strong>Controller / Link Layer</strong> manages the actual BLE link. It knows
      about advertising, scanning, connecting, and maintaining timing relationships with
      a peer. Internally it has several responsibilities:
    </p>
    <ul>
      <li><strong>Advertising Manager:</strong> Generates advertising and scan response
          packets, and handles scanner logic and timing.</li>
      <li><strong>Connection Manager:</strong> Sets up and maintains connections
          (addresses, timeouts, connection parameters).</li>
      <li><strong>Channel Selection:</strong> Chooses which data channel to use each
          event, implementing BLE’s frequency hopping rules.</li>
      <li><strong>Packet Manager:</strong> Ensures in-order delivery, handles
          retransmissions, and manages acknowledgement semantics.</li>
      <li><strong>Event Scheduler &amp; Timing Control:</strong> Queues radio events,
          programs radio timers, schedules sleep/wakeup, and avoids collisions between
          overlapping activities.</li>
      <li><strong>Data Buffers &amp; Flow Control:</strong> Stores incoming and outgoing
          PDUs and throttles traffic so neither side overruns the link.</li>
      <li><strong>CRC Generation &amp; Address Handling:</strong> Applies link-layer CRCs
          and manages access addresses and device addresses.</li>
    </ul>
    <p>
      The link layer decides <em>when</em> packets go over the air and in which order.
      The physical radio blocks below decide <em>how</em> those bits become RF.
    </p>

    <h3>HCI: Host–Controller Interface</h3>
    <p>
      The <strong>Host Controller Interface (HCI)</strong> is the boundary between the
      Zephyr host stack and the controller. It provides a command/event protocol and a
      data path for ACL packets. On the nRF52 this is usually internal, but
      conceptually it’s still the line where “host logic” stops and “radio
      implementation” begins.
    </p>

    <h3>Radio Baseband: Packet Framing and Modulation</h3>
    <p>
      The <strong>Packet Framer</strong> takes raw link-layer PDUs and wraps them into a
      BLE-compliant packet format:
      <code>[Preamble][Access Address][Header][Payload]</code>. Before bits go out,
      a <strong>Data Whitening</strong> block XORs the bitstream with a pseudorandom
      sequence from an LFSR, flattening the spectrum and avoiding long runs of 0s or 1s.
      A <strong>CRC Generator</strong> then computes and appends a 24-bit CRC so the
      receiver can detect transmission errors.
    </p>
    <p>
      The resulting bitstream feeds a <strong>GFSK Modulator</strong> that drives the
      2.4&nbsp;GHz carrier. A Gaussian filter smooths transitions, and an NCO (or
      equivalent numerically controlled oscillator) generates a phase-continuous
      waveform where:
    </p>
    <ul>
      <li>Bit <code>1</code> → carrier frequency shifted by <code>+Δf</code></li>
      <li>Bit <code>0</code> → carrier frequency shifted by <code>−Δf</code></li>
    </ul>
    <div style="text-align: center;">
      <img src="/images/vibra/gfsk.png" alt="gfsk" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    </div>
    

    <h3>Radio Timer, DMA, and State Machine</h3>
    <p>
      A dedicated <strong>Radio Timer</strong> plus <strong>EasyDMA</strong> and
      <strong>PPI/DPPI</strong> are what make BLE timing deterministic. The timer
      generates microsecond-precise events like <code>TX_START</code> and
      <code>TX_END</code>. PPI/DPPI connects these events directly to radio tasks so the
      hardware can start and stop transmissions without CPU intervention. EasyDMA streams
      packet bytes from packet RAM into the modulator (and vice versa) with near-zero CPU
      overhead. A small <strong>radio state machine</strong> orchestrates all of this:
      idle → TX → RX windows → back to idle or sleep.
    </p>

    <h3>Frequency Synthesizer (PLL)</h3>
    <p>
      The <strong>Frequency Synthesizer</strong> is a fractional-N PLL locked to the
      nRF52’s 16&nbsp;MHz crystal. It tunes the carrier to specific BLE channels
      (e.g. 2402&nbsp;MHz for channel 0) and applies the tiny frequency shifts
      required by the GFSK modulator. Precise PLL behavior is critical for staying
      within BLE’s spectral mask and for clean frequency hopping.
    </p>

    <h3>Hardware Transmission Chain</h3>
    <p>
      Once the RF waveform is generated, it runs through the analog front end:
    </p>
    <ul>
      <li><strong>Power Amplifier (PA):</strong> Boosts the RF signal to the configured
          transmit power.</li>
      <li><strong>Balun:</strong> Converts the differential RF outputs to a single-ended
          line and helps match impedance to 50&nbsp;Ω.</li>
      <li><strong>Matching Network:</strong> Fine-tunes impedance matching between the
          RF front end and the antenna for the operating band.</li>
      <li><strong>TX/RX Switch:</strong> Because the nRF52 uses a single antenna, a
          switch steers the RF path between transmit and receive modes.</li>
      <li><strong>Antenna:</strong> Radiates and receives the 2.4&nbsp;GHz electromagnetic
          waves that carry our packets.</li>
    </ul>
     <div style="text-align: center;">
      <img src="/images/vibra/hardware.png" 
          alt="hardware" 
          style="width: 85%; border-radius: 10px; margin-top: 10px;">
      <p style="font-size: 0.9rem; color: #666; margin-top: 8px;">
        RF front-end of the nRF52832 on the PCA10040 board, showing the matching network (C3/L1/C15),
        test connector (J1, Murata MM8130-2600), and PCB antenna feed. Note that our PA, switch and Balun are internal to the nrf52 ic.
      </p>
    </div>
    <hr>

    <details>
      <summary class="collapsible-summary"><strong>Key Terms (Dictionary)</strong></summary>
      
      <h3>Key Terms (Dictionary)</h3>
      <dl>
        <dt>GATT (Generic Attribute Profile)</dt>
        <dd>High-level API and schema for exposing data over BLE as attributes
            (services, characteristics, descriptors) that can be read, written, or
            notified.</dd>

        <dt>ATT (Attribute Protocol)</dt>
        <dd>Low-level protocol that defines how individual attributes are addressed and
            how PDUs for read, write, and notify are formatted and handled.</dd>

        <dt>L2CAP (Logical Link Control and Adaptation Protocol)</dt>
        <dd>Multiplexes multiple logical channels over a single BLE link, handles
            segmentation and reassembly of larger PDUs, and provides basic flow control.</dd>

        <dt>HCI (Host Controller Interface)</dt>
        <dd>Standardized command/event interface between the host stack and the
            controller, used to configure the radio and exchange data.</dd>

        <dt>PHY (Physical Layer)</dt>
        <dd>The layer that converts digital packets into RF waveforms on a given
            frequency band using an agreed modulation scheme (GFSK for BLE).</dd>

        <dt>GFSK (Gaussian Frequency Shift Keying)</dt>
        <dd>A modulation scheme where bits are encoded as small frequency shifts on a
            carrier, with a Gaussian filter applied to smooth transitions.</dd>

        <dt>Access Address</dt>
        <dd>A 32-bit field that identifies a particular BLE connection or advertising
            train and helps receivers lock onto the right packets.</dd>

        <dt>PDU (Protocol Data Unit)</dt>
        <dd>The basic unit of data exchanged at a given protocol layer, such as link
            layer PDUs or ATT PDUs.</dd>
      </dl>
    </details>


    <div style="margin-top: 50px;"></div>
    <h2>Planned Modifications</h2>
    <p>
      Most of the optimizations for this project will occur at the application layer, but I hope to dive deeper into the hardware to truly push the limits of my optimization.
    </p>

    <h3>1. Application Layer – From Test Packets to Audio Frames</h3>
    <p>
      The first goal is to replace the current fixed <code>PING</code> test payloads with real audio data frames.
      These frames will originate from an <strong>ADC-driven input</strong> on the transmitter board.
      At this layer, VIBRA will handle framing, compression, sequencing, and pacing —
      effectively building a custom, application-defined <strong>GATT audio service</strong> on top of the Bluetooth stack.
    </p>

    <h3>2. Audio Sampling and DMA Integration</h3>
    <p>
      On the transmitter, the nRF52’s 12-bit ADC will be triggered by a hardware timer and serviced by <strong>double-buffered DMA</strong>.
      Each buffer holds a few milliseconds of samples, allowing one buffer to fill while the other is encoded.
      This design guarantees continuous capture at ~8–10 kHz with no CPU latency jitter
      concepts discussed in the BLE architecture section.
    </p>

    <h3>3. Lightweight Audio Encoding</h3>
    <p>
      The captured PCM data will be compressed using a simple <strong>ADPCM or μ-law codec</strong>,
      reducing the bandwidth requirement enough to fit a single audio frame inside one BLE notification packet (≤ 20 bytes).
      This compression step sits entirely in software at the Application Layer, but directly influences how efficiently the
      <strong>L2CAP and ATT layers</strong> below can deliver data within each connection event.
    </p>

    <h3>4. Controlled BLE Transmission</h3>
    <p>
      Each encoded frame will be queued and sent during the next BLE connection event using <strong>bt_nus_client_send()</strong>.
      A hardware timer will align frame transmission precisely with the connection interval (e.g. 7.5 ms),
      minimizing inter-packet jitter.
    </p>

    <h3>5. Receiver Path – Jitter Buffer and Playback Control</h3>
    <p>
      The receiver will maintain a small <strong>jitter-adaptive FIFO</strong> to absorb packet arrival variance,
      tracking sequence numbers and timestamps attached to each frame.
      This buffer forms the interface between the BLE transport and the audio output subsystem,
      ensuring steady playback even when RF conditions fluctuate.
    </p>

    <h3>6. Audio Output and Hardware Synchronization</h3>
    <p>
      Decoded audio samples will be played through either <strong>PWM output</strong> or an external <strong>I²S DAC</strong>.
      Like the ADC, the playback engine will be fully DMA-driven and clocked by a hardware timer, closing the loop between capture and output.
    </p>
    <h3>7. Future Stack-Level Experiments</h3>
    <p>
      With the audio path stable, later experiments will target the lower layers again — exploring
      <strong>PHY mode switching (1M ↔ 2M)</strong>, <strong>connection interval negotiation</strong>,
      and <strong>custom GATT services</strong> for telemetry and command control. This will probably be hard
    </p>


  </details>
</section>


<section id="journal">
  <details>
    <summary class="collapsible-summary"><strong>Build Journal</strong></summary>


    <h2>Build Journal</h2>
    <p>
      This is a rolling log of work sessions. New entries are appended at the top.
    </p>

    <hr>

    <h3>2025-11-06 – First BLE Latency Measurement</h3>
    <ul>
      <li><strong>SDK &amp; toolchain setup:</strong> Finished bringing up nRF Connect SDK on Ubuntu 22.04 (west workspace, Zephyr toolchain) and verified the toolchain by building the stock <code>hello_world</code> sample.</li>

      <li><strong>Board bring-up &amp; blinky:</strong> Flashed a Zephyr <em>blinky</em> app to the nRF52 DK, confirmed a simple LED blink using the <code>DT_ALIAS(led0)</code> GPIO to prove GPIO + devicetree were wired correctly.</li>

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
  </details>
</section>
