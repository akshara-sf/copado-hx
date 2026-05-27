'use strict';

const { Command } = require('commander');
const ora = require('ora');
const chalk = require('chalk');
const Config = require('../config');
const AiClient = require('../lib/ai-client');
const output = require('../utils/output');
const { handleError } = require('../utils/errors');

const explainCmd = new Command('explain')
  .description('Explain a failed deployment in plain English and suggest a fix')
  .option('--job <id>', 'Job execution ID to explain')
  .option('--us <id>', 'User story ID to explain')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const story = opts.us || Config.getCurrentStory()?.id;
    const jobId = opts.job;

    if (!jobId && !story) {
      output.error('Please provide a job ID (--job) or set an active user story first.');
      output.dim('Example: copado-hx explain --job JOB-1234');
      output.dim('Example: copado-hx explain --us US-1234');
      process.exit(1);
    }

    output.blank();
    console.log(chalk.bold.red('● DEPLOYMENT FAILURE ANALYSIS'));
    console.log(chalk.dim('─'.repeat(50)));
    output.blank();

    const spinner = ora('Analyzing failure with Release Agent...').start();

    try {
      const prompt = jobId
        ? `A Copado deployment job failed. Job ID: ${jobId}. 
           Please analyze this failure and provide:
           1. Root cause in plain English (no jargon)
           2. Exact steps to fix it
           3. How to prevent it next time`
        : `A Copado deployment failed for user story ${story}.
           Please analyze this failure and provide:
           1. Root cause in plain English (no jargon)
           2. Exact steps to fix it
           3. How to prevent it next time`;

      const { dialogueId, response } = await AiClient.ask('release', prompt, story);
      spinner.stop();

      if (opts.json) return output.json({ jobId, story, dialogueId, response });

      // Root cause section
      console.log(chalk.bold.yellow('📋 ROOT CAUSE'));
      console.log(chalk.dim('─'.repeat(50)));
      const text = extractText(response);
      console.log(text);
      output.blank();

      // Fix suggestion
      console.log(chalk.bold.green('🔧 SUGGESTED FIX'));
      console.log(chalk.dim('─'.repeat(50)));
      output.dim('Ask the Build Agent to generate the fix:');
      output.blank();
      const fixCmd = story
        ? `copado-hx ai ask --agent build "Fix the deployment issue for ${story}"`
        : `copado-hx ai ask --agent build "Fix deployment job failure: ${jobId}"`;
      console.log(chalk.cyan(`  ${fixCmd}`));
      output.blank();

    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

function extractText(response) {
  if (typeof response === 'string') return response;
  if (response?.message) return response.message;
  if (response?.content) return response.content;
  if (response?.text) return response.text;
  if (response?.response) return response.response;
  return JSON.stringify(response, null, 2);
}

module.exports = explainCmd;