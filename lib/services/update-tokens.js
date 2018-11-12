'use strict'

const updateTokens = (client) => {
  const { db, table } = client
  // handle access token refresh
  const refreshToken = require('./../methods/refresh-token.js')(client)

  const task = () => {
    // refresh each access token every 8 hours
    let query = 'SELECT authentication_id, store_id FROM ' + table + ' WHERE updated_at < ?'
    let params = [ new Date(Date.now() + 8 * hour) ]

    // run query and get row object
    db.each(query, params, (err, row) => {
      if (!err) {
        // start app authentication flux
        refreshToken(row.store_id, row.authentication_id)
      }
    })
  }

  // run task with 1 hour interval
  let hour = 60 * 60 * 1000
  setInterval(task, hour)
  task()
}

module.exports = updateTokens
