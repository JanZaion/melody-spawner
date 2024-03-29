//gets dict whit the clip to pass
function getDict(dictName) {
  var d = new Dict(dictName);
  var notesObject = JSON.parse(d.stringify());

  return notesObject;
}

//clears a clip passes the dict using Ableton Live 10 methods
function liveTen(clip, dict) {
  var inner = dict.notes;
  var end_time = clip.get('end_time');
  clip.call('remove_notes', 0, 1, end_time, 127);
  clip.call('set_notes');
  clip.call('notes', inner.length);
  for (var step = 0; step < inner.length; step++) {
    clip.call(
      'note',
      inner[step].pitch,
      inner[step].start_time.toFixed(6).toString(),
      inner[step].duration.toFixed(6).toString(),
      inner[step].velocity,
      0
    );
  }
  clip.call('done');
}

//clears a clip passes the dict using Ableton Live 11 methods
function liveEleven(clip, dict) {
  var end_time = clip.get('end_time');
  clip.call('remove_notes_extended', 1, 127, 0, end_time);
  clip.call('add_new_notes', dict);
}

var clipToSelect = new LiveAPI();

//returns whats selected
function clipOrSlot() {
  clipToSelect.path = 'live_set view detail_clip';
  if (clipToSelect) {
    return clipToSelect;
  } else {
    clipToSelect.path = 'live_set view highlighted_clip_slot clip';
    return clipToSelect;
  }
}

var liveVersion = new LiveAPI();

//passes notes down to the Live API based on the received name of a dict and active Live version
function setNotes(dictName) {
  var clip = clipOrSlot();
  var dict = getDict(dictName);

  clip.set('loop_end', dict.totalDuration);
  liveVersion.path = 'live_app';

  if (liveVersion.call('get_major_version') === 10) {
    liveTen(clip, dict);
  } else {
    liveEleven(clip, dict);
  }
}
