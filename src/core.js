const processFile = require('./processFile.js').default
const glob = require('glob-gitignore').glob
const ignore = require('ignore')
const chalk = require('chalk')
const debug = require('debug')('mdprepare')
const fs = require('fs')
const minimist = require('minimist')

export function cli (args) {
  const argv = minimist(args.slice(2), {'boolean': ['clear', 'help']})
  debug('arguments from minimist:', argv)

  if (argv.help) {
    printHelp()
    return
  }

  let ig = ignore()
  try {
    ig.add(fs.readFileSync('./.gitignore').toString())
  } catch (err) {
    // nothing to do if no .gitignore is present
  }
  ig.add('node_modules')
  if (argv.hasOwnProperty('ignore')) { ig.add(argv.ignore) }

  let options = {cwd: process.cwd(), ignore: ig}

  let pattern
  if (argv._.length === 0) { pattern = './**/*.md' } else { pattern = argv._ }

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
}

function printHelp () {
  console.info(chalk.cyan('  mdprepare processes markdown files and acts on any mdpInsert commands within them\n\n') +
               '  Usage: ' + chalk.whiteBright('mdprepare GLOB [options]') + chalk.gray(' process the files specified\n\n') +
               '  GLOB       ' + chalk.gray('Glob expression representing the files to be processed\n') +
               '  Options:\n' +
               '     --ignore GLOB\n' +
    chalk.grey('             GLOB represents a list of files to be ignored\n') +
               '     --clear\n' +
    chalk.gray('             clears the contents in the files specified rather than inserting\n'))
}
