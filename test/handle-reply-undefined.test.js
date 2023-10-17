'use strict'

const test = require('ava')
const { buildApp } = require('./_helper')

test('should handle without logging when context.reply is undefined', async (t) => {
  t.plan(1)

  const app = buildApp(t)

  app.get('/custom-endpoint', async function () {
    const query = `query {
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
    counter
  }`
    return app.graphql(query)
  })

  const response = await app.inject({
    method: 'GET',
    headers: { 'content-type': 'application/json' },
    url: '/custom-endpoint'
  })

  t.deepEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})
