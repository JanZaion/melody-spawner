const maxApi = require('max-api');
const { makeMelody } = require('./makeMelody');
const { joinWithAI } = require('./joinWithAI');
const { noteNamesFromLiveFormat } = require('./noteNamesFromLiveFormat');
const { getNotes } = require('./getNotes');
const { getClip } = require('./getClip');
const { rhythmAlgos } = require('./rhythmAlgos');

const getPattern = async () => {
  const notes = await getNotes('stepsLive');

  const clipData = getClip(notes);

  if (clipData) {
    const { pattern, subdiv } = clipData;

    maxApi.outlet(`pattern ${pattern}`);
    maxApi.outlet(`subdiv ${subdiv}`);
  }
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

const generateRhythm = async () => {
  const full = await maxApi.getDict('full');
  const { pattern, rhythmAlgo } = full;

  maxApi.outlet(`pattern ${rhythmAlgos[rhythmAlgo](pattern)}`);
};

maxApi.addHandler('makeClip', makeClip);
maxApi.addHandler('getPattern', getPattern);
maxApi.addHandler('getPitches', getPitches);
maxApi.addHandler('generateRhythm', generateRhythm);
