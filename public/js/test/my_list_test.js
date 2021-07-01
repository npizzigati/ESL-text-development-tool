import { MyList } from '../modules/my_list/my_list.js';
import { AutoList } from '../modules/auto_list.js';
import pkg from 'chai';
const { assert } = pkg;
// import pkg2 from 'jsdom';
// const { JSDOM } = pkg2;
// const { window } = new JSDOM('<!DOCTYPE html><p></p>');
// import $ from 'jquery';
// global.$ = $(window);

// import sinon from 'sinon';
// import sinonTest from 'sinon-test';
// const test = sinonTest(sinon);

/* eslint-disable max-len */

describe('MyList.prototype.buildRowStrings', function () {
  it('should produce an array of string rows', function () {
    const myList = new MyList({}, {});
    myList.taggedLists = {10: '<span id="my-list-hi">hi</span>,<span id="my-list-there">there</span>,<span id="my-list-you">you</span>'.split(',')}
    const expected = ['<tr><td>10</td><td><span id="my-list-hi">hi</span>, <span id="my-list-there">there</span>, <span id="my-list-you">you</span></td></tr>'];
    const actual = myList.buildRowStrings();
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });
});

describe('MyList.prototype.addInitialTags', function () {
  it('should add opening and closing span tags with ids to list words', function () {
    const myList = new MyList({}, {});
    const parsedList = {10: 'hi there you'.split(' '), 20: 'are you happy'.split(' ')};
    const expected = {10: '<span id="my-list-hi" class="clickable-individual-word">hi</span>,<span id="my-list-there" class="clickable-individual-word">there</span>,<span id="my-list-you" class="clickable-individual-word">you</span>'.split(','),
                      20: '<span id="my-list-are" class="clickable-individual-word">are</span>,<span id="my-list-you" class="clickable-individual-word">you</span>,<span id="my-list-happy" class="clickable-individual-word">happy</span>'.split(',')};
    const actual = myList.addInitialTags(parsedList);
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });
});

describe('MyList.prototype.findRowIndex', function () {
  it('should find the mylist row index of the autolist headword', function () {
    const myList = new MyList({}, {});
    myList.rows = ['<tr><td>10</td><td>hi, there, you</td></tr>', '<tr><td>20</td><td>are, you, happy</td></tr>'];
    const headword = 'are';
    const expected = 1;
    const actual = myList.findRowIndex(myList.rows, headword);
    assert.equal(expected, actual);
  });

  it('should return -1 if word not found in any row', function () {
    const myList = new MyList({}, {});
    myList.rows = ['<tr><td>10</td><td>hi, there, you</td></tr>', '<tr><td>20</td><td>are, you, happy</td></tr>'];
    const headword = 'president';
    const expected = -1;
    const actual = myList.findRowIndex(myList.rows, headword);
    assert.equal(expected, actual);
  });
});

describe('MyList.prototype.isHeadwordInCorrectRow', function () {
  it('should return true when indices of myList and autoList rows match', function () {
    // const myList = new MyList({}, {});
    // myList.parsedLists = {10: 'go be do eat'.split(' '), 20: 'see try run'.split(' ')};
    const autoList = {};
    autoList.rowEntries = [[10, 'go be do eat'.split(' ')], [20, 'see try run'.split(' ')]];
    const listManager = {};
    listManager.autoList = autoList;
    const myList = new MyList({}, listManager);

    const myListRowIndex = 1;
    const headword = 'see';

    const expected = true;
    const actual = myList.isHeadwordInCorrectRow(myListRowIndex, headword);
    assert.equal(expected, actual);
  });

  it('should return true when indices of myList and autoList rows match 2', function () {
    // const myList = new MyList({}, {});
    // myList.parsedLists = {10: 'go be do eat'.split(' '), 20: 'see try run'.split(' ')};
    const autoList = {};
    autoList.rowEntries = [[10, 'go be do eat'.split(' ')], [20, 'see try run'.split(' ')]];
    const listManager = {};
    listManager.autoList = autoList;
    const myList = new MyList({}, listManager);

    const myListRowIndex = 0;
    const headword = 'eat';

    const expected = true;
    const actual = myList.isHeadwordInCorrectRow(myListRowIndex, headword);
    assert.equal(expected, actual);
  });

});
