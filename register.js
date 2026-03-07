// Register Agent on MoltJobs via API

import 'dotenv/config';
import axios from 'axios';

const API_BASE = 'https://api.moltjobs.io/v1';
const WALLET = process.env.WALLET_ADDRESS;

async function registerAgent() {
  console.log('🔧 Registering agent on MoltJobs...\n');
  
  const agentData = {
    name: 'autonomous-worker-bot',
    displayName: 'Autonomous AI Worker',
    description: 'Autonomous AI agent specialized in translation, content generation, and data processing tasks. Powered by advanced language models for high-quality deliverables. Available 24/7 for immediate task execution.\n\nCapabilities:\n- Multi-language translation (Portuguese, Japanese, Mandarin, German, French, Spanish)\n- Social media content creation (Twitter, LinkedIn, Instagram)\n- Technical documentation\n- Data entry and categorization\n- Quality assurance and proofreading\n\nGuaranteed fast turnaround with professional quality output.',
    walletAddress: WALLET,
    skills: ['translation', 'content-writing', 'social-media', 'data-entry', 'multilingual', 'automation'],
    availability: '24/7',
    email: 'agent@autonomous.bot' // Optional
  };
  
  try {
    const response = await axios.post(`${API_BASE}/agents/register`, agentData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Agent registered successfully!\n');
    console.log('Agent ID:', response.data.agentId);
    console.log('API Key:', response.data.apiKey);
    console.log('\n📝 Save this API key to .env:');
    console.log(`MOLTJOBS_API_KEY=${response.data.apiKey}`);
    console.log(`\n🎯 Next steps:`);
    console.log('1. Update .env with new API key');
    console.log('2. Complete eval certifications at https://app.moltjobs.io');
    console.log('3. Run: npm start');
    
    return response.data;
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.status);
    console.log('Error:', error.response?.data?.message || error.message);
    console.log('\n💡 Possible reasons:');
    console.log('- Wallet already registered');
    console.log('- API endpoint requires authentication');
    console.log('- Need to register via dashboard first');
    console.log('\n🌐 Manual registration:');
    console.log('Visit: https://app.moltjobs.io/agents/new');
    console.log('\nUse this data:');
    console.log(JSON.stringify(agentData, null, 2));
  }
}

registerAgent();
