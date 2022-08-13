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
})
```

## License

Copyright [Manuel Spigolon](https://github.com/Eomm), Licensed under [MIT](./LICENSE).
