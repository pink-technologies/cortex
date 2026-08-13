# Node roadmap

Prioritized follow-ups for `apps/node`. Near-term product work that is
intentionally sequenced outside the current merge slice.

## P0 — Client tools (OpenClaw-style) on integrations

**Goal:** Expose GitHub, Jira, and later other clients as **executable agent
tools** (capability-scoped), while keeping `@cortex/integrations` as the only
HTTP/auth layer and keeping **host-owned lifecycle** in handlers.

Prompt **skills** stay prompt-only. Tools perform side effects. Handlers own
claim/complete/fail, workspace prep/cleanup, scoring validation, and
fail-closed configuration.

### Current gaps

- `AgentTool` / `AgentToolRegistry` / capability `toolNames` already exist in
  `@cortex/agent-runtime`, but Node jobs do not use them.
- `AgentRuntimeExecutionEngine` passes `toolNames: []`.
- `repository.review` runs on `CursorExecutionEngine` (no Cortex tool loop).
- Handlers construct `GitHubClient` / Jira resources directly.

### Target shape

```text
Handler (lifecycle owner)
  ├─ prepare workspace / claim / complete / score / fail-closed
  ├─ inject prompt skills
  └─ run engine with capability tool allowlist
        └─ Agent tools (github.*, jira.*, …)
              └─ @cortex/integrations/*  (only HTTP clients)
```

| Layer | Owns | Does not own |
|---|---|---|
| Integrations | Auth, HTTP, typed errors | Agent prompts, job lifecycle |
| Tools | Zod I/O, execute via integrations | Tokens, job claim/complete |
| Capabilities | Which tools a job/agent may use | Implementation |
| Skills | Prompt guidance | Side effects |
| Handlers | Orchestration + must-succeed steps | Raw REST |

### Phases

#### Phase 0 — Contracts

- Namespaced tool ids (`github.*`, `jira.*`).
- Tool context injects connection credentials; tool args never carry tokens.
- Document host-owned vs tool-owned boundary.
- **Engine decision for P0:** wire tools through `AgentRuntimeExecutionEngine`
  first. Do **not** require Cursor SDK ↔ Cortex tool parity in P0.

#### Phase 1 — GitHub vertical slice

- Implement and register at least:
  - `github.pull.get`
  - `github.issue_comment.create`
  - optional stretch: `github.pull.create_draft`
- Bootstrap: register tools into `AgentToolRegistry`; map capabilities to
  `toolNames`.
- Pass **scope.toolNames** from `AgentRuntimeExecutionEngine` (not `[]`).
- Prove with a thin AgentRuntime path + unit tests (mocked integrations).

**Exit:** agent can call the GitHub tools through the runtime.

#### Phase 2 — Thin repository.review host GitHub usage

- Keep Cursor for the review reasoning pass for now.
- Replace host `new GitHubClient(...)` in `RepositoryReviewJobHandler` with
  one shared facade/path used by tools (single implementation).
- Zero direct GitHub client construction in the review handler.

**Exit:** review publish/fetch goes through the shared path.

#### Phase 3 — Jira triage extraction

- Add `jira.*` tools wrapping `@cortex/integrations/jira`.
- Migrate classifier / fix / escalator off per-stage client construction.
- Shrink orchestration in `jira-triage-job-handler`.

See also `src/handlers/jira-triage/ROADMAP.md` for triage-specific follow-ups
(suite secrets, bounded compile repair).

**Exit:** no Jira REST outside integrations; stages share tools/facades.

#### Phase 4 — Engine convergence (post-P0)

- Either run review on AgentRuntime with workspace tools (`filesystem.*`,
  `git.*`), **or** bridge Cursor tools/MCP to the Cortex tool registry.
- Do not block Phases 1–3 on this.

### Suggested PR sequence

1. Tool registration + engine allowlist + first GitHub tools + tests
2. Repository-review handler uses shared GitHub facade/tools
3. First Jira tools + one triage stage migrated
4. Remaining triage + engine convergence

### Non-goals (P0)

- Replacing prompt skills with tools
- Secrets in skill markdown
- Making score / complete / fail LLM-optional
- Full Cursor ↔ Cortex tool parity in the first slice
- Rewriting all of Node in one PR

### Risks

- Cursor-only review means the LLM pass still cannot call Cortex tools until
  Phase 4; P0 still dedupes host GitHub/Jira code.
- Tool allowlists must stay capability-scoped (especially write tools).
- Tools must not accept raw tokens; inject connection from host context.

### Success metric

Handlers read like pipelines; all GitHub/Jira I/O goes through integrations
behind registered tools/facades; AgentRuntime jobs no longer run with an empty
tool allowlist by default.
