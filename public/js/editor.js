'use strict';

const trixElement = document.querySelector("trix-editor")
const trixEditor = trixElement.editor
const wordSeparators = [' ', '.', '!', '?', '-', ':', ';', 'Enter'];
let wordStart;
let wordEnd;
let word;
let wordInProgress = false;
let trixSearchUnderway = false;

// Add Trix format for highlighting search matches
Trix.config.textAttributes.searchHighlight = {
  style: { backgroundColor: "moccasin" },
  parser: function(element) {
    return element.style.backgroundColor === "moccasin"
  },
  inheritable: true
};

trixEditor.insertString('A highlighted part');
trixEditor.setSelectedRange([2, 13]);
trixEditor.activateAttribute('searchHighlight');
trixEditor.setSelectedRange([0, 0]);

trixElement.addEventListener('keydown', event => {
  // Also need to account for other non letter keys, like Windows
  // key, which do not start a word.
  if (!wordInProgress && !isSeparator(event.key)) {
    console.log('word in progress');
    wordInProgress = true;
    wordStart = trixEditor.getSelectedRange()[0];
  } else if (isSeparator(event.key)) {
    console.log('word not in progress');
    wordInProgress = false;
    wordEnd = trixEditor.getSelectedRange()[0];
    console.log(`wordStart: ${wordStart}, wordEnd: ${wordEnd}`);
    word = retrieveWord(wordStart, wordEnd); 
    console.log(`word:..${word}..`);
    if (isInList(word)) {
      makeBold(wordStart, wordEnd);
    }
  }
}, false);

const searchBox = document.getElementById('searchBox');
const searchDownButton = document.getElementById('searchDown');

searchBox.addEventListener('keyup', event => {
  let searcher = new Searcher(searchBox.value);
  searcher.execute();
}, false);

function Searcher(searchString) {
  this.fullText = trixEditor.getDocument().toString();
  this.searchString = searchString;
  this.matches = [];
  this.execute = function() {
    clearSearchHighlighting(this.fullText);
    this.matches = findMatches(this.fullText, this.searchString); 
    console.log(this.matches);
    if (this.matches.length > 0) {
      highlightMatch(this.matches[0], this.searchString.length);
      scrollToMatch(this.matches[0]);
      searchBox.focus();
    }
  }
} 

function isSeparator(key) {
  return wordSeparators.includes(key);
}

function isInList(word) {
  return Object.keys(inflections_map).includes(word);
}

// TODO: This shouldn't be searching for regex (e.g. a period for
// any character)
function findMatches(text, searchString,
                     startIndex = 0) {
  let fragment = text.slice(startIndex);
  let fragmentMatchIndex = fragment.search(searchString);
  if (fragmentMatchIndex == -1 || searchString == '') {
    return [];
  }
  let fullTextMatchIndex = fragmentMatchIndex + startIndex;
  startIndex = fullTextMatchIndex + 1
  return [fullTextMatchIndex].concat(findMatches(text,
                                         searchString,
                                         startIndex));
}

function clearSearchHighlighting(fullText) {
  trixEditor.setSelectedRange([0, fullText.length]);
  trixEditor.deactivateAttribute('searchHighlight');
  trixEditor.setSelectedRange([0, 0]);
  searchBox.focus();
}

function highlightMatch(startIndex, length) {
  let endIndex = startIndex + length;
  trixEditor.setSelectedRange([startIndex, endIndex]);
  trixEditor.activateAttribute('searchHighlight');
  trixEditor.setSelectedRange([startIndex, startIndex]);
}

function scrollToMatch(startIndex) {
  console.log('In scrollToMatch function');
  let highlightedElement = document.querySelector('div span[style ^= "background-color"]')
  highlightedElement.scrollIntoView({behavior: "smooth",
                                     block: "center"});
}

function retrieveWord(wordStart, wordEnd) {
  let fullText = trixEditor.getDocument().toString();
  return fullText.slice(wordStart, wordEnd);
}

// selection ends just before the start of last index
function makeBold(startIndex, endIndex) {
  trixEditor.setSelectedRange([startIndex,
                               endIndex]);
  trixEditor.activateAttribute('bold');

  // to prevent bold from continuing as we type next word
  trixEditor.setSelectedRange([endIndex,
                               endIndex]);
  trixEditor.deactivateAttribute('bold');
}

