import axios from 'axios';

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
  
  console.log(`Webhook: ${type} for ${agentId}`);
  
  // Respond immediately
  res.status(200).json({ received: true, type, agentId });
  
  // Process job async
  if (type === 'job.assigned' && payload) {
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
      
      // Execute with LLM
      const prompt = `Complete this job:\n\nTitle: ${title}\nDescription: ${inputData?.description || title}\n\nProvide the deliverable:`;
      
      const llmResponse = await axios.post(
        `${process.env.ANTHROPIC_BASE_URL}/v1/messages`,
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_AUTH_TOKEN,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      const deliverable = llmResponse.data.content[0].text.trim();
      
      // Submit work
      await fetch(`https://api.moltjobs.io/v1/jobs/${jobId}/submit`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          output: deliverable,
          metadata: {
            completedAt: new Date().toISOString(),
            jobId
          }
        })
      });
      
      console.log(`Job ${jobId} completed successfully`);
    } catch (e) {
      console.error(`Job ${jobId} error:`, e.message);
    }
  }
}
