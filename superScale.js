const { Note, Scale } = require('@tonaljs/tonal');
const { enharmoniseScale } = require('./enharmoniseScale');

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

  return { upperScale, lowerScale, finalScale };
};

const makeMassiveScales = (params) => {
  const superScale = makeSuperScale(params).finalScale;
  const superEnharmonicScale = enharmoniseScale(superScale);
  const superMassiveScale = superScale.concat(superEnharmonicScale);
  const superChromaticScale = makeSuperScale({ ...params, scale: 'chromatic' }).finalScale;
  const superChromaticEnharmonicScale = enharmoniseScale(superChromaticScale);
  const superMassiveChromaticScale = superChromaticScale.concat(superChromaticEnharmonicScale);

  return {
    superEnharmonicScale,
    superMassiveScale,
    superChromaticScale,
    superChromaticEnharmonicScale,
    superMassiveChromaticScale,
  };
};

module.exports = { makeSuperScale, makeMassiveScales };
