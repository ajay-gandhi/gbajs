var gba;
var runCommands = [];

try {
  gba = new GameBoyAdvance();
  gba.keypad.eatInput = true;
  gba.setLogger(function(error) {
    console.log(error);
    gba.pause();
    var screen = document.getElementById('screen');
    if (screen.getAttribute('class') == 'dead') {
      console.log('We appear to have crashed multiple times without reseting.');
      return;
    }
    var crash = document.createElement('img');
    crash.setAttribute('id', 'crash');
    crash.setAttribute('src', 'resources/crash.png');
    screen.parentElement.insertBefore(crash, screen);
    screen.setAttribute('class', 'dead');
  });
} catch (exception) {
  gba = null;
}

var update_canvas_size = function () {
  // Make canvas as big as possible
  var ratio = 1.5; // = width / height
  if ($(window).width() > $(window).height()) {
    $('#orientation').removeClass('portrait').addClass('landscape');
    var w = $(window).width() - 350;
    var h = ($(window).width() - 350) / ratio;
    if (h > $(window).height()) {
      h = $(window).height();
      w = h * ratio;
    }
    var marginTop = ($(window).height() - h) / 2;
    $('canvas').attr('width', w);
    $('canvas').attr('height', h);
    $('canvas').css('marginTop', marginTop);
    $('.landscape #controls').css('top', ($(window).height() - 350) / 2 + 'px');
  } else {
    $('#orientation').removeClass('landscape').addClass('portrait');
    $('canvas').attr('width', $(window).width());
    $('canvas').attr('height', $(window).width() / ratio);
  }
}

var CURRENT_ROM;

$(document).ready(function() {
  window.addEventListener("orientationchange", update_canvas_size, false);
  update_canvas_size();

  if (gba && FileReader) {
    var canvas = document.getElementById('screen');
    gba.setCanvas(canvas);

    gba.logLevel = gba.LOG_ERROR;
    // report fps
    // gba.reportFPS = function(fps) {
    //   var counter = document.getElementById('fps');
    //   counter.textContent = Math.floor(fps);
    // };

    loadRom('resources/bios.bin', function(bios) {
      gba.setBios(bios);
    });

    if (!gba.audio.context) {
      // Remove the sound box if sound isn't available
      var soundbox = document.getElementById('sound');
      soundbox.parentElement.removeChild(soundbox);
    }

    if (window.navigator.appName == 'Microsoft Internet Explorer') {
      // Remove the pixelated option if it doesn't work
      var pixelatedBox = document.getElementById('pixelated');
      pixelatedBox.parentElement.removeChild(pixelatedBox);
    }

    // Parse querystring
    var qs = window.location.search.substring(1).split('&');
    CURRENT_ROM = qs.shift().split('=').pop();

    if (qs.length) {

      // Load savegame, then rom
      var save = qs.shift().split('=').pop();
      $('#menu #save-name').val(save);
      var is_local = qs.shift().split('=').pop() === 'true';
      if (is_local) {
        // Load from localStorage
        runCommands.push(function () {
          gba.loadLocal(CURRENT_ROM, save);
        });
        start_game(CURRENT_ROM);

      } else {
        // Get from server
        loadRom('saves/' + save + '|' + CURRENT_ROM, function (e) {
          runCommands.push(function () {
            gba.setSavedata(e);
          });

          // Load rom
          start_game(CURRENT_ROM);
        });
      }
    } else {
      // Just load rom
      start_game(CURRENT_ROM);
    }
  } else {
    console.error('GBA failed.');
  }

  // Menu events
  $('#menu-open').click(function () {
    gba.pause();
    $('<div class="cover" id="cover-dark"></div>')
      .appendTo('body')
      .fadeTo(400, 0.90);
    $('#menu').fadeIn(400);
  });
  $('#menu #close').click(function () {
    $('#cover-dark').fadeTo(400, 0, 'swing', function () {
      $(this).remove();
    });
    $('#menu').fadeOut(300);
    setTimeout(function () {
      gba.runStable();
    }, 500);
  });

  var save_type_fadeout = null;
  $('#save-interface #offline-save').change(function () {
    var is_offline = $(this).is(':checked');
    window.clearTimeout(save_type_fadeout);
    $('#save-interface #save-type')
      .stop()
      .text(is_offline ? 'Save offline' : 'Save online')
      .fadeIn('normal', function () {
        save_type_fadeout = setTimeout(function () {
          $('#save-interface #save-type').fadeOut();
        }, 1200);
      });
  });

  $('#save-interface #create-save').click(function () {
    $(this).prop('disabled', 'true');
    var savedata = gba.getSavedata();

    // Validate name
    var save_name = $('#save-interface #save-name').val();
    if (!/^[a-zA-Z0-9_-]*$/.test(save_name)) {
      display_save_status('Only alphanumeric and -_ allowed.', false);
      return;
    }

    var save_offline = $('#save-interface #offline-save').is(':checked');
    if (save_offline) {
      // Save in localStorage
      if (localStorage_avail()) {
        var succeeded = gba.saveLocal(CURRENT_ROM, save_name);
        var msg = succeeded ? 'Game saved!' : 'Game failed to save.';
        display_save_status(msg, succeeded);

      } else {
        // Display fail
        display_save_status('Local save not supported.', false);
      }

    } else {
      // Save to server
      $.ajax({
        method: 'POST',
        url: 'server.php',
        data: {
          request: 'createSave',
          savename: save_name,
          savedata: savedata
        }
      })
      .done(function(msg) {
        var succeeded = msg.trim() === 'true';
        var msg = succeeded ? 'Game saved!' : 'Game failed to save.';
        display_save_status(msg, succeeded);
      });
    }
  });

  $('#menu #back-to-browse').click(function () {
    $('<div class="cover" id="cover-light"></div>')
      .appendTo('body')
      .fadeIn('fast', function () {
        window.location = 'mobile.html';
      });
  });
});

