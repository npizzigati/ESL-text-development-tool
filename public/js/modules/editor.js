import { isWordCharacter, retrieveWord,
         retrieveWordCoordinates, determineWordStart,
         determineWordEnd } from './utils/word_utilities.js';
import { Search } from './utils/search.js';
import { Autosave } from './autosave.js';

function Editor(listData, listManager, operationManager) {

  this.recoveredFilename = null;

  const trixElement = document.querySelector("trix-editor");
  const trixEditor = trixElement.editor;

  let wordClickTimeoutID;

  const displaySearchIcon = function() {
    $('.search-icon-container').css('display', 'block');
  };

  this.executeStartupActions = function(recoveredFilename = null) {
    if (recoveredFilename) {
      this.recoveredFilename = recoveredFilename;
    }

    $(trixElement).focus();
    listData.calculate();
    listManager.officialList.setUp();
    listManager.autoList.setUp();
    listManager.assumedList.setUp(this.recoveredFilename);
    listManager.myList.setUp();
    this.activateEditorListeners();
    displaySearchIcon();
    const search = new Search();
    search.activateSearchListeners();
    this.autosave = Autosave.setUpAutosave(listData, this.recoveredFilename);
  };

  this.activateEditorListeners = function() {
    $(trixElement).on('trix-selection-change', () => {
      operationManager.processOperation();
      this.autosave();
    });
    // Listener for clicks on matches in editor
    $(trixElement).on('click', _event => {
      // Stop first click event from firing in case of double click
      if (wordClickTimeoutID) {
        clearTimeout(wordClickTimeoutID);
      }
      // Clear any highlighting
      // Delay to allow time for trix to register cursor position
      setTimeout(() => {
        clearHighlighting();
      }, 300);

      // It takes a fraction of a second for Trix to update caret
      // position;
      wordClickTimeoutID = setTimeout(() => {
        const clickedWord = getClickedWord();
        if (!clickedWord) {
          return;
        }
        const headword = listData.getHeadword(clickedWord);
        if (headword && !listData.isAssumedWord(headword)) {
          markOnOfficialList(headword);
          markOnAutoList(headword);
        }
      }, 200);
    });
  };

  const clearHighlighting = function() {
    const initialPosition = trixEditor.getSelectedRange();
    const length = trixEditor.getDocument().toString().length;
    trixEditor.setSelectedRange([0, length - 1]);
    trixEditor.deactivateAttribute('searchHighlight');
    trixEditor.setSelectedRange(initialPosition);
  };

  const markOnOfficialList = function(headword) {
    listManager.officialList.emphasizeCurrentHeadwordMatch(headword);
  };

  const markOnAutoList = function(headword) {
    listManager.autoList.emphasizeCurrentHeadwordMatch(headword);
  };

  const getClickedWord = function() {
    const caretPosition = trixEditor.getSelectedRange();
    const index = caretPosition[0];
    const fullText = trixEditor.getDocument().toString();
    const clickedCharacter = fullText[index];
    if (!isWordCharacter(clickedCharacter)) {
      return null;
    }
    const [wordStart, wordEnd] = retrieveWordCoordinates(fullText, index);
    return retrieveWord(fullText, [wordStart, wordEnd]);
  };
}

export { Editor };
