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
  //the problem is prly somwhere here
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

  return core.sequences.quantizeNoteSequence(unqunatizedSequence, 4); //second arg is steps per quarter, find out what it is
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
  // dont forget about the case where total time is higher than the end time of the final step!!!
  const unquantizedMelody = core.sequences.unquantizeSequence(RNNmelody);
  console.log(unquantizedMelody); // dont forget me!

  // unquantizedMelody.notes.forEach((step, index) => {
  //   const currentStepStartTime = step.startTime;
  //   const currentStepEndTime = step.endTime;
  //   let previousStepEndTime;
  //   let followingStepStartTime;
  //   let nullPush = false;

  //   index > 0
  //     ? (previousStepEndTime = unquantizedMelody.notes[index - 1].endTime)
  //     : (previousStepEndTime = currentStepStartTime);

  //   index < notes.length
  //     ? (followingStepStartTime = unquantizedMelody.notes[index + 1].startTime)
  //     : (followingStepStartTime = 0);

  //   if (nullPush) {
  //     if (currentStepStartTime === previousStepEndTime) {
  //       clipNullFill.push(step);
  //     } else {
  //       return { pitch: null, startTime: (currentStepStartTime - previousStepEndTime) * 512, endTime: 100 };
  //     }
  //   }
  // });

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
    const arr = [mmStepToScribbleStep(unquantizedMelody.notes[0])];

    let j = 1;
    for (let i = 1; i < times.length - 1; i += 2) {
      if (times[i] === times[i + 1]) {
        arr.push(mmStepToScribbleStep(unquantizedMelody.notes[j]));
      } else {
        arr.push(mmStepToScribbleStep({ pitch: null, startTime: times[i], endTime: times[i + 1] }));
        arr.push(mmStepToScribbleStep(unquantizedMelody.notes[j]));
      }
      j++;
    }

    return arr;
  })();

  // console.log(times);
  // console.log(clipNullFill);
  // console.log(unquantizedMelody.notes.length);
  // console.log(clipNullFill.length);

  // const clipFinal = unquantizedMelody.notes.map((step, index) => {
  //   const currentStepStartTime = step.startTime;
  //   let previousStepEndTime;
  //   index > 0
  //     ? (previousStepEndTime = unquantizedMelody.notes[index - 1].endTime)
  //     : (previousStepEndTime = currentStepStartTime);

  //   if (currentStepStartTime === previousStepEndTime) {
  //     //this is soooo stooopid!
  //     //this sometimes evaluates as it shouldnt, nulls more often, look into scribbleClipToUnquantizedNotes
  //     return {
  //       note: [Note.fromMidi(step.pitch)],
  //       length: (step.endTime - step.startTime) * 512,
  //       level: 100,
  //     };
  //   } else {
  //     return { note: null, length: (currentStepStartTime - previousStepEndTime) * 512, level: 100 };
  //   }
  // });

  return clipFinal;
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
      { note: ['C2'], length: 256, level: 100 },
      { note: ['B2'], length: 256, level: 100 },
      { note: ['C2'], length: 256, level: 100 },
      { note: ['B2'], length: 256, level: 100 },
      { note: ['C2'], length: 256, level: 100 },
      { note: null, length: 256, level: 100 },
      { note: ['C2'], length: 256, level: 100 },
      { note: ['B2'], length: 256, level: 100 },
    ],
    steps: 40,
    temperature: 1,
  });
  console.log(asd);

  console.log(
    asd.reduce((accumulator, step) => {
      // the outcome of this must be deterministic
      return accumulator + step.length;
    }, 0)
  );
})();

//run this thing and see that major debuggin is necessary
