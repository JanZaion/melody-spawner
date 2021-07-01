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

const scribbleClipToMidiSteps = (scribbleClip) => {
  let startTime = 0;
  let endTime = 0;
  const notesArr = [];
  for (const step of scribbleClip) {
    endTime += step.length;

    if (step.note !== null) {
      notesArr.push({
        pitch: Note.midi(step.note[0]),
        startTime: (startTime / 128) * 0.25,
        endTime: (endTime / 128) * 0.25,
        velocity: step.velocity,
        muted: 0,
      });
    }

    startTime += step.length;
  }

  return notesArr;
};

const scribbleClipToQuantizedSequence = (scribbleClip) => {
  const totalScribbleClipTime = scribbleClip.reduce((accumulator, note) => {
    return accumulator + note.length;
  }, 0);

  const notes = scribbleClipToMidiSteps(scribbleClip);

  const unqunatizedSequence = {
    ticksPerQuarter: 128,
    totalTime: (totalScribbleClipTime / 128) * 0.25,
    timeSignatures: [
      {
        time: 0,
        numerator: 4,
        denominator: 4,
      },
    ],

    notes,
  };

  return core.sequences.quantizeNoteSequence(unqunatizedSequence, 4);
};

const scribbleClipToRNN = async (params) => {
  const {
    scribbleClip,
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

  const quantizedMelody = await RNN.continueSequence(scribbleClipToQuantizedSequence(scribbleClip), steps, temperature);

  //sometimes RNN returns sequence with no notes. That breaks the whole thing. As a guard clause, there is this if statement that returns the original scribbleclip if thats the case. But its not ready yet, since if thats the case, num of steps is not as it should be
  if (quantizedMelody.notes.length === 0) {
    return scribbleClipToQuantizedSequence(scribbleClip);
  }

  return quantizedMelody;
};

const quantizedMelodyToScribbleClip = (RNNmelody) => {
  const unquantizedMelody = core.sequences.unquantizeSequence(RNNmelody);

  const times = (() => {
    const arr = [];
    for (const step of unquantizedMelody.notes) {
      arr.push(step.startTime);
      arr.push(step.endTime);
    }

    return arr;
  })();

  const mmStepToScribbleStep = (mmStep) => {
    switch (mmStep.pitch) {
      case null:
        return { note: null, length: (mmStep.endTime - mmStep.startTime) * 512, level: 100 };

      default:
        return {
          note: [Note.fromMidi(mmStep.pitch)],
          length: (mmStep.endTime - mmStep.startTime) * 512,
          level: 100,
        };
    }
  };

  const clipFinal = (() => {
    const clip = [mmStepToScribbleStep(unquantizedMelody.notes[0])];

    let j = 1;
    for (let i = 1; i < times.length - 1; i += 2) {
      if (times[i] === times[i + 1]) {
        clip.push(mmStepToScribbleStep(unquantizedMelody.notes[j]));
      } else {
        clip.push(mmStepToScribbleStep({ pitch: null, startTime: times[i], endTime: times[i + 1] }));
        clip.push(mmStepToScribbleStep(unquantizedMelody.notes[j]));
      }
      j++;
    }

    const theVeryStartTime = unquantizedMelody.notes[0].startTime;
    if (theVeryStartTime !== 0) {
      clip.unshift(
        mmStepToScribbleStep({
          pitch: null,
          startTime: 0,
          endTime: theVeryStartTime,
        })
      );
    }

    const theVeryEndTime = times[times.length - 1];
    if (unquantizedMelody.totalTime !== theVeryEndTime) {
      clip.push(
        mmStepToScribbleStep({
          pitch: null,
          startTime: theVeryEndTime,
          endTime: unquantizedMelody.totalTime,
        })
      );
    }

    return clip;
  })();

  return clipFinal;
};

const magentize = async (params) => {
  const magentaMelody = await scribbleClipToRNN(params);
  const magentaScribbleClip = quantizedMelodyToScribbleClip(magentaMelody);
  return magentaScribbleClip;
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
//     temperature: 2,
//   });
//   console.log(asd);

//   console.log(
//     asd.reduce((accumulator, step) => {
//       // the outcome of this must be deterministic
//       return accumulator + step.length;
//     }, 0)
//   );
// })();

//run this thing and see that major debuggin is necessary