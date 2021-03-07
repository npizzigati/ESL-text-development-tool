const RecoveryList = function(entries) {
  this.entries = entries;
  this.maxEntries = 20;
  const keys = Object.keys(this.entries);
  this.sortedKeys = sortKeys([...keys]);

  /**
  * Sorts autosave entries in place, newest to oldest (numerical order of keys)
  * And returns the this.maxEntries most recent entries
  * @param {array} sortedKeys - Numerically sorted keys
  * @param {object} entries - Autosave entries
  * @returns {array} HTML list items
  */
  this.retrieveHtmlListItems = function() {
    return buildListItems(this.sortedKeys, this.entries, this.maxEntries);
  }
  /**
  * Deletes old items (beyond this.maxEntries) from localStorage
  * Since keys are sorted oldest first, the entries at the 
  * start of the array are the ones to be deleted
  */
  this.deleteOldListItems = function() {
    const length = this.sortedKeys.length;
    let quantityToDelete;
    if (length > 20) {
      quantityToDelete = length - 20 
      this.sortedKeys.slice(0, quantityToDelete).forEach( key => {
        localStorage.removeItem(key);
      });
    }
  };

  /**
  * Returns sorted keys, newest to oldest (numerical order of keys)
  * @param {array} keys
  */
  function sortKeys(keys) {
    keys.sort((a, b) => {
      const int_a = parseInt(a, 10);
      const int_b = parseInt(b, 10);
      if (int_a > int_b) {
        return -1
      } 
      if (int_a < int_b) {
        return 1
      } 

      return 0
    });
    return keys;
  }

  function buildListItems(sortedKeys, entries, maxEntries) {
    // Build list items to be displayed
    const htmlEntries = [];
    let filename, date, time, timestamp;
    let count = 0;
    for (let key of sortedKeys) {
      filename = entries[key].filename;
      date = entries[key].date;
      time = entries[key].time;
      htmlEntries.push(`<li class="autosave-file clickable" id="${filename}">${date} - ${time}</li>`);
      count += 1;
      if (count == maxEntries) break;
    };

    return htmlEntries;
  }
}

export { RecoveryList };
