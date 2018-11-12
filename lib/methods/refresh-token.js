'use strict'

const refreshToken = ({ axios }) => {
  return (storeId, authenticationId) => {
    // try to force refresh token of one specific authentication
    // send POST request to Store API starting auth flux
    return axios.post('/_callback.json', {
      _id: authenticationId
    }, {
      headers: {
        'X-Store-ID': storeId
      }
    })
  }
}

module.exports = refreshToken
