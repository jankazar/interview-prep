# Claude Code Interview Questions

Source: [Claude Code Interview Questions - SFEIR Institute](https://institute.sfeir.com/en/claude-code/claude-code-resources/interview/)

Preparing for a technical interview on Claude Code requires mastering CLI commands, the memory system, permissions, and MCP integration. This guide gathers 27 interview questions classified by level (junior, mid-level, and senior) with model answers, key points to mention, and pitfalls to avoid for passing your agentic coding interview.

Claude Code is Anthropic's command-line development agent that allows developers to interact with Claude directly from their terminal to generate, refactor, and debug code. This tool has established itself as a reference in the field of agentic coding and is the subject of increasingly frequent interview questions.

Claude Code handles the vast majority of common development tasks without leaving the terminal. Recruiters now test candidates' ability to leverage these AI tools to accelerate their productivity.

## How are Claude Code interview questions structured by level?

Technical interviews evaluate three tiers of Claude Code competency. The junior level verifies CLI basics and installation. The mid-level covers advanced configuration, permissions, and memory. The senior level explores MCP architecture, automation, and team integration strategies.

| Level | Number of questions | Main topics | Estimated duration |
| --- | --- | --- | --- |
| Junior | 9 questions | Installation, basic commands, first prompts | 20-30 min |
| Mid-level | 9 questions | Memory, permissions, advanced configuration | 30-40 min |
| Senior | 9 questions | MCP, architecture, CI/CD, team strategy | 40-50 min |

To start your preparation well, see the guide on installation and first launch which covers the fundamental technical prerequisites.

Key takeaway: structure your preparation by difficulty level and focus on fundamentals before tackling advanced topics.

## What Claude Code interview questions do recruiters ask at the junior level?

### 1. What is Claude Code and how does it differ from Claude's web interface?

**Model answer:** Claude Code is a CLI agent that runs directly in the terminal. Unlike the web interface, it accesses the local file system, executes shell commands, and interacts with Git natively. Its default model is plan-dependent: Sonnet 4.6 on Pro and Team Standard, Opus 4.8 on Max, Team Premium, Enterprise, and API.

**Key points to mention:**

* Direct file system access
* Bash command execution
* Native Git integration
* Token consumption via the Anthropic API

**Common pitfall:** do not confuse Claude Code with a simple chatbot. It is an autonomous agent capable of modifying files.

### 2. How do you install Claude Code on your machine?

**Model answer: Run** the following command to install Claude Code globally:

```bash
npm install -g @anthropic-ai/claude-code
```

Node.js 18 or higher is required (22 LTS recommended). After installation, **launch** `claude` in your terminal to start a session.

**Key points to mention:**

* Prerequisite: Node.js >= 18
* Global installation via npm
* Anthropic API key required
* Authentication at first launch

**Common pitfall:** forgetting to configure the `ANTHROPIC_API_KEY` environment variable before the first launch. See the complete guide on your first conversations to avoid this error.

### 3. What are the three essential slash commands in Claude Code?

**Model answer:** The three essential commands are `/help` to display help, `/clear` to reset the context, and `/compact` to compress the conversation. In practice, `/compact` can substantially reduce token usage on long sessions.

```bash
# In a Claude Code session
/help # Display available commands
/clear # Reset the context
/compact # Compress the conversation
```

**Key points to mention:**

* `/help` - built-in documentation
* `/clear` - context reset
* `/compact` - memory optimization
* Other commands exist: `/init`, `/config`

**Common pitfall:** using `/clear` instead of `/compact` when you want to keep a summary of the context. Go deeper with the essential slash commands guide.

### 4. How do you formulate an effective prompt for Claude Code?

**Model answer: Structure** your prompt in three parts: the context (which file or project), the expected action (refactor, fix, create), and the constraints (language, conventions). A precise prompt significantly reduces the number of back-and-forth exchanges.

**Key points to mention:**

* Specify the files involved
* Describe the expected result
* Indicate technical constraints
* Use imperative format

**Common pitfall:** writing vague prompts like "improve the code" without context.

### 5. What happens when Claude Code reaches its context limit?

**Model answer:** When the context window approaches its large fixed limit (the current Sonnet model, the `sonnet` alias, exposes a sizeable context window), Claude Code automatically compresses previous messages. The system retains a summary of exchanges and critical information.

**Key points to mention:**

* Large fixed context-window limit
* Automatic compression
* Summary retention
* Ability to force with `/compact`

**Common pitfall:** thinking that compression deletes all previous information.

### 6. How does Claude Code handle your project files?

**Model answer:** Claude Code uses dedicated tools to read (`Read`), write (`Write`), and edit (`Edit`) files. It prefers editing existing files over creating new ones. Each modification goes through the permissions system before execution.

**Key points to mention:**

* Read, Write, Edit, Glob, Grep tools
* Preference for editing over creation
* Active permissions system
* Local file system access only

**Common pitfall:** believing Claude Code can access remote files or arbitrary URLs.

### 7. What is the difference between plan mode and implementation mode?

**Model answer:** Plan mode allows Claude Code to explore the codebase and propose a strategy before writing code. Concretely, it reads and analyzes files without modifying them. Implementation mode authorizes actual modifications. In practice, most complex projects benefit from a prior planning phase.

**Key points to mention:**

* Plan mode: read-only, no modifications
* Implementation mode: editing authorized
* User validation between both phases
* Error reduction through planning

**Common pitfall:** skipping the planning step on multi-file tasks.

### 8. How do you stop an operation in progress in Claude Code?

**Model answer: Press** `Escape` to interrupt generation in progress. To cancel a bash command launched by Claude Code, use `Ctrl+C`. These shortcuts work in all permission modes.

**Key points to mention:**

* `Escape` - stop generation
* `Ctrl+C` - interrupt a bash command
* No context loss after interruption
* Session remains active

**Common pitfall:** closing the terminal instead of using shortcuts, which loses all session context.

### 9. How do you verify that Claude Code is working correctly after installation?

**Model answer: Run** `claude --version` to check the installed version, then **launch** `claude` in a Git project to validate file system access. A quick test is to ask "list the project files" to confirm read permissions.

```bash
claude --version # Check version
claude # Launch an interactive session
```

**Key points to mention:**

* Version verification
* Testing in a Git directory
* Validating read permissions
* API key verification

**Common pitfall:** testing Claude Code outside a Git directory, which limits its contextual analysis capabilities.

Key takeaway: junior questions verify your understanding of fundamentals: installation, basic commands, and terminal interaction.

## What Claude Code interview questions target the mid-level?

### 10. How does the CLAUDE.md memory system work?

**Model answer:** The CLAUDE.md file is Claude Code's persistent memory system. It stores project conventions, user preferences, and recurring instructions. Claude Code automatically loads this file at the start of each session. The `/init` command generates an initial CLAUDE.md based on project analysis.

```bash
# Initialize the CLAUDE.md file
/init

# Typical CLAUDE.md content
# - Naming conventions
# - Project tech stack
# - Linting rules
# - Architectural patterns
```

**Key points to mention:**

* Levels: user (`~/.claude/CLAUDE.md`), project (`./CLAUDE.md` or `./.claude/CLAUDE.md`), plus any `CLAUDE.md` found by walking up the directory tree; a managed-policy `CLAUDE.md` takes highest priority
* Automatic loading at startup
* Free Markdown format
* `/init` command for generation

To master this topic, explore the guide on the CLAUDE.md memory system which details each configuration level.

**Common pitfall:** not structuring the CLAUDE.md, which dilutes instructions in a file that is too long.

### 11. How do you configure Claude Code permissions for a team project?

**Model answer: Configure** permissions via the `.claude/settings.json` file at the project root. Several permission modes exist, including `default` (confirmation for each action), `acceptEdits` (edits are auto-accepted), `plan`, `auto`, `dontAsk`, and `bypassPermissions` (no confirmation, use with caution). The `--dangerously-skip-permissions` flag is equivalent to `--permission-mode bypassPermissions`. In a team context, `default` mode with targeted exceptions offers the best security/productivity balance.

```json
{
  "permissions": {
    "allow": ["Read", "Glob", "Grep"],
    "deny": ["Bash(rm *)"]
  }
}
```

**Key points to mention:**

* `.claude/settings.json` file versioned with the project
* Multiple permission modes (`default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`)
* Granular allow/deny lists
* Distinction between tools (Read, Write, Bash)

See the permissions security checklist for a secure team deployment.

**Common pitfall:** using `--dangerously-skip-permissions` in production, as this mode disables all confirmation including for destructive commands.

### 12. How does Claude Code interact with Git?

**Model answer:** Claude Code automatically detects Git repositories and uses Git commands natively. It can create commits, branches, analyze diffs, and even create pull requests via `gh`. In practice, Claude Code follows a strict Git security protocol: it never force-pushes and never modifies the Git configuration.

**Key points to mention:**

* Automatic repository detection
* Commits with co-author `Co-Authored-By: Claude`
* Security protocol: never unauthorized `--force`
* `gh` integration for PRs

**Common pitfall:** expecting Claude Code to push automatically. It always asks for confirmation.

### 13. What is the difference between /compact and /clear?

**Model answer:** `/compact` compresses the context while retaining a structured summary of previous exchanges. The conversation continues with this summary. `/clear` completely deletes the context and restarts a blank session. Concretely, `/compact` substantially lowers token count while preserving decisions made.

| Command | Context retained | Tokens saved | Use case |
| --- | --- | --- | --- |
| `/compact` | Structured summary | Substantial | Long session, same topic |
| `/clear` | None | All context | Complete topic change |
| `/compact [focus]` | Targeted summary | Substantial | Refocusing on a subtopic |

**Key points to mention:**

* `/compact` preserves a summary
* `/clear` starts from zero
* `/compact` accepts an optional argument to target the summary
* Direct impact on API costs

**Common pitfall:** using `/clear` by reflex when `/compact` would suffice, thus losing useful context.

### 14. How do you use Claude Code in non-interactive (headless) mode?

**Model answer: Use** the `-p` (or `--print`) flag to run Claude Code in non-interactive mode. This mode is essential for CI/CD pipeline integration. Output is written directly to stdout without an interactive interface.

```bash
# Non-interactive mode
claude -p "Analyze this file and list potential bugs" src/app.ts

# With JSON output format
claude -p "List the TODOs" --output-format json

# In a pipeline
echo "Generate unit tests" | claude -p
```

**Key points to mention:**

* `-p` or `--print` flag
* Direct stdout output
* CI/CD compatible (GitHub Actions, GitLab CI)
* `--output-format` option for JSON

**Common pitfall:** forgetting that headless mode asks for no confirmation. Permissions must be pre-configured.

### 15. How do you optimize token consumption in Claude Code?

**Model answer:** Three strategies reduce consumption. First, **use** `/compact` regularly to compress context. Next, **write** precise prompts that target specific files. Finally, **configure** CLAUDE.md with recurring instructions to avoid repeating them. In practice, these techniques can meaningfully reduce API costs over a month.

**Key points to mention:**

* Regular compression with `/compact`
* Targeted prompts (files, lines)
* CLAUDE.md for persistent instructions
* Monitoring via the Anthropic dashboard

**Common pitfall:** not monitoring your consumption and discovering a high bill at month's end.

### 16. How does Claude Code handle bash command errors?

**Model answer:** When a bash command fails, Claude Code analyzes the return code and error message. It then proposes a correction or an alternative approach. It never tries to force the same command in a loop. Here is how to handle frequent errors:

1. Check the displayed error message
2. Analyze the return code (exit code)
3. Propose a corrected command
4. Ask for confirmation before re-execution

**Key points to mention:**

* Automatic error analysis
* No loop retries
* Alternative proposals
* Escalation to user if needed

**Common pitfall:** thinking Claude Code will automatically resolve all errors without intervention.

### 17. How do you use hooks in Claude Code?

**Model answer:** Hooks are shell commands triggered by Claude Code events (before/after a tool call, on prompt submission). **Configure** them in the `.claude/settings.json` file. In practice, many use hooks to automatically run a linter after each file edit.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npx eslint --fix" }
        ]
      }
    ]
  }
}
```

**Key points to mention:**

* Events: `PreToolUse`, `PostToolUse`, `UserPromptSubmit` (and others such as `SessionStart`, `SessionEnd`, `PreCompact`)
* Configuration in settings.json
* Hooks receive structured JSON on stdin (tool name, inputs, file paths)
* Feedback treated as coming from the user

**Common pitfall:** creating hooks that block execution without a clear error message.

### 18. How does Claude Code select which model to use?

**Model answer:** By default, Claude Code's main model is plan-dependent: Sonnet 4.6 on Pro and Team Standard, Opus 4.8 on Max, Team Premium, Enterprise, and API. The model can be changed via configuration or CLI flags, and the docs treat the `sonnet`, `opus`, and `haiku` aliases as the stable references. Child agents (subagents) can use different models depending on the task, for example the `haiku` alias for quick searches.

| Model | Alias / Identifier | Typical usage | Relative cost |
| --- | --- | --- | --- |
| Opus | `opus` (e.g. `claude-opus-4-8`) | Complex tasks, architecture | High |
| Sonnet | `sonnet` (e.g. `claude-sonnet-4-6`) | Everyday development | Medium |
| Haiku | `haiku` | Quick searches, sorting | Low |

**Key points to mention:**

* Default model is plan-dependent: Sonnet 4.6 on Pro/Team Standard, Opus 4.8 on Max/Team Premium/Enterprise/API
* Per-project configuration possible
* Subagents with dedicated models
* Direct impact on costs and latency

**Common pitfall:** systematically using Opus for all tasks, which significantly increases cost without a proportional gain on routine work.

Key takeaway: the mid-level evaluates your ability to configure Claude Code for professional use: memory, permissions, optimization, and Git integration.

## What Claude Code interview questions are reserved for senior profiles?

### 19. How do you integrate Claude Code into a CI/CD pipeline?

**Model answer: Configure** Claude Code in headless mode (`-p`) in your GitHub Actions or GitLab CI. Here is a typical workflow for automated code review:

```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review
on: pull_request
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @anthropic-ai/claude-code
      - run: |
          claude -p "Analyze this diff and identify issues" \
            --output-format json > review.json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Key points to mention:**

