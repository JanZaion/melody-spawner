const { makeSuperScale, makeMassiveScales } = require('./superScale');
const { Note, Scale, Interval } = require('@tonaljs/tonal');
const { notesToArray } = require('./notesToArray');

const numToNote = (num, lowerScaleReversed, upperScale) => {
  if (isNaN(num)) return num;
  return num < 0 ? lowerScaleReversed[num * -1] : upperScale[num];
};

const noteToNum = (note, lowerScaleReversed, upperScale, enharmonicLowerScaleReversed, enharmonicUpperScale) => {
  const isItHere = (scale, note) => scale.indexOf(note) !== -1;
  if (isItHere(upperScale, note)) return upperScale.indexOf(note);
  if (isItHere(lowerScaleReversed, note)) return lowerScaleReversed.indexOf(note) * -1;
  if (isItHere(enharmonicUpperScale, note)) return enharmonicUpperScale.indexOf(note);
  if (isItHere(enharmonicLowerScaleReversed, note)) return enharmonicLowerScaleReversed.indexOf(note) * -1;
  return note;
};

const parseNotesAndNums = ({ notes }) => {
  return notesToArray(notes).map((note) => {
    const int = parseInt(note);
    return isNaN(int) ? note : int;
  });
};

const notesToNumbers = (params) => {
  const notesAndNums = parseNotesAndNums(params);
  if (notesAndNums.every((note) => !isNaN(note))) return { nums: params.notes, numsString: notesAndNums.join(' ') };

  const { lowerScaleReversed, upperScale, enharmonicLowerScaleReversed, enharmonicUpperScale } =
    makeMassiveScales(params);

  const nums = notesAndNums.map((note) =>
    noteToNum(note, lowerScaleReversed, upperScale, enharmonicLowerScaleReversed, enharmonicUpperScale)
  );

  const numsString = nums.join(' ');

  return { nums, numsString };
};

const numbersToNotes = (params) => {
  const notesAndNums = parseNotesAndNums(params);
  if (notesAndNums.every((note) => isNaN(note))) return { notes: params.notes, notesString: notesAndNums.join(' ') };

  const { lowerScaleReversed, upperScale } = makeSuperScale(params);

  const notes = notesAndNums.map((num) => numToNote(num, lowerScaleReversed, upperScale));

  const notesString = notes.join(' ');

  return { notes, notesString };
};

const reshuffle = ({ notes }) => {
  const notesArray = notesToArray(notes);

  //abstract this to dice. Do the same with rhythm reshuffle
  for (let i = notesArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [notesArray[i], notesArray[j]] = [notesArray[j], notesArray[i]];
  }

  return notesArray.join(' ');
};

const transposeByOne = (params, up) => {
  const notesAndNums = parseNotesAndNums(params);

  const { superMassiveScale, superMassiveChromaticScale } = makeMassiveScales(params);

  const tonicInterval = up ? 'm2' : 'A-1';
  const numInterval = up ? 1 : -1;

  const match = (superMassiveScale, note) => {
    let transposedNote = Note.simplify(Note.transpose(note, tonicInterval));
    while (superMassiveScale.indexOf(transposedNote) === -1) {
      transposedNote = Note.simplify(Note.transpose(transposedNote, tonicInterval));
      if (transposedNote === 'C-1') break;
      if (transposedNote === 'C7') break;
    }
    return transposedNote;
  };

  const transposedNotes = notesAndNums.map((note) => {
    if (!isNaN(note)) return note + numInterval;
    if (superMassiveChromaticScale.indexOf(note) !== -1) return match(superMassiveScale, note);
    return note;
  });

  const transposedNotesString = transposedNotes.join(' ');

  return { transposedNotes, transposedNotesString };
};

const reverseNotes = ({ notes }) => [...notesToArray(notes)].reverse().join(' ');

const getScale = ({ scale, rootNote, octave }) => Scale.get(`${rootNote}${octave} ${scale}`).notes.join(' ');

