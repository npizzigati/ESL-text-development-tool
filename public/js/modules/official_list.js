import { getStartIndex } from './utils/word_utilities.js';

function OfficialList(listData, listManager) {
  const trixElement = document.querySelector("trix-editor");
  const trixEditor = trixElement.editor;
  this.currentlyMatchedRow = null;
  this.currentlyMatchedHeadword = null;

  this.setUp = function() {
    this.refresh();
  };

  this.buildRanks = function() {
    const ranks = {};
    let count = 1;
    listData.headwords.forEach(headword => {
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

    listData.timesMarked.forEach( (times, headword) => {
      $(`#official-${headword}`).parent().addClass('official-list-match');
      $(`#official-${headword}-count`).text(times.toString());
    });
  };

  this.focusHeadword = function(headword) {
    // const row = $(markedHeadword).parent();
    const times = listData.timesMarked.get(headword) || 0;
    this.emphasizeCurrentHeadwordMatch(headword);
    $(`#official-${headword}-count`).text(times.toString());
  };

  this.unfocusHeadword = function(headword) {
    const markedHeadword = document.querySelector(`#official-${headword}`);
    const times = listData.timesMarked.get(headword)
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
    '<th class="official-list-header clickable" id="official-list-header-rank">Rank</th>' +
    '<th class="official-list-header clickable" id="official-list-header-headword">Headword</th>' +
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

  // TODO: This is the same as the function in auto_list -- extract to another module?
  this.scrollToFirstMatch = function () {
    const highlightedElement = document.querySelector('mark');
    if (highlightedElement) {
      highlightedElement.scrollIntoView({behavior: 'auto',
                                         block: 'center'});
    }
  };

  this.highlightAllEditorMatches = function (headword) {
    let matchStart, matchEnd;
    let searchStart = 0;
    let wordsHighlighted = 0;
    const initialPosition = trixEditor.getSelectedRange();
    listManager.formatter.clearFormatting('searchHighlight');
    const editorInflections = listData.editorInflections[headword];
    if (!editorInflections) {
      return;
    }
    listData.editorInflections[headword].forEach(inflection => {
      matchStart = getStartIndex(inflection, searchStart);
      listManager.formatter.formatMatch(matchStart, inflection.length, 'searchHighlight');
      matchEnd = matchStart + inflection.length;
      searchStart = matchEnd + 1;
      wordsHighlighted += 1;
      if (wordsHighlighted === 1) {
        this.scrollToFirstMatch();
      }
    });
    trixEditor.setSelectedRange(initialPosition);
  };

  this.activateListeners = function() {
    $('#official-list-header-headword').off();
    $('#official-list-header-headword').on('click', _ => {
      this.showOfficialList([...listData.headwords].sort((a, b) => {
        return a.localeCompare(b, undefined, {sensitivity: 'base'});
      }));
    });
    $('#official-list-header-rank').off();
    $('#official-list-header-rank').on('click', _ => {
      this.showOfficialList(listData.headwords);
    });
    $('.official-list-headwords').off();
    $('.official-list-headwords').on('click', event => {
      const headword = $(event.target).text().toLowerCase();
      if (!listData.timesMarked.get(headword)) {
        return;
      }
      this.highlightAllEditorMatches(headword);
      listManager.formatter.markOnAutoList(headword);
      this.emphasizeCurrentHeadwordMatch(headword);
    });
  };
}


export { OfficialList };
