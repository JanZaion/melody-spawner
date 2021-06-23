/*
TODO:
-once everything is complete, add "init" button to device and make it loadbang
-refactor mmlib from the current garbage
-make it so that - notes are accepted

magenta:
-figure out local setup for checkpoint
-sometimes it doesent produce clip. Why?
-magenta studios has fixed length. How? Steps per quarter might need to be dealt with by subdiv. Number of steps combined with subdiv might give out total length. In Mstudio, 1 bar = 16 steps
-make RNN initialization on loadbang
-returns C-1 for no reason sometimes. Why? because it wasnt in an array, fixed now

/notes must always be in an array, now they are not
*/
const maxApi = require('max-api');
const mmlib = require('./mmlib');
const mmSCtoRNN = require('./mmSCtoRNN');

const joinWithAI = async (params) => {
  const { AI, scribbleClip } = params;
  let AIclip;

  switch (AI) {
    case 0:
      return scribbleClip;

    case 1:
      AIclip = await mmSCtoRNN.magentize(params);
      return AIclip;

    case 2:
      AIclip = await mmSCtoRNN.magentize(params);
      const finClip = scribbleClip.concat(AIclip);
      return finClip;
  }
};

maxApi.addHandler('makeClip', () => {
  const constructClip = (async () => {
    const full = await maxApi.getDict('full');

    const clipMade = mmlib.makeMelody(full);

    const scribbleClip = clipMade[0];
    full.scribbleClip = scribbleClip;

    const finalClip = await joinWithAI(full);

    const names = clipMade[1].join(' ');

    await Promise.all([
      maxApi.setDict('noteNames', {
        notes: names,
      }),
      maxApi.setDict('clip1', {
        scribbleObjects: finalClip,
      }),
    ]);

    maxApi.outlet('bang');
  })();
});
