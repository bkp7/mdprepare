/* global describe, it */

 const processFile = require('../dist/processFile.js').default
 const {processText} = require('../dist/processFile.js')
 const {findCode, findMdpInsert, findMdpCode} = require('../dist/helpers.js')
 const {runCliCmd} = require('../dist/processFile.js')
 const assert = require('assert')
 const {exec} = require('child_process')
 const fs = require('fs-extra')
 const os = require('os')

 const mdpLinkTests = [
   {name: 'Simple 1', text: '[>]: # (mdpInsert abc)\r\n12345\r\n[<]: #\r\n', result: {start: 0, length: 37, internalStart: 24, internalLength: 5, commandString: 'mdpInsert abc'}},
   {name: 'Simple 2', text: 't\n[> a]: # (mdpInsert abc)\r\n12345\r\n[< b]: #\r\n', result: {start: 2, length: 41, internalStart: 28, internalLength: 5, commandString: 'mdpInsert abc'}},
   {name: 'Simple 3', text: '[>]: # (mdpInsert a)\r\n[<]: #\r\n', result: {start: 0, length: 28, internalStart: 22, internalLength: -2, commandString: 'mdpInsert a'}},
   {name: 'Simple 4', text: '[>]: # (mdpInsert abc)\r\n12345\r\n[<]: #', result: {start: 0, length: 37, internalStart: 24, internalLength: 5, commandString: 'mdpInsert abc'}},
   {name: 'Simple 5 (invalid)', text: '[#]: # (mdpInsert abc)\r\n12345\r\n[<]: #\r\n', result: {start: -1}},
   {name: 'code fenced', text: '[>]: # (mdpInsert abc)\r\n12345\r\n`[<]`: #\r\n', result: {start: -1}},
   {name: 'embedded', text: '[>]: # (mdpInsert abc)\r\n12\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[<]: #\r\n345\r\n[<]: #\r\n', result: {start: 0, length: 76, internalStart: 24, internalLength: 44, commandString: 'mdpInsert abc'}},
   {name: 'embedded, 5 deep', text: '[>]: # (mdpInsert abc)\r\n12\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[<]: #\r\n\r\n[<]: #\r\n\r\n[<]: #\r\n\r\n[<]: #\r\n345\r\n[<]: #\r\n', result: {start: 0, length: 193, internalStart: 24, internalLength: 161, commandString: 'mdpInsert abc'}},
   {name: 'embedded, too deep (6) - fails', text: '[>]: # (mdpInsert abc)\r\n12\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[<]: #\r\n\r\n[<]: #\r\n\r\n[<]: #\r\n\r\n[<]: #\r\n\r\n[<]: #\r\n345\r\n[<]: #\r\n', result: {start: -1}},
   {name: 'embedded, some fenced 1', text: '[>]: # (mdpInsert abc)\r\n12\r\n```\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n```\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[<]: #\r\n\r\n```\r\n[<]: #\r\n```\r\n[<]: #\r\n\r\n[<]: #\r\n\r\n[<]: #\r\n345\r\n[<]: #\r\n', result: {start: 0, length: 250, internalStart: 24, internalLength: 218, commandString: 'mdpInsert abc'}},
   {name: 'embedded, some fenced 2', text: '[>]: # (mdpInsert abc)\r\n12\r\n```\r\n[<]: #\r\n```\r\n[<]: #\r\n[<]: #\r\n', result: {start: 0, length: 52, internalStart: 24, internalLength: 20, commandString: 'mdpInsert abc'}},
   {name: 'embedded with following', text: '[>]: # (mdpInsert abc)\r\n12\r\n[>]: # (mdpInsert xyz)\r\nxyz\r\n[<]: #\r\n345\r\n[<]: #\r\n[>]: # (mdpInsert xyz)\r\n', result: {start: 0, length: 76, internalStart: 24, internalLength: 44, commandString: 'mdpInsert abc'}}
 ]

 const mdpCodeTests = [
   {name: 'Simple 1', text: '```json mdpInsert cat e.txt\r\ncode\r\n```', result: {start: 0, length: 38, internalStart: 29, internalLength: 4, commandString: 'json mdpInsert cat e.txt'}},
   {name: 'Fails mdpinsert spelt wrong', text: '```json mdpinsert cat e.txt\r\ncode\r\n```', result: {start: -1}},
   {name: 'Complex command line', text: 'text\r\n``` json   notes  mdpInsert cat e.txt --option1 sp --option2 \r\ncode\r\n```\r\n', result: {start: 6, length: 72, internalStart: 69, internalLength: 4, commandString: 'json   notes  mdpInsert cat e.txt --option1 sp --option2'}}
 ]

 const fencedCodeTests = [
   {name: 'Simple 1', text: 'plain\r\n```\r\ncode\r\n```\r\nplain', result: {start: 7, length: 14, internalStart: 12, internalLength: 4, commandString: ''}},
   {name: 'Simple 2', text: 'plain\n```\ncode\n```\nplain', result: {start: 6, length: 12, internalStart: 10, internalLength: 4, commandString: ''}},
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
   {name: 'Example 97a', text: '> ```\n> aaa\n> \n> bbb', result: {start: 0, length: 20, internalStart: 6, internalLength: 14, commandString: ''}},
   {name: 'Example 97b', text: '> ```\r\n> aaa\r\n\r\nbbb', result: {start: 0, length: 12, internalStart: 7, internalLength: 5, commandString: ''}},
   {name: 'Example 97c', text: '> ```\r\n> aaa\r\n> \r\n> bbb', result: {start: 0, length: 23, internalStart: 7, internalLength: 16, commandString: ''}},
   {name: 'Example 97d', text: '>```a\r\n>\r\nbbb', result: {start: 0, length: 8, internalStart: 7, internalLength: 1, commandString: 'a'}},
   {name: 'Example 98', text: '```\n\n  ```', result: {start: 0, length: 10, internalStart: 4, internalLength: 0, commandString: ''}},
   {name: 'Example 99', text: '```\n```', result: {start: 0, length: 7, internalStart: 4, internalLength: -1, commandString: ''}},
   {name: 'Example 100', text: ' ```\n aaa\naaa\n```', result: {start: 0, length: 17, internalStart: 5, internalLength: 8, commandString: ''}},
   {name: 'Example 101', text: '  ```\naaa\n  aaa\naaa\n  ```', result: {start: 0, length: 25, internalStart: 6, internalLength: 13, commandString: ''}},
   {name: 'Example 101b', text: '  ```\naaa\n  aaa\naaa\n  ```\r\n', result: {start: 0, length: 25, internalStart: 6, internalLength: 13, commandString: ''}},
   {name: 'Example 101c', text: '  ```\naaa\n  aaa\naaa\n  ```\n', result: {start: 0, length: 25, internalStart: 6, internalLength: 13, commandString: ''}},
   {name: 'Example 101d', text: '\r\n  ```\naaa\n  aaa\naaa\n  ```\r\n', result: {start: 2, length: 25, internalStart: 8, internalLength: 13, commandString: ''}},
   {name: 'Example 101e', text: '\n  ```\naaa\n  aaa\naaa\n  ```\r\n', result: {start: 1, length: 25, internalStart: 7, internalLength: 13, commandString: ''}},
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
   {name: 'Example 340', text: '`foo``bar``', result: {start: 4, length: 7, internalStart: 6, internalLength: 3, commandString: ''}},
   {name: 'block and code 1', text: '>```\r\n>code\r\ntext', result: {start: 0, length: 11, internalStart: 6, internalLength: 5, commandString: ''}},
   {name: 'block and code 1b', text: '>```\r\n>code\ntext', result: {start: 0, length: 11, internalStart: 6, internalLength: 5, commandString: ''}},
   {name: 'block and code 2', text: '>```\r\n>code\r\ntext```\r\n', result: {start: 0, length: 11, internalStart: 6, internalLength: 5, commandString: ''}},
   {name: 'block and code 3', text: '>```\r\n>code\r\n>```\r\ntext', result: {start: 0, length: 17, internalStart: 6, internalLength: 5, commandString: ''}}
 ]

 const processTextTests = [
   {
     name: 'Simple 1',
     text: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n',
     clear: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\n[<]: #\r\n',
     full_win: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n',
     full_linux: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n'
   }, {
     name: 'mdpInsert command not present',
     text: '[>]: # (mdpinsert cat test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n',
     clear: '[>]: # (mdpinsert cat test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n',
     full_win: '[>]: # (mdpinsert cat test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n',
     full_linux: '[>]: # (mdpinsert cat test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n'
   }, {
     name: 'Command Line invalid',
     text: '[>]: # (mdpInsert catt test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n',
     clear: '[>]: # (mdpInsert catt test/docs/abc.txt)\r\n[<]: #\r\n',
     full_win: '[>]: # (mdpInsert catt test/docs/abc.txt)\r\nERROR: Command failed: catt test/docs/abc.txt\n\'catt\' is not recognized as an internal or external command,\r\noperable program or batch file.\r\n\r\n[<]: #\r\n',
     full_linux: '[>]: # (mdpInsert catt test/docs/abc.txt)\r\nERROR: Command failed: catt test/docs/abc.txt\n/bin/sh: 1: catt: not found\n\r\n[<]: #\r\n'
   }, {
     name: 'Surrounded',
     text: '# Simple Test\r\nSome initial text.\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\nold text\r\n[<]: #\r\nOther text',
     clear: '# Simple Test\r\nSome initial text.\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\n[<]: #\r\nOther text',
     full_win: '# Simple Test\r\nSome initial text.\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\nOther text',
     full_linux: '# Simple Test\r\nSome initial text.\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\nOther text'
   }, {
     name: 'Empty',
     text: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\n\r\n[<]: #\r\n',
     clear: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\n[<]: #\r\n',
     full_win: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n',
     full_linux: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n'
   }, {
     name: 'Blank Line',
     text: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\n[<]: #\r\n',
     clear: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\n[<]: #\r\n',
     full_linux: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n',
     full_win: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n'
   }, {
     name: 'LF only',
     text: '[>]: # (mdpInsert cat test/docs/abc.txt)\n[<]: #\n',
     clear: '[>]: # (mdpInsert cat test/docs/abc.txt)\n[<]: #\n',
     full_win: '[>]: # (mdpInsert cat test/docs/abc.txt)\nabc\n[<]: #\n',
     full_linux: '[>]: # (mdpInsert cat test/docs/abc.txt)\nabc\n[<]: #\n'
   }, {
     name: 'Two replacements',
     text: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n',
     clear: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\n[<]: #\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\n[<]: #\r\n',
     full_win: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n',
     full_linux: '[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n'
   }, {
     name: 'Code Fence 1',
     text: '```json mdpInsert cat test/docs/abc.txt\r\nxyz\r\ncode\r\n```',
     clear: '```json mdpInsert cat test/docs/abc.txt\r\n```',
     full_win: '```json mdpInsert cat test/docs/abc.txt\r\nabc\r\n```',
     full_linux: '```json mdpInsert cat test/docs/abc.txt\r\nabc\r\n```'
   }, {
     name: 'Code Fence 2',
     text: 'ss\r\n```json mdpInsert cat test/docs/abc.txt\r\n```',
     clear: 'ss\r\n```json mdpInsert cat test/docs/abc.txt\r\n```',
     full_win: 'ss\r\n```json mdpInsert cat test/docs/abc.txt\r\nabc\r\n```',
     full_linux: 'ss\r\n```json mdpInsert cat test/docs/abc.txt\r\nabc\r\n```'
   }, {
     name: 'Code Fence and link',
     text: '```json mdpInsert cat test/docs/abc.txt\r\nxyz\r\ncode\r\n```\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n',
     clear: '```json mdpInsert cat test/docs/abc.txt\r\n```\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\n[<]: #\r\n',
     full_win: '```json mdpInsert cat test/docs/abc.txt\r\nabc\r\n```\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n',
     full_linux: '```json mdpInsert cat test/docs/abc.txt\r\nabc\r\n```\r\n[>]: # (mdpInsert cat test/docs/abc.txt)\r\nabc\r\n[<]: #\r\n'
   }, {
     name: 'Missing File',
     text: '[>]: # (mdpInsert cat file/not/present.txt)\r\n12345\r\n[<]: #\r\n',
     clear: '[>]: # (mdpInsert cat file/not/present.txt)\r\n[<]: #\r\n',
     full_win: '[>]: # (mdpInsert cat file/not/present.txt)\r\nERROR: Command failed: type file\\not\\present.txt\nThe system cannot find the path specified.\r\n\r\n[<]: #\r\n',
     full_linux: '[>]: # (mdpInsert cat file/not/present.txt)\r\nERROR: Command failed: cat file/not/present.txt\ncat: file/not/present.txt: No such file or directory\n\r\n[<]: #\r\n'
   }
 ]

