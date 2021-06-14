class BadInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'badInputError';
  }
}

class ListString {
  constructor(string) {
    this.contents = string;
    this.cleanContents = this.clean();
  }

  /**
   * Convert clean contents into array of subarrays, in which each
   * subarray is a list of 10 words.
   * @params {}
   * @returns {Object[]} array of subarrays of 10-word lists;
   */
  parse() {
    const lines = this.extractLines();
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const words = line.split(/\s/);
      const numberOfWords = words.length;
      this.validateCharacters(words);
      this.validateNumberOfWords(numberOfWords, lineNumber);
      return words;
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

  validateNumberOfWords(numberOfWords, lineNumber) {
    if (numberOfWords < 10) {
      throw new BadInputError(`Too few words on line ${lineNumber}` +
                              '(each line must contain at least 10 words).');
    } else if (numberOfWords > 10) {
      throw new BadInputError(`Too many words on line ${lineNumber} ` +
                              '(lines may contain no more than 10 words).');
    }
  }

  clean() {
    const normalized = this.normalizeLineEndings(this.contents);
    const unprefixed = this.removeNumberPrefixes(normalized);
    return this.removeAnyCommas(unprefixed);
  }

  normalizeLineEndings(string) {
    return string.replace(/\r\n/g, '\n');
  }

  removeNumberPrefixes(string) {
    return string.replace(/^\s*\d+\s?:\s*/gm, '');
  }

  removeAnyCommas(string) {
    return string.replace(/,/g, '');
  }
}

export { ListString, BadInputError };
