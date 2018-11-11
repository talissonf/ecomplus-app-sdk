'use strict'

// SQLite3 client
// https://github.com/mapbox/node-sqlite3
const sqlite = require('sqlite3').verbose()

// setup database and table and return methods
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
      resolve()
    }
  })
}

module.exports = setup
