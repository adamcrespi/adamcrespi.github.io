---
layout: single
title: "Machine Learning Driving"
permalink: /projects/project4/
description: ""
image: /images/buger.jpg
---

<!-- Project Sections -->
<section id="The Competition">
  <h2 style="text-align: center;">Gallery</h2>
  <div class="gif-bar">
    <div class="gif-item">
      <img src="/images/almostbreak.gif" alt="Competition Scene 1">
    </div>
    <div class="gif-item">
      <img src="/images/almostbreak.gif" alt="Competition Scene 2">
    </div>
    <div class="gif-item">
      <img src="/images/almostbreak.gif" alt="Competition Scene 3">
    </div>
    <div class="gif-item">
      <img src="/images/almostbreak.gif" alt="Competition Scene 4">
    </div>
    <div class="gif-item">
      <img src="/images/almostbreak.gif" alt="Competition Scene 5">
    </div>
  </div>
</section>

<section id="Final Report">
  <h2>Read the final report for this project below</h2>
  <div style="text-align: center; margin-top: 20px;">
    <iframe 
      src="/files/Adam_Jordan_353_Final_Report.pdf" 
      width="100%" 
      height="800px" 
      style="border: none; border-radius: 10px;">
    </iframe>
    <p style="margin-top: 10px;">
      <a href="/files/final_report.pdf" target="_blank" style="color: #007acc; text-decoration: none; font-weight: bold;">
        Download the Full Report (PDF)
      </a>
    </p>
  </div>
</section>



<style>
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

.gif-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px auto;
  padding: 10px;
}

.gif-item {
  width: 150px; /* Adjust for desired size */
  height: 150px; /* Adjust for desired size */
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  position: relative;
}

.gif-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gif-item:hover img {
  transform: scale(1.2);
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
