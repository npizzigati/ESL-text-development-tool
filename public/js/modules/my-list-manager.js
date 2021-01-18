const myListManager = {
  maxWordsInSublist: 10,
  sublists: { 10: [] },
  currentList: 10,

  refreshView: function() {
    const table_parts = [];
    $('#my-list-table').remove();
    table_parts.push('<table id="my-list-table">');
    Object.entries(this.sublists).forEach(([number, words]) => {
      const sublist = words.join(', ');
      table_parts.push('<tr>');
      table_parts.push(`<td class="my-sublist-number" id="sublist-number-${number}">${number}</td>`);
      table_parts.push(`<td class="my-sublist-words" id="sublist-words-${number}">${sublist}</td>`);
      table_parts.push('</tr>');
    });
    table_parts.push('</table>');
    $('.my-list').append(table_parts.join(''));
  },

  redetermine: function(fullTextHistory, officialListManager) {
    // TODO: Iteration of array of all words also happens when
    // multiple-word insertion occurs. No need to do it twice
    console.log('redetermining my list');
    let fullText = fullTextHistory.latest
    fullText = fullText.replace(/[^a-zA-Z']+$/, '');
    const fullTextArray = fullText.trim().split(/[^a-zA-Z']+/);
    // Need to record only the first appearance of each headword
    // in an array
    const array_for_my_list = [];
    console.log(`array: ${fullTextArray}`)
    fullTextArray.forEach(word => {
      word = (word === 'I') ? word : word.toLowerCase();
      const headword = officialListManager.getHeadword(word);
      if (headword && !array_for_my_list.includes(headword)) {
        array_for_my_list.push(headword)
      };
    });
    this.sublists[this.currentList] = array_for_my_list
  },
}

export { myListManager };
