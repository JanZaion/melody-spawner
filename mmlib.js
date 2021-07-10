'use strict';
const scribble = require('scribbletune');
const { Note, Mode } = require('@tonaljs/tonal');
const dice = require('convenient-methods-of-randomness');

function diceRange(max, min) {
  //Dice roll, returns any number in the min-max range. Careful: The max number is excluded, so a roll for 2-8 would look like this: diceRange(9, 2)
  return Math.floor(Math.random() * (max - min) + min);
}

function diceMultiRollSortedASC(max, min, rolls) {
  //Multiple dice rolls, returns an array of ascending different numbers that is as long as the 'rolls' input. Max is excluded just like with diceRange.
  let arr = [];
  while (arr.length < rolls) {
    let r = Math.floor(Math.random() * (max - min) + min);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr.sort(function (a, b) {
    return a - b;
  });
}

function diceMultiRollSortedDSC(max, min, rolls) {
  //Multiple dice rolls, returns an array of descending different numbers that is as long as the 'rolls' input. Max is excluded just like with diceRange.
  let arr = [];
  while (arr.length < rolls) {
    let r = Math.floor(Math.random() * (max - min) + min);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr.sort(function (a, b) {
    return b - a;
  });
}

function diceMultiRollUnsorted(max, min, rolls) {
  //Multiple dice rolls, returns an array of unsorted numbers that is as long as the 'rolls' input. Max is excluded just like with diceRange.
  let arr = [];
  while (arr.length < rolls) {
    let r = Math.floor(Math.random() * (max - min) + min);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr;
}

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

function chopSplitHalve({ splitChop, splitter }, scribbleClip) {
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
}

const transposeNegativesInArray = (arr) => {
  return arr.map((note) => {
    if (note.indexOf('-') !== -1) {
      return Note.transpose(note, '8P');
    } else {
      return note;
    }
  });
};

const noteNamesFromLiveFormat = (liveFormat) => {
  return liveFormatTranspose(liveFormat, -12)
    .map((step) => {
      return Note.fromMidi(step.pitch);
    })
    .join(' ');
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

const liveFormatTranspose = (liveFormat, interval) => {
  return liveFormat.map((step) => {
    return { ...step, pitch: step.pitch + interval };
  });
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

const RsToNotes = ({ mode, rootNote, octave, upperBound, lowerBound, repeatNotes, pitchDirrection }, notesNoNums) => {
  //at the end, make better use of params
  const numOfRandNotes = (notesNoNums.join().match(/R/g) || []).length;

  if (numOfRandNotes === 0) return notesNoNums;

  //finalMode is a set of 2 modes. One mode is a root note - an octave, the other is a root note + an octave. The final mode is also smoothed at the edges by the bounderies set in params
  const finalMode = finalizeMode(mode, rootNote, octave, upperBound, lowerBound);

  //notesRemaining is an array of notes that are NOT present in the notes array & respect lower and upper bound
  const notesRemaining = finalMode.filter((note) => {
    return notesNoNums.indexOf(note) === -1;
  });

  const repeatNotesBool = maxToBool(repeatNotes);

  //noteIndexes is an array of integers of the final notes in the notesRemaining or finalMode arrays.
  const noteIndexes = (() => {
    const rollParams = { finalMode, numOfRandNotes, repeatNotesBool, notesRemaining, pitchDirrection };
    switch (pitchDirrection) {
      case 'any':
        return rollForNoteIndexes(rollParams, diceMultiRollUnsorted); //the problem here is that repeatNotes on is totally unacauted for. every return statement needs to be rewritten to ifelse shorthand, where if repean: 'on', new dice has to be created that will have a chance to roll nums that return the same numbers, not like now

      case 'ascend':
        return rollForNoteIndexes(rollParams, diceMultiRollSortedASC);

      case 'descend':
        return rollForNoteIndexes(rollParams, diceMultiRollSortedDSC);
    }
  })();

  //absoluteRs is an array of notes that represent all the Rs transformed into absolute notes
  //Closures: finalMode, noteIndexes, repeatNotesBool, notesRemaining
  //Note: this is probably a needless garbage since the noteIndexes fn sux. Look into it
  const absoluteRs = (() => {
    switch (repeatNotesBool) {
      case true:
        return noteIndexes.map((noteInteger) => {
          return finalMode[noteInteger];
        });
      case false:
        return noteIndexes.map((noteInteger) => {
          return notesRemaining[noteInteger];
        });
    }
  })();

  //absoluteNotes is an array of all the notes while Rs are transformed
  //Closures: notesNoNums, absoluteRs
  const absoluteNotes = (() => {
    const notesDuplicate = notesNoNums; //trash
    let counter = 0;
    notesDuplicate.forEach((note, noteIndex) => {
      if (note === 'R') {
        notesDuplicate[noteIndex] = absoluteRs[counter];
        counter < absoluteRs.length - 1 ? (counter += 1) : (counter = 0);
      }
    });

    return notesDuplicate;
  })();

  return absoluteNotes;
};

const makeMelody = (params) => {
  //notesNoNums is an array of notes where all numbers were transformed into notes
  const notesNoNums = numsToNotes(params);

  //notesNoRs is an array of notes that will be sent to Scribbletune. All Rs are transformed into notes
  const notesNoRs = RsToNotes(params, notesNoNums);

  //notesNoNegatives is an array where all the C-1s etc where transposed an octave above
  const notesNoNegatives = transposeNegativesInArray(notesNoRs);

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
  noteNamesFromLiveFormat,
};

// const params = {
//   octave: 1,
//   subdiv: '4n',
//   splitter: 0,
//   mode: 'Phrygian',
//   rootNote: 'C',
//   notes: ['R', 'R', 'R'],
//   lowerBound: 0,
//   pattern: 'x__xxx__x',
//   pitchDirrection: 'descend',
//   repeatNotes: 'off',
//   sizzle: 'cos',
//   splitChop: 0,
//   upperBound: 5,
// };
