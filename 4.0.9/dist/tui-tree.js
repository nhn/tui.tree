/*!
 * TOAST UI Tree
 * @version 4.0.9
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 * @license MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("tui-context-menu"));
	else if(typeof define === 'function' && define.amd)
		define(["tui-context-menu"], factory);
	else if(typeof exports === 'object')
		exports["Tree"] = factory(require("tui-context-menu"));
	else
		root["tui"] = root["tui"] || {}, root["tui"]["Tree"] = factory(root["tui"]["ContextMenu"]);
})(window, function(__WEBPACK_EXTERNAL_MODULE__60__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 33);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Execute the provided callback once for each element present in the array(or Array-like object) in ascending order.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Execute the provided callback once for each element present
 * in the array(or Array-like object) in ascending order.
 * If the callback function returns false, the loop will be stopped.
 * Callback function(iteratee) is invoked with three arguments:
 *  1) The value of the element
 *  2) The index of the element
 *  3) The array(or Array-like object) being traversed
 * @param {Array|Arguments|NodeList} arr The array(or Array-like object) that will be traversed
 * @param {function} iteratee Callback function
 * @param {Object} [context] Context(this) of callback function
 * @memberof module:collection
 * @example
 * var forEachArray = require('tui-code-snippet/collection/forEachArray'); // node, commonjs
 *
 * var sum = 0;
 *
 * forEachArray([1,2,3], function(value){
 *     sum += value;
 * });
 * alert(sum); // 6
 */
function forEachArray(arr, iteratee, context) {
  var index = 0;
  var len = arr.length;

  context = context || null;

  for (; index < len; index += 1) {
    if (iteratee.call(context, arr[index], index, arr) === false) {
      break;
    }
  }
}

module.exports = forEachArray;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Extend the target object from other objects.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * @module object
 */

/**
 * Extend the target object from other objects.
 * @param {object} target - Object that will be extended
 * @param {...object} objects - Objects as sources
 * @returns {object} Extended object
 * @memberof module:object
 */
function extend(target, objects) { // eslint-disable-line no-unused-vars
  var hasOwnProp = Object.prototype.hasOwnProperty;
  var source, prop, i, len;

  for (i = 1, len = arguments.length; i < len; i += 1) {
    source = arguments[i];
    for (prop in source) {
      if (hasOwnProp.call(source, prop)) {
        target[prop] = source[prop];
      }
    }
  }

  return target;
}

module.exports = extend;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is an instance of Array or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Check whether the given variable is an instance of Array or not.
 * If the given variable is an instance of Array, return true.
 * @param {*} obj - Target for checking
 * @returns {boolean} Is array instance?
 * @memberof module:type
 */
function isArray(obj) {
  return obj instanceof Array;
}

module.exports = isArray;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview
 * This module provides a function to make a constructor
 * that can inherit from the other constructors like the CLASS easily.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var inherit = __webpack_require__(36);
var extend = __webpack_require__(1);

/**
 * @module defineClass
 */

/**
 * Help a constructor to be defined and to inherit from the other constructors
 * @param {*} [parent] Parent constructor
 * @param {Object} props Members of constructor
 *  @param {Function} props.init Initialization method
 *  @param {Object} [props.static] Static members of constructor
 * @returns {*} Constructor
 * @memberof module:defineClass
 * @example
 * var defineClass = require('tui-code-snippet/defineClass/defineClass'); // node, commonjs
 *
 * //-- #2. Use property --//
 * var Parent = defineClass({
 *     init: function() { // constuructor
 *         this.name = 'made by def';
 *     },
 *     method: function() {
 *         // ...
 *     },
 *     static: {
 *         staticMethod: function() {
 *              // ...
 *         }
 *     }
 * });
 *
 * var Child = defineClass(Parent, {
 *     childMethod: function() {}
 * });
 *
 * Parent.staticMethod();
 *
 * var parentInstance = new Parent();
 * console.log(parentInstance.name); //made by def
 * parentInstance.staticMethod(); // Error
 *
 * var childInstance = new Child();
 * childInstance.method();
 * childInstance.childMethod();
 */
function defineClass(parent, props) {
  var obj;

  if (!props) {
    props = parent;
    parent = null;
  }

  obj = props.init || function() {};

  if (parent) {
    inherit(obj, parent);
  }

  if (props.hasOwnProperty('static')) {
    extend(obj, props['static']);
    delete props['static'];
  }

  extend(obj.prototype, props);

  return obj;
}

module.exports = defineClass;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* eslint-disable complexity */
/**
 * @fileoverview Returns the first index at which a given element can be found in the array.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isArray = __webpack_require__(2);

/**
 * @module array
 */

/**
 * Returns the first index at which a given element can be found in the array
 * from start index(default 0), or -1 if it is not present.
 * It compares searchElement to elements of the Array using strict equality
 * (the same method used by the ===, or triple-equals, operator).
 * @param {*} searchElement Element to locate in the array
 * @param {Array} array Array that will be traversed.
 * @param {number} startIndex Start index in array for searching (default 0)
 * @returns {number} the First index at which a given element, or -1 if it is not present
 * @memberof module:array
 * @example
 * var inArray = require('tui-code-snippet/array/inArray'); // node, commonjs
 *
 * var arr = ['one', 'two', 'three', 'four'];
 * var idx1 = inArray('one', arr, 3); // -1
 * var idx2 = inArray('one', arr); // 0
 */
function inArray(searchElement, array, startIndex) {
  var i;
  var length;
  startIndex = startIndex || 0;

  if (!isArray(array)) {
    return -1;
  }

  if (Array.prototype.indexOf) {
    return Array.prototype.indexOf.call(array, searchElement, startIndex);
  }

  length = array.length;
  for (i = startIndex; startIndex >= 0 && i < length; i += 1) {
    if (array[i] === searchElement) {
      return i;
    }
  }

  return -1;
}

module.exports = inArray;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var inArray = __webpack_require__(4);
var forEach = __webpack_require__(9);
var forEachArray = __webpack_require__(0);
var sendHostname = __webpack_require__(41);

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


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Execute the provided callback once for each property of object which actually exist.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Execute the provided callback once for each property of object which actually exist.
 * If the callback function returns false, the loop will be stopped.
 * Callback function(iteratee) is invoked with three arguments:
 *  1) The value of the property
 *  2) The name of the property
 *  3) The object being traversed
 * @param {Object} obj The object that will be traversed
 * @param {function} iteratee  Callback function
 * @param {Object} [context] Context(this) of callback function
 * @memberof module:collection
 * @example
 * var forEachOwnProperties = require('tui-code-snippet/collection/forEachOwnProperties'); // node, commonjs
 *
 * var sum = 0;
 *
 * forEachOwnProperties({a:1,b:2,c:3}, function(value){
 *     sum += value;
 * });
 * alert(sum); // 6
 */
function forEachOwnProperties(obj, iteratee, context) {
  var key;

  context = context || null;

  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (iteratee.call(context, obj[key], key, obj) === false) {
        break;
      }
    }
  }
}

module.exports = forEachOwnProperties;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is undefined or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Check whether the given variable is undefined or not.
 * If the given variable is undefined, returns true.
 * @param {*} obj - Target for checking
 * @returns {boolean} Is undefined?
 * @memberof module:type
 */
function isUndefined(obj) {
  return obj === undefined; // eslint-disable-line no-undefined
}

module.exports = isUndefined;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is a string or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Check whether the given variable is a string or not.
 * If the given variable is a string, return true.
 * @param {*} obj - Target for checking
 * @returns {boolean} Is string?
 * @memberof module:type
 */
function isString(obj) {
  return typeof obj === 'string' || obj instanceof String;
}

module.exports = isString;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Execute the provided callback once for each property of object(or element of array) which actually exist.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isArray = __webpack_require__(2);
var forEachArray = __webpack_require__(0);
var forEachOwnProperties = __webpack_require__(6);

/**
 * @module collection
 */

/**
 * Execute the provided callback once for each property of object(or element of array) which actually exist.
 * If the object is Array-like object(ex-arguments object), It needs to transform to Array.(see 'ex2' of example).
 * If the callback function returns false, the loop will be stopped.
 * Callback function(iteratee) is invoked with three arguments:
 *  1) The value of the property(or The value of the element)
 *  2) The name of the property(or The index of the element)
 *  3) The object being traversed
 * @param {Object} obj The object that will be traversed
 * @param {function} iteratee Callback function
 * @param {Object} [context] Context(this) of callback function
 * @memberof module:collection
 * @example
 * var forEach = require('tui-code-snippet/collection/forEach'); // node, commonjs
 *
 * var sum = 0;
 *
 * forEach([1,2,3], function(value){
 *     sum += value;
 * });
 * alert(sum); // 6
 *
 * // In case of Array-like object
 * var array = Array.prototype.slice.call(arrayLike); // change to array
 * forEach(array, function(value){
 *     sum += value;
 * });
 */
function forEach(obj, iteratee, context) {
  if (isArray(obj)) {
    forEachArray(obj, iteratee, context);
  } else {
    forEachOwnProperties(obj, iteratee, context);
  }
}

module.exports = forEach;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Get a target element from an event object.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Get a target element from an event object.
 * @param {Event} e - event object
 * @returns {HTMLElement} - target element
 * @memberof module:domEvent
 */
function getTarget(e) {
  return e.target || e.srcElement;
}

module.exports = getTarget;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is an object or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Check whether the given variable is an object or not.
 * If the given variable is an object, return true.
 * @param {*} obj - Target for checking
 * @returns {boolean} Is object?
 * @memberof module:type
 */
function isObject(obj) {
  return obj === Object(obj);
}

module.exports = isObject;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is a function or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Check whether the given variable is a function or not.
 * If the given variable is a function, return true.
 * @param {*} obj - Target for checking
 * @returns {boolean} Is function?
 * @memberof module:type
 */
function isFunction(obj) {
  return obj instanceof Function;
}

module.exports = isFunction;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Unbind DOM events
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isString = __webpack_require__(8);
var forEach = __webpack_require__(9);

var safeEvent = __webpack_require__(25);

/**
 * Unbind DOM events
 * If a handler function is not passed, remove all events of that type.
 * @param {HTMLElement} element - element to unbind events
 * @param {(string|object)} types - Space splitted events names or eventName:handler object
 * @param {function} [handler] - handler function
 * @memberof module:domEvent
 * @example
 * // Following the example of domEvent#on
 * 
 * // Unbind one event from an element.
 * off(div, 'click', toggle);
 * 
 * // Unbind multiple events with a same handler from multiple elements at once.
 * // Use event names splitted by a space.
 * off(element, 'mouseenter mouseleave', changeColor);
 * 
 * // Unbind multiple events with different handlers from an element at once.
 * // Use an object which of key is an event name and value is a handler function.
 * off(div, {
 *   keydown: highlight,
 *   keyup: dehighlight
 * });
 * 
 * // Unbind events without handlers.
 * off(div, 'drag');
 */
function off(element, types, handler) {
  if (isString(types)) {
    forEach(types.split(/\s+/g), function(type) {
      unbindEvent(element, type, handler);
    });

    return;
  }

  forEach(types, function(func, type) {
    unbindEvent(element, type, func);
  });
}

/**
 * Unbind DOM events
 * If a handler function is not passed, remove all events of that type.
 * @param {HTMLElement} element - element to unbind events
 * @param {string} type - events name
 * @param {function} [handler] - handler function
 * @private
 */
function unbindEvent(element, type, handler) {
  var events = safeEvent(element, type);
  var index;

  if (!handler) {
    forEach(events, function(item) {
      removeHandler(element, type, item.wrappedHandler);
    });
    events.splice(0, events.length);
  } else {
    forEach(events, function(item, idx) {
      if (handler === item.handler) {
        removeHandler(element, type, item.wrappedHandler);
        index = idx;

        return false;
      }

      return true;
    });
    events.splice(index, 1);
  }
}

/**
 * Remove an event handler
 * @param {HTMLElement} element - An element to remove an event
 * @param {string} type - event type
 * @param {function} handler - event handler
 * @private
 */
function removeHandler(element, type, handler) {
  if ('removeEventListener' in element) {
    element.removeEventListener(type, handler);
  } else if ('detachEvent' in element) {
    element.detachEvent('on' + type, handler);
  }
}

module.exports = off;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Bind DOM events
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isString = __webpack_require__(8);
var forEach = __webpack_require__(9);

var safeEvent = __webpack_require__(25);

/**
 * Bind DOM events.
 * @param {HTMLElement} element - element to bind events
 * @param {(string|object)} types - Space splitted events names or eventName:handler object
 * @param {(function|object)} handler - handler function or context for handler method
 * @param {object} [context] context - context for handler method.
 * @memberof module:domEvent
 * @example
 * var div = document.querySelector('div');
 * 
 * // Bind one event to an element.
 * on(div, 'click', toggle);
 * 
 * // Bind multiple events with a same handler to multiple elements at once.
 * // Use event names splitted by a space.
 * on(div, 'mouseenter mouseleave', changeColor);
 * 
 * // Bind multiple events with different handlers to an element at once.
 * // Use an object which of key is an event name and value is a handler function.
 * on(div, {
 *   keydown: highlight,
 *   keyup: dehighlight
 * });
 * 
 * // Set a context for handler method.
 * var name = 'global';
 * var repository = {name: 'CodeSnippet'};
 * on(div, 'drag', function() {
 *  console.log(this.name);
 * }, repository);
 * // Result when you drag a div: "CodeSnippet"
 */
function on(element, types, handler, context) {
  if (isString(types)) {
    forEach(types.split(/\s+/g), function(type) {
      bindEvent(element, type, handler, context);
    });

    return;
  }

  forEach(types, function(func, type) {
    bindEvent(element, type, func, handler);
  });
}

/**
 * Bind DOM events
 * @param {HTMLElement} element - element to bind events
 * @param {string} type - events name
 * @param {function} handler - handler function or context for handler method
 * @param {object} [context] context - context for handler method.
 * @private
 */
function bindEvent(element, type, handler, context) {
  /**
     * Event handler
     * @param {Event} e - event object
     */
  function eventHandler(e) {
    handler.call(context || element, e || window.event);
  }

  if ('addEventListener' in element) {
    element.addEventListener(type, eventHandler);
  } else if ('attachEvent' in element) {
    element.attachEvent('on' + type, eventHandler);
  }
  memorizeHandler(element, type, handler, eventHandler);
}

/**
 * Memorize DOM event handler for unbinding.
 * @param {HTMLElement} element - element to bind events
 * @param {string} type - events name
 * @param {function} handler - handler function that user passed at on() use
 * @param {function} wrappedHandler - handler function that wrapped by domevent for implementing some features
 * @private
 */
function memorizeHandler(element, type, handler, wrappedHandler) {
  var events = safeEvent(element, type);
  var existInEvents = false;

  forEach(events, function(obj) {
    if (obj.handler === handler) {
      existInEvents = true;

      return false;
    }

    return true;
  });

  if (!existInEvents) {
    events.push({
      handler: handler,
      wrappedHandler: wrappedHandler
    });
  }
}

module.exports = on;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Add css class to element
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var forEach = __webpack_require__(9);
var inArray = __webpack_require__(4);
var getClass = __webpack_require__(19);
var setClassName = __webpack_require__(26);

/**
 * domUtil module
 * @module domUtil
 */

/**
 * Add css class to element
 * @param {(HTMLElement|SVGElement)} element - target element
 * @param {...string} cssClass - css classes to add
 * @memberof module:domUtil
 */
function addClass(element) {
  var cssClass = Array.prototype.slice.call(arguments, 1);
  var classList = element.classList;
  var newClass = [];
  var origin;

  if (classList) {
    forEach(cssClass, function(name) {
      element.classList.add(name);
    });

    return;
  }

  origin = getClass(element);

  if (origin) {
    cssClass = [].concat(origin.split(/\s+/), cssClass);
  }

  forEach(cssClass, function(cls) {
    if (inArray(cls, newClass) < 0) {
      newClass.push(cls);
    }
  });

  setClassName(element, newClass);
}

module.exports = addClass;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is existing or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isUndefined = __webpack_require__(7);
var isNull = __webpack_require__(23);

/**
 * Check whether the given variable is existing or not.
 * If the given variable is not null and not undefined, returns true.
 * @param {*} param - Target for checking
 * @returns {boolean} Is existy?
 * @memberof module:type
 * @example
 * var isExisty = require('tui-code-snippet/type/isExisty'); // node, commonjs
 *
 * isExisty(''); //true
 * isExisty(0); //true
 * isExisty([]); //true
 * isExisty({}); //true
 * isExisty(null); //false
 * isExisty(undefined); //false
*/
function isExisty(param) {
  return !isUndefined(param) && !isNull(param);
}

module.exports = isExisty;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Remove css class from element
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var forEachArray = __webpack_require__(0);
var inArray = __webpack_require__(4);
var getClass = __webpack_require__(19);
var setClassName = __webpack_require__(26);

/**
 * Remove css class from element
 * @param {(HTMLElement|SVGElement)} element - target element
 * @param {...string} cssClass - css classes to remove
 * @memberof module:domUtil
 */
function removeClass(element) {
  var cssClass = Array.prototype.slice.call(arguments, 1);
  var classList = element.classList;
  var origin, newClass;

  if (classList) {
    forEachArray(cssClass, function(name) {
      classList.remove(name);
    });

    return;
  }

  origin = getClass(element).split(/\s+/);
  newClass = [];
  forEachArray(origin, function(name) {
    if (inArray(name, cssClass) < 0) {
      newClass.push(name);
    }
  });

  setClassName(element, newClass);
}

module.exports = removeClass;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview This module provides some functions for custom events. And it is implemented in the observer design pattern.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var extend = __webpack_require__(1);
var isExisty = __webpack_require__(16);
var isString = __webpack_require__(8);
var isObject = __webpack_require__(11);
var isArray = __webpack_require__(2);
var isFunction = __webpack_require__(12);
var forEach = __webpack_require__(9);

var R_EVENTNAME_SPLIT = /\s+/g;

/**
 * @class
 * @example
 * // node, commonjs
 * var CustomEvents = require('tui-code-snippet/customEvents/customEvents');
 */
function CustomEvents() {
  /**
     * @type {HandlerItem[]}
     */
  this.events = null;

  /**
     * only for checking specific context event was binded
     * @type {object[]}
     */
  this.contexts = null;
}

/**
 * Mixin custom events feature to specific constructor
 * @param {function} func - constructor
 * @example
 * var CustomEvents = require('tui-code-snippet/customEvents/customEvents'); // node, commonjs
 *
 * var model;
 * function Model() {
 *     this.name = '';
 * }
 * CustomEvents.mixin(Model);
 *
 * model = new Model();
 * model.on('change', function() { this.name = 'model'; }, this);
 * model.fire('change');
 * alert(model.name); // 'model';
 */
CustomEvents.mixin = function(func) {
  extend(func.prototype, CustomEvents.prototype);
};

/**
 * Get HandlerItem object
 * @param {function} handler - handler function
 * @param {object} [context] - context for handler
 * @returns {HandlerItem} HandlerItem object
 * @private
 */
CustomEvents.prototype._getHandlerItem = function(handler, context) {
  var item = {handler: handler};

  if (context) {
    item.context = context;
  }

  return item;
};

/**
 * Get event object safely
 * @param {string} [eventName] - create sub event map if not exist.
 * @returns {(object|array)} event object. if you supplied `eventName`
 *  parameter then make new array and return it
 * @private
 */
CustomEvents.prototype._safeEvent = function(eventName) {
  var events = this.events;
  var byName;

  if (!events) {
    events = this.events = {};
  }

  if (eventName) {
    byName = events[eventName];

    if (!byName) {
      byName = [];
      events[eventName] = byName;
    }

    events = byName;
  }

  return events;
};

/**
 * Get context array safely
 * @returns {array} context array
 * @private
 */
CustomEvents.prototype._safeContext = function() {
  var context = this.contexts;

  if (!context) {
    context = this.contexts = [];
  }

  return context;
};

/**
 * Get index of context
 * @param {object} ctx - context that used for bind custom event
 * @returns {number} index of context
 * @private
 */
CustomEvents.prototype._indexOfContext = function(ctx) {
  var context = this._safeContext();
  var index = 0;

  while (context[index]) {
    if (ctx === context[index][0]) {
      return index;
    }

    index += 1;
  }

  return -1;
};

/**
 * Memorize supplied context for recognize supplied object is context or
 *  name: handler pair object when off()
 * @param {object} ctx - context object to memorize
 * @private
 */
CustomEvents.prototype._memorizeContext = function(ctx) {
  var context, index;

  if (!isExisty(ctx)) {
    return;
  }

  context = this._safeContext();
  index = this._indexOfContext(ctx);

  if (index > -1) {
    context[index][1] += 1;
  } else {
    context.push([ctx, 1]);
  }
};

/**
 * Forget supplied context object
 * @param {object} ctx - context object to forget
 * @private
 */
CustomEvents.prototype._forgetContext = function(ctx) {
  var context, contextIndex;

  if (!isExisty(ctx)) {
    return;
  }

  context = this._safeContext();
  contextIndex = this._indexOfContext(ctx);

  if (contextIndex > -1) {
    context[contextIndex][1] -= 1;

    if (context[contextIndex][1] <= 0) {
      context.splice(contextIndex, 1);
    }
  }
};

/**
 * Bind event handler
 * @param {(string|{name:string, handler:function})} eventName - custom
 *  event name or an object {eventName: handler}
 * @param {(function|object)} [handler] - handler function or context
 * @param {object} [context] - context for binding
 * @private
 */
CustomEvents.prototype._bindEvent = function(eventName, handler, context) {
  var events = this._safeEvent(eventName);
  this._memorizeContext(context);
  events.push(this._getHandlerItem(handler, context));
};

/**
 * Bind event handlers
 * @param {(string|{name:string, handler:function})} eventName - custom
 *  event name or an object {eventName: handler}
 * @param {(function|object)} [handler] - handler function or context
 * @param {object} [context] - context for binding
 * //-- #1. Get Module --//
 * var CustomEvents = require('tui-code-snippet/customEvents/customEvents'); // node, commonjs
 *
 * //-- #2. Use method --//
 * // # 2.1 Basic Usage
 * CustomEvents.on('onload', handler);
 *
 * // # 2.2 With context
 * CustomEvents.on('onload', handler, myObj);
 *
 * // # 2.3 Bind by object that name, handler pairs
 * CustomEvents.on({
 *     'play': handler,
 *     'pause': handler2
 * });
 *
 * // # 2.4 Bind by object that name, handler pairs with context object
 * CustomEvents.on({
 *     'play': handler
 * }, myObj);
 */
CustomEvents.prototype.on = function(eventName, handler, context) {
  var self = this;

  if (isString(eventName)) {
    // [syntax 1, 2]
    eventName = eventName.split(R_EVENTNAME_SPLIT);
    forEach(eventName, function(name) {
      self._bindEvent(name, handler, context);
    });
  } else if (isObject(eventName)) {
    // [syntax 3, 4]
    context = handler;
    forEach(eventName, function(func, name) {
      self.on(name, func, context);
    });
  }
};

/**
 * Bind one-shot event handlers
 * @param {(string|{name:string,handler:function})} eventName - custom
 *  event name or an object {eventName: handler}
 * @param {function|object} [handler] - handler function or context
 * @param {object} [context] - context for binding
 */
CustomEvents.prototype.once = function(eventName, handler, context) {
  var self = this;

  if (isObject(eventName)) {
    context = handler;
    forEach(eventName, function(func, name) {
      self.once(name, func, context);
    });

    return;
  }

  function onceHandler() { // eslint-disable-line require-jsdoc
    handler.apply(context, arguments);
    self.off(eventName, onceHandler, context);
  }

  this.on(eventName, onceHandler, context);
};

/**
 * Splice supplied array by callback result
 * @param {array} arr - array to splice
 * @param {function} predicate - function return boolean
 * @private
 */
CustomEvents.prototype._spliceMatches = function(arr, predicate) {
  var i = 0;
  var len;

  if (!isArray(arr)) {
    return;
  }

  for (len = arr.length; i < len; i += 1) {
    if (predicate(arr[i]) === true) {
      arr.splice(i, 1);
      len -= 1;
      i -= 1;
    }
  }
};

/**
 * Get matcher for unbind specific handler events
 * @param {function} handler - handler function
 * @returns {function} handler matcher
 * @private
 */
CustomEvents.prototype._matchHandler = function(handler) {
  var self = this;

  return function(item) {
    var needRemove = handler === item.handler;

    if (needRemove) {
      self._forgetContext(item.context);
    }

    return needRemove;
  };
};

/**
 * Get matcher for unbind specific context events
 * @param {object} context - context
 * @returns {function} object matcher
 * @private
 */
CustomEvents.prototype._matchContext = function(context) {
  var self = this;

  return function(item) {
    var needRemove = context === item.context;

    if (needRemove) {
      self._forgetContext(item.context);
    }

    return needRemove;
  };
};

