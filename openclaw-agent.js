import https from 'https';
import fs from 'fs';

const CONFIG = {
  githubToken: process.env.GITHUB_TOKEN,
  anthropicToken: process.env.ANTHROPIC_AUTH_TOKEN,
  minBounty: 50,
  maxBounty: 5000,
  autoComment: true, // REAL: Auto-post comments
  checkInterval: 1800000, // 30 minutes
  appliedIssues: new Set()
};

// Load applied issues from file
function loadAppliedIssues() {
  try {
    const data = fs.readFileSync('applied-issues.json', 'utf8');
    const issues = JSON.parse(data);
    issues.forEach(id => CONFIG.appliedIssues.add(id));
    console.log(`Loaded ${CONFIG.appliedIssues.size} previously applied issues`);
  } catch (e) {
    console.log('No previous applications found');
  }
}

// Save applied issues
function saveAppliedIssues() {
  fs.writeFileSync('applied-issues.json', JSON.stringify([...CONFIG.appliedIssues]));
}

// GitHub API request helper
function githubRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'OpenClaw-Agent',
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Search bounty issues with optimized queries
async function searchBountyIssues() {
  const queries = [
    // Bounty-specific labels
    'label:bounty state:open',
    'label:"good first issue" state:open language:JavaScript',
    'label:"help wanted" state:open language:TypeScript',
    'label:bug state:open label:"good first issue"',
    // Bounty keywords in title
    '"bounty" in:title state:open',
    '"reward" in:title state:open',
    '"$" in:title state:open label:bounty'
  ];

  const allIssues = [];
  
  for (const query of queries) {
    try {
      const encoded = encodeURIComponent(query);
      const result = await githubRequest('GET', `/search/issues?q=${encoded}&sort=created&order=desc&per_page=30`);
      
      if (result.data.items) {
        allIssues.push(...result.data.items);
      }
      
      console.log(`   Query "${query.substring(0, 40)}..." → ${result.data.items?.length || 0} issues`);
      await new Promise(r => setTimeout(r, 1200)); // Rate limit: 5000/hour = ~1.4 req/sec
    } catch (error) {
      console.error(`   Error with query: ${error.message}`);
    }
  }

  // Deduplicate by ID
  const unique = [...new Map(allIssues.map(i => [i.id, i])).values()];
  
  // Filter active repos (updated in last 30 days)
  const active = unique.filter(issue => {
    const updated = new Date(issue.updated_at);
    const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    return daysSince < 30;
  });
  
  return active;
}

// Extract bounty amount with better patterns
function extractBountyAmount(issue) {
  const text = `${issue.title} ${issue.body || ''}`;
  
  // Comprehensive patterns
  const patterns = [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,           // $100, $1,000, $100.00
    /(\d+(?:,\d{3})*)\s*USD/gi,                   // 100 USD, 1,000 USD
    /(\d+(?:,\d{3})*)\s*USDC/gi,                  // 100 USDC
    /bounty[:\s]+\$?(\d+(?:,\d{3})*)/gi,          // bounty: $100
    /reward[:\s]+\$?(\d+(?:,\d{3})*)/gi,          // reward: 100
    /prize[:\s]+\$?(\d+(?:,\d{3})*)/gi,           // prize: $100
    /(\d+(?:,\d{3})*)\s*dollars?/gi               // 100 dollars
  ];
  
  const amounts = [];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount >= 10 && amount <= 50000) { // Reasonable range
        amounts.push(amount);
      }
    }
  }
  
  // Return highest amount found (likely the bounty)
  return amounts.length > 0 ? Math.max(...amounts) : 0;
}

// LLM analysis with better filtering
async function analyzeIssue(issue, bountyAmount) {
  const repo = issue.repository_url?.split('/').slice(-2).join('/');
  const labels = issue.labels?.map(l => l.name).join(', ') || 'none';
  const hasGoodFirstIssue = labels.includes('good first issue');
  const hasHelpWanted = labels.includes('help wanted');
  
  const prompt = `Analyze this GitHub issue for autonomous agent work:

Title: ${issue.title}
Bounty: $${bountyAmount} USD
Repo: ${repo}
Labels: ${labels}
Created: ${issue.created_at}
Comments: ${issue.comments}
Description: ${issue.body?.substring(0, 700)}

My capabilities:
- JavaScript/TypeScript/Node.js (expert)
- Python (intermediate)  
- API development & REST/GraphQL
- Documentation & technical writing
- Bug fixes & testing
- Web3/Smart contracts (basic)
- React/Vue/Frontend (intermediate)

Evaluation criteria:
1. Is this a REAL bounty with clear payment?
2. Is the scope small enough (< 8 hours)?
3. Do I have the skills?
4. Is the repo active (not abandoned)?
5. Is the issue well-defined?

Respond ONLY with valid JSON (no markdown):
{
  "shouldApply": true/false,
  "confidence": 0-100,
  "reasoning": "brief why/why not",
  "estimatedHours": number,
  "approach": "1-2 sentence solution",
  "riskLevel": "low/medium/high"
}`;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 700,
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
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            resolve(JSON.parse(jsonMatch[0]));
          } else {
            reject(new Error('No JSON in response'));
          }
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

