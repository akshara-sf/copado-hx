'use strict';

const chalk = require('chalk');

function parseApiError(err) {
  if (!err.response) {
    if (err.code === 'ECONNREFUSED') return 'Could not connect to Copado. Check your instance URL.';
    if (err.code === 'ENOTFOUND') return 'Host not found. Check your network connection.';
    return `Network error: ${err.message}`;
  }

  const { status, data } = err.response;

  if (Array.isArray(data) && data[0]?.message) return `[${status}] ${data[0].message}`;
  if (data?.message) return `[${status}] ${data.message}`;
  if (data?.error) return `[${status}] ${data.error}`;
  if (data?.errorMessage) return `[${status}] ${data.errorMessage}`;

  const statusMessages = {
    400: 'Bad request — check your parameters.',
    401: 'Unauthorized — run `copado-hx auth login` to re-authenticate.',
    403: 'Forbidden — you may not have permission for this action.',
    404: 'Resource not found — check the ID or URL.',
    429: 'Rate limit hit — please wait a moment and try again.',
    500: 'Copado server error — try again shortly.',
    503: 'Copado is temporarily unavailable.',
  };

  return statusMessages[status] || `Unexpected error [${status}]`;
}

// Smart suggestions based on error context
function getSuggestion(err, context) {
  if (!err.response) {
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return [
        'Check your instance URL with `copado-hx auth status`',
        'Re-authenticate with `copado-hx auth login`'
      ];
    }
  }

  const status = err.response?.status;
  const suggestions = {
    auth: [
      'Run `copado-hx auth login` to re-authenticate',
      'Check your API token hasn\'t expired'
    ],
    story: [
      'Run `copado-hx story list` to see available stories',
      'Check you have the correct pipeline ID in .copado-hx.json'
    ],
    commit: [
      'Make sure you have an active story: `copado-hx story set --id <ID>`',
      'Check your pipeline is source format (not metadata format)'
    ],
    promote: [
      'Verify the environment name with `copado-hx status`',
      'Make sure all tests pass before promoting'
    ],
    deploy: [
      'Run `copado-hx doctor` to check your setup',
      'Make sure tests passed before deploying to PROD'
    ],
    test: [
      'Check your CRT project ID in `copado-hx auth status`',
      'Run `copado-hx test list` to see available test suites'
    ]
  };

  if (status === 401) return suggestions.auth;
  return suggestions[context] || ['Run `copado-hx doctor` to diagnose issues'];
}

function handleError(err, jsonMode = false, context = null) {
  const message = parseApiError(err);

  if (jsonMode) {
    console.error(JSON.stringify({ error: true, message }, null, 2));
    process.exit(1);
    return;
  }

  console.error(chalk.red('✖ ') + message);

  // Show smart suggestions
  const suggestions = getSuggestion(err, context);
  if (suggestions && suggestions.length > 0) {
    console.error('');
    suggestions.forEach(s => {
      console.error(chalk.dim('  → ') + chalk.cyan(s));
    });
  }

  console.error('');
  process.exit(1);
}

module.exports = { parseApiError, handleError };