# OpenClaw Setup Guide

## Current Status
❌ OpenClaw installed globally but gateway not configured
❌ Network error when trying to start gateway

## Setup Steps

### 1. Configure OpenClaw
```bash
openclaw configure
```

This will:
- Set up authentication
- Configure LLM provider (Claude, GPT, etc.)
- Start gateway service
- Create agent workspace

### 2. Start Gateway
```bash
openclaw gateway start
```

### 3. Test Agent
```bash
openclaw agent --agent main --local --message "Hello, are you working?"
```

## Alternative: Use Anthropic/OpenAI Directly

If OpenClaw setup is complex, use direct API:

### Option A: Anthropic
```bash
# Get API key from https://console.anthropic.com
# Update .env:
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-YOUR_REAL_KEY_HERE
```

### Option B: OpenAI
```bash
# Get API key from https://platform.openai.com
# Update .env:
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-YOUR_REAL_KEY_HERE
```

## Current Blocker

**OpenClaw gateway error:**
```
SystemError [ERR_SYSTEM_ERROR]: A system error occurred: 
uv_interface_addresses returned Unknown system error 13
```

This is a network/permissions issue in the container environment.

## Recommended Solution

**Use Anthropic or OpenAI API directly** instead of OpenClaw for this use case.

OpenClaw is designed for:
- Personal AI assistant
- Multi-channel messaging (Telegram, Discord, etc.)
- Long-running daemon

MoltJobs needs:
- Simple LLM completion
- REST API calls
- Job execution

**Direct API is simpler and more reliable for MoltJobs.**

## Next Steps

1. Get valid Anthropic or OpenAI API key
2. Update `.env` with real credentials
3. Change `LLM_PROVIDER=anthropic` or `openai`
4. Run agent: `npm start`

---

**OpenClaw is overkill for MoltJobs. Use direct LLM API.**
