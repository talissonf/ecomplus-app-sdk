'use strict'

const appPublicBody = client => {
  // handle API requests to current app resource
  const apiApp = require('./api-app')(client)

  return (storeId, auth) => {
    // optionally receive auth only to keep application ID from auth row
    // GET public application body from Store API
    // noAuth = true
    return apiApp(storeId, null, null, null, auth, true)
  }
}

module.exports = appPublicBody
