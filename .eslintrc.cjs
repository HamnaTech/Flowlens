module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
  rules: {
    // The codebase intentionally uses `any` for Prisma JSON metadata fields
    // and Express request augmentation (request.id) — these are deliberate
    // integration points with third-party/DB types, not type-safety gaps.
    '@typescript-eslint/no-explicit-any': 'off',
    // Catch-clause params like `catch (err)` are intentionally left unused in
    // several services (the error is deliberately swallowed/logged elsewhere).
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^(_|err)$' }],
  },
};
