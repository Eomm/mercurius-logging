'use strict'

const fp = require('fastify-plugin')

function mercuriusLogging (app, opts, next) {
  const options = Object.assign({}, {
    logLevel: 'info',
    prependAlias: false,
    logBody: false
  }, opts)

  app.graphql.addHook('preExecution', logGraphQLDetails.bind(null, options))
  next()
}

function logGraphQLDetails (opts, schema, document, context) {
  const queryOps = readOps(document, 'query', opts)
  const mutationOps = readOps(document, 'mutation', opts)

  context.reply.request.log[opts.logLevel]({
    graphql: {
      queries: queryOps.length > 0 ? queryOps : undefined,
      mutations: mutationOps.length > 0 ? mutationOps : undefined,
      body: opts.logBody === true ? context.reply.request.body.query : undefined
    }
  })
}

function readOps (document, operation, opts) {
  return document.definitions
    .filter(d => d.kind === 'OperationDefinition' && d.operation === operation)
    .flatMap(d => d.selectionSet.selections)
    .map(selectionSet => {
      const opName = selectionSet.name.value

      if (opts.prependAlias && selectionSet.alias) {
        return selectionSet.alias.value + ':' + opName
      }

      return opName
    })
}

module.exports = fp(mercuriusLogging,
  {
    name: 'mercurius-logging',
    fastify: '4.x',
    dependencies: ['mercurius']
  }
)
