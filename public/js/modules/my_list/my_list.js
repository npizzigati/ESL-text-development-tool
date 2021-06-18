import { ListString, BadInputError} from './list_parser.js';
import { Autosave } from '../autosave.js';

/* eslint-disable max-lines-per-function */
/* eslint-disable max-len */
function MyList(listData, listManager) {
  this.parsedLists = {};
  this.taggedLists = {};
  this.rows = [];
  this.rowStrings = [];

  this.buildList = function () {
    const parts = this.buildParts();
    $('.my-list').append(parts.join(''));
  };

  this.findRowIndex = function (rows, headword) {
    for (let index = 0; index < rows.length; index++) {
      let row = rows[index];
      if (row.indexOf(headword) === -1) continue;

      return index;
    }
    return -1;
  };

  this.isHeadwordInCorrectRow = function (myListRowIndex, headword) {
    const autoListRows = listManager.autoList.rowEntries.map(element => element[1]);
    const autoListRowIndex = this.findRowIndex(autoListRows, headword);
    // console.log(`autoListRowIndex === ${autoListRowIndex}`);
    // console.log(`myListRowIndex === ${myListRowIndex}`);

    return autoListRowIndex === myListRowIndex;
  };

  this.refresh = function () {
    // Remove match formatting from headwords, before adding it back in
    $('.my-list-table-body span').removeClass('my-list-correct-row-match');
    $('.my-list-table-body span').removeClass('my-list-incorrect-row-match');
    $('.my-list-table-body span').removeClass('clickable-individual-word');
    const autolistHeadwords = listData.sublistHeadwords;

    for (let headwordIndex = 0; headwordIndex < autolistHeadwords.length; headwordIndex++) {
      const headword = autolistHeadwords[headwordIndex];
      const rowIndex = this.findRowIndex(this.rows, headword);
      if (rowIndex === -1) continue;

      if (this.isHeadwordInCorrectRow(rowIndex, headword)) {
        $(`.my-list-table-body #my-list-${headword}`).addClass('my-list-correct-row-match');
        $(`.my-list-table-body #my-list-${headword}`).addClass('clickable-individual-word');
      } else {
        $(`.my-list-table-body #my-list-${headword}`).addClass('my-list-incorrect-row-match');
        $(`.my-list-table-body #my-list-${headword}`).addClass('clickable-individual-word');
      }
    }
  };

  this.buildParts = function () {
    if (Object.entries(this.taggedLists).length === 0) return [];
    const parts = [];
    parts.push('<table id="my-list-table">');
    parts.push('<tbody class="my-list-table-body">');
    this.rowStrings = this.buildRowStrings();
    parts.push(this.rowStrings.join(''));
    parts.push('</tbody></table>');
    return parts;
  };

  this.buildRowStrings = function () {
    const rowStrings = [];
    Object.entries(this.taggedLists).forEach(([rowId, words]) => {
      const formattedWords = [];
      const rowContents = this.buildWordsPart(words);
      formattedWords.push('<tr>');
      formattedWords.push(`<td>${rowId}</td>`);
      formattedWords.push(`<td>${rowContents}</td>`);
      formattedWords.push('</tr>');
      const rowString = formattedWords.join('');
      rowStrings.push(rowString);
    });
    return rowStrings;
  };

  this.buildWordsPart = function (words) {
    return words.join(', ');
  };

  this.addInitialTags = function (parsedLists) {
    const taggedLists = {};
    Object.entries(parsedLists).forEach(([rowId, list]) => {
      taggedLists[rowId] = this.addTagsToList(list);
    });
    return taggedLists;
  };

  this.addTagsToList = function (list) {
    return list.map(word => {
      return `<span id="my-list-${word.toLowerCase()}" class="clickable-individual-word">${word}</span>`;
    });
  };

  this.readFile = function (input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.readAsText(file);

    reader.onload = () => {
      const wordList = reader.result;
      try {
        this.parsedLists = new ListString(wordList).parse();
        this.taggedLists = this.addInitialTags(this.parsedLists);
        this.rows = this.buildRows();
        this.buildList();
        this.refresh();
        listManager.autoList.updateRowLengths();
      } catch (error) {
        if (error instanceof BadInputError) {
          const alertMessage = 'There appears to be a problem with ' +
                'your "My List" file: ';
          alert(alertMessage + error.message);
          this.displayFileChooser();
        } else {
          throw error;
        }
      }
    };

    reader.onerror = function() {
      console.log(reader.error);
    };

    this.hideFileChooser();
  };

  this.buildRows = function () {
    const mixedCaseRows = Object.entries(this.parsedLists).sort((a, b) => a[0] - b[0]).map(e => e[1]);
    const lowerCaseRows = mixedCaseRows.map(row => downCaseWordsInRow(row));

    function downCaseWordsInRow(row) {
      return row.map(word => word.toLowerCase());
    }

    return lowerCaseRows;
  };

  this.setUp = function() {
    this.displayFileChooser();
    this.activateListeners();
    this.hide();
  };

  this.displayFileChooser = function () {
    $('#my-list-chooser').css('display', 'inline');
  };

  this.hideFileChooser = function () {
    $('#my-list-chooser').css('display', 'none');
  };

  this.isHidden = function() {
    return $('.my-list').css('display') === 'none';
  };

  this.show = function() {
    $('.my-list').css('display', 'block');
    $('#my-list-title').addClass('active-list-title');
  };

  this.hide = function() {
    $('#my-list-title').removeClass('active-list-title');
    $('.my-list').css('display', 'none');
  };

  this.activateListeners = function () {
    $('.special-lists').on('change', '#my-list-chooser', event => {
      this.readFile(event.target);
    });
  };
}

export { MyList };
