const trixElement = document.querySelector("trix-editor")
const trixEditor = trixElement.editor;
const searchIconContainer = $('.search-icon-container');
const searchBox = $('#search-box');
const searchBoxContainer = $('.search-box-container');

function isEscape(key) {
  return key === "Escape" || key === "Esc";
}

function isEmpty(arr) {
  return arr.length == 0;
}

function last(arr) {
  return arr[arr.length - 1]
}

const mainSearch = {
  highlightedRanges: [],
  previousHighlightStart: null,
  searcher: null,
  setPreviousHighlightStart: function() {
    if (isEmpty(this.highlightedRanges)) {
      return;
    }
    this.previousHighlightStart = last(this.highlightedRanges)[0];
  },
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

function activateSearchListeners() {
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
}

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

// export { mainSearch, exitSearch, activateSearchListeners, hideSearchContainer, showSearchContainer, Searcher };
export { activateSearchListeners };
