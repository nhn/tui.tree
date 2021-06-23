module.exports = {
  extends: ['tui', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 3,
    sourceType: 'module'
  },
  env: {
    commonjs: true,
    jest: true,
    amd: true,
    node: true
  },
  globals: {
    loadFixtures: true,
    xhrMock: true
  }
};
