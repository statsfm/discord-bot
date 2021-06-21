/* eslint-disable import/no-commonjs */
module.exports = {
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: ['./tsconfig.json']
  },
  extends: [
    '@tribecamp/base',
    '@tribecamp/typescript',
    'prettier'
    // 'prettier/@typescript-eslint',
    // 'prettier/unicorn'
  ],
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'no-console': 'off'
  }
};