// Generate comment
async function generateComment(issue, analysis) {
  const prompt = `Write a professional GitHub comment to claim this bounty (150 words max):

Issue: ${issue.title}
Approach: ${analysis.approach}
Estimated: ${analysis.estimatedHours} hours

Format:
- Brief intro (1 line)
- Solution approach (2-3 lines)
- Timeline (1 line)
- Request assignment (1 line)

Be professional, confident, concise. No fluff.`;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 400,
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
          resolve(response.content[0].text);
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

// Post comment to GitHub
async function postComment(issueUrl, comment) {
  const parts = issueUrl.split('/');
  const owner = parts[parts.length - 4];
  const repo = parts[parts.length - 3];
  const number = parts[parts.length - 1];
  
  const result = await githubRequest('POST', `/repos/${owner}/${repo}/issues/${number}/comments`, {
    body: comment
  });
  
  return result;
}

// Main autonomous loop
async function autonomousLoop() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${new Date().toISOString()}] 🤖 OpenClaw Agent Scanning...`);
  console.log('='.repeat(60));

  try {
    const issues = await searchBountyIssues();
    console.log(`\n📊 Found ${issues.length} total bounty issues`);

    let analyzed = 0;
    let applied = 0;

    for (const issue of issues) {
      // Skip if already applied
      if (CONFIG.appliedIssues.has(issue.id)) {
        continue;
      }

      try {
        const bountyAmount = extractBountyAmount(issue);
        
        if (bountyAmount < CONFIG.minBounty || bountyAmount > CONFIG.maxBounty) {
          continue;
        }

        const repo = issue.repository_url?.split('/').slice(-2).join('/');
        
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`💎 ${issue.title}`);
        console.log(`   Bounty: $${bountyAmount} USD`);
        console.log(`   Repo: ${repo}`);
        console.log(`   URL: ${issue.html_url}`);

        const analysis = await analyzeIssue(issue, bountyAmount);
        
        console.log(`   Decision: ${analysis.shouldApply ? '✅ APPLY' : '❌ SKIP'}`);
        console.log(`   Confidence: ${analysis.confidence}%`);
        console.log(`   Reasoning: ${analysis.reasoning}`);

        if (analysis.shouldApply && analysis.confidence >= 75) {
          console.log(`   Estimated: ${analysis.estimatedHours} hours`);
          console.log(`   Approach: ${analysis.approach}`);
          
          const comment = await generateComment(issue, analysis);
          console.log(`\n   📝 Generated comment (${comment.length} chars)`);

          if (CONFIG.autoComment) {
            console.log(`   🚀 Posting comment to GitHub...`);
            const result = await postComment(issue.html_url, comment);
            
            if (result.status === 201) {
              console.log(`   ✅ Comment posted successfully!`);
              console.log(`   🔗 ${result.data.html_url}`);
              
              CONFIG.appliedIssues.add(issue.id);
              saveAppliedIssues();
              applied++;
              
              // Log to file
              fs.appendFileSync('applications.log',
                `${new Date().toISOString()} | ${repo} | $${bountyAmount} | ${issue.html_url}\n`
              );
            } else {
              console.log(`   ⚠️  Failed to post: ${result.status} ${result.data.message || ''}`);
            }
          } else {
            console.log(`   💾 Comment saved (auto-post disabled)`);
          }
        }

        analyzed++;
        if (analyzed >= 15) break; // Limit per scan
        
        await new Promise(r => setTimeout(r, 3000)); // Rate limit

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Scan complete: ${analyzed} analyzed, ${applied} applied`);
    console.log(`📊 Total applications: ${CONFIG.appliedIssues.size}`);
    console.log(`⏰ Next scan: ${new Date(Date.now() + CONFIG.checkInterval).toLocaleString()}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error(`\n❌ Error in autonomous loop: ${error.message}`);
  }
}

// Start
async function start() {
  console.log('\n🚀 OpenClaw Autonomous GitHub Bounty Agent\n');
  console.log('Configuration:');
  console.log(`- Bounty range: $${CONFIG.minBounty}-${CONFIG.maxBounty}`);
  console.log(`- Auto-comment: ${CONFIG.autoComment ? '✅ ENABLED (REAL)' : '❌ DISABLED'}`);
  console.log(`- Check interval: ${CONFIG.checkInterval / 60000} minutes`);
  console.log(`- GitHub token: ${CONFIG.githubToken.substring(0, 10)}...`);
  console.log('');

  loadAppliedIssues();
  
  await autonomousLoop();
  setInterval(autonomousLoop, CONFIG.checkInterval);
}

start();
