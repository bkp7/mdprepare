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

export function findMdpCode (txt, start) {
  // finds the next location of mdpInsert in a code span within txt
  let posn = start
  let x
  while (true) {
    x = findCode(txt, posn)
    if (x.start === -1 || x.commandString.indexOf('mdpInsert ') !== -1) {
      break
    } else {
      posn = x.start + x.length
    }
  }
  return x
}
