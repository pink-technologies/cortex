// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { NodeConfigurationLoader } from '../../src/configuration/loaders/node-configuration-loader'
import { NodeConfigurationError } from '../../src/configuration/error/node-configuration-error'

async function createConfigurationDirectory(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'cortex-node-config-'))
}

async function writeToml(filePath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, contents, 'utf8')
}

function secretEnvironment(): NodeJS.ProcessEnv {
  return {
    ANTHROPIC_API_KEY: 'anthropic-secret',
    CURSOR_API_KEY: 'cursor-secret',
    GITHUB_TOKEN: 'github-secret',
    JIRA_API_TOKEN: 'jira-secret',
    OPENAI_API_KEY: 'openai-secret',
  }
}

const minimalNodeToml = `
schemaVersion = 1

[node]
name = "cortex-local"
version = "1.0.0"

[api]
baseUrl = "http://localhost:3000/api"
`

const minimalConnectionsToml = `
schemaVersion = 1

[[sourceControlConnections]]
id = "github-primary"
provider = "github"
token = { source = "environment", name = "GITHUB_TOKEN" }
`

async function writeMinimalConfiguration(
  directory: string,
  options: { readonly withProjectsDirectory?: boolean } = {},
): Promise<void> {
  await writeToml(path.join(directory, 'node.toml'), minimalNodeToml)
  await writeToml(path.join(directory, 'connections.toml'), minimalConnectionsToml)

  if (options.withProjectsDirectory !== false) {
    await mkdir(path.join(directory, 'projects'), { recursive: true })
  }
}

