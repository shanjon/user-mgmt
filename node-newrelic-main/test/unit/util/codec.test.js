/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

// TODO: convert to normal tap style.
// Below allows use of mocha DSL with tap runner.
require('tap').mochaGlobals()

var expect = require('chai').expect
var codec = require('../../../lib/util/codec')

var DATA = {foo: 'bar'}
var ENCODED = 'eJyrVkrLz1eyUkpKLFKqBQAdegQ0'

describe('codec', function() {
  describe('.encode', function() {
    it('should zip and base-64 encode the data', function(done) {
      codec.encode(DATA, function(err, encoded) {
        expect(err).to.not.exist
        expect(encoded).to.equal(ENCODED)
        done()
      })
    })

    it('should not error for circular payloads', function(done) {
      var val = 'eJyrVkrLz1eyUkpKLFLSUcpPygKyo50zi5JLcxKLFOpilWoBuCkK6A=='
      var obj = {foo: 'bar'}
      obj.obj = obj

      codec.encode(obj, function(err, encoded) {
        expect(err).to.not.exist
        expect(encoded).to.equal(val)
        done()
      })
    })
  })

  describe('.decode', function() {
    it('should parse the encoded payload', function(done) {
      codec.decode(ENCODED, function(err, data) {
        expect(err).to.not.exist
        expect(data).to.deep.equal(DATA)
        done()
      })
    })
  })

  describe('.encodeSync', function() {
    it('should zip and base-64 encode the data', function() {
      const encoded = codec.encodeSync(DATA)
      expect(encoded).to.equal(ENCODED)
    })
  })

  describe('.decodeSync', function() {
    it('should parse the encoded payload', function() {
      const data = codec.decodeSync(ENCODED)
      expect(data).to.deep.equal(DATA)
    })
  })
})
