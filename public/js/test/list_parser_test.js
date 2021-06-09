import { ListString, BadInputError } from '../modules/my_list/list_parser.js';
import pkg from 'chai';
const { assert } = pkg;
// import sinon from 'sinon';
// import sinonTest from 'sinon-test';
// const test = sinonTest(sinon);

describe('ListParser.parse', function() {
  it('should return an array of word lists', function () {
    const wordList = ' 10: And Be Day From Good How I That Where You\r\n' +
                     ' 20: A Do Can Go Have Help Hear Here Need Problem';
    const expected = [['And', 'Be', 'Day', 'From', 'Good', 'How', 'I', 'That',
                       'Where', 'You'],
                      ['A', 'Do', 'Can', 'Go', 'Have', 'Help', 'Hear', 'Here',
                       'Need', 'Problem']];
    const actual = new ListString(wordList).parse();
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });

  it('should return a BadInputError if there are more than ten words on any line', function () {
    const wordList = '10: And Be Day From Good How I That Where You Eat\r\n' +
                     '20: A Do Can Go Have Help Hear Here Need Problem Work';
    const errorMatcher = /Too many/;
    assert.throws(() => {
      return new ListString(wordList).parse();
    }, BadInputError, errorMatcher);
  });

  it('should throw an error message if there are fewer than 10 words on any line', function () {
    const wordList = '10: And Be Day From Good How I That Where You\r\n' +
                     '20: A Do Can Go Have Help Hear Here Need';
    const errorMatcher = /Too few/;
    assert.throws(() => {
      return new ListString(wordList).parse();
    }, BadInputError, errorMatcher);
  });

  it('should throw an error message if there are unexpected characters in the input', function () {
    const wordList = '10: And Be Day / Night Good How I That Where';
    const errorMatcher = /Invalid character/;
    assert.throws(() => {
      return new ListString(wordList).parse();
    }, BadInputError, errorMatcher);
  });

  it('should remove an empty line at the end of a string', function () {
    const wordList = '10: And Be Day From Good How I That Where You\n' +
          '20: A Do Can Go Have Help Hear Here Need Problem\n';
    const expected = [['And', 'Be', 'Day', 'From', 'Good', 'How', 'I', 'That',
                       'Where', 'You'],
                      ['A', 'Do', 'Can', 'Go', 'Have', 'Help', 'Hear', 'Here',
                       'Need', 'Problem']];
    const actual = new ListString(wordList).parse();
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });

  it('should remove multiple empty lines at the end of a string', function () {
    const wordList = '10: And Be Day From Good How I That Where You\n' +
          '20: A Do Can Go Have Help Hear Here Need Problem\n\n';
    const expected = [['And', 'Be', 'Day', 'From', 'Good', 'How', 'I', 'That',
                       'Where', 'You'],
                      ['A', 'Do', 'Can', 'Go', 'Have', 'Help', 'Hear', 'Here',
                       'Need', 'Problem']];
    const actual = new ListString(wordList).parse();
    assert.equal(JSON.stringify(expected), JSON.stringify(actual));
  });

});
