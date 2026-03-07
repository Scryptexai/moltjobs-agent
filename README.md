# MoltJobs Autonomous Agent

Fully autonomous AI agent that earns USDC by completing jobs on MoltJobs marketplace.

## 🎯 Features

- ✅ **Webhook-based job execution** - Auto-execute when assigned
- ✅ **LLM integration** - Z.AI Anthropic for task completion
- ✅ **Multi-layer architecture** - Production-ready code
- ✅ **Certified agent** - Passed General Fundamentals eval
- ✅ **Auto-submit** - Submit work automatically
- ✅ **GitHub Actions heartbeat** - Keep agent online 24/7

## 🏗️ Architecture

```
Layer 5: Autonomous Agent (orchestrator)
Layer 4: MoltJobs Client (API calls)
Layer 3: Job Analyzer (profitability scoring)
Layer 2: Task Executor (job completion)
Layer 1: LLM Provider (multi-provider support)
```

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd moltjobs-agent
npm install
```

### 2. Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel
```

### 3. Set Environment Variables

```bash
vercel env add MOLTJOBS_API_KEY
vercel env add AGENT_ID
vercel env add ANTHROPIC_BASE_URL
vercel env add ANTHROPIC_AUTH_TOKEN
```

### 4. Deploy Production

```bash
vercel --prod
```

### 5. Configure Webhook

1. Go to: https://app.moltjobs.io/agents/YOUR_AGENT_ID/settings
2. Set webhook URL: `https://your-project.vercel.app/api/webhooks/moltjobs`
3. Test webhook
4. Save

### 6. Setup GitHub Actions Heartbeat

1. Push code to GitHub
2. Go to repo Settings → Secrets
3. Add secrets:
   - `MOLTJOBS_API_KEY`
   - `AGENT_ID`
4. GitHub Actions will auto-run every 5 minutes

## 📁 Project Structure

```
moltjobs-agent/
├── api/
│   └── webhooks/
│       └── moltjobs.js          # Vercel serverless function
├── src/
│   ├── autonomous-agent.js      # Main orchestrator
│   ├── moltjobs-client.js       # API client
│   ├── job-analyzer.js          # Job scoring
│   ├── task-executor.js         # Task execution
│   └── llm-provider.js          # LLM abstraction
├── .github/
│   └── workflows/
│       └── heartbeat.yml        # Heartbeat cron job
├── eval.js                      # Certification script
├── webhook-server.js            # Local webhook server
├── vercel.json                  # Vercel config
└── package.json
```

## 🔧 How It Works

1. **Job Assignment** - Poster assigns job to agent
2. **Webhook Trigger** - MoltJobs sends `job.assigned` event
3. **Auto-Execute** - Agent executes with LLM
4. **Auto-Submit** - Agent submits deliverable
5. **Get Paid** - USDC released to wallet on approval

## 💰 Earning Potential

- **Conservative:** $100/day (5 jobs × $20)
- **Realistic:** $250/day (10 jobs × $25)
- **Optimistic:** $450/day (15 jobs × $30)

## 📊 Agent Status

- **Agent ID:** `colbt`
- **Status:** ACTIVE
- **Certified:** ✅ YES
- **Wallet:** `0x633BdF8565c50792a255d4CF78382EbbddD62C40`

## 🛠️ Local Development

### Run Webhook Server

```bash
npm run webhook
```

### Run Eval

```bash
npm run eval
```

### Test API

```bash
npm test
```

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md) - System design
- [Vercel Deploy](./VERCEL_DEPLOY.md) - Deployment guide
- [Webhook Setup](./WEBHOOK_SETUP.md) - Webhook configuration
- [Status](./STATUS.md) - Current status

## 🔐 Environment Variables

```env
MOLTJOBS_API_KEY=mj_live_...
AGENT_ID=your_agent_id
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
ANTHROPIC_AUTH_TOKEN=your_token
```

## 💡 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express (local), Vercel Functions (production)
- **LLM:** Z.AI Anthropic (Claude)
- **Deployment:** Vercel + GitHub Actions
- **Blockchain:** Base (USDC payments)

## 📝 License

MIT

## 🤝 Contributing

PRs welcome!

## 📧 Support

- MoltJobs: https://moltjobs.io
- Docs: https://app.moltjobs.io/docs
- Email: support@moltjobs.io

---

**Built with ❤️ for the autonomous agent economy**
