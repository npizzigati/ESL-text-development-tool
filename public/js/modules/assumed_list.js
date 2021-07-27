import { Autosave } from './autosave.js';

function AssumedList(listData, listManager) {
  const allLowercaseHeadwords = listData.headwords.map(headword => {
    return headword.toLowerCase();
  });

  this.fileChooser =
    '<label class="custom-assumed-file-upload">' +
    '<input id="assumed-file-upload" name="file" type="file">' +
    '<span>-> Click here to load assumed headwords from a file</span>' +
    '</label>';

  this.setUp = function(recoveredFilename) {
    this.recoveredFilename = recoveredFilename;
    this.autosave = Autosave.setUpAutosave(listData, this.recoveredFilename);
    $('.assumed-list').append(this.fileChooser);
    this.refresh();
    this.hide();
  };

  this.refresh = function() {
    $('#assumed-list-table').remove();
    const parts = [];
    parts.push('<table id="assumed-list-table">');
    parts.push('<tbody class="assumed-list-table-body">');
    const length = listData.assumedWords.length;
    let word;
    for (let i = 0; i < length + 1; i++) {
      parts.push('<tr>');
      parts.push(`<td>${(i + 1).toString()}&nbsp;</td>`);
      if (i < length) {
        word = listData.assumedWords[i];
        parts.push(`<td class="assumed-word-row"><span>${word}&nbsp;</span><button button='button'>REMOVE</button></td>`);
      } else {
        parts.push('<td>');
        parts.push('<form id="new-assumed-word-form">');
        parts.push('<input id="new-assumed-word-input" type="text" placeholder="new headword">');
        parts.push('&nbsp;<input id="new-assumed-word-button" type="submit" value="&check;">');
        parts.push('</form>');
        parts.push('</td>');
      }
      parts.push('</tr>');
    }
    parts.push('</tbody></table>');
    $('.assumed-list').append(parts.join(''));
  };

  this.show = function() {
    $('#assumed-list-title').addClass('active-list-title');
    $('.assumed-list').css('display', 'block');
  };

  this.hide = function() {
    $('#assumed-list-title').removeClass('active-list-title');
    $('.assumed-list').css('display', 'none');
  };

  this.isHidden = function() {
    return $('.assumed-list').css('display') === 'none';
  };

  this.updateListFromFile = function (fileString) {
    const wordsInFile = this.parse(fileString);
    const nonHeadwords = [];
    const duplicates = [];

    wordsInFile.forEach(word => {
      const candidate = word.toLowerCase();
      if (isDuplicate(candidate)) {
        duplicates.push(word);
        return;
      }

      if (isNotHeadword(candidate)) {
        nonHeadwords.push(word);
        return;
      }

      listData.assumedWords.push(word);
    });

    this.showUpdateFromFileMessages(duplicates, nonHeadwords);
  };

  function isNotHeadword(candidate) {
    return !allLowercaseHeadwords.includes(candidate);
  }

  function isDuplicate(candidate) {
    return listData.assumedWords.map(w => w.toLowerCase()).includes(candidate);
  }

  this.showUpdateFromFileMessages = function (duplicates, nonHeadwords) {
    if (noErrors()) return;

    let duplicateMessage = '';
    let nonHeadwordMessage = '';
    if (!isEmpty(duplicates)) {
      duplicateMessage =    `Words not added because they are duplicates: "${duplicates.join('", "')}"\n`;
    }
    if (!isEmpty(nonHeadwords)) {
      nonHeadwordMessage =  `Words not added because they are not headwords: "${nonHeadwords.join('", "')}" \n`;
    }
    const alertMessage = `The following errors ocurred:\n ` + duplicateMessage + nonHeadwordMessage;
    window.alert(alertMessage);

    function noErrors() {
      return isEmpty(duplicates) && isEmpty(nonHeadwords);
    }

    function isEmpty(array) {
      return array.length === 0;
    }
  };

  this.parse = function (fileString) {
    const list = splitOnLineTerminator(fileString);
    return list.map(word => removeNonLetterCharacters(word))
               .filter(word => isNotEmptyString(word));

    function splitOnLineTerminator(fileString) {
      return fileString.split(/\n|\r\n/g);
    }

    function removeNonLetterCharacters(string) {
      return string.replace(/[^A-Za-z]/g, '');
    }

    function isNotEmptyString(string) {
      return string !== '';
    }
  };

  this.readFile = function (input) {
    let file = input.files[0];
    let reader = new FileReader();

    if (file) reader.readAsText(file);

    reader.onload = () => {
      const fileString = reader.result;
      try {
        this.updateListFromFile(fileString);
        this.refresh();
        listData.calculate();
        listManager.autoList.refresh();
        listManager.myList.refresh();
        this.autosave();
      } catch (error) {
        if (error instanceof BadInputError) {
          const alertMessage = 'There appears to be a problem with ' +
                'your "My List" file: ';
          alert(alertMessage + error.message);
        } else {
          throw error;
        }
      }
    };

    reader.onerror = function() {
      console.log(reader.error);
    };
  };

  this.addSingleWordToList = function (word) {
    const candidate = word.toLowerCase();
    if (isNotHeadword(candidate)) {
      window.alert(`The word "${word}" cannot be added to the ` +
                   `assumed list because it is not in the ` +
                   `headwords list (official list)`);
      return;
    }

    if (isDuplicate(candidate)) {
      window.alert(`The word "${word}" is already in the ` +
                   `assumed list.`);
      return;
    }

    listData.assumedWords.push(word);
  };

  this.activateListeners = function () {
    $('.assumed-list').on('submit', '#new-assumed-word-form', event => {
      event.preventDefault();
      const word = $('#new-assumed-word-input').val().trim();
      this.addSingleWordToList(word);
      this.refresh();
      listData.calculate();
      listManager.autoList.refresh();
      listManager.myList.refresh();
      this.autosave();
    });

    $('.assumed-list').on('mouseenter', '.assumed-word-row span, button', event => {
      const target = $(event.target);
      if (target.is('button')) {
        target.css('display', 'inline');
      } else if (target.is('span')) {
        const button = target.parent().find('button');
        button.css('display', 'inline');
      }
    });

    $('.assumed-list').on('mouseleave', '.assumed-word-row span, button', event => {
      const target = $(event.target);
      if (target.is('button')) {
        target.css('display', 'none');
      } else if (target.is('span')) {
        const button = target.parent().find('button');
        button.css('display', 'none');
      }
    });

    $('.assumed-list').on('click', '.assumed-word-row button', event => {
      const target = $(event.target);
      const word = target.parent().find('span').text().trim();
      const indexToBeRemoved = listData.assumedWords.indexOf(word);
      listData.assumedWords.splice(indexToBeRemoved, 1);
      listData.calculate();
      listManager.autoList.refresh();
      listManager.myList.refresh();
      this.refresh();
      this.autosave();
    });

    $('.special-lists').on('change', '#assumed-file-upload', event => {
      this.readFile(event.target);
      // Reset the target value so that the change event is
      // triggered even if the same file is loaded twice
      event.target.value = '';
    });

  };
}

export { AssumedList };
