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

export function findMdpCode (txt, start) {
  // finds the next location of mdpInsert in a code span within txt
  let posn = start
  let x
  while (true) {
    x = findCode(txt, posn)
    if (x.start === -1 || x.commandString.indexOf('mdpInsert ') !== -1) {
      return x
    } else {
      posn = x.start + x.length
    }
  }
}

export function findMdpInsert (txt, start) {
  let s = _findMdpStartUnfenced(txt, start)
  if (s.start === -1) { return s }
  let s1 = JSON.parse(JSON.stringify(s)) // create copy
  let depth = 1
  let e
  let posn = s1.internalStart - 2
  while (depth !== 0) {
    e = _findMdpEndUnfenced(txt, s, posn)
    if (e.start === -1) {
      // we have not found any more ends so we need to return a fail
      return e
    }
    s1 = _findMdpStartUnfenced(txt, posn)
    if (s1.start !== -1) {
      // we have found another start pattern
      if (s1.start < (e.internalStart + e.internalLength)) {
        depth++
        posn = s1.internalStart - 2
      } else {
        depth--
        posn = e.start + e.length
      }
    } else {
      depth--
      posn = e.start + e.length
    }
    if (depth > 5) { return {start: -1} }
  }
  return e
}

export function earlierOf (a, b) {
  // inspects the .start property of a and b and returns the one
  // with the lowest start position
  if (b.start !== -1 && (a.start === -1 || b.start < a.start)) {
    return b
  } else {
    return a
  }
}

export function replaceLineEndings (txt, CRLF) {
  // replaces line endings within txt, with CRLF if CRLF is true, otherwise just LF
  if (CRLF === true) {
    // NB can't do the replacement of '\n' with '\r\n' using regex due to javascript limitations
    let p = 0 // current position in the string
    let x = 0 // location of '\n' in the string
    let t = '' // output string
    while (true) {
      x = txt.indexOf('\n', p)
      if (x === -1) {
        // we've not got any more '\n' in the string so complete and exit
        t = t + txt.substr(p)
        return t
      } else if (x === 0 || txt.substr(x - 1, 1) !== '\r') {
        t = t + txt.substring(p, x) + '\r\n'
        p = x + 1
      } else {
        t = t + txt.substring(p, x + 1)
        p = x + 1
      }
    }
  } else {
    return txt.replace(/(\r\n)/g, '\n')
  }
}

function _findMdpStartUnfenced (txt, start) {
  let lookFrom = start
  let m, c
  while (true) {
    m = _findMdpStart(txt, lookFrom)
    if (m.start === -1) { return m }
    // we need to find the first code which ends after the mdp start
    c = _findCodeEndingAfter(txt, lookFrom, m.start)
    if (c.start === -1 || m.start < c.start) {
      // the mdp start we've found is not within a code fence
      break
    }
    // the mdp start we've found is within a code fence so find the next one
    lookFrom = c.start + c.length
  }
  return m

  function _findMdpStart (txt, start) {
    let regex = /(\r\n|\n|^)([ ]{0,3}\[>[^\r\n\t\0[\]]*\]: # (\([^\r\n\t\0]*\)|"[^\r\n\t\0]*"|'[^\r\n\t\0]*'))(\r\n|\n)/g
    regex.lastIndex = start
    let regexResult = regex.exec(txt)
    if (regexResult === null) { return {start: -1} }
    let r = {
      start: regexResult.index + regexResult[1].length,
      internalStart: regexResult.index + regexResult[0].length,
      commandString: regexResult[3].substring(1, regexResult[3].length - 1)
    }
    return r
  }
}

function _findCodeEndingAfter (txt, start, endingAfter) {
  // returns the first code block which ends after the position specified
  // the search starts at start
  let pos = start
  let c
  do {
    c = findCode(txt, pos)
    pos = c.start + c.length
  } while (c.start !== -1 && pos <= endingAfter)
  return c
}

function _findMdpEndUnfenced (txt, opening, start) {
  let lookFrom = start
  let m, c
  while (true) {
    m = _findMdpEnd(txt, opening, lookFrom - 2)
    if (m.start === -1) { return m }
    // we need to find the first code which ends after the mdpEnd starts
    c = _findCodeEndingAfter(txt, lookFrom, (m.internalStart + m.internalLength))
    if (c.start === -1 || (m.internalStart + m.internalLength) < c.start) { break } // the mdp end we've found is not within a code fence
    // the mdp end we've found is within a code fence so find the next one
    lookFrom = c.start + c.length
  }
  return m

  function _findMdpEnd (txt, opening, start) {
    let r = JSON.parse(JSON.stringify(opening)) // create copy of opening structure passed in
    let regex = /(\r\n|\n)([ ]{0,3}\[<[^\r\n\t\0[\]]*\]: #)(\r\n|\n|$)/g
    regex.lastIndex = start
    let regexResult = regex.exec(txt)
    if (regexResult === null) { return {start: -1} }
    r.internalLength = regexResult.index - r.internalStart
    r.length = regexResult.index + regexResult[0].length - regexResult[3].length - r.start
    return r
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
    if (regexResult === null) { return {start: -1} }
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
    if (regexResult === null) { return {start: -1} }
    r.internalLength = regexResult.index + regexResult[1].length - r.internalStart
    r.length = regexResult.index + regexResult[0].length - regexResult[3].length - r.start
    r.commandString = ''
    return r
  }
}

function _findIndentedCode (txt, start) {
  let regex = /((?:^|\r\n|\n)[ ]{4,}[^\r\n\0]*){1,}/g
  regex.lastIndex = start
  let regexResult = regex.exec(txt)
  if (regexResult === null) {
    return {start: -1}
  } else {
    return {
      start: regexResult.index,
      length: regexResult[0].length,
      internalStart: regexResult.index,
      internalLength: regexResult[0].length,
      info: {indent: regexResult[2]},
      commandString: ''
    }
  }
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
      return {start: -1}
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
