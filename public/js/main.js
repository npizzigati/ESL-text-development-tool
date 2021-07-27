import { ListManager } from './modules/list_manager.js';
import { ListData } from './modules/list_data.js';
import { OperationManager } from './modules/operation_manager.js';
import { Editor } from './modules/editor.js';
import { RecoveryManager } from './modules/recovery_manager.js';
import { HeadwordsListString, BadInputError } from './modules/headwords_list_string.js';

// TODO: Add "am" to inflections list ("be"); also check
// contractions; also "I'm";

// Add new HTML tag for words in list
class NeilsNonMatch extends HTMLElement {}

// Add new HTML tag for words that are used out of order according
// to the order of the mylist
class NeilsOutOfOrder extends HTMLElement {}

// Add new HTML tag for words on "official list"
// but not on "my list"
class NeilsOnlyOnOfficialList extends HTMLElement {}

customElements.define('neils-non-match', NeilsNonMatch);
customElements.define('neils-out-of-order', NeilsOutOfOrder);
customElements.define('neils-only-on-official-list', NeilsOnlyOnOfficialList);

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

// Add Trix format for marking words on official list
// but not on my list
Trix.config.textAttributes.neilsOnlyOnOfficialList = {
  tagName: 'neils-only-on-official-list',
  inheritable: true
};

// Add Trix format for highlighting search matches
Trix.config.textAttributes.searchHighlight = {
  tagName: 'mark',
  inheritable: true
};

function executeStartupActions() {
  // activateFileChooserListener();
  // activateSubmitListener();
  activateLoadFileListener();
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
  $('#new-headwords-uploader').css('display', 'none');
}

function showWaitMessage() {
  $('#new-headwords-wait-message').css('display', 'block');
}

function incrementProgressBar() {
  const message = $('#new-headwords-wait-message').html();
  $('#new-headwords-wait-message').html(message + ' .');
}

function hideWaitMessage() {
  $('#new-headwords-wait-message').css('display', 'none');
  clearInterval(window.intervalId);
}

function showPageTitle() {
  $('#page-title').css('display', 'block');
}

// function activateFileChooserListener() {
//   $('#file-upload')[0].addEventListener('change', function() {
//     $('#file-form').submit();
//   });
// }

function activateLoadFileListener () {
  $('#new-headwords-uploader').on('change', '#headwords-file-upload', event => {
    readFile(event.target);
  });
}

function separateHeadwordListIntoChunks(headwords, chunkSize) {
  // Take the first 20 words (or however many words are left) off
  // of headwords until no headwords are left and put those words
  // into a subarray contained in a chunks array }
  const chunks = [];
  let headwordsLeft = headwords.slice();
  while (true) {
    if (headwordsLeft.length < 1) break;

    const length = headwordsLeft.length;

    const chunkEndIndex = (length < chunkSize) ? length : chunkSize;
    const chunk = headwordsLeft.slice(0, chunkEndIndex);
    headwordsLeft = headwordsLeft.slice(chunkEndIndex);
    chunks.push(chunk);
  }

  return chunks;
}

function retrieveInflectionsMap(chunk) {
  return new Promise(resolve => {
    $.post( "/", JSON.stringify(chunk))
      .done(function(data) {
        const inflections_map = JSON.parse(data);
        resolve(inflections_map);
      })
      .fail(function() {
        alert( "Your headwords file couldn't be processed. Sorry about that." );
      });
  });
}

async function processChunks(headwords) {
  // Post headwords in chunks of 200 headwords and add
  // returned data to local headwords and inflections variables
  const CHUNK_SIZE = 200;
  hideNewHeadwordsForm();
  hideRecoveryMessage();
  showPageTitle();
  showWaitMessage();

  const headwordChunks = separateHeadwordListIntoChunks(headwords, CHUNK_SIZE);

  let inflections_map;
  for (const chunk of headwordChunks) {
    // const chunkInflectionsMap = retrieveInflectionsMap(chunk);
    const chunkOfInflections = await retrieveInflectionsMap(chunk);
    inflections_map = Object.assign({}, inflections_map, chunkOfInflections);
    incrementProgressBar();
  }

  hideWaitMessage();
  const editingSessionData = { headwords: headwords,
                               inflections_map: inflections_map };
  startNewEditingSession(editingSessionData);
}

function readFile(input) {
  let file = input.files[0];
  let reader = new FileReader();

  reader.readAsText(file);

  reader.onload = () => {
    const headwordsString = reader.result;
    try {
      const allUploadedHeadwords = new HeadwordsListString(headwordsString).parse();
      processChunks(allUploadedHeadwords);
    } catch (error) {
      if (error instanceof BadInputError) {
        const alertMessage = 'There appears to be a problem with ' +
              'your headwords file: ';
        alert(alertMessage + error.message);
      } else {
        console.log("Another error occurred in headwords upload");
        throw error;
      }
      // Reset input so that event listener (which fires on change) will
      // fire again when file is chosen again
      $('#headwords-file-upload').replaceWith($('#headwords-file-upload').val('').clone(true));
    }
  };

  reader.onerror = function() {
    console.log(reader.error);
  };
}

// function activateSubmitListener() {
//   $('#file-form').submit(function(e) {
//     e.preventDefault();
//     hideNewHeadwordsForm();
//     hideRecoveryMessage();
//     showPageTitle();
//     showWaitMessage();
//     const form = $(this);
//     const url = form.attr('action');
//     const formData = new FormData();
//     const file = $('#file-upload')[0].files[0];
//     formData.append('file', file);
//     $.ajax({
//       type: 'POST',
//       url: url,
//       data: formData,
//       contentType: false,
//       processData: false
//     })
//       .done(function(data, _textStatus, _jqXHR) {
//         hideWaitMessage();
//         startNewEditingSession(JSON.parse(data));
//       });
//   });
// }

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
