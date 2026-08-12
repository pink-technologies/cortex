---
name: swiftui
description: "Applies reusable SwiftUI framework guidance for implementation, refactoring, debugging, testing, and review. Use when SwiftUI views, state and observation, view identity, layout, navigation, presentation, scrolling, animation, accessibility, rendering performance, or platform-specific SwiftUI APIs are materially involved."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [SwiftUI, Apple, UI, State-Management, Layout, Accessibility, Performance]
    related_skills: [swift, swift-concurrency, code-review-diff]
---

# SwiftUI Engineering

Use this skill as generic SwiftUI framework guidance.

Combine it with the Swift language skill when Swift language behavior is
materially involved. Load more specialized skills only when their concerns are
present in the task.

This skill does not define the task workflow, repository architecture,
application architecture, state-management architecture, review format, or
project-specific conventions.

## Apply project guidance first

Before applying these rules:

- Use applicable host, organization, repository, and project instructions.
- When repository access is available and project instructions have not already
  been resolved by the host, discover instructions applicable to the affected
  files before relying on this generic guidance.
- Preserve the project's established architecture, state-management approach,
  dependency-injection strategy, navigation model, Design System, localization
  conventions, deployment targets, and supported platforms when explicitly
  defined.
- Treat compiler settings, deployment targets, package manifests, Xcode build
  settings, formatter, linter, test configuration, and availability constraints
  as executable sources of truth for deterministic project behavior.
- Do not replace an established project convention with a generic SwiftUI
  preference unless the task explicitly requests that change.
- Do not introduce newer APIs merely because they exist when the project's
  deployment targets, compatibility requirements, or existing design make the
  current API appropriate.

## Establish SwiftUI context

Before applying specialized guidance, determine the context that materially
affects the task:

- Supported Apple platforms.
- Minimum deployment versions.
- Swift and SwiftUI language/framework capabilities available to the target.
- Whether the affected state is locally owned, injected, shared, derived, or
  externally managed.
- Whether Observation (`@Observable`) or `ObservableObject` is used.
- The project's navigation and presentation model.
- The project's Design System and accessibility requirements.
- Whether the UI must adapt across window sizes, orientations, input methods,
  or Apple platforms.
- Whether animation, scrolling, images, or frequently updating state create a
  performance-sensitive path.

Do not infer requirements from APIs or dependencies that exist elsewhere in the
repository but are unrelated to the affected code.

## Load related skills

- Use the Swift language skill when Swift language behavior is materially
  involved.
- Load the Swift concurrency skill when tasks, actors, asynchronous state,
  cancellation, streams, or isolation materially affect the SwiftUI lifecycle.
- Load methodology skills such as code review, debugging, or testing only when
  the current task requires that workflow.
- Load project-specific framework skills when applicable.
- Do not assume a particular application architecture, state-management
  framework, navigation abstraction, or dependency-injection mechanism merely
  because SwiftUI is used.

## Load references

Read only the references that materially apply to the task:

- `references/state-management.md` for state ownership, Observation,
  `ObservableObject`, bindings, focus state, and property-wrapper selection.
- `references/view-structure.md` for view identity, composition, extraction, and
  render-path structure.
- `references/layout-best-practices.md` for adaptive layout, constraints,
  container ownership, reusable views, and layout behavior.
- `references/list-patterns.md` for `ForEach`, stable identity, lists, and
  collection rendering.
- `references/scroll-patterns.md` for programmatic scrolling, scroll position,
  scroll transitions, and scroll-target behavior.
- `references/sheet-navigation-patterns.md` for presentation and SwiftUI
  navigation patterns.
- `references/animation-basics.md` for implicit and explicit animation,
  transactions, timing, and animation placement.
- `references/animation-transitions.md` for insertion/removal transitions and
  transition identity.
- `references/animation-advanced.md` for transactions, phase animation,
  keyframes, and advanced animation behavior.
- `references/accessibility-patterns.md` for semantics, Dynamic Type, traits,
  grouping, focus, and custom controls.
