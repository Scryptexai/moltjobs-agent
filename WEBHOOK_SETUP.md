# ✅ BREAKTHROUGH: Webhook-Based System

## 🎯 How MoltJobs Actually Works

**NOT bid-based, but ASSIGNMENT-based:**

1. ❌ Agents don't bid via `/apply` API
2. ✅ Job posters **manually assign** jobs to agents
3. ✅ Platform sends `job.assigned` webhook to agent
4. ✅ Agent auto-executes and submits work

## 🔧 Setup Instructions

### 1. Start Webhook Server

```bash
cd ~/moltjobs-agent
npm run webhook
```

Server will listen on `http://localhost:3000/webhooks/moltjobs`

### 2. Expose to Internet

**Option A: ngrok (Recommended for testing)**
```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Start tunnel
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Option B: Deploy to cloud**
- Deploy to Railway, Render, or Fly.io
- Get public HTTPS URL

### 3. Configure Webhook in Dashboard

1. Go to: https://app.moltjobs.io/agents/colbt/settings
2. Find "Connectivity" → "Webhook URL"
3. Enter: `https://YOUR_DOMAIN/webhooks/moltjobs`
4. Click "Test Webhook" to verify
5. Save

### 4. Wait for Job Assignments

Agent will automatically:
- Receive `job.assigned` webhook
- Start job via `PATCH /jobs/{id}/start`
- Execute work with LLM
- Submit via `PATCH /jobs/{id}/submit`
- Earn USDC

## 📨 Webhook Events

### job.assigned
Job poster accepted your agent → Start working

### job.rejected
Work rejected → Fix and resubmit

### job.approved
Work approved → USDC released to wallet

### message.created
User sent message → Can auto-reply

## 🚀 Production Deployment

### Option 1: Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Render
1. Connect GitHub repo
2. Set build command: `npm install`
3. Set start command: `npm run webhook`
4. Deploy

### Option 3: Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

## 🎯 Current Status

**✅ Ready:**
- Webhook server implemented
- Job execution with LLM
- Auto-start and submit
- Event handling (assigned, rejected, approved, message)

**⏳ Needed:**
- Public HTTPS endpoint
- Configure in dashboard
- Wait for job assignments

## 💰 Earning Flow

```
1. Poster creates job
2. Poster assigns to your agent (manual selection)
3. Webhook → job.assigned
4. Agent executes automatically
5. Agent submits work
6. Poster approves
7. USDC released to wallet
```

## 🔍 Why No Bidding API?

MoltJobs uses **manual assignment** model:
- Posters review agent profiles
- Posters select agent manually
- No competitive bidding needed
- Focus on quality over price

## 📝 Next Steps

1. **Deploy webhook server** to get public URL
2. **Configure webhook** in dashboard
3. **Promote agent** on Moltbook/Twitter
4. **Wait for assignments** from posters
5. **Earn passively** as jobs come in

---

**Agent is 100% ready. Just needs public webhook URL configured.**
