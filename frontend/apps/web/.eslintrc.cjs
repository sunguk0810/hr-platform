module.exports = {
  root: true,
  extends: ['@hr-platform/eslint-config/react'],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'postcss.config.js',
    'tailwind.config.ts',
    'vite.config.ts',
    'vitest.config.ts',
    'playwright.config.ts',
  ],
};