/**
 * Get matcher for unbind specific hander, context pair events
 * @param {function} handler - handler function
 * @param {object} context - context
 * @returns {function} handler, context matcher
 * @private
 */
CustomEvents.prototype._matchHandlerAndContext = function(handler, context) {
  var self = this;

  return function(item) {
    var matchHandler = (handler === item.handler);
    var matchContext = (context === item.context);
    var needRemove = (matchHandler && matchContext);

    if (needRemove) {
      self._forgetContext(item.context);
    }

    return needRemove;
  };
};

/**
 * Unbind event by event name
 * @param {string} eventName - custom event name to unbind
 * @param {function} [handler] - handler function
 * @private
 */
CustomEvents.prototype._offByEventName = function(eventName, handler) {
  var self = this;
  var andByHandler = isFunction(handler);
  var matchHandler = self._matchHandler(handler);

  eventName = eventName.split(R_EVENTNAME_SPLIT);

  forEach(eventName, function(name) {
    var handlerItems = self._safeEvent(name);

    if (andByHandler) {
      self._spliceMatches(handlerItems, matchHandler);
    } else {
      forEach(handlerItems, function(item) {
        self._forgetContext(item.context);
      });

      self.events[name] = [];
    }
  });
};

/**
 * Unbind event by handler function
 * @param {function} handler - handler function
 * @private
 */
CustomEvents.prototype._offByHandler = function(handler) {
  var self = this;
  var matchHandler = this._matchHandler(handler);

  forEach(this._safeEvent(), function(handlerItems) {
    self._spliceMatches(handlerItems, matchHandler);
  });
};

/**
 * Unbind event by object(name: handler pair object or context object)
 * @param {object} obj - context or {name: handler} pair object
 * @param {function} handler - handler function
 * @private
 */
CustomEvents.prototype._offByObject = function(obj, handler) {
  var self = this;
  var matchFunc;

  if (this._indexOfContext(obj) < 0) {
    forEach(obj, function(func, name) {
      self.off(name, func);
    });
  } else if (isString(handler)) {
    matchFunc = this._matchContext(obj);

    self._spliceMatches(this._safeEvent(handler), matchFunc);
  } else if (isFunction(handler)) {
    matchFunc = this._matchHandlerAndContext(handler, obj);

    forEach(this._safeEvent(), function(handlerItems) {
      self._spliceMatches(handlerItems, matchFunc);
    });
  } else {
    matchFunc = this._matchContext(obj);

    forEach(this._safeEvent(), function(handlerItems) {
      self._spliceMatches(handlerItems, matchFunc);
    });
  }
};

/**
 * Unbind custom events
 * @param {(string|object|function)} eventName - event name or context or
 *  {name: handler} pair object or handler function
 * @param {(function)} handler - handler function
 * @example
 * //-- #1. Get Module --//
 * var CustomEvents = require('tui-code-snippet/customEvents/customEvents'); // node, commonjs
 *
 * //-- #2. Use method --//
 * // # 2.1 off by event name
 * CustomEvents.off('onload');
 *
 * // # 2.2 off by event name and handler
 * CustomEvents.off('play', handler);
 *
 * // # 2.3 off by handler
 * CustomEvents.off(handler);
 *
 * // # 2.4 off by context
 * CustomEvents.off(myObj);
 *
 * // # 2.5 off by context and handler
 * CustomEvents.off(myObj, handler);
 *
 * // # 2.6 off by context and event name
 * CustomEvents.off(myObj, 'onload');
 *
 * // # 2.7 off by an Object.<string, function> that is {eventName: handler}
 * CustomEvents.off({
 *   'play': handler,
 *   'pause': handler2
 * });
 *
 * // # 2.8 off the all events
 * CustomEvents.off();
 */
CustomEvents.prototype.off = function(eventName, handler) {
  if (isString(eventName)) {
    // [syntax 1, 2]
    this._offByEventName(eventName, handler);
  } else if (!arguments.length) {
    // [syntax 8]
    this.events = {};
    this.contexts = [];
  } else if (isFunction(eventName)) {
    // [syntax 3]
    this._offByHandler(eventName);
  } else if (isObject(eventName)) {
    // [syntax 4, 5, 6]
    this._offByObject(eventName, handler);
  }
};

/**
 * Fire custom event
 * @param {string} eventName - name of custom event
 */
CustomEvents.prototype.fire = function(eventName) {  // eslint-disable-line
  this.invoke.apply(this, arguments);
};

/**
 * Fire a event and returns the result of operation 'boolean AND' with all
 *  listener's results.
 *
 * So, It is different from {@link CustomEvents#fire}.
 *
 * In service code, use this as a before event in component level usually
 *  for notifying that the event is cancelable.
 * @param {string} eventName - Custom event name
 * @param {...*} data - Data for event
 * @returns {boolean} The result of operation 'boolean AND'
 * @example
 * var map = new Map();
 * map.on({
 *     'beforeZoom': function() {
 *         // It should cancel the 'zoom' event by some conditions.
 *         if (that.disabled && this.getState()) {
 *             return false;
 *         }
 *         return true;
 *     }
 * });
 *
 * if (this.invoke('beforeZoom')) {    // check the result of 'beforeZoom'
 *     // if true,
 *     // doSomething
 * }
 */
CustomEvents.prototype.invoke = function(eventName) {
  var events, args, index, item;

  if (!this.hasListener(eventName)) {
    return true;
  }

  events = this._safeEvent(eventName);
  args = Array.prototype.slice.call(arguments, 1);
  index = 0;

  while (events[index]) {
    item = events[index];

    if (item.handler.apply(item.context, args) === false) {
      return false;
    }

    index += 1;
  }

  return true;
};

/**
 * Return whether at least one of the handlers is registered in the given
 *  event name.
 * @param {string} eventName - Custom event name
 * @returns {boolean} Is there at least one handler in event name?
 */
CustomEvents.prototype.hasListener = function(eventName) {
  return this.getListenerLength(eventName) > 0;
};

/**
 * Return a count of events registered.
 * @param {string} eventName - Custom event name
 * @returns {number} number of event
 */
CustomEvents.prototype.getListenerLength = function(eventName) {
  var events = this._safeEvent(eventName);

  return events.length;
};

module.exports = CustomEvents;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Get HTML element's design classes.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isUndefined = __webpack_require__(7);

/**
 * Get HTML element's design classes.
 * @param {(HTMLElement|SVGElement)} element target element
 * @returns {string} element css class name
 * @memberof module:domUtil
 */
function getClass(element) {
  if (!element || !element.className) {
    return '';
  }

  if (isUndefined(element.className.baseVal)) {
    return element.className;
  }

  return element.className.baseVal;
}

module.exports = getClass;


