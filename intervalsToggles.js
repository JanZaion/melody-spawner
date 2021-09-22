var scales = {
  chromatic: [['chromatic'], 12],
  nonatonic: [['composite blues', "messiaen's mode #3"], 9],
  octatonic: [
    [
      "messiaen's mode #4",
      'purvi raga',
      'spanish heptatonic',
      'bebop',
      'bebop minor',
      'bebop major',
      'bebop locrian',
      'minor bebop',
      'diminished',
      'ichikosucho',
      'minor six diminished',
      'half-whole diminished',
      'kafi raga',
      "messiaen's mode #6",
    ],
    8,
  ],
  diatonic: [
    [
      'major',
      'minor',
      'lydian',
      'phrygian',
      'aeolian',
      'dorian',
      'mixolydian',
      'locrian',
      'locrian major',
      'double harmonic lydian',
      'harmonic minor',
      'altered',
      'locrian #2',
      'mixolydian b6',
      'lydian dominant',
      'lydian augmented',
      'dorian b2',
      'melodic minor',
      'ultralocrian',
      'locrian 6',
      'augmented heptatonic',
      'romanian minor',
      'dorian #4',
      'lydian diminished',
      'leading whole tone',
      'lydian minor',
      'phrygian dominant',
      'balinese',
      'neopolitan major',
      'harmonic major',
      'double harmonic major',
      'hungarian minor',
      'hungarian major',
      'oriental',
      'flamenco',
      'todi raga',
      'persian',
      'enigmatic',
      'major augmented',
      'lydian #9',
    ],
    7,
  ],
  hexatonic: [
    [
      'minor hexatonic',
      'augmented',
      'major blues',
      'piongio',
      'prometheus neopolitan',
      'prometheus',
      'mystery #1',
      'six tone symmetric',
      'whole tone',
      "messiaen's mode #5",
      'minor blues',
    ],
    6,
  ],
  pentatonic: [
    [
      'major pentatonic',
      'ionian pentatonic',
      'mixolydian pentatonic',
      'ritusen',
      'egyptian',
      'neopolitan major pentatonic',
      'vietnamese 1',
      'pelog',
      'kumoijoshi',
      'hirajoshi',
      'iwato',
      'in-sen',
      'lydian pentatonic',
      'malkos raga',
      'locrian pentatonic',
      'minor pentatonic',
      'minor six pentatonic',
      'flat three pentatonic',
      'flat six pentatonic',
      'scriabin',
      'whole tone pentatonic',
      'lydian #5P pentatonic',
      'lydian dominant pentatonic',
      'minor #7M pentatonic',
      'super locrian pentatonic',
    ],
    5,
  ],
};

function intervalsToggles(intervals) {
  var patch = this.patcher;
  var upperBound = patch.getnamed('upperBound');
  var lowerBound = patch.getnamed('lowerBound');
  var scale = patch.getnamed('scale');

  upperBound.clear();
  lowerBound.clear();
  scale.clear();

  // lowerBound.bgfillcolor(77, 77, 77); //rgba they say in the help field
  // lowerBound.color(5);

  var selectedScale = scales[intervals][0];
  var numOfIntervals = scales[intervals][1];

  for (var i = 0; i < numOfIntervals + 1; i = i + 1) upperBound.append(i);
  for (var j = 0; j > numOfIntervals * -1 - 1; j = j - 1) lowerBound.append(j);
  for (var k = 0; k < selectedScale.length; k = k + 1) scale.append(selectedScale[k]);

  upperBound.set(numOfIntervals);
  lowerBound.set(numOfIntervals);

  outlet(0, 'bang');
}
