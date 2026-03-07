// Layer 2: Task Executor (handles different job types)
import { LLMProvider } from './llm-provider.js';

export class TaskExecutor {
  constructor(llmConfig) {
    this.llm = new LLMProvider(llmConfig);
  }

  async execute(job) {
    const context = this.buildContext(job);
    const prompt = this.buildPrompt(job, context);
    
    console.log(`\n🔧 Executing: ${job.title}`);
    console.log(`Type: ${job.template?.name || 'Unknown'}`);
    
    try {
      const response = await this.llm.complete(prompt, {
        maxTokens: this.getMaxTokens(job)
      });
      
      return this.formatOutput(response, job);
    } catch (e) {
      console.error(`❌ Execution failed: ${e.message}`);
      throw e;
    }
  }

  buildContext(job) {
    return {
      title: job.title,
      description: job.description,
      template: job.template?.name,
      budget: job.budgetUsdc,
      deadline: job.deadline,
      requirements: job.requirements || [],
      acceptanceCriteria: job.acceptanceCriteria || []
    };
  }

  buildPrompt(job, context) {
    let prompt = `You are an autonomous AI agent completing a job on MoltJobs marketplace.\n\n`;
    
    prompt += `JOB DETAILS:\n`;
    prompt += `Title: ${context.title}\n`;
    prompt += `Description: ${context.description}\n`;
    prompt += `Budget: $${context.budget} USDC\n\n`;
    
    if (context.requirements.length > 0) {
      prompt += `REQUIREMENTS:\n`;
      context.requirements.forEach((req, i) => {
        prompt += `${i + 1}. ${req}\n`;
      });
      prompt += `\n`;
    }
    
    if (context.acceptanceCriteria.length > 0) {
      prompt += `ACCEPTANCE CRITERIA:\n`;
      context.acceptanceCriteria.forEach((crit, i) => {
        prompt += `${i + 1}. ${crit}\n`;
      });
      prompt += `\n`;
    }
    
    prompt += `YOUR TASK:\n`;
    prompt += `Complete this job according to all requirements and acceptance criteria.\n`;
    prompt += `Provide high-quality, professional output that meets or exceeds expectations.\n\n`;
    
    // Template-specific instructions
    if (context.template) {
      prompt += this.getTemplateInstructions(context.template);
    }
    
    prompt += `\nProvide your complete deliverable now:`;
    
    return prompt;
  }

  getTemplateInstructions(templateName) {
    const instructions = {
      'Translation': 'Translate the text accurately while preserving tone and context.',
      'Content Writing': 'Write engaging, well-structured content with proper formatting.',
      'Data Entry': 'Enter data accurately with attention to detail and formatting.',
      'Code Review': 'Review code thoroughly, identify issues, and suggest improvements.',
      'Bug Fix': 'Identify the bug, explain the root cause, and provide a working fix.',
      'API Integration': 'Implement the integration with proper error handling and documentation.',
      'SEO Article': 'Write SEO-optimized content with keywords, headings, and meta descriptions.'
    };
    
    return instructions[templateName] || 'Complete the task according to specifications.';
  }

  getMaxTokens(job) {
    const budget = parseFloat(job.budgetUsdc);
    
    if (budget < 10) return 1000;
    if (budget < 50) return 2000;
    if (budget < 100) return 4000;
    return 8000;
  }

  formatOutput(response, job) {
    // Clean up response
    let output = response.trim();
    
    // Remove common LLM artifacts
    output = output.replace(/^(Here is|Here's|Sure,|Certainly,)/i, '').trim();
    
    return {
      deliverable: output,
      metadata: {
        completedAt: new Date().toISOString(),
        jobId: job.id,
        wordCount: output.split(/\s+/).length,
        characterCount: output.length
      }
    };
  }
}
