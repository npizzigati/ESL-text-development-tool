const trixElement = document.querySelector('trix-editor');
const trixEditor = trixElement.editor;

/* eslint-disable max-lines-per-function */
function ListData(parsedData, assumedWords = []) {
  this.sublistInflectionsMapping = {};
  this.sublistHeadwords = [];
  this.timesMarked = new Map();
  this.headwords = parsedData.headwords;
  this.assumedWords = assumedWords;
  this.inflectionsMap = parsedData.inflections_map;

  this.buildOriginalHeadwordSpellings = function() {
    const originalHeadwordSpellings = {};
    this.headwords.forEach(headword => {
      originalHeadwordSpellings[headword.toLowerCase()] = headword;
    });
    return originalHeadwordSpellings;
  };

  this.originalHeadwordSpellings = this.buildOriginalHeadwordSpellings();

  this.isAssumedWord = function(headword) {
    return this.assumedWords.map(word => word.toLowerCase()).includes(headword);
  };

  this.calculate = function() {
    const fullText = trixEditor.getDocument().toString();
    // Remove ending punctuation
    const fullTextOnlyWords = fullText.replace(/[^a-zA-Z']+$/, '');
    const fullTextArray = fullTextOnlyWords.trim().split(/[^a-zA-Z']+/);

    this.timesMarked.clear();
    this.sublistInflectionsMapping = {};
    this.editorInflections = {};
    this.sublistHeadwords = [];

    fullTextArray.forEach(word => {
      const headword = this.getHeadword(word);

      if (!headword || this.isAssumedWord(headword)) {
        return;
      }

      let times = this.timesMarked.get(headword);

      if (times) {
        times += 1;
        this.timesMarked.set(headword, times);
      } else {
        this.timesMarked.set(headword, 1);
      }

      // Add the headword to the auto list array if it is not
      // already there.
      if (!this.sublistHeadwords.includes(headword)) {
        this.sublistHeadwords.push(headword);
        // Also add the actual inflection (in the form of mapping
        // from headword to word) to be able to easily highlight
        // the inflections in the main text when the word is clicked
        // in the auto list (or when the auto list number is clicked)
        this.sublistInflectionsMapping[headword] = word;
      }

      // Add inflection to hash of all inflections in main editor
      // keyed by headwords. This is to enable these inflections to be
      // highlighted when the headword is clicked on the official list
      if (this.editorInflections[headword]) {
        this.editorInflections[headword].push(word);
      } else {
        this.editorInflections[headword] = [word];
      }
    });
  };

  this.getHeadword = function(word) {
    const headword = this.inflectionsMap[word.toLowerCase()];
    if (headword) {
      return headword.toLowerCase();
    } else {
      return undefined;
    }
  };
}

export { ListData };
