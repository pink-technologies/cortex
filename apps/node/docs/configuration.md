# Cortex Node configuration (TOML)

Cortex Node reads operational configuration exclusively from TOML files under a
configuration directory. Environment variables are not used for application
settings except:

- `CORTEX_CONFIG_DIR` — absolute or relative path to the configuration root
- Secret values referenced explicitly from TOML (`source = "environment"`)

## Configuration directory

Default:

```text
<process.cwd()>/.cortex
```

Override with `CORTEX_CONFIG_DIR` (absolute, or relative to the process working
directory). Startup fails if `node.toml` is missing or invalid.

## Layout

```text
.cortex/
├── node.toml
├── connections.toml
└── projects/
    ├── example-project.toml
    └── another-project.toml
```

Keep `.agents/` for agents, capabilities, and skills only. Do not store Node
operational configuration, connections, credentials, or repository mappings
there.

| File | Responsibility |
| --- | --- |
| `node.toml` | Node identity, API base URL, polling, optional Jira automation fields, engine/LLM secret references |
| `connections.toml` | Source-control and Jira connections (tokens via secret references) |
| `projects/*.toml` | One Jira project → repository mapping per file, including suites and areas |

Safe examples live in `.cortex/examples/`.

## `api.baseUrl`

`[api].baseUrl` is the **complete** Cortex API base URL, including Nest’s global
prefix when the deployment uses one (for example `http://localhost:3000/api`).

HTTP clients must not append a hard-coded `/api`. Trailing slashes are stripped
when configuration is loaded.

## Secret references

Secrets must use a reference object. Inline tokens and API keys are rejected.

```toml
token = { source = "environment", name = "GITHUB_TOKEN" }
```

Resolved configuration exposes credential **strings** only
(`cursorApiKey`, connection `token` / `apiToken`, LLM `apiKey`). Secret
references never appear on the application model.

Environment variable names must be nonblank identifiers
(`^[A-Za-z_][A-Za-z0-9_]*$`). Missing or blank values fail startup.

## Named suites and structured commands

Project suites use structured executables (no shell strings):

```toml
[suites.unit]
executable = "pnpm"
arguments = ["test", "--filter", "cortex"]
workingDirectory = "."
timeoutMilliseconds = 600000
```

Suites run as `spawn(executable, arguments, { cwd, shell: false })`.

- `workingDirectory` must be relative and must not escape the repository (`..`
  and absolute paths are rejected).
- `arguments` default to `[]`; `workingDirectory` defaults to `"."`.
- Prefer named suites such as `unit` and `ui` instead of legacy shell command
  fields.

## Areas

Areas map product labels/aliases to suite keys:

```toml
[areas.api]
aliases = ["backend", "server"]
suiteKeys = ["unit"]
```

Every `suiteKeys` entry must reference a suite defined in the same project file.

## Validation

`NodeConfigurationLoader.loadFromRootDirectory(...)` runs:

1. Load each TOML file with `TomlLoader` (plain JSON data; Symbol metadata stripped)
2. Validate each file with Zod (strict; unknown properties rejected)
3. Validate cross-file references (duplicate project keys, connection refs)
4. Resolve environment secrets while mapping
5. Return a deep-frozen `NodeConfiguration`

A failed load never exposes a partial configuration. Errors may include file
names, property paths, project keys, connection IDs, and secret **names** — never
resolved secret values.
