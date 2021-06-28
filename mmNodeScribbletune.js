/*
TODO:
-once everything is complete, add "init" button to device and make it loadbang
-refactor mmlib from the current garbage
-make the generate button unavailable when magenta is generating clip

clipnames:
-make sure the ai notes become names of the clip as well

magenta:
-figure out local setup for checkpoint
-sometimes it doesent produce clip. Why? Sometimes it also just prints an empty clip (temp 2.0). If no clip, then maybe revert to the scribbleclip as default. Answer: Scribbleformax does not understand minus pitches. Solution: polyfil by transposing minus notes an octave higher. Or even better, ditch Scribbleformax in favor of magenta solution
-make RNN initialization on loadbang
-cannot read property pitch sometimes when more intricate rhythm patterns like x__xxx__ at quantizedMelodyToScribbleClip. try first refactoring to better maxapi format

/notes must always be in an array, now they are not
*/
const maxApi = require('max-api');
const mmlib = require('./mmlib');
const mmSCtoRNN = require('./mmSCtoRNN');

const joinWithAI = async (params) => {
  const { AI, scribbleClip } = params;
  if (AI === 0) return scribbleClip;

  const AIclip = await mmSCtoRNN.magentize(params);
  const AIclipNoNegatives = mmlib.transposeNegativeFirstNotesInScribbleclip(AIclip);

  switch (AI) {
    case 1:
      return AIclipNoNegatives;

    case 2:
      return scribbleClip.concat(AIclipNoNegatives);
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
