'use strict';

const trixElement = document.querySelector("trix-editor")
const trixEditor = trixElement.editor;
const wordSeparators = [' ', '.', '!', '?', '-', ':', ';', 'Enter'];
const searchIconContainer = $('.search-icon-container');
const searchBox = $('#search-box');
const searchBoxContainer = $('.search-box-container');
const officialList = $('.official-list');

// Todo: Don't process spaces or empty string as word in insertion functions

const fullTextHistory = {
  latest: '',
  previous: '',
  removeEndingNewLine: function(str) {
    return str.replace(/\n$/g, '');
  },
  update: function() {
    this.previous = this.latest;
    this.latest = this.removeEndingNewLine(trixEditor.getDocument().toString());
  }
}

// Add new HTML tag for words in list
class NeilsListMatch extends HTMLElement {}
customElements.define('neils-list-match', NeilsListMatch);

// Add new HTML tag for punctuation
class NeilsPunctuation extends HTMLElement {}
customElements.define('neils-punctuation', NeilsPunctuation);


// Add Trix format for marking list words
Trix.config.textAttributes.neilsListMatch = {
  tagName: 'neils-list-match',
  inheritable: true
};

// Add Trix format for formatting punctuation
Trix.config.textAttributes.neilsPunctuation = {
  tagName: 'neils-punctuation',
  inheritable: false
};

// Add Trix format for highlighting search matches
Trix.config.textAttributes.searchHighlight = {
  tagName: 'mark',
  inheritable: true
};

function last(arr) {
  return arr[arr.length - 1]
}

function isEmpty(arr) {
  return arr.length == 0;
}

