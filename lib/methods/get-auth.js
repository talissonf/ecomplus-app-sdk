'use strict'

const getAuth = ({ db, table }) => {
  return (storeId, applicationId) => {
    return new Promise((resolve, reject) => {
      // select authentication for specified store from database
      let query = 'SELECT * FROM ' + table + ' WHERE store_id = ? '
      let params = [ storeId ]
      if (applicationId) {
        // also filter by application ID
        query += 'AND authentication_id = ? '
        params.push(applicationId)
      }
      // get one row only
      query += 'LIMIT 1'

      // run query and get row object
      db.each(query, params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            row,
            // for Store API authentication headers
            myId: row.authentication_id,
            accessToken: row.access_token
          })
        }
      })
    })
  }
}

module.exports = getAuth
