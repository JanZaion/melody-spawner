/*
Terrible, but working solution to the problem of loading stuff to umenus that are changed by other umenus. It works roughly like this:
1. When the main dict is loaded, copy is created in the Max patch (loader dict)
2. List of args is passed to this fn. Item 1 is the main dict, Item 2 is the loader dict, other items are the umenu names
3. Umenu values are changed
4. Entries in the main dict are changed to some loader dict entries.
*/
function loadSpecificUmenus(args) {
  var argsArr = arrayfromargs(arguments);
  var patch = this.patcher;
  var loaderDict = new Dict(argsArr[0]);
  var mainDict = new Dict(argsArr[1]);

  for (var i = 2; i < argsArr.length; i++) {
    var menuName = argsArr[i];
    var value = loaderDict.get(menuName);
    var umenu = patch.getnamed(menuName);
    umenu.setsymbol(value.toString());
    mainDict.set(menuName, value);
  }
}
