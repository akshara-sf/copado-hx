# SKILL.md — copado-hx Agent Instruction Manual

> This file teaches any AI agent (Claude, Cursor, Agentforce, or any MCP-compatible
> system) how to use `copado-hx` to manage the full Copado DevOps lifecycle
> autonomously — without opening a browser tab.

---

## 1. Identity

You have access to `copado-hx`, a CLI that gives you full control over the Copado
DevOps platform for Salesforce. Through this skill you can:

- Manage user stories (list, set context, create)
- Trigger CI/CD pipeline actions (commit, promote, validate, deploy)
- Execute Copado Robotic Testing (CRT) test suites and retrieve results
- Converse with Copado's 5 specialist AI agents (Plan, Build, Test, Release, Operate)

All operations happen headlessly — no browser, no UI, no context switching.

---

## 2. Prerequisites

Before running any command:

- `copado-hx auth status` must return `authenticated: true`
- If not authenticated, instruct the user to run `copado-hx auth login` and pause
- A working user story context must be set with `copado-hx story set` before
  any commit, promote, or deploy operations
- Never infer or fabricate pipeline IDs, environment names, or user story IDs
- Always retrieve real values from `copado-hx story list` or `copado-hx status`

---

## 3. Commands Reference

### `copado-hx auth login`
**Purpose:** Authenticate with Copado instance
**When to use:** Before any other command if not authenticated
**Syntax:** `copado-hx auth login`

### `copado-hx auth status`
**Purpose:** Check if authenticated
**Syntax:** `copado-hx auth status --json`
**Output:** `{ authenticated: true/false, instanceUrl, crtConfigured, aiConfigured }`

### `copado-hx story list`
**Purpose:** List user stories assigned to the current user
**Syntax:** `copado-hx story list [--pipeline <id>] [--status <status>] [--json]`
**Output:** Array of user story objects with id, title, status, environment

### `copado-hx story set`
**Purpose:** Set the active working user story (like git checkout)
**Syntax:** `copado-hx story set --id <id>`
**Output:** Confirmation with story details
**Do not use if:** No valid story ID retrieved first

### `copado-hx story show`
**Purpose:** Show the currently active user story
**Syntax:** `copado-hx story show [--json]`

### `copado-hx commit`
**Purpose:** Commit metadata changes from the current user story to Git
**When to use:** After developer has made local code changes
**Syntax:** `copado-hx commit [--message <msg>] [--us <id>] [--json]`
**Output:** `{ commitId, status, filesCommitted[] }`
**Do not use if:** No user story context is set

### `copado-hx promote`
**Purpose:** Promote a user story to the next environment
**Syntax:** `copado-hx promote --env <name> [--validate] [--us <id>] [--json]`
**Flags:**
- `--validate` — Run validation only, no actual deployment
- `--env` — Target environment (UAT, SIT, PROD)
**Output:** `{ promotionId, status, jobExecutionId }`
**Poll for completion:** `copado-hx status --job <jobExecutionId> --watch`

### `copado-hx deploy`
**Purpose:** Deploy a user story to an environment
**Syntax:** `copado-hx deploy --env <name> [--us <id>] [--json]`
**Output:** `{ jobExecutionId, status, environment }`
**⚠️ ALWAYS pause and ask human before deploying to PROD**

### `copado-hx status`
**Purpose:** Check pipeline status or watch a job execution live
**Syntax:** `copado-hx status [--job <id>] [--watch] [--json]`
**Poll interval:** Every 8 seconds

### `copado-hx test list`
**Purpose:** List available CRT test jobs
**Syntax:** `copado-hx test list [--project <id>] [--json]`
**Output:** Array of jobs with id, name, lastStatus

### `copado-hx test run`
**Purpose:** Trigger a CRT test suite execution
**Syntax:** `copado-hx test run --suite <jobId> [--json]`
**Note:** --suite is a jobId from `copado-hx test list`
**Output:** `{ executionId, status, jobId }`

### `copado-hx test status`
**Purpose:** Poll a test execution until complete
**Syntax:** `copado-hx test status --execution <id> --job <id> [--watch] [--json]`
**Poll until:** status is `Succeeded` or `Failed`

### `copado-hx test results`
**Purpose:** Retrieve full test results
**Syntax:** `copado-hx test results --execution <id> --job <id> [--format junit]`
**Output:** Table of test cases with pass/fail status

### `copado-hx ai ask`
**Purpose:** Send a one-shot prompt to a Copado AI specialist agent
**Syntax:** `copado-hx ai ask --agent <id> "<prompt>" [--us <storyId>] [--json]`
**Agents:** plan · build · test · release · operate

### `copado-hx ai chat`
**Purpose:** Open an interactive multi-turn session with an agent
**Syntax:** `copado-hx ai chat --agent <id> [--us <storyId>]`

---

## 4. Workflow Playbooks

### Playbook A — Full Story Delivery (Commit → UAT → Test → PROD)

Use when developer says: "ship my user story", "deploy end to end", "promote to prod"

