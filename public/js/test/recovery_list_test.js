import { RecoveryList } from '../modules/recovery_list.js';
import pkg from 'chai';
const { assert } = pkg;
import sinon from 'sinon';
import sinonTest from 'sinon-test';
const test = sinonTest(sinon);

describe('RecoveryList#retrieveHtmlListItems', function() {
  it('should return array of one HMTL list item given one entry', function () {
    const timestamp = 1234567890;
    const filename = 'autosave-234234213434';
    const date = '3/1/2021';
    const time = '11:00 AM';
    const entries = {}; 
    entries[timestamp] = {
      date: date,
      time: time,
      filename: 'autosave-234234213434'
    }

    const htmlListItems = new RecoveryList(entries).retrieveHtmlListItems();
    const expected = JSON.stringify([`<li class="autosave-file clickable" id="${filename}">${date} - ${time}</li>`]);
    const actual = JSON.stringify(htmlListItems);
    assert.equal(expected, actual);
  });

  it('should return an array of HMTL list items ordered by timestamp (numerical order)', function () {
    const timestamp1 = 10;
    const filename1 = 'autosave-234234213434';
    const date1 = '3/1/2021';
    const time1 = '11:00 AM';

    const timestamp2 = 2;
    const filename2 = 'autosave-234234213435';
    const date2 = '3/1/2021';
    const time2 = '10:05 AM';


    const timestamp3 = 500;
    const filename3 = 'autosave-234234213436';
    const date3 = '3/1/2021';
    const time3 = '11:10 AM';

    const entries = {}; 
    entries[timestamp1] = {
      date: date1,
      time: time1,
      filename: filename1
    };

    entries[timestamp2] = {
      date: date2,
      time: time2,
      filename: filename2
    };

    entries[timestamp3] = {
      date: date3,
      time: time3,
      filename: filename3
    };

    const htmlListItems = new RecoveryList(entries).retrieveHtmlListItems();
    const expected = JSON.stringify([`<li class="autosave-file clickable" id="${filename3}">${date3} - ${time3}</li>`,
                                     `<li class="autosave-file clickable" id="${filename1}">${date1} - ${time1}</li>`,
                                     `<li class="autosave-file clickable" id="${filename2}">${date2} - ${time2}</li>`]);
    const actual = JSON.stringify(htmlListItems);
    assert.equal(expected, actual);
  });

  it('should return ordered array of the 20th most recent HMTL list items (according to timestamp)', function () {
    const timestamp2 = 2, filename2 = '34234213435', date2 = '3/2/2021', time2 = '11:01 AM';
    const timestamp3 = 3, filename3 = '34234213436', date3 = '3/3/2021', time3 = '11:02 AM';
    const timestamp4 = 4, filename4 = '34234213437', date4 = '3/4/2021', time4 = '11:03 AM';
    const timestamp5 = 5, filename5 = '34234213438', date5 = '3/5/2021', time5 = '11:04 AM';
    const timestamp6 = 6, filename6 = '34234213439', date6 = '3/6/2021', time6 = '11:05 AM';
    const timestamp7 = 7, filename7 = '342342134310', date7 = '3/7/2021', time7 = '11:06 AM';
    const timestamp8 = 8, filename8 = '342342134311', date8 = '3/8/2021', time8 = '11:07 AM';
    const timestamp9 = 9, filename9 = '342342134312', date9 = '3/9/2021', time9 = '11:10 AM';
    const timestamp10 = 10, filename10 = '342342134313', date10 = '3/10/2021', time10 = '11:11 AM';
    const timestamp11 = 11, filename11 = '342342134314', date11 = '3/11/2021', time11 = '11:12 AM';
    const timestamp12 = 12, filename12 = '342342134315', date12 = '3/12/2021', time12 = '11:13 AM';
    const timestamp13 = 13, filename13 = '342342134316', date13 = '3/13/2021', time13 = '11:14 AM';
    const timestamp14 = 14, filename14 = '342342134317', date14 = '3/14/2021', time14 = '11:15 AM';
    const timestamp15 = 15, filename15 = '342342134318', date15 = '3/15/2021', time15 = '11:16 AM';
    const timestamp16 = 16, filename16 = '342342134319', date16 = '3/16/2021', time16 = '11:17 AM';
    const timestamp17 = 17, filename17 = '342342134320', date17 = '3/17/2021', time17 = '11:20 AM';
    const timestamp18 = 18, filename18 = '342342134321', date18 = '3/18/2021', time18 = '11:21 AM';
    const timestamp19 = 19, filename19 = '342342134322', date19 = '3/19/2021', time19 = '11:22 AM';
    const timestamp20 = 20, filename20 = '342342134323', date20 = '3/20/2021', time20 = '11:23 AM';
    const timestamp21 = 21, filename21 = '342342134324', date21 = '3/21/2021', time21 = '11:24 AM';
    const timestamp22 = 22, filename22 = '342342134325', date22 = '3/22/2021', time22 = '11:25 AM';
    const timestamp23 = 23, filename23 = '342342134326', date23 = '3/23/2021', time23 = '11:26 AM';


    const entries = {}; 
    entries[timestamp22] = { date: date22, time: time22, filename: filename22 };
    entries[timestamp2] =  { date: date2, time: time2, filename: filename2 };
    entries[timestamp21] = { date: date21, time: time21, filename: filename21 };
    entries[timestamp3] =  { date: date3, time: time3, filename: filename3 };
    entries[timestamp4] =  { date: date4, time: time4, filename: filename4 };
    entries[timestamp5] =  { date: date5, time: time5, filename: filename5 };
    entries[timestamp12] = { date: date12, time: time12, filename: filename12 };
    entries[timestamp6] =  { date: date6, time: time6, filename: filename6 };
    entries[timestamp18] = { date: date18, time: time18, filename: filename18 };
    entries[timestamp7] =  { date: date7, time: time7, filename: filename7 };
    entries[timestamp9] =  { date: date9, time: time9, filename: filename9 };
    entries[timestamp8] =  { date: date8, time: time8, filename: filename8 };
    entries[timestamp10] = { date: date10, time: time10, filename: filename10 };
    entries[timestamp11] = { date: date11, time: time11, filename: filename11 };
    entries[timestamp13] = { date: date13, time: time13, filename: filename13 };
    entries[timestamp14] = { date: date14, time: time14, filename: filename14 };
    entries[timestamp15] = { date: date15, time: time15, filename: filename15 };
    entries[timestamp16] = { date: date16, time: time16, filename: filename16 };
    entries[timestamp17] = { date: date17, time: time17, filename: filename17 };
    entries[timestamp19] = { date: date19, time: time19, filename: filename19 };
    entries[timestamp20] = { date: date20, time: time20, filename: filename20 };
    entries[timestamp23] = { date: date23, time: time23, filename: filename23 };


    const htmlListItems = new RecoveryList(entries).retrieveHtmlListItems();
    const expected = JSON.stringify([`<li class="autosave-file clickable" id="${filename23}">${date23} - ${time23}</li>`,
                                     `<li class="autosave-file clickable" id="${filename22}">${date22} - ${time22}</li>`,
                                     `<li class="autosave-file clickable" id="${filename21}">${date21} - ${time21}</li>`,
                                     `<li class="autosave-file clickable" id="${filename20}">${date20} - ${time20}</li>`,
                                     `<li class="autosave-file clickable" id="${filename19}">${date19} - ${time19}</li>`,
                                     `<li class="autosave-file clickable" id="${filename18}">${date18} - ${time18}</li>`,
                                     `<li class="autosave-file clickable" id="${filename17}">${date17} - ${time17}</li>`,
                                     `<li class="autosave-file clickable" id="${filename16}">${date16} - ${time16}</li>`,
                                     `<li class="autosave-file clickable" id="${filename15}">${date15} - ${time15}</li>`,
                                     `<li class="autosave-file clickable" id="${filename14}">${date14} - ${time14}</li>`,
                                     `<li class="autosave-file clickable" id="${filename13}">${date13} - ${time13}</li>`,
                                     `<li class="autosave-file clickable" id="${filename12}">${date12} - ${time12}</li>`,
                                     `<li class="autosave-file clickable" id="${filename11}">${date11} - ${time11}</li>`,
                                     `<li class="autosave-file clickable" id="${filename10}">${date10} - ${time10}</li>`,
                                     `<li class="autosave-file clickable" id="${filename9}">${date9} - ${time9}</li>`,
                                     `<li class="autosave-file clickable" id="${filename8}">${date8} - ${time8}</li>`,
                                     `<li class="autosave-file clickable" id="${filename7}">${date7} - ${time7}</li>`,
                                     `<li class="autosave-file clickable" id="${filename6}">${date6} - ${time6}</li>`,
                                     `<li class="autosave-file clickable" id="${filename5}">${date5} - ${time5}</li>`,
                                     `<li class="autosave-file clickable" id="${filename4}">${date4} - ${time4}</li>`]);
    const actual = JSON.stringify(htmlListItems);
    assert.equal(expected, actual);
  });
});


