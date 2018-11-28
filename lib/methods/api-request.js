'use strict'

const apiRequest = (client) => {
  const { db, table } = client
  // handle new credentials
  const getAuth = require('./get-auth')(client)

  return (storeId, url, method, data, auth) => {
    return new Promise((resolve, reject) => {
      const request = auth => {
        // set authentication keys
        let { myId, accessToken } = auth
        // send authenticated request to Store API
        client.axios({
          // https://github.com/axios/axios#request-config
          url,
          method,
          data,
          headers: {
            'X-Store-ID': storeId,
            'X-My-ID': myId,
            'X-Access-Token': accessToken
          }
        }).then(resolve).catch(reject)
      }

      if (auth && auth.myId) {
        // authentication already received
        request(auth)
      } else {
        // get auth from database and send request
        getAuth(storeId).then(request).catch(error => {
          // treat error response before reject
          let { response } = error

          if (response && response.status === 401 && response.data && response.data.error_code === 102) {
            // 'Authentication failed for this user ID'
            // remove current authentication
            let query = 'DELETE FROM ' + table + ' WHERE store_id = ?'
            // run query
            db.run(query, [ storeId ], err => {
              if (err) {
                // SQL error ?
                throw err
              }
              reject(error)
            })
          } else {
            reject(error)
          }
        })
      }
    })
  }
}

module.exports = apiRequest
