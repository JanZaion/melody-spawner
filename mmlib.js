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

function redeclareScribbleClip(scribbleClip) {
  for (let i = 0; i < scribbleClip.length; i++) {
    var newNote = [];
    scribbleClip[i].note === null ? (newNote = null) : newNote.push(...scribbleClip[i].note);
    let newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
    scribbleClip.splice(i, 1);
    scribbleClip.insert(i, newPart);
  }
  return scribbleClip;
}

Array.prototype.insert = function (index, item) {
  //Inserts item to an array and changes the length (index, item)
  this.splice(index, 0, item);
};

function chopOrSplit(scribbleClip, splitter, splitChop) {
  redeclareScribbleClip(scribbleClip);

  if (splitter === 1) {
    var splitter2 = 5;
  }
  if (splitter === 2) {
    var splitter2 = 4;
  }
  if (splitter === 3) {
    var splitter2 = 3;
  }
  if (splitter === 4) {
    var splitter2 = 2;
  }
  if (splitter === 5) {
    var splitter2 = 1;
  }

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

  var newClip = [];

  for (let i = 0; i < scribbleClip.length; i++) {
    const partLength = scribbleClip[i].length;

    const chops = Math.trunc(partLength) / chopLength;

    const newPart = { note: scribbleClip[i].note, length: partLength / chops, level: scribbleClip[i].level };

    for (let j = 0; j < chops; j++) {
      if (splitChop === 0) {
        //split
        newClip.push(newPart);
      } else if (splitChop === 1) {
        //chop
        const newPartNull = { note: null, length: partLength / chops, level: scribbleClip[i].level };
        j % 2 === 0 ? newClip.push(newPart) : newClip.push(newPartNull);
      }
    }
    if (splitChop === 2) {
      //halve
      var partLengthHalved = partLength;
      var exp = 2;
      for (let k = 0; k < splitter; k++) var partLengthHalved = partLengthHalved / 2;
      for (let m = 0; m < splitter - 1; m++) var exp = exp * 2;
      const newPartHalved = { note: scribbleClip[i].note, length: partLengthHalved, level: scribbleClip[i].level };
      for (let l = 0; l < exp; l++) newClip.push(newPartHalved);
    }
  }

  //We return new clip, so scribbleclip needs to be redeclared
  nullCleanup(newClip);
  notesToArray(newClip);
  return newClip;
}

