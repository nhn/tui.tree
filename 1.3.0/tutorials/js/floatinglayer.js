(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _core = require('./src/core');

var core = _interopRequireWildcard(_core);

var _floatingLayer = require('./src/floatingLayer');

var _floatingLayer2 = _interopRequireDefault(_floatingLayer);

var _view = require('./src/view');

var _view2 = _interopRequireDefault(_view);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

tui.util.defineNamespace('tui.component', { FloatingLayer: _floatingLayer2['default'] });
tui.component.FloatingLayer.core = core;
tui.component.FloatingLayer.View = _view2['default'];

},{"./src/core":2,"./src/floatingLayer":3,"./src/view":4}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.noop = noop;
exports.uniq = uniq;
exports.reduce = reduce;
exports.remove = remove;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * @fileoverview Core utility methods module
 * @author NHN Ent. FE Development team <dl_javascript@nhnent.com>
 */
var util = tui.util;

/**
 * A no-operation function that returns undefined regardless of the arguments
 *  it receives.
 */
function noop() {}

/**
 * Create a duplicate-free version of an array
 * @param {Array} array - The array to inspect.
 * @returns {Array} Returns the new duplicate free array.
 */
function uniq(array) {
    return [].concat(_toConsumableArray(new Set(array)));
}

/**
 * @param {Collection} collection - The collection to iterate over.
 * @param {function} [iteratee] - The function invoked per iteration.
 * @param {*} accumulator - The initial value.
 * @returns {*} Returns the accumulated value.
 */
function reduce(collection, iteratee, accumulator) {
    if (util.isArray(collection)) {
        if (accumulator) {
            return collection.reduce(iteratee, accumulator);
        }

        return collection.reduce(iteratee);
    }

    util.forEach(collection, function (value, index) {
        if (typeof accumulator === 'undefined') {
            accumulator = value;
        } else {
            accumulator = iteratee(accumulator, value, index);
        }
    });

    return accumulator;
}

/**
 * Removes all elements from array that predicate returns truthy for and
 *  returns an array of the removed elements. The predicate is invoked with
 *  three arguments: (value, index, array).
 * @param {Array} array - The array to modify.
 * @param {(Function|String|Number)} predicate - The function invoked per
 *  iteration.
 * @returns {Array} Returns the new array of removed elements.
 */
function remove(array, predicate) {
    var match = void 0;

    if (util.isFunction(predicate)) {
        match = function match(v) {
            return predicate(v);
        };
    } else {
        match = function match(v) {
            return predicate === v;
        };
    }

    var removed = [];

    for (var idx = 0, len = array.length; idx < len; idx += 1) {
        var value = array[idx];
        if (match(value, idx, array)) {
            removed.push(value);
            array.splice(idx, 1);
            len -= 1;
            idx -= 1;
        }
    }

    return removed;
}

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createLayer = createLayer;

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @fileoverview Module for managing non zero z-index division on viewport
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var VIEW_PROP = '_floatingLayer';
var DEFAULT_ZINDEX = 999;

/**
 * Create layer for floating ui
 * @params {...string} [cssClass] - css classes
 * @returns {HTMLElement} layer
 */
function createLayer() {
    var layer = document.createElement('div');

    dom.css(layer, {
        display: 'none',
        position: 'absolute'
    });

    for (var _len = arguments.length, cssClass = Array(_len), _key = 0; _key < _len; _key++) {
        cssClass[_key] = arguments[_key];
    }

    if (cssClass.length) {
        var _dom;

        (_dom = dom).addClass.apply(_dom, [layer].concat(cssClass));
    }

    return layer;
}

/**
 * Class for managing floating layers
 * @extends View
 */

