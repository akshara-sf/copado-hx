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

function handleError(err, jsonMode = false) {
  const message = parseApiError(err);
  if (jsonMode) {
    console.error(JSON.stringify({ error: true, message }, null, 2));
  } else {
    console.error(chalk.red('✖ ') + message);
  }
  process.exit(1);
}

module.exports = { parseApiError, handleError };