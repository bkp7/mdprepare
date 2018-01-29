# My Test

## Contents
<!-- @mdpInsert contents -->

- [Contents](#Contents)
- [Introduction](#Introduction)
- [Main Section](#Main Section)
  - [Part 1](Part 1)
  - [Part 2](Part 2)
<!-- \@ -->

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Main Section

### Part 1
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Part 2
<!-- @mdpInsert plaintext.txt -->

Some other text goes here.
<!-- \@ -->

### Part 3
The npm version we use is <!-- @mdpInsert npm -v -->2.4.2<!--\@ --> but that could change in future.

## Appendicies

### Appendix 1
<!-- @mdpInsert appendix1.md -->

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<!--\@ -->
### Appendix 2
#### Contents
<!-- @mdpInsert contents -->

- [Preliminaries](#Preliminaries)
- [Results](#Results)
<!-- \@ -->

#### Preliminaries
<!-- @mdpInsert contents -->

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<!-- \@ -->
#### Results
If we take a file:
<!-- @mdpInsert ./test1.json -codefence-->

```json
{
  "namesOldLayout": [{
    "given": "Fred",
    "surname": "Smith"
  }, {
    "given": "Jane",
    "surname": "Doe"
  }]
}
```
<!-- \@ -->

Using the command 
```md
<!-- @mdpInsert jsonsnip ./test1.json $.names[0] -codefence json -->
<!-- /@ -->
```
the following json comes out
<!-- @mdpInsert jsonsnip ./test1.json $.names[0] -codefence json -->

```json
{
  "given": "Freddy",
  "surname": "Smith"
}
```
<!-- \@ -->



