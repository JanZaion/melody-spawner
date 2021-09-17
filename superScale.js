const { Note, Scale } = require('@tonaljs/tonal');

//simple enough for turning numbers into notes
const makeSuperScale = ({ scale, rootNote, octave }) => {
  const zeroScale = Scale.get(`${rootNote}0 ${scale}`).notes.map((note) => Note.simplify(note));
  const finalScale = [];

  //these integers are the numbers of octaves+1
  for (let i = 0; i < 8; i++) {
    zeroScale.forEach((note) => {
      const notesOctave = parseInt(note[note.length - 1]);
      const higherNote = note.replace(/[0-1]/g, i + notesOctave - 1);
      finalScale.push(higherNote);
    });
  }

  const rootTone = rootNote + octave;
  const rootToneIndex = finalScale.indexOf(rootTone);
  const splitPoint = rootToneIndex !== -1 ? rootToneIndex : finalScale.indexOf(Note.enharmonic(rootTone));
  const lowerScale = finalScale.slice(0, splitPoint);
  const upperScale = finalScale.slice(splitPoint);
  const lowerScaleReversed = [...lowerScale].reverse();
  lowerScaleReversed.unshift(rootTone);

  return { upperScale, lowerScale, finalScale, lowerScaleReversed };
};

//robust enough for turning notes into numbers
const makeMassiveScales = (params) => {
  const { upperScale, lowerScale, finalScale, lowerScaleReversed } = makeSuperScale(params);
  const enharmoniseScale = (scale) => scale.map((note) => Note.enharmonic(note));

  const enharmonicScale = enharmoniseScale(finalScale);
  const enharmonicUpperScale = enharmoniseScale(upperScale);
  const enharmonicLowerScale = enharmoniseScale(lowerScale);
  const enharmonicLowerScaleReversed = enharmoniseScale(lowerScaleReversed);
  const superMassiveScale = finalScale.concat(enharmonicScale);
  const superChromaticScale = makeSuperScale({ ...params, scale: 'chromatic' }).finalScale;
  const superChromaticEnharmonicScale = enharmoniseScale(superChromaticScale);
  const superMassiveChromaticScale = superChromaticScale.concat(superChromaticEnharmonicScale);

  return {
    upperScale,
    lowerScale,
    finalScale,
    lowerScaleReversed,
    enharmonicScale,
    superMassiveScale,
    superChromaticScale,
    superChromaticEnharmonicScale,
    superMassiveChromaticScale,
    enharmonicUpperScale,
    enharmonicLowerScale,
    enharmonicLowerScaleReversed,
  };
};

module.exports = { makeSuperScale, makeMassiveScales };
