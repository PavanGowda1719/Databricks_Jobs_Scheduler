# 🚀 Deployment Guide — Databricks Pipeline Dashboard

This guide provides step-by-step instructions for deploying your application using **Docker**, **Azure Tech Stack**, or **Free-Tier Cloud Providers (Vercel + Render)**.

---

## 📑 Table of Contents
1. [Option 1: Free Tier POC (Vercel + Render)](#option-1-free-tier-poc-vercel--render)
2. [Option 2: Docker Local Execution (Any Machine)](#option-2-docker-local-execution)
3. [Option 3: Enterprise Azure Deployment (ACR + Azure App Service)](#option-3-enterprise-azure-deployment)
4. [How to Deploy Updates in the Future](#how-to-deploy-updates-in-the-future)

---

## Option 1: Free Tier POC (Vercel + Render)
*Best for fast, zero-cost personal demos.*

### Step 1: Deploy Backend to Render
1. Go to [Render.com](https://render.com) and create an account.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository: `https://github.com/PavanGowda1719/Databricks_Jobs_Scheduler`.
4. Configure settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/app.js`
   - **Instance Type:** Free
5. Under **Environment Variables**, add:
   - `DATABRICKS_HOST` = `https://dbc-48d26f7e-6eda.cloud.databricks.com`
   - `DATABRICKS_TOKEN` = *(Your Databricks PAT)*
   - `ALLOWED_ORIGINS` = `*`
6. Click **Deploy Web Service**. Copy the generated URL (e.g. `https://databricks-scheduler.onrender.com`).

### Step 2: Deploy Frontend to Vercel
1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** $\rightarrow$ **Project** and select `Databricks_Jobs_Scheduler`.
3. Configure settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://databricks-scheduler.onrender.com/api` (your Render URL from Step 1)
5. Click **Deploy**. Vercel will build and provide a live URL!

---

## Option 2: Docker Local Execution
*Best for testing containerized environments on your local machine or a VM.*

### Prerequisites
- Docker Desktop installed and running.

### How to Run:
```powershell
# 1. Build and start both containers in the background
docker compose up --build -d

# 2. View running containers
docker compose ps

# 3. View live logs
docker compose logs -f

# 4. Stop containers
docker compose down
```

### Endpoints:
- **Frontend Dashboard:** [http://localhost](http://localhost) (port 80)
- **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)

---

## Option 3: Enterprise Azure Deployment (ACR + Azure App Service)
*Best for corporate/enterprise environments utilizing your organization's Azure subscription.*

### Step 1: Create Azure Resources
Run these commands in PowerShell with Azure CLI (`az login`):

```powershell
# 1. Create Resource Group
az group create --name rg-databricks-scheduler --location eastus

# 2. Create Azure Container Registry (ACR)
az acr create --resource-group rg-databricks-scheduler --name acrdatabricksscheduler --sku Basic --admin-enabled true

# 3. Create App Service Plan (Linux)
az appservice plan create --name plan-databricks-scheduler --resource-group rg-databricks-scheduler --sku B1 --is-linux

# 4. Create Web App for Containers
az webapp create --resource-group rg-databricks-scheduler --plan plan-databricks-scheduler --name app-databricks-scheduler --deployment-container-image-name acrdatabricksscheduler.azurecr.io/scheduler-backend:latest
```

### Step 2: Build & Push Docker Images to ACR
```powershell
# Log in to your Azure Container Registry
az acr login --name acrdatabricksscheduler

# Build and tag backend
docker build -t acrdatabricksscheduler.azurecr.io/scheduler-backend:latest ./backend
docker push acrdatabricksscheduler.azurecr.io/scheduler-backend:latest

# Build and tag frontend
docker build -t acrdatabricksscheduler.azurecr.io/scheduler-frontend:latest ./frontend
docker push acrdatabricksscheduler.azurecr.io/scheduler-frontend:latest
```

### Step 3: Configure Environment Variables in Azure App Service
```powershell
az webapp config appsettings set --resource-group rg-databricks-scheduler --name app-databricks-scheduler --settings `
  DATABRICKS_HOST="https://dbc-48d26f7e-6eda.cloud.databricks.com" `
  DATABRICKS_TOKEN="<YOUR_TOKEN>" `
  PORT=3001 `
  NODE_ENV="production"
```

---

## How to Deploy Updates in the Future

### When using GitHub Actions (Automated CI/CD):
Whenever you make new code changes, simply commit and push to `main`:
```powershell
git add .
git commit -m "feat: new enhancements"
git push origin main
```
The workflow at `.github/workflows/azure-deploy.yml` automatically triggers, rebuilds your containers, and redeploys to Azure.

### When updating manually with Docker:
```powershell
# 1. Rebuild images with new code
docker compose build

# 2. Restart services with zero downtime
docker compose up -d
```

