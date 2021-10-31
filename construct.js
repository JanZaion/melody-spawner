const maxApi = require('max-api');
const { makeMelody } = require('./makeMelody');
const { noteNamesFromLiveFormat } = require('./noteNamesFromLiveFormat');
const { getNotes } = require('./getNotes');
const { getClip } = require('./getClip');
const { rhythmAlgos } = require('./rhythmAlgos');
const { pitchAlgos } = require('./pitchAlgos');
const { bothAlgos } = require('./bothAlgos');

const getPattern = async () => {
  const parsed = await getNotes('stepsLive');

  const clipData = getClip(parsed);

  if (clipData) {
    const { pattern, subdiv } = clipData;

    maxApi.outlet(`pattern ${pattern}`);
    maxApi.outlet(`subdiv ${subdiv}`);
  }
};

const getPitches = async () => {
  const parsed = await getNotes('stepsLive');

  const clipData = getClip(parsed);

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
  const { rhythmAlgoInt } = full;

  maxApi.outlet(`pattern ${rhythmAlgos[rhythmAlgoInt].algo(full)}`);
  maxApi.outlet(`gatedBang`);
};

const patternDescription = async () => {
  const full = await maxApi.getDict('full');
  const { rhythmAlgoInt } = full;

  maxApi.outlet(`description ${rhythmAlgos[rhythmAlgoInt].description}`);
};

const generatePitch = async () => {
  const full = await maxApi.getDict('full');
  const { pitchAlgoInt } = full;

  maxApi.outlet(`noteNames ${pitchAlgos[pitchAlgoInt].algo(full)}`);
  maxApi.outlet(`gatedBang`);
};

const pitchDescription = async () => {
  const full = await maxApi.getDict('full');
  const { pitchAlgoInt } = full;

  maxApi.outlet(`description ${pitchAlgos[pitchAlgoInt].description}`);
};

const generateBoth = async () => {
  const full = await maxApi.getDict('full');
  const { bothAlgoInt } = full;

  maxApi.outlet(`noteNames ${bothAlgos[bothAlgoInt].algo(full).notes}`);
  maxApi.outlet(`pattern ${bothAlgos[bothAlgoInt].algo(full).pattern}`);
  maxApi.outlet(`gatedBang`);
};

const bothDescription = async () => {
  const full = await maxApi.getDict('full');
  const { bothAlgoInt } = full;

  maxApi.outlet(`description ${bothAlgos[bothAlgoInt].description}`);
};

maxApi.addHandler('makeClip', makeClip);
maxApi.addHandler('getPattern', getPattern);
maxApi.addHandler('getPitches', getPitches);
maxApi.addHandler('generateRhythm', generateRhythm);
maxApi.addHandler('generatePitch', generatePitch);
maxApi.addHandler('patternDescription', patternDescription);
maxApi.addHandler('pitchDescription', pitchDescription);
maxApi.addHandler('generateBoth', generateBoth);
maxApi.addHandler('bothDescription', bothDescription);
