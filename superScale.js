const { Note, Scale } = require('@tonaljs/tonal');

const makeSuperScale = ({ scale, rootNote, octave }) => {
  const zeroScale = Scale.get(`${rootNote}0 ${scale}`).notes.map((note) => Note.simplify(note));
  const finalScales = [];

  //these integers are the lower and upper scale octaves.
  for (let i = -1; i < 7; i++) {
    zeroScale.forEach((note) => {
      const higherNote = note.replace(/[0]/g, i);
      finalScales.push(higherNote);
    });
  }

  const splitPoint = finalScales.indexOf(rootNote + octave);
  const lowerScales = finalScales.slice(0, splitPoint);
  const upperScales = finalScales.slice(splitPoint);

  return { upperScales, lowerScales, finalScales };
};

module.exports = { makeSuperScale };
