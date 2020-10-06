/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

var tap = require('tap')
var request = require('request').defaults({json: true})
var helper  = require('../../../lib/agent_helper')


tap.test('Restify router', function(t) {
  t.autoend()

  var agent = null
  var server = null

  t.beforeEach(function(done) {
    agent = helper.instrumentMockedAgent({
      attributes: {
        enabled: true,
        include: ['request.parameters.*']
      }
    })

    server = require('restify').createServer()
    done()
  })

  t.afterEach(function(done) {
    server.close(function() {
      helper.unloadAgent(agent)
      done()
    })
  })

  t.test('introspection', function(t) {
    t.plan(12)

    // need to capture attributes
    agent.config.attributes.enabled = true

    agent.on('transactionFinished', function(transaction) {
      t.equal(
        transaction.name,
        'WebTransaction/Restify/GET//test/:id',
        'transaction has expected name'
      )
      t.equal(transaction.url, '/test/31337', 'URL is left alone')
      t.equal(transaction.statusCode, 200, 'status code is OK')
      t.equal(transaction.verb, 'GET', 'HTTP method is GET')
      t.ok(transaction.trace, 'transaction has trace')

      var web = transaction.trace.root.children[0]
      t.ok(web, 'trace has web segment')
      t.equal(web.name, transaction.name, 'segment name and transaction name match')
      t.equal(
        web.partialName,
        'Restify/GET//test/:id',
        'should have partial name for apdex'
      )
      t.equal(
        web.getAttributes()['request.parameters.id'], '31337',
        'namer gets parameters out of route'
      )
    })

    server.get('/test/:id', function(req, res, next) {
      t.ok(agent.getTransaction(), 'transaction should be available')

      res.send({status : 'ok'})
      next()
    })

    _listenAndRequest(t, '/test/31337')
  })

  t.test('trailing slash differentiates routes (without slash)', function(t) {
    t.plan(3)

    server.get('/path1/', function first(req, res, next) {
      t.fail('should not enter this route')
      res.send({status: 'ok'})
      next()
    })
    server.get('/path1', function first(req, res, next) {
      t.ok(agent.getTransaction(),'should enter this route')
      res.send({status: 'ok'})
      next()
    })

    _listenAndRequest(t, '/path1')
  })

  t.test('trailing slash differentiates routes (with slash)', function(t) {
    t.plan(3)

    server.get('/path1/', function first(req, res, next) {
      t.ok(agent.getTransaction(), 'should enter this route')
      res.send({status: 'ok'})
      next()
    })
    server.get('/path1', function first(req, res, next) {
      t.fail('should not enter this route')
      res.send({status: 'ok'})
      next()
    })

    _listenAndRequest(t, '/path1/')
  })

  t.test('ignoreTrailingSlash option should ignore trailing slash', function(t) {
    t.plan(3)

    server = require('restify').createServer({ignoreTrailingSlash: true})

    server.get('/path1/', function first(req, res, next) {
      t.ok(agent.getTransaction(), 'should enter this route')
      res.send({status: 'ok'})
      next()
    })

    _listenAndRequest(t, '/path1')
  })

  t.test('next(true): terminates processing', function(t) {
    t.plan(4)

    server.get('/test/:id', function first(req, res, next) {
      t.ok(agent.getTransaction(), 'transaction should be available')
      res.send({status: 'ok'})
      next(true)
    }, function second() {
      t.fail('should not enter this final middleware')
    })

    agent.on('transactionFinished', function(tx) {
      t.equal(tx.name, 'WebTransaction/Restify/GET//test/:id', 'should have correct name')
    })

    _listenAndRequest(t, '/test/foobar')
  })

  t.test('next(false): stop processing', function(t) {
    t.plan(4)

    server.get('/test/:id', function first(req, res, next) {
      t.ok(agent.getTransaction(), 'transaction should be available')
      res.send({status: 'ok'})
      next(false)
    }, function final(req, res, next) {
      t.fail('should not enter this final middleware')
      res.send({status: 'ok'})
      next()
    })

    agent.on('transactionFinished', function(tx) {
      t.equal(tx.name, 'WebTransaction/Restify/GET//test/:id', 'should have correct name')
    })

    _listenAndRequest(t, '/test/foobar')
  })

  t.test('next("other_route"): jump processing', function(t) {
    t.plan(5)

    server.get({name: 'first', path: '/test/:id'}, function final(req, res, next) {
      t.ok(agent.getTransaction(), 'transaction should be available')
      next('second')
    })

    server.get({name: 'second', path: '/other'}, function final(req, res, next) {
      t.ok(agent.getTransaction(), 'transaction should be available')
      res.send({status: 'ok'})
      next()
    })

    agent.on('transactionFinished', function(tx) {
      t.equal(tx.name, 'WebTransaction/Restify/GET//other', 'should have correct name')
    })

    _listenAndRequest(t, '/test/foobar')
  })

  function _listenAndRequest(t, route) {
    server.listen(0, function() {
      var port = server.address().port
      var url = 'http://localhost:' + port + route
      request.get(url, function(error, res, body) {
        t.equal(res.statusCode, 200, 'nothing exploded')
        t.deepEqual(body, {status : 'ok'}, 'got expected response')
      })
    })
  } 
})
