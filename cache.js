/**
 * Caching module. Supports get/set and page-to-disk operations.
 */

'use strict';

var fs = require('fs');

module.exports = (function () {

  function Cache (path) {
    this.data = {};
    this.path = path;
    fs.readFile(path, function (err, data) {
      if (err && err.code !== 'ENOENT') console.error(err);
      if (data) this.data = JSON.stringify(data);
    });
  }

  /**
   * Set a value in the cache
   */
  Cache.prototype.set = function (key, value) {
    this.data[key] = value;
  }

  /**
   * Get a value from the cache. Returns false if key not found.
   */
  Cache.prototype.get = function (key) {
    return this.data[key] ? this.data[key] : false;
  }

  /**
   * Page the cache to disk.
   */
  Cache.prototype.page = function () {
    fs.writeFile(this.path, JSON.stringify(this.data), function (err) {
      if (err) console.error(err);
    });
  }

  return Cache;

})();
