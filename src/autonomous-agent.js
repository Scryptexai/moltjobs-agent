// Layer 5: Autonomous Agent Orchestrator
import 'dotenv/config';
import { MoltJobsClient } from './moltjobs-client.js';
import { JobAnalyzer } from './job-analyzer.js';
import { TaskExecutor } from './task-executor.js';

export class AutonomousAgent {
  constructor(config) {
    this.client = new MoltJobsClient(config.apiKey, config.agentId);
    this.analyzer = new JobAnalyzer(config.analyzer);
    this.executor = new TaskExecutor(config.llm);
    
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 45000, // 45s
      jobCheckInterval: config.jobCheckInterval || 60000, // 60s
      bidMargin: config.bidMargin || 0.92, // Bid 92% of budget
      maxConcurrentJobs: config.maxConcurrentJobs || 3,
      ...config
    };
    
    this.state = {
      isRunning: false,
      activeJobs: new Set(),
      lastHeartbeat: null,
      lastJobCheck: null,
      stats: {
        jobsAnalyzed: 0,
        bidsSubmitted: 0,
        jobsCompleted: 0,
        totalEarned: 0
      }
    };
  }

  async start() {
    console.log('\n🚀 Starting Autonomous Agent...\n');
    
    // Verify connection
    try {
      const status = await this.client.getAgentStatus();
      console.log(`✅ Agent: ${status.name} (${status.id})`);
      console.log(`✅ Status: ${status.status}`);
      console.log(`✅ Certified: ${status.passedFundamentals ? 'Yes' : 'No'}`);
      
      if (!status.passedFundamentals) {
        console.log('\n⚠️  WARNING: Agent not certified. Cannot submit bids.');
        console.log('Complete eval at: https://app.moltjobs.io/evals\n');
      }
    } catch (e) {
      console.error('❌ Failed to connect:', e.message);
      return;
    }
    
    this.state.isRunning = true;
    
    // Start loops
    this.heartbeatLoop();
    this.jobDiscoveryLoop();
    this.workExecutionLoop();
    
    console.log('✅ Agent is now autonomous\n');
  }

  async stop() {
    console.log('\n🛑 Stopping agent...');
    this.state.isRunning = false;
  }

  async heartbeatLoop() {
    while (this.state.isRunning) {
      try {
        await this.client.heartbeat();
        this.state.lastHeartbeat = new Date();
        console.log(`💓 Heartbeat sent (${new Date().toLocaleTimeString()})`);
      } catch (e) {
        console.error('❌ Heartbeat failed:', e.message);
      }
      
      await this.sleep(this.config.heartbeatInterval);
    }
  }

  async jobDiscoveryLoop() {
    while (this.state.isRunning) {
      try {
        await this.discoverAndBid();
      } catch (e) {
        console.error('❌ Job discovery failed:', e.message);
      }
      
      await this.sleep(this.config.jobCheckInterval);
    }
  }

  async workExecutionLoop() {
    while (this.state.isRunning) {
      try {
        await this.executeActiveJobs();
      } catch (e) {
        console.error('❌ Work execution failed:', e.message);
      }
      
      await this.sleep(30000); // Check every 30s
    }
  }

  async discoverAndBid() {
    console.log('\n🔍 Discovering jobs...');
    
    const jobs = await this.client.getJobs({ status: 'OPEN' });
    console.log(`Found ${jobs.length} open jobs`);
    
    if (jobs.length === 0) return;
    
    // Analyze and bid on top opportunities
    const opportunities = [];
    
    for (const job of jobs) {
      this.state.stats.jobsAnalyzed++;
      
      const analysis = this.analyzer.analyze(job);
      
      if (analysis.shouldBid) {
        opportunities.push({ job, analysis });
      }
    }
    
    // Sort by score
    opportunities.sort((a, b) => b.analysis.score - a.analysis.score);
    
    console.log(`\n📊 Found ${opportunities.length} good opportunities:`);
    
    // Bid on top 3
    for (const opp of opportunities.slice(0, 3)) {
      await this.submitBid(opp.job, opp.analysis);
      await this.sleep(2000); // Rate limit
    }
  }

  async submitBid(job, analysis) {
    const budget = parseFloat(job.budgetUsdc);
    const proposedUsdc = (budget * this.config.bidMargin).toFixed(2);
    
    console.log(`\n💰 Bidding on: ${job.title}`);
    console.log(`   Budget: $${budget} → Bid: $${proposedUsdc}`);
    console.log(`   Score: ${(analysis.score * 100).toFixed(0)}%`);
    console.log(`   Rate: $${analysis.hourlyRate.toFixed(2)}/hr`);
    console.log(`   Reason: ${analysis.reasoning}`);
    
    try {
      const coverLetter = this.generateCoverLetter(job, analysis);
      
      await this.client.submitBid(job.id, {
        proposedUsdc,
        coverLetter,
        estimatedHours: analysis.estimatedHours
      });
      
      this.state.stats.bidsSubmitted++;
      console.log(`   ✅ Bid submitted`);
    } catch (e) {
      console.log(`   ❌ Bid failed: ${e.response?.data?.message || e.message}`);
    }
  }

  generateCoverLetter(job, analysis) {
    return `I can complete this ${job.template?.name || 'task'} in ${analysis.estimatedHours.toFixed(1)} hours with high quality output. My approach ensures all requirements and acceptance criteria are met. Ready to start immediately upon selection.`;
  }

  async executeActiveJobs() {
    const myJobs = await this.client.getMyJobs();
    const inProgress = myJobs.filter(j => j.status === 'IN_PROGRESS');
    
    for (const job of inProgress) {
      if (this.state.activeJobs.has(job.id)) continue;
      
      this.state.activeJobs.add(job.id);
      
      console.log(`\n🔧 Executing job: ${job.title}`);
      
      try {
        const deliverable = await this.executor.execute(job);
        
        await this.client.submitWork(job.id, deliverable);
        
        this.state.stats.jobsCompleted++;
        this.state.stats.totalEarned += parseFloat(job.budgetUsdc);
        
        console.log(`✅ Job completed: $${job.budgetUsdc} earned`);
        
        this.state.activeJobs.delete(job.id);
      } catch (e) {
        console.error(`❌ Execution failed: ${e.message}`);
        this.state.activeJobs.delete(job.id);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      ...this.state.stats,
      uptime: this.state.lastHeartbeat ? 
        Math.floor((Date.now() - this.state.lastHeartbeat) / 1000) : 0,
      activeJobs: this.state.activeJobs.size
    };
  }
}
