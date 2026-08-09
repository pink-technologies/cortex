// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Test } from '@nestjs/testing'
import { API_CONFIGURATION, ApiConfigurationModule, createApiConfiguration } from '../../src/configuration'

describe('ApiConfigurationModule', () => {
  const previousDatabaseUrl = process.env.DATABASE_URL

  afterEach(() => {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl
    }
  })

  it('provides a frozen configuration when DATABASE_URL is valid', async () => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/cortex'

    const module = await Test.createTestingModule({
      imports: [ApiConfigurationModule],
    }).compile()

    const configuration = module.get(API_CONFIGURATION)

    expect(configuration).toEqual(createApiConfiguration())
    expect(Object.isFrozen(configuration)).toBe(true)

    await module.close()
  })

  it('fails module initialization when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL

    await expect(
      Test.createTestingModule({
        imports: [ApiConfigurationModule],
      }).compile(),
    ).rejects.toThrow(/Invalid Cortex API configuration/)
  })
})
