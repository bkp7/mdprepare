const debug = require('debug')('mdprepare:processFile')
const {execSync} = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const h = require('./helpers.js')

export default function (filePath, clear) {
  // this function accepts a markdown filename and runs any mdprepare code which is embedded in that file
  debug(filePath)
  try {
    var txt = fs.readFileSync(filePath, 'utf8')
  } catch (err) {
    throw Error('file not found')
  }
  try {
    let p = processText(txt, clear, path.dirname(process.cwd() + filePath))
    fs.writeFileSync(filePath, p)
  } catch (err) {
    throw Error('unable to write to file')
  }
  return true
}

export function processText (txt, clear, fileDirName) {
  let posn = 0
  let r = ''
  let x
  let y
  let t
  let frm
  let cliCommand
  while (true) {
    x = h.findMdpCode(txt, posn)
    y = h.findMdpInsert(txt, posn)
    t = h.earlierOf(x, y)
    if (t.start === -1) {
      r = r + txt.substring(posn)
      break
    } else {
      r = r + txt.substring(posn, t.internalStart)
      frm = t.internalStart + t.internalLength
      cliCommand = getCliCommand(t.commandString)
      if (cliCommand === 'ERROR: mdpInsert command not found') {
        // the mdpInsert command was not present so we don't insert or remove anything, just leave as is
        r = r + txt.substr(t.internalStart, t.internalLength)
      } else {
        if (clear !== true) {
          r = r + runCliCmd(cliCommand, fileDirName)
        } else {
          // we are clearing any content so remove all lines between the start and end lines
          if (txt.substr(frm, 1) === '\r') { frm++ }
          if (txt.substr(frm, 1) === '\n') { frm++ }
        }
      }
      posn = t.start + t.length
      r = r + txt.substring(frm, posn)
    }
  }
  return r
}

function getCliCommand (str) {
  let x = str.indexOf('mdpInsert ')
  if (x === -1) {
    return 'ERROR: mdpInsert command not found'
  }
  return str.substr(x + 10)
}

export function runCliCmd (str, wDirName) {
  // wDirName is either an absolute path or a relative path to the directory node was run from
  let cmd = crossPlatformCmds(str)
  try {
    return execSync(cmd, {cwd: wDirName})
  } catch (err) {
    return 'ERROR: ' + err.message
  }
}

function crossPlatformCmds (cmd) {
  // does limited cross platform translation of limited commands
  let r = cmd
  /* istanbul ignore if  */
  if (os.platform() === 'win32') {
    if (cmd.substr(0, 4) === 'cat ') {
      r = r.replace('cat ', 'type ')
      r = r.replace(/\//g, '\\')
    }
  }
  return r
}
