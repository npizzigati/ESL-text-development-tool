import { MyList } from '../modules/my_list/my_list.js';
import { AutoList } from '../modules/auto_list.js';
import pkg from 'chai';
const { assert } = pkg;

/* eslint-disable max-len */

// describe('AutoList.prototype.updateRowLengths', function () {
//   it('should return an array of rowLengths from MyList.prototype.parsedLists', function () {
//     const myList = new MyList({}, {});
//     myList.rows = ['go be do eat'.split(' '), 'see try run'.split(' ')];
//     const listData = {};
//     listData.myList = myList;
//     const autoList = new AutoList(listData, {});

//     const expected = [4, 3];
//     autoList.updateRowLengths();
//     assert.equal(JSON.stringify(expected), JSON.stringify(actual));
//   });
// });

// describe('AutoList.prototype.buildSublists', function () {
//   it('should build sublists with the correct row lengths up to the end of the number of words in parsedLists', function () {
//     const myList = new MyList({}, {});
//     myList.parsedLists = {10: 'go be do eat'.split(' '), 20: 'see try run'.split(' ')};
//     myList.rows = ['go be do eat'.split(' '), 'see try run'.split(' ')];
//     const listData = {};
//     listData.myList = myList;
//     const autoList = new AutoList(listData, {});
//     listData.sublistHeadwords = 'one two three four five six seven'.split(' ');
//     const expected = {10: 'one two three four'.split(' '), 20: 'five six seven'.split(' ')};
//     const actual = autoList.buildSublists();
//     assert.equal(JSON.stringify(expected), JSON.stringify(actual));
//   });
// });

// describe('AutoList.prototype.buildSublists', function () {
//   it('should build sublists with the correct row lengths after exhausting row lengths in parsedLists', function () {
//     const myList = new MyList({}, {});
//     myList.parsedLists = {10: 'go be do eat'.split(' '), 20: 'see try run'.split(' ')};
//     myList.rows = ['go be do eat'.split(' '), 'see try run'.split(' ')];
//     const listData = {};
//     listData.myList = myList;
//     const autoList = new AutoList(listData, {});
//     listData.sublistHeadwords = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');
//     const expected = {10: 'one two three four'.split(' '), 20: 'five six seven'.split(' '), 30: 'eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen'.split(' '), 40: 'eighteen nineteen twenty'.split(' ')};
//     const actual = autoList.buildSublists();
//     assert.equal(JSON.stringify(expected), JSON.stringify(actual));
//   });
// });

describe('AutoList.prototype.buildSublists', function () {
  it('should build sublists with parseLists being empty', function () {
    const myList = new MyList({}, {});
    myList.parsedLists = {};
    const listData = {};
    listData.myList = myList;
    const autoList = new AutoList(listData, {});
    listData.sublistHeadwords = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');
    const expected = {10: 'one two three four five six seven eight nine ten'.split(' '), 20: 'eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ')};
    const actual = autoList.buildSublists();
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });
});


