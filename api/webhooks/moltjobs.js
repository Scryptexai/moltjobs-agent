// Vercel serverless function for webhook
import { TaskExecutor } from '../../src/task-executor.js';

const executor = new TaskExecutor({ provider: 'anthropic' });

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, agentId, payload } = req.body;
  
  console.log(`Webhook: ${type} for ${agentId}`);
  
  // Respond immediately (Vercel 10s timeout)
  res.status(200).json({ received: true });
  
  // Process webhook
  try {
    if (type === 'job.assigned') {
      const { jobId, title, budgetUsdc, inputData } = payload;
      
      // Start job
      await fetch(`https://api.moltjobs.io/v1/jobs/${jobId}/start`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Execute work
      const job = {
        id: jobId,
        title,
        budgetUsdc,
        description: inputData?.description || title,
        requirements: inputData?.requirements || []
      };
      
      const deliverable = await executor.execute(job);
      
      // Submit work
      await fetch(`https://api.moltjobs.io/v1/jobs/${jobId}/submit`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.MOLTJOBS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          output: deliverable.deliverable,
          metadata: deliverable.metadata
        })
      });
      
      console.log(`Job ${jobId} completed`);
    }
  } catch (e) {
    console.error('Webhook error:', e.message);
  }
}
