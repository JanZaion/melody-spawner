const dice = require('convenient-methods-of-randomness');
const { makeSuperScale, makeMassiveScales } = require('./superScale');
const { Note, Scale } = require('@tonaljs/tonal');
const { notesToArray } = require('./notesToArray');

const numToNote = (num, lowerScaleReversed, upperScale) => {
  if (isNaN(num)) return num;
  return num < 0 ? lowerScaleReversed[num * -1] : upperScale[num];
};

const noteToNum = (note, lowerScaleReversed, upperScale, enharmonicLowerScaleReversed, enharmonicUpperScale) => {
  const isItHere = (scale, note) => scale.indexOf(note) !== -1;
  if (isItHere(upperScale, note)) return upperScale.indexOf(note);
  if (isItHere(lowerScaleReversed, note)) return lowerScaleReversed.indexOf(note) * -1;
  if (isItHere(enharmonicUpperScale, note)) return enharmonicUpperScale.indexOf(note);
  if (isItHere(enharmonicLowerScaleReversed, note)) return enharmonicLowerScaleReversed.indexOf(note) * -1;
  return note;
};

const parseNotesAndNums = ({ notes }) => {
  return notesToArray(notes).map((note) => {
    const int = parseInt(note);
    return isNaN(int) ? note : int;
  });
};

const notesToNumbers = (params) => {
  const notesAndNums = parseNotesAndNums(params);
  if (notesAndNums.every((note) => !isNaN(note))) return { nums: params.notes, numsString: notesAndNums.join(' ') };

  const { lowerScaleReversed, upperScale, enharmonicLowerScaleReversed, enharmonicUpperScale } =
    makeMassiveScales(params);

  const nums = notesAndNums.map((note) =>
    noteToNum(note, lowerScaleReversed, upperScale, enharmonicLowerScaleReversed, enharmonicUpperScale)
  );

  const numsString = nums.join(' ');

  return { nums, numsString };
};

const numbersToNotes = (params) => {
  const notesAndNums = parseNotesAndNums(params);
  if (notesAndNums.every((note) => isNaN(note))) return { notes: params.notes, notesString: notesAndNums.join(' ') };

  const { lowerScaleReversed, upperScale } = makeSuperScale(params);

  const notes = notesAndNums.map((num) => numToNote(num, lowerScaleReversed, upperScale));

  const notesString = notes.join(' ');

  return { notes, notesString };
};

const reshuffle = ({ notes }) => {
  const notesArray = notesToArray(notes);

  //abstract this to dice. Do the same with rhythm reshuffle
  for (let i = notesArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [notesArray[i], notesArray[j]] = [notesArray[j], notesArray[i]];
  }

  return notesArray.join(' ');
};

const transposeByOne = (params, up) => {
  const notesAndNums = parseNotesAndNums(params);

  const { superMassiveScale, superMassiveChromaticScale } = makeMassiveScales(params);

  const tonicInterval = up ? 'm2' : 'A-1';
  const numInterval = up ? 1 : -1;

  const match = (superMassiveScale, note) => {
    let transposedNote = Note.simplify(Note.transpose(note, tonicInterval));
    while (superMassiveScale.indexOf(transposedNote) === -1) {
      transposedNote = Note.simplify(Note.transpose(transposedNote, tonicInterval));
      if (transposedNote === 'C-1') break;
      if (transposedNote === 'C7') break;
    }
    return transposedNote;
  };

  const transposedNotes = notesAndNums.map((note) => {
    if (!isNaN(note)) return note + numInterval;
    if (superMassiveChromaticScale.indexOf(note) !== -1) return match(superMassiveScale, note);
    return note;
  });

  const transposedNotesString = transposedNotes.join(' ');

  return { transposedNotes, transposedNotesString };
};

const reverseNotes = ({ notes }) => [...notesToArray(notes)].reverse().join(' ');

const getScale = ({ scale, rootNote, octave }) => Scale.get(`${rootNote}${octave} ${scale}`).notes.join(' ');

