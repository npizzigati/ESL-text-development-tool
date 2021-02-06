import { ListManager } from './modules/list_manager.js';
import { ListData } from './modules/list_data.js';
import { OperationManager } from './modules/operation_manager.js';
import { Editor } from './modules/editor.js';

// TODO: Add "am" to inflections list ("be"); also check
// contractions; also "I'm"; "ai" is listed as an inflection of "be" and that
// makes no sense.

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

const listData = new ListData();
const listManager = new ListManager(listData);
const operationManager = new OperationManager(listData, listManager);
const editor = new Editor(listData, listManager, operationManager);
