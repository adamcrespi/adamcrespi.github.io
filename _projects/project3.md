---
layout: single
title: "Neural Network Lighting"
permalink: /projects/project3/
description: "Lighting"
image: /images/buger.jpg
---

 <img src="/images/nn3dphoto.png" alt="Project Overview" style="width: 100%; border-radius: 10px; margin-top: 10px;">

<p>The Neural Network-Based Reactive Lighting System is an intelligent lighting solution designed to respond to verbal commands. Using an ESP32 S3 microcontroller with FreeRTOS, the system enables concurrent audio processing and LED control. A neural network trained in TensorFlow Lite interprets verbal commands to dynamically adjust lighting settings. To optimize the system's compactness, a custom PCB was designed, integrating the ESP32 S3, an I2S microphone, and supporting components. </p>


<div class="toc-container">
  <div class="toc">
    <a href="#Project_Goals" class="toc-item">Project Goals</a>
    <a href="#PCB_Design" class="toc-item">PCB Design</a>
    <a href="#PCB_Assembly" class="toc-item">PCB Assembly</a>
    <a href="#The_Software" class="toc-item">The Software</a>
  </div>
</div>

<!-- Project Sections -->
<section id="Project_Goals">
  <h2>Project Goals</h2>
  <ul>
    <li>Learn PCB design with KiCad and create a PCB with an embedded MCU</li>
    <li>Apply digital signal processing techniques to address practical, real-world challenges</li>
    <li>Gain experience with Edge AI and the challenges of resource constrained machine learning</li>
    <li>Develop proficiency in FreeRTOS for real-time operating systems</li>
  </ul>
</section>


<section id="PCB_Design">
  <h2>PCB Design</h2>
  <p>
The PCB design for the system brings together all the essential components in a compact and functional layout. Using KiCad, the design was created to fit the ESP32 S3 microcontroller, MEMS I2S microphone, power regulation circuits, and other supporting parts. The goal was to ensure the design was simple, reliable, and efficient, with clean connections and proper spacing to avoid signal issues. Power is provided via a micro USB port with another micro USB port for flashing the ESP.
  </p>
  
  <div class="image-container">
    <img src="/images/schematic.png" alt="Robot Schematic" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 1: PCB Layout</p>
  </div>

<h3>Key Components</h3>
<p>The PCB design integrates the following critical components:</p>
  <ul>
  <li>
    <strong>ESP32 S3 Microcontroller</strong>: Acts as the main processor, handling neural network inference, 
    audio signal processing, and LED control with its dual-core architecture and advanced AI capabilities.
  </li>
  <li>
    <strong>MEMS I2S Microphone (SPH0645LM4H-B)</strong>: Captures high-fidelity audio input for verbal 
    command recognition, offering digital output directly compatible with the ESP32's I2S interface.
  </li>
  <li>
    <strong>LM3940 Voltage Regulator</strong>: Provides a stable 3.3V supply for the ESP32 and other onboard 
    components, ensuring consistent operation under varying power conditions.
  </li>
  <li>
    <strong>Ceramic Capacitors (CL21A106KOQNNNE)</strong>: Used for power line filtering and signal 
    decoupling, reducing noise and improving stability.
  </li>
</ul>

  <div class="image-container">
    <img src="/images/allComs_page-0001.jpg" alt="Communication System Diagram" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 2: Schematic</p>
  </div>
</section>

<section id="PCB_Assembly">
  <h2>PCB Assembly</h2>
  <p>Components were ordered through Digikey and boards through JLCPCB. A stencil was also used for ease of assembly in applying the solder paste. The board was assembled using an assisted pick and place machine courtesy of the UBC Engineering Physics project lab. </p>

   <div class="image-container">
      <img src="/images/pickn.JPG" alt="Robot Design" style="width: 40%; border-radius: 10px; margin-top: 10px;">
      <img src="/images/pickn2.jpg" alt="Robot Design" style="width: 40%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 3: Assisted Pick and Place</p>
  </div>
  
 <p> After assembly, the board was reflowed in a reflow oven and design verification was performed. I did continuity testing across components and traces, specifically focusing on some of the resistors I accidentally bought in 400 size. </p>
  <div class="image-container">
        <img src="/images/dv.JPG" alt="Testing and Results" style="width: 40%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 4: Design Verification</p>
  </div>

<p>After assembly, for my first test an issue arose with the switches due to an incorrect footprint in the PCB design. This error caused the switches to short the power supply, resulting in the PCB getting hot. To resolve the problem, a quick fix was implemented by manually soldering a switch to the side of the board.</p>

<p>After all this, the PCB was fully functional</p>

  <div class="image-container">
        <img src="/images/firston.jpg" alt="Testing and Results" style="width: 40%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 5: Fully functional PCB on second test</p>
  </div>
  
</section>

