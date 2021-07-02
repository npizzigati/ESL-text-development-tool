function Formatter(listData, officialList) {
  // Check for document so we can skip these lines in testing
  if (typeof document !== "undefined") {
    this.trixElement = document.querySelector("trix-editor");
    this.trixEditor = this.trixElement.editor;
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
    const fullText = this.trixEditor.getDocument().toString().toLowerCase();
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
    this.trixEditor.setSelectedRange([startIndex, endIndex]);
    this.trixEditor.activateAttribute(formatting);
  };

  // TODO: This is the same or similar to functions in editor and
  // search and official_list_manager-- refactor out to another module?
  this.clearFormatting = function(formatting = 'searchHighlight') {
    const initialPosition = this.trixEditor.getSelectedRange();
    // This seems to work faster than iterating through the
    // ranges and turning off formatting that way.
    // TODO: Change clearFormatting in the Search module to do
    // this too.
    // And, doing it this way, there's no need to keep track of
    // formated ranges.
    const length = this.trixEditor.getDocument().toString().length;
    this.trixEditor.setSelectedRange([0, length - 1]);
    this.trixEditor.deactivateAttribute(formatting);
    this.trixEditor.setSelectedRange(initialPosition);
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
    const initialPosition = this.trixEditor.getSelectedRange();
    this.formatMatches(selectedHeadwords);
    this.trixEditor.setSelectedRange(initialPosition);
  };
}

export { Formatter };
