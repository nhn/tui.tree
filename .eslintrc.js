module.exports = {
  extends: ['tui', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 3,
    sourceType: 'module'
  },
  env: {
    commonjs: true,
    jasmine: true,
    amd: true,
    node: true,
    jquery: true
  },
  globals: {
    loadFixtures: true
  },
  rules: {
    'lines-around-directive': 0,
    'object-property-newline': ['error', { allowMultiplePropertiesPerLine: true }]
  }
};
