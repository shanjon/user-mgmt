/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

const tap = require('tap')
const test = tap.test

const helper  = require('../../../lib/agent_helper')

test('Domains', (t) => {
  t.autoend()

  let agent = null
  let d = null
  let tasks = []
  let interval = null

  t.beforeEach((done, t) => {
    // Once on node 10+ only, may be able to replace with below.
    // t.expectUncaughtException(fn, [expectedError], message, extra)
    // https://node-tap.org/docs/api/asserts/#texpectuncaughtexceptionfn-expectederror-message-extra
    helper.temporarilyOverrideTapUncaughtBehavior(tap, t)

    agent = helper.instrumentMockedAgent()

    // Starting on 9.3.0, calling `domain.exit` does not stop assertions in later
    // tests from being caught in this domain. In order to get around that we
    // are breaking out of the domain via a manual tasks queue.
    interval = setInterval(function() {
      while (tasks.length) {
        tasks.pop()()
      }

      done()
    }, 10)
  })

  t.afterEach((done) => {
    d && d.exit()
    clearInterval(interval)
    helper.unloadAgent(agent)

    done()
  })

  t.test('should not be loaded just from loading the agent', (t) => {
    t.notOk(process.domain)
    t.end()
  })

  t.test('should retain transaction scope on error events', (t) => {
    const domain = require('domain')
    d = domain.create()

    let checkedTransaction = null
    d.once('error', function(err) {
      // Asserting in a try catch because Domain will
      // handle the errors resulting in an infinite loop
      try {
        t.ok(err)
        t.equal(err.message, 'whole new error!')

        const transaction = agent.getTransaction()
        t.equal(transaction.id, checkedTransaction.id)
      } catch (err) {
        t.end(err) // Bailing out with the error
        return
      }
      tasks.push(t.end)
    })

    helper.runInTransaction(agent, function(transaction) {
      checkedTransaction = transaction
      d.run(function() {
        setTimeout(function() {
          throw new Error('whole new error!')
        }, 50)
      })
    })
  })
})
