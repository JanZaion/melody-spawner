const maxApi = require('max-api');
const { makeMelody } = require('./makeMelody');
const { joinWithAI } = require('./joinWithAI');
const { noteNamesFromLiveFormat } = require('./noteNamesFromLiveFormat');
const { getNotes } = require('./getNotes');
const { getClip } = require('./getClip');

const getPattern = async () => {
  const notes = await getNotes('stepsLive');

  const clipData = getClip(notes);
  const { pattern, subdiv } = clipData;

  maxApi.outlet(`pattern ${pattern}`);
  maxApi.outlet(`subdiv ${subdiv}`);
};

const getPitches = async () => {
  const notes = await getNotes('stepsLive');

  const clipData = getClip(notes);
  const { noteNames } = clipData;

  maxApi.outlet(`noteNames ${noteNames}`);
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
maxApi.addHandler('getPattern', getPattern);
maxApi.addHandler('getPitches', getPitches);
