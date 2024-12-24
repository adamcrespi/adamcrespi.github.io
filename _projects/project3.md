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


   
  </p>
  
  <div class="image-container">
    <img src="/images/schematic.png" alt="Robot Schematic" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 1: PCB Layout</p>
  </div>

<h2>Key Components</h2>
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
  <p>assisted pick and place</p>

   <div class="image-container">
      <img src="/images/pickn.JPG" alt="Robot Design" style="width: 40%; border-radius: 10px; margin-top: 10px;">
      <img src="/images/pickn2.jpg" alt="Robot Design" style="width: 40%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 3: Assisted Pick and Place</p>
  </div>
 <p>design verification testing</p>
     <div class="image-container">
        <img src="/images/dv.JPG" alt="Testing and Results" style="width: 40%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 4: Design Verification</p>
  </div>
</section>

<section id="The_Software">
  <h2>The Software</h2>
  <p>Future improvements include refining the object classification model and enhancing the mechanical systems for faster serving times.</p>
  <img src="/images/softwareDiagram.jpg" alt="Future Work" style="width: 100%; border-radius: 10px; margin-top: 10px;">
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
