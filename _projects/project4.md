---
layout: single
title: "Machine Learning Driving"
permalink: /projects/project4/
description: ""
image: /images/buger.jpg
---

<!-- Project Sections -->
<section id="The Competition">
  <h2>Gallery</h2>

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
