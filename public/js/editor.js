import * as Search from './modules/search.js';
import { ListManager } from './modules/list_manager.js';
import { ListData } from './modules/list_data.js';
import { OperationManager } from './modules/operation_manager.js';
import { isWordCharacter, retrieveWord,
         retrieveWordCoordinates, determineWordStart,
         determineWordEnd } from './modules/utils/word_utilities.js';

// TODO: Add "am" to inflections list ("be"); also check
// contractions; also "I'm"; "ai" is listed as an inflection of "be" and that
// makes no sense.

const trixElement = document.querySelector("trix-editor");
const trixEditor = trixElement.editor;

const listData = new ListData();
const listManager = new ListManager(listData);
const operationManager = new OperationManager(listData, listManager);

let wordClickTimeoutID;
let autosaveTimeoutID;

// Add new HTML tag for words in list
class NeilsNonMatch extends HTMLElement {}
customElements.define('neils-non-match', NeilsNonMatch);

// Add Trix format for marking list words
Trix.config.textAttributes.neilsNonMatch = {
  tagName: 'neils-non-match',
  inheritable: true
};

// Add Trix format for highlighting search matches
Trix.config.textAttributes.searchHighlight = {
  tagName: 'mark',
  inheritable: true
};

function activateEditorListeners() {
  $(trixElement).on('trix-selection-change', () => {
    console.log('Trix selection change fired')
    // Guard clause should also return right away if change is
    // due to automatic events caused in processOperation --
    // maybe something like isProcessOperationUnderway ?
    // Weirdness also happens when I start typing in text body
    // after refresh

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
}

function editorStartupActivities() {
  const editorContent = localStorage.getItem('autosavedEditorContent');
  if (editorContent) {
    reloadContent(editorContent);
    operationManager.updateFullTextHistory();
  }
  $(trixElement).focus();
  listData.calculate();
  listManager.officialList.refresh();
  listManager.myList.refresh();
  activateEditorListeners();
}

function autosave() {
  if (autosaveTimeoutID) {
    clearTimeout(autosaveTimeoutID);
  }

  autosaveTimeoutID = setTimeout(() => {
    localStorage.setItem('autosavedEditorContent', JSON.stringify(trixEditor));
  }, 800);
}

function reloadContent(editorContent) {
  trixEditor.loadJSON(JSON.parse(editorContent));
}

function clearHighlighting() {
  const initialPosition = trixEditor.getSelectedRange();
  const length = trixEditor.getDocument().toString().length;
  trixEditor.setSelectedRange([0, length - 1]);
  trixEditor.deactivateAttribute('searchHighlight');
  trixEditor.setSelectedRange(initialPosition);
};

function markOnOfficialList(headword) {
  listManager.officialList.emphasizeCurrentHeadwordMatch(headword);
}

function markOnMyList(headword) {
  listManager.myList.emphasizeCurrentHeadwordMatch(headword);
}

function getClickedWord() {
  const caretPosition = trixEditor.getSelectedRange();
  const index = caretPosition[0];
  const fullText = trixEditor.getDocument().toString();
  const clicked_character = fullText[index]
  if (!isWordCharacter(clicked_character)) {
    return null;
  }
  const [wordStart, wordEnd] = retrieveWordCoordinates(fullText, index);
  return retrieveWord(fullText, [wordStart, wordEnd]); 
}

Search.activateSearchListeners();

// Populate official word list with headwords
listManager.officialList.showOfficialList(headwords);

listManager.myList.show()
listManager.myList.activateListeners();
listManager.officialList.activateListeners();

$('.search-box-container').hide();

editorStartupActivities();
