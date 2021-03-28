import { AutoList } from './my_list.js';
import { ListData } from './list_data.js';
import { OfficialList } from './official_list.js';

function ListManager(listData) {
  this.officialList = new OfficialList(listData, this) 
  this.autoList = new AutoList(listData, this) 
  this.autoList.activateListeners();
  this.officialList.activateListeners();

  // Populate official word list with headwords
  this.officialList.showOfficialList(listData.headwords);
}


export { ListManager };
