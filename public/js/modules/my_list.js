function MyList(officialListManager, listData) {
  this.trixElement = document.querySelector("trix-editor");
  this.trixEditor = this.trixElement.editor;
  this.listData = listData;
  this.officialListManager = officialListManager
  this.maxWordsInSublist = 10;
  this.sublists = [];
  this.sublistInflectionsMapping = {};
  this.highlightedRanges = [];
  this.currentlyMatchedWord = null;

  this.show = function() {
    const parts = [];
    parts.push('<table id="my-list-table">');
    parts.push('<tbody class="my-list-table-body">');
    Object.entries(this.sublists).forEach(([number, headwords]) => {
      const taggedWords = this.tagSublistWords(headwords);
      const sublist = taggedWords.join(', ');
      parts.push('<tr>');
      parts.push(`<td class="my-sublist-number" id="sublist-number-${number}">${number}</td>`);
      parts.push(`<td class="my-sublist-words" id="sublist-words-${number}">${sublist}</td>`);
      parts.push('</tr>');
    });
    parts.push('</tbody></table>');
    $('.my-list').append(parts.join(''));
  };

  this.tagSublistWords = function(headwords) {
    const taggedHeadwords = [];
    headwords.forEach( headword => {
      taggedHeadwords.push(`<span class="my-sublist-individual-word" id="my-sublist-${headword}">${this.listData.originalHeadwordSpellings[headword]}</span>`);
    });
    return taggedHeadwords;
  }

  this.refresh = function() {
    const fullText = this.trixEditor.getDocument().toString();
    const fullTextOnlyWords = fullText.replace(/[^a-zA-Z']+$/, '');
    const fullTextArray = fullTextOnlyWords.trim().split(/[^a-zA-Z']+/);
    // Need to record only the first appearance of each headword
    // in an array
    this.sublists = this.buildSublists();
    $('#my-list-table').remove();
    this.show();
  };

  this.emphasizeCurrentHeadwordMatch = function(headword) {
    const markedHeadword = document.querySelector(`#my-sublist-${headword}`);
    this.deemphasizeCurrentHeadwordMatch();
    this.currentlyMatchedWord = $(markedHeadword);
    this.currentlyMatchedWord.addClass('my-sublist-current-match');
    markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
  };

  this.deemphasizeCurrentHeadwordMatch = function() {
    if (this.currentlyMatchedWord) {
      this.currentlyMatchedWord.removeClass('my-sublist-current-match');
      this.currentlyMatchedWord = null;
    }
  };

  this.buildSublists = function() {
    let currentSublistNumber = this.maxWordsInSublist;
    const sublists = {};
    sublists[currentSublistNumber] = [];
    let index = 1;

    this.listData.sublistHeadwords.forEach(headword => {
      sublists[currentSublistNumber].push(headword);
      if (index % this.maxWordsInSublist === 0) {
        currentSublistNumber = currentSublistNumber + this.maxWordsInSublist;
        sublists[currentSublistNumber] = [];
      }
      index += 1;
    });
    return sublists;
  },

  this.highlightMatches = function(selectedHeadwords) {
    let sublistInflection, startIndex, length;
    let wordsHighlighted = 0;
    selectedHeadwords.forEach(headword => {
      sublistInflection = listData.sublistInflectionsMapping[headword];
      startIndex = this.getStartIndex(sublistInflection);
      length = sublistInflection.length;
      this.highlightMatch(startIndex, length)
      wordsHighlighted += 1;
      if (wordsHighlighted === 1) {
        this.scrollToFirstMatch();
      }
    });
  };

  this.scrollToFirstMatch = function() {
    const highlightedElement = document.querySelector('mark');
    if (highlightedElement) {
      highlightedElement.scrollIntoView({behavior: 'auto',
                                        block: 'center'});
    }
  }

  this.getStartIndex = function(sublistInflection) {
    const fullText = this.trixEditor.getDocument().toString().toLowerCase();
    const re = new RegExp(`\\b${sublistInflection}\\b`, 'i');
    const result = re.exec(fullText);
    // Result should always be found, but include this
    // verification to prevent error
    if (result) {
      return result.index
    }
  };

  this.highlightMatch = function(startIndex, length) {
    let endIndex = startIndex + length;
    this.trixEditor.setSelectedRange([startIndex, endIndex]);
    this.trixEditor.activateAttribute('searchHighlight');
    this.highlightedRanges.push([startIndex, endIndex]);
  };

  this.clearHighlighting = function(turnOffEditorListener = true) {
    const initialPosition = this.trixEditor.getSelectedRange();
    if (this.highlightedRanges.length === 0) {
      return;
    }
    // This seems to work faster than iterating through the
    // ranges and turning off highlighting that way.
    // TODO: Change clearHighlighting in the Search module to do
    // this too.
    // And, doing it this way, there's no need to keep track of
    // highlighted ranges.
    const length = this.trixEditor.getDocument().toString().length;
    this.trixEditor.setSelectedRange([0, length - 1]);
    this.trixEditor.deactivateAttribute('searchHighlight');

    // this.highlightedRanges.forEach(range => {
    //   this.trixEditor.setSelectedRange(range);
    //   this.trixEditor.deactivateAttribute('searchHighlight');
    // });
    // this.highlightedRanges = [];

    this.trixEditor.setSelectedRange(initialPosition);
    if (turnOffEditorListener) {
      $(this.trixElement).off('keyup', this.clearHighlighting);
    }
  };

  this.activateListeners = function() {
    $('.my-list').on('click', '.my-sublist-number', event => {
      const sublistNumber = parseInt($(event.target).text());
      const selectedHeadwords = this.sublists[sublistNumber];
      this.executeHighlight(selectedHeadwords);
    });

    $('.my-list').on('click', '.my-sublist-individual-word', event => {
      const downcasedHeadword = $(event.target).text().toLowerCase();
      this.executeHighlight([downcasedHeadword]);
    });
  };

  //TODO: extract these two mark methods to a module to be shared
  //by my_list, official_list and editor
  this.markOnOfficialList = function(headword) {
    const markedHeadword = document.querySelector(`#official-${headword}`);
    this.officialListManager.emphasizeCurrentHeadwordMatch(headword);
  }

  this.markOnMyList = function(headword) {
    this.emphasizeCurrentHeadwordMatch(headword);
  }

  this.executeHighlight = function(selectedHeadwords) {
    if (selectedHeadwords.length === 1) {
      this.markOnMyList(selectedHeadwords[0]);
      this.markOnOfficialList(selectedHeadwords[0]);
    }
    this.clearHighlighting(false);
    const initialPosition = this.trixEditor.getSelectedRange();
    this.highlightMatches(selectedHeadwords);
    this.trixEditor.setSelectedRange(initialPosition);
    $(this.trixElement).on('keyup', this.clearHighlighting.bind(this));
  }
}

export { MyList };
