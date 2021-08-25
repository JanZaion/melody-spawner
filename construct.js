const maxApi = require('max-api');
const { makeMelody } = require('./makeMelody');
const { noteNamesFromLiveFormat } = require('./noteNamesFromLiveFormat');
const { getNotes } = require('./getNotes');
const { getClip } = require('./getClip');
const { rhythmAlgos } = require('./rhythmAlgos');
const { pitchAlgos } = require('./pitchAlgos');

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

  if (clipData) {
    const { noteNames } = clipData;

    maxApi.outlet(`noteNames ${noteNames}`);
  }
};

const makeClip = async () => {
  const full = await maxApi.getDict('full');

  const midiSteps = makeMelody(full);

  const { liveFormat, totalDuration } = midiSteps;

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

const generatePitch = async () => {
  const full = await maxApi.getDict('full');
  const { notes, pitchAlgo } = full;

  maxApi.outlet(`noteNames ${pitchAlgos[pitchAlgo](notes)}`);
};

maxApi.addHandler('makeClip', makeClip);
maxApi.addHandler('getPattern', getPattern);
maxApi.addHandler('getPitches', getPitches);
maxApi.addHandler('generateRhythm', generateRhythm);
maxApi.addHandler('generatePitch', generatePitch);
