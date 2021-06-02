//This is class syntax for notes
class NoteClass {
  constructor(name, octave) {
    this.name = name;
    this.octave = octave;
  }

  octaveLower() {
    this.octave = this.octave - 1;
  }
  octaveHigher() {
    this.octave = this.octave + 1;
  }
}

const Eone = new NoteClass('E', 1);
Eone.octaveLower();
Eone.octaveLower();
Eone.octaveHigher();
console.log(Eone); //output: NoteClass { name: 'E', octave: 0 }

//This is functional syntax
const Etwo = { note: 'E', octave: 2 };

const higher = (props) => {
  props.octave = props.octave + 1;
};

const lower = (props) => {
  props.octave = props.octave - 1;
};

lower(Etwo);
lower(Etwo);
higher(Etwo);
console.log(Etwo); //output: { name: 'E', octave: 1 }

//This is composite functional syntax. I have no idea how to make it so that hajr changes the octave value
const NoteFunction = (props) => {
  return {
    hajr: () => console.log(props.octave + 1),
    ...props,
  };
};
const Ethree = NoteFunction({ note: 'E', octave: 3 });
Ethree.hajr();
console.log(Ethree); //output: { hajr: [Function: hajr], note: 'E', octave: 3 }
