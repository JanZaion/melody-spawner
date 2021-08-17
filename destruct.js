const maxApi = require('max-api');
const { getPattern } = require('./getPattern');
const { subdivFromNotes } = require('./subdivFromNotes');

const getClip = async () => {
  const stepsLive = await maxApi.getDict('stepsLive');

  const stringified = JSON.stringify(stepsLive);
  const parsed = JSON.parse(stringified);
  const { notes } = parsed;

  const subdivInfo = subdivFromNotes(notes);
  const { subdiv, block } = subdivInfo;

  const pattern = getPattern(notes, block); //, full.subdiv

  maxApi.post(pattern);
  maxApi.post(subdiv);
  //   maxApi.outlet(pattern);
  //   maxApi.outlet(subdiv);
};

maxApi.addHandler('getClip', getClip);
