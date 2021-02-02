import { MyList } from './my_list.js';
import { ListData } from './list_data.js';
import { OfficialList } from './official_list.js';

function ListManager(listData) {
  this.officialList = new OfficialList(listData, this) 
  this.myList = new MyList(listData, this) 
}

export { ListManager };
