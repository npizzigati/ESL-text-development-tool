import { AutoList } from './auto_list.js';
// import { ListData } from './list_data.js';
import { OfficialList } from './official_list.js';
import { AssumedList } from './assumed_list.js';
import { MyList } from './my_list/my_list.js';
import { Highlighter } from './highlighter.js';

function ListManager(listData) {
  this.officialList = new OfficialList(listData, this);
  this.autoList = new AutoList(listData, this);
  this.assumedList = new AssumedList(listData, this);
  this.myList = new MyList(listData, this);
  this.highlighter = new Highlighter(listData, this.officialList);

  this.activateListeners = function() {
    $('#assumed-list-title').on('click', () => {
      this.switchTo('assumed');
    });
    $('#auto-list-title').on('click', () => {
      this.switchTo('auto');
    });
  };

  this.activateListeners = function() {
    $('#assumed-list-title').on('click', () => {
      this.switchTo('assumed');
    });
    $('#auto-list-title').on('click', () => {
      this.switchTo('auto');
    });
    $('#my-list-title').on('click', () => {
      this.switchTo('my');
    });
  };

  this.activateSpecialListListeners = function () {
    $('.special-lists').off();
    // This listener applies to the "auto-list"
    $('.special-lists').on('click', '.auto-sublist-number', event => {
      const sublistNumber = parseInt($(event.target).text(), 10);
      const selectedHeadwords = this.autoList.sublists[sublistNumber];
      this.highlighter.executeHighlight(selectedHeadwords);
    });
    // The following listener is shared by the "auto list" and "my list"
    $('.special-lists').on('click', '.clickable-individual-word', event => {
      const downcasedHeadword = $(event.target).text().toLowerCase();
      this.highlighter.executeHighlight([downcasedHeadword]);
    });
  };

  this.switchTo = function(list) {
    switch (list) {
      case 'auto':
        if (this.autoList.isHidden()) {
          this.assumedList.hide();
          this.myList.hide();
          this.autoList.show();
        }
        break;
      case 'assumed':
        if (this.assumedList.isHidden()) {
          this.autoList.hide();
          this.myList.hide();
          this.assumedList.show();
        }
        break;
      case 'my':
        if (this.myList.isHidden()) {
          this.autoList.hide();
          this.assumedList.hide();
          this.myList.show();
        }
        break;
    }
  };

  this.activateListeners();
  this.activateSpecialListListeners();
  this.assumedList.activateListeners();
  this.officialList.activateListeners();

  // Populate official word list with headwords
  this.officialList.showOfficialList(listData.headwords);
}


export { ListManager };
