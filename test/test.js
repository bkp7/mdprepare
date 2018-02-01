/* global describe, it */

// import processFile from '../dist/processFile.js'
// import mdprepare from '../dist/mdprepare.js'
// import {findComment} from '../dist/helpers.js'
 const processFile = require('../dist/processFile.js').default
 const findComment = require('../dist/helpers.js').findComment
 const assert = require('assert')
 const {exec} = require('child_process')

 describe('Dummy test', function () {
   it('1 should equal 1', function () {
     assert.equal(1, 1)
   })
 })

// describe('mdprepare', function () {
//   it('fires and returns "processed x files message"', function (done) {
//     this.timeout(4000)
//     let buf = execSync('mdprepare --ignore **/*.js')
//     assert.equal(buf.toString().substr(0, 10), 'processed ')
//     done()
//   })
// })

 describe('mdprepare', function () {
   it('fires and returns "processed x files message (1)"', function (done) {
     this.timeout(4000)
     exec('mdprepare --ignore **/*.js', function (error, stdout, stderr) {
       assert.ifError(error)
       assert.equal(stdout.toString().substr(0, 10), 'processed ')
       done()
     })
   })

   it('fires and returns "processed x files message (2)"', function (done) {
     this.timeout(4000)
     exec('mdprepare fred', function (error, stdout, stderr) {
       assert.ifError(error)
       assert.equal(stdout.toString().substr(0, 10), 'processed ')
       done()
     })
   })

   it('fires and returns error if directory not found', function (done) {
     this.timeout(4000)
     exec('mdprepare //', function (error, stdout, stderr) {
       assert.ifError(error)
       assert.notEqual(stderr.toString(), '')
       done()
     })
   })
 })

 describe('unit tests', function () {
   describe('helpers.js', function () {
     describe('findComment', function () {
       it('finds no comment style <--..-->', function () {
         assert.equal(findComment('H<--e-->llo', 0).start, -1)
       })
       it('finds comment style <!--..-->', function () {
         assert.deepEqual(findComment('H<!--e-->llo', 0), {start: 1, length: 8, internalStart: 5, internalLength: 1})
       })
       it('finds comment style <!--..', function () {
         assert.deepEqual(findComment('H<!--ello', 0), {start: 1, length: 8, internalStart: 5, internalLength: 4})
       })

       it('finds no comment style <---..-->', function () {
         assert.equal(findComment('H<---e-->llo', 0).start, -1)
       })
       it('finds comment style <!---..-->', function () {
         assert.deepEqual(findComment('H<!---e-->llo', 0), {start: 1, length: 9, internalStart: 6, internalLength: 1})
       })
       it('finds comment style <!--..', function () {
         assert.deepEqual(findComment('H<!---elloee', 0), {start: 1, length: 11, internalStart: 6, internalLength: 6})
       })

       it('finds comment style (2A) [//]: <> (comment)\r\n', function () {
         assert.deepEqual(findComment('test[//]: <> (comment)\r\nend', 0), {start: 4, length: 20, internalStart: 14, internalLength: 7})
       })
       it('finds comment style (2B) [//]: <> (comment)\n', function () {
         assert.deepEqual(findComment('test[//]: <> (comment)\nend', 0), {start: 4, length: 19, internalStart: 14, internalLength: 7})
       })
     })
   })
   describe('processFile.js', function () {
     it('reference to processFile.js OK', function () {
       assert(processFile)
     })
     it('process file against missing file should error', function () {
       assert.throws(function () { processFile('not a file') }, /file not found/)
     })
   })
 })
