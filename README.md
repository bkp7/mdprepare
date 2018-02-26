# mdprepare

[![Greenkeeper badge](https://badges.greenkeeper.io/bkp7/mdprepare.svg)](https://greenkeeper.io/)

A command line utility to prepare and process md files ready for publication.

[![Build Status](https://travis-ci.org/bkp7/mdprepare.svg?branch=master)](https://travis-ci.org/bkp7/mdprepare) [![Windows Tests](https://img.shields.io/appveyor/ci/bkp7/mdprepare/master.svg?label=Windows%20build)](https://ci.appveyor.com/project/bkp7/mdprepare) [![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/@bkp7/mdprepare) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/bkp7/mdprepare/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/bkp7/mdprepare/?branch=master) [![Coverage Status](https://coveralls.io/repos/github/bkp7/mdprepare/badge.svg?branch=master)](https://coveralls.io/github/bkp7/mdprepare?branch=master)

## Introduction
Allows anything that can be obtained at the command line to be inserted into a markdown document. Including a whole file, a file extract or any program output via stdout.

This is useful if you wish to reuse documents located separately, or wish to insert data/code samples which have been subjected to tests and can therefore be guaranteed to be up to date in your documentation.

## Installation

`npm install mdprepare`

## Demo

Create two files
- toInsert.md:

```markdown
### Heading
Example text
```
- example.md:

```markdown
# Demonstration of mdprepare
The contents of  toInsert.md are inserted between here
[>]: # (mdpInsert cat ./toInsert.md)
[<]: #
and here
```

Then from the command line run `mdprepare` and see the changes made to example.md

The above two files are included as part of the package and can be copied to your working directory from `node_modules/mdprepare/demo`

## Running mdprepare

From the command line run `mdprepare` which will process all md files in the current and any child folders (ignoring the node_modules folder). Alternatively it can be fired from any script in package.json. For a full explanation of all the options see [mdprepare Command](#mdprepare-command)

## Insertion methods

There are two methods of insertion

### (Ab)Using markdown link destinations

Compatible with most dialects of markdown, a pair of link destinations are used to surround the area which will receive the inserted text. eg:
````markdown

[>]: # (mdpInsert cat ./example1.md)
some previous text
[<]: #
````
The first character (`<` or `>`) in the square brackets is required as are the square brackets, hash, and spaces. Other text in the square brackets is ignored so can be used for your comments. The command itself can be enclosed in brackets, single quote, or double quote, so the following are also valid pairs:
````markdown

[>]: # " mdpInsert node -v "
[<]: #

[>my comments]: # 'mdpInsert echo "it works"'
[<more comments]: #
````

Note that a blank line is required before the openning link destination to ensure maximum compatibility with markdown browsers. See [this stack**overflow**](https://stackoverflow.com/questions/4823468/comments-in-markdown/32190021#32190021) question for details. Importantly the format shown here with the blank line also works perfectly for both npm and GitHub.

### Fenced Code

A second method which is compatible GitHub flavored Markdown is to add the mdpInsert statement on the same line as the opening fence, after the code style (if used) eg.
````markdown
```json mdpInsert cat ./example1.json
{example: 'previous version'}
```
````

#### Limitations

- mdpInsert using code fences will only work on top level or one level down blocks
So this is **will work**:
````md
```js mdpInsert example1.js
someCode()
```
> ```js mdpInsert example2.js
> moreCode()
> ```
````
but this **will fail**:
````md
>> ```js mdpInsert example1.js
>> someCode()
>> ```
````

## Detailed specifications

### mdprepare CLI Command

Usage: `mdprepare [FILES] [options]`

`FILES` is a glob expression representing the files to be processed, the default is: `./**/*.md`

Options:
`--ignore` glob expression representing files to be ignore. By default `node_modules` and the contents of .gitignore are ignored. Example: `mdprepare --ignore=test*.md`

`--clear` removes any existing text which would normally be replaced by mdprocess leaving a lightweight master document. There is no requirement to use this option as old text will always be replaced.

### mdpInsert Statement

Usage: within either of the two insertion methods: `mdpInsert' [option] [arguments]

Options:
`--cmd` runs all that follows as if from the command line, inserting the result. This is the default option so does not have to be present
`--contents` (awaiting implementation) inserts a contents section built from headings within your document

### Additional commands

Installing [fsnip](https://www.npmjs.com/package/fsnip) alongside mdprepare allows the following:
````markdown
```json mdpInsert fsnip example.json --ellipsify alarm !timestamp
{'JsonExtract': 'inserted here'}
```
````
or:
````markdown
```mdpInsert fsnip example.txt --from startTag --to endTag
text file extract inserted here
```
````
or:
````markdown
[>]: # (mdpInsert fsnip example.md --start '"## Heading 1"' --to '"## Heading 2"')
## Heading 1
Section contents inserted here
[<]: #
````
See fsnip [documentation](https://www.npmjs.com/package/fsnip) for further details.

### Note:
Both mdprepare and fsnip are designed to be cross platform compatible.




