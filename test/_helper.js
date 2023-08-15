'use strict'

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

exports.buildApp = function buildApp (t, logger, opts) {
  const app = Fastify({
    logger,
    disableRequestLogging: true
  })
  t.teardown(app.close.bind(app))

  app.register(mercurius, {
    schema,
    resolvers,
    allowBatchedQueries: true
  })
  app.register(mercuriusLogging, opts)

  return app
}

exports.jsonLogger = function jsonLogger (onData) {
  const stream = split(JSON.parse)
  stream.on('data', onData)
  return stream
}
