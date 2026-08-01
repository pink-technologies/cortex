# Ticket classify skill

When classifying a ticket:

- Prefer `bug` only when there is a concrete incorrect behavior to reproduce.
- Use `chore` for maintenance, refactors, or dependency bumps without a defect.
- Use `question` for clarification requests that do not ask for a code change.
- Use `out_of_scope` for product/design decisions or work Cortex cannot test.
- Set `automationEligible` true only for bugs with enough detail to drive tests.
