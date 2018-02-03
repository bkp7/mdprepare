/** findComment and findCode functions use a similar layout to return the location and contents
  *   .start          => points at the character in the string why the other item starts (ie. comment or code block)
  *   .length         => is the overall length of the comment or code block.
  *   .internalStart  => points at the character in the string where the internal payload starts
  *   .internalLength => is the length of the internal payload
  *   .commandString  => is the command string found within the particular item
  *   .info           => is a structure containing further info about what was found
  * if start is set to -1 then nothing was found
**/

const commentStyles = [
  {opening: '<!---', closings: ['-->']},
  {opening: '<!--', closings: ['-->']},
  {opening: '[//]: <> (', closings: [')\n', ')\r\n']},
  {opening: '[//]: # (', closings: [')\n', ')\r\n']}
]

export function findComment (txt, start) {
  // finds the next comment in the string provided starting at position start
  // returns an object containing, start, length, internalStart, internalLength
  let r = {}
  let p
  let i

  // look for the start of a comment block
  let style = -1
  r.start = txt.length + 1
  for (i = 0; i < commentStyles.length; i++) {
    p = txt.indexOf(commentStyles[i].opening, start)
    if ((p !== -1) && (p < r.start)) { r.start = p; style = i }
  }
  if (style === -1) {
    // we did not find any comments
    r.start = -1
    return r
  }
  r.internalStart = r.start + commentStyles[style].opening.length

  // now find the corresponding end of the comment
  p = -1
  for (i = 0; i < commentStyles[style].closings.length; i++) {
    p = txt.indexOf(commentStyles[style].closings[i], r.internalStart + 1)
    if (p !== -1) break
  }

  if (p === -1) {
    // no end of comment found so it must end at the end of the file
    r.internalLength = txt.length - r.internalStart
    r.length = txt.length - r.start
  } else {
    r.internalLength = p - r.internalStart
    r.length = p + commentStyles[style].closings[i].length - r.start
  }
  return r
}

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

  return _earlierOf(x, _earlierOf(y, z))

  function _earlierOf (a, b) {
    // inspects the .start property of a and b and returns the one
    // with the lowest start position
    if (b.start !== -1 && (a.start === -1 || b.start < a.start)) {
      return b
    } else {
      return a
    }
  }
}

export function findMdp (txt, start) {
  let s = _findMdpStartUnfenced(txt, start)
  if (s.start === -1) { return s }
  let e = _findMdpEndUnfenced(txt, s)
  return e
}

function _findMdpStartUnfenced (txt, start) {
  let lookFrom = start
  let m, c
  while (true) {
    m = _findMdpStart(txt, lookFrom)
    if (m.start === -1) { return m }
    c = findCode(txt, lookFrom)
    if (c.start === -1 || m.start < c.start || m.start > (c.start + c.length)) {
      // the mdp start we've found is not within a code fence
      break
    }
    // the mdp start we've found is within a code fence so find the next one
    lookFrom = c.start + c.length
  }
  return m
}

function _findMdpEndUnfenced (txt, opening) {
  let lookFrom = opening.internalStart
  let m, c
  while (true) {
    m = _findMdpEnd(txt, opening)
    if (m.start === -1) { return m }
    c = findCode(txt, lookFrom)
    if (c.start === -1 || m.start < c.start || m.start > (c.start + c.length)) { break } // the mdp end we've found is not within a code fence
    // the mdp end we've found is within a code fence so find the next one
    lookFrom = c.start + c.length
  }
  return m
}

