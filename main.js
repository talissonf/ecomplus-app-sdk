'use strict'

// SQLite3 client
// https://github.com/mapbox/node-sqlite3
const sqlite = require('sqlite3').verbose()

// axios HTTP client
// https://github.com/axios/axios
// create an instance using the config defaults provided by the library
const axios = require('axios').create({
  // Store API host and base URI
  baseURL: 'https://api.e-com.plus/v1/',
  timeout: 60000
})
// always JSON for request with body data
;[ 'post', 'patch', 'put' ].forEach(method => {
  axios.defaults.headers[method]['Content-Type'] = 'application/json'
})

// keep returned client and promise
// optional setup constructor function
let promise, client, setup
// try to get database filename from environtment variable
const envDbFilename = process.env.ECOM_AUTH_DB

// handle new promise
promise = new Promise((resolve, reject) => {
  // setup database and table
  setup = dbFilename => {
    dbFilename = dbFilename || envDbFilename || process.cwd() + '/db.sqlite3'
    if (!client || client.dbFilename !== dbFilename) {
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
            updated_at                  DATETIME  NULL,
            application_id              VARCHAR   NOT NULL,
            application_app_id          INTEGER   NOT NULL,
            application_title           VARCHAR   NOT NULL,
            authentication_id           VARCHAR   NOT NULL  PRIMARY KEY,
            authentication_permissions  TEXT      NULL,
            store_id                    INTEGER   NOT NULL,
            access_token                TEXT      NULL,
            setted_up                   INTEGER   NOT NULL  DEFAULT 0
          );`, ready)
        }
      })
      client = { dbFilename, db, table, axios }

      // resolve promise with lib methods when DB is ready
      const ready = err => {
        if (!err) {
          // update access tokens periodically
          require('./lib/services/update-tokens')(client)

          resolve({
            getAuth: require('./lib/methods/get-auth')(client),
            handleCallback: require('./lib/methods/handle-callback')(client),
            apiRequest: require('./lib/methods/api-request')(client),
            apiApp: require('./lib/methods/api-app')(client),
            appPublicBody: require('./lib/methods/app-public-body')(client),
            refreshToken: require('./lib/methods/refresh-token')(client),
            configureSetup: require('./lib/methods/configure-setup')(client)
          })
        } else {
          reject(err)
        }
      }
    }
    return promise
  }

  // timeout to handle setup
  setTimeout(() => {
    if (!client) {
      reject(new Error('You must setup E-Com Plus auth before use SDK'))
    }
  }, 4000)
})

if (envDbFilename) {
  // databse filename defined by environtment variable
  // auto trigger setup
  setup()
}

module.exports = {
  setup,
  promise,
  ecomAuth: promise
}
