var test = require('tape')
var pg = require('pg')
var async = require('async')
var testsuite = require('stringtree-migrate-driver-testsuite')
var options = ({ user: 'postgres', database: 'postgres' })
var driver = require('../stringtree-migrate-driver-postgres')(options)

function setup(cb) {
  var client = new pg.Client(options)
  client.connect(function(err, client) {
      if (err) return cb(err)
      client.query("drop table if exists st_migrate", function(err) {
          client.end()
          return cb(err, driver)
      })
  })
}

/** run the standard conformance tests against this driver */
testsuite(driver, 'PostGres', setup)

/** test the driver-specific bits */
test('execute some sql', function(t) {
  t.plan(1)

  async.series([
    driver.open.bind(driver),
    driver.execute.bind(driver, 'drop table if exists st_zz'),
    driver.execute.bind(driver, 'create table st_zz ( name varchar(20) )'),
    driver.execute.bind(driver, "insert into st_zz ( name ) values ( 'Frank' )"),
    driver.execute.bind(driver, 'select name from st_zz'),
    driver.execute.bind(driver, 'drop table st_zz'),
    driver.close.bind(driver)
  ], function(err) {
    t.error(err, 'should not error')
    t.end()
  })
})



