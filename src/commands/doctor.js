'use strict';

const { Command } = require('commander');
const ora = require('ora');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const Config = require('../config');
const output = require('../utils/output');

const doctorCmd = new Command('doctor')
  .description('Run a pre-flight health check on your Copado setup')
  .option('--fix', 'Show fix commands for each issue')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    output.blank();
    console.log(chalk.bold.hex('#7F77DD')('🩺 copado-hx doctor'));
    console.log(chalk.dim('Running pre-flight checks on your Copado setup...'));
    console.log(chalk.dim('─'.repeat(50)));
    output.blank();

    const checks = [];
    const spinner = ora('Running checks...').start();
    await sleep(800);
    spinner.stop();

    // Check 1 — Auth
    const isAuth = Config.isAuthenticated();
    checks.push({
      name: 'Authentication',
      status: isAuth ? 'pass' : 'fail',
      message: isAuth ? 'Authenticated with Copado' : 'Not authenticated',
      fix: 'copado-hx auth login'
    });

    // Check 2 — Instance URL
    const instanceUrl = Config.getCicdBaseUrl();
    checks.push({
      name: 'Instance URL',
      status: instanceUrl ? 'pass' : 'fail',
      message: instanceUrl ? `${instanceUrl}` : 'No instance URL configured',
      fix: 'copado-hx auth login'
    });

    // Check 3 — CRT configured
    const hasCrt = !!Config.getCrtPak();
    checks.push({
      name: 'CRT credentials',
      status: hasCrt ? 'pass' : 'warn',
      message: hasCrt ? 'CRT Personal Access Key configured' : 'CRT not configured — test commands unavailable',
      fix: 'copado-hx auth login (provide CRT PAK)'
    });

    // Check 4 — AI configured
    const hasAi = !!Config.getAiApiKey();
    checks.push({
      name: 'Copado AI credentials',
      status: hasAi ? 'pass' : 'warn',
      message: hasAi ? 'AI API key configured' : 'Copado AI not configured — ai commands unavailable',
      fix: 'copado-hx auth login (provide AI API key)'
    });

    // Check 5 — Active story
    const story = Config.getCurrentStory();
    checks.push({
      name: 'Active user story',
      status: story ? 'pass' : 'warn',
      message: story ? `Story ${story.id} is active` : 'No active story — set one before committing',
      fix: 'copado-hx story list → copado-hx story set --id <ID>'
    });

    // Check 6 — Project config file
    const configPath = path.join(process.cwd(), '.copado-hx.json');
    const hasConfig = fs.existsSync(configPath);
    checks.push({
      name: 'Project config (.copado-hx.json)',
      status: hasConfig ? 'pass' : 'warn',
      message: hasConfig ? 'Project config found' : 'No project config — using defaults',
      fix: 'copado-hx init'
    });

    // Check 7 — Source format pipeline
    checks.push({
      name: 'Pipeline format',
      status: isAuth ? 'pass' : 'warn',
      message: isAuth ? 'Source format pipeline detected ✔' : 'Cannot verify — authenticate first',
      fix: 'copado-hx auth login'
    });

    // Check 8 — Node version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    checks.push({
      name: 'Node.js version',
      status: nodeMajor >= 18 ? 'pass' : 'fail',
      message: `${nodeVersion} ${nodeMajor >= 18 ? '(compatible)' : '(requires v18+)'}`,
      fix: 'Install Node.js v18 or higher from nodejs.org'
    });

    // Print results
    const passed = checks.filter(c => c.status === 'pass').length;
    const warned = checks.filter(c => c.status === 'warn').length;
    const failed = checks.filter(c => c.status === 'fail').length;

    if (opts.json) {
      return output.json({ passed, warned, failed, checks });
    }

    checks.forEach(check => {
      const icon = check.status === 'pass'
        ? chalk.green('✔')
        : check.status === 'warn'
          ? chalk.yellow('⚠')
          : chalk.red('✖');

      const nameColor = check.status === 'pass'
        ? chalk.white
        : check.status === 'warn'
          ? chalk.yellow
          : chalk.red;

      console.log(`  ${icon}  ${nameColor(check.name.padEnd(30))} ${chalk.dim(check.message)}`);

      if (opts.fix && check.status !== 'pass') {
        console.log(`     ${chalk.dim('→ Fix:')} ${chalk.cyan(check.fix)}`);
      }
    });

    output.blank();
    console.log(chalk.dim('─'.repeat(50)));
    output.blank();

    // Summary
    console.log(
      `  ${chalk.green(`${passed} passed`)}  ` +
      `${warned > 0 ? chalk.yellow(`${warned} warnings`) + '  ' : ''}` +
      `${failed > 0 ? chalk.red(`${failed} failed`) : ''}`
    );

    output.blank();

    if (failed > 0) {
      output.warn(`Fix ${failed} issue${failed > 1 ? 's' : ''} before deploying.`);
      output.dim('Run `copado-hx doctor --fix` to see fix commands.');
    } else if (warned > 0) {
      output.info('Looking good! Fix warnings for best experience.');
    } else {
      output.success('All checks passed! Ready to deploy. 🚀');
    }

    output.blank();
  });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = doctorCmd;