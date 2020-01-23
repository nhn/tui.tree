/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var inArray = require('tui-code-snippet/array/inArray');
var forEach = require('tui-code-snippet/collection/forEach');
var forEachArray = require('tui-code-snippet/collection/forEachArray');
var sendHostname = require('tui-code-snippet/request/sendHostname');

/**
 * @ignore
 */
var util = {
  /**
   * Remove first specified item from array, if it exists
   * @param {*} item Item to look for
   * @param {Array} arr Array to query
   */
  removeItemFromArray: function(item, arr) {
    var index = inArray(item, arr);

    if (index > -1) {
      arr.splice(index, 1);
    }
  },

  /**
   * Get key code from event object
   * @param {Event} e Event object
   * @returns {Number} KeyCode
   */
  getKeyCode: function(e) {
    e = e || window.event;

    return e.which || e.keyCode;
  },

  /**
   * Get first text node in target element
   * @param {HTMLElement} element - Target element to find
   * @returns {HTMLElement} Text node
   */
  getFirstTextNode: function(element) {
    var firstTextNode = '';

    forEachArray(element.childNodes, function(childElement) {
      if (childElement.nodeName === '#text') {
        firstTextNode = childElement;

        return false;
      }

      return true;
    });

    return firstTextNode;
  },

  /**
   * Create a new function that, when called, has its this keyword set to the provided value.
   * @param {function} fn A original function before binding
   * @param {Object} obj context of function in arguments[0]
   * @returns {function} A new bound function with context that is in arguments[1]
   */
  bind: function(fn, context) {
    var slice = Array.prototype.slice;
    var args;

    if (fn.bind) {
      return fn.bind.apply(fn, slice.call(arguments, 1));
    }

    args = slice.call(arguments, 2);

    return function() {
      return fn.apply(context, args.length ? args.concat(slice.call(arguments)) : arguments);
    };
  },

  /**
   * Construct a new array with elements that pass the test by the provided callback function.
   * @param {Array|NodeList|Arguments} arr - array to be traversed
   * @param {function} iteratee - callback function
   * @param {Object} context - context of callback function
   * @returns {Array}
   */
  filter: function(arr, iteratee, context) {
    var result = [];

    forEachArray(arr, function(elem) {
      if (iteratee.apply(context || null, arguments)) {
        result.push(elem);
      }
    });

    return result;
  },

  /**
   * Constructs a new array by executing the provided callback function.
   * @param {Object|Array} obj - object or array to be traversed
   * @param {function} iteratee - callback function
   * @param {Object} context - context of callback function
   * @returns {Array}
   */
  map: function(obj, iteratee, context) {
    var result = [];

    forEach(obj, function() {
      result.push(iteratee.apply(context || null, arguments));
    });

    return result;
  },

  /**
   * send host name
   * @ignore
   */
  sendHostName: function() {
    sendHostname('tree', 'UA-129987462-1');
  }
};

module.exports = util;
