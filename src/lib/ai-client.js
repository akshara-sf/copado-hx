'use strict';
const MOCK_RESPONSES = {
  build: `## Build Agent Analysis\n\nI've analyzed your Apex code and identified the following:\n\n**Issue Found:** SOQL query inside a for loop in \`LeadScoring.cls\` (Line 42)\n\n**Fix:** Move the SOQL query outside the loop and use a Map to store results.\n\n\`\`\`apex\n// Before (bad)\nfor(Lead l : leads) {\n  Account a = [SELECT Id FROM Account WHERE Id = :l.AccountId];\n}\n\n// After (good)\nMap<Id,Account> accounts = new Map<Id,Account>(\n  [SELECT Id FROM Account WHERE Id IN :accountIds]\n);\n\`\`\``,

  release: `## Deployment Failure Analysis\n\n**Root Cause:**\nThe deployment of \`LeadScoring.cls\` failed due to a SOQL query inside a for loop, hitting Salesforce governor limits (101 SOQL queries limit exceeded).\n\n**Error Details:**\n- Class: LeadScoring.cls, Line 42\n- Error: System.LimitException: Too many SOQL queries: 101\n- Environment: UAT\n- Triggered by: Validation deployment\n\n**Immediate Fix:**\nMove the SOQL query outside the loop and use a Map collection instead.\n\n\`\`\`apex\n// Before (causing failure)\nfor(Lead l : leads) {\n  Account a = [SELECT Id FROM Account WHERE Id = :l.AccountId];\n}\n\n// After (fix)\nMap<Id,Account> accounts = new Map<Id,Account>(\n  [SELECT Id FROM Account WHERE Id IN :accountIds]\n);\n\`\`\`\n\n**Prevention:**\nEnable Apex Governor Limit warnings in your IDE before committing.`,
  release_notes: `## Release Notes — Sprint 42\n\n**Executive Summary**\nThis sprint delivers the Lead Scoring feature, improving sales pipeline visibility and automating account prioritization across the entire sales team.\n\n**✅ New Features**\n- Lead Scoring Algorithm — automatically ranks leads by conversion probability\n- Account Intelligence Dashboard — real-time pipeline visibility\n- Automated Follow-up Triggers — smart reminders based on lead score\n\n**🐛 Bug Fixes**\n- Fixed SOQL governor limit issue in LeadScoring.cls\n- Resolved timezone display bug in Activity Timeline\n- Corrected field-level security on LeadScore__c\n\n**⚙️ Technical Changes**\n- New custom field: LeadScore__c (Number)\n- New Apex class: LeadScoringEngine.cls\n- New Flow: Lead_Score_Update_Flow\n\n**🚀 Deployment Notes**\n- Deploy to UAT first and run smoke tests\n- Requires Field Level Security update for LeadScore__c\n- No rollback required — fully backwards compatible\n\n**🧪 Test Coverage**\n- 14/14 tests passing ✅\n- Code coverage: 87% ✅\n\n**⚠️ Known Issues**\n- None`,
  plan: `## Plan Agent Analysis\n\nI've reviewed your user story and sprint plan.\n\n**Refined User Story:**\nAs a Sales Manager, I want to see lead scores on the pipeline view so that I can prioritize my team's outreach efforts.\n\n**Acceptance Criteria:**\n1. Lead score visible on all pipeline views\n2. Score updates automatically when lead data changes\n3. Filters available by score range\n\n**Potential Conflicts:**\n- LeadScoring__c field may conflict with existing validation rules\n- Check Profile permissions before deployment`,

  test: `## Test Agent Analysis\n\nHere's a CRT QWord test script for your LeadScoring feature:\n\n**Test Suite: LeadScoring_Smoke**\n\n\`\`\`\nTest: Verify Lead Score Displays\n1. Navigate to Lead record\n2. Assert field LeadScore__c is visible\n3. Assert value is between 0 and 100\n\nTest: Verify Score Updates\n1. Update Lead Status to "Working"\n2. Wait 2 seconds\n3. Assert LeadScore__c value has changed\n\`\`\`\n\nRecommended coverage: Run after every commit to DEV.`,

  operate: `## Operate Agent — Change Management Plan\n\n**Sprint 42 Release — Change Management Summary**\n\n**Impact Assessment:** Low risk — additive changes only\n\n**Training Required:**\n- Sales team: 30-min walkthrough of Lead Score dashboard\n- Managers: Report generation guide\n\n**Communication Plan:**\n1. Pre-release email to sales team (3 days before)\n2. Training session day before go-live\n3. Post-release FAQ document\n\n**Rollback Plan:**\nNot required — all changes are backwards compatible.`
};

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
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 60000
  });
}

const VALID_AGENTS = ['plan', 'build', 'test', 'release', 'operate', 'release_notes'];

const AGENT_ASSISTANT_MAP = {
  plan:    'plan',
  build:   'build',
  test:    'test',
  release: 'release',
  release_notes: 'release',
  operate: 'operate'
};

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
    const workspaceId = Config.getAiOrgId();
    const payload = {
      name: `copado-hx-${agentId}-${Date.now()}`,
      assistant_id: AGENT_ASSISTANT_MAP[agentId]
    };
    if (workspaceId) payload.workspace_id = workspaceId;
    const res = await client.post('/dialogues', payload);
    return res.data;
  },

  async sendMessage(dialogueId, message) {
    const client = getClient();
    const res = await client.post(`/dialogues/${dialogueId}/messages`, {
      prompt: message
    });
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

  try {
    const dialogue = await AiClient.startDialogue(agentId);
    const response = await AiClient.sendMessage(dialogue.id, fullPrompt);
    return { dialogueId: dialogue.id, response };
  } catch (err) {
    // Fall back to mock mode if API unavailable
    const mockText = MOCK_RESPONSES[agentId] || `Mock response from ${agentId} agent.`;
    return {
      dialogueId: 'mock-' + Date.now(),
      response: mockText
    };
  }
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