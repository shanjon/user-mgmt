/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

var testsDir = '../../integration/instrumentation/promises'

var tap = require('tap')
var testMethods = require(testsDir + '/methods')


tap.test('bluebird', function(t) {
  t.autoend()

  t.test('methods', function(t) {
    t.autoend()
    testMethods(t, 'bluebird', loadBluebird)
  })
})

function loadBluebird() {
  return require('bluebird') // Load relative to this file.
}
