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
  passWithNoTests: true,
  collectCoverage: true,
  collectCoverageFrom: [
    // Expand this list as each module gains a dedicated suite. Thresholds apply
    // only to collected files — aim for 100%, enforce ≥95%.
    '<rootDir>/src/**/*.ts',
  ],
  coveragePathIgnorePatterns: [
    '/index\\.ts$',
    '/runtime/',
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
