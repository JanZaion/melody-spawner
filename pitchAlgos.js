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
  if (notesAndNums.every((note) => !isNaN(note))) return notesAndNums.join(' ');

  const { lowerScaleReversed, upperScale, enharmonicLowerScaleReversed, enharmonicUpperScale } =
    makeMassiveScales(params);

  const nums = notesAndNums.map((note) =>
    noteToNum(note, lowerScaleReversed, upperScale, enharmonicLowerScaleReversed, enharmonicUpperScale)
  );

  return nums.join(' ');
};

const numbersToNotes = (params) => {
  const notesAndNums = parseNotesAndNums(params);
  if (notesAndNums.every((note) => isNaN(note))) return notesAndNums.join(' ');

  const { lowerScaleReversed, upperScale } = makeSuperScale(params);

  const notes = notesAndNums.map((num) => numToNote(num, lowerScaleReversed, upperScale));

  return notes.join(' ');
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
  const nums = notesToArray(params.notes).map((note) => {
    const int = parseInt(note);
    return isNaN(int) ? note : int;
  });

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

  const transposedNotes = nums.map((note) => {
    if (!isNaN(note)) return note + numInterval;
    if (superMassiveChromaticScale.indexOf(note) !== -1) return match(superMassiveScale, note);
    return note;
  });

  return transposedNotes.join(' ');
};

const reverseNotes = ({ notes }) => [...notesToArray(notes)].reverse().join(' ');

const getScale = ({ scale, rootNote, octave }) => Scale.get(`${rootNote}${octave} ${scale}`).notes.join(' ');

const inversion = ({ notes }) => {
  const notesArray = notesToArray(notes);
  // const
};

const pitchAlgos = {
  notesToNums: {
    algo: notesToNumbers,
    description:
      'Transforms note names into numbers that signify intervalic distance from the root note. If the note is not present in the selected scale, it does not get transformed.',
  },
  numsToNotes: {
    algo: numbersToNotes,
    description: 'Transforms intervalic numbers into note names.',
  },
  reshuffle: {
    algo: reshuffle,
    description: 'Randomly reshuffles notes in the note pattern.',
  },
  reverse: {
    algo: reverseNotes,
    description: 'Reverses the order of the notes.',
  },
  up: {
    algo: (params) => transposeByOne(params, true),
    description: 'Transposes all notes up by one intervalic distance in the selected scale.',
  },
  down: {
    algo: (params) => transposeByOne(params, false),
    description: 'Transposes all notes down by one intervalic distance in the selected scale.',
  },
  getScale: {
    algo: getScale,
    description: 'Lists all the notes of the selected scale. As simple as that.',
  },
};

module.exports = { pitchAlgos };

const pars = {
  octave: 0,
  subdiv: '4n',
  splitter: 0,
  splitChop: 0,
  scale: 'minor',
  rootNote: 'F',
  notes: ['C#0'],
  pattern: 'x__x__x_x',
  pitchDirrection: 'ascend',
  repeatNotes: 'on',
  sizzle: 'cos',
  upperBound: 5,
  lowerBound: 0,
  intervals: 'diatonic',
};
console.log(notesToNumbers(pars));
