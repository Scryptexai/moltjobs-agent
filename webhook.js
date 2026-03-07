// Webhook Handler for MoltJobs Events
// Receives notifications when jobs are assigned, bids accepted, payments received

import express from 'express';
import crypto from 'crypto';
import 'dotenv/config';

const app = express();
app.use(express.json());

const PORT = process.env.WEBHOOK_PORT || 3000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

// Verify webhook signature
function verifySignature(payload, signature) {
  const hash = crypto
    .createHmac('sha256', SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
}

// Handle job assigned
async function handleJobAssigned(data) {
  console.log('🎯 Job assigned:', data.jobId);
  console.log('   Title:', data.title);
  console.log('   Budget:', data.budget, 'USDC');
  
  // Auto-execute job
  // Your agent code here
}

// Handle bid accepted
async function handleBidAccepted(data) {
  console.log('✅ Bid accepted:', data.jobId);
  console.log('   Amount:', data.bidAmount, 'USDC');
  
  // Start work immediately
}

// Handle payment received
async function handlePayment(data) {
  console.log('💰 Payment received:', data.amount, 'USDC');
  console.log('   Job:', data.jobId);
  console.log('   Wallet:', data.walletAddress);
}

// Handle deadline approaching
async function handleDeadline(data) {
  console.log('⏰ Deadline approaching:', data.jobId);
  console.log('   Time left:', data.hoursRemaining, 'hours');
}

// Webhook endpoint
app.post('/webhooks/moltjobs', (req, res) => {
  const signature = req.headers['x-moltjobs-signature'];
  
  // Verify signature
  if (signature && !verifySignature(req.body, signature)) {
    console.log('❌ Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data, timestamp } = req.body;
  
  console.log(`\n📨 Webhook received: ${event}`);
  console.log('   Time:', new Date(timestamp).toLocaleString());
  
  // Route to handlers
  switch(event) {
    case 'job.assigned':
      handleJobAssigned(data);
      break;
      
    case 'bid.accepted':
      handleBidAccepted(data);
      break;
      
    case 'bid.rejected':
      console.log('❌ Bid rejected:', data.jobId);
      break;
      
    case 'payment.received':
      handlePayment(data);
      break;
      
    case 'job.deadline_approaching':
      handleDeadline(data);
      break;
      
    case 'message.received':
      console.log('💬 Message from client:', data.message);
      break;
      
    default:
      console.log('ℹ️  Unknown event:', event);
  }
  
  res.status(200).json({ received: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║      MoltJobs Webhook Handler                             ║
╚═══════════════════════════════════════════════════════════╝

Listening on: http://localhost:${PORT}
Webhook URL: http://localhost:${PORT}/webhooks/moltjobs
Health check: http://localhost:${PORT}/health

Subscribed events:
  • job.assigned
  • bid.accepted
  • bid.rejected
  • payment.received
  • job.deadline_approaching
  • message.received

Ready to receive webhooks...
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down webhook handler...');
  process.exit(0);
});
