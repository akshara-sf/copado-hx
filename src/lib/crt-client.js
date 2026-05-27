'use strict';

const axios = require('axios');
const Config = require('../config');

function getClient() {
  const baseURL = Config.getCrtBaseUrl();
  const pak = Config.getCrtPak();

  if (!pak) {
    throw new Error('CRT credentials not configured. Run `copado-hx auth login` first.');
  }

  return axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${pak}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30000
  });
}

const CrtClient = {
  async listJobs(projectId) {
    const client = getClient();
    const pid = projectId || Config.getCrtProjectId();
    const res = await client.get(`/pace/v4/projects/${pid}/jobs`);
    return res.data;
  },

  async triggerBuild(jobId, projectId) {
    const client = getClient();
    const pid = projectId || Config.getCrtProjectId();
    const res = await client.post(`/pace/v4/projects/${pid}/jobs/${jobId}/builds`, {});
    return res.data;
  },

  async getBuildStatus(jobId, buildId, projectId) {
    const client = getClient();
    const pid = projectId || Config.getCrtProjectId();
    const res = await client.get(`/pace/v4/projects/${pid}/jobs/${jobId}/builds/${buildId}`);
    return res.data;
  },

  async getBuildResults(jobId, buildId, projectId) {
    const client = getClient();
    const pid = projectId || Config.getCrtProjectId();
    const res = await client.get(`/pace/v4/projects/${pid}/jobs/${jobId}/builds/${buildId}/results`);
    return res.data;
  },

  async pollBuild(jobId, buildId, { interval = 10000, onTick, projectId } = {}) {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const build = await CrtClient.getBuildStatus(jobId, buildId, projectId);
          const status = (build.status || '').toLowerCase();
          if (onTick) onTick(build);
          if (status === 'succeeded' || status === 'passed') return resolve(build);
          if (status === 'failed' || status === 'error') return reject(new Error(`Test failed: ${build.status}`));
          setTimeout(poll, interval);
        } catch (err) {
          reject(err);
        }
      };
      poll();
    });
  }
};

module.exports = CrtClient;