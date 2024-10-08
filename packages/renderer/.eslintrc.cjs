/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    node: false,
  },
  extends: ['@dcl/eslint-config/dapps'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.cjs', '*.js'],
      rules: {
        'import/default': 'off',
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'function',
            format: ['PascalCase', 'camelCase'],
          },
        ],
        'prettier/prettier': [
          'error',
          {
            semi: true,
            trailingComma: 'all',
          },
        ],
      },
    },
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    project: ['tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: __dirname + '/tsconfig.json',
      },
    },
  },
  ignorePatterns: ['dist'],
};