/***/ }),
/* 20 */
/***/ (function(module, exports) {

/**
 * @fileoverview Set default value of toggle button
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

/**
 * States in tree
 * @type {Object.<string, string>}
 */
module.exports = {
  /**
   * States of node
   * @type {{OPENED: string, CLOSED: string}}
   */
  node: {
    OPENED: 'opened',
    CLOSED: 'closed'
  }
};


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Prevent default action
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Prevent default action
 * @param {Event} e - event object
 * @memberof module:domEvent
 */
function preventDefault(e) {
  if (e.preventDefault) {
    e.preventDefault();

    return;
  }

  e.returnValue = false;
}

module.exports = preventDefault;


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Convert kebab-case
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Convert kebab-case
 * @param {string} key - string to be converted to Kebab-case
 * @private
 */
function convertToKebabCase(key) {
  return key.replace(/([A-Z])/g, function(match) {
    return '-' + match.toLowerCase();
  });
}

module.exports = convertToKebabCase;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is null or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Check whether the given variable is null or not.
 * If the given variable(arguments[0]) is null, returns true.
 * @param {*} obj - Target for checking
 * @returns {boolean} Is null?
 * @memberof module:type
 */
function isNull(obj) {
  return obj === null;
}

module.exports = isNull;


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Normalize mouse event's button attributes.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var browser = __webpack_require__(38);
var inArray = __webpack_require__(4);

var primaryButton = ['0', '1', '3', '5', '7'];
var secondaryButton = ['2', '6'];
var wheelButton = ['4'];

/**
 * @module domEvent
 */

/**
 * Normalize mouse event's button attributes.
 *
 * Can detect which button is clicked by this method.
 *
 * Meaning of return numbers
 *
 * - 0: primary mouse button
 * - 1: wheel button or center button
 * - 2: secondary mouse button
 * @param {MouseEvent} mouseEvent - The mouse event object want to know.
 * @returns {number} - The value of meaning which button is clicked?
 * @memberof module:domEvent
 */
function getMouseButton(mouseEvent) {
  if (browser.msie && browser.version <= 8) {
    return getMouseButtonIE8AndEarlier(mouseEvent);
  }

  return mouseEvent.button;
}

/**
 * Normalize return value of mouseEvent.button
 * Make same to standard MouseEvent's button value
 * @param {DispCEventObj} mouseEvent - mouse event object
 * @returns {number|null} - id indicating which mouse button is clicked
 * @private
 */
function getMouseButtonIE8AndEarlier(mouseEvent) {
  var button = String(mouseEvent.button);

  if (inArray(button, primaryButton) > -1) {
    return 0;
  }

  if (inArray(button, secondaryButton) > -1) {
    return 2;
  }

  if (inArray(button, wheelButton) > -1) {
    return 1;
  }

  return null;
}

module.exports = getMouseButton;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Get event collection for specific HTML element
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var EVENT_KEY = '_feEventKey';

/**
 * Get event collection for specific HTML element
 * @param {HTMLElement} element - HTML element
 * @param {string} type - event type
 * @returns {array}
 * @private
 */
function safeEvent(element, type) {
  var events = element[EVENT_KEY];
  var handlers;

  if (!events) {
    events = element[EVENT_KEY] = {};
  }

  handlers = events[type];
  if (!handlers) {
    handlers = events[type] = [];
  }

  return handlers;
}

module.exports = safeEvent;


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Set className value
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isArray = __webpack_require__(2);
var isUndefined = __webpack_require__(7);

/**
 * Set className value
 * @param {(HTMLElement|SVGElement)} element - target element
 * @param {(string|string[])} cssClass - class names
 * @private
 */
function setClassName(element, cssClass) {
  cssClass = isArray(cssClass) ? cssClass.join(' ') : cssClass;

  cssClass = cssClass.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

  if (isUndefined(element.className.baseVal)) {
    element.className = cssClass;

    return;
  }

  element.className.baseVal = cssClass;
}

module.exports = setClassName;


/***/ }),
/* 27 */
/***/ (function(module, exports) {

/**
 * @fileoverview Set each command name using in Ajax feature
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

/**
 * Ajax comman in tree
 * @type {Object.<string, string>}
 */
module.exports = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'remove',
  DELETE_ALL_CHILDREN: 'removeAllChildren',
  MOVE: 'move'
};


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Disable browser's text selection behaviors.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var on = __webpack_require__(14);
var preventDefault = __webpack_require__(21);
var setData = __webpack_require__(53);
var testCSSProp = __webpack_require__(29);

var SUPPORT_SELECTSTART = 'onselectstart' in document;
var KEY_PREVIOUS_USER_SELECT = 'prevUserSelect';
var userSelectProperty = testCSSProp([
  'userSelect',
  'WebkitUserSelect',
  'OUserSelect',
  'MozUserSelect',
  'msUserSelect'
]);

/**
 * Disable browser's text selection behaviors.
 * @param {HTMLElement} [el] - target element. if not supplied, use `document`
 * @memberof module:domUtil
 */
function disableTextSelection(el) {
  if (!el) {
    el = document;
  }

  if (SUPPORT_SELECTSTART) {
    on(el, 'selectstart', preventDefault);
  } else {
    el = (el === document) ? document.documentElement : el;
    setData(el, KEY_PREVIOUS_USER_SELECT, el.style[userSelectProperty]);
    el.style[userSelectProperty] = 'none';
  }
}

module.exports = disableTextSelection;


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check specific CSS style is available.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Check specific CSS style is available.
 * @param {array} props property name to testing
 * @returns {(string|boolean)} return true when property is available
 * @private
 */
function testCSSProp(props) {
  var style = document.documentElement.style;
  var i, len;

  for (i = 0, len = props.length; i < len; i += 1) {
    if (props[i] in style) {
      return props[i];
    }
  }

  return false;
}

module.exports = testCSSProp;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Transform the Array-like object to Array.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var off = __webpack_require__(13);
var preventDefault = __webpack_require__(21);
var getData = __webpack_require__(54);
var removeData = __webpack_require__(55);
var testCSSProp = __webpack_require__(29);

var SUPPORT_SELECTSTART = 'onselectstart' in document;
var KEY_PREVIOUS_USER_SELECT = 'prevUserSelect';
var userSelectProperty = testCSSProp([
  'userSelect',
  'WebkitUserSelect',
  'OUserSelect',
  'MozUserSelect',
  'msUserSelect'
]);

/**
 * Enable browser's text selection behaviors.
 * @param {HTMLElement} [el] - target element. if not supplied, use `document`
 * @memberof module:domUtil
 */
function enableTextSelection(el) {
  if (!el) {
    el = document;
  }

  if (SUPPORT_SELECTSTART) {
    off(el, 'selectstart', preventDefault);
  } else {
    el = (el === document) ? document.documentElement : el;
    el.style[userSelectProperty] = getData(el, KEY_PREVIOUS_USER_SELECT) || 'auto';
    removeData(el, KEY_PREVIOUS_USER_SELECT);
  }
}

module.exports = enableTextSelection;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check element has specific css class
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var inArray = __webpack_require__(4);
var getClass = __webpack_require__(19);

/**
 * Check element has specific css class
 * @param {(HTMLElement|SVGElement)} element - target element
 * @param {string} cssClass - css class
 * @returns {boolean}
 * @memberof module:domUtil
 */
function hasClass(element, cssClass) {
  var origin;

  if (element.classList) {
    return element.classList.contains(cssClass);
  }

  origin = getClass(element).split(/\s+/);

  return inArray(cssClass, origin) > -1;
}

module.exports = hasClass;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Remove element from parent node.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Remove element from parent node.
 * @param {HTMLElement} element - element to remove.
 * @memberof module:domUtil
 */
function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

module.exports = removeElement;


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(34);

module.exports = __webpack_require__(35);


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Render tree and update tree
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var forEachArray = __webpack_require__(0);
var forEachOwnProperties = __webpack_require__(6);
var CustomEvents = __webpack_require__(18);
var defineClass = __webpack_require__(3);
var getTarget = __webpack_require__(10);
var getMouseButton = __webpack_require__(24);
var off = __webpack_require__(13);
var on = __webpack_require__(14);
var addClass = __webpack_require__(15);
var removeClass = __webpack_require__(17);
var template = __webpack_require__(39);
var extend = __webpack_require__(1);
var isFunction = __webpack_require__(12);
var isHTMLNode = __webpack_require__(40);
var isObject = __webpack_require__(11);
var isString = __webpack_require__(8);
var isUndefined = __webpack_require__(7);
var util = __webpack_require__(5);

var defaultOption = __webpack_require__(43);
var states = __webpack_require__(20);
var messages = __webpack_require__(44);
var outerTemplate = __webpack_require__(45);
var ajaxCommand = __webpack_require__(27);
var TreeModel = __webpack_require__(46);
var Selectable = __webpack_require__(50);
var Draggable = __webpack_require__(51);
var Editable = __webpack_require__(56);
var Checkbox = __webpack_require__(57);
var ContextMenu = __webpack_require__(59);
var Ajax = __webpack_require__(61);

var nodeStates = states.node;
var features = {
  Selectable: Selectable,
  Draggable: Draggable,
  Editable: Editable,
  Checkbox: Checkbox,
  ContextMenu: ContextMenu,
  Ajax: Ajax
};

var TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK = 200;
var MOUSE_MOVING_THRESHOLD = 5;
var MOUSE_RIGHT_BUTTON = 2;

/**
 * Create tree model and inject data to model
 * @class Tree
 * @param {string|HTMLElement} container - Container element or selector
 * @param {Object} options The options
 *     @param {Object} [options.data] A data to be used on tree
 *     @param {string} [options.nodeIdPrefix] A default prefix of a node
 *     @param {Object} [options.nodeDefaultState] A default state of a node
 *     @param {Object} [options.stateLabels] Toggle button state label
 *         @param {string} [options.stateLabels.opened] State-OPENED label
 *         @param {string} [options.stateLabels.closed] State-CLOSED label
 *     @param {Object} [options.template] A markup set to make element
 *         @param {string} [options.template.internalNode] HTML template
 *         @param {string} [options.template.leafNode] HTML template
 *     @param {Function} [options.renderTemplate] Function for rendering template. Default is {@link https://nhn.github.io/tui.code-snippet/2.2.0/domUtil#template template in the tui-code-snippet}.
 *     @param {boolean} [options.usageStatistics=true] - Let us know the hostname. If you don't want to send the hostname, please set to false.
 * @example <caption>Get `Tree` module</caption>
 * // * node, commonjs
 * // * Get Tree module from `node_modules/tui-tree`
 * var Tree = require('tui-tree');
 * var instance = new Tree(...);
 * // * distribution file, script
 * // * there is `tui.Tree` as a global variable
 * var Tree = tui.Tree;
 * var instance = new Tree(...);
 * @example <caption>Initialize Tree</caption>
 * // Default options:
 * // {
 * //     data: [],
 * //     nodeIdPrefix: 'tui-tree-node-',
 * //     nodeDefaultState: 'closed',
 * //     stateLabels: {
 * //         opened: '-',
 * //         closed: '+'
 * //     },
 * //     template: {
 * //         internalNode:
 * //             '<div class="tui-tree-content-wrapper">' +
 * //                 '<button type="button" class="tui-tree-toggle-btn tui-js-tree-toggle-btn">' +
 * //                     '<span class="tui-ico-tree"></span>' +
 * //                     '{{stateLabel}}' +
 * //                 '</button>' +
 * //                 '<span class="tui-tree-text tui-js-tree-text">' +
 * //                     '<span class="tui-tree-ico tui-ico-folder"></span>' +
 * //                     '{{text}}' +
 * //                 '</span>' +
 * //             '</div>' +
 * //             '<ul class="tui-tree-subtree tui-js-tree-subtree">' +
 * //                 '{{children}}' +
 * //             '</ul>',
 * //         leafNode:
 * //             '<div class="tui-tree-content-wrapper">' +
 * //                 '<span class="tui-tree-text tui-js-tree-text">' +
 * //                     '<span class="tui-tree-ico tui-ico-file"></span>' +
 * //                     '{{text}}' +
 * //                 '</span>' +
 * //             '</div>'
 * //     }
 * // }
 * var container = document.getElementById('tree');
 * var data = [
 *     {text: 'rootA', children: [
 *         {text: 'root-1A'},
 *         {text: 'root-1B'},
 *         {text: 'root-1C'},
 *         {text: 'root-1D'},
 *         {text: 'root-2A', children: [
 *             {text: 'sub_1A', children:[
 *                 {text: 'sub_sub_1A'}
 *             ]},
 *             {text: 'sub_2A'}
 *         ]},
 *         {text: 'root-2B'},
 *         {text: 'root-2C'},
 *         {text: 'root-2D'},
 *         {text: 'root-3A', children: [
 *             {text: 'sub3_a'},
 *             {text: 'sub3_b'}
 *         ]},
 *         {text: 'root-3B'},
 *         {text: 'root-3C'},
 *         {text: 'root-3D'}
 *     ]},
 *     {text: 'rootB', children: [
 *         {text: 'B_sub1'},
 *         {text: 'B_sub2'},
 *         {text: 'b'}
 *     ]}
 * ];
 * var tree = new Tree(container, {
 *     data: data,
 *     nodeDefaultState: 'opened',
 *
 *     // ========= Option: Override template renderer ===========
 *
 *     template: { // template for Mustache engine
 *         internalNode:
 *             '<div class="tui-tree-content-wrapper">' +
 *                 '<button type="button" class="tui-tree-toggle-btn tui-js-tree-toggle-btn">' +
 *                     '<span class="tui-ico-tree"></span>' +
 *                     '{{stateLabel}}' +
 *                 '</button>' +
 *                 '<span class="tui-tree-text tui-js-tree-text">' +
 *                     '<span class="tui-tree-ico tui-ico-folder"></span>' +
 *                     '{{text}}' +
 *                 '</span>' +
 *             '</div>' +
 *             '<ul class="tui-tree-subtree tui-js-tree-subtree">' +
 *                  '{{{children}}}' +
 *             '</ul>',
 *         leafNode:
 *             '<div class="tui-tree-content-wrapper">' +
 *                 '<span class="tui-tree-text tui-js-tree-text">' +
 *                     '<span class="tui-tree-ico tui-ico-file"></span>' +
 *                     '{{text}}' +
 *                 '</span>' +
 *             '</div>'
 *     },
 *     renderTemplate: function(tmpl, props) {
 *         // Mustache template engine
 *         return Mustache.render(tmpl, props);
 *     }
 * });
 */
var Tree = defineClass(
  /** @lends Tree.prototype */ {
    init: function(container, options) {
      options = extend({}, defaultOption, options);

      /**
       * Default class names
       * @type {object.<string, string>}
       */
      this.classNames = extend({}, defaultOption.classNames, options.classNames);

      /**
       * Default template
       * @type {{internalNode: string, leafNode: string}}
       */
      this.template = extend({}, defaultOption.template, options.template);

      /**
       * Root element
       * @type {HTMLElement}
       */
      this.rootElement = null;

      /**
       * Toggle button state label
       * @type {{opened: string, closed: string}}
       */
      this.stateLabels = options.stateLabels;

      /**
       * Make tree model
       * @type {TreeModel}
       * @private
       */
      this.model = new TreeModel(options);

      /**
       * Enabled features
       * @type {Object.<string, object>}
       * @private
       */
      this.enabledFeatures = {};

      /**
       * Click timer to prevent click-duplication with double click
       * @type {number}
       * @private
       */
      this.clickTimer = null;

      /**
       * To prevent click event if mouse moved before mouseup.
       * @type {boolean}
       * @private
       */
      this._mouseMovingFlag = false;

      /**
       * Render template
       * It can be overrode by user's template engine.
       * Default: tui-code-snippet/domUtil/template {@link https://nhn.github.io/tui.code-snippet/2.2.0/domUtil#template}
       * @type {Function}
       * @private
       */
      this._renderTemplate = options.renderTemplate || template;

      /**
       * Send the hostname to google analytics.
       * If you do not want to send the hostname, this option set to false.
       * @type {boolean}
       * @private
       */
      this.usageStatistics = options.usageStatistics;

      /**
       * True when a node is moving
       * @type {boolean}
       * @example
       * tree.on({
       *     beforeDraw: function(nodeId) {
       *         if (tree.isMovingNode) {
       *             return;
       *         }
       *         //..
       *     },
       *     //....
       * });
       * tree.move('tui-tree-node-1', 'tui-tree-node-2');
       */
      this.isMovingNode = false;

      /**
       * Indentation value
       * @type {number}
       * @private
       */
      this._indent = options.indent;

      this._setRoot(container);
      this._draw(this.getRootNodeId());
      this._setEvents();

      if (this.usageStatistics) {
        util.sendHostName();
      }
    },

    /**
     * Set root element of tree
     * @param {string|HTMLElement} container - Container element or selector
     * @private
     */
    _setRoot: function(container) {
      var rootElement = outerTemplate.ROOT;

      if (isString(container)) {
        container = document.querySelector(container);
      }

      if (!isHTMLNode(container)) {
        throw new Error(messages.INVALID_CONTAINER_ELEMENT);
      }

      container.innerHTML = rootElement;
      this.rootElement = container.firstChild;
    },

    /**
     * Move event handler
     * @param {string} nodeId - Node id
     * @param {string} originalParentId - Original parent node id
     * @param {string} newParentId - New parent node id
     * @param {number} [index] - Start index number for inserting
     * @private
     */
    _onMove: function(nodeId, originalParentId, newParentId, index) {
      this._draw(originalParentId);
      this._draw(newParentId);

      /**
       * @event Tree#move
       * @type {object} evt - Event data
       * @property {string} nodeId - Current node id to move
       * @property {string} originalParentId - Original parent node id of moved node
       * @property {string} newParentId - New parent node id of moved node
       * @property {number} index - Moved index number
       * @example
       * tree.on('move', function(evt) {
       *     var nodeId = evt.nodeId;
       *     var originalParentId = evt.originalParentId;
       *     var newParentId = evt.newParentId;
       *     var index = evt.index;
       *
       *     console.log(nodeId, originalParentId, newParentId, index);
       * });
       */
      this.fire('move', {
        nodeId: nodeId,
        originalParentId: originalParentId,
        newParentId: newParentId,
        index: index
      });
    },

    /**
     * Set event handlers
     * @private
     */
    _setEvents: function() {
      this.model.on(
        {
          update: this._draw,
          move: this._onMove
        },
        this
      );

      on(
        this.rootElement,
        {
          click: this._onClick,
          mousedown: this._onMousedown,
          dblclick: this._onDoubleClick,
          contextmenu: this._onContextMenu
        },
        this
      );
    },

    /**
     * Event handler - contextmenu
     * @param {MouseEvent} mouseEvent - Contextmenu event
     * @private
     */
    _onContextMenu: function(mouseEvent) {
      this.fire('contextmenu', mouseEvent);
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} downEvent - Mouse event
     * @private
     */
    _onMousedown: function(downEvent) {
      var clientX = downEvent.clientX;
      var clientY = downEvent.clientY;
      var abs = Math.abs;

      var onMouseMoveHandler = util.bind(function onMouseMove(moveEvent) {
        var newClientX = moveEvent.clientX;
        var newClientY = moveEvent.clientY;

        if (abs(newClientX - clientX) + abs(newClientY - clientY) > MOUSE_MOVING_THRESHOLD) {
          this.fire('mousemove', moveEvent);
          this._mouseMovingFlag = true;
        }
      }, this);

      var onMouseOutHandler = util.bind(function onMouseOut(event) {
        if (event.toElement === null) {
          this.fire('mouseup', event);
        }
      }, this);

      var onMouseUpHandler = util.bind(function onMouseUp(upEvent) {
        this.fire('mouseup', upEvent);
        off(document, {
          mousemove: onMouseMoveHandler,
          mouseup: onMouseUpHandler,
          mouseout: onMouseOutHandler
        });
      }, this);

      this._mouseMovingFlag = false;
      this.fire('mousedown', downEvent);
      on(document, {
        mousemove: onMouseMoveHandler,
        mouseup: onMouseUpHandler,
        mouseout: onMouseOutHandler
      });
    },

    /**
     * Event handler - click
     * @param {MouseEvent} ev - Click event
     * @private
     */
    _onClick: function(ev) {
      var target = getTarget(ev);
      var isRightButton = getMouseButton(ev) === MOUSE_RIGHT_BUTTON;
      var nodeId;

      if (isRightButton) {
        this.clickTimer = null;

        return;
      }

      if (this._isClickedToggleButton(target)) {
        nodeId = this.getNodeIdFromElement(target);

        this.toggle(nodeId);

        /**
         * @event Tree#clickToggleBtn
         * @type {object} evt - Event data
         * @property {string} nodeId - Node id
         * @property {HTMLElement} target - Element of toggle button
         * @example
         * tree.on('clickToggleBtn', function(evt) {
         *     console.log(evt.target);
         * });
         */
        this.fire('clickToggleBtn', {
          nodeId: nodeId,
          target: target
        });

        return;
      }

      if (!this.clickTimer && !this._mouseMovingFlag) {
        this.fire('singleClick', ev);
        this.clickTimer = setTimeout(
          util.bind(function() {
            this.resetClickTimer();
          }, this),
          TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK
        );
      }
    },

    /**
     * Event handler - double click (dblclick)
     * @param {MouseEvent} event - Double click event
     * @private
     */
    _onDoubleClick: function(event) {
      this.fire('doubleClick', event);
      this.resetClickTimer();
    },

    /**
     * Whether target element is toggle button or not
     * @param {HTMLElement} target - Tree node element
     * @returns {boolean} State
     * @private
     */
    _isClickedToggleButton: function(target) {
      var nodeId = this.getNodeIdFromElement(target);
      var nodeElement;

      if (!nodeId) {
        return false;
      }

      nodeElement = document.querySelector('#' + nodeId + ' .' + this.classNames.toggleBtnClass);

      return nodeElement && nodeElement.contains(target);
    },

    /**
     * Set node state - opened or closed
     * @param {string} nodeId - Node id
     * @param {string} state - Node state
     * @private
     */
    _setDisplayFromNodeState: function(nodeId, state) {
      var subtreeElement = this._getSubtreeElement(nodeId);
      var label, btnElement, nodeElement, firstTextNode;

      if (!subtreeElement || subtreeElement === this.rootElement) {
        return;
      }
      label = this.stateLabels[state];
      nodeElement = document.getElementById(nodeId);

      btnElement = nodeElement.querySelector('.' + this.classNames.toggleBtnClass);

      if (state === nodeStates.OPENED) {
        subtreeElement.style.display = '';
      } else {
        subtreeElement.style.display = 'none';
      }
      this._setNodeClassNameFromState(nodeElement, state);

      if (btnElement) {
        firstTextNode = util.getFirstTextNode(btnElement);
        firstTextNode.nodeValue = label;
      }
    },

    /**
     * Set node class name from provided state
     * @param {HTMLElement} nodeElement - TreeNode element
     * @param {string} state - New changed state
     * @private
     */
    _setNodeClassNameFromState: function(nodeElement, state) {
      var classNames = this.classNames;
      var openedClassName = classNames[nodeStates.OPENED + 'Class'];
      var closedClassName = classNames[nodeStates.CLOSED + 'Class'];

      removeClass(nodeElement, openedClassName);
      removeClass(nodeElement, closedClassName);
      addClass(nodeElement, classNames[state + 'Class']);
    },

    /**
     * Make html
     * @param {Array.<string>} nodeIds - Node id list
     * @returns {string} HTML
     * @private
     * @see https://nhn.github.io/tui.code-snippet/2.2.0/domUtil#template
     */
    _makeHtml: function(nodeIds) {
      var model = this.model;
      var html = '';

      forEachArray(
        nodeIds,
        function(nodeId) {
          var node = model.getNode(nodeId);
          var sources, props;

          if (!node) {
            return;
          }

          sources = this._getTemplate(node);
          props = this._makeTemplateProps(node);
          props.innerTemplate = this._makeInnerHTML(node, {
            source: sources.inner,
            props: props
          });
          html += template(sources.outer, props);
        },
        this
      );

      return html;
    },

    /**
     * Make inner html of node
     * @param {TreeNode} node - Node
     * @param {{source: string, props: Object}} [cached] - Cashed data to make html
     * @returns {string} Inner html of node
     * @private
     * @see innerTemplate uses "this._renderTemplate"
     */
    _makeInnerHTML: function(node, cached) {
      var source, props;

      cached = cached || {};
      source = cached.source || this._getTemplate(node).inner;
      props = cached.props || this._makeTemplateProps(node);

      return this._renderTemplate(source, props);
    },

    /**
     * Get template sources
     * @param {TreeNode} node - Node
     * @returns {{inner: string, outer: string}} Template sources
     * @private
     */
    _getTemplate: function(node) {
      var source;

      if (node.isLeaf()) {
        source = {
          inner: this.template.leafNode,
          outer: outerTemplate.LEAF_NODE
        };
      } else {
        source = {
          inner: this.template.internalNode,
          outer: outerTemplate.INTERNAL_NODE
        };
      }

      return source;
    },

    /**
     * Make template properties
     * @param {TreeNode} node - Node
     * @returns {Object} Template properties
     * @private
     */
    _makeTemplateProps: function(node) {
      var classNames = this.classNames;
      var id = node.getId();
      var props = {
        id: id,
        indent: this.getIndentWidth(id)
      };
      var state;

      if (node.isLeaf()) {
        extend(props, {
          isLeaf: true // for custom template method
        });
      } else {
        state = node.getState();
        extend(props, {
          stateClass: classNames[state + 'Class'],
          stateLabel: this.stateLabels[state],
          children: this._makeHtml(node.getChildIds())
        });
      }

      return extend(props, classNames, node.getAllData());
    },

    /**
     * calculate tree node's padding left
     * @param {string} nodeId - Node id
     * @returns {number} - padding left of tree node division
     */
    getIndentWidth: function(nodeId) {
      return this.getDepth(nodeId) * this._indent;
    },

    /**
     * Draw element of node
     * @param {string} nodeId - Node id
     * @private
     */
    _draw: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var element, html;

      if (!node) {
        return;
      }

      /**
       * @event Tree#beforeDraw
       * @type {object} evt - Event data
       * @property {string} nodeId - Node id
       * @example
       * tree.on('beforeDraw', function(evt) {
       *     if (tree.isMovingNode) {
       *         console.log('isMovingNode');
       *     }
       *     console.log('beforeDraw: ' + evt.nodeId);
       * });
       */
      this.fire('beforeDraw', { nodeId: nodeId });

      if (node.isRoot()) {
        html = this._makeHtml(node.getChildIds());
        element = this.rootElement;
      } else {
        html = this._makeInnerHTML(node);
        element = document.getElementById(nodeId);
      }
      element.innerHTML = html;
      this._setClassNameAndVisibilityByFeature(node);

      /**
       * @event Tree#afterDraw
       * @type {object} evt - Event data
       * @property {string} nodeId - Node id
       * @example
       * tree.on('afterDraw', function(evt) {
       *     if (tree.isMovingNode) {
       *         console.log('isMovingNode');
       *     }
       *     console.log('afterDraw: ' + evt.nodeId);
       * });
       */
      this.fire('afterDraw', { nodeId: nodeId });
    },

    /**
     * Update class name and visibility by features on below
     * - leaf node: has classNames.leafClass
     * - internal node + opened: has classNames.openedClass, child is visible
     * - internal node + closed: has classNames.closedClass, child is not visible
     * @param {TreeNode} startNode - (re)drawing starts from this node
     * @private
     */
    _setClassNameAndVisibilityByFeature: function(startNode) {
      this._setNodeClassNameAndVisibility(startNode);

      if (!startNode.isLeaf()) {
        this.each(
          function(child) {
            this._setNodeClassNameAndVisibility(child);
          },
          startNode.getId(),
          this
        );
      }
    },

    /**
     * Update class name and visibility by features on below
     * - leaf node: has classNames.leafClass
     * - internal node + opened: has classNames.openedClass, child is visible
     * - internal node + closed: has classNames.closedClass, child is not visible
     * @param {TreeNode} node - (re)drawing this node
     * @private
     */
    _setNodeClassNameAndVisibility: function(node) {
      var nodeId = node.getId();
      var element = document.getElementById(nodeId);
      var classNames = this.classNames;
      var isLeaf = node.isLeaf();

      if (!isLeaf) {
        this._setDisplayFromNodeState(nodeId, node.getState());
      }

      if (element) {
        if (isLeaf) {
          removeClass(element, classNames.openedClass);
          removeClass(element, classNames.closedClass);
          addClass(element, classNames.leafClass);
        } else {
          removeClass(element, classNames.leafClass);
        }
      }
    },

    /**
     * Get subtree element
     * @param {string} nodeId - TreeNode id
     * @returns {HTMLElement} Subtree element
     * @private
     */
    _getSubtreeElement: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var subtreeElement;

      if (!node || node.isLeaf()) {
        subtreeElement = null;
      } else if (node.isRoot()) {
        subtreeElement = this.rootElement;
      } else {
        subtreeElement = document.querySelector('#' + nodeId + ' .' + this.classNames.subtreeClass);
      }

      return subtreeElement;
    },

    /**
     * Return the depth of node
     * @param {string} nodeId - Node id
     * @returns {number|undefined} Depth
     */
    getDepth: function(nodeId) {
      return this.model.getDepth(nodeId);
    },

    /**
     * Return the last depth of tree
     * @returns {number} Last depth
     */
    getLastDepth: function() {
      return this.model.getLastDepth();
    },

    /**
     * Return root node id
     * @returns {string} Root node id
     */
    getRootNodeId: function() {
      return this.model.rootNode.getId();
    },

    /**
     * Return child ids
     * @param {string} nodeId - Node id
     * @returns {Array.<string>|undefined} Child ids
     */
    getChildIds: function(nodeId) {
      return this.model.getChildIds(nodeId);
    },

    /**
     * Return parent id of node
     * @param {string} nodeId - Node id
     * @returns {string|undefined} Parent id
     */
    getParentId: function(nodeId) {
      return this.model.getParentId(nodeId);
    },

    /**
     * Reset click timer
     */
    resetClickTimer: function() {
      window.clearTimeout(this.clickTimer);
      this.clickTimer = null;
    },

    /**
     * Get node id from element
     * @param {HTMLElement} element - Element
     * @returns {string} Node id
     * @example
     * tree.getNodeIdFromElement(elementInNode); // 'tui-tree-node-3'
     */
    getNodeIdFromElement: function(element) {
      var idPrefix = this.getNodeIdPrefix();

      while (element && element.id.indexOf(idPrefix) === -1) {
        element = element.parentElement;
      }

      return element ? element.id : '';
    },

    /**
     * Get prefix of node id
     * @returns {string} Prefix of node id
     * @example
     * tree.getNodeIdPrefix(); // 'tui-tree-node-'
     */
    getNodeIdPrefix: function() {
      return this.model.getNodeIdPrefix();
    },

    /**
     * Get node data
     * @param {string} nodeId - Node id
     * @returns {object|undefined} Node data
     */
    getNodeData: function(nodeId) {
      return this.model.getNodeData(nodeId);
    },

    /**
     * Set data properties of a node
     * @param {string} nodeId - Node id
     * @param {object} data - Properties
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't trigger the 'update' event
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @exmaple
     * tree.setNodeData(nodeId, {foo: 'bar'}); // auto refresh
     * tree.setNodeData(nodeId, {foo: 'bar'}, true); // not refresh
     */
    setNodeData: function(nodeId, data, options) {
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.UPDATE,
          util.bind(function() {
            this._setNodeData(nodeId, data);
          }, this),
          {
            nodeId: nodeId,
            data: data,
            type: 'set'
          }
        );
      } else {
        this._setNodeData(nodeId, data, isSilent);
      }
    },

    /**
     * Set data properties of a node (Core method)
     * @param {string} nodeId - Node id
     * @param {object} data - Properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     * @private
     */
    _setNodeData: function(nodeId, data, isSilent) {
      this.model.setNodeData(nodeId, data, isSilent);
    },

    /**
     * Remove node data
     * @param {string} nodeId - Node id
     * @param {string|Array} names - Names of properties
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't trigger the 'update' event
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.setNodeData(nodeId, 'foo'); // auto refresh
     * tree.setNodeData(nodeId, 'foo', true); // not refresh
     */
    removeNodeData: function(nodeId, names, options) {
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.UPDATE,
          util.bind(function() {
            this._removeNodeData(nodeId, names);
          }, this),
          {
            nodeId: nodeId,
            names: names,
            type: 'remove'
          }
        );
      } else {
        this._removeNodeData(nodeId, names, isSilent);
      }
    },

    /**
     * Remove node data (Core method)
     * @param {string} nodeId - Node id
     * @param {string|Array} names - Names of properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     * @private
     */
    _removeNodeData: function(nodeId, names, isSilent) {
      this.model.removeNodeData(nodeId, names, isSilent);
    },

    /**
     * Get node state.
     * @param {string} nodeId - Node id
     * @returns {string|null} Node state(('opened', 'closed', null)
     * @example
     * tree.getState(nodeId); // 'opened', 'closed',
     *                        // undefined if the node is nonexistent
     */
    getState: function(nodeId) {
      var node = this.model.getNode(nodeId);

      if (!node) {
        return null;
      }

      return node.getState();
    },
    /**
     * Open node
     * @param {string} nodeId - Node id
     * @param {boolean} recursive - If true, it open all parent (default: false)
     * @example
     * tree.open(nodeId ,true);
     */
    open: function(nodeId, recursive) {
      if (recursive) {
        this._openRecursiveNode(nodeId);
      } else {
        this._openNode(nodeId);
      }
    },
    /**
     * Open all parent node
     * @param {string} nodeId - Node id
     * @private
     */
    _openRecursiveNode: function(nodeId) {
      var parentIds = this.model.getParentIds(nodeId);
      parentIds.push(nodeId);
      forEachArray(
        parentIds,
        function(parentId) {
          this._openNode(parentId);
        },
        this
      );
    },
    /**
     * Open one target node
     * @param {string} nodeId - Node id
     * @private
     */
    _openNode: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var state = nodeStates.OPENED;
      var isAllowStateChange = node && !node.isRoot() && node.getState() === nodeStates.CLOSED;

      if (isAllowStateChange) {
        node.setState(state);
        this._setDisplayFromNodeState(nodeId, state);
      }

      if (this.enabledFeatures.Ajax) {
        this._reload(nodeId);
      }
    },

    /**
     * Close node
     * @param {string} nodeId - Node id
     * @param {boolean} recursive - If true, it close all child node (default: false)
     * @example
     * tree.close(nodeId, true);
     */
    close: function(nodeId, recursive) {
      if (recursive) {
        this._closeRecursiveNode(nodeId);
      } else {
        this._closeNode(nodeId);
      }
    },

    /**
     * Close all child node
     * @param {string} nodeId - Node id
     * @private
     */
    _closeRecursiveNode: function(nodeId) {
      this._closeNode(nodeId);
      this.model.each(
        function(searchNode, searchNodeId) {
          if (!searchNode.isLeaf()) {
            this._closeNode(searchNodeId);
          }
        },
        nodeId,
        this
      );
    },

    /**
     * Close one target node
     * @param {string} nodeId - Node id
     * @private
     */
    _closeNode: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var state = nodeStates.CLOSED;
      var isAllowStateChange = node && !node.isRoot() && node.getState() === nodeStates.OPENED;
      if (isAllowStateChange) {
        node.setState(state);
        this._setDisplayFromNodeState(nodeId, state);
      }
    },

    /**
     * Toggle node
     * @param {string} nodeId - Node id
     */
    toggle: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var state;

      if (!node || node.isRoot()) {
        return;
      }

      node.toggleState();
      state = node.getState();
      this._setDisplayFromNodeState(nodeId, state);

      if (this.enabledFeatures.Ajax) {
        this._reload(nodeId);
      }
    },

    /**
     * Reload children nodes while "stateLable" is clicked
     * @param {string} nodeId - Node id
     * @private
     */
    _reload: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var state = node.getState();
      var isReload = isUndefined(node.getData('reload')) || node.getData('reload');

      if (state === nodeStates.CLOSED) {
        // open -> close action
        this._setNodeData(
          nodeId,
          {
            reload: false
          },
          true
        );
      }

      if (state === nodeStates.OPENED && isReload) {
        // close -> open action
        this.resetAllData(null, {
          nodeId: nodeId,
          useAjax: true
        });
      }
    },

    /**
     * Sort all nodes
     * @param {Function} comparator - Comparator for sorting
     * @param {boolean} [isSilent] - If true, it doesn't redraw tree
     * @param {string} [parentId] - Id of a node to sort partially
     * @example
     * var comparator = function(nodeA, nodeB) {
     *     var aValue = nodeA.getData('text'),
     *         bValue = nodeB.getData('text');
     *
     *     if (!bValue || !bValue.localeCompare) {
     *         return 0;
     *     }
     *     return bValue.localeCompare(aValue);
     * };
     *
     * // Sort with redrawing tree
     * tree.sort(comparator);
     *
     * // Sort, but not redraw tree
     * tree.sort(comparator, true);
     *
     * // Sort partially
     * tree.sort(comparator, false, parentId)
     */
    sort: function(comparator, isSilent, parentId) {
      this.model.sort(comparator, parentId);

      if (!isSilent) {
        this.refresh(parentId);
      }
    },

    /**
     * Refresh tree or node's children
     * @param {string} [nodeId] - TreeNode id to refresh
     */
    refresh: function(nodeId) {
      nodeId = nodeId || this.getRootNodeId();
      this._draw(nodeId);
    },

    /**
     * Traverse this tree iterating over all nodes.
     * @param {Function} iteratee - Iteratee function
     * @param {object} [context] - Context of iteratee
     * @example
     * tree.eachAll(function(node, nodeId) {
     *     console.log(node.getId() === nodeId); // true
     * });
     */
    eachAll: function(iteratee, context) {
      this.model.eachAll(iteratee, context);
    },

    /**
     * Traverse this tree iterating over all descendants of a node.
     * @param {Function} iteratee - Iteratee function
     * @param {string} parentId - Parent node id
     * @param {object} [context] - Context of iteratee
     * @example
     * tree.each(function(node, nodeId) {
     *     console.log(node.getId() === nodeId); // true
     * }, parentId);
     *
     */
    each: function(iteratee, parentId, context) {
      this.model.each(iteratee, parentId, context);
    },

    /**
     * Add node(s).
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - If 'isSilent' is not true, it redraws the tree
     * @param {Array|object} data - Raw-data
     * @param {*} [parentId] - Parent id
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't redraw children
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @returns {?Array.<string>} Added node ids
     * @example
     * // add node with redrawing
     * var firstAddedIds = tree.add({text:'FE development team1'}, parentId);
     * console.log(firstAddedIds); // ["tui-tree-node-10"]
     *
     * // add node without redrawing
     * var secondAddedIds = tree.add([
     *    {text: 'FE development team2'},
     *    {text: 'FE development team3'}
     * ], parentId, true);
     * console.log(secondAddedIds); // ["tui-tree-node-11", "tui-tree-node-12"]
     */
    add: function(data, parentId, options) {
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;
      var newChildIds;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.CREATE,
          util.bind(function() {
            return this._add(data, parentId);
          }, this),
          {
            parentId: parentId,
            data: data
          }
        );
      } else {
        newChildIds = this._add(data, parentId, isSilent);
      }

      return newChildIds;
    },

    /**
     * Add node(s). (Core method)
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - If 'isSilent' is not true, it redraws the tree
     * @param {Array|object} data - Raw-data
     * @param {*} [parentId] - Parent id
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @returns {Array.<string>} Added node ids
     * @private
     */
    _add: function(data, parentId, isSilent) {
      return this.model.add(data, parentId, isSilent);
    },

    /**
     * Reset all data
     * @param {Array|object} data - Raw data for all nodes
     * @param {object} [options] - Options
     *     @param {string} [options.nodeId] - Parent node id to reset all child data
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @returns {?Array.<string>} Added node ids
     * @example
     * tree.resetAllData([
     *  {text: 'hello', children: [
     *      {text: 'foo'},
     *      {text: 'bar'}
     *  ]},
     *  {text: 'world'}
     * ]);
     * tree.resetAllData([
     *  {text: 'hello world'}
     * ], {
     *  nodeId: 'tui-tree-node-5',
     *  useAjax: true
     * });
     */
    resetAllData: function(data, options) {
      var treeAjax = this.enabledFeatures.Ajax;
      var nodeId = options ? options.nodeId : this.getRootNodeId();
      var useAjax = options ? options.useAjax : !!treeAjax;
      var newChildIds;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.READ,
          util.bind(function(response) {
            return this._resetAllData(response, nodeId);
          }, this),
          {
            nodeId: nodeId
          }
        );
      } else {
        newChildIds = this._resetAllData(data, nodeId);
      }

      return newChildIds;
    },

    /**
     * Reset all data (Core method)
     * @param {Array|object} data - Raw data for all nodes
     * @param {string} nodeId - Node id to reset data
     * @returns {Array.<string>} Added node ids
     * @private
     */
    _resetAllData: function(data, nodeId) {
      this._removeAllChildren(nodeId, {
        isSilent: true
      });

      return this._add(data, nodeId);
    },

    /**
     * Remove all children
     * @param {string} nodeId - Parent node id
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't redraw the node
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.removeAllChildren(nodeId); // Redraws the node
     * tree.removeAllChildren(nodId, true); // Doesn't redraw the node
     */
    removeAllChildren: function(nodeId, options) {
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.DELETE_ALL_CHILDREN,
          util.bind(function() {
            this._removeAllChildren(nodeId);
          }, this),
          {
            parentId: nodeId
          }
        );
      } else {
        this._removeAllChildren(nodeId, isSilent);
      }
    },

    /**
     * Remove all children (Core method)
     * @param {string} nodeId - Parent node id
     * @param {boolean} [isSilent] - If true, it doesn't redraw the node
     * @private
     */
    _removeAllChildren: function(nodeId, isSilent) {
      var children = this.getChildIds(nodeId);

      forEachArray(
        children || [],
        function(childId) {
          this._remove(childId, true);
        },
        this
      );

      if (!isSilent) {
        this._draw(nodeId);
      }
    },

    /**
     * Remove a node with children.
     * - If 'isSilent' is not true, it redraws the tree
     * @param {string} nodeId - Node id to remove
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't redraw children
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.remove(myNodeId); // remove node with redrawing
     * tree.remove(myNodeId, true); // remove node without redrawing
     */
    remove: function(nodeId, options) {
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.DELETE,
          util.bind(function() {
            this._remove(nodeId);
          }, this),
          {
            nodeId: nodeId
          }
        );
      } else {
        this._remove(nodeId, isSilent);
      }
    },

    /**
     * Remove a node with children. (Core method)
     * - If 'isSilent' is not true, it redraws the tree
     * @param {string} nodeId - Node id to remove
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @private
     */
    _remove: function(nodeId, isSilent) {
      this.model.remove(nodeId, isSilent);
    },

    /**
     * Move a node to new parent
     * - If 'isSilent' is not true, it redraws the tree
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {number} index - Index number of selected node
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't trigger the 'update' event
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.move(myNodeId, newParentId); // mode node with redrawing
     * tree.move(myNodeId, newParentId, true); // move node without redrawing
     */
    move: function(nodeId, newParentId, index, options) {
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.MOVE,
          util.bind(function() {
            if (this.getParentId(nodeId) !== newParentId) {
              // just move, not sort!
              this.setNodeData(
                newParentId,
                {
                  reload: true
                },
                true
              );
            }
            this._move(nodeId, newParentId, index);
          }, this),
          {
            nodeId: nodeId,
            newParentId: newParentId,
            index: index
          }
        );
      } else {
        this._move(nodeId, newParentId, index, isSilent);
      }
    },

    /**
     * Move a node to new parent (Core method)
     * - If 'isSilent' is not true, it redraws the tree
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {number} index - Index number of selected node
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @private
     */
    _move: function(nodeId, newParentId, index, isSilent) {
      /**
       * @event Tree#beforeMove
       * @type {object} evt - Event data
       * @property {string} nodeId - Current dragging node id
       * @property {string} newParentId - New parent id
       * @example
       * tree.on('beforeMove', function(evt) {
       *      console.log('dragging node: ' + evt.nodeId);
       *      console.log('new parent node: ' + evt.newParentId);
       *      console.log('original parent node: ' + tree.getParentId(evt.nodeId));
       *
       *      return false; // Cancel "move" event
       *      // return true; // Fire "move" event
       * });
       */
      if (
        !this.invoke('beforeMove', {
          nodeId: nodeId,
          newParentId: newParentId
        })
      ) {
        return;
      }

      this.isMovingNode = true;
      this.model.move(nodeId, newParentId, index, isSilent);
      this.isMovingNode = false;
    },

    /**
     * Search node ids by passing the predicate check or matching data
     * @param {Function|Object} predicate - Predicate or data
     * @param {Object} [context] - Context of predicate
     * @returns {Array.<string>} Node ids
     * @example
     * // search from predicate
     * var leafNodeIds = tree.search(function(node, nodeId) {
     *     return node.isLeaf();
     * });
     * console.log(leafNodeIds); // ['tui-tree-node-3', 'tui-tree-node-5']
     *
     * // search from data
     * var specialNodeIds = tree.search({
     *     isSpecial: true,
     *     foo: 'bar'
     * });
     * console.log(specialNodeIds); // ['tui-tree-node-5', 'tui-tree-node-10']
     * console.log(tree.getNodeData('tui-tree-node-5').isSpecial); // true
     * console.log(tree.getNodeData('tui-tree-node-5').foo); // 'bar'
     */
    search: function(predicate, context) {
      if (!isObject(predicate)) {
        return [];
      }

      if (isFunction(predicate)) {
        return this._filter(predicate, context);
      }

      return this._where(predicate);
    },

    /**
     * Search node ids by matching data
     * @param {Object} props - Data
     * @returns {Array.<string>} Node ids
     * @private
     */
    _where: function(props) {
      return this._filter(function(node) {
        var result = true;
        var data = node.getAllData();

        forEachOwnProperties(props, function(value, key) {
          result = key in data && data[key] === value;

          return result;
        });

        return result;
      });
    },

    /**
     * Search node ids by passing the predicate check
     * @param {Function} predicate - Predicate
     * @param {Object} [context] - Context of predicate
     * @returns {Array.<string>} Node ids
     * @private
     */
    _filter: function(predicate, context) {
      var filtered = [];

      this.eachAll(function(node, nodeId) {
        if (predicate(node, nodeId)) {
          filtered.push(nodeId);
        }
      }, context);

      return filtered;
    },

    /**
     * Whether the node is leaf
     * @param {string} nodeId - Node id
     * @returns {boolean} True if the node is leaf.
     */
    isLeaf: function(nodeId) {
      var node = this.model.getNode(nodeId);

      return node && node.isLeaf();
    },

    /**
     * Whether a node is a ancestor of another node.
     * @param {string} containerNodeId - Id of a node that may contain the other node
     * @param {string} containedNodeId - Id of a node that may be contained by the other node
     * @returns {boolean} Whether a node contains another node
     */
    contains: function(containerNodeId, containedNodeId) {
      return this.model.contains(containerNodeId, containedNodeId);
    },

    /**
     * Enable facility of tree
     * Ajax feature options: https://github.com/nhn/tui.tree/blob/master/docs/ajax-feature.md
     * @param {string} featureName - 'Selectable', 'Editable', 'Draggable', 'Checkbox', 'ContextMenu', 'Ajax'
     * @param {object} [options] - Feature options
     * @returns {Tree} this
     * @example
     * tree
     *  .enableFeature('Selectable', {
     *      selectedClassName: 'tui-tree-selected'
     *  })
     *  .enableFeature('Editable', {
     *      editableClassName: tree.classNames.textClass,
     *      dataKey: 'text',
     *      defaultValue: 'new node',
     *      inputClassName: 'myInput'
     *  })
     *  .enableFeature('Draggable', {
     *      useHelper: true,
     *      helperPos: {x: 5, y: 2},
     *      rejectedTagNames: ['UL', 'INPUT', 'BUTTON'],
     *      rejectedClassNames: ['notDraggable', 'notDraggable-2'],
     *      autoOpenDelay: 1500,
     *      isSortable: true,
     *      hoverClassName: 'tui-tree-hover'
     *      lineClassName: 'tui-tree-line',
     *      lineBoundary: {
     *          top: 10,
     *          bottom: 10
     *      }
     *  })
     *  .enableFeature('Checkbox', {
     *      checkboxClassName: 'tui-tree-checkbox'
     *  })
     *  .enableFeature('ContextMenu', {
     *      menuData: [
     *          {title: 'menu1', command: 'copy'},
     *          {title: 'menu2', command: 'paste'},
     *          {separator: true},
     *          {
     *              title: 'menu3',
     *              menu: [
     *                  {title: 'submenu1'},
     *                  {title: 'submenu2'}
     *              ]
     *          }
     *      }
     *  })
     *  .enableFeature('Ajax', {
     *      command: {
     *          read: {
     *              url: 'api/read',
     *              contentType: 'application/json',
     *              method: 'GET'
     *          },
     *          create: {
     *              url: 'api/create',
     *              contentType: 'application/json',
     *              method: 'POST'
     *          },
     *          update: {
     *              url: 'api/update',
     *              contentType: 'application/json',
     *              method: 'POST',
     *              params: {
     *                  paramA: 'a',
     *                  paramB: 'b'
     *              }
     *          },
     *          remove: {
     *              url: 'api/remove',
     *              contentType: 'application/json',
     *              method: 'POST',
     *              params: function(evt) {
     *                  return {
     *                      paramA: evt.a,
     *                      paramB: evt.b
     *                  };
     *              }
     *          },
     *          removeAllChildren: {
     *              url: function(evt) {
     *                  return 'api/remove_all/' + evt.nodeId,
     *              },
     *              contentType: 'application/json',
     *              method: 'POST'
     *          },
     *          move: {
     *              url: 'api/move',
     *              contentType: 'application/json',
     *              method: 'POST'
     *          }
     *      },
     *      parseData: function(command, responseData) {
     *          if (responseData) {
     *              return responseData;
     *          } else {
     *              return false;
     *          }
     *      }
     *  });
     */
    enableFeature: function(featureName, options) {
      var Feature = features[featureName];

      if (!Feature) {
        return this;
      }

      this.disableFeature(featureName);

      if (isObject(options)) {
        options.usageStatistics = this.usageStatistics;
      } else {
        options = {
          usageStatistics: this.usageStatistics
        };
      }

      this.enabledFeatures[featureName] = new Feature(this, options);
      this.fire('initFeature');

      return this;
    },

    /**
     * Disable facility of tree
     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable'
     * @returns {Tree} this
     * @example
     * tree
     *  .disableFeature('Selectable')
     *  .disableFeature('Draggable')
     *  .disableFeature('Editable')
     *  .disableFeature('Checkbox')
     *  .disableFeature('ContextMenu')
     *  .disableFeature('Ajax');
     */
    disableFeature: function(featureName) {
      var feature = this.enabledFeatures[featureName];

      if (feature) {
        feature.destroy();
        delete this.enabledFeatures[featureName];
      }

      return this;
    },

    /**
     * Get index number of selected node
     * @param {string} nodeId - Id of selected node
     * @returns {number} Index number of attached node
     */
    getNodeIndex: function(nodeId) {
      var parentId = this.model.getParentId(nodeId);

      return this.model.getNode(parentId).getChildIndex(nodeId);
    }
  }
);