const inversion = (params) => {
  const { notes } = numbersToNotes(params);
  const midiNotes = notes.map((note) => {
    const midified = Note.midi(note);
    return midified ? midified : note;
  });
  const midiNotesOnly = midiNotes.filter((note) => !isNaN(note));

  const min = Math.min(...midiNotesOnly);
  const max = Math.max(...midiNotesOnly);
  const axis = (min + max) / 2;

  const invertedNotes = midiNotes
    .map((note) => {
      if (isNaN(note)) return note;
      if (note === axis) return note;
      if (note > axis) return axis - (note - axis);
      if (note < axis) return axis + (axis - note);
    })
    .map((note) => {
      const demidified = Note.fromMidi(note);
      return demidified ? demidified : note;
    });

  const invertedNotesString = invertedNotes.join(' ');

  return { invertedNotes, invertedNotesString };
};

const inversionCorrective = (params) => {
  const { invertedNotes } = inversion(params);
  const { superMassiveScale, superMassiveChromaticScale } = makeMassiveScales(params);

  const correctedInvertedNotes = invertedNotes.map((note) => {
    if (superMassiveChromaticScale.indexOf(note) === -1) return note;
    let transposedNote = Note.simplify(note);
    while (superMassiveScale.indexOf(transposedNote) === -1) {
      transposedNote = Note.simplify(Note.transpose(transposedNote, 'm2'));
      if (transposedNote === 'C-1') break;
      if (transposedNote === 'C7') break;
    }
    return transposedNote;
  });

  const correctedInvertedNotesString = correctedInvertedNotes.join(' ');

  return { correctedInvertedNotes, correctedInvertedNotesString };
};

const retrogradeInversion = (params) => {
  const { invertedNotes } = inversion(params);
  const reversedNotes = reverseNotes({ notes: invertedNotes });
  return reversedNotes;
};

const transposeSkipStep = (params, up, skip) => {
  const transposedOnce = transposeByOne(params, up).transposedNotes;
  const stepOrSkip = skip ? transposeByOne({ ...params, notes: transposedOnce }, up).transposedNotes : transposedOnce;
  return stepOrSkip;
};

const expandCompress = (params, noteToCompare, noteToTranspose, compress, skip) => {
  const toCompareMidi = Note.midi(noteToCompare);
  const toTransposeMidi = Note.midi(noteToTranspose);
  if (!toCompareMidi || !toTransposeMidi) return noteToTranspose;

  let comparedNoteIs = '';
  if (toCompareMidi > toTransposeMidi) {
    comparedNoteIs = 'higher';
  } else if (toCompareMidi < toTransposeMidi) {
    comparedNoteIs = 'lower';
  } else if (toCompareMidi === toTransposeMidi) {
    comparedNoteIs = 'equal';
  }

  //if compress is true, the note is one semitone away and skip is true, then it really isnt a compression, hence this fn
  const skipCorrect = (noteToCompare, noteToTranspose, skip) => {
    if (!skip) return false;
    intervalicDistance = Interval.distance(noteToCompare, noteToTranspose);
    if (intervalicDistance.match(/2M|-2M|2m|-2m/g) !== null) return false;
    return true;
  };

  let transposedNote = '';
  switch (comparedNoteIs) {
    case 'higher':
      transposedNote = compress
        ? transposeSkipStep(
            { ...params, notes: noteToTranspose },
            true,
            skipCorrect(noteToCompare, noteToTranspose, skip)
          )
        : transposeSkipStep({ ...params, notes: noteToTranspose }, false, skip);
      break;
    case 'lower':
      transposedNote = compress
        ? transposeSkipStep(
            { ...params, notes: noteToTranspose },
            false,
            skipCorrect(noteToCompare, noteToTranspose, skip)
          )
        : transposeSkipStep({ ...params, notes: noteToTranspose }, true, skip);
      break;
    case 'equal':
      transposedNote = compress
        ? [noteToTranspose]
        : transposeSkipStep({ ...params, notes: noteToTranspose }, true, skip);
      break;
  }

  return transposedNote.join('');
};

