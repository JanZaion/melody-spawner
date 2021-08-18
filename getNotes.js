const maxApi = require('max-api');

const getNotes = async (dict) => {
  const stepsLive = await maxApi.getDict(dict);
  const stringified = JSON.stringify(stepsLive);
  const parsed = JSON.parse(stringified);
  const { notes } = parsed;
  return notes;
};

module.exports = { getNotes };
