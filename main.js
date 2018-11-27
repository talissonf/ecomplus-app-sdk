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

// keep returned client and promise
let promise, client
// try to get database filename from environtment variable
const envDbFilename = process.env.ECOM_AUTH_DB

// setup database and table
const setup = dbFilename => {
  dbFilename = dbFilename || envDbFilename || process.cwd() + '/db.sqlite3'
  if (!client || client.dbFilename !== dbFilename) {
    // handle new promise
    promise = new Promise((resolve, reject) => {
      const table = 'ecomplus_app_auth'

      // init SQLite3 client with database filename
      // reject all on error
      const db = new sqlite.Database(dbFilename, err => {
        if (err) {
          reject(err)
        } else {
          // try to run first query creating table
          db.run('CREATE TABLE IF NOT EXISTS ' + table + ` (
            created_at                  DATETIME  NOT NULL  DEFAULT CURRENT_TIMESTAMP,
            updated_at                  DATETIME  NOT NULL  DEFAULT CURRENT_TIMESTAMP,
            application_id              VARCHAR   NOT NULL,
            application_app_id          INTEGER   NOT NULL,
            application_title           VARCHAR   NOT NULL,
            authentication_id           VARCHAR   NOT NULL  PRIMARY KEY,
            authentication_permissions  TEXT,
            store_id                    INTEGER   NOT NULL,
            access_token                TEXT,
            setted_up                   INTEGER   NOT NULL  DEFAULT 0
          );`, ready)
        }
      })
      client = { dbFilename, db, table, axios }

      // resolve promise with lib methods when DB is ready
      const ready = err => {
        if (!err) {
          resolve({
            getAuth: require('./lib/methods/get-auth')(client),
            handleCallback: require('./lib/methods/handle-callback')(client),
            apiRequest: require('./lib/methods/api-request')(client),
            refreshToken: require('./lib/methods/refresh-token')(client),
            configureSetup: require('./lib/methods/configure-setup')(client)
          })
        } else {
          reject(err)
        }
      }

      // update access tokens periodically
      require('./lib/services/update-tokens')(client)
    })
  }
  return promise
}

if (envDbFilename) {
  // databse filename defined by environtment variable
  // auto trigger setup
  setup()
} else {
  promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('You must setup E-Com Plus auth before handle SDK'))
    }, 1000)
  })
}

module.exports = {
  setup,
  promise
}
