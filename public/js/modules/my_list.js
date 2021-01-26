function MyList(listData) {

  this.trixElement = document.querySelector("trix-editor");
  this.trixEditor = this.trixElement.editor;
  this.listData = listData;
  this.maxWordsInSublist = 10;
  this.sublists = [];
  this.sublistInflectionsMapping = {};
  this.highlightedRanges = []

  this.show = function() {
    const table_parts = [];
    table_parts.push('<table id="my-list-table">');
    Object.entries(this.sublists).forEach(([number, words]) => {
      const sublist = words.join(', ');
      table_parts.push('<tr>');
      table_parts.push(`<td class="my-sublist-number" id="sublist-number-${number}">${number}</td>`);
      table_parts.push(`<td class="my-sublist-words" id="sublist-words-${number}">${sublist}</td>`);
      table_parts.push('</tr>');
    });
    table_parts.push('</table>');
    $('.my-list').append(table_parts.join(''));
  };

  // TODO: Need to update this function and the refresh function in
  // official_list_manager to use the data from the this.listData oblect
  this.refresh = function() {
    const fullText = this.trixEditor.getDocument().toString();
    const fullTextOnlyWords = fullText.replace(/[^a-zA-Z']+$/, '');
    const fullTextArray = fullTextOnlyWords.trim().split(/[^a-zA-Z']+/);
    // Need to record only the first appearance of each headword
    // in an array
    // const [sublistHeadwords, sublistInflectionsMapping] = this.buildSublistHeadwordsAndInflections(fullTextArray);
    // [this.sublistHeadwords, this.sublistInflectionsMapping] = [sublistHeadwords, sublistInflectionsMapping]; 
    this.sublists = this.buildSublists();
    $('#my-list-table').remove();
    this.show();
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

  this.highlightMatches = function(sublistNumber) {
    // const sublistInflections = []
    const selectedHeadwords = this.sublists[sublistNumber];
    let sublistInflection, startIndex, length;
    let wordsHighlighted = 0;
    selectedHeadwords.forEach(headword => {
      sublistInflection = listData.sublistInflectionsMapping[headword];
      startIndex = this.getStartIndex(sublistInflection);
      length = sublistInflection.length;
      this.highlightMatch(startIndex, length)
      wordsHighlighted += 1;
      if (wordsHighlighted === 1) {
        console.log('Should now be scrolling to first element');
        this.scrollToFirstMatch();
      }
    });
  };

  this.scrollToFirstMatch = function() {
    const highlightedElement = document.querySelector('mark');
    highlightedElement.scrollIntoView({behavior: 'auto',
                                      block: 'center'});
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
    this.highlightedRanges.forEach(range => {
      this.trixEditor.setSelectedRange(range);
      this.trixEditor.deactivateAttribute('searchHighlight');
    });
    this.highlightedRanges = [];
    this.trixEditor.setSelectedRange(initialPosition);
    if (turnOffEditorListener) {
      $(this.trixElement).off('keyup', this.clearHighlighting);
    }
  };

  this.activateListeners = function() {
    $('.my-list').on('click', '.my-sublist-number', event => {
      this.executeHighlight(event);
    });
  };

  this.executeHighlight = function(event) {
    this.clearHighlighting(false);
    const initialPosition = this.trixEditor.getSelectedRange();
    const sublistNumber = parseInt($(event.target).text());
    this.highlightMatches(sublistNumber);
    this.trixEditor.setSelectedRange(initialPosition);
    $(this.trixElement).on('keyup', this.clearHighlighting.bind(this));
  }
}

export { MyList };