* Headless mode with `-p`
* Secure secrets management
* JSON output format for parsing
* Pre-configured permissions (no interaction)
* Bound runs with `--max-turns` (no limit by default) or `--max-budget-usd` instead of relying on a timeout

To understand CI/CD security implications, refer to the guide on permissions and security.

**Common pitfall:** storing the API key in cleartext in the config file instead of using CI secrets.

### 20. What is the Model Context Protocol (MCP) and how do you use it with Claude Code?

**Model answer:** The Model Context Protocol (MCP) is an open standard that allows Claude Code to connect to external data sources and tools via dedicated servers. Each MCP server exposes "tools" that Claude Code can invoke. MCP standardizes and greatly simplifies integration with third-party systems.

Place the `mcpServers` JSON in `.mcp.json` at the project root (or `~/.claude.json` for user scope), or add servers with `claude mcp add`:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

**Key points to mention:**

* Open standard by Anthropic
* Client-server architecture
* Community servers available (Postgres, GitHub, Slack)
* Configuration in `.mcp.json` (project) or `~/.claude.json` (user), or via `claude mcp add`

See the MCP checklist for secure implementation.

**Common pitfall:** exposing an MCP server without access restrictions. Each server must have minimal permissions.

### 21. How do you architect Claude Code memory for a team of 10+ developers?

