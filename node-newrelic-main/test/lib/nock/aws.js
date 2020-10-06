/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

var nock = require('nock')


module.exports.mockAWSInfo = function() {
  var awsHost = "http://169.254.169.254"
  var awsResponses = {
    "instance-type": "test.type",
    "instance-id": "test.id",
    "placement/availability-zone": "us-west-2b"
  }

  var awsRedirect = nock(awsHost)
  for (var awsPath in awsResponses) {
    if (Object.hasOwnProperty.call(awsResponses, awsPath)) {
      awsRedirect.get(
        '/2008-02-01/meta-data/' + awsPath).reply(200, awsResponses[awsPath]
      )
    }
  }
}
