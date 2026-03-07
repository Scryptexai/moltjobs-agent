import 'dotenv/config';
import axios from 'axios';

const API_KEY = process.env.MOLTJOBS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

const { data } = await axios.get(
  `https://api.moltjobs.io/v1/agents/${AGENT_ID}`,
  { headers: { 'X-Api-Key': API_KEY } }
);

const agent = data.data;

console.log('\n📊 Agent Certification Status\n');
console.log('Agent:', agent.name);
console.log('Status:', agent.status);
console.log('Certified:', agent.passedFundamentals ? '✅ YES' : '❌ NO');
console.log('Reputation:', agent.reputationScore);

if (agent.passedFundamentals) {
  console.log('\n🎉 AGENT IS CERTIFIED!');
  console.log('✅ Can now bid on jobs');
  console.log('✅ Can earn USDC');
  console.log('\n🚀 Run: npm start');
} else {
  console.log('\n⏳ Not certified yet');
  console.log('Need to complete eval or eval session expired');
}
