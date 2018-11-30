'use strict'

const apiRequest = client => {
  const { db, table, axios } = client
  // handle new credentials
  const getAuth = require('./get-auth')(client)

  // count per store running request
  // prevent rate limit error
  const running = {}

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
              let { config, status, data } = error.response
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
              } else if (status === 401 && noAuth !== true && auth.row && config) {
                // authentication error
                // not authorized by auth scope ?
                // mark returned error object
                error.appErrorLog = true

                // try to log error on app hidden data
                axios({
                  url: '/applications/' + auth.row.application_id + '/hidden_data.json',
                  method: 'PATCH',
                  data: {
                    last_api_error: {
                      url: config.url,
                      method: config.method,
                      response: data
                    }
                  },
                  // keep used request headers
                  headers: options.headers
                }).then(() => {
                  error.appErrorLogged = true
                }).catch(err => {
                  error.appErrorLog = err
                }).finally(() => {
                  reject(error)
                })
                return
              }
            }

            // unexpected error response
            // just reject the promise
            reject(error)
          })
        }

        // control requests with delay
        let delayFactor = running[storeId]
        if (typeof delayFactor !== 'number') {
          running[storeId] = delayFactor = 0
        }
        running[storeId]++
        setTimeout(() => {
          running[storeId]--
          req()
        }, delayFactor * 200)
      }

      if (noAuth === true) {
        // public API request
        if (auth) {
          request({
            ...auth,
            accessToken: null
          })
        } else {
          request({})
        }
      } else if (auth && auth.myId && auth.accessToken) {
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
