---
title: "Autonomous Driving Competition"
year: 2023
spec: "CNNs · drone control · computer vision"
summary: "CNN-based image classification for autonomous drone control in a sign-following competition."
order: 3
---

<section id="The Competition">
  <h2 style="text-align: center;">Gallery</h2>
  <div class="gif-grid">
    <div class="gif-item">
      <img src="/files/last.gif" alt="Competition Scene 1">
    </div>
    <div class="gif-item">
      <img src="/files/sign5.gif" alt="Competition Scene 2">
    </div>
    <div class="gif-item">
      <img src="/files/sign6.gif" alt="Competition Scene 3">
    </div>
    <div class="gif-item">
      <img src="/files/blackwhitesigns.gif" alt="Competition Scene 4">
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
      <a href="/files/Adam_Jordan_353_Final_Report.pdf" target="_blank" style="color: #007acc; text-decoration: none; font-weight: bold;">
        Download the Full Report (PDF)
      </a>
    </p>
  </div>
</section>

<style>
.gif-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.gif-item {
  width: 100%;
  height: 150px;
  overflow: hidden;
  border-radius: 10px;
  position: relative;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  transition: transform 0.3s ease, z-index 0.3s ease;
}
.gif-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.gif-item:hover {
  transform: scale(1.7);
  z-index: 10;
}
.gif-item:hover img {
  transform: scale(1.7);
}
</style>
