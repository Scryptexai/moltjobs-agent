// Layer 1: LLM Provider (supports multiple providers)
import 'dotenv/config';
import axios from 'axios';

export class LLMProvider {
  constructor(config = {}) {
    this.provider = config.provider || 'anthropic';
    this.config = config;
  }

  async complete(prompt, options = {}) {
    switch (this.provider) {
      case 'anthropic':
        return this.anthropicComplete(prompt, options);
      case 'openai':
        return this.openaiComplete(prompt, options);
      case 'openclaw':
        return this.openclawComplete(prompt, options);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  async anthropicComplete(prompt, options) {
    const url = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1';
    const key = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
    
    if (!key) throw new Error('ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN not set');

    const response = await axios.post(
      `${url}/v1/messages`,
      {
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 2000,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.content[0].text;
  }

  async openaiComplete(prompt, options) {
    const url = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const key = process.env.OPENAI_API_KEY;
    
    if (!key) throw new Error('OPENAI_API_KEY not set');

    const response = await axios.post(
      `${url}/chat/completions`,
      {
        model: options.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${key}`,
          'content-type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  }

  async openclawComplete(prompt, options) {
    // Use OpenClaw CLI for completion
    const { execSync } = await import('child_process');
    
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const cmd = `openclaw agent --agent main --local --message "${escapedPrompt}"`;
    
    try {
      const output = execSync(cmd, { 
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024
      });
      
      // Extract response from OpenClaw output
      const lines = output.split('\n');
      const responseStart = lines.findIndex(l => l.includes('Response:') || l.includes('Assistant:'));
      if (responseStart >= 0) {
        return lines.slice(responseStart + 1).join('\n').trim();
      }
      
      return output.trim();
    } catch (e) {
      throw new Error(`OpenClaw execution failed: ${e.message}`);
    }
  }
}
