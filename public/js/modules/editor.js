import { isWordCharacter, retrieveWord,
         retrieveWordCoordinates, determineWordStart,
         determineWordEnd } from './utils/word_utilities.js';
import { Search } from './utils/search.js';

function Editor(listData, listManager, operationManager) {

  this.recoveredFilename = null;

  const trixElement = document.querySelector("trix-editor");
  const trixEditor = trixElement.editor;

  let wordClickTimeoutID;
  let autosaveTimeoutID;

  this.executeStartupActions = function(recoveredFilename = null) {
    if (recoveredFilename) {
      this.recoveredFilename = recoveredFilename;
    }

    $(trixElement).focus();
    listData.calculate();
    listManager.officialList.refresh();
    listManager.myList.refresh();
    this.activateEditorListeners();
    displaySearchIcon();
    const search = new Search();
    search.activateSearchListeners();
    this.autosave = this.setUpAutosave();
  };

  const displaySearchIcon = function() {
    $('.search-icon-container').css('display', 'block');
  }

  this.activateEditorListeners = function() {
    $(trixElement).on('trix-selection-change', () => {
      operationManager.processOperation();
      this.autosave();
    });
    // Listener for clicks on matches in editor
    $(trixElement).on('click', event => {
      // Stop first click event from firing in case of double click
      if (wordClickTimeoutID) {
        clearTimeout(wordClickTimeoutID)
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
        if (headword) {
          markOnOfficialList(headword);
          markOnMyList(headword);
        }
      }, 200);
    });
  };

  this.setUpAutosave = function() {
    const tabID = Math.random() * 10e16;
    let updated = false;
    const recoveredFilename = this.recoveredFilename;

    const autosave = function() {
      if (autosaveTimeoutID) {
        clearTimeout(autosaveTimeoutID);
      }

      autosaveTimeoutID = setTimeout(() => {
        // On first update, remove previous file from localStorage
        // so it can be replaced by new one
        if (updated === false && recoveredFilename) {
          localStorage.removeItem(recoveredFilename);
          updated = true;
        }
        const dateTime = new Date();
        const autosaveItem = {
          date: dateTime.toLocaleDateString(),
          time: dateTime.toLocaleTimeString(),
          editorContent: trixEditor,
          headwordsAndInflections: {
            headwords: listData.headwords,
            inflections_map: listData.inflectionsMap
          }
        }
        const filename = `autosave-${tabID}`;
        localStorage.setItem(filename, JSON.stringify(autosaveItem));
      }, 800);
    };

    return autosave
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

  const markOnMyList = function(headword) {
    listManager.myList.emphasizeCurrentHeadwordMatch(headword);
  };

  const getClickedWord = function() {
    const caretPosition = trixEditor.getSelectedRange();
    const index = caretPosition[0];
    const fullText = trixEditor.getDocument().toString();
    const clicked_character = fullText[index]
    if (!isWordCharacter(clicked_character)) {
      return null;
    }
    const [wordStart, wordEnd] = retrieveWordCoordinates(fullText, index);
    return retrieveWord(fullText, [wordStart, wordEnd]);
  };
}

export { Editor };
