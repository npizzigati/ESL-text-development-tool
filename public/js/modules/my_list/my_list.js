import { ListString, BadInputError} from './list_parser.js';
import { Autosave } from '../autosave.js';

/* eslint-disable max-lines-per-function */
function MyList(listData, listManager) {
  this.taggedList = [];
  this.rows = [];

  this.buildList = function () {
    const parts = this.buildParts();
    $('.my-list').append(parts.join(''));
  };

  this.findRowIndex = function (headword) {
    for (let index = 0; index < this.rows.length; index++) {
      const row = this.rows[index];
      if (row.toLowerCase().indexOf(headword) === -1) continue;

      return index;
    }
    return -1;
  };

  this.isHeadwordInCorrectRow = function (headwordIndex, rowIndex) {
    return (Math.floor(headwordIndex / 10) === rowIndex);
  };

  this.refresh = function () {
    const autolistHeadwords = listData.sublistHeadwords;

    // Remove all formatting from headwords, before adding it back in
    $('.my-list-table-body span').removeClass();

    for (let headwordIndex = 0; headwordIndex < autolistHeadwords.length; headwordIndex++) {
      const headword = autolistHeadwords[headwordIndex];
      const rowIndex = this.findRowIndex(headword);
      if (rowIndex === -1) continue;

      if (this.isHeadwordInCorrectRow(headwordIndex, rowIndex)) {
        $(`.my-list-table-body #my-list-${headword}`).addClass('my-list-correct-row-match');
      } else {
        $(`.my-list-table-body #my-list-${headword}`).addClass('my-list-incorrect-row-match');
      }
    }


  };

  this.buildParts = function () {
    if (this.taggedList.length === 0) return [];

    const parts = [];
    parts.push('<table id="my-list-table">');
    parts.push('<tbody class="my-list-table-body">');
    this.rows = this.buildRows();
    parts.push(this.rows.join(''));
    parts.push('</tbody></table>');
    return parts;
  };

  this.buildRows = function () {
    // taggedList is an array of 10-word-list arrays
    // with each word in a span element
    const rows = this.taggedList.map((words, index) => {
      const row = [];
      const lineNumber = (index + 1) * 10;
      const rowContents = words.join(', ');
      row.push('<tr>');
      row.push(`<td>${lineNumber}</td>`);
      row.push(`<td>${rowContents}</td>`);
      row.push('</tr>');
      return row.join('');
    });
    return rows;
  };

  this.addInitialTags = function (parsedList) {
    return parsedList.map(listOfTenWords => {
      const newListOfTenWords = listOfTenWords.map(word => {
        return `<span id="my-list-${word.toLowerCase()}">${word}</span>`;
      });
      return newListOfTenWords;
    });
  };

  this.readFile = function (input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.readAsText(file);

    reader.onload = () => {
      const wordList = reader.result;
      try {
        const parsedList = new ListString(wordList).parse();
        this.taggedList = this.addInitialTags(parsedList);
        this.buildList();
        this.refresh();
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
