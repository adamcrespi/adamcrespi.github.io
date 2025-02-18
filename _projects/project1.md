---
layout: single
title: "Jetson Orin Nano SLAM Robot"
permalink: /projects/project1/
description: "Jetson Orin Nano SLAM Robot"
image: /images/buger.jpg
---

 <div class="image-container">
    <img src="/images/orin.png" alt="Robot Schematic" style="width: 70%; border-radius: 10px; margin-top: 10px;">
    <p class="image-label">Figure 1: NVIDIA Jetson Orin Nano Dev Kit</p>
  </div>

<div class="toc-container">
  <div class="toc">
    <a href="#overview" class="toc-item">Project Goals</a>
    <a href="#robot-design" class="toc-item">The Design</a>
    <a href="#testing-and-results" class="toc-item">SLAM</a>
    <a href="#future-work" class="toc-item">CNN Insect Recognition</a>
    <a href="#future-work2" class="toc-item">The Flamethrower</a>
  </div>
</div>


<!-- Project Sections -->
<section id="overview">
  <h2>Project Goals</h2>
  <ul>
    <li>Become familar with the NVIDIA Jetson Orin Nano</li>
    <li>Gain experience with CNN image recognition on the Edge</li>
    <li>Learn how to use ROS2</li>
    <li>Learn Nvidia Isaac Sim</li>
    <li>Understand sensor fusion techniques and working with an IMU</li>
    <li>Develop familiarity with Lidar and the SLAM algorithm</li>
  </ul>
</section>

<section id="robot-design">
  <h2>Project Updates</h2>
  <ul>
    <li><del>Build chassis</del></li>
    <li><del>Get lidar working and integrated with ROS2</del></li>
    <li>Test movement and H-bridges</li>
    <li>Begin SLAM implementation</li>
    <li>Start implementing CNN, train CNN and test</li>
    <li>Add solenoid and supporting circuitry for butane release</li>
  </ul>

  <h2>February 18th Update</h2>
  <p>
   Over the last month, I've been slowly working on getting the movement functional. The NVIDIA Jetson Orin Nano dev kit is much more challenging to use than I anticipated. 

   It turns out on the Jetpack 6 SDK I was using, there was a bug on the dev kit where it was impossible to open the JetsonIO Configuration. A pretty ridiculous bug for a NVIDIA device.
   
   Once Jetback 6.2 came out at the end of Janaury, I resumed trying to drive my H-bridges. I set the pin as an output on JetsonIO and wrote a python script for cycling the pin between on and off. However, scoping the pin showed no cycling or change of state.
   Diving further into this, apparently NVIDIA requires you to generate a pinmux file for the bootloader, specific to the pins you want to control. This all seems like a crazy amount of work to simply toggle a GPIO pin, and has changed my opinion as a developer on NVIDIA in a negative way. It doesn't seem like the Jetson Orin Nano is designed
   for hobbyists or individuals.
   
   <img src="/images/jetso.png" alt="Robot Schematic" style="width: 100%; border-radius: 10px; margin-top: 10px;">

   Next steps:
   <ul>
    <li>Modify Pinmux spreadsheet and reflash Jetson SDK</li>
    <li>Pray that I can actually write a pin high</li>
  </ul>
   
  </p>
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
  padding: 20px 0; /* Optional: Adjust spacing above and below */
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
