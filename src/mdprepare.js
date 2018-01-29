#!/usr/bin/env node

import processFile from './processFile.js'
import {glob} from 'glob-gitignore'

const debug = require('debug')('mdprepare')
const argv = require('minimist')(process.argv.slice(2))

debug('arguments from minimist:', argv)

let pattern
let options = {cwd: process.cwd(), ignore: ['node_modules']}
if (argv._.length === 0) { pattern = './**/*.md' } else { pattern = argv._[0] }
if (argv.hasOwnProperty('ignore')) { options.ignore.push(argv.ignore) }

debug('starting glob(' + pattern + ', ' + JSON.stringify(options))
glob(pattern, options)
.then(files => {
  debug('found ' + files.length + ' files')
  for (let i = 0; i < files.length; i++) {
    processFile(files[i])
  }
})
.catch((err) => {
  debug('glob failed: ' + err)
  console.error(err)
  return err
})
