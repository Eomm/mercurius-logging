# mercurius-logging

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![ci](https://github.com/Eomm/mercurius-logging/actions/workflows/ci.yml/badge.svg)](https://github.com/Eomm/mercurius-logging/actions/workflows/ci.yml)

This plugin add a Log with all the GraphQL details you need.

## The issue

By default, Fastify logs a simple request that shows always the same `url`:

```json
{
  "level": 30,
  "time": 1660395516356,
  "pid": 83316,
  "hostname": "eomm",
  "name": "gateway",
  "reqId": "req-1",
  "req": {
    "method": "POST",
    "url": "/graphql",
    "hostname": "localhost:60767",
    "remoteAddress": "127.0.0.1",
    "remotePort": 60769
  },
  "msg": "incoming request"
}
```

This output does not let you know which queries or mutations are being executed,
unless you print or inspect the GQL payload.

This plugin adds this log output to your application:

```json
{
  "level": 30,
  "time": 1660395516406,
  "pid": 83316,
  "hostname": "eomm",
  "name": "gateway",
  "reqId": "req-1",
  "graphql": {
    "queries": [
      "myTeam",
      "myTeam"
    ]
  }
}
```

When the request contains some mutations:

```json
{
  "level": 30,
  "time": 1660395516406,
  "pid": 83316,
  "hostname": "eomm",
  "name": "gateway",
  "reqId": "req-1",
  "graphql": {
    "mutations": [
      "resetCounter"
    ]
  }
}
```

Here a complete example when you turn on all the log options:

```json5
{
  "level": 30,
  "time": 1660395516406,
  "pid": 83316,
  "hostname": "eomm",
  "name": "gateway",
  "reqId": "req-1",
  "graphql": {
    "queries": [
      "a:add",
      "b:add",
      "c:add",
      "d:add"
    ],
    "operationName": "baam",
    "body": "
      query boom($num: Int!) {
        a: add(x: $num, y: $num)
        b: add(x: $num, y: $num)
      }
      query baam($num: Int!, $bin: Int!) {
        c: add(x: $num, y: $bin)
        d: add(x: $num, y: $bin)
    }",
    "variables": {
      "num": 2,
      "bin": 3
    }
  }
}
```

If the [mercurius `graphql` decorator](https://github.com/mercurius-js/mercurius/blob/master/docs/api/options.md#appgraphqlsource-context-variables-operationname) is used, it is necessary to provide a `context` object: `app.graphql(query, { reply })`.
Otherwise, this plugin will ignore the request.

## Install

```
npm install mercurius-logging
```

## Usage

```js
const Fastify = require('fastify')
const mercurius = require('mercurius')
const mercuriusLogging = require('mercurius-logging')

const app = Fastify({
  logger: true,
  disableRequestLogging: true
})

app.register(mercurius, {
  schema: yourSchema,
  resolvers: yourResolvers
})
app.register(mercuriusLogging)
```

## Options

You can customize the output of the plugin by passing an options object:

```js
app.register(mercuriusLogging, {
  logLevel: 'debug', // default: 'info'
  prependAlias: true, // default: false
  logBody: true, // default: false
  logVariables: true, // default: false
  logRequest: true // default: false
})
```

### logLevel

The log level of the plugin. Note that the `request` logger is used, so you will get the additional
[request data](https://www.fastify.io/docs/latest/Reference/Logging/#usage) such as the `reqId`.

### logRequest

Add to the log line the `req: request` object. This is useful if you want to log the request's headers or other.
You can customize what to log by using the `logSerializers` option of Fastify.

```js
const app = Fastify({
  logger: {
    level: 'debug',
    serializers: {
      req: function reqSerializer (req) {
        // look at the standard serializer for the req object:
        // https://github.com/pinojs/pino-std-serializers/
        return {
          headers: req.headers
        }
      }
    }
  }
})

app.register(mercuriusLogging, {
  logRequest: true
})
```

### prependAlias

Queries and mutations may have an alias. If you want to append the alias to the log, set this option to `true`.
You will get the following output:

```json
{
  "level": 30,
  "graphql": {
    "queries": [
      "firstQuery:myTeam",
      "secondQuery:myTeam"
    ]
  }
}
```

### logBody

If you want to include the body of the request in the log output, set this option to `true`.

You can provide a syncronous function to choose to log the body or not.
The function must return `true` to log the body.

```js
app.register(mercuriusLogging, {
  logBody: function (context, body) {
    return context.reply.request.headers['x-debug'] === 'true'
  }
})
```

Here an output example:

```json
{
  "level": 30,
  "graphql": {
    "queries": [
      "firstQuery:myTeam",
      "secondQuery:myTeam"
    ],
    "body": "query firstQuery { myTeam { name } } query secondQuery { myTeam { name } }"
  }
}
```

### logVariables

If you want to include the request's variables in the log output, set this option to `true`.

```json
{
  "level": 30,
  "graphql": {
    "queries": [
      "firstQuery:myTeam",
      "secondQuery:myTeam"
    ],
    "variables": {
      "teamId": 1
    }
  }
}
```


## License

Copyright [Manuel Spigolon](https://github.com/Eomm), Licensed under [MIT](./LICENSE).
