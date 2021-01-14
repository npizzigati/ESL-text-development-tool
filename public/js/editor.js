'use strict';

// TODO: Add "am" to inflections list ("be"); also check
// contractions

const trixElement = document.querySelector("trix-editor")
const trixEditor = trixElement.editor;
const wordSeparators = [' ', '.', '!', '?', '-', ':', ';', 'Enter'];
const searchIconContainer = $('.search-icon-container');
const searchBox = $('#search-box');
const searchBoxContainer = $('.search-box-container');

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

function isContentChanged() {
  return fullTextHistory.latest !== fullTextHistory.previous;
}

function last(arr) {
  return arr[arr.length - 1]
}

function isEmpty(arr) {
  return arr.length == 0;
}

function isPunctuation(character) {
  return character.search(/[.,;:~!@#$%&*()_+=|/?<>"{}[\-\^\]\\]/) >= 0;
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

function isRangeCollapsed() {
// Determine if selection is single caret position instead of
// range
  const [start, end] = trixEditor.getSelectedRange();
  return start === end; 
}

function removeCaretFormatting() {
  if (trixEditor.attributeIsActive('neilsListMatch')) {
    console.log('removing neilsListMatch formatting');
    console.log(`range: ${trixEditor.getSelectedRange()}`);
    console.log(`neilsListMatch active: ${trixEditor.attributeIsActive('neilsListMatch')}`);
    trixEditor.deactivateAttribute('neilsListMatch');
  } else if (trixEditor.attributeIsActive('neilsPunctuation')) {
    console.log('removing neilsPunctuation formatting');
    console.log(`range: ${trixEditor.getSelectedRange()}`);
    trixEditor.deactivateAttribute('neilsPunctuation');
  }
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
    this.characterAfter = (mode === modes.INSERTION) ? this.postOperationFullText[this.endIndex] : this.preOperationFullText[this.endIndex];
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

  processOperation: function() {
    window.clearTimeout(this.operationTimeoutID);
    const [text, operation, indices] = this.getDelta();
    const length = text.length;
    // const fullText = fullTextHistory.latest;
    // this.characterBeforeOperation = (this.startIndex === 0) ? null : fullText[this.indices.startIndex - 1];
    // this.characterAfterOperation = fullText[this.indices.endIndex];
    switch (operation) {
    case modes.INSERTION:
      // As a workaround for issue where formatting persists
      // after deleting a space following a list word, if first
      // character is nonword remove neilsListMatch formatting from it
      if (!isWordCharacter(text[0])) {
        console.log('first char of insertion was nonword');
        const initialRange = trixEditor.getSelectedRange();
        trixEditor.setSelectedRange([indices.startIndex, indices.endIndex + 1]);
        trixEditor.deactivateAttribute('neilsListMatch');
        trixEditor.setSelectedRange(initialRange);
      }
      
      const insertion = new this.Operation(text, indices, modes.INSERTION);
      if (length === 1) {
        this.processPossiblePunctuationCharacter(insertion.text, insertion.startIndex);
        this.processOneCharacterInsertion(insertion);
      } else {
        // Seem to need this delay here to be able to process
        // multiple character insertion
        setTimeout( () => {
          this.processMultipleCharacterInsertion(insertion);
        }, 20);
      }
      break;
    case modes.DELETION:
      const deletion = new this.Operation(text, indices, modes.DELETION);
      console.log('processing deletion');
      this.processDeletion(deletion);
      // Without this timeout, formatting is removed and the added again
      // FIXME: If space or other character is added quickly after deletion, the
      // formatting is still there
      // setTimeout( () => {
      //   removeCaretFormatting();
      // }, 20);
      console.log('deletion processing concluded');
      break;
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
    // Have to remove caret formatting here; for some reason it's
    // not being done correctly in the on selection change listener.
    // removeCaretFormatting();
  },

  processMultipleCharacterInsertion: function(insertion) {
    const fullText = insertion.postOperationFullText;
    let wordStart, wordEnd, word, headword, character;
    let index = insertion.startIndex
    while (index < insertion.endIndex) {
      character = fullText[index];
      if (isWordCharacter(character)) {
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
        this.processPossiblePunctuationCharacter(character, index);
      }
      index += 1
    }
    trixEditor.setSelectedRange(insertion.endIndex);
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
    trixEditor.setSelectedRange(caretPositionBeforeMarking);
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
      trixEditor.setSelectedRange(caretPositionBeforeMarking);
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
      trixEditor.setSelectedRange(caretPositionBeforeMarking);
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
    trixEditor.setSelectedRange(caretPositionBeforeMarking);
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
    console.log('Processing deletion outside word');
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

  // FIXME: Sometimes neils-list-match isn't turned off at end of word 
  processOneCharacterInsertion: function(insertion) {
    let word, headword
    let caretPositionBeforeMarking = trixEditor.getSelectedRange();

    console.log('processing single character insertion');
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


  // FIXME: when deleting letters from first word, it doesn't
  // automatically unmark
  
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


$(trixElement).on('trix-selection-change', event => {
  fullTextHistory.update();
  if (isContentChanged()) {
    operationManager.processOperation();
    // return;
  }
  // Remove caret formatting after every range change (collapsed
  // selection)
  // setTimeout( () => {
  // TODO: without timeout, this is working for arrow key caret
  // changes but not spaces deleted
    if (isRangeCollapsed()) {
      removeCaretFormatting();
      console.log(`neilsListMatch active: ${trixEditor.attributeIsActive('neilsListMatch')}`);
    }
  // }, 20);
});

// Listener for clicks on matches in editor
$('body').on('click', 'neils-list-match', event => {
  const word = $(event.target).text();
  const headword = officialListManager.getHeadword(word);
  const markedHeadword = document.querySelector(`#official-${headword}`);
  markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
  officialListManager.emphasizeCurrentHeadwordMatch(markedHeadword);
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
    const originalCaretPos = trixEditor.getSelectedRange();
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
  // FIXME: Is this the right syntax for removing event listener?
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
  markWord: function(word, startIndex, endIndex) {
    trixEditor.setSelectedRange([startIndex, endIndex + 1]);
    trixEditor.activateAttribute('neilsListMatch');
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

const myListManager = {
  add: function(headword) {
    $('.my-list').append(headword);
    $('.my-list').append(', ');
  }
}

const officialListManager = {
  currentlyMatchedRow: null,
  getHeadword: function(word) {
    return (word === 'I') ? inflectionsMap[word] : inflectionsMap[word.toLowerCase()];
  },

  emphasizeCurrentHeadwordMatch: function(markedHeadword) {
    if (this.currentlyMatchedRow) {
      this.currentlyMatchedRow.removeClass('official-list-current-match');
    }
    this.currentlyMatchedRow = $(markedHeadword).parent();
    this.currentlyMatchedRow.addClass('official-list-current-match');
  },

  timesMarked: new Map(),
  // FIXME: This isn't counting inflections for some reason
  refreshAllCounts: function() {
    let fullText = fullTextHistory.latest
    // Remove ending punctuation
    fullText = fullText.replace(/[^a-zA-Z]+$/, '');
    const fullTextArray = fullText.trim().split(/[^a-zA-Z]+/);
    $('.official-list-count').text('');
    $('.official-list-headwords').parent().removeClass('official-list-match');
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
        $(`#official-${word}`).parent().addClass('official-list-match');
      }
      $(`#official-${word}-count`).text(times.toString());
    });
  },

  add: function(headword) {
    let times = this.timesMarked.get(headword);
    const markedHeadword = document.querySelector(`#official-${headword}`);
    if (times) {
      times = this.timesMarked.get(headword) + 1;
      this.timesMarked.set(headword, times);
    } else {
      times = 1;
      this.timesMarked.set(headword, times);
      $(markedHeadword).parent().addClass('official-list-match');
      myListManager.add(headword);
    }
    $(`#official-${headword}-count`).text(times.toString());
    markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
    this.emphasizeCurrentHeadwordMatch(markedHeadword);
  },

  subtract: function(headword) {
    let times = this.timesMarked.get(headword)
    if (!times) {
      return;
    }
    const markedHeadword = document.querySelector(`#official-${headword}`);
    if (times === 1) {
      times = 0;
      this.timesMarked.delete(headword);
      $(markedHeadword).parent().removeClass('official-list-match');
      this.timesMarked.set(headword, times);
      $(`#official-${headword}-count`).text('');
    } else {
      times -= 1
      this.timesMarked.set(headword, times);
      $(`#official-${headword}-count`).text(times.toString());
    }
    markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
  },
  populateOfficialList: function() {
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
  }
}

// Populate official word list with headwords
officialListManager.populateOfficialList();
