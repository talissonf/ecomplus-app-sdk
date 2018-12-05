'use strict'

const getAuth = ({ db, table }) => {
  return (storeId, authenticationId) => {
    return new Promise((resolve, reject) => {
      // select authentication for specified store from database
      let query = 'SELECT * FROM ' + table + ' WHERE store_id = ? '
      let params = [ storeId ]
      if (authenticationId) {
        // also filter by authentication ID
        query += 'AND authentication_id = ? '
        params.push(authenticationId)
      }
      // get one row only
      query += 'LIMIT 1'

      // run query and get row object
      db.get(query, params, (err, row) => {
        if (err) {
          reject(err)
        } else if (row) {
          resolve({
            row,
            // for Store API authentication headers
            myId: row.authentication_id,
            accessToken: row.access_token
          })
        } else {
          reject(new Error('No authentication found'))
        }
      })
    })
  }
}

module.exports = getAuth
