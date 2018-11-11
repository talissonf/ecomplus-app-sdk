'use strict'

// SQLite3 client
// https://github.com/mapbox/node-sqlite3
const sqlite = require('sqlite3').verbose()

// setup database and table
const setup = dbFilename => {
  return new Promise((resolve, reject) => {
    const db = new sqlite.Database(dbFilename, () => {
      db.run(`CREATE TABLE IF NOT EXISTS ecomplus_app_auth (
        created_at                  DATETIME  NOT NULL  DEFAULT CURRENT_TIMESTAMP,
        application_id              INTEGER   NOT NULL  PRIMARY KEY,
        application_app_id          INTEGER   NOT NULL,
        application_title           VARCHAR   NOT NULL,
        authentication_id           INTEGER   NOT NULL,
        authentication_permissions  TEXT,
        store_id                    INTEGER   NOT NULL,
        access_token                TEXT
      );`, ready)
    })

    // resolve promise with lib methods when DB is ready
    const ready = () => {
      resolve({
        getToken: require('./lib/methods/get-token.js'),
        handleCallback: require('./lib/methods/handle-callback.js')
      })
    }
    // update access tokens periodically
    require('./lib/services/update-tokens.js')
  })
}

module.exports = setup
