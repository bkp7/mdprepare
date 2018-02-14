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

const {findCode} = require('./findCode.js')

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
