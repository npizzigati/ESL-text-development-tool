const trixElement = document.querySelector("trix-editor");
const trixEditor = trixElement.editor;

function ListData() {
  this.sublistInflectionsMapping = {};
  this.sublistHeadwords = [];
  this.timesMarked = new Map();

  this.buildOriginalHeadwordSpellings = function(headwords) {
    const originalHeadwordSpellings = {};
    headwords.forEach(headword => {
      originalHeadwordSpellings[headword.toLowerCase()] = headword;
    });
    return originalHeadwordSpellings;
  };

  this.originalHeadwordSpellings = this.buildOriginalHeadwordSpellings(headwords);

  this.calculate = function() {
    const fullText = trixEditor.getDocument().toString();
    // Remove ending punctuation
    const fullTextOnlyWords = fullText.replace(/[^a-zA-Z']+$/, '');
    const fullTextArray = fullTextOnlyWords.trim().split(/[^a-zA-Z']+/);

    this.timesMarked.clear();
    this.sublistInflectionsMapping = {};
    this.sublistHeadwords = [];

    fullTextArray.forEach(word => {
      word = (word === 'I') ? word : word.toLowerCase();
      const headword = this.getHeadword(word);
      let times = this.timesMarked.get(headword);
      if (times) {
        times += 1;
        this.timesMarked.set(headword, times);
      } else {
        this.timesMarked.set(headword, 1);
      }
      if (headword && !this.sublistHeadwords.includes(headword)) {
        this.sublistHeadwords.push(headword);
        this.sublistInflectionsMapping[headword] = word;
      };
    });
  };

  this.getHeadword = function(word) {
    const headword = inflectionsMap[word.toLowerCase()]
    if (headword) {
      return headword.toLowerCase();
    } else {
      return undefined;
    }
  };
}

export { ListData };