function isPunctuation(text) {
  return text.search(/[.,;:~!@#$%&*()_+=|/?<>"'{}[\-\^\]\\]/) >= 0;
}

searchBoxContainer.hide();

function isEscape(key) {
  return key === "Escape" || key === "Esc";
}

function isWordCharacter(character) {
  if (!character) {
    return false
  }
  return character.search(/[a-zA-Z']/) != -1;
}

function retrieveWord(fullText, wordEndPoints) {
  let wordStart, wordEnd;
  [wordStart, wordEnd] = wordEndPoints;
  return fullText.slice(wordStart, wordEnd + 1);
}

function retrieveWordCoordinates(fullText, caretPosition) {
  const wordStart = determineWordStart(fullText, caretPosition);
  const wordEnd = determineWordEnd(fullText, caretPosition);
  return [wordStart, wordEnd];
}

function determineWordStart(fullText, caretPosition) {
  console.log(`inside determineWordStart, letter at caret position: "${fullText[caretPosition]}"`);
  const startLetter = fullText[caretPosition];
  if ([' ', '\n'].includes(startLetter) || (typeof startLetter === 'undefined')) {
    return null;
  }
  let index = caretPosition;
  while (isWordCharacter(fullText[index]) && index > 0) {
    index -= 1;
  }
  const wordStart = (index == 0) ? index : index + 1;
  return wordStart;
}

function determineWordEnd(fullText, caretPosition) {
  const startLetter = fullText[caretPosition];
  if ([' ', '\n'].includes(startLetter) || (typeof startLetter === 'undefined')) {
    return null;
  }
  let index = caretPosition;
  let fullTextLength = fullText.length;
  while (index < fullTextLength &&
         isWordCharacter(fullText[index])) {
    index += 1;
  }
  const wordEnd = index - 1;
  return wordEnd;
}

const operations = {
  // TODO: Refresh counts on carraige return;
  processOperation: function() {
    window.clearTimeout(this.operationTimeoutID);
    [this.text, this.operation, this.indices] = this.getDelta();
    const length = this.text.length;
    if (this.operation === 'insertion' && length === 1) {
      this.processPossiblePunctuationCharacter(this.text, this.indices.startIndex);
      this.processOneCharacterInsertion();
    } else if (this.operation === 'insertion' && length > 1) {
      this.processMultipleCharacterInsertion();
    } else {
      this.processDeletion();
    }

    if (length > 1) {
      officialListManager.refreshAllCounts();
    }
  },

  processPossiblePunctuationCharacter(character, index) {
    if (isPunctuation(character)) {
      this.formatPunctuation(index, index + 1);
    }
  },

  formatPunctuation(startIndex, endIndex) {
    const initialCaretPosition = trixEditor.getSelectedRange();

    trixEditor.setSelectedRange([startIndex, endIndex]);
    trixEditor.activateAttribute('neilsPunctuation');

    trixEditor.setSelectedRange(initialCaretPosition);
  },

  // Reset caret formatting and position
  resetCaret: function(caretPositionBeforeMarking) {
    trixEditor.setSelectedRange(caretPositionBeforeMarking);
    if (trixEditor.attributeIsActive('neilsListMatch')) {
      trixEditor.deactivateAttribute('neilsListMatch');
    }
  },

  processMultipleCharacterInsertion: function() {
    const fullText = fullTextHistory.latest;
    let wordStart, wordEnd, word;
    let index = this.indices.startIndex


    while (index < this.indices.endIndex) {
      if (isWordCharacter(fullText[index])) {
        [wordStart, wordEnd] = retrieveWordCoordinates(fullText, index);
        word = retrieveWord(fullText, [wordStart, wordEnd]); 

        if (listMarker.isInList(word)) {
          // listMarker.markListWord(word, wordStart, wordEnd + 1);
          listMarker.markListWord(word, wordStart, wordEnd);
        } else {
          // listMarker.unmarkListWord(word, wordStart, wordEnd + 1);
          listMarker.unmarkListWord(word, wordStart, wordEnd);
        }
        index = wordEnd
      } else {
        this.processPossiblePunctuationCharacter(fullText[index], index);
      }
      index += 1
    }
    this.resetCaret(this.indices.endIndex);
  },

  // TODO: Deal with case of headword being counted twice when
  // stopping slightly before finishing inflected form
  processOneCharacterInsertion: function() {
    const fullText = fullTextHistory.latest;
    const characterBeforeInsertion = (this.startIndex === 0) ? null : fullText[this.indices.startIndex - 1];
    const characterAfterInsertion = fullText[this.indices.endIndex];
    let wordStart, wordEnd;

    if (!isWordCharacter(this.text) && !isWordCharacter(characterBeforeInsertion)) {
      return;
    }

    let caretPositionBeforeMarking = trixEditor.getSelectedRange();

    if (this.indices.startIndex !== 0 && !isWordCharacter(this.text)) {
      [wordStart, wordEnd] = retrieveWordCoordinates(fullText, this.indices.startIndex - 1);
      if (wordStart == null || wordEnd == null) {
        return;
      }
      const word = retrieveWord(fullText, [wordStart, wordEnd]); 
      // const caretPositionBeforeMarking = trixEditor.getSelectedRange();
      if (listMarker.isInList(word)) {
        listMarker.markListWord(word, wordStart, wordEnd);
      } else {
        listMarker.unmarkListWord(word, wordStart, wordEnd);
      }
      this.resetCaret(caretPositionBeforeMarking);
    }

    if (isWordCharacter(this.text) && !isWordCharacter(characterAfterInsertion)) {
      this.operationTimeoutID = window.setTimeout( () => {
        let wordStart, wordEnd;
        const fullText = fullTextHistory.latest;
        [wordStart, wordEnd] = retrieveWordCoordinates(fullText, this.indices.startIndex);
        const word = retrieveWord(fullText, [wordStart, wordEnd]); 
        // Need to redefine caret position here because of timeout
        // (another operation may happen before timeout ends,
        // changing caret position)
        caretPositionBeforeMarking = trixEditor.getSelectedRange();
        if (listMarker.isInList(word)) {
          listMarker.markListWord(word, wordStart, wordEnd);
        } else {
          listMarker.unmarkListWord(word, wordStart, wordEnd);
        }
        this.resetCaret(caretPositionBeforeMarking);
      }, 500);
    } else if (isWordCharacter(characterAfterInsertion)) {
      // For when a space is inserted in middle of word, of when
      // letter interted at beginning of word, check word after
      // insertion too
      [wordStart, wordEnd] = retrieveWordCoordinates(fullText, this.indices.endIndex);
      const word = retrieveWord(fullText, [wordStart, wordEnd]); 
      if (listMarker.isInList(word)) {
        listMarker.markListWord(word, wordStart, wordEnd);
      } else {
        listMarker.unmarkListWord(word, wordStart, wordEnd);
      }
      this.resetCaret(caretPositionBeforeMarking);
    }
  },

  // TODO: unmark joined words from official list when space removed from in between
  // FIXME: when deleting letters from first word, it doesn't automatically unmark
  processDeletion: function() {
    const fullText = fullTextHistory.latest;
    console.log(`fullText: "${fullText}"`);
    const characterBeforeDeletion = fullText[this.indices.startIndex - 1];
    let caretPosition;

    console.log(`Deleted text: "${this.text}"`);
    console.log(`char before deletion: "${characterBeforeDeletion}"`);

    if (!isWordCharacter(this.text) && !isWordCharacter(characterBeforeDeletion)) {
      return;
    }

    // Handle deletion of single character word
    if (isWordCharacter(this.text) && !isWordCharacter(characterBeforeDeletion)) {
      listMarker.unmarkListWord(this.text, this.indices.startIndex, this.indices.startIndex, this.text);
      console.log(`Deleting: ${this.text} at position: ${this.indices.startIndex}`);
      return;
    }

    if (this.indices.startIndex !== 0 && isWordCharacter(characterBeforeDeletion)) {
    // if (this.indices.startIndex !== 0) {
      caretPosition = this.indices.startIndex - 1;
    } else {
      caretPosition = this.indices.startIndex;
    }

    console.log(`caret position: ${caretPosition}`);

    let wordStart, wordEnd, word;
    [wordStart, wordEnd] = retrieveWordCoordinates(fullText, caretPosition);
    console.log(`word start, word end: ${wordStart}, ${wordEnd}`);

    if (wordStart) {
      word = retrieveWord(fullText, [wordStart, wordEnd]); 
      if (listMarker.isInList(word)) {
        listMarker.markListWord(word, wordStart, wordEnd);
      } else {
        listMarker.unmarkListWord(word, wordStart, wordEnd, this.text);
      }
      this.resetCaret(this.indices.startIndex);
    } else {
      word = null;
    }
    console.log(`word retrieved: ${word}`);
  },

  getDelta: function() {
    const latest = fullTextHistory.latest;
    const previous = fullTextHistory.previous;
    if (latest === previous) {
      return;
    }
    const latestLength = latest.length;
    const previousLength = previous.length;
    const deltaLength = Math.abs(latestLength - previousLength); 
    let startIndex, endIndex, text, indices;

    if (latestLength > previousLength) {
      endIndex = trixEditor.getSelectedRange()[0] 
      startIndex = endIndex - deltaLength;
      text = fullTextHistory.latest.slice(startIndex, endIndex);
      indices = {
        startIndex: startIndex,
        endIndex: endIndex
      }
      return [text, 'insertion', indices];
    } else {
      startIndex = trixEditor.getSelectedRange()[0] 
      endIndex = startIndex + deltaLength;
      text = fullTextHistory.previous.slice(startIndex, endIndex);
      indices = {
        startIndex: startIndex,
        endIndex: endIndex
      }
      return [text, 'deletion', indices];
    }
  }
  
};

function isSelection(caretPositionArray) {
  caretPositionArray[0] !== caretPositionArray[1];
}

$(trixElement).on('trix-change', event => {
  fullTextHistory.update();

  // It apparenty takes a moment for the fullTextHistory to update
  setTimeout( () => {
    // Do nothing if update triggered by formatting change
    if (fullTextHistory.latest == fullTextHistory.previous) {
      return;
    }
    operations.processOperation();
  }, 20);

});

const mainSearch = {
  highlightedRanges: [],
  previousHighlightStart: null,
  setPreviousHighlightStart: function() {
    if (isEmpty(this.highlightedRanges)) {
      return;
    }
    this.previousHighlightStart = last(this.highlightedRanges)[0];
  },
  searcher: null,
  clearHighlighting: function() {
    if (this.highlightedRanges.length === 0) {
      return;
    }
    this.highlightedRanges.forEach(range => {
      trixEditor.setSelectedRange(range);
      trixEditor.deactivateAttribute('searchHighlight');
    });
    this.highlightedRanges = [];
  }
};

const exitSearch = function() {
  if (searchBoxContainer.is(":hidden")) {
    return;
  }
  hideSearchContainer();
  // The caret position of the click is not immediately
  // registered by trix, so we have to wait a fraction of a second
  setTimeout(function() {
    let originalCaretPos = trixEditor.getSelectedRange();
    mainSearch.clearHighlighting();
    trixEditor.setSelectedRange(originalCaretPos);
  }, 100);
}

$(trixElement).on('mouseup', () => {
  exitSearch();
});

searchIconContainer.on('click', () => {
  showSearchContainer();
});

searchBox.on('keyup', event => {
  // Exit search if escape pressed
  if (isEscape(event.key) && searchBoxContainer.is(':visible')) {
    exitSearch();
    return;
  }

  mainSearch.setPreviousHighlightStart();
  mainSearch.clearHighlighting();
  // Remove any event listeners from arrow buttons
  $('.search-arrow').off();

  mainSearch.searcher = new Searcher(searchBox.val());
  mainSearch.searcher.execute();
});

function hideSearchContainer() {
  searchBoxContainer.css('display', 'none');
  searchIconContainer.css('display', 'block');
}

function showSearchContainer() {
  searchIconContainer.css('display', 'none');
  searchBoxContainer.css('display', 'flex');
  searchBox.val('');
  searchBox.focus();
}

function Searcher(searchString) {
  this.fullText = trixEditor.getDocument().toString();
  this.searchString = searchString;
  this.matches = [];
  this.matchNumber = 0;

  this.nextMatchUp = function() {
    this.matchNumber = (this.matchNumber + (this.matches.length - 1)) % this.matches.length;
    mainSearch.setPreviousHighlightStart();
    mainSearch.clearHighlighting(this.fullText);
    searchBox.focus();
    this.highlightMatch(this.matches[this.matchNumber], this.searchString.length);
    // if (last(mainSearch.highlightedRanges)[1]).includes
    this.scrollToMatch(this.matches[this.matchNumber]);
    searchBox.focus();
  }

  this.nextMatchDown = function() {
    this.matchNumber = (this.matchNumber + 1) % this.matches.length;
    mainSearch.setPreviousHighlightStart();
    mainSearch.clearHighlighting(this.fullText);
    this.highlightMatch(this.matches[this.matchNumber], this.searchString.length);
    this.scrollToMatch(this.matches[this.matchNumber]);
    searchBox.focus();
  }

  this.highlightMatch = function(startIndex, length) {
    let endIndex = startIndex + length;
    trixEditor.setSelectedRange([startIndex, endIndex]);
    trixEditor.activateAttribute('searchHighlight');
    trixEditor.setSelectedRange([startIndex, startIndex]);
    mainSearch.highlightedRanges.push([startIndex, endIndex]);
  }
  
  this.execute = function() {
    mainSearch.clearHighlighting;
    searchBox.focus();
    if ($('.search-arrow').hasClass('activated-search-arrow')) {
      $('.search-arrow').removeClass('activated-search-arrow');
    }
    this.matches = this.findMatches(this.fullText, this.searchString); 

    if (this.matches.length == 0) {
      return;
    }

    this.highlightMatch(this.matches[0], this.searchString.length);
    this.scrollToMatch(this.matches[0]);
    searchBox.focus();

    if (this.matches.length > 1) {
      if (!$('.search-arrow').hasClass('activated-search-arrow')) {
        $('.search-arrow').addClass('activated-search-arrow');
      }
      $('#search-down').on('click', this.nextMatchDown.bind(this));
      $('#search-up').on('click', this.nextMatchUp.bind(this));
    }
  }

  this.findMatches = function(text, searchString, startIndex = 0) {
    let fragment = text.slice(startIndex);
    let fragmentMatchIndex = fragment.indexOf(searchString);
    if (fragmentMatchIndex == -1 || searchString == '') {
      return [];
    }
    let fullTextMatchIndex = fragmentMatchIndex + startIndex;
    startIndex = fullTextMatchIndex + 1
    return [fullTextMatchIndex].concat(this.findMatches(text,
                                          searchString,
                                          startIndex));
  }

  this.scrollToMatch = function(startIndex) {
    // No need to scroll if building on previous match
    if (startIndex === mainSearch.previousHighlightStart) {
      return;
    }
    let highlightedElement = document.querySelector('mark');
    highlightedElement.scrollIntoView({behavior: 'auto',
                                      block: 'center'});
  }
} 

const listMarker = {
  neverOnList: ['i'],
  isInList: function(word) {
    if (this.neverOnList.includes(word)) {
      return false;
    }
    word = word.toLowerCase();
    return Object.keys(inflectionsMap).includes(word);
  },

  // selection ends just before the start of last index
  markListWord: function(word, startIndex, endIndex) {
    if (this.isMarked(startIndex, endIndex + 1)) {
      return;
    }
    const headword = inflectionsMap[word.toLowerCase()];
    console.log(`headword: "${headword}"`);
    officialListManager.markWordIfAppropriate(headword);
    trixEditor.setSelectedRange([startIndex, endIndex + 1]);
    trixEditor.activateAttribute('neilsListMatch');

    // trixEditor.setSelectedRange(endIndex + 1);
  },

  isMarked: function(startIndex, endIndex) {
    trixEditor.setSelectedRange([startIndex, endIndex]);
    return trixEditor.attributeIsActive('neilsListMatch');
  },

  unmarkListWord: function(word, startIndex, endIndex, deletedPart = null) {
    console.log(`word, deletedPart: ${word}, ${deletedPart}`);

    // Handle single character deletion
    if (word === deletedPart) {
      console.log('word === deletedPart');
      const headword = inflectionsMap['word'];
      console.log(`headword: "${headword}"`);
      officialListManager.unmarkWordIfAppropriate(headword);
      trixEditor.deactivateAttribute('neilsListMatch');
      return;
    }

    // Do nothing if word is already unmarked
    if (!this.isMarked(startIndex, endIndex + 1)) {
      return;
    }

    
    const wordToUnmarkOnOfficialList = (deletedPart) ? word + deletedPart : word;
    officialListManager.unmarkWordIfAppropriate(wordToUnmarkOnOfficialList);
    trixEditor.setSelectedRange([startIndex, endIndex + 1]);
    trixEditor.deactivateAttribute('neilsListMatch');
    // trixEditor.setSelectedRange(endIndex + 2);
  }
}

const officialListManager = {
  alwaysUppercaseWords: ['i'],
  timesMarked: new Map(),
  refreshAllCounts: function() {
    let fullText = fullTextHistory.latest.toLowerCase();
    // Remove ending punctuation
    fullText = fullText.replace(/[^a-zA-Z]+$/, '');
    const fullTextArray = fullText.trim().split(/[^a-zA-Z]+/);

    $('.official-list-count').text('');
    $('.official-list.match').removeClass('official-list-match');
    this.timesMarked.clear();

    fullTextArray.forEach(word => {
      if (this.alwaysUppercaseWords.includes(word)) {
        word = word.toUpperCase();
      } 
      let times = this.timesMarked.get(word);
      if (times) {
        times += 1;
        this.timesMarked.set(word, times);
      } else {
        times = 1;
        this.timesMarked.set(word, times);
        $(`#official-${word}`).addClass('official-list-match');
      }
      $(`#official-${word}-count`).text(times.toString());
    });
  },
  markWordIfAppropriate: function(word) {
    if (!this.alwaysUppercaseWords.includes(word.toLowerCase())) {
      word = word.toLowerCase();
    }
    let times = this.timesMarked.get(word);
    if (times) {
      times = this.timesMarked.get(word) + 1;
      this.timesMarked.set(word, times);
    } else {
      times = 1;
      this.timesMarked.set(word, times);
      $(`#official-${word}`).addClass('official-list-match');
    }

    $(`#official-${word}-count`).text(times.toString());
  },
  unmarkWordIfAppropriate: function(word) {
    if (!this.alwaysUppercaseWords.includes(word.toLowerCase())) {
      word = word.toLowerCase();
    }
    let times = this.timesMarked.get(word)
    if (!times) {
      return;
    }
    if (times === 1) {
      times = 0;
      this.timesMarked.delete(word);
      $(`#official-${word}`).removeClass('official-list-match');
      this.timesMarked.set(word, times);
    } else {
      times -= 1
      this.timesMarked.set(word, times);
    }
    $(`#official-${word}-count`).text(times.toString());
  },
  populateOfficialList: function() {
    let rowCount = 1;
    officialList.append(`<table>`);
    headwords.forEach( headword => {
      officialList.append('<tr>');
      officialList.append(`<td class="official-list-rank">${rowCount.toString()}</td>`);
      if (this.alwaysUppercaseWords.includes(headword)) {
        officialList.append(`<td id="official-${headword}">${headword.toUpperCase()}</td>`);
      } else {
        officialList.append(`<td id="official-${headword}">${headword}</td>`);
      }
      officialList.append(`<td class="official-list-count" id="official-${headword}-count"></td>`);
      officialList.append('</tr>');
      rowCount += 1;
    });
    officialList.append(`</table>`);
  }
}

// Populate official word list with headwords
officialListManager.populateOfficialList();
