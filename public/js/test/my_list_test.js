import { MyList } from '../modules/my_list/my_list.js';
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

describe('MyList.prototype.buildRows', function () {
  it('should produce a string consisting of multiple rows', function () {
    const myList = new MyList({}, {});
    myList.autoListHeadwords = ['hi', 'bye', 'go'];
    myList.taggedList = ['hi there you'.split(' '), 'are you happy'.split(' ')];
    const expected = ['<tr><td>10</td><td>hi, there, you</td></tr>', '<tr><td>20</td><td>are, you, happy</td></tr>'];
    const actual = myList.buildRows();
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });
});

describe('MyList.prototype.addInitialTags', function () {
  it('should add opening and closing span tags with ids to list words', function () {
    const myList = new MyList({}, {});
    const parsedList = ['hi there you'.split(' '), 'are you happy'.split(' ')];
    const expected = ['<span id="hi">hi</span>,<span id="there">there</span>,<span id="you">you</span>'.split(','), '<span id="are">are</span>,<span id="you">you</span>,<span id="happy">happy</span>'.split(',')];
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
    const actual = myList.findRowIndex(headword);
    assert.equal(expected, actual);
  });

  it('should return -1 if word not found in any row', function () {
    const myList = new MyList({}, {});
    myList.rows = ['<tr><td>10</td><td>hi, there, you</td></tr>', '<tr><td>20</td><td>are, you, happy</td></tr>'];
    const headword = 'president';
    const expected = -1;
    const actual = myList.findRowIndex(headword);
    assert.equal(expected, actual);
  });
});

describe('MyList.prototype.isHeadwordInCorrectRow', function () {
  it('should return true for headword index 3 and row 0', function () {
    const myList = new MyList({}, {});
    const headwordIndex = 3;
    const rowIndex = 0;

    const expected = true;
    const actual = myList.isHeadwordInCorrectRow(headwordIndex, rowIndex);
    assert.equal(expected, actual);
  });

  it('should return false for headword index 3 and row 1', function () {
    const myList = new MyList({}, {});
    const headwordIndex = 3;
    const rowIndex = 1;

    const expected = false;
    const actual = myList.isHeadwordInCorrectRow(headwordIndex, rowIndex);
    assert.equal(expected, actual);
  });

  it('should return true for headword index 11 and row 1', function () {
    const myList = new MyList({}, {});
    const headwordIndex = 11;
    const rowIndex = 1;

    const expected = true;
    const actual = myList.isHeadwordInCorrectRow(headwordIndex, rowIndex);
    assert.equal(expected, actual);
  });
});
