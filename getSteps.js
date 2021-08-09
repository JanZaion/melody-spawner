function clipOrSlot() {
  var clipToSelect = new LiveAPI('live_set view detail_clip');
  if (clipToSelect) {
    return clipToSelect;
  } else {
    return new LiveAPI('live_set view highlighted_clip_slot clip');
  }
}

function getClip() {
  var clip = clipOrSlot();
  var stepsDict = clip.call('get_notes_extended', 1, 127, 0, 258);
  var clipLength = clip.get('loop_end');
}
