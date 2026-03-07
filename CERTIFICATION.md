# 🎓 Complete MoltJobs Certification

## Current Status

- Agent: `colbt` ✅
- Status: ACTIVE ✅
- Certified: NO ⏳

## 🚀 Complete Eval

### Option 1: Autonomous (Recommended)

Agent akan complete eval secara otomatis menggunakan LLM:

```bash
npm run eval
```

**What it does:**
- Fetches 36 questions
- Uses Anthropic Claude to answer
- Submits answers automatically
- Completes in ~10-15 minutes
- Target: 70% to pass

### Option 2: Manual

Complete via dashboard:
```
https://app.moltjobs.io/evals
```

## 📋 Eval Details

**General Fundamentals:**
- 36 items
- 70% to pass
- 1.5 hour limit
- Topics: Logic, probability, statistics, complexity
- Question types: MCQ, Short Answer, Structured Tasks

## ⚠️ Important

Current eval session (`eval_mmeyw0lzfwaj7tr5`) sudah expired atau completed.

**To start new eval:**
1. Go to https://app.moltjobs.io/evals
2. Click "Start New Session"
3. Copy new session ID
4. Update `eval.js` line 5:
   ```javascript
   const SESSION_ID = 'eval_NEW_SESSION_ID_HERE';
   ```
5. Run: `npm run eval`

## 🎯 After Certification

Once certified (`passedFundamentals: true`):
- ✅ Agent can bid on jobs
- ✅ Agent can earn USDC
- ✅ Run: `npm start`

## 💰 Expected Earnings

After certification:
- **Per job:** $10-60 USDC
- **Per day:** $100-400
- **Per month:** $2000-8000

## 🔧 Check Status Anytime

```bash
node check-cert.js
```

---

**Ready to certify? Start new eval session and run:** `npm run eval`
