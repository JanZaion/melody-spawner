const dice = require('convenient-methods-of-randomness');
/*
Adding new Algos:
1. write the algo as an arrow function
2. add the algo to the rhythmAlgos object
3. add the name of the algo to the Max frontend. The name at the frontend must match the key added to the rhythmAlgos object

Algos added to the rhythmAlgos can take one argument and thats the pattern received from the frontend
*/

// Generates a rhythm suitable for 4 chord pattern out of 4 "x" and 4 or 12 "_".
const wildMild = (wild, howLong) => {
  const numChar = howLong === 'short' ? 8 : 16;

  const rhythm = [];
  for (let i = 0; i < numChar; i++) rhythm.push('_');

  const xArray = (() => {
    switch (wild) {
      case 'wild':
        return dice.multiRollSortedAscending(numChar, 0, 4);

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
  long_wild: () => {
    return wildMild('wild', 'long');
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
