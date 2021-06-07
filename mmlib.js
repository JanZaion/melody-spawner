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

  note: maybe tonal simplify all recieved notes
*/
const makeMelody = (params) => {
  const {
    rootNote, //root note of a mode
    mode, //mode from which to construct
    octave, //pitch of the melody
    upperBound, //notes will not be higher than this. Bounds are 1-7
    lowerBound, //notes will not be lower than this. Bounds are 0 to -7
    pattern, //rhythm pattern
    notes, //note pattern array
    repeatNotes, //have multiple random notes
    sizzle, //velocity
    pitchDirrection, //ascending or descending or any melody?
  } = params;

  //finalNotes is an array of notes that will be sent to Scribbletune. All Rs are transformed into absolute notes (tones I guess)
  const finalNotes = (() => {
    //numOfRandNotes is the # of R utterances in notes
    const numOfRandNotes = (notes.join().match(/R/g) || []).length;

    //guard clause. If there are no Rs, we avoid all the R-related processing
    if (numOfRandNotes === 0) return notes;

    //finalMode is a set of 2 modes. One mode is a root note - an octave, the other is a root note + an octave. The final mode is also smoothed at the edges bz the bounderies set in params
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
    const notesRemaining = finalMode.filter((note) => {
      return notes.indexOf(note) === -1;
    });

    //noteIntegers is an array of integers of the final notes in the notesRemaining or finalMode arrays
    const noteIntegers = (() => {
      const repeatNotesBool = humanToBool(repeatNotes);

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

    //absoluteNotes is the initial note array except all the Rs are now absolute notes
    const absoluteNotes = (() => {
      notes.forEach((note, noteIndex) => {});
    })();

    return absoluteNotes;
  })();

  console.log(finalNotes);
};

console.log(
  makeMelody({
    repeatNotes: 'off',
    notes: ['R', 'C1', 'D1', 'R', 'R'],
    upperBound: 3,
    lowerBound: -1,
    rootNote: 'C',
    octave: 1,
    mode: 'major',
    pitchDirrection: 'any',
  })
);

const mabe = () => {
  //repeatActually is a check that decides whether we can actually enforce the rule of not repeating notes when R. If there are more Rs than unused notes in notes array and repeatNotes is false, we declare repeatActually true - we actually repeat although the repeat parameter is off
  const repeatActually = (() => {
    const preRep = humanToBool(repeatNotes);
    if (numOfRandNotes > notesRemaining.length) return true;

    return preRep;
  })();

  //noteIntegers is an array of integers of the final notes in the notesRemaining or finalMode arrays
  const noteIntegers = (() => {
    switch (pitchDirrection) {
      case 'any':
        return repeatActually
          ? diceMultiRollUnsorted(finalMode.length, 0, numOfRandNotes)
          : diceMultiRollUnsorted(notesRemaining.length, 0, numOfRandNotes);

      case 'ascend':
        return repeatActually
          ? diceMultiRollSortedASC(finalMode.length, 0, numOfRandNotes)
          : diceMultiRollSortedASC(notesRemaining.length, 0, numOfRandNotes);

      case 'descend':
        return repeatActually
          ? diceMultiRollSortedDSC(finalMode.length, 0, numOfRandNotes)
          : diceMultiRollSortedDSC(notesRemaining.length, 0, numOfRandNotes);
    }
  })();

  //absoluteRs is an array of notes that represent all the Rs transformed into absolute notes
  const absoluteRs = (() => {
    switch (repeatActually) {
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
};
