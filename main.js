'use strict'

// SQLite3 client
// https://github.com/mapbox/node-sqlite3
const sqlite = require('sqlite3').verbose()

// axios HTTP client
// https://github.com/axios/axios
// create an instance using the config defaults provided by the library
const axios = require('axios').create({
  // Store API host and base URI
  baseURL: 'https://api.e-com.plus/v1/'
})
// always JSON for request with body data
;[ 'post', 'patch', 'put' ].forEach(method => {
  axios.defaults.headers[method]['Content-Type'] = 'application/json'
})

// setup database and table
const setup = dbFilename => {
  return new Promise(resolve => {
    const table = 'ecomplus_app_auth'
    const db = new sqlite.Database(dbFilename, () => {
      db.run('CREATE TABLE IF NOT EXISTS ' + table + ` (
        created_at                  DATETIME  NOT NULL  DEFAULT CURRENT_TIMESTAMP,
        updated_at                  DATETIME  NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        application_id              INTEGER   NOT NULL  PRIMARY KEY,
        application_app_id          INTEGER   NOT NULL,
        application_title           VARCHAR   NOT NULL,
        authentication_id           INTEGER   NOT NULL,
        authentication_permissions  TEXT,
        store_id                    INTEGER   NOT NULL,
        access_token                TEXT
      );`, ready)
    })
    const client = { db, table, axios }

    // resolve promise with lib methods when DB is ready
    const ready = () => {
      resolve({
        getAuth: require('./lib/methods/get-auth.js')(client),
        handleCallback: require('./lib/methods/handle-callback.js')(client)
      })
    }
    // update access tokens periodically
    require('./lib/services/update-tokens.js')(client)
  })
}

module.exports = setup
