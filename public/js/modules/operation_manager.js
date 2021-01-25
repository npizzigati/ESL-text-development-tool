const trixElement = document.querySelector("trix-editor");
const trixEditor = trixElement.editor;

function isSelection(caretPositionArray) {
  caretPositionArray[0] !== caretPositionArray[1];
}

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
};

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
};

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

function OperationManager(listData, officialListManager, myList) {
  this.listData = listData;
  this.officialListManager = officialListManager;
  this.myList = myList;
  this.Operation = function(text, indices, mode) {
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
  };

  this.processOperation = function() {
    fullTextHistory.update();
    if (isRangeCollapsed()) {
      removeCaretFormatting();
    }
    if (!isContentChanged()) {
      return;
    }
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
          this.listData.calculate();
          this.officialListManager.refresh();
          this.myList.refresh();
        }, 20);
      }
      break;
    case modes.DELETION:
      this.listData.calculate();
      this.officialListManager.refresh();
      this.myList.refresh();
      const deletion = new this.Operation(text, indices, modes.DELETION);
      this.processDeletion(deletion);
      break;
    }
  };

  this.processMultipleCharacterInsertion = function(insertion) {
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
        headword = this.listData.getHeadword(word);
        if (headword) {
          newText += word;
        } else {
          newText += this.htmlMarkWord(word);
        }
        index = wordEnd + 1;
      } else {
        newText += character;
        index += 1;
      }
    }
    trixEditor.setSelectedRange([insertion.startIndex, insertion.endIndex])
    trixEditor.insertHTML(newText);
  };

  this.htmlMarkWord = function(word) {
    return '<neils-non-match>' + word + '</neils-non-match>';
  };

  this.processWordAtIndex = function(operation, index) {
    const [wordStart, wordEnd] = retrieveWordCoordinates(operation.postOperationFullText, index);
    const word = retrieveWord(operation.postOperationFullText, [wordStart, wordEnd]); 
    const headword = this.listData.getHeadword(word);
    console.log(`Inside processWordAtIndex: headword: ${headword}`);
    const caretPositionBeforeMarking = trixEditor.getSelectedRange();

    this.listData.calculate();
    this.officialListManager.refresh();
    this.myList.refresh();
    if (headword) {
      textMarker.unmarkWord(word, wordStart, wordEnd);
      this.officialListManager.focusHeadword(headword);
    } else {
      textMarker.markWord(word, wordStart, wordEnd);
    }
    trixEditor.setSelectedRange(caretPositionBeforeMarking);
  };

  this.processLetterInsertionAtStartOrMiddleOfWord = function(insertion) {
    this.processWordAtIndex(insertion, insertion.endIndex);
  };

  this.processNonLetterInsertionInsideWord = function(insertion) {
    console.log('processing non-letter insertion inside word');
    // process new word after insertion
    this.processWordAtIndex(insertion, insertion.endIndex);
    // process new word before insertion
    this.processWordAtIndex(insertion, insertion.startIndex - 1);
  };

  this.processLetterInsertionAtEndOfOrOutsideWord = function(insertion) {
    // Add or subtract previous word as necessary
    const caretPositionBeforeMarking = trixEditor.getSelectedRange();
    const fullText = insertion.postOperationFullText;
    let [wordStart, wordEnd] = retrieveWordCoordinates(fullText, insertion.startIndex);
    const word = retrieveWord(fullText, [wordStart, wordEnd]); 
    const headword = this.listData.getHeadword(word);
    // Unmark previous word when adding letter to it
    if (word.length > 1) {
      const [previousWordStart, previousWordEnd] = [wordStart, wordEnd - 1];
      const previousWord = word.slice(0, -1);

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
      const headword = this.listData.getHeadword(word);
      this.listData.calculate();
      this.officialListManager.refresh();
      this.myList.refresh();
      if (headword) {
        textMarker.unmarkWord(word, wordStart, wordEnd);
        this.officialListManager.focusHeadword(headword);
      } else {
        textMarker.markWord(word, wordStart, wordEnd);
      }
      trixEditor.setSelectedRange(caretPositionBeforeMarking);
    }, 500);
  };

  this.processNonLetterInsertionAtEndOfWord = function(insertion) {
    const caretPositionBeforeMarking = trixEditor.getSelectedRange();
    const fullText = insertion.postOperationFullText;
    const [wordStart, wordEnd] = retrieveWordCoordinates(fullText, insertion.startIndex - 1);
    const word = retrieveWord(fullText, [wordStart, wordEnd]); 
    const headword = this.listData.getHeadword(word);

    this.listData.calculate();
    this.officialListManager.refresh();
    this.myList.refresh();
    if (headword) {
      this.officialListManager.focusHeadword(headword);
      textMarker.unmarkWord(word, wordStart, wordEnd);
    } else {
      textMarker.markWord(word, wordStart, wordEnd);
    }
    trixEditor.setSelectedRange(caretPositionBeforeMarking);
  };

  this.processDeletionInsideWord = function(deletion) {
    // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex - 1);
    this.processWordAtIndex(deletion, deletion.startIndex);
  };

  this.processDeletionOutsideWord = function(deletion) {
    if (deletion.characterBeforeType === characterTypes.LETTER &&
       deletion.characterAfterType === characterTypes.LETTER) {
      // Subtract pre-join words if space deleted between words
      // this.subtractPreJoinWords(deletion);
      // Process newly created word
      this.processWordAtIndex(deletion, deletion.startIndex - 1);
    }
  };

  this.processDeletionOfSingleCharacterWord = function(deletion) {
    // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex);
    // TODO: Is this deactivateAttribute necessary?
    // trixEditor.deactivateAttribute('neilsNonMatch');
  };

  this.processDeletionAtEndOfWord = function(deletion) {
    // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex - 1);
    this.processWordAtIndex(deletion, deletion.startIndex - 1);
  };

  this.processDeletionAtStartOfWord = function(deletion) {
    // this.subtractWordAtIndex(deletion.preOperationFullText, deletion.startIndex);
    this.processWordAtIndex(deletion, deletion.startIndex);
  };

  this.processOneCharacterInsertion = function(insertion) {
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
  };

  this.processDeletion = function(deletion) {
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
  };

  this.getDelta = function() {
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
  };
};

export { OperationManager };
