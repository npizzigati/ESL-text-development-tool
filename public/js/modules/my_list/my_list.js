import { ListString, BadInputError} from './list_parser.js';
import { Autosave } from '../autosave.js';

function MyList(listData, listManager) {
  this.parsedList = [];

  this.refresh = function () {
    $('#my-list-table').remove();
    const parts = this.buildParts();
    console.log('parts: '.concat(JSON.stringify(parts)));
    $('.my-list').append(parts.join(''));
  };

  this.buildParts = function () {
    console.log('building parts');
    console.log('parsedList.length '.concat(this.parsedList.length));
    if (this.parsedList.length === 0) return [];

    const parts = [];
    parts.push('<table id="my-list-table">');
    parts.push('<tbody class="my-list-table-body">');
    const rows = this.buildRows();
    parts.push(rows);
    parts.push('</tbody></table>');
    return parts;
  };

  this.buildRows = function () {
    const rowArray = this.parsedList.map((words, index) => {
      const row = [];
      const lineNumber = (index + 1) * 10;
      const rowContents = words.join(' ');
      row.push('<tr>');
      row.push(`<td>${lineNumber}</td>`);
      row.push(`<td>${rowContents}</td>`);
      row.push('</tr>');
      return row.join('');
    });
    return rowArray.join('');
  };

  this.readFile = function (input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.readAsText(file);

    reader.onload = () => {
      const wordList = reader.result;
      this.parsedList = new ListString(wordList).parse();
      // Should handle any errors I throw

      this.refresh();
    };

    reader.onerror = function() {
      console.log(reader.error);
    };

    this.hideFileChooser();
  };

  this.setUp = function() {
    this.refresh();
    this.displayFileChooser();
    this.activateListeners();
    this.hide();
  };

  this.displayFileChooser = function () {
    $('#my-list-chooser').css('display', 'inline');
  };

  this.hideFileChooser = function () {
    $('#my-list-chooser').css('display', 'none');
  };

  this.isHidden = function() {
    return $('.my-list').css('display') === 'none';
  };

  this.show = function() {
    $('.my-list').css('display', 'block');
    $('#my-list-title').addClass('active-list-title');
  };

  this.hide = function() {
    $('#my-list-title').removeClass('active-list-title');
    $('.my-list').css('display', 'none');
  };

  this.activateListeners = function () {
    $('.special-lists').on('change', '#my-list-chooser', event => {
      this.readFile(event.target);
    });
  };
}

export { MyList };
