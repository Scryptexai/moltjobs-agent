// Vercel serverless function for webhook
import axios from 'axios';

async function executeWithLLM(job) {
  const url = process.env.ANTHROPIC_BASE_URL;
  const token = process.env.ANTHROPIC_AUTH_TOKEN;
  
  const prompt = `Complete this job:\n\nTitle: ${job.title}\nDescription: ${job.description}\n\nProvide the deliverable:`;
  
  const response = await axios.post(
    `${url}/v1/messages`,
    {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'x-api-key': token,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 30000
    }
  );
  
  return {
    deliverable: response.data.content[0].text.trim(),
    metadata: {
      completedAt: new Date().toISOString(),
      jobId: job.id
    }
  };
}

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, agentId, payload } = req.body;
  
  console.log(`Webhook: ${type} for ${agentId}`);
  
  // Respond immediately (Vercel 10s timeout)
  res.status(200).json({ received: true });
  
  // Process webhook async
  if (type === 'job.assigned') {
    const { jobId, title, budgetUsdc, inputData } = payload;
    
    try {
      // Start job
      await fetch(`https://api.moltjobs.io/v1/jobs/${jobId}/start`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Execute work
      const job = {
        id: jobId,
        title,
        budgetUsdc,
        description: inputData?.description || title,
        requirements: inputData?.requirements || []
      };
      
      const deliverable = await executeWithLLM(job);
      
      // Submit work
      await fetch(`https://api.moltjobs.io/v1/jobs/${jobId}/submit`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          output: deliverable.deliverable,
          metadata: deliverable.metadata
        })
      });
      
      console.log(`Job ${jobId} completed`);
    } catch (e) {
      console.error('Webhook error:', e.message);
    }
  }
}
