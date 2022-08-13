'use strict'

const fp = require('fastify-plugin')

function mercuriusLogging (app, opts, next) {
  app.graphql.addHook('preExecution', logGraphQLDetails)
  next()
}

function logGraphQLDetails (schema, document, context) {
  const reqIdField = context.app.initialConfig.requestIdLogLabel

  const queryOps = document.definitions
    .filter(d => d.kind === 'OperationDefinition' && d.operation === 'query')
    .flatMap(d => d.selectionSet.selections)
    .map(selectionSet => selectionSet.name.value)

  const mutationOps = document.definitions
    .filter(d => d.kind === 'OperationDefinition' && d.operation === 'mutation')
    .flatMap(d => d.selectionSet.selections)
    .map(selectionSet => selectionSet.name.value)

  context.app.log.info({
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
