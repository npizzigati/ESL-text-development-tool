import { getStartIndex } from '../utils/word_utilities.js';
import { ListString, BadInputError} from './list_parser.js';
import { Autosave } from '../autosave.js';

/* eslint-disable max-lines-per-function */
/* eslint-disable max-len */
function MyList(listData, listManager) {
  const trixElement = document.querySelector("trix-editor");
  const trixEditor = trixElement.editor;

  this.taggedLists = {};
  this.rows = [];
  this.rowStrings = [];
  this.fileChooser =
    '<label class="custom-my-file-upload">' +
    '<input id="my-file-upload" name="file" type="file">' +
    '<span>-> Click here to load new "my list" file</span>' +
    '</label>';

  this.setUp = function(recoveredFilename) {
    this.recoveredFilename = recoveredFilename;
    this.autosave = Autosave.setUpAutosave(listData, this.recoveredFilename);
    $('.my-list').append(this.fileChooser);
    this.updateLists();
    this.activateListeners();
    this.hide();
  };

  this.buildList = function () {
    $('#my-list-table').remove();
    $('.custom-my-file-upload').remove();

    const parts = this.buildParts();
    $('.my-list').append(parts.join(''));

    $('.my-list').append(this.fileChooser);
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

    return autoListRowIndex === myListRowIndex;
  };

  this.updateLists = function () {
    if (Object.entries(listData.myListParsedLists).length === 0) return;
    this.taggedLists = this.addInitialTags(listData.myListParsedLists);
    this.rows = this.buildRows();
    this.buildList();
    this.refresh();
    listManager.autoList.updateRowLengths();
  };

  this.refresh = function () {
    // Clear out-of-order match formatting from editor window
    clearOutOfOrderFormatting();
    // Remove match formatting from headwords, before adding it back in
    $('.my-list-table-body span').removeClass('my-list-correct-row-match');
    $('.my-list-table-body span').removeClass('my-list-incorrect-row-match');
    $('.my-list-table-body span').removeClass('clickable-individual-word');
    const autolistHeadwords = listData.sublistHeadwords;

    for (let headwordIndex = 0; headwordIndex < autolistHeadwords.length; headwordIndex++) {
      const headword = autolistHeadwords[headwordIndex];
      const rowIndex = this.findRowIndex(this.rows, headword);
      const headwordNotFound = () => rowIndex === -1;
      if (headwordNotFound()) continue;

      if (this.isHeadwordInCorrectRow(rowIndex, headword)) {
        $(`.my-list-table-body #my-list-${headword}`).addClass('my-list-correct-row-match');
        $(`.my-list-table-body #my-list-${headword}`).addClass('clickable-individual-word');
      } else {
        formatOutOfOrderMatchInEditor(headword);
        $(`.my-list-table-body #my-list-${headword}`).addClass('my-list-incorrect-row-match');
        $(`.my-list-table-body #my-list-${headword}`).addClass('clickable-individual-word');
      }
    }
  };

  function clearOutOfOrderFormatting() {
    listManager.formatter.clearFormatting('neilsOutOfOrder');
  }

  function formatOutOfOrderMatchInEditor(headword) {
    // Find first instance of headword inflection and color it red
    const firstInflection = listData.editorInflections[headword][0];
    const matchStart = getStartIndex(firstInflection, 0);
    const initialPosition = trixEditor.getSelectedRange();
    listManager.formatter.formatMatch(matchStart, firstInflection.length, 'neilsOutOfOrder');
    trixEditor.setSelectedRange(initialPosition);
  }

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

  this.addInitialTags = function (myListParsedLists) {
    const taggedLists = {};
    Object.entries(myListParsedLists).forEach(([rowId, list]) => {
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
        listData.myListParsedLists = new ListString(wordList).parse();
        this.updateLists();
        this.autosave();
      } catch (error) {
        if (error instanceof BadInputError) {
          const alertMessage = 'There appears to be a problem with ' +
                'your "My List" file: ';
          alert(alertMessage + error.message);
        } else {
          throw error;
        }
      }
    };

    reader.onerror = function() {
      console.log(reader.error);
    };
  };

  this.buildRows = function () {
    const mixedCaseRows = Object.entries(listData.myListParsedLists).sort((a, b) => a[0] - b[0]).map(e => e[1]);
    const lowerCaseRows = mixedCaseRows.map(row => downCaseWordsInRow(row));

    function downCaseWordsInRow(row) {
      return row.map(word => word.toLowerCase());
    }

    return lowerCaseRows;
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
    $('.special-lists').on('change', '#my-file-upload', event => {
      this.readFile(event.target);
    });
  };
}

export { MyList };
