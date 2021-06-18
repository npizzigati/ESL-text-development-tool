/* eslint-disable max-lines-per-function */
/* eslint-disable max-len */
function AutoList(listData, listManager) {
  // Check for document so we can skip these lines in testing
  if (typeof document !== "undefined") {
    this.trixElement = document.querySelector("trix-editor");
    this.trixEditor = this.trixElement.editor;
  }
  this.listData = listData;
  this.officialList = listManager.officialList;
  this.defaultMaxWordsPerSublistRow = 10;
  this.sublists = [];
  this.sublistInflectionsMapping = {};
  this.currentlyMatchedWord = null;
  this.myListRowLengths = [];
  this.rowEntries = [];

  this.setUp = function() {
    this.refresh();
    this.show();
  };

  this.refresh = function() {
    // TODO -- determine if sublists are built based on myList and
    // call correct method
    this.sublists = this.buildSublists();
    $('#auto-list-table').remove();
    const parts = [];
    parts.push('<table id="auto-list-table">');
    parts.push('<tbody class="auto-list-table-body">');
    this.rowEntries = Object.entries(this.sublists).sort((a, b) => a[0] - b[0]);
    this.rowEntries.forEach(([number, headwords]) => {
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
      taggedHeadwords.push(`<span class="clickable-individual-word" id="auto-sublist-${headword}">${this.listData.originalHeadwordSpellings[headword]}</span>`);
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
    return $('.auto-list').css('display') === 'none';
  };

  this.updateRowLengths = function () {
    // parsedLists is an object keyed by the rowId with values
    // being the word lists on each row

    // Handle the case where myList hasn't been created yet
    if (listManager.myList === undefined) return [];

    const myListRows = listManager.myList.rows;
    if (myListRows.length === 0) return [];

    this.myListRowLengths = myListRows.map(row => row.length);
  };

  this.buildSublists = function () {
    const headwords = listData.sublistHeadwords.slice();
    const rows = {};
    let rowLimit;
    let currentRowNumber = 10;
    const rowLengths = this.myListRowLengths.slice();
    rows[currentRowNumber] = [];

    while (listData.sublistHeadwords.length > 0) {
      rowLimit = rowLengths.shift() || this.defaultMaxWordsPerSublistRow;
      for (let index = 0; index < rowLimit; index++) {
        const headword = headwords.shift();
        if (headword === undefined) return rows;

        if (rows[currentRowNumber] === undefined) rows[currentRowNumber] = [];
        rows[currentRowNumber].push(headword);
      }
      currentRowNumber += 10;
    }

    return rows;
  };
}
export { AutoList };
