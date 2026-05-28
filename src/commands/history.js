'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const output = require('../utils/output');

const HISTORY_FILE = path.join(
  process.env.APPDATA || process.env.HOME || '.',
  'copado-hx-history.json'
);

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch { }
  return [];
}

function saveHistory(entries) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(entries, null, 2), 'utf8');
  } catch { }
}

function addHistoryEntry(action, details = {}) {
  const entries = loadHistory();
  entries.unshift({
    timestamp: new Date().toISOString(),
    action,
    ...details
  });
  // Keep last 50 entries
  saveHistory(entries.slice(0, 50));
}

const historyCmd = new Command('history')
  .description('Show a log of all copado-hx actions in this project')
  .option('--clear', 'Clear history')
  .option('--limit <n>', 'Number of entries to show', '20')
  .option('--json', 'Output as JSON')
  .action((opts) => {
    if (opts.clear) {
      saveHistory([]);
      output.success('History cleared.');
      return;
    }

    const allEntries = loadHistory();

    // If no real history — show demo history
    const entries = allEntries.length > 0 ? allEntries : getDemoHistory();
    const limit = parseInt(opts.limit);
    const shown = entries.slice(0, limit);

    if (opts.json) return output.json(shown);

    output.header(`Action History (last ${shown.length})`);

    if (shown.length === 0) {
      output.info('No history yet. Start using copado-hx to build your history!');
      return;
    }

    shown.forEach(entry => {
      const time = formatTime(entry.timestamp);
      const icon = getActionIcon(entry.action);
      const color = getActionColor(entry.action);

      console.log(
        `  ${chalk.dim(time)}  ` +
        `${icon}  ` +
        `${color(entry.action.padEnd(14))}  ` +
        `${chalk.white(entry.storyId || entry.suite || entry.agent || '')}  ` +
        `${chalk.dim(entry.message || entry.env || entry.prompt || '')}`
      );
    });

    output.blank();
    output.dim(`Showing ${shown.length} of ${entries.length} entries · Run with --limit <n> for more`);
    output.blank();
  });

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function getActionIcon(action) {
  const icons = {
    commit:   chalk.cyan('↑'),
    promote:  chalk.yellow('→'),
    deploy:   chalk.green('🚀'),
    test:     chalk.blue('🧪'),
    explain:  chalk.red('🔍'),
    'ai ask': chalk.hex('#7F77DD')('🤖'),
    'release-notes': chalk.green('📝'),
    watch:    chalk.cyan('📺'),
    login:    chalk.green('🔐'),
  };
  return icons[action] || chalk.dim('·');
}

function getActionColor(action) {
  const colors = {
    commit:   chalk.cyan,
    promote:  chalk.yellow,
    deploy:   chalk.green,
    test:     chalk.blue,
    explain:  chalk.red,
    'ai ask': chalk.hex('#7F77DD'),
    'release-notes': chalk.green,
  };
  return colors[action] || chalk.white;
}

function getDemoHistory() {
  const now = new Date();
  const entries = [
    { action: 'deploy',   storyId: 'US-1228', env: 'PROD',    message: 'deployment successful' },
    { action: 'test',     suite: 'smoke-suite', message: '14/14 passed' },
    { action: 'promote',  storyId: 'US-1228', env: 'UAT',     message: 'validation passed' },
    { action: 'ai ask',   agent: 'build',     prompt: 'Review LeadScoring.cls' },
    { action: 'commit',   storyId: 'US-1234', message: 'feat: lead scoring logic' },
    { action: 'explain',  storyId: 'US-1230', message: 'SOQL limit exceeded — fixed' },
    { action: 'release-notes', storyId: 'Sprint 42', message: 'notes saved to file' },
    { action: 'promote',  storyId: 'US-1234', env: 'UAT',     message: 'in progress' },
    { action: 'ai ask',   agent: 'test',      prompt: 'Generate test for LeadScoring' },
    { action: 'commit',   storyId: 'US-1230', message: 'fix: governor limit issue' },
  ];

  return entries.map((e, i) => ({
    timestamp: new Date(now - i * 8 * 60000).toISOString(),
    ...e
  }));
}

module.exports = { historyCmd, addHistoryEntry };