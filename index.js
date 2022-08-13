'use strict'

const fp = require('fastify-plugin')

function mercuriusLogging (app, opts, next) {
  const options = Object.assign({}, {
    logLevel: 'info'
  }, opts)

  app.graphql.addHook('preExecution', logGraphQLDetails.bind(null, options))
  next()
}

function logGraphQLDetails (opts, schema, document, context) {
  const reqIdField = context.app.initialConfig.requestIdLogLabel

  const queryOps = document.definitions
    .filter(d => d.kind === 'OperationDefinition' && d.operation === 'query')
    .flatMap(d => d.selectionSet.selections)
    .map(selectionSet => selectionSet.name.value)

  const mutationOps = document.definitions
    .filter(d => d.kind === 'OperationDefinition' && d.operation === 'mutation')
    .flatMap(d => d.selectionSet.selections)
    .map(selectionSet => selectionSet.name.value)

  context.app.log[opts.logLevel]({
    [reqIdField]: context.reply.request.id,
    graphql: {
      queries: queryOps.length > 0 ? queryOps : undefined,
      mutations: mutationOps.length > 0 ? mutationOps : undefined
    }
  })
}

module.exports = fp(mercuriusLogging,
  {
    name: 'mercurius-logging',
    fastify: '4.x',
    dependencies: ['mercurius']
  }
)
