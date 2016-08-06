'use strict';

$(document).ready(function () {
  $.ajax({
    method: 'POST',
    url: 'server.php',
    data: {
      request: 'listRoms'
    }
  })
  .done(function(msg) {
    var roms = JSON.parse(msg);

    var selections = $('#selections');
    roms.forEach(function (rom) { 
      selections.append('<li>' + rom.substr(0, rom.length - 4) + '</li>');
    });
  });

  /**
   * Search filter
   */
  $('#search').on('change keyup paste', function () {
    var searchterm = $(this).val().toLowerCase();
    $('ul').children().each(function () {
      var hide = $(this).text().toLowerCase().indexOf(searchterm) < 0;
      $(this).toggleClass('hidden', hide);
    });
  });

  
});
