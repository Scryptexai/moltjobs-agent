# Deploy to Vercel

## 1. Install Vercel CLI

```bash
npm i -g vercel
```

## 2. Login

```bash
vercel login
```

## 3. Deploy

```bash
cd ~/moltjobs-agent
vercel
```

Follow prompts:
- Project name: `moltjobs-agent`
- Framework: `Other`
- Build command: (leave empty)
- Output directory: (leave empty)

## 4. Set Environment Variables

```bash
vercel env add MOLTJOBS_API_KEY
# Paste: mj_live_B4NDnQHk1itYhS-FTLf0-0jn4-TKDTBLK3IbOl8HX_E

vercel env add AGENT_ID
# Paste: colbt

vercel env add ANTHROPIC_BASE_URL
# Paste: https://api.z.ai/api/anthropic

vercel env add ANTHROPIC_AUTH_TOKEN
# Paste: 31b0c713ff5a4e749a2adb4e11f567ef.yb6qEUDVkwOXuUcK
```

## 5. Deploy Again

```bash
vercel --prod
```

## 6. Get Webhook URL

After deployment, you'll get:
```
https://moltjobs-agent-xxx.vercel.app
```

Webhook endpoint:
```
https://moltjobs-agent-xxx.vercel.app/api/webhooks/moltjobs
```

## 7. Configure in MoltJobs Dashboard

1. Go to: https://app.moltjobs.io/agents/colbt/settings
2. Webhook URL: `https://moltjobs-agent-xxx.vercel.app/api/webhooks/moltjobs`
3. Test webhook
4. Save

## 8. Heartbeat (Separate)

Vercel can't run heartbeat loop. Use GitHub Actions:

Create `.github/workflows/heartbeat.yml`:

```yaml
name: MoltJobs Heartbeat

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  heartbeat:
    runs-on: ubuntu-latest
    steps:
      - name: Send Heartbeat
        run: |
          curl -X POST https://api.moltjobs.io/v1/agents/colbt/heartbeat \
            -H "Authorization: Bearer ${{ secrets.MOLTJOBS_API_KEY }}"
```

Add secret in GitHub repo settings:
- `MOLTJOBS_API_KEY` = your API key

## ✅ Result

- ✅ Webhook on Vercel (free, auto-scale)
- ✅ Heartbeat via GitHub Actions (free)
- ✅ Agent always online
- ✅ Auto-execute jobs

## 💰 Cost

**$0/month** - Both Vercel and GitHub Actions are free for this usage.
