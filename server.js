'use strict';

// NPM modules
var express    = require('express'),
    bodyParser = require('body-parser'),
    fs         = require('fs');

// Local modules
var UserDB = require('./userdb');

var users = new UserDB('users.json');

// Set up express
var app = express();
app.set('port', (process.env.PORT || 8000));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

app.use(function (req, res, next) {
  if (req.method.toLowerCase() === 'post' && !req.body.user_id) {
    console.log('Invalid user!', req.body);
  }
  next();
});

/**
 * Add a ROM for a user
 */
app.post('/addRom', function (req, res) {
  var added = users.add_new_rom(req.body.user_id, req.body.name, req.body.url);
  if (added == true) {
    users.page();
    res.send(true);
  } else {
    res.send(JSON.stringify({
      message: added ? added : 'Failed to add ROM.'
    }));
  }
});

/**
 * List available ROMs
 */
app.post('/listRoms', function (req, res) {
  fs.readdir(__dirname + '/roms', function (err, files) {
    if (err) return console.error('Error listing ROMs:', err);
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