function _findMdpStart (txt, start) {
  let regex = /(\r\n|\r|\n|^)([ ]{0,3}\[>[^\r\n\t\0[\]]*\]: # (\([^\r\n\t\0]*\)|"[^\r\n\t\0]*"|'[^\r\n\t\0]*'))(\r\n|\r|\n)/g
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

function _findMdpEnd (txt, opening) {
  let r = JSON.parse(JSON.stringify(opening)) // create copy of opening structure passed in
  let regex = /(\r\n|\r|\n)([ ]{0,3}\[<[^\r\n\t\0[\]]*\]: #)(\r\n|\r|\n|$)/g
  regex.lastIndex = r.internalStart - 2
  let regexResult = regex.exec(txt)
  if (regexResult === null) { return {start: -1} }
  r.internalLength = regexResult.index - r.internalStart
  r.length = regexResult.index + regexResult[0].length - regexResult[3].length - r.start
  return r
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
  let regex = /((?:^|\n)[ ]{4,}[^\r\n\0]*){1,}/
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
    let regex = /^([ ]{0,3}> |>|[ ]{0,0})(([ ]{0,3})([`]{3,}|[~]{3,})([^\n\r\0`]*))$/m
    /** The regex groups are:
      * 0: the full match including any preamble block markup
      * 1: the preamble consisting of block characters or nothing
      * 2: the full codeFence line without preamble
      * 3: any leading blank spaces at the start of the codeFence line
      * 4: the ` or ~ characters identifying the codeFence
      * 5: anything else on the line following the codeFence
    **/
    regex.lastIndex = start
    let regexResult = regex.exec(txt)
    if (regexResult === null) {
      return {start: -1}
    }
    let r = { start: regexResult.index,
      info: {
        blockQuote: regexResult[1],
        spacesCount: regexResult[3].length,
        codeFence: regexResult[4]
      },
      commandString: regexResult[5].trim(),
      internalStart: regexResult.index + regexResult[0].length
    }
    if (txt[r.internalStart] === '\r') { r.internalStart ++ }
    if (txt[r.internalStart] === '\n') { r.internalStart ++ }
    return r
  }

  function _findClosingCodeFence (txt, opening) {
    // updates the passed result structure with the location and type of the next closing code fence
    // to match the opening cofeFEnce passed in
    let regex
    let r = JSON.parse(JSON.stringify(opening)) // create copy of opening structure passed in
    regex = RegExp('^([ ]{0,3}> |>|[ ]{0,0})[ ]{0,3}[' + r.info.codeFence[0] + ']{' + r.info.codeFence.length + ',}[ ]*$', 'mg')
    regex.lastIndex = r.internalStart
    let regexResult = regex.exec(txt)
    if (opening.info.blockQuote.length !== 0) {
      // we are in a block quote so the codeFence will end at the earlier of the found regex OR end of the block quote
      let b = _findEndOfBlock(txt, r.internalStart)
      if (b !== -1 && (regexResult === null || b < regexResult.index)) {
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
      if (txt[r.internalStart + r.internalLength - 1] === '\n') { r.internalLength -- }
      if (txt[r.internalStart + r.internalLength - 1] === '\r') { r.internalLength -- }
      r.length = regexResult.index + regexResult[0].length - r.start
    }
    return r
  }

  function _findEndOfBlock (txt, start) {
    // finds the first line which is not marked as block
    let regex = /(\n|\r\n)(?!([ ]{0,3}> |>))[^\n]*/g
    regex.lastIndex = start
    let regexResult = regex.exec(txt)
    if (regexResult === null) {
      return -1
    } else {
      return regexResult.index
    }
  }
}

export function _findEarliestOf (txt, start, arrPossibles) {
  /** returns both the location of and the index within the arr of the first match it can find
    * eg. _findEarliestOf('a test string ``` <¬-- here', 5, ['~~~', '```', '<---'])
    * will return [14, 1]
    * if no matches are found it will return -1 as the position
    * if 2 strings in the array match it will return the array index of the first one that matches
  **/
  let arrIndex = 0
  let len = txt.length
  let pos = txt.length + 1
  let posTemp = -1
  for (let i = 0; i < len; i++) {
    posTemp = txt.indexOf(arrPossibles[i], start)
    if (posTemp !== -1 && posTemp < pos) {
      pos = posTemp
      arrIndex = i
    }
  }
  if (pos === len + 1) { pos = -1 }
  return [pos, arrIndex]
}
