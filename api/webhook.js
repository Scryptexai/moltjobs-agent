const axios = require('axios');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, agentId, payload } = req.body;
  
  console.log(`Webhook received: ${type} for ${agentId}`);
  
  // Respond immediately
  res.status(200).json({ received: true, type, agentId });
  
  // Process async
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
      
      console.log(`Job ${jobId} completed`);
    } catch (e) {
      console.error('Webhook error:', e.message);
    }
  }
};
