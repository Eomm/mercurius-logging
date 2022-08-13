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
t.teardown(app.close.bind(app))

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
})
```

### logLevel

The log level of the plugin. Note that the `request` logger is used, so you will get the additional
[request data](https://www.fastify.io/docs/latest/Reference/Logging/#usage) such as the `reqId`.

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

## License

Copyright [Manuel Spigolon](https://github.com/Eomm), Licensed under [MIT](./LICENSE).
