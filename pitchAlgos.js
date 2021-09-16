const dice = require('convenient-methods-of-randomness');
const { makeSuperScale } = require('./superScale');
const { Note, Scale } = require('@tonaljs/tonal');
const { notesToArray } = require('./notesToArray');

const enharmoniseScale = (scale) => scale.map((note) => Note.enharmonic(note));

const notesToNums = ({ notes, scale, rootNote, octave }) => {
  const notesArray = notesToArray(notes);
  if (notesArray.every((note) => !isNaN(note))) return notesArray.join(' ');
  const superScale = makeSuperScale({ scale, rootNote, octave });

  const { upperScale, lowerScale } = superScale;
  const lowerScaleReversed = [...lowerScale].reverse();
  const upperScaleEnharmonic = enharmoniseScale(upperScale);
  const lowerScaleEnharmonic = enharmoniseScale(lowerScaleReversed);

  const nums = notesArray.map((note) => {
    if (upperScale.indexOf(note) !== -1) return upperScale.indexOf(note);
    if (lowerScale.indexOf(note) !== -1) return lowerScaleReversed.indexOf(note) * -1 - 1;
    if (upperScaleEnharmonic.indexOf(note) !== -1) return upperScaleEnharmonic.indexOf(note);
    if (lowerScaleEnharmonic.indexOf(note) !== -1) return lowerScaleEnharmonic.indexOf(note + 1) * -1 - 1;
    return note;
  });

  return nums.join(' ');
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

  const superScale = makeSuperScale(params).finalScale;
  const superEnharmonicScale = enharmoniseScale(superScale);
  const superMassiveScale = superScale.concat(superEnharmonicScale);
  const superChromaticScale = makeSuperScale({ ...params, scale: 'chromatic' }).finalScale;
  const superChromaticEnharmonicScale = enharmoniseScale(superChromaticScale);
  const superMassiveChromaticScale = superChromaticScale.concat(superChromaticEnharmonicScale);

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

const pitchAlgos = {
  notesToNums: {
    algo: notesToNums,
    description:
      'Transforms note names into numbers that signify intervalic distance from the root note. If the note is not present in the selected scale, it does not get transformed.',
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
  octave: 2,
  subdiv: '4n',
  splitter: 0,
  splitChop: 0,
  scale: 'major pentatonic',
  rootNote: 'F#',
  notes: ['G2', 'F2'],
  pattern: 'x__x__x_',
  pitchDirrection: 'ascend',
  repeatNotes: 'on',
  sizzle: 'cos',
  upperBound: 5,
  lowerBound: 0,
  intervals: 'diatonic',
};
getScale(pars);
