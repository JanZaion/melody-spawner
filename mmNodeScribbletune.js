/*
TODO:
-refactor mmlib from the current garbage
-apply new apiPass to atchords
-ditch velocontrol
-rework temp and bars to umenus

magenta:
-figure out local setup for checkpoint

semi-fixed:
-sometimes it doesent produce clip. Why? Sometimes it also just prints an empty clip (temp 2.0). If no clip, then maybe revert to the scribbleclip as default. Answer: Scribbleformax does not understand minus pitches. Solution: polyfil by transposing minus notes an octave higher. Or even better, ditch Scribbleformax in favor of magenta solution
-make the generate button unavailable when magenta is generating clip. Once the style is final, make the toggle into a comment
-make RNN initialization on loadbang - does not and prly should not, but red error message is now gone
-rework splitter at max and at js. Partialy refactored now

*/
const maxApi = require('max-api');
const { noteNamesFromLiveFormat, makeMelody } = require('./mmlib');
const { magentize } = require('./mmSCtoRNN');

const joinWithAI = async (params) => {
  const { AI, midiSteps } = params;
  if (AI === 0) return midiSteps;

  maxApi.outlet('AIstatus 1');
  maxApi.outlet('disable 0');

  const AIclip = await magentize(params);

  maxApi.outlet('AIstatus 0');
  maxApi.outlet('disable 1');

  switch (AI) {
    case 1:
      return AIclip;

    case 2:
      const liveFormat = midiSteps.liveFormat.concat(
        AIclip.liveFormat.map((step) => {
          return { ...step, start_time: step.start_time + midiSteps.totalDuration };
        })
      );
      const totalDuration = midiSteps.totalDuration + AIclip.totalDuration;

      return { liveFormat, totalDuration };
  }
};

maxApi.addHandler('makeClip', () => {
  const constructClip = (async () => {
    const full = await maxApi.getDict('full');

    const midiSteps = makeMelody(full);

    full.midiSteps = midiSteps;

    const finalClip = await joinWithAI(full);

    const { liveFormat, totalDuration } = finalClip;

    const names = noteNamesFromLiveFormat(liveFormat);

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
