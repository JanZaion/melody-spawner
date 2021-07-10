'use strict';
const scribble = require('scribbletune');
const { Note, Mode } = require('@tonaljs/tonal');
const dice = require('convenient-methods-of-randomness');
const { liveFormatTranspose } = require('./liveFormatTranspose');

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

  const splitter2 = 6 - splitter;

  switch (splitter2) {
    case 5: //1/8
      var chopLength = 128;
      break;

    case 4: //1/4
      var chopLength = 256;
      break;

    case 3: //1/2
      var chopLength = 512;
      break;

    case 2: //1
      var chopLength = 2048;
      break;

    case 1: //2
      var chopLength = 4096;
      break;
  }

  const newClip = [];

  for (const step of scribbleClip) {
    const stepLength = step.length;

    const chops = Math.trunc(stepLength) / chopLength;

    const newPart = { ...step, length: stepLength / chops };

    for (let step2 = 0; step2 < chops; step2++) {
      if (splitChop === 0) {
        //split
        newClip.push(newPart);
      } else if (splitChop === 1) {
        //chop
        const newPartNull = { note: null, length: stepLength / chops, level: step.level };
        step2 % 2 === 0 ? newClip.push(newPart) : newClip.push(newPartNull);
      }
    }
    if (splitChop === 2) {
      //halve
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
          pitch: Note.midi(step.note[noteInt]),
          start_time: startTime / 512,
          duration: (endTime - startTime) / 512,
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

  const totalDuration = scribbleClip.reduce((duration, step) => (duration = duration + step.length), 0) / 512;

  return { liveFormat, totalDuration };
};

const numsToNotes = ({ mode, rootNote, octave, notes }) => {
  const upperMode = Mode.notes(mode, rootNote + octave);
  const lowerMode = Mode.notes(mode, rootNote + (octave - 1)).reverse();
  const finalMode = lowerMode.concat(upperMode);

  //converts number to an index of an array so that it works with upperMode/lowerMode
  const indexConvert = (number) => {
    if (number > 0 && number < 8) return number - 1 + 7; //1-7 range
    if (number > -8 && number < 0) return number * -1 - 1; //-1 - -7 range
    return 7; //any other number, 7 is root note of the finalMode
  };

  // If there is only 1 note inputed in max, its a string, we cant use string, only array, hence notesArray for this case
  const notesArray = (() => {
    return Array.isArray(notes) ? notes : [notes];
  })();

  notesArray.forEach((note, noteIndex) => {
    if (!isNaN(note)) notesArray[noteIndex] = finalMode[indexConvert(note)];
  });

  return notesArray;
};

const rollForNoteIndexes = ({ finalMode, numOfRandNotes, repeatNotesBool, notesRemaining }, dice) => {
  const maxRolls = (() => {
    return repeatNotesBool ? finalMode.length : notesRemaining.length;
  })();

  const rolls = (() => {
    return numOfRandNotes > maxRolls ? maxRolls : numOfRandNotes;
  })();

  return dice(maxRolls, 0, rolls);
};

const finalizeMode = (mode, rootNote, octave, upperBound, lowerBound) => {
  const RN = rootNote + octave;
  const upperMode = Mode.notes(mode, RN);
  const lowerMode = Mode.notes(mode, RN);

  for (let i = 0; i < 7 - upperBound; i++) {
    upperMode.pop();
  }

  for (let i = 0; i < 7 - lowerBound * -1; i++) {
    lowerMode.shift();
  }

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

const RsToNotes = ({ mode, rootNote, octave, upperBound, lowerBound, repeatNotes, pitchDirrection }, notesNoNums) => {
  const numOfRandNotes = (notesNoNums.join().match(/R/g) || []).length;

  if (numOfRandNotes === 0) return [];

  //finalMode is a set of 2 modes. One mode is a root note - an octave, the other is a root note + an octave. The final mode is also smoothed at the edges by the bounderies set in params
  const finalMode = finalizeMode(mode, rootNote, octave, upperBound, lowerBound);

  //notesRemaining is an array of notes that are NOT present in the notes array & respect lower and upper bound
  const notesRemaining = finalMode.filter((note) => {
    return notesNoNums.indexOf(note) === -1;
  });

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
  //notesNoNums is an array of notes where all numbers were transformed into notes
  const notesNoNums = numsToNotes(params);

  //notesNoRs is an array of notes where Rs are transformed into notes
  const notesNoRs = RsToNotes(params, notesNoNums);

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
//   subdiv: '4n',
//   splitter: 0,
//   mode: 'Phrygian',
//   rootNote: 'C',
//   notes: ['R', 'R', 'R', 1, 'C#3', 'D1'],
//   lowerBound: 0,
//   pattern: 'x__xxx__x',
//   pitchDirrection: 'descend',
//   repeatNotes: 'off',
//   sizzle: 'cos',
//   splitChop: 0,
//   upperBound: 5,
// };
// makeMelody(pars);
