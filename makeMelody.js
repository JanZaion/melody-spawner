'use strict';
const scribble = require('scribbletune');
const { Note, Mode } = require('@tonaljs/tonal');
const dice = require('convenient-methods-of-randomness');
const { liveFormatTranspose } = require('./liveFormatTranspose');
const jsmidgen = require('jsmidgen');

const maxToBool = (str) => {
  switch (str) {
    case 'yes':
      return true;

    case 'no':
      return false;

    case 'on':
      return true;

    case 'off':
      return false;

    case 'sevenths':
      return true;

    case 'triads':
      return false;

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

const selectMode = ({ mode, rootNote, octave, intervals }) => {
  const chromaticMode = (rootNote, octave) => {
    const chromatic =
      rootNote.indexOf('b') === -1
        ? ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
        : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const repeats = chromatic.indexOf(rootNote);
    for (let i = 0; i < repeats; i++) chromatic.push(chromatic.shift());

    const upperMode = chromatic.map((note) => note + octave);
    upperMode.push(rootNote + (octave + 1));
    const lowerMode = chromatic.map((note) => note + (octave - 1));

    return { upperMode, lowerMode, finalMode: lowerMode.concat(upperMode) };
  };

  const diatonicMode = (mode, rootNote, octave) => {
    const upperMode = Mode.notes(mode, rootNote + octave);
    upperMode.push(rootNote + (octave + 1));
    const lowerMode = Mode.notes(mode, rootNote + (octave - 1));

    return { upperMode, lowerMode, finalMode: lowerMode.concat(upperMode) };
  };

  return intervals === 'diatonic' ? diatonicMode(mode, rootNote, octave) : chromaticMode(rootNote, octave);
};

const numsToNotes = ({ notes }, selectedMode) => {
  if (notes.every((note) => isNaN(note))) return notes;

  const { upperMode, lowerMode } = selectedMode;

  const notesArray = Array.isArray(notes) ? notes : [notes];

  const noNums = notesArray.map((note) => {
    switch (isNaN(note)) {
      case true:
        return note;

      case false:
        if (note > 0 && note < upperMode.length + 1) return upperMode[note - 1];
        if (note < 0 && note > (lowerMode.length + 1) * -1) return lowerMode[(note + 1) * -1];
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

  const upperCount = upperMode.length - upperBound;
  for (let i = 0; i < upperCount; i++) upperMode.pop();

  const lowerCount = lowerMode.length - lowerBound * -1;
  for (let i = 0; i < lowerCount; i++) lowerMode.shift();

  lowerMode.forEach((tone, toneIndex) => {
    lowerMode[toneIndex] = Note.transpose(tone, '-8P');
  });

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
  const selectedMode = selectMode(params);
  //notesNoNums is an array of notes where all numbers were transformed into notes
  const notesNoNums = numsToNotes(params, selectedMode);

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
//   subdiv: '8n',
//   splitter: 0,
//   splitChop: 2,
//   mode: 'Major',
//   rootNote: 'C',
//   notes: ['R', 'R', 'R'],
//   pattern: 'xxxx',
//   pitchDirrection: 'descend',
//   repeatNotes: 'off',
//   sizzle: 'cos',
//   upperBound: 1,
//   lowerBound: -3,
//   intervals: 'diatonic',
// };
// makeMelody(pars);
// // console.log(makeMelody(pars));
