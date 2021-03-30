import { RecoveryList } from './recovery_list.js'

const RecoveryManager = function(ListData, ListManager, OperationManager, Editor) {
  const trixElement = document.querySelector("trix-editor");
  const trixEditor = trixElement.editor;

  this.executeStartupActions = function() {
    const entries = retrieveAutosaveEntriesFromLocalStorage();
    const recoveryList = new RecoveryList(entries);
    recoveryList.deleteOldListItems();
  }

  function listAutosaves() {
    const entries = retrieveAutosaveEntriesFromLocalStorage();
    const recoveryList = new RecoveryList(entries);
    const htmlListItems = recoveryList.retrieveHtmlListItems();
    // recoveryList.deleteOldListItems();
    // Display list items
    if (htmlListItems.length === 0) {
      $('#recovery-list').append('<em>No autosave entries yet</em>');
    }
    $('#recovery-list').append('<ul>' + htmlListItems.join('') + '</ul>');
    $('#recovery-list').append('<p id="cancel-recovery">Return to main screen</p>');
    activateRecoveryCancelListener();
  }

  function activateRecoveryCancelListener() {
    $('#cancel-recovery').on('click', () => {
      switchLayoutToMain();
    });
  }

  function retrieveAutosaveEntriesFromLocalStorage() {
    const entries = {};
    $('#recovery-list').empty();
    let filename, fileContent, base_url, hyperlink, listPart, date, time, timestamp;
    for (let i = 0; i < localStorage.length; i++) {
      filename = localStorage.key(i)
      fileContent = JSON.parse(localStorage.getItem(filename));
      timestamp = fileContent.timestamp;
      entries[timestamp] = {
        date: fileContent.date,
        time: fileContent.time,
        filename: filename 
      }
    }
    return entries;
  }

  this.activateRecoveryListeners = function() {
    $('#recovery-message').on('click', function() {
      switchLayoutToRecovery();
    });

    $('#recovery-list').on('click', '.autosave-file', function(event) {
      const filename = event.target.id;
      const fileContent = JSON.parse(localStorage.getItem(filename));
      const editorContent = fileContent.editorContent
      const headwordsAndInflections = fileContent.headwordsAndInflections;
      const assumedWords = fileContent.assumedWords;
      restoreEditingEnvironment(editorContent, headwordsAndInflections, assumedWords, filename);
    })
  };

  function switchLayoutToRecovery() {
    $('#new-headwords-form-container').css('display', 'none');
    $('.layout-row1').css('display','none');
    $('#recovery-message').html('Select session to recover:');
    $('#recovery-message').css('cursor', 'default');
    $('#recovery-message').addClass('no-hover');
    $('#recovery-list').css('display', 'block');
    $('#page-title').css('display', 'block');
    listAutosaves();
  }

  function switchLayoutToMain() {
    $('#new-headwords-form-container').css('display', 'inline');
    $('.layout-row1').css('display','flex');
    $('#recovery-message').html('Or click here to recover an autosaved session');
    $('#recovery-message').css('cursor', 'pointer');
    $('#recovery-message').removeClass('no-hover');
    $('#recovery-list').css('display', 'none');
    $('#page-title').css('display', 'none');
    $('#recovery-list').css('display', 'none');
  }

  function showEditingEnvironment() {
    $('.layout-row1').css('display','flex');
  }

  function hideRecoveryInfo() {
    $('#recovery-message').css('display', 'none');
    $('#recovery-list').css('display', 'none');
  }

  function restoreEditingEnvironment(editorContent, headwordsAndInflections, assumedWords, filename) {
    const listData = new ListData(headwordsAndInflections, assumedWords);
    const listManager = new ListManager(listData);
    const operationManager = new OperationManager(listData, listManager);
    const editor = new Editor(listData, listManager, operationManager);
    trixEditor.loadJSON(editorContent);
    operationManager.updateFullTextHistory();
    hideRecoveryInfo();
    showEditingEnvironment();
    // Send the recovered filename into editor so we can
    // Delete that autosave file when we create a new one
    // If the user updates
    editor.executeStartupActions(filename);
  }
}

export { RecoveryManager };
