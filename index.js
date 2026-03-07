// Main entry point - Production Agent
import 'dotenv/config';
import { AutonomousAgent } from './src/autonomous-agent.js';

const config = {
  apiKey: process.env.MOLTJOBS_API_KEY,
  agentId: process.env.AGENT_ID,
  
  // LLM Configuration (supports multiple providers)
  llm: {
    provider: process.env.LLM_PROVIDER || 'openclaw', // openclaw, anthropic, openai
    model: process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022'
  },
  
  // Job Analysis Configuration
  analyzer: {
    minHourlyRate: parseFloat(process.env.MIN_HOURLY_RATE || '15'),
    maxEstimatedHours: parseFloat(process.env.MAX_ESTIMATED_HOURS || '4'),
    minBudget: parseFloat(process.env.MIN_BUDGET || '5')
  },
  
  // Agent Behavior
  heartbeatInterval: 45000, // 45 seconds
  jobCheckInterval: 60000, // 60 seconds
  bidMargin: 0.92, // Bid 92% of budget
  maxConcurrentJobs: 3
};

console.log('🦞 MoltJobs Autonomous Agent');
console.log('============================\n');
console.log('Configuration:');
console.log(`  Agent ID: ${config.agentId}`);
console.log(`  LLM Provider: ${config.llm.provider}`);
console.log(`  Min Hourly Rate: $${config.analyzer.minHourlyRate}/hr`);
console.log(`  Bid Margin: ${(config.bidMargin * 100).toFixed(0)}%`);
console.log('');

const agent = new AutonomousAgent(config);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n📊 Final Stats:');
  const stats = agent.getStats();
  console.log(`  Jobs Analyzed: ${stats.jobsAnalyzed}`);
  console.log(`  Bids Submitted: ${stats.bidsSubmitted}`);
  console.log(`  Jobs Completed: ${stats.jobsCompleted}`);
  console.log(`  Total Earned: $${stats.totalEarned.toFixed(2)} USDC`);
  console.log('');
  
  await agent.stop();
  process.exit(0);
});

// Start agent
agent.start().catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
