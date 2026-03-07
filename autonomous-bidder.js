import https from 'https';

const CONFIG = {
  apiKey: process.env.MOLTJOBS_API_KEY || 'mj_live_B4NDnQHk1itYhS-FTLf0-0jn4-TKDTBLK3IbOl8HX_E',
  agentId: process.env.AGENT_ID || 'colbt',
  anthropicUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic',
  anthropicToken: process.env.ANTHROPIC_AUTH_TOKEN || '31b0c713ff5a4e749a2adb4e11f567ef.yb6qEUDVkwOXuUcK',
  
  // Autonomous decision parameters
  minBudget: 10,           // Minimum job budget (USDC)
  maxBudget: 100,          // Maximum job budget (USDC)
  bidMargin: 0.15,         // Bid 15% below budget
  maxConcurrentJobs: 3,    // Max jobs at once
  checkInterval: 300000,   // Check every 5 minutes
};

// LLM decision maker
async function analyzeJob(job) {
  const prompt = `Analyze this job and decide if I should bid:

Job: ${job.title}
Budget: $${job.budgetUsdc}
Description: ${JSON.stringify(job.inputData)}

My capabilities:
- Translation (10+ languages)
- Content writing & copywriting
- Technical documentation
- Data processing
- Social media content

Respond with JSON:
{
  "shouldBid": true/false,
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "suggestedBid": number
}`;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const req = https.request({
      hostname: 'api.z.ai',
      path: '/api/anthropic/v1/messages',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.anthropicToken}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          const text = response.content[0].text;
          const decision = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
          resolve(decision);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Get open jobs
async function getOpenJobs() {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.moltjobs.io',
      path: '/v1/jobs?status=OPEN&limit=20',
      headers: { 'Authorization': `Bearer ${CONFIG.apiKey}` }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const data = JSON.parse(body);
        resolve(data.data || []);
      });
    }).on('error', reject);
  });
}

// Submit bid
async function submitBid(jobId, bidAmount, reasoning) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      agentId: CONFIG.agentId,
      proposedUsdc: bidAmount.toString(),
      coverLetter: reasoning
    });

    const req = https.request({
      hostname: 'api.moltjobs.io',
      path: `/v1/jobs/${jobId}/bids`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main autonomous loop
async function autonomousLoop() {
  console.log(`[${new Date().toISOString()}] 🤖 Autonomous agent scanning...`);

  try {
    // Get open jobs
    const jobs = await getOpenJobs();
    console.log(`Found ${jobs.length} open jobs`);

    // Filter by budget
    const eligibleJobs = jobs.filter(j => 
      parseFloat(j.budgetUsdc) >= CONFIG.minBudget &&
      parseFloat(j.budgetUsdc) <= CONFIG.maxBudget
    );

    console.log(`${eligibleJobs.length} jobs within budget range`);

    // Analyze each job with LLM
    for (const job of eligibleJobs) {
      try {
        console.log(`\n📋 Analyzing: ${job.title} ($${job.budgetUsdc})`);
        
        const decision = await analyzeJob(job);
        console.log(`Decision: ${decision.shouldBid ? '✅ BID' : '❌ SKIP'}`);
        console.log(`Confidence: ${decision.confidence}%`);
        console.log(`Reasoning: ${decision.reasoning}`);

        if (decision.shouldBid && decision.confidence >= 70) {
          const bidAmount = decision.suggestedBid || 
            Math.floor(parseFloat(job.budgetUsdc) * (1 - CONFIG.bidMargin));

          console.log(`💰 Submitting bid: $${bidAmount}`);
          
          const result = await submitBid(job.id, bidAmount, decision.reasoning);
          
          if (result.data) {
            console.log(`✅ Bid submitted successfully!`);
          } else {
            console.log(`⚠️ Bid failed: ${result.message}`);
          }
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error analyzing job ${job.id}:`, error.message);
      }
    }

  } catch (error) {
    console.error('Error in autonomous loop:', error.message);
  }

  console.log(`\n⏰ Next scan in ${CONFIG.checkInterval / 60000} minutes\n`);
}

// Run continuously
async function start() {
  console.log('🚀 Starting Autonomous Agent...\n');
  console.log('Configuration:');
  console.log(`- Budget range: $${CONFIG.minBudget}-${CONFIG.maxBudget}`);
  console.log(`- Bid margin: ${CONFIG.bidMargin * 100}%`);
  console.log(`- Check interval: ${CONFIG.checkInterval / 60000} min\n`);

  // Run immediately
  await autonomousLoop();

  // Then run on interval
  setInterval(autonomousLoop, CONFIG.checkInterval);
}

start();
