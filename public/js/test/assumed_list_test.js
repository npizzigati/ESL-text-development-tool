import { AssumedList } from '../modules/assumed_list.js';
import pkg from 'chai';
const { assert } = pkg;

describe('AssumedList.prototype.parse', function () {
  it('should produce an array of words', function () {
    const assumedList = new AssumedList({}, {});
    const fileString = "go\ncome\neat";
    const actual = assumedList.parse(fileString);
    const expected = [ 'go', 'come', 'eat'];
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });

  it('should remove empty lines', function () {
    const assumedList = new AssumedList({}, {});
    const fileString = "go\ncome\neat\n\n\n\n";
    const actual = assumedList.parse(fileString);
    const expected = [ 'go', 'come', 'eat'];
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });

  it('should remove non letter characters', function () {
    const assumedList = new AssumedList({}, {});
    const fileString = "go\nco4me\neat5\n";
    const actual = assumedList.parse(fileString);
    const expected = [ 'go', 'come', 'eat'];
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });

  it('should split on CRLF', function () {
    const assumedList = new AssumedList({}, {});
    const fileString = "go\r\ncome\r\neat\r\n";
    const actual = assumedList.parse(fileString);
    const expected = [ 'go', 'come', 'eat'];
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });
});
