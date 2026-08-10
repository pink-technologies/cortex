# jira.triage roadmap

Near-term product follow-ups that are intentionally out of the current
implementation slice.

## Suite secrets (production)

**Current (local/dev):** allowlisted suite subprocesses inherit the node
process environment. Put repo-specific values such as
`TRUVIDEO_ACCESS_TOKEN` / `TRUVIDEO_REFRESH_TOKEN` in `apps/node/.env`.
`TestRunner` also mirrors those keys as `TEST_RUNNER_*` so `xcodebuild test`
forwards them into the XCTest process. This does not scale for multi-tenant or
multi-suite production nodes.

**Target:** node-local secret bundles referenced by id from the project→repo
suite map — same trust model as `.cortex/connections.toml` secret references
(materialize on the node; never put secrets on the job wire or inside suite
argument vectors).

1. Load secret bundles at boot from env / Secret Manager / mounted CSI, e.g.
   `CORTEX_SUITE_SECRETS=[{"id":"truvideo-ios","env":{"TRUVIDEO_ACCESS_TOKEN":"…","TRUVIDEO_REFRESH_TOKEN":"…"}}]`.
2. Extend suite config with `secretIds: ["truvideo-ios"]` (ids only; no secret
   values in `.cortex/projects/*.toml`).
3. Resolve ids in a small store (e.g. `SuiteSecretStore`) and pass
   `env: { ...process.env, ...mergedBundleEnv }` into `TestRunner` for that
   suite invocation only.
4. Document rotation and per-suite blast radius; keep job payloads free of
   secret material.

## Bounded suite compile repair (optional)

When allowlisted suites fail with `suite_broken` (compile / cannot run),
consider a **single bounded coder pass** whose only goal is to make those
suites compile and start tests — not to fix the product bug.

- Cap turns/tokens and allowlisted file touch surface.
- Skip when the failure looks environmental (missing simulator, scheme, or
  toolchain) rather than code in the workspace.
- On success, continue the normal green → fill-tests / red → fix path.
- On failure, escalate `suite_broken` as today (comment, no autofix).