**Model answer: Structure** memory across three levels. The project CLAUDE.md (versioned) contains shared conventions. The user CLAUDE.md (`~/.claude/CLAUDE.md`) stores individual preferences. The project's `.claude/settings.json` file defines team permissions.

```text
Project/
├── CLAUDE.md          # Team conventions (versioned)
├── .claude/
│   ├── settings.json  # Shared permissions
│   └── CLAUDE.md      # Repository instructions
└── src/
    └── CLAUDE.md      # Folder-specific instructions
```

**Key points to mention:**

* Versioned CLAUDE.md = shared source of truth
* Individual preferences in the home directory
* Hierarchy: project > directory > user
* CLAUDE.md review in code review

**Common pitfall:** letting each developer define their own conventions without a shared file, creating inconsistencies.

### 22. How do you evaluate the quality of code generated by Claude Code?

**Model answer: Set up** four guardrails. First, post-edit hooks run linters automatically. Second, unit tests are executed after each generation. Third, the CLAUDE.md encodes quality standards. Fourth, human review remains mandatory for merges.

| Method | Automatable | Coverage | Reliability |
| --- | --- | --- | --- |
| Linting (ESLint, Ruff) | Yes | Syntax, style | High |
| Unit tests | Yes | Business logic | Medium |
| CLAUDE.md patterns | Yes | Project conventions | High |
| Human review | No | Architecture, security | Very high |

