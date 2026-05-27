'use strict';

const axios = require('axios');
const Config = require('../config');

function getClient() {
  const baseURL = Config.getAiBaseUrl();
  const apiKey = Config.getAiApiKey();

  if (!apiKey) {
    throw new Error('Copado AI not configured. Run `copado-hx auth login` first.');
  }

  return axios.create({
    baseURL,
    headers: {
      'X-Authorization': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 60000
  });
}

const VALID_AGENTS = ['plan', 'build', 'test', 'release', 'operate'];

const AI_AGENT_DESCRIPTIONS = {
  plan:    'Plan Agent    — User story refinement, conflict detection, sprint planning',
  build:   'Build Agent   — Code generation, metadata analysis, Apex review',
  test:    'Test Agent    — CRT QWord test scripts, coverage advice',
  release: 'Release Agent — Deployments, job error analysis, release notes',
  operate: 'Operate Agent — Post-release docs, change management, troubleshooting'
};

const AiClient = {
  VALID_AGENTS,
  AI_AGENT_DESCRIPTIONS,

  async startDialogue(agentId) {
    if (!VALID_AGENTS.includes(agentId)) {
      throw new Error(`Invalid agent "${agentId}". Valid: ${VALID_AGENTS.join(', ')}`);
    }
    const client = getClient();
    const orgId = Config.getAiOrgId();
    const payload = { agentId };
    if (orgId) payload.organizationId = orgId;
    const res = await client.post('/dialogues', payload);
    return res.data;
  },

  async sendMessage(dialogueId, message) {
    const client = getClient();
    const res = await client.post(`/dialogues/${dialogueId}/messages`, { message });
    return res.data;
  },

  async getDialogue(dialogueId) {
    const client = getClient();
    const res = await client.get(`/dialogues/${dialogueId}`);
    return res.data;
  },

  async ask(agentId, prompt, userStoryContext = null) {
    const fullPrompt = userStoryContext
      ? `[Context: User Story ${userStoryContext}]\n\n${prompt}`
      : prompt;
    const dialogue = await AiClient.startDialogue(agentId);
    const response = await AiClient.sendMessage(dialogue.id, fullPrompt);
    return { dialogueId: dialogue.id, response };
  },

  async listWorkspaces() {
    const client = getClient();
    const orgId = Config.getAiOrgId();
    if (!orgId) throw new Error('AI org ID not configured.');
    const res = await client.get(`/organizations/${orgId}/workspaces`);
    return res.data;
  }
};

module.exports = AiClient;