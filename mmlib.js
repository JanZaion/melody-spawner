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

  //deciding whether we repeat random notes. If there are more Rs than unused notes in notes array and repeatNotes is false, we declare rep true
  const repeatActually = (() => {
    let preRep = humanToBool(repeatNotes);
    if (preRep === true) return preRep;

    const uniqueNotes = [...new Set(notes)]; //deduplication with Set, https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
    let notesRemaining = finalMode.length;

    uniqueNotes.forEach((note) => {
      if (finalMode.indexOf(note) !== -1) notesRemaining -= 1;
    });

    const numOfRandNotes = (notes.join().match(/R/g) || []).length;

    if (numOfRandNotes > notesRemaining) preRep = true;

    return preRep;
  })();

  const finalNotes = (() => {
    switch (repeatActually) {
      case true: // 3 cases, any notes
        return;
      case false: // 3 cases, diff notes
        return;
    }
  })();
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
  })
);
