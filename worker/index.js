'use strict'

const { workerData, parentPort } = require('worker_threads')
const Database = require('better-sqlite3')

const _executeAction = require('./db-worker-actions')

const _connect = (args) => {
  const {
    dbPath = './sqlite-db.db',
    readonly,
    fileMustExist,
    timeout = 5000,
    verbose
  } = args

  return new Database(
    dbPath,
    {
      readonly,
      fileMustExist,
      timeout,
      verbose: verbose ? console.log : null
    }
  )
}

const db = _connect(workerData)

process.on('exit', () => db.close())
process.on('SIGHUP', () => process.exit(128 + 1))
process.on('SIGINT', () => process.exit(128 + 2))
process.on('SIGTERM', () => process.exit(128 + 15))

parentPort.on('message', (args) => {
  const { action } = args

  if (!(db instanceof Database)) {
    throw new Error('ERR_DB_HAS_NOT_INITIALIZED')
  }
  if (!action) {
    throw new Error('ERR_ACTION_HAS_NOT_PASSED')
  }

  const result = _executeAction(db, args)
  parentPort.postMessage(result)
})
