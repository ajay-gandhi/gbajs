# GBA Play

## Intro

GBA Play is a webapp built on [GBA.js](https://github.com/endrift/gbajs). It
allows you to play GameBoy Advance games in your browser, both on mobile and on
desktop.

We don't provide any ROMs, however - login to GBA Play through Facebook and add
direct links to ROMs via the interface - GBA Play takes care of the rest.

Take a look! **http://gbaplay.herokuapp.com**

### Direct Links to ROMs

Direct links are required because GBA Play literally grabs the ROM and feeds it
to your browser. Here's a quick guide for getting a direct link:

1. Upload your ROM to [Dropbox](http://dropbox.com).
2. Get a share link for your file. It should look something like:

```
https://www.dropbox.com/s/gibberish/rom_name.gba?dl=0
```

3. Change `?dl=0` to `?dl=1`.
4. You now have a direct link! Yay!
