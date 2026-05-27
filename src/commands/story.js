'use strict';

const { Command } = require('commander');
const ora = require('ora');
const chalk = require('chalk');
const Config = require('../config');
const CicdClient = require('../lib/cicd-client');
const output = require('../utils/output');
const { handleError } = require('../utils/errors');

const storyCmd = new Command('story');
storyCmd.description('Manage Copado user stories');

storyCmd
  .command('list')
  .description('List user stories assigned to you')
  .option('--pipeline <id>', 'Filter by pipeline ID')
  .option('--status <status>', 'Filter by status')
  .option('--all', 'Show all stories')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const spinner = ora('Fetching user stories…').start();
    try {
      const stories = await CicdClient.listUserStories({
        pipeline: opts.pipeline,
        status: opts.status,
        assignedToMe: !opts.all
      });
      spinner.stop();

      if (!stories || stories.length === 0) {
        output.info('No user stories found.');
        return;
      }

      if (opts.json) return output.json(stories);

      output.header(`User Stories (${stories.length})`);
      output.table(
        ['ID', 'Title', 'Status', 'Environment'],
        stories.map(s => [
          chalk.cyan(s.id || '—'),
          s.title || '—',
          output.statusBadge(s.status || '—'),
          chalk.dim(s.environment || '—')
        ])
      );
      output.blank();
      output.dim('Tip: Use `copado-hx story set --id <ID>` to set your working context.');
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

storyCmd
  .command('set')
  .description('Set the active user story context')
  .requiredOption('--id <id>', 'User story ID')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const spinner = ora(`Loading user story ${opts.id}…`).start();
    try {
      const story = await CicdClient.getUserStory(opts.id);
      spinner.stop();
      Config.setCurrentStory({ id: opts.id, title: story.title, ...story });

      if (opts.json) return output.json({ success: true, story });

      output.success(`Working context set → ${chalk.cyan(opts.id)}`);
      output.blank();
      output.detail('Title', story.title || '—');
      output.detail('Status', story.status || '—');
      output.detail('Pipeline', story.pipelineName || story.pipelineId || '—');
      output.detail('Environment', story.environment || '—');
      output.blank();
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

storyCmd
  .command('show')
  .description('Show the current active user story')
  .option('--json', 'Output as JSON')
  .action((opts) => {
    const story = Config.getCurrentStory();
    if (!story) {
      output.warn('No active user story. Use `copado-hx story set --id <ID>` first.');
      process.exit(1);
    }
    if (opts.json) return output.json(story);

    output.header('Active User Story');
    Object.entries(story).forEach(([k, v]) => {
      if (typeof v !== 'object') output.detail(k, String(v));
    });
    output.blank();
  });

storyCmd
  .command('create')
  .description('Create a new user story')
  .requiredOption('--title <title>', 'Story title')
  .option('--pipeline <id>', 'Pipeline ID')
  .option('--description <desc>', 'Story description')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const spinner = ora('Creating user story…').start();
    try {
      const story = await CicdClient.createUserStory({
        title: opts.title,
        pipelineId: opts.pipeline,
        description: opts.description
      });
      spinner.stop();

      if (opts.json) return output.json(story);

      output.success(`User story created → ${chalk.cyan(story.id)}`);
      output.detail('Title', story.title);
      output.detail('ID', story.id);
      output.blank();
      output.dim(`Run \`copado-hx story set --id ${story.id}\` to start working on it.`);
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

module.exports = storyCmd;