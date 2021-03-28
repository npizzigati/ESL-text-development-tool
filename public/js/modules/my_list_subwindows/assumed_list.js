function AssumedList(listData) {
  this.show = function() {
    const parts = [];
    parts.push('<table id="assumed-list-table">');
    parts.push('<tbody class="assumed-list-table-body">');

    listData.assumedWords.forEach(assumedWord => {
      parts.push('<tr>');
      parts.push(`<td>${assumedWord}</td>`);
      parts.push('</tr>');
    });

    parts.push('</tbody></table>');
    $('.my-list').append(parts.join(''));
  };

  this.add = function(headword) {
    // this.assumedWords.push(headword)
  }
}

export { AssumedList };
