const maxApi = require('max-api');
const { getPattern } = require('./getPattern');

const getClip = async () => {
  const stepsLive = await maxApi.getDict('stepsLive');

  const stringified = JSON.stringify(stepsLive);
  const parsed = JSON.parse(stringified);
  const { notes } = parsed;

  const rhythm = getPattern(notes);
  const { pattern, subdiv } = rhythm;

  maxApi.post(pattern);
  maxApi.post(subdiv);
  //   maxApi.outlet(pattern);
  //   maxApi.outlet(subdiv);
};

maxApi.addHandler('getClip', getClip);
