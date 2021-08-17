const maxApi = require('max-api');
const { makeMelody } = require('./makeMelody');
const { joinWithAI } = require('./joinWithAI');
const { noteNamesFromLiveFormat } = require('./noteNamesFromLiveFormat');
const { getPattern } = require('./getPattern');

const getClip = async () => {
  const stepsLive = await maxApi.getDict('stepsLive');

  const stringified = JSON.stringify(stepsLive);
  const parsed = JSON.parse(stringified);
  const { notes } = parsed;

  const rhythm = getPattern(notes);
  const { pattern, subdiv } = rhythm;

  maxApi.outlet(`pattern ${pattern}`);
  maxApi.outlet(`subdiv ${subdiv}`);
};

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

  maxApi.outlet('make');
};

maxApi.addHandler('makeClip', makeClip);
maxApi.addHandler('getClip', getClip);
