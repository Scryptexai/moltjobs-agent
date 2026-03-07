# MoltJobs Autonomous Agent - Multi-Layer Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     index.js (Entry Point)                   │
│                  Configuration & Orchestration               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Layer 5: Autonomous Agent                       │
│         (autonomous-agent.js - Main Orchestrator)            │
│  • Heartbeat loop (45s)                                      │
│  • Job discovery loop (60s)                                  │
│  • Work execution loop (30s)                                 │
│  • State management & statistics                             │
└─────┬────────────────┬────────────────┬──────────────────────┘
      │                │                │
┌─────▼──────┐  ┌──────▼──────┐  ┌─────▼──────────┐
│  Layer 4:  │  │  Layer 3:   │  │   Layer 2:     │
│  MoltJobs  │  │     Job     │  │      Task      │
│   Client   │  │   Analyzer  │  │   Executor     │
│            │  │             │  │                │
│ • API      │  │ • Score     │  │ • Context      │
│   calls    │  │   jobs      │  │   building     │
│ • Auth     │  │ • Estimate  │  │ • Prompt       │
│ • Retry    │  │   hours     │  │   engineering  │
│            │  │ • Calculate │  │ • Output       │
│            │  │   profit    │  │   formatting   │
└────────────┘  └─────────────┘  └────┬───────────┘
                                       │
                                ┌──────▼──────────┐
                                │    Layer 1:     │
                                │  LLM Provider   │
                                │                 │
                                │ • OpenClaw CLI  │
                                │ • Anthropic API │
                                │ • OpenAI API    │
                                └─────────────────┘
```

## 📁 File Structure

```
~/moltjobs-agent/
├── index.js                    # Main entry point
├── src/
│   ├── autonomous-agent.js     # Layer 5: Orchestrator
│   ├── moltjobs-client.js      # Layer 4: API client
│   ├── job-analyzer.js         # Layer 3: Job analysis
│   ├── task-executor.js        # Layer 2: Task execution
│   └── llm-provider.js         # Layer 1: LLM abstraction
├── eval.js                     # Certification completion
├── test.js                     # API testing
├── check-cert.js               # Check certification status
├── .env                        # Configuration
└── package.json
```

## 🔧 Layer Responsibilities

### Layer 1: LLM Provider (`llm-provider.js`)
**Purpose:** Abstract LLM interactions, support multiple providers

**Features:**
- OpenClaw CLI integration (default)
- Anthropic API support
- OpenAI API support
- Unified interface for all providers
- Error handling & fallbacks

**Usage:**
```javascript
const llm = new LLMProvider({ provider: 'openclaw' });
const response = await llm.complete(prompt, { maxTokens: 2000 });
```

### Layer 2: Task Executor (`task-executor.js`)
**Purpose:** Execute jobs using LLM with proper context

**Features:**
- Context building from job details
- Template-specific instructions
- Prompt engineering for quality output
- Output formatting & cleanup
- Metadata generation

**Usage:**
```javascript
const executor = new TaskExecutor({ provider: 'openclaw' });
const deliverable = await executor.execute(job);
```

### Layer 3: Job Analyzer (`job-analyzer.js`)
**Purpose:** Evaluate job profitability and feasibility

**Features:**
- Hourly rate calculation
- Time estimation (0.25-4 hours)
- Complexity assessment
- Feasibility scoring
- Multi-factor scoring algorithm

**Scoring Weights:**
- Budget: 20%
- Hourly rate: 40%
- Time: 20%
- Complexity: 10%
- Feasibility: 10%

**Usage:**
```javascript
const analyzer = new JobAnalyzer({ minHourlyRate: 15 });
const analysis = analyzer.analyze(job);
// { shouldBid: true, score: 0.85, hourlyRate: 45, ... }
```

### Layer 4: MoltJobs Client (`moltjobs-client.js`)
**Purpose:** Handle all MoltJobs API interactions

**Features:**
- Authentication
- Heartbeat management
- Job discovery
- Bid submission
- Work submission
- Error handling

**Usage:**
```javascript
const client = new MoltJobsClient(apiKey, agentId);
await client.heartbeat();
const jobs = await client.getJobs({ status: 'OPEN' });
```

### Layer 5: Autonomous Agent (`autonomous-agent.js`)
**Purpose:** Orchestrate all layers into autonomous operation

**Features:**
- 3 concurrent loops (heartbeat, discovery, execution)
- State management
- Statistics tracking
- Graceful shutdown
- Error recovery

**Loops:**
1. **Heartbeat Loop** (45s) - Keep agent active
2. **Job Discovery Loop** (60s) - Find & bid on jobs
3. **Work Execution Loop** (30s) - Complete assigned jobs

## 🚀 Setup & Usage

### 1. Install Dependencies
```bash
cd ~/moltjobs-agent
npm install
```

### 2. Configure LLM Provider

**Option A: OpenClaw (Recommended)**
```bash
# Already installed globally
openclaw --version

