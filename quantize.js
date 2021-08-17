const quantize = (number, block, allowZero) => {
  const absoluteNumber = number.toFixed(3) * 1000; //always assuming floats
  const divider = block * 1000; //need to get rid of floats for equality evaluation
  if (absoluteNumber % divider === 0) return number;
  if (number < 0) return 0;

  let numberGoUp = absoluteNumber;
  let numberGoDown = absoluteNumber;

  while (numberGoUp % divider !== 0) {
    numberGoUp += 1;
  }

  while (numberGoDown % divider !== 0) {
    numberGoDown -= 1;
  }

  const roundedNumber =
    numberGoUp - absoluteNumber < absoluteNumber - numberGoDown ? numberGoUp / 1000 : numberGoDown / 1000;

  const quantizedNumber = allowZero ? roundedNumber : roundedNumber !== 0 ? roundedNumber : divider / 1000;

  return quantizedNumber;
};

module.exports = { quantize };
