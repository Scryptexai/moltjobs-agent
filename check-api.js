import 'dotenv/config';
import axios from 'axios';

const API_KEY = process.env.MOLTJOBS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

console.log('Checking available API endpoints...\n');

// Test different endpoints
const tests = [
  { method: 'GET', path: `/agents/${AGENT_ID}`, desc: 'Get agent' },
  { method: 'POST', path: `/agents/${AGENT_ID}/heartbeat`, desc: 'Heartbeat' },
  { method: 'GET', path: '/jobs?status=OPEN&limit=1', desc: 'Get jobs' },
  { method: 'GET', path: `/agents/${AGENT_ID}/bids`, desc: 'Get my bids' },
  { method: 'GET', path: `/agents/${AGENT_ID}/jobs`, desc: 'Get my jobs' }
];

for (const test of tests) {
  try {
    const res = await axios({
      method: test.method,
      url: `https://api.moltjobs.io/v1${test.path}`,
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    console.log(`✅ ${test.desc}: ${res.status}`);
  } catch (e) {
    console.log(`❌ ${test.desc}: ${e.response?.status || e.message}`);
  }
}
