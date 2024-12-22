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
      <img src="/images/linkedFILM.jpg" alt="Project 2" class="static-image">
      <img src="/images/linkedFILM-hover.gif" alt="Project 2 GIF" class="hover-image">
    </div>
    <h3>Project 2</h3>
    <p>Brief description of Project 2. <a href="/projects/project2/">Learn More</a></p>
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
  width: 300px;
  animation: float 6s ease-in-out infinite;
  border-radius: 10px;
  overflow: hidden;
  text-align: center;
  background-color: #f9f9f9;
  padding: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Image Container for Hover Effect */
.image-container {
  position: relative;
  width: 100%;
  height: auto;
}

.image-container img {
  width: 100%;
  height: auto;
  border-radius: 10px;
  transition: opacity 0.3s ease;
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

/* Floating Animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
