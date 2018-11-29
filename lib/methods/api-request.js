'use strict'

const apiRequest = (client) => {
  const { db, table, axios } = client
  // handle new credentials
  const getAuth = require('./get-auth')(client)

  return (storeId, url, method, data, auth, noAuth) => {
    return new Promise((resolve, reject) => {
      const request = auth => {
        // set authentication keys
        let { myId, accessToken } = auth
        // https://github.com/axios/axios#request-config
        let options = {
          url,
          method,
          data,
          headers: {
            'X-Store-ID': storeId
          }
        }
        if (myId && accessToken) {
          // authenticated request to Store API
          options.headers['X-My-ID'] = myId
          options.headers['X-Access-Token'] = accessToken
        }

        // send HTTP request
        axios(options).then(response => {
          // return response and used auth
          resolve({ response, auth })
        })

        .catch(error => {
          // treat error response before reject
          let { response } = error
          if (response && response.status === 401 && response.data && response.data.error_code === 102) {
            // 'Authentication failed for this user ID'
            // remove current authentication
            let sql = 'DELETE FROM ' + table + ' WHERE authentication_id = ?'
            let params = [ myId ]

            // run query
            db.run(sql, params, err => {
              if (err) {
                // SQL error ?
                throw err
              } else {
                // mark returned error object
                error.appAuthRemoved = true
              }
              reject(error)
            })
          } else {
            reject(error)
          }
        })
      }

      if (noAuth === true) {
        // public API request
        if (auth) {
          delete auth.accessToken
          request(auth)
        } else {
          request({})
        }
      } else if (auth && auth.myId) {
        // authentication already received
        request(auth)
      } else {
        // get auth from database and send request
        getAuth(storeId).then(request).catch(reject)
      }
    })
  }
}

module.exports = apiRequest
