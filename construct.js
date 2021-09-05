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
  const { rhythmAlgo } = full;

  maxApi.outlet(`pattern ${rhythmAlgos[rhythmAlgo][0](full)}`);
};

const patternDescription = async () => {
  const full = await maxApi.getDict('full');
  const { rhythmAlgo } = full;

  maxApi.outlet(`patternDescription ${rhythmAlgos[rhythmAlgo][1]}`);
};

const generatePitch = async () => {
  const full = await maxApi.getDict('full');
  const { pitchAlgo } = full;

  maxApi.outlet(`noteNames ${pitchAlgos[pitchAlgo][0](full)}`);
};

const pitchDescription = async () => {
  const full = await maxApi.getDict('full');
  const { pitchAlgo } = full;

  maxApi.outlet(`pitchDescription ${pitchAlgos[pitchAlgo][1]}`);
};

const init = async () => {
  await maxApi.setDict('full', {
    subdiv: '4n',
    splitter: 0,
    octave: 2,
    mode: 'Minor',
    rootNote: 'F',
    notePatterns: 'R R R R',
    notes: ['R', 'R', 'R', 'R'],
    patterns: 'xxxx',
    pattern: 'xxxx',
    pitchAlgo: 'dunno',
    repeatNotes: 1,
    rhythmAlgo: 'long_wild',
    sizzle: 'none',
    splitChop: 0,
    upperBound: 4,
    lowerBound: 0,
    pitchDirrection: 'any',
    intervals: 'diatonic',
  });

  maxApi.outlet('Init');
};

maxApi.addHandler('makeClip', makeClip);
maxApi.addHandler('getPattern', getPattern);
maxApi.addHandler('getPitches', getPitches);
maxApi.addHandler('generateRhythm', generateRhythm);
maxApi.addHandler('generatePitch', generatePitch);
maxApi.addHandler('Init', init);
maxApi.addHandler('patternDescription', patternDescription);
maxApi.addHandler('pitchDescription', pitchDescription);
