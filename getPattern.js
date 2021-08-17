const { quantize } = require('./quantize');

const duplicateNotes = (notes) => {
  return notes.map((step) => {
    return { ...step };
  });
};

//sorts by the earliest start time and then by the lowest pitch
const sortStartTimesAndPitches = (notes) => {
  const notesMutable = duplicateNotes(notes);

  const startTimesSorted = notesMutable.sort((a, b) =>
    a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0
  );

  const arrays = [];

  startTimesSorted.forEach((step, stepIndex) => {
    const { start_time } = step;
    const prevStep = startTimesSorted[stepIndex - 1];

    if (stepIndex === 0 || start_time !== prevStep.start_time) {
      let int = 0;
      const innerArr = [];

      while (startTimesSorted[stepIndex + int] && start_time === startTimesSorted[stepIndex + int].start_time) {
        innerArr.push(startTimesSorted[stepIndex + int]);
        int++;
      }

      arrays.push(innerArr);
    }
  });

  const pitchesSorted = [];

  for (const innerArr of arrays) {
    const pitchesSortedInner = innerArr.sort((a, b) => (a.pitch > b.pitch ? 1 : b.pitch > a.pitch ? -1 : 0));

    for (const step of pitchesSortedInner) {
      pitchesSorted.push(step);
    }
  }
  return pitchesSorted;
};

const checkOverlaps = (notes, block) => {
  const notesMutable = duplicateNotes(notes);

  notesMutable.forEach((step, stepIndex) => {
    const { start_time, duration } = step;
    const stepEnd = start_time + duration;
    let shortestFollowingStart = 0;

    notesMutable.forEach((nextStep, nextStepIndex) => {
      const next_start_time = nextStep.start_time;
      const next_duration = nextStep.duration;
      const nextEnd = next_start_time + next_duration;

      //check if overlap in following note
      if (next_start_time < stepEnd && next_start_time > start_time) {
        //check if the overlaping note is the earliest following
        if (shortestFollowingStart === 0 || next_start_time < shortestFollowingStart) {
          //ckeck how long the overlap is to decide whether to create separate note else chord
          if (duration / 2 > stepEnd - next_start_time) {
            shortestFollowingStart = next_start_time;
          } else {
            notesMutable[nextStepIndex].start_time = start_time;
            notesMutable[nextStepIndex].duration = duration;
          }
        }
      }

      //check following notes if they long for chord creation
      if (stepEnd !== nextEnd && next_start_time === start_time && nextStepIndex > stepIndex)
        notesMutable[nextStepIndex].duration = duration;
    });
    if (shortestFollowingStart !== 0) notesMutable[stepIndex].duration = shortestFollowingStart - start_time;

    if (notesMutable[stepIndex].duration === 0) notesMutable[stepIndex].duration = block;
  });

  return notesMutable;
};

const dechordify = (notes) => {
  const unique_start_times = new Set();
  const dechordifiedNotes = [];

  notes.forEach((step) => {
    const { start_time } = step;
    const preAddSize = unique_start_times.size;
    unique_start_times.add(start_time);
    if (preAddSize < unique_start_times.size) dechordifiedNotes.push({ ...step });
  });

  return dechordifiedNotes;
};

const createRhythmPattern = (dechordifiedNotes, block) => {
  const onEvents = dechordifiedNotes.map((step) => {
    const { start_time, duration } = step;

    return { start_time: start_time / block, duration: duration / block };
  });

  const allEvents = [];

  onEvents.forEach((step, stepIndex) => {
    const { start_time, duration } = step;

    if (stepIndex === 0) {
      allEvents.push({ duration: start_time, note: false });
    } else {
      const prevStepEnd = onEvents[stepIndex - 1].start_time + onEvents[stepIndex - 1].duration;
      allEvents.push({ duration: start_time - prevStepEnd, note: false });
    }
    allEvents.push({ duration, note: true });
  });

  const pattern = allEvents
    .map((step) => {
      const { duration, note } = step;

      if (note) {
        const underscores = '_'.repeat(duration - 1);
        return 'x' + underscores;
      } else {
        return '-'.repeat(duration);
      }
    })
    .join('');

  return pattern;
};

//add a guard clause for empty clips
const getPattern = (notes, block) => {
  if (notes.length === 0) return '';

  const quantizedNotes = notes.map((step) => {
    return {
      ...step,
      start_time: quantize(step.start_time, block, true),
      duration: quantize(step.duration, block, false),
    };
  });

  const notesSortedOne = sortStartTimesAndPitches(quantizedNotes);

  const noOverlapSteps = checkOverlaps(notesSortedOne, block);

  const notesSortedTwo = sortStartTimesAndPitches(noOverlapSteps);

  const dechordifiedNotes = dechordify(notesSortedTwo);

  const pattern = createRhythmPattern(dechordifiedNotes, block);

  return pattern;
};

module.exports = { getPattern };
