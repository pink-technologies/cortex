# Minimal-fix skill

When fixing a reproduced bug:

- Change only what is required to make the failing allowlisted tests pass.
- Avoid refactors, formatting-only edits, and unrelated cleanup.
- Keep public APIs stable unless the ticket explicitly requires a break.
- Summarize the change in one or two sentences for the draft PR body.
