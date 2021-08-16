function umenuToggles(num) {
	var menuOptions = [8,8,8,8,6,5,4,3,2,1]
	var picked = menuOptions[num]
    var patch = this.patcher
    var splitter = patch.getnamed("splitter")
    
    splitter.clear() 
    for (var i = 0; i < picked; i++) splitter.append(i)        

    outlet(0, "bang")
    
}


/*
4m:
append: 1 2 3 4 5

2m:
append: 1 2 3 4
1
1m
append: 1 2 3
2
1n
append: 1 2
3
2n
append: 1
4
4n
append: (splitting unavailable)
5
*/