var FloatingLayer = function (_View) {
    _inherits(FloatingLayer, _View);

    /**
     * Constructor
     * @param {HTMLElement} [container] - base container element
     * @param {object} [options] - options for FloatingLayer
     *   @param {boolean} [options.modaless=false] - set true for create floating
     *    layer without dimmed layer
     * @example
     * var layer = new tui.component.FloatingLayer(document.querySelector('#fl'));
     */

    function FloatingLayer(container) {
        var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref$modaless = _ref.modaless;
        var modaless = _ref$modaless === undefined ? false : _ref$modaless;

        _classCallCheck(this, FloatingLayer);

        /**
         * @type {object}
         */

        var _this = _possibleConstructorReturn(this, _View.call(this, createLayer('floating-layer')));

        _this.options = Object.assign({}, { modaless: modaless });

        /**
         * @type {HTMLElement}
         */
        _this.parent = container;

        /**
         * @type {number}
         */
        _this.zIndex = DEFAULT_ZINDEX;

        /**
         * @type {HTMLElement}
         */
        _this.dimm = null;

        /**
         * @type {object}
         */
        _this.siblings = null;

        _this.initialize(container);
        return _this;
    }

    /**
     * Initialize floating layer instance
     * @param {HTMLElement} container - element to base of several floating
     *  layers not floating layer itself
     */


    FloatingLayer.prototype.initialize = function initialize(container) {
        var siblings = container[VIEW_PROP];

        if (!siblings) {
            siblings = container[VIEW_PROP] = new Set();
        }

        siblings.add(this);

        this.siblings = siblings;

        this.zIndex = this.getLargestZIndex() + 1;

        if (!this.options.modaless) {
            var dimm = this.dimm = createLayer('floating-layer-dimm');

            dom.css(dimm, 'position', 'fixed');
            dom.setBound(dimm, { top: 0, right: 0, bottom: 0, left: 0 });

            container.appendChild(dimm);
        }

        container.appendChild(this.container);
    };

    /**
     * Destroy floating layer. no layer after destroying then
     */


    FloatingLayer.prototype.beforeDestroy = function beforeDestroy() {
        var siblings = this.siblings;
        var parent = this.parent;

        siblings['delete'](this);

        if (!siblings.size) {
            delete parent[VIEW_PROP];
            dom.css(parent, 'position', '');
        }

        dom.removeElement(this.container);
        dom.removeElement(this.dimm);

        this.options = this.siblings = this.zIndex = null;
    };

    /**
     * Destructor
     * @override
     * @api
     */


    FloatingLayer.prototype.destroy = function destroy() {
        _view2['default'].prototype.destroy.call(this);
    };

    /**
     * Set layer content
     * @param {string} html - html string
     */


    FloatingLayer.prototype.setContent = function setContent(html) {
        this.container.innerHTML = html;
    };

    /**
     * Get largest z-index value in this container
     * @returns {number}
     */


    FloatingLayer.prototype.getLargestZIndex = function getLargestZIndex() {
        var indexes = [].concat(_toConsumableArray(this.siblings)).map(function (fl) {
            return fl.zIndex;
        });

        indexes.push(DEFAULT_ZINDEX);

        return Math.max.apply(Math, _toConsumableArray(indexes));
    };

    /**
     * Set focus to layer
     * @api
     */


    FloatingLayer.prototype.focus = function focus() {
        var largestZIndex = this.getLargestZIndex();
        var newZIndex = largestZIndex + 2;

        dom.css(this.container, 'zIndex', newZIndex);

        this.zIndex = newZIndex;

        if (!this.options.modaless) {
            dom.css(this.dimm, 'zIndex', this.zIndex - 1);
        }
    };

    /**
     * Show layer
     * @api
     */


    FloatingLayer.prototype.show = function show() {
        this.focus();
        dom.css(this.container, 'display', 'block');

        if (!this.options.modaless) {
            dom.css(this.dimm, 'display', 'block');
        }
    };

    /**
     * Hide layer
     * @api
     */


    FloatingLayer.prototype.hide = function hide() {
        dom.css(this.container, 'display', 'none');

        if (!this.options.modaless) {
            dom.css(this.dimm, 'display', 'none');
        }
    };

    return FloatingLayer;
}(_view2['default']);

exports['default'] = FloatingLayer;

},{"./view":4}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _core = require('./core');

var core = _interopRequireWildcard(_core);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @fileoverview The base class of views.
                                                                                                                                                           * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
                                                                                                                                                           */


var util = tui.util;

/**
 * Property for represent all view instance element
 * @type {string}
 */
var VIEW_PROP = 'feView';

/**
 * Basic view class
 * @mixes tui.util.CustomEvents
 * @param {HTMLElement} container - base container element
 */

