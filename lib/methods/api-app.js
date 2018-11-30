'use strict'

const apiApp = client => {
  // handle new credentials
  const getAuth = require('./get-auth')(client)
  // handle API requests
  const apiRequest = require('./api-request')(client)

  return (storeId, subresource, method, data, auth, noAuth) => {
    return new Promise((resolve, reject) => {
      const request = auth => {
        // send authenticated request to Store API
        // current application ID from auth row
        let url = '/applications/' + auth.row.application_id
        if (subresource) {
          url += '/' + subresource
        }
        url += '.json'
        apiRequest(storeId, url, method, data, auth, noAuth).then(resolve).catch(reject)
      }

      if (auth && auth.row) {
        // authentication already received with row additional data
        request(auth)
      } else {
        // get auth from database and send request
        getAuth(storeId).then(request).catch(reject)
      }
    })
  }
}

module.exports = apiApp
