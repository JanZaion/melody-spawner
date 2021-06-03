const maxApi = require('max-api');
const scribble = require('scribbletune');
const lib = require('./mmlib');

maxApi.addHandler('makeClip', () => {
  const constructClip = (async () => {
    const full = await maxApi.getDict('full');

    const { notes, pattern } = full;

    const clip = scribble.clip({
      notes,
      pattern,
    });

    await Promise.all([
      maxApi.setDict('noteNames', {
        notes: names,
      }),
      maxApi.setDict('clip1', {
        scribbleObjects: clip,
      }),
    ]);

    maxApi.outlet('bang');
  })();
});
