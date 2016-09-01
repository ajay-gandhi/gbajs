'use strict';

// NPM modules
var express    = require('express'),
    bodyParser = require('body-parser'),
    fs         = require('fs'),
    rp         = require('request-promise');

// Local modules
var UserDB = require('./postgres');

var users = new UserDB();

// // Set up express
var app = express();
app.set('port', (process.env.PORT || 8000));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

app.use(function (req, res, next) {
  if (req.method.toLowerCase() === 'post' && !req.body.user_id) {
    console.log('Request without user!', req.body);
  }
  next();
});

/**
 * Add a ROM for a user
 */
app.post('/addRom', function (req, res) {
  // At the very least confirm file exists
  rp(req.body.rom_url)
    .then(function () {
      var added = users.add_new_rom(req.body.user_id, req.body.rom_name, req.body.rom_url);
      if (added == true) {
        users.page(req.body.user_id);
        res.send(true);
      } else {
        res.send(JSON.stringify({
          message: added ? added : 'Failed to add ROM.'
        }));
      }
    })
    .catch(function () {
      res.send(JSON.stringify({
        message: 'Invalid URL.'
      }));
    });
});

/**
 * Create new save file
 */
app.post('/createSave', function (req, res) {
  var saved = users.update_save(req.body.user_id, req.body.rom_name, req.body.save_name, req.body.save_data);
  if (saved == true) {
    users.page(req.body.user_id);
    res.send(saved);
  } else {
    res.send(JSON.stringify({
      message: saved ? saved : 'Failed to save game.'
    }));
  }
});

/**
 * List available save files
 */
app.post('/listSaves', function (req, res) {
  var saves = users.get_saves(req.body.user_id, req.body.rom_name);
  if (!saves) {
    res.send({
      message: 'Game not found.'
    });
  } else if (saves.length) {
    res.send(JSON.stringify(saves));
  } else {
    res.send(false);
  }
});

/**
 * Get savedata
 */
app.post('/getSaveData', function (req, res) {
  var save_data = users.get_save_data(req.body.user_id, req.body.rom_name, req.body.save_name);
  res.send(save_data);
});

/**
 * Get ROM url
 */
app.post('/getRom', function (req, res) {
  var rom_url = users.get_rom_url(req.body.user_id, req.body.rom_name);
  if (!rom_url) return res.send(false);
  var opts = {
    uri: rom_url,
    encoding: null
  }
  rp(opts)
    .then(function (response) {
      var b64e = new Buffer(response, 'binary').toString('base64');
      res.send(b64e);
    })
    .catch(function (e) {
      // Invalid URL I guess
      // Delete ROM
      console.log('Error getting ROM from URL:', e);
    });
});

/**
 * List available ROMs
 */
app.post('/listRoms', function (req, res) {
  var roms = users.get_rom_list(req.body.user_id);
  if (roms.length > 0) {
    res.send(JSON.stringify(roms));
  } else {
    res.send(false);
  }
});

/**
 * Delete a ROM
 */
app.post('/deleteRom', function (req, res) {
  var deleted = users.delete_rom(req.body.user_id, req.body.rom_name);
  users.page(req.body.user_id);
  res.send(deleted);
});

/**
 * Delete a save
 */
app.post('/deleteSave', function (req, res) {
  var deleted = users.delete_save(req.body.user_id, req.body.rom_name, req.body.save_name);
  users.page(req.body.user_id);
  res.send(deleted);
});

app.listen(app.get('port'), function () {
  console.log('Serving on port', app.get('port'));
});
