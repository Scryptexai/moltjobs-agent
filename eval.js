// Autonomous Eval Completion Agent
// Completes MoltJobs General Fundamentals certification

import 'dotenv/config';
import axios from 'axios';

const API_KEY = process.env.MOLTJOBS_API_KEY;
const SESSION_ID = 'eval_mmfgevyarv686xrr';
const API_BASE = 'https://api.moltjobs.io/v1';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// LLM for answering questions (using Anthropic)
async function answerWithLLM(item) {
  const anthropicUrl = process.env.ANTHROPIC_BASE_URL;
  const anthropicToken = process.env.ANTHROPIC_AUTH_TOKEN;
  
  if (!anthropicUrl || !anthropicToken) {
    console.log('⚠️  Anthropic credentials missing, using fallback');
    return getFallbackAnswer(item);
  }
  
  let prompt = `You are taking a certification exam. Answer this question accurately and concisely.\n\n`;
  prompt += `Question: ${item.prompt}\n\n`;
  
  if (item.type === 'MCQ') {
    prompt += `Options:\n`;
    item.options.choices.forEach(choice => {
      prompt += `${choice.id}) ${choice.text}\n`;
    });
    prompt += `\nRespond with ONLY the letter of the correct answer (${item.options.choices.map(c => c.id).join(', ')}).`;
  } else if (item.type === 'SHORT_ANSWER') {
    prompt += `Provide a clear, concise answer in 1-2 sentences.`;
  } else if (item.type === 'STRUCTURED_TASK') {
    prompt += `Respond with a valid JSON object matching the required structure.`;
  }
  
  try {
    const response = await axios.post(
      `${anthropicUrl}/v1/messages`,
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': anthropicToken,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    let answer = response.data.content[0].text.trim();
    
    // Parse JSON if needed
    if (item.type === 'STRUCTURED_TASK' || item.type === 'API_TASK') {
      try {
        answer = JSON.parse(answer);
      } catch (e) {
        // Extract JSON from response
        const jsonMatch = answer.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          answer = JSON.parse(jsonMatch[0]);
        }
      }
    }
    
    return answer;
  } catch (e) {
    console.log('⚠️  LLM error:', e.message);
    return getFallbackAnswer(item);
  }
}

// Fallback answers when LLM fails
function getFallbackAnswer(item) {
  if (item.type === 'MCQ') {
    // Pick first option as fallback
    return item.options.choices[0].id;
  }
  if (item.type === 'SHORT_ANSWER') {
    return 'Unable to determine the answer';
  }
  if (item.type === 'STRUCTURED_TASK' || item.type === 'API_TASK') {
    return {};
  }
  return '';
}

// Get next question
async function getNext() {
  const { data } = await axios.get(
    `${API_BASE}/evals/${SESSION_ID}/next`,
    { headers }
  );
  return data.data;
}

// Submit answer
async function submitAnswer(itemId, answer, ttcMs) {
  await axios.post(
    `${API_BASE}/evals/${SESSION_ID}/items/${itemId}/answer`,
    { answer, ttcMs },
    { headers }
  );
}

// Send heartbeat
async function heartbeat() {
  await axios.post(
    `${API_BASE}/evals/${SESSION_ID}/heartbeat`,
    {},
    { headers }
  );
}

// Finalize eval
async function finalize() {
  const { data } = await axios.post(
    `${API_BASE}/evals/${SESSION_ID}/finalize`,
    {},
    { headers }
  );
  return data.data;
}

// Main eval loop
async function completeEval() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║      MoltJobs Certification Eval                          ║
╚═══════════════════════════════════════════════════════════╝

Session: ${SESSION_ID}
Target: 70% to pass
Items: 36 questions
Time limit: 1.5 hours

Starting evaluation...
  `);
  
  let itemCount = 0;
  let lastHeartbeat = Date.now();
  
  while (true) {
    // Get next item
    const item = await getNext();
    
    if (item.done) {
      console.log('\n✅ All questions completed!');
      break;
    }
    
    itemCount++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Question ${itemCount}/36`);
    console.log('='.repeat(60));
    console.log('Type:', item.type);
    console.log('Question:', item.prompt.substring(0, 100) + '...');
    
    if (item.type === 'MCQ') {
      console.log('\nOptions:');
      item.options.choices.forEach(choice => {
        console.log(`  ${choice.id}) ${choice.text.substring(0, 60)}...`);
      });
    }
    
    // Answer with LLM
    const startTime = Date.now();
    console.log('\n🤔 Thinking...');
    
    const answer = await answerWithLLM(item);
    const ttcMs = Date.now() - startTime;
    
    console.log('✅ Answer:', typeof answer === 'object' ? JSON.stringify(answer) : answer);
    console.log('⏱️  Time:', ttcMs + 'ms');
    
    // Submit answer
    await submitAnswer(item.itemId, answer, ttcMs);
    console.log('📤 Submitted');
    
    // Heartbeat every 60s
    if (Date.now() - lastHeartbeat > 60000) {
      await heartbeat();
      console.log('💓 Heartbeat sent');
      lastHeartbeat = Date.now();
    }
    
    // Small delay between questions
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Finalize
  console.log('\n📊 Finalizing evaluation...');
  const report = await finalize();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('🎓 EVALUATION COMPLETE');
  console.log('='.repeat(60));
  console.log('Score:', report.overallScore + '/100');
  console.log('Passed:', report.passed ? '✅ YES' : '❌ NO');
  console.log('Items completed:', report.itemsCompleted);
  console.log('Correct answers:', report.correctCount);
  
  if (report.passed) {
    console.log('\n🎉 CERTIFICATION EARNED!');
    console.log('Agent can now bid on jobs and earn USDC!');
    console.log('\n🚀 Run: npm start');
  } else {
    console.log('\n⚠️  Did not pass. Need 70% or higher.');
    console.log('You can retake the eval.');
  }
}

// Run
completeEval().catch(e => {
  console.error('\n❌ Error:', e.message);
  console.error('Response:', e.response?.data);
});
