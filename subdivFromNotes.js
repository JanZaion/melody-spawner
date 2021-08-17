const { quantize } = require('./quantize');

const subdivFromNotes = (notes) => {
  const durations = notes.map((step) => quantize(step.duration, 0.25, false));
  const shortestNote = Math.min(...durations);
  const blocks = [0, 0.25, 0.5, 1, 2, 4, 16, 32, 48, 64];
  const longerNotes = blocks.filter((block) => block <= shortestNote);
  const block = blocks[longerNotes.length - 1] === 0 ? 0.25 : blocks[longerNotes.length - 1]; //Change this line once 32n becomes available in Scribble

  const subdivs = ['32n', '16n', '8n', '4n', '2n', '1n', '1m', '2m', '3m', '4m'];
  const subdiv = subdivs[blocks.indexOf(block)];

  return { subdiv, block };
};

module.exports = { subdivFromNotes };

/*
Some comment on the hardcoded values and what they mean
*/
