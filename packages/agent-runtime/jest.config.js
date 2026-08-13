/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/test'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
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
  passWithNoTests: true,
  collectCoverage: true,
  collectCoverageFrom: [
    // Expand this list as each module gains a dedicated suite. Thresholds apply
    // only to collected files — aim for 100%, enforce ≥95%.
    '<rootDir>/src/capabilities/**/*.ts',
    '<rootDir>/src/execution/scope/error/error.ts',
    '<rootDir>/src/execution/scope/capability-agent-execution-scope-resolver.ts',
    '<rootDir>/src/execution/scope/default-agent-execution-scope-resolver.ts',
    '<rootDir>/src/kernel/**/*.ts',
    '<rootDir>/src/registry/keyed-registry.ts',
    '<rootDir>/src/skills/**/*.ts',
    '<rootDir>/src/tools/execution/agent-tool-executor.ts',
    '<rootDir>/src/tools/execution/agent-tool-result-content-mapper.ts',
    '<rootDir>/src/tools/resolver/agent-tool-availability-resolver.ts',
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
