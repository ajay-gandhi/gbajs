'use strict';

// NPM modules
var express    = require('express'),
    bodyParser = require('body-parser'),
    fs         = require('fs');

// Local modules
var FB = require('./fb');

var facebook = new FB();

// Set up express
var app = express();
app.set('port', (process.env.PORT || 8000));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));
app.use('/roms', express.static(__dirname + '/roms'));
app.use('/saves', express.static(__dirname + '/saves'));

/**
 * Verify access token
 */
app.post('/login', function (req, res) {
  facebook
    .verify_token(req.body.token)
    .then(function (verified) {
      if (verified) {
        console.log('Verified user:', req.body.user_id);
      }
      res.send(verified);
    });
});

/**
 * List available ROMs
 */
app.post('/listRoms', function (req, res) {
  fs.readdir(__dirname + '/roms', function (err, files) {
    if (err) return console.error(err);
    res.send(files);
  });
});

/**
 * List available save files
 */
app.post('/listSaves', function (req, res) {
  fs.readdir(__dirname + '/roms', function (err, files) {
    if (err) return console.error(err);

    var game = req.body.gameName;
    res.send(files.filter(function (filename) {
      return filename.substr(filename.indexOf('|') + 1) === game;
    }));
  });
});

/**
 * Create new save file
 */
app.post('/createSave', function (req, res) {
  var filepath = 'saves/' + req.body.savename + '|' + req.body.rom;
  fs.writeFile(filepath, req.body.savedata, function (err) {
    if (err) {
      console.error(err);
      res.send('false');
    } else {
      res.send('true');
    }
  });
});

app.listen(app.get('port'), function () {
  console.log('Serving on port', app.get('port'));
});
