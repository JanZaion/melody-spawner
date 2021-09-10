const dice = require('convenient-methods-of-randomness');

// Generates a rhythm suitable for 4 chord pattern out of 4 "x" and 4 or 12 "_".
const wildMild = (wild, howLong) => {
  const numChar = howLong === 'short' ? 8 : 16;

  const rhythm = [];
  for (let i = 0; i < numChar; i++) rhythm.push('_');

  const xArray = (() => {
    switch (wild) {
      case 'wild':
        return dice.multiRollUniqueSortedAscending(numChar, 0, 4);

      case 'mild':
        const x1 = dice.range(numChar / 4, 0);
        const x2 = dice.range(numChar / 4 + numChar / 4, numChar / 4);
        const x3 = dice.range(numChar / 4 + (numChar / 4) * 2, numChar / 4 + numChar / 4);
        const x4 = dice.range(numChar / 4 + (numChar / 4) * 3, numChar / 4 + (numChar / 4) * 2);
        return [x1, x2, x3, x4];
    }
  })();

  let j = 0;
  for (let i = 0; i < numChar; i++) {
    if (i === xArray[j]) {
      rhythm[i] = 'x';
      j++;
    }
  }

  for (let i = 0; i < numChar; i) {
    if (rhythm[i] === '_') {
      rhythm.shift();
      rhythm.push('_');
    } else {
      break;
    }
  }
  return rhythm.join('');
};

const reshuffle = ({ pattern }) => {
  const initialSpace = pattern.split('x')[0];
  const tones = pattern.split('x');
  if (initialSpace.length === 0) tones.shift();

  const counter = initialSpace.length === 0 ? 0 : 1;
  for (let i = counter; i < tones.length; i++) tones[i] = 'x' + tones[i];

  for (let i = tones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tones[i], tones[j]] = [tones[j], tones[i]];
  }

  return tones.join('');
};

const rhythmAlgos = {
  long_wild: {
    algo: () => {
      return wildMild('wild', 'long');
    },
    description: 'long wild I guess',
  },
  long_mild: () => {
    return wildMild('mild', 'long');
  },
  short_wild: () => {
    return wildMild('wild', 'short');
  },
  short_mild: () => {
    return wildMild('mild', 'short');
  },
  reshuffle: {
    algo: reshuffle,
    description: 'Randomly reshuffles xs in the pattern, while xs keep their length or the spaces that follow them. ',
  },
};

module.exports = { rhythmAlgos };
