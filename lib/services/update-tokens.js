'use strict'

// axios HTTP client
// https://github.com/axios/axios
const axios = require('axios')
// Store API endpoint to authenticate with callback
const endpoint = 'https://api.e-com.plus/v1/_callback.json'

const updateTokens = ({ db, table }) => {
  const task = () => {
    // refresh each access token every 8 hours
    let query = 'SELECT authentication_id, store_id FROM ' + table + ' WHERE updated_at < ?'
    let params = [ new Date(Date.now() + 8 * hour) ]

    // run query and get row object
    db.each(query, params, (err, row) => {
      if (!err) {
        // start app authentication flux
        // send POST request to Store API
        axios.post(endpoint, {
          _id: row.authentication_id
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-Store-ID': row.store_id
          }
        })
      }
    })
  }

  // run task with 1 hour interval
  let hour = 60 * 60 * 1000
  setInterval(task, hour)
  task()
}

module.exports = updateTokens
