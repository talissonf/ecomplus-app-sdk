'use strict'

const handleCallback = (client) => {
  const { db, table } = client
  // handle access token refresh
  const refreshToken = require('./refresh-token')(client)

  return (storeId, reqBody) => {
    return new Promise((resolve, reject) => {
      let sql, values

      // first validation of function params
      if (typeof storeId !== 'number' || isNaN(storeId) || storeId <= 0) {
        reject(new Error('Undefined or invalid Store ID, must be a positive number'))
        return
      } else if (typeof reqBody !== 'object' || reqBody === null) {
        reject(new Error('Undefined or invalid request body'))
        return
      }

      // application and authentication objects from body if any
      const { application, authentication } = reqBody
      // whether new application was installed
      let isNew

      if (application && reqBody.store_id === storeId) {
        // insert application with respective authentication data
        try {
          values = [
            application._id,
            application.app_id,
            application.title,
            authentication._id,
            JSON.stringify(authentication.permissions),
            storeId
          ]
          sql = 'INSERT INTO ' + table + ` (
            application_id,
            application_app_id,
            application_title,
            authentication_id,
            authentication_permissions,
            store_id
          ) VALUES (?, ?, ?, ?, ?, ?)`
        } catch (err) {
          reject(err)
          return
        }

        // new app installed
        isNew = true
      } else if (reqBody.my_id && reqBody.access_token) {
        // authentication flux callback
        // should update access token for current authentication
        values = [
          reqBody.access_token,
          reqBody.my_id,
          storeId
        ]
        sql = 'UPDATE ' + table + ` SET
          access_token = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE authentication_id = ? AND store_id = ?`

        // authenticating an already installed app
        isNew = false
      } else {
        reject(new Error('Unexpected request body, properties not found'))
        return
      }

      // run query
      db.run(sql, values, err => {
        if (!err) {
          let authenticationId
          if (isNew) {
            authenticationId = authentication._id
            // generate access token by the first time
            // start app authentication flux
            refreshToken(storeId, authenticationId)
          } else {
            authenticationId = reqBody.my_id
          }

          // success callback with handled authentication ID
          resolve({
            isNew,
            authenticationId
          })
        } else {
          reject(err)
        }
      })
    })
  }
}

module.exports = handleCallback
