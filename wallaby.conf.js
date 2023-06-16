module.exports = function () {
  return {
    files: [
      'index.js'
    ],

    tests: [
      'test/**/*.test.js'
    ],
    testFramework: 'ava',
    env: {
      type: 'node',
      runner: 'node'
    }
  }
}
