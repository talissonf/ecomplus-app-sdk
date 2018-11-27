'use strict'

// log on files
const logger = require('console-files')

const configureSetup = (client) => {
  return (procedures, callback) => {
    // enable and configure stores setup
    logger.log('Enable E-Com Plus stores setup')
    require('./lib/services/setup-stores')(client, { procedures, callback })
  }
}

module.exports = configureSetup
