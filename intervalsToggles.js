function intervalsToggles(intervals) {
  var patch = this.patcher;
  var upperBound = patch.getnamed('upperBound');
  var lowerBound = patch.getnamed('lowerBound');

  upperBound.clear();
  lowerBound.clear();

  switch (intervals) {
    case 'diatonic':
      for (var i = 1; i < 8; i = i + 1) upperBound.append(i);
      for (var j = 0; j > -8; j = j - 1) lowerBound.append(j);
      break;

    case 'chromatic':
      for (var i = 1; i < 13; i = i + 1) upperBound.append(i);
      for (var j = 0; j > -13; j = j - 1) lowerBound.append(j);
      break;
  }

  outlet(0, 'bang');
}
