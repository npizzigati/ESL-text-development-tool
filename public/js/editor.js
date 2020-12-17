'use strict';

const trixElement = document.querySelector("trix-editor")
const trixEditor = trixElement.editor;
const wordSeparators = [' ', '.', '!', '?', '-', ':', ';', 'Enter'];
const mainSearchButton = $('#main-search-button');
const searchBox = $('#search-box');
const searchContainer = $('.search-container');
let wordStart;
let wordEnd;
let word;
let wordInProgress = false;
let trixSearchUnderway = false;

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

searchContainer.hide();

$(trixElement).on('keydown', event => {
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
      markListWord(wordStart, wordEnd);
    }
  }
});


let mainSearch = {
  highlightedRanges: [],
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

$(trixElement).on('mouseup', () => {
  if (searchContainer.is(":hidden")) {
    return;
  }
  // The caret position of the click is not immediately
  // registered by trix, so we have to wait a fraction of a second
  setTimeout(function() {
    let originalCaretPos = trixEditor.getSelectedRange();
    hideSearchContainer();
    mainSearch.clearHighlighting();
    trixEditor.setSelectedRange(originalCaretPos);
  }, 200);
});

// trixElement.addEventListener('click', () => {
//   if (searchContainer.is(":hidden")) {
//     return;
//   }
//   hideSearchContainer();
  
//   mainSearch.clearHighlighting();
// }, false);

mainSearchButton.on('click', () => {
  showSearchContainer();
});

searchBox.on('keyup', () => {
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
    mainSearch.clearHighlighting(this.fullText);
    searchBox.focus();
    this.highlightMatch(this.matches[this.matchNumber], this.searchString.length);
    scrollToMatch(this.matches[this.matchNumber]);
    searchBox.focus();
  }

  this.nextMatchDown = function() {
    this.matchNumber = (this.matchNumber + 1) % this.matches.length;
    console.log(this.matchNumber);
    mainSearch.clearHighlighting(this.fullText);
    this.highlightMatch(this.matches[this.matchNumber], this.searchString.length);
    scrollToMatch(this.matches[this.matchNumber]);
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
    this.matches = findMatches(this.fullText, this.searchString); 

    if (this.matches.length == 0) {
      return;
    }

    this.highlightMatch(this.matches[0], this.searchString.length);
    scrollToMatch(this.matches[0]);
    searchBox.focus();

    if (this.matches.length > 1) {
      if (!$('.search-arrow').hasClass('activated-search-arrow')) {
        $('.search-arrow').addClass('activated-search-arrow');
      }
      $('#search-down').on('click', this.nextMatchDown.bind(this));
      $('#search-up').on('click', this.nextMatchUp.bind(this));
    }
  }
} 

function isSeparator(key) {
  return wordSeparators.includes(key);
}

function isInList(word) {
  return Object.keys(inflections_map).includes(word);
}

function findMatches(text, searchString,
                     startIndex = 0) {
  let fragment = text.slice(startIndex);
  let fragmentMatchIndex = fragment.indexOf(searchString);
  if (fragmentMatchIndex == -1 || searchString == '') {
    return [];
  }
  let fullTextMatchIndex = fragmentMatchIndex + startIndex;
  startIndex = fullTextMatchIndex + 1
  return [fullTextMatchIndex].concat(findMatches(text,
                                         searchString,
                                         startIndex));
}

function scrollToMatch(startIndex) {
  let highlightedElement = document.querySelector('mark');
  highlightedElement.scrollIntoView({behavior: 'auto',
                                     block: 'center'});
}

function retrieveWord(wordStart, wordEnd) {
  let fullText = trixEditor.getDocument().toString();
  return fullText.slice(wordStart, wordEnd);
}

// selection ends just before the start of last index
function markListWord(startIndex, endIndex) {
  console.log('marking list word');
  trixEditor.setSelectedRange([startIndex,
                               endIndex]);
  trixEditor.activateAttribute('neilsListMatch');

  // to prevent list-word formatting from continuing as we type next word
  trixEditor.setSelectedRange([endIndex,
                               endIndex]);
  trixEditor.deactivateAttribute('neilsListMatch');
}

