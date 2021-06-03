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
const { Random } = require('random-js'); //random lib at https://www.npmjs.com/package/random-js
const random = new Random(); // const value = random.integer(1, 2);

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

const makeMelody = (params) => {
  const {
    rootNote, //root note of a mode
    mode, //mode from which to construct
    octave, //pitch of the melody
    upperBound, //notes will not be higher than this. Bounds are 1-7
    lowerBound, //notes will not be lower than this
    pattern, //rhythm pattern
    notes, //note pattern
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

  //deciding whether we repeat random notes
  const rep = (() => {
    let preRep = humanToBool(repeatNotes);

    const strPresent = (str, match) => {
      const matching = str.indexOf(match);
      return matching === -1 ? 0 : 1;
    };

    console.log(strPresent('R R C1 C#1 Db1', ''));

    const numOfDiffNotes = [];

    const numOfRandNotes = (notes.match(/R/g) || []).length;
    const randNoteRange = upperBound + lowerBound * -1;

    if (numOfRandNotes > randNoteRange) preRep = true;

    return preRep;
  })();

  /*
  Do next:
  0. solve the ascend/descend problem
  1. declare mode array
  2. fill in for numbers
  3. fill in for Rs
  */
};

console.log(
  makeMelody({
    repeatNotes: 1,
    notes: 'R R R C1',
    upperBound: 7,
    lowerBound: -6,
    rootNote: 'A',
    octave: 1,
    mode: 'minor',
  })
);
