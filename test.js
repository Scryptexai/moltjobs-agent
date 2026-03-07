// Test MoltJobs API with new key

import 'dotenv/config';
import axios from 'axios';

const API_KEY = process.env.MOLTJOBS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;
const API_BASE = 'https://api.moltjobs.io/v1';

const headers = {
  'X-Api-Key': API_KEY,
  'Content-Type': 'application/json'
};

console.log('🧪 Testing MoltJobs API...\n');
console.log('Agent ID:', AGENT_ID);
console.log('API Key:', API_KEY.substring(0, 20) + '...\n');

// Test 1: Heartbeat
async function testHeartbeat() {
  console.log('1️⃣ Testing heartbeat...');
  try {
    const response = await axios.post(
      `${API_BASE}/agents/${AGENT_ID}/heartbeat`,
      {},
      { headers }
    );
    console.log('✅ Heartbeat SUCCESS');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (e) {
    console.log('❌ Heartbeat FAILED');
    console.log('   Status:', e.response?.status);
    console.log('   Error:', e.response?.data || e.message);
    return false;
  }
}

// Test 2: Get jobs
async function testGetJobs() {
  console.log('\n2️⃣ Testing get jobs...');
  try {
    const response = await axios.get(
      `${API_BASE}/jobs`,
      { headers, params: { status: 'OPEN' } }
    );
    const jobs = response.data.data || [];
    console.log('✅ Get jobs SUCCESS');
    console.log('   Found:', jobs.length, 'jobs');
    if (jobs.length > 0) {
      console.log('   First job:', jobs[0].title, '-', jobs[0].budgetUsdc, 'USDC');
    }
    return jobs;
  } catch (e) {
    console.log('❌ Get jobs FAILED');
    console.log('   Error:', e.message);
    return [];
  }
}

// Test 3: Submit bid
async function testBid(jobId, amount) {
  console.log('\n3️⃣ Testing submit bid...');
  try {
    const response = await axios.post(
      `${API_BASE}/jobs/${jobId}/apply`,
      {
        agentId: AGENT_ID,
        bidAmount: amount.toString(),
        proposal: 'Test bid from autonomous agent'
      },
      { headers }
    );
    console.log('✅ Bid SUCCESS');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (e) {
    console.log('❌ Bid FAILED');
    console.log('   Status:', e.response?.status);
    console.log('   Error:', e.response?.data || e.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('='.repeat(60));
  
  const heartbeatOk = await testHeartbeat();
  const jobs = await testGetJobs();
  
  if (heartbeatOk && jobs.length > 0) {
    const testJob = jobs[0];
    const bidAmount = parseFloat(testJob.budgetUsdc) * 0.9;
    await testBid(testJob.id, bidAmount);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Tests complete\n');
  
  if (heartbeatOk) {
    console.log('✅ Agent is ACTIVE and ready to work!');
    console.log('\n🚀 Run: npm start');
  } else {
    console.log('⚠️  Agent needs configuration');
    console.log('\n📝 Check:');
    console.log('   - API key is correct');
    console.log('   - Agent ID is correct');
    console.log('   - Complete eval certifications');
  }
}

runTests();
