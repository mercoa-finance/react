/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  modulePathIgnorePatterns: ['<rootDir>/examples/', '<rootDir>/docs/'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: 'commonjs',
          moduleResolution: 'node',
          strict: true,
          skipLibCheck: true,
        },
      },
    ],
  },
}
