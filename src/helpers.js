
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
