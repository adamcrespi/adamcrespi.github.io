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
      <img src="/images/linkedFILM.jpg" alt="Project 1" class="static-image">
      <img src="/images/linkedFILM-hover.gif" alt="Project 1 GIF" class="hover-image">
    </div>
    <h3>Project 1</h3>
    <p>Brief description of Project 1. <a href="/projects/project1/">Learn More</a></p>
  </div>
  <div class="project">
    <div class="image-container">
      <img src="/images/buger.jpg" alt="Project 2" class="static-image">
      <img src="/images/burgergif.gif" alt="Project 2 GIF" class="hover-image">
    </div>
    <h3>Burger Bots</h3>
    <p>UBC Engineering Physics Summer Robot Compettetion  <a href="/projects/project2/">Learn More</a></p>
  </div>
  <div class="project">
    <div class="image-container">
      <img src="/images/linkedFILM.jpg" alt="Project 3" class="static-image">
      <img src="/images/linkedFILM-hover.gif" alt="Project 3 GIF" class="hover-image">
    </div>
    <h3>Project 3</h3>
    <p>Brief description of Project 3. <a href="/projects/project3/">Learn More</a></p>
  </div>
  <div class="project">
    <div class="image-container">
      <img src="/images/linkedFILM.jpg" alt="Project 4" class="static-image">
      <img src="/images/linkedFILM-hover.gif" alt="Project 4 GIF" class="hover-image">
    </div>
    <h3>Project 4</h3>
    <p>Brief description of Project 4. <a href="/projects/project4/">Learn More</a></p>
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
