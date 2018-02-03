/* global describe, it */

// import processFile from '../dist/processFile.js'
// import mdprepare from '../dist/mdprepare.js'
// import {findComment} from '../dist/helpers.js'
 const processFile = require('../dist/processFile.js').default
 const {findComment, _findEarliestOf, findCode} = require('../dist/helpers.js')
 const assert = require('assert')
 const {exec} = require('child_process')

 const fencedCodeTests = [
   {name: 'Example 88', text: '```\n<\n >\n```', result: {start: 0, length: 12, internalStart: 4, internalLength: 4, commandString: ''}},
   {name: 'Example 89', text: '~~~\n<\n >\n~~~', result: {start: 0, length: 12, internalStart: 4, internalLength: 4, commandString: ''}},
   {name: 'Example 90', text: '``\nfoo\n``', result: {start: 0, length: 9, internalStart: 2, internalLength: 5, commandString: ''}},
   {name: 'Example 91', text: '```\naaa\n~~~\n```', result: {start: 0, length: 15, internalStart: 4, internalLength: 7, commandString: ''}},
   {name: 'Example 92', text: '~~~\naaa\n```\n~~~', result: {start: 0, length: 15, internalStart: 4, internalLength: 7, commandString: ''}},
   {name: 'Example 93', text: '````\naaa\n```\n``````', result: {start: 0, length: 19, internalStart: 5, internalLength: 7, commandString: ''}},
   {name: 'Example 94', text: '~~~~\naaa\n~~~\n~~~~', result: {start: 0, length: 17, internalStart: 5, internalLength: 7, commandString: ''}},
   {name: 'Example 95', text: '```', result: {start: 0, length: 3, internalStart: 3, internalLength: 0, commandString: ''}},
   {name: 'Example 96', text: '`````\n\n```\naaa', result: {start: 0, length: 14, internalStart: 6, internalLength: 8, commandString: ''}},
   {name: 'Example 97', text: '> ```\n> aaa\n\nbbb', result: {start: 0, length: 11, internalStart: 6, internalLength: 5, commandString: ''}},
   {name: 'Example 98', text: '```\n\n  ```', result: {start: 0, length: 10, internalStart: 4, internalLength: 0, commandString: ''}},
   {name: 'Example 99', text: '```\n```', result: {start: 0, length: 7, internalStart: 4, internalLength: -1, commandString: ''}},
   {name: 'Example 100', text: ' ```\n aaa\naaa\n```', result: {start: 0, length: 17, internalStart: 5, internalLength: 8, commandString: ''}},
   {name: 'Example 101', text: '  ```\naaa\n  aaa\naaa\n  ```', result: {start: 0, length: 25, internalStart: 6, internalLength: 13, commandString: ''}},
   {name: 'Example 102', text: '   ```\n   aaa\n    aaa\n   ```', result: {start: 0, length: 28, internalStart: 7, internalLength: 14, commandString: ''}},
   {name: 'Example 103', text: '    ```\n    aaa\n    ```', result: {start: 0, length: 23, internalStart: 0, internalLength: 23, commandString: ''}},
   {name: 'Example 104', text: '```\naaa\n  ```', result: {start: 0, length: 13, internalStart: 4, internalLength: 3, commandString: ''}},
   {name: 'Example 105', text: '   ```\naaa\n  ```', result: {start: 0, length: 16, internalStart: 7, internalLength: 3, commandString: ''}},
   {name: 'Example 106', text: '```\naaa\n    ```', result: {start: 0, length: 15, internalStart: 4, internalLength: 11, commandString: ''}},
   {name: 'Example 107', text: '``` ```\naaa', result: {start: 0, length: 7, internalStart: 3, internalLength: 1, commandString: ''}},
   {name: 'Example 108', text: '~~~~~~\naaa\n~~~ ~~', result: {start: 0, length: 17, internalStart: 7, internalLength: 10, commandString: ''}},
   {name: 'Example 109', text: 'foo\n```\nbar\n```\nbaz', result: {start: 4, length: 11, internalStart: 8, internalLength: 3, commandString: ''}},
   {name: 'Example 110', text: 'foo\n---\n~~~\nbar\n~~~\n# baz', result: {start: 8, length: 11, internalStart: 12, internalLength: 3, commandString: ''}},
   {name: 'Example 111', text: '```ruby\ndef foo(x)\n  return 3\nend\n```', result: {start: 0, length: 37, internalStart: 8, internalLength: 25, commandString: 'ruby'}},
   {name: 'Example 112', text: '~~~~    ruby startline=3 $%@#$\r\ndef foo(x)\r\n  return 3\r\nend\r\n~~~~~~~', result: {start: 0, length: 68, internalStart: 32, internalLength: 27, commandString: 'ruby startline=3 $%@#$'}},
   {name: 'Example 113', text: '````;\r\n````', result: {start: 0, length: 11, internalStart: 7, internalLength: -2, commandString: ';'}},
   {name: 'Example 114', text: '``` aa ```\r\nfoo', result: {start: 0, length: 10, internalStart: 3, internalLength: 4, commandString: ''}},
   {name: 'Example 115', text: '```\r\n``` aaa\r\n```', result: {start: 0, length: 17, internalStart: 5, internalLength: 7, commandString: ''}},
   {name: 'Example 324', text: '`foo`', result: {start: 0, length: 5, internalStart: 1, internalLength: 3, commandString: ''}},
   {name: 'Example 325', text: '`` foo ` bar  ``', result: {start: 0, length: 16, internalStart: 2, internalLength: 12, commandString: ''}},
   {name: 'Example 326', text: '` `` `', result: {start: 0, length: 6, internalStart: 1, internalLength: 4, commandString: ''}},
   {name: 'Example 327', text: '``\r\nfoo\r\n``', result: {start: 0, length: 11, internalStart: 2, internalLength: 7, commandString: ''}},
   {name: 'Example 328', text: '`foo   bar\r\n  baz`', result: {start: 0, length: 18, internalStart: 1, internalLength: 16, commandString: ''}},
   {name: 'Example 329', text: '`a b`', result: {start: 0, length: 5, internalStart: 1, internalLength: 3, commandString: ''}},
   {name: 'Example 330', text: '`foo `` bar`', result: {start: 0, length: 12, internalStart: 1, internalLength: 10, commandString: ''}},
   {name: 'Example 331', text: '`foo\\`bar`', result: {start: 0, length: 6, internalStart: 1, internalLength: 4, commandString: ''}},
   {name: 'Example 332', text: '*foo`*`', result: {start: 4, length: 3, internalStart: 5, internalLength: 1, commandString: ''}},
   {name: 'Example 333', text: '[not a `link](/foo`)', result: {start: 7, length: 12, internalStart: 8, internalLength: 10, commandString: ''}},
   {name: 'Example 334', text: '`<a href="`">`', result: {start: 0, length: 11, internalStart: 1, internalLength: 9, commandString: ''}},
   {name: 'Example 336', text: '`<http://foo.bar.`baz>`', result: {start: 0, length: 18, internalStart: 1, internalLength: 16, commandString: ''}},
   {name: 'Example 338', text: '```foo``', result: {start: -1}},
   {name: 'Example 339', text: '`foo', result: {start: -1}},
   {name: 'Example 340', text: '`foo``bar``', result: {start: 4, length: 7, internalStart: 6, internalLength: 3, commandString: ''}}
 ]

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
     describe('_findEarliestOf', function () {
       it('target in middle of string', function () {
         assert.deepEqual(_findEarliestOf('a test string ``` <¬-- here', 5, ['~~~', '```', '<---']), [14, 1])
       })
       it('target at beginning of string', function () {
         assert.deepEqual(_findEarliestOf('a test string ``` <¬-- here', 0, ['~~~', '````', '<!---', 'a ']), [0, 3])
       })
       it('target at end of string', function () {
         assert.deepEqual(_findEarliestOf('a test string ``` <¬-- hire', 18, ['~~~', '```', '<!---', 'e']), [26, 3])
       })
       it('target not in string', function () {
         assert.deepEqual(_findEarliestOf('a test string ``` <¬-- here', 5, ['~~~', '````', '<!---']), [-1, 0])
       })
     })
     describe('findCode', function () {
       for (let i = 0; i < fencedCodeTests.length; i++) {
         it(fencedCodeTests[i].name, function () {
           let r = findCode(fencedCodeTests[i].text)
           delete r.info
           assert.deepEqual(r, fencedCodeTests[i].result)
         })
       }
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
