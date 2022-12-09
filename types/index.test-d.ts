
import fastify from 'fastify'
import { MercuriusContext } from 'mercurius'

import mercuriusLogging from '../';

const app = fastify()

// 1. Basic usage: default types
app.register(mercuriusLogging)

// 2. Using options
app.register(mercuriusLogging, {
  logLevel: 'info',
  prependAlias: true,
  logBody: true,
  logVariables: true
})

// 3. Using options with different types
app.register(mercuriusLogging, {
  logLevel: 'info',
  prependAlias: false,
  logBody: (context: MercuriusContext) => true,
  logVariables: false
})
