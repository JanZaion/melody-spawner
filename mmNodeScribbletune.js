/*
TODO:
-refactor mmlib from the current garbage
-fix all places with redeclare scribbleclip
-simplify the route from scribble and magenta to API by not converting it to steps back and forth.
-abstract mmformat from scribbleClipToMidiSteps
-write noteNamesFromLiveFormat
-rework splitter at max
-apply new apiPass to atchords

magenta:
-figure out local setup for checkpoint

semi-fixed:
-sometimes it doesent produce clip. Why? Sometimes it also just prints an empty clip (temp 2.0). If no clip, then maybe revert to the scribbleclip as default. Answer: Scribbleformax does not understand minus pitches. Solution: polyfil by transposing minus notes an octave higher. Or even better, ditch Scribbleformax in favor of magenta solution
-make the generate button unavailable when magenta is generating clip. Once the style is final, make the toggle into a comment
-make RNN initialization on loadbang - does not and prly should not, but red error message is now gone

*/
const maxApi = require('max-api');
const mmlib = require('./mmlib'); //once finished, require just the necessary methods, not the whole file
const { magentize } = require('./mmSCtoRNN');

const joinWithAI = async (params) => {
  const { AI, scribbleClip } = params;
  if (AI === 0) return scribbleClip;

  maxApi.outlet('AIstatus 1');
  maxApi.outlet('disable 0');

  const AIclip = await magentize(params);
  const AIclipNoNegatives = mmlib.transposeNegativeFirstNotesInScribbleclip(AIclip);

  maxApi.outlet('AIstatus 0');
  maxApi.outlet('disable 1');

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

    full.scribbleClip = clipMade;

    const finalClip = await joinWithAI(full);

    //this one will need a little bit of rework after simplifying by looping through midi steps and converting midi nums to names
    const names = mmlib.noteNamesFromScribbleclip(finalClip);

    const { liveFormat, totalDuration } = mmlib.scribbleClipToMidiSteps(finalClip);

    await Promise.all([
      maxApi.setDict('noteNames', {
        notes: names,
      }),
      maxApi.setDict('stepsClip', {
        notes: liveFormat,
        totalDuration,
      }),
    ]);

    maxApi.outlet('bang');
  })();
});