function transposeNotesInChord(scribbleClip, firstChord, numOfChords, numNote, interval) {
  if (isNaN(interval) == false) interval = Interval.fromSemitones(interval);
  if (contingency(scribbleClip, numOfChords, firstChord, false, false)) return nullCleanup(scribbleClip);
  if (firstChord < 1) return nullCleanup(scribbleClip);
  redeclareScribbleClip(scribbleClip);
  if (numNote === 'all') numNote = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; //lame af, I know. If we want to transpose all notes in a chord, then we just make sure there are more chord to transpose than a chord can have

  for (let i = 0; i < firstChord - 1; i++) {
    if (scribbleClip[i].note == null) firstChord++;
  }

  if (scribbleClip.length - firstChord < numOfChords) {
    var lastChord = scribbleClip.length;
  } else {
    var lastChord = firstChord - 1 + numOfChords;
  }

  for (let i = firstChord - 1; i < lastChord; i++) {
    if (scribbleClip[i].note != null) {
      for (let n = 0; n < numNote.length; n++) {
        if (numNote[n] < scribbleClip[i].note.length + 1) {
          var newNote = Note.simplify(Note.transpose(scribbleClip[i].note[numNote[n] - 1], interval));
          var currentChord = scribbleClip[i].note;

          for (let j = 0; j < currentChord.length; j++) {
            if (j + 1 == numNote[n]) currentChord[j] = newNote;
          }

          var newPart = { note: currentChord, length: scribbleClip[i].length, level: scribbleClip[i].level };
          scribbleClip.splice(i, 1);
          scribbleClip.insert(i, newPart);
        }
      }
    } else {
      lastChord++;
      if (lastChord > scribbleClip.length) var lastChord = scribbleClip.length;
    }
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

function nullCleanup(scribbleClip) {
  for (var q = 0; q < scribbleClip.length; q++) {
    if (q != scribbleClip.length - 1 && scribbleClip[q].note == null && scribbleClip[q + 1].note == null) {
      var newNullLength = scribbleClip[q].length + scribbleClip[q + 1].length;
      var newPart = { note: null, length: newNullLength, level: scribbleClip[q].level };
      scribbleClip.splice(q, 2);
      scribbleClip.insert(q, newPart);
      var q = q - 1;
    }
  }
  return scribbleClip;
}

function notesToArray(scribbleClip) {
  for (let i = 0; i < scribbleClip.length; i++) {
    if (Array.isArray(scribbleClip[i].note) == false && scribbleClip[i].note != null) {
      const noteInArray = [];
      noteInArray.push(scribbleClip[i].note);
      const newPart = { note: noteInArray, length: scribbleClip[i].length, level: scribbleClip[i].level };
      scribbleClip.splice(i, 1);
      scribbleClip.insert(i, newPart);
    }
  }

  return scribbleClip;
}

function contingency(scribbleClip, numOfNotes, firstNote, RN, transposeRN) {
  var RNamount = 0;
  var Nullamount = 0;

  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note == null) {
      Nullamount++;
    } else if (scribbleClip[i].note.join('') == RN) {
      RNamount++;
    }
  }

  var nonRNamount = scribbleClip.length - RNamount - Nullamount;

  if (transposeRN && nonRNamount + RNamount < 1) {
    return true;
  } else if (transposeRN == false && nonRNamount < 1) {
    return true;
  } else if (numOfNotes < 1) {
    return true;
  } else if (firstNote > scribbleClip.length) {
    return true;
  } else {
    return false;
  }
}

function notesToOctave(scribbleClip, octave) {
  //var octave = octave +1 //because scribblemax exports them octave lower, than scribbleclip sais.
  const defOctave = 3; //default octave, where Scribbletune exports chords
  const transp = octave - defOctave;

  return transposeNotesInChord(scribbleClip, 1, Infinity, 'all', '8P');
}

//the "non-chords-coppied" part starts below

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
    splitter, //splitter
    splitChop, //splitchop
  } = params;

  //notesArray is notes. If there is only 1 note inputed in max, its a string, we cant use string, only array, hence notesArray for this case
  //Closures: notes
  const notesArray = (() => {
    const arr = [];
    arr.push(notes);
    return Array.isArray(notes) ? notes : arr;
  })();

  //notesNoNums is an array of notes where all numbers were transformed into tones
  //Closures: mode, rootNote, octave, notesArray
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

    const notesDuplicate = notesArray;

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

  //fixedScribbleClip is the scribbleclip but with notes transposed an octave higher to polyfill for scribblebug. It also pushes notes to array if its a single note for max fix
  const fixedScribbleClip = (() => {
    return notesToArray(notesToOctave(scribbleClip, octave));
  })();

  //choppedScribbleClip: is a scribbletune clip that has its notes chopped or split or halved
  //Closures: fixedScribbleClip, splitter, splitChop
  const choppedScribbleClip = (() => {
    if (splitter === 0) return fixedScribbleClip;
    if (splitter !== 0) return chopOrSplit(fixedScribbleClip, splitter, splitChop);
  })();

  return [choppedScribbleClip, notesNoRs];
};

console.log(
  makeMelody({
    octave: 5,
    subdiv: '1n',
    splitter: 0,
    mode: 'Major',
    rootNote: 'C',
    chordPatterns: 'R R R R',
    notes: ['R', 'R', 'R', 'R'],
    lowerBound: -3,
    patterns: 'xxxx',
    pattern: 'x_x-xx_',
    pitchDirrection: 'descend',
    repeatNotes: 'off',
    sizzle: 'cos',
    splitChop: 0,
    upperBound: 5,
  })[0]
);

const notesFromScribbleClip = (scribbleClip) => {};

module.exports = { makeMelody, notesFromScribbleClip, notesToArray };
