// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { createApiConfiguration } from '../../src/configuration/api-configuration'

const validEnvironment = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/cortex',
} satisfies NodeJS.ProcessEnv

describe('createApiConfiguration', () => {
  describe('required API values', () => {
    it('creates a configuration from a valid DATABASE_URL', () => {
      const configuration = createApiConfiguration(validEnvironment)

      expect(configuration.databaseURL).toBe('postgresql://postgres:postgres@localhost:5432/cortex')
      expect(configuration.port).toBe(3000)
      expect(configuration.redisURL).toBe('redis://localhost:6379')
    })

    it('rejects a missing DATABASE_URL', () => {
      expect(() => createApiConfiguration({})).toThrow(/Invalid Cortex API configuration/)
    })

    it('rejects an invalid DATABASE_URL', () => {
      expect(() =>
        createApiConfiguration({
          DATABASE_URL: 'not-a-url',
        }),
      ).toThrow(/Invalid Cortex API configuration/)
    })

    it('trims DATABASE_URL', () => {
      const configuration = createApiConfiguration({
        DATABASE_URL: '  postgresql://postgres:postgres@localhost:5432/cortex  ',
      })

      expect(configuration.databaseURL).toBe('postgresql://postgres:postgres@localhost:5432/cortex')
    })
  })

  describe('optional values', () => {
    it('coerces PORT from an environment string', () => {
      const configuration = createApiConfiguration({
        ...validEnvironment,
        PORT: '4100',
      })

      expect(configuration.port).toBe(4100)
    })

    it('rejects a non-positive PORT', () => {
      expect(() =>
        createApiConfiguration({
          ...validEnvironment,
          PORT: '0',
        }),
      ).toThrow(/Invalid Cortex API configuration/)
    })

    it('treats blank REDIS_URL as the local default', () => {
      const configuration = createApiConfiguration({
        ...validEnvironment,
        REDIS_URL: '   ',
      })

      expect(configuration.redisURL).toBe('redis://localhost:6379')
    })

    it('rejects an invalid REDIS_URL', () => {
      expect(() =>
        createApiConfiguration({
          ...validEnvironment,
          REDIS_URL: 'not-a-url',
        }),
      ).toThrow(/Invalid Cortex API configuration/)
    })

    it('maps optional webhook and operator secrets when present', () => {
      const configuration = createApiConfiguration({
        ...validEnvironment,
        GITHUB_WEBHOOK_SECRET: ' gh-secret ',
        GITHUB_DEFAULT_CONNECTION_ID: 'github-main',
        JIRA_WEBHOOK_SECRET: 'jira-secret',
        WORKFLOW_OPERATOR_TOKEN: 'operator-token',
      })

      expect(configuration.githubWebhookSecret).toBe('gh-secret')
      expect(configuration.githubDefaultConnectionId).toBe('github-main')
      expect(configuration.jiraWebhookSecret).toBe('jira-secret')
      expect(configuration.workflowOperatorToken).toBe('operator-token')
    })

    it('returns a frozen configuration object', () => {
      const configuration = createApiConfiguration(validEnvironment)

      expect(Object.isFrozen(configuration)).toBe(true)
    })
  })
})
