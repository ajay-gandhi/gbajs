/**
 * User database module backed by PostGreSQL. Supports get/set operations.
 */

'use strict';

var MAX_ROMS = 5;
var MAX_SAVES = 5;

var pg = require('pg');
pg.defaults.ssl = true;

module.exports = (function () {

  function PostGres () {
    this.users = {};
    var self = this;

    pg.connect(process.env.DATABASE_URL, function (err, client) {
      if (err) throw err;

      self.client = client;

      client.query('TRUNCATE TABLE users');

      client.query('CREATE TABLE IF NOT EXISTS users (' +
        'user_id SERIAL PRIMARY KEY, ' +
        'fb_user_id varchar(20) NOT NULL, ' +
        'roms text NOT NULL' +
      ')');

      client
        .query('SELECT * FROM users')
        .on('row', function (row) {
          self.users[row.fb_user_id] = row;
        });
    });
    return this;
  }

  /**
   * Get a user from the database. If the user isn't found, create it.
   */
  PostGres.prototype.get_user = function (fb_uid) {
    var user = this.users[fb_uid];
    if (user) return user;

    // User didn't exist, create new
    this.save_user({
      fb_user_id: fb_uid,
      roms: {}
    });
    return this.users[fb_uid];
  }

  /**
   * Updates a user in the database
   */
  PostGres.prototype.save_user = function (user_data) {
    this.users[user_data.fb_user_id] = user_data;
  }

  /****************************** Public Methods ******************************/

  /**
   * Add the ROM to the user's list of ROMs
   */
  PostGres.prototype.add_new_rom = function (fb_uid, rom_name, rom_url) {
    var user = this.get_user(fb_uid);
    if (!user.roms[rom_name] && Object.keys(user.roms).length > MAX_ROMS)
      return 'Limit of ' + MAX_ROMS + ' ROMs reached.';

    user.roms[rom_name] = {};
    user.roms[rom_name].url = rom_url;
    user.roms[rom_name].saves = {};
    this.save_user(user);
    return true;
  }

  /**
   * Add the save file to the user's list of saves. Returns false if the rom
   * wasn't found, else true.
   */
  PostGres.prototype.update_save = function (fb_uid, rom_name, save_name, save_data) {
    var user = this.get_user(fb_uid);
    if (user.roms[rom_name]) {
      if (!user.roms[rom_name].saves[save_name] && Object.keys(user.roms[rom_name].saves).length > MAX_SAVES)
        return 'Limit of ' + MAX_ROMS + ' saves reached.';

      user.roms[rom_name].saves[save_name] = save_data;
      this.save_user(user);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get a list of savegames for the given user for the given game. Returns
   * false if game not found, and empty array if no saves exist.
   */
  PostGres.prototype.get_saves = function (fb_uid, rom_name) {
    var user = this.get_user(fb_uid);
    return user.roms[rom_name] ? Object.keys(user.roms[rom_name].saves) : false;
  }

  /**
   * Gets savedata for the given save name, rom name, user. Returns false if a
   * save with the given name doesn't exist, etc.
   */
  PostGres.prototype.get_save_data = function (fb_uid, rom_name, save_name) {
    var user = this.get_user(fb_uid);
    if (user.roms[rom_name] && user.roms[rom_name].saves[save_name])
      return user.roms[rom_name].saves[save_name];
    else
      return false;
  }

  /**
   * Gets the URl for the given rom name for the given user. Returns false if
   * the ROM isn't found
   */
  PostGres.prototype.get_rom_url = function (fb_uid, rom_name) {
    var user = this.get_user(fb_uid);
    return user.roms[rom_name] ? user.roms[rom_name].url : false;
  }

  /**
   * Get a list of roms for the given user. Returns empty array if no roms
   * exist.
   */
  PostGres.prototype.get_rom_list = function (fb_uid) {
    var user = this.get_user(fb_uid);
    return Object.keys(user.roms);
  }

  /**
   * Delete a ROM. Returns false if ROM didn't exist
   */
  PostGres.prototype.delete_rom = function (fb_uid, rom_name) {
    var user = this.get_user(fb_uid);
    var deleted = user.roms[rom_name] ? delete user.roms[rom_name] : false;
    this.save_user(user);
    return deleted;
  }

  /**
   * Delete a save. Returns false if the save didn't exist
   */
  PostGres.prototype.delete_save = function (fb_uid, rom_name, save_name) {
    var user = this.get_user(fb_uid);
    if (user.roms[rom_name] && user.roms[rom_name].saves[save_name]) {
      delete user.roms[rom_name].saves[save_name];
      this.save_user(user);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Page the user to the database.
   */
  PostGres.prototype.page = function (fb_uid) {
    var user = this.get_user(fb_uid);
    var self = this;

    if (user.user_id) {
      // Update
      self.client.query("UPDATE users SET roms = '" + JSON.stringify(user.roms) +
        "' WHERE user_id = '" + user.user_id + "'");

    } else {
      // New addition to db
      self.client
        .query('INSERT INTO users (fb_user_id, roms) ' +
          "VALUES ('" + fb_uid + "', '" + JSON.stringify(user.roms) + "') " +
          'RETURNING user_id, fb_user_id, roms')
        .on('row', function (row) {
          self.save_user(row);
        });
    }
  }

  return PostGres;

})();
