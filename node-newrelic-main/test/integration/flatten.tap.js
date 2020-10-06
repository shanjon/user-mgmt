/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

var tap  = require('tap')
var flatten = require('../../lib/util/flatten')

tap.test('util.flatten', function(t) {
  t.autoend()

  t.test('flattens things', function(t) {
    t.deepEqual(flatten({}, '', {a: 5, b: true}), {a: 5, b: true}, '1 level')
    t.deepEqual(
      flatten({}, '', {a: 5, b: {c: true, d: 7}}),
      {a: 5, 'b.c': true, 'b.d': 7},
      '2 levels'
    )
    t.deepEqual(
      flatten({}, '', {a: 5, b: {c: true, d: 7, e: {foo: 'efoo', bar: 'ebar'}}}),
      {a: 5, 'b.c': true, 'b.d': 7, 'b.e.foo': 'efoo', 'b.e.bar': 'ebar'},
      '3 levels'
    )

    t.end()
  })

  t.test('flattens recursive objects', function(t) {
    var obj = {}
    obj.x = obj
    t.deepEqual(flatten({}, '', obj), {})

    t.end()
  })
})

tap.test('util.flatten.keys', function(t) {
  t.autoend()

  t.test('gets flattened keys', function(t) {
    t.deepEqual(flatten.keys({a: 5, b: true}), ['a', 'b'], '1 level')
    t.deepEqual(
      flatten.keys({a: 5, b: {c: true, d: 7}}),
      ['a', 'b.c', 'b.d'],
      '2 levels'
    )
    t.deepEqual(
      flatten.keys({a: 5, b: {c: true, d: 7, e: {foo: 'efoo', bar: 'ebar'}}}),
      ['a', 'b.c', 'b.d', 'b.e.foo', 'b.e.bar'],
      '3 levels'
    )

    t.end()
  })

  t.test('flattens recursive objects', function(t) {
    var obj = {}
    obj.x = obj
    t.deepEqual(flatten.keys(obj), [])
    t.end()
  })
})
