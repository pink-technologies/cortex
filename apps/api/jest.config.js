/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/test'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@integrations/(.*)$': '<rootDir>/src/integrations/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  testEnvironment: 'node',
  clearMocks: true,
  // Execution-job e2e suites share one Postgres database; parallel workers race on claim.
  maxWorkers: 1,
  coverageProvider: 'v8',
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/configuration/api-configuration.ts',
    '<rootDir>/src/configuration/api-configuration.module.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
}
