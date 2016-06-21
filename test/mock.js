'use strict'
const test = require('tape')
const request = require('req-then')
const c = require('./common')
const Koa = require('koa')
const mockResponse = require('../')

test('mock: simple response', function (t) {
  t.plan(2)
  const app = new Koa()
  app.use(mockResponse('/test', { response: { body: 'test' } }))
  const server = app.listen(8100, () => {
    request('http://localhost:8100/test')
      .then(c.checkResponse(t, 200, /test/))
      .then(server.close.bind(server))
      .catch(c.fail(t))
  })
})

test('mock: method request filter', function (t) {
  t.plan(3)
  const app = new Koa()
  app.use(mockResponse('/test', {
    request: { method: 'POST' },
    response: { body: 'test' }
  }))
  const server = app.listen(8100, () => {
    request('http://localhost:8100/test')
      .then(c.checkResponse(t, 404))
      .then(() => request('http://localhost:8100/test', { data: 'something' }))
      .then(c.checkResponse(t, 200, /test/))
      .then(server.close.bind(server))
      .catch(c.fail(t))
  })
})

test('mock: accepts request filter', function (t) {
  t.plan(3)
  const app = new Koa()
  app.use(mockResponse('/test', {
    request: { accepts: 'text' },
    response: { body: 'test' }
  }))
  const server = app.listen(8100, () => {
    request('http://localhost:8100/test', { headers: { Accept: '*/json' } })
      .then(c.checkResponse(t, 404))
      .then(() => request('http://localhost:8100/test', { headers: { Accept: 'text/plain' } }))
      .then(c.checkResponse(t, 200, /test/))
      .then(server.close.bind(server))
  })
})

test('mock: responses array', function (t) {
  t.plan(4)
  const app = new Koa()
  app.use(mockResponse('/test', [
    { request: { method: 'GET' }, response: { body: 'get' } },
    { request: { method: 'POST' }, response: { body: 'post' } }
  ]))
  const server = app.listen(8100, () => {
    request('http://localhost:8100/test')
      .then(c.checkResponse(t, 200, /get/))
      .then(() => request('http://localhost:8100/test', { method: 'POST' }))
      .then(c.checkResponse(t, 200, /post/))
      .then(server.close.bind(server))
  })
})

test('mock: response function', function (t) {
  t.plan(4)
  const app = new Koa()
  app.use(mockResponse('/test', [
    { request: { method: 'GET' }, response: ctx => ctx.body = 'get' },
    { request: { method: 'POST' }, response: ctx => ctx.body = 'post' }
  ]))
  const server = app.listen(8100, () => {
    request('http://localhost:8100/test')
      .then(c.checkResponse(t, 200, /get/))
      .then(() => request('http://localhost:8100/test', { method: 'POST' }))
      .then(c.checkResponse(t, 200, /post/))
      .then(server.close.bind(server))
  })
})

test('mock: response function args', function (t) {
  t.plan(2)
  const app = new Koa()
  app.use(mockResponse('/test/:one', [
    { request: { method: 'GET' }, response: (ctx, one) => ctx.body = one }
  ]))
  const server = app.listen(8100, () => {
    request('http://localhost:8100/test/yeah')
      .then(c.checkResponse(t, 200, /yeah/))
      .then(server.close.bind(server))
  })
})

test('mock: async response function', function (t) {
  t.plan(2)
  const app = new Koa()
  app.use(mockResponse('/test', {
    response: function (ctx) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          ctx.body = 'test'
          resolve()
        }, 10)
      })
    }
  }))
  const server = app.listen(8100, () => {
    request('http://localhost:8100/test')
      .then(c.checkResponse(t, 200, /test/))
      .then(server.close.bind(server))
  })
})
