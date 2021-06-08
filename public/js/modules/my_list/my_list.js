import { Autosave } from './autosave.js';

function MyList(listData, listManager) {

  this.refresh = function () {
    $('#my-list-table').remove();
    const parts = [];
    parts.push('<table id="my-list-table">');
    parts.push('<tbody class="my-list-table-body">');
    parts.push('<tr>');
    parts.push(`<td>10</td>`);
    parts.push(`<td>Some words here</td>`);
    parts.push('</tr>');
    parts.push('</tbody></table>');
    $('.my-list').append(parts.join(''));
  };

  this.readFile = function (input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.readAsText(file);

    reader.onload = function () {
      console.log(reader.result);
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
