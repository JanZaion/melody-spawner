# TODO:

- apply new apiPass to atchords
- fix the suck with transposing C- notes that scribbletune cant work with. Maybe in midi or something. Although its prly just a magenta thing
- fix the bug when the clip is not cleared, or investigate whether needed at all
- testLive 10 support
- on a slower day, rewrite requires to import syntax
- accomodate for scribble v5 updt
- make the upperbound/lowerbound so that its clear that we are talking about intervals. Intervals should be starting at 0
- make makemelody accept tonic notation intervals

## magenta:

- figure out local setup for checkpoint
- and also just separate it from this device
- make it so that it is based on a subset of ready made patterns

## semi-fixed:

- sometimes it doesent produce clip. Why? Sometimes it also just prints an empty clip (temp 2.0). If no clip, then maybe revert to the scribbleclip as default. Answer: Scribbleformax does not understand minus pitches. Solution: polyfil by transposing minus notes an octave higher. Or even better, ditch Scribbleformax in favor of magenta solution
- make RNN initialization on loadbang - does not and prly should not, but red error message is now gone
- hardcoded default JSON preset on loadbang works now, but relies on delay. Maybe there is a cleaner solution
- fix enharmonics - when getting pitches, bs for minor scales and #s for major scales. Thats one way to do it. The other is to look at the rootNote and its # or b. But what about rns without sharps or flats? Shelving this problem now, everything will be flats

## production

- fullowing the tutorial at https://docs.cycling74.com/max8/vignettes/03_n4m_projects_devices seems to have worked
- produce the amxd directly from the project management window
- the main patch that is included should not be amxd but maxpat. When creating the maxpat, copying from amxd messes up stuff, find a better way
- export max for live device is probably the way to go
- only include necessery stuff, else the device is bloated and slow. Remove all dev deps from packages etc

## pitch and rhythm algos

Adding new Algos:

1. write the algo as an arrow function
2. add the algo and the description to the algos object as an object with appropriate keys
3. add the name of the algo to the Max frontend. The name at the frontend must match the key added to the rhythmAlgos object

Algos added to the rhythmAlgos can take one argument and thats the pattern received from the frontend. should be fun
