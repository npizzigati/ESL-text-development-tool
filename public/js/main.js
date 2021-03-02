import { ListManager } from './modules/list_manager.js';
import { ListData } from './modules/list_data.js';
import { OperationManager } from './modules/operation_manager.js';
import { Editor } from './modules/editor.js';
import { RecoveryManager } from './modules/recovery_manager.js';

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

// $('#new-tab-button').on('click', () => {
//   hideNewTabButton();
//   showNewHeadwordsForm();
//   activateSubmitListener();
// });

function mainStartUpActions() {
  showNewHeadwordsForm();
  activateSubmitListener();
  activatePageUnloadListener();
  const recoveryManager = new RecoveryManager(ListData, ListManager, OperationManager, Editor);
  recoveryManager.activateRecoveryListeners();
}

function activatePageUnloadListener() {
  window.onbeforeunload = () => {
    // Custom message will not be displayed in modern browsers
    return 'Are you sure you want to leave? You are in the middle of something.';
  };
}

function showNewHeadwordsForm() {
  $('#new-headwords-form').css('display', 'block');
}

function hideNewHeadwordsForm() {
  $('#new-headwords-form').css('display', 'none');
}

function showWaitMessage() {
  $('#new-headwords-wait-message').css('display', 'block');
}

function hideWaitMessage() {
  $('#new-headwords-wait-message').css('display', 'none');
}

function showNewTabButton() {
  $('#new-tab-button').css('display', 'inline');
}

function hideNewTabButton() {
  $('#new-tab-button').css('display', 'none');
}

function activateSubmitListener() {
  $('#new-headwords-form').submit(function(e) {
    e.preventDefault(); 
    hideNewHeadwordsForm();
    showWaitMessage();
    const form = $(this);
    const url = form.attr('action');
    const formData = new FormData();
    const file = $('#file')[0].files[0];
    formData.append('file', file);
    $.ajax({
      type: 'POST',
      url: url,
      data: formData,
      contentType: false,
      processData: false
    })
      .done(function(data, textStatus, jqXHR) {
        hideWaitMessage();
        // showNewTabButton();
        openNewTab(JSON.parse(data));
      })
  });
}

function openNewTab(parsedData) {
  const listData = new ListData(parsedData);
  const listManager = new ListManager(listData);
  const operationManager = new OperationManager(listData, listManager);
  const editor = new Editor(listData, listManager, operationManager);
}

mainStartUpActions();
