const liveFormatTranspose = (liveFormat, interval) => {
  return liveFormat.map((step) => {
    return { ...step, pitch: step.pitch + interval };
  });
};

module.exports = { liveFormatTranspose };
