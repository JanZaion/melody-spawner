const maxApi = require('max-api');
const { makeMelody } = require('./makeMelody');
const { noteNamesFromLiveFormat } = require('./noteNamesFromLiveFormat');
const { getNotes } = require('./getNotes');
const { getClip } = require('./getClip');
const { rhythmAlgos } = require('./rhythmAlgos');
const { pitchAlgos } = require('./pitchAlgos');
const { bothAlgos } = require('./bothAlgos');

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

const getPattern = async () => {
  const notes = await getNotes('stepsLive');

  const clipData = getClip(notes);

  if (clipData) {
    const { pattern, subdiv } = clipData;
    const patternStr = pattern.split(' ').join('|');

    maxApi.outlet(`unbang pattern ${patternStr}`);
    maxApi.outlet(`pattern ${pattern}`);
    maxApi.outlet(`subdiv ${subdiv}`);
  }
};

const getPitches = async () => {
  const notes = await getNotes('stepsLive');

  const clipData = getClip(notes);

  if (clipData) {
    const { noteNames } = clipData;
    const notesStr = noteNames.split(' ').join('|');

    maxApi.outlet(`unbang notes ${notesStr}`);
    maxApi.outlet(`noteNames ${noteNames}`);
  }
};

const generateRhythm = async () => {
  const full = await maxApi.getDict('full');
  const { rhythmAlgo } = full;
  const pattern = rhythmAlgos[rhythmAlgo].algo(full);
  const patternStr = pattern.split(' ').join('|');

  maxApi.outlet(`unbang pattern ${patternStr}`);
  maxApi.outlet(`pattern ${pattern}`);
  maxApi.outlet(`gatedBang`);
};

const patternDescription = async () => {
  const full = await maxApi.getDict('full');
  const { rhythmAlgo } = full;

  maxApi.outlet(`description ${rhythmAlgos[rhythmAlgo].description}`);
};

const generatePitch = async () => {
  const full = await maxApi.getDict('full');
  const { pitchAlgo } = full;
  const notes = pitchAlgos[pitchAlgo].algo(full);
  const notesStr = notes.split(' ').join('|');

  maxApi.outlet(`unbang notes ${notesStr}`);
  maxApi.outlet(`noteNames ${notes}`);
  maxApi.outlet(`gatedBang`);
};

const pitchDescription = async () => {
  const full = await maxApi.getDict('full');
  const { pitchAlgo } = full;

  maxApi.outlet(`description ${pitchAlgos[pitchAlgo].description}`);
};

const generateBoth = async () => {
  const full = await maxApi.getDict('full');
  const { bothAlgo } = full;
  const notes = bothAlgos[bothAlgo].algo(full).notes;
  const notesStr = notes.split(' ').join('|');
  const pattern = bothAlgos[bothAlgo].algo(full).pattern;
  const patternStr = pattern.split(' ').join('|');

  maxApi.outlet(`unbang notes ${notesStr}`);
  maxApi.outlet(`noteNames ${notes}`);
  maxApi.outlet(`unbang pattern ${patternStr}`);
  maxApi.outlet(`pattern ${pattern}`);
  maxApi.outlet(`gatedBang`);
};

const bothDescription = async () => {
  const full = await maxApi.getDict('full');
  const { bothAlgo } = full;

  maxApi.outlet(`description ${bothAlgos[bothAlgo].description}`);
};

const init = async () => {
  await maxApi.setDict('full', {
    subdiv: '4n',
    splitter: 0,
    octave: 2,
    scale: 'major',
    rootNote: 'F',
    notePatterns: 'R R R R',
    notes: ['R', 'R', 'R', 'R'],
    patterns: 'xxxx',
    pattern: 'xxxx',
    pitchAlgo: 'notesToNums',
    repeatNotes: 1,
    rhythmAlgo: 'long_wild',
    bothAlgo: 'displacement',
    sizzle: 'none',
    splitChop: 0,
    upperBound: 7,
    lowerBound: -7,
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
maxApi.addHandler('generateBoth', generateBoth);
maxApi.addHandler('bothDescription', bothDescription);
