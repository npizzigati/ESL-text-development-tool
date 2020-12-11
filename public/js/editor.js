const trixElement = document.querySelector("trix-editor")
const trixEditor = trixElement.editor
const wordSeparators = [' ', '.', '!', '?', '-', ':', ';', 'Enter'];
let wordStart;
let wordEnd;
let word;
let trixContent;
let wordInProgress = false;

trixElement.addEventListener("keydown", event => {
  if (!wordInProgress && !isSeparator(event.key)) {
    wordInProgress = true;
    console.log('word in progress');
    wordStart = trixEditor.getPosition();
  } else if (isSeparator(event.key)) {
    wordInProgress = false;
    wordEnd = trixEditor.getPosition();
    console.log(`wordStart: ${wordStart}, wordEnd: ${wordEnd}`);
    word = retrieveWord(wordStart, wordEnd); 
    console.log(`word:..${word}..`);
    if (isInList(word)) {
      makeBold(wordStart, wordEnd);
    }
  }
}, false);

function isSeparator(key) {
  return wordSeparators.includes(key);
}

function isInList(word) {
  return Object.keys(inflections_map).includes(word);
}

function retrieveWord(wordStart, wordEnd) {
  let fullText = trixEditor.getDocument().toString();
  return fullText.slice(wordStart, wordEnd);
}

// when making selection, it's necessary to add 1 to end position
// (selection ends just before the start of that last index)
function makeBold(startIndex, endIndex) {
  trixEditor.setSelectedRange([startIndex,
                               endIndex]);
  trixEditor.activateAttribute('bold');

  // to prevent bold from continuing as we type next word
  trixEditor.setSelectedRange([endIndex,
                               endIndex]);
  trixEditor.deactivateAttribute('bold');
}
