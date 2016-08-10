'use strict';

var express    = require('express'),
    bodyParser = require('body-parser'),
    fs         = require('fs');

var app = express();
app.set('port', (process.env.PORT || 8000));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));
app.use('/roms', express.static(__dirname + '/roms'));
app.use('/saves', express.static(__dirname + '/saves'));

app.post('/listRoms', function (req, res) {
  fs.readdir(__dirname + '/roms', function (err, files) {
    if (err) return console.error(err);
    res.send(files);
  });
});

app.post('/listSaves', function (req, res) {
  console.log(req.body);
  fs.readdir(__dirname + '/roms', function (err, files) {
    if (err) return console.error(err);

    var game = req.body.gameName;
    res.send(files.filter(function (filename) {
      return filename.substr(filename.indexOf('|') + 1) === game;
    }));
  });
});

app.post('/createSave', function (req, res) {
  console.log(req.body);
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