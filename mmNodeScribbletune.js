/*
TODO:
-once everything is complete, add "init" button to device and make it loadbang
-refactor mmlib from the current garbage
-fix all places with redeclare scribbleclip

magenta:
-figure out local setup for checkpoint
-make RNN initialization on loadbang

refactoring from scribbletune.max benefits:
-no need to polyfill back to scribbleclip
-mabe it fixes the issue with the ugly prompt
-maybe it fixes the issue when very short notes are slightly longer
-could simplify the splitter menu
-it probably cant deal with chords though. Or maybe concurrent midi events are enough

semi-fixed:
-sometimes it doesent produce clip. Why? Sometimes it also just prints an empty clip (temp 2.0). If no clip, then maybe revert to the scribbleclip as default. Answer: Scribbleformax does not understand minus pitches. Solution: polyfil by transposing minus notes an octave higher. Or even better, ditch Scribbleformax in favor of magenta solution
-make the generate button unavailable when magenta is generating clip. Make this after the final style of the button is known

*/
const maxApi = require('max-api');
const mmlib = require('./mmlib');
const mmSCtoRNN = require('./mmSCtoRNN');

const joinWithAI = async (params) => {
  const { AI, scribbleClip } = params;
  if (AI === 0) return scribbleClip;

  maxApi.outlet('AIstatus 1');

  const AIclip = await mmSCtoRNN.magentize(params);
  const AIclipNoNegatives = mmlib.transposeNegativeFirstNotesInScribbleclip(AIclip);

  maxApi.outlet('AIstatus 0');

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

    const scribbleClip = clipMade;
    full.scribbleClip = scribbleClip;

    const finalClip = await joinWithAI(full);

    const names = mmlib.noteNamesFromScribbleclip(finalClip);

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
