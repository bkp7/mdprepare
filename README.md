# mdprepare

A command line utility to prepare and process md files ready for publication.

[![Build Status](https://travis-ci.org/bkp7/mdprepare.svg?branch=master)](https://travis-ci.org/bkp7/mdprepare) [![Windows Tests](https://img.shields.io/appveyor/ci/bkp7/mdprepare/master.svg?label=Windows%20build)](https://ci.appveyor.com/project/bkp7/mdprepare) [![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/@bkp7/mdprepare) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/bkp7/mdprepare/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/bkp7/mdprepare/?branch=master) [![Coverage Status](https://coveralls.io/repos/github/bkp7/mdprepare/badge.svg?branch=master)](https://coveralls.io/github/bkp7/mdprepare?branch=master)

## THIS UTILITY IS UNDER CONSTRUCTION AND NOT READY FOR USE YET

## Introduction
Allows anything that can be obtained at the command line to be inserted into a markdown document. This could be anything from a simple file, a file extract or true program output.

This is useful if you wish to reuse documents located separately, or wish to insert data/code samples which have been subjected to tests and can therefore be guaranteed to be up to date.

For example if you wished to insert the contents of example1.json (to replace the previous version):
````markdown
Plain text
```json mdpInsert cat ./example1.json
{example: 'previous version'}
```
More plain text 
````

## Insertion methods

There are two methods of insertion

### (Ab)Using markdown link destinations

A pair of link destinations are used to surround the area which will receive the inserted text. eg:
````markdown
[> optional text]: # (mdpInsert cat ./example1.md)
some previous text
[< other optional text]: #
````
The first character in the square brackets is required as are the square brackets, hash, and spaces. The command itself can be enclosed in brackets, single quote, or double quote, so all the following are valid pairs:
````markdown
[>]: # (mdpInsert cat example.txt)
[<]: #

[>]: # " mdpInsert node -v "
[<]: #

[>my comments]: # 'mdpInsert echo "it works"'
[<more comments]: #
````

### Fenced Code

On the same line as the opening fence, after the code style (if used), place the mdpInsert statement eg.
````markdown
```json mdpInsert cat ./example1.json
{example: 'previous version'}
```
````

## Limitations

- mdpInsert within 'comment' pairs if the 'comments' are at top level (ie not within code, a block, or a list, etc)
- mdpInsert using code fences will only work on top level or one level down blocks
This is will work:
````md
```js mdpInsert example1.js
someCode()
```
> ```js mdpInsert example2.js
> moreCode()
> ```
````
This will fail:
````md
>> ```js mdpInsert example1.js
>> someCode()
>> ```
````

