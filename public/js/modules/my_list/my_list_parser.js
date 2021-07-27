class BadInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'badInputError';
  }
}

class MyListString {
  constructor(string) {
    this.contents = string;
    this.cleanContents = this.clean();
  }

  /**
   * Convert clean contents into array of subarrays, in which each
   * subarray is a list of 10 words.
   * @params {}
   * @returns {Object[]} Objects keyed by identifier
   * (text before colon, e.g. line number) and with values being
   * the list of words on the line with the identifier in question
   */
  parse() {
    const lines = this.extractLines();
    const lineObject = {};
    const allWords = [];
    let lineNumber = 10;
    lines.forEach((line) => {
      // I currently ignore the line identifier to avoid problems when
      // ordering list lines, and instead I key the rows with an auto-generated
      // line number
      const [_lineIdentifier, wordString] = this.partitionOnIdentifier(line);
      const words = wordString.split(/\s+/);
      allWords.push(...words);
      // const numberOfWords = words.length;
      this.validateCharacters(words);
      lineObject[lineNumber] = words;
      lineNumber += 10;
    });
    this.checkForDuplicates(allWords);
    return lineObject;
  }

  checkForDuplicates = function (allWords) {
    const lowercaseWords = allWords.map(word => word.toLowerCase());
    lowercaseWords.forEach(word => {
      if (lowercaseWords.filter(otherWord => otherWord === word).length > 1) {
        const message = `"${word}" is repeated in list`;
        throw new BadInputError(message);
      }
    });
  }

  extractLines() {
    const lines = this.cleanContents.split('\n')
                                    .map(line => line.trim());
    const contentLines = this.removeEmptyLines(lines);
    return contentLines;
  }

  removeEmptyLines(splitString) {
    return splitString.filter(string => string !== '');
  }

  validateCharacters(words, lineNumber) {
    words.forEach(word => {
      if (/[^a-z]/gi.test(word)) {
        const message = `Invalid character on line ${lineNumber}`;
        throw new BadInputError(message);
      }
    });
  }

  clean() {
    const normalized = this.normalizeLineEndings(this.contents);
    const withCommasRemoved = this.removeAnyCommas(normalized);
    const withSlashesRemoved = this.removeAnySlashes(withCommasRemoved);
    return withSlashesRemoved;
  }

  normalizeLineEndings(string) {
    return string.replace(/\r\n/g, '\n');
  }

  partitionOnIdentifier(line) {
    const [identifier, wordString] = line.split(':');
    return [identifier.trim(), wordString.trim()];
  }

  removeAnyCommas(string) {
    return string.replace(/,/g, '');
  }

  removeAnySlashes(string) {
    return string.replace(/\//g, ' ');
  }
}

export { MyListString, BadInputError };
