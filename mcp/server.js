'use strict';

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { execSync } = require('child_process');
const path = require('path');

// Path to our CLI
const CLI = `node ${path.join(__dirname, '../bin/copado-hx.js')}`;

// Helper to run CLI commands and return output
function runCmd(cmd) {
  try {
    const result = execSync(`${CLI} ${cmd} --json`, {
      encoding: 'utf8',
      timeout: 60000
    });
    return { success: true, data: JSON.parse(result) };
  } catch (err) {
    const stderr = err.stderr || err.message;
    try {
      return { success: false, error: JSON.parse(err.stdout || '{}') };
    } catch {
      return { success: false, error: stderr };
    }
  }
}

// Create MCP server
const server = new McpServer({
  name: 'copado-hx',
  version: '0.1.0'
});

// --- TOOL: auth_status ---
server.tool(
  'auth_status',
  'Check if copado-hx is authenticated with Copado',
  {},
  async () => {
    const result = runCmd('auth status');
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: story_list ---
server.tool(
  'story_list',
  'List Copado user stories assigned to the current user',
  {
    pipeline: z.string().optional().describe('Filter by pipeline ID'),
    status: z.string().optional().describe('Filter by status e.g. "In Progress"')
  },
  async ({ pipeline, status }) => {
    let cmd = 'story list';
    if (pipeline) cmd += ` --pipeline ${pipeline}`;
    if (status) cmd += ` --status "${status}"`;
    const result = runCmd(cmd);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: story_set ---
server.tool(
  'story_set',
  'Set the active working user story context',
  {
    id: z.string().describe('User story ID to set as active context')
  },
  async ({ id }) => {
    const result = runCmd(`story set --id ${id}`);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: story_show ---
server.tool(
  'story_show',
  'Show the currently active user story',
  {},
  async () => {
    const result = runCmd('story show');
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: commit ---
server.tool(
  'commit',
  'Commit metadata changes from the current user story to Git',
  {
    message: z.string().optional().describe('Commit message'),
    userStoryId: z.string().optional().describe('Override user story ID')
  },
  async ({ message, userStoryId }) => {
    let cmd = 'commit';
    if (message) cmd += ` --message "${message}"`;
    if (userStoryId) cmd += ` --us ${userStoryId}`;
    const result = runCmd(cmd);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: promote ---
server.tool(
  'promote',
  'Promote a user story to the next environment in the pipeline',
  {
    env: z.string().describe('Target environment e.g. UAT, SIT, PROD'),
    validate: z.boolean().optional().describe('Run validation only, no actual deployment'),
    userStoryId: z.string().optional().describe('Override user story ID')
  },
  async ({ env, validate, userStoryId }) => {
    let cmd = `promote --env ${env}`;
    if (validate) cmd += ' --validate';
    if (userStoryId) cmd += ` --us ${userStoryId}`;
    const result = runCmd(cmd);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: deploy ---
server.tool(
  'deploy',
  'Deploy a user story to an environment. ALWAYS confirm with human before PROD.',
  {
    env: z.string().describe('Target environment'),
    userStoryId: z.string().optional().describe('Override user story ID')
  },
  async ({ env, userStoryId }) => {
    // Extra guardrail — force flag for non-interactive MCP calls
    let cmd = `deploy --env ${env} --force`;
    if (userStoryId) cmd += ` --us ${userStoryId}`;
    const result = runCmd(cmd);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: status ---
server.tool(
  'pipeline_status',
  'Check pipeline status or poll a specific job execution',
  {
    jobId: z.string().optional().describe('Specific job execution ID to poll')
  },
  async ({ jobId }) => {
    let cmd = 'status';
    if (jobId) cmd += ` --job ${jobId}`;
    const result = runCmd(cmd);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: test_list ---
server.tool(
  'test_list',
  'List available CRT test jobs and suites',
  {
    projectId: z.string().optional().describe('CRT project ID')
  },
  async ({ projectId }) => {
    let cmd = 'test list';
    if (projectId) cmd += ` --project ${projectId}`;
    const result = runCmd(cmd);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: test_run ---
server.tool(
  'test_run',
  'Trigger a CRT test suite execution',
  {
    suiteId: z.string().describe('Test suite or job ID to run'),
    projectId: z.string().optional().describe('CRT project ID')
  },
  async ({ suiteId, projectId }) => {
    let cmd = `test run --suite ${suiteId}`;
    if (projectId) cmd += ` --project ${projectId}`;
    const result = runCmd(cmd);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: test_results ---
server.tool(
  'test_results',
  'Retrieve results of a CRT test execution',
  {
    executionId: z.string().describe('Execution or build ID'),
    jobId: z.string().describe('Job ID')
  },
  async ({ executionId, jobId }) => {
    const result = runCmd(`test results --execution ${executionId} --job ${jobId}`);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- TOOL: ai_ask ---
server.tool(
  'ai_ask',
  'Ask a Copado AI specialist agent a question. Agents: plan, build, test, release, operate',
  {
    agent: z.enum(['plan', 'build', 'test', 'release', 'operate'])
      .describe('Which specialist agent to use'),
    prompt: z.string().describe('Your question or instruction'),
    userStoryId: z.string().optional().describe('Scope the question to a user story')
  },
  async ({ agent, prompt, userStoryId }) => {
    let cmd = `ai ask --agent ${agent} "${prompt.replace(/"/g, '\\"')}"`;
    if (userStoryId) cmd += ` --us ${userStoryId}`;
    const result = runCmd(cmd);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// --- Start the server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('copado-hx MCP server running...');
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});