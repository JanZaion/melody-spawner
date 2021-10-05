function setTextedit(textEditName, str) {
  var patch = this.patcher;
  var textEdit = patch.getnamed(textEditName);
  var splitStr = str.split('|');
  textEdit.set(splitStr);
}
