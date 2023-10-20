'use strict'

const test = require('ava')
const { buildApp, jsonLogger } = require('./_helper')

test('should log without msg when logMessage is undefined', async (t) => {
  t.plan(5)

  const stream = jsonLogger(
    line => {
      t.is(line.req, undefined)
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.msg, undefined)
      t.deepEqual(line.graphql, {
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
  t.deepEqual(response.json(), {
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
      t.is(line.req, undefined)
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.msg, undefined)
      t.deepEqual(line.graphql, {
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
  t.deepEqual(response.json(), {
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
      t.is(line.req, undefined)
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.msg, undefined)
      t.deepEqual(line.graphql, {
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
  t.deepEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})

test('should log without msg using a logMessage function returning an array containing non string value', async (t) => {
  t.plan(5)

  const customLogMessage = (context) => ['foobar', 3]

  const stream = jsonLogger(
    line => {
      t.is(line.req, undefined)
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.msg, undefined)
      t.deepEqual(line.graphql, {
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
  t.deepEqual(response.json(), {
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
      t.is(line.req, undefined)
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.msg, undefined)
      t.deepEqual(line.graphql, {
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
  t.deepEqual(response.json(), {
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
      t.is(line.req, undefined)
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.msg, 'This is a request made with method POST')
      t.deepEqual(line.graphql, {
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
  t.deepEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})

test('should log with msg using a logMessage function returning a string array', async (t) => {
  t.plan(5)

  const customLogMessage = (context) => [`This is a request made with method ${context.reply.request.method} by foo%s`, 'bar']

  const stream = jsonLogger(
    line => {
      t.is(line.req, undefined)
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.msg, 'This is a request made with method POST by foobar')
      t.deepEqual(line.graphql, {
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
  t.deepEqual(response.json(), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})
