'use strict';

const { Command } = require('commander');
const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Config = require('../config');
const CicdClient = require('../lib/cicd-client');
const output = require('../utils/output');
const { handleError } = require('../utils/errors');

function requireStoryContext() {
  const story = Config.getCurrentStory();
  if (!story) {
    output.error('No active user story. Run `copado-hx story set --id <ID>` first.');
    process.exit(1);
  }
  return story;
}

const commitCmd = new Command('commit')
  .description('Commit metadata changes from the current user story')
  .option('--message <msg>', 'Commit message')
  .option('--us <id>', 'Override user story ID')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const story = opts.us ? { id: opts.us } : requireStoryContext();
    const message = opts.message || `chore: commit from copado-hx [${story.id}]`;
    const spinner = ora(`Committing user story ${chalk.cyan(story.id)}…`).start();
    try {
      const result = await CicdClient.commit({ userStoryId: story.id, message });
      spinner.succeed('Commit triggered');
      if (opts.json) return output.json(result);
      output.blank();
      output.detail('Commit ID', result.commitId || result.id || '—');
      output.detail('Status', output.statusBadge(result.status || 'Submitted'));
      output.detail('Files committed', String(result.filesCommitted?.length ?? '—'));
      output.blank();
      output.dim('Run `copado-hx status --watch` to follow progress.');
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

const promoteCmd = new Command('promote')
  .description('Promote a user story to the next environment')
  .requiredOption('--env <name>', 'Target environment (e.g. UAT, SIT, PROD)')
  .option('--us <id>', 'Override user story ID')
  .option('--validate', 'Validation only — no actual deployment')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const story = opts.us ? { id: opts.us } : requireStoryContext();
    const action = opts.validate ? 'Validating' : 'Promoting';
    const spinner = ora(`${action} ${chalk.cyan(story.id)} → ${chalk.yellow(opts.env)}…`).start();
    try {
      const result = await CicdClient.promote({
        userStoryId: story.id,
        environment: opts.env,
        validateOnly: !!opts.validate
      });
      spinner.succeed(`${action} triggered`);
      if (opts.json) return output.json(result);
      output.blank();
      output.detail('Promotion ID', result.promotionId || result.id || '—');
      output.detail('Job Execution ID', result.jobExecutionId || '—');
      output.detail('Status', output.statusBadge(result.status || 'In Progress'));
      output.detail('Target env', chalk.yellow(opts.env));
      output.blank();
      output.dim('Run `copado-hx status --watch` to follow progress.');
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

const deployCmd = new Command('deploy')
  .description('Deploy a user story to an environment')
  .requiredOption('--env <name>', 'Target environment')
  .option('--us <id>', 'Override user story ID')
  .option('--force', 'Skip confirmation prompt')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const story = opts.us ? { id: opts.us } : requireStoryContext();
    const isProd = /prod/i.test(opts.env);

    if (isProd && !opts.force) {
      output.blank();
      output.warn(`You are about to deploy to ${chalk.red.bold(opts.env.toUpperCase())} (PRODUCTION).`);
      output.blank();
      const { confirmed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmed',
        message: `Are you sure you want to deploy ${story.id} to PRODUCTION?`,
        default: false
      }]);
      if (!confirmed) {
        output.info('Deployment cancelled.');
        process.exit(0);
      }
    }

    const spinner = ora(`Deploying ${chalk.cyan(story.id)} → ${chalk.yellow(opts.env)}…`).start();
    try {
      const result = await CicdClient.deploy({ userStoryId: story.id, environment: opts.env });
      spinner.succeed('Deployment triggered');
      if (opts.json) return output.json(result);
      output.blank();
      output.detail('Job Execution ID', result.jobExecutionId || result.id || '—');
      output.detail('Status', output.statusBadge(result.status || 'In Progress'));
      output.detail('Environment', chalk.yellow(opts.env));
      output.blank();
      output.dim('Run `copado-hx status --watch` to follow deployment progress.');
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

const statusCmd = new Command('status')
  .description('Show pipeline status for the current user story')
  .option('--job <id>', 'Poll a specific job execution ID')
  .option('--watch', 'Live-poll until job completes')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    if (opts.job && opts.watch) {
      output.header(`Watching job ${chalk.cyan(opts.job)}`);
      const spinner = ora('Polling…').start();
      let dots = 0;
      try {
        const result = await CicdClient.pollJobExecution(opts.job, {
          interval: 8000,
          onTick: (job) => {
            dots++;
            spinner.text = `${output.statusBadge(job.status)} — polling${'.'.repeat((dots % 3) + 1)}`;
          }
        });
        spinner.succeed('Job completed');
        if (opts.json) return output.json(result);
        output.blank();
        output.detail('Final status', output.statusBadge(result.status));
        output.detail('Job ID', opts.job);
        output.blank();
      } catch (err) {
        spinner.fail('Job failed');
        handleError(err, opts.json);
      }
      return;
    }

    const story = requireStoryContext();
    const spinner = ora('Fetching status…').start();
    try {
      const details = await CicdClient.getUserStory(story.id);
      spinner.stop();
      if (opts.json) return output.json(details);
      output.header(`Pipeline Status — ${story.id}`);
      output.detail('Title', details.title || '—');
      output.detail('Status', output.statusBadge(details.status || '—'));
      output.detail('Environment', details.environment || '—');
      output.detail('Last action', details.lastAction || '—');
      output.blank();
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

module.exports = { commitCmd, promoteCmd, deployCmd, statusCmd };