describe('#deleteOldListItems', function() {
  it('Should call localStorage#removeItem on the keys older than the first 20', test(function () {
    const timestamp2 = 2, filename2 = '34234213435', date2 = '3/2/2021', time2 = '11:01 AM';
    const timestamp3 = 3, filename3 = '34234213436', date3 = '3/3/2021', time3 = '11:02 AM';
    const timestamp4 = 4, filename4 = '34234213437', date4 = '3/4/2021', time4 = '11:03 AM';
    const timestamp5 = 5, filename5 = '34234213438', date5 = '3/5/2021', time5 = '11:04 AM';
    const timestamp6 = 6, filename6 = '34234213439', date6 = '3/6/2021', time6 = '11:05 AM';
    const timestamp7 = 7, filename7 = '342342134310', date7 = '3/7/2021', time7 = '11:06 AM';
    const timestamp8 = 8, filename8 = '342342134311', date8 = '3/8/2021', time8 = '11:07 AM';
    const timestamp9 = 9, filename9 = '342342134312', date9 = '3/9/2021', time9 = '11:10 AM';
    const timestamp10 = 10, filename10 = '342342134313', date10 = '3/10/2021', time10 = '11:11 AM';
    const timestamp11 = 11, filename11 = '342342134314', date11 = '3/11/2021', time11 = '11:12 AM';
    const timestamp12 = 12, filename12 = '342342134315', date12 = '3/12/2021', time12 = '11:13 AM';
    const timestamp13 = 13, filename13 = '342342134316', date13 = '3/13/2021', time13 = '11:14 AM';
    const timestamp14 = 14, filename14 = '342342134317', date14 = '3/14/2021', time14 = '11:15 AM';
    const timestamp15 = 15, filename15 = '342342134318', date15 = '3/15/2021', time15 = '11:16 AM';
    const timestamp16 = 16, filename16 = '342342134319', date16 = '3/16/2021', time16 = '11:17 AM';
    const timestamp17 = 17, filename17 = '342342134320', date17 = '3/17/2021', time17 = '11:20 AM';
    const timestamp18 = 18, filename18 = '342342134321', date18 = '3/18/2021', time18 = '11:21 AM';
    const timestamp19 = 19, filename19 = '342342134322', date19 = '3/19/2021', time19 = '11:22 AM';
    const timestamp20 = 20, filename20 = '342342134323', date20 = '3/20/2021', time20 = '11:23 AM';
    const timestamp21 = 21, filename21 = '342342134324', date21 = '3/21/2021', time21 = '11:24 AM';
    const timestamp22 = 22, filename22 = '342342134325', date22 = '3/22/2021', time22 = '11:25 AM';
    const timestamp23 = 23, filename23 = '342342134326', date23 = '3/23/2021', time23 = '11:26 AM';

    const entries = {}; 
    entries[timestamp2] =  { date: date2, time: time2, filename: filename2 };
    entries[timestamp3] =  { date: date3, time: time3, filename: filename3 };
    entries[timestamp4] =  { date: date4, time: time4, filename: filename4 };
    entries[timestamp5] =  { date: date5, time: time5, filename: filename5 };
    entries[timestamp6] =  { date: date6, time: time6, filename: filename6 };
    entries[timestamp7] =  { date: date7, time: time7, filename: filename7 };
    entries[timestamp9] =  { date: date9, time: time9, filename: filename9 };
    entries[timestamp8] =  { date: date8, time: time8, filename: filename8 };
    entries[timestamp10] = { date: date10, time: time10, filename: filename10 };
    entries[timestamp11] = { date: date11, time: time11, filename: filename11 };
    entries[timestamp12] = { date: date12, time: time12, filename: filename12 };
    entries[timestamp13] = { date: date13, time: time13, filename: filename13 };
    entries[timestamp14] = { date: date14, time: time14, filename: filename14 };
    entries[timestamp15] = { date: date15, time: time15, filename: filename15 };
    entries[timestamp16] = { date: date16, time: time16, filename: filename16 };
    entries[timestamp17] = { date: date17, time: time17, filename: filename17 };
    entries[timestamp18] = { date: date18, time: time18, filename: filename18 };
    entries[timestamp19] = { date: date19, time: time19, filename: filename19 };
    entries[timestamp20] = { date: date20, time: time20, filename: filename20 };
    entries[timestamp21] = { date: date21, time: time21, filename: filename21 };
    entries[timestamp22] = { date: date22, time: time22, filename: filename22 };
    entries[timestamp23] = { date: date23, time: time23, filename: filename23 };

    const Store = function() {
      this.removeItem = function() {};
    }

    global.localStorage = new Store;

    // Spy
    const removeItemSpy = sinon.spy(global.localStorage, 'removeItem');
    new RecoveryList(entries).deleteOldListItems();
    assert.equal(removeItemSpy.callCount, 2);
    assert.equal(removeItemSpy.calledWith('22'), true);
    assert.equal(removeItemSpy.calledWith('23'), true);
  }));
});
