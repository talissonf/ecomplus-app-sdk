'use strict'

const appPublicBody = client => {
  // handle API requests to current app resource
  const apiApp = require('./api-app')(client)

  // GET public application body from Store API
  const subresource = null
  const method = 'GET'
  const data = {}
  const noAuth = true

  return (storeId, auth) => {
    // optionally receive auth only to keep application ID from auth row
    return apiApp(storeId, subresource, method, data, auth, noAuth)
  }
}

module.exports = appPublicBody