describe('NodeConfigurationLoader', () => {
  it('loads a valid configuration with every supported field', async () => {
    const directory = await createConfigurationDirectory()
    await writeToml(
      path.join(directory, 'node.toml'),
      `
schemaVersion = 1

[node]
name = "cortex-local"
version = "1.0.0"
pollingIntervalMilliseconds = 2500

[api]
baseUrl = "https://api.cortex.example/api/"

[jiraAutomation]
assigneeAccountId = "jira-account-id"
repoCustomFieldId = "customfield_10001"

[engines.cursor]
apiKey = { source = "environment", name = "CURSOR_API_KEY" }

[llm.openAI]
apiKey = { source = "environment", name = "OPENAI_API_KEY" }

[llm.anthropic]
apiKey = { source = "environment", name = "ANTHROPIC_API_KEY" }
`,
    )
    await writeToml(
      path.join(directory, 'connections.toml'),
      `
schemaVersion = 1

[[sourceControlConnections]]
id = "github-primary"
provider = "github"
apiBaseUrl = "https://api.github.com/"
token = { source = "environment", name = "GITHUB_TOKEN" }

[[jiraConnections]]
id = "jira-primary"
provider = "jira"
baseUrl = "https://example.atlassian.net/"
email = "automation@example.com"
apiToken = { source = "environment", name = "JIRA_API_TOKEN" }
`,
    )
    await writeToml(
      path.join(directory, 'projects', 'cortex.toml'),
      `
schemaVersion = 1
projectKey = "CORTEX"

[repository]
owner = "PinkTech"
name = "cortex"
cloneUrl = "https://github.com/PinkTech/cortex.git/"
defaultBranch = "develop"
sourceControlConnectionId = "github-primary"

[jira]
escalateAccountId = "jira-escalation-account"

[projectLead]
displayName = "Cortex Team"
email = "cortex@example.com"

[suites.unit]
executable = "pnpm"
arguments = ["test", "--filter", "cortex"]
workingDirectory = "."
timeoutMilliseconds = 600000

[areas.api]
aliases = ["backend"]
suiteKeys = ["unit"]
`,
    )

    const configuration = await new NodeConfigurationLoader(
      secretEnvironment(),
    ).loadFromRootDirectory(directory)

    expect(configuration).toMatchObject({
      apiBaseURL: 'https://api.cortex.example/api',
      cursorApiKey: 'cursor-secret',
      jiraAutomationAssigneeAccountId: 'jira-account-id',
      jiraRepoCustomFieldId: 'customfield_10001',
      nodeName: 'cortex-local',
      pollingIntervalMilliseconds: 2500,
      version: '1.0.0',
    })
    expect(configuration.sourceControlConnections[0]?.apiBaseUrl).toBe(
      'https://api.github.com',
    )
    expect(configuration.jiraConnections[0]?.baseUrl).toBe(
      'https://example.atlassian.net',
    )
    expect(configuration.jiraProjectRepos[0]?.cloneUrl).toBe(
      'https://github.com/PinkTech/cortex.git',
    )
    expect(configuration.jiraProjectRepos[0]?.suites?.unit).toEqual({
      arguments: ['test', '--filter', 'cortex'],
      executable: 'pnpm',
      timeoutMilliseconds: 600000,
      workingDirectory: '.',
    })
    expect(Object.isFrozen(configuration)).toBe(true)
    expect(Object.isFrozen(configuration.jiraProjectRepos[0]?.suites?.unit?.arguments)).toBe(
      true,
    )
  })

  it('loads a minimal configuration and applies defaults', async () => {
    const directory = await createConfigurationDirectory()
    await writeMinimalConfiguration(directory)

    const configuration = await new NodeConfigurationLoader(
      secretEnvironment(),
    ).loadFromRootDirectory(directory)

    expect(configuration.pollingIntervalMilliseconds).toBe(2000)
    expect(configuration.apiBaseURL).toBe('http://localhost:3000/api')
    expect(configuration.jiraProjectRepos).toEqual([])
  })

  it('loads project files in deterministic filename order', async () => {
    const directory = await createConfigurationDirectory()
    await writeMinimalConfiguration(directory)
    await writeToml(
      path.join(directory, 'projects', 'z-project.toml'),
      `
schemaVersion = 1
projectKey = "ZZZ"

[repository]
owner = "Org"
name = "z"
cloneUrl = "https://github.com/Org/z.git"
`,
    )
    await writeToml(
      path.join(directory, 'projects', 'a-project.toml'),
      `
schemaVersion = 1
projectKey = "AAA"

[repository]
owner = "Org"
name = "a"
cloneUrl = "https://github.com/Org/a.git"
`,
    )

    const configuration = await new NodeConfigurationLoader(
      secretEnvironment(),
    ).loadFromRootDirectory(directory)

    expect(configuration.jiraProjectRepos.map((project) => project.projectKey)).toEqual([
      'AAA',
      'ZZZ',
    ])
  })

  it('fails when required files or the projects directory are missing', async () => {
    const missingNode = await createConfigurationDirectory()
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(missingNode),
    ).rejects.toBeInstanceOf(NodeConfigurationError)

    const missingConnections = await createConfigurationDirectory()
    await writeToml(path.join(missingConnections, 'node.toml'), minimalNodeToml)
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(
        missingConnections,
      ),
    ).rejects.toBeInstanceOf(NodeConfigurationError)

    const missingProjects = await createConfigurationDirectory()
    await writeMinimalConfiguration(missingProjects, { withProjectsDirectory: false })
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(missingProjects),
    ).rejects.toBeInstanceOf(NodeConfigurationError)
  })

  it('rejects malformed TOML and unknown properties', async () => {
    const malformed = await createConfigurationDirectory()
    await writeToml(path.join(malformed, 'node.toml'), 'schemaVersion = [')
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(malformed),
    ).rejects.toThrow(/Malformed TOML/)

    const unknownProperty = await createConfigurationDirectory()
    await writeToml(
      path.join(unknownProperty, 'node.toml'),
      `
schemaVersion = 1
unexpected = true

[node]
name = "cortex-local"
version = "1.0.0"

[api]
baseUrl = "http://localhost:3000/api"
`,
    )
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(unknownProperty),
    ).rejects.toBeInstanceOf(NodeConfigurationError)
  })

  it('rejects duplicate connection IDs and project keys', async () => {
    const duplicateSourceControl = await createConfigurationDirectory()
    await writeToml(path.join(duplicateSourceControl, 'node.toml'), minimalNodeToml)
    await writeToml(
      path.join(duplicateSourceControl, 'connections.toml'),
      `
schemaVersion = 1

[[sourceControlConnections]]
id = "github-primary"
provider = "github"
token = { source = "environment", name = "GITHUB_TOKEN" }

[[sourceControlConnections]]
id = "github-primary"
provider = "github"
token = { source = "environment", name = "GITHUB_TOKEN" }
`,
    )
    await mkdir(path.join(duplicateSourceControl, 'projects'), { recursive: true })
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(
        duplicateSourceControl,
      ),
    ).rejects.toThrow(/Duplicate source-control connection id/)

    const duplicateJira = await createConfigurationDirectory()
    await writeToml(path.join(duplicateJira, 'node.toml'), minimalNodeToml)
    await writeToml(
      path.join(duplicateJira, 'connections.toml'),
      `
schemaVersion = 1

[[sourceControlConnections]]
id = "github-primary"
provider = "github"
token = { source = "environment", name = "GITHUB_TOKEN" }

[[jiraConnections]]
id = "jira-primary"
provider = "jira"
baseUrl = "https://example.atlassian.net"
email = "a@b.com"
apiToken = { source = "environment", name = "JIRA_API_TOKEN" }

[[jiraConnections]]
id = "jira-primary"
provider = "jira"
baseUrl = "https://example.atlassian.net"
email = "a@b.com"
apiToken = { source = "environment", name = "JIRA_API_TOKEN" }
`,
    )
    await mkdir(path.join(duplicateJira, 'projects'), { recursive: true })
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(duplicateJira),
    ).rejects.toThrow(/Duplicate Jira connection id/)

    const duplicateProjects = await createConfigurationDirectory()
    await writeMinimalConfiguration(duplicateProjects)
    for (const fileName of ['one.toml', 'two.toml']) {
      await writeToml(
        path.join(duplicateProjects, 'projects', fileName),
        `
schemaVersion = 1
projectKey = "DUP"

[repository]
owner = "Org"
name = "repo"
cloneUrl = "https://github.com/Org/repo.git"
`,
      )
    }
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(
        duplicateProjects,
      ),
    ).rejects.toThrow(/Duplicate key/)
  })

  it('rejects missing source-control references and missing suites', async () => {
    const missingConnection = await createConfigurationDirectory()
    await writeMinimalConfiguration(missingConnection)
    await writeToml(
      path.join(missingConnection, 'projects', 'a.toml'),
      `
schemaVersion = 1
projectKey = "AAA"

[repository]
owner = "Org"
name = "repo"
cloneUrl = "https://github.com/Org/repo.git"
sourceControlConnectionId = "missing-connection"
`,
    )
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(missingConnection),
    ).rejects.toThrow(/missing source-control connection/)

    const missingSuite = await createConfigurationDirectory()
    await writeMinimalConfiguration(missingSuite)
    await writeToml(
      path.join(missingSuite, 'projects', 'a.toml'),
      `
schemaVersion = 1
projectKey = "AAA"

[repository]
owner = "Org"
name = "repo"
cloneUrl = "https://github.com/Org/repo.git"

[suites.unit]
executable = "pnpm"
arguments = ["test"]

[areas.api]
suiteKeys = ["missing"]
`,
    )
    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(missingSuite),
    ).rejects.toThrow(/missing suite/)
  })

  it('rejects missing or blank environment secrets without leaking values', async () => {
    const directory = await createConfigurationDirectory()
    await writeToml(
      path.join(directory, 'node.toml'),
      `
schemaVersion = 1

[node]
name = "cortex-local"
version = "1.0.0"

[api]
baseUrl = "http://localhost:3000/api"

[engines.cursor]
apiKey = { source = "environment", name = "CURSOR_API_KEY" }
`,
    )
    await writeToml(path.join(directory, 'connections.toml'), minimalConnectionsToml)
    await mkdir(path.join(directory, 'projects'), { recursive: true })

    await expect(
      new NodeConfigurationLoader({ GITHUB_TOKEN: 'github-secret' }).loadFromRootDirectory(
        directory,
      ),
    ).rejects.toThrow(/CURSOR_API_KEY/)

    try {
      await new NodeConfigurationLoader({
        CURSOR_API_KEY: 'super-secret-value',
        GITHUB_TOKEN: '   ',
      }).loadFromRootDirectory(directory)
      throw new Error('expected configuration load to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(NodeConfigurationError)
      const message = error instanceof Error ? error.message : String(error)
      expect(message).toMatch(/GITHUB_TOKEN/)
      expect(message).not.toContain('super-secret-value')
    }
  })


  it('rejects inline secrets', async () => {
    const directory = await createConfigurationDirectory()
    await writeToml(path.join(directory, 'node.toml'), minimalNodeToml)
    await writeToml(
      path.join(directory, 'connections.toml'),
      `
schemaVersion = 1

[[sourceControlConnections]]
id = "github-primary"
provider = "github"
token = "inline-token"
`,
    )
    await mkdir(path.join(directory, 'projects'), { recursive: true })

    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(directory),
    ).rejects.toBeInstanceOf(NodeConfigurationError)
  })

  it('rejects a projects path that is not a directory', async () => {
    const directory = await createConfigurationDirectory()
    await writeToml(path.join(directory, 'node.toml'), minimalNodeToml)
    await writeToml(path.join(directory, 'connections.toml'), minimalConnectionsToml)
    await writeFile(path.join(directory, 'projects'), 'not-a-directory', 'utf8')

    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(directory),
    ).rejects.toBeInstanceOf(NodeConfigurationError)
  })

  it('rejects unsafe suite working directories', async () => {
    const directory = await createConfigurationDirectory()
    await writeMinimalConfiguration(directory)
    await writeToml(
      path.join(directory, 'projects', 'escape.toml'),
      `
schemaVersion = 1
projectKey = "ESC"

[repository]
owner = "Org"
name = "repo"
cloneUrl = "https://github.com/Org/repo.git"

[suites.unit]
executable = "pnpm"
workingDirectory = "../outside"
`,
    )

    await expect(
      new NodeConfigurationLoader(secretEnvironment()).loadFromRootDirectory(directory),
    ).rejects.toThrow(/workingDirectory/)
  })
})
