# TODO:

- apply new apiPass to atchords
- ditch velocontrol
- fix the suck with transposing C- notes that scribbletune cant work with. Maybe in midi or something
  Bidirectional features:
- testLive 10 support
- hardcode default JSON preset that will init on loadbang
- on a slower day, rewrite requires to import syntax

## magenta:

- figure out local setup for checkpoint
- and also just separate it from this device

## semi-fixed:

- sometimes it doesent produce clip. Why? Sometimes it also just prints an empty clip (temp 2.0). If no clip, then maybe revert to the scribbleclip as default. Answer: Scribbleformax does not understand minus pitches. Solution: polyfil by transposing minus notes an octave higher. Or even better, ditch Scribbleformax in favor of magenta solution
- make RNN initialization on loadbang - does not and prly should not, but red error message is now gone

## production

- fullowing the tutorial at https://docs.cycling74.com/max8/vignettes/03_n4m_projects_devices seems to have worked
- produce the amxd directly from the project management window
- the main patch that is included should not be amxd but maxpat
- export max for live device is probably the way to go

## pitch and rhythm algos

Adding new Algos:

1. write the algo as an arrow function
2. add the algo to the rhythmAlgos object
3. add the name of the algo to the Max frontend. The name at the frontend must match the key added to the rhythmAlgos object

Algos added to the rhythmAlgos can take one argument and thats the pattern received from the frontend