- `references/performance-patterns.md` for update propagation, render cost,
  collection performance, dependency scope, and profiling.
- `references/image-optimization.md` for image loading, decoding, memory use,
  and downsampling when image handling is materially involved.
- `references/liquid-glass.md` only when Liquid Glass or the corresponding
  platform APIs are explicitly part of the requested UI.
- `references/latest-apis.md` when API availability, deprecation, migration, or
  deployment-target compatibility is materially involved.

Load only references relevant to the affected behavior. Do not load a reference
solely because it exists.

## Engineering baseline

- Keep `body` declarative and free of unrelated side effects or expensive
  business logic.
- Make state ownership explicit.
- Distinguish owned state from injected state and derived values.
- Do not convert changing external input into locally authoritative state
  accidentally.
- Preserve stable view identity when state should survive updates.
- Use bindings only when mutation through the child is part of the intended
  contract.
- Keep lifecycle-sensitive resources owned by a component with a corresponding
  lifecycle.
- Keep navigation and presentation behavior consistent with the project's
  established model.
- Prefer native SwiftUI capabilities when they satisfy the required behavior
  without violating deployment or compatibility constraints.
- Make custom UI accessible to the same degree as the native control it
  replaces.
- Adapt layout to available space and environment rather than hard-coded device
  assumptions.
- Optimize demonstrated render and update costs rather than introducing
  speculative complexity.

## State and observation principles

Choose state mechanisms from ownership and mutation semantics, not habit.

- Use `@State` for state owned by the view.
- Keep view-owned state private unless a broader contract requires otherwise.
- Use `@Binding` when a child intentionally mutates state owned elsewhere.
- Use Observation APIs according to the project's deployment targets and
  established observation model.
- When using `ObservableObject`, distinguish objects created and owned by the
  view from objects injected by another owner.
- Do not copy an external value into owned state merely to observe or display
  it.
- Use immutable values for inputs that the view only reads.
- Avoid redundant state representing values that can be derived reliably from
  an authoritative source.
- Ensure state mutations affecting SwiftUI presentation occur on the isolation
  domain required by the application and framework contract.

Treat wrapper selection as an ownership decision rather than a style rule.

## View identity and composition

SwiftUI correctness depends on identity as well as rendered appearance.

- Preserve structural identity when state and lifecycle should survive a visual
  change.
- Use conditional structure when elements genuinely appear or disappear.
- Prefer changing modifiers or values when the logical view remains the same
  and only its presentation changes.
- Give dynamic collections stable semantic identity.
- Do not use collection indices as identity when insertion, removal, or
  reordering can change what an index represents.
- Extract views when doing so creates a meaningful ownership, identity,
  readability, reuse, or update boundary.
- Do not extract trivial views solely to satisfy arbitrary line-count rules.
- Keep view-builder helpers small enough that ownership and identity remain
  understandable.

## Lifecycle and asynchronous work

When SwiftUI starts asynchronous or lifecycle-bound work:

- Prefer lifecycle-aware mechanisms such as `.task` when the work belongs to
  the view lifecycle.
- Ensure work that should stop with the view is cancellable or otherwise cannot
  mutate stale state.
- Do not assume asynchronous completion order matches invocation order.
- Prevent stale work from replacing newer authoritative state.
- Check cancellation before committing results when cancellation changes the
  validity of the result.
- Keep tasks, subscriptions, observers, timers, and other retained resources
  aligned with their intended owner.
- Load the Swift concurrency skill for deeper isolation, actor, `Sendable`,
  cancellation, continuation, or stream reasoning.

## Navigation and presentation

- Preserve the navigation model established by the project.
- Prefer value- or model-driven navigation when navigation state itself is part
  of the application state.
- Keep destination identity stable and intentional.
- Avoid scattering route or presentation state across unrelated views when the
  project already has an authoritative owner.
- Make dismissal ownership consistent with the presentation contract.
- Do not introduce a second navigation abstraction without a demonstrated need.

