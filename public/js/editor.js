import * as Search from './modules/search.js';
import { MyList } from './modules/my_list.js';
import { ListData } from './modules/list_data.js';
import { OfficialListManager } from './modules/official_list_manager.js';
import { OperationManager } from './modules/operation_manager.js';
import { isWordCharacter, retrieveWord,
         retrieveWordCoordinates, determineWordStart,
         determineWordEnd } from './modules/utils/word_utilities.js';

// TODO: Add "am" to inflections list ("be"); also check
// contractions; also "I'm"; "ai" is listed as an inflection of "be" and that
// makes no sense.

const trixElement = document.querySelector("trix-editor");
const trixEditor = trixElement.editor;
let wordClickTimeoutID;

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

$(trixElement).on('trix-selection-change', () => {
  operationManager.processOperation();
});

// Listener for clicks on matches in editor
$('body').on('click', event => {
  // Stop first click event from firing in case of double click
  if (wordClickTimeoutID) {
    clearTimeout(wordClickTimeoutID)
  }
  // It takes a fraction of a second for Trix to update caret
  // position;
  wordClickTimeoutID = setTimeout(() => {
    const clickedWord = getClickedWord();
    if (!clickedWord) {
      return;
    }
    const headword = listData.getHeadword(clickedWord);
    if (headword) {
      const markedHeadword = document.querySelector(`#official-${headword}`);
      markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
      officialListManager.emphasizeCurrentHeadwordMatch(markedHeadword);
    }
  }, 200);
});

function getClickedWord() {
  const caretPosition = trixEditor.getSelectedRange();
  const index = caretPosition[0];
  console.log(`caretPos: ${caretPosition}`);
  const fullText = trixEditor.getDocument().toString();
  const clicked_character = fullText[index]
  if (!isWordCharacter(clicked_character)) {
    return null;
  }
  const [wordStart, wordEnd] = retrieveWordCoordinates(fullText, index);
  return retrieveWord(fullText, [wordStart, wordEnd]); 
}

Search.activateSearchListeners();

const listData = new ListData();
const officialListManager = new OfficialListManager(listData);
const myList = new MyList(listData);
const operationManager = new OperationManager(listData, officialListManager, myList);

// Populate official word list with headwords
officialListManager.populateOfficialList();

myList.show()
myList.activateListeners();

$('.search-box-container').hide();
