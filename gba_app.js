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
    var rom = qs.shift().split('=').pop();

    if (qs.length) {
      // Load savegame, then rom
      var save = qs.length ? qs.shift().split('=').pop() : false;
      loadRom('saves/' + save + '|' + rom, function (e) {
        runCommands.push(function () {
          gba.setSavedata(e);
        });

        // Load rom
        loadRom('roms/' + rom + '.gba', function (e) {
          gba.setRom(e);
          for (var i = 0; i < runCommands.length; ++i) {
            runCommands[i]();
          }
          runCommands = [];
          gba.runStable();
        });
      });
    } else {
      // Just load rom
      loadRom('roms/' + rom + '.gba', function (e) {
        gba.setRom(e);
        for (var i = 0; i < runCommands.length; ++i) {
          runCommands[i]();
        }
        runCommands = [];
        gba.runStable();
      });
    }
  } else {
    // Didn't work
  }
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

function uploadSavedataPending(file) {
  runCommands.push(function() { gba.loadSavedataFromFile(file) });
}

function togglePause() {
  var e = document.getElementById('pause');
  if (gba.paused) {
    gba.runStable();
    e.textContent = "PAUSE";
  } else {
    gba.pause();
    e.textContent = "UNPAUSE";
  }
}

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

document.addEventListener('webkitfullscreenchange', function() {
  var canvas = document.getElementById('screen');
  if (document.webkitIsFullScreen) {
    canvas.setAttribute('height', document.body.offsetHeight);
    canvas.setAttribute('width', document.body.offsetHeight / 2 * 3);
    canvas.setAttribute('style', 'margin: 0');
  } else {
    canvas.setAttribute('height', 320);
    canvas.setAttribute('width', 480);
    canvas.removeAttribute('style');
  }
}, false);
