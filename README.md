<div align="center">

# copado-hx

**Zero Browser. Full Pipeline. Any Agent.**

[![License: MIT](https://img.shields.io/badge/License-MIT-7F77DD.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-brightgreen)](https://nodejs.org)
[![Track B](https://img.shields.io/badge/CopadoCON%202026-Runner--Up%20🏆-gold)](https://copado.com)
[![MCP](https://img.shields.io/badge/MCP-Compatible-7F77DD)](https://modelcontextprotocol.io)
[![Open Source](https://img.shields.io/badge/Open%20Source-MIT-blue)](LICENSE)

A fully headless, open-source CLI for the Copado DevOps platform —
built so Salesforce developers and AI agents never need to open a browser tab again.

[🚀 Quick Start](#quick-start) · [📖 Commands](#command-reference) · [🤖 AI Agents](#ai-agents) · [🔌 MCP Server](#mcp-server-setup) · [📄 SKILL.md](#skillmd)

---

```bash
$ copado-hx workflow --us US-1234 --env UAT

⚡ COPADO-HX WORKFLOW
Full delivery pipeline for US-1234 → UAT
───────────────────────────────────────────────────────
  ✔  Authentication                      Authenticated ✔
  ✔  Build Agent consulted               Commit guidance received
  ✔  Commit metadata                     feat: lead scoring logic
  ✔  Promote → UAT (validate)            Validation passed
  ✔  Test Agent consulted                Coverage verified
  ✔  CRT smoke tests                     14/14 tests passed ✔
  ⚠  HUMAN CHECKPOINT
  ? Shall I proceed to deploy to UAT? › Yes
  ✔  Deploy → UAT                        Deployment successful 🚀
  ✔  Release notes generated             Saved to terminal
───────────────────────────────────────────────────────
  Browser tabs opened  0
```

</div>

---

## Why copado-hx?

Salesforce developers using Copado lose up to **30% of release time**
switching between five browser tabs — IDE, Copado UI, Salesforce org,
Slack, and test dashboards — just to ship a single user story.

And AI coding assistants like Cursor or Claude have **no native way**
to interact with Copado pipelines at all.

**copado-hx fixes both.**

| Before | After |
|--------|-------|
| 5+ browser tabs per deployment | 1 terminal command |
| Manual copy-pasting of IDs | Automatic story context |
| AI agents locked out of Copado | Any MCP agent works natively |
| No pre-flight safety checks | 8-point doctor command |
| Hours writing release notes | One command, auto-generated |
| Unknown deployment failures | AI root cause in plain English |

---

## What's Inside

```
copado-hx/
├── 16 CLI commands          — full DevOps lifecycle in the terminal
├── SKILL.md                 — agent instruction layer for any AI
├── mcp/server.js            — native MCP server for auto-discovery
└── .copado-hx.json          — project-level config and guardrails
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│          Developer / AI Agent                        │
│     Cursor · Claude Desktop · Agentforce             │
│          One natural language sentence               │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              MCP Server (server.js)                  │
│     Auto-discovers all 16 tools — zero setup         │
│              Reads SKILL.md guardrails               │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               copado-hx CLI                          │
│   auth · story · commit · promote · deploy           │
│   status · test · ai · explain · watch               │
│   release-notes · doctor · init · history            │
│   workflow                                           │
└────────┬──────────────┬───────────────┬─────────────┘
         │              │               │
         ▼              ▼               ▼
┌──────────────┐ ┌────────────┐ ┌──────────────────┐
│  Agentia Pro │ │  Agentia   │ │   Copado AI      │
│  CI/CD API   │ │  Testing   │ │   Context Hub    │
│              │ │  CRT API   │ │   5 Agents       │
└──────────────┘ └────────────┘ └──────────────────┘
```

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/copado-hx.git
cd copado-hx

# Install dependencies
npm install
```

### Authentication

```bash
# Interactive login — configures all 3 API surfaces at once
node bin/copado-hx.js auth login
```

You will be prompted for:
- Copado CI/CD instance URL + API token
- CRT Personal Access Key (PAK) + Project ID
- Copado AI API key + Organization ID

### Verify Setup

```bash
# Run 8 pre-flight checks before your first deployment
node bin/copado-hx.js doctor --fix
```

### Initialize Your Project

```bash
# Creates .copado-hx.json with pipeline defaults and guardrails
node bin/copado-hx.js init
```

---

## Command Reference

### Authentication
```bash
copado-hx auth login              # Authenticate with Copado
copado-hx auth status             # Check authentication status
copado-hx auth logout             # Clear stored credentials
```

### User Stories
```bash
copado-hx story list                         # List your user stories
copado-hx story list --status "In Progress"  # Filter by status
copado-hx story set --id US-1234             # Set working context
copado-hx story show                         # Show active story
copado-hx story create --title "My Story"    # Create new story
```

### CI/CD Pipeline
```bash
copado-hx commit --message "feat: my change"    # Commit with diff
copado-hx promote --env UAT --validate          # Validate to UAT
copado-hx promote --env UAT                     # Promote to UAT
copado-hx deploy --env PROD                     # Deploy (confirms PROD)
copado-hx status                                # Pipeline status
copado-hx status --job <id> --watch             # Live-poll a job
```

### Copado Robotic Testing
```bash
copado-hx test list                              # List test suites
copado-hx test run --suite <id>                  # Trigger a suite
copado-hx test status --execution <id> --watch   # Poll results
copado-hx test results --execution <id>          # View results
copado-hx test results --execution <id> --format junit  # JUnit output
```

### AI Specialist Agents
```bash
copado-hx ai ask --agent build "Review my Apex class"
copado-hx ai ask --agent plan "Refine user story US-1234"
copado-hx ai ask --agent test "Generate CRT test for LeadScoring"
copado-hx ai ask --agent release "Why did job JOB-123 fail?"
copado-hx ai ask --agent operate "Write change management plan"
copado-hx ai chat --agent build   # Interactive multi-turn session
copado-hx ai agents               # List all agents
```

### Power Commands
```bash
copado-hx explain --job <id>              # AI failure analysis
copado-hx watch                           # Live pipeline dashboard
copado-hx release-notes --sprint "S42"   # Auto-generate release doc
copado-hx release-notes --sprint "S42" --save  # Save as markdown
copado-hx doctor --fix                    # Pre-flight health check
copado-hx init                            # Initialize project config
copado-hx history                         # Full audit trail
copado-hx workflow --us US-1234 --env UAT # Full multi-agent delivery
```

> 💡 Every command supports `--json` for machine-readable output
> and `--help` for usage details.

---

## AI Agents

copado-hx exposes all 5 Copado AI specialist agents directly
from the terminal:

| Agent | `--agent` | Best for |
|-------|-----------|---------|
| Plan Agent | `plan` | Sprint planning, story refinement, conflict detection |
| Build Agent | `build` | Apex code generation, metadata analysis, coverage |
| Test Agent | `test` | CRT QWord test scripts, automation advice |
| Release Agent | `release` | Deployments, error analysis, release notes |
| Operate Agent | `operate` | Post-release docs, change management, training |

### Example
```bash
# Get AI-guided commit scope before committing
copado-hx ai ask --agent build \
  "What metadata should I commit for US-1234?"

# Diagnose a failed deployment instantly
copado-hx ai ask --agent release \
  "Analyze the failure for job execution JOB-5678"

# Generate release notes in seconds
copado-hx ai ask --agent release \
  "Generate release notes for Sprint 42"
```

---

## MCP Server Setup

copado-hx ships as a native **Model Context Protocol** server —
making all 16 tools auto-discoverable by any MCP-compatible AI
agent with zero configuration.

### Cursor

Add to your `mcp.json` (Cursor Settings → MCP tab):

```json
{
  "mcpServers": {
    "copado-hx": {
      "command": "node",
      "args": ["/full/path/to/copado-hx/mcp/server.js"],
      "name": "copado-hx",
      "description": "Headless Copado DevOps — Zero Browser. Full Pipeline. Any Agent."
    }
  }
}
```

Restart Cursor — all 16 tools appear automatically. ✅

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "copado-hx": {
      "command": "node",
      "args": ["/full/path/to/copado-hx/mcp/server.js"]
    }
  }
}
```

### Verify Connection

In Cursor or Claude Desktop chat:
```
What Copado tools do you have available?
```

The AI will list all 16 copado-hx tools and offer to run them. 🚀

---

## SKILL.md

`SKILL.md` is the agent instruction layer — a structured
7-section file that teaches any AI exactly how to use
copado-hx safely:

| Section | Purpose |
|---------|---------|
| Identity | What copado-hx is and what it connects to |
| Prerequisites | What must be true before running commands |
| Commands Reference | Every command with syntax, output, examples |
| Workflow Playbooks | 4 step-by-step delivery recipes |
| Guardrails | What agents must NEVER do autonomously |
| Output Parsing Guide | How to interpret `--json` output |
| Agent Persona Routing | Which agent handles which developer intent |

Think of it as **the new package.json** — the file every
Copado project ships with so any AI agent is immediately
productive and safe.

### Add to Cursor automatically

```bash
mkdir -p .cursor/rules
cp SKILL.md .cursor/rules/SKILL.md
```

---

## Multi-Agent Workflow

The `workflow` command is copado-hx's flagship feature —
orchestrating Build, Test, and Release agents in sequence
with a mandatory human checkpoint before production:

```
copado-hx workflow --us US-1234 --env UAT

Step 1 → Auth check
Step 2 → Build Agent consulted for commit guidance
Step 3 → Metadata committed
Step 4 → Promoted to UAT with validation
Step 5 → Test Agent consulted for coverage verification
Step 6 → CRT smoke tests executed
Step 7 → ⚠️ HUMAN CHECKPOINT — approval required
Step 8 → Deploy on approval
Step 9 → Release Agent generates release notes
```

Context flows from one agent to the next via `--json` output.
The system **always stops before production** — by design.

---

## Guardrails

copado-hx enforces 5 hard guardrails — in both the CLI and
SKILL.md — that cannot be bypassed:

- 🚫 **Never deploy to PROD without explicit human confirmation**
- 🚫 **Never fabricate or guess IDs** — always retrieve from CLI
- 🚫 **Never chain more than 3 destructive actions** without a checkpoint
- 🚫 **Never store or log API tokens** in any output or file
- ⚠️ **Always surface test failures** before proceeding

---

## Project Config

`copado-hx init` creates `.copado-hx.json` in your project root:

```json
{
  "name": "my-salesforce-project",
  "pipeline": "your-pipeline-id",
  "defaultEnv": "UAT",
  "testSuite": "your-suite-id",
  "guardrails": {
    "requireTestsBeforeProd": true,
    "requireHumanApprovalForProd": true,
    "maxDestructiveActionsWithoutCheckpoint": 3
  }
}
```

Commit this file so your entire team shares the same defaults. ✅

---

## Platform Support

| Platform | Supported |
|----------|-----------|
| Windows 10/11 | ✅ |
| macOS 12+ | ✅ |
| Linux (Ubuntu, Debian, RHEL) | ✅ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| CLI Framework | Commander.js v12 |
| MCP Server | @modelcontextprotocol/sdk |
| HTTP Client | Axios |
| Terminal UI | Chalk · Ora · cli-table3 |
| Interactive prompts | Inquirer.js |
| Credential storage | Configstore (encrypted) |
| Runtime | Node.js v18+ |

---

## Security

- ✅ Credentials stored encrypted via Configstore
- ✅ Tokens never logged or outputted
- ✅ No plaintext secrets in any config file
- ✅ POSIX exit codes (0 = success, 1 = error)
- ✅ Meaningful errors — no raw HTTP responses exposed

---

## Acknowledgements

Thank you to Archana for the unwavering support and
encouragement throughout the CopadoCON 2026 journey. 💙

Thank you to the Copado team for building an API surface
rich enough to make copado-hx possible, and for the
opportunity to present at CopadoCON Bangalore 2026.

---

## Recognition

> 🏆 **CopadoCON Bangalore 2026 — Hackathon Runner-Up**
> Track B: Agentic Orchestrator + MCP Server Bonus
> Presented to Copado CEO, Co-founder, and engineering leadership

---

## License

MIT © Akshara Thakur — Team Arkhive

---

<div align="center">

**Zero Browser. Full Pipeline. Any Agent.**

*copado-hx — CopadoCON Bangalore 2026*

</div>
