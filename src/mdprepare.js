#!/usr/bin/env node

const processFile = require('./processFile.js').default
const glob = require('glob-gitignore').glob
const chalk = require('chalk')
const debug = require('debug')('mdprepare')
const argv = require('minimist')(process.argv.slice(2), {'boolean': 'clear'})

debug('arguments from minimist:', argv)

let pattern
let options = {cwd: process.cwd(), ignore: ['node_modules']}
if (argv._.length === 0) { pattern = './**/*.md' } else { pattern = argv._[0] }
if (argv.hasOwnProperty('ignore')) { options.ignore.push(argv.ignore) }

debug('starting glob(' + pattern + ', ' + JSON.stringify(options))
glob(pattern, options)
.then(files => {
  debug('found ' + files.length + ' files')
  let tStart, tTaken, ms
  for (let i = 0; i < files.length; i++) {
    tStart = process.hrtime()
    process.stdout.write(files[i] + chalk.cyan(' ...processing'))
    processFile(files[i], argv.clear)
    tTaken = process.hrtime(tStart)
    ms = Math.round(tTaken[0] * 1000 + tTaken[1] / 1000000)
    process.stdout.write('\x1B[0G' + files[i] + chalk.green(' (' + ms + ' ms)            \r\n'))
  }
  console.log('processed ' + files.length + ' files')
  return 0
})
.catch((err) => {
  debug('glob failed: ' + err)
  console.error(err)
  return err
})
