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

  it('"template" should return the result string having replaced value', function() {
    var source = 'hello {{name}}!',
      prop = {
        name: 'NHN ENT',
        dummy: 'dummy'
      };

    expect(util.renderTemplate(source, prop)).toEqual('hello NHN ENT!');
  });

  it('"template" supports dot notation and array value', function() {
    var source = '{{..INVALID dot notation}}{{dummy}} {{obj.foo.a}}, {{obj.bar}}!',
      prop = {
        obj: {
          foo: {
            a: 'foo-a'
          },
          bar: ['bar-1', 'bar-2'] // it will be converted to 'bar-1 bar-2'
        },
        dummy: 'dummy'
      };

    expect(util.renderTemplate(source, prop)).toEqual('dummy foo-a, bar-1 bar-2!');
  });

  it('"getClass" should return classname of element', function() {
    var element = document.createElement('div'),
      className = 'asdfasdf';
    util.addClass(element, className);

    expect(util.getClass(element)).toEqual(className);
  });

  it('"getFirstText" should return first text of element.', function() {
    var element = document.createElement('div');
    var firstTextNode;

    element.innerHTML = '<span></span>firstText';

    firstTextNode = util.getFirstTextNode(element);

    expect(firstTextNode.nodeValue).toBe('firstText');
  });

  it('"removeElement" should remove target element.', function() {
    var element = document.createElement('div');

    element.id = 'test';
    document.body.appendChild(element);

    util.removeElement(element);

    expect(document.getElementById('test')).toBe(null);
  });

  describe('.prototype.getChildElementByClassName()', function() {
    var element;
    beforeEach(function() {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    afterEach(function() {
      util.removeElement(element);
    });

    it('should find first element by classname', function() {
      var child;
      element.innerHTML = '<div id="1" class="a b c"></div>' + '<div id="2" class="a b c"></div>';
      child = util.getChildElementByClassName(element, 'b');

      expect(child.id).toBe('1');
    });

    it("should return null when child elements don't contain same class", function() {
      var child;
      element.innerHTML = '<div id="1" class="a c">' + '<div id="2" class="ac"></div>' + '</div>';
      child = util.getChildElementByClassName(element, 'b');

      expect(child).toBeNull();
    });
  });
});
