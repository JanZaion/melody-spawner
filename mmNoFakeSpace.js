/*
‎‎Yeah, this is a lame script. Since M4L live.menu sends out symbols with spaces (ie "1 4 5 7") as a series of lists, I needed to use fake space symbol: " ". This script then replaces the fake symbol with a real symbol
*/
function replace(str, char, replaceChar) {
    var replacedStr = '';
    for (var i = 0; i < str.length; i++) {
      if (str[i].match(char)) {
        replacedStr += replaceChar;
      } else {
        replacedStr += str[i];
      }
    }
    return replacedStr;
  };

function noFake(arg) {
    outlet(0, replace(arg, " ", " "))
}