const inversion = (params) => {
  const { notes } = numbersToNotes(params);
  const midiNotes = notes.map((note) => {
    const midified = Note.midi(note);
    return midified ? midified : note;
  });
  const midiNotesOnly = midiNotes.filter((note) => !isNaN(note));

  const min = Math.min(...midiNotesOnly);
  const max = Math.max(...midiNotesOnly);
  const axis = (min + max) / 2;

  const invertedNotes = midiNotes
    .map((note) => {
      if (isNaN(note)) return note;
      if (note === axis) return note;
      if (note > axis) return axis - (note - axis);
      if (note < axis) return axis + (axis - note);
    })
    .map((note) => {
      const demidified = Note.fromMidi(note);
      return demidified ? demidified : note;
    });

  const invertedNotesString = invertedNotes.join(' ');

  return { invertedNotes, invertedNotesString };
};

const inversionCorrective = (params) => {
  const { invertedNotes } = inversion(params);
  const { superMassiveScale, superMassiveChromaticScale } = makeMassiveScales(params);

  const correctedInvertedNotes = invertedNotes.map((note) => {
    if (superMassiveChromaticScale.indexOf(note) === -1) return note;
    let transposedNote = Note.simplify(note);
    while (superMassiveScale.indexOf(transposedNote) === -1) {
      transposedNote = Note.simplify(Note.transpose(transposedNote, 'm2'));
      if (transposedNote === 'C-1') break;
      if (transposedNote === 'C7') break;
    }
    return transposedNote;
  });

  const correctedInvertedNotesString = correctedInvertedNotes.join(' ');

  return { correctedInvertedNotes, correctedInvertedNotesString };
};

const retrogradeInversion = (params) => {
  const { invertedNotes } = inversion(params);
  const reversedNotes = reverseNotes({ notes: invertedNotes });
  return reversedNotes;
};

const transposeSkipStep = (params, up, skip) => {
  const transposedOnce = transposeByOne(params, up).transposedNotes;
  const stepOrSkip = skip ? transposeByOne({ ...params, notes: transposedOnce }, up).transposedNotes : transposedOnce;
  return stepOrSkip;
};

const expandCompress = (params, noteToCompare, noteToTranspose, compress, skip) => {
  const toCompareMidi = Note.midi(noteToCompare);
  const toTransposeMidi = Note.midi(noteToTranspose);
  if (!toCompareMidi || !toTransposeMidi) return noteToTranspose;

  let comparedNoteIs = '';
  if (toCompareMidi > toTransposeMidi) {
    comparedNoteIs = 'higher';
  } else if (toCompareMidi < toTransposeMidi) {
    comparedNoteIs = 'lower';
  } else if (toCompareMidi === toTransposeMidi) {
    comparedNoteIs = 'equal';
  }

  //if compress is true, the note is one semitone away and skip is true, then it really isnt a compression
  let transposedNote = '';
  switch (comparedNoteIs) {
    case 'higher':
      transposedNote = compress
        ? transposeSkipStep({ ...params, notes: noteToTranspose }, true, skip)
        : transposeSkipStep({ ...params, notes: noteToTranspose }, false, skip);
      break;
    case 'lower':
      transposedNote = compress
        ? transposeSkipStep({ ...params, notes: noteToTranspose }, false, skip)
        : transposeSkipStep({ ...params, notes: noteToTranspose }, true, skip);
      break;
    case 'equal':
      transposedNote = compress
        ? [noteToTranspose]
        : transposeSkipStep({ ...params, notes: noteToTranspose }, true, skip);
      break;
  }

  return transposedNote.join('');
};
//make it so that an array of notes can be transposed, not just one. Actually thats not necessary. It is possible to compare to a constant note and cycle through an array of notes to compare in map fn

const oddEvenEC = (params, odd, compress, skip) => {
  const notesNoNums = numbersToNotes(params).notes;

  const transposedNotes = notesNoNums.map((note, noteIndex) => {
    switch (odd) {
      case true:
        if (noteIndex % 2 !== 0) return note;
        const followingNote = notesNoNums[noteIndex + 1];
        if (!followingNote) return note;
        return expandCompress(params, followingNote, note, compress, skip);

      case false:
        if (noteIndex % 2 === 0) return note;
        const previousNote = notesNoNums[noteIndex - 1];
        if (!previousNote) return note;
        return expandCompress(params, previousNote, note, compress, skip);
    }
  });

  return transposedNotes.join(' ');
};

const midEC = (params, compress, skip) => {};

const bordersEC = (params, compress, skip) => {};

