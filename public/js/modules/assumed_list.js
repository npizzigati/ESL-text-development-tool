function AssumedList(listData, listManager) {
  this.setUp = function() {
    this.refresh();
    this.hide();
  };

  this.refresh = function() {
    $('#assumed-list-table').remove();
    const parts = [];
    parts.push('<table id="assumed-list-table">');
    parts.push('<tbody class="assumed-list-table-body">');
    length = listData.assumedWords.length;
    for(let i = 0; i < length + 1; i++) {
      parts.push('<tr>');
      parts.push(`<td>${(i + 1).toString()}&nbsp;</td>`);
      if (i < length) {
        parts.push(`<td>${listData.assumedWords[i]}</td>`);
      } else {
        parts.push('<td>');
        parts.push('<form id="new-assumed-word-form">');
        parts.push('<input id="new-assumed-word-input" type="text" placeholder="new word">');
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
      const word = $('#new-assumed-word-input').val();
      listData.assumedWords.push(word);
      this.refresh();
      listData.calculate();
      listManager.autoList.refresh();
      // FIXME: the above is not refreshing the autoList
    });
  };
}

export { AssumedList };
