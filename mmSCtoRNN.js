// const mvae = require('@magenta/music/node/music_vae');
const mm = require('@magenta/music/node/music_rnn');
const core = require('@magenta/music/node/core');
const { Note } = require('@tonaljs/tonal');

// const process = require('process');
// const path = require('path');
// const fs = require('fs');

//2 tested checkpoints:
// without chord progression: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn'
// with chord progression: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv'

const midiStepsToQuantizedSequence = (midiSteps) => {
  const { totalDuration, liveFormat } = midiSteps;

  const unqunatizedSequence = {
    ticksPerQuarter: 128,
    totalTime: totalDuration,
    timeSignatures: [
      {
        time: 0,
        numerator: 4,
        denominator: 4,
      },
    ],

    notes: liveFormat.map((step) => {
      return { pitch: step.pitch, startTime: step.start_time, endTime: step.start_time + step.duration };
    }),
  };

  const quantizedSequence = core.sequences.quantizeNoteSequence(unqunatizedSequence, 4);

  return quantizedSequence;
};

const quantizedSequenceToMidiSteps = (quantizedMelody) => {
  const notes = core.sequences.unquantizeSequence(quantizedMelody).notes;

  const liveFormat = notes.map((step) => {
    return {
      pitch: step.pitch,
      start_time: step.startTime,
      duration: step.endTime - step.startTime,
      velocity: 100,
      probability: 1,
      velocity_deviation: 1,
      release_velocity: 64,
      mute: 0,
    };
  });

  const totalDuration = notes[notes.length - 1].endTime;

  return { liveFormat, totalDuration };
};

const magentize = async (params) => {
  const {
    midiSteps,
    steps = 8,
    temperature = 1.1,
    checkpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn',
    // checkpoint = 'C:/Users/zajic/Desktop/melody-with-magenta/checkpoints/melody_rnn/',
    // checkpoint = `${currentPath}`,
    // checkpoint = currentPath,
    // checkpoint = path.resolve(process.cwd(), '/checkpoints/melody_rnn'),
    // checkpoint = './checkpoints/melody_rnn/',
  } = params;

  const RNN = new mm.MusicRNN(checkpoint);
  await RNN.initialize();

  const quantizedLiveFormat = midiStepsToQuantizedSequence(midiSteps);

  const RNNmelody = await RNN.continueSequence(quantizedLiveFormat, steps, temperature);

  //sometimes RNN returns sequence with no notes. That breaks the whole thing. As a guard clause, there is this if statement that returns the original scribbleclip
  if (RNNmelody.notes.length === 0) {
    return quantizedSequenceToMidiSteps(quantizedLiveFormat);
  }

  return quantizedSequenceToMidiSteps(RNNmelody);
};

module.exports = { magentize };

// (async () => {
//   const asd = await magentize({
//     scribbleClip: [
//       { note: ['C2'], length: 256, level: 100 },
//       { note: ['B2'], length: 256, level: 100 },
//       { note: ['C2'], length: 256 * 4, level: 100 },
//       { note: ['B2'], length: 256, level: 100 },
//     ],
//     steps: 40,
//     temperature: 0.4,
//   });
//   console.log(asd);
// })();

// (() => {
//   console.log(
//     scribbleClipToQuantizedSequence([
//       { note: ['C2', 'B2', 'D3'], length: 256, level: 100 },
//       { note: ['B2'], length: 256, level: 100 },
//       { note: null, length: 256, level: 100 },
//       { note: ['C2'], length: 256 * 4, level: 100 },
//       { note: ['B2'], length: 256, level: 100 },
//     ])
//   );
// })();

// console.log(
//   asd.reduce((accumulator, step) => {
//     // the outcome of this must be deterministic
//     return accumulator + step.length;
//   }, 0)
// );
