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
  2. solve the ascend/descend problem
  3. fill in for Rs

  note: maybe tonal simplify all recieved notes
*/
const makeMelody = (params) => {
  const {
    rootNote, //root note of a mode
    mode, //mode from which to construct
    octave, //pitch of the melody
    upperBound, //notes will not be higher than this. Bounds are 1-7
    lowerBound, //notes will not be lower than this
    pattern, //rhythm pattern
    notes, //note pattern array
    repeatNotes, //have multiple random notes
    sizzle, //velocity
    pitchDirrection, //ascending or descending or any melody?
  } = params;

  //creating mode by bounds
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

  //we get the # of R notes
  const numOfRandNotes = (notes.join().match(/R/g) || []).length;

  //we convert repeatNotes to boolean
  const preRep = humanToBool(repeatNotes);

  //we define the number of notes that are not present in case we dont want to repeat any notes
  const notesRemaining = (() => {
    if (preRep === true) return []; //guard clause
    const uniqueNotes = [...new Set(notes)]; //deduplication with Set, https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
    // let notesRemaining = finalMode.length; //abstract away from this fn and make it an array of actual notes
    const notesArr = [];

    uniqueNotes.forEach((note) => {
      if (finalMode.indexOf(note) !== -1) notesArr.push(note);
    });

    return notesArr;
  })();

  //deciding whether we repeat random notes. If there are more Rs than unused notes in notes array and repeatNotes is false, we declare rep true
  const repeatActually = (() => {
    if (numOfRandNotes > finalMode - notesRemaining.length) return true;

    return preRep;
  })();

  //we get integers of the final notes in the notesRemaining or finalMode
  const finalNoteIntegers = (() => {
    switch (pitchDirrection) {
      case 'any':
        return repeatActually; // there is a bug somewhere in reteatActually. finalMode.length is shorter than numofrn, so repeatActually should be false
      // ? diceMultiRollUnsorted(finalMode.length, 0, numOfRandNotes)
      // : diceMultiRollUnsorted(notesRemaining.length, 0, numOfRandNotes);

      case 'descend':
        return repeatActually
          ? diceMultiRollSortedASC(finalMode.length, 0, numOfRandNotes)
          : diceMultiRollSortedASC(notesRemaining.length, 0, numOfRandNotes);

      case 'ascend':
        return repeatActually
          ? diceMultiRollSortedDSC(finalMode.length, 0, numOfRandNotes)
          : diceMultiRollSortedDSC(notesRemaining.length, 0, numOfRandNotes);
    }
  })();
  finalNoteIntegers;
};

console.log(
  makeMelody({
    repeatNotes: 'off',
    notes: ['R', 'R', 'R', 'C1', 'C1', 'D1', 'C#1', 'R', 'A1', '7', 'B1'],
    upperBound: 1,
    lowerBound: -6,
    rootNote: 'A',
    octave: 1,
    mode: 'minor',
    pitchDirrection: 'any',
  })
);
