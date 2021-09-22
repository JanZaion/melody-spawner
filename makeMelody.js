'use strict';
const scribble = require('scribbletune');
const { Note, Scale } = require('@tonaljs/tonal');
const dice = require('convenient-methods-of-randomness');
const { liveFormatTranspose } = require('./liveFormatTranspose');
const { makeSuperScale } = require('./superScale');
const { notesToArray } = require('./notesToArray');
const jsmidgen = require('jsmidgen');

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

const makeBaseScale = ({ scale, rootNote, octave }) => {
  const upperScale = Scale.get(`${rootNote}${octave} ${scale}`).notes.map((note) => Note.simplify(note));
  const lowerScale = [...upperScale].map((note) => Note.transpose(note, '-8P'));
  upperScale.push(rootNote + (octave + 1));

  return { upperScale, lowerScale, finalScale: lowerScale.concat(upperScale) };
};

const numsToNotes = (notesArray, selectedScale) => {
  if (notesArray.every((note) => isNaN(note))) return notesArray;

  const { upperScale, lowerScale, lowerScaleReversed } = selectedScale;

  const noNums = notesArray.map((note) => {
    switch (isNaN(note)) {
      case true:
        return note;

      case false:
        if (note > 0 && note < upperScale.length + 1) return upperScale[note];
        if (note < 0 && note > (lowerScale.length + 1) * -1) return lowerScaleReversed[note * -1];
        return upperScale[0];
    }
  });

  return noNums;
};

const rollForNoteIndexes = ({ finalScale, numOfRandNotes, repeatNotesBool, notesRemaining }, dice) => {
  const maxRolls = repeatNotesBool ? finalScale.length : notesRemaining.length;

  const rolls = numOfRandNotes > maxRolls ? maxRolls : numOfRandNotes;

  return dice(maxRolls, 0, rolls);
};

const finalizeScale = (upperBound, lowerBound, selectedScale) => {
  const { upperScale, lowerScale } = selectedScale;

  const upperCount = upperScale.length - upperBound - 1;
  for (let i = 0; i < upperCount; i++) upperScale.pop();

  const lowerCount = lowerScale.length - lowerBound * -1;
  for (let i = 0; i < lowerCount; i++) lowerScale.shift();

  return lowerScale.concat(upperScale);
};

const RsToNoteIndexes = (finalScale, numOfRandNotes, notesRemaining, pitchDirrection, repeatNotesBool) => {
  const rollParams = { finalScale, numOfRandNotes, notesRemaining, pitchDirrection, repeatNotesBool };
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
  selectedScale
) => {
  const numOfRandNotes = (notesNoNums.join().match(/R/g) || []).length;

  if (numOfRandNotes === 0) return [];

  //finalScale is a set of 2 scales. One scale is a root note - an octave, the other is a root note + an octave. The final scale is also smoothed at the edges by the bounderies set in params
  const finalScale = finalizeScale(upperBound, lowerBound, selectedScale);

  //notesRemaining is an array of notes that are NOT present in the notes array & respect lower and upper bound
  const notesRemaining = finalScale.filter((note) => {
    return notesNoNums.indexOf(note) === -1;
  });

  if (notesRemaining.length === 0) notesRemaining.push(rootNote + octave);

  const repeatNotesBool = repeatNotes === 1 ? true : false;

  //noteIndexes is an array of integers of the final notes in the notesRemaining or finalScale arrays.
  const noteIndexes = RsToNoteIndexes(finalScale, numOfRandNotes, notesRemaining, pitchDirrection, repeatNotesBool);

  //absoluteRs is an array of notes that represent all the Rs transformed into absolute notes
  const absoluteRs = noteIndexes.map((noteInteger) => {
    return repeatNotesBool ? finalScale[noteInteger] : notesRemaining[noteInteger];
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
  const notesArray = notesToArray(params.notes);

  const baseScale = makeBaseScale(params);

  const superScale = makeSuperScale(params);

  //notesNoNums is an array of notes where all numbers were transformed into notes
  const notesNoNums = numsToNotes(notesArray, superScale);

  //notesNoRs is an array of notes where Rs are transformed into notes
  const notesNoRs = RsToNotes(params, notesNoNums, baseScale);

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
//   subdiv: '4n',
//   splitter: 0,
//   octave: 1,
//   scale: 'Minor',
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
