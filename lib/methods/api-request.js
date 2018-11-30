'use strict'

const apiRequest = (client) => {
  const { db, table, axios } = client
  // handle new credentials
  const getAuth = require('./get-auth')(client)
  // abstraction for API request to current app resource
  const apiApp = require('./api-app')(client)

  // limit app errors debug by store with timers
  const logTimers = {}
  const logAppError = (storeId, resBody, auth) => {
    if (!logTimers[storeId]) {
      // log on app hidden data
      const subresource = 'hidden_data'
      const method = 'PATCH'
      const data = {
        last_api_error: resBody
      }
      apiApp(storeId, subresource, method, data, auth)

      // prevent multiple "same time" log saves
      logTimers[storeId] = setTimeout(() => {
        delete logTimers[storeId]
      }, 5000)
    }
  }

  return (storeId, url, method = 'GET', data = null, auth, noAuth) => {
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
        let retry = 0
        const req = () => {
          axios(options).then(response => {
            // return response and used auth
            resolve({ response, auth })
          })

          .catch(error => {
            // treat error response before reject
            if (error.response) {
              // handle Store API error responses
              // https://developers.e-com.plus/docs/reference/store/#error-handling
              let { status, data } = error.response
              if (data && ((status === 401 && data.error_code === 102) || status === 412)) {
                // 'Authentication failed for this user ID' or no store found
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
                return
              } else if (status === 503 && retry < 2) {
                // NGINX is blocking requests for security reasons
                // wait few seconds and try again
                setTimeout(req, 2000)
                retry++
                return
              } else if (status === 401) {
                // authentication error
                // not authorized by auth scope ?
                logAppError(storeId, data, auth)
                // mark returned error object
                error.appErrorLogged = true
              }
            }

            // unexpected error response
            // just reject the promise
            reject(error)
          })
        }
        req()
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
