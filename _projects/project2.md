---
layout: single
title: "UBC Engineering Physics Summer Robot Competition"
permalink: /projects/project2/
description: "Designing autonomous robots to serve burgers."
image: /images/buger.jpg
---

<div class="toc-container">
  <div class="toc">
    <a href="#overview" class="toc-item">Overview</a>
    <a href="#robot-design" class="toc-item">Robot Design</a>
    <a href="#testing-and-results" class="toc-item">Testing and Results</a>
    <a href="#future-work" class="toc-item">Future Work</a>
    <a href="#future-work" class="toc-item">five</a>
    <a href="#future-work" class="toc-item">six</a>
  </div>
</div>

<img src="/images/pov.gif" alt="Project Overview" style="width: 100%; border-radius: 10px; margin-top: 10px;">
<!-- Project Sections -->
<section id="overview">
  <h2>Overview</h2>
  <p>This project involves designing autonomous robots to serve burgers as part of the UBC Engineering Physics Summer Robot Competition.</p>
  <img src="/images/robots.jpg" alt="Project Overview" style="width: 100%; border-radius: 10px; margin-top: 10px;">
</section>

<section id="robot-design">
  <h2>Robot Design</h2>
  <p>The robots were designed with custom-built navigation and object recognition systems. The design process included CAD modeling, 3D printing, and extensive prototyping.</p>
  <img src="/images/buger.jpg" alt="Robot Design" style="width: 100%; border-radius: 10px; margin-top: 10px;">
</section>

<section id="testing-and-results">
  <h2>Testing and Results</h2>
  <p>Robust testing procedures ensured the robots performed reliably under competition conditions. Highlights include precise navigation and accurate burger-serving mechanisms.</p>
  <img src="/images/buger.jpg" alt="Testing and Results" style="width: 100%; border-radius: 10px; margin-top: 10px;">
</section>

<section id="future-work">
  <h2>Future Work</h2>
  <p>Future improvements include refining the object classification model and enhancing the mechanical systems for faster serving times.</p>
  <img src="/images/buger.jpg" alt="Future Work" style="width: 100%; border-radius: 10px; margin-top: 10px;">
</section>

<section id="five">
  <h2>Future Work</h2>
  <p>Future improvements include refining the object classification model and enhancing the mechanical systems for faster serving times.</p>
  <img src="/images/buger.jpg" alt="Future Work" style="width: 100%; border-radius: 10px; margin-top: 10px;">
</section>

<section id="six">
  <h2>Future Work</h2>
  <p>Future improvements include refining the object classification model and enhancing the mechanical systems for faster serving times.</p>
  <img src="/images/buger.jpg" alt="Future Work" style="width: 100%; border-radius: 10px; margin-top: 10px;">
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
  font-size: 12px; /* Set font size */
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
