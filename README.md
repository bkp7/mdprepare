# mdprepare

A command line utility to prepare and process md files ready for publication.

[![Build Status](https://travis-ci.org/bkp7/mdprepare.svg?branch=master)](https://travis-ci.org/bkp7/mdprepare) [![Windows Tests](https://img.shields.io/appveyor/ci/bkp7/mdprepare/master.svg?label=Windows%20build)](https://ci.appveyor.com/project/bkp7/mdprepare) [![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/@bkp7/mdprepare) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/bkp7/mdprepare/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/bkp7/mdprepare/?branch=master) [![Coverage Status](https://coveralls.io/repos/github/bkp7/mdprepare/badge.svg?branch=master)](https://coveralls.io/github/bkp7/mdprepare?branch=master)

## THIS UTILITY IS UNDER CONSTRUCTION AND NOT READY FOR USE YET

## Introduction
Allows anything that can be obtained at the command line to be inserted into a markdown document. Including a whole file, a file extract or true program output.

This is useful if you wish to reuse documents located separately, or wish to insert data/code samples which have been subjected to tests and can therefore be guaranteed to be up to date in your documentation.

## Installation

`npm install mdprepare`

## Getting Started

Create two files
toInsert.md:
```markdown
### Heading
Example text
```

and example.md
```markdown
# Demonstration of mdprepare
The contents of  toInsert.md are inserted between here
[>]: # (mdpInsert -file ./toInsert.md)
[<]: #
and here
```

Then from the command line run `mdprepare` and see the changes made to example.md

The above two files are included as part of the package and can be copied to your working directory from `node_modules/mdprepare/demo`

## Running mdprepare

From the command line run `mdprepare` which will process all md files in the current and any child folders (ignoring the node_modules folder). Alternatively can be fired from any script in package.json. For a full explanation of all the options see [mdprepare Command](#mdprepare-command)

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

## Detailed specifications

### mdprepare Command

Usage: `mdprepare [FILES] [options]`

`FILES` is a glob expression representing the files to be processed - default: `./**/*.md`

Options:
`--ignore` glob expression representing files to be ignored - default values: `node_modules` and the contents of .gitignore if present. eg. `mdprepare --ignore=test*.md`
`--clear` removes any existing text which would normally be replaced by mdprocess.

### mdpInsert Command

Usage: within either of the two insertion methods: `mdpInsert' [option] [arguments]

Options:
`--cmd` runs all that follows as if from the command line, inserting the result. This is the default option so does not have to be present
`--contents` inserts a contents section built from headings within your document
`--file` inserts text from (part of) a file

### Additional commands

Installing json-snip allows the following:
````markdown
```mdpInsert json-snip example.json --ellipsify alarm !timestamp
{'JsonExtract': 'inserted here'}
```
````





