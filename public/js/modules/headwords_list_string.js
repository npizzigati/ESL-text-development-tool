class BadInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'badInputError';
  }
}

class HeadwordsListString {
  constructor(string) {
    this.normalizedContents = this.normalizeLineEndings(string);
  }

  parse() {
    const words = this.extractWords();
    const nonDuplicates = this.removeDuplicates(words);
    return nonDuplicates;
  }

  removeDuplicates(words) {
    let nonDuplicates = [];
    let duplicates = [];
    const lowercaseWords = words.map(word => word.toLowerCase());
    for (let word of lowercaseWords) {
      const wordTitleCase = word[0].toUpperCase + word.slice(1);
      const wordAllCaps = word.toUpperCase();
      if (nonDuplicates.includes(word) ||
          nonDuplicates.includes(wordTitleCase) ||
          nonDuplicates.includes(wordAllCaps)) {
        duplicates.push(word);
        continue;
      }
      nonDuplicates.push(word);
    }
    window.alert('The headwords list contained the following duplicate word(s)' +
                 `: "${duplicates.join('", "')}." ` +
                 'Duplicate words are ignored. Click the OK button to continue.');
    return nonDuplicates;
  }

  extractWords() {
    const lines = this.normalizedContents.split('\n')
      .map(line => line.trim());
    const words = this.removeEmptyLines(lines);
    return words;
  }

  removeEmptyLines(splitString) {
    return splitString.filter(string => string !== '');
  }

  normalizeLineEndings(string) {
    return string.replace(/\r\n/g, '\n');
  }
}

export { HeadwordsListString, BadInputError };
