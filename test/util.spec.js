/* eslint-disable no-useless-concat */
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

  it('"getFirstText" should return first text of element.', function() {
    var element = document.createElement('div');
    var firstTextNode;

    element.innerHTML = '<span></span>firstText';

    firstTextNode = util.getFirstTextNode(element);

    expect(firstTextNode.nodeValue).toBe('firstText');
  });
});
