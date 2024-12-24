---
layout: single
title: "Jetson Orin Nano SLAM Robot"
permalink: /projects/project1/
description: "Jetson Orin Nano SLAM Robot"
image: /images/buger.jpg
---

<div style="display: flex; justify-content: center; align-items: center; height: 65vh;">
  <div style="width: 400px; height: 400px; overflow: hidden; border-radius: 10px; display: flex; justify-content: center; align-items: flex-start;">
    <img src="/images/pov.gif" alt="Project Overview" style="width: 100%; height: auto; transform: translateY(-33%);">
  </div>
</div>


<div class="toc-container">
  <div class="toc">
    <a href="#overview" class="toc-item">Project Goals</a>
    <a href="#robot-design" class="toc-item">The Design</a>
    <a href="#testing-and-results" class="toc-item">SLAM</a>
    <a href="#future-work" class="toc-item">CNN Insect Recognition</a>
    <a href="#future-work" class="toc-item">The Flamethrower</a>
  </div>
</div>


<!-- Project Sections -->
<section id="overview">
  <h2>Project Goals</h2>
  <ul>
    <li>Become familar with the NVIDIA Jetson Orin Nano</li>
    <li>Gain experience with CNN image recognition on the Edge</li>
    <li>Learn how to use ROS2</li>
    <li>Understand sensor fusion techniques and working with an IMU</li>
    <li>Develop familiarity with Lidar and the SLAM algorithm</li>
  </ul>
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
