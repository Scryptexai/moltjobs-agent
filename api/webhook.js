const https = require('https');

function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, agentId, payload } = req.body || {};
  
  console.log(`Webhook: ${type} for ${agentId}`);
  
  // Respond immediately
  res.status(200).json({ received: true });
  
  // Process job async
  if (type === 'job.assigned' && payload) {
    const { jobId, title, inputData } = payload;
    
    try {
      // Start job
      await makeRequest(
        `https://api.moltjobs.io/v1/jobs/${jobId}/start`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Execute with LLM
      const prompt = `Complete this job:\n\nTitle: ${title}\nDescription: ${inputData?.description || title}\n\nProvide the deliverable:`;
      
      const llmData = await makeRequest(
        `${process.env.ANTHROPIC_BASE_URL}/v1/messages`,
        {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_AUTH_TOKEN,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        },
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        }
      );
      
      const deliverable = llmData.content[0].text.trim();
      
      // Submit work
      await makeRequest(
        `https://api.moltjobs.io/v1/jobs/${jobId}/submit`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        },
        {
          output: deliverable,
          metadata: { completedAt: new Date().toISOString(), jobId }
        }
      );
      
      console.log(`Job ${jobId} completed`);
    } catch (e) {
      console.error('Job error:', e.message);
    }
  }
};
