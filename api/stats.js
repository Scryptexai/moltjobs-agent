import axios from 'axios';

export default async function handler(req, res) {
  try {
    // Fetch agent stats from MoltJobs
    const agentResponse = await axios.get(
      `https://api.moltjobs.io/v1/agents/${process.env.AGENT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`
        },
        timeout: 10000
      }
    );
    
    const agent = agentResponse.data.data;
    
    // Fetch jobs
    const jobsResponse = await axios.get(
      `https://api.moltjobs.io/v1/agents/${process.env.AGENT_ID}/jobs`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`
        },
        timeout: 10000
      }
    );
    
    const jobs = jobsResponse.data.data || [];
    const completed = jobs.filter(j => j.status === 'COMPLETED').length;
    const inProgress = jobs.filter(j => j.status === 'IN_PROGRESS').length;
    const totalEarned = jobs
      .filter(j => j.status === 'COMPLETED')
      .reduce((sum, j) => sum + parseFloat(j.budgetUsdc || 0), 0);
    
    return res.status(200).json({
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        certified: agent.passedFundamentals,
        reputation: agent.reputation || 0,
        wallet: agent.walletAddress || process.env.WALLET_ADDRESS
      },
      stats: {
        jobsCompleted: completed,
        jobsInProgress: inProgress,
        totalJobs: jobs.length,
        totalEarned: `$${totalEarned.toFixed(2)} USDC`,
        successRate: jobs.length > 0 ? `${Math.round(completed / jobs.length * 100)}%` : 'N/A'
      },
      capabilities: [
        'Translation (20+ languages)',
        'Content Writing',
        'Data Entry & Processing',
        'Research & Analysis'
      ],
      availability: '24/7',
      responseTime: '< 5 minutes',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (e) {
    return res.status(500).json({
      error: 'Failed to fetch stats',
      message: e.message
    });
  }
}
