import * as Search from './modules/search.js';
import * as Utils from './modules/utilities.js';
import { MyList } from './modules/my_list.js';

// TODO: Add "am" to inflections list ("be"); also check
// contractions; also "I'm"; "ai" is listed as an inflection of "be" and that
// makes no sense.


const trixElement = document.querySelector("trix-editor");
const trixEditor = trixElement.editor;
const wordSeparators = [' ', '.', '!', '?', '-', ':', ';', 'Enter'];

// Add new HTML tag for words in list
class NeilsNonMatch extends HTMLElement {}
customElements.define('neils-non-match', NeilsNonMatch);

// Add new HTML tag for punctuation
// class NeilsPunctuation extends HTMLElement {}
// customElements.define('neils-punctuation', NeilsPunctuation);

// Add Trix format for marking list words
Trix.config.textAttributes.neilsNonMatch = {
  tagName: 'neils-non-match',
  inheritable: true
};

// Add Trix format for formatting punctuation
// Trix.config.textAttributes.neilsPunctuation = {
//   tagName: 'neils-punctuation',
//   inheritable: false
// };

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

function isPunctuation(character) {
  return character.search(/[.,;:~!@#$%&*()_+=|/?<>"{}[\-\^\]\\]/) >= 0;
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
  if (trixEditor.attributeIsActive('neilsNonMatch')) {
    trixEditor.deactivateAttribute('neilsNonMatch');
  // } else if (trixEditor.attributeIsActive('neilsPunctuation')) {
  //   trixEditor.deactivateAttribute('neilsPunctuation');
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

    switch (operation) {
    case modes.INSERTION:
      // As a workaround for issue where formatting persists
      // after deleting a space following a list word, if first
      // character is nonword remove neilsNonMatch formatting from it
      if (!isWordCharacter(text[0])) {
        const initialRange = trixEditor.getSelectedRange();
        trixEditor.setSelectedRange([indices.startIndex, indices.endIndex + 1]);
        trixEditor.deactivateAttribute('neilsNonMatch');
        trixEditor.setSelectedRange(initialRange);
      }
      
      const insertion = new this.Operation(text, indices, modes.INSERTION);
      if (length === 1) {
        this.processOneCharacterInsertion(insertion);
      } else {
        // Seem to need this delay here to be able to process
        // multiple character insertion
        setTimeout( () => {
          this.processMultipleCharacterInsertion(insertion);
          officialListManager.refresh();
          myList.refresh();
        }, 20);
      }
      break;
    case modes.DELETION:
      officialListManager.refresh();
      myList.refresh();
      const deletion = new this.Operation(text, indices, modes.DELETION);
      this.processDeletion(deletion);
      break;
    }

    // if (length > 1) {
    //   myList.refresh();
    // }
  },

  processMultipleCharacterInsertion: function(insertion) {
    const fullText = insertion.postOperationFullText;
    let index = 0;
    const text = insertion.text;
    const length = text.length
    let word, wordStart, wordEnd, headword, character;
    let newText = '';

    while (index < length) {
      character = text[index];
      if (isWordCharacter(character)) {
        [wordStart, wordEnd] = retrieveWordCoordinates(text, index);
        word = retrieveWord(text, [wordStart, wordEnd]); 
        headword = officialListManager.getHeadword(word);
        if (headword) {
          newText += word;
        } else {
          newText += this.htmlMarkWord(word);
        }
        index = wordEnd + 1;
      // } else if (isPunctuation(character)) {
      //   newText += this.htmlFormatPunctuation(character);
      //   index += 1;
      } else {
        newText += character;
        index += 1;
      }
    }
    trixEditor.setSelectedRange([insertion.startIndex, insertion.endIndex])
    trixEditor.insertHTML(newText);
  },

  htmlMarkWord: function(word) {
    return '<neils-non-match>' + word + '</neils-non-match>';
  },

  // htmlFormatPunctuation: function(character) {
  //   return '<neils-punctuation>' + character + '</neils-punctuation>';
  // },

  // subtractPreSplitWord: function(insertion) {
  //   this.subtractWordAtIndex(insertion.preOperationFullText, insertion.startIndex);
  // },

  processWordAtIndex: function(operation, index) {
    const [wordStart, wordEnd] = retrieveWordCoordinates(operation.postOperationFullText, index);
    const word = retrieveWord(operation.postOperationFullText, [wordStart, wordEnd]); 
    const headword = officialListManager.getHeadword(word);
    const caretPositionBeforeMarking = trixEditor.getSelectedRange();
    if (headword) {
      textMarker.unmarkWord(word, wordStart, wordEnd);
    } else {
      textMarker.markWord(word, wordStart, wordEnd);
    }
    trixEditor.setSelectedRange(caretPositionBeforeMarking);
    officialListManager.refresh();
    if (headword) {
      officialListManager.focusHeadword(headword);
    }
    myList.refresh();
  },

  processLetterInsertionAtStartOrMiddleOfWord: function(insertion) {
    // this.subtractPreSplitWord(insertion);
    this.processWordAtIndex(insertion, insertion.endIndex);
  },

  processNonLetterInsertionInsideWord: function(insertion) {
    console.log('processing non-letter insertion inside word');
    // this.subtractPreSplitWord(insertion); 
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
    // if (headword) {
    //   // officialListManager.add(headword);
    // }
    // Unmark previous word when adding letter to it
    if (word.length > 1) {
      const [previousWordStart, previousWordEnd] = [wordStart, wordEnd - 1];
      const previousWord = word.slice(0, -1);
      // const previousWordHeadword = officialListManager.getHeadword(previousWord);
      // if (previousWordHeadword) {
      //   officialListManager.subtract(previousWordHeadword);
      // }
      // TODO: Does this unmarkWord make sense here now, or
      // should it be markWord?
      textMarker.unmarkWord(previousWord, previousWordStart, previousWordEnd);
      trixEditor.setSelectedRange(caretPositionBeforeMarking);
    }

    // This timeout allows us to type a multi-letter word without
    // them being analyzed for keyword matches on every letter entered
    // (Is is canceled if a new letter is entered before the time limit)
    this.operationTimeoutID = window.setTimeout( () => {
      const fullText = insertion.postOperationFullText;
      const caretPositionBeforeMarking = trixEditor.getSelectedRange();

      const [wordStart, wordEnd] = retrieveWordCoordinates(fullText, insertion.startIndex);
      const word = retrieveWord(fullText, [wordStart, wordEnd]); 
      const headword = officialListManager.getHeadword(word);
      if (headword) {
        textMarker.unmarkWord(word, wordStart, wordEnd);
      } else {
        textMarker.markWord(word, wordStart, wordEnd);
      }
      trixEditor.setSelectedRange(caretPositionBeforeMarking);
      officialListManager.refresh();
      if (headword) {
        officialListManager.focusHeadword(headword);
      }
      myList.refresh();
    }, 500);
  },

  processNonLetterInsertionAtEndOfWord: function(insertion) {
    const caretPositionBeforeMarking = trixEditor.getSelectedRange();
    const fullText = insertion.postOperationFullText;
    const [wordStart, wordEnd] = retrieveWordCoordinates(fullText, insertion.startIndex - 1);
    const word = retrieveWord(fullText, [wordStart, wordEnd]); 
    const headword = officialListManager.getHeadword(word);
    if (headword) {
      textMarker.unmarkWord(word, wordStart, wordEnd);
      // officialListManager.focusHeadword(headword);
    } else {
      textMarker.markWord(word, wordStart, wordEnd);
    }
    trixEditor.setSelectedRange(caretPositionBeforeMarking);
    officialListManager.refresh();
    if (headword) {
      officialListManager.focusHeadword(headword);
    }
    myList.refresh();
  },

  // subtractWordAtIndex: function(fullText, index) {
  //   const [wordStart, wordEnd] = retrieveWordCoordinates(fullText,
  //                                                        index);
  //   const word = retrieveWord(fullText, [wordStart, wordEnd]);
  //   console.log(`word to subtract: ${word}`);
  //   const headword = officialListManager.getHeadword(word);
  //   // if (headword) {
  //   //   officialListManager.subtract(headword);
  //   //   console.log(`Should remove ${headword} from official list`);
  //   // }
  // },

  // subtractPreJoinWords: function(deletion) {
  //   // Subtract first word
  //   // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex - 1);
  //   // Subtract second word
  //   // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex + 1);
  // },

  processDeletionInsideWord: function(deletion) {
    // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex - 1);
    this.processWordAtIndex(deletion, deletion.startIndex);
  },

  processDeletionOutsideWord: function(deletion) {
    if (deletion.characterBeforeType === characterTypes.LETTER &&
       deletion.characterAfterType === characterTypes.LETTER) {
      // Subtract pre-join words if space deleted between words
      // this.subtractPreJoinWords(deletion);
      // Process newly created word
      this.processWordAtIndex(deletion, deletion.startIndex - 1);
    }
  },

  processDeletionOfSingleCharacterWord: function(deletion) {
    // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex);
    // TODO: Is this deactivateAttribute necessary?
    // trixEditor.deactivateAttribute('neilsNonMatch');
  },

  processDeletionAtEndOfWord: function(deletion) {
    // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex - 1);
    this.processWordAtIndex(deletion, deletion.startIndex - 1);
  },

  processDeletionAtStartOfWord: function(deletion) {
    // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex);
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


  // FIXME: when deleting letters from first word, it doesn't
  // automatically unmark
  
  processDeletion: function(deletion) {
    switch (deletion.point) {
    case points.OUTSIDE_WORD:
      this.processDeletionOutsideWord(deletion);
      break;
    case points.ON_SINGLE_CHARACTER_WORD:
      // this.processDeletionOfSingleCharacterWord(deletion);
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


$(trixElement).on('trix-selection-change', () => {
  fullTextHistory.update();
  if (isContentChanged()) {
    operationManager.processOperation();
  }
    if (isRangeCollapsed()) {
      removeCaretFormatting();
    }
});

// Listener for clicks on matches in editor
// $('body').on('click', 'neils-list-match', event => {
//   const word = $(event.target).text();
//   const headword = officialListManager.getHeadword(word);
//   const markedHeadword = document.querySelector(`#official-${headword}`);
//   markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
//   officialListManager.emphasizeCurrentHeadwordMatch(markedHeadword);
// });

const textMarker = {
  markWord: function(word, startIndex, endIndex) {
    trixEditor.setSelectedRange([startIndex, endIndex + 1]);
    trixEditor.activateAttribute('neilsNonMatch');
  },

  unmarkWord: function(word, startIndex, endIndex, deletedPart = null) {
    if (word === deletedPart) {
      trixEditor.deactivateAttribute('neilsNonMatch');
      return;
    }

    word = (deletedPart) ? word + deletedPart : word;
    trixEditor.setSelectedRange([startIndex, endIndex + 1]);
    trixEditor.deactivateAttribute('neilsNonMatch');
  }
}

const officialListManager = {
  currentlyMatchedRow: null,
  timesMarked: new Map(),
  getHeadword: function(word) {
    return (word === 'I') ? inflectionsMap[word] : inflectionsMap[word.toLowerCase()];
  },

  emphasizeCurrentHeadwordMatch: function(markedHeadword) {
    this.deemphasizeCurrentHeadwordMatch(markedHeadword);
    this.currentlyMatchedRow = $(markedHeadword).parent();
    this.currentlyMatchedRow.addClass('official-list-current-match');
    markedHeadword.scrollIntoView({behavior: 'auto', block: 'center'});
  },

  deemphasizeCurrentHeadwordMatch: function(markedHeadword) {
    if (this.currentlyMatchedRow) {
      this.currentlyMatchedRow.removeClass('official-list-current-match');
      this.currentlyMatchedRow = null;
    }
  },

  refresh: function() {
    let fullText = fullTextHistory.latest
    // Remove ending punctuation
    fullText = fullText.replace(/[^a-zA-Z']+$/, '');
    const fullTextArray = fullText.trim().split(/[^a-zA-Z']+/);
    $('.official-list-count').text('');
    $('.official-list-headwords').parent().removeClass('official-list-match');
    this.timesMarked.clear();

    fullTextArray.forEach(word => {
      word = (word === 'I') ? word : word.toLowerCase();
      const headword = this.getHeadword(word);
      let times = this.timesMarked.get(headword);
      if (times) {
        times += 1;
        this.timesMarked.set(headword, times);
      } else {
        times = 1;
        this.timesMarked.set(headword, times);
        $(`#official-${headword}`).parent().addClass('official-list-match');
      }
      $(`#official-${headword}-count`).text(times.toString());
    });
  },

  focusHeadword: function(headword) {
    const markedHeadword = document.querySelector(`#official-${headword}`);
    const row = $(markedHeadword).parent();
    const times = this.timesMarked.get(headword) || 0;
    // TODO: I might need this:
    // if (!row.hasClass('official-list-match')) {
    //   row.addClass('official-list-match');
    // }
    this.emphasizeCurrentHeadwordMatch(markedHeadword);
    $(`#official-${headword}-count`).text(times.toString());
  },

  unfocusHeadword: function(headword) {
    const markedHeadword = document.querySelector(`#official-${headword}`);
    const times = this.timesMarked.get(headword)
    if (!times) {
      $(markedHeadword).parent().removeClass('official-list-match');
      $(`#official-${headword}-count`).text('');
    } else {
      $(`#official-${headword}-count`).text(times.toString());
    }
    this.deemphasizeCurrentHeadwordMatch(markedHeadword);
  },

  // add: function(headword) {
  //   let times = this.timesMarked.get(headword);
  //   if (times) {
  //     times = this.timesMarked.get(headword) + 1;
  //     this.timesMarked.set(headword, times);
  //   } else {
  //     times = 1;
  //     this.timesMarked.set(headword, times);
  //   }
  //   myList.refresh();
  // },

  // subtract: function(headword) {
  //   let times = this.timesMarked.get(headword)
  //   if (!times) {
  //     return;
  //   }
  //   if (times === 1) {
  //     times = 0;
  //     this.timesMarked.delete(headword);
  //     this.timesMarked.set(headword, times);
  //   } else {
  //     times -= 1
  //     this.timesMarked.set(headword, times);
  //   }
  //   officialListManager.unfocusHeadword(headword);
  //   myList.refresh();
  //   myList.refreshView();
  // },

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

Search.activateSearchListeners();

const myList = new MyList(officialListManager);
myList.show()
myList.activateListeners();

$('.search-box-container').hide();
