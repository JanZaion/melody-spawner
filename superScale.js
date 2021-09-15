const { Note, Scale } = require('@tonaljs/tonal');

const makeSuperScale = ({ scale, rootNote, octave }) => {
  const zeroScale = Scale.get(`${rootNote}0 ${scale}`).notes.map((note) => Note.simplify(note));
  const finalScale = [];

  //these integers are the lower and upper scale octaves.
  for (let i = -1; i < 7; i++) {
    zeroScale.forEach((note) => {
      const higherNote = note.replace(/[0]/g, i);
      finalScale.push(higherNote);
    });
  }

  const splitPoint = finalScale.indexOf(rootNote + octave);
  const lowerScale = finalScale.slice(0, splitPoint);
  const upperScale = finalScale.slice(splitPoint);

  return { upperScale, lowerScale, finalScale };
};

module.exports = { makeSuperScale };
