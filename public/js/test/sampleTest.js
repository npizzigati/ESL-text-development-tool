import { sample } from '../sample.js';

import pkg from 'chai';
const { assert } = pkg;

describe('Basic Mocha String Test', function () {
  it('should return number of charachters in a string', function () {
    const num = 4;
    const expected = 10;
    const actual = sample(num);
    assert.equal(expected, actual);
  });
});


