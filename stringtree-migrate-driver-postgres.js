var debug = require('debug')('stringtree-migrate:postgres');
var util = require('util');
var pg = require('pg');

module.exports = function(options) {
  return {
    open: function(cb) {
      var self = this;
      if (!self.client) {
        new pg.Client(options).connect(function(err, _client) {
          if (err) return cb(err)
          self.client = _client
          cb(null, _client);
        })
      } else {
        cb(null, self.client)
      }
    },

    close: function(cb) {
      var self = this;
      if (!self.client) return cb()
      self.client.end()
      delete self.client;
      cb();
    },

    check: function(cb) {
      this.execute("select * from pg_catalog.pg_tables where tablename LIKE 'st_migrate'", function(err, tables) {
        if (err) return cb(err);
        if (!tables) return cb(new Error('could not read table data from db'));
        cb(null, tables[0]);
      });
    },

    create: function(cb) {
      this.execute("create table st_migrate ( level integer )",  cb);
    },

    current: function(cb) {
      this.execute("select level from st_migrate order by level desc", function(err, levels) {
        if (err) return cb(err);
        var current = levels[0] || { level: 0 };
        cb(null, current.level);
      });
    },

    update: function(level, cb) {
      this.execute("insert into st_migrate (level) values ($1)", [level], cb);
    },

    execute: function(sql, params, cb) {
      if (arguments.length === 2) return this.execute(arguments[0], [], arguments[1])
      this.client.query(sql, params, function(err, result) {
        if (err) return cb(err);
        cb(err, result.rows);
      });
    }
  };
};
