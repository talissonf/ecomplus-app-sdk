'use strict'

const updateTokens = (client) => {
  const { db, table } = client
  // handle access token refresh
  const refreshToken = require('./../methods/refresh-token')(client)

  const task = () => {
    // refresh each access token every 8 hours
    let query = 'SELECT authentication_id, store_id FROM ' + table +
    ' WHERE updated_at < datetime("now", "-8 hours") OR updated_at IS NULL'

    // run query and get each row object
    db.each(query, (err, row) => {
      if (!err) {
        // start app authentication flux
        refreshToken(row.store_id, row.authentication_id).catch(err => {
          // throw err
          console.error(err)
        })
      } else {
        throw err
      }
    })
  }

  // run task with 1 hour interval
  const hour = 60 * 60 * 1000
  setInterval(task, hour)
  task()
}

module.exports = updateTokens
