'use strict'

const test = require('ava')
const { buildApp, jsonLogger } = require('./_helper')

test('should deal GET request', async (t) => {
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

  const query = `query {
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
    counter
  }`

  const response = await app.inject({
    method: 'GET',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    query: { query }
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

test('should log the whole request when operationName is set', async (t) => {
  t.plan(3)

  const query = `
  query boom($num: Int!) {
    a: add(x: $num, y: $num)
    b: add(x: $num, y: $num)
  }
  query baam($num: Int!, $bin: Int!) {
    c: add(x: $num, y: $bin)
    d: add(x: $num, y: $bin)
  }
  `

  const stream = jsonLogger(
    line => {
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.graphql, {
        queries: ['add', 'add', 'add', 'add'],
        operationName: 'baam',
        body: query,
        variables: '{"num":2,"bin":3}'
      })
    })

  const app = buildApp(t, { stream }, {
    logBody: true,
    logVariables: true
  })

  const response = await app.inject({
    method: 'GET',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    query: {
      query,
      operationName: 'baam',
      variables: JSON.stringify({ num: 2, bin: 3 })
    }
  })

  t.deepEqual(response.json(), { data: { c: 5, d: 5 } })
})
