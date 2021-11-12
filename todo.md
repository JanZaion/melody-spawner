# TODO:

- fix the suck with transposing C- notes that scribbletune cant work with. Maybe in midi or something.
- accomodate for scribble v5 updt
- switch textedit for jweb ui. Write reges so that each character is scanned for validity. Make autorender and autosync so that its not mutually exclusive
- make makemelody accept tonic notation intervals
- make the upperbound/lowerbound so that its clear that we are talking about intervals.
- add description to presets
- implement '.' in the rhythm pattern text window and getrhythm alg. Do it when it gets released in the new version
- make parameters relevant to the selected algo highlighted
- colorcode UI - 1 color for rhythm, 2nd color for pitch, 3rd color for both.
- declutter. delete magenta, checkpoints and all other trash. Figure out whether it is possible to bring in individual tone methods

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
2. add the algo and the description to the algos array as an object with appropriate keys
3. add the name of the algo to the Max frontend menu item so that its index matches the index of the algo in the algos array.

If its algo from bothAlgos, then return has to be an object with appropriate keys. Else its a string

### Rhyth Algos

- rhythmic development - double the selected sequence and 1) suggest continuation by filling the last 2 beats with the same beats as before, but subdivided [] by 2 and twice as much of them 2) sense of finality by ending on 1st or 2nd beat while filling the rest of the sequence 3) suggest temporary repose by adding rests on 75% of the seq or by ending on 3 or 4 4) Augmentation - double the current phrase and add after it the same phrase, but make it twice as long 5) Diminution - add 2 current phrases after the current phrase, but make them half as long

### Both Algos

- all those finality etc suggestions, make em here with the melodic stuff as well

## Transition to Int Based Menus

1. Put all the algos to an array instead of to an object
2. accomodate for this change in construct
3. let the menusonload know this by integrating this into name, prly naming stuff like rhythmAlgosInt so it can be searched for with .indexOf
