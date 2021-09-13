'use strict';
const scribble = require('scribbletune');
const { Note, Mode, Scale } = require('@tonaljs/tonal');
const dice = require('convenient-methods-of-randomness');
const { liveFormatTranspose } = require('./liveFormatTranspose');
const jsmidgen = require('jsmidgen');

const maxToBool = (str) => {
  switch (str) {
    case 0: //inverted logic for toggle indexes in Max
      return true;

    case 1:
      return false;
  }
};

const chopSplitHalve = ({ splitChop, splitter }, scribbleClip) => {
  if (splitter === 0) return scribbleClip;

  const chopLength = [0, 1, 2, 4, 8, 16, 32, 64][splitter] * 16;
  const newClip = [];

  for (const step of scribbleClip) {
    const stepLength = step.length;
    const chops = Math.trunc(stepLength) / chopLength;
    const newPart = { ...step, length: chopLength };

    for (let step2 = 0; step2 < chops; step2++) {
      //split
      if (splitChop === 0) {
        newClip.push(newPart);
      }

      //chop
      if (splitChop === 1) {
        const newPartNull = { ...step, note: null, length: chopLength };
        step2 % 2 === 0 ? newClip.push(newPart) : newClip.push(newPartNull);
      }
    }

    //halve
    if (splitChop === 2) {
      let stepLengthHalved = stepLength;
      let exp = 2;

      for (let k = 0; k < splitter; k++) stepLengthHalved = stepLengthHalved / 2;
      for (let m = 0; m < splitter - 1; m++) exp = exp * 2;
      const newPartHalved = { ...step, length: stepLengthHalved };
      for (let l = 0; l < exp; l++) newClip.push(newPartHalved);
    }
  }

  return newClip;
};

const transposeNegativesInArray = (arr) => {
  return arr.map((note) => {
    if (note.indexOf('-') !== -1) {
      return Note.transpose(note, '8P');
    } else {
      return note;
    }
  });
};

const scribbleClipToMidiSteps = (scribbleClip) => {
  let startTime = 0;
  let endTime = 0;
  const liveFormat = [];
  for (const step of scribbleClip) {
    endTime += step.length;

    if (step.note) {
      for (let noteInt = 0; noteInt < step.note.length; noteInt++) {
        liveFormat.push({
          pitch: jsmidgen.Util.midiPitchFromNote(step.note[noteInt]),
          start_time: startTime / 128,
          duration: (endTime - startTime) / 128,
          velocity: step.level,
          probability: 1,
          velocity_deviation: 1,
          release_velocity: 64,
          mute: 0,
        });
      }
    }

    startTime += step.length;
  }

  const totalDuration = scribbleClip.reduce((duration, step) => (duration = duration + step.length), 0) / 128;

  return { liveFormat, totalDuration };
};

const selectScale = ({ mode, rootNote, octave }) => {
  const upperMode = Scale.get(`${rootNote}${octave} ${mode}`).notes.map((note) => Note.simplify(note));
  const lowerMode = [...upperMode].map((note) => Note.transpose(note, '-8P'));
  upperMode.push(rootNote + (octave + 1));

  return { upperMode, lowerMode, finalMode: lowerMode.concat(upperMode) };
};

const numsToNotes = (notesArray, selectedMode) => {
  if (notesArray.every((note) => isNaN(note))) return notesArray;

  const { upperMode, lowerMode } = selectedMode;

  const noNums = notesArray.map((note) => {
    switch (isNaN(note)) {
      case true:
        return note;

      case false:
        if (note > 0 && note < upperMode.length + 1) return upperMode[note];
        if (note < 0 && note > (lowerMode.length + 1) * -1) return lowerMode.reverse()[(note + 1) * -1];
        return upperMode[0];
    }
  });

  return noNums;
};

const rollForNoteIndexes = ({ finalMode, numOfRandNotes, repeatNotesBool, notesRemaining }, dice) => {
  const maxRolls = repeatNotesBool ? finalMode.length : notesRemaining.length;

  const rolls = numOfRandNotes > maxRolls ? maxRolls : numOfRandNotes;

  return dice(maxRolls, 0, rolls);
};

const finalizeMode = (upperBound, lowerBound, selectedMode) => {
  const { upperMode, lowerMode } = selectedMode;

  const upperCount = upperMode.length - upperBound - 1;
  for (let i = 0; i < upperCount; i++) upperMode.pop();

  const lowerCount = lowerMode.length - lowerBound * -1;
  for (let i = 0; i < lowerCount; i++) lowerMode.shift();

  return lowerMode.concat(upperMode);
};

