const notesToArray = (notes) => {
  const notesArray = Array.isArray(notes) ? notes : [notes];
  return notesArray;
};

module.exports = { notesToArray };
