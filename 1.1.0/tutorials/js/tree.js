(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Tree', require('./src/js/tree'));

},{"./src/js/tree":7}],2:[function(require,module,exports){
/**
 * A default values for tree
 * @module defaults
 */
'use strict';

/**
 * Make class names
 * @param {string} prefix - Prefix of class name
 * @param {Array.<string>} keys - Keys of class names
 * @returns {object.<string, string>} Classnames map
 */
function makeClassNames(prefix, keys) {
    var obj = {};
    tui.util.forEach(keys, function(key) {
        obj[key + 'Class'] = prefix + key;
    });
    return obj;
}

/**
 * @const
 * @type {object}
 * @property {boolean} useDrag - Default: false
 * @property {boolean} useHelper - Default: false
 * @property {object} stateLabel - State label in node
 *  @property {string} stateLabel.opened - Default: '-'
 *  @property {string} stateLabel.closed - Default: '+'
 * @property {object} template - Template html for the nodes.
 * @property {object} classNames - Class names of elements in tree
 *      @property {string} openedClass - A class name for opened node
 *      @property {string} closedClass - A class name for closed node
 *      @property {string} selectedClass - A class name for selected node
 *      @property {string} subtreeClass  - A class name for subtree in internal node
 *      @property {string} toggleClass - A class name for toggle button in internal node
 *      @property {string} titleClass - A class name for title element in a node
 *      @property {string} inputClass - A class name for editable element in a node
 *  @property {string} template.internalNode - A template html for internal node.
 *  @property {string} template.leafNode - A template html for leaf node.
 */
module.exports = {
    nodeDefaultState: 'closed',
    stateLabels: {
        opened: '-',
        closed: '+'
    },
    nodeIdPrefix: 'tui-tree-node-',
    classNames: makeClassNames('tui-tree-', [
        'opened',
        'closed',
        'selected',
        'subtree',
        'toggleBtn',
        'text',
        'input'
    ]),
    template: {
        internalNode:
        '<li id="{{id}}" class="tui-tree-node {{stateClass}}">' +
            '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
            '<span class="{{textClass}}">{{text}}</span>' +
            '<ul class="{{subtreeClass}}">{{children}}</ul>' +
        '</li>',
        leafNode:
        '<li id="{{id}}" class="tui-tree-node tui-tree-leaf">' +
            '<span class="{{textClass}}">{{text}}</span>' +
        '</li>'
    }
};

},{}],3:[function(require,module,exports){
'use strict';
var util = require('./util');

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
var Draggable = tui.util.defineClass(/** @lends Draggable.prototype */{
    /*eslint-disable*/
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
        var tree = this.tree,
            helperElement = document.createElement('span'),
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
        var selectKey = util.testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']),
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
     //* @param {MouseEvent} event - Mouse event
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

},{"./util":10}],4:[function(require,module,exports){
'use strict';

var util = require('./util');

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
     * Custom event handler "singleClick"
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
     * Event handler - keyup - input element
     * @param {Event} event - Key event
     */
    onKeyup: function(event) {
        if (event.keyCode !== 13) { // If not enter
            return;
        }
        this.setData();
    },

    /**
     * Event handler - blur - input element
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

},{"./util":10}],5:[function(require,module,exports){
'use strict';

var util = require('./util');

/**
 * Set the tree selectable
 * @constructor
 * @param {Tree} tree - Tree
 */
var Selectable = tui.util.defineClass(/** @lends Selectable.prototype */{/*eslint-disable*/
    init: function(tree) { /*eslint-enable*/
        this.tree = tree;
        this.selectedClassName = tree.classNames.selectedClass;
        this.tree.on('singleClick', this.onSingleClick, this);
        this.tree.on('doubleClick', this.onSingleClick, this);
        this.tree.on('afterDraw', this.onAfterDraw, this);
    },

    /**
     * Disable this module
     */
    destroy: function() {
        var nodeElement = this.getPrevElement();
        util.removeClass(nodeElement, this.selectedClassName);
        this.tree.off(this);
    },

    /**
     * Custom event handler "singleClick"
     * @param {MouseEvent} event - Mouse event
     */
    onSingleClick: function(event) {
        var tree = this.tree,
            target = util.getTarget(event),
            nodeId = tree.getNodeIdFromElement(target),
            prevElement = this.getPrevElement(),
            nodeElement = document.getElementById(nodeId),
            selectedClassName = this.selectedClassName;

        if (!nodeId) {
            return;
        }

        util.removeClass(prevElement, selectedClassName);
        util.addClass(nodeElement, selectedClassName);

        /**
         * @api
         * @event Tree#select
         * @example
         * tree
         *  .enableFeature('Selectable')
         *  .on('select', function(nodeId) {
         *      console.log('selected node: ' + nodeId);
         *  });
         */
        tree.fire('select', nodeId);
        this.prevNodeId = nodeId;
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
        var nodeElement = document.getElementById(this.prevNodeId);

        if (nodeElement) {
            util.addClass(nodeElement, this.selectedClassName);
        }
    }
});

module.exports = Selectable;

},{"./util":10}],6:[function(require,module,exports){
/**
 * @fileoverview States in tree
 */

'use strict';

/**
 * States in tree
 * @module states
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

},{}],7:[function(require,module,exports){
/**
 * @fileoverview Render tree and update tree.
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

'use strict';

var defaults = require('./defaults'),
    util = require('./util'),
    states = require('./states'),
    TreeModel = require('./treeModel'),
    Selectable = require('./selectable'),
    Draggable = require('./draggable'),
    Editable = require('./editable');

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
 * @constructor
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
 *         @param {string} [options.classNames.openedClass] A class name for opened node
 *         @param {string} [options.classNames.closedClass] A class name for closed node
 *         @param {string} [options.classNames.selectedClass] A class name to selected node
 *         @param {string} [options.classNames.textClass] A class name that for textElement in node
 *         @param {string} [options.classNames.inputClass] A class input element in a node
 *         @param {string} [options.classNames.subtreeClass] A class name for subtree in internal node
 *         @param {string} [options.classNames.toggleBtnClass] A class name for toggle button in internal node
 * @example
 * //Default options:
 * // {
 * //     rootElement: document.createElement('UL'),
 * //     nodeIdPrefix: 'tui-tree-node-'
 * //     nodeDefaultState: 'closed',
 * //     stateLabels: {
 * //         opened: '-',
 * //         closed: '+'
 * //     },
 * //     classNames: {
 * //         openedClass: 'tui-tree-opened',
 * //         closedClass: 'tui-tree-closed',
 * //         selectedClass: 'tui-tree-selected',
 * //         subtreeClass: 'tui-tree-subtree',
 * //         toggleBtnClass: 'tui-tree-toggleBtn',
 * //         textClass: 'tui-tree-text',
 * //         iuputClass: 'tui-tree-input'
 * //     },
 * //
 * //     template: {
 * //         internalNode:
 * //         '<li id="{{id}}" class="tui-tree-node {{stateClass}}" data-node-id="{{id}}">' +
 * //             '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
 * //             '<span class="{{textClass}}">{{text}}</span>' +
 * //             '<ul class="{{subtreeClass}}">{{children}}</ul>' +
 * //         '</li>',
 * //         leafNode:
 * //         '<li id="{{id}}" class="tui-tree-node tui-tree-leaf" data-node-id="{{id}}">' +
 * //             '<span class="{{textClass}}">{{text}}</span>' +
 * //         '</li>'
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
 *     rootElement: document.getElementById('treeRoot'),
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
        var extend = snippet.extend,
            browser = tui.util.browser;
        options = extend({}, defaults, options);

        /**
         * Default class names
         * @type {object.<string, string>}
         */
        this.classNames = extend({}, defaults.classNames, options.classNames);

        /**
         * Default template
         * @type {{internalNode: string, leafNode: string}}
         */
        this.template = extend({}, defaults.template, options.template);

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
         * Whether the browser is ie and lower than 9
         * @type {boolean}
         */
        this.isLowerThanIE9 = browser.msie && browser.version < 9;

        this._setRoot();
        this._drawChildren();
        this._setEvents();
    },

    /**
     * Set root element of tree
     * @private
     */
    _setRoot: function() {
        var rootEl = this.rootElement;

        if (!snippet.isHTMLNode(rootEl)) {
            rootEl = this.rootElement = document.createElement('UL');
            document.body.appendChild(rootEl);
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
        this._drawChildren(originalParentId);
        this._drawChildren(newParentId);
    },

    /**
     * Set event handlers
     */
    _setEvents: function() {
        this.model.on('update', this._drawChildren, this);
        this.model.on('move', this._onMove, this);
        util.addEventListener(this.rootElement, 'click', snippet.bind(this._onClick, this));
        util.addEventListener(this.rootElement, 'mousedown', snippet.bind(this._onMousedown, this));
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMousedown: function(event) {
        var self = this;

        if (this.isLowerThanIE9) {
            event = tui.util.extend({}, event);
        }

        this.mousedownTimer = setTimeout(function() {
            self.fire('mousedown', event);
        }, 200);

        util.addEventListener(document, 'mouseup', function mouseupHandler() {
            self.resetMousedownTimer();
            util.removeEventListener(document, 'mouseup', mouseupHandler);
        });
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
        if (this.clickTimer) {
            this.fire('doubleClick', event);
            this.resetClickTimer();
        } else {
            if (this.isLowerThanIE9) {
                event = tui.util.extend({}, event);
            }
            this.clickTimer = setTimeout(function() {
                self.fire('singleClick', event);
                self.resetClickTimer();
            }, 300);
        }
    },

    /**
     * Set node state - opened or closed
     * @param {string} nodeId - Node id
     * @param {string} state - Node state
     * @private
     */
    _setDisplayFromNodeState: function(nodeId, state) {
        var subtreeElement = this._getSubtreeElement(nodeId),
            toggleBtnClassName = this.classNames.toggleBtnClass,
            label, btnElement, nodeElement;

        if (!subtreeElement || subtreeElement === this.rootElement) {
            return;
        }
        label = this.stateLabels[state];
        nodeElement = document.getElementById(nodeId);
        btnElement = util.getElementsByClassName(nodeElement, toggleBtnClassName)[0];

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
            classNames = this.classNames,
            stateLabels = this.stateLabels,
            templateSource = this.template,
            html = '';

        snippet.forEach(nodeIds, function(nodeId) {
            var node = model.getNode(nodeId),
                state = node.getState(),
                nodeData = node.getAllData(),
                props = extend({
                    id: nodeId
                }, classNames, nodeData),
                nodeTemplate;

            if (node.isLeaf()) {
                nodeTemplate = templateSource.leafNode;
            } else {
                nodeTemplate = templateSource.internalNode;
                props.stateClass = classNames[state+'Class'];
                props.stateLabel = stateLabels[state];
                props.children = this._makeHtml(node.getChildIds());
            }
            html += util.template(nodeTemplate, props);
        }, this);
        return html;
    },

    /**
     * Draw tree
     * @param {string} [parentId] - Parent node id
     * @private
     */
    _drawChildren: function(parentId) {
        var node = this.model.getNode(parentId),
            subtreeElement;

        if (!node) {
            node = this.model.rootNode;
            parentId = node.getId();
        }
        subtreeElement = this._getSubtreeElement(parentId);
        if (!subtreeElement) {
            this._drawChildren(node.getParentId());
            return;
        }

        /**
         * @api
         * @event Tree#beforeDraw
         * @example
         * tree.on('beforeDraw', function(parentId) {
         *     console.log(parentId);
         * });
         */
        this.fire('beforeDraw', parentId);
        subtreeElement.innerHTML = this._makeHtml(node.getChildIds());
        this.model.each(function(node, nodeId) {
            if (node.getState() === nodeStates.OPENED) {
                this.open(nodeId);
            } else {
                this.close(nodeId);
            }
        }, parentId, this);

        /**
         * @api
         * @event Tree#afterDraw
         * @example
         * tree.on('afterDraw', function(parentId) {
         *     console.log(parentId);
         * });
         */
        this.fire('afterDraw', parentId);
    },

    /**
     * Get subtree element
     * @param {string} nodeId - TreeNode id
     * @returns {Element|undefined} Subtree element or undefined
     * @private
     */
    _getSubtreeElement: function(nodeId) {
        var node = this.model.getNode(nodeId),
            subtreeClassName, nodeElement, subtreeElement;
        if (!node || node.isLeaf()) {
            return;
        }

        if (node.isRoot()) {
            return this.rootElement;
        }

        subtreeClassName = this.classNames['subtreeClass'];
        nodeElement = document.getElementById(node.getId());
        subtreeElement = util.getElementsByClassName(nodeElement, subtreeClassName)[0];

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
     * Reset mousedown timer
     */
    resetMousedownTimer: function() {
        window.clearTimeout(this.mousedownTimer);
        this.mousedownTimer = null;
    },

    /**
     * Get node id from element
     * @api
     * @param {HTMLElement} element - Element
     * @returns {string} Node id
     * @private
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
     * @private
     **/
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
     * @example
     * tree.sort(function(nodeA, nodeB) {
     *     var aValue = nodeA.getData('text'),
     *         bValue = nodeB.getData('text');
     *
     *     if (!bValue || !bValue.localeCompare) {
     *         return 0;
     *     }
     *     return bValue.localeCompare(aValue);
     * });
     */
    sort: function(comparator) {
        this.model.sort(comparator);
        this._drawChildren();
    },

    /**
     * Refresh tree or node's children
     * @api
     * @param {string} [nodeId] - TreeNode id to refresh
     **/
    refresh: function(nodeId) {
        this._drawChildren(nodeId);
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
     * @example
     * tree.add({text:'FE development team'}, myParentId); // add node with redrawing
     * tree.add({text:'FE development team'}, myParentId, true); // add node without redrawing
     */
    add: function(data, parentId, isSilent) {
        this.model.add(data, parentId, isSilent);
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
     * @exmaple
     * tree.move(myNodeId, newParentId); // mode node with redrawing
     * tree.move(myNodeId, newParentId, true); // move node without redrawing
     */
    move: function(nodeId, newParentId, isSilent) {
        this.model.move(nodeId, newParentId, isSilent);
    },

    /**
     * Enable facility of tree
     * @api
     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable'
     * @param {object} [options] - Feature options
     * @return {Tree} this
     * @example
     * tree
     *  .enableFeature('Selectable')
     *  .enableFeature('Editable', {
     *      enableClassName: tree.classNames.textClass,
     *      dateKey: 'text',
     *      inputClassName: 'myInput'
     *  })
     *  .enableFeature('Draggable', {
     *      useHelper: true,
     *      helperPos: {x: 5, y: 2},
     *      rejectedTagNames: ['UL', 'INPUT', 'BUTTON'],
     *      rejectedClassNames: ['elementHavingSomeClassIsNotDraggable', 'myClass']
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
    }
});

tui.util.forEach(features, function(Feature, name) {
    Tree.registerFeature(name, Feature);
});
tui.util.CustomEvents.mixin(Tree);
module.exports = Tree;

},{"./defaults":2,"./draggable":3,"./editable":4,"./selectable":5,"./states":6,"./treeModel":8,"./util":10}],8:[function(require,module,exports){
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
     * @private
     */
    _makeTreeHash: function(data, parent) {
        var parentId = parent.getId();

        forEach(data, function(datum) {
            var childrenData = datum.children,
                node = this._createNode(datum, parentId),
                nodeId = node.getId();

            this.treeHash[nodeId] = node;
            parent.addChildId(nodeId);
            this._makeTreeHash(childrenData, node);
        }, this);
    },

    /**
     * Create node
     * @param {object} nodeData - Datum of node
     * @param {string} parentId - Parent id
     * @return {TreeNode} TreeNode
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
     * @return {Array.<TreeNode>|undefined} children
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
     * @return {TreeNode|undefined} Node
     */
    getNode: function(id) {
        return this.treeHash[id];
    },

    /**
     * Get depth from node id
     * @param {string} id - A node id to find
     * @return {number|undefined} Depth
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
     */
    add: function(data, parentId, isSilent) {
        var parent = this.getNode(parentId) || this.rootNode;

        data = [].concat(data);
        this._makeTreeHash(data, parent);

        if (!isSilent) {
            this.fire('update', parentId);
        }
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
            this.fire('update', node.getParentId());
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
            this.fire('update', node.getParentId());
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
     * @return {object|undefined} Node data
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

},{"./treeNode":9,"./util":10}],9:[function(require,module,exports){
'use strict';

var states = require('./states').node,
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
        this._id = null;

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

        this._stampId();
        this.setData(nodeData);
    },

    /**
     * Stamp node id
     * @private
     */
    _stampId: function() {
        this._id = this.constructor.idPrefix + getNextIndex();
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

},{"./states":6,"./util":10}],10:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9kZWZhdWx0cy5qcyIsInNyYy9qcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZWRpdGFibGUuanMiLCJzcmMvanMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy9zdGF0ZXMuanMiLCJzcmMvanMvdHJlZS5qcyIsInNyYy9qcy90cmVlTW9kZWwuanMiLCJzcmMvanMvdHJlZU5vZGUuanMiLCJzcmMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyd0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2phQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQuVHJlZScsIHJlcXVpcmUoJy4vc3JjL2pzL3RyZWUnKSk7XG4iLCIvKipcbiAqIEEgZGVmYXVsdCB2YWx1ZXMgZm9yIHRyZWVcbiAqIEBtb2R1bGUgZGVmYXVsdHNcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1ha2UgY2xhc3MgbmFtZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgY2xhc3MgbmFtZVxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0ga2V5cyAtIEtleXMgb2YgY2xhc3MgbmFtZXNcbiAqIEByZXR1cm5zIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn0gQ2xhc3NuYW1lcyBtYXBcbiAqL1xuZnVuY3Rpb24gbWFrZUNsYXNzTmFtZXMocHJlZml4LCBrZXlzKSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIHR1aS51dGlsLmZvckVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIG9ialtrZXkgKyAnQ2xhc3MnXSA9IHByZWZpeCArIGtleTtcbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEBjb25zdFxuICogQHR5cGUge29iamVjdH1cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdXNlRHJhZyAtIERlZmF1bHQ6IGZhbHNlXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHVzZUhlbHBlciAtIERlZmF1bHQ6IGZhbHNlXG4gKiBAcHJvcGVydHkge29iamVjdH0gc3RhdGVMYWJlbCAtIFN0YXRlIGxhYmVsIGluIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5vcGVuZWQgLSBEZWZhdWx0OiAnLSdcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5jbG9zZWQgLSBEZWZhdWx0OiAnKydcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSB0ZW1wbGF0ZSAtIFRlbXBsYXRlIGh0bWwgZm9yIHRoZSBub2Rlcy5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBjbGFzc05hbWVzIC0gQ2xhc3MgbmFtZXMgb2YgZWxlbWVudHMgaW4gdHJlZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gb3BlbmVkQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIG9wZW5lZCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBjbG9zZWRDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3IgY2xvc2VkIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IHNlbGVjdGVkQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIHNlbGVjdGVkIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IHN1YnRyZWVDbGFzcyAgLSBBIGNsYXNzIG5hbWUgZm9yIHN1YnRyZWUgaW4gaW50ZXJuYWwgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gdG9nZ2xlQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIHRvZ2dsZSBidXR0b24gaW4gaW50ZXJuYWwgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gdGl0bGVDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3IgdGl0bGUgZWxlbWVudCBpbiBhIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IGlucHV0Q2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIGVkaXRhYmxlIGVsZW1lbnQgaW4gYSBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHRlbXBsYXRlLmludGVybmFsTm9kZSAtIEEgdGVtcGxhdGUgaHRtbCBmb3IgaW50ZXJuYWwgbm9kZS5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUubGVhZk5vZGUgLSBBIHRlbXBsYXRlIGh0bWwgZm9yIGxlYWYgbm9kZS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbm9kZURlZmF1bHRTdGF0ZTogJ2Nsb3NlZCcsXG4gICAgc3RhdGVMYWJlbHM6IHtcbiAgICAgICAgb3BlbmVkOiAnLScsXG4gICAgICAgIGNsb3NlZDogJysnXG4gICAgfSxcbiAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLScsXG4gICAgY2xhc3NOYW1lczogbWFrZUNsYXNzTmFtZXMoJ3R1aS10cmVlLScsIFtcbiAgICAgICAgJ29wZW5lZCcsXG4gICAgICAgICdjbG9zZWQnLFxuICAgICAgICAnc2VsZWN0ZWQnLFxuICAgICAgICAnc3VidHJlZScsXG4gICAgICAgICd0b2dnbGVCdG4nLFxuICAgICAgICAndGV4dCcsXG4gICAgICAgICdpbnB1dCdcbiAgICBdKSxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICBpbnRlcm5hbE5vZGU6XG4gICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInR1aS10cmVlLW5vZGUge3tzdGF0ZUNsYXNzfX1cIj4nICtcbiAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7c3RhdGVMYWJlbH19PC9idXR0b24+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+JyArXG4gICAgICAgICc8L2xpPicsXG4gICAgICAgIGxlYWZOb2RlOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ0dWktdHJlZS1ub2RlIHR1aS10cmVlLWxlYWZcIj4nICtcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAgICAgICAgJzwvbGk+J1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgIHVzZUhlbHBlcjogdHJ1ZSxcbiAgICAgICAgaGVscGVyUG9zOiB7XG4gICAgICAgICAgICB5OiAyLFxuICAgICAgICAgICAgeDogNVxuICAgICAgICB9XG4gICAgfSxcbiAgICByZWplY3RlZFRhZ05hbWVzID0gW1xuICAgICAgICAnSU5QVVQnLFxuICAgICAgICAnQlVUVE9OJyxcbiAgICAgICAgJ1VMJ1xuICAgIF0sXG4gICAgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIGRyYWdnYWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnNcbiAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMudXNlSGVscGVyIC0gVXNpbmcgaGVscGVyIGZsYWdcbiAqICBAcGFyYW0ge3t4OiBudW1iZXIsIHk6bnVtYmVyfX0gb3B0aW9ucy5oZWxwZXJQb3MgLSBIZWxwZXIgcG9zaXRpb25cbiAqICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkVGFnTmFtZXMgLSBObyBkcmFnZ2FibGUgdGFnIG5hbWVzXG4gKiAgQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gb3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMgLSBObyBkcmFnZ2FibGUgY2xhc3MgbmFtZXNcbiAqL1xudmFyIERyYWdnYWJsZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgRHJhZ2dhYmxlLnByb3RvdHlwZSAqL3tcbiAgICAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuc2V0TWVtYmVycyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5hdHRhY2hNb3VzZWRvd24oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG1lbWJlcnMgb2YgdGhpcyBtb2R1bGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGlucHV0IG9wdGlvbnNcbiAgICAgKi9cbiAgICBzZXRNZW1iZXJzOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgaGVscGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSxcbiAgICAgICAgICAgIHN0eWxlID0gaGVscGVyRWxlbWVudC5zdHlsZTtcbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMudXNlSGVscGVyID0gb3B0aW9ucy51c2VIZWxwZXI7XG4gICAgICAgIHRoaXMuaGVscGVyUG9zID0gb3B0aW9ucy5oZWxwZXJQb3M7XG4gICAgICAgIHRoaXMucmVqZWN0ZWRUYWdOYW1lcyA9IHJlamVjdGVkVGFnTmFtZXMuY29uY2F0KG9wdGlvbnMucmVqZWN0ZWRUYWdOYW1lcyk7XG4gICAgICAgIHRoaXMucmVqZWN0ZWRDbGFzc05hbWVzID0gW10uY29uY2F0KG9wdGlvbnMucmVqZWN0ZWRDbGFzc05hbWVzKTtcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gaGVscGVyRWxlbWVudDtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbnVsbDtcblxuICAgICAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gICAgICAgIHRoaXMuaGFuZGxlcnMubW91c2Vtb3ZlID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uTW91c2Vtb3ZlLCB0aGlzKTtcbiAgICAgICAgdGhpcy5oYW5kbGVycy5tb3VzZXVwID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uTW91c2V1cCwgdGhpcyk7XG5cbiAgICAgICAgc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBzdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChoZWxwZXJFbGVtZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIG1vdXNlIGRvd24gZXZlbnRcbiAgICAgKi9cbiAgICBhdHRhY2hNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnByZXZlbnRUZXh0U2VsZWN0aW9uKCk7XG4gICAgICAgIHRoaXMudHJlZS5vbignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlZG93biwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgdGV4dC1zZWxlY3Rpb25cbiAgICAgKi9cbiAgICBwcmV2ZW50VGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxlY3RLZXkgPSB1dGlsLnRlc3RQcm9wKFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J10pLFxuICAgICAgICAgICAgc3R5bGUgPSB0cmVlLnJvb3RFbGVtZW50LnN0eWxlO1xuXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0cmVlLnJvb3RFbGVtZW50LCAnc2VsZWN0c3RhcnQnLCB1dGlsLnByZXZlbnREZWZhdWx0KTtcblxuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSA9IHNlbGVjdEtleTtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZSA9IHN0eWxlW3NlbGVjdEtleV07XG4gICAgICAgIHN0eWxlW3NlbGVjdEtleV0gPSAnbm9uZSc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBpbiByZWplY3RlZFRhZ05hbWVzIG9yIGluIHJlamVjdGVkQ2xhc3NOYW1lc1xuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHRhcmdldCBpcyBub3QgZHJhZ2dhYmxlIG9yIGRyYWdnYWJsZVxuICAgICAqL1xuICAgIGlzTm90RHJhZ2dhYmxlOiBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgdmFyIHRhZ05hbWUgPSB0YXJnZXQudGFnTmFtZS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgY2xhc3NOYW1lcyA9IHV0aWwuZ2V0Q2xhc3ModGFyZ2V0KS5zcGxpdCgnICcpLFxuICAgICAgICAgICAgcmVzdWx0O1xuXG4gICAgICAgIGlmIChpbkFycmF5KHRhZ05hbWUsIHRoaXMucmVqZWN0ZWRUYWdOYW1lcykgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goY2xhc3NOYW1lcywgZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBpbkFycmF5KGNsYXNzTmFtZSwgdGhpcy5yZWplY3RlZENsYXNzTmFtZXMpICE9PSAtMTtcbiAgICAgICAgICAgIHJldHVybiAhcmVzdWx0O1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vkb3duXG4gICAgIC8vKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbk1vdXNlZG93bjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZDtcblxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSB8fCB0aGlzLmlzTm90RHJhZ2dhYmxlKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1dGlsLnByZXZlbnREZWZhdWx0KGV2ZW50KTtcblxuICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbm9kZUlkO1xuICAgICAgICBpZiAodGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SGVscGVyKHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlcnMubW91c2Vtb3ZlKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2V1cCcsIHRoaXMuaGFuZGxlcnMubW91c2V1cCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZW1vdmVcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbk1vdXNlbW92ZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGhlbHBlckVsID0gdGhpcy5oZWxwZXJFbGVtZW50LFxuICAgICAgICAgICAgcG9zID0gdHJlZS5yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgaWYgKCF0aGlzLnVzZUhlbHBlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaGVscGVyRWwuc3R5bGUudG9wID0gZXZlbnQuY2xpZW50WSAtIHBvcy50b3AgKyB0aGlzLmhlbHBlclBvcy55ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBwb3MubGVmdCArIHRoaXMuaGVscGVyUG9zLnggKyAncHgnO1xuICAgICAgICBoZWxwZXJFbC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZXVwXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25Nb3VzZXVwOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdHJlZS5tb3ZlKHRoaXMuY3VycmVudE5vZGVJZCwgbm9kZUlkKTtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbnVsbDtcblxuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZXJzLm1vdXNlbW92ZSk7XG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLmhhbmRsZXJzLm1vdXNldXApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXN0b3JlIHRleHQtc2VsZWN0aW9uXG4gICAgICovXG4gICAgcmVzdG9yZVRleHRTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHJlZS5yb290RWxlbWVudCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIGlmICh0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgdHJlZS5yb290RWxlbWVudC5zdHlsZVt0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleV0gPSB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBoZWxwZXIgY29udGVudHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIEhlbHBlciBjb250ZW50c1xuICAgICAqL1xuICAgIHNldEhlbHBlcjogZnVuY3Rpb24odGV4dCkge1xuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuaW5uZXJIVE1MID0gdGV4dDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGV0YWNoIG1vdXNlZG93biBldmVudFxuICAgICAqL1xuICAgIGRldGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZXN0b3JlVGV4dFNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLmRldGFjaE1vdXNlZG93bigpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdnYWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgc2VsZWN0YWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnNcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5lZGl0YWJsZUNsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBlZGl0YWJsZSBlbGVtZW50XG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZGF0YUtleSAtIEtleSBvZiBub2RlIGRhdGEgdG8gc2V0IHZhbHVlXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaW5wdXRDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgaW5wdXQgZWxlbWVudFxuICovXG52YXIgRWRpdGFibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIEVkaXRhYmxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuZWRpdGFibGVDbGFzc05hbWUgPSBvcHRpb25zLmVkaXRhYmxlQ2xhc3NOYW1lO1xuICAgICAgICB0aGlzLmRhdGFLZXkgPSBvcHRpb25zLmRhdGFLZXk7XG4gICAgICAgIHRoaXMuaW5wdXRFbGVtZW50ID0gdGhpcy5jcmVhdGVJbnB1dEVsZW1lbnQob3B0aW9ucy5pbnB1dENsYXNzTmFtZSk7XG4gICAgICAgIHRoaXMuYm91bmRPbktleXVwID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uS2V5dXAsIHRoaXMpO1xuICAgICAgICB0aGlzLmJvdW5kT25CbHVyID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uQmx1ciwgdGhpcyk7XG5cbiAgICAgICAgdHJlZS5vbignZG91YmxlQ2xpY2snLCB0aGlzLm9uRG91YmxlQ2xpY2ssIHRoaXMpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdrZXl1cCcsIHRoaXMuYm91bmRPbktleXVwKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAnYmx1cicsIHRoaXMuYm91bmRPbkJsdXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXRhY2ggaW5wdXQgZWxlbWVudCBmcm9tIGRvY3VtZW50XG4gICAgICovXG4gICAgZGV0YWNoSW5wdXRGcm9tRG9jdW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5wdXRFbCA9IHRoaXMuaW5wdXRFbGVtZW50LFxuICAgICAgICAgICAgcGFyZW50Tm9kZSA9IGlucHV0RWwucGFyZW50Tm9kZTtcblxuICAgICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpbnB1dEVsKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZGV0YWNoSW5wdXRGcm9tRG9jdW1lbnQoKTtcbiAgICAgICAgdGhpcy50cmVlLm9mZih0aGlzKTtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAna2V5dXAnLCB0aGlzLmJvdW5kT25LZXl1cCk7XG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2JsdXInLCB0aGlzLmJvdW5kT25CbHVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGlucHV0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgaW5wdXQgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gSW5wdXQgZWxlbWVudFxuICAgICAqL1xuICAgIGNyZWF0ZUlucHV0RWxlbWVudDogZnVuY3Rpb24oaW5wdXRDbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnSU5QVVQnKTtcbiAgICAgICAgaWYgKGlucHV0Q2xhc3NOYW1lKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBpbnB1dENsYXNzTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgXCJzaW5nbGVDbGlja1wiXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25Eb3VibGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQsIG5vZGVJZDtcblxuICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuZWRpdGFibGVDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgICAgIGlucHV0RWxlbWVudCA9IHRoaXMuaW5wdXRFbGVtZW50O1xuICAgICAgICAgICAgaW5wdXRFbGVtZW50LnZhbHVlID0gdHJlZS5nZXROb2RlRGF0YShub2RlSWQpW3RoaXMuZGF0YUtleV0gfHwgJyc7XG4gICAgICAgICAgICB0YXJnZXQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoaW5wdXRFbGVtZW50LCB0YXJnZXQpO1xuICAgICAgICAgICAgdGFyZ2V0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0ga2V5dXAgLSBpbnB1dCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBLZXkgZXZlbnRcbiAgICAgKi9cbiAgICBvbktleXVwOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSAhPT0gMTMpIHsgLy8gSWYgbm90IGVudGVyXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXREYXRhKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBibHVyIC0gaW5wdXQgZWxlbWVudFxuICAgICAqL1xuICAgIG9uQmx1cjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0RGF0YSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YSBvZiBpbnB1dCBlbGVtZW50IHRvIG5vZGUgYW5kIGRldGFjaCBpbnB1dCBlbGVtZW50IGZyb20gZG9jLlxuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0aGlzLmlucHV0RWxlbWVudCksXG4gICAgICAgICAgICBkYXRhID0ge307XG5cbiAgICAgICAgaWYgKG5vZGVJZCkge1xuICAgICAgICAgICAgZGF0YVt0aGlzLmRhdGFLZXldID0gdGhpcy5pbnB1dEVsZW1lbnQudmFsdWU7XG4gICAgICAgICAgICB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZXRhY2hJbnB1dEZyb21Eb2N1bWVudCgpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRhYmxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBzZWxlY3RhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqL1xudmFyIFNlbGVjdGFibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFNlbGVjdGFibGUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSA9IHRyZWUuY2xhc3NOYW1lcy5zZWxlY3RlZENsYXNzO1xuICAgICAgICB0aGlzLnRyZWUub24oJ3NpbmdsZUNsaWNrJywgdGhpcy5vblNpbmdsZUNsaWNrLCB0aGlzKTtcbiAgICAgICAgdGhpcy50cmVlLm9uKCdkb3VibGVDbGljaycsIHRoaXMub25TaW5nbGVDbGljaywgdGhpcyk7XG4gICAgICAgIHRoaXMudHJlZS5vbignYWZ0ZXJEcmF3JywgdGhpcy5vbkFmdGVyRHJhdywgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpO1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdGhpcy50cmVlLm9mZih0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgXCJzaW5nbGVDbGlja1wiXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25TaW5nbGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCksXG4gICAgICAgICAgICBwcmV2RWxlbWVudCA9IHRoaXMuZ2V0UHJldkVsZW1lbnQoKSxcbiAgICAgICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKSxcbiAgICAgICAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lID0gdGhpcy5zZWxlY3RlZENsYXNzTmFtZTtcblxuICAgICAgICBpZiAoIW5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhwcmV2RWxlbWVudCwgc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBzZWxlY3RlZENsYXNzTmFtZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjc2VsZWN0XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWVcbiAgICAgICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcbiAgICAgICAgICogIC5vbignc2VsZWN0JywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3NlbGVjdGVkIG5vZGU6ICcgKyBub2RlSWQpO1xuICAgICAgICAgKiAgfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0cmVlLmZpcmUoJ3NlbGVjdCcsIG5vZGVJZCk7XG4gICAgICAgIHRoaXMucHJldk5vZGVJZCA9IG5vZGVJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHByZXZpb3VzIHNlbGVjdGVkIG5vZGUgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gTm9kZSBlbGVtZW50XG4gICAgICovXG4gICAgZ2V0UHJldkVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5wcmV2Tm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgLSBcImFmdGVyRHJhd1wiXG4gICAgICovXG4gICAgb25BZnRlckRyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLnByZXZOb2RlSWQpO1xuXG4gICAgICAgIGlmIChub2RlRWxlbWVudCkge1xuICAgICAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RhYmxlO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFN0YXRlcyBpbiB0cmVlXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFN0YXRlcyBpbiB0cmVlXG4gKiBAbW9kdWxlIHN0YXRlc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvKipcbiAgICAgKiBTdGF0ZXMgb2Ygbm9kZVxuICAgICAqIEB0eXBlIHt7T1BFTkVEOiBzdHJpbmcsIENMT1NFRDogc3RyaW5nfX1cbiAgICAgKi9cbiAgICBub2RlOiB7XG4gICAgICAgIE9QRU5FRDogJ29wZW5lZCcsXG4gICAgICAgIENMT1NFRDogJ2Nsb3NlZCdcbiAgICB9XG59O1xuIiwiLyoqXHJcbiAqIEBmaWxlb3ZlcnZpZXcgUmVuZGVyIHRyZWUgYW5kIHVwZGF0ZSB0cmVlLlxyXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnLi9kZWZhdWx0cycpLFxyXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxyXG4gICAgc3RhdGVzID0gcmVxdWlyZSgnLi9zdGF0ZXMnKSxcclxuICAgIFRyZWVNb2RlbCA9IHJlcXVpcmUoJy4vdHJlZU1vZGVsJyksXHJcbiAgICBTZWxlY3RhYmxlID0gcmVxdWlyZSgnLi9zZWxlY3RhYmxlJyksXHJcbiAgICBEcmFnZ2FibGUgPSByZXF1aXJlKCcuL2RyYWdnYWJsZScpLFxyXG4gICAgRWRpdGFibGUgPSByZXF1aXJlKCcuL2VkaXRhYmxlJyk7XHJcblxyXG52YXIgbm9kZVN0YXRlcyA9IHN0YXRlcy5ub2RlLFxyXG4gICAgZmVhdHVyZXMgPSB7XHJcbiAgICAgICAgU2VsZWN0YWJsZTogU2VsZWN0YWJsZSxcclxuICAgICAgICBEcmFnZ2FibGU6IERyYWdnYWJsZSxcclxuICAgICAgICBFZGl0YWJsZTogRWRpdGFibGVcclxuICAgIH0sXHJcbiAgICBzbmlwcGV0ID0gdHVpLnV0aWwsXHJcbiAgICBleHRlbmQgPSBzbmlwcGV0LmV4dGVuZDtcclxuLyoqXHJcbiAqIENyZWF0ZSB0cmVlIG1vZGVsIGFuZCBpbmplY3QgZGF0YSB0byBtb2RlbFxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgQSBkYXRhIHRvIGJlIHVzZWQgb24gdHJlZVxyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9uc1xyXG4gKiAgICAgQHBhcmFtIHtIVE1MRWxlbWVudH0gW29wdGlvbnMucm9vdEVsZW1lbnRdIFJvb3QgZWxlbWVudCAoSXQgc2hvdWxkIGJlICdVTCcgZWxlbWVudClcclxuICogICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5ub2RlSWRQcmVmaXhdIEEgZGVmYXVsdCBwcmVmaXggb2YgYSBub2RlXHJcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMubm9kZURlZmF1bHRTdGF0ZV0gQSBkZWZhdWx0IHN0YXRlIG9mIGEgbm9kZVxyXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnRlbXBsYXRlXSBBIG1hcmt1cCBzZXQgdG8gbWFrZSBlbGVtZW50XHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlLmludGVybmFsTm9kZV0gSFRNTCB0ZW1wbGF0ZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5sZWFmTm9kZV0gSFRNTCB0ZW1wbGF0ZVxyXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnN0YXRlTGFiZWxzXSBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0YXRlTGFiZWxzLm9wZW5lZF0gU3RhdGUtT1BFTkVEIGxhYmVsIChUZXh0IG9yIEhUTUwpXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0YXRlTGFiZWxzLmNsb3NlZF0gU3RhdGUtQ0xPU0VEIGxhYmVsIChUZXh0IG9yIEhUTUwpXHJcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuY2xhc3NOYW1lc10gQ2xhc3MgbmFtZXMgZm9yIHRyZWVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5vcGVuZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLmNsb3NlZENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuc2VsZWN0ZWRDbGFzc10gQSBjbGFzcyBuYW1lIHRvIHNlbGVjdGVkIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy50ZXh0Q2xhc3NdIEEgY2xhc3MgbmFtZSB0aGF0IGZvciB0ZXh0RWxlbWVudCBpbiBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuaW5wdXRDbGFzc10gQSBjbGFzcyBpbnB1dCBlbGVtZW50IGluIGEgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnN1YnRyZWVDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzc10gQSBjbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcclxuICogQGV4YW1wbGVcclxuICogLy9EZWZhdWx0IG9wdGlvbnM6XHJcbiAqIC8vIHtcclxuICogLy8gICAgIHJvb3RFbGVtZW50OiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdVTCcpLFxyXG4gKiAvLyAgICAgbm9kZUlkUHJlZml4OiAndHVpLXRyZWUtbm9kZS0nXHJcbiAqIC8vICAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcclxuICogLy8gICAgIHN0YXRlTGFiZWxzOiB7XHJcbiAqIC8vICAgICAgICAgb3BlbmVkOiAnLScsXHJcbiAqIC8vICAgICAgICAgY2xvc2VkOiAnKydcclxuICogLy8gICAgIH0sXHJcbiAqIC8vICAgICBjbGFzc05hbWVzOiB7XHJcbiAqIC8vICAgICAgICAgb3BlbmVkQ2xhc3M6ICd0dWktdHJlZS1vcGVuZWQnLFxyXG4gKiAvLyAgICAgICAgIGNsb3NlZENsYXNzOiAndHVpLXRyZWUtY2xvc2VkJyxcclxuICogLy8gICAgICAgICBzZWxlY3RlZENsYXNzOiAndHVpLXRyZWUtc2VsZWN0ZWQnLFxyXG4gKiAvLyAgICAgICAgIHN1YnRyZWVDbGFzczogJ3R1aS10cmVlLXN1YnRyZWUnLFxyXG4gKiAvLyAgICAgICAgIHRvZ2dsZUJ0bkNsYXNzOiAndHVpLXRyZWUtdG9nZ2xlQnRuJyxcclxuICogLy8gICAgICAgICB0ZXh0Q2xhc3M6ICd0dWktdHJlZS10ZXh0JyxcclxuICogLy8gICAgICAgICBpdXB1dENsYXNzOiAndHVpLXRyZWUtaW5wdXQnXHJcbiAqIC8vICAgICB9LFxyXG4gKiAvL1xyXG4gKiAvLyAgICAgdGVtcGxhdGU6IHtcclxuICogLy8gICAgICAgICBpbnRlcm5hbE5vZGU6XHJcbiAqIC8vICAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwidHVpLXRyZWUtbm9kZSB7e3N0YXRlQ2xhc3N9fVwiIGRhdGEtbm9kZS1pZD1cInt7aWR9fVwiPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXHJcbiAqIC8vICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e3N1YnRyZWVDbGFzc319XCI+e3tjaGlsZHJlbn19PC91bD4nICtcclxuICogLy8gICAgICAgICAnPC9saT4nLFxyXG4gKiAvLyAgICAgICAgIGxlYWZOb2RlOlxyXG4gKiAvLyAgICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInR1aS10cmVlLW5vZGUgdHVpLXRyZWUtbGVhZlwiIGRhdGEtbm9kZS1pZD1cInt7aWR9fVwiPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXHJcbiAqIC8vICAgICAgICAgJzwvbGk+J1xyXG4gKiAvLyAgICAgfVxyXG4gKiAvLyB9XHJcbiAqIC8vXHJcbiAqXHJcbiAqIHZhciBkYXRhID0gW1xyXG4gKiAgICAge3RleHQ6ICdyb290QScsIGNoaWxkcmVuOiBbXHJcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFBJ30sXHJcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFCJ30sXHJcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFDJ30sXHJcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFEJ30sXHJcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJBJywgY2hpbGRyZW46IFtcclxuICogICAgICAgICAgICAge3RleHQ6J3N1Yl8xQScsIGNoaWxkcmVuOltcclxuICogICAgICAgICAgICAgICAgIHt0ZXh0OidzdWJfc3ViXzFBJ31cclxuICogICAgICAgICAgICAgXX0sXHJcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWJfMkEnfVxyXG4gKiAgICAgICAgIF19LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQid9LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQyd9LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yRCd9LFxyXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zQScsIGNoaWxkcmVuOiBbXHJcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWIzX2EnfSxcclxuICogICAgICAgICAgICAge3RleHQ6J3N1YjNfYid9XHJcbiAqICAgICAgICAgXX0sXHJcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNCJ30sXHJcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNDJ30sXHJcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNEJ31cclxuICogICAgIF19LFxyXG4gKiAgICAge3RleHQ6ICdyb290QicsIGNoaWxkcmVuOiBbXHJcbiAqICAgICAgICAge3RleHQ6J0Jfc3ViMSd9LFxyXG4gKiAgICAgICAgIHt0ZXh0OidCX3N1YjInfSxcclxuICogICAgICAgICB7dGV4dDonYid9XHJcbiAqICAgICBdfVxyXG4gKiBdO1xyXG4gKlxyXG4gKiB2YXIgdHJlZTEgPSBuZXcgdHVpLmNvbXBvbmVudC5UcmVlKGRhdGEsIHtcclxuICogICAgIHJvb3RFbGVtZW50OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJlZVJvb3QnKSxcclxuICogICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdvcGVuZWQnXHJcbiAqIH0pO1xyXG4gKiovXHJcbnZhciBUcmVlID0gc25pcHBldC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cclxuICAgIHN0YXRpYzoge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBtZW1iZXJPZiBUcmVlXHJcbiAgICAgICAgICogQHN0YXRpY1xyXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVOYW1lIC0gTW9kdWxlIG5hbWVcclxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gbW9kdWxlIC0gTW9kdWxlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcmVnaXN0ZXJGZWF0dXJlOiBmdW5jdGlvbihtb2R1bGVOYW1lLCBtb2R1bGUpIHtcclxuICAgICAgICAgICAgaWYgKG1vZHVsZSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZlYXR1cmVzW21vZHVsZU5hbWVdID0gbW9kdWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVHJlZSBmZWF0dXJlc1xyXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZmVhdHVyZXM6IHt9XHJcbiAgICB9LFxyXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xyXG4gICAgICAgIHZhciBleHRlbmQgPSBzbmlwcGV0LmV4dGVuZCxcclxuICAgICAgICAgICAgYnJvd3NlciA9IHR1aS51dGlsLmJyb3dzZXI7XHJcbiAgICAgICAgb3B0aW9ucyA9IGV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWZhdWx0IGNsYXNzIG5hbWVzXHJcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY2xhc3NOYW1lcyA9IGV4dGVuZCh7fSwgZGVmYXVsdHMuY2xhc3NOYW1lcywgb3B0aW9ucy5jbGFzc05hbWVzKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCB0ZW1wbGF0ZVxyXG4gICAgICAgICAqIEB0eXBlIHt7aW50ZXJuYWxOb2RlOiBzdHJpbmcsIGxlYWZOb2RlOiBzdHJpbmd9fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSBleHRlbmQoe30sIGRlZmF1bHRzLnRlbXBsYXRlLCBvcHRpb25zLnRlbXBsYXRlKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUm9vdCBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBvcHRpb25zLnJvb3RFbGVtZW50O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXHJcbiAgICAgICAgICogQHR5cGUge3tvcGVuZWQ6IHN0cmluZywgY2xvc2VkOiBzdHJpbmd9fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuc3RhdGVMYWJlbHMgPSBvcHRpb25zLnN0YXRlTGFiZWxzO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBNYWtlIHRyZWUgbW9kZWxcclxuICAgICAgICAgKiBAdHlwZSB7VHJlZU1vZGVsfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVHJlZU1vZGVsKGRhdGEsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBFbmFibGVkIGZlYXR1cmVzXHJcbiAgICAgICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCBvYmplY3Q+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzID0ge307XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIGJyb3dzZXIgaXMgaWUgYW5kIGxvd2VyIHRoYW4gOVxyXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuaXNMb3dlclRoYW5JRTkgPSBicm93c2VyLm1zaWUgJiYgYnJvd3Nlci52ZXJzaW9uIDwgOTtcclxuXHJcbiAgICAgICAgdGhpcy5fc2V0Um9vdCgpO1xyXG4gICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbigpO1xyXG4gICAgICAgIHRoaXMuX3NldEV2ZW50cygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCByb290IGVsZW1lbnQgb2YgdHJlZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX3NldFJvb3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciByb290RWwgPSB0aGlzLnJvb3RFbGVtZW50O1xyXG5cclxuICAgICAgICBpZiAoIXNuaXBwZXQuaXNIVE1MTm9kZShyb290RWwpKSB7XHJcbiAgICAgICAgICAgIHJvb3RFbCA9IHRoaXMucm9vdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdVTCcpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJvb3RFbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgZXZlbnQgaGFuZGxlclxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcmlnaW5hbFBhcmVudElkIC0gT3JpZ2luYWwgcGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uTW92ZTogZnVuY3Rpb24obm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCkge1xyXG4gICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbihvcmlnaW5hbFBhcmVudElkKTtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4obmV3UGFyZW50SWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBldmVudCBoYW5kbGVyc1xyXG4gICAgICovXHJcbiAgICBfc2V0RXZlbnRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLm9uKCd1cGRhdGUnLCB0aGlzLl9kcmF3Q2hpbGRyZW4sIHRoaXMpO1xyXG4gICAgICAgIHRoaXMubW9kZWwub24oJ21vdmUnLCB0aGlzLl9vbk1vdmUsIHRoaXMpO1xyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnY2xpY2snLCBzbmlwcGV0LmJpbmQodGhpcy5fb25DbGljaywgdGhpcykpO1xyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnbW91c2Vkb3duJywgc25pcHBldC5iaW5kKHRoaXMuX29uTW91c2Vkb3duLCB0aGlzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxyXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25Nb3VzZWRvd246IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5pc0xvd2VyVGhhbklFOSkge1xyXG4gICAgICAgICAgICBldmVudCA9IHR1aS51dGlsLmV4dGVuZCh7fSwgZXZlbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5tb3VzZWRvd25UaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZmlyZSgnbW91c2Vkb3duJywgZXZlbnQpO1xyXG4gICAgICAgIH0sIDIwMCk7XHJcblxyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCBmdW5jdGlvbiBtb3VzZXVwSGFuZGxlcigpIHtcclxuICAgICAgICAgICAgc2VsZi5yZXNldE1vdXNlZG93blRpbWVyKCk7XHJcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCBtb3VzZXVwSGFuZGxlcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGNsaWNrXHJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gQ2xpY2sgZXZlbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbkNsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXHJcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSkge1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzKSkge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZSh0aGlzLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmNsaWNrVGltZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCdkb3VibGVDbGljaycsIGV2ZW50KTtcclxuICAgICAgICAgICAgdGhpcy5yZXNldENsaWNrVGltZXIoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0xvd2VyVGhhbklFOSkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQgPSB0dWkudXRpbC5leHRlbmQoe30sIGV2ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5maXJlKCdzaW5nbGVDbGljaycsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIHNlbGYucmVzZXRDbGlja1RpbWVyKCk7XHJcbiAgICAgICAgICAgIH0sIDMwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBub2RlIHN0YXRlIC0gb3BlbmVkIG9yIGNsb3NlZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIE5vZGUgc3RhdGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSkge1xyXG4gICAgICAgIHZhciBzdWJ0cmVlRWxlbWVudCA9IHRoaXMuX2dldFN1YnRyZWVFbGVtZW50KG5vZGVJZCksXHJcbiAgICAgICAgICAgIHRvZ2dsZUJ0bkNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzcyxcclxuICAgICAgICAgICAgbGFiZWwsIGJ0bkVsZW1lbnQsIG5vZGVFbGVtZW50O1xyXG5cclxuICAgICAgICBpZiAoIXN1YnRyZWVFbGVtZW50IHx8IHN1YnRyZWVFbGVtZW50ID09PSB0aGlzLnJvb3RFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGFiZWwgPSB0aGlzLnN0YXRlTGFiZWxzW3N0YXRlXTtcclxuICAgICAgICBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XHJcbiAgICAgICAgYnRuRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShub2RlRWxlbWVudCwgdG9nZ2xlQnRuQ2xhc3NOYW1lKVswXTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlID09PSBub2RlU3RhdGVzLk9QRU5FRCkge1xyXG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fc2V0Tm9kZUNsYXNzTmFtZUZyb21TdGF0ZShub2RlRWxlbWVudCwgc3RhdGUpO1xyXG5cclxuICAgICAgICBpZiAoYnRuRWxlbWVudCkge1xyXG4gICAgICAgICAgICBidG5FbGVtZW50LmlubmVySFRNTCA9IGxhYmVsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbm9kZSBjbGFzcyBuYW1lIGZyb20gcHJvdmlkZWQgc3RhdGVcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVFbGVtZW50IC0gVHJlZU5vZGUgZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTmV3IGNoYW5nZWQgc3RhdGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlOiBmdW5jdGlvbihub2RlRWxlbWVudCwgc3RhdGUpIHtcclxuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcclxuICAgICAgICAgICAgb3BlbmVkQ2xhc3NOYW1lID0gY2xhc3NOYW1lc1tub2RlU3RhdGVzLk9QRU5FRCArICdDbGFzcyddLFxyXG4gICAgICAgICAgICBjbG9zZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuQ0xPU0VEICsgJ0NsYXNzJ107XHJcblxyXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Mobm9kZUVsZW1lbnQsIG9wZW5lZENsYXNzTmFtZSk7XHJcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgY2xvc2VkQ2xhc3NOYW1lKTtcclxuICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgaHRtbFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gbm9kZUlkcyAtIE5vZGUgaWQgbGlzdFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSFRNTFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX21ha2VIdG1sOiBmdW5jdGlvbihub2RlSWRzKSB7XHJcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcclxuICAgICAgICAgICAgc3RhdGVMYWJlbHMgPSB0aGlzLnN0YXRlTGFiZWxzLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVNvdXJjZSA9IHRoaXMudGVtcGxhdGUsXHJcbiAgICAgICAgICAgIGh0bWwgPSAnJztcclxuXHJcbiAgICAgICAgc25pcHBldC5mb3JFYWNoKG5vZGVJZHMsIGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IG1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpLFxyXG4gICAgICAgICAgICAgICAgbm9kZURhdGEgPSBub2RlLmdldEFsbERhdGEoKSxcclxuICAgICAgICAgICAgICAgIHByb3BzID0gZXh0ZW5kKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbm9kZUlkXHJcbiAgICAgICAgICAgICAgICB9LCBjbGFzc05hbWVzLCBub2RlRGF0YSksXHJcbiAgICAgICAgICAgICAgICBub2RlVGVtcGxhdGU7XHJcblxyXG4gICAgICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZVRlbXBsYXRlID0gdGVtcGxhdGVTb3VyY2UubGVhZk5vZGU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlVGVtcGxhdGUgPSB0ZW1wbGF0ZVNvdXJjZS5pbnRlcm5hbE5vZGU7XHJcbiAgICAgICAgICAgICAgICBwcm9wcy5zdGF0ZUNsYXNzID0gY2xhc3NOYW1lc1tzdGF0ZSsnQ2xhc3MnXTtcclxuICAgICAgICAgICAgICAgIHByb3BzLnN0YXRlTGFiZWwgPSBzdGF0ZUxhYmVsc1tzdGF0ZV07XHJcbiAgICAgICAgICAgICAgICBwcm9wcy5jaGlsZHJlbiA9IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaHRtbCArPSB1dGlsLnRlbXBsYXRlKG5vZGVUZW1wbGF0ZSwgcHJvcHMpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIHJldHVybiBodG1sO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERyYXcgdHJlZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBQYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2RyYXdDaGlsZHJlbjogZnVuY3Rpb24ocGFyZW50SWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShwYXJlbnRJZCksXHJcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgbm9kZSA9IHRoaXMubW9kZWwucm9vdE5vZGU7XHJcbiAgICAgICAgICAgIHBhcmVudElkID0gbm9kZS5nZXRJZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHRoaXMuX2dldFN1YnRyZWVFbGVtZW50KHBhcmVudElkKTtcclxuICAgICAgICBpZiAoIXN1YnRyZWVFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbihub2RlLmdldFBhcmVudElkKCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAYXBpXHJcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlRHJhd1xyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogdHJlZS5vbignYmVmb3JlRHJhdycsIGZ1bmN0aW9uKHBhcmVudElkKSB7XHJcbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKHBhcmVudElkKTtcclxuICAgICAgICAgKiB9KTtcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmZpcmUoJ2JlZm9yZURyYXcnLCBwYXJlbnRJZCk7XHJcbiAgICAgICAgc3VidHJlZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5fbWFrZUh0bWwobm9kZS5nZXRDaGlsZElkcygpKTtcclxuICAgICAgICB0aGlzLm1vZGVsLmVhY2goZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlLmdldFN0YXRlKCkgPT09IG5vZGVTdGF0ZXMuT1BFTkVEKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4obm9kZUlkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2Uobm9kZUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHBhcmVudElkLCB0aGlzKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQGFwaVxyXG4gICAgICAgICAqIEBldmVudCBUcmVlI2FmdGVyRHJhd1xyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogdHJlZS5vbignYWZ0ZXJEcmF3JywgZnVuY3Rpb24ocGFyZW50SWQpIHtcclxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2cocGFyZW50SWQpO1xyXG4gICAgICAgICAqIH0pO1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZmlyZSgnYWZ0ZXJEcmF3JywgcGFyZW50SWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBzdWJ0cmVlIGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBUcmVlTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge0VsZW1lbnR8dW5kZWZpbmVkfSBTdWJ0cmVlIGVsZW1lbnQgb3IgdW5kZWZpbmVkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfZ2V0U3VidHJlZUVsZW1lbnQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIHN1YnRyZWVDbGFzc05hbWUsIG5vZGVFbGVtZW50LCBzdWJ0cmVlRWxlbWVudDtcclxuICAgICAgICBpZiAoIW5vZGUgfHwgbm9kZS5pc0xlYWYoKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobm9kZS5pc1Jvb3QoKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yb290RWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN1YnRyZWVDbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZXNbJ3N1YnRyZWVDbGFzcyddO1xyXG4gICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZS5nZXRJZCgpKTtcclxuICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShub2RlRWxlbWVudCwgc3VidHJlZUNsYXNzTmFtZSlbMF07XHJcblxyXG4gICAgICAgIHJldHVybiBzdWJ0cmVlRWxlbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gdGhlIGRlcHRoIG9mIG5vZGVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfSBEZXB0aFxyXG4gICAgICovXHJcbiAgICBnZXREZXB0aDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0RGVwdGgobm9kZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gdGhlIGxhc3QgZGVwdGggb2YgdHJlZVxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBMYXN0IGRlcHRoXHJcbiAgICAgKi9cclxuICAgIGdldExhc3REZXB0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0TGFzdERlcHRoKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIHJvb3Qgbm9kZSBpZFxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUm9vdCBub2RlIGlkXHJcbiAgICAgKi9cclxuICAgIGdldFJvb3ROb2RlSWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLnJvb3ROb2RlLmdldElkKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIGNoaWxkIGlkc1xyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPnx1bmRlZmluZWR9IENoaWxkIGlkc1xyXG4gICAgICovXHJcbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gcGFyZW50IGlkIG9mIG5vZGVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gUGFyZW50IGlkXHJcbiAgICAgKi9cclxuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRQYXJlbnRJZChub2RlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc2V0IGNsaWNrIHRpbWVyXHJcbiAgICAgKi9cclxuICAgIHJlc2V0Q2xpY2tUaW1lcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLmNsaWNrVGltZXIpO1xyXG4gICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzZXQgbW91c2Vkb3duIHRpbWVyXHJcbiAgICAgKi9cclxuICAgIHJlc2V0TW91c2Vkb3duVGltZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5tb3VzZWRvd25UaW1lcik7XHJcbiAgICAgICAgdGhpcy5tb3VzZWRvd25UaW1lciA9IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IG5vZGUgaWQgZnJvbSBlbGVtZW50XHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gRWxlbWVudFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gTm9kZSBpZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZUlkRnJvbUVsZW1lbnQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgICB2YXIgaWRQcmVmaXggPSB0aGlzLmdldE5vZGVJZFByZWZpeCgpO1xyXG5cclxuICAgICAgICB3aGlsZSAoZWxlbWVudCAmJiBlbGVtZW50LmlkLmluZGV4T2YoaWRQcmVmaXgpID09PSAtMSkge1xyXG4gICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmlkIDogJyc7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHByZWZpeCBvZiBub2RlIGlkXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXggb2Ygbm9kZSBpZFxyXG4gICAgICovXHJcbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVJZFByZWZpeCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBub2RlIGRhdGFcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fHVuZGVmaW5lZH0gTm9kZSBkYXRhXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXROb2RlRGF0YShub2RlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBkYXRhIHByb3BlcnRpZXMgb2YgYSBub2RlXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBQcm9wZXJ0aWVzXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIHNldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIGRhdGEsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEsIGlzU2lsZW50KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxyXG4gICAgICovXHJcbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBuYW1lcywgaXNTaWxlbnQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZU5vZGVEYXRhKG5vZGVJZCwgbmFtZXMsIGlzU2lsZW50KVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBub2RlIHN0YXRlLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ3x1bmRlZmluZWR9IE5vZGUgc3RhdGUoKCdvcGVuZWQnLCAnY2xvc2VkJywgdW5kZWZpbmVkKVxyXG4gICAgICovXHJcbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKTtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0U3RhdGUoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcGVuIG5vZGVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKi9cclxuICAgIG9wZW46IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5PUEVORUQ7XHJcblxyXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xvc2Ugbm9kZVxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgY2xvc2U6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5DTE9TRUQ7XHJcblxyXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG9nZ2xlIG5vZGVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICoqL1xyXG4gICAgdG9nZ2xlOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICBzdGF0ZTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcclxuICAgICAgICAgICAgbm9kZS50b2dnbGVTdGF0ZSgpO1xyXG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNvcnQgYWxsIG5vZGVzXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIC0gQ29tcGFyYXRvciBmb3Igc29ydGluZ1xyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHRyZWUuc29ydChmdW5jdGlvbihub2RlQSwgbm9kZUIpIHtcclxuICAgICAqICAgICB2YXIgYVZhbHVlID0gbm9kZUEuZ2V0RGF0YSgndGV4dCcpLFxyXG4gICAgICogICAgICAgICBiVmFsdWUgPSBub2RlQi5nZXREYXRhKCd0ZXh0Jyk7XHJcbiAgICAgKlxyXG4gICAgICogICAgIGlmICghYlZhbHVlIHx8ICFiVmFsdWUubG9jYWxlQ29tcGFyZSkge1xyXG4gICAgICogICAgICAgICByZXR1cm4gMDtcclxuICAgICAqICAgICB9XHJcbiAgICAgKiAgICAgcmV0dXJuIGJWYWx1ZS5sb2NhbGVDb21wYXJlKGFWYWx1ZSk7XHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvcikge1xyXG4gICAgICAgIHRoaXMubW9kZWwuc29ydChjb21wYXJhdG9yKTtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4oKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWZyZXNoIHRyZWUgb3Igbm9kZSdzIGNoaWxkcmVuXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW25vZGVJZF0gLSBUcmVlTm9kZSBpZCB0byByZWZyZXNoXHJcbiAgICAgKiovXHJcbiAgICByZWZyZXNoOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4obm9kZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIG5vZGVzLlxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB0cmVlLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XHJcbiAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZS5nZXRJZCgpID09PSBub2RlSWQpOyAvLyB0cnVlXHJcbiAgICAgKiB9KTtcclxuICAgICAqL1xyXG4gICAgZWFjaEFsbDogZnVuY3Rpb24oaXRlcmF0ZWUsIGNvbnRleHQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLmVhY2hBbGwoaXRlcmF0ZWUsIGNvbnRleHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgZGVzY2VuZGFudHMgb2YgYSBub2RlLlxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdHJlZS5lYWNoKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xyXG4gICAgICogICAgIGNvbnNvbGUubG9nKG5vZGUuZ2V0SWQoKSA9PT0gbm9kZUlkKTsgLy8gdHJ1ZVxyXG4gICAgICogfSwgcGFyZW50SWQpO1xyXG4gICAgICpcclxuICAgICAqL1xyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIG5vZGUocykuXHJcbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cclxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxyXG4gICAgICogQHBhcmFtIHsqfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB0cmVlLmFkZCh7dGV4dDonRkUgZGV2ZWxvcG1lbnQgdGVhbSd9LCBteVBhcmVudElkKTsgLy8gYWRkIG5vZGUgd2l0aCByZWRyYXdpbmdcclxuICAgICAqIHRyZWUuYWRkKHt0ZXh0OidGRSBkZXZlbG9wbWVudCB0ZWFtJ30sIG15UGFyZW50SWQsIHRydWUpOyAvLyBhZGQgbm9kZSB3aXRob3V0IHJlZHJhd2luZ1xyXG4gICAgICovXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwuYWRkKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxyXG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZCB0byByZW1vdmVcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdHJlZS5yZW1vdmUobXlOb2RlSWQpOyAvLyByZW1vdmUgbm9kZSB3aXRoIHJlZHJhd2luZ1xyXG4gICAgICogdHJlZS5yZW1vdmUobXlOb2RlSWQsIHRydWUpOyAvLyByZW1vdmUgbm9kZSB3aXRob3V0IHJlZHJhd2luZ1xyXG4gICAgICovXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgaXNTaWxlbnQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZShub2RlSWQsIGlzU2lsZW50KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNb3ZlIGEgbm9kZSB0byBuZXcgcGFyZW50XHJcbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxyXG4gICAgICogQGV4bWFwbGVcclxuICAgICAqIHRyZWUubW92ZShteU5vZGVJZCwgbmV3UGFyZW50SWQpOyAvLyBtb2RlIG5vZGUgd2l0aCByZWRyYXdpbmdcclxuICAgICAqIHRyZWUubW92ZShteU5vZGVJZCwgbmV3UGFyZW50SWQsIHRydWUpOyAvLyBtb3ZlIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcclxuICAgICAqL1xyXG4gICAgbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCwgaXNTaWxlbnQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLm1vdmUobm9kZUlkLCBuZXdQYXJlbnRJZCwgaXNTaWxlbnQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZSBmYWNpbGl0eSBvZiB0cmVlXHJcbiAgICAgKiBAYXBpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnLCAnRWRpdGFibGUnXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIC0gRmVhdHVyZSBvcHRpb25zXHJcbiAgICAgKiBAcmV0dXJuIHtUcmVlfSB0aGlzXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdHJlZVxyXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcclxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnRWRpdGFibGUnLCB7XHJcbiAgICAgKiAgICAgIGVuYWJsZUNsYXNzTmFtZTogdHJlZS5jbGFzc05hbWVzLnRleHRDbGFzcyxcclxuICAgICAqICAgICAgZGF0ZUtleTogJ3RleHQnLFxyXG4gICAgICogICAgICBpbnB1dENsYXNzTmFtZTogJ215SW5wdXQnXHJcbiAgICAgKiAgfSlcclxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnRHJhZ2dhYmxlJywge1xyXG4gICAgICogICAgICB1c2VIZWxwZXI6IHRydWUsXHJcbiAgICAgKiAgICAgIGhlbHBlclBvczoge3g6IDUsIHk6IDJ9LFxyXG4gICAgICogICAgICByZWplY3RlZFRhZ05hbWVzOiBbJ1VMJywgJ0lOUFVUJywgJ0JVVFRPTiddLFxyXG4gICAgICogICAgICByZWplY3RlZENsYXNzTmFtZXM6IFsnZWxlbWVudEhhdmluZ1NvbWVDbGFzc0lzTm90RHJhZ2dhYmxlJywgJ215Q2xhc3MnXVxyXG4gICAgICogIH0pO1xyXG4gICAgICovXHJcbiAgICBlbmFibGVGZWF0dXJlOiBmdW5jdGlvbihmZWF0dXJlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgICAgIHZhciBGZWF0dXJlID0gVHJlZS5mZWF0dXJlc1tmZWF0dXJlTmFtZV07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzYWJsZUZlYXR1cmUoZmVhdHVyZU5hbWUpO1xyXG4gICAgICAgIGlmIChGZWF0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXSA9IG5ldyBGZWF0dXJlKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNhYmxlIGZhY2lsaXR5IG9mIHRyZWVcclxuICAgICAqIEBhcGlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtICdTZWxlY3RhYmxlJywgJ0RyYWdnYWJsZScsICdFZGl0YWJsZSdcclxuICAgICAqIEByZXR1cm4ge1RyZWV9IHRoaXNcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB0cmVlXHJcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcclxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0RyYWdnYWJsZScpXHJcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdFZGl0YWJsZScpO1xyXG4gICAgICovXHJcbiAgICBkaXNhYmxlRmVhdHVyZTogZnVuY3Rpb24oZmVhdHVyZU5hbWUpIHtcclxuICAgICAgICB2YXIgZmVhdHVyZSA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXTtcclxuXHJcbiAgICAgICAgaWYgKGZlYXR1cmUpIHtcclxuICAgICAgICAgICAgZmVhdHVyZS5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudHVpLnV0aWwuZm9yRWFjaChmZWF0dXJlcywgZnVuY3Rpb24oRmVhdHVyZSwgbmFtZSkge1xyXG4gICAgVHJlZS5yZWdpc3RlckZlYXR1cmUobmFtZSwgRmVhdHVyZSk7XHJcbn0pO1xyXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVHJlZSk7XHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlb3ZlcnZpZXcgVXBkYXRlIHZpZXcgYW5kIGNvbnRyb2wgdHJlZSBkYXRhXHJcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBUcmVlTm9kZSA9IHJlcXVpcmUoJy4vdHJlZU5vZGUnKSxcclxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcclxuXHJcbnZhciBzbmlwcGV0ID0gdHVpLnV0aWwsXHJcbiAgICBleHRlbmQgPSBzbmlwcGV0LmV4dGVuZCxcclxuICAgIGtleXMgPSBzbmlwcGV0LmtleXMsXHJcbiAgICBmb3JFYWNoID0gc25pcHBldC5mb3JFYWNoLFxyXG4gICAgbWFwID0gc25pcHBldC5tYXAsXHJcbiAgICBmaWx0ZXIgPSBzbmlwcGV0LmZpbHRlcixcclxuICAgIGluQXJyYXkgPSBzbmlwcGV0LmluQXJyYXk7XHJcblxyXG4vKipcclxuICogVHJlZSBtb2RlbFxyXG4gKiBAY29uc3RydWN0b3IgVHJlZU1vZGVsXHJcbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBEYXRhXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9ucyBmb3IgZGVmYXVsdFN0YXRlIGFuZCBub2RlSWRQcmVmaXhcclxuICoqL1xyXG52YXIgVHJlZU1vZGVsID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlTW9kZWwucHJvdG90eXBlICoveyAvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgey8qZXNsaW50LWVuYWJsZSovXHJcbiAgICAgICAgVHJlZU5vZGUuc2V0SWRQcmVmaXgob3B0aW9ucy5ub2RlSWRQcmVmaXgpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWZhdWx0IHN0YXRlIG9mIG5vZGVcclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubm9kZURlZmF1bHRTdGF0ZSA9IG9wdGlvbnMubm9kZURlZmF1bHRTdGF0ZTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUm9vdCBub2RlXHJcbiAgICAgICAgICogQHR5cGUge1RyZWVOb2RlfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucm9vdE5vZGUgPSBuZXcgVHJlZU5vZGUoe1xyXG4gICAgICAgICAgICBzdGF0ZTogJ29wZW5lZCdcclxuICAgICAgICB9LCBudWxsKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVHJlZSBoYXNoIGhhdmluZyBhbGwgbm9kZXNcclxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0LjxzdHJpbmcsIFRyZWVOb2RlPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRyZWVIYXNoID0ge307XHJcblxyXG4gICAgICAgIHRoaXMuX3NldERhdGEoZGF0YSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIHByZWZpeCBvZiBub2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXhcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZUlkUHJlZml4OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gVHJlZU5vZGUuaWRQcmVmaXg7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IG1vZGVsIHdpdGggdHJlZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXHJcbiAgICAgKi9cclxuICAgIF9zZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLnJvb3ROb2RlLFxyXG4gICAgICAgICAgICByb290SWQgPSByb290LmdldElkKCk7XHJcblxyXG4gICAgICAgIHRoaXMudHJlZUhhc2hbcm9vdElkXSA9IHJvb3Q7XHJcbiAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHJvb3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgdHJlZSBoYXNoIGZyb20gZGF0YSBhbmQgcGFyZW50Tm9kZVxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIFRyZWUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gcGFyZW50IC0gUGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9tYWtlVHJlZUhhc2g6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHBhcmVudC5nZXRJZCgpO1xyXG5cclxuICAgICAgICBmb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKGRhdHVtKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbkRhdGEgPSBkYXR1bS5jaGlsZHJlbixcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9jcmVhdGVOb2RlKGRhdHVtLCBwYXJlbnRJZCksXHJcbiAgICAgICAgICAgICAgICBub2RlSWQgPSBub2RlLmdldElkKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyZWVIYXNoW25vZGVJZF0gPSBub2RlO1xyXG4gICAgICAgICAgICBwYXJlbnQuYWRkQ2hpbGRJZChub2RlSWQpO1xyXG4gICAgICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goY2hpbGRyZW5EYXRhLCBub2RlKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVEYXRhIC0gRGF0dW0gb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IGlkXHJcbiAgICAgKiBAcmV0dXJuIHtUcmVlTm9kZX0gVHJlZU5vZGVcclxuICAgICAqL1xyXG4gICAgX2NyZWF0ZU5vZGU6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkge1xyXG4gICAgICAgIHZhciBub2RlO1xyXG4gICAgICAgIG5vZGVEYXRhID0gZXh0ZW5kKHtcclxuICAgICAgICAgICAgc3RhdGU6IHRoaXMubm9kZURlZmF1bHRTdGF0ZVxyXG4gICAgICAgIH0sIG5vZGVEYXRhKTtcclxuXHJcbiAgICAgICAgbm9kZSA9IG5ldyBUcmVlTm9kZShub2RlRGF0YSwgcGFyZW50SWQpO1xyXG4gICAgICAgIG5vZGUucmVtb3ZlRGF0YSgnY2hpbGRyZW4nKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGNoaWxkcmVuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybiB7QXJyYXkuPFRyZWVOb2RlPnx1bmRlZmluZWR9IGNoaWxkcmVuXHJcbiAgICAgKi9cclxuICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLmdldENoaWxkSWRzKG5vZGVJZCk7XHJcbiAgICAgICAgaWYgKCFjaGlsZElkcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbWFwKGNoaWxkSWRzLCBmdW5jdGlvbihjaGlsZElkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE5vZGUoY2hpbGRJZCk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGNoaWxkIGlkc1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPnx1bmRlZmluZWR9IENoaWxkIGlkc1xyXG4gICAgICovXHJcbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0Q2hpbGRJZHMoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIG51bWJlciBvZiBub2Rlc1xyXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIG51bWJlciBvZiBub2Rlc1xyXG4gICAgICovXHJcbiAgICBnZXRDb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGtleXModGhpcy50cmVlSGFzaCkubGVuZ3RoO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBsYXN0IGRlcHRoXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbGFzdCBkZXB0aFxyXG4gICAgICovXHJcbiAgICBnZXRMYXN0RGVwdGg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBkZXB0aHMgPSBtYXAodGhpcy50cmVlSGFzaCwgZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXREZXB0aChub2RlLmdldElkKCkpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgZGVwdGhzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaW5kIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIEEgbm9kZSBpZCB0byBmaW5kXHJcbiAgICAgKiBAcmV0dXJuIHtUcmVlTm9kZXx1bmRlZmluZWR9IE5vZGVcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZTogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmVlSGFzaFtpZF07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGRlcHRoIGZyb20gbm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcclxuICAgICAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9IERlcHRoXHJcbiAgICAgKi9cclxuICAgIGdldERlcHRoOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKSxcclxuICAgICAgICAgICAgZGVwdGggPSAwLFxyXG4gICAgICAgICAgICBwYXJlbnQ7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuICAgICAgICB3aGlsZSAocGFyZW50KSB7XHJcbiAgICAgICAgICAgIGRlcHRoICs9IDE7XHJcbiAgICAgICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShwYXJlbnQuZ2V0UGFyZW50SWQoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGVwdGg7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIHBhcmVudCBpZCBvZiBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gUGFyZW50IGlkXHJcbiAgICAgKi9cclxuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0UGFyZW50SWQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgYSBub2RlIHdpdGggY2hpbGRyZW4uXHJcbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZCB0byByZW1vdmVcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihpZCwgaXNTaWxlbnQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXHJcbiAgICAgICAgICAgIHBhcmVudDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShub2RlLmdldFBhcmVudElkKCkpO1xyXG5cclxuICAgICAgICBmb3JFYWNoKG5vZGUuZ2V0Q2hpbGRJZHMoKSwgZnVuY3Rpb24oY2hpbGRJZCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZShjaGlsZElkLCB0cnVlKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkSWQoaWQpO1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLnRyZWVIYXNoW2lkXTtcclxuXHJcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIHBhcmVudC5nZXRJZCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIG5vZGUocykuXHJcbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cclxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdy1kYXRhXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgaWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcclxuICAgICAqL1xyXG4gICAgYWRkOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCwgaXNTaWxlbnQpIHtcclxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5nZXROb2RlKHBhcmVudElkKSB8fCB0aGlzLnJvb3ROb2RlO1xyXG5cclxuICAgICAgICBkYXRhID0gW10uY29uY2F0KGRhdGEpO1xyXG4gICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCBwYXJlbnQpO1xyXG5cclxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgcGFyZW50SWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZGF0YSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHByb3BzIC0gUHJvcGVydGllc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxyXG4gICAgICovXHJcbiAgICBzZXROb2RlRGF0YTogZnVuY3Rpb24oaWQsIHByb3BzLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlIHx8ICFwcm9wcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBub2RlLnNldERhdGEocHJvcHMpO1xyXG5cclxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgbm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIG5vZGUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxyXG4gICAgICovXHJcbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24oaWQsIG5hbWVzLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlIHx8ICFuYW1lcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHVpLnV0aWwuaXNBcnJheShuYW1lcykpIHtcclxuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhLmFwcGx5KG5vZGUsIG5hbWVzKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBub2RlLnJlbW92ZURhdGEobmFtZXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIG5vZGUuZ2V0UGFyZW50SWQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnQncyBjaGlsZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcclxuICAgICAqL1xyXG4gICAgbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCwgaXNTaWxlbnQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICBvcmlnaW5hbFBhcmVudCwgb3JpZ2luYWxQYXJlbnRJZCwgbmV3UGFyZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBuZXdQYXJlbnQgPSB0aGlzLmdldE5vZGUobmV3UGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGU7XHJcbiAgICAgICAgbmV3UGFyZW50SWQgPSBuZXdQYXJlbnQuZ2V0SWQoKTtcclxuICAgICAgICBvcmlnaW5hbFBhcmVudElkID0gbm9kZS5nZXRQYXJlbnRJZCgpO1xyXG4gICAgICAgIG9yaWdpbmFsUGFyZW50ID0gdGhpcy5nZXROb2RlKG9yaWdpbmFsUGFyZW50SWQpO1xyXG5cclxuICAgICAgICBpZiAobm9kZUlkID09PSBuZXdQYXJlbnRJZCB8fCB0aGlzLmNvbnRhaW5zKG5vZGVJZCwgbmV3UGFyZW50SWQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3JpZ2luYWxQYXJlbnQucmVtb3ZlQ2hpbGRJZChub2RlSWQpO1xyXG4gICAgICAgIG5vZGUuc2V0UGFyZW50SWQobmV3UGFyZW50SWQpO1xyXG4gICAgICAgIG5ld1BhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XHJcblxyXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywgbm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIHRvIHNlZSBpZiBhIG5vZGUgaXMgYSBkZXNjZW5kYW50IG9mIGFub3RoZXIgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZWRJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUaGUgbm9kZSBpcyBjb250YWluZWQgb3Igbm90XHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihjb250YWluZXJJZCwgY29udGFpbmVkSWQpIHtcclxuICAgICAgICB2YXIgcGFyZW50SWQgPSB0aGlzLmdldFBhcmVudElkKGNvbnRhaW5lZElkKSxcclxuICAgICAgICAgICAgaXNDb250YWluZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgd2hpbGUgKCFpc0NvbnRhaW5lZCAmJiBwYXJlbnRJZCkge1xyXG4gICAgICAgICAgICBpc0NvbnRhaW5lZCA9IChjb250YWluZXJJZCA9PT0gcGFyZW50SWQpO1xyXG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRoaXMuZ2V0UGFyZW50SWQocGFyZW50SWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaXNDb250YWluZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU29ydCBub2Rlc1xyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZnVuY3Rpb25cclxuICAgICAqL1xyXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvcikge1xyXG4gICAgICAgIHRoaXMuZWFjaEFsbChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRDaGlsZHJlbihub2RlSWQpLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRJZHM7XHJcblxyXG4gICAgICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4uc29ydChjb21wYXJhdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGlsZElkcyA9IG1hcChjaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGQuZ2V0SWQoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgbm9kZS5yZXBsYWNlQ2hpbGRJZHMoY2hpbGRJZHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IG5vZGUgZGF0YSAoYWxsKVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm4ge29iamVjdHx1bmRlZmluZWR9IE5vZGUgZGF0YVxyXG4gICAgICovXHJcbiAgICBnZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0QWxsRGF0YSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgbm9kZXMuXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxyXG4gICAgICovXHJcbiAgICBlYWNoQWxsOiBmdW5jdGlvbihpdGVyYXRlZSwgY29udGV4dCkge1xyXG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XHJcblxyXG4gICAgICAgIGZvckVhY2godGhpcy50cmVlSGFzaCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGl0ZXJhdGVlLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBkZXNjZW5kYW50cyBvZiBhIG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcclxuICAgICAqL1xyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHN0YWNrLCBub2RlSWQsIG5vZGU7XHJcblxyXG4gICAgICAgIG5vZGUgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpO1xyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YWNrID0gbm9kZS5nZXRDaGlsZElkcygpO1xyXG5cclxuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xyXG4gICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbm9kZUlkID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcclxuICAgICAgICAgICAgaXRlcmF0ZWUuY2FsbChjb250ZXh0LCBub2RlLCBub2RlSWQpO1xyXG5cclxuICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5jb25jYXQobm9kZS5nZXRDaGlsZElkcygpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWVNb2RlbCk7XHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZU1vZGVsO1xyXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdGF0ZXMgPSByZXF1aXJlKCcuL3N0YXRlcycpLm5vZGUsXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgbGFzdEluZGV4ID0gMCxcbiAgICBnZXROZXh0SW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGFzdEluZGV4O1xuICAgICAgICBsYXN0SW5kZXggKz0gMTtcbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG4gICAgUkVTRVJWRURfUFJPUEVSVElFUyA9IHtcbiAgICAgICAgaWQ6ICcnLFxuICAgICAgICBzdGF0ZTogJ3NldFN0YXRlJ1xuICAgIH0sXG4gICAgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG5cbi8qKlxuICogVHJlZU5vZGVcbiAqIEBDb25zdHJ1Y3RvciBUcmVlTm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG5vZGVEYXRhIC0gTm9kZSBkYXRhXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIFBhcmVudCBub2RlIGlkXG4gKi9cbnZhciBUcmVlTm9kZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU5vZGUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCBwcmVmaXggb2YgaWRcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIFByZWZpeCBvZiBpZFxuICAgICAgICAgKi9cbiAgICAgICAgc2V0SWRQcmVmaXg6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICAgICAgdGhpcy5pZFByZWZpeCA9IHByZWZpeCB8fCB0aGlzLmlkUHJlZml4O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcmVmaXggb2YgaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGlkUHJlZml4OiAnJ1xuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24obm9kZURhdGEsIHBhcmVudElkKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9pZCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhcmVudCBub2RlIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2NoaWxkSWRzID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIHN0YXRlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG5cbiAgICAgICAgdGhpcy5fc3RhbXBJZCgpO1xuICAgICAgICB0aGlzLnNldERhdGEobm9kZURhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdGFtcCBub2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc3RhbXBJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2lkID0gdGhpcy5jb25zdHJ1Y3Rvci5pZFByZWZpeCArIGdldE5leHRJbmRleCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcmVzZXJ2ZWQgcHJvcGVydGllcyBmcm9tIGRhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIE5vZGUgZGF0YVxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IE5vZGUgZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJlc2VydmVkUHJvcGVydGllczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoT3duUHJvcGVydGllcyhSRVNFUlZFRF9QUk9QRVJUSUVTLCBmdW5jdGlvbihzZXR0ZXIsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbbmFtZV07XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiBzZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3NldHRlcl0odmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGRhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgc3RhdGVcbiAgICAgKiBAYXBpXG4gICAgICovXG4gICAgdG9nZ2xlU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdGUgPT09IHN0YXRlcy5DTE9TRUQpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLk9QRU5FRDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLkNMT1NFRDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgc3RhdGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gU3RhdGUgb2Ygbm9kZSAoJ2Nsb3NlZCcsICdvcGVuZWQnKVxuICAgICAqL1xuICAgIHNldFN0YXRlOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICBzdGF0ZSArPSAnJztcbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXNbc3RhdGUudG9VcHBlckNhc2UoKV0gfHwgdGhpcy5fc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzdGF0ZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzdGF0ZSAoJ29wZW5lZCcgb3IgJ2Nsb3NlZCcpXG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBOb2RlIGlkXG4gICAgICovXG4gICAgZ2V0SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwYXJlbnQgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUGFyZW50IG5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnRJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICovXG4gICAgc2V0UGFyZW50SWQ6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHRoaXMuX3BhcmVudElkID0gcGFyZW50SWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2UgY2hpbGRJZHNcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBjaGlsZElkcyAtIElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKi9cbiAgICByZXBsYWNlQ2hpbGRJZHM6IGZ1bmN0aW9uKGNoaWxkSWRzKSB7XG4gICAgICAgIHRoaXMuX2NoaWxkSWRzID0gY2hpbGRJZHM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48bnVtYmVyPn0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkSWRzLnNsaWNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICBhZGRDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLl9jaGlsZElkcztcblxuICAgICAgICBpZiAodHVpLnV0aWwuaW5BcnJheShjaGlsZElkcywgaWQpID09PSAtMSkge1xuICAgICAgICAgICAgY2hpbGRJZHMucHVzaChpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIHJlbW92ZUNoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlSXRlbUZyb21BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFByb3BlcnR5IG5hbWUgb2YgZGF0YVxuICAgICAqIEByZXR1cm5zIHsqfSBEYXRhXG4gICAgICovXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtuYW1lXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IERhdGFcbiAgICAgKi9cbiAgICBnZXRBbGxEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHR1aS51dGlsLmV4dGVuZCh7fSwgdGhpcy5fZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRGF0YSBmb3IgYWRkaW5nXG4gICAgICovXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkYXRhID0gdGhpcy5fc2V0UmVzZXJ2ZWRQcm9wZXJ0aWVzKGRhdGEpO1xuICAgICAgICB0dWkudXRpbC5leHRlbmQodGhpcy5fZGF0YSwgZGF0YSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHsuLi5zdHJpbmd9IG5hbWVzIC0gTmFtZXMgb2YgZGF0YVxuICAgICAqL1xuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKG5hbWVzKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2hBcnJheShhcmd1bWVudHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IC0gV2hldGhlciB0aGlzIG5vZGUgaGFzIGEgcHJvdmlkZWQgY2hpbGQgaWQuXG4gICAgICovXG4gICAgaGFzQ2hpbGQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiBpbkFycmF5KGlkLCB0aGlzLl9jaGlsZElkcykgIT09IC0xO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIG5vZGUgaXMgbGVhZi5cbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IE5vZGUgaXMgbGVhZiBvciBub3QuXG4gICAgICovXG4gICAgaXNMZWFmOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkSWRzLmxlbmd0aCA9PT0gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBub2RlIGlzIHJvb3QuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIHJvb3Qgb3Igbm90LlxuICAgICAqL1xuICAgIGlzUm9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5pc0ZhbHN5KHRoaXMuX3BhcmVudElkKTtcbiAgICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU5vZGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgdXRpbCA9IHtcbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlyc3Qgc3BlY2lmaWVkIGl0ZW0gZnJvbSBhcnJheSwgaWYgaXQgZXhpc3RzXG4gICAgICogQHBhcmFtIHsqfSBpdGVtIEl0ZW0gdG8gbG9vayBmb3JcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIgQXJyYXkgdG8gcXVlcnlcbiAgICAgKi9cbiAgICByZW1vdmVJdGVtRnJvbUFycmF5OiBmdW5jdGlvbihpdGVtLCBhcnIpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdHVpLnV0aWwuaW5BcnJheShpdGVtLCBhcnIpO1xuXG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2xhc3NuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSAtIENsYXNzbmFtZVxuICAgICAqL1xuICAgIGFkZENsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC5jbGFzc05hbWUgPT09ICcnKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICghdXRpbC5oYXNDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSArPSAnICcgKyBjbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNsYXNzbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBDbGFzc25hbWVcbiAgICAgKi9cbiAgICByZW1vdmVDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBvcmlnaW5hbENsYXNzTmFtZSA9IHV0aWwuZ2V0Q2xhc3MoZWxlbWVudCksXG4gICAgICAgICAgICBhcnIsIGluZGV4O1xuXG4gICAgICAgIGlmICghb3JpZ2luYWxDbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyciA9IG9yaWdpbmFsQ2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgICAgIGluZGV4ID0gdHVpLnV0aWwuaW5BcnJheShjbGFzc05hbWUsIGFycik7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBhcnIuam9pbignICcpO1xuICAgICAgICB9XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHRvIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnQgXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFkZFxuICAgICAqL1xuICAgIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBmcm9tIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVtb3ZlXG4gICAgICovXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gRXZlbnQgdGFyZ2V0XG4gICAgICovXG4gICAgZ2V0VGFyZ2V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQ7XG4gICAgICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgSFRNTEVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBDbGFzcyBuYW1lXG4gICAgICovXG4gICAgZ2V0Q2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgJiYgZWxlbWVudC5nZXRBdHRyaWJ1dGUgJiYgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzc05hbWUnKSB8fCAnJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBlbGVtZW50IGhhcyBzcGVjaWZpYyBjbGFzcyBvciBub3RcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzcyB0byBmaW5kXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZWxlbWVudCBoYXMgdGhlIGNsYXNzXG4gICAgICovXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpO1xuXG4gICAgICAgIHJldHVybiBlbENsYXNzTmFtZS5pbmRleE9mKGNsYXNzTmFtZSkgPiAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBlbGVtZW50IGJ5IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgQSBuYW1lIG9mIGNsYXNzXG4gICAgICogQHJldHVybiB7QXJyYXkuPEhUTUxFbGVtZW50Pn0gRWxlbWVudHNcbiAgICAgKi9cbiAgICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lOiBmdW5jdGlvbih0YXJnZXQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgYWxsLCBmaWx0ZXJlZDtcblxuICAgICAgICBpZiAodGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFsbCA9IHR1aS51dGlsLnRvQXJyYXkodGFyZ2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJykpO1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0dWkudXRpbC5maWx0ZXIoYWxsLCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiAoY2xhc3NOYW1lcy5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHdoZXRoZXIgdGhlIGNsaWNrIGV2ZW50IGJ5IHJpZ2h0IGJ1dHRvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICovXG4gICAgaXNSaWdodEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuX2dldEJ1dHRvbihldmVudCkgPT09IDI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0IG9yIG5vdFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIEEgcHJvcGVydHlcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd8Ym9vbGVhbn0gUHJvcGVydHkgbmFtZSBvciBmYWxzZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIHVzZXJTZWxlY3RQcm9wZXJ0eSA9IHV0aWwudGVzdFByb3AoW1xuICAgICAqICAgICAndXNlclNlbGVjdCcsXG4gICAgICogICAgICdXZWJraXRVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ09Vc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ01velVzZXJTZWxlY3QnLFxuICAgICAqICAgICAnbXNVc2VyU2VsZWN0J1xuICAgICAqIF0pO1xuICAgICAqL1xuICAgIHRlc3RQcm9wOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUsXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBmYWxzZTtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHByb3BzLCBmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgICAgICBpZiAocHJvcCBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3A7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHByb3BlcnR5TmFtZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCBkZWZhdWx0IGV2ZW50IFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqL1xuICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbCBmcm9tIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZSAtIFRlbXBsYXRlIGh0bWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUZW1wbGF0ZSBkYXRhXG4gICAgICogQHJldHVybnMge3N0cmluZ30gaHRtbFxuICAgICAqL1xuICAgIHRlbXBsYXRlOiBmdW5jdGlvbihzb3VyY2UsIHByb3BzKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2UucmVwbGFjZSgvXFx7XFx7KFxcdyspfX0vZ2ksIGZ1bmN0aW9uKG1hdGNoLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBwcm9wc1tuYW1lXTtcbiAgICAgICAgICAgIGlmICh0dWkudXRpbC5pc0ZhbHN5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6YXRpb24gZm9yIGV2ZW50IGJ1dHRvbiBwcm9wZXJ0eSBcbiAgICAgKiAwOiBGaXJzdCBtb3VzZSBidXR0b24sIDI6IFNlY29uZCBtb3VzZSBidXR0b24sIDE6IENlbnRlciBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9IGJ1dHRvbiB0eXBlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0QnV0dG9uOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgYnV0dG9uLFxuICAgICAgICAgICAgcHJpbWFyeSA9ICcwLDEsMyw1LDcnLFxuICAgICAgICAgICAgc2Vjb25kYXJ5ID0gJzIsNicsXG4gICAgICAgICAgICB3aGVlbCA9ICc0JztcblxuICAgICAgICBpZiAoZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uaGFzRmVhdHVyZSgnTW91c2VFdmVudHMnLCAnMi4wJykpIHtcbiAgICAgICAgICAgIHJldHVybiBldmVudC5idXR0b247XG4gICAgICAgIH1cblxuICAgICAgICBidXR0b24gPSBldmVudC5idXR0b24gKyAnJztcbiAgICAgICAgaWYgKHByaW1hcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9IGVsc2UgaWYgKHNlY29uZGFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgIH0gZWxzZSBpZiAod2hlZWwuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIl19
