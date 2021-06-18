import { isPunctuation, isWordCharacter, isRangeCollapsed,
         retrieveWord, retrieveWordCoordinates, determineWordStart,
         determineWordEnd } from './utils/word_utilities.js';

/* eslint-disable max-lines-per-function */
function OperationManager(listData, listManager) {
  const trixElement = document.querySelector("trix-editor");
  const trixEditor = trixElement.editor;

  const isSelection = function(caretPositionArray) {
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

  const isContentChanged = function() {
    return fullTextHistory.latest !== fullTextHistory.previous;
  }

  const removeCaretFormatting = function() {
    if (trixEditor.attributeIsActive('neilsNonMatch')) {
      trixEditor.deactivateAttribute('neilsNonMatch');
    // } else if (trixEditor.attributeIsActive('neilsPunctuation')) {
    //   trixEditor.deactivateAttribute('neilsPunctuation');
    }
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


  this.multipleCharInsertionUnderway = false;
  this.listData = listData;
  this.officialList = listManager.officialList;
  this.autoList = listManager.autoList;
  this.myList = listManager.myList;
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

      /* eslint-disable indent */
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
    };
    this.point = this.determinePoint();
  };

  this.updateFullTextHistory = function() {
    fullTextHistory.update();
  };

  this.processOperation = function() {
    fullTextHistory.update();
    // Not sure if this is still necessary
    // if (isRangeCollapsed()) {
    //   removeCaretFormatting();
    // }

    if (!isContentChanged() || this.multipleCharInsertionUnderway) {
      // console.log('Returning early');
      return;
    }
    window.clearTimeout(this.operationTimeoutID);
    const [text, operation, indices] = this.getDelta();
    const length = text.length;

    switch (operation) {
    /* eslint-disable indent */
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
          this.officialList.refresh();
          this.autoList.refresh();
          this.myList.refresh();
        }, 20);
      }
      break;
    case modes.DELETION:
      this.listData.calculate();
      this.officialList.refresh();
      this.autoList.refresh();
      this.myList.refresh();
      const deletion = new this.Operation(text, indices, modes.DELETION);
      this.processDeletion(deletion);
      break;
    }
    /* eslint-enable indent */
  };

  this.processMultipleCharacterInsertion = function(insertion) {
    this.multipleCharInsertionUnderway = true;
    const fullText = insertion.postOperationFullText;
    let index = 0;
    const text = insertion.text;
    const length = text.length
    let word, wordStart, wordEnd, headword, character;
    const newTextSegments = [];
    let segment = '';

    while (index < length) {
      character = text[index];
      if (character === '\n') {
        newTextSegments.push(segment);
        segment = '';
        index += 1;
      } else if (isWordCharacter(character)) {
        [wordStart, wordEnd] = retrieveWordCoordinates(text, index);
        word = retrieveWord(text, [wordStart, wordEnd]);
        headword = this.listData.getHeadword(word);
        if (headword) {
          segment += word;
        } else {
          segment += this.htmlMarkWord(word);
        }
        index = wordEnd + 1;
      } else {
        segment += character;
        index += 1;
      }
    }
    newTextSegments.push(segment);
    trixEditor.setSelectedRange([insertion.startIndex, insertion.endIndex])
    this.multipleCharInsertionUnderway = true;
    trixEditor.deleteInDirection('forward');
    this.insertHTMLSegments(newTextSegments);
    this.multipleCharInsertionUnderway = false;
  };

  this.insertHTMLSegments = function(newTextSegments) {
    const numberOfSegments = newTextSegments.length;
    let count = 0;
    newTextSegments.forEach(segment => {
      count += 1;
      trixEditor.insertHTML(segment);
      if (count < numberOfSegments) {
        trixEditor.insertLineBreak();
      }
    });
  };

  this.htmlMarkWord = function(word) {
    return '<neils-non-match>' + word + '</neils-non-match>';
  };

  this.processWordAtIndex = function(operation, index) {
    const [wordStart, wordEnd] = retrieveWordCoordinates(operation.postOperationFullText, index);
    const word = retrieveWord(operation.postOperationFullText, [wordStart, wordEnd]);
    const headword = this.listData.getHeadword(word);
    const caretPositionBeforeMarking = trixEditor.getSelectedRange();

    this.listData.calculate();
    this.officialList.refresh();
    this.autoList.refresh();
    this.myList.refresh();
    if (headword) {
      textMarker.unmarkWord(word, wordStart, wordEnd);
      this.officialList.focusHeadword(headword);
    } else {
      textMarker.markWord(word, wordStart, wordEnd);
    }
    trixEditor.setSelectedRange(caretPositionBeforeMarking);
  };

  this.processLetterInsertionAtStartOrMiddleOfWord = function(insertion) {
    this.processWordAtIndex(insertion, insertion.endIndex);
  };

  this.processNonLetterInsertionInsideWord = function(insertion) {
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
    // const headword = this.listData.getHeadword(word);

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
      this.officialList.refresh();
      this.autoList.refresh();
      this.myList.refresh();
      if (headword) {
        textMarker.unmarkWord(word, wordStart, wordEnd);
        this.officialList.focusHeadword(headword);
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
    this.officialList.refresh();
    this.autoList.refresh();
    this.myList.refresh();
    if (headword) {
      this.officialList.focusHeadword(headword);
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
