const maxApi = require('max-api');
const { makeMelody } = require('./makeMelody');
const { joinWithAI } = require('./joinWithAI');
const { noteNamesFromLiveFormat } = require('./noteNamesFromLiveFormat');

const makeClip = async () => {
  const full = await maxApi.getDict('full');

  const midiSteps = makeMelody(full);

  full.midiSteps = midiSteps;

  const finalClip = await joinWithAI(full);

  const { liveFormat, totalDuration } = finalClip;

  const names = noteNamesFromLiveFormat(liveFormat);

  await Promise.all([
    maxApi.setDict('noteNames', {
      notes: names,
    }),
    maxApi.setDict('stepsClip', {
      notes: liveFormat,
      totalDuration,
    }),
  ]);

  maxApi.outlet('bang');
};

maxApi.addHandler('makeClip', makeClip);
