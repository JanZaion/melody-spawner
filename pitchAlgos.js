const dice = require('convenient-methods-of-randomness');

const dunno = (notes) => {
  return notes + 'hello';
};

const thiser = () => {
  return 'C1 B6';
};

const pitchAlgos = {
  dunno: [dunno, 'dunno what this is supposed to be'],
  thiser: [
    thiser,
    'some very long description about some stugg running through staff omg what am I typing now, I mean who even cares, whatever',
  ],
};

module.exports = { pitchAlgos };