const oddEvenEC = (params, odd, compress, skip) => {
  const notesNoNums = numbersToNotes(params).notes;

  const transposedNotes = notesNoNums.map((note, noteIndex) => {
    switch (odd) {
      case true:
        if (noteIndex % 2 !== 0) return note;
        const followingNote = notesNoNums[noteIndex + 1];
        if (!followingNote) return note;
        return expandCompress(params, followingNote, note, compress, skip);

      case false:
        if (noteIndex % 2 === 0) return note;
        const previousNote = notesNoNums[noteIndex - 1];
        if (!previousNote) return note;
        return expandCompress(params, previousNote, note, compress, skip);
    }
  });

  return transposedNotes.join(' ');
};

const midEC = (params, compress, skip) => {
  const notesNoNums = numbersToNotes(params).notes;
  if (notesNoNums.length < 3) return params.notes.join(' ');
  const firstNote = notesNoNums[0];
  const lastNote = notesNoNums[notesNoNums.length - 1];

  const transposedNotes = notesNoNums.map((note) => expandCompress(params, firstNote, note, compress, skip));
  transposedNotes.shift();
  transposedNotes.pop();
  transposedNotes.unshift(firstNote);
  transposedNotes.push(lastNote);

  return transposedNotes.join(' ');
};

const halfEC = (params, latter, compress, skip) => {
  const notesNoNums = numbersToNotes(params).notes;
  if (notesNoNums.length < 2) return params.notes.join(' ');
  const splitPoint = Math.floor(notesNoNums.length / 2);
  const formerHalf = notesNoNums.slice(0, splitPoint);
  const latterHalf = notesNoNums.slice(splitPoint);
  const lastNoteFormerHalf = formerHalf[formerHalf.length - 1];
  const firstNoteLatterHalf = latterHalf[0];

  let transposedNotes = [];
  switch (latter) {
    case false:
      const transposedFormerHalf = formerHalf.map((note) =>
        expandCompress(params, firstNoteLatterHalf, note, compress, skip)
      );
      transposedNotes = [...transposedFormerHalf, ...latterHalf];
      break;
    case true:
      const transposedLatterHalf = latterHalf.map((note) =>
        expandCompress(params, lastNoteFormerHalf, note, compress, skip)
      );
      transposedNotes = [...formerHalf, ...transposedLatterHalf];
      break;
  }

  return transposedNotes.join(' ');
};

