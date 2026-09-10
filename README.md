# ⚾ Louisville Bats Challenge — Development Environment

This repository is your starter development environment for the **"Louisville Bats: Bring the ballpark to the browser"** challenge at HackKentucky 2026.

Sponsored by **Carter Davis & the Louisville Bats**, with partner tracks for **Google Gemini API** and **Vultr Cloud**.

---

## 🛠️ What's Set Up in This Environment

1. **Local Server (`server.js`)**:
   - Lightweight Node.js server with native HTTP and ES module support.
   - `/api/health`: Health status endpoint for local monitoring and Vultr load balancing.
   - `/api/gemini/generate`: Pre-configured proxy endpoint to call the Gemini API directly with your API key, avoiding CORS issues.
   - Static file server for the `public/` directory.

2. **Configuration & Keys**:
   - `.env.example` and `.env` template with slots for `GEMINI_API_KEY`, `VULTR_API_KEY`, and `PORT`.

3. **Cloud & Deployment Pipeline**:
   - `Dockerfile`: Multi-stage, production-ready Node 22 Alpine image.
   - `docker-compose.yml`: Standard container orchestration.
   - `scripts/deploy-vultr.sh`: Automated remote deployment script to push to a Vultr Cloud Compute VPS.
   - `vultr-deploy-guide.md`: Guide to claiming your $100 MLH Vultr credit and launching an instance.

4. **AI & Gemini Guides**:
   - `gemini-setup-guide.md`: Guide to claiming your student plan / $10 monthly credits or Google AI Studio key.
   - `mlh-hackathon-guide.md`: Alignment with all three prize tracks (Louisville Bats, Gemini API, Vultr).

5. **Clean Canvas**:
   - `public/`: Starter front-end displaying environment status and a Gemini API connection tester, ready for you to build your game when you are ready.

---

## 🚀 Running the Local Environment

```bash
# Navigate to project
cd ~/.gemini/users/user1/road-to-the-bats

# Start server
npm start
# or auto-reload on changes:
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the environment dashboard and test your Gemini API connection.
