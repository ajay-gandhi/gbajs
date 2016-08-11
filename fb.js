'use strict';

var rp = require('request-promise');

var fb_creds = require('./facebook.json');

module.exports = (function () {

  var FB_GRAPH_BASE = 'https://graph.facebook.com/v2.7';

  function Facebook () {
    var self = this;
    var options = {
      uri: FB_GRAPH_BASE + '/oauth/access_token',
      qs: {
        client_id: fb_creds.clientID,
        client_secret: fb_creds.clientSecret,
        grant_type: 'client_credentials'
      },
      json: true
    }
    rp(options).then(function (res) {
      self.access_token = res.access_token;
    });
  }

  /**
   * Validates an access token
   */
  Facebook.prototype.verify_token = function (token) {
    var options = {
      uri: FB_GRAPH_BASE + '/debug_token',
      qs: {
        input_token: token,
        access_token: this.access_token
      },
      json: true
    }

    return rp(options).then(function (res) {
      return res.data.app_id.toString() === fb_creds.clientID;
    });
  }

  return Facebook;

})();
