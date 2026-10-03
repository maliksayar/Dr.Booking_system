const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'node',
};

module.exports = createJestConfig(customJestConfig);
