'use strict'

const fp = require('fastify-plugin')

function noop () {
  return undefined
}

function simpleBody (context) {
  return context.reply.request.body.query
}

function conditionalBody (fn, context) {
  try {
    if (fn(context) === true) {
      return context.reply.request.body.query
    }
  } catch (error) {
    context.app.log.debug(error, 'mercurius-logging: error in logBody function')
  }
  return undefined
}

function mercuriusLogging (app, opts, next) {
  const options = Object.assign({}, {
    logLevel: 'info',
    prependAlias: false,
    logBody: false,
    logVariables: false
  }, opts)

  options.buildBody = opts.logBody === true
    ? simpleBody
    : typeof opts.logBody === 'function'
      ? conditionalBody.bind(null, opts.logBody)
      : noop

  app.graphql.addHook('preExecution', logGraphQLDetails.bind(null, options))
  next()
}

function logGraphQLDetails (opts, schema, document, context) {
  const queryOps = readOps(document, 'query', opts)
  const mutationOps = readOps(document, 'mutation', opts)

  // operationName can be provided at the request level, or it can be provided by query/mutation.
  // If it's provided by both, the request level takes precedence.
  const operationName = context.reply.request.body.operationName || readOperationName(document, opts)
  const isCurrentOperation = (op) => op.operationName === operationName

  // Runs on a single operation at a time in a batched query, so we need to pull out
  // the relevant operation from the batch to be able to log variables for it.
  const isBatch = Array.isArray(context.reply.request.body)
  const currentBody = isBatch
    ? context.reply.request.body.find(isCurrentOperation)
    : context.reply.request.body

  context.reply.request.log[opts.logLevel]({
    graphql: {
      queries: queryOps.length > 0 ? queryOps : undefined,
      mutations: mutationOps.length > 0 ? mutationOps : undefined,
      operationName,
      body: opts.buildBody(context),
      variables: opts.logVariables === true ? currentBody?.variables || null : undefined
    }
  })
}

function readOperationName (document) {
  return document.definitions
    .filter((d) => d.kind === 'OperationDefinition')
    .map((d) => d.name)
    .filter((d) => d?.kind === 'Name')
    .map((d) => d.value)[0]
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

const plugin = fp(mercuriusLogging,
  {
    name: 'mercurius-logging',
    fastify: '4.x',
    dependencies: ['mercurius']
  }
)

module.exports = plugin
module.exports.default = plugin
module.exports.mercuriusLogging = plugin
