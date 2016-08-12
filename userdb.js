/**
 * User database module. Supports get/set and page-to-disk operations.
 */

'use strict';

var MAX_ROMS = 5;
var MAX_SAVES = 5;

var fs = require('fs');

module.exports = (function () {

  function UserDB (path) {
    this.users = {};
    this.path = path;
    var self = this;
    fs.readFile(path, function (err, data) {
      if (err && err.code !== 'ENOENT') console.error(err);
      if (data) self.users = JSON.parse(data);
    });
  }

  /**
   * Get a user from the database. If the user isn't found, create it.
   */
  UserDB.prototype.get_user = function (uid) {
    var user = this.users[uid];
    if (user) return user;

    // User didn't exist, create new
    this.set_user(uid, {
      user_id: uid,
      roms: {}
    });
    return this.users[uid];
  }

  /**
   * Updates a user in the database
   */
  UserDB.prototype.set_user = function (uid, user_data) {
    this.users[uid] = user_data;
  }

  /****************************** Public Methods ******************************/

  /**
   * Add the ROM to the user's list of ROMs
   */
  UserDB.prototype.add_new_rom = function (uid, rom_name, rom_url) {
    var user = this.get_user(uid);
    if (Object.keys(user.roms).length > MAX_ROMS)
      return 'Limit of ' + MAX_ROMS + ' ROMs reached.';

    user.roms[rom_name] = {};
    user.roms[rom_name].url = rom_url;
    user.roms[rom_name].saves = {};
    this.set_user(user);
    return true;
  }

  /**
   * Add the save file to the user's list of saves. Returns false if the rom
   * wasn't found, else true
   */
  UserDB.prototype.update_save = function (uid, rom_name, save_name, save_data) {
    var user = this.get_user(uid);
    if (user.roms[rom_name]) {
      if (Object.keys(user.roms[rom_name].saves).length > MAX_SAVES)
        return 'Limit of ' + MAX_ROMS + ' saves reached.';

      user.roms[rom_name].saves[save_name] = save_data;
      this.set_user(user);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get a list of savegames for the given user for the given game. Returns
   * false if game not found, and empty array if no saves exist.
   */
  UserDB.prototype.get_saves = function (uid, rom_name) {
    var user = this.get_user(uid);
    return user.roms[rom_name] ? Object.keys(user.roms[rom_name].saves) : false;
  }

  /**
   * Gets savedata for the given save name, rom name, user. Returns false if a
   * save with the given name doesn't exist, etc.
   */
  UserDB.prototype.get_save_data = function (uid, rom_name, save_name) {
    var user = this.get_user(uid);
    if (user.roms[rom_name] && user.roms[rom_name].saves[save_name])
      return user.roms[rom_name].saves[save_name];
    else
      return false;
  }

  /**
   * Gets the URl for the given rom name for the given user. Returns false if
   * the ROM isn't found
   */
  UserDB.prototype.get_rom_url = function (uid, rom_name) {
    var user = this.get_user(uid);
    return user.roms[rom_name] ? user.roms[rom_name].url : false;
  }

  /**
   * Page the cache to disk.
   */
  UserDB.prototype.page = function () {
    fs.writeFile(this.path, JSON.stringify(this.users), function (err) {
      if (err) console.error('Error paging user database to disk:', err);
    });
  }

  return UserDB;

})();
