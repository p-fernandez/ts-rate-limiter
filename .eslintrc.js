module.exports = {
  root: true,
  extends: [
    'airbnb-typescript',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:perfectionist/recommended-natural',
  ],
  ignorePatterns: ['.eslintrc.js', '*.js'],
  plugins: ['import', 'perfectionist', '@typescript-eslint', 'prettier'],
  parser: '@typescript-eslint/parser',
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
  },
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2020,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  rules: {
    'react/jsx-filename-extension': [0],
  },
};
