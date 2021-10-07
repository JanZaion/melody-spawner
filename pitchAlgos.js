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
      'Turns the notes upside down. If any note is out of scale, it transposes the note in the upwards dirrection until it is in scale',
  },
  retrogradeInversion: {
    algo: retrogradeInversion,
    description: 'Reverses the order of the notes and turns them upside down',
  },
};

module.exports = { pitchAlgos, transposeByOne };

const pars = {
  octave: 0,
  subdiv: '4n',
  splitter: 0,
  splitChop: 0,
  scale: 'major',
  rootNote: 'F',
  notes: ['Gb1', 'A1', 'B1'],
  pattern: 'x__x__x_x',
  pitchDirrection: 'ascend',
  repeatNotes: 'on',
  sizzle: 'cos',
  upperBound: 5,
  lowerBound: 0,
  intervals: 'diatonic',
};
transposeByOne(pars); //?
