import axios from 'axios';

// Retry helper with exponential backoff
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}

// Validate job payload
function validateJob(payload) {
  if (!payload?.jobId || !payload?.title) {
    throw new Error('Invalid job payload');
  }
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, agentId, payload } = req.body || {};
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${requestId}] Webhook: ${type} for ${agentId}`);
  
  // Respond immediately
  res.status(200).json({ 
    received: true, 
    type, 
    agentId,
    requestId,
    timestamp: new Date().toISOString()
  });
  
  // Process job async with full error handling
  if (type === 'job.assigned' && payload) {
    try {
      validateJob(payload);
      
      const { jobId, title, budgetUsdc, inputData } = payload;
      console.log(`[${requestId}] Processing job ${jobId}: ${title}`);
      
      // Start job with retry
      await retryRequest(async () => {
        const response = await fetch(`https://api.moltjobs.io/v1/jobs/${jobId}/start`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error(`Start failed: ${response.status}`);
        console.log(`[${requestId}] Job ${jobId} started`);
      });
      
      // Execute with LLM with retry
      const deliverable = await retryRequest(async () => {
        const prompt = `You are completing a job on MoltJobs marketplace.

Job Title: ${title}
Description: ${inputData?.description || title}
Budget: $${budgetUsdc} USDC

Requirements:
${inputData?.requirements?.map((r, i) => `${i + 1}. ${r}`).join('\n') || 'Complete the task as described'}

Provide a high-quality, professional deliverable that meets all requirements.`;
        
        const llmResponse = await axios.post(
          `${process.env.ANTHROPIC_BASE_URL}/v1/messages`,
          {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 3000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
          },
          {
            headers: {
              'x-api-key': process.env.ANTHROPIC_AUTH_TOKEN,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            timeout: 45000
          }
        );
        
        if (!llmResponse.data?.content?.[0]?.text) {
          throw new Error('Invalid LLM response');
        }
        
        return llmResponse.data.content[0].text.trim();
      });
      
      console.log(`[${requestId}] Deliverable generated: ${deliverable.length} chars`);
      
      // Quality check
      if (deliverable.length < 50) {
        throw new Error('Deliverable too short, likely incomplete');
      }
      
      // Submit work with retry
      await retryRequest(async () => {
        const response = await fetch(`https://api.moltjobs.io/v1/jobs/${jobId}/submit`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            output: deliverable,
            metadata: {
              completedAt: new Date().toISOString(),
              jobId,
              requestId,
              wordCount: deliverable.split(/\s+/).length,
              characterCount: deliverable.length,
              model: 'claude-3-5-sonnet-20241022',
              processingTime: Date.now() - parseInt(requestId.split('_')[1])
            }
          })
        });
        if (!response.ok) throw new Error(`Submit failed: ${response.status}`);
        console.log(`[${requestId}] Job ${jobId} submitted successfully`);
      });
      
      console.log(`[${requestId}] ✅ Job ${jobId} completed - Budget: $${budgetUsdc}`);
      
    } catch (e) {
      console.error(`[${requestId}] ❌ Job error:`, e.message);
      console.error(`[${requestId}] Stack:`, e.stack);
      
      // Attempt to report error to MoltJobs (best effort)
      try {
        await fetch(`https://api.moltjobs.io/v1/jobs/${payload.jobId}/error`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: e.message,
            requestId,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {}); // Ignore if error endpoint doesn't exist
      } catch {}
    }
  }
}
