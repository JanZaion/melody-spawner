const maxApi = require('max-api');
const { makeMelody } = require('./makeMelody');
const { magentize } = require('./magentize');
const { noteNamesFromLiveFormat } = require('./noteNamesFromLiveFormat');

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
