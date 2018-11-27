'use strict'

const configureSetup = (client) => {
  return (procedures, callback) => {
    // enable and configure stores setup
    require('./../services/setup-stores')(client, { procedures, callback })
  }
}

module.exports = configureSetup
