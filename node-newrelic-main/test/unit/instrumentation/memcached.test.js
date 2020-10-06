/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

// TODO: convert to normal tap style.
// Below allows use of mocha DSL with tap runner.
require('tap').mochaGlobals()

const chai = require('chai')
const expect = chai.expect
const helper = require('../../lib/agent_helper')


describe("agent instrumentation of memcached", function() {
  describe("shouldn't cause bootstrapping to fail", function() {
    let agent
    let initialize


    before(function() {
      agent = helper.loadMockedAgent()
      initialize = require('../../../lib/instrumentation/memcached')
    })

    after(function() {
      helper.unloadAgent(agent)
    })

    it("when passed no module", function() {
      expect(function() { initialize(agent) }).not.throws()
    })

    it("when passed an empty module", function() {
      expect(function() { initialize(agent, {}) }).not.throws()
    })
  })

  describe("for each operation", function() {
    it("should update the global aggregate statistics")
    it("should also update the global web aggregate statistics")
    it("should update the aggregate statistics for the operation type")
    it("should update the scoped aggregate statistics for the operation type")
  })

  it("should instrument setting data")
  it("should instrument adding data")
  it("should instrument appending data")
  it("should instrument prepending data")
  it("should instrument checking and setting data")
  it("should instrument incrementing data")
  it("should instrument decrementing data")
  it("should instrument getting data")
  it("should instrument deleting data")
})
