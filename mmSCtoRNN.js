const mvae = require('@magenta/music/node/music_vae');
const mm = require('@magenta/music/node/music_rnn');
const core = require('@magenta/music/node/core');
const { Note } = require('@tonaljs/tonal');

// const process = require('process');
// const path = require('path');

//2 tested checkpoints:
// without chord progression: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn'
// with chord progression: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv'

const scribbleClipToUnquantizedNotes = (scribbleClip) => {
  let startTime = 0;
  let endTime = 0;
  const notesArr = [];

  for (const step of scribbleClip) {
    endTime += step.length;

    if (step.note !== null) {
      notesArr.push({
        pitch: Note.midi(step.note[0]),
        startTime: (startTime / 128) * 0.125,
        endTime: (endTime / 128) * 0.125,
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

  const notes = scribbleClipToUnquantizedNotes(scribbleClip);

  const unqunatizedSequence = {
    ticksPerQuarter: 128,
    totalTime: (totalScribbleClipTime / 128) * 0.125,
    timeSignatures: [
      {
        time: 0,
        numerator: 4,
        denominator: 4,
      },
    ],

    notes,
  };

  return core.sequences.quantizeNoteSequence(unqunatizedSequence, 1);
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
  //ATM we are inicializing the RNN at every call of the fn. Prly suboptimal, maybe abstract away later
  const RNN = new mm.MusicRNN(checkpoint);

  await RNN.initialize();
  const quantizedMelody = await RNN.continueSequence(scribbleClipToQuantizedSequence(scribbleClip), steps, temperature);

  return quantizedMelody;
};

const quantizedMelodyToScribbleClip = (RNNmelody) => {
  const unquantizedMelody = core.sequences.unquantizeSequence(RNNmelody);
  console.log(unquantizedMelody); // dont forget me!
  const clip = unquantizedMelody.notes.map((step, index) => {
    const currentStepStartTime = step.startTime;
    let previousStepEndTime;
    index > 0
      ? (previousStepEndTime = unquantizedMelody.notes[index - 1].endTime)
      : (previousStepEndTime = currentStepStartTime);

    if (currentStepStartTime === previousStepEndTime) {
      return {
        note: Note.fromMidi(step.pitch),
        length: (step.endTime - step.startTime) * 512,
        level: 100,
      };
    } else {
      return { note: null, length: (currentStepStartTime - previousStepEndTime) * 512, level: 100 };
    }
  });

  return clip;
};

const magentize = async (params) => {
  const magentaMelody = await scribbleClipToRNN(params);
  const magentaScribbleClip = quantizedMelodyToScribbleClip(magentaMelody);
  return magentaScribbleClip;
};

module.exports = { magentize };

(async () => {
  const asd = await magentize({
    scribbleClip: [
      { note: 'C2', length: 256, level: 100 },
      { note: 'B2', length: 256, level: 100 },
    ],
    steps: 20,
    temperature: 1,
  });
  console.log(asd);
})();

//run this thing and see that major debuggin is necessary
