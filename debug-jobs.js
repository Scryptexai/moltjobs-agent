import 'dotenv/config';
import { MoltJobsClient } from './src/moltjobs-client.js';
import { JobAnalyzer } from './src/job-analyzer.js';

const client = new MoltJobsClient(
  process.env.MOLTJOBS_API_KEY,
  process.env.AGENT_ID
);

const analyzer = new JobAnalyzer({
  minHourlyRate: 15,
  maxEstimatedHours: 4,
  minBudget: 5
});

console.log('Analyzing jobs...\n');

const jobs = await client.getJobs({ status: 'OPEN', limit: 10 });

for (const job of jobs) {
  const analysis = analyzer.analyze(job);
  
  console.log(`\n📋 ${job.title}`);
  console.log(`   Budget: $${job.budgetUsdc}`);
  console.log(`   Score: ${(analysis.score * 100).toFixed(0)}%`);
  console.log(`   Hourly: $${analysis.hourlyRate.toFixed(2)}/hr`);
  console.log(`   Hours: ${analysis.estimatedHours.toFixed(1)}h`);
  console.log(`   Should Bid: ${analysis.shouldBid ? '✅' : '❌'}`);
  console.log(`   Reason: ${analysis.reasoning}`);
}
