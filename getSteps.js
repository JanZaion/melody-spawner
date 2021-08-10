function clipOrSlot() {
  var clipToSelect = new LiveAPI('live_set view detail_clip');
  if (clipToSelect) {
    return clipToSelect;
  } else {
    return new LiveAPI('live_set view highlighted_clip_slot clip');
  }
}

function getClip(dictName) {
  //Live 11 only, make one for Live 10
  var clip = clipOrSlot();
  var stepsDict = clip.call('get_notes_extended', 1, 127, 0, 258);
  var notes = stepsDict.toString();
  var totalDuration = clip.get('loop_end');
  var d = new Dict(dictName);

  d.clear();
  d.parse(notes);
  d.set('totalDuration', totalDuration);

  outlet(0, 'bang');
}
