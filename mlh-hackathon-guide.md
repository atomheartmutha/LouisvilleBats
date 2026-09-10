# 🏆 MLH HackKentucky: Tracks & Judging Alignment Guide

This document maps the **Road to the Bats** project against all three target tracks for the hackathon.

---

## Track 1: Louisville Bats Sponsor Challenge
**"Bring the ballpark to the browser"**  
**Sponsor:** Carter Davis, Louisville Bats  
**Prize:** 10 tickets to a Bats game on September 13 + 5 Bats swag bags  

### Challenge Problem:
- Printed kids' activity books at Louisville Slugger Field have declined in usage.
- Seasonal print order sizes are difficult to estimate, leading to waste or shortages.
- The Bats want to drive traffic to `batsbaseball.com` and provide interactive entertainment for kids at the stadium and at home.

### How "Road to the Bats" Solves This:
1. **Zero-Friction In-Stadium Access:** Fans scan a QR code on concourse signs, programs, or cups to play immediately in their phone's browser with no app store download.
2. **Modern Interactive Entertainment:** Replaces static paper coloring/puzzles with an arcade batting derby, jersey customizer, and trivia games.
3. **Educational Math Progression:** Based on fan research, kids power up their hits by solving baseball math (batting averages, runs, probability) and progress from T-ball to the Triple-A Louisville Bats.
4. **Brand Loyalty & Mascot Integration:** Features beloved mascot **Buddy Bat**, Louisville Slugger Field landmarks (outfield wall, Ohio River), and customizable Reds-affiliated team uniforms.
5. **Website Traffic Driver:** Easily embeddable as an `<iframe>` or web component directly into the official `batsbaseball.com` youth fan club section.

---

## Track 2: Best Use of Google Gemini API
[MLH Partner: Gemini](https://www.mlh.com/partners/gemini)

### Integration Highlights:
- **Buddy Bat AI Coach:** Real-time conversational guidance and positive reinforcement.
- **Dynamic Math Power-Ups:** Dynamically generated math word problems adapting to the child's age group (Ages 5-8, 9-11, 12+).
- **Stadium Announcer Audio/Text:** Electric play-by-play reactions to game events.
- **Rookie Card AI Scout:** Personalized baseball card scouting report for every kid.

---

## Track 3: Best Use of Vultr Cloud
[MLH Partner: Vultr](https://www.mlh.com/partners/vultr)

### Integration Highlights:
- **Cloud Compute Hosting:** Deployed on Vultr Cloud Compute VPS in close geographic proximity (Atlanta / Chicago) for minimum latency.
- **Containerized Architecture:** Production-ready `Dockerfile` and `docker-compose.yml`.
- **Automated Deployment:** Custom `./scripts/deploy-vultr.sh` bash script.
- **Scalability for In-Stadium Spikes:** Designed to handle thousands of concurrent fans scanning the QR code during inning breaks.