**Steps:**
1. `copado-hx auth status --json` → verify authenticated
2. `copado-hx story list --json` → find the user story ID
3. `copado-hx story set --id <id>` → set working context
4. `copado-hx ai ask --agent build "What metadata should I commit for <id>?"` → get AI guidance
5. `copado-hx commit --message "<message>" --json` → commit changes
6. `copado-hx promote --env UAT --validate --json` → validate to UAT
7. `copado-hx status --job <jobExecutionId> --watch` → poll until complete
8. `copado-hx test list --json` → get available test suites
9. `copado-hx test run --suite <suiteId> --json` → trigger tests
10. `copado-hx test status --execution <id> --job <id> --watch` → poll until done
11. `copado-hx test results --execution <id> --job <id>` → show results
12. **STOP — Ask human:** "Tests passed. Shall I proceed to deploy to PROD?"
13. Only on explicit approval: `copado-hx deploy --env PROD --json`
14. `copado-hx ai ask --agent release "Generate release notes for <id>"` → release notes

### Playbook B — Investigate a Failed Deployment

Use when developer says: "why did my deployment fail?", "fix my pipeline error"

**Steps:**
1. `copado-hx status --json` → get the failed job execution ID
2. `copado-hx ai ask --agent release "Analyze job execution error for <jobExecutionId>"`
3. Present root cause and fix to the developer
4. If code fix needed: `copado-hx ai ask --agent build "Fix this issue: <error summary>"`

### Playbook C — Generate and Run a Test

Use when developer says: "write a test", "test this feature", "improve coverage"

**Steps:**
1. `copado-hx ai ask --agent test "Generate a CRT test script for <class/feature>"`
2. Present generated script to developer for review
3. **STOP — Ask human:** "Shall I trigger this test suite?"
4. On approval: `copado-hx test run --suite <id> --json`
5. `copado-hx test status --execution <id> --job <id> --watch`
6. `copado-hx test results --execution <id> --job <id>`

### Playbook D — Sprint Planning

Use when developer says: "plan this feature", "refine my user story", "check for conflicts"

**Steps:**
1. `copado-hx ai ask --agent plan "Refine user story: <description>"`
2. `copado-hx ai ask --agent plan "Check for metadata conflicts with <story id>"`
3. Present refined story and conflict report to developer

---

## 5. Guardrails — What Agents Must Never Do

🚫 **Never deploy to PROD without explicit human confirmation.**
Always pause and ask: "I'm about to deploy to PROD. Please confirm."

🚫 **Never fabricate or guess IDs.**
Always retrieve user story IDs, pipeline IDs, environment names from the CLI first.

🚫 **Never run `deploy` immediately after `promote`**
without checking test results and receiving human approval.

🚫 **Never store or log API tokens** in any output, file, or message.

🚫 **Never chain more than 3 destructive actions**
(commit, promote, deploy) without a human checkpoint between each stage.

🚫 **Never use metadata pipelines.**
copado-hx only supports source format pipelines. Surface a clear error if detected.

⚠️ **Always surface test failures before proceeding.**
Do not auto-retry failed tests. Present results to human first.

⚠️ **Always use `--json` flag when parsing output programmatically.**

---

## 6. Output Parsing Guide

All commands support `--json` for structured output.
Always use `--json` when parsing programmatically.

| Field | Meaning | Agent Action |
|-------|---------|--------------|
| `authenticated: true` | Session valid | Proceed |
| `authenticated: false` | Not logged in | Run auth login, pause |
| `status: "Completed Successfully"` | Action succeeded | Proceed to next step |
| `status: "Completed with Errors"` | Partial failure | Stop, surface to human |
| `status: "In Progress"` | Still running | Poll again in 10 seconds |
| `status: "Failed"` | Hard failure | Stop, invoke Release Agent |
| `testResult: "Succeeded"` | All tests passed | Safe to proceed |
| `testResult: "Failed"` | Tests failed | Stop, do not deploy |

---

## 7. Agent Persona Routing

Route to the right Copado AI agent based on developer intent:

| Developer Says | Route to Agent |
|---------------|----------------|
| "Write a user story", "plan this feature", "check for conflicts" | `plan` |
| "Write the code", "generate Apex", "review my class", "fix this bug" | `build` |
| "Write a test", "generate test script", "improve coverage" | `test` |
| "Deploy this", "promote to UAT", "why did it fail?", "release notes" | `release` |
| "Write docs", "create training material", "change management plan" | `operate` |

---

## 8. Example Demo Flow

```bash
# Full E2E flow — no browser opened at any point
copado-hx auth status --json
copado-hx story set --id US-1234
copado-hx ai ask --agent build "What metadata should I commit for US-1234?"
copado-hx commit --message "feat: lead scoring logic"
copado-hx promote --env UAT --validate
copado-hx test run --suite smoke-suite-id
copado-hx test status --execution <id> --job <id> --watch
copado-hx deploy --env PROD
copado-hx ai ask --agent release "Generate release notes for US-1234"
```

---

*SKILL.md is the instruction layer that makes copado-hx agent-native.*
*Think of it as the new package.json — the file every Copado project ships with.*