const pitchAlgos = [
  {
    name: 'notes to numbers',
    algo: (params) => notesToNumbers(params).numsString,
    description:
      'Transforms note names into numbers that signify intervalic distance from the root note. If the note is not present in the selected scale, it does not get transformed.',
  },
  {
    name: 'numbers to notes',
    algo: (params) => numbersToNotes(params).notesString,
    description: 'Transforms intervalic numbers into note names.',
  },
  { name: 'reshuffle', algo: reshuffle, description: 'Randomly reshuffles notes in the note pattern.' },
  { name: 'retrograde', algo: reverseNotes, description: 'Reverses the order of the notes.' },
  {
    name: 'up',
    algo: (params) => transposeByOne(params, true).transposedNotesString,
    description: 'Transposes all notes up by one intervalic distance in the selected scale.',
  },
  {
    name: 'down',
    algo: (params) => transposeByOne(params, false).transposedNotesString,
    description: 'Transposes all notes down by one intervalic distance in the selected scale.',
  },
  { name: 'get scale', algo: getScale, description: 'Lists all the notes of the selected scale. As simple as that.' },
  {
    name: 'inversion',
    algo: (params) => inversion(params).invertedNotesString,
    description: 'Turns the notes upside down.',
  },
  {
    name: 'inversion corrective',
    algo: (params) => inversionCorrective(params).correctedInvertedNotesString,
    description:
      'Turns the notes upside down. If any note is out of scale, it transposes the note in the upwards dirrection until it is in scale.',
  },
  {
    name: 'retrograde inversion',
    algo: retrogradeInversion,
    description: 'Reverses the order of the notes and turns them upside down.',
  },
  {
    name: 'intervalic expansion odd notes stepwise',
    algo: (params) => oddEvenEC(params, true, false, false),
    description: 'Expands intervals between odd notes and the following even notes in a stepwise motion.',
  },
  {
    name: 'intervalic expansion odd notes skipwise',
    algo: (params) => oddEvenEC(params, true, false, true),
    description: 'Expands intervals between odd notes and the following even notes in a skipwise motion.',
  },
  {
    name: 'intervalic compression odd notes stepwise',
    algo: (params) => oddEvenEC(params, true, true, false),
    description: 'Compresses intervals between odd notes and the following even notes in a stepwise motion.',
  },
  {
    name: 'intervalic compression odd notes skipwise',
    algo: (params) => oddEvenEC(params, true, true, true),
    description: 'Compresses intervals between odd notes and the following even notes in a skipwise motion.',
  },
  {
    name: 'intervalic expansion even notes stepwise',
    algo: (params) => oddEvenEC(params, false, false, false),
    description: 'Expands intervals between even notes and the preceeding odd notes in a stepwise motion.',
  },
  {
    name: 'intervalic expansion even notes skipwise',
    algo: (params) => oddEvenEC(params, false, false, true),
    description: 'Expands intervals between even notes and the preceeding odd notes in a skipwise motion.',
  },
  {
    name: 'intervalic compression even notes stepwise',
    algo: (params) => oddEvenEC(params, false, true, false),
    description: 'Compresses intervals between even notes and the preceeding odd notes in a stepwise motion.',
  },
  {
    name: 'intervalic compression even notes skipwise',
    algo: (params) => oddEvenEC(params, false, true, true),
    description: 'Compresses intervals between even notes and the preceeding odd notes in a skipwise motion.',
  },
  {
    name: 'intervalic expansion middle notes stepwise',
    algo: (params) => midEC(params),
    description:
      'Expands intervals of notes in between the first note and the last note one based on the relationship between the first note and the second note in a stepwise motion.',
  },
  {
    name: 'intervalic expansion middle notes skipwise',
    algo: (params) => midEC(params, false, true),
    description:
      'Expands intervals of notes in between the first note and the last note one based on the relationship between the first note and the second note in a skipwise motion.',
  },
  {
    name: 'intervalic compression middle notes stepwise',
    algo: (params) => midEC(params, true),
    description:
      'Compresses intervals of notes in between the first note and the last note one based on the relationship between the first note and the second note in a stepwise motion.',
  },
  {
    name: 'intervalic compression middle notes skipwise',
    algo: (params) => midEC(params, true, true),
    description:
      'Compresses intervals of notes in between the first note and the last note one based on the relationship between the first note and the second note in a skipwise motion.',
  },
  {
    name: 'intervalic expansion former half stepwise',
    algo: (params) => halfEC(params, false),
    description:
      'Expands intervals between all the notes in the former half and the first note of the latter half in a stepwise motion.',
  },
  {
    name: 'intervalic expansion former half skipwise',
    algo: (params) => halfEC(params, false, false, true),
    description:
      'Expands intervals between all the notes in the former half and the first note of the latter half in a skipwise motion.',
  },
  {
    name: 'intervalic compression former half stepwise',
    algo: (params) => halfEC(params, false, true),
    description:
      'Compresses intervals between all the notes in the former half and the first note of the latter half in a stepwise motion.',
  },
  {
    name: 'intervalic compression former half skipwise',
    algo: (params) => halfEC(params, false, true, true),
    description:
      'Compresses intervals between all the notes in the former half and the first note of the latter half in a skipwise motion.',
  },
  {
    name: 'intervalic expansion latter half stepwise',
    algo: (params) => halfEC(params, true),
    description:
      'Expands intervals between all the notes in the latter half and the last note of the former half in a stepwise motion.',
  },
  {
    name: 'intervalic expansion latter half skipwise',
    algo: (params) => halfEC(params, true, false, true),
    description:
      'Expands intervals between all the notes in the latter half and the last note of the former half in a skipwise motion.',
  },
  {
    name: 'intervalic compression latter half stepwise',
    algo: (params) => halfEC(params, true, true),
    description:
      'Compresses intervals between all the notes in the latter half and the last note of the former half in a stepwise motion.',
  },
  {
    name: 'intervalic compression latter half skipwise',
    algo: (params) => halfEC(params, true, true, true),
    description:
      'Compresses intervals between all the notes in the latter half and the last note of the former half in a skipwise motion.',
  },
];

module.exports = { pitchAlgos, transposeSkipStep };
