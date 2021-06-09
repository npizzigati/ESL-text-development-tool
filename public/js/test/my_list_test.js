import { MyList } from '../modules/my_list/my_list.js';
import pkg from 'chai';
const { assert } = pkg;
// import sinon from 'sinon';
// import sinonTest from 'sinon-test';
// const test = sinonTest(sinon);

describe('myList.buildRows', function () {
  it('should produce a string consisting of multiple rows', function () {
    const myList = new MyList({}, {});
    myList.parsedList = ['hi there you'.split(' '), 'are you happy'.split(' ')];
    const expected = '<tr><td>10</td><td>hi there you</td></tr>' +
                     '<tr><td>20</td><td>are you happy</td></tr>';
    const actual = myList.buildRows();
    assert.equal(expected, actual);
  });
});
