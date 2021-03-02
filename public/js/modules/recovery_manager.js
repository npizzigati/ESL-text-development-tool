const RecoveryManager = function(ListData, ListManager, OperationManager, Editor) {
  const trixElement = document.querySelector("trix-editor");
  const trixEditor = trixElement.editor;

  function list_autosaves() {
    const listParts = [];
    $('#recovery-list').empty();
    let filename, fileContent, base_url, hyperlink, listPart, date;
    for (let i = 0; i < localStorage.length; i++) {
      filename = localStorage.key(i)
      fileContent = JSON.parse(localStorage.getItem(filename)); 
      date = fileContent.date;
      // base_url = location.origin;
      // hyperlink = `base_url/${filename}` 
      listPart = `${date} - ${filename}`
      listParts.push(`<li class="autosave-file" id="${filename}">${listPart}</li>`);
    }
    $('#recovery-list').append('<ul>' + listParts.join('') + '</ul>');
  }

  this.activateRecoveryListeners = function() {
    console.log('Activating recovery listeners');

    $('#recovery-message').on('click', function() {
      $('#new-headwords-form').css('display', 'none');
      $('.layout-row1').css('display','none')
      $('#recovery-list').css('display', 'block');
      list_autosaves();
    });

    $('#recovery-list').on('click', '.autosave-file', function(event) {
      console.log('event: ' + event.target.id);
      const filename = event.target.id;
      const fileContent = JSON.parse(localStorage.getItem(filename));
      const editorContent = fileContent.editorContent
      const headwordsAndInflections = fileContent.headwordsAndInflections;
      restoreEditingEnvironment(editorContent, headwordsAndInflections);
    })
  };

  function showEditingEnvironment() {
    $('.layout-row1').css('display','flex');
  }

  function hideRecoveryInfo() {
    $('#recovery-message').css('display', 'none');
    $('#recovery-list').css('display', 'none');
  }

  function restoreEditingEnvironment(editorContent, headwordsAndInflections) {
    const listData = new ListData(headwordsAndInflections);
    const listManager = new ListManager(listData);
    const operationManager = new OperationManager(listData, listManager);
    const editor = new Editor(listData, listManager, operationManager);
    trixEditor.loadJSON(editorContent);
    hideRecoveryInfo();
    showEditingEnvironment();
  }

}

export { RecoveryManager };
