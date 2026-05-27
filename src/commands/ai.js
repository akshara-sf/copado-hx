'use strict';

const { Command } = require('commander');
const ora = require('ora');
const chalk = require('chalk');
const readline = require('readline');
const Config = require('../config');
const AiClient = require('../lib/ai-client');
const output = require('../utils/output');
const { handleError } = require('../utils/errors');

const aiCmd = new Command('ai');
aiCmd.description('Talk to Copado\'s 5 specialist AI agents');

aiCmd
  .command('ask')
  .description('Send a prompt to a Copado AI specialist agent')
  .requiredOption('--agent <id>', 'Agent: plan, build, test, release, operate')
  .argument('<prompt>', 'Your question or instruction')
  .option('--us <id>', 'Scope to a specific user story')
  .option('--json', 'Output as JSON')
  .action(async (prompt, opts) => {
    if (!AiClient.VALID_AGENTS.includes(opts.agent)) {
      output.error(`Invalid agent "${opts.agent}". Choose from: ${AiClient.VALID_AGENTS.join(', ')}`);
      process.exit(1);
    }

    const story = opts.us || Config.getCurrentStory()?.id;
    const spinner = ora(`Asking ${chalk.hex('#7F77DD')(opts.agent)} agent…`).start();

    try {
      const { dialogueId, response } = await AiClient.ask(opts.agent, prompt, story);
      spinner.stop();

      if (opts.json) return output.json({ agent: opts.agent, dialogueId, response });

      output.blank();
      console.log(chalk.bold.hex('#7F77DD')(`● ${opts.agent.toUpperCase()} AGENT`) + chalk.dim(` · dialogue ${dialogueId}`));
      console.log(chalk.dim('─'.repeat(50)));
      output.blank();
      console.log(extractResponseText(response));
      output.blank();
      output.dim(`Continue: \`copado-hx ai chat --agent ${opts.agent}\``);
    } catch (err) {
      spinner.stop();
      handleError(err, opts.json);
    }
  });

aiCmd
  .command('chat')
  .description('Open an interactive chat with a Copado AI agent')
  .requiredOption('--agent <id>', 'Agent: plan, build, test, release, operate')
  .option('--us <id>', 'Scope to a specific user story')
  .action(async (opts) => {
    if (!AiClient.VALID_AGENTS.includes(opts.agent)) {
      output.error(`Invalid agent "${opts.agent}". Choose from: ${AiClient.VALID_AGENTS.join(', ')}`);
      process.exit(1);
    }

    const story = opts.us || Config.getCurrentStory()?.id;

    output.banner();
    output.header(`${opts.agent.toUpperCase()} Agent — Interactive Session`);
    console.log(chalk.dim(AiClient.AI_AGENT_DESCRIPTIONS[opts.agent]));
    if (story) output.detail('Story context', story);
    output.blank();
    console.log(chalk.dim('Type your message and press Enter. Type `exit` to quit.'));
    output.blank();

    const spinner = ora('Starting session…').start();
    let dialogueId;
    try {
      const dialogue = await AiClient.startDialogue(opts.agent);
      dialogueId = dialogue.id;
      spinner.succeed(`Session started · ${chalk.dim(`id: ${dialogueId}`)}`);
    } catch (err) {
      spinner.stop();
      handleError(err, false);
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.hex('#7F77DD')(`[${opts.agent}] `) + chalk.dim('› ')
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) return rl.prompt();
      if (input.toLowerCase() === 'exit') {
        output.dim('\nSession ended.');
        rl.close();
        process.exit(0);
      }

      const thinking = ora(chalk.dim('Thinking…')).start();
      try {
        const fullPrompt = story ? `[User Story: ${story}]\n\n${input}` : input;
        const response = await AiClient.sendMessage(dialogueId, fullPrompt);
        thinking.stop();
        output.blank();
        console.log(chalk.bold.hex('#7F77DD')(`● ${opts.agent.toUpperCase()}`));
        console.log(extractResponseText(response));
        output.blank();
      } catch (err) {
        thinking.stop();
        output.error(err.message);
      }
      rl.prompt();
    });

    rl.on('close', () => {
      output.blank();
      output.dim('Session closed.');
      process.exit(0);
    });
  });

aiCmd
  .command('agents')
  .description('List all available Copado AI specialist agents')
  .action(() => {
    output.header('Copado AI Specialist Agents');
    output.table(
      ['Agent ID', 'Role', 'Best for'],
      Object.entries(AiClient.AI_AGENT_DESCRIPTIONS).map(([id, desc]) => [
        chalk.hex('#7F77DD')(id),
        desc.split('—')[0].trim(),
        chalk.dim(desc.split('—')[1]?.trim() || '—')
      ])
    );
    output.blank();
  });

function extractResponseText(response) {
  if (typeof response === 'string') return response;
  if (response?.message) return response.message;
  if (response?.content) return response.content;
  if (response?.text) return response.text;
  if (response?.response) return response.response;
  return JSON.stringify(response, null, 2);
}

module.exports = aiCmd;