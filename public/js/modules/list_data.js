const trixElement = document.querySelector('trix-editor');
const trixEditor = trixElement.editor;

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
    return this.assumedWords.map(w => w.toLowerCase()).includes(headword);
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
      if (!this.sublistHeadwords.includes(headword)) {
        this.sublistHeadwords.push(headword);
        this.sublistInflectionsMapping[headword] = word;
      };
      if (this.editorInflections[headword]) {
        this.editorInflections[headword].push(word);
      } else {
        this.editorInflections[headword] = [word];
      }
    });
  };

  this.getHeadword = function(word) {
    const headword = this.inflectionsMap[word.toLowerCase()]
    if (headword) {
      return headword.toLowerCase();
    } else {
      return undefined;
    }
  };
}

export { ListData };