var View = function () {
    function View(container) {
        _classCallCheck(this, View);

        container = container || this.createFallbackElement();

        /**
         * Unique ID for each view instance
         * @type {string}
         */
        this.id = String(View.id);

        /**
         * Base container element for each view instance
         * @type {HTMLElement}
         */
        this.container = container;

        /**
         * Sub views
         * @type {View[]}
         */
        this.children = [];

        /**
         * Parent view
         * @type {View}
         */
        this.parent = null;

        /**
         * Cache for container bound
         */
        this.boundCache = null;

        View.id += 1;
        dom.setData(container, VIEW_PROP, this.id);
    }

    /**
     * Invoke before destroying
     */


    View.prototype.beforeDestroy = function beforeDestroy() {};

    /**
     * Clear instance properties for destroying
     */


    View.prototype.clearProperties = function clearProperties() {
        this.beforeDestroy();

        dom.removeElement(this.container);

        this.id = this.parent = this.children = this.container = this.boundCache = null;
    };

    /**
     * Destroy view instance
     * @param {boolean} [onlyChildren=false] - set true then destroy only
     *  children
     */


    View.prototype.destroy = function destroy() {
        var onlyChildren = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        this.children.forEach(function (childView) {
            childView.destroy();
        });

        if (onlyChildren) {
            return;
        }

        this.clearProperties();
    };

    /**
     * Get container's size and position. return bounds from
     *  getBoundingClientRect()
     *
     * It return cached bounds until View.boundCache exists for performance iss
     * ue. if you want re-calculate conatiner's bound then use bound setter or
     * just clear boundCache
     * property.
     * @returns {object} size and position
     */


    View.prototype.getBound = function getBound() {
        var bound = this.boundCache;

        if (!bound) {
            bound = this.boundCache = Object.assign({}, dom.getRect(this.container));
        }

        return bound;
    };

    /**
     * Set container's size and position
     * @param {object} options - options
     * @param {number} [options.top] - top pixel
     * @param {number} [options.right] - right pixel
     * @param {number} [options.bottom] - bottom pixel
     * @param {number} [options.left] - left pixel
     * @param {number} [options.width] - width pixel
     * @param {number} [options.height] - height pixel
     */


    View.prototype.setBound = function setBound() {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var top = _ref.top;
        var right = _ref.right;
        var bottom = _ref.bottom;
        var left = _ref.left;
        var width = _ref.width;
        var height = _ref.height;

        dom.setBound(this.container, { top: top, right: right, bottom: bottom, left: left, width: width, height: height });

        this.boundCache = null;
    };

    /**
     * Create fallback element when invoke constructor without container
     * @returns {HTMLElement} fallback division element
     */


    View.prototype.createFallbackElement = function createFallbackElement() {
        var el = document.createElement('div');
        document.body.appendChild(el);

        return el;
    };

    /**
     * Add child view
     * @param {View} view - child view to add
     * @param {function} [before] - function that invoke before add
     */


    View.prototype.addChild = function addChild(view) {
        var before = arguments.length <= 1 || arguments[1] === undefined ? core.noop : arguments[1];

        var children = this.children;

        if (children.findIndex(function (v) {
            return view === v;
        }) > -1) {
            return;
        }

        before.call(view, this);

        // add parent view
        view.parent = this;

        children.push(view);
    };

    /**
     * Remove child views
     * @param {string|View} id - child view id or instance itself
     * @param {function} [before] - function that invoke before remove
     */


    View.prototype.removeChild = function removeChild(id, before) {
        var children = this.children;
        var _id = util.isString(id) ? id : id.id;
        var index = children.findIndex(function (v) {
            return _id === v.id;
        });

        before = before || core.noop;

        if (index < 0) {
            return;
        }

        var view = children[index];

        before.call(view, this);

        children.splice(index, 1);
    };

    /**
     * Render view recursively
     */


    View.prototype.render = function render() {
        this.children.forEach(function (childView) {
            childView.render();
        });
    };

    /**
     * Invoke function recursively.
     * @param {function} iteratee - function to invoke child view recursively
     * @param {boolean} [skipThis=false] - set true then skip invoke with
     *  this(root) view.
     */


    View.prototype.recursive = function recursive() {
        var iteratee = arguments.length <= 0 || arguments[0] === undefined ? core.noop : arguments[0];
        var skipThis = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        if (!skipThis) {
            iteratee(this);
        }

        this.children.forEach(function (childView) {
            childView.recursive(iteratee);
        });
    };

    /**
     * Resize view recursively to parent.
     * @param {...*} [args] - arguments for supplied to each parent view.
     */


    View.prototype.resize = function resize() {
        var parent = this.parent;

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        while (parent) {
            if (util.isFunction(parent._onResize)) {
                parent._onResize.apply(parent, args);
            }

            parent = parent.parent;
        }
    };

    return View;
}();

/**
 * @static
 */


exports['default'] = View;
View.id = 0;

tui.util.CustomEvents.mixin(View);

},{"./core":2}]},{},[1]);
