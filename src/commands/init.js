'use strict';

const { Command } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const output = require('../utils/output');

const initCmd = new Command('init')
  .description('Initialize copado-hx in your project — creates .copado-hx.json')
  .option('--force', 'Overwrite existing config')
  .action(async (opts) => {
    output.banner();
    output.header('Project Initialization');

    const configPath = path.join(process.cwd(), '.copado-hx.json');

    if (fs.existsSync(configPath) && !opts.force) {
      output.warn('.copado-hx.json already exists in this directory.');
      output.dim('Use --force to overwrite it.');
      process.exit(0);
    }

    output.info('This will create a .copado-hx.json config file in your project root.');
    output.blank();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'pipelineId',
        message: 'Pipeline ID (press Enter to skip):',
      },
      {
        type: 'list',
        name: 'defaultEnv',
        message: 'Default deployment environment:',
        choices: ['DEV', 'UAT', 'SIT', 'PROD'],
        default: 'UAT'
      },
      {
        type: 'input',
        name: 'testSuite',
        message: 'Default test suite ID (press Enter to skip):',
      },
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: path.basename(process.cwd())
      },
      {
        type: 'confirm',
        name: 'notifications',
        message: 'Enable deployment notifications?',
        default: true
      }
    ]);

    const config = {
      name: answers.projectName,
      version: '1.0.0',
      pipeline: answers.pipelineId || null,
      defaultEnv: answers.defaultEnv,
      testSuite: answers.testSuite || null,
      notifications: answers.notifications,
      agents: {
        preDeploy: 'build',
        postDeploy: 'release',
        onFailure: 'release'
      },
      guardrails: {
        requireTestsBeforeProd: true,
        requireHumanApprovalForProd: true,
        maxDestructiveActionsWithoutCheckpoint: 3
      },
      created: new Date().toISOString()
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    output.blank();
    output.success('.copado-hx.json created successfully!');
    output.blank();
    output.detail('Project', config.name);
    output.detail('Default env', config.defaultEnv);
    output.detail('Pipeline', config.pipeline || chalk.dim('not set'));
    output.detail('Test suite', config.testSuite || chalk.dim('not set'));
    output.detail('Guardrails', chalk.green('enabled'));
    output.blank();
    output.dim('Commit .copado-hx.json to your repo so your whole team uses the same config!');
    output.blank();
  });

module.exports = initCmd;