**Key points to mention:**

* Post-edit hooks for linting
* Automatic test execution
* Standards encoded in CLAUDE.md
* Human review is irreplaceable

To deepen prompt and review best practices, see the tips for your first conversations.

**Common pitfall:** blindly trusting generated code without tests or review.

### 23. How do you use subagents (Task tool) effectively?

**Model answer:** Subagents allow parallelizing tasks and isolating contexts. **Launch** an Explore agent for read-only code search, a Plan agent during plan mode, and a general-purpose agent for complex tasks that need every tool. In practice, using parallel subagents shortens completion time on multi-file projects by working on independent tasks at once.

**Key points to mention:**

* Types: Explore (read-only search), Plan (used in plan mode), and General-purpose (all tools)
* Parallel execution for independent tasks
* Main context isolation
* Communication via result return

**Common pitfall:** launching subagents in series when tasks are independent. Parallelization is the main advantage.

### 24. How do you secure Claude Code in an enterprise environment?

**Model answer: Apply** the principle of least privilege at three levels. Restrict authorized bash commands via permission deny-lists. Limit file system access to project directories. Control authorized MCP servers. Enterprises with strong security postures typically enforce these three controls as a minimum baseline.

```json
{
  "permissions": {
    "deny": [
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(rm -rf *)",
      "Write(~/.ssh/*)"
    ]
  }
}
```

