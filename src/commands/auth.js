'use strict';

const { Command } = require('commander');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const axios = require('axios');
const Config = require('../config');
const output = require('../utils/output');

const authCmd = new Command('auth');
authCmd.description('Manage authentication with Copado');

authCmd
  .command('login')
  .description('Authenticate with your Copado instance')
  .option('--token <token>', 'API token')
  .option('--instance-url <url>', 'Copado instance base URL')
  .action(async (opts) => {
    output.banner();
    output.header('Copado Authentication');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'instanceUrl',
        message: 'Copado CI/CD instance URL:',
        default: opts.instanceUrl,
        validate: (v) => v.startsWith('http') ? true : 'Must be a valid URL'
      },
      {
        type: 'password',
        name: 'token',
        message: 'Copado API token:',
        mask: '*',
        validate: (v) => v.length > 0 ? true : 'Token cannot be empty'
      },
      {
        type: 'password',
        name: 'crtPak',
        message: 'CRT Personal Access Key (Enter to skip):',
        mask: '*'
      },
      {
        type: 'input',
        name: 'crtProjectId',
        message: 'CRT Project ID (Enter to skip):'
      },
      {
        type: 'password',
        name: 'aiApiKey',
        message: 'Copado AI API key (Enter to skip):',
        mask: '*'
      },
      {
        type: 'input',
        name: 'aiOrgId',
        message: 'Copado AI Organization ID (Enter to skip):'
      }
    ]);

    const spinner = ora('Saving credentials…').start();

    Config.setToken(answers.token);
    Config.setCicdBaseUrl(answers.instanceUrl);
    if (answers.crtPak) Config.setCrtPak(answers.crtPak);
    if (answers.crtProjectId) Config.setCrtProjectId(answers.crtProjectId);
    if (answers.aiApiKey) Config.setAiApiKey(answers.aiApiKey);
    if (answers.aiOrgId) Config.setAiOrgId(answers.aiOrgId);

    spinner.succeed('Credentials saved!');
    output.blank();
    output.detail('Instance URL', answers.instanceUrl);
    output.detail('CI/CD', chalk.green('✔ Configured'));
    output.detail('CRT', answers.crtPak ? chalk.green('✔ Configured') : chalk.dim('— skipped'));
    output.detail('Copado AI', answers.aiApiKey ? chalk.green('✔ Configured') : chalk.dim('— skipped'));
    output.blank();
  });

authCmd
  .command('status')
  .description('Show current authentication status')
  .option('--json', 'Output as JSON')
  .action((opts) => {
    const isAuth = Config.isAuthenticated();
    const instanceUrl = Config.getCicdBaseUrl();
    const hasCrt = !!Config.getCrtPak();
    const hasAi = !!Config.getAiApiKey();
    const currentStory = Config.getCurrentStory();

    if (opts.json) {
      return output.json({
        authenticated: isAuth,
        instanceUrl: instanceUrl || null,
        crtConfigured: hasCrt,
        aiConfigured: hasAi,
        currentStory: currentStory || null
      });
    }

    output.header('Authentication Status');
    output.detail('Authenticated', isAuth ? chalk.green('✔ Yes') : chalk.red('✖ No'));
    output.detail('Instance URL', instanceUrl || '—');
    output.detail('CI/CD', isAuth ? chalk.green('✔ Connected') : chalk.red('✖ Not configured'));
    output.detail('CRT', hasCrt ? chalk.green('✔ Configured') : chalk.dim('— Not configured'));
    output.detail('Copado AI', hasAi ? chalk.green('✔ Configured') : chalk.dim('— Not configured'));
    if (currentStory) {
      output.detail('Active Story', `${currentStory.id} — ${currentStory.title || '—'}`);
    }
    output.blank();
    if (!isAuth) {
      output.info('Run `copado-hx auth login` to authenticate.');
    }
  });

authCmd
  .command('logout')
  .description('Clear stored credentials')
  .action(() => {
    Config.clearAll();
    output.success('Logged out. All credentials cleared.');
  });

module.exports = authCmd;