## Layout

- Design reusable views from the constraints provided by their container.
- Avoid assumptions based solely on device names or fixed screen dimensions.
- Prefer relative and adaptive layout when the available space can change.
- Use geometry measurement only where the measured value materially influences
  layout behavior.
- Avoid feedback loops where geometry changes state that immediately changes
  geometry again without a stable boundary.
- Keep business behavior independent from purely presentational layout changes.

## Performance

Treat SwiftUI performance as a data-dependency and update-propagation problem
before treating it as a micro-optimization problem.

- Keep frequently executed render paths inexpensive.
- Avoid unnecessary state writes.
- Avoid observing values a view does not actually need.
- Pass focused dependencies instead of broad context objects when broad
  dependencies cause unnecessary invalidation.
- Build potentially large collections lazily where appropriate.
- Preserve stable collection identity.
- Avoid unnecessary type erasure in performance-sensitive collection paths.
- Move expensive decoding, transformation, sorting, filtering, or I/O out of
  repeatedly executed render paths.
- Profile meaningful performance problems before adding caching, custom
  rendering, or architectural complexity.
- Use SwiftUI update diagnostics when needed to understand unexpected
  invalidation before guessing at the cause.

Do not report a performance issue without a plausible cost or update path.

## Animation

- Choose implicit animation when a value-driven presentation change should
  animate consistently.
- Use explicit animation when an event intentionally initiates a transition.
- Scope animations to the values they are intended to animate.
- Ensure insertion and removal transitions occur within an animation context
  when animation is expected.
- Prefer visual transforms over repeated expensive layout changes when they
  produce equivalent behavior.
- Preserve identity intentionally during animated state changes.
- Use advanced animation APIs only when simpler animation primitives cannot
  express the required behavior clearly.

## Accessibility

Accessibility is part of the control contract.

- Prefer native interactive controls when they express the required behavior.
- When using custom controls, preserve semantics, actions, focus behavior, and
  interaction expectations.
- Provide explicit labels when the visual content does not produce a meaningful
  accessible description.
- Preserve Dynamic Type and scalable measurements when custom dimensions should
  follow text size.
- Group or separate semantic elements according to how users should perceive
  and interact with them.
- Keep important interactions reachable through the input methods supported by
  the target platform.

## Platform-specific UI

Use platform-specific SwiftUI APIs only when they are part of the requested
behavior or established project design.

For APIs such as Liquid Glass:

- Respect deployment availability.
- Provide a fallback when the supported deployment range requires one.
- Preserve the project's Design System and visual hierarchy.
- Apply effects according to the semantic role of the control or surface rather
  than decorating every eligible view.
- Do not migrate an existing UI to a new visual system unless the task requests
  that change.

## Use with other skills

Examples:

```text
Review SwiftUI change
→ code-review-diff
→ languages/swift
→ frameworks/swiftui
→ project guidance
```

```text
Implement asynchronous SwiftUI feature
→ languages/swift
→ languages/swift/concurrency
→ frameworks/swiftui
→ project guidance
```

```text
Debug SwiftUI state issue
→ debugging
→ languages/swift
→ frameworks/swiftui
→ project guidance
```

When another skill defines the workflow, output contract, severity model,
validation strategy, or change methodology, preserve that contract and use this
skill only as specialized SwiftUI guidance.

## Validation

When execution tools are available, prefer the project's own validation
commands and configuration.

Depending on the project and affected behavior, relevant validation may include:

- Swift compilation.
- Xcode or package builds.
- Unit tests.
- SwiftUI/view tests.
- UI tests for materially changed user workflows.
- Accessibility verification.
- Snapshot tests when the project intentionally uses them.
- Project-configured SwiftLint or SwiftFormat checks.
- Profiling or SwiftUI update diagnostics for demonstrated performance issues.

Run only checks relevant to the task and supported by the available environment.

Do not claim a check passed unless it was executed successfully.