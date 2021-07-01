import { ListManager } from './modules/list_manager.js';
import { ListData } from './modules/list_data.js';
import { OperationManager } from './modules/operation_manager.js';
import { Editor } from './modules/editor.js';
import { RecoveryManager } from './modules/recovery_manager.js';

// TODO: Add "am" to inflections list ("be"); also check
// contractions; also "I'm";

// Add new HTML tag for words in list
class NeilsNonMatch extends HTMLElement {}
// Add new HTML tag for words that are used out of order according
// to the order of the mylist
class NeilsOutOfOrder extends HTMLElement {}

customElements.define('neils-non-match', NeilsNonMatch);
customElements.define('neils-out-of-order', NeilsOutOfOrder);

// Add Trix format for marking list words
Trix.config.textAttributes.neilsNonMatch = {
  tagName: 'neils-non-match',
  inheritable: true
};

// Add Trix format for marking out of order words
Trix.config.textAttributes.neilsOutOfOrder = {
  tagName: 'neils-out-of-order',
  inheritable: true
};

// Add Trix format for highlighting search matches
Trix.config.textAttributes.searchHighlight = {
  tagName: 'mark',
  inheritable: true
};

function executeStartupActions() {
  activateFileChooserListener();
  activateSubmitListener();
  activatePageUnloadListener();
  const recoveryManager =
        new RecoveryManager(ListData, ListManager, OperationManager, Editor);
  recoveryManager.activateRecoveryListeners();
  recoveryManager.executeStartupActions();
}

function activatePageUnloadListener() {
  window.onbeforeunload = () => {
    // Custom message will not be displayed in modern browsers
    return 'Are you sure you want to leave? You are in the middle of something.';
  };
}

function hideNewHeadwordsForm() {
  $('#new-headwords-form-container').css('display', 'none');
}

function showWaitMessage() {
  $('#new-headwords-wait-message').css('display', 'block');
  window.intervalId = setInterval(() => {
    const message = $('#new-headwords-wait-message').html();
    $('#new-headwords-wait-message').html(message + ' .');
  }, 500);
}

function hideWaitMessage() {
  $('#new-headwords-wait-message').css('display', 'none');
  clearInterval(window.intervalId);
}

function showPageTitle() {
  $('#page-title').css('display', 'block');
}

function activateFileChooserListener() {
  $('#file-upload')[0].addEventListener('change', function() {
    $('#file-form').submit();
  });
}

function activateSubmitListener() {
  $('#file-form').submit(function(e) {
    e.preventDefault();
    hideNewHeadwordsForm();
    hideRecoveryMessage();
    showPageTitle();
    showWaitMessage();
    const form = $(this);
    const url = form.attr('action');
    const formData = new FormData();
    const file = $('#file-upload')[0].files[0];
    formData.append('file', file);
    $.ajax({
      type: 'POST',
      url: url,
      data: formData,
      contentType: false,
      processData: false
    })
      .done(function(data, _textStatus, _jqXHR) {
        hideWaitMessage();
        startNewEditingSession(JSON.parse(data));
      });
  });
}

function hideRecoveryMessage() {
  $('#recovery-message').css('display', 'none');
}

function startNewEditingSession(parsedData) {
  const listData = new ListData(parsedData);
  const listManager = new ListManager(listData);
  const operationManager = new OperationManager(listData, listManager);
  const editor = new Editor(listData, listManager, operationManager);
  editor.executeStartupActions();
}

executeStartupActions();
