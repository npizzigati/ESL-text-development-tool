const trixElement = document.querySelector("trix-editor");
const trixEditor = trixElement.editor;

function ListData() {
  this.sublistInflectionsMapping = {};
  this.sublistHeadwords = [];
  this.timesMarked = new Map();
  this.inflectionsMap = JSON.parse(localStorage.getItem('inflectionsMap'));
  this.headwords = JSON.parse(localStorage.getItem('headwords'));
  removeHeadwordsAndInflectionsFromLocalStorage();

  function removeHeadwordsAndInflectionsFromLocalStorage() {
    localStorage.removeItem('inflectionsMap');
    localStorage.removeItem('headwords');
  };

  this.buildOriginalHeadwordSpellings = function() {
    const originalHeadwordSpellings = {};
    this.headwords.forEach(headword => {
      originalHeadwordSpellings[headword.toLowerCase()] = headword;
    });
    return originalHeadwordSpellings;
  };

  this.originalHeadwordSpellings = this.buildOriginalHeadwordSpellings();

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
      if (!headword) {
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
