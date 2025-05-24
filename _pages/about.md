---
permalink: /
title: "Projects"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

<div class="masonry">
  <div class="project">
    <div class="image-container">
      <img src="/images/WIP.jpg" alt="Project 1 GIF" class="hover-image">
      <img src="/images/WIP.jpg" alt="Project 1 GIF" class="hover-image">
    </div>
    <h3> SLAM Insect Detection Robot </h3>
    <p> <a href="/projects/project1/">SLAM-enabled navigation and CNN-driven insect detection using Jetson Orin Nano</a></p>
  </div>
  <div class="project">
    <div class="image-container">
      <img src="/images/buger.jpg" alt="Project 2" class="static-image">
      <img src="/images/burgergif.gif" alt="Project 2 GIF" class="hover-image">
    </div>
    <h3>UBC Engineering Physics Summer Robot Competition </h3>
    <p> <a href="/projects/project2/">Designing autonomous robots to serve burgers</a></p>
  </div>
  <div class="project">
    <div class="image-container">
      <img src="/images/nn4.JPG" alt="Project 3" class="static-image">
      <img src="/images/realgif.gif" alt="Project 3 GIF" class="hover-image">
    </div>
    <h3>Neural Network Based Reactive Lighting System</h3>
    <p> <a href="/projects/project3/"> Edge AI with the ESP32 S3 </a></p>
  </div>
  <div class="project">
    <div class="image-container">
      <img src="/images/dronepic.jpg" alt="Project 4" class="static-image">
      <img src="/files/fkll.gif" alt="Project 4 GIF" class="hover-image">
    </div>
    <h3>Autonomous Driving Competition</h3>
    <p> <a href="/projects/project4/">CNNs and Drone Control</a></p>
  </div>
</div>

<style>
/* Masonry Layout */
.masonry {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding: 20px;
}

/* Individual Project */
.project {
  position: relative;
  width: 350px; /* Adjust for square layout */
  border-radius: 10px;
  overflow: hidden;
  text-align: center;
  background-color: #f9f9f9;
  padding: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Image Container */
.image-container {
  position: relative;
  width: 100%;
  height: 250px; /* Enforce square layout */
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Show Static Image by Default */
.static-image {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  opacity: 1;
}

/* Hide Hover Image by Default */
.hover-image {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  opacity: 0;
}

/* Show Hover Image on Hover */
.image-container:hover .static-image {
  opacity: 0;
}

.image-container:hover .hover-image {
  opacity: 1;
}

/* Add Zoom Effect on Hover */
.image-container:hover img {
  transform: scale(1.05);
}

/* Title and Description */
.project h3 {
  margin: 10px 0;
  font-size: 18px;
  color: #333;
}

.project p {
  font-size: 14px;
  color: #666;
}

/* Link Styling */
.project a {
  color: #007acc;
  text-decoration: none;
}

.project a:hover {
  text-decoration: underline;
}
</style>
