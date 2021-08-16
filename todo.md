# TODO:

- apply new apiPass to atchords
- ditch velocontrol
- fix the suck with transposing C- notes that scribbletune cant work with. Maybe in midi or something
  Bidirectional features:
- for both dont forget to add Live 10 support
- add chromatic R
- hardcode default JSON preset that will init on loadbang
- on a slower day, rewrite requires to import syntax

## magenta:

- figure out local setup for checkpoint

## semi-fixed:

- sometimes it doesent produce clip. Why? Sometimes it also just prints an empty clip (temp 2.0). If no clip, then maybe revert to the scribbleclip as default. Answer: Scribbleformax does not understand minus pitches. Solution: polyfil by transposing minus notes an octave higher. Or even better, ditch Scribbleformax in favor of magenta solution
- make the generate button unavailable when magenta is generating clip. Once the style is final, make the toggle into a comment
- make RNN initialization on loadbang - does not and prly should not, but red error message is now gone
- reworked splitter, menu still kinda confusing, halving very inefficient
