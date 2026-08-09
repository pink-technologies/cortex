/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/test'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
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
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/execution/agent/agent-execute-job-payload.ts',
    '<rootDir>/src/execution/agent/agent-execute-job-result.ts',
    '<rootDir>/src/execution/jira/create-jira-triage-job-request.ts',
    '<rootDir>/src/execution/jira/jira-triage-job-kind.ts',
    '<rootDir>/src/execution/jira/jira-triage-job-payload.ts',
    '<rootDir>/src/execution/jira/jira-triage-job-result.ts',
    '<rootDir>/src/execution/job/complete-execution-job-request.ts',
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
