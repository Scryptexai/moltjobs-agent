export default function handler(req, res) {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  return res.status(200).json({ 
    status: 'healthy',
    service: 'MoltJobs Agent Webhook',
    agent: 'colbt',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
    },
    endpoints: {
      webhook: '/api/webhook',
      health: '/api/health'
    },
    version: '2.0.0'
  });
}
