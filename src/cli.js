'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const Config = require('./config');
const output = require('./utils/output');

const authCmd = require('./commands/auth');
const storyCmd = require('./commands/story');
const { commitCmd, promoteCmd, deployCmd, statusCmd } = require('./commands/pipeline');
const testCmd = require('./commands/test');
const aiCmd = require('./commands/ai');
const explainCmd = require('./commands/explain');
const watchCmd = require('./commands/watch');
const releaseNotesCmd = require('./commands/release-notes');

const program = new Command();

program
  .name('copado-hx')
  .description(
    chalk.bold('copado-hx') + ' — Zero Browser. Full Pipeline. Any Agent.\n\n' +
    chalk.dim('  Headless CLI for Copado DevOps — CI/CD · Testing · AI Agents')
  )
  .version(pkg.version, '-v, --version', 'Show version')
  .helpOption('-h, --help', 'Show help')
  .addHelpText('after', `
${chalk.bold('Quick Start:')}
  ${chalk.cyan('copado-hx auth login')}                              Authenticate
  ${chalk.cyan('copado-hx story list')}                              List your user stories
  ${chalk.cyan('copado-hx story set --id US-1234')}                  Set working context
  ${chalk.cyan('copado-hx commit --message "feat: my change"')}      Commit changes
  ${chalk.cyan('copado-hx promote --env UAT --validate')}            Validate to UAT
  ${chalk.cyan('copado-hx test run --suite <id>')}                   Run CRT tests
  ${chalk.cyan('copado-hx deploy --env PROD')}                       Deploy to production
  ${chalk.cyan('copado-hx ai ask --agent build "Review my Apex"')}   Ask AI agent

${chalk.bold('AI Agents:')}
  ${chalk.hex('#7F77DD')('plan')} · ${chalk.hex('#7F77DD')('build')} · ${chalk.hex('#7F77DD')('test')} · ${chalk.hex('#7F77DD')('release')} · ${chalk.hex('#7F77DD')('operate')}
`);

program.hook('preAction', (thisCommand, actionCommand) => {
  const cmdName = actionCommand.parent?.name() || actionCommand.name();
  const isAuthCmd = cmdName === 'auth' || actionCommand.name() === 'auth' || actionCommand.name() === 'agents';
  if (!isAuthCmd && !Config.isAuthenticated()) {
    output.warn('You are not authenticated. Run copado-hx auth login first.');
    process.exit(1);
  }
});

program.addCommand(authCmd);
program.addCommand(storyCmd);
program.addCommand(commitCmd);
program.addCommand(promoteCmd);
program.addCommand(deployCmd);
program.addCommand(statusCmd);
program.addCommand(testCmd);
program.addCommand(aiCmd);
program.addCommand(explainCmd);
program.addCommand(watchCmd);
program.addCommand(releaseNotesCmd);

program.action(() => {
  output.banner();
  program.help();
});

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red('✖ ') + err.message);
  process.exit(1);
});
