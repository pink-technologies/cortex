# Cortex V1 — Implementation Plan

Owner: Cortex
Canonical spec: [spec.md](spec.md)
Work item: Trello — 1 — Finalize Cortex V1 implementation plan

## 1. Purpose

This plan describes how Cortex V1 is intended to be built: architecture,
module boundaries, state ownership, data flows, protocols, persistence,
infrastructure, sequencing, testing, risks, and rollout for:

```text
Cortex V1
├── Cortex API Platform
├── Intelligence Runtime
├── Business Foundations
└── Operator
    └── Understanding
```

It answers one question:

> How do we intend to build the behavior defined by the Cortex specifications?

It does not define product behavior. Observable behavior (resources, fields,
states visible to consumers, error types, limits, readiness, data-quality
semantics, retention) belongs to the owning specifications listed in
[Section 2](#2-traceability). Where this plan needs a behavioral answer that
no specification provides, it records a behavioral dependency and leaves the
decision to the owning spec.

The guiding constraint is the **smallest coherent architecture capable of
supporting the approved V1 and its known near-term evolution** (SSE
streaming, an MCP adapter, the Swift SDK, more connectors, more AI
providers, and an analytical engine behind the semantic layer).

Business Understanding is the first production capability and the reference
consumer of the platform. It is not the definition of Cortex. Every platform
mechanism in this plan must also work for a capability that uses no AI and
touches no Business data.

### 1.1 Authority and readiness

Cortex follows the Engineering/SDD flow:

```text
Spec  →  Plan  →  Tasks  →  Execute  →  Validate
```

| Artifact | Answers |
| --- | --- |
| Spec | What behavior must exist |
| Plan | How we intend to build approved behavior |
| Tasks | Executable units derived from the plan |
| Execute | Implementation against the approved spec and plan |
| Validate | Evidence that the implementation satisfies the contract |

Repository condition on 2026-10-04:

- None of the five owning specifications exists ([Section 2.1](#21-owning-specifications)).
- `Engineering/Rules/`, `Engineering/Decisions/`, `Engineering/Validation/`,
  and `Engineering/Processes/` do not exist in this repository. This plan
  applies the same Engineering/SDD methodology used by TruVideo and J.Crew;
  it does not introduce a Cortex-specific variant.
- The repository's engineering rules are the Cortex style rulebook, which
  `.cursor/rules/cortex-style.mdc` and `.cursor/rules/test-coverage.mdc`
  make mandatory for every implementation
  ([Section 1.3](#13-repository-engineering-rules)).
- Existing source code is evidence of the current baseline, not behavioral or
  technical authority.

Consequences:

- This plan is **technical planning work advanced in parallel with
  specification work**. It is not final and not implementation authority for
  any behavioral scope.
- **No implementation task derived from this plan is executable today.**
  Tasks for a scope become executable only when its owning spec is at least
  `Provisional`, its requirement and Acceptance Criterion identifiers are
  traced here, and the technical decisions the scope depends on are
  approved ([Section 22](#22-implementation-sequence)).
- Explicitly scoped spikes ([Section 26.3](#263-technical-spike-candidates))
  and the compliance investigation are evidence work, not implementation. They
  may proceed once the developer approves their scope.
- The plan does not use specification lifecycle states.

Current state: technical planning is substantially complete. Implementation
authority is blocked on the owning specifications, requirement and Acceptance
Criterion traceability, and approval of the Proposed technical decisions each
step requires.

### 1.2 Classification legend

Every technical statement in this plan carries one of these classifications.

| Label | Meaning | Authority |
| --- | --- | --- |
| **Accepted** | Accepted technical direction | Explicit developer decision ([Section 21.1](#211-accepted-technical-direction)) |
| **Proposed** | Proposed technical decision | Pending developer approval ([Section 21.2](#212-proposed-technical-decisions)) |
| **Derived** | Implementation detail that follows from an Accepted or Proposed decision without introducing an independent architectural choice | Written as "Derived from TD-nnn"; inherits the status of that decision; may change in implementation review; never defines observable behavior |
| **Blocked** | Behavior that cannot be finalized until an owning spec defines it | Owning spec ([Section 2.3](#23-behavioral-dependency-registry)) |
| **Open** | Engineering question without a proposal yet, or one that needs evidence | Plan/decision process ([Section 26.2](#262-engineering-questions)) |
| **Deferred** | Non-blocking future consideration | None needed for V1 ([Section 21.3](#213-deferred-and-future-considerations)) |

`BD-n` (behavioral dependency), `EQ-n` (engineering question), and `TD-nnn`
(technical decision) are plan-local tracking labels. They are not
requirement or Acceptance Criterion identifiers and must not be cited as such.

A **Technical recommendation** inside a behavioral dependency is input for the
spec author. It has no authority and is not a plan decision.

### 1.3 Repository engineering rules

`CX-*` identifiers cite the Cortex style rulebook, the repository's canonical
engineering rules. `.cursor/rules/cortex-style.mdc` requires it for every
implementation and review. They are engineering rules, not requirement or
Acceptance Criterion identifiers.

| Source | Cited as |
| --- | --- |
| `.cursor/skills/cortext-style/references/architecture-and-api-review.md` | `CX-ARCH-003` (one source of truth), `CX-ARCH-013` (terminal operations exactly once), `CX-ARCH-030` (typed states), `CX-ARCH-031` (reject invalid transitions), `CX-ARCH-041` (no transport or storage in domain APIs), `CX-ARCH-050` (typed semantic errors per layer) |
| `.cursor/skills/cortext-style/references/cortex-typescript-overlay.md` | "Cortex TypeScript overlay" (networking, `models/`, `error/error.ts`, `resources/` layout) |
| `.cursor/rules/test-coverage.mdc` | Jest coverage policy ([Section 23](#23-testing-strategy)) |

## 2. Traceability

### 2.1 Owning specifications

| Owner | Spec owner path | Repository state | Traceability status |
| --- | --- | --- | --- |
| Cortex Platform | [spec.md](spec.md) | Not present | Pending owning specification |
| Intelligence Runtime | [Intelligence/Runtime/spec.md](Intelligence/Runtime/spec.md) | Not present | Pending owning specification |
| Business | [Business/spec.md](Business/spec.md) | Not present | Pending owning specification |
| Business Operator | [Business/Operator/spec.md](Business/Operator/spec.md) | Not present | Pending owning specification |
| Business Understanding | [Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md) | Not present | Pending owning specification |

Verified on 2026-10-04 against the working tree, every local and remote
branch of `pink-technologies/cortex`, and its pull requests. No `CTX-*`,
`AIR-*`, `BUS-*`, `BOP-*`, or `BU-*` requirement or Acceptance Criterion
identifiers exist.

### 2.2 Traceability policy

```text
Missing behavioral spec
        ↓
Plan may be explored and refined for that scope
        ↓
Plan is not final for that scope
        ↓
Implementation tasks for that scope are not executable
```

- This plan does not invent requirement or Acceptance Criterion identifiers
  and does not use placeholder identifiers.
- Each section names its owner with `Spec owner:` and
  `Traceability status: Pending owning specification`.
- When an owning spec reaches `Provisional`, its actual identifiers
  (`CTX-REQ-*`/`CTX-AC-*`, `AIR-REQ-*`/`AIR-AC-*`, `BUS-REQ-*`/`BUS-AC-*`,
  `BOP-REQ-*`/`BOP-AC-*`, `BU-REQ-*`/`BU-AC-*`, or whatever prefixes the spec
  actually defines) replace those lines, and the corresponding `BD-n`
  entries are removed.
- Technical exploration, technical proposals, and explicitly scoped spikes
  are allowed before then. Ordinary implementation that would establish
  product behavior is not.

### 2.3 Behavioral dependency registry

Each entry is a behavioral answer the plan needs and cannot decide. Where a
technical recommendation helps the spec author, it is labelled as such and has
no authority.

#### Cortex Platform — [spec.md](spec.md)

**BD-1 — Public resources, schemas, and error catalog**
Owner: Cortex Platform. Status: Needs specification.
Impact: The OpenAPI document, controllers, and contract tests cannot be
finalized. Includes resource names, request/response schemas, the Problem
Details `type` catalog, Cortex extension members, status codes for accepted
asynchronous work, whether an inbound W3C `traceparent` is honored, and the
effect of `Accept-Language`. Technical recommendations: extension members for
a machine-readable `code`, `executionId`, `traceId`, and field-level
`errors`; HTTP `202` for accepted asynchronous work; `Accept-Language`
affects only human-readable text, never machine fields.

**BD-2 — Delegated actor behavior**
Owner: Cortex Platform. Status: Needs specification.
Impact: Whether an integration may act on behalf of a user or service, how it
asserts that identity, and how location-level permissions apply. The
execution context supports both cases ([Section 9.4](#94-normalized-execution-context));
the authentication contract and grant model cannot be finalized.

**BD-3 — Execution observability and retention**
Owner: Cortex Platform. Status: Needs specification.
Impact: Which executions are queryable, which states consumers see, what
async status resources return, and how long records are retained. Includes
whether a client disconnect cancels an interactive execution and which state
an execution reaches when the deadline reaper closes it after a crash.

**BD-4 — Idempotency semantics**
Owner: Cortex Platform. Status: Needs specification.
Impact: Which operations accept idempotency keys, key scope, retention
window, the response to a reused key with a different payload, and behavior
for concurrent duplicates.

**BD-5 — Rate-limit observable policy**
Owner: Cortex Platform. Status: Needs specification.
Impact: Limit values, scope (integration, tenant, operation), response
contract, and headers. Whether V1 has any commercial quota, which remains a
separate concept from technical rate limiting.

**BD-6 — Outbound webhook semantics**
Owner: Cortex Platform. Status: Needs specification.
Impact: Event catalog, payload schemas, delivery guarantees, ordering, retry
horizon, endpoint registration, and behavior for persistently failing
endpoints.

**BD-7 — Representation conventions**
Owner: Cortex Platform. Status: Needs specification.
Impact: JSON representation of money, the public prefix registry for typed
identifiers, pagination envelope and parameters, timestamp and local-date
formats beyond the accepted ISO-8601 direction. Technical recommendations:
money as a decimal string plus ISO 4217 currency code, never a JSON number;
instants as RFC 3339 with offset; local dates as `YYYY-MM-DD` with the IANA
timezone of the owning Business or Location.

**BD-8 — Streaming event contract**
Owner: Cortex Platform (with Understanding). Status: Needs specification.
Impact: Which execution events consumers receive over SSE and their schemas.
The internal event mechanism exists from the start; its public exposure
cannot be built.

**BD-9 — Non-functional service targets**
Owner: Cortex Platform. Status: Needs specification.
Impact: Availability, latency, RPO, and RTO targets. They decide whether
production needs Multi-AZ (TD-041), how backups are tested, and alarm
thresholds.

**BD-10 — Consumer visibility of usage and cost**
Owner: Cortex Platform (with Intelligence Runtime). Status: Needs specification.
Impact: Whether consumers see provider, model, token, or cost data. Internal
cost attribution is unaffected.

#### Intelligence Runtime — [Intelligence/Runtime/spec.md](Intelligence/Runtime/spec.md)

**BD-11 — Model preference outcome**
Owner: Intelligence Runtime. Status: Needs specification.
Impact: What the caller observes when a preferred model is rejected or
replaced by policy (silent fallback, warning, or failure), whether policy
may fall back to another qualifying model during a provider outage, and
where a preference may originate (capability configuration, tenant policy,
or consumer request).

#### Business — [Business/spec.md](Business/spec.md)

**BD-12 — V1 canonical domains**
Owner: Business. Status: Needs specification.
Impact: The canonical schema, connector domain declarations, and fixtures
cannot be designed beyond their generic structure.

**BD-13 — Governed metric and dimension catalog**
Owner: Business. Status: Needs specification.
Impact: Exact metric formulas and inclusion rules (for example refunds and
voids), dimensions, and grains. Semantic tests cannot be written.

**BD-14 — Business-day boundary**
Owner: Business. Status: Needs specification.
Impact: How activity after local midnight is assigned to a business day.
Affects normalization of local dates and every period-based metric.

**BD-15 — Multi-currency behavior**
Owner: Business. Status: Needs specification.
Impact: Whether metrics can aggregate across currencies and how mixed
currency results are presented. Also informs money precision (TD-024).

**BD-16 — Import readiness**
Owner: Business. Status: Needs specification.
Impact: What "ready" means after the 3-year initial import, including when a
source cannot provide 3 years of history.

**BD-17 — Freshness and data-quality states**
Owner: Business (with Understanding). Status: Needs specification.
Impact: Freshness thresholds per domain and the definitions of insufficient,
partial, stale, conflicting, and unavailable data.

**BD-18 — Concurrent and cancelled imports**
Owner: Business. Status: Needs specification.
Impact: Whether a second import for the same business and connection is
rejected, queued, or merged, and what consumers observe after an import is
cancelled with partial data applied. Technical recommendation: keep facts
applied before cancellation, because canonical upserts are idempotent and
individually correct.

**BD-19 — Personal data in the Business model**
Owner: Business (with Understanding, subject to EQ-2). Status: Needs specification.
Impact: Which personal fields the canonical model holds and whether they may
appear in answers or model context.

#### Business Operator — [Business/Operator/spec.md](Business/Operator/spec.md)

**BD-20 — Operator capability family**
Owner: Business Operator. Status: Needs specification.
Impact: How Operator capabilities are addressed and authorized as a family,
and what Understanding inherits from Operator.

#### Business Understanding — [Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md)

**BD-21 — Response semantics**
Owner: Business Understanding. Status: Needs specification.
Impact: Final names and semantics of `answer`, `facts`, `metrics`,
`evidence`, `warnings`, `dataQuality`, and execution metadata.

**BD-22 — Representation of degraded data**
Owner: Business Understanding. Status: Needs specification.
Impact: How insufficient, partial, stale, conflicting, and unavailable data
appear in a response.

**BD-23 — Ambiguous scope**
Owner: Business Understanding. Status: Needs specification.
Impact: Whether ambiguous questions produce a clarification request or apply
a default scope.

**BD-24 — Conversation lifetime and retention**
Owner: Business Understanding. Status: Needs specification.
Impact: Session lifetime, turn limits, and retention of questions and answers.

**BD-25 — Out-of-scope questions**
Owner: Business Understanding. Status: Needs specification.
Impact: Response when a question falls outside the Business scope or the
caller's authorization.

**BD-26 — Outcome after grounding failure**
Owner: Business Understanding. Status: Needs specification.
Impact: Whether an answer that fails grounding validation produces a failure,
a degraded response, or facts without narrative.

## 3. Starting Baseline

Spec owner: none (current-state evidence).
Traceability status: Not applicable.

Baseline: `origin/main` at `1171283` (2026-10-04).

The repository is a pnpm monorepo of NestJS 11 / TypeScript applications and
framework-light packages. It implements an internal engineering-automation
system (GitHub pull-request review, Jira triage, workflow orchestration,
remote execution Nodes). None of the V1 Business or Understanding behavior
exists. The behavior of the engineering-automation system is not evidence of
Cortex V1 product behavior.

### 3.1 Reuse candidates

Existing code is evidence, not policy. Each candidate is reused only if it
satisfies the new contract cleanly; reuse itself is a **Proposed** decision
where listed.

| Asset | Location | Assessment | Status |
| --- | --- | --- | --- |
| Provider-agnostic LLM port (`LLM.complete`, `LLMRequest`, content blocks, tool definitions, stop reasons, `TokenUsage`, typed errors, abort and timeout) | `packages/llm` | Fits the accepted provider abstraction. Lacks structured output, streaming, and cached/reasoning token usage. | Proposed (TD-031) |
| OpenAI adapter | `packages/llm/src/provider/openai` | Fits as the first adapter once extended for strict structured outputs. | Proposed (TD-031) |
| Agent kernel (multi-turn tool loop, iteration and timeout budgets, cancellation, usage accumulation) | `packages/agent-runtime/src/kernel` | Fits tool calling. Needs per-turn usage reporting for cost attribution. | Proposed (TD-031) |
| Tool contract with Zod schemas, registry, executor, authorization policies applied at exposure and execution | `packages/agent-runtime/src/tools` | Fits authorization before model context. | Proposed (TD-031) |
| HTTP client with opt-in validation and retries | `packages/networking` | Fits connector and webhook outbound HTTP; already the repository networking convention. | Derived (repository rule: Cortex TypeScript overlay) |
| Prisma 7 + PostgreSQL, forward-only migrations verified from an empty database (#39) | `apps/api/src/infraestructure/database` | Fits PostgreSQL; multi-schema and partitions need raw SQL. | Proposed (TD-025) |
| Fail-closed startup configuration (#38) | `apps/api/src/configuration` | Fits as a configuration pattern. | Derived from TD-006, TD-009 |
| Job lifecycle hardening (claim token, attempts, cancellation request, terminal-exactly-once, `SELECT … FOR UPDATE`) (#34, #37) | `apps/api/src/execution`, `apps/api/src/workflow` | The patterns fit; the tables are not tenant-scoped and are tied to engineering Nodes. | Proposed (TD-027) |
| HMAC signature verification over raw body | `apps/api/src/webhooks/*/signature` | Pattern fits inbound source-event verification. | Derived from TD-013 |
| Redis storage adapter (`ioredis`) | `apps/api/src/infraestructure/storage` | Only relevant if a shared counter store is approved. | Deferred (TD-038) |

### 3.2 Not reused for V1

- **Engineering-automation flows** (`apps/node`, Jira triage, repository
  review, GitHub/Jira webhooks, `workflow_run`, `execution_job`,
  `ExecutionNode`). They stay isolated and are not exposed under `/v1`.
  Their long-term placement is EQ-5.
- **Legacy tables without tenancy** (`agent`, `skill`, `tool`, `chat`,
  `message`, `model_provider`, `datasource_*`, and related). V1 tables are
  tenant-scoped from creation.
- **The closed Cube experiment** (PR #33). It is evidence of the cost of
  coupling the agent loop to a semantic-layer vendor; no vendor is selected
  (TD-014).

### 3.3 Missing and required by V1

- Tenancy, Business, integration identity, and OAuth 2.0 authentication. An
  earlier Cognito integration (#27) is no longer on `main`; the only current
  guard is a static workflow operator token.
- Public `/v1` API, OpenAPI contract, Problem Details, pagination,
  idempotency, and rate limiting.
- Execution as a persisted first-class concept with an `executionId`.
- Canonical Business model, semantic layer, connectors, import, and sync.
- Intelligence policy, structured outputs, and cost accounting.
- AWS infrastructure, CI/CD, OpenTelemetry, and structured logging.

## 4. Architecture

Spec owner: [spec.md](spec.md) (Cortex Platform).
Traceability status: Pending owning specification.
Decisions: TD-008, TD-009, TD-010 (Accepted); TD-020, TD-035 (Proposed).

### 4.1 Shape

**Accepted** (TD-008, TD-009): a modular monolith in one TypeScript monorepo,
containerized on ECS/Fargate as a Cortex API service and worker service.

**Proposed** (TD-020): one container image with two entrypoints, so both
services load the same modules and differ only in mounted adapters (HTTP
controllers versus queue consumers).

```text
                 Consumers (J.Crew, TruVideo, third parties)
                                │ HTTPS, OAuth 2.0 client credentials
                                ▼
        HTTPS ingress (TLS; /v1/*, /hooks/*, health; ALB proposed, TD-035)
                                │
              ┌─────────────────┴──────────────────┐
              ▼                                    ▼
     cortex-api (ECS/Fargate)             cortex-worker (ECS/Fargate)
     REST /v1, inbound source events      SQS consumers: import, sync,
     interactive executions               webhook delivery, scheduled work
              │                                    │
              └──────────────┬─────────────────────┘
                             ▼
       RDS PostgreSQL · S3 · SQS (+DLQs) · Secrets Manager · KMS
                 CloudWatch / OpenTelemetry-compatible telemetry
                             │
                             ▼
              External: OpenAI API, Business source systems,
                consumer webhook endpoints, OAuth token issuer
```

The diagram contains only Accepted components plus an HTTPS ingress.
**Derived from TD-009 and TD-003**: ECS services exposed to consumers need an
HTTPS ingress that terminates TLS, routes to API tasks, and holds long-lived
SSE responses. **Proposed** (TD-035): an Application Load Balancer as the
concrete ingress. Additional components (ElastiCache, EventBridge Scheduler,
ADOT collector, WAF) are Proposed or Deferred
([Section 4.4](#44-proportionality-review)).

### 4.2 Logical modules and dependency direction

**Accepted** (TD-008): strong logical boundaries for Platform, Intelligence,
Business, Operator/Understanding, and Infrastructure; Business semantics do
not leak into Intelligence.

```text
Operator / Understanding ──► Business ──► Platform
          │                                  ▲
          └──────────► Intelligence ─────────┘
Infrastructure adapters implement ports declared by the modules above.
```

**Derived from TD-008**:

- Platform depends on nothing domain-specific.
- Intelligence depends only on Platform; it has no Business vocabulary.
- Business depends only on Platform; it does not call Intelligence.
- Operator/Understanding composes Business and Intelligence and is the only
  module that knows both.
- Infrastructure (database, queues, object storage, KMS, provider SDKs, token
  validation) sits behind ports owned by the module that needs them; domain
  APIs expose no transport or storage types (repository rule `CX-ARCH-041`,
  [Section 1.3](#13-repository-engineering-rules)).
- Cross-module calls go through each module's application services. No
  module reads another module's tables.

### 4.3 Monorepo layout

**Proposed** (TD-020):

```text
apps/
  api/                 existing; gains the public /v1 surface and inbound source events
  worker/              new; queue consumers and scheduled work
  node/                existing engineering-automation Node; unchanged
packages/
  platform/            tenancy, execution context, IDs, problems, pagination,
                       idempotency, jobs, webhooks, rate limits, telemetry
  intelligence/        Intelligence Runtime facade: model catalog, policy,
                       execution, usage and cost
  llm/                 existing provider contract and adapters
  agent-runtime/       existing kernel and tool loop
  business/            canonical model, semantic contract and engine,
                       sync orchestration, connector contract
  business-connectors/ one folder per source system
  understanding/       Operator / Understanding capability
  networking/          existing
  protocol/            existing engineering-automation wire types
infrastructure/        infrastructure as code (tool per TD-033)
openapi/v1/            canonical OpenAPI document (per TD-019)
```

Packages are plain TypeScript with ports and application services; the apps
compose them into Nest modules, matching the existing `llm` and
`agent-runtime` packages. **Derived from TD-008 and TD-020**: package
dependency declarations and an import-boundary lint rule enforce module
direction in CI.

### 4.4 Proportionality review

Every non-trivial component answers three questions: what concrete V1 problem
it solves, why the simpler mechanism is insufficient, and whether it can be
added later without architectural damage.

| Component | V1 problem | Simpler mechanism | Later without damage? | Recommendation |
| --- | --- | --- | --- | --- |
| Separate worker service | Long imports must not compete with interactive latency | Same process | Harder; queue consumers would share API capacity | Accepted (TD-009) |
| HTTPS ingress | TLS entry and routing to multi-task ECS services, long-lived SSE responses | None for multi-task ECS | — | Derived from TD-009, TD-003 |
| Application Load Balancer as the ingress | Concrete ingress with path routing, health checks, configurable idle timeout for SSE | API Gateway with a VPC link; Network Load Balancer | Replaceable; consumers see only the hostname | Proposed (TD-035) |
| AWS WAF | Edge filtering of malicious traffic | Application auth and rate limiting | Yes; no application change | Deferred: evaluated in security hardening (step 15) |
| ElastiCache | Shared rate-limit counters across API tasks | Per-task in-memory limiter behind a `RateLimiter` port | Yes, behind the port | Deferred (TD-038) |
| EventBridge Scheduler | Periodic polling and maintenance without duplicate runs | In-worker scheduler with a PostgreSQL advisory-lock leader | Yes | Proposed (TD-037) |
| ADOT collector sidecar | Export OpenTelemetry data to AWS | Direct OTLP export from the SDK | Yes | Proposed (TD-036) |
| Separate AWS account per environment | Blast-radius and permission isolation for production data | Separate VPCs and IAM boundaries in one account | Costly; moving RDS/S3 across accounts later is disruptive | Proposed (TD-034): decide before the AWS foundation |
| NAT gateway and VPC endpoints | Private tasks reaching OpenAI, sources, and AWS APIs | Tasks in public subnets with public IPs | Yes, with a network migration | Proposed (TD-035) |
| Table partitioning | 3-year fact volume | Indexed unpartitioned tables | Possible, with a migration of large tables | Open: Spike 1 decides before the pilot import |
| Daily rollups | Analytical latency | Queries on canonical facts | Yes, behind the semantic engine | Deferred: Spike 1 decides |
| Provider circuit breaker | Fast failure during provider outages | Bounded retries and timeouts | Yes, inside the Intelligence runtime | Deferred: single provider in V1 |
| Raw payload storage in S3 | Replay after mapping fixes, provenance | Store source identifiers and re-fetch | Re-fetching 3 years may be impossible or slow | Proposed (TD-028) |
| Semantic-layer vendor | Governed metrics | Cortex-owned engine | Yes, behind the semantic contract | Not selected (TD-014) |
| Analytical engine (Redshift or other) | Analytical scale | PostgreSQL | Yes, behind the semantic contract | Deferred (TD-011) |

## 5. Component Responsibilities

Spec owner: all five owning specs, per component.
Traceability status: Pending owning specification.
Decisions: TD-008 (Accepted); TD-020 (Proposed). Component boundaries follow
the Accepted module split; concrete package placement is Proposed.

| Component | Owns | Does not own |
| --- | --- | --- |
| **Platform / API adapter** (`apps/api`) | HTTP routing under `/v1`, request validation against OpenAPI, Problem Details mapping, pagination encoding, typed-ID parsing, authentication, rate limiting | Business rules, model calls |
| **Platform / Identity** | Tenant, Integration, OAuth client binding, grants, `ExecutionContext` construction | Token issuance |
| **Platform / Execution** | Execution records, lifecycle, correlation, execution event sink | What an execution does |
| **Platform / Jobs** | Durable job records, SQS dispatch, claim and lease, retry classification, backoff, cancellation requests, DLQ visibility | Job-specific logic |
| **Platform / Idempotency** | Idempotency records | Idempotency semantics (BD-4) |
| **Platform / Webhooks** | Endpoint storage, signing, delivery attempts | Event semantics (BD-6) |
| **Platform / Telemetry** | OpenTelemetry setup, structured logging, redaction | — |
| **Intelligence Runtime** | Model catalog, capability-based selection, policy, provider invocation, tool loop, structured-output validation, usage and cost records | Business semantics, tool implementations |
| **Provider adapters** | `LLMRequest` ↔ vendor API mapping, vendor error mapping, usage normalization | Model selection |
| **Business / Canonical model** | Businesses, locations, normalized facts, provenance links, field classification | Source schemas |
| **Business / Semantic layer** | Governed definitions, semantic query contract, compilation, execution, data-quality signals | Natural-language interpretation |
| **Business / Sync** | Connections, import and sync runs, checkpoints, raw landing, normalization, reconciliation, freshness | Source protocol details |
| **Business connectors** | Source authentication, fetching, source event verification, payload validation, mapping to canonical facts, declared capabilities | Scheduling, retries, persistence |
| **Understanding** | Scope resolution, Business tool exposure, grounding validation, response assembly, conversation sessions | Metric math, provider choice |
| **Worker** (`apps/worker`) | Hosting queue consumers and scheduled work | Domain logic |

## 6. State and Data Ownership

Spec owner: [spec.md](spec.md), [Business/spec.md](Business/spec.md),
[Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-011, TD-013, TD-015, TD-016 (Accepted); TD-023, TD-027,
TD-028, TD-029, TD-032 (Proposed).

Each piece of state has exactly one owning module and one source of truth
(repository rule `CX-ARCH-003`, [Section 1.3](#13-repository-engineering-rules)). Other modules access it only through the owner's application
service.

| State | Owner | Store | Status |
| --- | --- | --- | --- |
| Tenant, Business, Integration, OAuth client binding, grants | Platform | PostgreSQL | Accepted store (TD-011) |
| OAuth client secret | Token issuer | Issuer | Proposed issuer (TD-021) |
| Execution record and status | Platform | PostgreSQL | Accepted store |
| Job record and status | Platform | PostgreSQL; SQS carries job ids | Proposed (TD-027) |
| Idempotency records | Platform | PostgreSQL | Accepted store; semantics Blocked (BD-4) |
| Webhook endpoints and delivery attempts | Platform | PostgreSQL | Accepted store |
| Webhook signing secrets, connector credentials | Platform / Business | PostgreSQL ciphertext under KMS envelope encryption | Proposed (TD-029) |
| Rate-limit counters | Platform | Per-task memory in V1 | Proposed (TD-038) |
| Locations, canonical facts, provenance links | Business | PostgreSQL | Accepted store |
| Raw source payloads | Business | S3 | Proposed (TD-028) |
| Connections, sync cursors, checkpoints, freshness | Business | PostgreSQL | Accepted store |
| Metric and dimension definitions | Business | Versioned registry in source control | Proposed (TD-026) |
| Model catalog and pricing | Intelligence | Versioned configuration in source control | Proposed (TD-032) |
| Tenant model policy, provider usage and cost | Intelligence | PostgreSQL | Accepted store |
| Conversation sessions and turns | Understanding | PostgreSQL | Accepted store; retention Blocked (BD-24) |
| Platform secrets | Infrastructure | Secrets Manager | Accepted (TD-009) |

**Proposed** (TD-023): one PostgreSQL schema per owning module (`platform`,
`business`, `intelligence`, `understanding`) to make ownership visible in the
database.

Ownership rules (**Accepted**, TD-013, TD-015, TD-016):

- Model output is stored only as part of a conversation turn or execution
  result. It is never written into Business canonical state.
- External system identifiers are separate columns on facts and source
  records. They are never Cortex primary keys (TD-005).
- **Derived from TD-013 and TD-014**: any derived aggregate is rebuildable
  from canonical facts and never authoritative.

## 7. Data Flows

### 7.1 Interactive Understanding Query

Spec owner: [Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md),
[Business/spec.md](Business/spec.md), [Intelligence/Runtime/spec.md](Intelligence/Runtime/spec.md),
[spec.md](spec.md).
Traceability status: Pending owning specification.
Decisions: TD-003, TD-007, TD-014, TD-015 (Accepted); TD-021, TD-022, TD-026,
TD-042, TD-044 (Proposed). Blocked behavior: BD-1, BD-3, BD-21 to BD-26.

The flow follows the accepted pipeline: authorized question → scope
resolution → governed Business query → trusted facts, metrics, and evidence →
Intelligence reasoning → structured grounded response.

```text
Consumer ──POST question (resource: BD-1)──► API
 1. Validate access token; resolve Integration from client_id
 2. Rate limit (BD-5) → idempotency check (BD-4)
 3. Build ExecutionContext {tenant, integration, actor, business, locations,
    permissions, executionId, traceId, signal}
 4. Create execution record (running)
 5. Understanding.ask(context, question, sessionRef?)
    a. Load conversation session; prior turns are untrusted context
    b. Resolve scope {business, locations, period, timezone} (Proposed,
       TD-044); validate against ExecutionContext before any Business query
       (ambiguity: BD-23)
    c. IntelligenceRuntime.execute(task) with Business tools bound to the scope
       └─ tool loop: model ⇄ tools
            tool call → Business semantic query (governed, no SQL)
              → result {values, evidence references, quality signals}
    d. Parse and validate structured output against the task schema
    e. Grounding validation (Proposed, TD-042; failure outcome: BD-26)
    f. Assemble response from Business results + validated answer (BD-21, BD-22)
    g. Persist conversation turn (retention: BD-24)
 6. Mark execution terminal; attach usage summary
 7. Respond with the structured result or Problem Details (BD-1)
```

**Accepted** (TD-007): authorization happens before data reaches the model.
**Derived from TD-007**: it is enforced at steps 1–3, at 5b, and inside every
Business service call; the model only ever receives tool results that passed
those checks.

**Derived from TD-003 and TD-031**: cancelling an interactive execution
propagates one `AbortSignal` to the kernel, the provider call
(`LLMRequest.signal`), and in-flight database queries. **Blocked** (BD-3):
whether a client disconnect cancels the execution, and the observable state
of a cancelled execution.

### 7.2 Initial Business Import

Spec owner: [Business/spec.md](Business/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-012, TD-013 (Accepted); TD-027, TD-028 (Proposed). Blocked
behavior: BD-1, BD-3, BD-4, BD-12, BD-16, BD-18.

**Accepted** (TD-013): full 3-year historical import before Understanding
readiness, then incremental synchronization; provenance and freshness kept.

```text
Consumer ──start import (resource: BD-1; idempotency: BD-4)──► API
 1. Authorize; create execution + import run
 2. Plan chunks: declared domains (BD-12) × time windows over the 3-year horizon
 3. In the same transaction, record one job per chunk (Proposed, TD-027)
 4. Respond with execution/import identifiers (async status: BD-3)
Worker, per chunk job:
 5. Claim the job; skip if terminal or already claimed
 6. Respect per-connection concurrency and source rate limits
 7. Fetch source pages:
      a. store raw page in S3 (Proposed, TD-028)
      b. index the source record (source id, content hash, location of raw data)
      c. validate + normalize → upsert canonical facts keyed by
         (tenant, business, source_system, external_id) with provenance
      d. checkpoint the cursor
      e. check for cancellation between pages
 8. When all chunks are terminal → reconciliation
 9. Reconciliation: coverage per domain and period, conflict detection,
    freshness update → import run terminal (readiness: BD-16)
10. Notify completion or failure by webhook if the event exists (BD-6)
```

**Open** (Spike 2): chunk size and per-connection concurrency. The spike
starts from one-calendar-month windows; the value is a tunable setting, not
a commitment.

**Derived from TD-005, TD-013, and TD-028**: re-running a chunk is safe
because canonical upserts are keyed by source identity and content hash.

**Blocked** (BD-18): concurrent and cancelled imports.

### 7.3 Incremental Synchronization

Spec owner: [Business/spec.md](Business/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-013 (Accepted); TD-028, TD-037, TD-043 (Proposed). Blocked
behavior: BD-17.

**Accepted** (TD-013): source events or webhooks preferred where available;
polling where required.

```text
Source-event path
  Source ──POST /hooks/{source}/{connectionRef}──► API
   1. Verify the source signature over the raw body
   2. Persist the raw event; record a job; respond 2xx quickly
  Worker: normalize → upsert canonical facts → update freshness

Polling path
  Scheduler (Proposed, TD-037) ──► SQS poll job per connection
  Worker: fetch incremental changes from the cursor → same landing and
          normalization → advance the cursor only after the page is applied
```

**Derived from TD-001 and TD-013**:

- `/hooks/*` is internal ingress for source systems, authenticated by source
  signatures, and not part of the consumer contract.
- Replay protection for inbound events uses whatever the source supports
  (timestamp tolerance, event id de-duplication); per-source rules are
  documented with each connector.

**Proposed** (TD-043): event-capable sources are also polled at a lower
frequency as reconciliation, because source events can be lost or arrive out
of order; updates are applied by the source's modification timestamp or
version, never by arrival order. The reconciliation interval per source is a
connector setting.

### 7.4 Provider Execution

Spec owner: [Intelligence/Runtime/spec.md](Intelligence/Runtime/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-015 (Accepted); TD-031, TD-032 (Proposed). Blocked behavior:
BD-10, BD-11.

```text
IntelligenceRuntime.execute(task, context)
 1. The task declares requirements: structured-output schema, tools, minimum
    context window, modalities, data classification
 2. Model policy resolves the model (Accepted: capability/policy driven, final
    authority; preference honored only when it qualifies — outcome: BD-11)
      → decision record {requested, selected, reasons}
 3. Tool loop with the selected model; each provider call has a timeout,
    honors the AbortSignal, and retries a bounded number of times on
    retryable provider errors (Derived from TD-015)
 4. Validate the final structured output against the task schema
 5. Record usage per provider call with tenant, integration, business,
    execution, provider, model, tokens, and computed cost
 6. Return {output, tool results, usage, model decision}
```

## 8. Public API and Protocol Design

Spec owner: [spec.md](spec.md) (Cortex Platform); resource-specific behavior
by the Business and Understanding specs.
Traceability status: Pending owning specification.
Decisions: TD-001 to TD-005, TD-009, TD-012, TD-013 (Accepted); TD-019,
TD-035, TD-038 (Proposed). Blocked behavior: BD-1, BD-3 to BD-8.

### 8.1 Contract

**Accepted** (TD-001): REST over HTTPS, JSON, explicit `/v1`, OpenAPI as the
canonical HTTP contract, compatibility preserved within `/v1`, additive
evolution preferred; consumers tolerate additive response fields. GraphQL
and public gRPC are outside V1.

**Proposed** (TD-019): the OpenAPI 3.1 document is authored design-first at
`openapi/v1/openapi.yaml` and reviewed like code. **Derived from TD-019**:
TypeScript types are generated from it, requests are validated against it,
contract tests validate responses against it, and a CI step diffs it against
`main` to fail on breaking changes (for example with `oasdiff`).

### 8.2 Routing

**Derived from TD-001**: public routes are mounted at `/v1/...`; the HTTPS
ingress (ALB if TD-035 is approved) forwards only `/v1/*`, `/hooks/*`, and
the health check. The existing `/api`
prefix and engineering-automation routes are not routed publicly. Their
placement is EQ-5.

### 8.3 Conventions

| Concern | Status | Technical design |
| --- | --- | --- |
| Identifiers | Accepted (TD-005); prefix list Blocked (BD-7) | UUIDv7, optional typed prefix (`biz_…`, `tenant_…`, `exec_…` as examples) |
| Errors | Accepted (TD-002); catalog and extensions Blocked (BD-1) | RFC 9457 Problem Details as `application/problem+json` |
| Status codes | Accepted (TD-001) | Standard HTTP semantics |
| Pagination | Accepted (TD-002); envelope Blocked (BD-7) | Cursor-based; **Derived from TD-002 and TD-007**: cursors are tamper-evident so a client cannot reach rows outside its scope; the encoding is an implementation detail |
| Idempotency | Accepted (TD-012); semantics Blocked (BD-4) | Mechanism in [Section 13.5](#135-idempotency) |
| Money | Accepted: exact decimal, explicit currency (TD-013); JSON form Blocked (BD-7) | Recommendation in BD-7 |
| Time | Accepted: ISO-8601 in the API, UTC persisted instants, explicit business timezone (TD-013); exact formats Blocked (BD-7) | Recommendation in BD-7 |
| Rate limits | Accepted: rate limiting from V1 (TD-007); observable policy Blocked (BD-5) | Mechanism in TD-038 |
| Async operations | Accepted: background jobs with queryable status (TD-012); resources and status codes Blocked (BD-1, BD-3) | Recommendation in BD-1 |
| Correlation | Accepted: traceable executions (TD-009); exposure Blocked (BD-1) | **Derived from TD-009**: W3C Trace Context propagated internally across API, worker, and queues |
| Localization | Blocked (BD-1) | Recommendation in BD-1. The existing API i18n module is evidence, not policy |

### 8.4 Streaming readiness

**Accepted** (TD-003): synchronous request/response first, design compatible
with SSE, SSE as the first streaming transport, no WebSockets in V1.

**Derived from TD-003**: every execution writes progress to an
`ExecutionEventSink` ([Section 16.2](#162-execution-events)) from the start.
The synchronous adapter collects events and returns the terminal result; the
SSE adapter writes the same events as `text/event-stream` frames. SSE through
the HTTPS ingress needs an idle timeout above the longest expected gap plus
periodic heartbeats; the concrete ingress (TD-035) must support that. Which events are public is BD-8; streaming events from
executions that run in the worker is EQ-7.

### 8.5 MCP

**Accepted** (TD-004): MCP comes after REST, as another adapter over the same
Cortex capabilities. **Derived from TD-004**: it calls the same application services as
the REST controllers with the same `ExecutionContext`, authorization, rate
limiting, and telemetry, and owns no Business or Intelligence logic.

### 8.6 Swift SDK

**Accepted** (TD-018): after `/v1` stabilizes, Swift is the first official
SDK; it is a convenience layer over the public API and adds no private
routes or behavior.

## 9. Identity, Authentication and Authorization

Spec owner: [spec.md](spec.md) (Cortex Platform).
Traceability status: Pending owning specification.
Decisions: TD-005, TD-006, TD-007 (Accepted); TD-021, TD-022, TD-031 (Proposed).
Blocked behavior: BD-2, BD-5.

### 9.1 Identifiers

**Accepted** (TD-005): opaque, globally unique identifiers; UUIDv7 by default;
optional resource-type prefixes; external system identifiers stored
separately.

**Derived from TD-005**: UUIDv7 values are generated in the application (independent of
the PostgreSQL version) and stored as native `uuid`; prefixes are added at
serialization and checked at parsing, never stored. External identifiers
(`source_system`, `external_id`) are unique per tenant and business.

### 9.2 Authentication

**Accepted** (TD-006): OAuth 2.0 Client Credentials for server-to-server
integrations; API keys only as a possible limited development/sandbox
mechanism.

**Proposed** (TD-021): Amazon Cognito app clients issue client-credential
tokens, with a resource server defining Cortex scopes.

**Derived from TD-006** (independent of the issuer choice):

- The API validates JWT access tokens locally against the issuer JWKS
  (issuer, audience/client, expiry, scopes, token use), caching keys.
- `client_id` maps to a Cortex Integration record that carries tenant binding
  and grants. Cortex depends only on standard JWT validation and that mapping,
  so the issuer remains replaceable.
- If API keys are enabled, they are stored as salted hashes and a production
  configuration that enables them fails at startup (fail-closed pattern from
  #38).

### 9.3 Identity model

**Accepted** (TD-007): Tenant and Business are separate; one model serves one
or many Businesses per Tenant; integration identity is separate from
delegated user/service identity; authorization scope may include tenant,
actor, business, locations, and permissions.

```text
Tenant ──1:N── Business ──1:N── Location
   │
   └──1:N── Integration (OAuth client) ──N:M── Grant {business, locations?, permissions}
Actor = Integration service principal | delegated actor (behavior: BD-2)
```

### 9.4 Normalized execution context

**Accepted** (TD-007): a normalized internal execution context instead of
propagating partner credentials.

**Derived from TD-007** (shape) and **TD-031** (reuse of the agent kernel's
context):

```text
ExecutionContext
├── tenantId
├── integrationId
├── actor {kind: service | delegated, id}
├── businessId?          (from the route, checked against grants)
├── locationIds          (authorized set; empty set means none)
├── permissions          (ReadonlySet, compatible with AgentToolPermission)
├── executionId
├── traceId
└── signal               (AbortSignal)
```

It extends the existing `AgentExecutionContext` (`executionId`,
`permissions`, `signal`), so Business tools receive it through the kernel and
the existing tool authorization policies apply. Partner credentials and raw
tokens never enter it.

### 9.5 Authorization enforcement points

**Accepted** (TD-007): authorization before restricted Business data reaches
downstream capabilities or model context.

**Derived from TD-007** (point 3 also from TD-031):

1. Edge: route scope check and Integration → tenant binding.
2. Application services: every Platform, Business, and Understanding service
   takes `ExecutionContext` and checks business, location, and permission
   grants before reading data.
3. Tools: `AgentToolAuthorizationPolicy` applies the same check at exposure and
   at execution.

**Proposed** (TD-022): PostgreSQL Row-Level Security as a fourth,
defense-in-depth point ([Section 10.3](#103-tenant-isolation)).

## 10. Persistence and Data Architecture

Spec owner: [Business/spec.md](Business/spec.md), [spec.md](spec.md).
Traceability status: Pending owning specification.
Decisions: TD-009, TD-011, TD-013, TD-017 (Accepted); TD-022 to TD-025,
TD-028, TD-041 (Proposed). Blocked behavior: BD-9, BD-12, BD-14, BD-15.

### 10.1 Datastore

**Accepted** (TD-011, TD-009): managed RDS PostgreSQL as the initial canonical
datastore, automated backups with point-in-time recovery, encryption at rest
and in transit; Redshift is not a V1 dependency.

**Proposed** (TD-041): Multi-AZ in production, subject to BD-9 targets.

**Derived from TD-009**: TLS is enforced on database connections.

**Proposed** (part of TD-022): database roles are a migration role (DDL,
table owner), an application role (DML, subject to RLS), a read-only
semantic role (RLS, statement timeout), and a reviewed maintenance role for
platform-wide queries.

### 10.2 Modeling rules

**Accepted** (TD-013): exact decimal money with explicit currency; no
floating-point authoritative money; UTC persisted instants; business timezone
explicit.

- **Proposed** (TD-024): money stored as `numeric(19,4)` plus a `char(3)`
  currency code on the same row. Precision is revisited if BD-15 or source
  data require more scale.
- **Derived from TD-013**: instants as `timestamptz`; business-local dates as `date`
  computed with the Location's IANA timezone at normalization (business-day
  boundary: BD-14); a migration lint check rejects floating-point money
  columns.
- **Derived from TD-005, TD-007, and TD-013**: every tenant-owned table carries `tenant_id`; Business-owned
  tables also carry `business_id`; canonical facts carry `source_system`,
  `external_id`, `source_record_id`, and `source_updated_at`.
- **Open** (Spike 1): whether large fact tables need declarative partitioning,
  and at what threshold. Prisma does not model partitions, so partition DDL
  would live in raw SQL migrations.

### 10.3 Tenant isolation

**Accepted** (TD-007): tenant isolation from V1.

**Proposed** (TD-022):

- shared schema with row-level tenancy;
- repositories require a tenant scope argument and have no unscoped query
  path;
- PostgreSQL RLS policies on tenant-owned tables compare `tenant_id` to a
  transaction-scoped setting (for example `app.tenant_id` set with
  `set_config(..., true)`), applied through a database-client wrapper that
  opens each unit of work in a transaction;
- with no setting, policies return no rows (fail closed);
- the role topology in [Section 10.1](#101-datastore); platform-wide
  maintenance queries run under the reviewed maintenance role.

Alternatives in TD-022. Prisma compatibility and performance of the
transaction-scoped setting are evidence for Spike 4.

### 10.4 Migrations

**Accepted** (TD-017): backward-compatible migrations where possible, expand →
deploy → contract, rollback support.

**Proposed** (TD-025): Prisma Migrate remains the migration tool, with
multi-schema support and raw SQL where Prisma cannot express the DDL.

**Derived from TD-017 and TD-025** (roles per TD-022): migrations run as a
one-off task with the migration role before the rolling deploy; the application role cannot run DDL; every migration is
tested from an empty database and from the previous release's schema with
representative data (extends the #39 test).

### 10.5 Raw data landing

**Accepted** (TD-012): S3 for suitable raw/import artifacts.

**Proposed** (TD-028): every fetched source payload is stored immutably in S3
before normalization, indexed by a source-record table.

**Derived from TD-028**: SSE-KMS, Block Public Access, versioning;
content-addressed object names
(`tenant=<id>/source=<system>/domain=<d>/date=<yyyy-mm-dd>/<hash>.json.gz`) so
re-landing is idempotent.

**Open** (EQ-3): raw-data retention period and lifecycle.

### 10.6 Analytical evolution

**Accepted** (TD-011, TD-014): an analytical engine can be introduced later
with minimal impact. **Derived from TD-014**: Understanding depends only on the semantic
contract, so moving a metric's backing store is a semantic-engine change.
Spike 1 provides the evidence for whether and when that is needed.

## 11. Business Semantic Layer

Spec owner: [Business/spec.md](Business/spec.md); consumed by
[Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-014 (Accepted); TD-026 (Proposed). Blocked behavior: BD-13,
BD-15, BD-17.

### 11.1 Separation of responsibilities

**Accepted** (TD-014):

```text
Canonical model   what Business facts exist
Semantic layer    what they mean and how governed metrics are calculated
```

### 11.2 Contract

**Accepted** (TD-014): Business owns a vendor-neutral semantic abstraction;
Understanding depends on it and not on PostgreSQL SQL, Cube, dbt, MetricFlow,
Redshift, or another engine; definitions are deterministic and governed; the
model gets no unrestricted SQL or database access.

**Derived from TD-014** (contract shape):

```text
SemanticCatalog
  listMetrics(context)     → MetricDefinition[]
  listDimensions(context)  → DimensionDefinition[]
SemanticQueryService
  query(context, SemanticQuery) → SemanticResult
SemanticQuery  {metrics[], dimensions[], filters[], period, timeGrain?,
                comparison?, limit?}
SemanticResult {rows, metricVersions, evidenceRefs, quality, executedAt}
```

- A `SemanticQuery` references metric and dimension identifiers only; it
  cannot express SQL, table names, or arbitrary expressions.
- Filters are typed predicates over declared dimensions.
- The location filter is always intersected with the authorized location set
  from `ExecutionContext` (also TD-007). How a question that names an
  unauthorized location is answered is BD-25.

### 11.3 Definitions

**Proposed** (TD-026): metric and dimension definitions are TypeScript objects
in a versioned registry reviewed through pull requests; a change in meaning
produces a new definition version; results report the version used.

**Blocked** (BD-13): which metrics exist and their exact formulas.

### 11.4 Implementation

**Accepted** (TD-014): no semantic-layer vendor is selected; the
implementation is replaceable behind the Business contract.

**Proposed** (TD-026): a Cortex-owned engine compiles a `SemanticQuery` into
parameterized PostgreSQL SQL from definition templates, behind a
`SemanticEngine` port.

**Derived from TD-026** (role per TD-022): values are always bound
parameters; identifiers come only from the registry; execution uses the
read-only semantic role with RLS, a statement timeout, and a row limit.

**Deferred**: daily rollups, routed by the engine when grain and dimensions
allow. Spike 1 decides whether they are needed.

### 11.5 Model access

**Accepted** (TD-014): no SQL or table names reach the model. **Derived from TD-014**: the
model receives semantic tools ([Section 15.3](#153-business-tools)) whose
inputs are `SemanticQuery`-shaped and validated before compilation.

## 12. Connector Architecture

Spec owner: [Business/spec.md](Business/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-012, TD-013 (Accepted); TD-029 (Proposed). Blocked behavior:
BD-12, BD-17.

### 12.1 Shared contract

**Accepted** (TD-012, TD-013): a shared connector contract with source-specific
synchronization strategies; connectors declare supported domains and
capabilities; connector schemas never become the canonical model.

**Derived from TD-012 and TD-013** (contract shape):

```text
BusinessConnector
├── descriptor
│   ├── sourceSystem
│   ├── domains                       (from BD-12)
│   ├── capabilities                  {sourceEvents, incrementalCursor,
│   │                                  historicalDepth, rateLimits}
│   └── credentialSchema
├── verifyCredentials(credentials, signal)
├── fetchHistorical(domain, window, cursor, signal) → Page<SourcePayload>
├── fetchIncremental(domain, cursor, signal)        → Page<SourcePayload>
├── verifySourceEvent(rawBody, headers)             (when sourceEvents)
├── parseSourceEvent(rawBody)                       → SourcePayload[]
└── normalize(domain, SourcePayload)                → CanonicalFactDraft[] | QuarantineReason
```

**Derived from TD-012 and TD-013**:

- Connectors are pure source adapters: no scheduling, retries, persistence,
  or database access.
- Each connector lives in its own folder with a connection-bound client over
  `@cortex/networking` and `resources/` split by source API path (repository
  rule: Cortex TypeScript overlay, [Section 1.3](#13-repository-engineering-rules)).
- Source payloads are validated with schemas that tolerate unknown fields; a
  payload missing a required field is quarantined with a reason and counted
  in data quality (states: BD-17).

### 12.2 Credentials

**Accepted** (TD-009): Secrets Manager/KMS direction; no plaintext secrets in
configuration or database fields.

**Proposed** (TD-029): connector credentials are KMS envelope-encrypted per
connection and stored as ciphertext in PostgreSQL; only the worker task role
can decrypt.

**Derived from TD-029**: plaintext exists only in worker memory for the duration of a job
and never in logs, job payloads, or queue messages.

### 12.3 First production connector

**Open** (EQ-1): the source system is not decided. The contract does not
depend on it.

## 13. Background Jobs and Synchronization

Spec owner: [spec.md](spec.md) (async behavior), [Business/spec.md](Business/spec.md)
(import and sync).
Traceability status: Pending owning specification.
Decisions: TD-011, TD-012 (Accepted); TD-027, TD-029, TD-030, TD-037
(Proposed). Blocked behavior: BD-3, BD-4, BD-6, BD-18.

**Accepted** (TD-012): SQS for durable background work, with durable job
status, idempotency, retry classification, exponential backoff with jitter,
dead-letter and failure visibility, cancellation where technically safe,
execution correlation, idempotent mutating and start-operation requests, and
signed outbound webhooks for async completion and failure.

### 13.1 Job model

**Proposed** (TD-027): a tenant-scoped PostgreSQL job table is the source of
truth for job state (id, tenant, execution, kind, payload version, payload,
status, attempts, maximum attempts, available-at, claim token, lease expiry,
cancellation requested at, result, failure classification, timestamps).

**Derived from TD-027**: transitions are explicit and validated (repository
rules `CX-ARCH-030` and `CX-ARCH-031`); terminal states are written exactly
once with a conditional update on the claim token (repository rule
`CX-ARCH-013`), reusing the patterns hardened in `execution_job`
([Section 1.3](#13-repository-engineering-rules)).

### 13.2 Dispatch

**Proposed** (TD-027): a transactional outbox writes job dispatch messages in
the same transaction as the job; a relay publishes job ids to SQS.

**Derived from TD-012 and TD-027**:

- SQS standard queues per workload with DLQs and a redrive limit (the job
  store, not the queue, de-duplicates).
- Messages carry `{jobId, tenantId, traceparent}`; consumers load and claim
  the job, and duplicates find it claimed or terminal and acknowledge.
- Long chunks extend message visibility and the job lease with a heartbeat.

### 13.3 Retry classification

**Derived from TD-012** (retry classification and backoff). Attempt limits
and backoff bounds are per-workload settings:

| Class | Examples | Handling |
| --- | --- | --- |
| Transient | network errors, timeouts, source 429/5xx, database failover | Retry with exponential backoff and full jitter, honoring `Retry-After` |
| Throttled | source rate limit reached | Reschedule after the window without consuming an attempt |
| Permanent | revoked credentials, source 4xx validation, mapping defect | Fail the job, record connection health, no retry |
| Unknown | unclassified exception | Retry up to the attempt limit, then fail and surface via DLQ alarms |

Connectors and adapters map errors into these classes with typed errors and
`cause` (repository rule `CX-ARCH-050`, [Section 1.3](#13-repository-engineering-rules)).

### 13.4 Cancellation

**Derived from TD-012 and TD-027**: a cancel request sets a cancellation
timestamp; workers check it between pages and before committing a page and
stop at the last durable checkpoint. Interactive executions cancel through
`AbortSignal` ([Section 7.1](#71-interactive-understanding-query)).

**Blocked** (BD-18): whether facts applied before cancellation remain
visible, and what consumers observe.

### 13.5 Idempotency

**Accepted** (TD-012): mutating and start-operation requests support
idempotency.

**Derived from TD-011 and TD-012** (mechanism): a PostgreSQL idempotency
record keyed by the scope BD-4 defines, with a request fingerprint (method,
route, body hash), processing status, the stored outcome, and expiry. The
record supports whichever replay and conflict behavior BD-4 specifies.

**Blocked** (BD-4): key scope, retention, reused-key-with-different-payload
response, and concurrent duplicate behavior. Technical recommendation for the
key scope: tenant, integration, and key. **Blocked** (BD-18): whether a
natural key (one active import per business and connection) rejects
duplicates.

### 13.6 Outbound webhooks

**Accepted** (TD-012): outbound webhooks for relevant async completion and
failure events, with signing and replay protection.

**Proposed** (TD-030): the Standard Webhooks format (`webhook-id`,
`webhook-timestamp`, `webhook-signature` with HMAC-SHA256 over
`id.timestamp.body`).

**Derived from TD-012, TD-027, TD-029, and TD-030**:

- events are recorded in the same transaction as the state change that causes
  them (outbox, TD-027);
- signing secrets follow TD-029 and support rotation through the multiple
  signatures Standard Webhooks allows;
- deliveries retry with exponential backoff and jitter, and each attempt is
  recorded;
- outbound requests are checked against private and link-local address ranges
  (SSRF protection).

**Blocked** (BD-6): event catalog, payloads, delivery guarantees, retry
horizon, and failing-endpoint behavior.

### 13.7 Scheduled work

**Proposed** (TD-037): EventBridge Scheduler sends messages for polling,
stale-execution reaping, expired idempotency cleanup, and outbox lag checks.

**Derived from TD-037**: no in-process `setInterval` schedulers.

## 14. Intelligence and Provider Integration

Spec owner: [Intelligence/Runtime/spec.md](Intelligence/Runtime/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-015 (Accepted); TD-031, TD-032 (Proposed). Blocked behavior:
BD-10, BD-11, BD-19.

**Accepted** (TD-015): OpenAI is the first provider behind the Intelligence
provider abstraction; Business and Understanding do not depend on OpenAI
APIs; selection is capability/policy driven with final authority in
Intelligence; a preference or override may be supplied; structured outputs for
machine-consumed results; tool calling; replaceable adapters; observable
usage and cost; model output never becomes canonical Business truth.

### 14.1 Runtime facade

**Derived from TD-015**:

```text
IntelligenceRuntime.execute(task: IntelligenceTask, context: ExecutionContext)
IntelligenceTask
├── instructions            (supplied by the capability)
├── messages
├── tools                   (AgentTool[] supplied by the capability)
├── outputSchema            (required for machine-consumed output)
├── requirements            {structuredOutput, tools, minContextTokens,
│                            modalities, dataClassification}
└── preferredModel?         (outcome when rejected: BD-11)
```

Business and Understanding import only this facade and the tool contract.

### 14.2 Model catalog and policy

**Proposed** (TD-032): the model catalog (provider, model id, capabilities,
data-use posture, allowed regions, availability, price per token class with a
price version) is versioned configuration in source control; tenant policy
lives in PostgreSQL.

**Derived from TD-015 and TD-032**: policy filters the catalog by task requirements, tenant policy,
privacy classification, and availability; a preferred model is used only if it
passes every filter; every decision is recorded with reasons.

### 14.3 Changes to existing packages

**Proposed** (TD-031): build the runtime on the existing `@cortex/llm` and
`@cortex/agent-runtime` packages, with these extensions:

- `@cortex/llm`: structured-output support on `LLMRequest` (JSON Schema from
  Zod, strict mode where supported); cached-input and reasoning tokens on
  `TokenUsage` when reported; a streaming method for SSE.
- OpenAI adapter: strict JSON Schema outputs, function tools, typed
  retryable/non-retryable errors, provider request id for support correlation.
  The OpenAI API surface it uses is an adapter detail.
- `@cortex/agent-runtime`: per-turn usage reporting so cost is recorded per
  provider call; the selected model comes from policy.

### 14.4 Provider resilience

**Derived from TD-015**: per-call timeout and bounded retries with backoff
for retryable provider errors (completions are side-effect free). Timeout and
retry values are runtime settings. Falling back to another model during an
outage is BD-11.

**Deferred**: a per-model circuit breaker. With one provider in V1 it adds
little; it can be added inside the runtime later.

### 14.5 Data handling

**Accepted** (TD-007, TD-015): sensitive payloads, prompts, and Business
data are not indiscriminately logged; PII/sensitive-data classification and
minimization; production provider configuration satisfies the required
data-use policy (terms: EQ-2).

**Derived from TD-007**:

- Only tool results and the minimum context needed for the task are sent to
  the provider.
- Canonical fields carry a classification; fields classified as personal are
  excluded from model context by default (what may appear: BD-19).
- Prompts, completions, and tool payloads are not logged in production;
  usage, model, latency, and outcome are.

**Open** (EQ-2): the data-use and retention terms the production OpenAI
configuration must satisfy.

## 15. Understanding Execution

Spec owner: [Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md),
[Business/Operator/spec.md](Business/Operator/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-007, TD-014, TD-015 (Accepted); TD-031, TD-042, TD-044
(Proposed). Blocked behavior: BD-20 to BD-26.

### 15.1 Pipeline

**Accepted** (TD-014):

```text
Authorized question
  → scope resolution
  → Business capability / semantic query
  → trusted facts + metrics + evidence
  → Intelligence reasoning
  → structured grounded response
```

Missing evidence is never fabricated (TD-014); how degraded data is
represented is BD-22.

### 15.2 Scope resolution

**Proposed** (TD-044):

- Deterministic first: business from the route and grants, authorized
  locations from the context, timezone from the Business or Locations.
- Relative time phrases and location references are interpreted by a
  structured-output Intelligence task constrained to the authorized locations
  and a typed period schema.

**Derived from TD-007**: the resolved scope is validated against
`ExecutionContext` before any Business query.

**Blocked** (BD-23): behavior for ambiguous scope.

### 15.3 Business tools

**Derived from TD-014 and TD-031**: Understanding registers a small set of read-only `AgentTool`s
backed by Business services, for example:

- `business.semantic.query` — runs a `SemanticQuery`;
- `business.catalog.describe` — metrics and dimensions available for the scope;
- `business.locations.list` — authorized locations and attributes;
- `business.dataQuality.get` — freshness and coverage for the scope.

Each tool declares required permissions, validates input, and returns results
with reference ids scoped to the execution. Tool names are internal; they are
not consumer-visible unless a spec later exposes them (for example through
MCP).

### 15.4 Grounding

**Proposed** (TD-042):

- the model's structured output must cite result reference ids for every fact
  and metric it states;
- a grounding validator rejects citations not produced by a tool call in the
  current execution, and numeric values that do not match the cited result;
- on a validation failure the runtime retries the reasoning step a bounded
  number of times with the validation errors as feedback (initially once,
  tunable after Spike 3).

**Blocked** (BD-26): the outcome when grounding still fails.

### 15.5 Response assembly

**Derived from TD-014 and TD-015**: the response is assembled in code, not by the model. Facts,
metrics, evidence, and data quality come from validated Business results;
warnings combine Business quality signals and policy notices; the answer text
is the model's output after grounding validation; execution metadata comes
from Platform and Intelligence records.

**Blocked** (BD-21, BD-22): field names and semantics.

## 16. Conversation and Execution State

Spec owner: [Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md)
(conversation), [spec.md](spec.md) (execution).
Traceability status: Pending owning specification.
Decisions: TD-003, TD-016 (Accepted). Open: EQ-7. Blocked behavior: BD-3,
BD-8, BD-24.

### 16.1 Conversation

**Accepted** (TD-016): session-scoped conversation state; no cross-session
persistent memory in V1; shared memory may be added later; earlier model
output stays untrusted with respect to Business facts.

**Derived from TD-016**:

- Session and turn records (tenant, business, integration, actor, timestamps;
  question, resolved scope, structured response, execution id, references to
  the Business results used).
- Prior turns are supplied to the model as untrusted conversational context.
  Facts and metrics from earlier turns are re-queried when the current turn
  depends on them.
- No memory port is created in V1. The session store is the extension point;
  shared memory can be introduced later behind the Intelligence facade.

**Blocked** (BD-24): lifetime, turn limits, and retention.

### 16.2 Execution events

**Accepted** (TD-003): execution is a first-class concept with an
`executionId`.

**Derived from TD-003**:

- Execution records store kind, status, timings, tenant, integration,
  business, trace id, failure summary, and usage summary.
- Executions publish typed internal events (for example started, scope
  resolved, tool called, tool completed, answer delta, terminal) to an
  in-process `ExecutionEventSink`. The synchronous adapter buffers them; the
  SSE adapter streams them from the API task that runs the execution.
- A maintenance job closes executions that exceeded their deadline without a
  terminal state (for example after an API task crash).

**Open** (EQ-7): a cross-process event transport, needed only if BD-8
requires streaming events from executions that run in the worker.

**Blocked**: which states consumers observe, including the state a reaped
execution reaches, and retention (BD-3); which events are streamed (BD-8).

## 17. Evidence and Data Quality

Spec owner: [Business/spec.md](Business/spec.md),
[Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-013, TD-014 (Accepted); TD-028 (Proposed). Blocked behavior:
BD-16, BD-17, BD-22.

**Accepted** (TD-013, TD-014): provenance and freshness are retained;
metrics are deterministic; the model is not an authoritative calculator.

**Derived from TD-013 and TD-014**: data quality is computed
deterministically by Business from these technical sources (state
definitions: BD-17):

| Signal | Technical source |
| --- | --- |
| Coverage | Imported periods per domain compared with the requested period |
| Freshness | Last successful sync or event per connection and domain |
| Completeness | Quarantined payloads and normalization failures per domain and period |
| Conflicts | Reconciliation results (source totals that disagree with summed facts; duplicate external ids with diverging content) |
| Availability | Connector domain declarations and connection health |

**Derived from TD-013, TD-026, and TD-028**: evidence references point from a metric result to the
definition version, the period and filters used, the contributing
connections, the sync state at query time, and, where requested, source record
ids and raw payload locations (TD-028).

**Blocked**: thresholds and state definitions (BD-17); consumer-visible
representation (BD-22); readiness (BD-16).

## 18. Observability and Cost Attribution

Spec owner: [spec.md](spec.md), [Intelligence/Runtime/spec.md](Intelligence/Runtime/spec.md).
Traceability status: Pending owning specification.
Decisions: TD-009, TD-015 (Accepted); TD-036 (Proposed). Blocked behavior:
BD-9, BD-10.

**Accepted** (TD-009, TD-015): an execution is traceable
from API through Understanding, Business, tool or semantic query,
Intelligence, and provider; OpenTelemetry-compatible instrumentation; captured
signals include latency, error rate, execution status, provider/model, token
usage, AI cost, tool usage, connector health, sync latency, and data
freshness; provider cost attributable by tenant, integration, and business
where allowed.

### 18.1 Tracing

**Proposed** (TD-036): OpenTelemetry Node SDK exporting OTLP to an AWS Distro
for OpenTelemetry collector sidecar, then to X-Ray and CloudWatch.

**Derived from TD-009** (independent of the export topology):

- One trace spans the execution:
  `api.request → understanding.execute → understanding.scope →
  business.semantic.query → db.query → intelligence.execute →
  provider.call → tool.execute`.
- Provider spans use OpenTelemetry GenAI semantic conventions without prompt
  or completion content.
- Trace context crosses SQS through a `traceparent` message attribute.

### 18.2 Logging

**Derived from TD-007 and TD-009**: structured JSON logs (for example `nestjs-pino`) with `traceId`,
`executionId`, `tenantId`, `integrationId`, and `jobId`; redaction of
authorization headers, credentials, secrets, and request/response bodies by
default; Business records and prompts are never logged.

### 18.3 Metrics and alarms

**Derived from TD-009**:

| Area | Metrics |
| --- | --- |
| API | latency percentiles, error rate by status class, rate-limit rejections |
| Executions | status counts, duration, grounding failure rate |
| Intelligence | provider latency and errors, tokens, cost, model decisions |
| Tools | call count, latency, failures per tool |
| Jobs | queue depth, oldest message age, DLQ depth, retries, duration |
| Connectors | connection health, source error rate, throttling |
| Sync | source change → canonical latency, freshness per domain |
| Database | CPU, connections, slow queries, failover events |

Alarm thresholds depend on BD-9.

### 18.4 Cost attribution

**Derived from TD-015 and TD-032**: every provider call records tenant, integration, business,
execution, provider, model, token counts by class, price version, and
computed cost as `numeric`. Consumer visibility is BD-10.

## 19. Security

Spec owner: [spec.md](spec.md) (Cortex Platform).
Traceability status: Pending owning specification.
Decisions: TD-007, TD-009, TD-012, TD-013 (Accepted); TD-021, TD-022,
TD-029, TD-034, TD-035, TD-038, TD-040 (Proposed). Blocked behavior:
BD-5, BD-19.

**Accepted** (TD-007, TD-009): tenant isolation from V1; authorization
before retrieval and model context; encryption in transit and at rest;
managed secrets; PII/sensitive-data classification; data minimization and
redaction; no secrets or unrestricted Business records in logs; rate limiting
from V1; technical rate limiting and commercial quotas are separate concepts.

| Concern | Status | Design |
| --- | --- | --- |
| Tenant isolation | Accepted + Proposed (TD-022) | Enforcement points in Section 9.5; RLS backstop proposed; cross-tenant tests for every operation |
| Authorization before model context | Accepted (TD-007) | Tools-only context path |
| Encryption in transit | Accepted (TD-009) | **Derived from TD-009**: TLS terminated at the HTTPS ingress, TLS to RDS, HTTPS to external services |
| Encryption at rest | Accepted (TD-009) | **Derived from TD-009**: KMS keys for RDS, S3, SQS; per-tenant secrets per TD-029 |
| Secrets | Accepted (TD-009) | **Derived from TD-009**: Secrets Manager values injected as ECS secrets, never plain environment values or plaintext columns |
| Network | Proposed (TD-035) | ALB as the HTTPS ingress in public subnets, private subnets for tasks, isolated subnets for data stores, NAT egress, VPC endpoints |
| Edge filtering | Deferred | Not a V1 dependency. Step 15 evaluates whether the threat model justifies AWS WAF or similar; if so, a new Proposed decision is recorded then |
| Rate limiting | Accepted; mechanism Proposed (TD-038); policy Blocked (BD-5) | Token bucket behind a `RateLimiter` port; limit scope (integration, tenant, operation) is BD-5 |
| Classification and minimization | Accepted; personal-data scope Blocked (BD-19) | Field classification; personal fields excluded from model context and logs by default |
| Inbound source events | Derived from TD-013 | Signature verification over raw bytes; replay protection per source capability |
| Outbound requests | Derived from TD-012 | SSRF protection for webhook targets |
| Least privilege | Derived from TD-009, TD-029 | Separate task roles; only the worker decrypts connector credentials |
| Environment isolation | Accepted: dev/staging/prod separation; Proposed: account topology (TD-034) | — |
| Audit | Derived from TD-007, TD-009 | Cloud audit trail in every environment; administrative changes to tenants, integrations, and connections recorded internally (any consumer-visible audit resource would be BD-1) |
| Supply chain | Derived from TD-040 | Lockfile-pinned dependencies, dependency and image scanning in CI, minimal base images |

## 20. Failure and Recovery Strategy

Spec owner: [spec.md](spec.md); consumer-visible outcomes per owning spec.
Traceability status: Pending owning specification.
Decisions: TD-003, TD-009, TD-011 to TD-013, TD-015, TD-017 (Accepted);
TD-027, TD-028, TD-031, TD-033, TD-041, TD-042 (Proposed). Blocked behavior:
BD-3, BD-6, BD-9, BD-11, BD-26.

Each recovery mechanism below is **Derived** from the decisions named in its
row and inherits their status. Consumer-visible outcomes are owned by the
referenced dependencies.

| Failure | Detection | Recovery |
| --- | --- | --- |
| Provider outage or throttling | typed provider errors (TD-015) | bounded retries; fallback to another qualifying model only if BD-11 allows it; otherwise the execution ends unsuccessfully (outcome: BD-3) |
| Grounding failure | grounding validator (TD-042) | bounded corrective retry, then the BD-26 outcome |
| Client disconnect | aborted request signal (TD-003, TD-031) | if the execution is cancelled, provider and database work stop (whether a disconnect cancels: BD-3) |
| API task crash mid-execution | execution deadline reaper (TD-003) | execution closed; resulting state BD-3 |
| Worker crash mid-chunk | message visibility timeout, job lease expiry (TD-027) | redelivery; resume from the last checkpoint |
| Duplicate message delivery | claim token and terminal check (TD-027) | acknowledged without side effects |
| Poison message | redrive limit (TD-012) | moved to DLQ; alarm; replay after fix |
| Source credentials revoked | permanent error class (TD-012) | job failed; connection health degraded; webhook if defined (BD-6) |
| Source schema drift | payload validation (TD-013) | payload quarantined; data-quality signal; raw payload kept (TD-028) |
| Mapping defect | tests, reconciliation (TD-013) | fix, then replay normalization from raw data (TD-028) |
| Database instance failure | Multi-AZ failover (TD-041) or restore (TD-011) | connection retry with backoff; transient job errors retried |
| Bad migration or data corruption | monitoring, checks | point-in-time recovery (TD-009); expand/contract keeps the previous application compatible (TD-017) |
| Dispatch relay stopped | lag alarm (TD-027) | relay restarts and publishes unsent records |
| Region-level outage | — | not covered in V1; backups and infrastructure as code (TD-009, TD-033) allow rebuilding elsewhere (targets: BD-9) |

## 21. Technical Decisions

Authority values:

- **Explicit developer decision** — stated by the developer in the Cortex V1
  planning briefs for this work item (2026-10-04). Source is cited as
  "alignment brief §5" or "first-pass brief" (the latter covers decisions the
  developer listed in the first planning brief but not repeated in §5 of the
  alignment brief).
- **Pending developer approval** — introduced by the planning pass; not
  approved.

No `Engineering/Rules/` document or ADR exists in this repository yet. The
repository engineering rules in [Section 1.3](#13-repository-engineering-rules)
constrain how decisions are implemented; they do not approve any decision
below. Recording Accepted directions as ADRs under `Engineering/Decisions/`
is a non-blocking follow-up.

Some Accepted entries also record first-pass brief items that earlier
revisions of this plan cited inline without a TD (execution identity in
TD-003; HTTP idempotency and outbound webhooks in TD-012; the Understanding
pipeline in TD-014; end-to-end traceability and signals in TD-009). This
records existing direction under one label and does not change its scope or
authority.

### 21.1 Accepted technical direction

#### TD-001 — REST/JSON over HTTPS with OpenAPI as the canonical contract

Status: Accepted

Decision: API-first; REST over HTTPS; JSON; explicit `/v1`; OpenAPI is the
canonical HTTP contract; compatibility preserved within `/v1`; additive
evolution preferred; GraphQL and public gRPC outside V1.

Rationale: Widest third-party compatibility and a reviewable contract.

Alternatives considered: GraphQL; public gRPC.

Authority: Explicit developer decision (alignment brief §5, Platform/API).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-002 — Problem Details and cursor pagination

Status: Accepted

Decision: RFC 9457 Problem Details for HTTP errors; cursor pagination where
appropriate.

Rationale: Standard machine-readable errors; stable pagination under
concurrent writes.

Alternatives considered: Custom error bodies; offset pagination.

Authority: Explicit developer decision (alignment brief §5, Platform/API).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-003 — First-class executions; synchronous first, SSE-ready, no WebSockets

Status: Accepted

Decision: Execution is a first-class concept with an `executionId`;
synchronous request/response initially; design immediately compatible with
SSE; SSE is the first streaming transport; WebSockets not required in V1.

Rationale: Server-to-client streaming is the only known need; one execution
identity correlates API, jobs, telemetry, and cost.

Alternatives considered: WebSockets; long polling.

Authority: Explicit developer decision (alignment brief §5, Platform/API;
first-pass brief, Execution).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-004 — REST before MCP; MCP as an adapter

Status: Accepted

Decision: MCP comes after REST, as another adapter over the same Cortex
capabilities.

Rationale: One implementation of Business and Intelligence behavior.

Alternatives considered: A parallel MCP implementation.

Authority: Explicit developer decision (alignment brief §5, Platform/API).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-005 — Opaque UUIDv7 identifiers

Status: Accepted

Decision: Opaque globally unique identifiers; UUIDv7 by default; optional
resource-type public prefixes; external system IDs stored separately.

Rationale: Time-ordered index locality; no structure leaked to consumers.

Alternatives considered: UUIDv4; sequential integers.

Authority: Explicit developer decision (alignment brief §5, Identity).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-006 — OAuth 2.0 Client Credentials

Status: Accepted

Decision: OAuth 2.0 Client Credentials for server-to-server integrations; API
keys only as a possible limited development/sandbox mechanism.

Rationale: Standard server-to-server flow with scoped, rotatable credentials.

Alternatives considered: API keys in production.

Authority: Explicit developer decision (alignment brief §5,
Authentication/authorization).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-007 — Identity, tenancy, and authorization model

Status: Accepted

Decision: Integration identity separate from delegated user/service identity;
Tenant and Business separate; one model for one or many Businesses per Tenant;
authorization scope may include tenant, actor, business, locations, and
permissions; authorization before restricted Business data reaches model
context; normalized internal execution context; tenant isolation, rate
limiting, PII classification, minimization, and log hygiene from V1 (the last
group from the first-pass brief).

Rationale: One representation of who is calling and what they may see,
enforced before data or model context.

Alternatives considered: Propagating partner tokens or raw claims.

Authority: Explicit developer decision (alignment brief §5;
first-pass brief, Security).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-008 — TypeScript monorepo modular monolith

Status: Accepted

Decision: TypeScript/Node.js; one primary backend language; monorepo; modular
monolith with strong logical boundaries (Platform, Intelligence, Business,
Operator/Understanding, Infrastructure); no microservices without a scaling,
security, failure-isolation, or deployment reason.

Rationale: Existing codebase and team; module separation without
distributed-system cost.

Alternatives considered: Microservices per module; a second language for
AI/data work.

Authority: Explicit developer decision (alignment brief §5, Backend).

Requirement linkage: none (technical).

#### TD-009 — AWS, containers, ECS/Fargate

Status: Accepted

Decision: AWS; containers; ECS/Fargate running the Cortex API and workers;
Secrets Manager/KMS direction; dev/staging/prod separation; backups and PITR;
encryption in transit and at rest; CloudWatch/OpenTelemetry-compatible
observability, with each execution traceable from API through Understanding,
Business, tool or semantic query, Intelligence, and provider, and the signal
list in [Section 18](#18-observability-and-cost-attribution) captured (the
observability items and the API/worker split from the first-pass brief).

Rationale: Managed services keep V1 operations small.

Alternatives considered: Other clouds; Kubernetes.

Authority: Explicit developer decision (alignment brief §5,
Cloud/persistence; first-pass brief, AWS and Observability).

Requirement linkage: none (technical).

#### TD-010 — No Kubernetes in V1

Status: Accepted

Decision: No EKS or Kubernetes unless a concrete requirement appears.

Rationale: Two services do not justify cluster operations.

Alternatives considered: EKS.

Authority: Explicit developer decision (alignment brief §5,
Cloud/persistence).

Requirement linkage: none (technical).

#### TD-011 — PostgreSQL as the initial canonical datastore

Status: Accepted

Decision: PostgreSQL (managed RDS) is the initial canonical datastore;
Redshift is not a V1 dependency; an analytical engine can be introduced later
with minimal impact.

Rationale: Already in use; strong consistency and exact numerics.

Alternatives considered: Redshift from day one.

Authority: Explicit developer decision (alignment brief §5,
Cloud/persistence; first-pass brief for RDS).

Requirement linkage: [Business/spec.md](Business/spec.md) — Pending owning
specification.

#### TD-012 — S3 artifacts, SQS durable background work, idempotency, and outbound webhooks

Status: Accepted

Decision: S3 for suitable raw/import artifacts; SQS for durable background
work with durable job status, async status queries, idempotency, retry
classification, exponential backoff with jitter, dead-letter visibility,
cancellation where safe, and execution correlation (the mechanism list from
the first-pass brief); mutating and start-operation requests support
idempotency; outbound webhooks may notify async completion and failure and
use signing and replay protection (first-pass brief, Execution).

Rationale: Managed durable delivery and storage for imports and sync; safe
client retries; push notification of long-running outcomes.

Alternatives considered: Database polling only.

Authority: Explicit developer decision (alignment brief §5,
Cloud/persistence; first-pass brief, Jobs/Connectors and Execution).

Requirement linkage: [spec.md](spec.md), [Business/spec.md](Business/spec.md)
— Pending owning specification.

#### TD-013 — Business data foundations

Status: Accepted

Decision: Connector-agnostic canonical Business model; exact decimal money;
explicit currency; no floating-point authoritative money; full historical
import first with a 3-year target; incremental sync afterward; events
preferred, polling fallback; provenance and freshness retained; ISO-8601 in
the API and UTC persisted instants with explicit business timezone
(first-pass brief); shared connector contract with declared domains and
capabilities (first-pass brief).

Rationale: Sources stay replaceable; money stays exact; answers stay
traceable.

Alternatives considered: Source schemas as the canonical model.

Authority: Explicit developer decision (alignment brief §5, Business data;
first-pass brief, Data and Jobs/Connectors).

Requirement linkage: [Business/spec.md](Business/spec.md) — Pending owning
specification.

#### TD-014 — Cortex-owned semantic abstraction and grounded Understanding pipeline

Status: Accepted

Decision: Business owns an agnostic, replaceable semantic abstraction;
Understanding does not depend on PostgreSQL SQL, Cube, dbt, MetricFlow,
Redshift, or another engine; definitions are deterministic and governed; the
model has no unrestricted SQL or database access; no vendor selected.
Understanding follows authorized question → scope resolution → Business
capability or semantic query → trusted facts, metrics, and evidence →
Intelligence reasoning → structured grounded response, and never fabricates
missing evidence (first-pass brief, Understanding).

Rationale: Governed metrics and engine replaceability; the model reasons over
trusted results instead of calculating them.

Alternatives considered: Vendor-first semantic layer; model-generated SQL.

Authority: Explicit developer decision (alignment brief §5, Semantic Layer;
first-pass brief, Understanding).

Requirement linkage: [Business/spec.md](Business/spec.md),
[Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md)
— Pending owning specification.

#### TD-015 — OpenAI behind the Intelligence provider abstraction

Status: Accepted

Decision: OpenAI first; behind the provider abstraction; no direct OpenAI
dependency from Business or Understanding; capability/policy-driven selection
with final authority in Intelligence; preference/override allowed; structured
outputs; tool calling; replaceable adapters; observable usage and cost; model
output never canonical Business truth.

Rationale: Provider replaceability and policy in one place.

Alternatives considered: Direct provider calls from capabilities.

Authority: Explicit developer decision (alignment brief §5, Intelligence).

Requirement linkage: [Intelligence/Runtime/spec.md](Intelligence/Runtime/spec.md)
— Pending owning specification.

#### TD-016 — Session-scoped conversation

Status: Accepted

Decision: Session-scoped conversation state in V1; no cross-session
persistent AI memory; shared memory possible later; historical model output
untrusted with respect to Business facts.

Rationale: Keeps V1 small and avoids stale facts becoming truth.

Alternatives considered: Persistent memory in V1.

Authority: Explicit developer decision (alignment brief §5, Conversation).

Requirement linkage: [Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md)
— Pending owning specification.

#### TD-017 — Rolling deployment with expand/contract migrations

Status: Accepted

Decision: Rolling deployment; backward-compatible migrations where possible;
expand → deploy → contract; rollback support; canary/blue-green only when
justified.

Rationale: Safe releases without extra deployment infrastructure.

Alternatives considered: Blue/green; canary.

Authority: Explicit developer decision (alignment brief §5, Release).

Requirement linkage: none (technical).

#### TD-018 — Swift SDK after `/v1` stabilizes

Status: Accepted

Decision: REST first; stabilize `/v1`; Swift is the first official SDK; the
SDK is a convenience layer over the public API.

Rationale: Dogfooding from J.Crew and TruVideo.

Alternatives considered: SDK before API stability.

Authority: Explicit developer decision (alignment brief §5, SDK).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

### 21.2 Proposed technical decisions

Each entry needs developer approval before tasks that depend on it can be
generated.

#### TD-019 — Design-first OpenAPI document with a CI breaking-change gate

Status: Proposed

Decision: Author `openapi/v1/openapi.yaml` (OpenAPI 3.1) by hand and review it
like code; generate types from it; fail CI on breaking changes against
`main`.

Rationale: Makes the canonical contract (TD-001) an explicit reviewed artifact
and drives the Swift SDK and MCP adapter.

Alternatives considered: Code-first generation from Zod or decorators (the
code becomes the de facto contract).

Authority: Pending developer approval.

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-020 — Package layout and single image with two entrypoints

Status: Proposed

Decision: The package split in [Section 4.3](#43-monorepo-layout);
framework-light packages composed by `apps/api` and a new `apps/worker`; one
container image with two entrypoints.

Rationale: Shares module code between API and worker without sharing Nest
wiring; boundaries enforceable by package dependencies.

Alternatives considered: Domain code inside `apps/api` (worker cannot share it
cleanly); one package per capability with Nest modules inside packages.

Authority: Pending developer approval.

Requirement linkage: none (technical).

#### TD-021 — Amazon Cognito as the OAuth 2.0 token issuer

Status: Proposed

Decision: Cognito app clients issue client-credential tokens; Cortex validates
JWTs and maps `client_id` to an Integration.

Rationale: Managed issuer on the accepted cloud; authorization data stays in
Cortex so the issuer is replaceable. An earlier Cognito integration (#27)
exists in history.

Alternatives considered: Auth0, Okta, or another OIDC provider; Cortex-issued
tokens.

Authority: Pending developer approval.

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-022 — Tenant data isolation mechanism

Status: Proposed

Decision: Shared schema with `tenant_id`; mandatory tenant scope in
repositories; PostgreSQL RLS on tenant-owned tables using a transaction-scoped
setting as defense in depth; database roles separated into migration (DDL,
table owner), application (DML, subject to RLS), read-only semantic
(statement timeout), and reviewed maintenance roles.

Rationale: Application checks give location and permission granularity; RLS
catches a missed filter before data leaves the database. Table owners bypass
RLS, so the role split is part of the isolation design, not a separate
choice.

Alternatives considered: Application-level scoping only; schema per tenant;
database per tenant.

Authority: Pending developer approval (implementation evidence: Spike 4).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-023 — PostgreSQL schema per owning module

Status: Proposed

Decision: `platform`, `business`, `intelligence`, and `understanding` schemas;
existing engineering-automation tables stay in `public`.

Rationale: Makes data ownership visible and simplifies later extraction.

Alternatives considered: All tables in `public` with naming prefixes.

Authority: Pending developer approval.

Requirement linkage: none (technical).

#### TD-024 — Money storage precision

Status: Proposed

Decision: `numeric(19,4)` amount plus `char(3)` currency on the same row.

Rationale: Exact arithmetic with headroom for sub-unit amounts.

Alternatives considered: Integer minor units (requires per-currency scale);
unconstrained `numeric`.

Authority: Pending developer approval (may change with BD-15).

Requirement linkage: [Business/spec.md](Business/spec.md) — Pending owning
specification.

#### TD-025 — Keep Prisma Migrate for V1 schemas

Status: Proposed

Decision: Prisma Migrate with multi-schema support; raw SQL migrations for DDL
Prisma cannot express.

Rationale: Already in use and tested from an empty database (#39).

Alternatives considered: A SQL-first migration tool (for example
node-pg-migrate or Flyway) with a lighter query builder.

Authority: Pending developer approval.

Requirement linkage: none (technical).

#### TD-026 — Cortex-owned PostgreSQL semantic engine and definition registry

Status: Proposed

Decision: Versioned TypeScript metric/dimension registry; in-house compiler
to parameterized PostgreSQL SQL behind a `SemanticEngine` port.

Rationale: Satisfies TD-014 without a vendor; definitions reviewed as code.

Alternatives considered: Cube, dbt/MetricFlow, or another engine behind the
same port.

Authority: Pending developer approval (performance evidence: Spike 1).

Requirement linkage: [Business/spec.md](Business/spec.md) — Pending owning
specification.

#### TD-027 — PostgreSQL job state with SQS dispatch through an outbox

Status: Proposed

Decision: A tenant-scoped PostgreSQL job table is the job source of truth; a
transactional outbox publishes job ids to SQS; consumers claim jobs with a
claim token and lease.

Rationale: Satisfies TD-012 with one source of truth for job status; reuses
the repository's hardened job lifecycle patterns.

Alternatives considered: SQS-only state; PostgreSQL polling only; Step
Functions.

Authority: Pending developer approval.

Requirement linkage: [spec.md](spec.md), [Business/spec.md](Business/spec.md)
— Pending owning specification.

#### TD-028 — Store every fetched source payload in S3

Status: Proposed

Decision: Immutable, content-addressed raw landing before normalization, with
a source-record index in PostgreSQL.

Rationale: Replay after mapping fixes without re-fetching three years of
history; provenance drill-down.

Alternatives considered: Store only source identifiers and re-fetch.

Authority: Pending developer approval (retention: EQ-3).

Requirement linkage: [Business/spec.md](Business/spec.md) — Pending owning
specification.

#### TD-029 — KMS envelope encryption for per-tenant secrets

Status: Proposed

Decision: Connector credentials and webhook signing secrets stored as
KMS envelope-encrypted ciphertext in PostgreSQL; platform secrets in Secrets
Manager.

Rationale: Scales with tenant count; decryption restricted to specific roles.

Alternatives considered: One Secrets Manager secret per connection.

Authority: Pending developer approval.

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-030 — Standard Webhooks signing format

Status: Proposed

Decision: Outbound webhooks use the Standard Webhooks headers and HMAC scheme.

Rationale: Published format with consumer libraries, timestamped signatures,
and replay protection.

Alternatives considered: A custom signature header.

Authority: Pending developer approval.

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-031 — Build the Intelligence Runtime on existing packages

Status: Proposed

Decision: Use `@cortex/llm` as the provider layer and `@cortex/agent-runtime`
as the tool loop, with the extensions in [Section 14.3](#143-changes-to-existing-packages).

Rationale: Both are provider-agnostic and already enforce tool authorization;
the gaps are additive.

Alternatives considered: A new runtime package that replaces both.

Authority: Pending developer approval.

Requirement linkage: [Intelligence/Runtime/spec.md](Intelligence/Runtime/spec.md)
— Pending owning specification.

#### TD-032 — Model catalog as versioned configuration

Status: Proposed

Decision: Model capabilities, data-use posture, regions, and prices in
source-controlled configuration; tenant policy in PostgreSQL.

Rationale: Model changes are reviewed and auditable; price versions make cost
records reproducible.

Alternatives considered: Catalog in the database managed at runtime.

Authority: Pending developer approval.

Requirement linkage: [Intelligence/Runtime/spec.md](Intelligence/Runtime/spec.md)
— Pending owning specification.

#### TD-033 — Infrastructure as code tool

Status: Proposed

Decision: AWS CDK in TypeScript.

Rationale: Keeps one language (TD-008).

Alternatives considered: Terraform/OpenTofu (wider ecosystem, second
language); AWS SAM or CloudFormation directly.

Authority: Pending developer approval.

Requirement linkage: none (technical).

#### TD-034 — One AWS account per environment

Status: Proposed

Decision: Separate dev, staging, and prod AWS accounts.

Rationale: Strongest blast-radius and permission isolation for production
data; hard to retrofit.

Alternatives considered: One account with separate VPCs and IAM boundaries;
prod in its own account with dev and staging shared.

Authority: Pending developer approval.

Requirement linkage: none (technical).

#### TD-035 — Network topology and HTTPS ingress

Status: Proposed

Decision: An Application Load Balancer in public subnets is the HTTPS
ingress (TLS termination, path routing to API tasks, health checks, idle
timeout sized for SSE); tasks in private subnets; data stores in isolated
subnets; NAT for egress; VPC endpoints for S3, SQS, Secrets Manager, and KMS.

Rationale: No public addresses on tasks or data stores. ALB integrates
natively with ECS services and supports long-lived HTTP responses for SSE
(TD-003). The ingress is part of the network design, so it is decided here
rather than as a separate decision.

Alternatives considered: Tasks in public subnets with public IPs (cheaper,
larger exposure). For the ingress: API Gateway with a VPC link (integration
timeouts constrain long-lived SSE responses); Network Load Balancer with TLS
(no path routing or HTTP health semantics).

Authority: Pending developer approval.

Requirement linkage: none (technical).

#### TD-036 — Telemetry export topology

Status: Proposed

Decision: OpenTelemetry SDK → ADOT collector sidecar → X-Ray and CloudWatch.

Rationale: Batching and retries outside the application process; one place to
change exporters.

Alternatives considered: Direct OTLP export from the SDK; a third-party
observability backend.

Authority: Pending developer approval.

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-037 — Scheduler for periodic work

Status: Proposed

Decision: EventBridge Scheduler enqueues periodic jobs.

Rationale: Managed schedules without leader-election code.

Alternatives considered: In-worker scheduler with a PostgreSQL advisory-lock
leader.

Authority: Pending developer approval.

Requirement linkage: [Business/spec.md](Business/spec.md) — Pending owning
specification.

#### TD-038 — Rate-limit counter store

Status: Proposed

Decision: V1 uses a per-task in-memory token bucket behind a `RateLimiter`
port, with limits divided by the running task count; ElastiCache is deferred
until measured accuracy or scale requires a shared store.

Rationale: V1 traffic (pilot and dogfooding) does not justify another data
store; the port allows a shared store later without application changes.

Alternatives considered: ElastiCache now (the repository has a Redis
adapter); PostgreSQL counters (write load on the canonical store).

Authority: Pending developer approval.

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-040 — CI/CD pipeline

Status: Proposed

Decision: GitHub Actions with OIDC federation to AWS; images in ECR; the same
image digest is promoted from staging to production.

Rationale: The repository is on GitHub; OIDC avoids long-lived AWS keys.

Alternatives considered: AWS CodePipeline; another CI service.

Authority: Pending developer approval.

Requirement linkage: none (technical).

#### TD-041 — Multi-AZ RDS in production

Status: Proposed

Decision: Multi-AZ deployment for the production database.

Rationale: Automatic failover for instance or zone failures.

Alternatives considered: Single-AZ with PITR restore only.

Authority: Pending developer approval (depends on BD-9).

Requirement linkage: [spec.md](spec.md) — Pending owning specification.

#### TD-042 — Grounding validation design

Status: Proposed

Decision: Required citations in structured output; a validator that checks
citations and numeric values against this execution's tool results; a bounded
corrective retry.

Rationale: Implements "never fabricate evidence" mechanically instead of by
prompt alone.

Alternatives considered: Prompt-only grounding; post-hoc model self-check.

Authority: Pending developer approval (reliability evidence: Spike 3).

Requirement linkage: [Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md)
— Pending owning specification.

#### TD-043 — Reconciliation polling and source-version ordering

Status: Proposed

Decision: Event-capable sources are also polled at a lower, per-connector
frequency to reconcile lost or out-of-order events; canonical updates are
applied by the source's modification timestamp or version, never by arrival
order.

Rationale: Source events are commonly at-least-once and unordered; polling
alone is already required for sources without events (TD-013), so the same
path closes event gaps without new infrastructure.

Alternatives considered: Trust source events only and rely on manual
re-imports; full periodic re-import of recent windows.

Authority: Pending developer approval (per-source settings depend on EQ-1).

Requirement linkage: [Business/spec.md](Business/spec.md) — Pending owning
specification (freshness semantics: BD-17).

#### TD-044 — Scope resolution strategy

Status: Proposed

Decision: Resolve business, authorized locations, and timezone
deterministically from the route, grants, and Business configuration;
interpret relative time phrases and location references with a dedicated
structured-output Intelligence task constrained to the authorized locations
and a typed period schema; validate the result against `ExecutionContext`.

Rationale: Keeps authorization-relevant scope out of free-form model output
and makes scope a typed, testable value before any Business query.

Alternatives considered: A deterministic date and location parser only
(brittle for natural language); letting the main reasoning model choose scope
through tool arguments (scope is no longer checked before the tool loop).

Authority: Pending developer approval (model and cost evidence: Spike 3).

Requirement linkage: [Business/Operator/Understanding/spec.md](Business/Operator/Understanding/spec.md)
— Pending owning specification (ambiguity behavior: BD-23).

### 21.3 Deferred and future considerations

Non-blocking. None needs a decision for V1.

- ElastiCache or another shared rate-limit store (TD-038).
- AWS WAF or other edge filtering. Application authentication and rate
  limiting cover the known V1 needs, and WAF can be added in front of the
  ingress without application changes. Step 15 evaluates it against the
  threat model; if evidence justifies it, a new Proposed decision is recorded.
  (The label TD-039 is retired and not reused.)
- Daily rollups and other pre-aggregation (Spike 1).
- Provider circuit breaker (single provider in V1).
- A second AI provider (add an `LLM` adapter and catalog entries).
- Analytical engine behind the semantic contract (TD-011).
- Semantic-layer vendor behind the `SemanticEngine` port (TD-014).
- Shared cross-session memory (TD-016).
- Canary or blue/green deployment (TD-017).
- MCP adapter and Swift SDK after `/v1` stabilizes (TD-004, TD-018).
- Recording Accepted directions as ADRs under `Engineering/Decisions/`.

## 22. Implementation Sequence

Spec owner: all owning specs, per step.
Traceability status: Pending owning specification.

No step is executable today. A step becomes executable when every item in its
"Requires" column is satisfied. Spikes and the compliance investigation are
evidence work and can start once the developer approves their scope.

| # | Step | Delivers | Requires | Exit condition |
| --- | --- | --- | --- | --- |
| 1 | Platform foundation | Package skeleton, `apps/worker`, module boundary lint, typed IDs, structured logging, telemetry baseline, CI | Technical approval: TD-019, TD-020, TD-036, TD-040 | Both apps boot with fail-closed configuration; correlated traces and logs |
| 2 | REST/OpenAPI contract | OpenAPI foundation, generated types, request validation, breaking-change gate | Platform spec (BD-1, BD-7); TD-019 | CI fails on a deliberate breaking change |
| 3 | Auth and execution context | Token validation, Tenant/Business/Integration/Grant, `ExecutionContext`, tenant isolation, idempotency, rate limiting, execution records | Platform spec (BD-1 to BD-5); TD-021, TD-022, TD-023, TD-038; Spike 4 | Cross-tenant suite green for every operation |
| 4 | AWS foundation | IaC for environments, network, HTTPS ingress, ECS services, RDS, S3, SQS, KMS, Secrets Manager, deploy pipeline, migration task | Technical approval: TD-022 (database roles), TD-033, TD-034, TD-035, TD-040, TD-041; production region requires compliance result (EQ-2) | Staging rolling deploy of steps 1–3 |
| 5 | Business canonical model | Canonical schema, provenance, classification | Business spec (BD-12, BD-14, BD-15, BD-19); TD-023, TD-024, TD-025 | Migration tests green; deterministic fixtures load |
| 6 | Semantic layer | Contract, registry, engine, data-quality signals over fixtures | Business spec (BD-13, BD-17); TD-022 (semantic role), TD-026; Spike 1 | Golden metric tests green |
| 7 | Durable jobs | Job store, dispatch, consumers, retry classes, leases, cancellation, reapers, scheduling | Platform spec (BD-3, BD-4); TD-027, TD-037 | Failure-injection tests green |
| 8 | Connector contract | Connector contract, sync orchestration, raw landing, normalization, quarantine, fake connector | Business spec (BD-12, BD-17, BD-18); TD-028, TD-029 | Contract suite green on the fake connector |
| 9 | First production connector and 3-year import | Real connector, chunked import, incremental sync, reconciliation, freshness | Business spec (BD-16, BD-18); TD-043; pilot-source decision (EQ-1); compliance result (EQ-2); Spike 2 | Pilot business imported in staging, reconciled within tolerance |
| 10 | Trusted metrics, evidence, data quality | Evidence references and quality signals on real data | Business spec (BD-13, BD-16, BD-17); TD-026, TD-028 | Metrics match the pilot business's own reports |
| 11 | Intelligence and OpenAI | Runtime facade, catalog, policy, structured outputs, usage and cost | Intelligence Runtime spec (BD-10, BD-11); TD-031, TD-032; compliance result for real data (EQ-2) | Provider contract and policy tests green |
| 12 | Understanding | Scope resolution, Business tools, grounding, response assembly, interactive endpoint | Understanding and Operator specs (BD-20 to BD-23, BD-25, BD-26); TD-042, TD-044; Spike 3 | Grounded E2E answers on fixtures and pilot data |
| 13 | Conversation and execution state | Sessions, turns, execution events | Understanding spec (BD-24); Platform spec (BD-3) | Multi-turn E2E tests green |
| 14 | Observability completion | Dashboards, alarms, cost reports | Platform spec (BD-9, BD-10); TD-036 | Alarms fire in a staging game day |
| 15 | Security hardening | Threat model review, penetration test, evaluation of whether additional edge filtering such as AWS WAF is justified by the threat model and observed security requirements, rotation drills, redaction audit | Platform spec | No open high-severity findings |
| 16 | Compliance validation | Formal sign-off applying EQ-2 results to region, provider settings, retention | EQ-2 investigation (starts with technical planning) | Documented sign-off for the pilot jurisdiction |
| 17 | Outbound webhooks | Endpoint management, signed delivery, retries | Platform spec (BD-6); TD-027, TD-029, TD-030 | Delivery and signature tests green |
| 18 | SSE | Streaming adapter, provider streaming, ingress idle-timeout tuning | Platform and Understanding specs (BD-8); TD-031 (streaming method); TD-035 (ingress); EQ-7 if BD-8 streams worker-run executions | SSE E2E tests green through the HTTPS ingress |
| 19 | Real-business pilot | Pilot tenant onboarded through the public API only | Steps 1–18; pilot criteria in the owning specs | Spec-defined pilot criteria met |
| — | After `/v1` stabilizes | Swift SDK, MCP adapter | TD-004, TD-018; stable `/v1` | — |

Differences from the reference ordering:

- **Telemetry baseline moves into step 1.** Correlation must exist before the
  first execution path; step 14 completes dashboards, alarms, and cost
  reporting.
- **Idempotency, rate limiting, and execution records move into step 3.**
  They are part of the edge pipeline every later endpoint uses.
- **Intelligence (step 11) can proceed in parallel** with steps 5–10 once its
  requirements are met, because it does not depend on Business.
- **The compliance investigation starts during technical planning, and its
  result gates real data** in steps 4 (production region), 9 (real business
  import), and 11 (real data to the provider). Step 16 remains the formal
  sign-off.
- **Baseline security ships with each step**; step 15 is hardening and review.

## 23. Testing Strategy

Spec owner: all owning specs.
Traceability status: Pending owning specification. Every test suite below
will cite the owning spec's AC identifiers once they exist; until then tests
map to the behavioral dependency or technical decision named.

Jest coverage follows the repository rule `.cursor/rules/test-coverage.mdc`
(minimum 95%, target 100% on code under test); coverage never replaces
behavior coverage.

| Layer | What is proved | Maps to | Approach |
| --- | --- | --- | --- |
| Unit/module | Domain rules, state transitions, error mapping, cancellation | Owning spec ACs | Jest through each package's public boundary |
| OpenAPI contract | Responses match the contract; errors use Problem Details | TD-001, TD-002, BD-1 | Response validation in API integration tests |
| API compatibility | No breaking change within `/v1` | TD-001 | CI diff of the OpenAPI document (TD-019) |
| Auth and tenant isolation | Token validation; grants enforced; no cross-tenant access | TD-006, TD-007, TD-022, BD-2 | Generated suite calling every operation with another tenant's credentials and ids; RLS tests under the application role |
| Migrations | Apply from empty and from the previous release; expand/contract compatibility | TD-017, TD-025 | Disposable PostgreSQL (for example Testcontainers); previous release run against the expanded schema |
| Business fixtures | Deterministic datasets with known totals, timezones, currencies, edge cases | BD-12 to BD-15 | Versioned fixture builders |
| Semantic metrics | Each governed metric equals an independently computed value; versioning | BD-13, TD-014, TD-026 | Golden tests per metric |
| Connector contract | Paging, cursors, drift handling, error classes | TD-013 | Shared suite per connector against recorded source fixtures |
| Import and idempotency | Re-runs and redeliveries yield identical canonical state; resume after crash | TD-012, TD-027, BD-18 | Failure injection between landing, upsert, and checkpoint |
| Provider adapter contract | Mapping, structured output, tools, usage, error classes | TD-015, TD-031 | Recorded fixtures in CI; scheduled live smoke tests in staging |
| Structured output and tools | Invalid outputs rejected; unauthorized tools neither exposed nor run | TD-007, TD-015 | Kernel tests with scripted model responses |
| Model policy | Preferences honored only when qualifying; reasons recorded | TD-015, BD-11 | Table-driven tests over catalog fixtures |
| Evidence and data quality | Signals for constructed gap and conflict scenarios; grounding rejects unsupported claims | BD-17, BD-22, BD-26, TD-042 | Scenario fixtures |
| Jobs | Retry classes, backoff, DLQ, lease expiry, cancellation, terminal-exactly-once | TD-012, TD-027 | Integration tests with local SQS emulation and PostgreSQL |
| Webhooks | Signatures, replay rejection, retries, SSRF blocking | BD-6, TD-030 | Integration tests with a test receiver |
| End-to-end | Consumer workflows through the public API with OAuth client credentials | Owning spec ACs | Staging suite on every deploy |
| AI evaluation | Grounded-answer quality; zero grounding violations | BD-21, BD-26, TD-042 | Curated question set on every prompt, model, or catalog change |
| Pilot validation | Metrics match the pilot business's reports; grounded answers on real data | Owning spec pilot criteria | Structured review against spec ACs |

The reference Business integration, the E2E suite, and dogfooding clients use
only the public `/v1` API with ordinary OAuth client credentials. No private
routes, special tokens, or direct database access.

## 24. Risks and Mitigations

**R-01 — First connector or source data quality is poor.**
Mitigation: quarantine and reconciliation make defects visible; raw landing
(if TD-028 is approved) makes them replayable; data-quality signals expose
gaps; choose the pilot source with the best API depth (EQ-1, Spike 2).

**R-02 — Semantic metric definitions are wrong.**
Mitigation: definitions reviewed with Business owners; golden tests; step 10
validates against the pilot business's reports; definition versions let a
fix ship without silently changing history.

**R-03 — Source schema drift.**
Mitigation: tolerant validation, quarantine with alarms, retained raw
payloads, connector contract tests on recorded fixtures refreshed from
staging.

**R-04 — Three-year import volume.**
Mitigation: chunked import with checkpoints, per-connection concurrency and
rate-limit control, Spike 1 and Spike 2 before the pilot import.

**R-05 — Tenant data leakage.**
Mitigation: layered enforcement (with RLS if TD-022 is approved), generated
cross-tenant tests for every operation, tenant-scoped logs and caches,
security review in step 15.

**R-06 — Hallucination despite grounded tools.**
Mitigation: structured outputs with citations, grounding validation
(TD-042), responses assembled in code, evaluation set with a
zero-violation gate, Spike 3.

**R-07 — Provider availability or behavior changes.**
Mitigation: provider-neutral facade, pinned model versions in the catalog,
adapter contract tests and live smoke tests, evaluation rerun before model
changes.

**R-08 — AI cost growth.**
Mitigation: per-call cost records attributed to tenant, integration, and
business; dashboards and alarms; iteration and token budgets; aggregated tool
results instead of raw rows; Spike 3 measures cost per question.

**R-09 — API instability before SDK adoption.**
Mitigation: OpenAPI breaking-change gate, additive-only evolution in `/v1`,
SDK after the pilot.

**R-10 — Premature infrastructure complexity.**
Mitigation: proportionality review ([Section 4.4](#44-proportionality-review));
deferral of ElastiCache, WAF, rollups, circuit breakers, and analytical
engines until evidence requires them.

**R-11 — Insufficient evidence or provenance.**
Mitigation: provenance columns on every canonical fact, source-record index,
definition versions in every result, raw retention per EQ-3.

**R-12 — Regional or compliance restrictions.**
Mitigation: the investigation starts with technical planning and gates real
data; region is an infrastructure parameter; provider data-use settings live
in the model catalog and are enforced by policy.

**R-13 — Future migration from PostgreSQL to an analytical engine.**
Mitigation: Understanding depends only on the semantic contract; engine behind
a port; canonical model kept engine-neutral; raw data (if retained) can feed
a new engine.

**R-14 — Missing specifications.**
Mitigation: this plan stays non-executable; behavioral dependencies are
listed for spec authors; no implementation establishes behavior before the
owning spec is `Provisional`.

**R-15 — Agent-proposed decisions treated as approved.**
Mitigation: every decision carries a status and authority; Proposed decisions
block dependent tasks until approved.

## 25. Rollout and Release

Spec owner: [spec.md](spec.md) (Cortex Platform).
Traceability status: Pending owning specification.
Decisions: TD-007, TD-009, TD-017 (Accepted); TD-034, TD-040 (Proposed).
Blocked behavior: BD-9.

- **Accepted** (TD-009): dev, staging, and prod are separated. Account
  topology is TD-034.
- **Proposed** (TD-040): a pipeline builds one image per commit, runs unit,
  contract, migration, and tenant-isolation tests, deploys to dev
  automatically and to staging on merge to `main`, and promotes the same image
  digest to production with manual approval.
- **Accepted** (TD-017): rolling deployment; expand migrations run before the
  rollout and contract migrations in a later release; rollback by redeploying
  the previous image, kept compatible by expand/contract; PITR for data
  recovery. **Derived from TD-009 and TD-017**: ECS deployment with minimum
  healthy 100% and the deployment circuit breaker's automatic rollback.
- **Derived from TD-007**: pilot access to new capabilities is controlled
  through Integration grants; no separate feature-flag system is introduced.
- Pilot: one real business onboarded through the public API, with J.Crew and
  TruVideo dogfooding; exit criteria come from the owning specs.
- **Accepted** (TD-017): canary and blue/green are not V1 requirements.

## 26. Open Questions

### 26.1 Behavioral dependencies

Owned by the specifications. The plan cannot answer them. The full registry
with owners, status, and impact is [Section 2.3](#23-behavioral-dependency-registry):

- **Cortex Platform:** BD-1 to BD-10.
- **Intelligence Runtime:** BD-11.
- **Business:** BD-12 to BD-19.
- **Business Operator:** BD-20.
- **Business Understanding:** BD-21 to BD-26.

### 26.2 Engineering questions

Owned by the plan and decision process. Proposed decisions awaiting approval
are listed in [Section 21.2](#212-proposed-technical-decisions) and are not
repeated here.

**EQ-1 — First production connector / source system.**
Blocks step 9 and Spike 2. The connector contract does not depend on it. The
choice decides historical depth, events versus polling, and rate limits, and
should be made with the pilot business.

**EQ-2 — Colombia/LATAM data residency and AI processing.**
Blocks the production region (step 4), real business data in steps 9 and 11,
and production launch. No legal requirement is assumed. The investigation must
establish where data may be stored, whether Business data may be processed by
the OpenAI API under available data-use and retention terms, and which
retention and cross-border transfer rules apply.

**EQ-3 — Raw-data retention strategy.**
Blocks finalizing TD-028. How long raw source payloads are kept, when they move
to colder storage, and how deletion requests propagate. Depends on EQ-2 and on
any consumer-visible retention in the Business spec.

**EQ-4 — Partitioning need and threshold.**
Answered by Spike 1. Must be settled before the pilot import, because
partitioning a large existing table later requires a data migration.

**EQ-5 — Placement of the engineering-automation system.**
Non-blocking. It shares the API process and database today and is excluded
from public routing. Moving it to its own service or retiring legacy tables can
be decided after V1.

**EQ-6 — Convergence of `execution_job` with the V1 job store.**
Non-blocking. Decided together with EQ-5 if TD-027 is approved.

**EQ-7 — Cross-process execution event transport.**
Blocks step 18 only if BD-8 requires streaming events from executions that
run in the worker (for example imports). Interactive executions run in the
API task and stream from the in-process `ExecutionEventSink`. Not needed
otherwise; a proposal is made once BD-8 is specified.

### 26.3 Technical spike candidates

Spikes are engineering evidence tasks, not Product questions and not
implementation. Each ends with a short written result linked from this plan.
Each needs developer approval of its scope before it starts.

#### Spike 1 — PostgreSQL semantic-query performance at V1 volume

- **Question:** can PostgreSQL serve the expected V1 analytical workload
  without partitioning, rollups, or a separate analytical engine?
- **Evidence needed:** representative 3-year fixture volume for a pilot-sized
  business; expected query patterns; p95 latency; concurrent query load.
- **Outcome:** accept TD-026 as-is, add partitioning or rollups as new
  Proposed decisions, or propose an analytical engine. Answers EQ-4.

#### Spike 2 — First-source historical extraction

- **Question:** can the chosen source deliver 3 years of history within an
  acceptable import duration under its rate limits?
- **Evidence needed:** historical depth, paging behavior, rate limits, payload
  sizes, measured throughput for a sample window. Requires EQ-1.
- **Outcome:** chunk size and concurrency settings ([Section 7.2](#72-initial-business-import)),
  per-source settings for TD-043, or a behavioral question for BD-16 if 3
  years is not available.

#### Spike 3 — Structured output and grounding reliability

- **Question:** how often do candidate OpenAI models produce schema-valid,
  correctly cited answers over Business tool results, and at what latency and
  cost?
- **Evidence needed:** synthetic fixtures only (no real data before EQ-2);
  grounding violation rate, retry rate, p95 latency, cost per question per
  candidate model.
- **Outcome:** TD-042 retry bound, initial catalog entries for TD-032, and
  model, latency, and cost evidence for the scope-resolution task in TD-044.

#### Spike 4 — RLS with Prisma transaction-scoped tenant setting

- **Question:** does the transaction-scoped RLS setting work with Prisma and
  connection pooling without leaks between requests, and at what overhead?
- **Evidence needed:** concurrency test proving no cross-request setting leak;
  latency overhead per request; behavior with pooling.
- **Outcome:** accept TD-022 as proposed, or revise it toward
  application-level scoping only.
