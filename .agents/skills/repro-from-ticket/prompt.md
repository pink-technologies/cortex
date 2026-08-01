# Repro-from-ticket skill

When planning reproduction:

- Extract expected vs actual behavior from the ticket text.
- Prefer existing unit suites first, then UI suites when the bug is user-facing.
- Never invent arbitrary shell commands; choose among allowlisted suite ids.
- Treat a failing allowlisted suite that matches the hypothesis as reproduced.
