'use strict'

// log on files
const logger = require('console-files')

const setupStores = (client, options) => {
  const { db, table } = client
  const { procedures, callback } = options
  // handle authenticated API requests
  const apiRequest = require('./../methods/api-request')(client)

  const task = () => {
    // get stores to be setted up
    let query = 'SELECT store_id FROM ' + table + ' WHERE setted_up = 0 ORDER BY created_at ASC'
    // run query and get each row object
    db.each(query, (err, row) => {
      if (!err) {
        let storeId = row.store_id

        ;(async function loop () {
          let error
          // save procedures
          if (procedures) {
            for (let i = 0; i < procedures.length; i++) {
              // create new procedures
              const url = '/procedures.json'
              const method = 'POST'
              try {
                await apiRequest(storeId, url, method, procedures[i])
              } catch (err) {
                // stop creating procedures
                error = err
                break
              }
            }
          }

          // after procedures saved
          // run callback function if any
          if (typeof callback === 'function') {
            callback(error, { storeId })
          }
          if (error) {
            // TODO: try to save error on app hidden data
            return
          }

          // all done
          // remove from queue
          let query = 'UPDATE ' + table + ' SET setted_up = 1 WHERE store_id = ?'
          db.run(query, [ storeId ], err => {
            if (err) {
              logger.error(err)
            }
          })
        }())
      } else {
        // SQL error ?
        logger.error(err)
      }
    })
  }

  // start task loop
  task()
}

module.exports = setupStores
