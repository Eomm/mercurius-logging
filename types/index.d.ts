/* eslint no-use-before-define: "off" */

import { FastifyPluginCallback } from 'fastify'
import { MercuriusContext } from 'mercurius'

type MercuriusLogging = FastifyPluginCallback<mercuriusLogging.MercuriusLoggingOptions>

declare namespace mercuriusLogging {
  export interface MercuriusLoggingOptions {
    logLevel?: string
    prependAlias?: boolean
    logBody?: boolean | ((context: MercuriusContext) => boolean)
    logVariables?: boolean
    logRequest?: boolean
  }

  export const mercuriusLogging: MercuriusLogging
  export { mercuriusLogging as default }
}

declare function plugin(...params: Parameters<MercuriusLogging>): ReturnType<MercuriusLogging>
export = plugin
