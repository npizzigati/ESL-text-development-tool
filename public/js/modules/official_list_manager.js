function OfficialListManager(listData) {
  this.currentlyMatchedRow = null;
  this.listData = listData;

  this.emphasizeCurrentHeadwordMatch = function(markedHeadword) {
    this.deemphasizeCurrentHeadwordMatch(markedHeadword);
    this.currentlyMatchedRow = $(markedHeadword).parent();
    this.currentlyMatchedRow.addClass('official-list-current-match');
    markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
  };

  this.deemphasizeCurrentHeadwordMatch = function(markedHeadword) {
    if (this.currentlyMatchedRow) {
      this.currentlyMatchedRow.removeClass('official-list-current-match');
      this.currentlyMatchedRow = null;
    }
  };

  this.refresh = function() {
    console.log('refreshing official list');
    // Reset formatting
    $('.official-list-count').text('');
    $('.official-list-headwords').parent().removeClass('official-list-match');

    this.listData.timesMarked.forEach( (times, headword) => {
      $(`#official-${headword}`).parent().addClass('official-list-match');
      $(`#official-${headword}-count`).text(times.toString());
    });
  };

  this.focusHeadword = function(headword) {
    const markedHeadword = document.querySelector(`#official-${headword}`);
    const row = $(markedHeadword).parent();
    const times = this.listData.timesMarked.get(headword) || 0;
    // TODO: I might need this:
    // if (!row.hasClass('official-list-match')) {
    //   row.addClass('official-list-match');
    // }
    this.emphasizeCurrentHeadwordMatch(markedHeadword);
    $(`#official-${headword}-count`).text(times.toString());
  };

  this.unfocusHeadword = function(headword) {
    const markedHeadword = document.querySelector(`#official-${headword}`);
    const times = this.listData.timesMarked.get(headword)
    if (!times) {
      $(markedHeadword).parent().removeClass('official-list-match');
      $(`#official-${headword}-count`).text('');
    } else {
      $(`#official-${headword}-count`).text(times.toString());
    }
    this.deemphasizeCurrentHeadwordMatch(markedHeadword);
  };

  this.populateOfficialList = function() {
    let rowCount = 1;
    let current_row;
    let table_parts = [];
    table_parts.push('<table class="official-list-table">');
    headwords.forEach( headword => {
      table_parts.push('<tr>')
      table_parts.push(`<td class="official-list-rank">${rowCount.toString()}</td>`);
      table_parts.push(`<td id="official-${headword}" class="official-list-headwords">${headword}</td>`);
      table_parts.push(`<td id="official-${headword}-count" class="official-list-count"></td>`);
      table_parts.push('<td class="official-list-end-spacer"></td>');
      table_parts.push('</tr>')
      rowCount += 1;
    });
    table_parts.push('</table>')
    $('.official-list').append(table_parts.join(''));
  };
}

export { OfficialListManager };
