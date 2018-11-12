'use strict'

const handleCallback = ({ db, table }) => {
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

      if (reqBody.application && reqBody.store_id === storeId) {
        // new app installed
        // inster a new application with respective authentication data
        let { application, authentication } = reqBody
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
        } catch (e) {
          reject(e)
          return
        }
      } else if (reqBody.my_id && reqBody.access_token) {
        // authentication callback
        // should update access token for current authentication
        values = [
          reqBody.access_token,
          reqBody.my_id,
          storeId
        ]
        sql = 'UPDATE ' + table + `
        SET access_token = ?
        WHERE authentication_id = ? AND store_id = ? LIMIT 1`
      } else {
        reject(new Error('Unexpected request body, properties not found'))
        return
      }

      // run query
      db.run(sql, values, err => {
        if (!err) {
          resolve({ isNew: !!(reqBody.application) })
        } else {
          reject(err)
        }
      })
    })
  }
}

module.exports = handleCallback
