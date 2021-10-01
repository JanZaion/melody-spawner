# TODO:

- fix the suck with transposing C- notes that scribbletune cant work with. Maybe in midi or something.
- fix the bug when the clip is not cleared, or investigate whether needed at all
- testLive 10 support
- accomodate for scribble v5 updt
- make makemelody accept tonic notation intervals
- make the upperbound/lowerbound so that its clear that we are talking about intervals.
- add description to presets
- implement '.' in the rhythm pattern text window and getrhythm alg. Do it when it gets released in the new version
- make parameters relevant to the selected algo highlighted
- colorcode UI - 1 color for rhythm, 2nd color for pitch, 3rd color for both.
- before production, check that all umenus were loaded correctly into full
- fix get + gate - when getting the pattern, it must not send out a bang. Maybe redo the thing so that the bang just goes from the full dict instead from individual params
- add 'observe' button that will watch note evenets and write them to textedits. Foolow the example in the observe subpatch of the Notes API - Before and After.amxd patch

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

- create a folder with "production content". Include all necessary files here and the main patch as .maxpat file. Include the original package.json here, but install with npm install --production
- remove all the fluff from .maxpat files, ie node debug window
- following the tutorial at https://docs.cycling74.com/max8/vignettes/03_n4m_projects_devices works well with these other steps
- produce the amxd directly from the project management window by "export max for live device"
- always keep the .maxproj file at some separate folder, ie The default folder chosen by Max

## pitch and rhythm algos

Adding new Algos:

1. write the algo as an arrow function
2. add the algo and the description to the algos object as an object with appropriate keys
3. add the name of the algo to the Max frontend. The name at the frontend must match the key added to the rhythmAlgos object

If its algo from bothAlgos, then return has to be an object with appropriate keys. Else its a string

### Rhyth Algos

- rhythmic development - double the selected sequence and 1) suggest continuation by filling the last 2 beats with the same beats as before, but subdivided [] by 2 and twice as much of them 2) sense of finality by ending on 1st or 2nd beat while filling the rest of the sequence 3) suggest temporary repose by adding rests on 75% of the seq or by ending on 3 or 4 4) Augmentation - double the current phrase and add after it the same phrase, but make it twice as long 5) Diminution - add 2 current phrases after the current phrase, but make them half as long

### Both Algos

- Displacement - divide the phrase by 4, fill the first 1/4 by a space, ommit the last 1/4
- sequence 3 and 4 - duplicate the current motif and transpose it by +1, then +2, do it descending as well
- motivic expansion - add +1 to random 25% or 50% of notes
- motivic compression - add -1 to random 25% or 50% of notes
- all those finality etc suggestions, make em here with the melodic stuff as well
