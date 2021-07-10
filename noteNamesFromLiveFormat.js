const { Note } = require('@tonaljs/tonal');
const { liveFormatTranspose } = require('./liveFormatTranspose');

const noteNamesFromLiveFormat = (liveFormat) => {
  return liveFormatTranspose(liveFormat, -12)
    .map((step) => {
      return Note.fromMidi(step.pitch);
    })
    .join(' ');
};

module.exports = {
  noteNamesFromLiveFormat,
};
