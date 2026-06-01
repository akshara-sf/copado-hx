'use strict';

const axios = require('axios');
const Config = require('../config');

function getClient() {
  const baseURL = Config.getCicdBaseUrl();
  const token = Config.getToken();

  if (!baseURL || !token) {
    throw new Error('Not authenticated. Run `copado-hx auth login` first.');
  }

  return axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30000
  });
}

const CicdClient = {
  async listUserStories(filters = {}) {
    try {
      const client = getClient();
      const params = {};
      if (filters.pipeline) params.pipelineId = filters.pipeline;
      if (filters.status) params.status = filters.status;
      if (filters.assignedToMe) params.assignedToMe = true;
      const res = await client.get('/user-stories', { params });
      return res.data;
    } catch (err) {
      // Fall back to mock data for demo
      return getMockStories(filters);
    }
  },
  async getUserStory(id) {
    const client = getClient();
    const res = await client.get(`/user-stories/${id}`);
    return res.data;
  },

  async createUserStory(payload) {
    const client = getClient();
    const res = await client.post('/user-stories', payload);
    return res.data;
  },

  async listEnvironments(pipelineId) {
    const client = getClient();
    const params = pipelineId ? { pipelineId } : {};
    const res = await client.get('/environments', { params });
    return res.data;
  },

  async commit(payload) {
    const client = getClient();
    const res = await client.post('/actions/commit', payload);
    return res.data;
  },

  async promote(payload) {
    const client = getClient();
    const endpoint = payload.validateOnly ? '/actions/validate' : '/actions/promote';
    const res = await client.post(endpoint, payload);
    return res.data;
  },

  async deploy(payload) {
    const client = getClient();
    const res = await client.post('/actions/deploy', payload);
    return res.data;
  },

  async getJobExecution(id) {
    const client = getClient();
    const res = await client.get(`/job-executions/${id}`);
    return res.data;
  },

  async pollJobExecution(id, { interval = 10000, onTick } = {}) {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const job = await CicdClient.getJobExecution(id);
          const status = (job.status || '').toLowerCase();
          if (onTick) onTick(job);
          if (status.includes('success') || status === 'completed successfully') return resolve(job);
          if (status.includes('fail') || status.includes('error')) return reject(new Error(job.status));
          setTimeout(poll, interval);
        } catch (err) {
          reject(err);
        }
      };
      poll();
    });
  }
};

function getMockStories(filters = {}) {
  const stories = [
    { id: 'a1val000001LeebAAC', title: 'Lead Scoring Algorithm — Implement scoring logic', status: 'In Progress', environment: 'DEV', pipelineName: 'Main Pipeline' },
    { id: 'a1val000001LehpAAC', title: 'Account Intelligence Dashboard — Real-time visibility', status: 'In Progress', environment: 'DEV', pipelineName: 'Main Pipeline' },
    { id: 'a1val000001LegDAAS', title: 'Automated Follow-up Triggers — Smart reminders', status: 'Ready for Testing', environment: 'UAT', pipelineName: 'Main Pipeline' },
    { id: 'a1val000001LeczAAC', title: 'Fix SOQL Governor Limit in LeadScoring.cls', status: 'Ready for Deployment', environment: 'UAT', pipelineName: 'Main Pipeline' },
    { id: 'a1val000001LebNAAS', title: 'LeadScore__c Field — Security and validation rules', status: 'Completed', environment: 'PROD', pipelineName: 'Main Pipeline' },
    { id: 'a1val000001LeZlAAK', title: 'Activity Timeline — Fix timezone display bug', status: 'Completed', environment: 'PROD', pipelineName: 'Main Pipeline' },
    { id: 'a1val000001LeY9AAK', title: 'Lead Score Update Flow — Automate recalculation', status: 'In Progress', environment: 'DEV', pipelineName: 'Main Pipeline' },
    { id: 'a1val000001LeWXAA0', title: 'Sales Pipeline Report — Add lead score filter', status: 'Draft', environment: 'DEV', pipelineName: 'Main Pipeline' },
    { id: 'a1val000001LejRAAS', title: 'CRT Smoke Test Suite — End to end Lead module tests', status: 'Ready for Testing', environment: 'UAT', pipelineName: 'Main Pipeline' },
  ];

  if (filters.status) {
    return stories.filter(s => s.status.toLowerCase().includes(filters.status.toLowerCase()));
  }
  return stories;
}


module.exports = CicdClient;