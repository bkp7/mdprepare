const debug = require('debug')('mdprepare:helpers')

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
  debug('style: ' + style + ', r.start: ' + r.start)
  if (style === -1) {
    // we did not find any comments
    r.start = -1
    return r
  }
  debug(commentStyles[style])
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
