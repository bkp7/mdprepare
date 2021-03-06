/** findMdpInsert and findCode functions use a similar layout to return the location and contents
  *   .start          => points at the character in the string why the other item starts (ie. comment or code block)
  *   .length         => is the overall length of the comment or code block.
  *   .internalStart  => points at the character in the string where the internal payload starts
  *   .internalLength => is the length of the internal payload
  *   .commandString  => is the command string found within the particular item
  *   .info           => is a structure containing further info about what was found
  * if start is returned as -1 then nothing was found
  *
  * The internalStart/internaLength defines the internal content which will be replaced. This does not include
  * leading and lagging CRLF/LF. So the replacement text is not required to have either leading or lagging line
  * endings. However, if the internalLength is negative this means that leading CRLF or LF must be added by the insertion
  * routine. The reason for this is that it allows insertions between code fences or mdpInsert pairs which have zero lines
  * between them.
  *
**/

const { earlierOf } = require('./helpers.js')

export function findCode (txt, start) {
  /**
  * finds the next code in the string provided starting at position start
  * returns an object containing start, length, internalStart, internalLength
  *
  * there are three types of code insertion - code span (inline), fenced code and indented code
  *
  * eg. span (1 or more backticks):
  * some text ``echo myfile.txt`` more text
  *
  * eg. indented (4 or more indent spaces):
  * some text
  *     function test() {
  *       console.log('test')
  *     }
  * more text
  *
  * eg. fenced (3 or more backticks on a row on their own)
  * some text
  * ``` js
  * function test() {
  *   console.log('test')
  * }
  * ```
  * more text
  *
  **/
  let x = _findFencedCode(txt, start)
  let y = _findIndentedCode(txt, start)
  let z = _findCodeSpan(txt, start)

  return earlierOf(x, earlierOf(y, z))
}

function _findFencedCode (txt, start) {
  // if the internalLength is returned as -1 this means that text cannot simply be inserted at the internalStart
  // location. Instead an additional preceding new line must be inserted along with the new text
  // another way to look at this is that the internal text is 1 character short
  // a value of -2 indicates a CRLF needs to be inserted
  let a = _findOpeningCodeFence(txt, start)
  if (a.start === -1) { return a }
  return _findClosingCodeFence(txt, a)

  function _findOpeningCodeFence (txt, start) {
    // returns the location and type of the next opening code fence
    let regex = /(^|\r\n|\n)([ ]{0,3}> |>|[ ]{0,0})(([ ]{0,3})([`]{3,}|[~]{3,})([^\n\r\0`]*))($|\r\n|\n)/g
    /** The regex groups are:
      * 0: the full match including any preamble block markup
      * 1: the leading new line character(s)
      * 2: the preamble consisting of block characters or nothing
      * 3: the full codeFence line without preamble
      * 4: any leading blank spaces at the start of the codeFence line
      * 5: the ` or ~ characters identifying the codeFence
      * 6: anything else on the line following the codeFence
      * 7: the final new line character(s)
    **/
    regex.lastIndex = start
    let regexResult = regex.exec(txt)
    if (regexResult === null) {
      return { start: -1 }
    }
    let r = { start: regexResult.index + regexResult[1].length,
      info: {
        blockQuote: regexResult[2],
        spacesCount: regexResult[4].length,
        codeFence: regexResult[5]
      },
      commandString: regexResult[6].trim(),
      internalStart: regexResult.index + regexResult[0].length
    }
    return r
  }

  function _findClosingCodeFence (txt, opening) {
    // updates the passed result structure with the location and type of the next closing code fence
    // to match the opening cofeFence passed in
    let regex
    let r = JSON.parse(JSON.stringify(opening)) // create copy of opening structure passed in
    regex = RegExp('(^|\r\n|\n)([ ]{0,3}> |>|[ ]{0,0})[ ]{0,3}[' + r.info.codeFence[0] + ']{' + r.info.codeFence.length + ',}[ ]*($|\r\n|\n)', 'g')
    regex.lastIndex = r.internalStart - 2
    let regexResult = regex.exec(txt)
    if (opening.info.blockQuote.length !== 0) {
      // we are in a block quote so the codeFence will end at the earlier of the found regex OR end of the block quote
      let b = _findEndOfBlock(txt, r.internalStart)
      if (b !== -1 && (regexResult === null || b < (regexResult.index + regexResult[1].length))) {
        // the block end dictates the code block end
        r.internalLength = b - r.internalStart
        r.length = b - r.start
        return r
      }
    }
    if (regexResult === null) {
      r.internalLength = txt.length - r.internalStart
      r.length = txt.length - r.start
    } else {
      r.internalLength = regexResult.index - r.internalStart
      r.length = regexResult.index + regexResult[0].length - regexResult[3].length - r.start
    }
    return r
  }

  function _findEndOfBlock (txt, start) {
    // finds the first line which is not marked as block
    let regex = /(\r\n|\n)(?!([ ]{0,3}> |>))[^>\r\n]*/g
    regex.lastIndex = start
    let regexResult = regex.exec(txt)
    if (regexResult === null) {
      return -1
    } else {
      return regexResult.index
    }
  }
}

function _findIndentedCode (txt, start) {
  let regex = /((?:^|\r\n|\n)[ ]{4,}[^\r\n\0]*){1,}/g
  regex.lastIndex = start
  let regexResult = regex.exec(txt)
  if (regexResult === null) {
    return { start: -1 }
  } else {
    return {
      start: regexResult.index,
      length: regexResult[0].length,
      internalStart: regexResult.index,
      internalLength: regexResult[0].length,
      info: { indent: regexResult[2] },
      commandString: ''
    }
  }
}

function _findCodeSpan (txt, start) {
  // finds an inline Code Span in the format: 'some text ``echo myfile.txt`` more text'
  // look for start
  let lookFrom = start
  while (true) {
    let s = _findCodeSpanStart(txt, lookFrom)
    if (s.start === -1) { return s }
    // look for end
    let e = _findCodeSpanEnd(txt, s)
    if (e.start !== -1) { return e }
    lookFrom = s.internalStart
  }

  function _findCodeSpanStart (txt, start) {
    let regex = /(^|[^`])(`+)[^`]/g
    // 1st capture group is the first (or no) character prior to the identifying `'s
    // 2nd group is the ` characters (however many there are)
    regex.lastIndex = start
    let regexResult = regex.exec(txt)
    if (regexResult === null) { return { start: -1 } }
    let r = {
      start: regexResult.index + regexResult[1].length,
      internalStart: regexResult.index + regexResult[1].length + regexResult[2].length,
      info: {
        codeFence: regexResult[2]
      }
    }
    return r
  }

  function _findCodeSpanEnd (txt, opening) {
    let r = JSON.parse(JSON.stringify(opening)) // create copy of opening structure passed in
    let regex = RegExp('([^`])(' + r.info.codeFence + ')($|[^`])', 'g')
    regex.lastIndex = r.internalStart
    let regexResult = regex.exec(txt)
    if (regexResult === null) { return { start: -1 } }
    r.internalLength = regexResult.index + regexResult[1].length - r.internalStart
    r.length = regexResult.index + regexResult[0].length - regexResult[3].length - r.start
    r.commandString = ''
    return r
  }
}
