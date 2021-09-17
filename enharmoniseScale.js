const { Note } = require('@tonaljs/tonal');

const enharmoniseScale = (scale) => scale.map((note) => Note.enharmonic(note));

module.exports = { enharmoniseScale };
