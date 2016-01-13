
'use strict';

var util = require('../src/js/util.js');

describe('Util', function() {
    it('"pushAll" should push all elements of second array to first array', function() {
        var first = [1, 2, 3],
            second = [4, 5, 6];

        util.pushAll(first, second);
        expect(first).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('"removeItemFromArray" should remove element if in array', function() {
        var arr = [1, 3, 5];

        util.removeItemFromArray(3, arr);
        expect(arr).toEqual([1, 5]);

        arr = [1, 2, 5];
        util.removeItemFromArray(3, arr);
        expect(arr).toEqual([1, 2, 5]);
    });
});
