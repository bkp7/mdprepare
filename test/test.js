/* global describe, it */

import processFile from '../dist/processFile.js'
import mdprepare from '../dist/mdprepare.js'
const assert = require('assert')
const {exec} = require('child_process')

exec('mdprepare --ignore **/*.js', (err, stdout, stderr) => {
  if (err) {
    console.log(stderr)
    return
  }

  console.log(stdout)
})

describe('Dummy test', function () {
  it('1 should equal 1', function () {
    assert.equal(1, 1)
  })
  it('reference mdprepare', function () {
    assert(mdprepare)
  })
  it('process file should fire', function () {
    assert.equal(processFile('fred'), 'success')
  })
})
