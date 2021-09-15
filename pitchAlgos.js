const dice = require('convenient-methods-of-randomness');
const { makeSuperScale } = require('./superScale');
const { Note, Scale } = require('@tonaljs/tonal');

const notesToNums = ({ notes, scale, rootNote, octave }) => {
  const notesArray = Array.isArray(notes) ? notes : [notes];
  if (notesArray.every((note) => !isNaN(note))) return notesArray.join(' ');
  const superScale = makeSuperScale({ scale, rootNote, octave });

  const { upperScale, lowerScale } = superScale;
  const lowerScaleReversed = [...lowerScale].reverse();
  const upperScaleEnharmonic = upperScale.map((note) => Note.enharmonic(note));
  const lowerScaleEnharmonic = lowerScaleReversed.map((note) => Note.enharmonic(note));

  const nums = notesArray.map((note) => {
    if (upperScale.indexOf(note) !== -1) return upperScale.indexOf(note);
    if (lowerScale.indexOf(note) !== -1) return lowerScaleReversed.indexOf(note) * -1 - 1;
    if (upperScaleEnharmonic.indexOf(note) !== -1) return upperScaleEnharmonic.indexOf(note);
    if (lowerScaleEnharmonic.indexOf(note) !== -1) return lowerScaleEnharmonic.indexOf(note + 1) * -1 - 1;
    return note;
  });

  return nums.join(' ');
};

const thiser = () => {
  return 'C1 B6';
};

const pitchAlgos = {
  notesToNums: {
    algo: notesToNums,
    description:
      'Transforms note names into numbers that signify intervalic distance from the root note. If the note is not present in the selected scale, it does not get transformed.',
  },
  thiser: {
    algo: thiser,
    description:
      'some very long description about some stugg running through staff omg what am I typing now, I mean who even cares, whatever',
  },
};

module.exports = { pitchAlgos };

const pars = {
  octave: 2,
  subdiv: '4n',
  splitter: 0,
  splitChop: 0,
  scale: 'minor',
  rootNote: 'F',
  notes: ['Eb2', 'Db2', 'C2'],
  pattern: 'x__x__x_',
  pitchDirrection: 'ascend',
  repeatNotes: 'on',
  sizzle: 'cos',
  upperBound: 5,
  lowerBound: 0,
  intervals: 'diatonic',
};
