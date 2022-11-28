'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const mercurius = require('mercurius')
const split = require('split2')

const mercuriusLogging = require('..')

const schema = `
  type Query {
    echo(msg: String!): String
    add(x: Int!, y: Int!): Int
    counter: Int!
  }
  type Mutation {
    plusOne: Int
    minusOne: Int
  }
`

let counter = 0

const resolvers = {
  Query: {
    echo: async (_, args) => {
      const { msg } = args
      return msg.repeat(2)
    },
    add: async (_, args) => {
      const { x, y } = args
      return x + y
    },
    counter: async () => {
      return counter
    }
  },
  Mutation: {
    plusOne: async (_, args) => {
      return ++counter
    },
    minusOne: async (_, args) => {
      return --counter
    }
  }
}

function buildApp (t, logger, opts) {
  const app = Fastify({
    logger,
    disableRequestLogging: true
  })
  t.teardown(app.close.bind(app))

  app.register(mercurius, {
    schema,
    resolvers
  })
  app.register(mercuriusLogging, opts)

  return app
}

test('should log every query', async (t) => {
  t.plan(3)

  const stream = split(JSON.parse)
  stream.on('data', line => {
    t.same(line.reqId, 'req-1')
    t.same(line.graphql, {
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
  t.same(JSON.parse(response.body), {
    data: {
      four: 4,
      six: 6,
      echo: 'hellohello',
      counter: 0
    }
  })
})

test('should log prepend the alias', async (t) => {
  t.plan(3)

  const stream = split(JSON.parse)
  stream.on('data', line => {
    t.same(line.reqId, 'req-1')
    t.same(line.graphql, {
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
  t.same(JSON.parse(response.body), {
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

  const stream = split(JSON.parse)
  stream.on('data', line => {
    t.same(line.reqId, 'req-1')
    t.same(line.graphql, {
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

  t.same(JSON.parse(response.body), {
    data: {
      plusOne: 1,
      minusOne: 0,
      another: 1
    }
  })
})

test('should log at debug level', async (t) => {
  t.plan(4)

  const stream = split(JSON.parse)
  stream.on('data', line => {
    t.same(line.level, 20)
    t.same(line.reqId, 'req-1')
    t.same(line.graphql, {
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

  t.same(JSON.parse(response.body), {
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

  const stream = split(JSON.parse)
  stream.on('data', line => {
    t.same(line.reqId, 'req-1')
    t.same(line.graphql, {
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
  t.same(JSON.parse(response.body), {
    data: { four: 4, six: 6, echo: 'hellohello' }
  })
})
