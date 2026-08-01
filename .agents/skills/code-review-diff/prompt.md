# Diff review skill

When reviewing a change set:

- Compare the head revision against the base revision when both are provided.
- Call out breaking API/ABI changes, missing tests for new behavior, and
  incorrect error handling first.
- Prefer findings that would fail review for a human teammate, not formatting.
- If the diff is test-only, still verify assertions match the production
  behavior they claim to cover.
