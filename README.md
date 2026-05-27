# copado-hx 🚀

> **Zero Browser. Full Pipeline. Any Agent.**

A fully headless, open-source CLI for the Copado DevOps platform — built for
Salesforce developers who never want to open a browser tab again.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Track B](https://img.shields.io/badge/CopadoCON%202026-Track%20B-blueviolet)](https://copado.com)

---

## What is copado-hx?

`copado-hx` eliminates the biggest hidden cost in Salesforce DevOps —
**context switching**.

Developers today toggle between their IDE, Copado's browser UI, Slack threads,
and test dashboards just to deliver a single user story. `copado-hx` collapses
all of that into one AI-driven terminal workflow.

**One sentence to your AI agent. Full pipeline. No browser.**

---

## Demo
Developer types in Cursor:
"My lead scoring feature is ready. Run tests and deploy to UAT."
copado-hx MCP Server receives the request...
→ copado-hx auth status          ✔ authenticated
→ copado-hx story set --id US-1234   ✔ context set
→ copado-hx ai ask --agent build "..."  ✔ AI guidance received
→ copado-hx commit --message "feat: lead scoring"  ✔ committed
→ copado-hx test run --suite smoke   ✔ tests passed
Cursor: "Tests passed. Shall I promote to UAT?"
Developer: "Yes"
→ copado-hx promote --env UAT    ✔ deployed
No browser tab opened. Ever. 🚫🌐
---

## Architecture
┌─────────────────────────────────────────┐
│         Developer / AI Agent            │
│      (Cursor, Claude, Agentforce)       │
└──────────────────┬──────────────────────┘
│ Natural Language
▼
┌─────────────────────────────────────────┐
│           MCP Server (server.js)        │
│     Exposes copado-hx as MCP tools      │
│     Natively discovered by any agent    │
└──────────────────┬──────────────────────┘
│ Tool calls
▼
┌─────────────────────────────────────────┐
│         copado-hx CLI                   │
│  auth · story · commit · promote        │
│  deploy · test · ai · status            │
└──────┬───────────┬───────────┬──────────┘
│           │           │
▼           ▼           ▼
┌──────────┐ ┌─────────┐ ┌──────────────┐
│ Copado   │ │   CRT   │ │  Copado AI   │
│ CI/CD    │ │  Open   │ │  Context Hub │
│ REST API │ │   API   │ │  (5 Agents)  │
└──────────┘ └─────────┘ └──────────────┘

---

## Features

- 🔐 **Secure auth** — encrypted credential storage, never plaintext tokens
- 📋 **User story management** — list, set context, create
- ⚙️ **Full CI/CD pipeline** — commit, promote, validate, deploy, status
- 🧪 **CRT test execution** — run suites, poll results, JUnit output
- 🤖 **5 AI specialist agents** — plan, build, test, release, operate
- 💬 **Interactive AI chat** — multi-turn REPL sessions
- 🔌 **MCP server** — natively discoverable by Cursor, Claude, Agentforce
- 📄 **SKILL.md** — agent instruction layer for autonomous workflows
- 🚫 **PROD guardrails** — always confirms before production deployments
- 📊 **JSON output** — `--json` flag on every command for machine parsing

---

## Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/copado-hx.git
cd copado-hx

# Install dependencies
npm install

# Authenticate
node bin/copado-hx.js auth login
```

---

## Quick Start

```bash
# Check auth status
node bin/copado-hx.js auth status

# List your user stories
node bin/copado-hx.js story list

# Set working context
node bin/copado-hx.js story set --id US-1234

# Ask the Build AI agent
node bin/copado-hx.js ai ask --agent build "Review my Apex class"

# Commit changes
node bin/copado-hx.js commit --message "feat: lead scoring"

# Promote to UAT
node bin/copado-hx.js promote --env UAT --validate

# Run tests
node bin/copado-hx.js test run --suite <suite-id>

# Deploy to PROD (always asks for confirmation)
node bin/copado-hx.js deploy --env PROD
```

---

## MCP Server Setup (Cursor / Claude Desktop)

Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "copado-hx": {
      "command": "node",
      "args": ["/path/to/copado-hx/mcp/server.js"]
    }
  }
}
```

Restart Cursor — `copado-hx` tools are now natively available to your AI agent!

---

## CLI Reference

| Command | Description |
|---------|-------------|
| `auth login` | Authenticate with Copado |
| `auth status` | Check authentication status |
| `auth logout` | Clear credentials |
| `story list` | List user stories |
| `story set --id <id>` | Set active user story |
| `story show` | Show current story |
| `story create` | Create a new story |
| `commit` | Commit metadata changes |
| `promote --env <env>` | Promote to environment |
| `deploy --env <env>` | Deploy to environment |
| `status` | Check pipeline status |
| `test list` | List CRT test jobs |
| `test run --suite <id>` | Run a test suite |
| `test status` | Poll test execution |
| `test results` | Get test results |
| `ai ask --agent <id>` | Ask a specialist agent |
| `ai chat --agent <id>` | Interactive agent session |
| `ai agents` | List all agents |

---

## AI Agents

| Agent | Use for |
|-------|---------|
| `plan` | User story refinement, sprint planning |
| `build` | Apex code generation, metadata analysis |
| `test` | CRT test script generation |
| `release` | Deployments, release notes, error analysis |
| `operate` | Post-release docs, change management |

---

## SKILL.md

`copado-hx` ships with a `SKILL.md` — a machine-readable instruction file that
teaches any AI agent exactly how to use the CLI autonomously. Think of it as
**the new package.json** — the file every Copado project ships with so any AI
agent knows how to work with it.

---

## Tech Stack

- **Runtime:** Node.js 18+
- **CLI Framework:** Commander.js
- **MCP Server:** @modelcontextprotocol/sdk
- **APIs:** Copado CI/CD REST · CRT Open API · Copado AI Context Hub
- **Auth storage:** Configstore (encrypted local config)
- **Terminal UI:** Chalk · Ora · cli-table3

---

## Rules Compliance

- ✅ Open source (MIT License)
- ✅ Uses all 3 Copado API surfaces
- ✅ Source format pipelines only
- ✅ No hardcoded secrets
- ✅ SKILL.md included
- ✅ MCP server bonus included

---

## License

MIT © Akshara Thakur — CopadoCON Bangalore 2026