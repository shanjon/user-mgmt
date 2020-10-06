/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

var common = require('./collection-common')
var mongoPackage = require('mongodb/package.json')
var semver = require('semver')


common.test('aggregate', function aggregateTest(t, collection, verify) {
  collection.aggregate([
    {$sort: {i: 1}},
    {$match: {mod10: 5}},
    {$limit: 3},
    {$project: {value: '$i', _id: 0}}
  ], function onResult(err, cursor) {
    if (!cursor) {
      t.fail('No data retrieved!')
      verify(err)
    } else if (cursor instanceof Array) {
      _verifyData(cursor)
      verify(err, [
        'Datastore/statement/MongoDB/testCollection/aggregate',
        'Callback: onResult'
      ], ['aggregate'])
    } else {
      cursor.toArray(function onResult2(err, data) {
        _verifyData(data)
        verify(err, [
          'Datastore/statement/MongoDB/testCollection/aggregate',
          'Callback: onResult',
          'Datastore/statement/MongoDB/testCollection/toArray',
          'Callback: onResult2'
        ], ['aggregate', 'toArray'])
      })
    }
  })

  function _verifyData(data) {
    t.equal(data.length, 3, 'should have expected amount of results')
    t.deepEqual(
      data,
      [{value: 5}, {value: 15}, {value: 25}],
      'should have expected results'
    )
  }
})

common.test('bulkWrite', function bulkWriteTest(t, collection, verify) {
  collection.bulkWrite(
    [{deleteMany: {filter: {}}}, {insertOne: { document: { a: 1 }}}],
    {ordered: true, w: 1},
    onWrite
  )

  function onWrite(err, data) {
    t.error(err)
    t.equal(data.insertedCount, 1)
    t.equal(data.deletedCount, 30)
    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/bulkWrite',
        'Callback: onWrite'
      ],
      ['bulkWrite']
    )
  }
})

common.test('count', function countTest(t, collection, verify) {
  collection.count(function onCount(err, data) {
    t.error(err)
    t.equal(data, 30)
    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/count',
        'Callback: onCount'
      ],
      ['count']
    )
  })
})

common.test('distinct', function distinctTest(t, collection, verify) {
  collection.distinct('mod10', function done(err, data) {
    t.error(err)
    t.deepEqual(data.sort(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/distinct',
        'Callback: done'
      ],
      ['distinct']
    )
  })
})

common.test('drop', function dropTest(t, collection, verify) {
  collection.drop(function done(err, data) {
    t.error(err)
    t.equal(data, true)
    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/drop',
        'Callback: done'
      ],
      ['drop']
    )
  })
})


common.test('geoHaystackSearch', function haystackSearchTest(t, collection, verify) {
  collection.ensureIndex({loc: 'geoHaystack', type: 1}, {bucketSize: 1}, indexed)

  function indexed(err) {
    t.error(err)
    collection.geoHaystackSearch(15, 15, {maxDistance: 5, search: {}}, done)
  }

  function done(err, data) {
    t.error(err)
    t.equal(data.ok, 1)
    t.equal(data.results.length, 2)
    t.equal(data.results[0].i, 13)
    t.equal(data.results[1].i, 17)
    t.deepEqual(data.results[0].loc, [13, 13])
    t.deepEqual(data.results[1].loc, [17, 17])
    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/ensureIndex',
        'Callback: indexed',
        'Datastore/statement/MongoDB/testCollection/geoHaystackSearch',
        'Callback: done'
      ],
      ['ensureIndex', 'geoHaystackSearch']
    )
  }
})

if (semver.satisfies(mongoPackage.version, '<3')) {
  common.test('geoNear', function geoNearTest(t, collection, verify) {
    collection.ensureIndex({loc: '2d'}, {bucketSize: 1}, indexed)

    function indexed(err) {
      t.error(err)
      collection.geoNear(20, 20, {maxDistance: 5}, done)
    }

    function done(err, data) {
      t.error(err)
      t.equal(data.ok, 1)
      t.equal(data.results.length, 2)
      t.equal(data.results[0].obj.i, 21)
      t.equal(data.results[1].obj.i, 17)
      t.deepEqual(data.results[0].obj.loc, [21, 21])
      t.deepEqual(data.results[1].obj.loc, [17, 17])
      t.equal(data.results[0].dis, 1.4142135623730951)
      t.equal(data.results[1].dis, 4.242640687119285)
      verify(
        null,
        [
          'Datastore/statement/MongoDB/testCollection/ensureIndex',
          'Callback: indexed',
          'Datastore/statement/MongoDB/testCollection/geoNear',
          'Callback: done'
        ],
        ['ensureIndex', 'geoNear']
      )
    }
  })
}