const halfEC = (params, latter, compress, skip) => {};
/*
Intervalic expression and compression
write an expandCompress helper function that only accepts notes. To use it right perform numsToNotes 1 level of abstraction above
odd vs even
skip vs step
if even, look at the previous note, if odd, look at the following
mid compression or expansion - look at the realtionship between the 1st and the 2nd note. then transpose all instead of the first and the last
do the same for the very first and the very last note
transpose up or down based on the type
use stransposeByOne method
*/

const pitchAlgos = {
  notesToNums: {
    algo: (params) => notesToNumbers(params).numsString,
    description:
      'Transforms note names into numbers that signify intervalic distance from the root note. If the note is not present in the selected scale, it does not get transformed.',
  },
  numsToNotes: {
    algo: (params) => numbersToNotes(params).notesString,
    description: 'Transforms intervalic numbers into note names.',
  },
  reshuffle: {
    algo: reshuffle,
    description: 'Randomly reshuffles notes in the note pattern.',
  },
  retrograde: {
    algo: reverseNotes,
    description: 'Reverses the order of the notes.',
  },
  up: {
    algo: (params) => transposeByOne(params, true).transposedNotesString,
    description: 'Transposes all notes up by one intervalic distance in the selected scale.',
  },
  down: {
    algo: (params) => transposeByOne(params, false).transposedNotesString,
    description: 'Transposes all notes down by one intervalic distance in the selected scale.',
  },
  getScale: {
    algo: getScale,
    description: 'Lists all the notes of the selected scale. As simple as that.',
  },
  inversion: {
    algo: (params) => inversion(params).invertedNotesString,
    description: 'Turns the notes upside down.',
  },
  inversionCorrective: {
    algo: (params) => inversionCorrective(params).correctedInvertedNotesString,
    description:
      'Turns the notes upside down. If any note is out of scale, it transposes the note in the upwards dirrection until it is in scale.',
  },
  retrogradeInversion: {
    algo: retrogradeInversion,
    description: 'Reverses the order of the notes and turns them upside down.',
  },
  intervalicExpansionOddNotesStepwise: {
    algo: (params) => oddEvenEC(params, true, false, false),
    description: 'Expands intervals between odd notes and the following even notes in a stepwise motion.',
  },
  intervalicExpansionOddNotesSkipwise: {
    algo: (params) => oddEvenEC(params, true, false, true),
    description: 'Expands intervals between odd notes and the following even notes in a skipwise motion.',
  },
  intervalicCompressionOddNotesStepwise: {
    algo: (params) => oddEvenEC(params, true, true, false),
    description: 'Compresses intervals between odd notes and the following even notes in a stepwise motion.',
  },
  intervalicCompressionOddNotesSkipwise: {
    algo: (params) => oddEvenEC(params, true, true, true),
    description: 'Compresses intervals between odd notes and the following even notes in a skipwise motion.',
  },
  intervalicExpansionEvenNotesStepwise: {
    algo: (params) => oddEvenEC(params, false, false, false),
    description: 'Expands intervals between even notes and the preceeding odd notes in a stepwise motion.',
  },
  intervalicExpansionEvenNotesSkipwise: {
    algo: (params) => oddEvenEC(params, false, false, true),
    description: 'Expands intervals between even notes and the preceeding odd notes in a skipwise motion.',
  },
  intervalicCompressionEvenNotesStepwise: {
    algo: (params) => oddEvenEC(params, false, true, false),
    description: 'Compresses intervals between even notes and the preceeding odd notes in a stepwise motion.',
  },
  intervalicCompressionEvenNotesSkipwise: {
    algo: (params) => oddEvenEC(params, false, true, true),
    description: 'Compresses intervals between even notes and the preceeding odd notes in a skipwise motion.',
  },
};

//oddEvenEC(params, odd, compress, skip)

module.exports = { pitchAlgos, transposeSkipStep };

const pars = {
  octave: 0,
  subdiv: '4n',
  splitter: 0,
  splitChop: 0,
  scale: 'major',
  rootNote: 'C',
  // notes: ['C1', 'D1', 'F1', 'G1', 3],
  notes: ['C1', 'D1'],
  pattern: 'x__x__x_x',
  pitchDirrection: 'ascend',
  repeatNotes: 'on',
  sizzle: 'cos',
  upperBound: 5,
  lowerBound: 0,
  intervals: 'diatonic',
};
// console.log(oddEvenEC(pars, true, true, false)); //?

console.log(expandCompress(pars, 'D1', 'C1', false, false));
