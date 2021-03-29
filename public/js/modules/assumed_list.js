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
        parts.push(`<td><input id="new-assumed-word" type="text" placeholder="new word">`);
        parts.push(`&nbsp;<button id="new-assumed-word-button">&check;</button></td>`);
      }
      parts.push('</tr>');
    }
    parts.push('</tbody></table>');
    $('.assumed-list').append(parts.join(''));
  };

  

  this.add = function(headword) {
    // this.assumedWords.push(headword)
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
    
  };
}

export { AssumedList };
