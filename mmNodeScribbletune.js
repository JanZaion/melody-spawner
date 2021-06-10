const maxApi = require('max-api');
const mmlib = require('./mmlib');

maxApi.addHandler('makeClip', () => {
  const constructClip = (async () => {
    const full = await maxApi.getDict('full');

    const clipMade = mmlib.makeMelody(full);

    const clip = clipMade[0];
    const names = clipMade[1].join(', ');

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
