// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { createNodeConfiguration } from '../../src/configuration/node-configuration'

const validEnvironment = {
  CORTEX_API_URL: 'https://api.cortex.example',
  CORTEX_NODE_ID: 'node-1',
  CORTEX_NODE_NAME: 'worker',
  CORTEX_NODE_VERSION: '1.0.0',
} satisfies NodeJS.ProcessEnv

describe('createNodeConfiguration', () => {
  describe('required Node values', () => {
    it('creates a configuration from valid environment variables', () => {
      const configuration = createNodeConfiguration(validEnvironment)

      expect(configuration.apiURL).toBe('https://api.cortex.example')
      expect(configuration.nodeId).toBe('node-1')
      expect(configuration.nodeName).toBe('worker')
      expect(configuration.version).toBe('1.0.0')
    })

    it('reads from process.env when no environment argument is provided', () => {
      const previous = {
        CORTEX_API_URL: process.env.CORTEX_API_URL,
        CORTEX_JIRA_CONNECTIONS: process.env.CORTEX_JIRA_CONNECTIONS,
        CORTEX_JIRA_PROJECT_REPOS: process.env.CORTEX_JIRA_PROJECT_REPOS,
        CORTEX_NODE_ID: process.env.CORTEX_NODE_ID,
        CORTEX_NODE_NAME: process.env.CORTEX_NODE_NAME,
        CORTEX_NODE_VERSION: process.env.CORTEX_NODE_VERSION,
        CORTEX_SC_CONNECTIONS: process.env.CORTEX_SC_CONNECTIONS,
      }

      process.env.CORTEX_API_URL = 'https://api.cortex.example'
      delete process.env.CORTEX_JIRA_CONNECTIONS
      delete process.env.CORTEX_JIRA_PROJECT_REPOS
      delete process.env.CORTEX_SC_CONNECTIONS
      process.env.CORTEX_NODE_ID = 'node-1'
      process.env.CORTEX_NODE_NAME = 'worker'
      process.env.CORTEX_NODE_VERSION = '1.0.0'

      try {
        const configuration = createNodeConfiguration()

        expect(configuration.nodeId).toBe('node-1')
      } finally {
        for (const [key, value] of Object.entries(previous)) {
          if (value === undefined) {
            delete process.env[key]
          } else {
            process.env[key] = value
          }
        }
      }
    })

    it('maps raw environment names to application property names', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        CORTEX_POLL_INTERVAL_MS: '3500',
      })

      expect(configuration).toEqual(
        expect.objectContaining({
          apiURL: 'https://api.cortex.example',
          nodeId: 'node-1',
          nodeName: 'worker',
          pollingIntervalMilliseconds: 3500,
          version: '1.0.0',
        }),
      )
    })

    it('trims string environment values', () => {
      const configuration = createNodeConfiguration({
        CORTEX_API_URL: '  https://api.cortex.example  ',
        CORTEX_NODE_ID: '  node-1  ',
        CORTEX_NODE_NAME: '  worker  ',
        CORTEX_NODE_VERSION: '  1.0.0  ',
      })

      expect(configuration.apiURL).toBe('https://api.cortex.example')
      expect(configuration.nodeId).toBe('node-1')
      expect(configuration.nodeName).toBe('worker')
      expect(configuration.version).toBe('1.0.0')
    })
  })

  describe('polling interval', () => {
    it('uses 2000 milliseconds when the polling interval is omitted', () => {
      const configuration = createNodeConfiguration(validEnvironment)

      expect(configuration.pollingIntervalMilliseconds).toBe(2_000)
    })

    it('coerces the polling interval from an environment string', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        CORTEX_POLL_INTERVAL_MS: '4500',
      })

      expect(configuration.pollingIntervalMilliseconds).toBe(4500)
    })

    it('rejects a zero polling interval', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_POLL_INTERVAL_MS: '0',
        }),
      ).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects a negative polling interval', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_POLL_INTERVAL_MS: '-10',
        }),
      ).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects a non-numeric polling interval', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_POLL_INTERVAL_MS: 'fast',
        }),
      ).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects a non-integer polling interval', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_POLL_INTERVAL_MS: '12.5',
        }),
      ).toThrow(/Invalid Cortex Node configuration/)
    })
  })

  describe('required-value validation', () => {
    it('rejects a missing Cortex API URL', () => {
      const { CORTEX_API_URL: _, ...environment } = validEnvironment

      expect(() => createNodeConfiguration(environment)).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects an invalid Cortex API URL', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_API_URL: 'not-a-url',
        }),
      ).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects a missing node identifier', () => {
      const { CORTEX_NODE_ID: _, ...environment } = validEnvironment

      expect(() => createNodeConfiguration(environment)).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects a blank node identifier', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_NODE_ID: '   ',
        }),
      ).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects a missing node name', () => {
      const { CORTEX_NODE_NAME: _, ...environment } = validEnvironment

      expect(() => createNodeConfiguration(environment)).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects a blank node name', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_NODE_NAME: '   ',
        }),
      ).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects a missing node version', () => {
      const { CORTEX_NODE_VERSION: _, ...environment } = validEnvironment

      expect(() => createNodeConfiguration(environment)).toThrow(/Invalid Cortex Node configuration/)
    })

    it('rejects a blank node version', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_NODE_VERSION: '   ',
        }),
      ).toThrow(/Invalid Cortex Node configuration/)
    })
  })

  describe('provider configurations', () => {
    it('creates the OpenAI configuration when OPENAI_API_KEY is present', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        OPENAI_API_KEY: 'openai-key',
      })

      expect(configuration.llm.openAI).toEqual({ apiKey: 'openai-key' })
      expect(configuration.llm.anthropic).toBeUndefined()
    })

    it('creates the Anthropic configuration when ANTHROPIC_API_KEY is present', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        ANTHROPIC_API_KEY: 'anthropic-key',
      })

      expect(configuration.llm.anthropic).toEqual({ apiKey: 'anthropic-key' })
      expect(configuration.llm.openAI).toBeUndefined()
    })

    it('creates both provider configurations when both API keys are present', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        ANTHROPIC_API_KEY: 'anthropic-key',
        OPENAI_API_KEY: 'openai-key',
      })

      expect(configuration.llm.openAI).toEqual({ apiKey: 'openai-key' })
      expect(configuration.llm.anthropic).toEqual({ apiKey: 'anthropic-key' })
    })

    it('allows the Node to start without any LLM provider configured', () => {
      const configuration = createNodeConfiguration(validEnvironment)

      expect(configuration.llm.openAI).toBeUndefined()
      expect(configuration.llm.anthropic).toBeUndefined()
    })

    it('omits the OpenAI configuration when OPENAI_API_KEY is absent', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        ANTHROPIC_API_KEY: 'anthropic-key',
      })

      expect(configuration.llm.openAI).toBeUndefined()
    })

    it('omits the Anthropic configuration when ANTHROPIC_API_KEY is absent', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        OPENAI_API_KEY: 'openai-key',
      })

      expect(configuration.llm.anthropic).toBeUndefined()
    })

    it('trims provider API keys', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        ANTHROPIC_API_KEY: '  anthropic-key  ',
        OPENAI_API_KEY: '  openai-key  ',
      })

      expect(configuration.llm.openAI?.apiKey).toBe('openai-key')
      expect(configuration.llm.anthropic?.apiKey).toBe('anthropic-key')
    })

    it('treats a blank OpenAI API key as unset', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        OPENAI_API_KEY: '   ',
      })

      expect(configuration.llm.openAI).toBeUndefined()
    })

    it('treats a blank Anthropic API key as unset', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        ANTHROPIC_API_KEY: '   ',
      })

      expect(configuration.llm.anthropic).toBeUndefined()
    })
  })

  describe('Cursor and source-control configuration', () => {
    it('includes an optional Cursor API key', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        CURSOR_API_KEY: 'cursor-key',
      })

      expect(configuration.cursorApiKey).toBe('cursor-key')
    })

    it('treats a blank Cursor API key as unset', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        CURSOR_API_KEY: '   ',
      })

      expect(configuration.cursorApiKey).toBeUndefined()
    })

    it('defaults source-control connections to an empty list', () => {
      const configuration = createNodeConfiguration(validEnvironment)

      expect(configuration.sourceControlConnections).toEqual([])
    })

    it('treats blank source-control connections as an empty list', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        CORTEX_SC_CONNECTIONS: '   ',
      })

      expect(configuration.sourceControlConnections).toEqual([])
    })

    it('parses source-control connections from JSON', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        CORTEX_SC_CONNECTIONS: JSON.stringify([
          {
            apiBaseUrl: 'https://api.github.com',
            id: 'github-main',
            provider: 'github',
            token: 'ghp_test',
          },
        ]),
      })

      expect(configuration.sourceControlConnections).toEqual([
        {
          apiBaseUrl: 'https://api.github.com',
          id: 'github-main',
          provider: 'github',
          token: 'ghp_test',
        },
      ])
    })

    it('rejects invalid source-control connection JSON', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_SC_CONNECTIONS: '{',
        }),
      ).toThrow(/CORTEX_SC_CONNECTIONS must be valid JSON/)
    })

    it('rejects source-control connections that fail schema validation', () => {
      expect(() =>
        createNodeConfiguration({
          ...validEnvironment,
          CORTEX_SC_CONNECTIONS: JSON.stringify([
            {
              id: 'github-main',
              provider: 'gitlab',
              token: 'token',
            },
          ]),
        }),
      ).toThrow(/Invalid CORTEX_SC_CONNECTIONS/)
    })
  })

  describe('Jira configuration', () => {
    it('defaults Jira connections and project repos to empty lists', () => {
      const configuration = createNodeConfiguration(validEnvironment)

      expect(configuration.jiraConnections).toEqual([])
      expect(configuration.jiraProjectRepos).toEqual([])
    })

    it('parses Jira connections and project repos from JSON', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        CORTEX_JIRA_CONNECTIONS: JSON.stringify([
          {
            apiToken: 'token',
            baseUrl: 'https://example.atlassian.net/',
            email: 'bot@example.com',
            id: 'jira-main',
            provider: 'jira',
          },
        ]),
        CORTEX_JIRA_PROJECT_REPOS: JSON.stringify([
          {
            cloneUrl: 'https://github.com/acme/app.git',
            name: 'app',
            owner: 'acme',
            projectKey: 'JC',
            projectLead: {
              displayName: 'Jorge',
              email: 'jorge@pink-tech.io',
            },
            areas: {
              App: {
                aliases: ['TruVideoApp'],
                suiteKeys: ['TruVideoSdkCore'],
              },
            },
            suites: {
              TruVideoSdkCore: {
                command: 'xcodebuild test -scheme TruVideoSdkCore',
              },
              TruVideoSdkCamera: {
                command: 'xcodebuild test -scheme TruVideoSdkCamera',
              },
            },
            unitTestCommand: 'npm test',
          },
        ]),
        JIRA_AUTOMATION_ASSIGNEE_ACCOUNT_ID: 'automation',
      })

      expect(configuration.jiraConnections).toEqual([
        {
          apiToken: 'token',
          baseUrl: 'https://example.atlassian.net',
          email: 'bot@example.com',
          id: 'jira-main',
          provider: 'jira',
        },
      ])
      expect(configuration.jiraProjectRepos[0]).toMatchObject({
        areas: {
          App: {
            aliases: ['TruVideoApp'],
            suiteKeys: ['TruVideoSdkCore'],
          },
        },
        defaultBranch: 'main',
        projectKey: 'JC',
        projectLead: {
          displayName: 'Jorge',
          email: 'jorge@pink-tech.io',
        },
        suites: {
          TruVideoSdkCamera: {
            command: 'xcodebuild test -scheme TruVideoSdkCamera',
          },
          TruVideoSdkCore: {
            command: 'xcodebuild test -scheme TruVideoSdkCore',
          },
        },
        unitTestCommand: 'npm test',
      })
      expect(configuration.jiraAutomationAssigneeAccountId).toBe('automation')
    })
  })

  describe('immutability', () => {
    it('freezes the root Node configuration', () => {
      const configuration = createNodeConfiguration(validEnvironment)

      expect(Object.isFrozen(configuration)).toBe(true)
    })

    it('freezes the LLM configuration', () => {
      const configuration = createNodeConfiguration(validEnvironment)

      expect(Object.isFrozen(configuration.llm)).toBe(true)
    })

    it('freezes the OpenAI configuration when present', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        OPENAI_API_KEY: 'openai-key',
      })

      expect(Object.isFrozen(configuration.llm.openAI)).toBe(true)
    })

    it('freezes the Anthropic configuration when present', () => {
      const configuration = createNodeConfiguration({
        ...validEnvironment,
        ANTHROPIC_API_KEY: 'anthropic-key',
      })

      expect(Object.isFrozen(configuration.llm.anthropic)).toBe(true)
    })
  })
})
