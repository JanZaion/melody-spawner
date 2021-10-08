const dice = require('convenient-methods-of-randomness');
const { makeSuperScale, makeMassiveScales } = require('./superScale');
const { Note, Scale } = require('@tonaljs/tonal');
const { notesToArray } = require('./notesToArray');
const { splitPattern } = require('./splitPattern');
const { transposeByOne } = require('./pitchAlgos');

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

  return { notes: notesArray.join(' '), pattern: stepsAndSpacesSeparated.join('') };
};

const displacementAndOriginal = (params) => {
  const { notes, pattern } = params;
  const displaced = displacement({ notes: [...notes], pattern });

  const displacedNotes = displaced.notes;
  const jointNotes = notes.join(' ').concat(' ').concat(displacedNotes);
  const jointPattern = pattern.concat(displaced.pattern);

  return { notes: jointNotes, pattern: jointPattern };
};

const transpositorySequence = (params, up, sequenceLength, skip) => {
  const { notes, pattern } = params;
  const notesArray = notesToArray(notes);

  let sequenceNotes = '';
  let sequencePattern = '';

  for (let i = 0; i < sequenceLength; i++) {
    let transposedNotes = [...notesArray];
    for (let j = 0; j < i; j++) {
      const nextSeqStep = transposeByOne({ ...params, notes: transposedNotes }, up).transposedNotes;
      transposedNotes = skip ? transposeByOne({ ...params, notes: nextSeqStep }, up).transposedNotes : nextSeqStep;
    }

    sequenceNotes = sequenceNotes.concat(transposedNotes.join(' ')).concat(' ');
    sequencePattern = sequencePattern.concat(pattern);
  }

  return { notes: sequenceNotes, pattern: sequencePattern };
};

const bothAlgos = {
  displacement: {
    algo: displacement,
    description: 'Removes the first 1/4 of the of the melody and fills the rest of it with a space of equal length.',
  },
  displacementAndOriginal: {
    algo: displacementAndOriginal,
    description: 'Adds the original melody plus the displaced melody.',
  },
  ascending3partSequence: {
    algo: (params) => transpositorySequence(params, true, 3),
    description:
      'Creates a melodic sequence where the original melody repeats 3 times while its transposed up in a stepwise motion for each sequencial repetition of this melody.',
  },
  ascending4partSequence: {
    algo: (params) => transpositorySequence(params, true, 4),
    description:
      'Creates a melodic sequence where the original melody repeats 4 times while its transposed up in a stepwise motion for each sequencial repetition of this melody.',
  },
  descending3partSequence: {
    algo: (params) => transpositorySequence(params, false, 3),
    description:
      'Creates a melodic sequence where the original melody repeats 3 times while its transposed down in a stepwise motion for each sequencial repetition of this melody.',
  },
  descending4partSequence: {
    algo: (params) => transpositorySequence(params, false, 4),
    description:
      'Creates a melodic sequence where the original melody repeats 4 times while its transposed down in a stepwise motion for each sequencial repetition of this melody.',
  },
  ascending3partSequenceSkipwise: {
    algo: (params) => transpositorySequence(params, true, 3, true),
    description:
      'Creates a melodic sequence where the original melody repeats 4 times while its transposed up in a skipwise motion for each sequencial repetition of this melody.',
  },
  ascending4partSequenceSkipwise: {
    algo: (params) => transpositorySequence(params, true, 4, true),
    description:
      'Creates a melodic sequence where the original melody repeats 3 times while its transposed up in a skipwise motion for each sequencial repetition of this melody.',
  },
  descending3partSequenceSkipwise: {
    algo: (params) => transpositorySequence(params, false, 3, true),
    description:
      'Creates a melodic sequence where the original melody repeats 4 times while its transposed down in a skipwise motion for each sequencial repetition of this melody.',
  },
  descending4partSequenceSkipwise: {
    algo: (params) => transpositorySequence(params, false, 4, true),
    description:
      'Creates a melodic sequence where the original melody repeats 4 times while its transposed down in a skipwise motion for each sequencial repetition of this melody.',
  },
};

module.exports = { bothAlgos };

const pars = {
  octave: 0,
  subdiv: '4n',
  splitter: 0,
  splitChop: 0,
  scale: 'major',
  rootNote: 'C',
  notes: ['C1', 'C#1'],
  pattern: 'xx',
  pitchDirrection: 'ascend',
  repeatNotes: 'on',
  sizzle: 'cos',
  upperBound: 5,
  lowerBound: 0,
  intervals: 'diatonic',
};

console.log(transpositorySequence(pars, true, 3, true));
