/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

const tap = require('tap')
const configurator = require('../../lib/config')
const Agent = require('../../lib/agent')
const CollectorAPI = require('../../lib/collector/api')
const { getTestSecret, shouldSkipTest } = require('../helpers/secrets')


let lasp_license = getTestSecret('LASP_LICENSE')
let skip = shouldSkipTest(lasp_license)
tap.test('connecting with a LASP token should not error', {skip}, (t) => {
  const config = configurator.initialize({
    app_name: 'node.js Tests',
    license_key: lasp_license,
    security_policies_token: 'ffff-ffff-ffff-ffff',
    host: 'staging-collector.newrelic.com',
    utilization: {
      detect_aws: false,
      detect_pcf: false,
      detect_azure: false,
      detect_gcp: false,
      detect_docker: false
    },
    logging: {
      level: 'trace'
    }
  })
  const agent = new Agent(config)
  const api = new CollectorAPI(agent)

  api.connect(function(error, response) {
    t.notOk(error, 'connected without error')

    const returned = response && response.payload
    t.ok(returned, 'got boot configuration')
    t.ok(returned.agent_run_id, 'got run ID')
    t.ok(agent.config.run_id, 'run ID set in configuration')

    api.shutdown(function(error) {
      t.notOk(error, 'should have shut down without issue')
      t.notOk(agent.config.run_id, 'run ID should have been cleared by shutdown')
      t.end()
    })
  })
})

let lasp_secure_license = getTestSecret('LASP_SECURE_LICENSE')
skip = shouldSkipTest(lasp_secure_license)
tap.test('missing required policies should result in shutdown', {skip}, (t) => {
  const config = configurator.initialize({
    app_name: 'node.js Tests',
    license_key: lasp_secure_license,
    security_policies_token: 'ffff-ffff-ffff-ffff',
    host: 'staging-collector.newrelic.com',
    utilization: {
      detect_aws: false,
      detect_pcf: false,
      detect_azure: false,
      detect_gcp: false,
      detect_docker: false
    },
    logging: {
      level: 'trace'
    }
  })
  const agent = new Agent(config)

  agent.start(function(error, response) {
    t.ok(error, 'should have error')
    t.equal(error.message, 'Failed to connect to collector')
    t.notOk(response, 'should not have response payload')
    t.equal(agent._state, 'errored')
    t.end()
  })
})