function run(file) {
  var dead = document.getElementById('loader');
  dead.value = '';
  var load = document.getElementById('select');
  load.textContent = 'Loading...';
  load.removeAttribute('onclick');
  var pause = document.getElementById('pause');
  pause.textContent = "PAUSE";
  gba.loadRomFromFile(file, function(result) {
    if (result) {
      for (var i = 0; i < runCommands.length; ++i) {
        runCommands[i]();
      }
      runCommands = [];
      gba.runStable();
    } else {
      load.textContent = 'FAILED';
      setTimeout(function() {
        load.textContent = 'SELECT';
        load.onclick = function() {
          document.getElementById('loader').click();
        }
      }, 3000);
    }
  });
}

function reset() {
  gba.pause();
  gba.reset();
  var load = document.getElementById('select');
  load.textContent = 'SELECT';
  var crash = document.getElementById('crash');
  if (crash) {
    var context = gba.targetCanvas.getContext('2d');
    context.clearRect(0, 0, 480, 320);
    gba.video.drawCallback();
    crash.parentElement.removeChild(crash);
    var canvas = document.getElementById('screen');
    canvas.removeAttribute('class');
  } else {
    lcdFade(gba.context, gba.targetCanvas.getContext('2d'), gba.video.drawCallback);
  }
  load.onclick = function() {
    document.getElementById('loader').click();
  }
}

// function togglePause() {
//   if (gba.paused) {
//     gba.runStable();
//   } else {
//     gba.pause();
//   }
// }

function screenshot() {
  var canvas = gba.indirectCanvas;
  window.open(canvas.toDataURL('image/png'), 'screenshot');
}

function lcdFade(context, target, callback) {
  var i = 0;
  var drawInterval = setInterval(function() {
    i++;
    var pixelData = context.getImageData(0, 0, 240, 160);
    for (var y = 0; y < 160; ++y) {
      for (var x = 0; x < 240; ++x) {
        var xDiff = Math.abs(x - 120);
        var yDiff = Math.abs(y - 80) * 0.8;
        var xFactor = (120 - i - xDiff) / 120;
        var yFactor = (80 - i - ((y & 1) * 10) - yDiff + Math.pow(xDiff, 1 / 2)) / 80;
        pixelData.data[(x + y * 240) * 4 + 3] *= Math.pow(xFactor, 1 / 3) * Math.pow(yFactor, 1 / 2);
      }
    }
    context.putImageData(pixelData, 0, 0);
    target.clearRect(0, 0, 480, 320);
    if (i > 40) {
      clearInterval(drawInterval);
    } else {
      callback();
    }
  }, 50);
}

function setVolume(value) {
  gba.audio.masterVolume = Math.pow(2, value) - 1;
}

function setPixelated(pixelated) {
  var screen = document.getElementById('screen');
  var context = screen.getContext('2d');
  if (context.webkitImageSmoothingEnabled) {
    context.webkitImageSmoothingEnabled = !pixelated;
  } else if (context.mozImageSmoothingEnabled) {
    context.mozImageSmoothingEnabled = !pixelated;
  } else if (window.navigator.appName != 'Microsoft Internet Explorer') {
      if (pixelated) {
        screen.setAttribute('width', '240');
        screen.setAttribute('height', '160');
      } else {
        screen.setAttribute('width', '480');
        screen.setAttribute('height', '320');
      }
      if (window.navigator.appName == 'Opera') {
      // Ugly hack! Ew!
      if (pixelated) {
        screen.style.marginTop = '0';
        screen.style.marginBottom = '-325px';
      } else {
        delete screen.style;
      }
    }
  }
}

/**
 * Starts the game with the given rom
 */
var start_game = function (game_name) {
  loadRom('roms/' + game_name + '.gba', function (e) {
    gba.setRom(e);
    for (var i = 0; i < runCommands.length; ++i) {
      runCommands[i]();
    }
    runCommands = [];
    gba.runStable();
  });  
}

/**
 * Returns true if localStorage is available, otherwise false
 */
var localStorage_avail = function () {
  try {
    var storage = window['localStorage'],
        x       = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

var display_save_status = function (msg, successful) {
  if (successful) {
    $('#save-interface #save-status')
      .removeClass('failure')
      .addClass('success')
      .text(msg);
  } else {
    $('#save-interface #save-status')
      .removeClass('success')
      .addClass('failure')
      .text(msg);
  }

  $('#save-interface #save-status').fadeIn();
  setTimeout(function () {
    $('#save-interface #create-save').removeAttr('disabled');
    $('#save-interface #save-status').fadeOut();
  }, 2000);
}
