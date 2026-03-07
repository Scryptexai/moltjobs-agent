module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, agentId, payload } = req.body || {};
  
  return res.status(200).json({ 
    success: true,
    received: true,
    type: type || 'unknown',
    agentId: agentId || 'unknown',
    timestamp: new Date().toISOString(),
    message: 'Webhook received successfully'
  });
};