**Key points to mention:**

* Deny-list for dangerous commands
* Project directory isolation
* MCP server auditing
* API key rotation
* Activity logs

**Common pitfall:** authorizing `Bash(*)` to "save time". This is a direct attack vector.

### 25. How does Claude Code handle monorepo projects?

**Model answer:** Claude Code navigates monorepos using Glob and Grep tools to locate relevant files. **Configure** a root CLAUDE.md describing the monorepo structure and specific CLAUDE.md files in each package. Concretely, large monorepos are searched quickly thanks to the ripgrep-backed Glob and Grep tools.

**Key points to mention:**

* Hierarchical CLAUDE.md files (root + packages)
* Performant Glob/Grep tools on large volumes
* Limited context: target relevant files
* Per-subproject configuration possible

**Common pitfall:** not structuring the CLAUDE.md for a monorepo, which drowns Claude Code in too broad a context.

### 26. When should you use Claude Code rather than an IDE with integrated copilot?

**Model answer:** Claude Code excels on multi-file refactoring tasks, codebase analysis, and complex Git operations. An IDE copilot is preferable for real-time inline completion. In practice, many developers use both tools complementarily.

| Criterion | Claude Code | IDE Copilot |
| --- | --- | --- |
| Multi-file refactoring | Excellent | Limited |
| Inline completion | Not applicable | Excellent |
| Codebase analysis | Excellent | Medium |
| Git operations | Built-in | Variable |
| Test generation | Excellent | Good |
| Latency | 2-10 s | < 500 ms |

The Claude Code introduction page details optimal use cases for each approach.

**Common pitfall:** opposing the two tools instead of combining them in a complementary workflow.

### 27. How do you implement a team prompt engineering strategy with Claude Code?

**Model answer: Centralize** proven prompt patterns in the project's CLAUDE.md. **Document** templates for recurring tasks (test generation, refactoring, code review). **Share** results via pair-programming sessions with Claude Code. Teams that standardize their prompts tend to see more consistent, lower-variability code quality across the team.

**Key points to mention:**

* CLAUDE.md as prompt repository
* Templates for recurring tasks
* Team experience feedback
* Quality metrics (acceptance rate, review time)

**Common pitfall:** letting each developer reinvent their prompts without capitalizing on collective learnings.

Key takeaway: the senior level evaluates your ability to deploy Claude Code at scale: CI/CD, security, team architecture, and organizational strategy.

## How to effectively prepare for a Claude Code interview?

Here is a five-step method to maximize your chances:

1. **Install** Claude Code and practice for at least 2 hours with basic commands
2. **Configure** a CLAUDE.md on a personal project to understand the memory system
3. **Test** the three permission modes on real scenarios
4. **Explore** headless mode with a simple CI/CD script
5. **Document** your learnings. Recruiters value practical experience

SFEIR Institute offers the one-day Claude Code training to acquire fundamentals under real conditions with hands-on labs. To go further, the two-day AI-Augmented Developer training covers integrating Claude Code into a complete professional development workflow. Senior profiles will benefit from the AI-Augmented Developer - Advanced level which covers MCP architectures and team strategies in one intensive day.

| Step | Recommended time | Priority |
| --- | --- | --- |
| Installation + first tests | 2 hours | High |
| CLAUDE.md configuration | 1 hour | High |
| Permissions and security | 1 hour | Medium |
| Headless mode / CI/CD | 2 hours | Medium (senior) |
| Complex prompt practice | 3 hours | High |

Key takeaway: hands-on practice on your own environment remains the best investment for passing a Claude Code technical interview.

## What are the most common interview pitfalls?

Candidates often make the same mistakes. **Avoid** these five recurring pitfalls:

* **Confusing Claude Code with a chatbot**: it is an autonomous agent with file system access, not a simple conversational assistant
* **Ignoring permissions**: every senior recruiter will verify your understanding of the security model
* **Neglecting CLAUDE.md**: this file is central to professional Claude Code usage
* **Forgetting about cost**: every interaction consumes billed API tokens - cost management is a frequent interview topic
* **Overestimating automation**: Claude Code is an augmentation tool, human supervision remains indispensable

candidates who demonstrate hands-on experience with Claude Code tend to perform markedly better than those who only know the theory. **Verify** your knowledge with the security best practices before your interview.

Key takeaway: master the fundamentals (installation, permissions, memory) before tackling advanced topics. A candidate solid on the basics impresses more than one who is superficial on everything.
