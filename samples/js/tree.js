(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Tree', require('./src/js/tree'));

},{"./src/js/tree":9}],2:[function(require,module,exports){
'use strict';

/**
 * Make class names
 * @param {string} prefix - Prefix of class name
 * @param {Array.<string>} keys - Keys of class names
 * @returns {object.<string, string>} Class names map
 */
function makeClassNames(prefix, keys) {
    var obj = {};
    tui.util.forEach(keys, function(key) {
        obj[key + 'Class'] = prefix + key;
    });
    return obj;
}

/**
 * A default values for tree
 * @const
 * @type {Object}
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
    nodeDefaultState: 'closed',
    stateLabels: {
        opened: '-',
        closed: '+'
    },
    nodeIdPrefix: 'tui-tree-node-',
    classNames: makeClassNames('tui-tree-', [
        'node',
        'leaf',
        'opened',
        'closed',
        'subtree',
        'toggleBtn',
        'text'
    ]),
    template: {
        internalNode:
            '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
            '<span class="{{textClass}}">{{text}}</span>' +
            '<ul class="{{subtreeClass}}">{{children}}</ul>',
        leafNode:
            '<span class="{{textClass}}">{{text}}</span>'
    }
};

},{}],3:[function(require,module,exports){
'use strict';

/**
 * Messages for tree
 * @type {Object.<string, string>} messages
 */
module.exports = {
    INVALID_ROOT_ELEMENT: '"tui-component-tree": Root element is invalid.',
    INVALID_API_SELECTABLE: '"tui-component-tree": The feature-"Selectable" is not enabled.'
};

},{}],4:[function(require,module,exports){
'use strict';

/**
 * Outer template
 * @type {{internalNode: string, leafNode: string}}
 */
module.exports = {
    INTERNAL_NODE:
        '<li id="{{id}}" class="{{nodeClass}} {{stateClass}}">' +
            '{{innerTemplate}}' +
        '</li>',
    LEAF_NODE:
        '<li id="{{id}}" class="{{nodeClass}} {{leafClass}}">' +
            '{{innerTemplate}}' +
        '</li>'
};

},{}],5:[function(require,module,exports){
'use strict';

/**
 * States in tree
 * @type {Object} states
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

},{}],6:[function(require,module,exports){
'use strict';
var util = require('./../util');

var defaultOptions = {
        useHelper: true,
        helperPos: {
            y: 2,
            x: 5
        }
    },
    rejectedTagNames = [
        'INPUT',
        'BUTTON',
        'UL'
    ],
    inArray = tui.util.inArray;

/**
 * Set the tree draggable
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {boolean} options.useHelper - Using helper flag
 *  @param {{x: number, y:number}} options.helperPos - Helper position
 *  @param {Array.<string>} options.rejectedTagNames - No draggable tag names
 *  @param {Array.<string>} options.rejectedClassNames - No draggable class names
 */
var Draggable = tui.util.defineClass(/** @lends Draggable.prototype */{/*eslint-disable*/
    init: function(tree, options) { /*eslint-enable*/
        this.tree = tree;
        this.setMembers(options);
        this.attachMousedown();
    },

    /**
     * Set members of this module
     * @param {Object} options - input options
     */
    setMembers: function(options) {
        var helperElement = document.createElement('span'),
            style = helperElement.style;
        options = tui.util.extend({}, defaultOptions, options);

        this.useHelper = options.useHelper;
        this.helperPos = options.helperPos;
        this.rejectedTagNames = rejectedTagNames.concat(options.rejectedTagNames);
        this.rejectedClassNames = [].concat(options.rejectedClassNames);
        this.helperElement = helperElement;
        this.userSelectPropertyKey = null;
        this.userSelectPropertyValue = null;
        this.currentNodeId = null;

        this.handlers = {};
        this.handlers.mousemove = tui.util.bind(this.onMousemove, this);
        this.handlers.mouseup = tui.util.bind(this.onMouseup, this);

        style.position = 'absolute';
        style.display = 'none';
        this.tree.rootElement.parentNode.appendChild(helperElement);
    },

    /**
     * Attach mouse down event
     */
    attachMousedown: function() {
        this.preventTextSelection();
        this.tree.on('mousedown', this.onMousedown, this);
    },

    /**
     * Prevent text-selection
     */
    preventTextSelection: function() {
        var tree = this.tree,
            selectKey = util.testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']),
            style = tree.rootElement.style;

        util.addEventListener(tree.rootElement, 'selectstart', util.preventDefault);

        this.userSelectPropertyKey = selectKey;
        this.userSelectPropertyValue = style[selectKey];
        style[selectKey] = 'none';
    },

    /**
     * Return whether the target element is in rejectedTagNames or in rejectedClassNames
     * @param {HTMLElement} target - Target element
     * @returns {boolean} Whether the target is not draggable or draggable
     */
    isNotDraggable: function(target) {
        var tagName = target.tagName.toUpperCase(),
            classNames = util.getClass(target).split(' '),
            result;

        if (inArray(tagName, this.rejectedTagNames) !== -1) {
            return true;
        }

        tui.util.forEach(classNames, function(className) {
            result = inArray(className, this.rejectedClassNames) !== -1;
            return !result;
        }, this);

        return result;
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} event - Mouse event
     */
    onMousedown: function(event) {
        var target = util.getTarget(event),
            nodeId;

        if (util.isRightButton(event) || this.isNotDraggable(target)) {
            return;
        }
        util.preventDefault(event);

        target = util.getTarget(event);
        nodeId = tree.getNodeIdFromElement(target);
        this.currentNodeId = nodeId;
        if (this.useHelper) {
            this.setHelper(target.innerText || target.textContent);
        }

        util.addEventListener(document, 'mousemove', this.handlers.mousemove);
        util.addEventListener(document, 'mouseup', this.handlers.mouseup);
    },

    /**
     * Event handler - mousemove
     * @param {MouseEvent} event - Mouse event
     */
    onMousemove: function(event) {
        var helperEl = this.helperElement,
            pos = tree.rootElement.getBoundingClientRect();
        if (!this.useHelper) {
            return;
        }

        helperEl.style.top = event.clientY - pos.top + this.helperPos.y + 'px';
        helperEl.style.left = event.clientX - pos.left + this.helperPos.x + 'px';
        helperEl.style.display = '';
    },

    /**
     * Event handler - mouseup
     * @param {MouseEvent} event - Mouse event
     */
    onMouseup: function(event) {
        var tree = this.tree,
            target = util.getTarget(event),
            nodeId = tree.getNodeIdFromElement(target);

        this.helperElement.style.display = 'none';
        tree.move(this.currentNodeId, nodeId);
        this.currentNodeId = null;

        util.removeEventListener(document, 'mousemove', this.handlers.mousemove);
        util.removeEventListener(document, 'mouseup', this.handlers.mouseup);
    },

    /**
     * Restore text-selection
     */
    restoreTextSelection: function() {
        util.removeEventListener(tree.rootElement, 'selectstart', util.preventDefault);
        if (this.userSelectPropertyKey) {
            tree.rootElement.style[this.userSelectPropertyKey] = this.userSelectPropertyValue;
        }
    },

    /**
     * Set helper contents
     * @param {string} text - Helper contents
     */
    setHelper: function(text) {
        this.helperElement.innerHTML = text;
    },

    /**
     * Detach mousedown event
     */
    detachMousedown: function() {
        this.tree.off(this);
    },

    /**
     * Disable this module
     */
    destroy: function() {
        this.restoreTextSelection();
        this.detachMousedown();
    }
});

module.exports = Draggable;

},{"./../util":12}],7:[function(require,module,exports){
'use strict';

var util = require('./../util');

/**
 * Set the tree selectable
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {string} options.editableClassName - Classname of editable element
 *  @param {string} options.dataKey - Key of node data to set value
 *  @param {string} options.inputClassName - Classname of input element
 */
var Editable = tui.util.defineClass(/** @lends Editable.prototype */{/*eslint-disable*/
    init: function(tree, options) { /*eslint-enable*/
        options = tui.util.extend({}, options);
        this.tree = tree;
        this.editableClassName = options.editableClassName;
        this.dataKey = options.dataKey;
        this.inputElement = this.createInputElement(options.inputClassName);
        this.boundOnKeyup = tui.util.bind(this.onKeyup, this);
        this.boundOnBlur = tui.util.bind(this.onBlur, this);

        tree.on('doubleClick', this.onDoubleClick, this);
        util.addEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.addEventListener(this.inputElement, 'blur', this.boundOnBlur);
    },

    /**
     * Detach input element from document
     */
    detachInputFromDocument: function() {
        var inputEl = this.inputElement,
            parentNode = inputEl.parentNode;

        if (parentNode) {
            parentNode.removeChild(inputEl);
        }
    },

    /**
     * Disable this module
     */
    destroy: function() {
        this.detachInputFromDocument();
        this.tree.off(this);
        util.removeEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.removeEventListener(this.inputElement, 'blur', this.boundOnBlur);
    },

    /**
     * Create input element
     * @param {string} inputClassName - Classname of input element
     * @returns {HTMLElement} Input element
     */
    createInputElement: function(inputClassName) {
        var el = document.createElement('INPUT');
        if (inputClassName) {
            el.className = inputClassName;
        }
        el.setAttribute('type', 'text');

        return el;
    },

    /**
     * Custom event handler "doubleClick"
     * @param {MouseEvent} event - Mouse event
     */
    onDoubleClick: function(event) {
        var tree = this.tree,
            target = util.getTarget(event),
            inputElement, nodeId;

        if (util.hasClass(target, this.editableClassName)) {
            nodeId = tree.getNodeIdFromElement(target);

            inputElement = this.inputElement;
            inputElement.value = tree.getNodeData(nodeId)[this.dataKey] || '';
            target.parentNode.insertBefore(inputElement, target);
            target.style.display = 'none';
            inputElement.focus();
        }
    },

    /**
     * Event handler: keyup - input element
     * @param {Event} event - Key event
     */
    onKeyup: function(event) {
        if (event.keyCode === 13) { // keyup "enter"
            this.setData();
        }
    },

    /**
     * Event handler: blur - input element
     */
    onBlur: function() {
        this.setData();
    },

    /**
     * Set data of input element to node and detach input element from doc.
     */
    setData: function() {
        var nodeId = tree.getNodeIdFromElement(this.inputElement),
            data = {};

        if (nodeId) {
            data[this.dataKey] = this.inputElement.value;
            tree.setNodeData(nodeId, data);
        }
        this.detachInputFromDocument();
    }
});

module.exports = Editable;

},{"./../util":12}],8:[function(require,module,exports){
'use strict';

var util = require('./../util');
var defaults = {
    selectedClassName: 'tui-tree-selected'
};

/**
 * Set the tree selectable
 * @constructor
 * @param {Tree} tree - Tree
 */
var Selectable = tui.util.defineClass(/** @lends Selectable.prototype */{/*eslint-disable*/
    init: function(tree, options) { /*eslint-enable*/
        options = tui.util.extend({}, defaults, options);

        this.tree = tree;
        this.selectedClassName = options.selectedClassName;

        tree.on({
            singleClick: this.onSingleClick,
            afterDraw: this.onAfterDraw
        }, this);
        tree.select = tui.util.bind(this.select, this);
    },

    /**
     * Disable this module
     */
    destroy: function() {
        var nodeElement = this.getPrevElement();
        util.removeClass(nodeElement, this.selectedClassName);
        delete this.tree.select;
        this.tree.off(this);
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

    /**
     * Select
     * @param {string} nodeId - Node id
     * @param {Element} [target] - Event target element
     */
    select: function(nodeId, target) {
        var tree = this.tree,
            prevElement = this.getPrevElement(),
            nodeElement = document.getElementById(nodeId),
            selectedClassName = this.selectedClassName,
            prevNodeId = this.prevNodeId;

        if (!nodeId) {
            return;
        }

        /**
         * @api
         * @event Tree#beforeSelect
         * @param {string} nodeId - Selected node id
         * @param {string} prevNodeId - Previous selected node id
         * @param {Element} target - Target element
         * @example
         * tree
         *  .enableFeature('Selectable')
         *  .on('beforeSelect', function(nodeId, prevNodeId, target) {
         *      console.log('selected node: ' + nodeId);
         *      console.log('previous selected node: ' + prevNodeId);
         *      console.log('target element: ' + target);
         *      return false; // It cancels "select"
         *      // return true; // It fires "select"
         *  });
         */
        if (tree.invoke('beforeSelect', nodeId, prevNodeId, target)) {
            util.removeClass(prevElement, selectedClassName);
            util.addClass(nodeElement, selectedClassName);

            /**
             * @api
             * @event Tree#select
             * @param {string} nodeId - Selected node id
             * @param {string} prevNodeId - Previous selected node id
             * @param {Element} target - Target element
             * @example
             * tree
             *  .enableFeature('Selectable')
             *  .on('select', function(nodeId, prevNodeId, target) {
             *      console.log('selected node: ' + nodeId);
             *      console.log('previous selected node: ' + prevNodeId);
             *      console.log('target element: ' + target);
             *  });
             */
            tree.fire('select', nodeId, prevNodeId, target);
            this.prevNodeId = nodeId;
        }
    },

    /**
     * Get previous selected node element
     * @returns {HTMLElement} Node element
     */
    getPrevElement: function() {
        return document.getElementById(this.prevNodeId);
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

},{"./../util":12}],9:[function(require,module,exports){
/**
 * @fileoverview Render tree and update tree.
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

'use strict';

var util = require('./util'),
    defaultOption = require('./consts/defaultOption'),
    states = require('./consts/states'),
    messages = require('./consts/messages'),
    outerTemplate = require('./consts/outerTemplate'),
    TreeModel = require('./treeModel'),
    Selectable = require('./features/selectable'),
    Draggable = require('./features/draggable'),
    Editable = require('./features/editable');

var nodeStates = states.node,
    features = {
        Selectable: Selectable,
        Draggable: Draggable,
        Editable: Editable
    },
    snippet = tui.util,
    extend = snippet.extend;
/**
 * Create tree model and inject data to model
 * @class Tree
 * @constructor
 * @mixes tui.util.CustomEvents
 * @param {Object} data A data to be used on tree
 * @param {Object} options The options
 *     @param {HTMLElement} [options.rootElement] Root element (It should be 'UL' element)
 *     @param {string} [options.nodeIdPrefix] A default prefix of a node
 *     @param {Object} [options.nodeDefaultState] A default state of a node
 *     @param {Object} [options.template] A markup set to make element
 *         @param {string} [options.template.internalNode] HTML template
 *         @param {string} [options.template.leafNode] HTML template
 *     @param {Object} [options.stateLabels] Toggle button state label
 *         @param {string} [options.stateLabels.opened] State-OPENED label (Text or HTML)
 *         @param {string} [options.stateLabels.closed] State-CLOSED label (Text or HTML)
 *     @param {Object} [options.classNames] Class names for tree
 *         @param {string} [options.classNames.nodeClass] A class name for node
 *         @param {string} [options.classNames.leafClass] A class name for leaf node
 *         @param {string} [options.classNames.openedClass] A class name for opened node
 *         @param {string} [options.classNames.closedClass] A class name for closed node
 *         @param {string} [options.classNames.textClass] A class name that for textElement in node
 *         @param {string} [options.classNames.subtreeClass] A class name for subtree in internal node
 *         @param {string} [options.classNames.toggleBtnClass] A class name for toggle button in internal node
 * @example
 * //Default options:
 * // {
 * //     nodeIdPrefix: 'tui-tree-node-'
 * //     nodeDefaultState: 'closed',
 * //     stateLabels: {
 * //         opened: '-',
 * //         closed: '+'
 * //     },
 * //     classNames: {
 * //         nodeClass: 'tui-tree-node',
 * //         leafClass: 'tui-tree-leaf',
 * //         openedClass: 'tui-tree-opened',
 * //         closedClass: 'tui-tree-closed',
 * //         subtreeClass: 'tui-tree-subtree',
 * //         toggleBtnClass: 'tui-tree-toggleBtn',
 * //         textClass: 'tui-tree-text',
 * //     },
 * //     template: {
 * //         internalNode:
 * //             '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
 * //             '<span class="{{textClass}}">{{text}}</span>' +
 * //             '<ul class="{{subtreeClass}}">{{children}}</ul>' +
 * //         leafNode:
 * //             '<span class="{{textClass}}">{{text}}</span>' +
 * //     }
 * // }
 * //
 *
 * var data = [
 *     {text: 'rootA', children: [
 *         {text: 'root-1A'},
 *         {text: 'root-1B'},
 *         {text: 'root-1C'},
 *         {text: 'root-1D'},
 *         {text: 'root-2A', children: [
 *             {text:'sub_1A', children:[
 *                 {text:'sub_sub_1A'}
 *             ]},
 *             {text:'sub_2A'}
 *         ]},
 *         {text: 'root-2B'},
 *         {text: 'root-2C'},
 *         {text: 'root-2D'},
 *         {text: 'root-3A', children: [
 *             {text:'sub3_a'},
 *             {text:'sub3_b'}
 *         ]},
 *         {text: 'root-3B'},
 *         {text: 'root-3C'},
 *         {text: 'root-3D'}
 *     ]},
 *     {text: 'rootB', children: [
 *         {text:'B_sub1'},
 *         {text:'B_sub2'},
 *         {text:'b'}
 *     ]}
 * ];
 *
 * var tree1 = new tui.component.Tree(data, {
 *     rootElement: 'treeRoot', // or document.getElementById('treeRoot')
 *     nodeDefaultState: 'opened'
 * });
 **/
var Tree = snippet.defineClass(/** @lends Tree.prototype */{ /*eslint-disable*/
    static: {
        /**
         * @memberOf Tree
         * @static
         * @param {string} moduleName - Module name
         * @param {object} module - Module
         */
        registerFeature: function(moduleName, module) {
            if (module){
                this.features[moduleName] = module;
            }
        },

        /**
         * Tree features
         * @type {Object}
         */
        features: {}
    },
    init: function(data, options) { /*eslint-enable*/
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
        this.rootElement = options.rootElement;

        /**
         * Toggle button state label
         * @type {{opened: string, closed: string}}
         */
        this.stateLabels = options.stateLabels;

        /**
         * Make tree model
         * @type {TreeModel}
         */
        this.model = new TreeModel(data, options);

        /**
         * Enabled features
         * @type {Object.<string, object>}
         */
        this.enabledFeatures = {};

        /**
         * Click timer to prevent click-duplication with double click
         * @type {number}
         */
        this.clickTimer = null;

        /**
         * To prevent click event if mouse moved before mouseup.
         * @type {number}
         */
        this._mouseMovingFlag = false;

        this._setRoot();
        this._draw(this.model.rootNode.getId());
        this._setEvents();
    },

    /**
     * Set root element of tree
     * @private
     */
    _setRoot: function() {
        var rootEl = this.rootElement;

        if (snippet.isString(rootEl)) {
            rootEl = this.rootElement = document.getElementById(rootEl);
        }

        if (!snippet.isHTMLNode(rootEl)) {
            throw new Error(messages.INVALID_ROOT_ELEMENT);
        }
    },

    /**
     * Move event handler
     * @param {string} nodeId - Node id
     * @param {string} originalParentId - Original parent node id
     * @param {string} newParentId - New parent node id
     * @private
     */
    _onMove: function(nodeId, originalParentId, newParentId) {
        this._draw(originalParentId);
        this._draw(newParentId);

        /**
         * @api
         * @event Tree#move
         * @param {{nodeId: string, originalParentId: string, newParentId: string}} treeEvent - Tree event
         * @example
         * tree.on('move', function(treeEvent) {
         *     var nodeId = treeEvent.nodeId,
         *         originalParentId = treeEvent.originalParentId,
         *         newParentId = treeEvent.newParentId;
         *
         *     console.log(nodeId, originalParentId, newParentId);
         * });
         */
        this.fire('move', {
            nodeId: nodeId,
            originalParentId: originalParentId,
            newParentId: newParentId
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
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMousedown: function(event) {
        var self = this,
            clientX = event.clientX,
            clientY = event.clientY,
            abs = Math.abs;

        function onMouseMove(event) {
            var newClientX = event.clientX,
                newClientY = event.clientY;

            if (abs(newClientX - clientX) + abs(newClientY - clientY) > 5) {
                self.fire('mousemove', event);
                self._mouseMovingFlag = true;
            }
        }
        function onMouseUp() {
            self.fire('mouseup', event);
            util.removeEventListener(document, 'mousemove', onMouseMove);
            util.removeEventListener(document, 'mouseup', onMouseUp);
        }

        this._mouseMovingFlag = false;
        this.fire('mousedown', event);
        util.addEventListener(document, 'mousemove', onMouseMove);
        util.addEventListener(document, 'mouseup', onMouseUp);
    },

    /**
     * Event handler - click
     * @param {MouseEvent} event - Click event
     * @private
     */
    _onClick: function(event) {
        var target = util.getTarget(event),
            self = this;

        if (util.isRightButton(event)) {
            this.clickTimer = null;
            return;
        }

        if (util.hasClass(target, this.classNames.toggleBtnClass)) {
            this.toggle(this.getNodeIdFromElement(target));
            return;
        }

        if (!this.clickTimer && !this._mouseMovingFlag) {
            this.fire('singleClick', event);
            this.clickTimer = setTimeout(function() {
                self.resetClickTimer();
            }, 200);
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
     * Set node state - opened or closed
     * @param {string} nodeId - Node id
     * @param {string} state - Node state
     * @private
     */
    _setDisplayFromNodeState: function(nodeId, state) {
        var subtreeElement = this._getSubtreeElement(nodeId),
            label, btnElement, nodeElement;

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
            btnElement.innerHTML = label;
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
            html += util.template(sources.outer, props);
        }, this);

        return html;
    },

    /**
     * Make inner html of node
     * @param {TreeNode} node - Node
     * @param {{source: string, props: Object}} [cached] - Cashed data to make html
     * @returns {string} Inner html of node
     * @private
     */
    _makeInnerHTML: function(node, cached) {
        var source, props;

        cached = cached || {};
        source = cached.source || this._getTemplate(node).inner;
        props = cached.props || this._makeTemplateProps(node);
        return util.template(source, props);
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
            }
        } else {
            source = {
                inner: this.template.internalNode,
                outer: outerTemplate.INTERNAL_NODE
            }
        }

        return source;
    },

    /**
     * Make template properties
     * @param {TreeNode} node - Node
     * @return {Object} Template properties
     * @private
     */
    _makeTemplateProps: function(node) {
        var classNames = this.classNames,
            props, state;

        if (node.isLeaf()) {
            props = {
                id: node.getId()
            };
        } else {
            state = node.getState();
            props = {
                id: node.getId(),
                stateClass: classNames[state + 'Class'],
                stateLabel: this.stateLabels[state],
                children: this._makeHtml(node.getChildIds())
            };
        }

        return extend(props, classNames, node.getAllData());
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
         * @api
         * @event Tree#beforeDraw
         * @param {string} nodeId - Node id
         * @example
         * tree.on('beforeDraw', function(nodeId) {
         *     console.log(nodeId);
         * });
         */
        this.fire('beforeDraw', nodeId);

        if (node.isRoot()) {
            html = this._makeHtml(node.getChildIds());
            element = this.rootElement;
        } else {
            html = this._makeInnerHTML(node);
            element = document.getElementById(nodeId);
        }
        element.innerHTML = html;
        this._setClassWithDisplay(node);

        /**
         * @api
         * @event Tree#afterDraw
         * @param {string} nodeId - Node id
         * @example
         * tree.on('afterDraw', function(nodeId) {
         *     console.log(nodeId);
         * });
         */
        this.fire('afterDraw', nodeId);
    },

    /**
     * Set class and display of node element
     * @param {TreeNode} node - Node
     * @private
     */
    _setClassWithDisplay: function(node) {
        var nodeId = node.getId(),
            element = document.getElementById(nodeId),
            classNames = this.classNames;

        if (node.isLeaf()) {
            util.removeClass(element, classNames.openedClass);
            util.removeClass(element, classNames.closedClass);
            util.addClass(element, classNames.leafClass);
        } else {
            this._setDisplayFromNodeState(nodeId, node.getState());
            this.each(function(child) {
                this._setClassWithDisplay(child);
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
            subtreeElement = this.rootElement
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
     * @api
     * @param {string} nodeId - Node id
     * @return {number|undefined} Depth
     */
    getDepth: function(nodeId) {
        return this.model.getDepth(nodeId);
    },

    /**
     * Return the last depth of tree
     * @api
     * @return {number} Last depth
     */
    getLastDepth: function() {
        return this.model.getLastDepth();
    },

    /**
     * Return root node id
     * @api
     * @returns {string} Root node id
     */
    getRootNodeId: function() {
        return this.model.rootNode.getId();
    },

    /**
     * Return child ids
     * @api
     * @param {string} nodeId - Node id
     * @returns {Array.<string>|undefined} Child ids
     */
    getChildIds: function(nodeId) {
        return this.model.getChildIds(nodeId);
    },

    /**
     * Return parent id of node
     * @api
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
     * @api
     * @param {HTMLElement} element - Element
     * @returns {string} Node id
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
     * @api
     * @returns {string} Prefix of node id
     */
    getNodeIdPrefix: function() {
        return this.model.getNodeIdPrefix();
    },

    /**
     * Get node data
     * @api
     * @param {string} nodeId - Node id
     * @returns {object|undefined} Node data
     */
    getNodeData: function(nodeId) {
        return this.model.getNodeData(nodeId);
    },

    /**
     * Set data properties of a node
     * @api
     * @param {string} nodeId - Node id
     * @param {object} data - Properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    setNodeData: function(nodeId, data, isSilent) {
        this.model.setNodeData(nodeId, data, isSilent);
    },

    /**
     * Remove node data
     * @api
     * @param {string} nodeId - Node id
     * @param {string|Array} names - Names of properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    removeNodeData: function(nodeId, names, isSilent) {
        this.model.removeNodeData(nodeId, names, isSilent)
    },

    /**
     * Get node state.
     * @param {string} nodeId - Node id
     * @return {string|undefined} Node state(('opened', 'closed', undefined)
     */
    getState: function(nodeId) {
        var node = this.model.getNode(nodeId);

        if (!node) {
            return;
        }
        return node.getState();
    },

    /**
     * Open node
     * @api
     * @param {string} nodeId - Node id
     */
    open: function(nodeId) {
        var node = this.model.getNode(nodeId),
            state = nodeStates.OPENED;

        if (node && !node.isRoot()) {
            node.setState(state);
            this._setDisplayFromNodeState(nodeId, state);
        }
    },

    /**
     * Close node
     * @api
     * @param {string} nodeId - Node id
     */
    close: function(nodeId) {
        var node = this.model.getNode(nodeId),
            state = nodeStates.CLOSED;

        if (node && !node.isRoot()) {
            node.setState(state);
            this._setDisplayFromNodeState(nodeId, state);
        }
    },

    /**
     * Toggle node
     * @api
     * @param {string} nodeId - Node id
     */
    toggle: function(nodeId) {
        var node = this.model.getNode(nodeId),
            state;

        if (node && !node.isRoot()) {
            node.toggleState();
            state = node.getState();
            this._setDisplayFromNodeState(nodeId, state);
        }
    },

    /**
     * Sort all nodes
     * @api
     * @param {Function} comparator - Comparator for sorting
     * @param {boolean} [isSilent] - If true, it doesn't redraw tree
     * @example
     * // Sort with redrawing tree
     * tree.sort(function(nodeA, nodeB) {
     *     var aValue = nodeA.getData('text'),
     *         bValue = nodeB.getData('text');
     *
     *     if (!bValue || !bValue.localeCompare) {
     *         return 0;
     *     }
     *     return bValue.localeCompare(aValue);
     * });
     *
     * // Sort, but not redraw tree
     * tree.sort(function(nodeA, nodeB) {
     *     var aValue = nodeA.getData('text'),
     *         bValue = nodeB.getData('text');
     *
     *     if (!bValue || !bValue.localeCompare) {
     *         return 0;
     *     }
     *     return bValue.localeCompare(aValue);
     * }, true);
     */
    sort: function(comparator, isSilent) {
        this.model.sort(comparator);
        if (!isSilent) {
            this.refresh();
        }
    },

    /**
     * Refresh tree or node's children
     * @api
     * @param {string} [nodeId] - TreeNode id to refresh
     */
    refresh: function(nodeId) {
        nodeId = nodeId || this.model.rootNode.getId();
        this._draw(nodeId);
    },

    /**
     * Traverse this tree iterating over all nodes.
     * @api
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
     * @api
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
     * @api
     * @param {Array|object} data - Raw-data
     * @param {*} parentId - Parent id
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @returns {Array.<string>} Added node ids
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
    add: function(data, parentId, isSilent) {
        return this.model.add(data, parentId, isSilent);
    },

    /**
     * Remove a node with children.
     * - If 'isSilent' is not true, it redraws the tree
     * @api
     * @param {string} nodeId - Node id to remove
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @example
     * tree.remove(myNodeId); // remove node with redrawing
     * tree.remove(myNodeId, true); // remove node without redrawing
     */
    remove: function(nodeId, isSilent) {
        this.model.remove(nodeId, isSilent);
    },

    /**
     * Move a node to new parent
     * - If 'isSilent' is not true, it redraws the tree
     * @api
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @example
     * tree.move(myNodeId, newParentId); // mode node with redrawing
     * tree.move(myNodeId, newParentId, true); // move node without redrawing
     */
    move: function(nodeId, newParentId, isSilent) {
        this.model.move(nodeId, newParentId, isSilent);
    },

    /**
     * Search node ids by passing the predicate check or matching data
     * @api
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
                data;

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
     * Enable facility of tree
     * @api
     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable'
     * @param {object} [options] - Feature options
     * @return {Tree} this
     * @example
     * tree
     *  .enableFeature('Selectable', {
     *      selectedClassName: 'tui-tree-selected'
     *  })
     *  .enableFeature('Editable', {
     *      enableClassName: tree.classNames.textClass,
     *      dataKey: 'text',
     *      inputClassName: 'myInput'
     *  })
     *  .enableFeature('Draggable', {
     *      useHelper: true,
     *      helperPos: {x: 5, y: 2},
     *      rejectedTagNames: ['UL', 'INPUT', 'BUTTON'],
     *      rejectedClassNames: ['notDraggable', 'notDraggable-2']
     *  });
     */
    enableFeature: function(featureName, options) {
        var Feature = Tree.features[featureName];

        this.disableFeature(featureName);
        if (Feature) {
            this.enabledFeatures[featureName] = new Feature(this, options);
        }
        return this;
    },

    /**
     * Disable facility of tree
     * @api
     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable'
     * @return {Tree} this
     * @example
     * tree
     *  .disableFeature('Selectable')
     *  .disableFeature('Draggable')
     *  .disableFeature('Editable');
     */
    disableFeature: function(featureName) {
        var feature = this.enabledFeatures[featureName];

        if (feature) {
            feature.destroy();
            delete this.enabledFeatures[featureName]
        }
        return this;
    },

    /**
     * Select node if the feature-"Selectable" is enabled.
     * @api
     * @param {string} nodeId - Node id to remove
     * @example
     * tree
     *  .enableFeature('Selectable')
     *  .on('select', function(nodeId, prevNodeId) {
     *      console.log('selected node: ' + nodeId);
     *  });
     *
     * tree.select('tui-tree-node-13'); // selected node: tui-tree-node-13
     */
    select: function(nodeId) {
        throw new Error(messages.INVALID_API_SELECTABLE);
    }
});

snippet.forEach(features, function(Feature, name) {
    Tree.registerFeature(name, Feature);
});
snippet.CustomEvents.mixin(Tree);
module.exports = Tree;

},{"./consts/defaultOption":2,"./consts/messages":3,"./consts/outerTemplate":4,"./consts/states":5,"./features/draggable":6,"./features/editable":7,"./features/selectable":8,"./treeModel":10,"./util":12}],10:[function(require,module,exports){
/**
 * @fileoverview Update view and control tree data
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */
'use strict';

var TreeNode = require('./treeNode'),
    util = require('./util');

var snippet = tui.util,
    extend = snippet.extend,
    keys = snippet.keys,
    forEach = snippet.forEach,
    map = snippet.map,
    filter = snippet.filter,
    inArray = snippet.inArray;

/**
 * Tree model
 * @constructor TreeModel
 * @param {Array} data - Data
 * @param {Object} options - Options for defaultState and nodeIdPrefix
 **/
var TreeModel = tui.util.defineClass(/** @lends TreeModel.prototype */{ /* eslint-disable */
    init: function(data, options) {/*eslint-enable*/
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

        this._setData(data);
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
        var node;
        nodeData = extend({
            state: this.nodeDefaultState
        }, nodeData);

        node = new TreeNode(nodeData, parentId);
        node.removeData('children');

        return node;
    },

    /**
     * Get children
     * @param {string} nodeId - Node id
     * @returns {Array.<TreeNode>|undefined} children
     */
    getChildren: function(nodeId) {
        var childIds = this.getChildIds(nodeId);
        if (!childIds) {
            return;
        }

        return map(childIds, function(childId) {
            return this.getNode(childId);
        }, this);
    },

    /**
     * Get child ids
     * @param {string} nodeId - Node id
     * @returns {Array.<string>|undefined} Child ids
     */
    getChildIds: function(nodeId) {
        var node = this.getNode(nodeId);
        if (!node) {
            return;
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
     * @returns {TreeNode|undefined} Node
     */
    getNode: function(id) {
        return this.treeHash[id];
    },

    /**
     * Get depth from node id
     * @param {string} id - A node id to find
     * @returns {number|undefined} Depth
     */
    getDepth: function(id) {
        var node = this.getNode(id),
            depth = 0,
            parent;

        if (!node) {
            return;
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
     * @returns {string|undefined} Parent id
     */
    getParentId: function(id) {
        var node = this.getNode(id);

        if (!node) {
            return;
        }
        return node.getParentId();
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
            this.fire('update', parentId);
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

        if (tui.util.isArray(names)) {
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
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    move: function(nodeId, newParentId, isSilent) {
        var node = this.getNode(nodeId),
            originalParent, originalParentId, newParent;

        if (!node) {
            return;
        }
        newParent = this.getNode(newParentId) || this.rootNode;
        newParentId = newParent.getId();
        originalParentId = node.getParentId();
        originalParent = this.getNode(originalParentId);

        if (nodeId === newParentId || this.contains(nodeId, newParentId)) {
            return;
        }
        originalParent.removeChildId(nodeId);
        node.setParentId(newParentId);
        newParent.addChildId(nodeId);

        if (!isSilent) {
            this.fire('move', nodeId, originalParentId, newParentId);
        }
    },

    /**
     * Check to see if a node is a descendant of another node.
     * @param {string} containerId - Node id
     * @param {string} containedId - Node id
     * @returns {boolean} The node is contained or not
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
     */
    sort: function(comparator) {
        this.eachAll(function(node, nodeId) {
            var children = this.getChildren(nodeId),
                childIds;

            if (children.length > 1) {
                children.sort(comparator);

                childIds = map(children, function(child) {
                    return child.getId();
                });
                node.replaceChildIds(childIds);
            }
        });
    },

    /**
     * Get node data (all)
     * @param {string} nodeId - Node id
     * @returns {object|undefined} Node data
     */
    getNodeData: function(nodeId) {
        var node = this.getNode(nodeId);
        if (!node) {
            return;
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
    each: function(iteratee, parentId, context) {
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

tui.util.CustomEvents.mixin(TreeModel);
module.exports = TreeModel;

},{"./treeNode":11,"./util":12}],11:[function(require,module,exports){
'use strict';

var states = require('./consts/states').node,
    util = require('./util');

var lastIndex = 0,
    getNextIndex = function() {
        var index = lastIndex;
        lastIndex += 1;
        return index;
    },
    RESERVED_PROPERTIES = {
        id: '',
        state: 'setState'
    },
    inArray = tui.util.inArray;

/**
 * TreeNode
 * @Constructor TreeNode
 * @param {Object} nodeData - Node data
 * @param {string} [parentId] - Parent node id
 */
var TreeNode = tui.util.defineClass(/** @lends TreeNode.prototype */{ /*eslint-disable*/
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
    init: function(nodeData, parentId) { /*eslint-enable*/
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
        tui.util.forEachOwnProperties(RESERVED_PROPERTIES, function(setter, name) {
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
     * @api
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
     * @api
     * @param {string} state - State of node ('closed', 'opened')
     */
    setState: function(state) {
        state += '';
        this._state = states[state.toUpperCase()] || this._state;
    },

    /**
     * Get state
     * @api
     * @returns {string} state ('opened' or 'closed')
     */
    getState: function() {
        return this._state;
    },

    /**
     * Get id
     * @api
     * @returns {string} Node id
     */
    getId: function() {
        return this._id;
    },

    /**
     * Get parent id
     * @api
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
     * @api
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

        if (tui.util.inArray(childIds, id) === -1) {
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
     * @api
     * @param {string} name - Property name of data
     * @returns {*} Data
     */
    getData: function(name) {
        return this._data[name];
    },

    /**
     * Get all data
     * @api
     * @returns {Object} Data
     */
    getAllData: function() {
        return tui.util.extend({}, this._data);
    },

    /**
     * Set data
     * @api
     * @param {Object} data - Data for adding
     */
    setData: function(data) {
        data = this._setReservedProperties(data);
        tui.util.extend(this._data, data)
    },

    /**
     * Remove data
     * @api
     * @param {...string} names - Names of data
     */
    removeData: function(names) {
        tui.util.forEachArray(arguments, function(name) {
            delete this._data[name];
        }, this);
    },

    /**
     * Return true if this node has a provided child id.
     * @api
     * @param {string} id - Node id
     * @returns {boolean} - Whether this node has a provided child id.
     */
    hasChild: function(id) {
        return inArray(id, this._childIds) !== -1;
    },

    /**
     * Return whether this node is leaf.
     * @api
     * @returns {boolean} Node is leaf or not.
     */
    isLeaf: function() {
        return this._childIds.length === 0;
    },

    /**
     * Return whether this node is root.
     * @api
     * @returns {boolean} Node is root or not.
     */
    isRoot: function() {
        return tui.util.isFalsy(this._parentId);
    }
});
module.exports = TreeNode;

},{"./consts/states":5,"./util":12}],12:[function(require,module,exports){
/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */
'use strict';
var util = {
    /**
     * Remove first specified item from array, if it exists
     * @param {*} item Item to look for
     * @param {Array} arr Array to query
     */
    removeItemFromArray: function(item, arr) {
        var index = tui.util.inArray(item, arr);

        if (index > -1) {
            arr.splice(index, 1);
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
        index = tui.util.inArray(className, arr);
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
     * @return {HTMLElement} Event target
     */
    getTarget: function(e) {
        var target;
        e = e || window.event;
        target = e.target || e.srcElement;
        return target;
    },

    /**
     * Get class name
     * @param {HTMLElement} element HTMLElement
     * @returns {string} Class name
     */
    getClass: function(element) {
        return element && element.getAttribute && (element.getAttribute('class') || element.getAttribute('className') || '');
    },

    /**
     * Check the element has specific class or not
     * @param {HTMLElement} element A target element
     * @param {string} className A name of class to find
     * @return {boolean} Whether the element has the class
     */
    hasClass: function(element, className) {
        var elClassName = util.getClass(element);

        return elClassName.indexOf(className) > -1;
    },

    /**
     * Find element by class name
     * @param {HTMLElement} target A target element
     * @param {string} className A name of class
     * @return {Array.<HTMLElement>} Elements
     */
    getElementsByClassName: function(target, className) {
        var all, filtered;

        if (target.querySelectorAll) {
            filtered = target.querySelectorAll('.' + className);
        } else {
            all = tui.util.toArray(target.getElementsByTagName('*'));
            filtered = tui.util.filter(all, function(el) {
                var classNames = el.className || '';
                return (classNames.indexOf(className) !== -1)
            });
        }

        return filtered;
    },

    /**
     * Check whether the click event by right button
     * @param {MouseEvent} event Event object
     * @return {boolean} Whether the click event by right button
     */
    isRightButton: function(event) {
        return util._getButton(event) === 2;
    },

    /**
     * Whether the property exist or not
     * @param {Array} props A property
     * @return {string|boolean} Property name or false
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

        tui.util.forEach(props, function(prop) {
            if (prop in style) {
                propertyName = prop;
                return false;
            }
        });
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
    template: function(source, props) {
        return source.replace(/\{\{(\w+)}}/gi, function(match, name) {
            var value = props[name];
            if (tui.util.isFalsy(value)) {
                return '';
            }
            return value;
        });
    },

    /**
     * Normalization for event button property 
     * 0: First mouse button, 2: Second mouse button, 1: Center button
     * @param {MouseEvent} event Event object
     * @return {number|undefined} button type
     * @private
     */
    _getButton: function(event) {
        var button,
            primary = '0,1,3,5,7',
            secondary = '2,6',
            wheel = '4';

        if (document.implementation.hasFeature('MouseEvents', '2.0')) {
            return event.button;
        }

        button = event.button + '';
        if (primary.indexOf(button) > -1) {
            return 0;
        } else if (secondary.indexOf(button) > -1) {
            return 2;
        } else if (wheel.indexOf(button) > -1) {
            return 1;
        }
    }
};

module.exports = util;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMvZGVmYXVsdE9wdGlvbi5qcyIsInNyYy9qcy9jb25zdHMvbWVzc2FnZXMuanMiLCJzcmMvanMvY29uc3RzL291dGVyVGVtcGxhdGUuanMiLCJzcmMvanMvY29uc3RzL3N0YXRlcy5qcyIsInNyYy9qcy9mZWF0dXJlcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvZWRpdGFibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy90cmVlLmpzIiwic3JjL2pzL3RyZWVNb2RlbC5qcyIsInNyYy9qcy90cmVlTm9kZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQuVHJlZScsIHJlcXVpcmUoJy4vc3JjL2pzL3RyZWUnKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWFrZSBjbGFzcyBuYW1lc1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIFByZWZpeCBvZiBjbGFzcyBuYW1lXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBrZXlzIC0gS2V5cyBvZiBjbGFzcyBuYW1lc1xuICogQHJldHVybnMge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBDbGFzcyBuYW1lcyBtYXBcbiAqL1xuZnVuY3Rpb24gbWFrZUNsYXNzTmFtZXMocHJlZml4LCBrZXlzKSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIHR1aS51dGlsLmZvckVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIG9ialtrZXkgKyAnQ2xhc3MnXSA9IHByZWZpeCArIGtleTtcbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEEgZGVmYXVsdCB2YWx1ZXMgZm9yIHRyZWVcbiAqIEBjb25zdFxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBub2RlRGVmYXVsdFN0YXRlIC0gTm9kZSBzdGF0ZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVJZFByZWZpeCAtIE5vZGUgaWQgcHJlZml4XG4gKiBAcHJvcGVydHkge29iamVjdH0gc3RhdGVMYWJlbCAtIFN0YXRlIGxhYmVsIGluIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5vcGVuZWQgLSAnLSdcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5jbG9zZWQgLSAnKydcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSB0ZW1wbGF0ZSAtIFRlbXBsYXRlIGh0bWwgZm9yIHRoZSBub2Rlcy5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUuaW50ZXJuYWxOb2RlIC0gVGVtcGxhdGUgaHRtbCBmb3IgaW50ZXJuYWwgbm9kZS5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUubGVhZk5vZGUgLSBUZW1wbGF0ZSBodG1sIGZvciBsZWFmIG5vZGUuXG4gKiBAcHJvcGVydHkge29iamVjdH0gY2xhc3NOYW1lcyAtIENsYXNzIG5hbWVzIG9mIGVsZW1lbnRzIGluIHRyZWVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gb3BlbmVkQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBjbG9zZWRDbGFzcyAtIENsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVDbGFzcyAtIENsYXNzIG5hbWUgZm9yIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gbGVhZkNsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgbGVhZiBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN1YnRyZWVDbGFzcyAgLSBDbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdG9nZ2xlQnRuQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGV4dENsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgdGV4dCBlbGVtZW50IGluIGEgbm9kZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcbiAgICBzdGF0ZUxhYmVsczoge1xuICAgICAgICBvcGVuZWQ6ICctJyxcbiAgICAgICAgY2xvc2VkOiAnKydcbiAgICB9LFxuICAgIG5vZGVJZFByZWZpeDogJ3R1aS10cmVlLW5vZGUtJyxcbiAgICBjbGFzc05hbWVzOiBtYWtlQ2xhc3NOYW1lcygndHVpLXRyZWUtJywgW1xuICAgICAgICAnbm9kZScsXG4gICAgICAgICdsZWFmJyxcbiAgICAgICAgJ29wZW5lZCcsXG4gICAgICAgICdjbG9zZWQnLFxuICAgICAgICAnc3VidHJlZScsXG4gICAgICAgICd0b2dnbGVCdG4nLFxuICAgICAgICAndGV4dCdcbiAgICBdKSxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICBpbnRlcm5hbE5vZGU6XG4gICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPicsXG4gICAgICAgIGxlYWZOb2RlOlxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPidcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1lc3NhZ2VzIGZvciB0cmVlXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59IG1lc3NhZ2VzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIElOVkFMSURfUk9PVF9FTEVNRU5UOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogUm9vdCBlbGVtZW50IGlzIGludmFsaWQuJyxcbiAgICBJTlZBTElEX0FQSV9TRUxFQ1RBQkxFOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJTZWxlY3RhYmxlXCIgaXMgbm90IGVuYWJsZWQuJ1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBPdXRlciB0ZW1wbGF0ZVxuICogQHR5cGUge3tpbnRlcm5hbE5vZGU6IHN0cmluZywgbGVhZk5vZGU6IHN0cmluZ319XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIElOVEVSTkFMX05PREU6XG4gICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInt7bm9kZUNsYXNzfX0ge3tzdGF0ZUNsYXNzfX1cIj4nICtcbiAgICAgICAgICAgICd7e2lubmVyVGVtcGxhdGV9fScgK1xuICAgICAgICAnPC9saT4nLFxuICAgIExFQUZfTk9ERTpcbiAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwie3tub2RlQ2xhc3N9fSB7e2xlYWZDbGFzc319XCI+JyArXG4gICAgICAgICAgICAne3tpbm5lclRlbXBsYXRlfX0nICtcbiAgICAgICAgJzwvbGk+J1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBTdGF0ZXMgaW4gdHJlZVxuICogQHR5cGUge09iamVjdH0gc3RhdGVzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIFN0YXRlcyBvZiBub2RlXG4gICAgICogQHR5cGUge3tPUEVORUQ6IHN0cmluZywgQ0xPU0VEOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIG5vZGU6IHtcbiAgICAgICAgT1BFTkVEOiAnb3BlbmVkJyxcbiAgICAgICAgQ0xPU0VEOiAnY2xvc2VkJ1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vdXRpbCcpO1xuXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgIHVzZUhlbHBlcjogdHJ1ZSxcbiAgICAgICAgaGVscGVyUG9zOiB7XG4gICAgICAgICAgICB5OiAyLFxuICAgICAgICAgICAgeDogNVxuICAgICAgICB9XG4gICAgfSxcbiAgICByZWplY3RlZFRhZ05hbWVzID0gW1xuICAgICAgICAnSU5QVVQnLFxuICAgICAgICAnQlVUVE9OJyxcbiAgICAgICAgJ1VMJ1xuICAgIF0sXG4gICAgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIGRyYWdnYWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnNcbiAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMudXNlSGVscGVyIC0gVXNpbmcgaGVscGVyIGZsYWdcbiAqICBAcGFyYW0ge3t4OiBudW1iZXIsIHk6bnVtYmVyfX0gb3B0aW9ucy5oZWxwZXJQb3MgLSBIZWxwZXIgcG9zaXRpb25cbiAqICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkVGFnTmFtZXMgLSBObyBkcmFnZ2FibGUgdGFnIG5hbWVzXG4gKiAgQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gb3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMgLSBObyBkcmFnZ2FibGUgY2xhc3MgbmFtZXNcbiAqL1xudmFyIERyYWdnYWJsZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgRHJhZ2dhYmxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuc2V0TWVtYmVycyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5hdHRhY2hNb3VzZWRvd24oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG1lbWJlcnMgb2YgdGhpcyBtb2R1bGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGlucHV0IG9wdGlvbnNcbiAgICAgKi9cbiAgICBzZXRNZW1iZXJzOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHZhciBoZWxwZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpLFxuICAgICAgICAgICAgc3R5bGUgPSBoZWxwZXJFbGVtZW50LnN0eWxlO1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy51c2VIZWxwZXIgPSBvcHRpb25zLnVzZUhlbHBlcjtcbiAgICAgICAgdGhpcy5oZWxwZXJQb3MgPSBvcHRpb25zLmhlbHBlclBvcztcbiAgICAgICAgdGhpcy5yZWplY3RlZFRhZ05hbWVzID0gcmVqZWN0ZWRUYWdOYW1lcy5jb25jYXQob3B0aW9ucy5yZWplY3RlZFRhZ05hbWVzKTtcbiAgICAgICAgdGhpcy5yZWplY3RlZENsYXNzTmFtZXMgPSBbXS5jb25jYXQob3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMpO1xuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQgPSBoZWxwZXJFbGVtZW50O1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5VmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnROb2RlSWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICAgICAgdGhpcy5oYW5kbGVycy5tb3VzZW1vdmUgPSB0dWkudXRpbC5iaW5kKHRoaXMub25Nb3VzZW1vdmUsIHRoaXMpO1xuICAgICAgICB0aGlzLmhhbmRsZXJzLm1vdXNldXAgPSB0dWkudXRpbC5iaW5kKHRoaXMub25Nb3VzZXVwLCB0aGlzKTtcblxuICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGhlbHBlckVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggbW91c2UgZG93biBldmVudFxuICAgICAqL1xuICAgIGF0dGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucHJldmVudFRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy50cmVlLm9uKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2Vkb3duLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCB0ZXh0LXNlbGVjdGlvblxuICAgICAqL1xuICAgIHByZXZlbnRUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBzZWxlY3RLZXkgPSB1dGlsLnRlc3RQcm9wKFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J10pLFxuICAgICAgICAgICAgc3R5bGUgPSB0cmVlLnJvb3RFbGVtZW50LnN0eWxlO1xuXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0cmVlLnJvb3RFbGVtZW50LCAnc2VsZWN0c3RhcnQnLCB1dGlsLnByZXZlbnREZWZhdWx0KTtcblxuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSA9IHNlbGVjdEtleTtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZSA9IHN0eWxlW3NlbGVjdEtleV07XG4gICAgICAgIHN0eWxlW3NlbGVjdEtleV0gPSAnbm9uZSc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBpbiByZWplY3RlZFRhZ05hbWVzIG9yIGluIHJlamVjdGVkQ2xhc3NOYW1lc1xuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHRhcmdldCBpcyBub3QgZHJhZ2dhYmxlIG9yIGRyYWdnYWJsZVxuICAgICAqL1xuICAgIGlzTm90RHJhZ2dhYmxlOiBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgdmFyIHRhZ05hbWUgPSB0YXJnZXQudGFnTmFtZS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgY2xhc3NOYW1lcyA9IHV0aWwuZ2V0Q2xhc3ModGFyZ2V0KS5zcGxpdCgnICcpLFxuICAgICAgICAgICAgcmVzdWx0O1xuXG4gICAgICAgIGlmIChpbkFycmF5KHRhZ05hbWUsIHRoaXMucmVqZWN0ZWRUYWdOYW1lcykgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goY2xhc3NOYW1lcywgZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBpbkFycmF5KGNsYXNzTmFtZSwgdGhpcy5yZWplY3RlZENsYXNzTmFtZXMpICE9PSAtMTtcbiAgICAgICAgICAgIHJldHVybiAhcmVzdWx0O1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vkb3duXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25Nb3VzZWRvd246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQ7XG5cbiAgICAgICAgaWYgKHV0aWwuaXNSaWdodEJ1dHRvbihldmVudCkgfHwgdGhpcy5pc05vdERyYWdnYWJsZSh0YXJnZXQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdXRpbC5wcmV2ZW50RGVmYXVsdChldmVudCk7XG5cbiAgICAgICAgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpO1xuICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IG5vZGVJZDtcbiAgICAgICAgaWYgKHRoaXMudXNlSGVscGVyKSB7XG4gICAgICAgICAgICB0aGlzLnNldEhlbHBlcih0YXJnZXQuaW5uZXJUZXh0IHx8IHRhcmdldC50ZXh0Q29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZXJzLm1vdXNlbW92ZSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLmhhbmRsZXJzLm1vdXNldXApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vtb3ZlXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25Nb3VzZW1vdmU6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBoZWxwZXJFbCA9IHRoaXMuaGVscGVyRWxlbWVudCxcbiAgICAgICAgICAgIHBvcyA9IHRyZWUucm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGlmICghdGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlbHBlckVsLnN0eWxlLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBwb3MudG9wICsgdGhpcy5oZWxwZXJQb3MueSArICdweCc7XG4gICAgICAgIGhlbHBlckVsLnN0eWxlLmxlZnQgPSBldmVudC5jbGllbnRYIC0gcG9zLmxlZnQgKyB0aGlzLmhlbHBlclBvcy54ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2V1cFxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2V1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRyZWUubW92ZSh0aGlzLmN1cnJlbnROb2RlSWQsIG5vZGVJZCk7XG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5oYW5kbGVycy5tb3VzZW1vdmUpO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5oYW5kbGVycy5tb3VzZXVwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzdG9yZSB0ZXh0LXNlbGVjdGlvblxuICAgICAqL1xuICAgIHJlc3RvcmVUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRyZWUucm9vdEVsZW1lbnQsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xuICAgICAgICBpZiAodGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIHRyZWUucm9vdEVsZW1lbnQuc3R5bGVbdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXldID0gdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgaGVscGVyIGNvbnRlbnRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBIZWxwZXIgY29udGVudHNcbiAgICAgKi9cbiAgICBzZXRIZWxwZXI6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LmlubmVySFRNTCA9IHRleHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGFjaCBtb3VzZWRvd24gZXZlbnRcbiAgICAgKi9cbiAgICBkZXRhY2hNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZVRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5kZXRhY2hNb3VzZWRvd24oKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnZ2FibGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi91dGlsJyk7XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgZWRpdGFibGUgZWxlbWVudFxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmRhdGFLZXkgLSBLZXkgb2Ygbm9kZSBkYXRhIHRvIHNldCB2YWx1ZVxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmlucHV0Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGlucHV0IGVsZW1lbnRcbiAqL1xudmFyIEVkaXRhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBFZGl0YWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSA9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuZGF0YUtleSA9IG9wdGlvbnMuZGF0YUtleTtcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQgPSB0aGlzLmNyZWF0ZUlucHV0RWxlbWVudChvcHRpb25zLmlucHV0Q2xhc3NOYW1lKTtcbiAgICAgICAgdGhpcy5ib3VuZE9uS2V5dXAgPSB0dWkudXRpbC5iaW5kKHRoaXMub25LZXl1cCwgdGhpcyk7XG4gICAgICAgIHRoaXMuYm91bmRPbkJsdXIgPSB0dWkudXRpbC5iaW5kKHRoaXMub25CbHVyLCB0aGlzKTtcblxuICAgICAgICB0cmVlLm9uKCdkb3VibGVDbGljaycsIHRoaXMub25Eb3VibGVDbGljaywgdGhpcyk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2tleXVwJywgdGhpcy5ib3VuZE9uS2V5dXApO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdibHVyJywgdGhpcy5ib3VuZE9uQmx1cik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGFjaCBpbnB1dCBlbGVtZW50IGZyb20gZG9jdW1lbnRcbiAgICAgKi9cbiAgICBkZXRhY2hJbnB1dEZyb21Eb2N1bWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dEVsID0gdGhpcy5pbnB1dEVsZW1lbnQsXG4gICAgICAgICAgICBwYXJlbnROb2RlID0gaW5wdXRFbC5wYXJlbnROb2RlO1xuXG4gICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlucHV0RWwpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5kZXRhY2hJbnB1dEZyb21Eb2N1bWVudCgpO1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdrZXl1cCcsIHRoaXMuYm91bmRPbktleXVwKTtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAnYmx1cicsIHRoaXMuYm91bmRPbkJsdXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dENsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBpbnB1dCBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBJbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgY3JlYXRlSW5wdXRFbGVtZW50OiBmdW5jdGlvbihpbnB1dENsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTlBVVCcpO1xuICAgICAgICBpZiAoaW5wdXRDbGFzc05hbWUpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IGlucHV0Q2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciBcImRvdWJsZUNsaWNrXCJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbkRvdWJsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIGlucHV0RWxlbWVudCwgbm9kZUlkO1xuXG4gICAgICAgIGlmICh1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICAgICAgaW5wdXRFbGVtZW50ID0gdGhpcy5pbnB1dEVsZW1lbnQ7XG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQudmFsdWUgPSB0cmVlLmdldE5vZGVEYXRhKG5vZGVJZClbdGhpcy5kYXRhS2V5XSB8fCAnJztcbiAgICAgICAgICAgIHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShpbnB1dEVsZW1lbnQsIHRhcmdldCk7XG4gICAgICAgICAgICB0YXJnZXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIGlucHV0RWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXI6IGtleXVwIC0gaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gS2V5IGV2ZW50XG4gICAgICovXG4gICAgb25LZXl1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7IC8vIGtleXVwIFwiZW50ZXJcIlxuICAgICAgICAgICAgdGhpcy5zZXREYXRhKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcjogYmx1ciAtIGlucHV0IGVsZW1lbnRcbiAgICAgKi9cbiAgICBvbkJsdXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldERhdGEoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgb2YgaW5wdXQgZWxlbWVudCB0byBub2RlIGFuZCBkZXRhY2ggaW5wdXQgZWxlbWVudCBmcm9tIGRvYy5cbiAgICAgKi9cbiAgICBzZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGhpcy5pbnB1dEVsZW1lbnQpLFxuICAgICAgICAgICAgZGF0YSA9IHt9O1xuXG4gICAgICAgIGlmIChub2RlSWQpIHtcbiAgICAgICAgICAgIGRhdGFbdGhpcy5kYXRhS2V5XSA9IHRoaXMuaW5wdXRFbGVtZW50LnZhbHVlO1xuICAgICAgICAgICAgdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGV0YWNoSW5wdXRGcm9tRG9jdW1lbnQoKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0YWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcbnZhciBkZWZhdWx0cyA9IHtcbiAgICBzZWxlY3RlZENsYXNzTmFtZTogJ3R1aS10cmVlLXNlbGVjdGVkJ1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgc2VsZWN0YWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKi9cbnZhciBTZWxlY3RhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBTZWxlY3RhYmxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbnMgPSB0dWkudXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lID0gb3B0aW9ucy5zZWxlY3RlZENsYXNzTmFtZTtcblxuICAgICAgICB0cmVlLm9uKHtcbiAgICAgICAgICAgIHNpbmdsZUNsaWNrOiB0aGlzLm9uU2luZ2xlQ2xpY2ssXG4gICAgICAgICAgICBhZnRlckRyYXc6IHRoaXMub25BZnRlckRyYXdcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHRyZWUuc2VsZWN0ID0gdHVpLnV0aWwuYmluZCh0aGlzLnNlbGVjdCwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpO1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgZGVsZXRlIHRoaXMudHJlZS5zZWxlY3Q7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwic2luZ2xlQ2xpY2tcIlxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uU2luZ2xlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0aGlzLnRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICB0aGlzLnNlbGVjdChub2RlSWQsIHRhcmdldCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlbGVjdFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBbdGFyZ2V0XSAtIEV2ZW50IHRhcmdldCBlbGVtZW50XG4gICAgICovXG4gICAgc2VsZWN0OiBmdW5jdGlvbihub2RlSWQsIHRhcmdldCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHByZXZFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpLFxuICAgICAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpLFxuICAgICAgICAgICAgc2VsZWN0ZWRDbGFzc05hbWUgPSB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lLFxuICAgICAgICAgICAgcHJldk5vZGVJZCA9IHRoaXMucHJldk5vZGVJZDtcblxuICAgICAgICBpZiAoIW5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlU2VsZWN0XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBTZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmV2Tm9kZUlkIC0gUHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIFRhcmdldCBlbGVtZW50XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWVcbiAgICAgICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcbiAgICAgICAgICogIC5vbignYmVmb3JlU2VsZWN0JywgZnVuY3Rpb24obm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpIHtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZygnc2VsZWN0ZWQgbm9kZTogJyArIG5vZGVJZCk7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3ByZXZpb3VzIHNlbGVjdGVkIG5vZGU6ICcgKyBwcmV2Tm9kZUlkKTtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZygndGFyZ2V0IGVsZW1lbnQ6ICcgKyB0YXJnZXQpO1xuICAgICAgICAgKiAgICAgIHJldHVybiBmYWxzZTsgLy8gSXQgY2FuY2VscyBcInNlbGVjdFwiXG4gICAgICAgICAqICAgICAgLy8gcmV0dXJuIHRydWU7IC8vIEl0IGZpcmVzIFwic2VsZWN0XCJcbiAgICAgICAgICogIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRyZWUuaW52b2tlKCdiZWZvcmVTZWxlY3QnLCBub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCkpIHtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MocHJldkVsZW1lbnQsIHNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3Mobm9kZUVsZW1lbnQsIHNlbGVjdGVkQ2xhc3NOYW1lKTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSNzZWxlY3RcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBTZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJldk5vZGVJZCAtIFByZXZpb3VzIHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlXG4gICAgICAgICAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxuICAgICAgICAgICAgICogIC5vbignc2VsZWN0JywgZnVuY3Rpb24obm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpIHtcbiAgICAgICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3NlbGVjdGVkIG5vZGU6ICcgKyBub2RlSWQpO1xuICAgICAgICAgICAgICogICAgICBjb25zb2xlLmxvZygncHJldmlvdXMgc2VsZWN0ZWQgbm9kZTogJyArIHByZXZOb2RlSWQpO1xuICAgICAgICAgICAgICogICAgICBjb25zb2xlLmxvZygndGFyZ2V0IGVsZW1lbnQ6ICcgKyB0YXJnZXQpO1xuICAgICAgICAgICAgICogIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cmVlLmZpcmUoJ3NlbGVjdCcsIG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KTtcbiAgICAgICAgICAgIHRoaXMucHJldk5vZGVJZCA9IG5vZGVJZDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBOb2RlIGVsZW1lbnRcbiAgICAgKi9cbiAgICBnZXRQcmV2RWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLnByZXZOb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciAtIFwiYWZ0ZXJEcmF3XCJcbiAgICAgKi9cbiAgICBvbkFmdGVyRHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlRWxlbWVudCA9IHRoaXMuZ2V0UHJldkVsZW1lbnQoKTtcblxuICAgICAgICBpZiAobm9kZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3Mobm9kZUVsZW1lbnQsIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0YWJsZTtcbiIsIi8qKlxyXG4gKiBAZmlsZW92ZXJ2aWV3IFJlbmRlciB0cmVlIGFuZCB1cGRhdGUgdHJlZS5cclxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxyXG4gKi9cclxuXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXHJcbiAgICBkZWZhdWx0T3B0aW9uID0gcmVxdWlyZSgnLi9jb25zdHMvZGVmYXVsdE9wdGlvbicpLFxyXG4gICAgc3RhdGVzID0gcmVxdWlyZSgnLi9jb25zdHMvc3RhdGVzJyksXHJcbiAgICBtZXNzYWdlcyA9IHJlcXVpcmUoJy4vY29uc3RzL21lc3NhZ2VzJyksXHJcbiAgICBvdXRlclRlbXBsYXRlID0gcmVxdWlyZSgnLi9jb25zdHMvb3V0ZXJUZW1wbGF0ZScpLFxyXG4gICAgVHJlZU1vZGVsID0gcmVxdWlyZSgnLi90cmVlTW9kZWwnKSxcclxuICAgIFNlbGVjdGFibGUgPSByZXF1aXJlKCcuL2ZlYXR1cmVzL3NlbGVjdGFibGUnKSxcclxuICAgIERyYWdnYWJsZSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvZHJhZ2dhYmxlJyksXHJcbiAgICBFZGl0YWJsZSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvZWRpdGFibGUnKTtcclxuXHJcbnZhciBub2RlU3RhdGVzID0gc3RhdGVzLm5vZGUsXHJcbiAgICBmZWF0dXJlcyA9IHtcclxuICAgICAgICBTZWxlY3RhYmxlOiBTZWxlY3RhYmxlLFxyXG4gICAgICAgIERyYWdnYWJsZTogRHJhZ2dhYmxlLFxyXG4gICAgICAgIEVkaXRhYmxlOiBFZGl0YWJsZVxyXG4gICAgfSxcclxuICAgIHNuaXBwZXQgPSB0dWkudXRpbCxcclxuICAgIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kO1xyXG4vKipcclxuICogQ3JlYXRlIHRyZWUgbW9kZWwgYW5kIGluamVjdCBkYXRhIHRvIG1vZGVsXHJcbiAqIEBjbGFzcyBUcmVlXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAbWl4ZXMgdHVpLnV0aWwuQ3VzdG9tRXZlbnRzXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEEgZGF0YSB0byBiZSB1c2VkIG9uIHRyZWVcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnNcclxuICogICAgIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtvcHRpb25zLnJvb3RFbGVtZW50XSBSb290IGVsZW1lbnQgKEl0IHNob3VsZCBiZSAnVUwnIGVsZW1lbnQpXHJcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubm9kZUlkUHJlZml4XSBBIGRlZmF1bHQgcHJlZml4IG9mIGEgbm9kZVxyXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLm5vZGVEZWZhdWx0U3RhdGVdIEEgZGVmYXVsdCBzdGF0ZSBvZiBhIG5vZGVcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy50ZW1wbGF0ZV0gQSBtYXJrdXAgc2V0IHRvIG1ha2UgZWxlbWVudFxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGVdIEhUTUwgdGVtcGxhdGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGUubGVhZk5vZGVdIEhUTUwgdGVtcGxhdGVcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5zdGF0ZUxhYmVsc10gVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5vcGVuZWRdIFN0YXRlLU9QRU5FRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5jbG9zZWRdIFN0YXRlLUNMT1NFRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxyXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmNsYXNzTmFtZXNdIENsYXNzIG5hbWVzIGZvciB0cmVlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMubm9kZUNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5sZWFmQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgbGVhZiBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMub3BlbmVkQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igb3BlbmVkIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5jbG9zZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBjbG9zZWQgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnRleHRDbGFzc10gQSBjbGFzcyBuYW1lIHRoYXQgZm9yIHRleHRFbGVtZW50IGluIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igc3VidHJlZSBpbiBpbnRlcm5hbCBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgdG9nZ2xlIGJ1dHRvbiBpbiBpbnRlcm5hbCBub2RlXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRGVmYXVsdCBvcHRpb25zOlxyXG4gKiAvLyB7XHJcbiAqIC8vICAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLSdcclxuICogLy8gICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdjbG9zZWQnLFxyXG4gKiAvLyAgICAgc3RhdGVMYWJlbHM6IHtcclxuICogLy8gICAgICAgICBvcGVuZWQ6ICctJyxcclxuICogLy8gICAgICAgICBjbG9zZWQ6ICcrJ1xyXG4gKiAvLyAgICAgfSxcclxuICogLy8gICAgIGNsYXNzTmFtZXM6IHtcclxuICogLy8gICAgICAgICBub2RlQ2xhc3M6ICd0dWktdHJlZS1ub2RlJyxcclxuICogLy8gICAgICAgICBsZWFmQ2xhc3M6ICd0dWktdHJlZS1sZWFmJyxcclxuICogLy8gICAgICAgICBvcGVuZWRDbGFzczogJ3R1aS10cmVlLW9wZW5lZCcsXHJcbiAqIC8vICAgICAgICAgY2xvc2VkQ2xhc3M6ICd0dWktdHJlZS1jbG9zZWQnLFxyXG4gKiAvLyAgICAgICAgIHN1YnRyZWVDbGFzczogJ3R1aS10cmVlLXN1YnRyZWUnLFxyXG4gKiAvLyAgICAgICAgIHRvZ2dsZUJ0bkNsYXNzOiAndHVpLXRyZWUtdG9nZ2xlQnRuJyxcclxuICogLy8gICAgICAgICB0ZXh0Q2xhc3M6ICd0dWktdHJlZS10ZXh0JyxcclxuICogLy8gICAgIH0sXHJcbiAqIC8vICAgICB0ZW1wbGF0ZToge1xyXG4gKiAvLyAgICAgICAgIGludGVybmFsTm9kZTpcclxuICogLy8gICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3tzdGF0ZUxhYmVsfX08L2J1dHRvbj4nICtcclxuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+JyArXHJcbiAqIC8vICAgICAgICAgbGVhZk5vZGU6XHJcbiAqIC8vICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcclxuICogLy8gICAgIH1cclxuICogLy8gfVxyXG4gKiAvL1xyXG4gKlxyXG4gKiB2YXIgZGF0YSA9IFtcclxuICogICAgIHt0ZXh0OiAncm9vdEEnLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQSd9LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQid9LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQyd9LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xRCd9LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQScsIGNoaWxkcmVuOiBbXHJcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWJfMUEnLCBjaGlsZHJlbjpbXHJcbiAqICAgICAgICAgICAgICAgICB7dGV4dDonc3ViX3N1Yl8xQSd9XHJcbiAqICAgICAgICAgICAgIF19LFxyXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViXzJBJ31cclxuICogICAgICAgICBdfSxcclxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkInfSxcclxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkMnfSxcclxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkQnfSxcclxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0EnLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViM19hJ30sXHJcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWIzX2InfVxyXG4gKiAgICAgICAgIF19LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zQid9LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zQyd9LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zRCd9XHJcbiAqICAgICBdfSxcclxuICogICAgIHt0ZXh0OiAncm9vdEInLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgIHt0ZXh0OidCX3N1YjEnfSxcclxuICogICAgICAgICB7dGV4dDonQl9zdWIyJ30sXHJcbiAqICAgICAgICAge3RleHQ6J2InfVxyXG4gKiAgICAgXX1cclxuICogXTtcclxuICpcclxuICogdmFyIHRyZWUxID0gbmV3IHR1aS5jb21wb25lbnQuVHJlZShkYXRhLCB7XHJcbiAqICAgICByb290RWxlbWVudDogJ3RyZWVSb290JywgLy8gb3IgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyZWVSb290JylcclxuICogICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdvcGVuZWQnXHJcbiAqIH0pO1xyXG4gKiovXHJcbnZhciBUcmVlID0gc25pcHBldC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cclxuICAgIHN0YXRpYzoge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBtZW1iZXJPZiBUcmVlXHJcbiAgICAgICAgICogQHN0YXRpY1xyXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVOYW1lIC0gTW9kdWxlIG5hbWVcclxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gbW9kdWxlIC0gTW9kdWxlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcmVnaXN0ZXJGZWF0dXJlOiBmdW5jdGlvbihtb2R1bGVOYW1lLCBtb2R1bGUpIHtcclxuICAgICAgICAgICAgaWYgKG1vZHVsZSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZlYXR1cmVzW21vZHVsZU5hbWVdID0gbW9kdWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVHJlZSBmZWF0dXJlc1xyXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZmVhdHVyZXM6IHt9XHJcbiAgICB9LFxyXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xyXG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb24sIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWZhdWx0IGNsYXNzIG5hbWVzXHJcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY2xhc3NOYW1lcyA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbi5jbGFzc05hbWVzLCBvcHRpb25zLmNsYXNzTmFtZXMpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWZhdWx0IHRlbXBsYXRlXHJcbiAgICAgICAgICogQHR5cGUge3tpbnRlcm5hbE5vZGU6IHN0cmluZywgbGVhZk5vZGU6IHN0cmluZ319XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbi50ZW1wbGF0ZSwgb3B0aW9ucy50ZW1wbGF0ZSk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJvb3QgZWxlbWVudFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gb3B0aW9ucy5yb290RWxlbWVudDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxyXG4gICAgICAgICAqIEB0eXBlIHt7b3BlbmVkOiBzdHJpbmcsIGNsb3NlZDogc3RyaW5nfX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN0YXRlTGFiZWxzID0gb3B0aW9ucy5zdGF0ZUxhYmVscztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogTWFrZSB0cmVlIG1vZGVsXHJcbiAgICAgICAgICogQHR5cGUge1RyZWVNb2RlbH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFRyZWVNb2RlbChkYXRhLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRW5hYmxlZCBmZWF0dXJlc1xyXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgb2JqZWN0Pn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmVuYWJsZWRGZWF0dXJlcyA9IHt9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDbGljayB0aW1lciB0byBwcmV2ZW50IGNsaWNrLWR1cGxpY2F0aW9uIHdpdGggZG91YmxlIGNsaWNrXHJcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUbyBwcmV2ZW50IGNsaWNrIGV2ZW50IGlmIG1vdXNlIG1vdmVkIGJlZm9yZSBtb3VzZXVwLlxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5fbW91c2VNb3ZpbmdGbGFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuX3NldFJvb3QoKTtcclxuICAgICAgICB0aGlzLl9kcmF3KHRoaXMubW9kZWwucm9vdE5vZGUuZ2V0SWQoKSk7XHJcbiAgICAgICAgdGhpcy5fc2V0RXZlbnRzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHJvb3QgZWxlbWVudCBvZiB0cmVlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc2V0Um9vdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHJvb3RFbCA9IHRoaXMucm9vdEVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmIChzbmlwcGV0LmlzU3RyaW5nKHJvb3RFbCkpIHtcclxuICAgICAgICAgICAgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHJvb3RFbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXNuaXBwZXQuaXNIVE1MTm9kZShyb290RWwpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlcy5JTlZBTElEX1JPT1RfRUxFTUVOVCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgZXZlbnQgaGFuZGxlclxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcmlnaW5hbFBhcmVudElkIC0gT3JpZ2luYWwgcGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uTW92ZTogZnVuY3Rpb24obm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCkge1xyXG4gICAgICAgIHRoaXMuX2RyYXcob3JpZ2luYWxQYXJlbnRJZCk7XHJcbiAgICAgICAgdGhpcy5fZHJhdyhuZXdQYXJlbnRJZCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBhcGlcclxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNtb3ZlXHJcbiAgICAgICAgICogQHBhcmFtIHt7bm9kZUlkOiBzdHJpbmcsIG9yaWdpbmFsUGFyZW50SWQ6IHN0cmluZywgbmV3UGFyZW50SWQ6IHN0cmluZ319IHRyZWVFdmVudCAtIFRyZWUgZXZlbnRcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHRyZWUub24oJ21vdmUnLCBmdW5jdGlvbih0cmVlRXZlbnQpIHtcclxuICAgICAgICAgKiAgICAgdmFyIG5vZGVJZCA9IHRyZWVFdmVudC5ub2RlSWQsXHJcbiAgICAgICAgICogICAgICAgICBvcmlnaW5hbFBhcmVudElkID0gdHJlZUV2ZW50Lm9yaWdpbmFsUGFyZW50SWQsXHJcbiAgICAgICAgICogICAgICAgICBuZXdQYXJlbnRJZCA9IHRyZWVFdmVudC5uZXdQYXJlbnRJZDtcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZyhub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkKTtcclxuICAgICAgICAgKiB9KTtcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmZpcmUoJ21vdmUnLCB7XHJcbiAgICAgICAgICAgIG5vZGVJZDogbm9kZUlkLFxyXG4gICAgICAgICAgICBvcmlnaW5hbFBhcmVudElkOiBvcmlnaW5hbFBhcmVudElkLFxyXG4gICAgICAgICAgICBuZXdQYXJlbnRJZDogbmV3UGFyZW50SWRcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZXZlbnQgaGFuZGxlcnNcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZXRFdmVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwub24oe1xyXG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuX2RyYXcsXHJcbiAgICAgICAgICAgIG1vdmU6IHRoaXMuX29uTW92ZVxyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnY2xpY2snLCBzbmlwcGV0LmJpbmQodGhpcy5fb25DbGljaywgdGhpcykpO1xyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnbW91c2Vkb3duJywgc25pcHBldC5iaW5kKHRoaXMuX29uTW91c2Vkb3duLCB0aGlzKSk7XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdkYmxjbGljaycsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkRvdWJsZUNsaWNrLCB0aGlzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxyXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25Nb3VzZWRvd246IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBjbGllbnRYID0gZXZlbnQuY2xpZW50WCxcclxuICAgICAgICAgICAgY2xpZW50WSA9IGV2ZW50LmNsaWVudFksXHJcbiAgICAgICAgICAgIGFicyA9IE1hdGguYWJzO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBvbk1vdXNlTW92ZShldmVudCkge1xyXG4gICAgICAgICAgICB2YXIgbmV3Q2xpZW50WCA9IGV2ZW50LmNsaWVudFgsXHJcbiAgICAgICAgICAgICAgICBuZXdDbGllbnRZID0gZXZlbnQuY2xpZW50WTtcclxuXHJcbiAgICAgICAgICAgIGlmIChhYnMobmV3Q2xpZW50WCAtIGNsaWVudFgpICsgYWJzKG5ld0NsaWVudFkgLSBjbGllbnRZKSA+IDUpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZmlyZSgnbW91c2Vtb3ZlJywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5fbW91c2VNb3ZpbmdGbGFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBvbk1vdXNlVXAoKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZmlyZSgnbW91c2V1cCcsIGV2ZW50KTtcclxuICAgICAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xyXG4gICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX21vdXNlTW92aW5nRmxhZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZmlyZSgnbW91c2Vkb3duJywgZXZlbnQpO1xyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcclxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gY2xpY2tcclxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBDbGljayBldmVudFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcclxuICAgICAgICAgICAgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh1dGlsLmlzUmlnaHRCdXR0b24oZXZlbnQpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzKSkge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZSh0aGlzLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY2xpY2tUaW1lciAmJiAhdGhpcy5fbW91c2VNb3ZpbmdGbGFnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnc2luZ2xlQ2xpY2snLCBldmVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnJlc2V0Q2xpY2tUaW1lcigpO1xyXG4gICAgICAgICAgICB9LCAyMDApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gZG91YmxlIGNsaWNrIChkYmxjbGljaylcclxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBEb3VibGUgY2xpY2sgZXZlbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbkRvdWJsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHRoaXMuZmlyZSgnZG91YmxlQ2xpY2snLCBldmVudCk7XHJcbiAgICAgICAgdGhpcy5yZXNldENsaWNrVGltZXIoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbm9kZSBzdGF0ZSAtIG9wZW5lZCBvciBjbG9zZWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOb2RlIHN0YXRlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc2V0RGlzcGxheUZyb21Ob2RlU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcclxuICAgICAgICB2YXIgc3VidHJlZUVsZW1lbnQgPSB0aGlzLl9nZXRTdWJ0cmVlRWxlbWVudChub2RlSWQpLFxyXG4gICAgICAgICAgICBsYWJlbCwgYnRuRWxlbWVudCwgbm9kZUVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmICghc3VidHJlZUVsZW1lbnQgfHwgc3VidHJlZUVsZW1lbnQgPT09IHRoaXMucm9vdEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYWJlbCA9IHRoaXMuc3RhdGVMYWJlbHNbc3RhdGVdO1xyXG4gICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcclxuICAgICAgICBidG5FbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxyXG4gICAgICAgICAgICBub2RlRWxlbWVudCxcclxuICAgICAgICAgICAgdGhpcy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzXHJcbiAgICAgICAgKVswXTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlID09PSBub2RlU3RhdGVzLk9QRU5FRCkge1xyXG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fc2V0Tm9kZUNsYXNzTmFtZUZyb21TdGF0ZShub2RlRWxlbWVudCwgc3RhdGUpO1xyXG5cclxuICAgICAgICBpZiAoYnRuRWxlbWVudCkge1xyXG4gICAgICAgICAgICBidG5FbGVtZW50LmlubmVySFRNTCA9IGxhYmVsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbm9kZSBjbGFzcyBuYW1lIGZyb20gcHJvdmlkZWQgc3RhdGVcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVFbGVtZW50IC0gVHJlZU5vZGUgZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTmV3IGNoYW5nZWQgc3RhdGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlOiBmdW5jdGlvbihub2RlRWxlbWVudCwgc3RhdGUpIHtcclxuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcclxuICAgICAgICAgICAgb3BlbmVkQ2xhc3NOYW1lID0gY2xhc3NOYW1lc1tub2RlU3RhdGVzLk9QRU5FRCArICdDbGFzcyddLFxyXG4gICAgICAgICAgICBjbG9zZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuQ0xPU0VEICsgJ0NsYXNzJ107XHJcblxyXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Mobm9kZUVsZW1lbnQsIG9wZW5lZENsYXNzTmFtZSk7XHJcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgY2xvc2VkQ2xhc3NOYW1lKTtcclxuICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgaHRtbFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gbm9kZUlkcyAtIE5vZGUgaWQgbGlzdFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSFRNTFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX21ha2VIdG1sOiBmdW5jdGlvbihub2RlSWRzKSB7XHJcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbCxcclxuICAgICAgICAgICAgaHRtbCA9ICcnO1xyXG5cclxuICAgICAgICBzbmlwcGV0LmZvckVhY2gobm9kZUlkcywgZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgICAgIHZhciBub2RlID0gbW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICAgICAgc291cmNlcywgcHJvcHM7XHJcblxyXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc291cmNlcyA9IHRoaXMuX2dldFRlbXBsYXRlKG5vZGUpO1xyXG4gICAgICAgICAgICBwcm9wcyA9IHRoaXMuX21ha2VUZW1wbGF0ZVByb3BzKG5vZGUpO1xyXG4gICAgICAgICAgICBwcm9wcy5pbm5lclRlbXBsYXRlID0gdGhpcy5fbWFrZUlubmVySFRNTChub2RlLCB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHNvdXJjZXMuaW5uZXIsXHJcbiAgICAgICAgICAgICAgICBwcm9wczogcHJvcHNcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gdXRpbC50ZW1wbGF0ZShzb3VyY2VzLm91dGVyLCBwcm9wcyk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHJldHVybiBodG1sO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgaW5uZXIgaHRtbCBvZiBub2RlXHJcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBub2RlIC0gTm9kZVxyXG4gICAgICogQHBhcmFtIHt7c291cmNlOiBzdHJpbmcsIHByb3BzOiBPYmplY3R9fSBbY2FjaGVkXSAtIENhc2hlZCBkYXRhIHRvIG1ha2UgaHRtbFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSW5uZXIgaHRtbCBvZiBub2RlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfbWFrZUlubmVySFRNTDogZnVuY3Rpb24obm9kZSwgY2FjaGVkKSB7XHJcbiAgICAgICAgdmFyIHNvdXJjZSwgcHJvcHM7XHJcblxyXG4gICAgICAgIGNhY2hlZCA9IGNhY2hlZCB8fCB7fTtcclxuICAgICAgICBzb3VyY2UgPSBjYWNoZWQuc291cmNlIHx8IHRoaXMuX2dldFRlbXBsYXRlKG5vZGUpLmlubmVyO1xyXG4gICAgICAgIHByb3BzID0gY2FjaGVkLnByb3BzIHx8IHRoaXMuX21ha2VUZW1wbGF0ZVByb3BzKG5vZGUpO1xyXG4gICAgICAgIHJldHVybiB1dGlsLnRlbXBsYXRlKHNvdXJjZSwgcHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0ZW1wbGF0ZSBzb3VyY2VzXHJcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBub2RlIC0gTm9kZVxyXG4gICAgICogQHJldHVybnMge3tpbm5lcjogc3RyaW5nLCBvdXRlcjogc3RyaW5nfX0gVGVtcGxhdGUgc291cmNlc1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2dldFRlbXBsYXRlOiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHNvdXJjZTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcclxuICAgICAgICAgICAgc291cmNlID0ge1xyXG4gICAgICAgICAgICAgICAgaW5uZXI6IHRoaXMudGVtcGxhdGUubGVhZk5vZGUsXHJcbiAgICAgICAgICAgICAgICBvdXRlcjogb3V0ZXJUZW1wbGF0ZS5MRUFGX05PREVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNvdXJjZSA9IHtcclxuICAgICAgICAgICAgICAgIGlubmVyOiB0aGlzLnRlbXBsYXRlLmludGVybmFsTm9kZSxcclxuICAgICAgICAgICAgICAgIG91dGVyOiBvdXRlclRlbXBsYXRlLklOVEVSTkFMX05PREVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNvdXJjZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHRlbXBsYXRlIHByb3BlcnRpZXNcclxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXHJcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRlbXBsYXRlIHByb3BlcnRpZXNcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9tYWtlVGVtcGxhdGVQcm9wczogZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzLFxyXG4gICAgICAgICAgICBwcm9wcywgc3RhdGU7XHJcblxyXG4gICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XHJcbiAgICAgICAgICAgIHByb3BzID0ge1xyXG4gICAgICAgICAgICAgICAgaWQ6IG5vZGUuZ2V0SWQoKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgICAgICBwcm9wcyA9IHtcclxuICAgICAgICAgICAgICAgIGlkOiBub2RlLmdldElkKCksXHJcbiAgICAgICAgICAgICAgICBzdGF0ZUNsYXNzOiBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10sXHJcbiAgICAgICAgICAgICAgICBzdGF0ZUxhYmVsOiB0aGlzLnN0YXRlTGFiZWxzW3N0YXRlXSxcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiB0aGlzLl9tYWtlSHRtbChub2RlLmdldENoaWxkSWRzKCkpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZXh0ZW5kKHByb3BzLCBjbGFzc05hbWVzLCBub2RlLmdldEFsbERhdGEoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRHJhdyBlbGVtZW50IG9mIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfZHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgZWxlbWVudCwgaHRtbDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBhcGlcclxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVEcmF3XHJcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHRyZWUub24oJ2JlZm9yZURyYXcnLCBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZUlkKTtcclxuICAgICAgICAgKiB9KTtcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmZpcmUoJ2JlZm9yZURyYXcnLCBub2RlSWQpO1xyXG5cclxuICAgICAgICBpZiAobm9kZS5pc1Jvb3QoKSkge1xyXG4gICAgICAgICAgICBodG1sID0gdGhpcy5fbWFrZUh0bWwobm9kZS5nZXRDaGlsZElkcygpKTtcclxuICAgICAgICAgICAgZWxlbWVudCA9IHRoaXMucm9vdEVsZW1lbnQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaHRtbCA9IHRoaXMuX21ha2VJbm5lckhUTUwobm9kZSk7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGh0bWw7XHJcbiAgICAgICAgdGhpcy5fc2V0Q2xhc3NXaXRoRGlzcGxheShub2RlKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQGFwaVxyXG4gICAgICAgICAqIEBldmVudCBUcmVlI2FmdGVyRHJhd1xyXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKiB0cmVlLm9uKCdhZnRlckRyYXcnLCBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZUlkKTtcclxuICAgICAgICAgKiB9KTtcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmZpcmUoJ2FmdGVyRHJhdycsIG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGNsYXNzIGFuZCBkaXNwbGF5IG9mIG5vZGUgZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZXRDbGFzc1dpdGhEaXNwbGF5OiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIG5vZGVJZCA9IG5vZGUuZ2V0SWQoKSxcclxuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCksXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXM7XHJcblxyXG4gICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XHJcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5vcGVuZWRDbGFzcyk7XHJcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5jbG9zZWRDbGFzcyk7XHJcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5sZWFmQ2xhc3MpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgbm9kZS5nZXRTdGF0ZSgpKTtcclxuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDbGFzc1dpdGhEaXNwbGF5KGNoaWxkKTtcclxuICAgICAgICAgICAgfSwgbm9kZUlkLCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHN1YnRyZWUgZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFRyZWVOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFN1YnRyZWUgZWxlbWVudFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2dldFN1YnRyZWVFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUuaXNMZWFmKCkpIHtcclxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5pc1Jvb3QoKSkge1xyXG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHRoaXMucm9vdEVsZW1lbnRcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZXMuc3VidHJlZUNsYXNzXHJcbiAgICAgICAgICAgIClbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc3VidHJlZUVsZW1lbnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIHRoZSBkZXB0aCBvZiBub2RlXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH0gRGVwdGhcclxuICAgICAqL1xyXG4gICAgZ2V0RGVwdGg6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldERlcHRoKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIHRoZSBsYXN0IGRlcHRoIG9mIHRyZWVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gTGFzdCBkZXB0aFxyXG4gICAgICovXHJcbiAgICBnZXRMYXN0RGVwdGg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldExhc3REZXB0aCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiByb290IG5vZGUgaWRcclxuICAgICAqIEBhcGlcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJvb3Qgbm9kZSBpZFxyXG4gICAgICovXHJcbiAgICBnZXRSb290Tm9kZUlkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5yb290Tm9kZS5nZXRJZCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBjaGlsZCBpZHNcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz58dW5kZWZpbmVkfSBDaGlsZCBpZHNcclxuICAgICAqL1xyXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldENoaWxkSWRzKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIHBhcmVudCBpZCBvZiBub2RlXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0UGFyZW50SWQobm9kZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNldCBjbGljayB0aW1lclxyXG4gICAgICovXHJcbiAgICByZXNldENsaWNrVGltZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5jbGlja1RpbWVyKTtcclxuICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBub2RlIGlkIGZyb20gZWxlbWVudFxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIEVsZW1lbnRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZUlkRnJvbUVsZW1lbnQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgICB2YXIgaWRQcmVmaXggPSB0aGlzLmdldE5vZGVJZFByZWZpeCgpO1xyXG5cclxuICAgICAgICB3aGlsZSAoZWxlbWVudCAmJiBlbGVtZW50LmlkLmluZGV4T2YoaWRQcmVmaXgpID09PSAtMSkge1xyXG4gICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmlkIDogJyc7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHByZWZpeCBvZiBub2RlIGlkXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXggb2Ygbm9kZSBpZFxyXG4gICAgICovXHJcbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVJZFByZWZpeCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBub2RlIGRhdGFcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fHVuZGVmaW5lZH0gTm9kZSBkYXRhXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXROb2RlRGF0YShub2RlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBkYXRhIHByb3BlcnRpZXMgb2YgYSBub2RlXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBQcm9wZXJ0aWVzXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIHNldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIGRhdGEsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEsIGlzU2lsZW50KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxyXG4gICAgICovXHJcbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBuYW1lcywgaXNTaWxlbnQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZU5vZGVEYXRhKG5vZGVJZCwgbmFtZXMsIGlzU2lsZW50KVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBub2RlIHN0YXRlLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ3x1bmRlZmluZWR9IE5vZGUgc3RhdGUoKCdvcGVuZWQnLCAnY2xvc2VkJywgdW5kZWZpbmVkKVxyXG4gICAgICovXHJcbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKTtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0U3RhdGUoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcGVuIG5vZGVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKi9cclxuICAgIG9wZW46IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5PUEVORUQ7XHJcblxyXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xvc2Ugbm9kZVxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgY2xvc2U6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5DTE9TRUQ7XHJcblxyXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG9nZ2xlIG5vZGVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKi9cclxuICAgIHRvZ2dsZTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgc3RhdGU7XHJcblxyXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIG5vZGUudG9nZ2xlU3RhdGUoKTtcclxuICAgICAgICAgICAgc3RhdGUgPSBub2RlLmdldFN0YXRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTb3J0IGFsbCBub2Rlc1xyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZm9yIHNvcnRpbmdcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IHRyZWVcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiAvLyBTb3J0IHdpdGggcmVkcmF3aW5nIHRyZWVcclxuICAgICAqIHRyZWUuc29ydChmdW5jdGlvbihub2RlQSwgbm9kZUIpIHtcclxuICAgICAqICAgICB2YXIgYVZhbHVlID0gbm9kZUEuZ2V0RGF0YSgndGV4dCcpLFxyXG4gICAgICogICAgICAgICBiVmFsdWUgPSBub2RlQi5nZXREYXRhKCd0ZXh0Jyk7XHJcbiAgICAgKlxyXG4gICAgICogICAgIGlmICghYlZhbHVlIHx8ICFiVmFsdWUubG9jYWxlQ29tcGFyZSkge1xyXG4gICAgICogICAgICAgICByZXR1cm4gMDtcclxuICAgICAqICAgICB9XHJcbiAgICAgKiAgICAgcmV0dXJuIGJWYWx1ZS5sb2NhbGVDb21wYXJlKGFWYWx1ZSk7XHJcbiAgICAgKiB9KTtcclxuICAgICAqXHJcbiAgICAgKiAvLyBTb3J0LCBidXQgbm90IHJlZHJhdyB0cmVlXHJcbiAgICAgKiB0cmVlLnNvcnQoZnVuY3Rpb24obm9kZUEsIG5vZGVCKSB7XHJcbiAgICAgKiAgICAgdmFyIGFWYWx1ZSA9IG5vZGVBLmdldERhdGEoJ3RleHQnKSxcclxuICAgICAqICAgICAgICAgYlZhbHVlID0gbm9kZUIuZ2V0RGF0YSgndGV4dCcpO1xyXG4gICAgICpcclxuICAgICAqICAgICBpZiAoIWJWYWx1ZSB8fCAhYlZhbHVlLmxvY2FsZUNvbXBhcmUpIHtcclxuICAgICAqICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgKiAgICAgfVxyXG4gICAgICogICAgIHJldHVybiBiVmFsdWUubG9jYWxlQ29tcGFyZShhVmFsdWUpO1xyXG4gICAgICogfSwgdHJ1ZSk7XHJcbiAgICAgKi9cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5zb3J0KGNvbXBhcmF0b3IpO1xyXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZnJlc2ggdHJlZSBvciBub2RlJ3MgY2hpbGRyZW5cclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbm9kZUlkXSAtIFRyZWVOb2RlIGlkIHRvIHJlZnJlc2hcclxuICAgICAqL1xyXG4gICAgcmVmcmVzaDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgbm9kZUlkID0gbm9kZUlkIHx8IHRoaXMubW9kZWwucm9vdE5vZGUuZ2V0SWQoKTtcclxuICAgICAgICB0aGlzLl9kcmF3KG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdHJlZS5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xyXG4gICAgICogICAgIGNvbnNvbGUubG9nKG5vZGUuZ2V0SWQoKSA9PT0gbm9kZUlkKTsgLy8gdHJ1ZVxyXG4gICAgICogfSk7XHJcbiAgICAgKi9cclxuICAgIGVhY2hBbGw6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoQWxsKGl0ZXJhdGVlLCBjb250ZXh0KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIGRlc2NlbmRhbnRzIG9mIGEgbm9kZS5cclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHRyZWUuZWFjaChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcclxuICAgICAqICAgICBjb25zb2xlLmxvZyhub2RlLmdldElkKCkgPT09IG5vZGVJZCk7IC8vIHRydWVcclxuICAgICAqIH0sIHBhcmVudElkKTtcclxuICAgICAqXHJcbiAgICAgKi9cclxuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwuZWFjaChpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZCBub2RlKHMpLlxyXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXHJcbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3LWRhdGFcclxuICAgICAqIEBwYXJhbSB7Kn0gcGFyZW50SWQgLSBQYXJlbnQgaWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogLy8gYWRkIG5vZGUgd2l0aCByZWRyYXdpbmdcclxuICAgICAqIHZhciBmaXJzdEFkZGVkSWRzID0gdHJlZS5hZGQoe3RleHQ6J0ZFIGRldmVsb3BtZW50IHRlYW0xJ30sIHBhcmVudElkKTtcclxuICAgICAqIGNvbnNvbGUubG9nKGZpcnN0QWRkZWRJZHMpOyAvLyBbXCJ0dWktdHJlZS1ub2RlLTEwXCJdXHJcbiAgICAgKlxyXG4gICAgICogLy8gYWRkIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcclxuICAgICAqIHZhciBzZWNvbmRBZGRlZElkcyA9IHRyZWUuYWRkKFtcclxuICAgICAqICAgIHt0ZXh0OiAnRkUgZGV2ZWxvcG1lbnQgdGVhbTInfSxcclxuICAgICAqICAgIHt0ZXh0OiAnRkUgZGV2ZWxvcG1lbnQgdGVhbTMnfVxyXG4gICAgICogXSwgcGFyZW50SWQsIHRydWUpO1xyXG4gICAgICogY29uc29sZS5sb2coc2Vjb25kQWRkZWRJZHMpOyAvLyBbXCJ0dWktdHJlZS1ub2RlLTExXCIsIFwidHVpLXRyZWUtbm9kZS0xMlwiXVxyXG4gICAgICovXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmFkZChkYXRhLCBwYXJlbnRJZCwgaXNTaWxlbnQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhIG5vZGUgd2l0aCBjaGlsZHJlbi5cclxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWQgdG8gcmVtb3ZlXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHRyZWUucmVtb3ZlKG15Tm9kZUlkKTsgLy8gcmVtb3ZlIG5vZGUgd2l0aCByZWRyYXdpbmdcclxuICAgICAqIHRyZWUucmVtb3ZlKG15Tm9kZUlkLCB0cnVlKTsgLy8gcmVtb3ZlIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihub2RlSWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmUobm9kZUlkLCBpc1NpbGVudCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTW92ZSBhIG5vZGUgdG8gbmV3IHBhcmVudFxyXG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB0cmVlLm1vdmUobXlOb2RlSWQsIG5ld1BhcmVudElkKTsgLy8gbW9kZSBub2RlIHdpdGggcmVkcmF3aW5nXHJcbiAgICAgKiB0cmVlLm1vdmUobXlOb2RlSWQsIG5ld1BhcmVudElkLCB0cnVlKTsgLy8gbW92ZSBub2RlIHdpdGhvdXQgcmVkcmF3aW5nXHJcbiAgICAgKi9cclxuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5tb3ZlKG5vZGVJZCwgbmV3UGFyZW50SWQsIGlzU2lsZW50KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZWFyY2ggbm9kZSBpZHMgYnkgcGFzc2luZyB0aGUgcHJlZGljYXRlIGNoZWNrIG9yIG1hdGNoaW5nIGRhdGFcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fSBwcmVkaWNhdGUgLSBQcmVkaWNhdGUgb3IgZGF0YVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgcHJlZGljYXRlXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5vZGUgaWRzXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogLy8gc2VhcmNoIGZyb20gcHJlZGljYXRlXHJcbiAgICAgKiB2YXIgbGVhZk5vZGVJZHMgPSB0cmVlLnNlYXJjaChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcclxuICAgICAqICAgICByZXR1cm4gbm9kZS5pc0xlYWYoKTtcclxuICAgICAqIH0pO1xyXG4gICAgICogY29uc29sZS5sb2cobGVhZk5vZGVJZHMpOyAvLyBbJ3R1aS10cmVlLW5vZGUtMycsICd0dWktdHJlZS1ub2RlLTUnXVxyXG4gICAgICpcclxuICAgICAqIC8vIHNlYXJjaCBmcm9tIGRhdGFcclxuICAgICAqIHZhciBzcGVjaWFsTm9kZUlkcyA9IHRyZWUuc2VhcmNoKHtcclxuICAgICAqICAgICBpc1NwZWNpYWw6IHRydWUsXHJcbiAgICAgKiAgICAgZm9vOiAnYmFyJ1xyXG4gICAgICogfSk7XHJcbiAgICAgKiBjb25zb2xlLmxvZyhzcGVjaWFsTm9kZUlkcyk7IC8vIFsndHVpLXRyZWUtbm9kZS01JywgJ3R1aS10cmVlLW5vZGUtMTAnXVxyXG4gICAgICogY29uc29sZS5sb2codHJlZS5nZXROb2RlRGF0YSgndHVpLXRyZWUtbm9kZS01JykuaXNTcGVjaWFsKTsgLy8gdHJ1ZVxyXG4gICAgICogY29uc29sZS5sb2codHJlZS5nZXROb2RlRGF0YSgndHVpLXRyZWUtbm9kZS01JykuZm9vKTsgLy8gJ2JhcidcclxuICAgICAqL1xyXG4gICAgc2VhcmNoOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcclxuICAgICAgICBpZiAoIXNuaXBwZXQuaXNPYmplY3QocHJlZGljYXRlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc25pcHBldC5pc0Z1bmN0aW9uKHByZWRpY2F0ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcihwcmVkaWNhdGUsIGNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3doZXJlKHByZWRpY2F0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2VhcmNoIG5vZGUgaWRzIGJ5IG1hdGNoaW5nIGRhdGFcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIERhdGFcclxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF93aGVyZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZmlsdGVyKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhO1xyXG5cclxuICAgICAgICAgICAgZGF0YSA9IG5vZGUuZ2V0QWxsRGF0YSgpO1xyXG4gICAgICAgICAgICBzbmlwcGV0LmZvckVhY2gocHJvcHMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChrZXkgaW4gZGF0YSkgJiYgKGRhdGFba2V5XSA9PT0gdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNlYXJjaCBub2RlIGlkcyBieSBwYXNzaW5nIHRoZSBwcmVkaWNhdGUgY2hlY2tcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSAtIFByZWRpY2F0ZVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgcHJlZGljYXRlXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5vZGUgaWRzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfZmlsdGVyOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xyXG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUsIG5vZGVJZCkpIHtcclxuICAgICAgICAgICAgICAgIGZpbHRlcmVkLnB1c2gobm9kZUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGNvbnRleHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlIGZhY2lsaXR5IG9mIHRyZWVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtICdTZWxlY3RhYmxlJywgJ0RyYWdnYWJsZScsICdFZGl0YWJsZSdcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBGZWF0dXJlIG9wdGlvbnNcclxuICAgICAqIEByZXR1cm4ge1RyZWV9IHRoaXNcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB0cmVlXHJcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnLCB7XHJcbiAgICAgKiAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lOiAndHVpLXRyZWUtc2VsZWN0ZWQnXHJcbiAgICAgKiAgfSlcclxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnRWRpdGFibGUnLCB7XHJcbiAgICAgKiAgICAgIGVuYWJsZUNsYXNzTmFtZTogdHJlZS5jbGFzc05hbWVzLnRleHRDbGFzcyxcclxuICAgICAqICAgICAgZGF0YUtleTogJ3RleHQnLFxyXG4gICAgICogICAgICBpbnB1dENsYXNzTmFtZTogJ215SW5wdXQnXHJcbiAgICAgKiAgfSlcclxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnRHJhZ2dhYmxlJywge1xyXG4gICAgICogICAgICB1c2VIZWxwZXI6IHRydWUsXHJcbiAgICAgKiAgICAgIGhlbHBlclBvczoge3g6IDUsIHk6IDJ9LFxyXG4gICAgICogICAgICByZWplY3RlZFRhZ05hbWVzOiBbJ1VMJywgJ0lOUFVUJywgJ0JVVFRPTiddLFxyXG4gICAgICogICAgICByZWplY3RlZENsYXNzTmFtZXM6IFsnbm90RHJhZ2dhYmxlJywgJ25vdERyYWdnYWJsZS0yJ11cclxuICAgICAqICB9KTtcclxuICAgICAqL1xyXG4gICAgZW5hYmxlRmVhdHVyZTogZnVuY3Rpb24oZmVhdHVyZU5hbWUsIG9wdGlvbnMpIHtcclxuICAgICAgICB2YXIgRmVhdHVyZSA9IFRyZWUuZmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xyXG5cclxuICAgICAgICB0aGlzLmRpc2FibGVGZWF0dXJlKGZlYXR1cmVOYW1lKTtcclxuICAgICAgICBpZiAoRmVhdHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV0gPSBuZXcgRmVhdHVyZSh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzYWJsZSBmYWNpbGl0eSBvZiB0cmVlXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnLCAnRWRpdGFibGUnXHJcbiAgICAgKiBAcmV0dXJuIHtUcmVlfSB0aGlzXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdHJlZVxyXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScpXHJcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdEcmFnZ2FibGUnKVxyXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnRWRpdGFibGUnKTtcclxuICAgICAqL1xyXG4gICAgZGlzYWJsZUZlYXR1cmU6IGZ1bmN0aW9uKGZlYXR1cmVOYW1lKSB7XHJcbiAgICAgICAgdmFyIGZlYXR1cmUgPSB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV07XHJcblxyXG4gICAgICAgIGlmIChmZWF0dXJlKSB7XHJcbiAgICAgICAgICAgIGZlYXR1cmUuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNlbGVjdCBub2RlIGlmIHRoZSBmZWF0dXJlLVwiU2VsZWN0YWJsZVwiIGlzIGVuYWJsZWQuXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZCB0byByZW1vdmVcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB0cmVlXHJcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxyXG4gICAgICogIC5vbignc2VsZWN0JywgZnVuY3Rpb24obm9kZUlkLCBwcmV2Tm9kZUlkKSB7XHJcbiAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdzZWxlY3RlZCBub2RlOiAnICsgbm9kZUlkKTtcclxuICAgICAqICB9KTtcclxuICAgICAqXHJcbiAgICAgKiB0cmVlLnNlbGVjdCgndHVpLXRyZWUtbm9kZS0xMycpOyAvLyBzZWxlY3RlZCBub2RlOiB0dWktdHJlZS1ub2RlLTEzXHJcbiAgICAgKi9cclxuICAgIHNlbGVjdDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2VzLklOVkFMSURfQVBJX1NFTEVDVEFCTEUpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnNuaXBwZXQuZm9yRWFjaChmZWF0dXJlcywgZnVuY3Rpb24oRmVhdHVyZSwgbmFtZSkge1xyXG4gICAgVHJlZS5yZWdpc3RlckZlYXR1cmUobmFtZSwgRmVhdHVyZSk7XHJcbn0pO1xyXG5zbmlwcGV0LkN1c3RvbUV2ZW50cy5taXhpbihUcmVlKTtcclxubW9kdWxlLmV4cG9ydHMgPSBUcmVlO1xyXG4iLCIvKipcclxuICogQGZpbGVvdmVydmlldyBVcGRhdGUgdmlldyBhbmQgY29udHJvbCB0cmVlIGRhdGFcclxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFRyZWVOb2RlID0gcmVxdWlyZSgnLi90cmVlTm9kZScpLFxyXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xyXG5cclxudmFyIHNuaXBwZXQgPSB0dWkudXRpbCxcclxuICAgIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kLFxyXG4gICAga2V5cyA9IHNuaXBwZXQua2V5cyxcclxuICAgIGZvckVhY2ggPSBzbmlwcGV0LmZvckVhY2gsXHJcbiAgICBtYXAgPSBzbmlwcGV0Lm1hcCxcclxuICAgIGZpbHRlciA9IHNuaXBwZXQuZmlsdGVyLFxyXG4gICAgaW5BcnJheSA9IHNuaXBwZXQuaW5BcnJheTtcclxuXHJcbi8qKlxyXG4gKiBUcmVlIG1vZGVsXHJcbiAqIEBjb25zdHJ1Y3RvciBUcmVlTW9kZWxcclxuICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIERhdGFcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zIGZvciBkZWZhdWx0U3RhdGUgYW5kIG5vZGVJZFByZWZpeFxyXG4gKiovXHJcbnZhciBUcmVlTW9kZWwgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVNb2RlbC5wcm90b3R5cGUgKi97IC8qIGVzbGludC1kaXNhYmxlICovXHJcbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7Lyplc2xpbnQtZW5hYmxlKi9cclxuICAgICAgICBUcmVlTm9kZS5zZXRJZFByZWZpeChvcHRpb25zLm5vZGVJZFByZWZpeCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERlZmF1bHQgc3RhdGUgb2Ygbm9kZVxyXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5ub2RlRGVmYXVsdFN0YXRlID0gb3B0aW9ucy5ub2RlRGVmYXVsdFN0YXRlO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSb290IG5vZGVcclxuICAgICAgICAgKiBAdHlwZSB7VHJlZU5vZGV9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yb290Tm9kZSA9IG5ldyBUcmVlTm9kZSh7XHJcbiAgICAgICAgICAgIHN0YXRlOiAnb3BlbmVkJ1xyXG4gICAgICAgIH0sIG51bGwpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUcmVlIGhhc2ggaGF2aW5nIGFsbCBub2Rlc1xyXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3QuPHN0cmluZywgVHJlZU5vZGU+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudHJlZUhhc2ggPSB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5fc2V0RGF0YShkYXRhKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gcHJlZml4IG9mIG5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFByZWZpeFxyXG4gICAgICovXHJcbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBUcmVlTm9kZS5pZFByZWZpeDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbW9kZWwgd2l0aCB0cmVlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBUcmVlIGRhdGFcclxuICAgICAqL1xyXG4gICAgX3NldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICB2YXIgcm9vdCA9IHRoaXMucm9vdE5vZGUsXHJcbiAgICAgICAgICAgIHJvb3RJZCA9IHJvb3QuZ2V0SWQoKTtcclxuXHJcbiAgICAgICAgdGhpcy50cmVlSGFzaFtyb290SWRdID0gcm9vdDtcclxuICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goZGF0YSwgcm9vdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFrZSB0cmVlIGhhc2ggZnJvbSBkYXRhIGFuZCBwYXJlbnROb2RlXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBwYXJlbnQgLSBQYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX21ha2VUcmVlSGFzaDogZnVuY3Rpb24oZGF0YSwgcGFyZW50KSB7XHJcbiAgICAgICAgdmFyIHBhcmVudElkID0gcGFyZW50LmdldElkKCksXHJcbiAgICAgICAgICAgIGlkcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKGRhdHVtKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbkRhdGEgPSBkYXR1bS5jaGlsZHJlbixcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9jcmVhdGVOb2RlKGRhdHVtLCBwYXJlbnRJZCksXHJcbiAgICAgICAgICAgICAgICBub2RlSWQgPSBub2RlLmdldElkKCk7XHJcblxyXG4gICAgICAgICAgICBpZHMucHVzaChub2RlSWQpO1xyXG4gICAgICAgICAgICB0aGlzLnRyZWVIYXNoW25vZGVJZF0gPSBub2RlO1xyXG4gICAgICAgICAgICBwYXJlbnQuYWRkQ2hpbGRJZChub2RlSWQpO1xyXG4gICAgICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goY2hpbGRyZW5EYXRhLCBub2RlKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGlkcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVEYXRhIC0gRGF0dW0gb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IGlkXHJcbiAgICAgKiBAcmV0dXJucyB7VHJlZU5vZGV9IFRyZWVOb2RlXHJcbiAgICAgKi9cclxuICAgIF9jcmVhdGVOb2RlOiBmdW5jdGlvbihub2RlRGF0YSwgcGFyZW50SWQpIHtcclxuICAgICAgICB2YXIgbm9kZTtcclxuICAgICAgICBub2RlRGF0YSA9IGV4dGVuZCh7XHJcbiAgICAgICAgICAgIHN0YXRlOiB0aGlzLm5vZGVEZWZhdWx0U3RhdGVcclxuICAgICAgICB9LCBub2RlRGF0YSk7XHJcblxyXG4gICAgICAgIG5vZGUgPSBuZXcgVHJlZU5vZGUobm9kZURhdGEsIHBhcmVudElkKTtcclxuICAgICAgICBub2RlLnJlbW92ZURhdGEoJ2NoaWxkcmVuJyk7XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBjaGlsZHJlblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtBcnJheS48VHJlZU5vZGU+fHVuZGVmaW5lZH0gY2hpbGRyZW5cclxuICAgICAqL1xyXG4gICAgZ2V0Q2hpbGRyZW46IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcclxuICAgICAgICBpZiAoIWNoaWxkSWRzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtYXAoY2hpbGRJZHMsIGZ1bmN0aW9uKGNoaWxkSWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZShjaGlsZElkKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgY2hpbGQgaWRzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fHVuZGVmaW5lZH0gQ2hpbGQgaWRzXHJcbiAgICAgKi9cclxuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbm9kZS5nZXRDaGlsZElkcygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgbnVtYmVyIG9mIG5vZGVzXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIG5vZGVzXHJcbiAgICAgKi9cclxuICAgIGdldENvdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4ga2V5cyh0aGlzLnRyZWVIYXNoKS5sZW5ndGg7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGxhc3QgZGVwdGhcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBsYXN0IGRlcHRoXHJcbiAgICAgKi9cclxuICAgIGdldExhc3REZXB0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGRlcHRocyA9IG1hcCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldERlcHRoKG5vZGUuZ2V0SWQoKSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShudWxsLCBkZXB0aHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpbmQgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcclxuICAgICAqIEByZXR1cm5zIHtUcmVlTm9kZXx1bmRlZmluZWR9IE5vZGVcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZTogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmVlSGFzaFtpZF07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGRlcHRoIGZyb20gbm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ8dW5kZWZpbmVkfSBEZXB0aFxyXG4gICAgICovXHJcbiAgICBnZXREZXB0aDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXHJcbiAgICAgICAgICAgIGRlcHRoID0gMCxcclxuICAgICAgICAgICAgcGFyZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XHJcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xyXG4gICAgICAgICAgICBkZXB0aCArPSAxO1xyXG4gICAgICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50LmdldFBhcmVudElkKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlcHRoO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBwYXJlbnQgaWQgb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBub2RlLmdldFBhcmVudElkKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWQgdG8gcmVtb3ZlXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oaWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxyXG4gICAgICAgICAgICBwYXJlbnQ7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuXHJcbiAgICAgICAgZm9yRWFjaChub2RlLmdldENoaWxkSWRzKCksIGZ1bmN0aW9uKGNoaWxkSWQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoY2hpbGRJZCwgdHJ1ZSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZElkKGlkKTtcclxuICAgICAgICBkZWxldGUgdGhpcy50cmVlSGFzaFtpZF07XHJcblxyXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnQuZ2V0SWQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZCBub2RlKHMpLlxyXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXHJcbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxyXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IGlkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5ldyBhZGRlZCBub2RlIGlkc1xyXG4gICAgICovXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGUsXHJcbiAgICAgICAgICAgIGlkcztcclxuXHJcbiAgICAgICAgZGF0YSA9IFtdLmNvbmNhdChkYXRhKTtcclxuICAgICAgICBpZHMgPSB0aGlzLl9tYWtlVHJlZUhhc2goZGF0YSwgcGFyZW50KTtcclxuXHJcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIHBhcmVudElkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpZHM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcyAtIFByb3BlcnRpZXNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcclxuICAgICAqL1xyXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKGlkLCBwcm9wcywgaXNTaWxlbnQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSB8fCAhcHJvcHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbm9kZS5zZXREYXRhKHByb3BzKTtcclxuXHJcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGlkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIG5vZGUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxyXG4gICAgICovXHJcbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24oaWQsIG5hbWVzLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlIHx8ICFuYW1lcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHVpLnV0aWwuaXNBcnJheShuYW1lcykpIHtcclxuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhLmFwcGx5KG5vZGUsIG5hbWVzKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBub2RlLnJlbW92ZURhdGEobmFtZXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGlkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTW92ZSBhIG5vZGUgdG8gbmV3IHBhcmVudCdzIGNoaWxkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxyXG4gICAgICovXHJcbiAgICBtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG5ld1BhcmVudElkLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIG9yaWdpbmFsUGFyZW50LCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnQ7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5ld1BhcmVudCA9IHRoaXMuZ2V0Tm9kZShuZXdQYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZTtcclxuICAgICAgICBuZXdQYXJlbnRJZCA9IG5ld1BhcmVudC5nZXRJZCgpO1xyXG4gICAgICAgIG9yaWdpbmFsUGFyZW50SWQgPSBub2RlLmdldFBhcmVudElkKCk7XHJcbiAgICAgICAgb3JpZ2luYWxQYXJlbnQgPSB0aGlzLmdldE5vZGUob3JpZ2luYWxQYXJlbnRJZCk7XHJcblxyXG4gICAgICAgIGlmIChub2RlSWQgPT09IG5ld1BhcmVudElkIHx8IHRoaXMuY29udGFpbnMobm9kZUlkLCBuZXdQYXJlbnRJZCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvcmlnaW5hbFBhcmVudC5yZW1vdmVDaGlsZElkKG5vZGVJZCk7XHJcbiAgICAgICAgbm9kZS5zZXRQYXJlbnRJZChuZXdQYXJlbnRJZCk7XHJcbiAgICAgICAgbmV3UGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcclxuXHJcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ21vdmUnLCBub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgdG8gc2VlIGlmIGEgbm9kZSBpcyBhIGRlc2NlbmRhbnQgb2YgYW5vdGhlciBub2RlLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lZElkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRoZSBub2RlIGlzIGNvbnRhaW5lZCBvciBub3RcclxuICAgICAqL1xyXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGNvbnRhaW5lcklkLCBjb250YWluZWRJZCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHRoaXMuZ2V0UGFyZW50SWQoY29udGFpbmVkSWQpLFxyXG4gICAgICAgICAgICBpc0NvbnRhaW5lZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB3aGlsZSAoIWlzQ29udGFpbmVkICYmIHBhcmVudElkKSB7XHJcbiAgICAgICAgICAgIGlzQ29udGFpbmVkID0gKGNvbnRhaW5lcklkID09PSBwYXJlbnRJZCk7XHJcbiAgICAgICAgICAgIHBhcmVudElkID0gdGhpcy5nZXRQYXJlbnRJZChwYXJlbnRJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpc0NvbnRhaW5lZDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTb3J0IG5vZGVzXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIC0gQ29tcGFyYXRvciBmdW5jdGlvblxyXG4gICAgICovXHJcbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XHJcbiAgICAgICAgdGhpcy5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmdldENoaWxkcmVuKG5vZGVJZCksXHJcbiAgICAgICAgICAgICAgICBjaGlsZElkcztcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbi5zb3J0KGNvbXBhcmF0b3IpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNoaWxkSWRzID0gbWFwKGNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZC5nZXRJZCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBub2RlLnJlcGxhY2VDaGlsZElkcyhjaGlsZElkcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgbm9kZSBkYXRhIChhbGwpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge29iamVjdHx1bmRlZmluZWR9IE5vZGUgZGF0YVxyXG4gICAgICovXHJcbiAgICBnZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0QWxsRGF0YSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgbm9kZXMuXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxyXG4gICAgICovXHJcbiAgICBlYWNoQWxsOiBmdW5jdGlvbihpdGVyYXRlZSwgY29udGV4dCkge1xyXG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XHJcblxyXG4gICAgICAgIGZvckVhY2godGhpcy50cmVlSGFzaCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGl0ZXJhdGVlLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBkZXNjZW5kYW50cyBvZiBhIG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcclxuICAgICAqL1xyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHN0YWNrLCBub2RlSWQsIG5vZGU7XHJcblxyXG4gICAgICAgIG5vZGUgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpO1xyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YWNrID0gbm9kZS5nZXRDaGlsZElkcygpO1xyXG5cclxuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xyXG4gICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbm9kZUlkID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcclxuICAgICAgICAgICAgaXRlcmF0ZWUuY2FsbChjb250ZXh0LCBub2RlLCBub2RlSWQpO1xyXG5cclxuICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5jb25jYXQobm9kZS5nZXRDaGlsZElkcygpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWVNb2RlbCk7XHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZU1vZGVsO1xyXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdGF0ZXMgPSByZXF1aXJlKCcuL2NvbnN0cy9zdGF0ZXMnKS5ub2RlLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIGxhc3RJbmRleCA9IDAsXG4gICAgZ2V0TmV4dEluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxhc3RJbmRleDtcbiAgICAgICAgbGFzdEluZGV4ICs9IDE7XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9LFxuICAgIFJFU0VSVkVEX1BST1BFUlRJRVMgPSB7XG4gICAgICAgIGlkOiAnJyxcbiAgICAgICAgc3RhdGU6ICdzZXRTdGF0ZSdcbiAgICB9LFxuICAgIGluQXJyYXkgPSB0dWkudXRpbC5pbkFycmF5O1xuXG4vKipcbiAqIFRyZWVOb2RlXG4gKiBAQ29uc3RydWN0b3IgVHJlZU5vZGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBub2RlRGF0YSAtIE5vZGUgZGF0YVxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBQYXJlbnQgbm9kZSBpZFxuICovXG52YXIgVHJlZU5vZGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVOb2RlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgcHJlZml4IG9mIGlkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgaWRcbiAgICAgICAgICovXG4gICAgICAgIHNldElkUHJlZml4OiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgICAgIHRoaXMuaWRQcmVmaXggPSBwcmVmaXggfHwgdGhpcy5pZFByZWZpeDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJlZml4IG9mIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZFByZWZpeDogJydcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faWQgPSB0aGlzLmNvbnN0cnVjdG9yLmlkUHJlZml4ICsgZ2V0TmV4dEluZGV4KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhcmVudCBub2RlIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2NoaWxkSWRzID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIHN0YXRlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG5cbiAgICAgICAgdGhpcy5zZXREYXRhKG5vZGVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJlc2VydmVkIHByb3BlcnRpZXMgZnJvbSBkYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBOb2RlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBOb2RlIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSZXNlcnZlZFByb3BlcnRpZXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaE93blByb3BlcnRpZXMoUkVTRVJWRURfUFJPUEVSVElFUywgZnVuY3Rpb24oc2V0dGVyLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW25hbWVdO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tzZXR0ZXJdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqL1xuICAgIHRvZ2dsZVN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlID09PSBzdGF0ZXMuQ0xPU0VEKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5PUEVORUQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIFN0YXRlIG9mIG5vZGUgKCdjbG9zZWQnLCAnb3BlbmVkJylcbiAgICAgKi9cbiAgICBzZXRTdGF0ZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgc3RhdGUgKz0gJyc7XG4gICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzW3N0YXRlLnRvVXBwZXJDYXNlKCldIHx8IHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc3RhdGVcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gc3RhdGUgKCdvcGVuZWQnIG9yICdjbG9zZWQnKVxuICAgICAqL1xuICAgIGdldFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gTm9kZSBpZFxuICAgICAqL1xuICAgIGdldElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcGFyZW50IGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFBhcmVudCBub2RlIGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50SWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIHNldFBhcmVudElkOiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXBsYWNlIGNoaWxkSWRzXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gY2hpbGRJZHMgLSBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICovXG4gICAgcmVwbGFjZUNoaWxkSWRzOiBmdW5jdGlvbihjaGlsZElkcykge1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IGNoaWxkSWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj59IElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKi9cbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5zbGljZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICovXG4gICAgYWRkQ2hpbGRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5fY2hpbGRJZHM7XG5cbiAgICAgICAgaWYgKHR1aS51dGlsLmluQXJyYXkoY2hpbGRJZHMsIGlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNoaWxkSWRzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICByZW1vdmVDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB1dGlsLnJlbW92ZUl0ZW1Gcm9tQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBQcm9wZXJ0eSBuYW1lIG9mIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7Kn0gRGF0YVxuICAgICAqL1xuICAgIGdldERhdGE6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhbGwgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBEYXRhXG4gICAgICovXG4gICAgZ2V0QWxsRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5leHRlbmQoe30sIHRoaXMuX2RhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIERhdGEgZm9yIGFkZGluZ1xuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZGF0YSA9IHRoaXMuX3NldFJlc2VydmVkUHJvcGVydGllcyhkYXRhKTtcbiAgICAgICAgdHVpLnV0aWwuZXh0ZW5kKHRoaXMuX2RhdGEsIGRhdGEpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7Li4uc3RyaW5nfSBuYW1lcyAtIE5hbWVzIG9mIGRhdGFcbiAgICAgKi9cbiAgICByZW1vdmVEYXRhOiBmdW5jdGlvbihuYW1lcykge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoQXJyYXkoYXJndW1lbnRzLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZGF0YVtuYW1lXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoaXMgbm9kZSBoYXMgYSBwcm92aWRlZCBjaGlsZCBpZC5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqL1xuICAgIGhhc0NoaWxkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gaW5BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpICE9PSAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBub2RlIGlzIGxlYWYuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIGxlYWYgb3Igbm90LlxuICAgICAqL1xuICAgIGlzTGVhZjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5sZW5ndGggPT09IDA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyByb290LlxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gTm9kZSBpcyByb290IG9yIG5vdC5cbiAgICAgKi9cbiAgICBpc1Jvb3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuaXNGYWxzeSh0aGlzLl9wYXJlbnRJZCk7XG4gICAgfVxufSk7XG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVOb2RlO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEhlbHBlciBvYmplY3QgdG8gbWFrZSBlYXN5IHRyZWUgZWxlbWVudHNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSB7XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpcnN0IHNwZWNpZmllZCBpdGVtIGZyb20gYXJyYXksIGlmIGl0IGV4aXN0c1xuICAgICAqIEBwYXJhbSB7Kn0gaXRlbSBJdGVtIHRvIGxvb2sgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyIEFycmF5IHRvIHF1ZXJ5XG4gICAgICovXG4gICAgcmVtb3ZlSXRlbUZyb21BcnJheTogZnVuY3Rpb24oaXRlbSwgYXJyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoaXRlbSwgYXJyKTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNsYXNzbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBDbGFzc25hbWVcbiAgICAgKi9cbiAgICBhZGRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NOYW1lID09PSAnJykge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoIXV0aWwuaGFzQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgKz0gJyAnICsgY2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjbGFzc25hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIC0gQ2xhc3NuYW1lXG4gICAgICovXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgb3JpZ2luYWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpLFxuICAgICAgICAgICAgYXJyLCBpbmRleDtcblxuICAgICAgICBpZiAoIW9yaWdpbmFsQ2xhc3NOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnIgPSBvcmlnaW5hbENsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgICAgICBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoY2xhc3NOYW1lLCBhcnIpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gYXJyLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB0byBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50IFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhZGRcbiAgICAgKi9cbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgZnJvbSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmRldGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9IEV2ZW50IHRhcmdldFxuICAgICAqL1xuICAgIGdldFRhcmdldDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0O1xuICAgICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgICAgIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEhUTUxFbGVtZW50XG4gICAgICogQHJldHVybnMge3N0cmluZ30gQ2xhc3MgbmFtZVxuICAgICAqL1xuICAgIGdldENsYXNzOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50ICYmIGVsZW1lbnQuZ2V0QXR0cmlidXRlICYmIChlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCBlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3NOYW1lJykgfHwgJycpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGUgZWxlbWVudCBoYXMgc3BlY2lmaWMgY2xhc3Mgb3Igbm90XG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3MgdG8gZmluZFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHRoZSBjbGFzc1xuICAgICAqL1xuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGVsQ2xhc3NOYW1lID0gdXRpbC5nZXRDbGFzcyhlbGVtZW50KTtcblxuICAgICAgICByZXR1cm4gZWxDbGFzc05hbWUuaW5kZXhPZihjbGFzc05hbWUpID4gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgZWxlbWVudCBieSBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzc1xuICAgICAqIEByZXR1cm4ge0FycmF5LjxIVE1MRWxlbWVudD59IEVsZW1lbnRzXG4gICAgICovXG4gICAgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZTogZnVuY3Rpb24odGFyZ2V0LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGFsbCwgZmlsdGVyZWQ7XG5cbiAgICAgICAgaWYgKHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZCA9IHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbGwgPSB0dWkudXRpbC50b0FycmF5KHRhcmdldC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpKTtcbiAgICAgICAgICAgIGZpbHRlcmVkID0gdHVpLnV0aWwuZmlsdGVyKGFsbCwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gKGNsYXNzTmFtZXMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB3aGV0aGVyIHRoZSBjbGljayBldmVudCBieSByaWdodCBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGNsaWNrIGV2ZW50IGJ5IHJpZ2h0IGJ1dHRvblxuICAgICAqL1xuICAgIGlzUmlnaHRCdXR0b246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB1dGlsLl9nZXRCdXR0b24oZXZlbnQpID09PSAyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBwcm9wZXJ0eSBleGlzdCBvciBub3RcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwcm9wcyBBIHByb3BlcnR5XG4gICAgICogQHJldHVybiB7c3RyaW5nfGJvb2xlYW59IFByb3BlcnR5IG5hbWUgb3IgZmFsc2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciB1c2VyU2VsZWN0UHJvcGVydHkgPSB1dGlsLnRlc3RQcm9wKFtcbiAgICAgKiAgICAgJ3VzZXJTZWxlY3QnLFxuICAgICAqICAgICAnV2Via2l0VXNlclNlbGVjdCcsXG4gICAgICogICAgICdPVXNlclNlbGVjdCcsXG4gICAgICogICAgICdNb3pVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ21zVXNlclNlbGVjdCdcbiAgICAgKiBdKTtcbiAgICAgKi9cbiAgICB0ZXN0UHJvcDogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gZmFsc2U7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChwcm9wcywgZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICAgICAgaWYgKHByb3AgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eU5hbWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgZGVmYXVsdCBldmVudCBcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGh0bWwgZnJvbSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2UgLSBUZW1wbGF0ZSBodG1sXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gVGVtcGxhdGUgZGF0YVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGh0bWxcbiAgICAgKi9cbiAgICB0ZW1wbGF0ZTogZnVuY3Rpb24oc291cmNlLCBwcm9wcykge1xuICAgICAgICByZXR1cm4gc291cmNlLnJlcGxhY2UoL1xce1xceyhcXHcrKX19L2dpLCBmdW5jdGlvbihtYXRjaCwgbmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gcHJvcHNbbmFtZV07XG4gICAgICAgICAgICBpZiAodHVpLnV0aWwuaXNGYWxzeSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemF0aW9uIGZvciBldmVudCBidXR0b24gcHJvcGVydHkgXG4gICAgICogMDogRmlyc3QgbW91c2UgYnV0dG9uLCAyOiBTZWNvbmQgbW91c2UgYnV0dG9uLCAxOiBDZW50ZXIgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfSBidXR0b24gdHlwZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGJ1dHRvbixcbiAgICAgICAgICAgIHByaW1hcnkgPSAnMCwxLDMsNSw3JyxcbiAgICAgICAgICAgIHNlY29uZGFyeSA9ICcyLDYnLFxuICAgICAgICAgICAgd2hlZWwgPSAnNCc7XG5cbiAgICAgICAgaWYgKGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoJ01vdXNlRXZlbnRzJywgJzIuMCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXZlbnQuYnV0dG9uO1xuICAgICAgICB9XG5cbiAgICAgICAgYnV0dG9uID0gZXZlbnQuYnV0dG9uICsgJyc7XG4gICAgICAgIGlmIChwcmltYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIGlmIChzZWNvbmRhcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAyO1xuICAgICAgICB9IGVsc2UgaWYgKHdoZWVsLmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiJdfQ==
