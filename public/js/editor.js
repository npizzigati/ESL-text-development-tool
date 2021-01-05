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
  return text.search(/[.,;:~!@#$%&*()_+=|/?<>"{}[\-\^\]\\]/) >= 0;
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

// enums used in operationManager
const points = {
  START_OF_WORD: 'start of word',
  END_OF_WORD: 'end of word',
  INSIDE_WORD: 'inside word',
  OUTSIDE_WORD: 'outside word',
  ON_SINGLE_CHARACTER_WORD: 'on single character word'
}

const characterTypes = {
  LETTER: 'letter',
  NONLETTER: 'nonletter',
  MULTIPLE: 'multiple'
}

const modes = {
  INSERTION: 'insertion',
  DELETION: 'deletion'
}

const operationManager = {
  Operation: function(text, indices, mode) {
    this.text = text;
    this.startIndex = indices.startIndex;
    this.endIndex = indices.endIndex;
    this.preOperationFullText = fullTextHistory.previous;
    this.postOperationFullText = fullTextHistory.latest;
    this.characterAfter = (mode == modes.INSERTION) ? this.postOperationFullText[this.endIndex] : this.preOperationFullText[this.endIndex];
    this.characterBefore = (this.startIndex === 0) ? null : this.preOperationFullText[this.startIndex - 1];

    this.letterOrNonLetter = function(character) {
      if (isWordCharacter(character)) {
        return characterTypes.LETTER;
      } else {
        return characterTypes.NONLETTER;
      }
    } 

    this.determineCharacterType = function() {
      if (this.text.length > 1) {
        return characterTypes.MULTIPLE;
      } 
      return this.letterOrNonLetter(this.text);
    }

    this.determineCharacterAfterType = function() {
      return this.letterOrNonLetter(this.characterAfter);
    }

    this.determineCharacterBeforeType = function() {
      return this.letterOrNonLetter(this.characterBefore);
    }

    this.characterType = this.determineCharacterType();
    this.characterAfterType = this.determineCharacterAfterType();
    this.characterBeforeType = this.determineCharacterBeforeType();

    this.determinePoint = function() {
      switch (mode) {
      case modes.INSERTION:
        if (this.characterBeforeType === characterTypes.LETTER
            && this.characterAfterType === characterTypes.NONLETTER) {
          return points.END_OF_WORD;
        } else if (this.characterBeforeType === characterTypes.LETTER
            && this.characterAfterType === characterTypes.LETTER) {
          return points.INSIDE_WORD;
        } else if (this.characterBeforeType === characterTypes.NONLETTER
            && this.characterAfterType === characterTypes.LETTER) {
          return points.START_OF_WORD;
        } else if (this.characterBeforeType === characterTypes.NONLETTER
            && this.characterAfterType === characterTypes.NONLETTER) {
          return points.OUTSIDE_WORD;
        }
        break;
      case modes.DELETION:
        if (this.characterType === characterTypes.LETTER
                   && this.characterBeforeType === characterTypes.NONLETTER
                   && this.characterAfterType === characterTypes.NONLETTER) {
          return points.ON_SINGLE_CHARACTER_WORD;
        } else if (this.characterType === characterTypes.LETTER
            && this.characterAfterType === characterTypes.NONLETTER) {
          return points.END_OF_WORD;
        } else if (this.characterType === characterTypes.LETTER
                   && this.characterBeforeType === characterTypes.NONLETTER) {
          return points.START_OF_WORD;
        } else if (this.characterType === characterTypes.LETTER
                   && this.characterBeforeType === characterTypes.LETTER
                   && this.characterAfterType === characterTypes.LETTER) {
          return points.INSIDE_WORD;
        } else {
          return points.OUTSIDE_WORD;
        }
        break;
      }
    }

    this.point = this.determinePoint();
  },

  // TODO: Refresh counts on carriage return maybe
  processOperation: function() {
    window.clearTimeout(this.operationTimeoutID);
    const [text, operation, indices] = this.getDelta();
    const length = text.length;
    // const fullText = fullTextHistory.latest;
    // this.characterBeforeOperation = (this.startIndex === 0) ? null : fullText[this.indices.startIndex - 1];
    // this.characterAfterOperation = fullText[this.indices.endIndex];
    switch (operation) {
    case modes.INSERTION:
      const insertion = new this.Operation(text, indices, modes.INSERTION);
      if (length === 1) {
        this.processPossiblePunctuationCharacter(insertion);
        this.processOneCharacterInsertion(insertion);
      } else {
        this.processMultipleCharacterInsertion(insertion);
      }
      break;
    case modes.DELETION:
      const deletion = new this.Operation(text, indices, modes.DELETION);
      this.processDeletion(deletion);
      break;
    }

    if (length > 1) {
      officialListManager.refreshAllCounts();
    }
  },

  processPossiblePunctuationCharacter(insertion) {
    const index = insertion.startIndex;
    if (isPunctuation(insertion.text)) {
      console.log('Character is punctuation')
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
  resetCaret: function(caretPositionBeforeMarking, deactivate = true) {
    trixEditor.setSelectedRange(caretPositionBeforeMarking);
    if (deactivate === true && trixEditor.attributeIsActive('neilsListMatch')) {
      trixEditor.deactivateAttribute('neilsListMatch');
      console.log('deactivating attribute');
    } else {
      console.log('attribute is already deactivated')
    }
  },

  processMultipleCharacterInsertion: function(insertion) {
    const fullText = insertion.postOperationFullText;
    let wordStart, wordEnd, word, headword;
    let index = insertion.startIndex

    while (index < insertion.endIndex) {
      if (isWordCharacter(fullText[index])) {
        [wordStart, wordEnd] = retrieveWordCoordinates(fullText, index);
        word = retrieveWord(fullText, [wordStart, wordEnd]); 

        headword = officialListManager.getHeadword(word);
        if (headword) {
          textMarker.markWord(word, wordStart, wordEnd);
        } else {
          textMarker.unmarkWord(word, wordStart, wordEnd);
        }
        index = wordEnd
      } else {
        this.processPossiblePunctuationCharacter(insertion);
      }
      index += 1
    }
    this.resetCaret(insertion.endIndex);
  },

  subtractPreSplitWord: function(insertion) {
    this.subtractWordAtIndex(insertion.preOperationFullText, insertion.startIndex);
  },

  processWordAtIndex: function(operation, index) {
    const [wordStart, wordEnd] = retrieveWordCoordinates(operation.postOperationFullText, index);
    const word = retrieveWord(operation.postOperationFullText, [wordStart, wordEnd]); 
    const headword = officialListManager.getHeadword(word);
    const caretPositionBeforeMarking = trixEditor.getSelectedRange();
    if (headword) {
      officialListManager.add(headword);
      textMarker.markWord(word, wordStart, wordEnd);
    } else {
      textMarker.unmarkWord(word, wordStart, wordEnd);
    }
    this.resetCaret(caretPositionBeforeMarking);
  },

  processLetterInsertionAtStartOrMiddleOfWord: function(insertion) {
    this.subtractPreSplitWord(insertion);
    this.processWordAtIndex(insertion, insertion.endIndex);
  },

  processNonLetterInsertionInsideWord: function(insertion) {
    this.subtractPreSplitWord(insertion); 
    // process new word after insertion
    this.processWordAtIndex(insertion, insertion.endIndex);
    // process new word before insertion
    this.processWordAtIndex(insertion, insertion.startIndex - 1);
  },

  processLetterInsertionAtEndOfOrOutsideWord: function(insertion) {
    // Add or subtract previous word as necessary
    const caretPositionBeforeMarking = trixEditor.getSelectedRange();
    const fullText = insertion.postOperationFullText;
    let [wordStart, wordEnd] = retrieveWordCoordinates(fullText, insertion.startIndex);
    const word = retrieveWord(fullText, [wordStart, wordEnd]); 
    const headword = officialListManager.getHeadword(word);
    if (headword) {
      officialListManager.add(headword);
    }
    if (word.length > 1) {
      const [previousWordStart, previousWordEnd] = [wordStart, wordEnd - 1];
      const previousWord = word.slice(0, -1);
      const previousWordHeadword = officialListManager.getHeadword(previousWord);
      if (previousWordHeadword) {
        officialListManager.subtract(previousWordHeadword);
      }
      textMarker.unmarkWord(previousWord, previousWordStart, previousWordEnd);
      this.resetCaret(caretPositionBeforeMarking, false);
    }

    this.operationTimeoutID = window.setTimeout( () => {
      const fullText = insertion.postOperationFullText;
      const caretPositionBeforeMarking = trixEditor.getSelectedRange();

      const [wordStart, wordEnd] = retrieveWordCoordinates(fullText, insertion.startIndex);
      const word = retrieveWord(fullText, [wordStart, wordEnd]); 
      const headword = officialListManager.getHeadword(word);
      if (headword) {
        textMarker.markWord(word, wordStart, wordEnd);
      } else {
        textMarker.unmarkWord(word, wordStart, wordEnd);
      }
      this.resetCaret(caretPositionBeforeMarking);
    }, 500);
  },

  processNonLetterInsertionAtEndOfWord: function(insertion) {
    const caretPositionBeforeMarking = trixEditor.getSelectedRange();
    const fullText = insertion.postOperationFullText;
    const [wordStart, wordEnd] = retrieveWordCoordinates(fullText, insertion.startIndex - 1);
    const word = retrieveWord(fullText, [wordStart, wordEnd]); 
    const headword = officialListManager.getHeadword(word);
    if (headword) {
      textMarker.markWord(word, wordStart, wordEnd);
    } else {
      textMarker.unmarkWord(word, wordStart, wordEnd);
    }
    console.log('should be deactivating attribute if it is active')
    this.resetCaret(caretPositionBeforeMarking);
  },

  subtractWordAtIndex: function(fullText, index) {
    const [wordStart, wordEnd] = retrieveWordCoordinates(fullText,
                                                         index);
    const word = retrieveWord(fullText, [wordStart, wordEnd]);
    const headword = officialListManager.getHeadword(word);
    if (headword) {
      officialListManager.subtract(headword);
    }
  },

  subtractPreJoinWords: function(deletion) {
    // Subtract first word
    this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex - 1);
    // Subtract second word
    this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex + 1);
  },

  processDeletionInsideWord: function(deletion) {
    this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex - 1);
    this.processWordAtIndex(deletion, deletion.startIndex);
  },

  processDeletionOutsideWord: function(deletion) {
    if (deletion.characterBeforeType === characterTypes.LETTER &&
       deletion.characterAfterType === characterTypes.LETTER) {
      // Subtract pre-join words if space deleted between words
      this.subtractPreJoinWords(deletion);
      // Process newly created word
      this.processWordAtIndex(deletion, deletion.startIndex - 1);
    }
  },

  processDeletionOfSingleCharacterWord: function(deletion) {
    this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex);
    trixEditor.deactivateAttribute('neilsListMatch');
  },

  processDeletionAtEndOfWord: function(deletion) {
    this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex - 1);
    this.processWordAtIndex(deletion, deletion.startIndex - 1);
  },

  processDeletionAtStartOfWord: function(deletion) {
    this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex);
    this.processWordAtIndex(deletion, deletion.startIndex);
  },

  processOneCharacterInsertion: function(insertion) {
    let word, headword
    let caretPositionBeforeMarking = trixEditor.getSelectedRange();

    switch (insertion.point) {
    case points.OUTSIDE_WORD:
      if (insertion.characterType === characterTypes.LETTER) {
        this.processLetterInsertionAtEndOfOrOutsideWord(insertion);
      }
      break;
    case points.INSIDE_WORD:
      if (insertion.characterType === characterTypes.LETTER) {
        this.processLetterInsertionAtStartOrMiddleOfWord(insertion);
      } else {
        this.processNonLetterInsertionInsideWord(insertion);
      }
      break;
    case points.START_OF_WORD:
      if (insertion.characterType === characterTypes.LETTER) {
        this.processLetterInsertionAtStartOrMiddleOfWord(insertion);
      }
      break;
    case points.END_OF_WORD:
      if (insertion.characterType === characterTypes.NONLETTER) {
        this.processNonLetterInsertionAtEndOfWord(insertion);
      } else {
        this.processLetterInsertionAtEndOfOrOutsideWord(insertion);
      }
    }
  },

  // TODO: unmark joined words from official list when space removed from in between

  // FIXME: when deleting letters from first word, it doesn't automatically unmark
  
  processDeletion: function(deletion) {
    switch (deletion.point) {
    case points.OUTSIDE_WORD:
      this.processDeletionOutsideWord(deletion);
      break;
    case points.ON_SINGLE_CHARACTER_WORD:
      this.processDeletionOfSingleCharacterWord(deletion);
      break;
    case points.INSIDE_WORD:
      this.processDeletionInsideWord(deletion);
      break;
    case points.END_OF_WORD:
      this.processDeletionAtEndOfWord(deletion);
      break;
    case points.START_OF_WORD:
      this.processDeletionAtStartOfWord(deletion);
    }
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
      return [text, modes.INSERTION, indices];
    } else {
      startIndex = trixEditor.getSelectedRange()[0] 
      endIndex = startIndex + deltaLength;
      text = fullTextHistory.previous.slice(startIndex, endIndex);
      indices = {
        startIndex: startIndex,
        endIndex: endIndex
      }
      return [text, modes.DELETION, indices];
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
    operationManager.processOperation();
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
    const highlightedElement = document.querySelector('mark');
    highlightedElement.scrollIntoView({behavior: 'auto',
                                      block: 'center'});
  }
} 

