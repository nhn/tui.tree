'use strict';

var util = require('../src/js/util.js');

describe('Util', function() {
    it('"removeItemFromArray" should remove element if in array', function() {
        var arr = [1, 3, 5];

        util.removeItemFromArray(3, arr);
        expect(arr).toEqual([1, 5]);

        arr = [1, 2, 5];
        util.removeItemFromArray(3, arr);
        expect(arr).toEqual([1, 2, 5]);
    });

    it('"template" should return the result string having replaced value', function() {
        var source = 'hello {{name}}!',
            prop = {
                name: 'NHN ENT',
                dummy: 'dummy'
            };

        expect(util.template(source, prop)).toEqual('hello NHN ENT!');
    });
});
