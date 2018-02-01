const debug = require('debug')('mdprepare:processFile')
const fs = require('fs')
const h = require('./helpers.js')

export default function (filePath) {
  // this function accepts a markdown filename and runs any mdprepare code which is embedded in that file
  debug(filePath)
  try {
    var txt = fs.readFileSync(filePath, 'utf8')
  } catch (err) {
    throw Error('file not found')
  }
  inspectText(txt)
  return 'success'
}

function inspectText (txt) {
  // looks for, and records line information for the file
  // also looks for comments
  return h.findComment(txt, 0)
}
