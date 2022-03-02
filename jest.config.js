/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
  collectCoverage: true,
};