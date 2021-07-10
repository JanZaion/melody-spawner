function diceMultiRollSortedASC(max, min, rolls) { //Multiple dice rolls, returns an array of ascending different numbers that is as long as the 'rolls' input. Max is excluded just like with diceRange.  
    var arr = []
    while (arr.length < rolls) {
        var r = Math.floor(Math.random() * (max - min) + min)
        if (arr.indexOf(r) === -1) arr.push(r)
    }
    return arr.sort(function (a, b) { return a - b })
}

function diceRange(max, min) { //Dice roll, returns any number in the min-max range. Careful: The max number is excluded, so a roll for 2-8 would look like this: diceRange(9, 2)
    return Math.floor(Math.random() * (max - min) + min)
}

/*
Generates a rhythm suitable for 4 chord pattern out of 4 "x" and 4 or 12 "_".
-wild accepts boolean. If true, x can be anywhere, if false, x is more evenly distributed
-hoLong accepts 1 or 2. If 1 then the rhythm pattern is 8 char long. If 2 then 16.
*/
function generateRhythm(wild, howLong) {
    switch (howLong) {
        case "short":
            numChar = 8
            break;

        case "long":
            numChar = 16
            break;
    }

    var rhythm = []
    for (var i = 0; i < numChar; i++) rhythm.push("_")

    switch (wild) {
        case "wild":
            var xArray = diceMultiRollSortedASC(numChar, 0, 4)

            break;

        case "mild":
            var x1 = diceRange(numChar / 4, 0)
            var x2 = diceRange((numChar / 4) + (numChar / 4), (numChar / 4))
            var x3 = diceRange((numChar / 4) + ((numChar / 4) * 2), (numChar / 4) + (numChar / 4))
            var x4 = diceRange((numChar / 4) + ((numChar / 4) * 3), (numChar / 4) + ((numChar / 4) * 2))
            var xArray = [x1, x2, x3, x4]

            break;
    }

    var j = 0
    for (var i = 0; i < numChar; i++) {

        if (i === xArray[j]) {
            rhythm[i] = "x"
            j++

        }
    }

    for (var i = 0; i < numChar; i) {

        if (rhythm[i] === "_") {
            rhythm.shift()
            rhythm.push("_")
        } else {
            break
        }

    }
    rhythm = rhythm.join("")
    outlet(0, rhythm)

}