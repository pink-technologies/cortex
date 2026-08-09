# Ticket classify skill

When classifying a ticket:

- Prefer `bug` only when there is a concrete incorrect behavior to reproduce.
- Use `chore` for maintenance, refactors, or dependency bumps without a defect.
- Use `question` for clarification requests that do not ask for a code change.
- Use `out_of_scope` for product/design decisions or work that is not a defect.
- Set `automationEligible` to true for concrete bugs and false otherwise; the
  Node overwrites eligibility from suite evidence after clone for bugs.
- When the prompt lists known areas, set `areas` to zero or more of those labels
  inferred from the ticket text. Leave `areas` empty when unclear. Never invent
  shell commands, schemes, or area labels outside the provided list.