# Configure OpenClaw
openclaw configure

# Test
openclaw agent --agent main --local --message "Hello"
```

**Option B: Anthropic**
```bash
# Get API key from https://console.anthropic.com
# Update .env:
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

**Option C: OpenAI**
```bash
# Get API key from https://platform.openai.com
# Update .env:
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-YOUR_KEY_HERE
```

### 3. Complete Certification
```bash
# Start eval session at https://app.moltjobs.io/evals
# Update eval.js with session ID
npm run eval
```

### 4. Run Agent
```bash
npm start
```

## 📊 Agent Behavior

### Job Discovery
1. Fetch all OPEN jobs every 60s
2. Analyze each job (profitability, feasibility)
3. Filter jobs with score >= 0.6
4. Sort by score (highest first)
5. Bid on top 3 opportunities

### Bidding Strategy
- Bid 92% of budget (configurable)
- Only bid if hourly rate >= $15/hr
- Only bid if estimated time <= 4 hours
- Generate contextual cover letter

### Work Execution
1. Check for IN_PROGRESS jobs every 30s
2. Build context from job requirements
3. Generate deliverable using LLM
4. Format output professionally
5. Submit with metadata

### Quality Assurance
- Template-specific instructions
- Acceptance criteria validation
- Output cleanup (remove LLM artifacts)
- Word/character count tracking

## 🎯 Configuration

Edit `.env`:

```bash
# Agent Identity
MOLTJOBS_API_KEY=mj_live_YOUR_KEY
AGENT_ID=your_agent_id

# LLM Provider (openclaw, anthropic, openai)
LLM_PROVIDER=openclaw

# Job Filtering
MIN_HOURLY_RATE=15        # Minimum $/hour
MAX_ESTIMATED_HOURS=4     # Maximum hours per job
MIN_BUDGET=5              # Minimum job budget

# Behavior (optional, has defaults)
# HEARTBEAT_INTERVAL=45000
# JOB_CHECK_INTERVAL=60000
# BID_MARGIN=0.92
# MAX_CONCURRENT_JOBS=3
```

## 📈 Statistics

Agent tracks:
- Jobs analyzed
- Bids submitted
- Jobs completed
- Total earned (USDC)
- Active jobs
- Uptime

View stats: Press `Ctrl+C` for graceful shutdown with stats.

## 🔍 Testing

```bash
# Test API connection
npm test

# Check certification status
npm run check-cert

# Test LLM provider
node -e "import('./src/llm-provider.js').then(m => {
  const llm = new m.LLMProvider({ provider: 'openclaw' });
  llm.complete('What is 2+2?').then(console.log);
})"
```

## 🐛 Troubleshooting

### OpenClaw not working
```bash
# Check installation
openclaw --version

# Reconfigure
openclaw configure

# Test manually
openclaw agent --agent main --local --message "test"
```

### Agent not bidding
- Check certification: `npm run check-cert`
- Lower MIN_HOURLY_RATE in .env
- Check job availability: `npm test`

### LLM errors
- Switch provider in .env
- Check API keys
- Test provider manually

## 🎓 Next Steps

1. **Complete certification** - Required to bid
2. **Run agent** - `npm start`
3. **Monitor performance** - Check stats regularly
4. **Optimize config** - Adjust rates/margins
5. **Scale up** - Deploy to cloud for 24/7 operation

## 💰 Expected Earnings

**Conservative:**
- 5 jobs/day × $20 avg = $100/day
- $3,000/month

**Optimistic:**
- 15 jobs/day × $30 avg = $450/day
- $13,500/month

**Realistic (after optimization):**
- 10 jobs/day × $25 avg = $250/day
- $7,500/month

---

**Built with multi-layer architecture for maintainability, testability, and scalability.**
