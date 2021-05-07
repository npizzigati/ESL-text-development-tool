import { Autosave } from './autosave.js';

function AssumedList(listData, listManager) {
  this.setUp = function(recoveredFilename) {
    this.recoveredFilename = recoveredFilename;
    this.autosave = Autosave.setUpAutosave(listData, this.recoveredFilename);
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
        parts.push(`<td class="assumed-word-row"><span>${word}&nbsp;</span><button button='button'>DELETE</button></td>`);
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
    return $('.assumed-list').css('display') == 'none';
  };

  this.activateListeners = function() {
    $('.assumed-list').on('submit', '#new-assumed-word-form', event => {
      event.preventDefault();
      const word = $('#new-assumed-word-input').val().trim();
      listData.assumedWords.push(word);
      this.refresh();
      listData.calculate();
      listManager.autoList.refresh();
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
      this.refresh();
      this.autosave();
    });
  };
}

export { AssumedList };
