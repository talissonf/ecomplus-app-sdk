'use strict'

const apiRequest = (client) => {
  // handle new credentials
  const getAuth = require('./get-auth.js')(client)

  return (storeId, url, method, data, auth) => {
    // set authentication keys
    let { myId, accessToken } = auth && auth.myId ? auth : getAuth(storeId)
    // send authenticated request to Store API
    return client.axios({
      // https://github.com/axios/axios#request-config
      url,
      method,
      data,
      headers: {
        'X-Store-ID': storeId,
        'X-My-ID': myId,
        'X-Access-Token': accessToken
      }
    })
  }
}

module.exports = apiRequest
