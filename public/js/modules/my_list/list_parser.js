// Problem description:
// Parse an input "my list" string and return a array
// of arrays of words belonging to each line in the list

// Examples:
// Input:
// '10: And Be Day From Good How I That Where You\n\r' +
// '20: A Do Can Go Have Help Hear Here Need Problem Work'
// Output:
// [['And', 'Be', 'Day', 'From', 'Good', 'How', 'I', 'That',
//   'Where', 'You'], ['A', 'Do', 'Can', 'Go', 'Have', 'Help',
//   'Hear', 'Here', 'Need', 'Problem', 'Work']]
//
// input: string
// - read from local file by JS's readFile and converted to text
//   by readAsText method
// - series of lines
//   - line terminator may be either \n\r or \n
// - each line has a number followed by a colon, then a space,
//   then a list of space separated words
//   - the number may be any number of digits, but should probably
//     be a multiple of 10
//   - there should be no more than 10 words per line after the
//     colon but in practice there may be more
//     - words over 10 should be ignored
// - the final line of words may or may not be terminated by the
//   line ending characters
// - there may be 1 or more lines after the final line
//
// output: array
// - Each subarray should be a maximum of 10 words
// - Case of the words should be preserved
// - Return a bad input message if there are less than or more
//   than 10 words in any line of input
//
// approach:
// - normalize line endings to \n
//   - replace globally \n\r with \n
// - remove intial string up to colon
//   - use regex
// - split lines on \n
// - for each line, split words on space

class BadInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'badInputError';
  }
}

class ListString {
  constructor(string) {
    this.contents = string;
    this.cleanContents = this.clean(string);
  }

  parse() {
    const lines = this.cleanContents.split('\n');
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const words = line.split(/\s/);
      const numberOfWords = words.length;
      if (numberOfWords < 10) {
        throw new BadInputError(`Too few words on line ${lineNumber}`);
      } else if (numberOfWords > 10) {
        throw new BadInputError(`Too many words on line ${lineNumber}`);
      }
      return words;
    });
  }

  clean(string) {
    const normalized = this.normalizeLineEndings(string);
    return this.removeNumberPrefixes(normalized);
  }

  normalizeLineEndings(string) {
    return string.replace(/\r\n/g, '\n');
  }

  removeNumberPrefixes(string) {
    return string.replace(/^\d+:\s/gm, '');
  }
}

export { ListString, BadInputError };
