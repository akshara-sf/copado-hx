'use strict';

const chalk = require('chalk');
const Table = require('cli-table3');

const output = {
  success: (msg) => console.log(chalk.green('✔ ') + msg),
  error: (msg) => console.error(chalk.red('✖ ') + msg),
  warn: (msg) => console.log(chalk.yellow('⚠ ') + msg),
  info: (msg) => console.log(chalk.cyan('ℹ ') + msg),
  dim: (msg) => console.log(chalk.dim(msg)),

  header: (title) => {
    console.log('');
    console.log(chalk.bold.white(title));
    console.log(chalk.dim('─'.repeat(Math.min(title.length + 2, 60))));
  },

  statusBadge: (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('success') || s.includes('completed')) return chalk.green(`● ${status}`);
    if (s.includes('fail') || s.includes('error')) return chalk.red(`● ${status}`);
    if (s.includes('progress') || s.includes('running')) return chalk.yellow(`● ${status}`);
    if (s.includes('pending') || s.includes('queue')) return chalk.cyan(`● ${status}`);
    return chalk.dim(`● ${status}`);
  },

  table: (headers, rows) => {
    const table = new Table({
      head: headers.map(h => chalk.bold.cyan(h)),
      style: { border: ['dim'] }
    });
    rows.forEach(row => table.push(row));
    console.log(table.toString());
  },

  json: (data) => console.log(JSON.stringify(data, null, 2)),
  blank: () => console.log(''),

  detail: (label, value) => {
    console.log(`  ${chalk.dim(label.padEnd(20))} ${chalk.white(value || chalk.dim('—'))}`);
  },

  banner: () => {
    console.log('');
    console.log(chalk.bold.hex('#7F77DD')('  copado-hx') + chalk.dim('  Zero Browser. Full Pipeline. Any Agent.'));
    console.log('');
  }
};

module.exports = output;