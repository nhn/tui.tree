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
    node: true
  },
  globals: {
    loadFixtures: true
  }
};
