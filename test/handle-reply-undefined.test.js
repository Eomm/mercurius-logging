'use strict'

const test = require('ava')
const { buildApp, jsonLogger } = require('./_helper')

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

test('should log when using graphql mercurius decorator providing reply object inside context', async (t) => {
  t.plan(4)

  const stream = jsonLogger(
    line => {
      t.is(line.req, undefined)
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.graphql, {
        queries: ['add', 'add', 'echo', 'counter']
      })
    })

  const app = buildApp(t, { stream })

  app.get('/custom-endpoint', async function (_, reply) {
    const query = `query {
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
    counter
  }`
    return app.graphql(query, { reply })
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