const RsToNoteIndexes = (finalMode, numOfRandNotes, notesRemaining, pitchDirrection, repeatNotesBool) => {
  const rollParams = { finalMode, numOfRandNotes, notesRemaining, pitchDirrection, repeatNotesBool };
  switch (pitchDirrection) {
    case 'any':
      return repeatNotesBool
        ? rollForNoteIndexes(rollParams, dice.multiRollUnsorted)
        : rollForNoteIndexes(rollParams, dice.multiRollUniqueUnsorted);

    case 'ascend':
      return repeatNotesBool
        ? rollForNoteIndexes(rollParams, dice.multiRollSortedAscending)
        : rollForNoteIndexes(rollParams, dice.multiRollUniqueSortedAscending);

    case 'descend':
      return repeatNotesBool
        ? rollForNoteIndexes(rollParams, dice.multiRollSortedDescending)
        : rollForNoteIndexes(rollParams, dice.multiRollUniqueSortedDescending);
  }
};

const RsToNotes = (
  { upperBound, lowerBound, repeatNotes, pitchDirrection, rootNote, octave },
  notesNoNums,
  selectedMode
) => {
  const numOfRandNotes = (notesNoNums.join().match(/R/g) || []).length;

  if (numOfRandNotes === 0) return [];

  //finalMode is a set of 2 modes. One mode is a root note - an octave, the other is a root note + an octave. The final mode is also smoothed at the edges by the bounderies set in params
  const finalMode = finalizeMode(upperBound, lowerBound, selectedMode);

  //notesRemaining is an array of notes that are NOT present in the notes array & respect lower and upper bound
  const notesRemaining = finalMode.filter((note) => {
    return notesNoNums.indexOf(note) === -1;
  });

  if (notesRemaining.length === 0) notesRemaining.push(rootNote + octave);

  const repeatNotesBool = maxToBool(repeatNotes);

  //noteIndexes is an array of integers of the final notes in the notesRemaining or finalMode arrays.
  const noteIndexes = RsToNoteIndexes(finalMode, numOfRandNotes, notesRemaining, pitchDirrection, repeatNotesBool);

  //absoluteRs is an array of notes that represent all the Rs transformed into absolute notes
  const absoluteRs = noteIndexes.map((noteInteger) => {
    return repeatNotesBool ? finalMode[noteInteger] : notesRemaining[noteInteger];
  });

  return absoluteRs;
};

const joinNoNumsWithNoRs = (notesNoNums, notesNoRs) => {
  const notes = [];
  let counter = 0;
  for (const note of notesNoNums) {
    if (note === 'R') {
      notes.push(notesNoRs[counter]);
      counter < notesNoRs.length - 1 ? (counter += 1) : (counter = 0);
    } else {
      notes.push(note);
    }
  }

  return notes;
};

const makeMelody = (params) => {
  //if there is only one note coming from the textfield, it saves to the dict as a string, but we always need an array
  const notesArray = Array.isArray(params.notes) ? params.notes : [params.notes];

  const selectedMode = selectScale(params);

  //notesNoNums is an array of notes where all numbers were transformed into notes
  const notesNoNums = numsToNotes(notesArray, selectedMode);

  //notesNoRs is an array of notes where Rs are transformed into notes
  const notesNoRs = RsToNotes(params, notesNoNums, selectedMode);

  //notesAll is an array of notes that will be sent to Scribbletune after transposition
  const notesAll = joinNoNumsWithNoRs(notesNoNums, notesNoRs);

  //notesNoNegatives is an array where all the C-1s etc where transposed an octave above
  const notesNoNegatives = transposeNegativesInArray(notesAll);

  //scribbleClip is a clip with the final melody
  const scribbleClip = scribble.clip({
    notes: notesNoNegatives,
    pattern: params.pattern,
    subdiv: params.subdiv,
    sizzle: params.sizzle,
  });

  //choppedScribbleClip: is a scribbletune clip that has its notes chopped or split or halved
  const choppedScribbleClip = chopSplitHalve(params, scribbleClip);

  const preTransposedMidiSteps = scribbleClipToMidiSteps(choppedScribbleClip);

  const liveFormat = liveFormatTranspose(preTransposedMidiSteps.liveFormat, 12);

  const totalDuration = preTransposedMidiSteps.totalDuration;

  return { liveFormat, totalDuration };
};

module.exports = {
  makeMelody,
};

// const pars = {
//   octave: 1,
//   subdiv: '4n',
//   splitter: 0,
//   splitChop: 0,
//   mode: 'Major',
//   rootNote: 'D#',
//   notes: ['R', 'R', 'R', 'R'],
//   pattern: 'x__x__x_',
//   pitchDirrection: 'ascend',
//   repeatNotes: 'on',
//   sizzle: 'cos',
//   upperBound: 5,
//   lowerBound: 0,
//   intervals: 'diatonic',
// };
// // makeMelody(pars);
// console.log(makeMelody(pars));

