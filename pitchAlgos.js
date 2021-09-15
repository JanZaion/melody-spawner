const dice = require('convenient-methods-of-randomness');
const { makeSuperScale } = require('./superScale');

const dunno = (notes) => {
  return notes + 'hello';
};

const thiser = () => {
  return 'C1 B6';
};

const notesToNums = ({ notes, scale, rootNote, octave }) => {
  const notesArray = Array.isArray(notes) ? notes : [notes];
  if (notesArray.every((note) => !isNaN(note))) return notes;
  const superScale = makeSuperScale({ scale, rootNote, octave });

  const { upperScale, lowerScale } = superScale;

  const nums = notesArray.map((note) => {
    if (upperScale.indexOf(note) !== -1) return upperScale.indexOf(note);
    if (lowerScale.indexOf(note) !== -1) return lowerScale.reverse().indexOf(note) * -1;
    return note;
  });
  console.log(upperScale);

  return nums;
};

const pitchAlgos = {
  dunno: { algo: dunno, description: 'dunno what this is supposed to be' },
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
  notes: ['Db3', 'C1', 'R', 'C2'],
  pattern: 'x__x__x_',
  pitchDirrection: 'ascend',
  repeatNotes: 'on',
  sizzle: 'cos',
  upperBound: 5,
  lowerBound: 0,
  intervals: 'diatonic',
};
console.log(notesToNums(pars));
