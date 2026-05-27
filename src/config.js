'use strict';

const Configstore = require('configstore');
const pkg = require('../package.json');

const store = new Configstore(pkg.name);

const Config = {
  getToken: () => store.get('auth.token'),
  setToken: (token) => store.set('auth.token', token),
  clearToken: () => store.delete('auth.token'),

  getCicdBaseUrl: () => store.get('cicd.baseUrl'),
  setCicdBaseUrl: (url) => store.set('cicd.baseUrl', url),

  getCrtBaseUrl: () => store.get('crt.baseUrl') || 'https://app.copado.com',
  setCrtBaseUrl: (url) => store.set('crt.baseUrl', url),
  getCrtPak: () => store.get('crt.pak'),
  setCrtPak: (pak) => store.set('crt.pak', pak),
  getCrtProjectId: () => store.get('crt.projectId'),
  setCrtProjectId: (id) => store.set('crt.projectId', id),

  getAiApiKey: () => store.get('ai.apiKey'),
  setAiApiKey: (key) => store.set('ai.apiKey', key),
  getAiBaseUrl: () => store.get('ai.baseUrl') || 'https://copadogpt-api.robotic.copado.com',
  setAiBaseUrl: (url) => store.set('ai.baseUrl', url),
  getAiOrgId: () => store.get('ai.orgId'),
  setAiOrgId: (id) => store.set('ai.orgId', id),

  getCurrentStory: () => store.get('context.currentStory'),
  setCurrentStory: (story) => store.set('context.currentStory', story),
  clearCurrentStory: () => store.delete('context.currentStory'),

  getAll: () => store.all,
  clearAll: () => store.clear(),

  isAuthenticated: () => {
    return !!(store.get('auth.token') && store.get('cicd.baseUrl'));
  }
};

module.exports = Config;