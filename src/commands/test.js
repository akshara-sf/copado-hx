'use strict';

const { Command } = require('commander');
const ora = require('ora');
const chalk = require('chalk');
const Config = require('../config');
const CrtClient = require('../lib/crt-client');
const output = require('../utils/output');
const { handleError } = require('../utils/errors');

const testCmd = new Command('test');
testCmd.description('Run and manage Copado Robotic Testing (CRT) test suites');

testCmd
  .command('list')
  .description('List available CRT test jobs')
  .option('--project <id>', 'CRT project ID')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const spinner = ora('Fetching test jobs…').start();
    try {
      const jobs = await CrtClient.listJobs(opts.project);
      spinner.stop();
      if (!jobs || jobs.length === 0) {
        output.info('No test jobs found.');
        return;
      }
      if (opts.json) return output.json(jobs);
      output.header(`CRT Test Jobs (${jobs.length})`);
      output.table(
        ['Job ID', 'Name', 'Type', 'Last Status'],
        jobs.map(j => [
          chalk.cyan(j.id || j.jobId || '—'),
          j.name || '—',
          chalk.dim(j.type || '—'),
          output.statusBadge(j.lastStatus || '—')
        ])
      );
      output.blank();
      output.dim('Tip: Use `copado-hx test run --suite <Job ID>` to trigger a test.');
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

testCmd
  .command('run')
  .description('Trigger a CRT test suite or job')
  .option('--suite <id>', 'Test suite / job ID')
  .option('--job <id>', 'Alias for --suite')
  .option('--project <id>', 'CRT project ID')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const jobId = opts.suite || opts.job;
    if (!jobId) {
      output.error('Please specify a job ID: --suite <id>');
      output.dim('Run `copado-hx test list` to see available jobs.');
      process.exit(1);
    }
    const spinner = ora(`Triggering test suite ${chalk.cyan(jobId)}…`).start();
    try {
      const result = await CrtClient.triggerBuild(jobId, opts.project);
      spinner.succeed('Test execution triggered');
      if (opts.json) return output.json(result);
      output.blank();
      output.detail('Execution ID', result.id || result.buildId || '—');
      output.detail('Job ID', jobId);
      output.detail('Status', output.statusBadge(result.status || 'Running'));
      output.blank();
      output.dim(`Run \`copado-hx test status --execution ${result.id || result.buildId} --job ${jobId} --watch\` to poll results.`);
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

testCmd
  .command('status')
  .description('Poll the status of a test execution')
  .requiredOption('--execution <id>', 'Execution / build ID')
  .requiredOption('--job <id>', 'Job ID')
  .option('--watch', 'Keep polling until execution finishes')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    if (opts.watch) {
      output.header(`Watching test execution ${chalk.cyan(opts.execution)}`);
      const spinner = ora('Polling…').start();
      let ticks = 0;
      try {
        const result = await CrtClient.pollBuild(opts.job, opts.execution, {
          interval: 10000,
          onTick: (build) => {
            ticks++;
            spinner.text = `${output.statusBadge(build.status)} — polling${'.'.repeat((ticks % 3) + 1)}`;
          }
        });
        spinner.succeed('Test execution completed');
        if (opts.json) return output.json(result);
        const passed = /succeed|pass/i.test(result.status);
        output.blank();
        output.detail('Result', passed ? chalk.green('✔ Passed') : chalk.red('✖ Failed'));
        output.detail('Execution ID', opts.execution);
        output.blank();
        if (!passed) {
          output.warn('Tests failed — do not proceed to deployment.');
          output.dim(`Run \`copado-hx test results --execution ${opts.execution} --job ${opts.job}\` for details.`);
        }
      } catch (err) {
        spinner.fail('Test execution failed');
        handleError(err, opts.json);
      }
      return;
    }

    const spinner = ora('Fetching execution status…').start();
    try {
      const build = await CrtClient.getBuildStatus(opts.job, opts.execution);
      spinner.stop();
      if (opts.json) return output.json(build);
      output.header('Test Execution Status');
      output.detail('Execution ID', opts.execution);
      output.detail('Status', output.statusBadge(build.status || '—'));
      output.detail('Progress', build.progress || '—');
      output.blank();
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

testCmd
  .command('results')
  .description('Retrieve results of a test execution')
  .requiredOption('--execution <id>', 'Execution / build ID')
  .requiredOption('--job <id>', 'Job ID')
  .option('--format <fmt>', 'Format: table, json, junit', 'table')
  .option('--json', 'Alias for --format json')
  .action(async (opts) => {
    const spinner = ora('Fetching test results…').start();
    try {
      const results = await CrtClient.getBuildResults(opts.job, opts.execution);
      spinner.stop();
      const fmt = opts.json ? 'json' : opts.format;
      if (fmt === 'json') return output.json(results);

      output.header(`Test Results — ${opts.execution}`);
      const tests = results.tests || results.results || [];
      if (tests.length === 0) {
        output.info('No test details available.');
        return;
      }
      const passed = tests.filter(t => /pass|succeed/i.test(t.status)).length;
      const failed = tests.filter(t => /fail|error/i.test(t.status)).length;
      output.table(
        ['Test Name', 'Status', 'Duration'],
        tests.map(t => [
          t.name || t.testName || '—',
          output.statusBadge(t.status || '—'),
          chalk.dim(t.duration ? `${t.duration}ms` : '—')
        ])
      );
      output.blank();
      output.detail('Total', String(tests.length));
      output.detail('Passed', chalk.green(String(passed)));
      output.detail('Failed', failed > 0 ? chalk.red(String(failed)) : chalk.green('0'));
      output.blank();
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

module.exports = testCmd;