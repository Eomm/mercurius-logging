'use strict'

const fp = require('fastify-plugin')

function noop () {
  return undefined
}

function simpleBody (_context, body) {
  return body.query
}

function conditionalBody (fn, context, body) {
  try {
    if (fn(context, body) === true) {
      return body.query
    }
  } catch (error) {
    context.app.log.debug(error, 'mercurius-logging: error in logBody function')
  }
  return undefined
}

function customLogMessage (fn, context) {
  try {
    const logMessage = fn(context)
    return logMessage
  } catch (error) {
    context.app.log.debug(error, 'mercurius-logging: error in logMessage function')
  }
  return undefined
}

function mercuriusLogging (app, opts, next) {
  const options = Object.assign({}, {
    logLevel: 'info',
    prependAlias: false,
    logBody: false,
    logVariables: false,
    logRequest: false,
    logMessage: undefined
  }, opts)

  options.buildBody = opts.logBody === true
    ? simpleBody
    : typeof opts.logBody === 'function'
      ? conditionalBody.bind(null, opts.logBody)
      : noop

  options.buildLogMessage = typeof opts.logMessage === 'function'
    ? customLogMessage.bind(null, opts.logMessage)
    : undefined

  app.graphql.addHook('preExecution', logGraphQLDetails.bind(null, options))
  next()
}

function logGraphQLDetails (opts, schema, document, context) {
  // Reply object could be undefined. In this case, we can't log.
  if (!context.reply) {
    return
  }

  const queryOps = readOps(document, 'query', opts)
  const mutationOps = readOps(document, 'mutation', opts)

  const requestBody = context.reply.request.method !== 'GET'
    ? context.reply.request.body
    : context.reply.request.query

  // operationName can be provided at the request level, or it can be provided by query/mutation.
  // If it's provided by both, the request level takes precedence.
  const operationName = requestBody.operationName || readOperationName(document)
  const isCurrentOperation = (op) => op.operationName === operationName

  // Runs on a single operation at a time in a batched query, so we need to pull out
  // the relevant operation from the batch to be able to log variables for it.
  const isBatch = Array.isArray(requestBody)
  const isDetailedLog = opts.logVariables || opts.logBody
  const currentBody = isDetailedLog && isBatch
    ? requestBody.find(isCurrentOperation)
    : requestBody

  const logData = {
    req: opts.logRequest === true ? context.reply.request : undefined,
    graphql: {
      queries: queryOps.length > 0 ? queryOps : undefined,
      mutations: mutationOps.length > 0 ? mutationOps : undefined,
      operationName,
      body: opts.buildBody(context, currentBody),
      variables: opts.logVariables === true ? currentBody?.variables || null : undefined
    }
  }

  const logMessage = opts.buildLogMessage?.(context)

  if (!logMessage) {
    context.reply.request.log[opts.logLevel](logData)
    return
  }

  context.reply.request.log[opts.logLevel].apply(context.reply.request.log, [logData].concat(logMessage))
}

function readOperationName (document) {
  return document.definitions
    .filter((d) => d.kind === 'OperationDefinition')
    .map((d) => d.name)
    .find((d) => d?.kind === 'Name')?.value
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
