# SpendWise Deployment Guide

This document provides step-by-step instructions for deploying the SpendWise Expense & Subscription Manager in various hosting environments.

---

## ⚙️ Environment Variables Config

Regardless of the deployment method, you must define the following environment variables. In a local environment, these are loaded from a `.env` file inside the [backend/](file:///Users/shreyaroshan/Desktop/ExpenseTracker/backend) folder. In cloud hosting providers, configure these in their respective Dashboard Settings.

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment stage | `production` |
| `PORT` | Backend application port | `8000` |
| `MONGO_URI` | MongoDB Connection URL | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT hashing | Run `openssl rand -hex 64` to generate |
| `FRONTEND_URL` | Allowed client origin (for CORS) | `https://your-frontend-domain.com` (comma-separated for multiples) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Storage Account name | (From Cloudinary Dashboard) |
| `CLOUDINARY_API_KEY` | Cloudinary credentials key | (From Cloudinary Dashboard) |
| `CLOUDINARY_API_SECRET` | Cloudinary credentials secret | (From Cloudinary Dashboard) |
| `SMTP_HOST` | Nodemailer SMTP server address | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP credentials user email | `your-email@gmail.com` |
| `SMTP_PASS` | App password (not your normal password) | `abcd efgh ijkl mnop` (Gmail App Password) |
| `SMTP_FROM` | Default "From" display address | `SpendWise <your-email@gmail.com>` |

---

## 🚀 Deployment Option A: Unified Service (Recommended)

This strategy serves the built React frontend directly from the Express backend in production. This allows you to host the entire full-stack app as a **single web service**, avoiding multi-service charges on hobby tiers (like Render, Railway, or Heroku).

This is configured using scripts defined in the root-level [package.json](file:///Users/shreyaroshan/Desktop/ExpenseTracker/package.json) file.

### Steps to Deploy (e.g. Render Web Services)

1. Create a new **Web Service** on Render and connect it to your GitHub Repository.
2. Select **Node** as the runtime environment.
3. Configure the following build & execution commands:
   * **Build Command**: `npm run deploy-build`
   * **Start Command**: `npm run start`
4. Go to the **Environment** tab, click **Add Environment Variable**, and fill in the secrets table shown above. (Set `NODE_ENV` to `production`).
5. Render will automatically install dependencies for both the frontend and backend, build the production assets into `frontend/dist`, and start the unified Express server.

---

## 🐳 Deployment Option B: Containerized (Docker Compose)

To run the application locally or on an isolated VM (such as AWS EC2, DigitalOcean Droplet, Linode, etc.), use Docker Compose. This starts three containers: a MongoDB database, the Express API backend, and the Nginx web server serving the frontend.

Configurations used:
- Root [docker-compose.yml](file:///Users/shreyaroshan/Desktop/ExpenseTracker/docker-compose.yml)
- [backend/Dockerfile](file:///Users/shreyaroshan/Desktop/ExpenseTracker/backend/Dockerfile)
- [frontend/Dockerfile](file:///Users/shreyaroshan/Desktop/ExpenseTracker/frontend/Dockerfile)
- [frontend/nginx.conf](file:///Users/shreyaroshan/Desktop/ExpenseTracker/frontend/nginx.conf)

### Steps to Run

1. Ensure you have **Docker** and **Docker Compose** installed on the server.
2. Edit or set any required external secrets in your shell or root `.env` file (e.g., SMTP or Cloudinary variables).
3. Start the containers using:
   ```bash
   docker compose up --build -d
   ```
4. Verify the containers are running:
   ```bash
   docker compose ps
   ```
5. Access the application:
   * **Frontend Client**: `http://localhost:3000` (Nginx proxies `/api` calls automatically to the backend container)
   * **Backend REST API**: `http://localhost:8000/api`

---

## 🔗 Deployment Option C: Separate Hosting Services

If you prefer to host the client on specialized frontend hosts (Vercel, Netlify, Cloudflare Pages) and the API on a dedicated backend service (Render, Railway, Fly.io, AWS ECS):

### 1. Backend Service (Express)
1. Deploy [backend/](file:///Users/shreyaroshan/Desktop/ExpenseTracker/backend) folder to your Node.js cloud hosting provider.
2. Set the Build Command to `npm install` and Start Command to `npm start`.
3. Add all environment variables. Set `FRONTEND_URL` to your Vercel/Netlify app URL (e.g. `https://spendwise.vercel.app`).

### 2. Frontend Client (React + Vite)
1. Import your workspace repository into Vercel/Netlify.
2. Set the **Root Directory** settings to `frontend`.
3. Set the Build Command to `npm run build` and Output Directory to `dist`.
4. Add the following Environment Variable:
   * `VITE_API_URL`: Set this to your backend service URL (e.g. `https://spendwise-backend.onrender.com/api`).
