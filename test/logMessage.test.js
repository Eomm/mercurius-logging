'use strict'

const { test } = require('node:test')
const { buildApp, jsonLogger } = require('./_helper')

test('should log without msg when logMessage is undefined', async (t) => {
  t.plan(5)

  const stream = jsonLogger(
    line => {
      t.assert.strictEqual(line.req, undefined)
      t.assert.strictEqual(line.reqId, 'req-1')
      t.assert.deepStrictEqual(line.msg, undefined)
      t.assert.deepStrictEqual(line.graphql, {
        operationName: 'logMe',
        queries: ['add', 'add', 'echo', 'counter']
      })
    })

  const app = buildApp(t, { stream })

  const query = `query logMe{
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
    counter
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })
  t.assert.deepStrictEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})

test('should log without msg when logMessage is\'nt a valid function', async (t) => {
  t.plan(5)

  const stream = jsonLogger(
    line => {
      t.assert.strictEqual(line.req, undefined)
      t.assert.strictEqual(line.reqId, 'req-1')
      t.assert.deepStrictEqual(line.msg, undefined)
      t.assert.deepStrictEqual(line.graphql, {
        operationName: 'logMe',
        queries: ['add', 'add', 'echo', 'counter']
      })
    })

  const app = buildApp(t, { stream }, { logMessage: 1234 })

  const query = `query logMe{
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
    counter
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })
  t.assert.deepStrictEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})

test('should log without msg using a logMessage function returning an undefined value', async (t) => {
  t.plan(5)

  const customLogMessage = (context) => undefined

  const stream = jsonLogger(
    line => {
      t.assert.strictEqual(line.req, undefined)
      t.assert.strictEqual(line.reqId, 'req-1')
      t.assert.deepStrictEqual(line.msg, undefined)
      t.assert.deepStrictEqual(line.graphql, {
        operationName: 'logMe',
        queries: ['add', 'add', 'echo', 'counter']
      })
    })

  const app = buildApp(t, { stream }, { logMessage: customLogMessage })

  const query = `query logMe{
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
    counter
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })
  t.assert.deepStrictEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})

test('should log without msg using a logMessage function throwing an error', async (t) => {
  t.plan(5)

  const customLogMessage = (context) => { throw new Error() }

  const stream = jsonLogger(
    line => {
      t.assert.strictEqual(line.req, undefined)
      t.assert.strictEqual(line.reqId, 'req-1')
      t.assert.deepStrictEqual(line.msg, undefined)
      t.assert.deepStrictEqual(line.graphql, {
        operationName: 'logMe',
        queries: ['add', 'add', 'echo', 'counter']
      })
    })

  const app = buildApp(t, { stream }, { logMessage: customLogMessage })

  const query = `query logMe{
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
    counter
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })
  t.assert.deepStrictEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})

test('should log with msg using a logMessage function returning a string', async (t) => {
  t.plan(5)

  const customLogMessage = (context) => `This is a request made with method ${context.reply.request.method}`

  const stream = jsonLogger(
    line => {
      t.assert.strictEqual(line.req, undefined)
      t.assert.strictEqual(line.reqId, 'req-1')
      t.assert.deepStrictEqual(line.msg, 'This is a request made with method POST')
      t.assert.deepStrictEqual(line.graphql, {
        operationName: 'logMe',
        queries: ['add', 'add', 'echo', 'counter']
      })
    })

  const app = buildApp(t, { stream }, { logMessage: customLogMessage })

  const query = `query logMe{
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
    counter
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })
  t.assert.deepStrictEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})

test('should log with msg using a logMessage function returning an array', async (t) => {
  t.plan(5)

  const customLogMessage = (context) => [`This is a request made with method ${context.reply.request.method} by foo%s`, 'bar']

  const stream = jsonLogger(
    line => {
      t.assert.strictEqual(line.req, undefined)
      t.assert.strictEqual(line.reqId, 'req-1')
      t.assert.deepStrictEqual(line.msg, 'This is a request made with method POST by foobar')
      t.assert.deepStrictEqual(line.graphql, {
        operationName: 'logMe',
        queries: ['add', 'add', 'echo', 'counter']
      })
    })

  const app = buildApp(t, { stream }, { logMessage: customLogMessage })

  const query = `query logMe{
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
    counter
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })
  t.assert.deepStrictEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})
