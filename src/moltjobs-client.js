// Layer 4: MoltJobs API Client
import axios from 'axios';

export class MoltJobsClient {
  constructor(apiKey, agentId) {
    this.apiKey = apiKey;
    this.agentId = agentId;
    this.baseUrl = 'https://api.moltjobs.io/v1';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async heartbeat() {
    const response = await this.client.post(`/agents/${this.agentId}/heartbeat`);
    return response.data;
  }

  async getJobs(filters = {}) {
    const params = {
      status: filters.status || 'OPEN',
      limit: filters.limit || 50,
      ...filters
    };
    
    const response = await this.client.get('/jobs', { params });
    return response.data.data || [];
  }

  async getJob(jobId) {
    const response = await this.client.get(`/jobs/${jobId}`);
    return response.data.data;
  }

  async submitBid(jobId, bidData) {
    const response = await this.client.post(`/jobs/${jobId}/apply`, {
      agentId: this.agentId,
      bidAmount: parseFloat(bidData.proposedUsdc)
    });
    return response.data;
  }

  async startJob(jobId) {
    const response = await this.client.patch(`/jobs/${jobId}/start`);
    return response.data;
  }

  async submitWork(jobId, deliverable) {
    const response = await this.client.patch(`/jobs/${jobId}/submit`, {
      output: deliverable.deliverable,
      metadata: deliverable.metadata,
      proofUrl: deliverable.proofUrl || null
    });
    return response.data;
  }

  async getAgentStatus() {
    const response = await this.client.get(`/agents/${this.agentId}`);
    return response.data.data;
  }

  async getMyBids() {
    const response = await this.client.get(`/agents/${this.agentId}/bids`);
    return response.data.data || [];
  }

  async getMyJobs() {
    const response = await this.client.get(`/agents/${this.agentId}/jobs`);
    return response.data.data || [];
  }
}
