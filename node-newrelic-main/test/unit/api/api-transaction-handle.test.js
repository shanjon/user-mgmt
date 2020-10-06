/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

const tap = require('tap')
const API = require('../../../api')
const helper = require('../../lib/agent_helper')

tap.test('Agent API - transaction handle', (t) => {
  t.autoend()

  let agent = null
  let api = null

  t.beforeEach((done) => {
    agent = helper.loadMockedAgent()
    api = new API(agent)

    done()
  })

  t.afterEach((done) => {
    helper.unloadAgent(agent)
    agent = null

    done()
  })

  t.test("exports a function for getting a transaction handle", (t) => {
    t.ok(api.getTransaction)
    t.type(api.getTransaction, 'function')

    t.end()
  })

  t.test("shoud return a stub when running outside of a transaction", (t) => {
    const handle = api.getTransaction()
    t.type(handle.end, 'function')
    t.type(handle.ignore, 'function')

    // Deprecated.
    t.type(handle.createDistributedTracePayload, 'function')
    t.type(handle.acceptDistributedTracePayload, 'function')

    t.type(handle.acceptDistributedTraceHeaders, 'function')
    t.type(handle.insertDistributedTraceHeaders, 'function')
    t.type(handle.isSampled, 'function')

    const payload = handle.createDistributedTracePayload()
    t.type(payload.httpSafe, 'function')
    t.type(payload.text, 'function')

    t.end()
  })

  t.test("should mark the transaction as externally handled", (t) => {
    helper.runInTransaction(agent, function(txn) {
      const handle = api.getTransaction()

      t.ok(txn.handledExternally)
      t.type(handle.end, 'function')

      handle.end()
      t.end()
    })
  })

  t.test("should return a method to ignore the transaction", (t) => {
    helper.runInTransaction(agent, function(txn) {
      const handle = api.getTransaction()

      t.type(handle.ignore, 'function')

      handle.ignore()

      t.ok(txn.forceIgnore)
      t.type(handle.end, 'function')

      handle.end()
      t.end()
    })
  })

  t.test("should have a method to create a distributed trace payload", (t) => {
    helper.runInTransaction(agent, function() {
      const handle = api.getTransaction()

      t.type(handle.createDistributedTracePayload, 'function')
      agent.config.cross_process_id = '1234#5678'

      const distributedTracePayload = handle.createDistributedTracePayload()

      t.type(distributedTracePayload.text, 'function')
      t.type(distributedTracePayload.httpSafe, 'function')

      t.end()
    })
  })

  t.test("should have a method for accepting a distributed trace payload", (t) => {
    helper.runInTransaction(agent, function() {
      const handle = api.getTransaction()
      t.type(handle.acceptDistributedTracePayload, 'function')
      t.end()
    })
  })

  t.test("should return a handle with a method to end the transaction", (t) => {
    let transaction
    agent.on('transactionFinished', function(finishedTransaction) {
      t.equal(finishedTransaction.id, transaction.id)
      t.end()
    })

    helper.runInTransaction(agent, function(txn) {
      transaction = txn
      const handle = api.getTransaction()
      t.type(handle.end, 'function')
      handle.end()
    })
  })

  t.test("should call a callback when handle end is called", (t) => {
    helper.runInTransaction(agent, function() {
      const handle = api.getTransaction()
      handle.end(function() {
        t.end()
      })
    })
  })

  t.test("does not blow up when end is called without a callback", (t) => {
    helper.runInTransaction(agent, function() {
      const handle = api.getTransaction()
      handle.end()

      t.end()
    })
  })

  t.test("should have a method for reporting whether the transaction is sampled", (t) => {
    helper.runInTransaction(agent, function() {
      const handle = api.getTransaction()
      t.type(handle.isSampled, 'function')
      t.equal(handle.isSampled(), true)

      t.end()
    })
  })
})
