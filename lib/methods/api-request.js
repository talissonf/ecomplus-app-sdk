'use strict'

const apiRequest = (client) => {
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
        getAuth(storeId).then(request).catch(reject)
      }
    })
  }
}

module.exports = apiRequest
