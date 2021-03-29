import { AutoList } from './auto_list.js';
import { ListData } from './list_data.js';
import { OfficialList } from './official_list.js';
import { AssumedList } from './assumed_list.js';

function ListManager(listData) {
  this.officialList = new OfficialList(listData, this) 
  this.autoList = new AutoList(listData, this) 
  this.assumedList = new AssumedList(listData, this);

  this.activateListeners = function() {
    $('#assumed-list-title').on('click', () => {
      this.switchTo('assumed');
    });
    $('#auto-list-title').on('click', () => {
      this.switchTo('auto');
    });
  }

  this.activateListeners = function() {
    $('#assumed-list-title').on('click', () => {
      this.switchTo('assumed');
    });
    $('#auto-list-title').on('click', () => {
      this.switchTo('auto');
    });
  }

  this.switchTo = function(list) {
    switch (list) {
    case 'auto':
      if (this.autoList.isHidden()) {
        this.assumedList.hide();
        this.autoList.show();
      }
      break;
    case 'assumed':
      if (this.assumedList.isHidden()) {
        this.autoList.hide();
        this.assumedList.show();
      }
      break;
    }
  }

  this.activateListeners();
  this.autoList.activateListeners();
  this.assumedList.activateListeners();
  this.officialList.activateListeners();

  // Populate official word list with headwords
  this.officialList.showOfficialList(listData.headwords);
}


export { ListManager };
