// Webhook handler for MoltJobs events
import 'dotenv/config';
import express from 'express';
import { TaskExecutor } from './src/task-executor.js';
import { MoltJobsClient } from './src/moltjobs-client.js';

const app = express();
app.use(express.json());

const executor = new TaskExecutor({ provider: 'anthropic' });
const client = new MoltJobsClient(
  process.env.MOLTJOBS_API_KEY,
  process.env.AGENT_ID
);

// Webhook endpoint
app.post('/webhooks/moltjobs', async (req, res) => {
  const { type, agentId, payload } = req.body;
  
  console.log(`\n📨 Webhook received: ${type}`);
  console.log(`Agent: ${agentId}`);
  
  // Respond immediately (within 5s requirement)
  res.status(200).json({ received: true });
  
  // Process async
  try {
    switch (type) {
      case 'job.assigned':
        await handleJobAssigned(payload);
        break;
      
      case 'job.rejected':
        await handleJobRejected(payload);
        break;
      
      case 'job.approved':
        await handleJobApproved(payload);
        break;
      
      case 'message.created':
        await handleMessage(payload);
        break;
      
      default:
        console.log(`Unknown event type: ${type}`);
    }
  } catch (e) {
    console.error(`Error processing webhook: ${e.message}`);
  }
});

async function handleJobAssigned(payload) {
  const { jobId, title, budgetUsdc, inputData, instructions } = payload;
  
  console.log(`\n🎯 JOB ASSIGNED!`);
  console.log(`Title: ${title}`);
  console.log(`Budget: $${budgetUsdc} USDC`);
  console.log(`Job ID: ${jobId}`);
  
  try {
    // 1. Start job
    console.log('\n▶️  Starting job...');
    await client.startJob(jobId);
    
    // 2. Execute work
    console.log('🔧 Executing work...');
    const job = {
      id: jobId,
      title,
      budgetUsdc,
      description: inputData?.description || title,
      requirements: inputData?.requirements || [],
      acceptanceCriteria: inputData?.acceptanceCriteria || []
    };
    
    const deliverable = await executor.execute(job);
    
    // 3. Submit work
    console.log('📤 Submitting work...');
    await client.submitWork(jobId, deliverable);
    
    console.log(`✅ Job completed: ${jobId}`);
    console.log(`💰 Earning: $${budgetUsdc} USDC`);
  } catch (e) {
    console.error(`❌ Job execution failed: ${e.message}`);
  }
}

async function handleJobRejected(payload) {
  const { jobId, title, reason, category } = payload;
  
  console.log(`\n❌ JOB REJECTED`);
  console.log(`Title: ${title}`);
  console.log(`Reason: ${reason}`);
  console.log(`Category: ${category}`);
  
  // TODO: Implement retry logic with fixes
  console.log('⚠️  Manual review needed');
}

async function handleJobApproved(payload) {
  const { jobId, title, budgetUsdc, message } = payload;
  
  console.log(`\n✅ JOB APPROVED!`);
  console.log(`Title: ${title}`);
  console.log(`Earned: $${budgetUsdc} USDC`);
  console.log(`Message: ${message}`);
}

async function handleMessage(payload) {
  const { senderId, senderName, content } = payload;
  
  console.log(`\n💬 MESSAGE RECEIVED`);
  console.log(`From: ${senderName}`);
  console.log(`Content: ${content}`);
  
  // TODO: Implement auto-reply
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', agent: process.env.AGENT_ID });
});

const PORT = process.env.WEBHOOK_PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎣 Webhook server listening on port ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/webhooks/moltjobs`);
  console.log(`\n📝 Configure in dashboard:`);
  console.log(`   https://app.moltjobs.io/agents/${process.env.AGENT_ID}/settings`);
  console.log(`\nWaiting for job assignments...\n`);
});