// describe('mdprepare', function () {
//   it('fires and returns "processed x files message"', function (done) {
//     this.timeout(4000)
//     let buf = execSync('mdprepare --ignore **/*.js')
//     assert.equal(buf.toString().substr(0, 10), 'processed ')
//     done()
//   })
// })

 describe('unit tests', function () {
   describe('helpers.js', function () {
     describe('findCode', function () {
       for (let i = 0; i < fencedCodeTests.length; i++) {
         it(fencedCodeTests[i].name, function () {
           let r = findCode(fencedCodeTests[i].text)
           delete r.info
           assert.deepEqual(r, fencedCodeTests[i].result)
         })
       }
     })
     describe('findMdpInsertBlocks', function () {
       for (let i = 0; i < mdpLinkTests.length; i++) {
         it(mdpLinkTests[i].name, function () {
           let r = findMdpInsert(mdpLinkTests[i].text)
           delete r.info
           assert.deepEqual(r, mdpLinkTests[i].result)
         })
       }
     })
     describe('findMdpCode', function () {
       for (let i = 0; i < mdpCodeTests.length; i++) {
         it(mdpCodeTests[i].name, function () {
           let r = findMdpCode(mdpCodeTests[i].text)
           delete r.info
           assert.deepEqual(r, mdpCodeTests[i].result)
         })
       }
     })
     describe('runCliCmd', function () {
       it('Simple', function () {
         assert.equal(runCliCmd('cat abc.txt', 'test/docs').toString(), 'abc')
       })
       it('invalid', function () {
         if (os.platform() === 'win32') {
           assert.equal(runCliCmd('catt abc.txt', 'test/docs').toString(), 'ERROR: Command failed: catt abc.txt\n\'catt\' is not recognized as an internal or external command,\r\noperable program or batch file.\r\n')
         } else {
           assert.equal(runCliCmd('catt abc.txt', 'test/docs').toString(), 'ERROR: Command failed: catt abc.txt\n/bin/sh: 1: catt: not found\n')
         }
       })
     })
     describe('processText', function () {
       for (let i = 0; i < processTextTests.length; i++) {
         it(processTextTests[i].name + ' --clear', function () {
           let r = processText(processTextTests[i].text, true, process.cwd())
           assert.equal(r, processTextTests[i].clear)
         })
         it(processTextTests[i].name + ' full', function () {
           let r = processText(processTextTests[i].text, false, process.cwd())
           if (os.platform() === 'win32') {
             assert.equal(r, processTextTests[i].full_win)
           } else {
             assert.equal(r, processTextTests[i].full_linux)
           }
         })
       }
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
 })

 describe('mdprepare', function () {
   it('fires and returns "processed x files message (1)"', function (done) {
     this.timeout(8000)
     exec('mdprepare --ignore=**/*.md', function (error, stdout, stderr) {
       assert.ifError(error)
       assert.notEqual(stdout.toString().indexOf('processed 0 files'), -1)
       done()
     })
   })

   it('fires and returns "processed x files message (2)"', function (done) {
     this.timeout(8000)
     exec('mdprepare fred', function (error, stdout, stderr) {
       assert.ifError(error)
       assert.notEqual(stdout.toString().indexOf('processed 0 files'), -1)
       done()
     })
   })

   it('fires and returns error if directory not found', function (done) {
     this.timeout(8000)
     exec('mdprepare //', function (error, stdout, stderr) {
       assert.ifError(error)
       assert.notEqual(stderr.toString(), '')
       done()
     })
   })
 })

 describe('mdprepare test files', function () {
   fs.emptyDirSync('./test/preparedClear')
   fs.copySync('./test/docs', './test/preparedClear')
   fs.emptyDirSync('./test/preparedFull')
   fs.copySync('./test/docs', './test/preparedFull')
   var files = fs.readdirSync('./test/docs')
   for (let i = 0; i < files.length; i++) {
     if (files[i].substr(-3) === '.md') {
       it('/test/docs/' + files[i] + ' is prepared correctly', function (done) {
         this.timeout(8000)
         exec('mdprepare ./test/preparedFull/' + files[i], function (error, stdout, stderr) {
           assert.ifError(error)
           assert.equal(fs.readFileSync('./test/preparedFull/' + files[i], 'utf8'), fs.readFileSync('./test/preparedFull/' + files[i] + '.full', 'utf8'))
           done()
         })
       })
       it('/test/docs/' + files[i] + ' is cleared correctly', function (done) {
         this.timeout(8000)
         exec('mdprepare ./test/preparedClear/' + files[i] + ' --clear', function (error, stdout, stderr) {
           assert.ifError(error)
           assert.equal(fs.readFileSync('./test/preparedClear/' + files[i], 'utf8'), fs.readFileSync('./test/preparedClear/' + files[i] + '.clear', 'utf8'))
           done()
         })
       })
     }
   }
   it('test working with read only file - should error', function (done) {
     this.timeout(8000)
     fs.writeFileSync('./test/preparedClear/readonly.md', '[>]: # (mdpInsert cat test/docs/abc.txt)\r\n12345\r\n[<]: #\r\n')
     fs.chmodSync('./test/preparedClear/readonly.md', 0o444) // make file read only
     exec('mdprepare ./test/preparedClear/readonly.md', function (error, stdout, stderr) {
       assert.ifError(error)
       assert.notEqual(stderr.toString(), '')
       done()
     })
   })
 })