common.test('group', function groupTest(t, collection, verify) {
  collection.group(['mod10'], {}, {count: 0, total: 0}, count, done)

  function done(err, data) {
    t.error(err)
    t.deepEqual(data.sort(sort), [
      {mod10: 0, count: 3, total: 30},
      {mod10: 1, count: 3, total: 33},
      {mod10: 2, count: 3, total: 36},
      {mod10: 3, count: 3, total: 39},
      {mod10: 4, count: 3, total: 42},
      {mod10: 5, count: 3, total: 45},
      {mod10: 6, count: 3, total: 48},
      {mod10: 7, count: 3, total: 51},
      {mod10: 8, count: 3, total: 54},
      {mod10: 9, count: 3, total: 57}
    ])
    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/group',
        'Callback: done'
      ],
      ['group']
    )
  }

  function count(obj, prev) {
    prev.total += obj.i
    prev.count++
  }

  function sort(a, b) {
    return a.mod10 - b.mod10
  }
})


common.test('isCapped', function isCappedTest(t, collection, verify) {
  collection.isCapped(function done(err, data) {
    t.error(err)
    t.notOk(data)

    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/isCapped',
        'Callback: done'
      ],
      ['isCapped']
    )
  })
})

common.test('mapReduce', function mapReduceTest(t, collection, verify) {
  collection.mapReduce(map, reduce, {out: {inline: 1}}, done)

  function done(err, data) {
    t.error(err)
    t.deepEqual(data, [
      {_id: 0, value: 30},
      {_id: 1, value: 33},
      {_id: 2, value: 36},
      {_id: 3, value: 39},
      {_id: 4, value: 42},
      {_id: 5, value: 45},
      {_id: 6, value: 48},
      {_id: 7, value: 51},
      {_id: 8, value: 54},
      {_id: 9, value: 57}
    ])

    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/mapReduce',
        'Callback: done'
      ],
      ['mapReduce']
    )
  }

  /* eslint-disable */
  function map(obj) {
    emit(this.mod10, this.i)
  }
  /* eslint-enable */

  function reduce(key, vals) {
    return vals.reduce(function sum(prev, val) {
      return prev + val
    }, 0)
  }
})

common.test('options', function optionsTest(t, collection, verify) {
  collection.options(function done(err, data) {
    t.error(err)

    // Depending on the version of the mongo server this will change.
    if (data) {
      t.deepEqual(data, {}, 'should have expected results')
    } else {
      t.notOk(data, 'should have expected results')
    }

    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/options',
        'Callback: done'
      ],
      ['options']
    )
  })
})

common.test('parallelCollectionScan', function(t, collection, verify) {
  collection.parallelCollectionScan({numCursors: 1}, function done(err, cursors) {
    t.error(err)

    cursors[0].toArray(function toArray(err, items) {
      t.error(err)
      t.equal(items.length, 30)

      var total = items.reduce(function sum(prev, item) {
        return item.i + prev
      }, 0)

      t.equal(total, 435)
      verify(
        null,
        [
          'Datastore/statement/MongoDB/testCollection/parallelCollectionScan',
          'Callback: done',
          'Datastore/statement/MongoDB/testCollection/toArray',
          'Callback: toArray',
        ],
        ['parallelCollectionScan', 'toArray']
      )
    })
  })
})


common.test('rename', function renameTest(t, collection, verify) {
  collection.rename('testCollection2', function done(err) {
    t.error(err)

    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/rename',
        'Callback: done'
      ],
      ['rename']
    )
  })
})


common.test('stats', function statsTest(t, collection, verify) {
  collection.stats({i: 5}, {foo: 'bar'}, function done(err, data) {
    t.error(err)
    t.equal(data.ns, common.DB_NAME + '.testCollection')
    t.equal(data.count, 30)
    t.equal(data.ok, 1)

    verify(
      null,
      [
        'Datastore/statement/MongoDB/testCollection/stats',
        'Callback: done'
      ],
      ['stats']
    )
  })
})
