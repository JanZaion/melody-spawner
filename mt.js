const mvae = require('@magenta/music/node/music_vae');
const mm = require('@magenta/music/node/music_rnn');
const core = require('@magenta/music/node/core');
const { midi, Note } = require('@tonaljs/tonal');
// const mvae = require('@magenta/music/node/music_vae');
// const mrnn = require('@magenta/music/node/music_rnn');
// const core = require('@magenta/music/node/core');

// const model = new mvae.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn');

const improvCheckpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv';
const improvRNN = new mm.MusicRNN(improvCheckpoint);

const sequence = {
  ticksPerQuarter: 220, //scribbleclip is prly 128, default in magenta is 2020
  totalTime: 28.5,
  timeSignatures: [
    {
      time: 0,
      numerator: 4,
      denominator: 4,
    },
  ],
  tempos: [
    {
      time: 0,
      qpm: 120,
    },
  ],
  notes: [
    { pitch: Note.midi('Gb4'), startTime: 0, endTime: 1 },
    { pitch: Note.midi('F4'), startTime: 1 + 1, endTime: 3.5 + 1 },
    { pitch: Note.midi('Ab4'), startTime: 3.5 + 2, endTime: 4 + 2 },
    { pitch: Note.midi('C5'), startTime: 4 + 3, endTime: 4.5 + 3 },
    { pitch: Note.midi('Eb5'), startTime: 4.5 + 4, endTime: 5 + 4 },

    // { pitch: Note.midi('Gb4'), startTime: 0, endTime: 1 },
    // { pitch: Note.midi('F4'), startTime: 1, endTime: 3.5 },
    // { pitch: Note.midi('Ab4'), startTime: 3.5, endTime: 4 },
    // { pitch: Note.midi('C5'), startTime: 4, endTime: 4.5 },
    // { pitch: Note.midi('Eb5'), startTime: 4.5, endTime: 5 },
    // { pitch: Note.midi('Gb5'), startTime: 5, endTime: 6 },
    // { pitch: Note.midi('F5'), startTime: 6, endTime: 7 },
    // { pitch: Note.midi('E5'), startTime: 7, endTime: 8 },
    // { pitch: Note.midi('Eb5'), startTime: 8, endTime: 8.5 },
    // { pitch: Note.midi('C5'), startTime: 8.5, endTime: 9 },
    // { pitch: Note.midi('G4'), startTime: 9, endTime: 11.5 },
    // { pitch: Note.midi('F4'), startTime: 11.5, endTime: 12 },
    // { pitch: Note.midi('Ab4'), startTime: 12, endTime: 12.5 },
    // { pitch: Note.midi('C5'), startTime: 12.5, endTime: 13 },
    // { pitch: Note.midi('Eb5'), startTime: 13, endTime: 14 },
    // { pitch: Note.midi('D5'), startTime: 14, endTime: 15 },
    // { pitch: Note.midi('Db5'), startTime: 15, endTime: 16 },
    // { pitch: Note.midi('C5'), startTime: 16, endTime: 16.5 },
    // { pitch: Note.midi('F5'), startTime: 16.5, endTime: 17 },
    // { pitch: Note.midi('F4'), startTime: 17, endTime: 19.5 },
    // { pitch: Note.midi('G4'), startTime: 19.5, endTime: 20 },
    // { pitch: Note.midi('Ab4'), startTime: 20, endTime: 20.5 },
    // { pitch: Note.midi('C5'), startTime: 20.5, endTime: 21 },
    // { pitch: Note.midi('Eb5'), startTime: 21, endTime: 21.5 },
    // { pitch: Note.midi('C5'), startTime: 21.5, endTime: 22 },
    // { pitch: Note.midi('Eb5'), startTime: 22, endTime: 22.5 },
    // { pitch: Note.midi('C5'), startTime: 22.5, endTime: 24.5 },
    // { pitch: Note.midi('Eb5'), startTime: 24.5, endTime: 25.5 },
    // { pitch: Note.midi('G4'), startTime: 25.5, endTime: 28.5 },
  ],
};

const quantizedSequence = core.sequences.quantizeNoteSequence(sequence, 1);
console.log(quantizedSequence);
const startProgram = async () => {
  try {
    await improvRNN.initialize();
    const improvisedMelody = await improvRNN.continueSequence(quantizedSequence, 60, 1.1, [
      'Bm',
      'Bbm',
      'Gb7',
      'F7',
      'Ab',
      'Ab7',
      'G7',
      'Gb7',
      'F7',
      'Bb7',
      'Eb7',
      'AM7',
    ]);

    console.log(improvisedMelody);
    console.log(core.sequences.unquantizeSequence(improvisedMelody, 120));
  } catch (error) {
    console.error(error);
  }
};

startProgram();

/*
TODO:
-figure out how to transdorm the scribbletune format to this and back. Use jsmidgen prly. Look at how scribbletune and jsmidgen interact
-how to deal with null notes: they are actually just absences of any notes, so prly just write in null notes and then delete them

*/
