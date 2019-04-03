/*!
 * tui-tree.js
 * @version 3.5.3
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 * @license MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("tui-code-snippet"), require("tui-context-menu"));
	else if(typeof define === 'function' && define.amd)
		define(["tui-code-snippet", "tui-context-menu"], factory);
	else if(typeof exports === 'object')
		exports["Tree"] = factory(require("tui-code-snippet"), require("tui-context-menu"));
	else
		root["tui"] = root["tui"] || {}, root["tui"]["Tree"] = factory((root["tui"] && root["tui"]["util"]), (root["tui"] && root["tui"]["ContextMenu"]));
})(this, function(__WEBPACK_EXTERNAL_MODULE_9__, __WEBPACK_EXTERNAL_MODULE_22__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(1);

	module.exports = __webpack_require__(7);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Render tree and update tree
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */

	var util = __webpack_require__(8);
	var defaultOption = __webpack_require__(10);
	var states = __webpack_require__(11);
	var messages = __webpack_require__(12);
	var outerTemplate = __webpack_require__(13);
	var ajaxCommand = __webpack_require__(14);
	var TreeModel = __webpack_require__(15);
	var Selectable = __webpack_require__(17);
	var Draggable = __webpack_require__(18);
	var Editable = __webpack_require__(19);
	var Checkbox = __webpack_require__(20);
	var ContextMenu = __webpack_require__(21);
	var Ajax = __webpack_require__(23);

	var nodeStates = states.node;
	var features = {
	    Selectable: Selectable,
	    Draggable: Draggable,
	    Editable: Editable,
	    Checkbox: Checkbox,
	    ContextMenu: ContextMenu,
	    Ajax: Ajax
	};
	var snippet = __webpack_require__(9);
	var extend = snippet.extend;

	var TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK = 200;
	var MOUSE_MOVING_THRESHOLD = 5;

	/**
	 * Create tree model and inject data to model
	 * @class Tree
	 * @param {string|HTMLElement|jQueryObject} container - Tree container element or id string value
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
	 *     @param {Function} [options.renderTemplate] Function for rendering template
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
	var Tree = snippet.defineClass(/** @lends Tree.prototype */ {
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
	         * @type {number}
	         * @private
	         */
	        this._mouseMovingFlag = false;

	        /**
	         * Render template
	         * It can be overrode by user's template engine.
	         * @type {Function}
	         * @private
	         */
	        this._renderTemplate = options.renderTemplate || util.renderTemplate;

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

	        if (options.usageStatistics) {
	            util.sendHostName();
	        }
	    },

	    /**
	     * Set root element of tree
	     * @param {string|HTMLElement|jQueryObject} container - Container element or id selector
	     * @private
	     */
	    _setRoot: function(container) {
	        var rootElement = outerTemplate.ROOT;

	        if (snippet.isString(container)) {
	            container = document.getElementById(container);
	        } else if (container.jquery) {
	            container = container[0];
	        }

	        if (!snippet.isHTMLNode(container)) {
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
	        this.model.on({
	            update: this._draw,
	            move: this._onMove
	        }, this);
	        util.addEventListener(this.rootElement, 'click', snippet.bind(this._onClick, this));
	        util.addEventListener(this.rootElement, 'mousedown', snippet.bind(this._onMousedown, this));
	        util.addEventListener(this.rootElement, 'dblclick', snippet.bind(this._onDoubleClick, this));
	        util.addEventListener(this.rootElement, 'contextmenu', snippet.bind(this._onContextMenu, this));
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
	        var self = this,
	            clientX = downEvent.clientX,
	            clientY = downEvent.clientY,
	            abs = Math.abs;

	        /* eslint-disable require-jsdoc */
	        function onMouseMove(moveEvent) {
	            var newClientX = moveEvent.clientX,
	                newClientY = moveEvent.clientY;

	            if (abs(newClientX - clientX) + abs(newClientY - clientY) > MOUSE_MOVING_THRESHOLD) {
	                self.fire('mousemove', moveEvent);
	                self._mouseMovingFlag = true;
	            }
	        }

	        function onMouseUp(upEvent) {
	            self.fire('mouseup', upEvent);
	            util.removeEventListener(document, 'mousemove', onMouseMove);
	            util.removeEventListener(document, 'mouseup', onMouseUp);
	            util.removeEventListener(document, 'mouseout', onMouseOut);
	        }

	        function onMouseOut(event) {
	            if (event.toElement === null) {
	                self.fire('mouseup', event);
	            }
	        }
	        /* eslint-enable require-jsdoc */

	        this._mouseMovingFlag = false;
	        this.fire('mousedown', downEvent);
	        util.addEventListener(document, 'mousemove', onMouseMove);
	        util.addEventListener(document, 'mouseup', onMouseUp);
	        util.addEventListener(document, 'mouseout', onMouseOut);
	    },

	    /**
	     * Event handler - click
	     * @param {MouseEvent} event - Click event
	     * @private
	     */
	    _onClick: function(event) {
	        var target = util.getTarget(event);
	        var self = this;
	        var nodeId;

	        if (util.isRightButton(event)) {
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
	            this.fire('singleClick', event);
	            this.clickTimer = setTimeout(function() {
	                self.resetClickTimer();
	            }, TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK);
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

	        nodeElement = util.getElementsByClassName(
	            document.getElementById(nodeId),
	            this.classNames.toggleBtnClass
	        )[0];

	        return (nodeElement && nodeElement.contains(target));
	    },

	    /**
	     * Set node state - opened or closed
	     * @param {string} nodeId - Node id
	     * @param {string} state - Node state
	     * @private
	     */
	    _setDisplayFromNodeState: function(nodeId, state) {
	        var subtreeElement = this._getSubtreeElement(nodeId),
	            label, btnElement, nodeElement, firstTextNode;

	        if (!subtreeElement || subtreeElement === this.rootElement) {
	            return;
	        }
	        label = this.stateLabels[state];
	        nodeElement = document.getElementById(nodeId);

	        btnElement = util.getElementsByClassName(
	            nodeElement,
	            this.classNames.toggleBtnClass
	        )[0];

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
	        var classNames = this.classNames,
	            openedClassName = classNames[nodeStates.OPENED + 'Class'],
	            closedClassName = classNames[nodeStates.CLOSED + 'Class'];

	        util.removeClass(nodeElement, openedClassName);
	        util.removeClass(nodeElement, closedClassName);
	        util.addClass(nodeElement, classNames[state + 'Class']);
	    },

	    /**
	     * Make html
	     * @param {Array.<string>} nodeIds - Node id list
	     * @returns {string} HTML
	     * @private
	     * @see outerTemplate uses "util.renderTemplate"
	     */
	    _makeHtml: function(nodeIds) {
	        var model = this.model,
	            html = '';

	        snippet.forEach(nodeIds, function(nodeId) {
	            var node = model.getNode(nodeId),
	                sources, props;

	            if (!node) {
	                return;
	            }

	            sources = this._getTemplate(node);
	            props = this._makeTemplateProps(node);
	            props.innerTemplate = this._makeInnerHTML(node, {
	                source: sources.inner,
	                props: props
	            });
	            html += util.renderTemplate(sources.outer, props);
	        }, this);

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
	        var classNames = this.classNames,
	            id = node.getId(),
	            props = {
	                id: id,
	                indent: this.getIndentWidth(id)
	            }, state;

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
	        var node = this.model.getNode(nodeId),
	            element, html;

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
	        this.fire('beforeDraw', {nodeId: nodeId});

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
	        this.fire('afterDraw', {nodeId: nodeId});
	    },

	    /**
	     * Update class name by features on below<br>
	     * - leaf node: has classNames.leafClass<br>
	     * - internal node + opened: has classNames.openedClass, child is visible<br>
	     * - internal node + closed: has classNames.closedClass, child is not visible<br>
	     * @param {TreeNode} node - (re)drawing starts from this node
	     * @private
	     */
	    _setClassNameAndVisibilityByFeature: function(node) {
	        var nodeId = node.getId(),
	            element = document.getElementById(nodeId),
	            classNames = this.classNames;

	        if (node.isLeaf()) {
	            util.removeClass(element, classNames.openedClass);
	            util.removeClass(element, classNames.closedClass);
	            util.addClass(element, classNames.leafClass);
	        } else {
	            util.removeClass(element, classNames.leafClass);
	            this._setDisplayFromNodeState(nodeId, node.getState());
	            this.each(function(child) {
	                this._setClassNameAndVisibilityByFeature(child);
	            }, nodeId, this);
	        }
	    },

	    /**
	     * Get subtree element
	     * @param {string} nodeId - TreeNode id
	     * @returns {HTMLElement} Subtree element
	     * @private
	     */
	    _getSubtreeElement: function(nodeId) {
	        var node = this.model.getNode(nodeId),
	            subtreeElement;

	        if (!node || node.isLeaf()) {
	            subtreeElement = null;
	        } else if (node.isRoot()) {
	            subtreeElement = this.rootElement;
	        } else {
	            subtreeElement = util.getElementsByClassName(
	                document.getElementById(nodeId),
	                this.classNames.subtreeClass
	            )[0];
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
	        var self = this;
	        var treeAjax = this.enabledFeatures.Ajax;
	        var useAjax = options ? options.useAjax : !!treeAjax;
	        var isSilent = options ? options.isSilent : false;

	        if (useAjax) {
	            treeAjax.loadData(ajaxCommand.UPDATE, function() {
	                self._setNodeData(nodeId, data);
	            }, {
	                nodeId: nodeId,
	                data: data,
	                type: 'set'
	            });
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
	        var self = this;
	        var treeAjax = this.enabledFeatures.Ajax;
	        var useAjax = options ? options.useAjax : !!treeAjax;
	        var isSilent = options ? options.isSilent : false;

	        if (useAjax) {
	            treeAjax.loadData(ajaxCommand.UPDATE, function() {
	                self._removeNodeData(nodeId, names);
	            }, {
	                nodeId: nodeId,
	                names: names,
	                type: 'remove'
	            });
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
	        snippet.forEach(parentIds, function(parentId) {
	            this._openNode(parentId);
	        }, this);
	    },
	    /**
	     * Open one target node
	     * @param {string} nodeId - Node id
	     * @private
	     */
	    _openNode: function(nodeId) {
	        var node = this.model.getNode(nodeId);
	        var state = nodeStates.OPENED;
	        var isAllowStateChange = (
	            node &&
	            !node.isRoot() &&
	            node.getState() === nodeStates.CLOSED
	        );

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
	        this.model.each(function(searchNode, searchNodeId) {
	            if (!searchNode.isLeaf()) {
	                this._closeNode(searchNodeId);
	            }
	        }, nodeId, this);
	    },

	    /**
	     * Close one target node
	     * @param {string} nodeId - Node id
	     * @private
	     */
	    _closeNode: function(nodeId) {
	        var node = this.model.getNode(nodeId);
	        var state = nodeStates.CLOSED;
	        var isAllowStateChange = (
	            node &&
	            !node.isRoot() &&
	            node.getState() === nodeStates.OPENED
	        );
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
	        var isReload = snippet.isUndefined(node.getData('reload')) ||
	            node.getData('reload');

	        if (state === nodeStates.CLOSED) { // open -> close action
	            this._setNodeData(nodeId, {
	                reload: false
	            }, true);
	        }

	        if (state === nodeStates.OPENED && isReload) { // close -> open action
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
	        var self = this;
	        var treeAjax = this.enabledFeatures.Ajax;
	        var useAjax = options ? options.useAjax : !!treeAjax;
	        var isSilent = options ? options.isSilent : false;
	        var newChildIds;

	        if (useAjax) {
	            treeAjax.loadData(ajaxCommand.CREATE, function() {
	                return self._add(data, parentId);
	            }, {
	                parentId: parentId,
	                data: data
	            });
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
	        var self = this;
	        var treeAjax = this.enabledFeatures.Ajax;
	        var nodeId = options ? options.nodeId : this.getRootNodeId();
	        var useAjax = options ? options.useAjax : !!treeAjax;
	        var newChildIds;

	        if (useAjax) {
	            treeAjax.loadData(ajaxCommand.READ, function(response) {
	                return self._resetAllData(response, nodeId);
	            }, {
	                nodeId: nodeId
	            });
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
	        var self = this;
	        var treeAjax = this.enabledFeatures.Ajax;
	        var useAjax = options ? options.useAjax : !!treeAjax;
	        var isSilent = options ? options.isSilent : false;

	        if (useAjax) {
	            treeAjax.loadData(ajaxCommand.DELETE_ALL_CHILDREN, function() {
	                self._removeAllChildren(nodeId);
	            }, {
	                parentId: nodeId
	            });
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

	        snippet.forEach(children, function(childId) {
	            this._remove(childId, true);
	        }, this);

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
	        var self = this;
	        var treeAjax = this.enabledFeatures.Ajax;
	        var useAjax = options ? options.useAjax : !!treeAjax;
	        var isSilent = options ? options.isSilent : false;

	        if (useAjax) {
	            treeAjax.loadData(ajaxCommand.DELETE, function() {
	                self._remove(nodeId);
	            }, {
	                nodeId: nodeId
	            });
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
	        var self = this;
	        var treeAjax = this.enabledFeatures.Ajax;
	        var useAjax = options ? options.useAjax : !!treeAjax;
	        var isSilent = options ? options.isSilent : false;

	        if (useAjax) {
	            treeAjax.loadData(ajaxCommand.MOVE, function() {
	                if (self.getParentId(nodeId) !== newParentId) { // just move, not sort!
	                    self.setNodeData(newParentId, {
	                        reload: true
	                    }, true);
	                }
	                self._move(nodeId, newParentId, index);
	            }, {
	                nodeId: nodeId,
	                newParentId: newParentId,
	                index: index
	            });
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
	        if (!this.invoke('beforeMove', {
	            nodeId: nodeId,
	            newParentId: newParentId
	        })) {
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
	        if (!snippet.isObject(predicate)) {
	            return [];
	        }

	        if (snippet.isFunction(predicate)) {
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
	            var result = true,
	                data = node.getAllData();

	            snippet.forEach(props, function(value, key) {
	                result = (key in data) && (data[key] === value);

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
	     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable', 'ContextMenu'
	     * @param {object} [options] - Feature options
	     * @returns {Tree} this
	     * @example
	     * tree
	     *  .enableFeature('Selectable', {
	     *      selectedClassName: 'tui-tree-selected'
	     *  })
	     *  .enableFeature('Editable', {
	     *      enableClassName: tree.classNames.textClass,
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
	     *              dataType: 'json',
	     *              type: 'get'
	     *          },
	     *          create: {
	     *              url: 'api/create',
	     *              dataType: 'json',
	     *              type: 'post'
	     *          },
	     *          update: {
	     *              url: 'api/update',
	     *              dataType: 'json',
	     *              type: 'post',
	     *              data: {
	     *                  paramA: 'a',
	     *                  paramB: 'b'
	     *              }
	     *          },
	     *          remove: {
	     *              url: 'api/remove',
	     *              dataType: 'json',
	     *              type: 'post',
	     *              data: function(params) {
	     *                  return {
	     *                      paramA: params.a,
	     *                      paramB: params.b
	     *                  };
	     *              }
	     *          },
	     *          removeAllChildren: {
	     *              url: function(params) {
	     *                  return 'api/remove_all/' + params.nodeId,
	     *              },
	     *              dataType: 'json',
	     *              type: 'post'
	     *          },
	     *          move: {
	     *              url: 'api/move',
	     *              dataType: 'json',
	     *              type: 'post'
	     *          }
	     *      },
	     *      parseData: function(type, response) {
	     *          if (type === 'read' && response.code === '200') {
	     *              return response;
	     *          } else {
	     *              return false;
	     *          }
	     *      }
	     *  });
	     */
	    enableFeature: function(featureName, options) {
	        var Feature = features[featureName];
	        this.disableFeature(featureName);
	        if (Feature) {
	            this.enabledFeatures[featureName] = new Feature(this, options);
	            this.fire('initFeature');
	        }

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
	});

	/**
	 * Set abstract apis to tree prototype
	 * @param {string} featureName - Feature name
	 * @param {object} feature - Feature
	 * @ignore
	 */
	function setAbstractAPIs(featureName, feature) {
	    var messageName = 'INVALID_API_' + featureName.toUpperCase(),
	        apiList = feature.getAPIList ? feature.getAPIList() : [];

	    snippet.forEach(apiList, function(api) {
	        Tree.prototype[api] = function() {
	            throw new Error(messages[messageName] || messages.INVALID_API);
	        };
	    });
	}
	snippet.forEach(features, function(Feature, name) {
	    setAbstractAPIs(name, Feature);
	});
	snippet.CustomEvents.mixin(Tree);

	module.exports = Tree;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Helper object to make easy tree elements
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */
	var snippet = __webpack_require__(9);
	var isUndefined = snippet.isUndefined,
	    pick = snippet.pick,
	    templateMaskRe = /\{\{(.+?)}}/gi,
	    isValidDotNotationRe = /^\w+(?:\.\w+)*$/,
	    isValidDotNotation = function(str) {
	        return isValidDotNotationRe.test(str);
	    },
	    isArray = snippet.isArraySafe,
	    forEach = snippet.forEach,
	    browser = snippet.browser,
	    isSupportPageOffset = typeof window.pageXOffset !== 'undefined',
	    isCSS1Compat = document.compatMode === 'CSS1Compat',
	    isOlderIE = (browser.msie && browser.version < 9),
	    hostnameSent = false;

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
	        var index = arr.length - 1;

	        while (index > -1) {
	            if (item === arr[index]) {
	                arr.splice(index, 1);
	            }
	            index -= 1;
	        }
	    },

	    /**
	     * Add classname
	     * @param {HTMLElement} element - Target element
	     * @param {string} className - Classname
	     */
	    addClass: function(element, className) {
	        if (!element) {
	            return;
	        }

	        if (element.className === '') {
	            element.className = className;
	        } else if (!util.hasClass(element, className)) {
	            element.className += ' ' + className;
	        }
	    },

	    /**
	     * Remove classname
	     * @param {HTMLElement} element - Target element
	     * @param {string} className - Classname
	     */
	    removeClass: function(element, className) {
	        var originalClassName = util.getClass(element),
	            arr, index;

	        if (!originalClassName) {
	            return;
	        }

	        arr = originalClassName.split(' ');
	        index = snippet.inArray(className, arr);
	        if (index !== -1) {
	            arr.splice(index, 1);
	            element.className = arr.join(' ');
	        }
	    },

	    /**
	     * Add event to element
	     * @param {Object} element A target element
	     * @param {String} eventName A name of event
	     * @param {Function} handler A callback function to add
	     */
	    addEventListener: function(element, eventName, handler) {
	        if (element.addEventListener) {
	            element.addEventListener(eventName, handler, false);
	        } else {
	            element.attachEvent('on' + eventName, handler);
	        }
	    },

	    /**
	     * Remove event from element
	     * @param {Object} element A target element
	     * @param {String} eventName A name of event
	     * @param {Function} handler A callback function to remove
	     */
	    removeEventListener: function(element, eventName, handler) {
	        if (element.removeEventListener) {
	            element.removeEventListener(eventName, handler, false);
	        } else {
	            element.detachEvent('on' + eventName, handler);
	        }
	    },

	    /**
	     * Get target element
	     * @param {Event} e Event object
	     * @returns {HTMLElement} Event target
	     */
	    getTarget: function(e) {
	        var target;
	        e = e || window.event;
	        target = e.target || e.srcElement;

	        return target;
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
	     * Get class name
	     * @param {HTMLElement} element HTMLElement
	     * @returns {string} Class name
	     */
	    getClass: function(element) {
	        return element && element.getAttribute &&
	            (element.getAttribute('class') || element.getAttribute('className') || '');
	    },

	    /**
	     * Check the element has specific class or not
	     * @param {HTMLElement} element A target element
	     * @param {string} className A name of class to find
	     * @returns {boolean} Whether the element has the class
	     */
	    hasClass: function(element, className) {
	        var elClassName = util.getClass(element);

	        return elClassName.indexOf(className) > -1;
	    },

	    /**
	     * Find element by class name
	     * @param {HTMLElement} target A target element
	     * @param {string} className A name of class
	     * @returns {Array.<HTMLElement>} Elements
	     */
	    getElementsByClassName: function(target, className) {
	        var all, filtered;

	        if (target.querySelectorAll) {
	            filtered = target.querySelectorAll('.' + className);
	        } else {
	            all = snippet.toArray(target.getElementsByTagName('*'));
	            filtered = snippet.filter(all, function(el) {
	                var classNames = el.className || '';

	                return (classNames.indexOf(className) !== -1);
	            });
	        }

	        if (!filtered) {
	            filtered = [];
	        }

	        return filtered;
	    },

	    /**
	     * Find element by class name among child nodes
	     * @param {HTMLElement} target A target element
	     * @param {string} className A name of class
	     * @returns {Array.<HTMLElement>} Elements
	     */
	    getChildElementByClassName: function(target, className) {
	        var children = target.childNodes;
	        var i = 0;
	        var length = children.length;
	        var child;

	        for (; i < length; i += 1) {
	            child = children[i];
	            if (util.hasClass(child, className)) {
	                return child;
	            }
	        }

	        return null;
	    },

	    /**
	     * Check whether the click event by right button
	     * @param {MouseEvent} event Event object
	     * @returns {boolean} Whether the click event by right button
	     */
	    isRightButton: function(event) {
	        return util._getButton(event) === 2;
	    },

	    /**
	     * Whether the property exist or not
	     * @param {Array} props A property
	     * @returns {string|boolean} Property name or false
	     * @example
	     * var userSelectProperty = util.testProp([
	     *     'userSelect',
	     *     'WebkitUserSelect',
	     *     'OUserSelect',
	     *     'MozUserSelect',
	     *     'msUserSelect'
	     * ]);
	     */
	    testProp: function(props) {
	        var style = document.documentElement.style,
	            propertyName = false;

	        /* eslint-disable consistent-return */
	        snippet.forEach(props, function(prop) {
	            if (prop in style) {
	                propertyName = prop;

	                return false;
	            }
	        });
	        /* eslint-enable consistent-return */

	        return propertyName;
	    },

	    /**
	     * Prevent default event
	     * @param {Event} event Event object
	     */
	    preventDefault: function(event) {
	        if (event.preventDefault) {
	            event.preventDefault();
	        } else {
	            event.returnValue = false;
	        }
	    },

	    /**
	     * Make html from template
	     * @param {string} source - Template html
	     * @param {Object} props - Template data
	     * @returns {string} html
	     */
	    renderTemplate: function(source, props) {
	        /* eslint-disable require-jsdoc */
	        function pickValue(names) {
	            return pick.apply(null, [props].concat(names));
	        }
	        /* eslint-enable require-jsdoc */

	        return source.replace(templateMaskRe, function(match, name) {
	            var value;

	            if (isValidDotNotation(name)) {
	                value = pickValue(name.split('.'));
	            }

	            if (isArray(value)) {
	                value = value.join(' ');
	            } else if (isUndefined(value)) {
	                value = '';
	            }

	            return value;
	        });
	    },

	    /**
	     * Normalization for event button property
	     * 0: First mouse button, 2: Second mouse button, 1: Center button
	     * @param {MouseEvent} event Event object
	     * @returns {?number} button type
	     * @private
	     */
	    _getButton: function(event) {
	        var primary = '0,1,3,5,7';
	        var secondary = '2,6';
	        var wheel = '4';
	        var result = null;
	        var button;

	        if (document.implementation.hasFeature('MouseEvents', '2.0')) {
	            return event.button;
	        }

	        button = String(event.button);
	        if (primary.indexOf(button) > -1) {
	            result = 0;
	        } else if (secondary.indexOf(button) > -1) {
	            result = 2;
	        } else if (wheel.indexOf(button) > -1) {
	            result = 1;
	        }

	        return result;
	    },

	    /**
	     * Get mouse position
	     * @param {MouseEvet} event - Event object
	     * @returns {object} X, Y position of mouse
	     */
	    getMousePos: function(event) {
	        return {
	            x: event.clientX,
	            y: event.clientY
	        };
	    },

	    /**
	     * Get value of scroll top on document.body (cross browsing)
	     * @returns {number} Value of scroll top
	     */
	    getWindowScrollTop: function() {
	        var scrollTop;

	        if (isSupportPageOffset) {
	            scrollTop = window.pageYOffset;
	        } else {
	            scrollTop = isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
	        }

	        return scrollTop;
	    },

	    /**
	     * Get top position value of element
	     * @param {HTMLElement} element - Target element
	     * @returns {number} Top position value
	     */
	    getElementTop: function(element) {
	        var actualTop = 0;
	        var scrollTop;

	        while (element) {
	            if (element.tagName.toLowerCase === 'body') {
	                scrollTop = util.getWindowScrollTop();
	            } else {
	                scrollTop = element.scrollTop;
	            }

	            actualTop += element.offsetTop - scrollTop + element.clientTop;
	            element = element.offsetParent;
	        }

	        return actualTop;
	    },

	    /**
	     * Get first text node in target element
	     * @param {HTMLElement} element - Target element to find
	     * @returns {HTMLElement} Text node
	     */
	    getFirstTextNode: function(element) {
	        var childElements = snippet.toArray(element.childNodes);
	        var firstTextNode = '';

	        forEach(childElements, function(childElement) {
	            if (childElement.nodeName === '#text') {
	                firstTextNode = childElement;

	                return false;
	            }

	            return true;
	        });

	        return firstTextNode;
	    },

	    /**
	     * Remove element from parent element
	     * @param {HTMLElement} element - Target element to remove
	     */
	    removeElement: function(element) {
	        if (element && element.parentNode) {
	            element.parentNode.removeChild(element);
	        }
	    },

	    /**
	     * Get change event name as browser
	     * @returns {string} Event name
	     */
	    getChangeEventName: function() {
	        var changeEventName;

	        if (isOlderIE) {
	            changeEventName = 'propertychange';
	        } else {
	            changeEventName = 'change';
	        }

	        return changeEventName;
	    },

	    /**
	     * send hostname
	     */
	    sendHostName: function() {
	        if (hostnameSent) {
	            return;
	        }
	        hostnameSent = true;

	        snippet.sendHostname('tree', 'UA-129987462-1');
	    }
	};

	module.exports = util;


/***/ }),
/* 9 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_9__;

/***/ }),
/* 10 */
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
/* 11 */
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
/* 12 */
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
/* 13 */
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
	    INTERNAL_NODE:
	        '<li id="{{id}}" class="{{nodeClass}} {{stateClass}}">' +
	            '{{innerTemplate}}' +
	        '</li>',
	    LEAF_NODE:
	        '<li id="{{id}}" class="{{nodeClass}} {{leafClass}}">' +
	            '{{innerTemplate}}' +
	        '</li>'
	};


/***/ }),
/* 14 */
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
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Update view and control tree data
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */
	var TreeNode = __webpack_require__(16);
	var snippet = __webpack_require__(9);

	var extend = snippet.extend,
	    keys = snippet.keys,
	    forEach = snippet.forEach,
	    map = snippet.map;

	/**
	 * Tree model
	 * @class TreeModel
	 * @param {Array} data - Data
	 * @param {Object} options - Options for defaultState and nodeIdPrefix
	 * @ignore
	 */
	var TreeModel = snippet.defineClass(/** @lends TreeModel.prototype */{
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
	        this.rootNode = new TreeNode({
	            state: 'opened'
	        }, null);

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
	        var root = this.rootNode,
	            rootId = root.getId();

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
	        var parentId = parent.getId(),
	            ids = [];

	        forEach(data, function(datum) {
	            var childrenData = datum.children,
	                node = this._createNode(datum, parentId),
	                nodeId = node.getId();

	            ids.push(nodeId);
	            this.treeHash[nodeId] = node;
	            parent.addChildId(nodeId);
	            this._makeTreeHash(childrenData, node);
	        }, this);

	        return ids;
	    },

	    /**
	     * Create node
	     * @param {object} nodeData - Datum of node
	     * @param {string} parentId - Parent id
	     * @returns {TreeNode} TreeNode
	     */
	    _createNode: function(nodeData, parentId) {
	        nodeData = extend({
	            state: this.nodeDefaultState
	        }, nodeData);

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

	        return map(childIds, function(childId) {
	            return this.getNode(childId);
	        }, this);
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
	        return keys(this.treeHash).length;
	    },

	    /**
	     * Get last depth
	     * @returns {number} The last depth
	     */
	    getLastDepth: function() {
	        var depths = map(this.treeHash, function(node) {
	            return this.getDepth(node.getId());
	        }, this);

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
	        var node = this.getNode(id),
	            depth = 0,
	            parent;

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

	        return map(parentsNodeList, function(parentsNode) {
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
	        var node = this.getNode(id),
	            parent;

	        if (!node) {
	            return;
	        }

	        parent = this.getNode(node.getParentId());

	        forEach(node.getChildIds(), function(childId) {
	            this.remove(childId, true);
	        }, this);

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
	        var parent = this.getNode(parentId) || this.rootNode,
	            ids;

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

	        if (snippet.isArray(names)) {
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
	        sameParent = (index === -1) && (originalParentId === newParentId);

	        if (nodeId === newParentId || sameParent ||
	            this.contains(nodeId, newParentId)) {
	            return;
	        }

	        this._changeOrderOfIds(nodeId, newParentId, originalParentId, index);

	        if (!isSilent) {
	            this.fire('move', nodeId, originalParentId, newParentId, index);
	        }
	    }, /* eslint-enable complexity*/

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
	        var isSameParentIds = (newParentId === originalParentId);

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
	        var parentId = this.getParentId(containedId),
	            isContained = false;

	        while (!isContained && parentId) {
	            isContained = (containerId === parentId);
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

	                childIds = map(children, function(child) {
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

	        forEach(this.treeHash, function() {
	            iteratee.apply(context, arguments);
	        });
	    },

	    /**
	     * Traverse this tree iterating over all descendants of a node.
	     * @param {Function} iteratee - Iteratee function
	     * @param {string} parentId - Parent node id
	     * @param {object} [context] - Context of iteratee
	     */
	    each: function(iteratee, parentId, context) { // depth-first
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
	});

	snippet.CustomEvents.mixin(TreeModel);
	module.exports = TreeModel;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Control each tree node's data
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */
	var snippet = __webpack_require__(9);
	var states = __webpack_require__(11).node,
	    util = __webpack_require__(8);

	var lastIndex = 0,
	    getNextIndex = function() {
	        var index = lastIndex;
	        lastIndex += 1;

	        return index;
	    },
	    RESERVED_PROPERTIES = {
	        id: '',
	        state: 'setState',
	        children: ''
	    },
	    inArray = snippet.inArray;

	/**
	 * TreeNode
	 * @Class TreeNode
	 * @param {Object} nodeData - Node data
	 * @param {string} [parentId] - Parent node id
	 * @ignore
	 */
	var TreeNode = snippet.defineClass(/** @lends TreeNode.prototype */{
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
	        snippet.forEachOwnProperties(RESERVED_PROPERTIES, function(setter, name) {
	            var value = data[name];

	            if (value && setter) {
	                this[setter](value);
	            }
	            delete data[name];
	        }, this);

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

	        if (snippet.inArray(childIds, id) === -1) {
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
	        return snippet.extend({}, this._data);
	    },

	    /**
	     * Set data
	     * @param {Object} data - Data for adding
	     */
	    setData: function(data) {
	        data = this._setReservedProperties(data);
	        snippet.extend(this._data, data);
	    },

	    /**
	     * Remove data
	     * @param {...string} names - Names of data
	     */
	    removeData: function() {
	        snippet.forEachArray(arguments, function(name) {
	            delete this._data[name];
	        }, this);
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
	        return snippet.isFalsy(this._parentId);
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
	});
	module.exports = TreeNode;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Feature that each tree node is possible to select as click
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */
	var util = __webpack_require__(8);
	var snippet = __webpack_require__(9);

	var API_LIST = [
	        'select',
	        'getSelectedNodeId',
	        'deselect'
	    ],
	    defaults = {
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
	var Selectable = snippet.defineClass(/** @lends Selectable.prototype */{
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
	        options = snippet.extend({}, defaults, options);

	        this.tree = tree;
	        this.selectedClassName = options.selectedClassName;
	        this.selectedNodeId = null;

	        tree.on({
	            singleClick: this.onSingleClick,
	            afterDraw: this.onAfterDraw
	        }, this);
	        this._setAPIs();
	    },

	    /**
	     * Set apis of selectable tree
	     * @private
	     */
	    _setAPIs: function() {
	        var tree = this.tree,
	            bind = snippet.bind;

	        snippet.forEach(API_LIST, function(apiName) {
	            tree[apiName] = bind(this[apiName], this);
	        }, this);
	    },

	    /**
	     * Disable this module
	     */
	    destroy: function() {
	        var tree = this.tree,
	            nodeElement = this.getPrevElement();

	        util.removeClass(nodeElement, this.selectedClassName);
	        tree.off(this);
	        snippet.forEach(API_LIST, function(apiName) {
	            delete tree[apiName];
	        });
	    },

	    /**
	     * Custom event handler "singleClick"
	     * @param {MouseEvent} event - Mouse event
	     */
	    onSingleClick: function(event) {
	        var target = util.getTarget(event),
	            nodeId = this.tree.getNodeIdFromElement(target);

	        this.select(nodeId, target);
	    },

	    /* eslint-disable valid-jsdoc */
	    /* Ignore "target" parameter annotation for API page
	       "tree.select(nodeId)"
	     */

	    /**
	     * Select node if the feature-"Selectable" is enabled.
	     * @memberof Tree.prototype
	     * @requires Selectable
	     * @param {string} nodeId - Node id
	     * @example
	     * tree.select('tui-tree-node-3');
	     */
	    select: function(nodeId, target) {/* eslint-enable valid-jsdoc */
	        var tree, prevElement, nodeElement,
	            selectedClassName, prevNodeId;

	        if (!nodeId) {
	            return;
	        }

	        tree = this.tree;
	        prevElement = this.getPrevElement();
	        nodeElement = document.getElementById(nodeId);
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
	        if (tree.invoke('beforeSelect', {
	            nodeId: nodeId,
	            prevNodeId: prevNodeId,
	            target: target
	        })) {
	            util.removeClass(prevElement, selectedClassName);
	            util.addClass(nodeElement, selectedClassName);

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
	            this.selectedNodeId = nodeId;
	        }
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

	        util.removeClass(nodeElement, this.selectedClassName);
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
	        tree.fire('deselect', {nodeId: nodeId});
	    },

	    /**
	     * Custom event handler - "afterDraw"
	     */
	    onAfterDraw: function() {
	        var nodeElement = this.getPrevElement();

	        if (nodeElement) {
	            util.addClass(nodeElement, this.selectedClassName);
	        }
	    }
	});

	module.exports = Selectable;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Feature that each tree node is possible to drag and drop
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */
	var util = __webpack_require__(8);
	var snippet = __webpack_require__(9);

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
	var rejectedTagNames = [
	    'INPUT',
	    'BUTTON',
	    'UL'
	];
	var selectKey = util.testProp(
	    ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']
	);
	var inArray = snippet.inArray;
	var forEach = snippet.forEach;
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
	var Draggable = snippet.defineClass(/** @lends Draggable.prototype */{
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
	        options = snippet.extend({}, defaultOptions, options);

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
	         * Selectable element's property
	         * @type {string}
	         */
	        this.userSelectPropertyKey = null;

	        /**
	         * Selectable element's property value
	         * @type {string}
	         */
	        this.userSelectPropertyValue = null;

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
	        util.removeElement(this.helperElement);
	        util.removeElement(this.lineElement);

	        this._restoreTextSelection();
	        this._detachMousedown();
	    },

	    /**
	     * Change helper element position
	     * @param {object} mousePos - Current mouse position
	     * @private
	     */
	    _changeHelperPosition: function(mousePos) {
	        var helperStyle = this.helperElement.style;
	        var pos = this.tree.rootElement.getBoundingClientRect();

	        helperStyle.top = (mousePos.y - pos.top + this.helperPos.y) + 'px';
	        helperStyle.left = (mousePos.x - pos.left + this.helperPos.x) + 'px';
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

	        util.addClass(helperElement, this.helperClassName);

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

	        util.addClass(lineElement, this.lineClassName);

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
	        util.removeElement(this.helperElement.getElementsByTagName('label')[0]);
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
	        var style = this.tree.rootElement.style;

	        util.addEventListener(this.tree.rootElement, 'selectstart', util.preventDefault);

	        this.userSelectPropertyKey = selectKey;
	        this.userSelectPropertyValue = style[selectKey];

	        style[selectKey] = 'none';
	    },

	    /**
	     * Restore text-selection
	     * @private
	     */
	    _restoreTextSelection: function() {
	        util.removeEventListener(this.tree.rootElement, 'selectstart', util.preventDefault);

	        if (this.userSelectPropertyKey) {
	            this.tree.rootElement.style[this.userSelectPropertyKey] = this.userSelectPropertyValue;
	        }
	    },

	    /**
	     * Return whether the target element is in rejectedTagNames or in rejectedClassNames
	     * @param {HTMLElement} target - Target element
	     * @returns {boolean} Whether the target is not draggable or draggable
	     * @private
	     */
	    _isNotDraggable: function(target) {
	        var tagName = target.tagName.toUpperCase();
	        var classNames = util.getClass(target).split(/\s+/);
	        var result;

	        if (inArray(tagName, this.rejectedTagNames) !== -1) {
	            return true;
	        }

	        forEach(classNames, function(className) {
	            result = inArray(className, this.rejectedClassNames) !== -1;

	            return !result;
	        }, this);

	        return result;
	    },

	    /**
	     * Event handler - mousedown
	     * @param {MouseEvent} event - Mouse event
	     * @private
	     */
	    _onMousedown: function(event) {
	        var tree = this.tree;
	        var target = util.getTarget(event);
	        var isEditing = (tree.enabledFeatures.Editable && tree.enabledFeatures.Editable.inputElement);
	        var nodeElement;

	        if (util.isRightButton(event) || this._isNotDraggable(target) || isEditing) {
	            return;
	        }

	        util.preventDefault(event);

	        this.currentNodeId = tree.getNodeIdFromElement(target);

	        if (this.useHelper) {
	            nodeElement = util.getElementsByClassName(
	                document.getElementById(this.currentNodeId),
	                tree.classNames.textClass
	            )[0];
	            this._setHelper(nodeElement.innerHTML);
	        }

	        tree.on({
	            mousemove: this._onMousemove,
	            mouseup: this._onMouseup
	        }, this);
	    },

	    /**
	     * Event handler - mousemove
	     * @param {MouseEvent} event - Mouse event
	     * @private
	     */
	    _onMousemove: function(event) {
	        var mousePos = util.getMousePos(event);
	        var target = util.getTarget(event);
	        var nodeId;

	        if (!this.useHelper) {
	            return;
	        }

	        this._setClassNameOnDragItem('add');
	        this._changeHelperPosition(mousePos);

	        nodeId = this.tree.getNodeIdFromElement(target);

	        if (nodeId) {
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
	        var target = util.getTarget(event);
	        var targetId = this._getTargetNodeId(target);
	        var index = this._getIndexToInsert(targetId);
	        var newParentId;

	        if (index === -1) { // When the node is created as a child after moving
	            newParentId = targetId;
	        } else {
	            newParentId = tree.getParentId(targetId);
	        }

	        if (nodeId !== newParentId) { // Don't fire beforeMove event
	            tree.move(nodeId, newParentId, index);
	        }

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
	     * @param {strig} nodeId - Selected tree node id
	     * @param {object} mousePos - Current mouse position
	     * @private
	     */
	    _applyMoveAction: function(nodeId, mousePos) {
	        var currentElement = document.getElementById(nodeId);
	        var targetPos = currentElement.getBoundingClientRect();
	        var hasClass = util.hasClass(currentElement, this.hoverClassName);
	        var isContain = this._isContain(targetPos, mousePos);
	        var boundaryType;

	        if (!this.hoveredElement && isContain) {
	            this.hoveredElement = currentElement;
	            this._hover(nodeId);
	        } else if (!hasClass) {
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

	        util.addClass(this.hoveredElement, this.hoverClassName);

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

	        util.removeClass(this.hoveredElement, this.hoverClassName);

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

	        if (this.isSortable) {
	            top += this.lineBoundary.top;
	            bottom -= this.lineBoundary.bottom;
	        }

	        if (targetPos.left < mousePos.x &&
	            targetPos.right > mousePos.x &&
	            top < mousePos.y && bottom > mousePos.y) {
	            return true;
	        }

	        return false;
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

	        if (mousePos.y < targetPos.top + this.lineBoundary.top) {
	            type = 'top';
	        } else if (mousePos.y > targetPos.bottom - this.lineBoundary.bottom) {
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
	        var scrollTop;

	        if (boundaryType) {
	            scrollTop = util.getElementTop(this.tree.rootElement.parentNode);
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
	            util.removeClass(this.hoveredElement, this.hoverClassName);
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

	        if (type === 'add') {
	            util.addClass(dragItemElement, dragItemClassName);
	        } else {
	            util.removeClass(dragItemElement, dragItemClassName);
	        }
	    }
	});

	module.exports = Draggable;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Feature that each tree node is possible to edit as double click
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */
	var util = __webpack_require__(8);
	var ajaxCommand = __webpack_require__(14);
	var states = __webpack_require__(11);
	var snippet = __webpack_require__(9);

	var API_LIST = [
	    'createChildNode',
	    'editNode',
	    'finishEditing'
	];
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
	var Editable = snippet.defineClass(/** @lends Editable.prototype */{
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
	        options = snippet.extend({}, options);

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
	        this.boundOnKeyup = snippet.bind(this._onKeyup, this);

	        /**
	         * Blur event handler
	         * @type {Function}
	         */
	        this.boundOnBlur = snippet.bind(this._onBlur, this);

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
	        snippet.forEach(API_LIST, function(apiName) {
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

	        if (!tree.isLeaf(parentId) &&
	            tree.getState(parentId) === states.node.CLOSED) {
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
	        var target = util.getTarget(event);
	        var nodeId;

	        if (util.hasClass(target, this.editableClassName)) {
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
	        util.addClass(element, INPUT_CLASSNAME);

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

	        wrapperElement = util.getChildElementByClassName(target, WRAPPER_CLASSNAME);

	        if (!wrapperElement) {
	            wrapperElement = document.createElement('DIV');
	            inputElement = this._createInputElement();

	            util.addClass(wrapperElement, WRAPPER_CLASSNAME);
	            wrapperElement.style.paddingLeft = tree.getIndentWidth(nodeId) + 'px';

	            inputElement.value = tree.getNodeData(nodeId)[this.dataKey] || '';

	            wrapperElement.appendChild(inputElement);
	            target.appendChild(wrapperElement);

	            util.addEventListener(inputElement, 'keyup', this.boundOnKeyup);
	            util.addEventListener(inputElement, 'blur', this.boundOnBlur);

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

	        util.removeEventListener(inputElement, 'keyup', this.boundOnKeyup);
	        util.removeEventListener(inputElement, 'blur', this.boundOnBlur);

	        util.removeElement(wrapperElement);

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
	        var bind = snippet.bind;

	        snippet.forEach(API_LIST, function(apiName) {
	            tree[apiName] = bind(this[apiName], this);
	        }, this);
	    }
	});

	module.exports = Editable;


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Feature that each tree node is possible to check and uncheck
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */
	var util = __webpack_require__(8);
	var snippet = __webpack_require__(9);

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
	var STATE_CHECKED = 1,
	    STATE_UNCHECKED = 2,
	    STATE_INDETERMINATE = 3,
	    DATA_KEY_FOR_CHECKBOX_STATE = '__CheckBoxState__',
	    DATA = {},
	    CHECKED_CLASSNAME = 'tui-is-checked',
	    INDETERMINATE_CLASSNAME = 'tui-checkbox-root';

	/* Checkbox cascade-states */
	var CASCADE_UP = 'up',
	    CASCADE_DOWN = 'down',
	    CASCADE_BOTH = 'both',
	    CASCADE_NONE = false;

	var filter = snippet.filter,
	    forEach = snippet.forEach,
	    inArray = snippet.inArray;
	/**
	 * Set the checkbox-api
	 * @class Checkbox
	 * @param {Tree} tree - Tree
	 * @param {Object} option - Option
	 *  @param {string} option.checkboxClassName - Classname of checkbox element
	 *  @param {string|boolean} [option.checkboxCascade='both'] - 'up', 'down', 'both', false
	 * @ignore
	 */
	var Checkbox = snippet.defineClass(/** @lends Checkbox.prototype */{
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
	        option = snippet.extend({}, option);

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
	        forEach(API_LIST, function(apiName) {
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
	        var tree = this.tree,
	            bind = snippet.bind;

	        forEach(API_LIST, function(apiName) {
	            tree[apiName] = bind(this[apiName], this);
	        }, this);
	    },

	    /**
	     * Attach event to tree instance
	     * @private
	     */
	    _attachEvents: function() {
	        this.tree.on({
	            singleClick: function(event) {
	                var target = util.getTarget(event);

	                if (util.getElementsByClassName(target, this.checkboxClassName)) {
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
	        }, this);
	    },

	    /**
	     * Change custom checkbox
	     * @param {HTMLElement} target - Label element
	     */
	    _changeCustomCheckbox: function(target) {
	        var self = this;
	        var nodeId = this.tree.getNodeIdFromElement(target);
	        var inputElement = target.getElementsByTagName('input')[0];
	        var eventType = util.getChangeEventName();
	        var state;

	        /**
	         * Change event handler
	         */
	        function onChange() {
	            state = self._getStateFromCheckbox(inputElement);
	            util.removeEventListener(inputElement, eventType, onChange);
	            self._continuePostprocessing(nodeId, state);
	        }

	        util.addEventListener(inputElement, eventType, onChange);
	    },

	    /**
	     * Reflect the changes on node.
	     * @param {string} nodeId - Node id
	     * @private
	     */
	    _reflectChanges: function(nodeId) {
	        this.tree.each(function(descendant, descendantId) {
	            this._setState(descendantId, this._getState(descendantId), true);
	        }, nodeId, this);
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
	            default: // no more process if the state is invalid
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
	        var tree = this.tree,
	            state = tree.getNodeData(nodeId)[DATA_KEY_FOR_CHECKBOX_STATE],
	            checkbox;

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
	        var tree = this.tree,
	            checkedList = this.checkedList,
	            eventName;

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
	            tree.fire(eventName, {nodeId: nodeId});
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

	            util.removeClass(labelElement, INDETERMINATE_CLASSNAME);
	            util.removeClass(labelElement, CHECKED_CLASSNAME);

	            if (state === 1) {
	                util.addClass(labelElement, CHECKED_CLASSNAME);
	            } else if (state === 3) {
	                util.addClass(labelElement, INDETERMINATE_CLASSNAME);
	                util.addClass(labelElement, CHECKED_CLASSNAME);
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
	        this.tree.each(function(descendant, descendantId) {
	            this._setState(descendantId, state, true);
	        }, nodeId, this);
	    },

	    /**
	     * Update all ancestors state
	     * @param {string} nodeId - Node id
	     * @private
	     */
	    _updateAllAncestorsState: function(nodeId) {
	        var tree = this.tree,
	            parentId = tree.getParentId(nodeId);

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
	        var tree = this.tree,
	            childIds = tree.getChildIds(nodeId),
	            checked = true,
	            unchecked = true;

	        if (!childIds.length) {
	            checked = this.isChecked(nodeId);
	        } else {
	            forEach(childIds, function(childId) {
	                var state = this._getState(childId);
	                checked = (checked && state === STATE_CHECKED);
	                unchecked = (unchecked && state === STATE_UNCHECKED);

	                return checked || unchecked;
	            }, this);
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
	        var tree = this.tree,
	            el, nodeEl;

	        if (nodeId === tree.getRootNodeId()) {
	            el = this.rootCheckbox;
	        } else {
	            nodeEl = document.getElementById(nodeId);
	            if (!nodeEl) {
	                return null;
	            }
	            el = util.getElementsByClassName(
	                nodeEl,
	                this.checkboxClassName
	            )[0];
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
	     * //
	     * // node1(v)
	     * //   node2(v)
	     * //   node3(v)
	     * // node4
	     * //   node5(v)
	     * // node6
	     * //   node7(v)
	     * //     node8(v)
	     * //   node9
	     *
	     * var allCheckedList = tree.getCheckedList(); // ['node1', 'node2', 'node3' ,....]
	     * var descendantsCheckedList = tree.getCheekedList('node6'); // ['node7', 'node8']
	     */
	    getCheckedList: function(parentId) {
	        var tree = this.tree,
	            checkedList = this.checkedList;

	        if (!parentId) {
	            return checkedList.slice();
	        }

	        return filter(checkedList, function(nodeId) {
	            return tree.contains(parentId, nodeId);
	        });
	    },

	    /**
	     * Get top checked list
	     * @memberof Tree.prototype
	     * @param {string} [parentId] - Node id (default: rootNode id)
	     * @returns {Array.<string>} Checked node ids
	     * @example
	     * //
	     * // node1(v)
	     * //   node2(v)
	     * //   node3(v)
	     * // node4
	     * //   node5(v)
	     * // node6
	     * //   node7(v)
	     * //     node8(v)
	     * //   node9
	     *
	     * var allTopCheckedList = tree.getTopCheckedList(); // ['node1', 'node5', 'node7']
	     * var descendantsTopCheckedList = tree.getTopCheekedList('node6'); // ['node7']
	     */
	    getTopCheckedList: function(parentId) {
	        var tree = this.tree,
	            checkedList = [],
	            state;

	        parentId = parentId || tree.getRootNodeId();
	        state = this._getState(parentId);
	        if (state === STATE_CHECKED) {
	            checkedList = tree.getChildIds(parentId);
	        } else if (state === STATE_INDETERMINATE) {
	            checkedList = this.getCheckedList(parentId);
	            checkedList = filter(checkedList, function(nodeId) {
	                return !this.isChecked(tree.getParentId(nodeId));
	            }, this);
	        }

	        return checkedList;
	    },

	    /**
	     * Get bottom checked list
	     * @memberof Tree.prototype
	     * @param {string} [parentId] - Node id (default: rootNode id)
	     * @returns {Array.<string>} Checked node ids
	     * @example
	     * //
	     * // node1(v)
	     * //   node2(v)
	     * //   node3(v)
	     * // node4
	     * //   node5(v)
	     * // node6
	     * //   node7(v)
	     * //     node8(v)
	     * //   node9
	     *
	     * var allBottomCheckedList = tree.getBottomCheckedList(); // ['node2', 'node3', 'node5', 'node8']
	     * var descendantsBottomCheckedList = tree.getBottomCheekedList('node6'); // ['node8']
	     */
	    getBottomCheckedList: function(parentId) {
	        var tree = this.tree,
	            checkedList;

	        parentId = parentId || tree.getRootNodeId();
	        checkedList = this.getCheckedList(parentId);

	        return filter(checkedList, function(nodeId) {
	            return tree.isLeaf(nodeId);
	        });
	    }
	});

	snippet.CustomEvents.mixin(Checkbox);
	module.exports = Checkbox;


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Feature that each tree node is possible to have context-menu
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */
	var util = __webpack_require__(8);
	var snippet = __webpack_require__(9);
	var TuiContextMenu = __webpack_require__(22);
	var API_LIST = [
	    'changeContextMenu'
	];
	var styleKeys = ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect'];
	var enableProp = util.testProp(styleKeys);
	var bind = snippet.bind;

	/**
	 * Set ContextMenu feature on tree
	 * @class ContextMenu
	 * @param {Tree} tree - Tree
	 * @param {Object} options - Options
	 *     @param {Array.<Object>} options.menuData - Context menu data
	 * @ignore
	 */
	var ContextMenu = snippet.defineClass(/** @lends ContextMenu.prototype */{
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
	         * Info of context menu in tree
	         * @type {Object}
	         */
	        this.menu = this._generateContextMenu();

	        /**
	         * Floating layer element
	         * @type {HTMLElement}
	         */
	        this.flElement = document.getElementById(this.flId);

	        /**
	         * Id of selected tree item
	         * @type {string}
	         */
	        this.selectedNodeId = null;

	        this.menu.register(this.treeSelector, bind(this._onSelect, this), options.menuData || {});

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
	        this.menu.register(this.treeSelector, bind(this._onSelect, this), newMenuData);
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

	        snippet.forEach(API_LIST, function(apiName) {
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
	     * @private
	     */
	    _generateContextMenu: function() {
	        if (!this.flElement) {
	            this._createFloatingLayer();
	        }

	        return new TuiContextMenu(this.flElement);
	    },

	    /**
	     * Prevent text selection on selected tree item
	     * @private
	     */
	    _preventTextSelection: function() {
	        if (enableProp) {
	            this.tree.rootElement.style[enableProp] = 'none';
	        }
	    },

	    /**
	     * Restore text selection on selected tree item
	     * @private
	     */
	    _restoreTextSelection: function() {
	        if (enableProp) {
	            this.tree.rootElement.style[enableProp] = '';
	        }
	    },

	    /**
	     * Event handler on tree item
	     * @param {MouseEvent} e - Mouse event
	     * @private
	     */
	    _onContextMenu: function(e) {
	        var target = util.getTarget(e);

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
	     * @param {string} cmd - Options value of selected context menu ("title"|"command")
	     * @private
	     */
	    _onSelect: function(e, cmd) {
	        /**
	         * @event Tree#selectContextMenu
	         * @type {object} evt - Event data
	         * @property {string} cmd - Command type
	         * @property {string} nodeId - Node id
	         * @example
	         * tree.on('selectContextMenu', function(evt) {
	         *     var cmd = treeEvent.cmd; // key of context menu's data
	         *     var nodeId = treeEvent.nodeId;
	         *
	         *     console.log(evt.cmd, evt.nodeId);
	         * });
	         */
	        this.tree.fire('selectContextMenu', {
	            cmd: cmd,
	            nodeId: this.selectedNodeId
	        });
	    },

	    /**
	     * Set API of ContextMenu feature
	     * @private
	     */
	    _setAPIs: function() {
	        var tree = this.tree;

	        snippet.forEach(API_LIST, function(apiName) {
	            tree[apiName] = bind(this[apiName], this);
	        }, this);
	    }
	});

	module.exports = ContextMenu;


/***/ }),
/* 22 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_22__;

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Feature that tree action is enable to communicate server
	 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
	 */
	var snippet = __webpack_require__(9);
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
	var Ajax = snippet.defineClass(/** @lends Ajax.prototype */{
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
	        options = snippet.extend({}, options);

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
	        this.isLoadRoot = !snippet.isUndefined(options.isLoadRoot) ? options.isLoadRoot : true;

	        /**
	         * Loader element
	         * @type {HTMLElement}
	         */
	        this.loader = null;

	        this._createLoader();

	        tree.on('initFeature', snippet.bind(this._onInitFeature, this));
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
	     * @param {string} type - Command type
	     * @param {Function} callback - Executed function after response
	     * @param {Object} [params] - Values to make "data" property using request
	     */
	    loadData: function(type, callback, params) {
	        var self = this;
	        var options;

	        if (!this.command || !this.command[type] ||
	            !this.command[type].url) {
	            return;
	        }

	        options = this._getDefaultRequestOptions(type, params);

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
	        if (!this.tree.invoke('beforeAjaxRequest', {
	            type: type,
	            params: params
	        })) {
	            return;
	        }

	        this._showLoader();

	        options.success = function(response) {
	            self._responseSuccess(type, callback, response);
	        };

	        options.error = function() {
	            self._responseError(type);
	        };

	        $.ajax(options);
	    },

	    /**
	     * Processing when response is success
	     * @param {string} type - Command type
	     * @param {Function} callback - Executed function after response
	     * @param {Object|boolean} [response] - Response data from server or return value of "parseData"
	     * @private
	     */
	    _responseSuccess: function(type, callback, response) {
	        var tree = this.tree;
	        var data;

	        this._hideLoader();

	        if (this.parseData) {
	            response = this.parseData(type, response);
	        }

	        if (response) {
	            data = callback(response);

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
	                type: type,
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
	            tree.fire('failAjaxResponse', {type: type});
	        }
	    },

	    /**
	     * Processing when response is error
	     * @param {string} type - Command type
	     * @private
	     */
	    _responseError: function(type) {
	        this._hideLoader();

	        /**
	         * @event Tree#errorAjaxResponse
	         * @type {object} evt - Event data
	         * @property {string} command - Command type
	         * @example
	         * tree.on('errorAjaxResponse', function(evt) {
	         *     console.log(evt.command + ' response is error!');
	         * });
	         */
	        this.tree.fire('errorAjaxResponse', {type: type});
	    },

	    /**
	     * Get default request options
	     * @param {string} type - Command type
	     * @param {Object} [params] - Value of request option "data"
	     * @returns {Object} Default options to request
	     * @private
	     */
	    _getDefaultRequestOptions: function(type, params) {
	        var options = this.command[type];

	        if (snippet.isFunction(options.url)) { // for restful API url
	            options.url = options.url(params);
	        }

	        if (snippet.isFunction(options.data)) { // for custom request data
	            options.data = options.data(params);
	        }

	        options.type = (options.type) ? options.type.toLowerCase() : 'get';
	        options.dataType = options.dataType || 'json';

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
	});

	module.exports = Ajax;


/***/ })
/******/ ])
});
;