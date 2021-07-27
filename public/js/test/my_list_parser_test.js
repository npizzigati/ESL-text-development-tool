import { MyListString, BadInputError } from '../modules/my_list/my_list_parser.js';
import pkg from 'chai';
const { assert } = pkg;
// import sinon from 'sinon';
// import sinonTest from 'sinon-test';
// const test = sinonTest(sinon);

describe('ListParser.parse', function() {
  it('should return an array of word list objects keyed by id and with words array as value', function () {
    const wordList = ' 10: And Be Day / From Good How I That Where You\r\n' +
                     ' 20: A Do Can Go Have Help Hear Here Need Problem';
    const expected = {10: ['And', 'Be', 'Day', 'From', 'Good', 'How', 'I', 'That',
                           'Where', 'You'],
                      20: ['A', 'Do', 'Can', 'Go', 'Have', 'Help', 'Hear', 'Here',
                           'Need', 'Problem']};
    const actual = new MyListString(wordList).parse();
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });

  it('should throw an error message if there are duplicated words in the input', function () {
    const wordList = ' 10: And Be Day From In/On Good How I That Where You\r\n' +
                     ' 20: A Do Can Go Have Help Hear On Here Need Problem';
    const errorMatcher = /is repeated/;
    assert.throws(() => {
      return new MyListString(wordList).parse();
    }, BadInputError, errorMatcher);
  });

  it('should throw an error message if there are unexpected characters in the input', function () {
    const wordList = '10: And Be Day? Night Good How I That Where';
    const errorMatcher = /Invalid character/;
    assert.throws(() => {
      return new MyListString(wordList).parse();
    }, BadInputError, errorMatcher);
  });

  it('should remove an empty line at the end of a string', function () {
    const wordList = '10: And Be Day From Good How I That Where You\n' +
          '20: A Do Can Go Have Help Hear Here Need Problem\n';
    const expected = {10: ['And', 'Be', 'Day', 'From', 'Good', 'How', 'I', 'That',
                           'Where', 'You'],
                      20: ['A', 'Do', 'Can', 'Go', 'Have', 'Help', 'Hear', 'Here',
                           'Need', 'Problem']};
    const actual = new MyListString(wordList).parse();
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });

  it('should remove multiple empty lines at the end of a string', function () {
    const wordList = '10: And Be Day From Good How I That Where You\n' +
          '20: A Do Can Go Have Help Hear Here Need Problem\n\n';
    const expected = {10: ['And', 'Be', 'Day', 'From', 'Good', 'How', 'I', 'That',
                           'Where', 'You'],
                      20: ['A', 'Do', 'Can', 'Go', 'Have', 'Help', 'Hear', 'Here',
                           'Need', 'Problem']};
    const actual = new MyListString(wordList).parse();
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });

});
