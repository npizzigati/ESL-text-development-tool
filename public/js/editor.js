'use strict';

const trixElement = document.querySelector("trix-editor")
const trixEditor = trixElement.editor;
const wordSeparators = [' ', '.', '!', '?', '-', ':', ';', 'Enter'];
const mainSearchButton = $('#main-search-button');
const searchBox = $('#search-box');
const searchContainer = $('.search-container');

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


// Add Trix format for marking list words
Trix.config.textAttributes.neilsListMatch = {
  tagName: 'neils-list-match',
  inheritable: true
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

searchContainer.hide();

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
  console.log(`wordStart and wordEnd from inside retrieveWord: ${wordStart}, ${wordEnd}`);
  return fullText.slice(wordStart, wordEnd + 1);
}

function retrieveWordCoordinates(fullText, caretPosition) {
  const wordStart = determineWordStart(fullText, caretPosition);
  const wordEnd = determineWordEnd(fullText, caretPosition);
  return [wordStart, wordEnd];
}

function determineWordStart(fullText, caretPosition) {
  if (fullText[caretPosition] === ' ') {
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
  if (fullText[caretPosition] === ' ') {
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
  processOperation: function() {
    window.clearTimeout(this.operationTimeoutID);
    [this.text, this.operation, this.indices] = this.getDelta();
    console.log(this.text, this.operation, this.indices);
    const length = this.text.length;
    if (this.operation === 'insertion' && length === 1) {
      this.processOneCharacterInsertion();
    } else if (this.operation === 'insertion' && length > 1) {
      this.processMultipleCharacterInsertion();
    } else {
      this.processDeletion();
    }
    // }
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
          listMarker.markListWord(wordStart, wordEnd + 1);
        } else {
          listMarker.unmarkListWord(wordStart, wordEnd + 1);
        }
        index = wordEnd
      }
      index += 1
    }
    trixEditor.setSelectedRange(this.indices.endIndex);
  },

  processOneCharacterInsertion: function() {
    const fullText = fullTextHistory.latest;
    const characterBeforeInsertion = (this.startIndex === 0) ? null : fullText[this.indices.startIndex - 1];
    const characterAfterInsertion = fullText[this.indices.endIndex];
    let wordStart, wordEnd;
    
    if (!isWordCharacter(this.text) && !isWordCharacter(characterBeforeInsertion)) {
      return;
    }

    if (this.indices.startIndex !== 0 && !isWordCharacter(this.text)) {
      [wordStart, wordEnd] = retrieveWordCoordinates(fullText, this.indices.startIndex - 1);
      const word = retrieveWord(fullText, [wordStart, wordEnd]); 
      console.log(`word: "${word}"`);
      if (listMarker.isInList(word)) {
        listMarker.markListWord(wordStart, wordEnd + 1);
      } else {
        listMarker.unmarkListWord(wordStart, wordEnd + 1);
      }
    }

    if (isWordCharacter(this.text) && !isWordCharacter(characterAfterInsertion)) {
      this.operationTimeoutID = window.setTimeout( () => {
        let wordStart, wordEnd;
        const fullText = fullTextHistory.latest;
        [wordStart, wordEnd] = retrieveWordCoordinates(fullText, this.indices.startIndex);
        const word = retrieveWord(fullText, [wordStart, wordEnd]); 
        console.log(`word: "${word}"`);
        const caretPositionBeforeMarking = trixEditor.getSelectedRange();
        if (listMarker.isInList(word)) {
          listMarker.markListWord(wordStart, wordEnd + 1);
        } else {
          listMarker.unmarkListWord(wordStart, wordEnd + 1);
        }
        trixEditor.setSelectedRange(caretPositionBeforeMarking);
      }, 500);
    } else {
      // For when a space is inserted in middle of word, of when
      // letter interted at beginning of word, check word after
      // insertion too
      [wordStart, wordEnd] = retrieveWordCoordinates(fullText, this.indices.endIndex);
      const word = retrieveWord(fullText, [wordStart, wordEnd]); 
      console.log(`word: "${word}"`);
      const caretPositionBeforeMarking = trixEditor.getSelectedRange();
      if (listMarker.isInList(word)) {
        listMarker.markListWord(wordStart, wordEnd + 1);
      } else {
        listMarker.unmarkListWord(wordStart, wordEnd + 1);
      }

      trixEditor.setSelectedRange(caretPositionBeforeMarking);
    }

  },

  processDeletion: function() {
    const fullText = fullTextHistory.latest;
    const characterBeforeDeletion = fullText[this.indices.startIndex - 1];
    let caretPosition;

    if (!isWordCharacter(this.text) && !isWordCharacter(characterBeforeDeletion)) {
      return;
    }

    if (this.indices.startIndex !== 0 && isWordCharacter(fullText[this.indices.startIndex - 1])) {
      caretPosition = this.indices.startIndex - 1;
    } else {
      caretPosition = this.indices.startIndex;
    }

    let wordStart, wordEnd;
    [wordStart, wordEnd] = retrieveWordCoordinates(fullText, caretPosition);
    const word = retrieveWord(fullText, [wordStart, wordEnd]); 
    console.log(`word: ${word}`);

    if (listMarker.isInList(word)) {
      console.log('word in list');
      listMarker.markListWord(wordStart, wordEnd + 1);
    } else {
      listMarker.unmarkListWord(wordStart, wordEnd + 1);
    }
      trixEditor.setSelectedRange(this.indices.startIndex);
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
    console.log(`highlightedRanges: ${this.highlightedRanges}`);
    this.highlightedRanges.forEach(range => {
      trixEditor.setSelectedRange(range);
      trixEditor.deactivateAttribute('searchHighlight');
    });
    this.highlightedRanges = [];
  }
};

const exitSearch = function() {
  if (searchContainer.is(":hidden")) {
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

mainSearchButton.on('click', () => {
  showSearchContainer();
});

searchBox.on('keyup', event => {
  // Exit search if escape pressed
  if (isEscape(event.key) && searchContainer.is(':visible')) {
    exitSearch();
    return;
  }

  mainSearch.setPreviousHighlightStart();
  mainSearch.clearHighlighting();
  console.log('key entered in search box');
  console.log(`searchBox.value: ${searchBox.val()}`);
  // Remove any event listeners from arrow buttons
  $('.search-arrow').off();

  mainSearch.searcher = new Searcher(searchBox.val());
  mainSearch.searcher.execute();
});

function hideSearchContainer() {
  searchContainer.fadeOut(50);
  mainSearchButton.fadeIn(100);
}

function showSearchContainer() {
  mainSearchButton.hide();
  searchContainer.fadeIn(100);
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
    console.log(this.matchNumber);
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
    return Object.keys(inflections_map).includes(word);
  },

  // selection ends just before the start of last index
  markListWord: function(startIndex, endIndex) {
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    console.log('marking list word');
    trixEditor.setSelectedRange([startIndex, endIndex]);
    trixEditor.activateAttribute('neilsListMatch');
    trixEditor.setSelectedRange(endIndex + 1);
  },

  unmarkListWord: function(startIndex, endIndex) {
    console.log('unmarking list word');
    trixEditor.setSelectedRange([startIndex,
                                endIndex]);
    trixEditor.deactivateAttribute('neilsListMatch');
    trixEditor.setSelectedRange(endIndex + 1);
  }
}