const textMarker = {
  updateMatchesListener: function() {
    $('neils-list-match').off();
    $('neils-list-match').on('click', event => {
      const word = $(event.target).text();
      console.log(`${word} clicked`);
    });
  },

  markWord: function(word, startIndex, endIndex) {
    trixEditor.setSelectedRange([startIndex, endIndex + 1]);
    trixEditor.activateAttribute('neilsListMatch');
    this.updateMatchesListener();
  },

  unmarkWord: function(word, startIndex, endIndex, deletedPart = null) {
    if (word === deletedPart) {
      trixEditor.deactivateAttribute('neilsListMatch');
      return;
    }

    word = (deletedPart) ? word + deletedPart : word;
    trixEditor.setSelectedRange([startIndex, endIndex + 1]);
    trixEditor.deactivateAttribute('neilsListMatch');
  }
}

const officialListManager = {
  getHeadword: function(word) {
    console.log(`word: ${word}`);
    return (word === 'I') ? inflectionsMap[word] : inflectionsMap[word.toLowerCase()];
  },
  timesMarked: new Map(),
  refreshAllCounts: function() {
    let fullText = fullTextHistory.latest
    // Remove ending punctuation
    fullText = fullText.replace(/[^a-zA-Z]+$/, '');
    const fullTextArray = fullText.trim().split(/[^a-zA-Z]+/);
    $('.official-list-count').text('');
    $('.official-list-headwords').removeClass('official-list-match');
    this.timesMarked.clear();

    fullTextArray.forEach(word => {
      word = (word === 'I') ? word : word.toLowerCase();
      const headword = this.getHeadword(word);
      let times = this.timesMarked.get(headword);
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

  add: function(headword) {
    let times = this.timesMarked.get(headword);
    const markedWord = document.querySelector(`#official-${headword}`);
    if (times) {
      times = this.timesMarked.get(headword) + 1;
      this.timesMarked.set(headword, times);
    } else {
      times = 1;
      this.timesMarked.set(headword, times);
      $(markedWord).addClass('official-list-match');
    }
    $(`#official-${headword}-count`).text(times.toString());
    markedWord.scrollIntoView({behavior: 'auto', block: 'center'});
  },

  subtract: function(headword) {
    let times = this.timesMarked.get(headword)
    if (!times) {
      return;
    }
    const markedWord = document.querySelector(`#official-${headword}`);
    if (times === 1) {
      times = 0;
      this.timesMarked.delete(headword);
      $(markedWord).removeClass('official-list-match');
      this.timesMarked.set(headword, times);
      $(`#official-${headword}-count`).text('');
    } else {
      times -= 1
      this.timesMarked.set(headword, times);
      $(`#official-${headword}-count`).text(times.toString());
    }
    markedWord.scrollIntoView({behavior: 'auto', block: 'center'});
  },
  populateOfficialList: function() {
    let rowCount = 1;
    officialList.append(`<table>`);
    headwords.forEach( headword => {
      officialList.append('<tr>');
      officialList.append(`<td class="official-list-rank">${rowCount.toString()}</td>`);
      officialList.append(`<td id="official-${headword}" class="official-list-headwords">${headword}</td>`);
      officialList.append(`<td class="official-list-count" id="official-${headword}-count"></td>`);
      officialList.append('</tr>');
      rowCount += 1;
    });
    officialList.append(`</table>`);
  }
}

// Populate official word list with headwords
officialListManager.populateOfficialList();
