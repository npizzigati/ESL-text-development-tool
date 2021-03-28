function AssumedList(listData) {
  this.show = function() {
    const parts = [];
    parts.push(listData.assumedWords.join(', '))
    $('.my-list').append(parts.join(''));
  };

  this.add = function(headword) {
    // this.assumedWords.push(headword)
  }
}

export { AssumedList };