<section id="The_Software">
  <h2>The Software</h2>
  <p>
   The software integrates audio processing, signal analysis, and machine learning. Using the ESP32 S3 microcontroller with FreeRTOS, the system handles audio data from an I2S MEMS microphone. Key steps include framing, windowing, and Fourier Transform to extract features, which are then processed by a TensorFlow Lite neural network to adjust LED patterns in real time. 
  </p>
  <div class="image-container">
        <img src="/images/softwareDiagram.jpg" alt="Testing and Results" style="width: 65%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 6: Software Diagram</p>
  </div>

  <h3>FreeRTOS</h3>
  <p>
   The system relies on FreeRTOS to handle the simultaneous tasks required for real-time audio processing. One FreeRTOS task manages the reception of I2S data from the MEMS microphone, efficiently storing the audio data into a circular buffer. This ensures smooth data flow and prevents any loss of audio frames during processing. The second core can then focus on the digital signal processing and inference. A circular buffer is used to prevent race conditions from concurrent actions to the same memory. For my implementation, I simply assigned one of the ESP32s dual cores to each task.
  </p>

  <div class="image-container">
        <img src="/images/i2scap.png" alt="Testing and Results" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 7: FreeRTOS I2S Capture Task</p>
  </div>

  <p> After finishing this project, I also learned that I2S for the ESP32 S3 has Direct Memory Access(DMA). This means that pushing the data from the MEMS microphone into the circular buffer doesn't require much CPU compute, and a task just for storing the data is not really necessary. If I were to redo this, I could break up the digital signal processing into tasks to be split across cores. However, I would have to be more careful with race conditions.</p>

  <h3>Signal Processing</h3>
  <p> The signal processing pipeline involves several key steps to transform raw audio data into a spectrogram suitable for neural network inference. We will take a sine wave input signal to see this process.</p>
    <div class="image-container">
        <img src="/images/1raw.png" alt="Testing and Results" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 8: Raw Sine Wave Input</p>
  </div>
  
  <h4>Sampling</h4>
  <p> Sampling involves capturing raw audio data at discrete time intervals to convert the continuous signal into digital form. In this case, a sine wave is sampled at regular intervals to create a digital representation. .</p>
    <div class="image-container">
        <img src="/images/1frame.png" alt="Testing and Results" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 9: Sampled Sine Wave</p>
  </div>
  
  <h4>Windowing</h4>
  <p> After sampling, the signal is divided into smaller frames of fixed length. These sampled frames also overlap by 50% to ensure no information is lost. I chose frames of 256 samples for compatability with the neural network. To reduce spectral leakage, each frame is multiplied by a window function (e.g., Hann window), which tapers the signal values at the edges to zero. This ensures that transitions between frames are smooth and minimizes distortion in the frequency domain.</p>
    <div class="image-container">
        <img src="/images/1window.png" alt="Testing and Results" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 10: Windowed Sine Wave</p>
  </div>
  
  <h4>FFT</h4>
  <p>Once the windowing is applied, the Fast Fourier Transform (FFT) is performed on each frame to transform the signal from the time domain to the frequency domain. The FFT breaks down the signal into its constituent frequencies, providing insight into the amplitude of each frequency component within the frame. </p>
    <div class="image-container">
        <img src="/images/1fft.png" alt="Testing and Results" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 11: Sine Wave in the Frequency Domain</p>
  </div>
  <h4>Spectrogram</h4>
  <p> Finally, the magnitude of the FFT results is extracted to generate a spectrogram. The spectrogram is a visual representation of how the signal's frequency content changes over time, displayed as a 2D image where the x-axis represents time, the y-axis represents frequency, and the color intensity indicates amplitude. This spectrogram serves as the input for the neural network to make inferences. </p>
    <div class="image-container">
        <img src="/images/1spectro.png" alt="Testing and Results" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 12: Final Spectrogram</p>
  </div>
  
  <h3>Inference</h3>
  <p> The inference phase involves utilizing a neural network to analyze spectrograms and classify them into one of eight predefined categories based on spoken words </p>
  <h4> Prepping Input Tensor </h4>
  <p> Before the spectrogram can be fed into the neural network, it needs to be preprocessed into a compatible input tensor format. The spectrogram is resized to 128x128 to match the input layer dimensions of the model. Additionally, normalization is applied to scale the data values between 0 and 1, ensuring consistency across inputs and improving the model's convergence during training. </p>
  <h4> The Model Itself </h4>
  <p> The model was trained using on Google Colab on a set of spectrograms from Google’s mini Speech Commands dataset. Optimization techniques like pruning and quantization were applied to reduce the model's size and adapt it for deployment onto the ESP32 S3. I managed to compress my final model down to 5MB.</p>
    <div class="image-container">
        <img src="/images/exampleSpecs.png" alt="Testing and Results" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 13: Spectrograms of Words</p>
  </div>



<h3>Conclusion</h3>
  <p> This project successfully combined AI, signal processing, and embedded systems to create a responsive solution. Using the ESP32 S3 and a custom PCB, the project achieved real-time performance and met its goals. See the final product below, responding to my stop command.  </p>
  
   <div class="image-container">
        <img src="/images/realgif.gif" alt="Testing and Results" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 14: Final Product</p>
  </div>


</section>

<style>
/* Table of Contents Styling */
.toc-container {
  background-color: #f4f4f4;
  padding: 10px;
  text-align: center;
  margin-bottom: 20px;
}

.toc {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.toc-item {
  display: inline-block;
  text-align: center;
  cursor: pointer;
  text-decoration: none;
  color: #333;
  font-size: 16px;
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.toc-item:hover {
  background-color: #007acc;
  color: #fff;
  transform: scale(1.05);
}

/* Section Styling */
section {
  padding: 10px 0; /* Optional: Adjust spacing above and below */
  margin: 20px 0; /* Optional: Add vertical spacing between sections */
  font-family: 'Arial', sans-serif; /* Optional: Set font family */
  font-size: 14px; /* Set font size */
  line-height: 1.6; /* Improve text readability */
  color: #333; /* Text color */
  border: none; /* Remove borders */
  background-color: transparent; /* Remove background color */
}



section img {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
}

/* Heading Styling */
section h2 {
  margin-bottom: 20px;
  color: #333;
}

/* Smooth Scroll */
a[href^="#"] {
  text-decoration: none;
}


.image-container {
  text-align: center; /* Center the image and label */
  margin-bottom: 20px; /* Add spacing between images */
}

.image-label {
  font-size: 14px; /* Adjust font size for the label */
  color: #666; /* Optional: Set a muted text color */
  margin-top: 5px; /* Add spacing above the label */
}

</style>

<script>
  /* Smooth Scroll Script */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
</script>
