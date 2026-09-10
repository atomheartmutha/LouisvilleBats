# ☁️ Vultr Cloud Deployment Guide: "Road to the Bats"

This guide walks you through deploying the **Road to the Bats** web game on [Vultr Cloud Compute](https://www.mlh.com/partners/vultr) using your MLH hackathon credits.

---

## 1. Claim Your $100 MLH Vultr Credits
1. Register for a free Vultr account at [mlh.link/vultr-signup](https://mlh.link/vultr-signup).
2. Verify your email address.
3. Sign out and sign back in via [mlh.link/vultr-giftcode](https://mlh.link/vultr-giftcode) to activate the **Gift Code** tab in your Billing dashboard.
4. Obtain your gift code from your MLH coach (or opening ceremony) and apply it to receive **$100 in credits with no credit card required**.

---

## 2. Deploy an Instance on Vultr
1. Go to the [Vultr Dashboard](https://my.vultr.com/) and click **Deploy +** > **Deploy New Server**.
2. **Server Type**: Cloud Compute - Shared CPU.
3. **Location**: Choose the closest region (e.g., *Atlanta* or *Chicago* for Louisville, KY).
4. **Operating System**: 
   - Option A: **Ubuntu 24.04 LTS x64**
   - Option B: Under Marketplace Apps, choose **Docker on Ubuntu**.
5. **Server Plan**: Regular Performance — 1 vCPU, 1 GB RAM ($5 - $6/month).
6. **SSH Keys**: Add your Mac's public SSH key (`cat ~/.ssh/id_rsa.pub` or `cat ~/.ssh/id_ed25519.pub`).
7. Click **Deploy Now**.
8. Wait ~60 seconds for the instance status to show **Running**, and copy your **Server IP Address**.

---

## 3. One-Command Automated Deployment
From your project directory on your local machine, run:

```bash
./scripts/deploy-vultr.sh <YOUR_VULTR_IP>
```

This automated script will:
- Test SSH connectivity
- Install Docker & Docker Compose if missing
- Package and upload your project files
- Launch the application via `docker compose up -d --build`
- Verify the `/api/health` endpoint

---

## 4. Manual Deployment via SSH (Alternative)

If you prefer doing it manually:

```bash
# 1. Connect to your instance
ssh root@<YOUR_VULTR_IP>

# 2. Install Git & Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# 3. Clone or copy the project
git clone <YOUR_REPO_URL> /opt/road-to-the-bats
cd /opt/road-to-the-bats

# 4. Configure environment variables
cp .env.example .env
nano .env   # Add your GEMINI_API_KEY

# 5. Start the container
docker compose up -d --build

# 6. Verify health
curl http://localhost:3000/api/health
```

---

## 5. In-Stadium QR Code Setup
Once deployed, your game is live at `http://<YOUR_VULTR_IP>:3000`.
- Update the public URL in `public/index.html` or point a custom domain/subdomain (e.g. `batsgame.yourdomain.com`).
- Fans in the stadium concourse or at Louisville Slugger Field can scan the QR code to play instantly with no app store download!
