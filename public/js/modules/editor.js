import { isWordCharacter, retrieveWord,
         retrieveWordCoordinates, determineWordStart,
         determineWordEnd } from './utils/word_utilities.js';
import { Search } from './utils/search.js';
import { RecoveryManager } from './recovery_manager.js';

function Editor(listData, listManager, operationManager) {
  const trixElement = document.querySelector("trix-editor");
  const trixEditor = trixElement.editor;

  let wordClickTimeoutID;
  let autosaveTimeoutID;

  const editorStartupActivities = function() {
    // const editorContent = localStorage.getItem('autosavedEditorContent');
    // if (editorContent) {
    //   reloadContent(editorContent);
    //   operationManager.updateFullTextHistory();
    // }
    $(trixElement).focus();
    listData.calculate();
    listManager.officialList.refresh();
    listManager.myList.refresh();
    activateEditorListeners();
    displaySearchIcon();
  };

  const displaySearchIcon = function() {
    $('.search-icon-container').css('display', 'block');
  }

  const activateEditorListeners = function() {
    $(trixElement).on('trix-selection-change', () => {
      operationManager.processOperation();
      autosave();
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

  const setUpAutosave = function() {
    sessionStorage.tabID = Math.random() * 10e16;

    const autosave = function() {
      if (autosaveTimeoutID) {
        clearTimeout(autosaveTimeoutID);
      }


      autosaveTimeoutID = setTimeout(() => {
        const tabID = sessionStorage.tabID;
        const autosaveItem = {
          date: new Date().toLocaleDateString(),
          editorContent: trixEditor
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

  editorStartupActivities();
  const search = new Search();
  // const search = new Search(this);
  search.activateSearchListeners();
  const autosave = setUpAutosave();
  const recoveryManager = new RecoveryManager();
  recoveryManager.activateRecoveryListeners();
}

export { Editor };
