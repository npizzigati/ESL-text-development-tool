function AutoList(listData, listManager) {
  this.trixElement = document.querySelector("trix-editor");
  this.trixEditor = this.trixElement.editor;
  this.listData = listData;
  this.officialList = listManager.officialList;
  this.maxWordsInSublist = 10;
  this.sublists = [];
  this.sublistInflectionsMapping = {};
  this.currentlyMatchedWord = null;

  this.setUp = function() {
    this.refresh();
    this.show();
  };

  this.refresh = function() {
    this.sublists = this.buildSublists();
    $('#auto-list-table').remove();
    const parts = [];
    parts.push('<table id="auto-list-table">');
    parts.push('<tbody class="auto-list-table-body">');
    Object.entries(this.sublists).forEach(([number, headwords]) => {
      const taggedWords = this.tagSublistWords(headwords);
      const sublist = taggedWords.join(', ');
      parts.push('<tr>');
      parts.push(`<td class="auto-sublist-number" id="sublist-number-${number}">${number}</td>`);
      parts.push(`<td class="auto-sublist-words" id="sublist-words-${number}">${sublist}</td>`);
      parts.push('</tr>');
    });
    parts.push('</tbody></table>');
    $('.auto-list').append(parts.join(''));
  };

  this.tagSublistWords = function(headwords) {
    const taggedHeadwords = [];
    headwords.forEach( headword => {
      taggedHeadwords.push(`<span class="auto-sublist-individual-word" id="auto-sublist-${headword}">${this.listData.originalHeadwordSpellings[headword]}</span>`);
    });
    return taggedHeadwords;
  };

  this.show = function() {
    $('.auto-list').css('display', 'block');
    $('#auto-list-title').addClass('active-list-title');
  };

  this.hide = function() {
    $('#auto-list-title').removeClass('active-list-title');
    $('.auto-list').css('display', 'none');
  };

  this.isHidden = function() {
    return $('.auto-list').css('display') == 'none';
  };

  // this.refresh = function() {
  //   // const fullText = this.trixEditor.getDocument().toString();
  //   // const fullTextOnlyWords = fullText.replace(/[^a-zA-Z']+$/, '');
  //   // const fullTextArray = fullTextOnlyWords.trim().split(/[^a-zA-Z']+/);
  //   // Need to record only the first appearance of each headword
  //   // in an array
  //   this.sublists = this.buildSublists();
  //   this.build();
  // };

  this.emphasizeCurrentHeadwordMatch = function(headword) {
    const markedHeadword = document.querySelector(`#auto-sublist-${headword}`);
    this.deemphasizeCurrentHeadwordMatch();
    this.currentlyMatchedWord = $(markedHeadword);
    this.currentlyMatchedWord.addClass('auto-sublist-current-match');
    markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
  };

  this.deemphasizeCurrentHeadwordMatch = function() {
    if (this.currentlyMatchedWord) {
      this.currentlyMatchedWord.removeClass('auto-sublist-current-match');
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
      sublistInflection = this.listData.sublistInflectionsMapping[headword];
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
  };

  // TODO: This is the same or similar to functions in editor and
  // search and official_list_manager-- refactor out to another module?
  this.clearHighlighting = function() {
    const initialPosition = this.trixEditor.getSelectedRange();
    // This seems to work faster than iterating through the
    // ranges and turning off highlighting that way.
    // TODO: Change clearHighlighting in the Search module to do
    // this too.
    // And, doing it this way, there's no need to keep track of
    // highlighted ranges.
    const length = this.trixEditor.getDocument().toString().length;
    this.trixEditor.setSelectedRange([0, length - 1]);
    this.trixEditor.deactivateAttribute('searchHighlight');
    this.trixEditor.setSelectedRange(initialPosition);
  };

  this.activateListeners = function() {
    $('.special-lists').off();
    $('.special-lists').on('click', '.auto-sublist-number', event => {
      const sublistNumber = parseInt($(event.target).text());
      const selectedHeadwords = this.sublists[sublistNumber];
      this.executeHighlight(selectedHeadwords);
    });

    $('.special-lists').on('click', '.auto-sublist-individual-word', event => {
      const downcasedHeadword = $(event.target).text().toLowerCase();
      this.executeHighlight([downcasedHeadword]);
    });
  };

  //TODO: extract these two mark methods to a module to be shared
  //by auto_list, official_list and editor
  this.markOnOfficialList = function(headword) {
    const markedHeadword = document.querySelector(`#official-${headword}`);
    this.officialList.emphasizeCurrentHeadwordMatch(headword);
  };

  this.markOnAutoList = function(headword) {
    this.emphasizeCurrentHeadwordMatch(headword);
  };

  this.executeHighlight = function(selectedHeadwords) {
    if (selectedHeadwords.length === 1) {
      this.markOnAutoList(selectedHeadwords[0]);
      this.markOnOfficialList(selectedHeadwords[0]);
    }
    this.clearHighlighting();
    const initialPosition = this.trixEditor.getSelectedRange();
    this.highlightMatches(selectedHeadwords);
    this.trixEditor.setSelectedRange(initialPosition);
  };
}

export { AutoList };
