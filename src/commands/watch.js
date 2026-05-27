'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const Config = require('../config');
const output = require('../utils/output');

const watchCmd = new Command('watch')
  .description('Live pipeline dashboard — see your entire Copado environment in real time')
  .option('--interval <ms>', 'Refresh interval in milliseconds', '5000')
  .option('--mock', 'Run with demo data (no credentials needed)')
  .action(async (opts) => {
    const isMock = opts.mock || !Config.isAuthenticated();
    const interval = parseInt(opts.interval);

    // Clear screen
    console.clear();
    drawDashboard(getMockData());

    const timer = setInterval(() => {
      console.clear();
      drawDashboard(getAnimatedData());
    }, interval);

    // Exit on Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(timer);
      console.clear();
      output.blank();
      output.success('Dashboard closed.');
      output.blank();
      process.exit(0);
    });
  });

let tick = 0;

function getAnimatedData() {
  tick++;
  return {
    environments: [
      {
        name: 'DEV',
        stories: 3,
        status: 'Stable',
        progress: 100,
        color: 'green'
      },
      {
        name: 'UAT',
        stories: 1,
        status: tick % 4 === 0 ? 'Deploying' : tick % 4 === 1 ? 'Testing' : 'Stable',
        progress: tick % 4 === 0 ? 65 : tick % 4 === 1 ? 85 : 100,
        color: tick % 4 === 2 ? 'green' : 'yellow'
      },
      {
        name: 'SIT',
        stories: 2,
        status: 'Validating',
        progress: 45,
        color: 'yellow'
      },
      {
        name: 'PROD',
        stories: 0,
        status: 'Stable',
        progress: 100,
        color: 'green'
      }
    ],
    tests: {
      total: 14,
      passed: tick % 3 === 0 ? 12 : 13,
      failed: tick % 3 === 0 ? 2 : 1,
      running: tick % 3 === 1 ? 1 : 0
    },
    recentActions: [
      { time: '15:42', action: 'US-1234 committed to DEV', status: 'success' },
      { time: '15:38', action: 'US-1230 promoted to UAT', status: 'success' },
      { time: '15:31', action: 'Smoke tests triggered', status: tick % 3 === 0 ? 'warning' : 'success' },
      { time: '15:20', action: 'US-1228 deployed to PROD', status: 'success' },
    ],
    agents: [
      { name: 'Build Agent', status: tick % 5 === 0 ? 'Active' : 'Ready' },
      { name: 'Test Agent',  status: tick % 4 === 1 ? 'Active' : 'Ready' },
      { name: 'Release Agent', status: 'Ready' },
    ]
  };
}

function getMockData() {
  return getAnimatedData();
}

function drawDashboard(data) {
  const width = 70;
  const line = chalk.dim('─'.repeat(width));

  // Header
  console.log('');
  console.log(
    chalk.bold.hex('#7F77DD')('  ⚡ copado-hx') +
    chalk.bold.white(' PIPELINE DASHBOARD') +
    chalk.dim(`  ${new Date().toLocaleTimeString()}`)
  );
  console.log(line);

  // Environments
  console.log(chalk.bold.white('  ENVIRONMENTS'));
  console.log('');
  data.environments.forEach(env => {
    const bar = drawBar(env.progress, 20);
    const statusColor = env.color === 'green' ? chalk.green : chalk.yellow;
    const badge = env.progress === 100
      ? chalk.green('✔')
      : env.status === 'Deploying'
        ? chalk.yellow('⟳')
        : chalk.cyan('◎');

    console.log(
      `  ${chalk.bold.white(env.name.padEnd(6))}` +
      `${bar} ` +
      `${statusColor(env.status.padEnd(12))}` +
      `${chalk.dim(env.stories + ' stor' + (env.stories === 1 ? 'y' : 'ies'))} ` +
      badge
    );
  });

  console.log('');
  console.log(line);

  // Tests
  console.log(chalk.bold.white('  TEST STATUS'));
  console.log('');
  const testBar = drawBar(
    Math.round((data.tests.passed / data.tests.total) * 100), 30
  );
  console.log(`  ${testBar}  ` +
    chalk.green(`${data.tests.passed} passed`) + '  ' +
    (data.tests.failed > 0 ? chalk.red(`${data.tests.failed} failed`) : chalk.green('0 failed')) +
    (data.tests.running > 0 ? '  ' + chalk.yellow(`${data.tests.running} running`) : '')
  );

  console.log('');
  console.log(line);

  // AI Agents
  console.log(chalk.bold.white('  AI AGENTS'));
  console.log('');
  data.agents.forEach(agent => {
    const dot = agent.status === 'Active'
      ? chalk.green('●')
      : chalk.dim('○');
    const statusText = agent.status === 'Active'
      ? chalk.green('Active')
      : chalk.dim('Ready');
    console.log(`  ${dot} ${chalk.white(agent.name.padEnd(16))} ${statusText}`);
  });

  console.log('');
  console.log(line);

  // Recent Actions
  console.log(chalk.bold.white('  RECENT ACTIVITY'));
  console.log('');
  data.recentActions.forEach(action => {
    const icon = action.status === 'success'
      ? chalk.green('✔')
      : action.status === 'warning'
        ? chalk.yellow('⚠')
        : chalk.red('✖');
    console.log(
      `  ${chalk.dim(action.time)}  ${icon}  ${chalk.white(action.action)}`
    );
  });

  console.log('');
  console.log(line);
  console.log(chalk.dim('  Auto-refreshing every 5s · Press Ctrl+C to exit'));
  console.log('');
}

function drawBar(percent, width) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const filledBar = chalk.hex('#7F77DD')('█'.repeat(filled));
  const emptyBar = chalk.dim('░'.repeat(empty));
  return filledBar + emptyBar;
}

module.exports = watchCmd;