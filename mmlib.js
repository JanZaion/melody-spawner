'use strict';
const scribble = require('scribbletune');
const {
  Note,
  Key,
  Interval,
  Scale,
  transpose,
  interval,
  ScaleType,
  RomanNumeral,
  Progression,
  Mode,
} = require('@tonaljs/tonal');

// const { Random } = require('random-js'); //random lib at https://www.npmjs.com/package/random-js //rewrite the old dices to use random in them
// const random = new Random(); // const value = random.integer(1, 2);

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

const humanToBool = (str) => {
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

    case 0: //inverted logic for indexes
      return true;

    case 1:
      return false;
  }
};

/*
  Do next:
  test & debug

  bugs to fix at the final stage:
  -scribbletune +1 octave
*/
const makeMelody = (params) => {
  const {
    rootNote, //root note of a mode
    mode, //mode from which to construct
    octave, //pitch of the melody
    upperBound, //notes will not be higher than this. Bounds are 1-7
    lowerBound, //notes will not be lower than this. Bounds are -1 to -7
    pattern, //rhythm pattern
    notes, //note pattern array
    repeatNotes, //have multiple random notes
    sizzle, //velocity
    pitchDirrection, //ascending or descending or any melody?
    subdiv, //subdiv
  } = params;

  //notesNoNums is an array of notes where all numbers were transformed into tones
  //Closures: mode, rootNote, octave, notes
  const notesNoNums = (() => {
    const upperMode = Mode.notes(mode, rootNote + octave);
    const lowerMode = Mode.notes(mode, rootNote + (octave - 1)).reverse();
    const finalMode = lowerMode.concat(upperMode);

    //converts number to an index of an array so that it works with upperMode/lowerMode
    const indexConvert = (number) => {
      if (number > 0 && number < 8) return number - 1 + 7; //1-7 range
      if (number > -8 && number < 0) return number * -1 - 1; //-1 - -7 range
      return 7; //any other number, 7 is root note of the finalMode
    };

    const notesDuplicate = notes;

    notesDuplicate.forEach((note, noteIndex) => {
      if (!isNaN(note)) notesDuplicate[noteIndex] = finalMode[indexConvert(note)];
    });

    return notesDuplicate;
  })();

  //notesNoRs is an array of notes that will be sent to Scribbletune. All Rs are transformed into tones
  //Closures: mode, rootNote, octave, notesNoNums, upperBound, lowerBound, repeatNotes, pitchDirrection
  const notesNoRs = (() => {
    //numOfRandNotes is the # of R utterances in notes
    const numOfRandNotes = (notesNoNums.join().match(/R/g) || []).length;

    //guard clause. If there are no Rs, we avoid all the R-related processing
    if (numOfRandNotes === 0) return notesNoNums;

    //finalMode is a set of 2 modes. One mode is a root note - an octave, the other is a root note + an octave. The final mode is also smoothed at the edges bz the bounderies set in params
    //Closures: mode, rootNote, octave, upperBound, lowerBound
    const finalMode = (() => {
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
    })();

    //notesRemaining is an array of notes that are NOT present in the notes array & respect lower and upper bound
    //Closures: notesNoNums, finalMode
    const notesRemaining = finalMode.filter((note) => {
      return notesNoNums.indexOf(note) === -1;
    });

    //repeatNotesBool is boolean that reflexts max input
    const repeatNotesBool = humanToBool(repeatNotes);

    //noteIntegers is an array of integers of the final notes in the notesRemaining or finalMode arrays
    //Closures: finalMode, numOfRandNotes, pitchDirrection, repeatNotesBool, notesRemaining
    const noteIntegers = (() => {
      //rolls is the number of rolls for the following dice rolls
      const rolls = (() => {
        switch (repeatNotesBool) {
          //repeat: If the number of random notes exceeds the number of finalMode notes, then finalMode.length is rolls
          case true:
            return numOfRandNotes > finalMode.length ? finalMode.length : numOfRandNotes;

          //norepeat: If the number of random notes exceeds the number of notesRemaining, then notesReamining.length is rolls
          case false:
            return numOfRandNotes > notesRemaining.length ? notesRemaining.length : numOfRandNotes;
        }
      })();

      switch (pitchDirrection) {
        case 'any':
          return repeatNotesBool
            ? diceMultiRollUnsorted(finalMode.length, 0, rolls)
            : diceMultiRollUnsorted(notesRemaining.length, 0, rolls);

        case 'ascend':
          return repeatNotesBool
            ? diceMultiRollSortedASC(finalMode.length, 0, rolls)
            : diceMultiRollSortedASC(notesRemaining.length, 0, rolls);

        case 'descend':
          return repeatNotesBool
            ? diceMultiRollSortedDSC(finalMode.length, 0, rolls)
            : diceMultiRollSortedDSC(notesRemaining.length, 0, rolls);
      }
    })();

    //absoluteRs is an array of notes that represent all the Rs transformed into absolute notes
    //Closures: finalMode, noteIntegers, repeatNotesBool, notesRemaining
    const absoluteRs = (() => {
      switch (repeatNotesBool) {
        case true:
          return noteIntegers.map((noteInteger) => {
            return finalMode[noteInteger];
          });
        case false:
          return noteIntegers.map((noteInteger) => {
            return notesRemaining[noteInteger];
          });
      }
    })();

    //absoluteNotes is an array of all the notes while Rs are transformed
    //Closures: notesNoNums, absoluteRs
    const absoluteNotes = (() => {
      const notesDuplicate = notesNoNums;
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
  })();

  //scribbleClip is a clip with the final melody
  const scribbleClip = scribble.clip({
    notes: notesNoRs,
    pattern,
    subdiv,
    sizzle,
  });

  return [scribbleClip, notesNoRs];
};

console.log(
  makeMelody({
    repeatNotes: 'off',
    notes: ['C1', 'D1', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    upperBound: 1,
    lowerBound: -5,
    rootNote: 'C',
    octave: 1,
    mode: 'major',
    subdiv: '4n',
    pitchDirrection: 'descend',
    pattern: 'xxx',
  })
);

module.exports = { makeMelody };
