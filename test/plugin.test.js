'use strict'

const test = require('ava')
const { buildApp, jsonLogger } = require('./_helper')

test('should log every query', async (t) => {
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

test('should log batched queries when logBody is false', async (t) => {
  t.plan(6)
  const stream = jsonLogger(
    (line) => {
      t.is(line.reqId, 'req-1')
      switch (line.graphql?.operationName) {
        case 'QueryOne':
          t.deepEqual(line.graphql, {
            operationName: 'QueryOne',
            queries: ['counter'],
            variables: null
          })
          break
        case 'QueryTwo':
          t.deepEqual(line.graphql, {
            operationName: 'QueryTwo',
            queries: ['add'],
            variables: { y: 2 }
          })
          break
      }
    })

  const app = buildApp(t, { stream }, { logVariables: true })

  const query1 = `query QueryOne {
    counter
  }`

  const query2 = `query QueryTwo($y: Int!) {
    four: add(x: 2, y: $y)
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify([
      { operationName: 'QueryOne', query: query1 },
      { operationName: 'QueryTwo', query: query2, variables: { y: 2 } },
      { operationName: 'BadQuery', query: 'query DoubleQuery ($x: Int!) {---' } // Malformed query
    ])
  })
  t.deepEqual(response.json(), [
    {
      data: {
        counter: 0
      }
    },
    {
      data: {
        four: 4
      }
    },
    {
      data: null,
      errors: [
        {
          locations: [{ column: 32, line: 1 }],
          message: 'Syntax Error: Invalid number, expected digit but got: "-".'
        }
      ]
    }
  ])
})

test('should log batched queries when logBody is true', async (t) => {
  t.plan(6)
  const stream = jsonLogger(
    (line) => {
      t.is(line.reqId, 'req-1')
      switch (line.graphql?.operationName) {
        case 'QueryOne':
          t.deepEqual(line.graphql, {
            operationName: 'QueryOne',
            queries: ['counter'],
            body: 'query QueryOne {\n    counter\n  }',
            variables: null
          })
          break
        case 'QueryTwo':
          t.deepEqual(line.graphql, {
            operationName: 'QueryTwo',
            queries: ['add'],
            body: 'query QueryTwo($y: Int!) {\n    four: add(x: 2, y: $y)\n  }',
            variables: { y: 2 }
          })
          break
      }
    })

  const app = buildApp(t, { stream }, { logVariables: true, logBody: true })

  const query1 = `query QueryOne {
    counter
  }`

  const query2 = `query QueryTwo($y: Int!) {
    four: add(x: 2, y: $y)
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify([
      { operationName: 'QueryOne', query: query1 },
      { operationName: 'QueryTwo', query: query2, variables: { y: 2 } },
      { operationName: 'BadQuery', query: 'query DoubleQuery ($x: Int!) {---' } // Malformed query
    ])
  })
  t.deepEqual(response.json(), [
    {
      data: {
        counter: 0
      }
    },
    {
      data: {
        four: 4
      }
    },
    {
      data: null,
      errors: [
        {
          locations: [{ column: 32, line: 1 }],
          message: 'Syntax Error: Invalid number, expected digit but got: "-".'
        }
      ]
    }
  ])
})

test('should log batched queries when logBody is a custom function', async (t) => {
  t.plan(6)
  const stream = jsonLogger(
    (line) => {
      t.is(line.reqId, 'req-1')
      switch (line.graphql?.operationName) {
        case 'QueryOne':
          t.deepEqual(line.graphql, {
            operationName: 'QueryOne',
            queries: ['counter'],
            variables: null
          })
          break
        case 'QueryTwo':
          t.deepEqual(line.graphql, {
            operationName: 'QueryTwo',
            queries: ['add'],
            body: 'query QueryTwo($y: Int!) {\n    four: add(x: 2, y: $y)\n  }',
            variables: { y: 2 }
          })
          break
      }
    })

  const app = buildApp(t, { stream }, {
    logVariables: true,
    logBody: (context, body) => {
      const currentBody = body ?? context.reply.request.body
      return !!currentBody.query.match(/QueryTwo/)
    }
  })

  const query1 = `query QueryOne {
    counter
  }`

  const query2 = `query QueryTwo($y: Int!) {
    four: add(x: 2, y: $y)
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify([
      { operationName: 'QueryOne', query: query1 },
      { operationName: 'QueryTwo', query: query2, variables: { y: 2 } },
      { operationName: 'BadQuery', query: 'query DoubleQuery ($x: Int!) {---' } // Malformed query
    ])
  })
  t.deepEqual(response.json(), [
    {
      data: {
        counter: 0
      }
    },
    {
      data: {
        four: 4
      }
    },
    {
      data: null,
      errors: [
        {
          locations: [{ column: 32, line: 1 }],
          message: 'Syntax Error: Invalid number, expected digit but got: "-".'
        }
      ]
    }
  ])
})

test('should log prepend the alias', async (t) => {
  t.plan(3)

  const stream = jsonLogger(
    line => {
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.graphql, {
        queries: ['four:add', 'six:add', 'echo', 'counter']
      })
    })

  const app = buildApp(t, { stream }, { prependAlias: true })

  const query = `query {
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

test('should log every mutation', async (t) => {
  t.plan(3)

  const stream = jsonLogger(
    line => {
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.graphql, {
        mutations: ['plusOne', 'minusOne', 'plusOne']
      })
    })

  const app = buildApp(t, { stream })

  const query = `mutation {
    plusOne
    minusOne
    another: plusOne
  }`
  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })

  t.deepEqual(response.json(), {
    data: {
      plusOne: 1,
      minusOne: 0,
      another: 1
    }
  })
})

test('should log at debug level', async (t) => {
  t.plan(4)

  const stream = jsonLogger(
    line => {
      t.is(line.level, 20)
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.graphql, {
        mutations: ['plusOne']
      })
    })

  const app = buildApp(t, { level: 'debug', stream }, { logLevel: 'debug' })
  const query = 'mutation { plusOne }'
  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })

  t.deepEqual(response.json(), {
    data: {
      plusOne: 2
    }
  })
})

