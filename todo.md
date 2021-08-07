# TODO:

- apply new apiPass to atchords
- ditch velocontrol
- fix the suck with transposing C- notes that scribbletune cant work with. Maybe in midi or something
  Bidirectional features:
- for rhythm - extract rhythm pattern based on subdiv
- for melody - get based on selected key. For of key notes, just transpose up an octave. for chords, only get root note

## magenta:

- figure out local setup for checkpoint

## semi-fixed:

- sometimes it doesent produce clip. Why? Sometimes it also just prints an empty clip (temp 2.0). If no clip, then maybe revert to the scribbleclip as default. Answer: Scribbleformax does not understand minus pitches. Solution: polyfil by transposing minus notes an octave higher. Or even better, ditch Scribbleformax in favor of magenta solution
- make the generate button unavailable when magenta is generating clip. Once the style is final, make the toggle into a comment
- make RNN initialization on loadbang - does not and prly should not, but red error message is now gone
- rework splitter at max and at js. Partialy refactored now