/**
 * Set abstract apis to tree prototype
 * @param {string} featureName - Feature name
 * @param {object} feature - Feature
 * @ignore
 */
function setAbstractAPIs(featureName, feature) {
  var messageName = 'INVALID_API_' + featureName.toUpperCase();
  var apiList = feature.getAPIList ? feature.getAPIList() : [];

  forEachArray(apiList, function(api) {
    Tree.prototype[api] = function() {
      throw new Error(messages[messageName] || messages.INVALID_API);
    };
  });
}
forEachOwnProperties(features, function(Feature, name) {
  setAbstractAPIs(name, Feature);
});
CustomEvents.mixin(Tree);

module.exports = Tree;


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Provide a simple inheritance in prototype-oriented.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var createObject = __webpack_require__(37);

/**
 * Provide a simple inheritance in prototype-oriented.
 * Caution :
 *  Don't overwrite the prototype of child constructor.
 *
 * @param {function} subType Child constructor
 * @param {function} superType Parent constructor
 * @memberof module:inheritance
 * @example
 * var inherit = require('tui-code-snippet/inheritance/inherit'); // node, commonjs
 *
 * // Parent constructor
 * function Animal(leg) {
 *     this.leg = leg;
 * }
 * Animal.prototype.growl = function() {
 *     // ...
 * };
 *
 * // Child constructor
 * function Person(name) {
 *     this.name = name;
 * }
 *
 * // Inheritance
 * inherit(Person, Animal);
 *
 * // After this inheritance, please use only the extending of property.
 * // Do not overwrite prototype.
 * Person.prototype.walk = function(direction) {
 *     // ...
 * };
 */
function inherit(subType, superType) {
  var prototype = createObject(superType.prototype);
  prototype.constructor = subType;
  subType.prototype = prototype;
}

module.exports = inherit;


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Create a new object with the specified prototype object and properties.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * @module inheritance
 */

/**
 * Create a new object with the specified prototype object and properties.
 * @param {Object} obj This object will be a prototype of the newly-created object.
 * @returns {Object}
 * @memberof module:inheritance
 */
function createObject(obj) {
  function F() {} // eslint-disable-line require-jsdoc
  F.prototype = obj;

  return new F();
}

module.exports = createObject;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview This module detects the kind of well-known browser and version.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Browser module
 * @module browser
 */

/**
 * This object has an information that indicate the kind of browser.
 * The list below is a detectable browser list.
 *  - ie8 ~ ie11
 *  - chrome
 *  - firefox
 *  - safari
 *  - edge
 * @memberof module:browser
 * @example
 * var browser = require('tui-code-snippet/browser/browser'); // node, commonjs
 *
 * browser.chrome === true; // chrome
 * browser.firefox === true; // firefox
 * browser.safari === true; // safari
 * browser.msie === true; // IE
 * browser.edge === true; // edge
 * browser.others === true; // other browser
 * browser.version; // browser version
 */
var browser = {
  chrome: false,
  firefox: false,
  safari: false,
  msie: false,
  edge: false,
  others: false,
  version: 0
};

if (window && window.navigator) {
  detectBrowser();
}

/**
 * Detect the browser.
 * @private
 */
function detectBrowser() {
  var nav = window.navigator;
  var appName = nav.appName.replace(/\s/g, '_');
  var userAgent = nav.userAgent;

  var rIE = /MSIE\s([0-9]+[.0-9]*)/;
  var rIE11 = /Trident.*rv:11\./;
  var rEdge = /Edge\/(\d+)\./;
  var versionRegex = {
    firefox: /Firefox\/(\d+)\./,
    chrome: /Chrome\/(\d+)\./,
    safari: /Version\/([\d.]+).*Safari\/(\d+)/
  };

  var key, tmp;

  var detector = {
    Microsoft_Internet_Explorer: function() { // eslint-disable-line camelcase
      var detectedVersion = userAgent.match(rIE);

      if (detectedVersion) { // ie8 ~ ie10
        browser.msie = true;
        browser.version = parseFloat(detectedVersion[1]);
      } else { // no version information
        browser.others = true;
      }
    },
    Netscape: function() { // eslint-disable-line complexity
      var detected = false;

      if (rIE11.exec(userAgent)) {
        browser.msie = true;
        browser.version = 11;
        detected = true;
      } else if (rEdge.exec(userAgent)) {
        browser.edge = true;
        browser.version = userAgent.match(rEdge)[1];
        detected = true;
      } else {
        for (key in versionRegex) {
          if (versionRegex.hasOwnProperty(key)) {
            tmp = userAgent.match(versionRegex[key]);
            if (tmp && tmp.length > 1) { // eslint-disable-line max-depth
              browser[key] = detected = true;
              browser.version = parseFloat(tmp[1] || 0);
              break;
            }
          }
        }
      }
      if (!detected) {
        browser.others = true;
      }
    }
  };

  var fn = detector[appName];

  if (fn) {
    detector[appName]();
  }
}

module.exports = browser;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Convert text by binding expressions with context.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var inArray = __webpack_require__(4);
var forEach = __webpack_require__(9);
var isArray = __webpack_require__(2);
var isString = __webpack_require__(8);
var extend = __webpack_require__(1);

