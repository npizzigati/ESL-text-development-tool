const trixElement = document.querySelector("trix-editor");
const trixEditor = trixElement.editor;

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

export { isPunctuation, isWordCharacter, isRangeCollapsed,
         retrieveWord, retrieveWordCoordinates, determineWordStart,
         determineWordEnd };
