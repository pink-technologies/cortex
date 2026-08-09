# Navigation

## Contents

1. Ownership
2. Routes and parameters
3. Cross-Experience behavior
4. BLoC/UI separation

## 1. Ownership

### FL-NAV-001 — Let each Experience own its routes `[HIGH]`

Keep feature route definitions and route parameters inside the owning
Experience. Export only the routes/contracts the App or other approved
consumers need.

### FL-NAV-002 — Keep global policy in App `[HIGH]`

Authentication redirects, global shells, app-wide deep-link policy, and other
cross-Experience navigation rules belong at App composition level.

## 2. Routes and parameters

### FL-NAV-010 — Centralize route names and paths `[MEDIUM]`

Do not scatter duplicated route string literals through Views.

### FL-NAV-011 — Prefer typed route parameters `[HIGH]`

Use explicit route parameter types for non-trivial payloads. Avoid arbitrary
`Map<String, dynamic>` payload contracts between screens.

Validate required route data before constructing a screen when malformed or
missing data is possible.

## 3. Cross-Experience behavior

### FL-NAV-020 — Use public intents/contracts across Experiences `[HIGH]`

Use public intents or App-mediated contracts for cross-Experience application
actions. Do not import another Experience's screen implementation to perform
app-wide transitions.

Within one Experience, direct routing through that Experience's route contract
is acceptable.

## 4. BLoC/UI separation

### FL-NAV-030 — Trigger navigation from presentation listeners `[HIGH]`

Let BLoC state/events express completion or outcome and let a listener perform
navigation. Do not make Repository or Resource layers depend on router APIs.

### FL-NAV-031 — Keep navigation out of build `[HIGH]`

Do not navigate as a side effect of widget rendering.

