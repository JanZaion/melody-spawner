const dice = require('convenient-methods-of-randomness');
const { makeSuperScale, makeMassiveScales } = require('./superScale');
const { Note, Scale } = require('@tonaljs/tonal');
const { notesToArray } = require('./notesToArray');
const { splitPattern } = require('./splitPattern');

const displacement = (params) => {
  const { notes, pattern } = params;
  const notesArray = notesToArray(notes);
  const notesDivider = Math.round(notesArray.length / 4);
  for (let j = 0; j < notesDivider; j++) notesArray.shift();

  const stepsAndSpacesSeparated = splitPattern(pattern, false);
  const patternDivider = Math.round(stepsAndSpacesSeparated.length / 4);
  const removedSteps = [];
  for (let i = 0; i < patternDivider; i++) {
    const shiftedStep = stepsAndSpacesSeparated.shift();
    removedSteps.push(shiftedStep);
  }
  stepsAndSpacesSeparated.push('-' + '_'.repeat(removedSteps.join('').length - 1));

  return { notes: notesArray.join(' '), pattern: stepsAndSpacesSeparated.join('') }; //?
};

//add original motif + displaced

const bothAlgos = {
  displacement: {
    algo: displacement,
    description: 'Displaces the dis.',
  },
};

module.exports = { bothAlgos };

const pars = {
  octave: 0,
  subdiv: '4n',
  splitter: 0,
  splitChop: 0,
  scale: 'major',
  rootNote: 'F',
  notes: ['Gb1', 'A1', 'B1', 'B1'],
  pattern: 'xxxxxxxx',
  pitchDirrection: 'ascend',
  repeatNotes: 'on',
  sizzle: 'cos',
  upperBound: 5,
  lowerBound: 0,
  intervals: 'diatonic',
};

displacement(pars);
