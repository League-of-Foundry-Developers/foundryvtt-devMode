module.exports = {
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },

  env: {
    jquery: true,
    browser: true,
    es2020: true,
  },

  parser: 'babel-eslint',

  extends: ['eslint:recommended', '@typhonjs-fvtt/eslint-config-foundry.js/0.8.0', 'plugin:prettier/recommended'],

  plugins: [],

  rules: {
    // Specify any specific ESLint rules.
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true,
      },
    ],
  },

  overrides: [
    {
      files: ['./*.js'],
      env: {
        node: true,
      },
    },
  ],
};