// IE8 does not support capture groups.
var EXPRESSION_REGEXP = /{{\s?|\s?}}/g;
var BRACKET_NOTATION_REGEXP = /^[a-zA-Z0-9_@]+\[[a-zA-Z0-9_@"']+\]$/;
var BRACKET_REGEXP = /\[\s?|\s?\]/;
var DOT_NOTATION_REGEXP = /^[a-zA-Z_]+\.[a-zA-Z_]+$/;
var DOT_REGEXP = /\./;
var STRING_NOTATION_REGEXP = /^["']\w+["']$/;
var STRING_REGEXP = /"|'/g;
var NUMBER_REGEXP = /^-?\d+\.?\d*$/;

var EXPRESSION_INTERVAL = 2;

var BLOCK_HELPERS = {
  'if': handleIf,
  'each': handleEach,
  'with': handleWith
};

var isValidSplit = 'a'.split(/a/).length === 3;

/**
 * Split by RegExp. (Polyfill for IE8)
 * @param {string} text - text to be splitted\
 * @param {RegExp} regexp - regular expression
 * @returns {Array.<string>}
 */
var splitByRegExp = (function() {
  if (isValidSplit) {
    return function(text, regexp) {
      return text.split(regexp);
    };
  }

  return function(text, regexp) {
    var result = [];
    var prevIndex = 0;
    var match, index;

    if (!regexp.global) {
      regexp = new RegExp(regexp, 'g');
    }

    match = regexp.exec(text);
    while (match !== null) {
      index = match.index;
      result.push(text.slice(prevIndex, index));

      prevIndex = index + match[0].length;
      match = regexp.exec(text);
    }
    result.push(text.slice(prevIndex));

    return result;
  };
})();

/**
 * Find value in the context by an expression.
 * @param {string} exp - an expression
 * @param {object} context - context
 * @returns {*}
 * @private
 */
// eslint-disable-next-line complexity
function getValueFromContext(exp, context) {
  var splitedExps;
  var value = context[exp];

  if (exp === 'true') {
    value = true;
  } else if (exp === 'false') {
    value = false;
  } else if (STRING_NOTATION_REGEXP.test(exp)) {
    value = exp.replace(STRING_REGEXP, '');
  } else if (BRACKET_NOTATION_REGEXP.test(exp)) {
    splitedExps = exp.split(BRACKET_REGEXP);
    value = getValueFromContext(splitedExps[0], context)[getValueFromContext(splitedExps[1], context)];
  } else if (DOT_NOTATION_REGEXP.test(exp)) {
    splitedExps = exp.split(DOT_REGEXP);
    value = getValueFromContext(splitedExps[0], context)[splitedExps[1]];
  } else if (NUMBER_REGEXP.test(exp)) {
    value = parseFloat(exp);
  }

  return value;
}

/**
 * Extract elseif and else expressions.
 * @param {Array.<string>} ifExps - args of if expression
 * @param {Array.<string>} sourcesInsideBlock - sources inside if block
 * @returns {object} - exps: expressions of if, elseif, and else / sourcesInsideIf: sources inside if, elseif, and else block.
 * @private
 */
function extractElseif(ifExps, sourcesInsideBlock) {
  var exps = [ifExps];
  var sourcesInsideIf = [];
  var otherIfCount = 0;
  var start = 0;

  // eslint-disable-next-line complexity
  forEach(sourcesInsideBlock, function(source, index) {
    if (source.indexOf('if') === 0) {
      otherIfCount += 1;
    } else if (source === '/if') {
      otherIfCount -= 1;
    } else if (!otherIfCount && (source.indexOf('elseif') === 0 || source === 'else')) {
      exps.push(source === 'else' ? ['true'] : source.split(' ').slice(1));
      sourcesInsideIf.push(sourcesInsideBlock.slice(start, index));
      start = index + 1;
    }
  });

  sourcesInsideIf.push(sourcesInsideBlock.slice(start));

  return {
    exps: exps,
    sourcesInsideIf: sourcesInsideIf
  };
}

/**
 * Helper function for "if". 
 * @param {Array.<string>} exps - array of expressions split by spaces
 * @param {Array.<string>} sourcesInsideBlock - array of sources inside the if block
 * @param {object} context - context
 * @returns {string}
 * @private
 */
function handleIf(exps, sourcesInsideBlock, context) {
  var analyzed = extractElseif(exps, sourcesInsideBlock);
  var result = false;
  var compiledSource = '';

  forEach(analyzed.exps, function(exp, index) {
    result = handleExpression(exp, context);
    if (result) {
      compiledSource = compile(analyzed.sourcesInsideIf[index], context);
    }

    return !result;
  });

  return compiledSource;
}

/**
 * Helper function for "each".
 * @param {Array.<string>} exps - array of expressions split by spaces
 * @param {Array.<string>} sourcesInsideBlock - array of sources inside the each block
 * @param {object} context - context
 * @returns {string}
 * @private
 */
function handleEach(exps, sourcesInsideBlock, context) {
  var collection = handleExpression(exps, context);
  var additionalKey = isArray(collection) ? '@index' : '@key';
  var additionalContext = {};
  var result = '';

  forEach(collection, function(item, key) {
    additionalContext[additionalKey] = key;
    additionalContext['@this'] = item;
    extend(context, additionalContext);

    result += compile(sourcesInsideBlock.slice(), context);
  });

  return result;
}

/**
 * Helper function for "with ... as"
 * @param {Array.<string>} exps - array of expressions split by spaces
 * @param {Array.<string>} sourcesInsideBlock - array of sources inside the with block
 * @param {object} context - context
 * @returns {string}
 * @private
 */
function handleWith(exps, sourcesInsideBlock, context) {
  var asIndex = inArray('as', exps);
  var alias = exps[asIndex + 1];
  var result = handleExpression(exps.slice(0, asIndex), context);

  var additionalContext = {};
  additionalContext[alias] = result;

  return compile(sourcesInsideBlock, extend(context, additionalContext)) || '';
}

/**
 * Extract sources inside block in place.
 * @param {Array.<string>} sources - array of sources
 * @param {number} start - index of start block
 * @param {number} end - index of end block
 * @returns {Array.<string>}
 * @private
 */
function extractSourcesInsideBlock(sources, start, end) {
  var sourcesInsideBlock = sources.splice(start + 1, end - start);
  sourcesInsideBlock.pop();

  return sourcesInsideBlock;
}

/**
 * Handle block helper function
 * @param {string} helperKeyword - helper keyword (ex. if, each, with)
 * @param {Array.<string>} sourcesToEnd - array of sources after the starting block
 * @param {object} context - context
 * @returns {Array.<string>}
 * @private
 */
function handleBlockHelper(helperKeyword, sourcesToEnd, context) {
  var executeBlockHelper = BLOCK_HELPERS[helperKeyword];
  var helperCount = 1;
  var startBlockIndex = 0;
  var endBlockIndex;
  var index = startBlockIndex + EXPRESSION_INTERVAL;
  var expression = sourcesToEnd[index];

  while (helperCount && isString(expression)) {
    if (expression.indexOf(helperKeyword) === 0) {
      helperCount += 1;
    } else if (expression.indexOf('/' + helperKeyword) === 0) {
      helperCount -= 1;
      endBlockIndex = index;
    }

    index += EXPRESSION_INTERVAL;
    expression = sourcesToEnd[index];
  }

  if (helperCount) {
    throw Error(helperKeyword + ' needs {{/' + helperKeyword + '}} expression.');
  }

  sourcesToEnd[startBlockIndex] = executeBlockHelper(
    sourcesToEnd[startBlockIndex].split(' ').slice(1),
    extractSourcesInsideBlock(sourcesToEnd, startBlockIndex, endBlockIndex),
    context
  );

  return sourcesToEnd;
}

/**
 * Helper function for "custom helper".
 * If helper is not a function, return helper itself.
 * @param {Array.<string>} exps - array of expressions split by spaces (first element: helper)
 * @param {object} context - context
 * @returns {string}
 * @private
 */
function handleExpression(exps, context) {
  var result = getValueFromContext(exps[0], context);

  if (result instanceof Function) {
    return executeFunction(result, exps.slice(1), context);
  }

  return result;
}

/**
 * Execute a helper function.
 * @param {Function} helper - helper function
 * @param {Array.<string>} argExps - expressions of arguments
 * @param {object} context - context
 * @returns {string} - result of executing the function with arguments
 * @private
 */
function executeFunction(helper, argExps, context) {
  var args = [];
  forEach(argExps, function(exp) {
    args.push(getValueFromContext(exp, context));
  });

  return helper.apply(null, args);
}

/**
 * Get a result of compiling an expression with the context.
 * @param {Array.<string>} sources - array of sources split by regexp of expression.
 * @param {object} context - context
 * @returns {Array.<string>} - array of sources that bind with its context
 * @private
 */
function compile(sources, context) {
  var index = 1;
  var expression = sources[index];
  var exps, firstExp, result;

  while (isString(expression)) {
    exps = expression.split(' ');
    firstExp = exps[0];

    if (BLOCK_HELPERS[firstExp]) {
      result = handleBlockHelper(firstExp, sources.splice(index, sources.length - index), context);
      sources = sources.concat(result);
    } else {
      sources[index] = handleExpression(exps, context);
    }

    index += EXPRESSION_INTERVAL;
    expression = sources[index];
  }

  return sources.join('');
}

/**
 * Convert text by binding expressions with context.
 * <br>
 * If expression exists in the context, it will be replaced.
 * ex) '{{title}}' with context {title: 'Hello!'} is converted to 'Hello!'.
 * An array or object can be accessed using bracket and dot notation.
 * ex) '{{odds\[2\]}}' with context {odds: \[1, 3, 5\]} is converted to '5'.
 * ex) '{{evens\[first\]}}' with context {evens: \[2, 4\], first: 0} is converted to '2'.
 * ex) '{{project\["name"\]}}' and '{{project.name}}' with context {project: {name: 'CodeSnippet'}} is converted to 'CodeSnippet'.
 * <br>
 * If replaced expression is a function, next expressions will be arguments of the function.
 * ex) '{{add 1 2}}' with context {add: function(a, b) {return a + b;}} is converted to '3'.
 * <br>
 * It has 3 predefined block helpers '{{helper ...}} ... {{/helper}}': 'if', 'each', 'with ... as ...'.
 * 1) 'if' evaluates conditional statements. It can use with 'elseif' and 'else'.
 * 2) 'each' iterates an array or object. It provides '@index'(array), '@key'(object), and '@this'(current element).
 * 3) 'with ... as ...' provides an alias.
 * @param {string} text - text with expressions
 * @param {object} context - context
 * @returns {string} - text that bind with its context
 * @memberof module:domUtil
 * @example
 * var template = require('tui-code-snippet/domUtil/template');
 * 
 * var source = 
 *     '<h1>'
 *   +   '{{if isValidNumber title}}'
 *   +     '{{title}}th'
 *   +   '{{elseif isValidDate title}}'
 *   +     'Date: {{title}}'
 *   +   '{{/if}}'
 *   + '</h1>'
 *   + '{{each list}}'
 *   +   '{{with addOne @index as idx}}'
 *   +     '<p>{{idx}}: {{@this}}</p>'
 *   +   '{{/with}}'
 *   + '{{/each}}';
 * 
 * var context = {
 *   isValidDate: function(text) {
 *     return /^\d{4}-(0|1)\d-(0|1|2|3)\d$/.test(text);
 *   },
 *   isValidNumber: function(text) {
 *     return /^\d+$/.test(text);
 *   }
 *   title: '2019-11-25',
 *   list: ['Clean the room', 'Wash the dishes'],
 *   addOne: function(num) {
 *     return num + 1;
 *   }
 * };
 * 
 * var result = template(source, context);
 * console.log(result); // <h1>Date: 2019-11-25</h1><p>1: Clean the room</p><p>2: Wash the dishes</p>
 */
function template(text, context) {
  return compile(splitByRegExp(text, EXPRESSION_REGEXP), context);
}

module.exports = template;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is a instance of HTMLNode or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



/**
 * Check whether the given variable is a instance of HTMLNode or not.
 * If the given variables is a instance of HTMLNode, return true.
 * @param {*} html - Target for checking
 * @returns {boolean} Is HTMLNode ?
 * @memberof module:type
 */
function isHTMLNode(html) {
  if (typeof HTMLElement === 'object') {
    return (html && (html instanceof HTMLElement || !!html.nodeType));
  }

  return !!(html && html.nodeType);
}

module.exports = isHTMLNode;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Send hostname on DOMContentLoaded.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isUndefined = __webpack_require__(7);
var imagePing = __webpack_require__(42);

var ms7days = 7 * 24 * 60 * 60 * 1000;

/**
 * Check if the date has passed 7 days
 * @param {number} date - milliseconds
 * @returns {boolean}
 * @private
 */
function isExpired(date) {
  var now = new Date().getTime();

  return now - date > ms7days;
}

/**
 * Send hostname on DOMContentLoaded.
 * To prevent hostname set tui.usageStatistics to false.
 * @param {string} appName - application name
 * @param {string} trackingId - GA tracking ID
 * @ignore
 */
function sendHostname(appName, trackingId) {
  var url = 'https://www.google-analytics.com/collect';
  var hostname = location.hostname;
  var hitType = 'event';
  var eventCategory = 'use';
  var applicationKeyForStorage = 'TOAST UI ' + appName + ' for ' + hostname + ': Statistics';
  var date = window.localStorage.getItem(applicationKeyForStorage);

  // skip if the flag is defined and is set to false explicitly
  if (!isUndefined(window.tui) && window.tui.usageStatistics === false) {
    return;
  }

  // skip if not pass seven days old
  if (date && !isExpired(date)) {
    return;
  }

  window.localStorage.setItem(applicationKeyForStorage, new Date().getTime());

  setTimeout(function() {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      imagePing(url, {
        v: 1,
        t: hitType,
        tid: trackingId,
        cid: hostname,
        dp: hostname,
        dh: appName,
        el: appName,
        ec: eventCategory
      });
    }
  }, 1000);
}

module.exports = sendHostname;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Request image ping.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var forEachOwnProperties = __webpack_require__(6);

/**
 * @module request
 */

/**
 * Request image ping.
 * @param {String} url url for ping request
 * @param {Object} trackingInfo infos for make query string
 * @returns {HTMLElement}
 * @memberof module:request
 * @example
 * var imagePing = require('tui-code-snippet/request/imagePing'); // node, commonjs
 *
 * imagePing('https://www.google-analytics.com/collect', {
 *     v: 1,
 *     t: 'event',
 *     tid: 'trackingid',
 *     cid: 'cid',
 *     dp: 'dp',
 *     dh: 'dh'
 * });
 */
function imagePing(url, trackingInfo) {
  var trackingElement = document.createElement('img');
  var queryString = '';
  forEachOwnProperties(trackingInfo, function(value, key) {
    queryString += '&' + key + '=' + value;
  });
  queryString = queryString.substring(1);

  trackingElement.src = url + '?' + queryString;

  trackingElement.style.display = 'none';
  document.body.appendChild(trackingElement);
  document.body.removeChild(trackingElement);

  return trackingElement;
}

module.exports = imagePing;


/***/ }),
/* 43 */
/***/ (function(module, exports) {

/**
 * @fileoverview Set default value of options
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

/**
 * A default values for tree
 * @const
 * @type {Object}
 * @property {array} data - A data to be used on tree
 * @property {string} nodeDefaultState - Node state
 * @property {string} nodeIdPrefix - Node id prefix
 * @property {object} stateLabel - State label in node
 *  @property {string} stateLabel.opened - '-'
 *  @property {string} stateLabel.closed - '+'
 * @property {object} template - Template html for the nodes.
 *  @property {string} template.internalNode - Template html for internal node.
 *  @property {string} template.leafNode - Template html for leaf node.
 * @property {object} classNames - Class names of elements in tree
 *  @property {string} openedClass - Class name for opened node
 *  @property {string} closedClass - Class name for closed node
 *  @property {string} nodeClass - Class name for node
 *  @property {string} leafClass - Class name for leaf node
 *  @property {string} subtreeClass  - Class name for subtree in internal node
 *  @property {string} toggleBtnClass - Class name for toggle button in internal node
 *  @property {string} textClass - Class name for text element in a node
 */
module.exports = {
  data: [],
  nodeDefaultState: 'closed',
  stateLabels: {
    opened: '-',
    closed: '+'
  },
  nodeIdPrefix: 'tui-tree-node-',
  classNames: {
    nodeClass: 'tui-tree-node',
    leafClass: 'tui-tree-leaf',
    openedClass: 'tui-tree-opened',
    closedClass: 'tui-tree-closed',
    subtreeClass: 'tui-js-tree-subtree',
    toggleBtnClass: 'tui-js-tree-toggle-btn',
    textClass: 'tui-js-tree-text',
    btnClass: 'tui-tree-content-wrapper'
  },
  template: {
    internalNode:
      '<div class="tui-tree-content-wrapper">' +
      '<button type="button" class="tui-tree-toggle-btn {{toggleBtnClass}}">' +
      '<span class="tui-ico-tree"></span>' +
      '{{stateLabel}}' +
      '</button>' +
      '<span class="tui-tree-text {{textClass}}">' +
      '<span class="tui-tree-ico tui-ico-folder"></span>' +
      '{{text}}' +
      '</span>' +
      '</div>' +
      '<ul class="tui-tree-subtree {{subtreeClass}}">{{children}}</ul>',
    leafNode:
      '<div class="tui-tree-content-wrapper">' +
      '<span class="tui-tree-text {{textClass}}">' +
      '<span class="tui-tree-ico tui-ico-file"></span>' +
      '{{text}}' +
      '</span>' +
      '</div>'
  },
  indent: 23, // value of default css,
  usageStatistics: true
};


/***/ }),
/* 44 */
/***/ (function(module, exports) {

/**
 * @fileoverview Set error messages
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

/**
 * Messages for tree
 * @type {Object.<string, string>}
 */
module.exports = {
  INVALID_CONTAINER_ELEMENT: '"tui-tree": The container element is invalid.',
  INVALID_API: '"tui-tree": INVALID_API',
  INVALID_API_SELECTABLE: '"tui-tree": The feature-"Selectable" is not enabled.',
  INVALID_API_EDITABLE: '"tui-tree": The feature-"Editable" is not enabled.',
  INVALID_API_DRAGGABLE: '"tui-tree": The feature-"Draggable" is not enabled.',
  INVALID_API_CHECKBOX: '"tui-tree": The feature-"Checkbox" is not enabled.'
};


/***/ }),
/* 45 */
/***/ (function(module, exports) {

/**
 * @fileoverview Set outer template
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

/**
 * Outer template
 * @type {{internalNode: string, leafNode: string}}
 */
module.exports = {
  ROOT: '<ul class="tui-tree tui-tree-root"></ul>',
  INTERNAL_NODE: '<li id="{{id}}" class="{{nodeClass}} {{stateClass}}">{{innerTemplate}}</li>',
  LEAF_NODE: '<li id="{{id}}" class="{{nodeClass}} {{leafClass}}">{{innerTemplate}}</li>'
};


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Update view and control tree data
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var forEachArray = __webpack_require__(0);
var forEachOwnProperties = __webpack_require__(6);
var CustomEvents = __webpack_require__(18);
var defineClass = __webpack_require__(3);
var extend = __webpack_require__(1);
var isArray = __webpack_require__(2);
var util = __webpack_require__(5);

var TreeNode = __webpack_require__(47);

/**
 * Tree model
 * @class TreeModel
 * @param {Array} data - Data
 * @param {Object} options - Options for defaultState and nodeIdPrefix
 * @ignore
 */
var TreeModel = defineClass(
  /** @lends TreeModel.prototype */ {
    init: function(options) {
      TreeNode.setIdPrefix(options.nodeIdPrefix);

      /**
       * Default state of node
       * @type {String}
       */
      this.nodeDefaultState = options.nodeDefaultState;

      /**
       * Root node
       * @type {TreeNode}
       */
      this.rootNode = new TreeNode(
        {
          state: 'opened'
        },
        null
      );

      /**
       * Tree hash having all nodes
       * @type {object.<string, TreeNode>}
       */
      this.treeHash = {};

      this._setData(options.data);
    },

    /**
     * Return prefix of node id
     * @returns {string} Prefix
     */
    getNodeIdPrefix: function() {
      return TreeNode.idPrefix;
    },

    /**
     * Set model with tree data
     * @param {Array} data - Tree data
     */
    _setData: function(data) {
      var root = this.rootNode;
      var rootId = root.getId();

      this.treeHash[rootId] = root;
      this._makeTreeHash(data, root);
    },

    /**
     * Make tree hash from data and parentNode
     * @param {Array} data - Tree data
     * @param {TreeNode} parent - Parent node id
     * @returns {Array.<string>} Added node ids
     * @private
     */
    _makeTreeHash: function(data, parent) {
      var parentId = parent.getId();
      var ids = [];

      forEachArray(
        data || [],
        function(datum) {
          var childrenData = datum.children;
          var node = this._createNode(datum, parentId);
          var nodeId = node.getId();

          ids.push(nodeId);
          this.treeHash[nodeId] = node;
          parent.addChildId(nodeId);
          this._makeTreeHash(childrenData, node);
        },
        this
      );

      return ids;
    },

    /**
     * Create node
     * @param {object} nodeData - Datum of node
     * @param {string} parentId - Parent id
     * @returns {TreeNode} TreeNode
     */
    _createNode: function(nodeData, parentId) {
      nodeData = extend(
        {
          state: this.nodeDefaultState
        },
        nodeData
      );

      return new TreeNode(nodeData, parentId);
    },

    /**
     * Get children
     * @param {string} nodeId - Node id
     * @returns {?Array.<TreeNode>} children
     */
    getChildren: function(nodeId) {
      var childIds = this.getChildIds(nodeId);

      if (!childIds) {
        return null;
      }

      return util.map(
        childIds,
        function(childId) {
          return this.getNode(childId);
        },
        this
      );
    },

    /**
     * Get child ids
     * @param {string} nodeId - Node id
     * @returns {?Array.<string>} Child ids
     */
    getChildIds: function(nodeId) {
      var node = this.getNode(nodeId);

      if (!node) {
        return null;
      }

      return node.getChildIds();
    },

    /**
     * Get the number of nodes
     * @returns {number} The number of nodes
     */
    getCount: function() {
      var treeHash = this.treeHash;
      var length = 0;

      forEachOwnProperties(treeHash, function() {
        length += 1;
      });

      return length;
    },

    /**
     * Get last depth
     * @returns {number} The last depth
     */
    getLastDepth: function() {
      var depths = util.map(
        this.treeHash,
        function(node) {
          return this.getDepth(node.getId());
        },
        this
      );

      return Math.max.apply(null, depths);
    },

    /**
     * Find node
     * @param {string} id - A node id to find
     * @returns {?TreeNode} Node
     */
    getNode: function(id) {
      return this.treeHash[id];
    },

    /**
     * Get depth from node id
     * @param {string} id - A node id to find
     * @returns {?number} Depth
     */
    getDepth: function(id) {
      var node = this.getNode(id);
      var depth = 0;
      var parent;

      if (!node) {
        return null;
      }

      parent = this.getNode(node.getParentId());
      while (parent) {
        depth += 1;
        parent = this.getNode(parent.getParentId());
      }

      return depth;
    },

    /**
     * Return parent id of node
     * @param {string} id - Node id
     * @returns {?string} Parent id
     */
    getParentId: function(id) {
      var node = this.getNode(id);

      if (!node) {
        return null;
      }

      return node.getParentId();
    },
    /**
     * Return parents ids of node
     * @param {string} id - Node id
     * @returns {Array.<string>} Parents node ids
     */
    getParentIds: function(id) {
      var parentsNodeList = [];
      var node = this.getNode(id);
      var parentNodeId = node.getParentId();

      while (parentNodeId) {
        node = this.getNode(parentNodeId);
        parentNodeId = node.getParentId();
        parentsNodeList.push(node);
      }

      return util.map(parentsNodeList, function(parentsNode) {
        return parentsNode.getId();
      });
    },
    /**
     * Remove a node with children.
     * - The update event will be fired with parent node.
     * @param {string} id - Node id to remove
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    remove: function(id, isSilent) {
      var node = this.getNode(id);
      var parent;

      if (!node) {
        return;
      }

      parent = this.getNode(node.getParentId());

      forEachArray(
        node.getChildIds(),
        function(childId) {
          this.remove(childId, true);
        },
        this
      );

      parent.removeChildId(id);
      delete this.treeHash[id];

      if (!isSilent) {
        this.fire('update', parent.getId());
      }
    },

    /**
     * Add node(s).
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - The update event will be fired with parent node.
     * @param {Array|object} data - Raw-data
     * @param {string} parentId - Parent id
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     * @returns {Array.<string>} New added node ids
     */
    add: function(data, parentId, isSilent) {
      var parent = this.getNode(parentId) || this.rootNode;
      var ids;

      data = [].concat(data);
      ids = this._makeTreeHash(data, parent);

      if (!isSilent) {
        this.fire('update', parent.getId());
      }

      return ids;
    },

    /**
     * Set data properties of a node
     * @param {string} id - Node id
     * @param {object} props - Properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    setNodeData: function(id, props, isSilent) {
      var node = this.getNode(id);

      if (!node || !props) {
        return;
      }

      node.setData(props);

      if (!isSilent) {
        this.fire('update', id);
      }
    },

    /**
     * Remove node data
     * @param {string} id - Node id
     * @param {string|Array} names - Names of properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    removeNodeData: function(id, names, isSilent) {
      var node = this.getNode(id);

      if (!node || !names) {
        return;
      }

      if (isArray(names)) {
        node.removeData.apply(node, names);
      } else {
        node.removeData(names);
      }

      if (!isSilent) {
        this.fire('update', id);
      }
    },

    /**
     * Move a node to new parent's child
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {number} [index] - Start index number for inserting
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    /* eslint-disable complexity*/
    move: function(nodeId, newParentId, index, isSilent) {
      var node = this.getNode(nodeId);
      var originalParentId, newParent, sameParent;

      if (!node) {
        return;
      }

      newParent = this.getNode(newParentId) || this.rootNode;
      newParentId = newParent.getId();
      originalParentId = node.getParentId();
      sameParent = index === -1 && originalParentId === newParentId;

      if (nodeId === newParentId || sameParent || this.contains(nodeId, newParentId)) {
        return;
      }

      this._changeOrderOfIds(nodeId, newParentId, originalParentId, index);

      if (!isSilent) {
        this.fire('move', nodeId, originalParentId, newParentId, index);
      }
    } /* eslint-enable complexity*/,

    /**
     * Change order of ids
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {string} originalParentId - Original parent id
     * @param {number} index - Moving index (When child node is moved on parent node, the value is -1)
     * @private
     */
    _changeOrderOfIds: function(nodeId, newParentId, originalParentId, index) {
      var node = this.getNode(nodeId);
      var newParent = this.getNode(newParentId) || this.rootNode;
      var originalParent = this.getNode(originalParentId);
      var isSameParentIds = newParentId === originalParentId;

      if (index !== -1) {
        if (isSameParentIds) {
          newParent.moveChildId(nodeId, index);
        } else {
          newParent.insertChildId(nodeId, index);
          originalParent.removeChildId(nodeId);
        }
      } else if (!isSameParentIds) {
        newParent.addChildId(nodeId);
        originalParent.removeChildId(nodeId);
      }

      node.setParentId(newParentId);
    },

    /**
     * Whether a node is a ancestor of another node.
     * @param {string} containerId - Id of a node that may contain the other node
     * @param {string} containedId - Id of a node that may be contained by the other node
     * @returns {boolean} Whether a node contains another node
     */
    contains: function(containerId, containedId) {
      var parentId = this.getParentId(containedId);
      var isContained = false;

      while (!isContained && parentId) {
        isContained = containerId === parentId;
        parentId = this.getParentId(parentId);
      }

      return isContained;
    },

    /**
     * Sort nodes
     * @param {Function} comparator - Comparator function
     * @param {string} [parentId] - Id of a node to sort partially
     */
    sort: function(comparator, parentId) {
      var iteratee = function(node, nodeId) {
        var children = this.getChildren(nodeId);
        var childIds;

        if (children.length > 1) {
          children.sort(comparator);

          childIds = util.map(children, function(child) {
            return child.getId();
          });
          node.replaceChildIds(childIds);
        }
      };
      var node;

      if (parentId) {
        node = this.getNode(parentId);
        iteratee.call(this, node, parentId);
      } else {
        this.eachAll(iteratee, this);
      }
    },

    /**
     * Get node data (all)
     * @param {string} nodeId - Node id
     * @returns {?object} Node data
     */
    getNodeData: function(nodeId) {
      var node = this.getNode(nodeId);

      if (!node) {
        return null;
      }

      return node.getAllData();
    },

    /**
     * Traverse this tree iterating over all nodes.
     * @param {Function} iteratee - Iteratee function
     * @param {object} [context] - Context of iteratee
     */
    eachAll: function(iteratee, context) {
      context = context || this;

      forEachOwnProperties(this.treeHash, function() {
        iteratee.apply(context, arguments);
      });
    },

    /**
     * Traverse this tree iterating over all descendants of a node.
     * @param {Function} iteratee - Iteratee function
     * @param {string} parentId - Parent node id
     * @param {object} [context] - Context of iteratee
     */
    each: function(iteratee, parentId, context) {
      // depth-first
      var stack, nodeId, node;

      node = this.getNode(parentId);
      if (!node) {
        return;
      }
      stack = node.getChildIds();

      context = context || this;
      while (stack.length) {
        nodeId = stack.pop();
        node = this.getNode(nodeId);
        iteratee.call(context, node, nodeId);

        stack = stack.concat(node.getChildIds());
      }
    }
  }
);

CustomEvents.mixin(TreeModel);
module.exports = TreeModel;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Control each tree node's data
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var inArray = __webpack_require__(4);
var forEachArray = __webpack_require__(0);
var forEachOwnProperties = __webpack_require__(6);
var defineClass = __webpack_require__(3);
var extend = __webpack_require__(1);
var isFalsy = __webpack_require__(48);

var states = __webpack_require__(20).node;
var util = __webpack_require__(5);

var lastIndex = 0;
var getNextIndex = function() {
  var index = lastIndex;
  lastIndex += 1;

  return index;
};
var RESERVED_PROPERTIES = {
  id: '',
  state: 'setState',
  children: ''
};

/**
 * TreeNode
 * @Class TreeNode
 * @param {Object} nodeData - Node data
 * @param {string} [parentId] - Parent node id
 * @ignore
 */
var TreeNode = defineClass(
  /** @lends TreeNode.prototype */ {
    static: {
      /**
       * Set prefix of id
       * @param {string} prefix - Prefix of id
       */
      setIdPrefix: function(prefix) {
        this.idPrefix = prefix || this.idPrefix;
      },

      /**
       * Prefix of id
       * @type {string}
       */
      idPrefix: ''
    },
    init: function(nodeData, parentId) {
      /**
       * Node id
       * @type {string}
       * @private
       */
      this._id = this.constructor.idPrefix + getNextIndex();

      /**
       * Parent node id
       * @type {string}
       * @private
       */
      this._parentId = parentId;

      /**
       * Id list of children
       * @type {Array.<number>}
       * @private
       */
      this._childIds = [];

      /**
       * Node data
       * @type {object}
       * @private
       */
      this._data = {};

      /**
       * Node state
       * @type {string}
       * @private
       */
      this._state = states.CLOSED;

      this.setData(nodeData);
    },

    /**
     * Set reserved properties from data
     * @param {object} data - Node data
     * @returns {object} Node data
     * @private
     */
    _setReservedProperties: function(data) {
      forEachOwnProperties(
        RESERVED_PROPERTIES,
        function(setter, name) {
          var value = data[name];

          if (value && setter) {
            this[setter](value);
          }
          delete data[name];
        },
        this
      );

      return data;
    },

    /**
     * Toggle state
     */
    toggleState: function() {
      if (this._state === states.CLOSED) {
        this._state = states.OPENED;
      } else {
        this._state = states.CLOSED;
      }
    },

    /**
     * Set state
     * @param {string} state - State of node ('closed', 'opened')
     */
    setState: function(state) {
      state = String(state);
      this._state = states[state.toUpperCase()] || this._state;
    },

    /**
     * Get state
     * @returns {string} state ('opened' or 'closed')
     */
    getState: function() {
      return this._state;
    },

    /**
     * Get id
     * @returns {string} Node id
     */
    getId: function() {
      return this._id;
    },

    /**
     * Get parent id
     * @returns {string} Parent node id
     */
    getParentId: function() {
      return this._parentId;
    },

    /**
     * Set parent id
     * @param {string} parentId - Parent node id
     */
    setParentId: function(parentId) {
      this._parentId = parentId;
    },

    /**
     * Replace childIds
     * @param {Array.<number>} childIds - Id list of children
     */
    replaceChildIds: function(childIds) {
      this._childIds = childIds;
    },

    /**
     * Get id list of children
     * @returns {Array.<number>} Id list of children
     */
    getChildIds: function() {
      return this._childIds.slice();
    },

    /**
     * Add child id
     * @param {string} id - Child node id
     */
    addChildId: function(id) {
      var childIds = this._childIds;

      if (inArray(childIds, id) === -1) {
        childIds.push(id);
      }
    },

    /**
     * Remove child id
     * @param {string} id - Child node id
     */
    removeChildId: function(id) {
      util.removeItemFromArray(id, this._childIds);
    },

    /**
     * Get data
     * @param {string} name - Property name of data
     * @returns {*} Data
     */
    getData: function(name) {
      return this._data[name];
    },

    /**
     * Get all data
     * @returns {Object} Data
     */
    getAllData: function() {
      return extend({}, this._data);
    },

    /**
     * Set data
     * @param {Object} data - Data for adding
     */
    setData: function(data) {
      data = this._setReservedProperties(data);
      extend(this._data, data);
    },

    /**
     * Remove data
     * @param {...string} names - Names of data
     */
    removeData: function() {
      forEachArray(
        arguments,
        function(name) {
          delete this._data[name];
        },
        this
      );
    },

    /**
     * Return true if this node has a provided child id.
     * @param {string} id - Node id
     * @returns {boolean} - Whether this node has a provided child id.
     */
    hasChild: function(id) {
      return inArray(id, this._childIds) !== -1;
    },

    /**
     * Return whether this node is leaf.
     * @returns {boolean} Node is leaf or not.
     */
    isLeaf: function() {
      return !this._childIds.length && !this.getData('hasChild');
    },

    /**
     * Return whether this node is root.
     * @returns {boolean} Node is root or not.
     */
    isRoot: function() {
      return isFalsy(this._parentId);
    },

    /**
     * Get index of child
     * @param {string} id - Node id
     * @returns {number} Index of child in children list
     */
    getChildIndex: function(id) {
      return inArray(id, this._childIds);
    },

    /**
     * Insert child id
     * @param {string} id - Child node id
     * @param {number} index - Index number of insert position
     */
    insertChildId: function(id, index) {
      var childIds = this._childIds;

      if (inArray(id, childIds) === -1) {
        childIds.splice(index, 0, id);
      }
    },

    /**
     * Move child id
     * @param {string} id - Child node id
     * @param {number} index - Index number of insert position
     */
    moveChildId: function(id, index) {
      var childIds = this._childIds;
      var originIdx = this.getChildIndex(id);

      if (inArray(id, childIds) !== -1) {
        if (originIdx < index) {
          index -= 1;
        }

        childIds.splice(index, 0, childIds.splice(originIdx, 1)[0]);
      }
    }
  }
);
module.exports = TreeNode;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is falsy or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isTruthy = __webpack_require__(49);

/**
 * Check whether the given variable is falsy or not.
 * If the given variable is null or undefined or false, returns true.
 * @param {*} obj - Target for checking
 * @returns {boolean} Is falsy?
 * @memberof module:type
 */
function isFalsy(obj) {
  return !isTruthy(obj);
}

module.exports = isFalsy;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is truthy or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isExisty = __webpack_require__(16);

/**
 * Check whether the given variable is truthy or not.
 * If the given variable is not null or not undefined or not false, returns true.
 * (It regards 0 as true)
 * @param {*} obj - Target for checking
 * @returns {boolean} Is truthy?
 * @memberof module:type
 */
function isTruthy(obj) {
  return isExisty(obj) && obj !== false;
}

module.exports = isTruthy;


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Feature that each tree node is possible to select as click
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var forEachArray = __webpack_require__(0);
var defineClass = __webpack_require__(3);
var getTarget = __webpack_require__(10);
var addClass = __webpack_require__(15);
var removeClass = __webpack_require__(17);
var extend = __webpack_require__(1);
var util = __webpack_require__(5);

var API_LIST = ['select', 'getSelectedNodeId', 'deselect'];
var defaults = {
  selectedClassName: 'tui-tree-selected'
};

/**
 * Set the tree selectable
 * @class Selectable
 * @param {Tree} tree - Tree
 * @param {Object} options
 *  @param {string} options.selectedClassName - Classname for selected node.
 * @ignore
 */
var Selectable = defineClass(
  /** @lends Selectable.prototype */ {
    static: {
      /**
       * @static
       * @memberof Selectable
       * @returns {Array.<string>} API list of Selectable
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },
    init: function(tree, options) {
      options = extend({}, defaults, options);

      this.tree = tree;
      this.selectedClassName = options.selectedClassName;
      this.selectedNodeId = null;

      tree.on(
        {
          singleClick: this.onSingleClick,
          afterDraw: this.onAfterDraw
        },
        this
      );
      this._setAPIs();
    },

    /**
     * Set apis of selectable tree
     * @private
     */
    _setAPIs: function() {
      var tree = this.tree;

      forEachArray(
        API_LIST,
        function(apiName) {
          tree[apiName] = util.bind(this[apiName], this);
        },
        this
      );
    },

    /**
     * Disable this module
     */
    destroy: function() {
      var tree = this.tree;
      var nodeElement = this.getPrevElement();

      if (nodeElement) {
        removeClass(nodeElement, this.selectedClassName);
      }
      tree.off(this);
      forEachArray(API_LIST, function(apiName) {
        delete tree[apiName];
      });
    },

    /**
     * Custom event handler "singleClick"
     * @param {MouseEvent} event - Mouse event
     */
    onSingleClick: function(event) {
      var target = getTarget(event);
      var nodeId = this.tree.getNodeIdFromElement(target);

      this._select(nodeId, target);
    },

    /**
     * Select node if the feature-"Selectable" is enabled.
     * @memberof Tree.prototype
     * @requires Selectable
     * @param {string} nodeId - Node id
     * @param {object} [target] - target
     * @private
     */
    _select: function(nodeId, target) {
      var tree, root, prevElement, nodeElement, selectedClassName, prevNodeId, invokeResult;

      if (!nodeId) {
        return;
      }

      tree = this.tree;
      root = tree.rootElement;
      selectedClassName = this.selectedClassName;
      prevNodeId = this.selectedNodeId;

      /**
       * @event Tree#beforeSelect
       * @type {object} evt - Event data
       * @property {string} nodeId - Selected node id
       * @property {string} prevNodeId - Previous selected node id
       * @property {HTMLElement|undefined} target - Target element
       * @example
       * tree
       *  .enableFeature('Selectable')
       *  .on('beforeSelect', function(evt) {
       *      console.log('selected node: ' + evt.nodeId);
       *      console.log('previous selected node: ' + evt.prevNodeId);
       *      console.log('target element: ' + evt.target);
       *      return false; // It cancels "select"
       *      // return true; // It fires "select"
       *  });
       */
      invokeResult = tree.invoke('beforeSelect', {
        nodeId: nodeId,
        prevNodeId: prevNodeId,
        target: target
      });

      prevElement = this.getPrevElement();
      nodeElement = root.querySelector('#' + nodeId);

      if (invokeResult) {
        if (prevElement) {
          removeClass(prevElement, selectedClassName);
        }
        addClass(nodeElement, selectedClassName);
        this.selectedNodeId = nodeId;

        /**
         * @event Tree#select
         * @type {object} evt - Event data
         * @property {string} nodeId - Selected node id
         * @property {string} prevNodeId - Previous selected node id
         * @property {HTMLElement|undefined} target - Target element
         * @example
         * tree
         *  .enableFeature('Selectable')
         *  .on('select', function(evt) {
         *      console.log('selected node: ' + evt.nodeId);
         *      console.log('previous selected node: ' + evt.prevNodeId);
         *      console.log('target element: ' + evt.target);
         *  });
         */
        tree.fire('select', {
          nodeId: nodeId,
          prevNodeId: prevNodeId,
          target: target
        });
      }
    },

    /**
     * Select node if the feature-"Selectable" is enabled.
     * @memberof Tree.prototype
     * @requires Selectable
     * @param {string} nodeId - Node id
     * @example
     * tree.select('tui-tree-node-3');
     */
    select: function(nodeId) {
      this._select(nodeId);
    },

    /**
     * Get previous selected node element
     * @returns {HTMLElement} Node element
     */
    getPrevElement: function() {
      return document.getElementById(this.selectedNodeId);
    },

    /**
     * Get selected node id
     * @memberof Tree.prototype
     * @returns {string} selected node id
     */
    getSelectedNodeId: function() {
      return this.selectedNodeId;
    },

    /**
     * Deselect node by id
     * @memberof Tree.prototype
     * @requires Selectable
     * @param {string} nodeId - Node id
     * @example
     * tree.deselect('tui-tree-node-3');
     */
    deselect: function() {
      var nodeId = this.selectedNodeId;
      var nodeElement = document.getElementById(nodeId);
      var tree = this.tree;

      if (!nodeElement) {
        return;
      }

      removeClass(nodeElement, this.selectedClassName);
      this.selectedNodeId = null;

      /**
       * @event Tree#deselect
       * @type {object} evt - Event data
       * @property {string} nodeId - Deselected node id
       * @example
       * tree
       *  .enableFeature('Selectable')
       *  .on('deselect', function(evt) {
       *      console.log('deselected node: ' + evt.nodeId);
       *  });
       */
      tree.fire('deselect', { nodeId: nodeId });
    },

    /**
     * Custom event handler - "afterDraw"
     */
    onAfterDraw: function() {
      var nodeElement = this.getPrevElement();

      if (nodeElement) {
        addClass(nodeElement, this.selectedClassName);
      }
    }
  }
);

module.exports = Selectable;


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Feature that each tree node is possible to drag and drop
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var inArray = __webpack_require__(4);
var forEachArray = __webpack_require__(0);
var defineClass = __webpack_require__(3);
var getMouseButton = __webpack_require__(24);
var getMousePosition = __webpack_require__(52);
var getTarget = __webpack_require__(10);
var off = __webpack_require__(13);
var on = __webpack_require__(14);
var preventDefault = __webpack_require__(21);
var addClass = __webpack_require__(15);
var disableTextSelection = __webpack_require__(28);
var enableTextSelection = __webpack_require__(30);
var hasClass = __webpack_require__(31);
var removeClass = __webpack_require__(17);
var removeElement = __webpack_require__(32);
var extend = __webpack_require__(1);

var defaultOptions = {
  useHelper: true,
  helperPos: {
    y: 2,
    x: 5
  },
  helperClassName: 'tui-tree-drop',
  dragItemClassName: 'tui-tree-drag',
  hoverClassName: 'tui-tree-hover',
  lineClassName: 'tui-tree-line',
  lineBoundary: {
    top: 4,
    bottom: 4
  },
  autoOpenDelay: 1500,
  isSortable: false
};
var rejectedTagNames = ['INPUT', 'BUTTON', 'UL'];
var API_LIST = [];

/**
 * Set the tree draggable
 * @class Draggable
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *     @param {boolean} options.useHelper - Using helper flag
 *     @param {{x: number, y:number}} options.helperPos - Helper position (each minimum value is 4)
 *     @param {Array.<string>} options.rejectedTagNames - No draggable tag names
 *     @param {Array.<string>} options.rejectedClassNames - No draggable class names
 *     @param {number} options.autoOpenDelay - Delay time while dragging to be opened
 *     @param {boolean} options.isSortable - Flag of whether using sortable dragging
 *     @param {string} options.hoverClassName - Class name for hovered node
 *     @param {string} options.lineClassName - Class name for moving position line
 *     @param {string} options.helperClassName - Class name for helper's outer element
 *     @param {string} options.helperTemplate - Template string for helper's inner contents
 *     @param {{top: number, bottom: number}} options.lineBoundary - Boundary value for visible moving line
 * @ignore
 */
var Draggable = defineClass(
  /** @lends Draggable.prototype */ {
    static: {
      /**
       * @static
       * @memberof Draggable
       * @returns {Array.<string>} API list of Draggable
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },

    init: function(tree, options) {
      options = extend({}, defaultOptions, options);

      /**
       * Tree data
       * @type {Tree}
       */
      this.tree = tree;

      /**
       * Drag helper element
       * @type {HTMLElement}
       */
      this.helperElement = null;

      /**
       * Dragging element's node id
       * @type {string}
       */
      this.currentNodeId = null;

      /**
       * Current mouse overed element
       * @type {HTMLElement}
       */
      this.hoveredElement = null;

      /**
       * Moving line type ("top" or "bottom")
       * @type {string}
       */
      this.movingLineType = null;

      /**
       * Invoking time for setTimeout()
       * @type {number}
       */
      this.timer = null;

      /**
       * Last mouse hovered nodeId
       * @type {string | null}
       */
      this.lastHoverNodeId = null;

      /**
       * Tag list for rejecting to drag
       * @param {Array.<string>}
       */
      this.rejectedTagNames = rejectedTagNames.concat(options.rejectedTagNames);

      /**
       * Class name list for rejecting to drag
       * @param {Array.<string>}
       */
      this.rejectedClassNames = [].concat(options.rejectedClassNames);

      /**
       * Using helper flag
       * @type {boolean}
       */
      this.useHelper = options.useHelper;

      /**
       * Helper position
       * @type {Object}
       */
      this.helperPos = options.helperPos;

      /**
       * Delay time while dragging to be opened
       * @type {number}
       */
      this.autoOpenDelay = options.autoOpenDelay;

      /**
       * Flag of whether using sortable dragging
       * @type {boolean}
       */
      this.isSortable = options.isSortable;

      /**
       * Class name for mouse overed node
       * @type {string}
       */
      this.hoverClassName = options.hoverClassName;

      /**
       * Class name for moving position line
       * @type {string}
       */
      this.lineClassName = options.lineClassName;

      /**
       * Boundary value for visible moving line
       * @type {Object}
       */
      this.lineBoundary = options.lineBoundary;

      /**
       * Helper's outer element class name
       * @type {string}
       */
      this.helperClassName = options.helperClassName;

      this._initHelper();

      if (this.isSortable) {
        this._initMovingLine();
      }

      this._attachMousedown();
    },

    /**
     * Disable this module (remove attached elements and unbind event)
     */
    destroy: function() {
      removeElement(this.helperElement);
      removeElement(this.lineElement);

      this._restoreTextSelection();
      this._detachMousedown();
    },

    /**
     * Change helper element position
     * @param {object} mousePos - Current mouse position
     * @private
     */
    _changeHelperPosition: function(mousePos) {
      var mousePosX = mousePos[0];
      var mousePosY = mousePos[1];
      var helperStyle = this.helperElement.style;

      helperStyle.top = mousePosY + window.pageYOffset + this.helperPos.y + 'px';
      helperStyle.left = mousePosX + window.pageXOffset + this.helperPos.x + 'px';
      helperStyle.display = '';
    },

    /**
     * Init helper element
     * @private
     */
    _initHelper: function() {
      var helperElement = document.createElement('span');
      var helperStyle = helperElement.style;

      helperStyle.position = 'absolute';
      helperStyle.display = 'none';

      addClass(helperElement, this.helperClassName);

      this.tree.rootElement.parentNode.appendChild(helperElement);

      this.helperElement = helperElement;
    },

    /**
     * Init moving line element
     * @private
     */
    _initMovingLine: function() {
      var lineElement = document.createElement('div');
      var lineStyle = lineElement.style;

      lineStyle.position = 'absolute';
      lineStyle.display = 'none';

      addClass(lineElement, this.lineClassName);

      this.tree.rootElement.parentNode.appendChild(lineElement);

      this.lineElement = lineElement;
    },

    /**
     * Set helper contents
     * @param {string} contents - Helper contents
     * @private
     */
    _setHelper: function(contents) {
      this.helperElement.innerHTML = contents;
      removeElement(this.helperElement.getElementsByTagName('label')[0]);
    },

    /**
     * Attach mouse down event
     * @private
     */
    _attachMousedown: function() {
      this._preventTextSelection();
      this.tree.on('mousedown', this._onMousedown, this);
    },

    /**
     * Detach mousedown event
     * @private
     */
    _detachMousedown: function() {
      this.tree.off(this);
    },

    /**
     * Prevent text-selection
     * @private
     */
    _preventTextSelection: function() {
      on(this.tree.rootElement, 'selectstart', preventDefault);
      disableTextSelection(this.tree.rootElement);
    },

    /**
     * Restore text-selection
     * @private
     */
    _restoreTextSelection: function() {
      off(this.tree.rootElement, 'selectstart', preventDefault);
      enableTextSelection(this.tree.rootElement);
    },

    /**
     * Return whether the target element is in rejectedTagNames or in rejectedClassNames
     * @param {HTMLElement} target - Target element
     * @returns {boolean} Whether the target is not draggable or draggable
     * @private
     */
    _isNotDraggable: function(target) {
      var tagName = target.tagName.toUpperCase();
      var classNames = target.className.split(/\s+/);
      var result;

      if (inArray(tagName, this.rejectedTagNames) !== -1) {
        return true;
      }

      forEachArray(
        classNames,
        function(className) {
          result = inArray(className, this.rejectedClassNames) !== -1;

          return !result;
        },
        this
      );

      return result;
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMousedown: function(event) {
      var tree = this.tree;
      var target = getTarget(event);
      var isRightButton = getMouseButton(event) === 2;
      var isEditing = tree.enabledFeatures.Editable && tree.enabledFeatures.Editable.inputElement;
      var nodeElement;

      if (isRightButton || this._isNotDraggable(target) || isEditing) {
        return;
      }

      preventDefault(event);

      this.currentNodeId = tree.getNodeIdFromElement(target);

      if (this.useHelper) {
        nodeElement = document.querySelector(
          '#' + this.currentNodeId + ' .' + tree.classNames.textClass
        );
        this._setHelper(nodeElement.innerHTML);
      }

      tree.on(
        {
          mousemove: this._onMousemove,
          mouseup: this._onMouseup
        },
        this
      );
    },

    /**
     * Event handler - mousemove
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMousemove: function(event) {
      var mousePos = getMousePosition(event);
      var target = getTarget(event);
      var nodeId;

      if (!this.useHelper) {
        return;
      }

      this._setClassNameOnDragItem('add');
      this._changeHelperPosition(mousePos);

      nodeId = this.tree.getNodeIdFromElement(target);
      if (nodeId) {
        this.lastHoverNodeId = nodeId;
        this._applyMoveAction(nodeId, mousePos);
      }
    },

    /**
     * Event handler - mouseup
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMouseup: function(event) {
      var tree = this.tree;
      var nodeId = this.currentNodeId;
      var target = getTarget(event);
      var targetId = this._getTargetNodeId(target);
      var index = this._getIndexToInsert(targetId);
      var newParentId;

      if (index === -1) {
        // When the node is created as a child after moving
        newParentId = targetId;
      } else {
        newParentId = tree.getParentId(targetId);
      }

      if (nodeId !== newParentId) {
        // Don't fire beforeMove event
        tree.move(nodeId, newParentId, index);
      }

      this.lastHoverNodeId = null;
      this._reset();
    },

    /**
     * Get id of the target element on which the moved item is placed
     * @param {HTMLElement} target - Target element
     * @returns {string} Id of target element
     * @private
     */
    _getTargetNodeId: function(target) {
      var tree = this.tree;
      var movingType = this.movingLineType;
      var nodeId = tree.getNodeIdFromElement(target);
      var childIds;

      if (nodeId) {
        return nodeId;
      }

      childIds = tree.getChildIds(tree.getRootNodeId());

      if (movingType === 'top') {
        nodeId = childIds[0];
      } else {
        nodeId = childIds[childIds.length - 1];
      }

      if (this._isGuideLineElement(target)) {
        nodeId = this.lastHoverNodeId;
      }

      return nodeId;
    },

    /**
     * Get a index number to insert the moved item
     * @param {number} nodeId - Id of moved item
     * @returns {number} Index number
     * @private
     */
    _getIndexToInsert: function(nodeId) {
      var movingType = this.movingLineType;
      var index;

      if (!movingType) {
        return -1;
      }

      index = this.tree.getNodeIndex(nodeId);

      if (movingType === 'bottom') {
        index += 1;
      }

      return index;
    },

    /**
     * Apply move action that are delay effect and sortable moving node
     * @param {string} nodeId - Selected tree node id
     * @param {object} mousePos - Current mouse position
     * @private
     */
    _applyMoveAction: function(nodeId, mousePos) {
      var currentElement = document.getElementById(nodeId);
      var targetPos = currentElement.getBoundingClientRect();
      var isHover = hasClass(currentElement, this.hoverClassName);
      var isContain = this._isContain(targetPos, mousePos);
      var boundaryType;

      if (!this.hoveredElement && isContain) {
        this.hoveredElement = currentElement;
        this._hover(nodeId);
      } else if (!isHover) {
        this._unhover();
      } else if (!isContain) {
        this._unhover();
      }

      if (this.isSortable) {
        boundaryType = this._getBoundaryType(targetPos, mousePos);
        this._drawBoundaryLine(targetPos, boundaryType);
      }
    },

    /**
     * Act to hover on tree item
     * @param {string} nodeId - Tree node id
     * @private
     */
    _hover: function(nodeId) {
      var tree = this.tree;

      addClass(this.hoveredElement, this.hoverClassName);

      if (tree.isLeaf(nodeId)) {
        return;
      }

      this.timer = setTimeout(function() {
        tree.open(nodeId);
      }, this.autoOpenDelay);
    },

    /**
     * Act to unhover on tree item
     * @private
     */
    _unhover: function() {
      clearTimeout(this.timer);

      if (this.hoveredElement) {
        removeClass(this.hoveredElement, this.hoverClassName);
      }

      this.hoveredElement = null;
      this.timer = null;
    },

    /**
     * Check contained state of current target
     * @param {object} targetPos - Position of tree item
     * @param {object} mousePos - Position of moved mouse
     * @returns {boolean} Contained state
     * @private
     */
    _isContain: function(targetPos, mousePos) {
      var top = targetPos.top;
      var bottom = targetPos.bottom;
      var mousePosX = mousePos[0];
      var mousePosY = mousePos[1];

      if (this.isSortable) {
        top += this.lineBoundary.top;
        bottom -= this.lineBoundary.bottom;
      }

      return (
        targetPos.left < mousePosX &&
        targetPos.right > mousePosX &&
        top < mousePosY &&
        bottom > mousePosY
      );
    },

    /**
     * Get boundary type by mouse position
     * @param {object} targetPos - Position of tree item
     * @param {object} mousePos - Position of moved mouse
     * @returns {string} Position type in boundary
     * @private
     */
    _getBoundaryType: function(targetPos, mousePos) {
      var type;

      if (mousePos[1] < targetPos.top + this.lineBoundary.top) {
        type = 'top';
      } else if (mousePos[1] > targetPos.bottom - this.lineBoundary.bottom) {
        type = 'bottom';
      }

      return type;
    },

    /**
     * Draw boundary line on tree
     * @param {object} targetPos - Position of tree item
     * @param {string} boundaryType - Position type in boundary
     * @private
     */
    _drawBoundaryLine: function(targetPos, boundaryType) {
      var style = this.lineElement.style;
      var parentNodeOfRoot = this.tree.rootElement.parentNode;
      var scrollTop;

      if (boundaryType) {
        scrollTop = parentNodeOfRoot.getBoundingClientRect().top - parentNodeOfRoot.offsetTop;
        style.top = targetPos[boundaryType] - scrollTop + 'px';
        style.display = 'block';
        this.movingLineType = boundaryType;
      } else {
        style.display = 'none';
        this.movingLineType = null;
      }
    },

    /**
     * _reset properties and remove event
     * @private
     */
    _reset: function() {
      if (this.isSortable) {
        this.lineElement.style.display = 'none';
      }

      if (this.hoveredElement) {
        removeClass(this.hoveredElement, this.hoverClassName);
        this.hoveredElement = null;
      }

      this._setClassNameOnDragItem('remove');

      this.helperElement.style.display = 'none';

      this.currentNodeId = null;
      this.movingLineType = null;

      this.tree.off(this, 'mousemove');
      this.tree.off(this, 'mouseup');
    },

    /**
     * Set class name on drag item's element
     * @param {string} type - Set type ('add' or 'remove')
     */
    _setClassNameOnDragItem: function(type) {
      var dragItemElement = document.getElementById(this.currentNodeId);
      var dragItemClassName = defaultOptions.dragItemClassName;

      if (dragItemElement) {
        if (type === 'add') {
          addClass(dragItemElement, dragItemClassName);
        } else {
          removeClass(dragItemElement, dragItemClassName);
        }
      }
    },

    /**
     * Check if an element is a GuideLineElement
     * @param {HTMLElement} element - target element
     * @returns {boolean}
     * @private
     */
    _isGuideLineElement: function(element) {
      return element && hasClass(element, this.lineClassName);
    }
  }
);

module.exports = Draggable;


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Get mouse position from mouse event
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isArray = __webpack_require__(2);

/**
 * Get mouse position from mouse event
 *
 * If supplied relatveElement parameter then return relative position based on
 *  element
 * @param {(MouseEvent|object|number[])} position - mouse position object
 * @param {HTMLElement} relativeElement HTML element that calculate relative
 *  position
 * @returns {number[]} mouse position
 * @memberof module:domEvent
 */
function getMousePosition(position, relativeElement) {
  var positionArray = isArray(position);
  var clientX = positionArray ? position[0] : position.clientX;
  var clientY = positionArray ? position[1] : position.clientY;
  var rect;

  if (!relativeElement) {
    return [clientX, clientY];
  }

  rect = relativeElement.getBoundingClientRect();

  return [
    clientX - rect.left - relativeElement.clientLeft,
    clientY - rect.top - relativeElement.clientTop
  ];
}

module.exports = getMousePosition;


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Set data attribute to target element
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var convertToKebabCase = __webpack_require__(22);

/**
 * Set data attribute to target element
 * @param {HTMLElement} element - element to set data attribute
 * @param {string} key - key
 * @param {string} value - value
 * @memberof module:domUtil
 */
function setData(element, key, value) {
  if (element.dataset) {
    element.dataset[key] = value;

    return;
  }

  element.setAttribute('data-' + convertToKebabCase(key), value);
}

module.exports = setData;


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Get data value from data-attribute
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var convertToKebabCase = __webpack_require__(22);

/**
 * Get data value from data-attribute
 * @param {HTMLElement} element - target element
 * @param {string} key - key
 * @returns {string} value
 * @memberof module:domUtil
 */
function getData(element, key) {
  if (element.dataset) {
    return element.dataset[key];
  }

  return element.getAttribute('data-' + convertToKebabCase(key));
}

module.exports = getData;


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Remove data property
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var convertToKebabCase = __webpack_require__(22);

/**
 * Remove data property
 * @param {HTMLElement} element - target element
 * @param {string} key - key
 * @memberof module:domUtil
 */
function removeData(element, key) {
  if (element.dataset) {
    delete element.dataset[key];

    return;
  }

  element.removeAttribute('data-' + convertToKebabCase(key));
}

module.exports = removeData;


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Feature that each tree node is possible to edit as double click
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var forEachArray = __webpack_require__(0);
var defineClass = __webpack_require__(3);
var getTarget = __webpack_require__(10);
var off = __webpack_require__(13);
var on = __webpack_require__(14);
var addClass = __webpack_require__(15);
var hasClass = __webpack_require__(31);
var removeElement = __webpack_require__(32);
var extend = __webpack_require__(1);

var util = __webpack_require__(5);
var ajaxCommand = __webpack_require__(27);
var states = __webpack_require__(20);

var API_LIST = ['createChildNode', 'editNode', 'finishEditing'];
var EDIT_TYPE = {
  CREATE: 'create',
  UPDATE: 'update'
};
var WRAPPER_CLASSNAME = 'tui-input-wrap';
var INPUT_CLASSNAME = 'tui-tree-input';

/**
 * Set the tree selectable
 * @class Editable
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {string} options.editableClassName - Classname of editable element
 *  @param {string} options.dataKey - Key of node data to set value
 *  @param {string} [options.dataValue] - Value of node data to set value (Use "createNode" API)
 *  @param {string} [options.inputClassName] - Classname of input element
 * @ignore
 */
var Editable = defineClass(
  /** @lends Editable.prototype */ {
    static: {
      /**
       * @static
       * @memberof Selectable
       * @returns {Array.<string>} API list of Editable
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },
    init: function(tree, options) {
      options = extend({}, options);

      /**
       * Tree
       * @type {Tree}
       */
      this.tree = tree;

      /**
       * Classname of editable element
       * @type {string}
       */
      this.editableClassName = options.editableClassName || tree.classNames.textClass;

      /**
       * Key of node data to set value
       * @type {string}
       */
      this.dataKey = options.dataKey;

      /**
       * Default value for creating node
       * @type {string}
       */
      this.defaultValue = options.defaultValue || '';

      /**
       * Input element for create or edit
       * @type {HTMLElement}
       */
      this.inputElement = null;

      /**
       * Action mode - create or edit
       * @type {string}
       */
      this.mode = null;

      /**
       * For block blur when unintentional blur event occur when alert popup
       * @type {Boolean}
       */
      this._blockBlur = false;

      /**
       * Keyup event handler
       * @type {Function}
       */
      this.boundOnKeyup = util.bind(this._onKeyup, this);

      /**
       * Blur event handler
       * @type {Function}
       */
      this.boundOnBlur = util.bind(this._onBlur, this);

      tree.on('doubleClick', this._onDoubleClick, this);

      this._setAPIs();
    },

    /**
     * Disable this module
     */
    destroy: function() {
      var tree = this.tree;

      this._detachInputElement();
      tree.off(this);
      forEachArray(API_LIST, function(apiName) {
        delete tree[apiName];
      });
    },

    /**
     * Create child node
     * @memberof Tree.prototype
     * @requires Editable
     * @param {string} parentId - Parent node id to create new node
     * @example
     * tree.createChildNode('tui-tree-node-1');
     */
    createChildNode: function(parentId) {
      var tree = this.tree;
      var useAjax = tree.enabledFeatures.Ajax;
      var nodeId;

      this.mode = EDIT_TYPE.CREATE;

      if (useAjax) {
        tree.on('successAjaxResponse', this._onSuccessResponse, this);
      }

      if (!tree.isLeaf(parentId) && tree.getState(parentId) === states.node.CLOSED) {
        tree.open(parentId);
      } else {
        nodeId = tree._add({}, parentId)[0];
        this._attachInputElement(nodeId);
      }
    },

    /**
     * Edit node
     * @memberof Tree.prototype
     * @requires Editable
     * @param {string} nodeId - Node id
     * @example
     * tree.editNode('tui-tree-node-1');
     */
    editNode: function(nodeId) {
      this.mode = EDIT_TYPE.UPDATE;
      this._attachInputElement(nodeId);
    },

    /**
     * Exit edit though remove input tag
     * @memberof Tree.prototype
     * @requires Editable
     * @example
     * tree.finishEditing();
     */
    finishEditing: function() {
      if (this.inputElement) {
        this._detachInputElement();
      }
    },

    /**
     * Custom event handler "successResponse"
     * @param {string} type - Ajax command type
     * @param {Array.<string>} nodeIds - Added node ids on tree
     * @private
     */
    _onSuccessResponse: function(type, nodeIds) {
      var tree = this.tree;
      var parentId, nodeId;

      if (type === ajaxCommand.READ && nodeIds) {
        parentId = tree.getParentId(nodeIds[0]);
        nodeId = tree._add({}, parentId)[0];
        this._attachInputElement(nodeId);
      }
    },

    /**
     * Custom event handler "doubleClick"
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onDoubleClick: function(event) {
      var target = getTarget(event);
      var nodeId;

      if (hasClass(target, this.editableClassName)) {
        nodeId = this.tree.getNodeIdFromElement(target);
        this.editNode(nodeId);
      }
    },

    /**
     * InputElement is keep going
     * @private
     */
    _keepEdit: function() {
      if (this.inputElement) {
        this.inputElement.focus();
      }
    },

    /**
     * Invoke 'beforeCreateChildNode'
     * @param {Object} event - Information of 'beforeCreateChildNode'
     * @returns {boolean} Result of invoke event
     * @private
     */
    _invokeBeforeCreateChildNode: function(event) {
      /**
       * @event Tree#beforeCreateChildNode
       * @type {object} evt - Event data
       * @property {string} value - Return value of creating input element
       * @property {string} nodeId - Return id of creating node
       * @property {string} cause - Return 'blur' or 'enter' according cause of the event
       * @example
       * tree
       *  .enableFeature('Editable')
       *  .on('beforeCreateChildNode', function(evt) {
       *      console.log(evt.value);
       *      console.log(evt.nodeId);
       *      console.log(evt.cause);
       *      return false; // It cancels
       *      // return true; // It execute next
       *  });
       */
      return this.tree.invoke('beforeCreateChildNode', event);
    },

    /**
     * Invoke 'beforeEditNode'
     * @param {Event} event - Information of 'beforeEditNode'
     * @returns {boolean} Result of invoke event
     * @private
     */
    _invokeBeforeEditNode: function(event) {
      /**
       * @event Tree#beforeEditNode
       * @type {object} evt - Event data
       * @property {string} value - Return value of creating input element
       * @property {string} nodeId - Return id of editing node
       * @property {string} cause - Return 'blur' or 'enter' according cause of the event
       * @example
       * tree
       *  .enableFeature('Editable')
       *  .on('beforeEditNode', function(evt) {
       *      console.log(evt.value);
       *      console.log(evt.nodeId);
       *      console.log(evt.cause);
       *      return false; // It cancels
       *      // return true; // It execute next
       *  });
       */
      return this.tree.invoke('beforeEditNode', event);
    },

    /**
     * Reflect the value of inputElement to node for creating or editing
     * @param {string} cause - how finish editing ('blur' or 'enter')
     * @returns {boolean} Result of submit input result
     * @private
     */
    _submitInputResult: function(cause) {
      var tree = this.tree;
      var nodeId = tree.getNodeIdFromElement(this.inputElement);
      var value = this.inputElement.value;
      var event = {
        value: value,
        nodeId: nodeId,
        cause: cause
      };

      if (this.mode === EDIT_TYPE.CREATE) {
        if (!this._invokeBeforeCreateChildNode(event)) {
          this._keepEdit();

          return false;
        }
        this._addData(nodeId, value);
      } else {
        if (!this._invokeBeforeEditNode(event)) {
          this._keepEdit();

          return false;
        }
        this._setData(nodeId, value);
      }
      this._detachInputElement();

      return true;
    },

    /**
     * Event handler: keyup - input element
     * @param {Event} event - Key event
     * @private
     */
    _onKeyup: function(event) {
      if (util.getKeyCode(event) === 13) {
        this._blockBlur = true;
        this._submitInputResult('enter');
      }
    },

    /**
     * Event handler: blur - input element
     * @private
     */
    _onBlur: function() {
      if (this._blockBlur) {
        this._blockBlur = false;
      } else {
        this._blockBlur = !this._submitInputResult('blur');
      }
    },

    /**
     * Create input element
     * @returns {HTMLElement} Input element
     * @private
     */
    _createInputElement: function() {
      var element = document.createElement('INPUT');
      element.setAttribute('type', 'text');
      addClass(element, INPUT_CLASSNAME);

      return element;
    },

    /**
     * Attach input element on tree
     * @param {string} nodeId - Node id
     * @private
     */
    _attachInputElement: function(nodeId) {
      var tree = this.tree;
      var target = document.getElementById(nodeId);
      var wrapperElement = document.createElement('DIV');
      var inputElement = this._createInputElement();

      if (!target) {
        return;
      }

      wrapperElement = target.querySelector('.' + WRAPPER_CLASSNAME);

      if (!wrapperElement) {
        wrapperElement = document.createElement('DIV');
        inputElement = this._createInputElement();

        addClass(wrapperElement, WRAPPER_CLASSNAME);
        wrapperElement.style.paddingLeft = tree.getIndentWidth(nodeId) + 'px';

        inputElement.value = tree.getNodeData(nodeId)[this.dataKey] || '';

        wrapperElement.appendChild(inputElement);
        target.appendChild(wrapperElement);

        on(inputElement, {
          keyup: this.boundOnKeyup,
          blur: this.boundOnBlur
        });

        if (this.inputElement) {
          this.inputElement.blur();
        }
        this.inputElement = inputElement;
      }

      this._blockBlur = false;
      this.inputElement.focus();
    },

    /**
     * Detach input element on tree
     * @private
     */
    _detachInputElement: function() {
      var tree = this.tree;
      var inputElement = this.inputElement;
      var wrapperElement = this.inputElement.parentNode;

      off(inputElement, {
        keyup: this.boundOnKeyup,
        blur: this.boundOnBlur
      });

      removeElement(wrapperElement);

      if (tree.enabledFeatures.Ajax) {
        tree.off(this, 'successAjaxResponse');
      }

      this.inputElement = null;
    },

    /**
     * Add data of input element to node and detach input element on tree
     * @param {string} nodeId - Node id to add
     * @param {string} value - Content for that node
     * @private
     */
    _addData: function(nodeId, value) {
      var tree = this.tree;
      var parentId = tree.getParentId(nodeId);
      var data = {};

      if (nodeId) {
        data[this.dataKey] = value || this.defaultValue;
        tree._remove(nodeId);
        tree.add(data, parentId);
      }
    },

    /**
     * Set data of input element to node and detach input element on tree
     * @param {string} nodeId - Node id to change
     * @param {string} value - Content for that node
     * @private
     */
    _setData: function(nodeId, value) {
      var tree = this.tree;
      var data = {};

      if (nodeId) {
        data[this.dataKey] = value;
        tree.setNodeData(nodeId, data);
      }
    },

    /**
     * Set apis of selectable tree
     * @private
     */
    _setAPIs: function() {
      var tree = this.tree;

      forEachArray(
        API_LIST,
        function(apiName) {
          tree[apiName] = util.bind(this[apiName], this);
        },
        this
      );
    }
  }
);

module.exports = Editable;


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Feature that each tree node is possible to check and uncheck
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var inArray = __webpack_require__(4);
var forEachArray = __webpack_require__(0);
var CustomEvents = __webpack_require__(18);
var defineClass = __webpack_require__(3);
var getTarget = __webpack_require__(10);
var once = __webpack_require__(58);
var addClass = __webpack_require__(15);
var removeClass = __webpack_require__(17);
var extend = __webpack_require__(1);
var util = __webpack_require__(5);

var API_LIST = [
  'check',
  'uncheck',
  'toggleCheck',
  'isChecked',
  'isIndeterminate',
  'isUnchecked',
  'getCheckedList',
  'getTopCheckedList',
  'getBottomCheckedList'
];

/* Checkbox tri-states */
var STATE_CHECKED = 1;
var STATE_UNCHECKED = 2;
var STATE_INDETERMINATE = 3;
var DATA_KEY_FOR_CHECKBOX_STATE = '__CheckBoxState__';
var DATA = {};
var CHECKED_CLASSNAME = 'tui-is-checked';
var INDETERMINATE_CLASSNAME = 'tui-checkbox-root';

/* Checkbox cascade-states */
var CASCADE_UP = 'up';
var CASCADE_DOWN = 'down';
var CASCADE_BOTH = 'both';
var CASCADE_NONE = false;

/**
 * Set the checkbox-api
 * @class Checkbox
 * @param {Tree} tree - Tree
 * @param {Object} option - Option
 *  @param {string} option.checkboxClassName - Classname of checkbox element
 *  @param {string|boolean} [option.checkboxCascade='both'] - 'up', 'down', 'both', false
 * @ignore
 */
var Checkbox = defineClass(
  /** @lends Checkbox.prototype */ {
    static: {
      /**
       * @static
       * @memberof Checkbox
       * @returns {Array.<string>} API list of checkbox
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },
    init: function(tree, option) {
      option = extend({}, option);

      this.tree = tree;
      this.checkboxClassName = option.checkboxClassName;
      this.checkboxCascade = this._initCascadeOption(option.checkboxCascade);
      this.checkedList = [];
      this.rootCheckbox = document.createElement('INPUT');
      this.rootCheckbox.type = 'checkbox';

      this._setAPIs();
      this._attachEvents();
    },

    /**
     * Disable this module
     */
    destroy: function() {
      var tree = this.tree;

      tree.off(this);
      forEachArray(API_LIST, function(apiName) {
        delete tree[apiName];
      });
    },

    /**
     * @param {string|boolean} cascadeOption - Cascade option
     * @returns {string|boolean} Cascade option
     * @private
     */
    _initCascadeOption: function(cascadeOption) {
      var cascadeOptions = [CASCADE_UP, CASCADE_DOWN, CASCADE_BOTH, CASCADE_NONE];
      if (inArray(cascadeOption, cascadeOptions) === -1) {
        cascadeOption = CASCADE_BOTH;
      }

      return cascadeOption;
    },

    /**
     * Set apis of checkbox tree
     * @private
     */
    _setAPIs: function() {
      var tree = this.tree;

      forEachArray(
        API_LIST,
        function(apiName) {
          tree[apiName] = util.bind(this[apiName], this);
        },
        this
      );
    },

    /**
     * Attach event to tree instance
     * @private
     */
    _attachEvents: function() {
      this.tree.on(
        {
          singleClick: function(event) {
            var target = getTarget(event);

            if (target.querySelector('.' + this.checkboxClassName)) {
              this._changeCustomCheckbox(target);
            }
          },
          afterDraw: function(ev) {
            if (this.tree.isMovingNode) {
              return;
            }
            this._reflectChanges(ev.nodeId);
          },
          move: function(data) {
            // @TODO - Optimization
            this._reflectChanges(data.originalParentId);
            this._reflectChanges(data.newParentId);
          }
        },
        this
      );
    },

    /**
     * Change custom checkbox
     * @param {HTMLElement} target - Label element
     */
    _changeCustomCheckbox: function(target) {
      var nodeId = this.tree.getNodeIdFromElement(target);
      var inputElement = target.getElementsByTagName('input')[0];

      once(
        inputElement,
        'change propertychange',
        util.bind(function() {
          var state = this._getStateFromCheckbox(inputElement);
          this._continuePostprocessing(nodeId, state);
        }, this)
      );
    },

    /**
     * Reflect the changes on node.
     * @param {string} nodeId - Node id
     * @private
     */
    _reflectChanges: function(nodeId) {
      this.tree.each(
        function(descendant, descendantId) {
          this._setState(descendantId, this._getState(descendantId), true);
        },
        nodeId,
        this
      );
      this._judgeOwnState(nodeId);
      this._updateAllAncestorsState(nodeId);
    },

    /**
     * Set checkbox attributes (checked, indeterminate)
     * @param {Element} checkbox - Checkbox element
     * @param {boolean} isChecked - "checked"
     * @param {boolean} isIndeterminate - "indeterminate"
     * @private
     */
    _setCheckboxAttr: function(checkbox, isChecked, isIndeterminate) {
      checkbox.indeterminate = isIndeterminate;
      checkbox.checked = isChecked;
    },

    /**
     * Get checking state of node
     * @param {string} nodeId - Node id
     * @param {number} state - State for checkbox
     * @param {boolean} [stopPropagation] - If true, stop changing state propagation
     * @private
     */
    _setState: function(nodeId, state, stopPropagation) {
      var checkbox = this._getCheckboxElement(nodeId);

      if (!checkbox) {
        return;
      }

      switch (state) {
        case STATE_CHECKED:
          this._setCheckboxAttr(checkbox, true, false);
          break;
        case STATE_UNCHECKED:
          this._setCheckboxAttr(checkbox, false, false);
          break;
        case STATE_INDETERMINATE:
          this._setCheckboxAttr(checkbox, false, true);
          break;
        default:
          // no more process if the state is invalid
          return;
      }

      this._continuePostprocessing(nodeId, state, stopPropagation);
    },

    /**
     * Get checking state of node
     * @param {string} nodeId - Node id
     * @returns {number} Checking state
     * @private
     */
    _getState: function(nodeId) {
      var tree = this.tree;
      var state = tree.getNodeData(nodeId)[DATA_KEY_FOR_CHECKBOX_STATE];
      var checkbox;

      if (!state) {
        checkbox = this._getCheckboxElement(nodeId);
        state = this._getStateFromCheckbox(checkbox);
      }

      return state;
    },

    /**
     * Get checking state of node element
     * @private
     * @param {Element} checkbox - Checkbox element
     * @returns {?number} Checking state
     */
    _getStateFromCheckbox: function(checkbox) {
      var state;

      if (!checkbox) {
        return null;
      }

      if (checkbox.checked) {
        state = STATE_CHECKED;
      } else if (checkbox.indeterminate) {
        state = STATE_INDETERMINATE;
      } else {
        state = STATE_UNCHECKED;
      }

      return state;
    },

    /**
     * Continue post-processing from changing:checkbox-state
     * @param {string} nodeId - Node id
     * @param {number} state - Checkbox state
     * @param {boolean} [stopPropagation] - If true, stop update-propagation
     * @private
     */
    _continuePostprocessing: function(nodeId, state, stopPropagation) {
      var tree = this.tree;
      var checkedList = this.checkedList;
      var eventName;

      /* Prevent duplicated node id */
      util.removeItemFromArray(nodeId, checkedList);

      if (state === STATE_CHECKED) {
        checkedList.push(nodeId);
        /**
         * @event Tree#check
         * @type {object} evt - Event data
         * @property {string} nodeId - Checked node id
         * @example
         * tree.on('check', function(evt) {
         *     console.log('checked: ' + evt.nodeId);
         * });
         */
        eventName = 'check';
      } else if (state === STATE_UNCHECKED) {
        /**
         * @event Tree#uncheck
         * @type {object} evt - Event data
         * @property {string} nodeId - Unchecked node id
         * @example
         * tree.on('uncheck', function(evt) {
         *     console.log('unchecked: ' + evt.nodeId);
         * });
         */
        eventName = 'uncheck';
      }
      DATA[DATA_KEY_FOR_CHECKBOX_STATE] = state;

      tree.setNodeData(nodeId, DATA, {
        isSilent: true
      });

      this._setClassName(nodeId, state);

      if (!stopPropagation) {
        this._propagateState(nodeId, state);
        tree.fire(eventName, { nodeId: nodeId });
      }
    },

    /**
     * Set class name on label element
     * @param {string} nodeId - Node id for finding input element
     * @param {number} state - Checked state number
     */
    _setClassName: function(nodeId, state) {
      var parentElement = this._getCheckboxElement(nodeId).parentNode;
      var labelElement;

      if (parentElement && parentElement.parentNode) {
        labelElement = parentElement.parentNode;

        removeClass(labelElement, INDETERMINATE_CLASSNAME);
        removeClass(labelElement, CHECKED_CLASSNAME);

        if (state === 1) {
          addClass(labelElement, CHECKED_CLASSNAME);
        } else if (state === 3) {
          addClass(labelElement, INDETERMINATE_CLASSNAME);
          addClass(labelElement, CHECKED_CLASSNAME);
        }
      }
    },

    /**
     * Propagate a node state to descendants and ancestors for updating their states
     * @param {string} nodeId - Node id
     * @param {number} state - Checkbox state
     * @private
     */
    _propagateState: function(nodeId, state) {
      if (state === STATE_INDETERMINATE) {
        return;
      }
      if (inArray(this.checkboxCascade, [CASCADE_DOWN, CASCADE_BOTH]) > -1) {
        this._updateAllDescendantsState(nodeId, state);
      }
      if (inArray(this.checkboxCascade, [CASCADE_UP, CASCADE_BOTH]) > -1) {
        this._updateAllAncestorsState(nodeId);
      }
    },

    /**
     * Update all descendants state
     * @param {string} nodeId - Node id
     * @param {number} state - State for checkbox
     * @private
     */
    _updateAllDescendantsState: function(nodeId, state) {
      this.tree.each(
        function(descendant, descendantId) {
          this._setState(descendantId, state, true);
        },
        nodeId,
        this
      );
    },

    /**
     * Update all ancestors state
     * @param {string} nodeId - Node id
     * @private
     */
    _updateAllAncestorsState: function(nodeId) {
      var tree = this.tree;
      var parentId = tree.getParentId(nodeId);

      while (parentId) {
        this._judgeOwnState(parentId);
        parentId = tree.getParentId(parentId);
      }
    },

    /**
     * Judge own state from child node is changed
     * @param {string} nodeId - Node id
     * @private
     */
    _judgeOwnState: function(nodeId) {
      var tree = this.tree;
      var childIds = tree.getChildIds(nodeId);
      var checked = true;
      var unchecked = true;

      if (!childIds.length) {
        checked = this.isChecked(nodeId);
      } else {
        forEachArray(
          childIds,
          function(childId) {
            var state = this._getState(childId);
            checked = checked && state === STATE_CHECKED;
            unchecked = unchecked && state === STATE_UNCHECKED;

            return checked || unchecked;
          },
          this
        );
      }

      if (checked) {
        this._setState(nodeId, STATE_CHECKED, true);
      } else if (unchecked) {
        this._setState(nodeId, STATE_UNCHECKED, true);
      } else {
        this._setState(nodeId, STATE_INDETERMINATE, true);
      }
    },

    /**
     * Get checkbox element of node
     * @param {string} nodeId - Node id
     * @returns {?HTMLElement} Checkbox element
     * @private
     */
    _getCheckboxElement: function(nodeId) {
      var tree = this.tree;
      var el, nodeEl;

      if (nodeId === tree.getRootNodeId()) {
        el = this.rootCheckbox;
      } else {
        nodeEl = document.getElementById(nodeId);
        if (!nodeEl) {
          return null;
        }
        el = nodeEl.querySelector('.' + this.checkboxClassName);
      }

      return el;
    },

    /**
     * Check node
     * @memberof Tree.prototype
     * @param {string} nodeId - Node id
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.check(nodeId);
     */
    check: function(nodeId) {
      if (!this.isChecked(nodeId)) {
        this._setState(nodeId, STATE_CHECKED);
      }
    },

    /**
     * Uncheck node
     * @memberof Tree.prototype
     * @param {string} nodeId - Node id
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.uncheck(nodeId);
     */
    uncheck: function(nodeId) {
      if (!this.isUnchecked(nodeId)) {
        this._setState(nodeId, STATE_UNCHECKED);
      }
    },

    /**
     * Toggle node checking
     * @memberof Tree.prototype
     * @param {string} nodeId - Node id
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.toggleCheck(nodeId);
     */
    toggleCheck: function(nodeId) {
      if (!this.isChecked(nodeId)) {
        this.check(nodeId);
      } else {
        this.uncheck(nodeId);
      }
    },

    /**
     * Whether the node is checked
     * @memberof Tree.prototype
     * @param {string} nodeId - Node id
     * @returns {boolean} True if node is indeterminate
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.check(nodeId);
     * console.log(tree.isChecked(nodeId)); // true
     */
    isChecked: function(nodeId) {
      return STATE_CHECKED === this._getState(nodeId);
    },

    /**
     * Whether the node is indeterminate
     * @memberof Tree.prototype
     * @param {string} nodeId - Node id
     * @returns {boolean} True if node is indeterminate
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.check(nodeId);
     * console.log(tree.isIndeterminate(nodeId)); // false
     */
    isIndeterminate: function(nodeId) {
      return STATE_INDETERMINATE === this._getState(nodeId);
    },

    /**
     * Whether the node is unchecked or not
     * @memberof Tree.prototype
     * @param {string} nodeId - Node id
     * @returns {boolean} True if node is unchecked.
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.uncheck(nodeId);
     * console.log(tree.isUnchecked(nodeId)); // true
     */
    isUnchecked: function(nodeId) {
      return STATE_UNCHECKED === this._getState(nodeId);
    },

    /**
     * Get checked list
     * @memberof Tree.prototype
     * @param {string} [parentId] - Node id (default: rootNode id)
     * @returns {Array.<string>} Checked node ids
     * @example
     * // ├─ node1 (v)
     * // │  ├─ node2 (v)
     * // │  └─ node3 (v)
     * // ├─ node4 ( )
     * // │  └─ node5 (v)
     * // └─ node6 ( )
     * //    ├─ node7 (v)
     * //    │  └─ node8 (v)
     * //    └─ node9 ( )
     *
     * var allCheckedList = tree.getCheckedList(); // ['node1', 'node2', 'node3' ,....]
     * var descendantsCheckedList = tree.getCheekedList('node6'); // ['node7', 'node8']
     */
    getCheckedList: function(parentId) {
      var tree = this.tree;
      var checkedList = this.checkedList;

      if (!parentId) {
        return checkedList.slice();
      }

      return util.filter(checkedList, function(nodeId) {
        return tree.contains(parentId, nodeId);
      });
    },

    /**
     * Get top checked list
     * @memberof Tree.prototype
     * @param {string} [parentId] - Node id (default: rootNode id)
     * @returns {Array.<string>} Checked node ids
     * @example
     * // ├─ node1 (v)
     * // │  ├─ node2 (v)
     * // │  └─ node3 (v)
     * // ├─ node4 ( )
     * // │  └─ node5 (v)
     * // └─ node6 ( )
     * //    ├─ node7 (v)
     * //    │  └─ node8 (v)
     * //    └─ node9 ( )
     *
     * var allTopCheckedList = tree.getTopCheckedList(); // ['node1', 'node5', 'node7']
     * var descendantsTopCheckedList = tree.getTopCheekedList('node6'); // ['node7']
     */
    getTopCheckedList: function(parentId) {
      var tree = this.tree;
      var checkedList = [];
      var state;

      parentId = parentId || tree.getRootNodeId();
      state = this._getState(parentId);
      if (state === STATE_CHECKED) {
        checkedList = tree.getChildIds(parentId);
      } else if (state === STATE_INDETERMINATE) {
        checkedList = this.getCheckedList(parentId);
        checkedList = util.filter(
          checkedList,
          function(nodeId) {
            return !this.isChecked(tree.getParentId(nodeId));
          },
          this
        );
      }

      return checkedList;
    },

    /**
     * Get bottom checked list
     * @memberof Tree.prototype
     * @param {string} [parentId] - Node id (default: rootNode id)
     * @returns {Array.<string>} Checked node ids
     * @example
     * var allBottomCheckedList = tree.getBottomCheckedList(); // ['node2', 'node3', 'node5', 'node8']
     * var descendantsBottomCheckedList = tree.getBottomCheekedList('node6'); // ['node8']
     */
    getBottomCheckedList: function(parentId) {
      var tree = this.tree;
      var checkedList;

      parentId = parentId || tree.getRootNodeId();
      checkedList = this.getCheckedList(parentId);

      return util.filter(checkedList, function(nodeId) {
        return tree.isLeaf(nodeId);
      });
    }
  }
);

CustomEvents.mixin(Checkbox);
module.exports = Checkbox;


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Bind DOM event. this event will unbind after invokes.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var forEachOwnProperties = __webpack_require__(6);
var isObject = __webpack_require__(11);
var on = __webpack_require__(14);
var off = __webpack_require__(13);

/**
 * Bind DOM event. this event will unbind after invokes.
 * @param {HTMLElement} element - HTMLElement to bind events.
 * @param {(string|object)} types - Space splitted events names or
 *  eventName:handler object.
 * @param {(function|object)} handler - handler function or context for handler method.
 * @param {object} [context] - context object for handler method.
 * @memberof module:domEvent
 */
function once(element, types, handler, context) {
  /**
     * Event handler for one time.
     */
  function onceHandler() {
    handler.apply(context || element, arguments);
    off(element, types, onceHandler, context);
  }

  if (isObject(types)) {
    forEachOwnProperties(types, function(fn, type) {
      once(element, type, fn, handler);
    });

    return;
  }

  on(element, types, onceHandler, context);
}

module.exports = once;


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Feature that each tree node is possible to have context-menu
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var forEachArray = __webpack_require__(0);
var defineClass = __webpack_require__(3);
var getTarget = __webpack_require__(10);
var disableTextSelection = __webpack_require__(28);
var enableTextSelection = __webpack_require__(30);

var util = __webpack_require__(5);
var TuiContextMenu = __webpack_require__(60);
var API_LIST = ['changeContextMenu'];

/**
 * Set ContextMenu feature on tree
 * @class ContextMenu
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *     @param {Array.<Object>} options.menuData - Context menu data
 *     @param {boolean} options.usageStatistics - Whether to send the hostname to GA
 * @ignore
 */
var ContextMenu = defineClass(
  /** @lends ContextMenu.prototype */ {
    static: {
      /**
       * @static
       * @memberof ContextMenu
       * @returns {Array.<string>} API list of ContextMenu
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },

    init: function(tree, options) {
      var containerId = tree.rootElement.parentNode.id;

      options = options || {};

      /**
       * Tree data
       * @type {Tree}
       */
      this.tree = tree;

      /**
       * Tree selector for context menu
       */
      this.treeSelector = '#' + containerId;

      /**
       * Id of floating layer in tree
       * @type {string}
       */
      this.flId = containerId + '-fl';

      /**
       * Floating layer element
       * @type {HTMLElement}
       */
      this.flElement = document.getElementById(this.flId);

      /**
       * Info of context menu in tree
       * @type {Object}
       */
      this.menu = this._generateContextMenu(options.usageStatistics);

      /**
       * Id of selected tree item
       * @type {string}
       */
      this.selectedNodeId = null;

      this.menu.register(this.treeSelector, util.bind(this._onSelect, this), options.menuData);

      this.tree.on('contextmenu', this._onContextMenu, this);

      this._preventTextSelection();

      this._setAPIs();
    },

    /**
     * Change current context-menu view
     * @memberof Tree.prototype
     * @requires ContextMenu
     * @param {Array.<Object>} newMenuData - New context menu data
     * @example
     * tree.changeContextMenu([
     *      {title: 'menu1'},
     *      {title: 'menu2', disable: true},
     *      {title: 'menu3', menu: [
     *          {title: 'submenu1', disable: true},
     *          {title: 'submenu2'}
     *      ]}
     * ]);
     */
    changeContextMenu: function(newMenuData) {
      this.menu.unregister(this.treeSelector);
      this.menu.register(this.treeSelector, util.bind(this._onSelect, this), newMenuData);
    },

    /**
     * Disable ContextMenu feature
     */
    destroy: function() {
      var tree = this.tree;

      this.menu.destroy();

      this._restoreTextSelection();
      this._removeFloatingLayer();

      tree.off(this);

      forEachArray(API_LIST, function(apiName) {
        delete tree[apiName];
      });
    },

    /**
     * Create floating layer for context menu
     * @private
     */
    _createFloatingLayer: function() {
      this.flElement = document.createElement('div');
      this.flElement.id = this.flId;

      document.body.appendChild(this.flElement);
    },

    /**
     * Remove floating layer for context menu
     * @private
     */
    _removeFloatingLayer: function() {
      document.body.removeChild(this.flElement);
      this.flElement = null;
    },

    /**
     * Generate context menu in tree
     * @returns {TuiContextMenu} Instance of TuiContextMenu
     * @param {boolean} usageStatistics - Let us know the hostname.
     * @private
     */
    _generateContextMenu: function(usageStatistics) {
      if (!this.flElement) {
        this._createFloatingLayer();
      }

      return new TuiContextMenu(this.flElement, {
        usageStatistics: usageStatistics
      });
    },

    /**
     * Prevent text selection on selected tree item
     * @private
     */
    _preventTextSelection: function() {
      disableTextSelection(this.tree.rootElement);
    },

    /**
     * Restore text selection on selected tree item
     * @private
     */
    _restoreTextSelection: function() {
      enableTextSelection(this.tree.rootElement);
    },

    /**
     * Event handler on tree item
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    _onContextMenu: function(e) {
      var target = getTarget(e);

      this.selectedNodeId = this.tree.getNodeIdFromElement(target);

      /**
       * @event Tree#beforeOpenContextMenu
       * @type {object} evt - Event data
       * @property {string} nodeId - Current selected node id
       * @example
       * tree.on('beforeOpenContextMenu', function(evt) {
       *     console.log('nodeId: ' + evt.nodeId);
       * });
       */
      this.tree.fire('beforeOpenContextMenu', {
        nodeId: this.selectedNodeId
      });
    },

    /**
     * Event handler on context menu
     * @param {MouseEvent} e - Mouse event
     * @param {string} command - Options value of selected context menu ("title"|"command")
     * @private
     */
    _onSelect: function(e, command) {
      /**
       * @event Tree#selectContextMenu
       * @type {object} evt - Event data
       * @property {string} command - Command type
       * @property {string} nodeId - Node id
       * @example
       * tree.on('selectContextMenu', function(evt) {
       *     var command = treeEvent.command; // key of context menu's data
       *     var nodeId = treeEvent.nodeId;
       *
       *     console.log(evt.command, evt.nodeId);
       * });
       */
      this.tree.fire('selectContextMenu', {
        command: command,
        nodeId: this.selectedNodeId
      });
    },

    /**
     * Set API of ContextMenu feature
     * @private
     */
    _setAPIs: function() {
      var tree = this.tree;

      forEachArray(
        API_LIST,
        function(apiName) {
          tree[apiName] = util.bind(this[apiName], this);
        },
        this
      );
    }
  }
);

module.exports = ContextMenu;


/***/ }),
/* 60 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__60__;

/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @fileoverview Feature that tree action is enable to communicate server
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var ajax = __webpack_require__(62);
var defineClass = __webpack_require__(3);
var extend = __webpack_require__(1);
var isFunction = __webpack_require__(12);
var isUndefined = __webpack_require__(7);
var bind = __webpack_require__(5).bind;

var API_LIST = [];
var LOADER_CLASSNAME = 'tui-tree-loader';

/**
 * Set Ajax feature on tree
 * @class Ajax
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {Object} options.command - Each Ajax request command options
 *  @param {Function} [options.parseData] - Function to parse and return the response data
 *  @param {string} [options.loaderClassName] - Classname of loader element
 *  @param {boolean} [options.isLoadRoot] - Whether load data from root node or not
 * @ignore
 */
var Ajax = defineClass(
  /** @lends Ajax.prototype */ {
    static: {
      /**
       * @static
       * @memberof Ajax
       * @returns {Array.<string>} API list of Ajax
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },
    init: function(tree, options) {
      options = extend({}, options);

      /**
       * Tree
       * @type {Tree}
       */
      this.tree = tree;

      /**
       * Option for each request command
       * @type {Object}
       */
      this.command = options.command;

      /**
       * Callback for parsing the response data
       * @type {?Function}
       */
      this.parseData = options.parseData || null;

      /**
       * Classname of loader element
       * @type {string}
       */
      this.loaderClassName = options.loaderClassName || LOADER_CLASSNAME;

      /**
       * State of loading root data or not
       * @type {boolean}
       */
      this.isLoadRoot = !isUndefined(options.isLoadRoot) ? options.isLoadRoot : true;

      /**
       * Loader element
       * @type {HTMLElement}
       */
      this.loader = null;

      this._createLoader();

      tree.on('initFeature', bind(this._onInitFeature, this));
    },

    /**
     * Custom event handler "initFeature"
     * @private
     */
    _onInitFeature: function() {
      if (!this.isLoadRoot) {
        return;
      }

      this.tree.resetAllData();
    },

    /**
     * Disable this module
     */
    destroy: function() {
      var tree = this.tree;

      this._removeLoader();

      tree.off(this);
    },

    /**
     * Load data to request server
     * @param {string} command - Command type
     * @param {Function} callback - Executed function after response
     * @param {Object} [data] - Values to make "data" property using request
     */
    loadData: function(command, callback, data) {
      var options;

      if (!this.command || !this.command[command] || !this.command[command].url) {
        return;
      }

      options = this._getDefaultRequestOptions(command, data);

      /**
       * @event Tree#beforeAjaxRequest
       * @type {object} evt - Event data
       * @property {string} command - Command type
       * @property {object} [data] - Request data
       * @example
       * tree.on('beforeAjaxRequest', function(evt) {
       *     console.log('before ' + evt.command + ' request!');
       *     return false; // It cancels request
       *     // return true; // It fires request
       * });
       */
      if (
        !this.tree.invoke('beforeAjaxRequest', {
          command: command,
          data: data
        })
      ) {
        return;
      }

      this._showLoader();

      options.success = bind(function(response) {
        this._responseSuccess(command, callback, response.data);
      }, this);

      options.error = bind(function(error) {
        this._responseError(command, error);
      }, this);

      ajax(options);
    },

    /**
     * Processing when response is success
     * @param {string} command - Command type
     * @param {Function} callback - Executed function after response
     * @param {Object|boolean} [responseData] - Response data from server or return value of "parseData"
     * @private
     */
    _responseSuccess: function(command, callback, responseData) {
      var tree = this.tree;
      var data;

      this._hideLoader();

      if (this.parseData) {
        responseData = this.parseData(command, responseData);
      }

      if (responseData) {
        data = callback(responseData);

        /**
         * @event Tree#successAjaxResponse
         * @type {object} evt - Event data
         * @property {string} command - Command type
         * @property {object} [data] - Return value of executed command callback
         * @example
         * tree.on('successAjaxResponse', function(evt) {
         *     console.log(evt.command + ' response is success!');
         *     if (data) {
         *           console.log('data:' + evt.data);
         *     }
         * });
         */
        tree.fire('successAjaxResponse', {
          command: command,
          data: data
        });
      } else {
        /**
         * @event Tree#failAjaxResponse
         * @type {object} evt - Event data
         * @property {string} command - Command type
         * @example
         * tree.on('failAjaxResponse', function(evt) {
         *     console.log(evt.command + ' response is fail!');
         * });
         */
        tree.fire('failAjaxResponse', {
          command: command
        });
      }
    },

    /**
     * Processing when response is error
     * @param {string} command - Command type
     * @private
     */
    _responseError: function(command, error) {
      this._hideLoader();

      /**
       * @event Tree#errorAjaxResponse
       * @type {object} evt - Event data
       * @property {string} command - Command type
       * @property {number} status - Error status code
       * @property {string} statusText - Error status text
       * @example
       * tree.on('errorAjaxResponse', function(evt) {
       *     console.log(evt.command + ' response is error!');
       * });
       */
      this.tree.fire('errorAjaxResponse', {
        command: command,
        status: error.status,
        statusText: error.statusText
      });
    },

    /**
     * Get default request options
     * @param {string} type - Command type
     * @param {Object} [data] - Value of request option "data"
     * @returns {Object} Default options to request
     * @private
     */
    _getDefaultRequestOptions: function(type, data) {
      var options = extend({}, this.command[type]);

      if (isFunction(options.url)) {
        // for restful API url
        options.url = options.url(data);
      }

      if (isFunction(options.params)) {
        // for custom request data
        options.params = options.params(data);
      }

      options.method = options.method || 'GET';
      options.contentType = options.contentType || 'application/json';

      return options;
    },

    /**
     * Create loader element
     * @private
     */
    _createLoader: function() {
      var tree = this.tree;
      var loader = document.createElement('span');

      loader.className = this.loaderClassName;
      loader.style.display = 'none';

      tree.rootElement.parentNode.appendChild(loader);

      this.loader = loader;
    },

    /**
     * Remove loader element
     * @private
     */
    _removeLoader: function() {
      var tree = this.tree;
      var loader = this.loader;

      tree.rootElement.parentNode.removeChild(loader);

      this.loader = null;
    },

    /**
     * Show loader element on tree
     * @private
     */
    _showLoader: function() {
      this.loader.style.display = 'block';
    },

    /**
     * Hide loader element on tree
     * @private
     */
    _hideLoader: function() {
      this.loader.style.display = 'none';
    }
  }
);

module.exports = Ajax;


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports["default"] = void 0;

var _forEachArray = _interopRequireDefault(__webpack_require__(0));

var _forEachOwnProperties = _interopRequireDefault(__webpack_require__(6));

var _extend = _interopRequireDefault(__webpack_require__(1));

var _isArray = _interopRequireDefault(__webpack_require__(2));

var _isEmpty = _interopRequireDefault(__webpack_require__(63));

var _isFunction = _interopRequireDefault(__webpack_require__(12));

var _isNull = _interopRequireDefault(__webpack_require__(23));

var _isObject = _interopRequireDefault(__webpack_require__(11));

var _isUndefined = _interopRequireDefault(__webpack_require__(7));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

function encodePairs(key, value) {
  return encodeURIComponent(key) + "=" + encodeURIComponent((0, _isNull["default"])(value) || (0, _isUndefined["default"])(value) ? '' : value);
}

function serializeParams(key, value, serializedList) {
  if ((0, _isArray["default"])(value)) {
    (0, _forEachArray["default"])(value, function (arrVal, index) {
      serializeParams(key + "[" + ((0, _isObject["default"])(arrVal) ? index : '') + "]", arrVal, serializedList);
    });
  } else if ((0, _isObject["default"])(value)) {
    (0, _forEachOwnProperties["default"])(value, function (objValue, objKey) {
      serializeParams(key + "[" + objKey + "]", objValue, serializedList);
    });
  } else {
    serializedList.push(encodePairs(key, value));
  }
}

function serialize(params) {
  if (!params || (0, _isEmpty["default"])(params)) {
    return '';
  }

  var serializedList = [];
  (0, _forEachOwnProperties["default"])(params, function (value, key) {
    serializeParams(key, value, serializedList);
  });
  return serializedList.join('&');
}

var getDefaultOptions = function getDefaultOptions() {
  return {
    baseURL: '',
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      "delete": {},
      patch: {},
      options: {},
      head: {}
    },
    serializer: serialize
  };
};

var HTTP_PROTOCOL_REGEXP = /^(http|https):\/\//i;

function combineURL(baseURL, url) {
  if (HTTP_PROTOCOL_REGEXP.test(url)) {
    return url;
  }

  if (baseURL.slice(-1) === '/' && url.slice(0, 1) === '/') {
    url = url.slice(1);
  }

  return baseURL + url;
}

function getComputedOptions(defaultOptions, customOptions) {
  var baseURL = defaultOptions.baseURL,
      defaultHeaders = defaultOptions.headers,
      defaultSerializer = defaultOptions.serializer,
      defaultBeforeRequest = defaultOptions.beforeRequest,
      defaultSuccess = defaultOptions.success,
      defaultError = defaultOptions.error,
      defaultComplete = defaultOptions.complete;
  var url = customOptions.url,
      contentType = customOptions.contentType,
      method = customOptions.method,
      params = customOptions.params,
      headers = customOptions.headers,
      serializer = customOptions.serializer,
      beforeRequest = customOptions.beforeRequest,
      success = customOptions.success,
      error = customOptions.error,
      complete = customOptions.complete,
      withCredentials = customOptions.withCredentials,
      mimeType = customOptions.mimeType;
  var options = {
    url: combineURL(baseURL, url),
    method: method,
    params: params,
    headers: (0, _extend["default"])(defaultHeaders.common, defaultHeaders[method.toLowerCase()], headers),
    serializer: serializer || defaultSerializer || serialize,
    beforeRequest: [defaultBeforeRequest, beforeRequest],
    success: [defaultSuccess, success],
    error: [defaultError, error],
    complete: [defaultComplete, complete],
    withCredentials: withCredentials,
    mimeType: mimeType
  };
  options.contentType = contentType || options.headers['Content-Type'];
  delete options.headers['Content-Type'];
  return options;
}

function validateStatus(status) {
  return status >= 200 && status < 300;
}

function hasRequestBody(method) {
  return /^(?:POST|PUT|PATCH)$/.test(method.toUpperCase());
}

function executeCallback(callback, param) {
  if ((0, _isArray["default"])(callback)) {
    (0, _forEachArray["default"])(callback, function (fn) {
      return executeCallback(fn, param);
    });
  } else if ((0, _isFunction["default"])(callback)) {
    callback(param);
  }
}

function parseHeaders(text) {
  var headers = {};
  (0, _forEachArray["default"])(text.split('\r\n'), function (header) {
    var _header$split = header.split(': '),
        key = _header$split[0],
        value = _header$split[1];

    if (key !== '' && !(0, _isUndefined["default"])(value)) {
      headers[key] = value;
    }
  });
  return headers;
}

function parseJSONData(data) {
  var result = '';

  try {
    result = JSON.parse(data);
  } catch (_) {
    result = data;
  }

  return result;
}

var REQUEST_DONE = 4;

function handleReadyStateChange(xhr, options) {
  var readyState = xhr.readyState;

  if (readyState != REQUEST_DONE) {
    return;
  }

  var status = xhr.status,
      statusText = xhr.statusText,
      responseText = xhr.responseText;
  var success = options.success,
      resolve = options.resolve,
      error = options.error,
      reject = options.reject,
      complete = options.complete;

  if (validateStatus(status)) {
    var contentType = xhr.getResponseHeader('Content-Type');
    var data = responseText;

    if (contentType && contentType.indexOf('application/json') > -1) {
      data = parseJSONData(data);
    }

    executeCallback([success, resolve], {
      status: status,
      statusText: statusText,
      data: data,
      headers: parseHeaders(xhr.getAllResponseHeaders())
    });
  } else {
    executeCallback([error, reject], {
      status: status,
      statusText: statusText
    });
  }

  executeCallback(complete, {
    status: status,
    statusText: statusText
  });
}

var QS_DELIM_REGEXP = /\?/;

function open(xhr, options) {
  var url = options.url,
      method = options.method,
      serializer = options.serializer,
      params = options.params;
  var requestUrl = url;

  if (!hasRequestBody(method) && params) {
    var qs = (QS_DELIM_REGEXP.test(url) ? '&' : '?') + serializer(params);
    requestUrl = "" + url + qs;
  }

  xhr.open(method, requestUrl);
}

function applyConfig(xhr, options) {
  var method = options.method,
      contentType = options.contentType,
      mimeType = options.mimeType,
      headers = options.headers,
      _options$withCredenti = options.withCredentials,
      withCredentials = _options$withCredenti === void 0 ? false : _options$withCredenti;

  if (withCredentials) {
    xhr.withCredentials = withCredentials;
  }

  if (mimeType) {
    xhr.overrideMimeType(mimeType);
  }

  (0, _forEachOwnProperties["default"])(headers, function (value, header) {
    if (!(0, _isObject["default"])(value)) {
      xhr.setRequestHeader(header, value);
    }
  });

  if (hasRequestBody(method)) {
    xhr.setRequestHeader('Content-Type', contentType + "; charset=UTF-8");
  }

  xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
}

var ENCODED_SPACE_REGEXP = /%20/g;

function send(xhr, options) {
  var method = options.method,
      serializer = options.serializer,
      beforeRequest = options.beforeRequest,
      _options$params = options.params,
      params = _options$params === void 0 ? {} : _options$params,
      _options$contentType = options.contentType,
      contentType = _options$contentType === void 0 ? 'application/x-www-form-urlencoded' : _options$contentType;
  var body = null;

  if (hasRequestBody(method)) {
    body = contentType.indexOf('application/x-www-form-urlencoded') > -1 ? serializer(params).replace(ENCODED_SPACE_REGEXP, '+') : JSON.stringify(params);
  }

  xhr.onreadystatechange = function () {
    return handleReadyStateChange(xhr, options);
  };

  executeCallback(beforeRequest, xhr);
  xhr.send(body);
}

function ajax(options) {
  var xhr = new XMLHttpRequest();

  var request = function request(opts) {
    return (0, _forEachArray["default"])([open, applyConfig, send], function (fn) {
      return fn(xhr, opts);
    });
  };

  options = getComputedOptions(ajax.defaults, options);

  if (typeof Promise !== 'undefined') {
    return new Promise(function (resolve, reject) {
      request((0, _extend["default"])(options, {
        resolve: resolve,
        reject: reject
      }));
    });
  }

  request(options);
  return null;
}

ajax.defaults = getDefaultOptions();

ajax._reset = function () {
  ajax.defaults = getDefaultOptions();
};

ajax._request = function (url, method, options) {
  if (options === void 0) {
    options = {};
  }

  return ajax((0, _extend["default"])(options, {
    url: url,
    method: method
  }));
};

(0, _forEachArray["default"])(['get', 'post', 'put', 'delete', 'patch', 'options', 'head'], function (type) {
  ajax[type] = function (url, options) {
    return ajax._request(url, type.toUpperCase(), options);
  };
});
var _default = ajax;
exports["default"] = _default;
module.exports = exports["default"];


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* eslint-disable complexity */
/**
 * @fileoverview Check whether the given variable is empty(null, undefined, or empty array, empty object) or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isString = __webpack_require__(8);
var isExisty = __webpack_require__(16);
var isArray = __webpack_require__(2);
var isArguments = __webpack_require__(64);
var isObject = __webpack_require__(11);
var isFunction = __webpack_require__(12);

/**
 * Check whether given argument is empty string
 * @param {*} obj - Target for checking
 * @returns {boolean} whether given argument is empty string
 * @private
 */
function _isEmptyString(obj) {
  return isString(obj) && obj === '';
}

/**
 * Check whether given argument has own property
 * @param {Object} obj - Target for checking
 * @returns {boolean} - whether given argument has own property
 * @private
 */
function _hasOwnProperty(obj) {
  var key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      return true;
    }
  }

  return false;
}

/**
 * Check whether the given variable is empty(null, undefined, or empty array, empty object) or not.
 *  If the given variables is empty, return true.
 * @param {*} obj - Target for checking
 * @returns {boolean} Is empty?
 * @memberof module:type
 */
function isEmpty(obj) {
  if (!isExisty(obj) || _isEmptyString(obj)) {
    return true;
  }

  if (isArray(obj) || isArguments(obj)) {
    return obj.length === 0;
  }

  if (isObject(obj) && !isFunction(obj)) {
    return !_hasOwnProperty(obj);
  }

  return true;
}

module.exports = isEmpty;


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @fileoverview Check whether the given variable is an arguments object or not.
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */



var isExisty = __webpack_require__(16);

/**
 * @module type
 */

/**
 * Check whether the given variable is an arguments object or not.
 * If the given variable is an arguments object, return true.
 * @param {*} obj - Target for checking
 * @returns {boolean} Is arguments?
 * @memberof module:type
 */
function isArguments(obj) {
  var result = isExisty(obj) &&
        ((Object.prototype.toString.call(obj) === '[object Arguments]') || !!obj.callee);

  return result;
}

module.exports = isArguments;


/***/ })
/******/ ]);
});