// const pars = {
//   subdiv: '4n',
//   splitter: 0,
//   octave: 1,
//   mode: 'Minor',
//   rootNote: 'D#',
//   chordPatterns: 'R R R R',
//   notes: [1, 'R', 'R', 'R'],
//   patterns: 'xxxx',
//   pattern: 'x_xx_x__',
//   pitchAlgo: 'dunno',
//   repeatNotes: 'off',
//   rhythmAlgo: 'short_wild',
//   sizzle: 'none',
//   splitChop: 2,
//   upperBound: 1,
//   pitchDirrection: 'ascend',
//   lowerBound: -4,
//   intervals: 'chromatic',
// };

// makeMelody(pars);
const scales = [
  //+minor
  'major pentatonic',
  'ionian pentatonic',
  'mixolydian pentatonic',
  'ritusen',
  'egyptian',
  'neopolitan major pentatonic',
  'vietnamese 1',
  'pelog',
  'kumoijoshi',
  'hirajoshi',
  'iwato',
  'in-sen',
  'lydian pentatonic',
  'malkos raga',
  'locrian pentatonic',
  'minor pentatonic',
  'minor six pentatonic',
  'flat three pentatonic',
  'flat six pentatonic',
  'scriabin',
  'whole tone pentatonic',
  'lydian #5P pentatonic',
  'lydian dominant pentatonic',
  'minor #7M pentatonic',
  'super locrian pentatonic',
  'minor hexatonic',
  'augmented',
  'major blues',
  'piongio',
  'prometheus neopolitan',
  'prometheus',
  'mystery #1',
  'six tone symmetric',
  'whole tone',
  "messiaen's mode #5",
  'minor blues',
  'locrian major',
  'double harmonic lydian',
  'harmonic minor',
  'altered',
  'locrian #2',
  'mixolydian b6',
  'lydian dominant',
  'lydian',
  'lydian augmented',
  'dorian b2',
  'melodic minor',
  'locrian',
  'ultralocrian',
  'locrian 6',
  'augmented heptatonic',
  'romanian minor',
  'dorian #4',
  'lydian diminished',
  'phrygian',
  'leading whole tone',
  'lydian minor',
  'phrygian dominant',
  'balinese',
  'neopolitan major',
  'aeolian',
  'harmonic major',
  'double harmonic major',
  'dorian',
  'hungarian minor',
  'hungarian major',
  'oriental',
  'flamenco',
  'todi raga',
  'mixolydian',
  'persian',
  'major',
  'enigmatic',
  'major augmented',
  'lydian #9',
  "messiaen's mode #4",
  'purvi raga',
  'spanish heptatonic',
  'bebop',
  'bebop minor',
  'bebop major',
  'bebop locrian',
  'minor bebop',
  'diminished',
  'ichikosucho',
  'minor six diminished',
  'half-whole diminished',
  'kafi raga',
  "messiaen's mode #6",
  'composite blues',
  "messiaen's mode #3",
  "messiaen's mode #7",
  'chromatic',
];
// scales.forEach((it) => {
//   console.log(Scale.get('c1 ' + it).notes.length);
// });

// console.log(Scale.get('c1 minor'));

const chromatic = [];
const nonatonic = [];
const octatonic = [];
const diatonic = [];
const hexatonic = [];
const pentatonic = [];
const trash = [];

scales.forEach((it) => {
  const l = Scale.get('c1 ' + it).notes.length;
  switch (l) {
    case 5:
      pentatonic.push(it);
      break;
    case 6:
      hexatonic.push(it);
      break;
    case 7:
      diatonic.push(it);
      break;
    case 8:
      octatonic.push(it);
      break;
    case 9:
      nonatonic.push(it);
      break;
    case 12:
      chromatic.push(it);
      break;

    default:
      trash.push(it);
      break;
  }
});

// console.log(Scale.get('d1 ' + chromatic));
// console.log(chromatic);
// console.log(nonatonic);
// console.log(octatonic);
// console.log(diatonic);
// console.log(hexatonic);
// console.log(pentatonic);
// console.log(trash);

// Chromatic, or dodecatonic (12 notes per octave)
// Nonatonic (9 notes per octave): a chromatic variation of the heptatonic blues scale
// Octatonic (8 notes per octave): used in jazz and modern classical music
// Diatonic (7 notes per octave): the most common modern Western scale
// Hexatonic (6 notes per octave): common in Western folk music
// Pentatonic (5 notes per octave): the anhemitonic form (lacking semitones) is common in folk music, especially in Asian music; also known as the "black note" scale
