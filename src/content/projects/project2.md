---
title: "Eng Phys Robot Competition"
year: 2023
spec: "ENPH 253 · autonomous burger-serving robots"
summary: "Two autonomous robots built in six weeks for UBC's Engineering Physics Robot Competition, themed on the video game Overcooked."
cover: "/images/burgergif.gif"
order: 2
---

The **UBC Engineering Physics Summer Robot Competition** is a yearly event that challenges second-year Eng Phys students to design and build autonomous robots from scratch in six weeks. Our year's theme was based on the video game *Overcooked*: two robots working together to navigate between stations, pick up ingredients, and assemble and plate burgers, fries, and salads — all within a two-minute run.

![Robot in motion](/images/pov.gif)

## The Competition

For the first time, the competition required two cooperative autonomous robots instead of one. They had to coordinate station visits without collision, handle ingredient pickup and drop-off, and complete as many dishes as possible in the time limit.

My team spent upwards of 10 hours in the lab daily for six weeks.

![Our two robots](/images/robots.jpg)

## Our Design

**Locomotion:** Both robots used DC motors with encoder feedback and a PID loop for straight-line tracking. Navigation used a combination of IR tape-following and dead-reckoning between stations.

**Pickup mechanism:** A servo-actuated claw handled ingredient pickup. Sensing was done with infrared proximity detectors for station alignment.

**Inter-robot coordination:** The two robots communicated over IR to sequence their station visits and avoid conflicts at shared pickup zones.

**Electrical:** Custom PCB with an STM32 microcontroller, motor drivers, and sensor conditioning. Power came from a 3S LiPo with onboard regulation.

## Software

The control loop ran bare-metal on the STM32. A finite state machine handled the competition sequence: navigate to station, align, pick up, navigate to assembly zone, deposit. IR tape-following used a PID controller tuned for the competition floor surface.

## Results

![Competition run](/images/burgergif.gif)

Our robots successfully completed full runs in testing and placed competitively in the final. The project was a deep dive into the full hardware-software stack — from PCB layout to control theory to real-time firmware — under a hard six-week deadline.
