---
layout: single
title: "UBC Engineering Physics Summer Robot Competition"
permalink: /projects/project2/
description: "Designing autonomous robots to serve burgers."
image: /images/buger.jpg
---

<div style="display: flex; justify-content: center; align-items: center; height: 65vh;">
  <div style="width: 400px; height: 400px; overflow: hidden; border-radius: 10px; display: flex; justify-content: center; align-items: flex-start;">
    <img src="/images/pov.gif" alt="Project Overview" style="width: 100%; height: auto; transform: translateY(-33%);">
  </div>
</div>


<div class="toc-container">
  <div class="toc">
    <a href="#overview" class="toc-item">The Competition</a>
    <a href="#robot-design" class="toc-item">Our Design</a>
    <a href="#testing-and-results" class="toc-item">The Software</a>
    <a href="#future-work" class="toc-item">The Electrical</a>
    <a href="#future-work2" class="toc-item">The Mechanical</a>
    <a href="#future-work3" class="toc-item">Results and Reflection</a>
  </div>
</div>



<!-- Project Sections -->
<section id="overview">
  <h2>The Competition</h2>
  <p>
The UBC Engineering Physics Summer Robot Competition is a yearly event that challenges second year Engineering Physics students to create autonomous robots capable of solving complex challenges. This year, the competition was based on the video game Overcooked. For the first time, students were challenged to design and build two autonomous robots that work together to complete intricate cooking tasks. The robots must navigate between stations, picking up ingredients and assembling and plating dishes like burgers, fries, and salads, all within a tight two-minute timeframe. 
  </p>
  <img src="/images/rgifr.gif" alt="Project Overview" style="width: 70%; border-radius: 10px; margin-top: 10px;">
</section>
<p> 
  We had 6 weeks to fully design and build these robots from scratch. My team spent upwards of 10 hours in the lab daily for these 6 weeks to develop 2 robots that we were proud of.
</p>

<img src="/images/robots.jpg" alt="Robot Design" style="width: 70%; border-radius: 10px; margin-top: 10px;">

<section id="robot-design">
  <h2>Our Design</h2>
  <p> To design two fully autonomous robots in just under 6 weeks, we needed to be keep time management at the forefront of our design process. We ensured that both robots should be as similar as possible to minimize new design and troubleshooting. We also chose to use the walls of the play area for alignment, rather than using PID to stay on the centre line. These two design decisions ended up being very smart project management moves, and we were one of only 5 teams to have two fully functional robots. </p>
  <p> See a list of our components below</p>
  <ul>
    <li><b>Mechanum Wheels</b> - For omnidirectional movement</li>
    <li><b>HBridges</b> - For controlling the direction and speed of motors</li>
    <li><b>DC Motors</b> - Provide rotational power for movement</li>
    <li><b>Voltage Regulators</b> - Ensure stable voltage supply to components</li>
    <li><b>LiPo Batteries</b> - High-density rechargeable power source</li>
    <li><b>Rotary Encoders</b> - Measure distance sweeper and elevator move</li>
    <li><b>Micro Switches</b> - Used as limit switches </li>
    <li><b>ESP32</b> - Brain of the system </li>
    <li><b>Reflectance Sensors</b> - For line alignment</li>
  </ul>
</section>

<section id="testing-and-results">
  <h2>The Software</h2>
  <p>
  The software for our robots was built around a state-machine architecture, enabling precise control over the sequential tasks each robot needed to perform. This approach allowed us to handle complex behaviors such as navigating to stations, picking up ingredients, and assembling burgers.   Reflectance sensors were used for alignment, while rotary encoders tracked the distance traveled to maintain accuracy. This combination of modular software design and robust sensor integration made it possible to achieve consistent and reliable performance during the competition.
  <img src="/images/fail.gif" alt="Robot Design" style="width: 70%; border-radius: 10px; margin-top: 10px;"> <br>

Our state-machine architecture required a lot of trial and error to get working.... <br> <br>
Most problems arose when trying to optimize our robot for speed. For example, when trying to extend the arm and spin between counters at the same time. Our system was fundamentally not designed to do this, and getting it to work perfectly required a lot of tweaking. <br> <br>
In retrospect using an RTOS would have been a much more efficent approach, as we could have had a much easier time concurrently executing the tasks, and even utilized the ESP32s dual cores.

  See the full codebase on github here : 
    
  </p>
</section>

<section id="future-work">
  <h2>The Hardware</h2>
  <img src="/images/topbot.jpg" alt="Testing and Results" style="width: 80%; border-radius: 10px; margin-top: 10px;">
  <img src="/images/botbot.jpg" alt="Testing and Results" style="width: 80%; border-radius: 10px; margin-top: 10px;">
  
  <p>
  encoders, debouncing circuits
  esp32 boards with jst connectors
  <img src="/images/toppin.jpg" alt="Testing and Results" style="width: 100%; border-radius: 10px; margin-top: 10px;">
  hbridge pcbs
  power system and lipos 
  </p>
  <img src="/images/espboard.jpg" alt="Future Work" style="width: 600%; border-radius: 10px; margin-top: 10px;">
</section>

<section id="future-work2">
  <h2>The Mechanical</h2>
  <img src="/images/plate.gif" alt="Robot Design" style="width: 70%; border-radius: 10px; margin-top: 10px;">
  <img src="/images/waterjet.jpg" alt="Robot Design" style="width: 70%; border-radius: 10px; margin-top: 10px;">
  <p>
  chassis
  sweeper
  elevator
  gif of almost snapping the sweeper arm
  </p>
  <img src="/images/almostbreak.gif" alt="Future Work" style="width: 85%; border-radius: 10px; margin-top: 10px;">
</section>

<section id="future-work3">
  <h2>Results and Reflection</h2>
  <p>Future improvements include refining the object classification model and enhancing the mechanical systems for faster serving times.</p>
  <img src="/images/buger.jpg" alt="Future Work" style="width: 100%; border-radius: 10px; margin-top: 10px;">

  <p>See some of the news coverage on the event here</p>
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
