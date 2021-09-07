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

const reshuffle = (pattern) => {
  return pattern + 'x--_--x';
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
  reshuffle,
};

module.exports = { rhythmAlgos };