test('should log the request body', async (t) => {
  t.plan(3)

  const query = `query {
    four: add(x: 2, y: 2)
    six: add(x: 3, y: 3)
    echo(msg: "hello")
  }`

  const stream = jsonLogger(
    line => {
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.graphql, {
        queries: ['add', 'add', 'echo'],
        body: query
      })
    })

  const app = buildApp(t, { stream }, { logBody: true })

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })
  t.deepEqual(response.json(), {
    data: { four: 4, six: 6, echo: 'hellohello' }
  })
})

test('should log the request body based on the function', async (t) => {
  t.plan(9)

  const query = `query logMe($txt: String!) {
    echo(msg: $txt)
  }`

  const stream = jsonLogger(
    line => {
      switch (line.reqId) {
        case 'req-1':
          t.deepEqual(line.graphql, {
            operationName: 'logMe',
            queries: ['echo']
          })
          break
        case 'req-2':
          t.deepEqual(line.graphql, {
            operationName: 'logMe',
            queries: ['echo'],
            body: query
          })
          break
        case 'req-3':
          t.deepEqual(line.graphql, {
            operationName: 'logMe',
            queries: ['echo']
          })
          break
        default:
          t.fail('unexpected reqId')
      }
    })

  const app = buildApp(t, { stream },
    {
      logBody: function (context) {
        t.pass('logBody called')
        if (context.reply.request.headers['x-debug'] === 'throw') {
          throw new Error('some error')
        }
        return context.reply.request.headers['x-debug'] === 'true'
      }
    }
  )

  {
    const response = await app.inject({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      url: '/graphql',
      body: JSON.stringify({ query, variables: { txt: 'false' } })
    })
    t.deepEqual(response.json(), {
      data: { echo: 'falsefalse' }
    })
  }

  {
    const response = await app.inject({
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-debug': 'true' },
      url: '/graphql',
      body: JSON.stringify({ query, variables: { txt: 'true' } })
    })
    t.deepEqual(response.json(), {
      data: { echo: 'truetrue' }
    })
  }

  {
    const response = await app.inject({
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-debug': 'throw' },
      url: '/graphql',
      body: JSON.stringify({ query, variables: { txt: 'err' } })
    })
    t.deepEqual(response.json(), {
      data: { echo: 'errerr' }
    })
  }
})

test('should log the request variables', async (t) => {
  t.plan(3)

  const query = `query boom($num: Int!) {
    a: add(x: $num, y: $num)
    b: add(x: $num, y: $num)
    echo(msg: "hello")
  }`

  const stream = jsonLogger(
    line => {
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.graphql, {
        operationName: 'boom',
        queries: ['add', 'add', 'echo'],
        variables: { num: 2 }
      })
    })

  const app = buildApp(t, { stream }, { logVariables: true })

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query, variables: { num: 2 } })
  })

  t.deepEqual(response.json(), {
    data: { a: 4, b: 4, echo: 'hellohello' }
  })
})

test('should log the request variables as null when missing', async (t) => {
  t.plan(3)

  const query = `query {
    add(x: 2, y: 2)
    echo(msg: "hello")
  }`

  const stream = jsonLogger(
    line => {
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.graphql, {
        queries: ['add', 'echo'],
        variables: null
      })
    })

  const app = buildApp(t, { stream }, { logVariables: true })

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({ query })
  })

  t.deepEqual(response.json(), {
    data: { add: 4, echo: 'hellohello' }
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
        variables: { num: 2, bin: 3 }
      })
    })

  const app = buildApp(t, { stream }, {
    logBody: true,
    logVariables: true
  })

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({
      query,
      operationName: 'baam',
      variables: { num: 2, bin: 3 }
    })
  })

  t.deepEqual(response.json(), { data: { c: 5, d: 5 } })
})

test('should log the request object when logRequest is true', async (t) => {
  t.plan(2)

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
      t.deepEqual(line.req, {
        method: 'POST',
        url: '/graphql',
        hostname: 'localhost:80',
        remoteAddress: '127.0.0.1'
      })
    })

  const app = buildApp(t, { stream }, {
    logRequest: true,
    logVariables: true
  })

  await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    body: JSON.stringify({
      query,
      operationName: 'baam',
      variables: { num: 2, bin: 3 }
    })
  })
})

test('user can customize the log the request object when logRequest is true', async (t) => {
  t.plan(3)

  const query = `
  query boom($num: Int!) {
    a: add(x: $num, y: $num)
    b: add(x: $num, y: $num)
  }
  `

  const stream = jsonLogger(
    line => {
      t.is(line.reqId, 'req-1')
      t.deepEqual(line.req, {
        headers: {
          'content-length': '131',
          'content-type': 'application/json',
          foo: 'bar',
          host: 'localhost:80',
          'user-agent': 'lightMyRequest'
        }
      })
    })

  const app = buildApp(t, {
    stream,
    serializers: {
      req: function reqSerializer (req) {
        t.pass('reqSerializer called')
        return {
          headers: req.headers
        }
      }
    }
  }, {
    logRequest: true,
    logVariables: true
  })

  await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json', foo: 'bar' },
    url: '/graphql',
    body: JSON.stringify({
      query,
      variables: { num: 2 }
    })
  })
})
