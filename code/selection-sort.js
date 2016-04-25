var a = [34, 203, 3, 746, 200, 984, 198, 764, 9];

function selectionSort(array) {
    var minIndex;
    for (var i = 0; i < array.length - 1; i++) {
        minIndex = i;
        for (var j = i + 1; j < array.length; j++) {
            if (array[j] < array[minIndex]) {
                minIndex = j;
            }    
        }
        if (minIndex != i) {
            var temp = array[i];
            array[i] = array[minIndex];
            array[minIndex] = temp;
        }
    }
}

selectionSort(a);
console.log(a);