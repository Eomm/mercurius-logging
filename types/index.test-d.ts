import fastify from 'fastify'
import { MercuriusContext } from 'mercurius'

import plugin from '../'

const app = fastify()

// 1. Basic usage: default types
app.register(plugin)

// 2. Using options
app.register(plugin, {
  logLevel: 'info',
  prependAlias: true,
  logBody: true,
  logVariables: true,
  logMessage: (context: MercuriusContext) => 'This is a custom log message'
})

// 3. Using options with different types
app.register(plugin, {
  logLevel: 'info',
  prependAlias: false,
  logBody: (context: MercuriusContext) => true,  
  logVariables: false,
  logMessage: (context: MercuriusContext) => ['This is a custom log message? Answer: %s', true]
})

// Using options with different types
app.register(plugin, {
  logLevel: 'warn',
  logRequest: true
})
