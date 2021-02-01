function OfficialList(listData) {
  this.trixElement = document.querySelector("trix-editor");
  this.trixEditor = this.trixElement.editor;
  this.currentlyMatchedRow = null;
  this.currentlyMatchedHeadword = null;
  this.listData = listData;

  this.buildRanks = function() {
    const ranks = {};
    let count = 1;
    headwords.forEach(headword => {
      ranks[headword.toLowerCase()] = count;
      count += 1;
    });
    return ranks;
  };
  
  this.ranks = this.buildRanks();

  this.emphasizeCurrentHeadwordMatch = function(headword) {
    const markedHeadword = document.querySelector(`#official-${headword}`);
    this.deemphasizeCurrentHeadwordMatch();
    this.currentlyMatchedHeadword = headword;
    this.currentlyMatchedRow = $(markedHeadword).parent();
    this.currentlyMatchedRow.addClass('official-list-current-match');
    markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
  };

  this.deemphasizeCurrentHeadwordMatch = function() {
    if (this.currentlyMatchedRow) {
      this.currentlyMatchedRow.removeClass('official-list-current-match');
      this.currentlyMatchedRow = null;
      this.currentlyMatchedHeadword = null;
    }
  };

  this.refresh = function() {
    // Reset formatting
    $('.official-list-count').text('');
    $('.official-list-headwords').parent().removeClass('official-list-match');

    this.listData.timesMarked.forEach( (times, headword) => {
      $(`#official-${headword}`).parent().addClass('official-list-match');
      $(`#official-${headword}-count`).text(times.toString());
    });
  };

  this.focusHeadword = function(headword) {
    // const row = $(markedHeadword).parent();
    const times = this.listData.timesMarked.get(headword) || 0;
    this.emphasizeCurrentHeadwordMatch(headword);
    $(`#official-${headword}-count`).text(times.toString());
  };

  this.unfocusHeadword = function(headword) {
    const markedHeadword = document.querySelector(`#official-${headword}`);
    const times = this.listData.timesMarked.get(headword)
    if (!times) {
      $(markedHeadword).parent().removeClass('official-list-match');
      $(`#official-${headword}-count`).text('');
    } else {
      $(`#official-${headword}-count`).text(times.toString());
    }
    this.deemphasizeCurrentHeadwordMatch();
  };

  this.tableheader = '<thead>' +
    '<tr>' +
    '<th colspan="3" id="official-list-title">Official List</th>' +
    '</tr>' +
    '<tr>' +
    '<th class="official-list-header" id="official-list-header-rank">Rank</th>' +
    '<th class="official-list-header" id="official-list-header-headword">Headword</th>' +
    '<th class="official-list-header">Uses</th>' +
    '</tr>' +
    '</thead>';

  this.showOfficialList = function(words) {
    let current_row;
    const table_parts = [];
    $('#official-list-table').remove();
    table_parts.push('<table id="official-list-table">');
    table_parts.push(this.tableheader);
    table_parts.push('<tbody>');
    table_parts.push('<tr class="official-list-first-line-spacer"><td colspan="3"></td></tr>');
    words.forEach( headword => {
      const downcasedHeadword = headword.toLowerCase();
      table_parts.push('<tr>')
      table_parts.push(`<td class="official-list-rank">${this.ranks[downcasedHeadword]}</td>`);
      table_parts.push(`<td id="official-${downcasedHeadword}" class="official-list-headwords">${headword}</td>`);
      table_parts.push(`<td id="official-${downcasedHeadword}-count" class="official-list-count"></td>`);
      table_parts.push('<td class="official-list-end-spacer"></td>');
      table_parts.push('</tr>')
    });
    table_parts.push('</tbody></table>')
    $('.official-list').append(table_parts.join(''));
    this.activateListeners();
    this.refresh();
    if (this.currentlyMatchedHeadword) {
      this.focusHeadword(this.currentlyMatchedHeadword);
    }
  };

  this.getMatchStartIndex = function(inflection, searchStart) {
    const fullText = this.trixEditor.getDocument().toString().toLowerCase();
    const re = new RegExp(`\\b${inflection}\\b`, 'i');
    const result = re.exec(fullText.slice(searchStart));
    // Result should always be found, but include this
    // verification to prevent error
    if (result) {
      return result.index + searchStart;
    }
  };

  // TODO: This is very similar to the function in my_list -- extract to another module?
  this.highlightMatch = function(startIndex, endIndex) {
    this.trixEditor.setSelectedRange([startIndex, endIndex]);
    this.trixEditor.activateAttribute('searchHighlight');
  };

  // TODO: This is the same as the function in my_list -- extract to another module?
  this.scrollToFirstMatch = function() {
    const highlightedElement = document.querySelector('mark');
    if (highlightedElement) {
      highlightedElement.scrollIntoView({behavior: 'auto',
                                        block: 'center'});
    }
  }

  // TODO: Handle case where non-appearing word is clicked
  // Put box around headword in myList
  this.highlightAllEditorMatches = function(headword) {
    let inflection, matchStart, matchEnd, length;
    let searchStart = 0;
    let wordsHighlighted = 0;
    const initialPosition = this.trixEditor.getSelectedRange();
    this.clearHighlighting();
    this.listData.editorInflections[headword].forEach(inflection => {
      matchStart = this.getMatchStartIndex(inflection, searchStart);
      matchEnd = matchStart + inflection.length;
      this.highlightMatch(matchStart, matchEnd);
      searchStart = matchEnd + 1;
      wordsHighlighted += 1;
      if (wordsHighlighted === 1) {
        this.scrollToFirstMatch();
      }
    });
    this.trixEditor.setSelectedRange(initialPosition);
  };

  this.clearHighlighting = function() {
    const initialPosition = this.trixEditor.getSelectedRange();
    const length = this.trixEditor.getDocument().toString().length;
    this.trixEditor.setSelectedRange([0, length - 1]);
    this.trixEditor.deactivateAttribute('searchHighlight');
    this.trixEditor.setSelectedRange(initialPosition);
  };

  this.activateListeners = function() {
    $('#official-list-header-headword').off();
    $('#official-list-header-headword').on('click', event => {
      this.showOfficialList([...headwords].sort());
    });
    $('#official-list-header-rank').off();
    $('#official-list-header-rank').on('click', event => {
      this.showOfficialList(headwords);
    });
    $('.official-list-headwords').off();
    $('.official-list-headwords').on('click', event => {
      const headword = $(event.target).text().toLowerCase();
      this.highlightAllEditorMatches(headword);
    });
  };
}


export { OfficialList };