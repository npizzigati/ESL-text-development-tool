function Formatter(listData, officialList) {
  // Check for document so we can skip these lines in testing
  let trixEditor, trixElement;
  if (typeof document !== "undefined") {
    trixElement = document.querySelector("trix-editor");
    trixEditor = trixElement.editor;
  }
  this.formatMatches = function(selectedHeadwords, formatting = 'searchHighlight') {
    let sublistInflection, startIndex, length;
    let wordsFormated = 0;
    selectedHeadwords.forEach(headword => {
      sublistInflection = listData.sublistInflectionsMapping[headword];
      startIndex = this.getStartIndex(sublistInflection);
      length = sublistInflection.length;
      this.formatMatch(startIndex, length, formatting);
      wordsFormated += 1;
      if (wordsFormated === 1) {
        this.scrollToFirstMatch();
      }
    });
  };

  this.emphasizeCurrentHeadwordMatch = function(headword) {
    const autoListMarkedHeadword = document.querySelector(`#auto-sublist-${headword}`);
    this.deemphasizeCurrentHeadwordMatch();
    this.currentlyMatchedWord = $(autoListMarkedHeadword);
    this.currentlyMatchedWord.addClass('sublist-current-match');
    autoListMarkedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
  };

  this.deemphasizeCurrentHeadwordMatch = function() {
    if (this.currentlyMatchedWord) {
      this.currentlyMatchedWord.removeClass('sublist-current-match');
      this.currentlyMatchedWord = null;
    }
  };

  this.scrollToFirstMatch = function() {
    const formatedElement = document.querySelector('mark');
    if (formatedElement) {
      formatedElement.scrollIntoView({behavior: 'auto',
                                      block: 'center'});
    }
  };

  this.getStartIndex = function (sublistInflection) {
    const fullText = trixEditor.getDocument().toString().toLowerCase();
    const re = new RegExp(`\\b${sublistInflection}\\b`, 'i');
    const result = re.exec(fullText);
    // Result should always be found, but include this
    // verification to prevent error
    if (result) {
      return result.index;
    }

    return undefined;
  };

  this.formatMatch = function(startIndex, length, formatting) {
    let endIndex = startIndex + length;
    trixEditor.setSelectedRange([startIndex, endIndex]);
    trixEditor.activateAttribute(formatting);
  };

  this.clearFormatting = function(formatting = 'searchHighlight') {
    const initialPosition = trixEditor.getSelectedRange();
    const length = trixEditor.getDocument().toString().length;
    trixEditor.setSelectedRange([0, length - 1]);
    trixEditor.deactivateAttribute(formatting);
    trixEditor.setSelectedRange(initialPosition);
  };

  //TODO: extract these two mark methods to a module to be shared
  //by auto_list, official_list and editor
  this.markOnOfficialList = function(headword) {
    // const markedHeadword = document.querySelector(`#official-${headword}`);
    officialList.emphasizeCurrentHeadwordMatch(headword);
  };

  this.markOnAutoList = function(headword) {
    this.emphasizeCurrentHeadwordMatch(headword);
  };

  this.executeFormatting = function(selectedHeadwords) {
    if (selectedHeadwords.length === 1) {
      this.markOnAutoList(selectedHeadwords[0]);
      this.markOnOfficialList(selectedHeadwords[0]);
    }
    this.clearFormatting();
    const initialPosition = trixEditor.getSelectedRange();
    this.formatMatches(selectedHeadwords);
    trixEditor.setSelectedRange(initialPosition);
  };
}

export { Formatter };
