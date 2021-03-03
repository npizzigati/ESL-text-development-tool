const RecoveryManager = function(ListData, ListManager, OperationManager, Editor) {
  const trixElement = document.querySelector("trix-editor");
  const trixEditor = trixElement.editor;

  function list_autosaves() {
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

    // Sort autosave entries, oldest first
    const keys = Object.keys(entries);
    keys.sort((a, b) => {
      parseInt(a, 10) - parseInt(b, 10)
    });

    // Build list items to be displayed
    htmlEntries = [];
    keys.forEach( (key) => {
      filename = entries[key].filename; 
      date = entries[key].date;
      time = entries[key].time;
      htmlEntries.push(`<li class="autosave-file clickable" id="${filename}">${date} - ${time}</li>`);
    });

    // Display list items
    $('#recovery-list').append('<ul>' + htmlEntries.join('') + '</ul>');
  }

  this.activateRecoveryListeners = function() {
    console.log('Activating recovery listeners');

    $('#recovery-message').on('click', function() {
      $('#new-headwords-form').css('display', 'none');
      $('.layout-row1').css('display','none');
      $('#recovery-message').html('Select session to recover:');
      $('#recovery-list').css('display', 'block');
      list_autosaves();
    });

    $('#recovery-list').on('click', '.autosave-file', function(event) {
      console.log('event: ' + event.target.id);
      const filename = event.target.id;
      const fileContent = JSON.parse(localStorage.getItem(filename));
      const editorContent = fileContent.editorContent
      const headwordsAndInflections = fileContent.headwordsAndInflections;
      restoreEditingEnvironment(editorContent, headwordsAndInflections, filename);
    })
  };

  function showEditingEnvironment() {
    $('.layout-row1').css('display','flex');
  }

  function hideRecoveryInfo() {
    $('#recovery-message').css('display', 'none');
    $('#recovery-list').css('display', 'none');
  }

  function restoreEditingEnvironment(editorContent, headwordsAndInflections, filename) {
    const listData = new ListData(headwordsAndInflections);
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
