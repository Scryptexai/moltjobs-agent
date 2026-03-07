module.exports = async (req, res) => {
  // CORS
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
  return res.status(200).json({ 
    received: true, 
    type, 
    agentId,
    timestamp: new Date().toISOString()
  });
};
