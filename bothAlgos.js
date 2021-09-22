const dice = require('convenient-methods-of-randomness');
const { makeSuperScale, makeMassiveScales } = require('./superScale');
const { Note, Scale } = require('@tonaljs/tonal');
const { notesToArray } = require('./notesToArray');

const displacement = (params) => {
  return { pattern: 'hello', notes: 'hi' };
};

const bothAlgos = {
  displacement: {
    algo: displacement,
    description: 'Displaces the dis.',
  },
};

module.exports = { bothAlgos };
