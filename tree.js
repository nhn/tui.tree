(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Tree', require('./src/js/tree'));

},{"./src/js/tree":6}],2:[function(require,module,exports){
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
            y: 10,
            x: 10
        }
    },
    rejectedTagNames = [
        'INPUT',
        'BUTTON'
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
        var helperElement = document.createElement('span'),
            style = helperElement.style;
        options = tui.util.extend({}, defaultOptions, options);

        this.useHelper = options.useHelper;
        this.helperPos = options.helperPos;
        this.rejectedTagNames = rejectedTagNames.concat(options.rejectedTagNames);
        this.rejectedClassNames = [].concat(options.rejectedClassNames);
        this.defaultPosition = tree.rootElement.getBoundingClientRect();
        this.helperElement = helperElement;
        this.userSelectPropertyKey = null;
        this.userSelectPropertyValue = null;
        this.currentNodeId = null;

        this.handlers = {};
        this.handlers.mousedown = tui.util.bind(this.onMousedown, this);
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
        var tree = this.tree,
            selectKey, style;

        if ('onselectstart' in document) {
            util.addEventListener(tree.rootElement, 'selectstart', util.preventDefault);
        } else {
            style = document.documentElement.style;
            selectKey = util.testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

            this.userSelectPropertyKey = selectKey;
            this.userSelectPropertyValue = style[selectKey];
            style[selectKey] = 'none';
        }
        util.addEventListener(tree.rootElement, 'mousedown', this.handlers.mousedown);
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
            pos = this.defaultPosition;
        if (!this.useHelper) {
            return;
        }

        helperEl.style.left = event.clientX - pos.left + this.helperPos.x + 'px';
        helperEl.style.top = event.clientY - pos.top + this.helperPos.y + 'px';
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
        var tree = this.tree;

        util.removeEventListener(tree.rootElement, 'selectstart', util.preventDefault);
        util.removeEventListener(tree.rootElement, 'mousedown', this.handlers.mousedown);
        if (this.userSelectPropertyKey) {
            document.documentElement.style[this.userSelectPropertyKey] = this.userSelectPropertyValue;
        }
    },

    /**
     * Disable this module
     */
    destroy: function() {
        this.detachMousedown();
    }
});

module.exports = Draggable;
},{"./util":9}],4:[function(require,module,exports){
'use strict';

var util = require('./util');


/**
 * Set the tree selectable
 * @constructor
 * @param {Tree} tree - Tree
 */
var Selectable = tui.util.defineClass(/** @lends SelectionModule.prototype */{/*eslint-disable*/
    init: function(tree) { /*eslint-enable*/
        this.tree = tree;
        this.selectedClassName = tree.classNames.selectedClass;
        this.handler = tui.util.bind(this.onSingleClick, this);
        this.tree.on('singleClick', this.handler);
    },

    /**
     * Disable this module
     */
    destroy: function() {
        util.removeClass(this.currentSelectedElement, this.selectedClassName);
        this.tree.off(this.handler);
    },

    /**
     * Custom event handler "singleClick"
     * @param {MouseEvent} event - Mouse event
     */
    onSingleClick: function(event) {
        var tree = this.tree,
            target = util.getTarget(event),
            nodeId = tree.getNodeIdFromElement(target),
            nodeElement = document.getElementById(nodeId),
            selectedClassName = this.selectedClassName;

        util.removeClass(this.currentSelectedElement, selectedClassName);
        util.addClass(nodeElement, selectedClassName);
        this.currentSelectedElement = nodeElement;

        tree.fire('select', nodeId);
    }
});

module.exports = Selectable;
},{"./util":9}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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
    Draggable = require('./draggable');

var nodeStates = states.node,
    features = {
        Selectable: Selectable,
        Draggable: Draggable
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
 *     @param {Object} [options.defaultState] A default state of a node
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
 * //Default options
 * //   - HTML TEMPLATE
 * //       - The prefix "d_" represents the data of each node.
 * //       - The "d_children" will be converted to HTML-template
 * //
 * // {
 * //     rootElement: document.createElement('UL'),
 * //     nodeIdPrefix: 'tui-tree-node-'
 * //     defaultState: 'closed',
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
 *     {title: 'rootA', children: [
 *         {title: 'root-1A'},
 *         {title: 'root-1B'},
 *         {title: 'root-1C'},
 *         {title: 'root-1D'},
 *         {title: 'root-2A', children: [
 *             {title:'sub_1A', children:[
 *                 {title:'sub_sub_1A'}
 *             ]},
 *             {title:'sub_2A'}
 *         ]},
 *         {title: 'root-2B'},
 *         {title: 'root-2C'},
 *         {title: 'root-2D'},
 *         {title: 'root-3A', children: [
 *             {title:'sub3_a'},
 *             {title:'sub3_b'}
 *         ]},
 *         {title: 'root-3B'},
 *         {title: 'root-3C'},
 *         {title: 'root-3D'}
 *     ]},
 *     {title: 'rootB', children: [
 *         {title:'B_sub1'},
 *         {title:'B_sub2'},
 *         {title:'b'}
 *     ]}
 * ];
 *
 * var tree1 = new tui.component.Tree(data, {
 *     defaultState: 'opened'
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
         */
        features: {}
    },
    init: function(data, options) { /*eslint-enable*/
        var extend = snippet.extend;
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
     * Set event handlers
     */
    _setEvents: function() {
        this.model.on('update', this._drawChildren, this);
        this.model.on('move', this._onMove, this);
        util.addEventListener(this.rootElement, 'click', snippet.bind(this._onClick, this));
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
     * On click event handler
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
            this.clickTimer = setTimeout(function() {
                self.fire('singleClick', event);
                self.resetClickTimer();
            }, 400);
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
            toggleBtnClassName = this.classNames.toogleBtnClass,
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

        subtreeElement.innerHTML = this._makeHtml(node.getChildIds());
        this.model.each(function(node, nodeId) {
            if (node.getState() === nodeStates.OPENED) {
                this.open(nodeId);
            } else {
                this.close(nodeId);
            }
        }, parentId, this);
    },

    /**
     * Get subtree element
     * @param {string} nodeId - TreeNode id
     * @returns {HTMLElement|undefined} Subtree element or undefined
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
     * @param {HTMLElement} element - HTMLElement
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
     * @returns {string} Prefix of node id
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
     */
    setNodeData: function(nodeId, data) {
        this.model.setNodeData(nodeId, data);
    },

    /**
     * Remove node data
     * @param {string} nodeId - Node id
     * @param {string|Array} names - Names of properties
     */
    removeNodeData: function(nodeId, names) {
        this.model.removeNodeData(nodeId, names)
    },

    /**
     * Open node
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
     * @param {Function} comparator - Comparator for sorting
     */
    sort: function(comparator) {
        this.model.sort(comparator);
        this._drawChildren();
    },

    /**
     * Refresh node
     * @param {string} nodeId - TreeNode id to refresh
     **/
    refresh: function(nodeId) {
        this._drawChildren(nodeId);
    },

    /**
     * Traverse this tree iterating over all nodes.
     * @param {Function} iteratee - Iteratee function
     * @param {object} [context] - Context of iteratee
     */
    each: function(iteratee, context) {
        this.model.each.apply(this, arguments);
    },

    /**
     * Add node(s).
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - The update event will be fired with parent node.
     * @param {Array|object} data - Raw-data
     * @param {*} parentId - Parent id
     */
    add: function(data, parentId) {
        this.model.add(data, parentId);
    },

    /**
     * Remove a node with children.
     * - The update event will be fired with parent node.
     * @param {string} nodeId - Node id to remove
     */
    remove: function(nodeId) {
        this.model.remove(nodeId);
    },

    /**
     * Move a node to new parent
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     */
    move: function(nodeId, newParentId) {
        this.model.move(nodeId, newParentId);
    },

    /**
     * Enable facility of tree
     * @param {string} featureName - 'Selectable', 'Draggable'
     * @param {object} [options] - Feature options
     * @return {Tree} this
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
     * @param {string} featureName - 'Selectable', 'Draggable'
     * @return {Tree} this
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

},{"./defaults":2,"./draggable":3,"./selectable":4,"./states":5,"./treeModel":7,"./util":9}],7:[function(require,module,exports){
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
     * @param {*} parentId - Parent id
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
     * @param {*} nodeId - Node id
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
     * @param {*} id - A node id to find
     * @return {TreeNode|undefined} Node
     */
    getNode: function(id) {
        return this.treeHash[id];
    },

    /**
     * Get depth from node id
     * @param {*} id - A node id to find
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
     * @param {*} parentId - Parent id
     */
    add: function(data, parentId) {
        var parent = this.getNode(parentId) || this.rootNode;

        data = [].concat(data);
        this._makeTreeHash(data, parent);
        this.fire('update', parentId);
    },

    /**
     * Set data properties of a node
     * @param {*} id - Node id
     * @param {object} props - Properties
     */
    setNodeData: function(id, props) {
        var node = this.getNode(id);

        if (!node || !props) {
            return;
        }

        node.setData(props);
        this.fire('update', node.getParentId());
    },

    /**
     * Remove node data
     * @param {string} id - Node id
     * @param {string|Array} names - Names of properties
     */
    removeNodeData: function(id, names) {
        var node = this.getNode(id);

        if (!node || !names) {
            return;
        }

        if (tui.util.isArray(names)) {
            node.removeData.apply(node, names);
        } else {
            node.removeData(names);
        }
        this.fire('update', node.getParentId());
    },

    /**
     * Move a node to new parent's child
     * @param {*} nodeId - Node id
     * @param {*} newParentId - New parent id
     */
    move: function(nodeId, newParentId) {
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

        this.fire('move', nodeId, originalParentId, newParentId);
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

            util.pushAll(stack, node.getChildIds());
        }
    }
});

tui.util.CustomEvents.mixin(TreeModel);
module.exports = TreeModel;

},{"./treeNode":8,"./util":9}],8:[function(require,module,exports){
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
 * @param {number} [parentId] - Parent node id
 */
var TreeNode = tui.util.defineClass(/** @lends TreeNode.prototype */{ /*eslint-disable*/
    static: {
        setIdPrefix: function(prefix) {
            this.idPrefix = prefix || this.idPrefix;
        },
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
         * @type {number}
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
        state += '';
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
     * @returns {number} Node id
     */
    getId: function() {
        return this._id;
    },

    /**
     * Get parent id
     * @returns {number} Parent node id
     */
    getParentId: function() {
        return this._parentId;
    },

    /**
     * Set parent id
     * @param {number} parentId - Parent node id
     */
    setParentId: function(parentId) {
        var isInvalid = (parentId === this._id) || inArray(parentId, this._childIds);

        if (isInvalid) {
            return;
        }
        this._parentId = parentId;
    },

    /**
     * Replace childIds
     * @param {Array.<number>} childIds - Id list of children
     */
    replaceChildIds: function(childIds) {
        var isInvalid = (inArray(this._id, childIds) !== -1) || (inArray(this._parentId, childIds) !== -1)

        if (isInvalid) {
            return;
        }
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
     * @param {number} id - Child node id
     */
    addChildId: function(id) {
        var childIds = this._childIds,
            isInvalid = (id === this._parentId) || (id === this._id);

        if (isInvalid) {
            return;
        }

        if (tui.util.inArray(childIds, id) === -1) {
            childIds.push(id);
        }
    },

    /**
     * Remove child id
     * @param {number} id - Child node id
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
        return tui.util.extend({}, this._data);
    },

    /**
     * Set data
     * @param {Object} data - Data for adding
     */
    setData: function(data) {
        data = this._setReservedProperties(data);
        tui.util.extend(this._data, data)
    },

    /**
     * Remove data
     * @param {...string} names - Names of data
     */
    removeData: function(names) {
        tui.util.forEachArray(arguments, function(name) {
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
        return this._childIds.length === 0;
    },

    /**
     * Return whether this node is root.
     * @returns {boolean} Node is root or not.
     */
    isRoot: function() {
        return tui.util.isFalsy(this._parentId);
    }
});
module.exports = TreeNode;

},{"./states":5,"./util":9}],9:[function(require,module,exports){
/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */
'use strict';
var div = document.createElement('div');

var util = {
    /**
     * Push all elements from new array
     * @param {Array} arr1 - Base array
     * @param {Array} arr2 - New array
     */
    pushAll: function(arr1, arr2) {
        var length = arr2.length,
            i = 0;

        for (; i < length; i += 1) {
            arr1.push(arr2[i]);
        }
    },

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
        return element && element.getAttribute && (element.getAttribute('class') || '');
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
            all = target.getElementsByTagName('*');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9kZWZhdWx0cy5qcyIsInNyYy9qcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy9zdGF0ZXMuanMiLCJzcmMvanMvdHJlZS5qcyIsInNyYy9qcy90cmVlTW9kZWwuanMiLCJzcmMvanMvdHJlZU5vZGUuanMiLCJzcmMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQuVHJlZScsIHJlcXVpcmUoJy4vc3JjL2pzL3RyZWUnKSk7XG4iLCIvKipcbiAqIEEgZGVmYXVsdCB2YWx1ZXMgZm9yIHRyZWVcbiAqIEBtb2R1bGUgZGVmYXVsdHNcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1ha2UgY2xhc3MgbmFtZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgY2xhc3MgbmFtZVxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0ga2V5cyAtIEtleXMgb2YgY2xhc3MgbmFtZXNcbiAqIEByZXR1cm5zIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn0gQ2xhc3NuYW1lcyBtYXBcbiAqL1xuZnVuY3Rpb24gbWFrZUNsYXNzTmFtZXMocHJlZml4LCBrZXlzKSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIHR1aS51dGlsLmZvckVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIG9ialtrZXkgKyAnQ2xhc3MnXSA9IHByZWZpeCArIGtleTtcbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEBjb25zdFxuICogQHR5cGUge29iamVjdH1cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdXNlRHJhZyAtIERlZmF1bHQ6IGZhbHNlXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHVzZUhlbHBlciAtIERlZmF1bHQ6IGZhbHNlXG4gKiBAcHJvcGVydHkge29iamVjdH0gc3RhdGVMYWJlbCAtIFN0YXRlIGxhYmVsIGluIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5vcGVuZWQgLSBEZWZhdWx0OiAnLSdcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5jbG9zZWQgLSBEZWZhdWx0OiAnKydcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSB0ZW1wbGF0ZSAtIFRlbXBsYXRlIGh0bWwgZm9yIHRoZSBub2Rlcy5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBjbGFzc05hbWVzIC0gQ2xhc3MgbmFtZXMgb2YgZWxlbWVudHMgaW4gdHJlZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gb3BlbmVkQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIG9wZW5lZCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBjbG9zZWRDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3IgY2xvc2VkIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IHNlbGVjdGVkQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIHNlbGVjdGVkIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IHN1YnRyZWVDbGFzcyAgLSBBIGNsYXNzIG5hbWUgZm9yIHN1YnRyZWUgaW4gaW50ZXJuYWwgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gdG9nZ2xlQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIHRvZ2dsZSBidXR0b24gaW4gaW50ZXJuYWwgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gdGl0bGVDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3IgdGl0bGUgZWxlbWVudCBpbiBhIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IGlucHV0Q2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIGVkaXRhYmxlIGVsZW1lbnQgaW4gYSBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHRlbXBsYXRlLmludGVybmFsTm9kZSAtIEEgdGVtcGxhdGUgaHRtbCBmb3IgaW50ZXJuYWwgbm9kZS5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUubGVhZk5vZGUgLSBBIHRlbXBsYXRlIGh0bWwgZm9yIGxlYWYgbm9kZS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbm9kZURlZmF1bHRTdGF0ZTogJ2Nsb3NlZCcsXG4gICAgc3RhdGVMYWJlbHM6IHtcbiAgICAgICAgb3BlbmVkOiAnLScsXG4gICAgICAgIGNsb3NlZDogJysnXG4gICAgfSxcbiAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLScsXG4gICAgY2xhc3NOYW1lczogbWFrZUNsYXNzTmFtZXMoJ3R1aS10cmVlLScsIFtcbiAgICAgICAgJ29wZW5lZCcsXG4gICAgICAgICdjbG9zZWQnLFxuICAgICAgICAnc2VsZWN0ZWQnLFxuICAgICAgICAnc3VidHJlZScsXG4gICAgICAgICd0b2dnbGVCdG4nLFxuICAgICAgICAndGV4dCcsXG4gICAgICAgICdpbnB1dCdcbiAgICBdKSxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICBpbnRlcm5hbE5vZGU6XG4gICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInR1aS10cmVlLW5vZGUge3tzdGF0ZUNsYXNzfX1cIj4nICtcbiAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7c3RhdGVMYWJlbH19PC9idXR0b24+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+JyArXG4gICAgICAgICc8L2xpPicsXG4gICAgICAgIGxlYWZOb2RlOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ0dWktdHJlZS1ub2RlIHR1aS10cmVlLWxlYWZcIj4nICtcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAgICAgICAgJzwvbGk+J1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgIHVzZUhlbHBlcjogdHJ1ZSxcbiAgICAgICAgaGVscGVyUG9zOiB7XG4gICAgICAgICAgICB5OiAxMCxcbiAgICAgICAgICAgIHg6IDEwXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlamVjdGVkVGFnTmFtZXMgPSBbXG4gICAgICAgICdJTlBVVCcsXG4gICAgICAgICdCVVRUT04nXG4gICAgXSxcbiAgICBpbkFycmF5ID0gdHVpLnV0aWwuaW5BcnJheTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgZHJhZ2dhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9uc1xuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VIZWxwZXIgLSBVc2luZyBoZWxwZXIgZmxhZ1xuICogIEBwYXJhbSB7e3g6IG51bWJlciwgeTpudW1iZXJ9fSBvcHRpb25zLmhlbHBlclBvcyAtIEhlbHBlciBwb3NpdGlvblxuICogIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG9wdGlvbnMucmVqZWN0ZWRUYWdOYW1lcyAtIE5vIGRyYWdnYWJsZSB0YWcgbmFtZXNcbiAqICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkQ2xhc3NOYW1lcyAtIE5vIGRyYWdnYWJsZSBjbGFzcyBuYW1lc1xuICovXG52YXIgRHJhZ2dhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBEcmFnZ2FibGUucHJvdG90eXBlICove1xuICAgIC8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5zZXRNZW1iZXJzKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmF0dGFjaE1vdXNlZG93bigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbWVtYmVycyBvZiB0aGlzIG1vZHVsZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gaW5wdXQgb3B0aW9uc1xuICAgICAqL1xuICAgIHNldE1lbWJlcnM6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGhlbHBlckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyksXG4gICAgICAgICAgICBzdHlsZSA9IGhlbHBlckVsZW1lbnQuc3R5bGU7XG4gICAgICAgIG9wdGlvbnMgPSB0dWkudXRpbC5leHRlbmQoe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnVzZUhlbHBlciA9IG9wdGlvbnMudXNlSGVscGVyO1xuICAgICAgICB0aGlzLmhlbHBlclBvcyA9IG9wdGlvbnMuaGVscGVyUG9zO1xuICAgICAgICB0aGlzLnJlamVjdGVkVGFnTmFtZXMgPSByZWplY3RlZFRhZ05hbWVzLmNvbmNhdChvcHRpb25zLnJlamVjdGVkVGFnTmFtZXMpO1xuICAgICAgICB0aGlzLnJlamVjdGVkQ2xhc3NOYW1lcyA9IFtdLmNvbmNhdChvcHRpb25zLnJlamVjdGVkQ2xhc3NOYW1lcyk7XG4gICAgICAgIHRoaXMuZGVmYXVsdFBvc2l0aW9uID0gdHJlZS5yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gaGVscGVyRWxlbWVudDtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbnVsbDtcblxuICAgICAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gICAgICAgIHRoaXMuaGFuZGxlcnMubW91c2Vkb3duID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uTW91c2Vkb3duLCB0aGlzKTtcbiAgICAgICAgdGhpcy5oYW5kbGVycy5tb3VzZW1vdmUgPSB0dWkudXRpbC5iaW5kKHRoaXMub25Nb3VzZW1vdmUsIHRoaXMpO1xuICAgICAgICB0aGlzLmhhbmRsZXJzLm1vdXNldXAgPSB0dWkudXRpbC5iaW5kKHRoaXMub25Nb3VzZXVwLCB0aGlzKTtcblxuICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGhlbHBlckVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggbW91c2UgZG93biBldmVudFxuICAgICAqL1xuICAgIGF0dGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgc2VsZWN0S2V5LCBzdHlsZTtcblxuICAgICAgICBpZiAoJ29uc2VsZWN0c3RhcnQnIGluIGRvY3VtZW50KSB7XG4gICAgICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodHJlZS5yb290RWxlbWVudCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcbiAgICAgICAgICAgIHNlbGVjdEtleSA9IHV0aWwudGVzdFByb3AoWyd1c2VyU2VsZWN0JywgJ1dlYmtpdFVzZXJTZWxlY3QnLCAnT1VzZXJTZWxlY3QnLCAnTW96VXNlclNlbGVjdCcsICdtc1VzZXJTZWxlY3QnXSk7XG5cbiAgICAgICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5ID0gc2VsZWN0S2V5O1xuICAgICAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZSA9IHN0eWxlW3NlbGVjdEtleV07XG4gICAgICAgICAgICBzdHlsZVtzZWxlY3RLZXldID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0cmVlLnJvb3RFbGVtZW50LCAnbW91c2Vkb3duJywgdGhpcy5oYW5kbGVycy5tb3VzZWRvd24pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgaW4gcmVqZWN0ZWRUYWdOYW1lcyBvciBpbiByZWplY3RlZENsYXNzTmFtZXNcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSB0YXJnZXQgaXMgbm90IGRyYWdnYWJsZSBvciBkcmFnZ2FibGVcbiAgICAgKi9cbiAgICBpc05vdERyYWdnYWJsZTogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIHZhciB0YWdOYW1lID0gdGFyZ2V0LnRhZ05hbWUudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB1dGlsLmdldENsYXNzKHRhcmdldCkuc3BsaXQoJyAnKSxcbiAgICAgICAgICAgIHJlc3VsdDtcblxuICAgICAgICBpZiAoaW5BcnJheSh0YWdOYW1lLCB0aGlzLnJlamVjdGVkVGFnTmFtZXMpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKGNsYXNzTmFtZXMsIGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gaW5BcnJheShjbGFzc05hbWUsIHRoaXMucmVqZWN0ZWRDbGFzc05hbWVzKSAhPT0gLTE7XG4gICAgICAgICAgICByZXR1cm4gIXJlc3VsdDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2Vkb3duOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgbm9kZUlkO1xuXG4gICAgICAgIGlmICh1dGlsLmlzUmlnaHRCdXR0b24oZXZlbnQpIHx8IHRoaXMuaXNOb3REcmFnZ2FibGUodGFyZ2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHV0aWwucHJldmVudERlZmF1bHQoZXZlbnQpO1xuXG4gICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICAgICAgbm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuICAgICAgICB0aGlzLmN1cnJlbnROb2RlSWQgPSBub2RlSWQ7XG4gICAgICAgIGlmICh0aGlzLnVzZUhlbHBlcikge1xuICAgICAgICAgICAgdGhpcy5zZXRIZWxwZXIodGFyZ2V0LmlubmVyVGV4dCB8fCB0YXJnZXQudGV4dENvbnRlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5oYW5kbGVycy5tb3VzZW1vdmUpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5oYW5kbGVycy5tb3VzZXVwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlbW92ZVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2Vtb3ZlOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgaGVscGVyRWwgPSB0aGlzLmhlbHBlckVsZW1lbnQsXG4gICAgICAgICAgICBwb3MgPSB0aGlzLmRlZmF1bHRQb3NpdGlvbjtcbiAgICAgICAgaWYgKCF0aGlzLnVzZUhlbHBlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaGVscGVyRWwuc3R5bGUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBwb3MubGVmdCArIHRoaXMuaGVscGVyUG9zLnggKyAncHgnO1xuICAgICAgICBoZWxwZXJFbC5zdHlsZS50b3AgPSBldmVudC5jbGllbnRZIC0gcG9zLnRvcCArIHRoaXMuaGVscGVyUG9zLnkgKyAncHgnO1xuICAgICAgICBoZWxwZXJFbC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZXVwXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25Nb3VzZXVwOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdHJlZS5tb3ZlKHRoaXMuY3VycmVudE5vZGVJZCwgbm9kZUlkKTtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbnVsbDtcblxuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZXJzLm1vdXNlbW92ZSk7XG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLmhhbmRsZXJzLm1vdXNldXApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgaGVscGVyIGNvbnRlbnRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBIZWxwZXIgY29udGVudHNcbiAgICAgKi9cbiAgICBzZXRIZWxwZXI6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LmlubmVySFRNTCA9IHRleHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGFjaCBtb3VzZWRvd24gZXZlbnRcbiAgICAgKi9cbiAgICBkZXRhY2hNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcblxuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHJlZS5yb290RWxlbWVudCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0cmVlLnJvb3RFbGVtZW50LCAnbW91c2Vkb3duJywgdGhpcy5oYW5kbGVycy5tb3VzZWRvd24pO1xuICAgICAgICBpZiAodGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZVt0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleV0gPSB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5kZXRhY2hNb3VzZWRvd24oKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnZ2FibGU7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICovXG52YXIgU2VsZWN0YWJsZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgU2VsZWN0aW9uTW9kdWxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUgPSB0cmVlLmNsYXNzTmFtZXMuc2VsZWN0ZWRDbGFzcztcbiAgICAgICAgdGhpcy5oYW5kbGVyID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uU2luZ2xlQ2xpY2ssIHRoaXMpO1xuICAgICAgICB0aGlzLnRyZWUub24oJ3NpbmdsZUNsaWNrJywgdGhpcy5oYW5kbGVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSB0aGlzIG1vZHVsZVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuY3VycmVudFNlbGVjdGVkRWxlbWVudCwgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcy5oYW5kbGVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgXCJzaW5nbGVDbGlja1wiXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25TaW5nbGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCksXG4gICAgICAgICAgICBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCksXG4gICAgICAgICAgICBzZWxlY3RlZENsYXNzTmFtZSA9IHRoaXMuc2VsZWN0ZWRDbGFzc05hbWU7XG5cbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmN1cnJlbnRTZWxlY3RlZEVsZW1lbnQsIHNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB0aGlzLmN1cnJlbnRTZWxlY3RlZEVsZW1lbnQgPSBub2RlRWxlbWVudDtcblxuICAgICAgICB0cmVlLmZpcmUoJ3NlbGVjdCcsIG5vZGVJZCk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0YWJsZTsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgU3RhdGVzIGluIHRyZWVcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogU3RhdGVzIGluIHRyZWVcbiAqIEBtb2R1bGUgc3RhdGVzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIFN0YXRlcyBvZiBub2RlXG4gICAgICogQHR5cGUge3tPUEVORUQ6IHN0cmluZywgQ0xPU0VEOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIG5vZGU6IHtcbiAgICAgICAgT1BFTkVEOiAnb3BlbmVkJyxcbiAgICAgICAgQ0xPU0VEOiAnY2xvc2VkJ1xuICAgIH1cbn07XG4iLCIvKipcclxuICogQGZpbGVvdmVydmlldyBSZW5kZXIgdHJlZSBhbmQgdXBkYXRlIHRyZWUuXHJcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuL2RlZmF1bHRzJyksXHJcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXHJcbiAgICBzdGF0ZXMgPSByZXF1aXJlKCcuL3N0YXRlcycpLFxyXG4gICAgVHJlZU1vZGVsID0gcmVxdWlyZSgnLi90cmVlTW9kZWwnKSxcclxuICAgIFNlbGVjdGFibGUgPSByZXF1aXJlKCcuL3NlbGVjdGFibGUnKSxcclxuICAgIERyYWdnYWJsZSA9IHJlcXVpcmUoJy4vZHJhZ2dhYmxlJyk7XHJcblxyXG52YXIgbm9kZVN0YXRlcyA9IHN0YXRlcy5ub2RlLFxyXG4gICAgZmVhdHVyZXMgPSB7XHJcbiAgICAgICAgU2VsZWN0YWJsZTogU2VsZWN0YWJsZSxcclxuICAgICAgICBEcmFnZ2FibGU6IERyYWdnYWJsZVxyXG4gICAgfSxcclxuICAgIHNuaXBwZXQgPSB0dWkudXRpbCxcclxuICAgIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kO1xyXG4vKipcclxuICogQ3JlYXRlIHRyZWUgbW9kZWwgYW5kIGluamVjdCBkYXRhIHRvIG1vZGVsXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBBIGRhdGEgdG8gYmUgdXNlZCBvbiB0cmVlXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zXHJcbiAqICAgICBAcGFyYW0ge0hUTUxFbGVtZW50fSBbb3B0aW9ucy5yb290RWxlbWVudF0gUm9vdCBlbGVtZW50IChJdCBzaG91bGQgYmUgJ1VMJyBlbGVtZW50KVxyXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLm5vZGVJZFByZWZpeF0gQSBkZWZhdWx0IHByZWZpeCBvZiBhIG5vZGVcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5kZWZhdWx0U3RhdGVdIEEgZGVmYXVsdCBzdGF0ZSBvZiBhIG5vZGVcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy50ZW1wbGF0ZV0gQSBtYXJrdXAgc2V0IHRvIG1ha2UgZWxlbWVudFxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGVdIEhUTUwgdGVtcGxhdGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGUubGVhZk5vZGVdIEhUTUwgdGVtcGxhdGVcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5zdGF0ZUxhYmVsc10gVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5vcGVuZWRdIFN0YXRlLU9QRU5FRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5jbG9zZWRdIFN0YXRlLUNMT1NFRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxyXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmNsYXNzTmFtZXNdIENsYXNzIG5hbWVzIGZvciB0cmVlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMub3BlbmVkQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igb3BlbmVkIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5jbG9zZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBjbG9zZWQgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnNlbGVjdGVkQ2xhc3NdIEEgY2xhc3MgbmFtZSB0byBzZWxlY3RlZCBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudGV4dENsYXNzXSBBIGNsYXNzIG5hbWUgdGhhdCBmb3IgdGV4dEVsZW1lbnQgaW4gbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLmlucHV0Q2xhc3NdIEEgY2xhc3MgaW5wdXQgZWxlbWVudCBpbiBhIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igc3VidHJlZSBpbiBpbnRlcm5hbCBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgdG9nZ2xlIGJ1dHRvbiBpbiBpbnRlcm5hbCBub2RlXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRGVmYXVsdCBvcHRpb25zXHJcbiAqIC8vICAgLSBIVE1MIFRFTVBMQVRFXHJcbiAqIC8vICAgICAgIC0gVGhlIHByZWZpeCBcImRfXCIgcmVwcmVzZW50cyB0aGUgZGF0YSBvZiBlYWNoIG5vZGUuXHJcbiAqIC8vICAgICAgIC0gVGhlIFwiZF9jaGlsZHJlblwiIHdpbGwgYmUgY29udmVydGVkIHRvIEhUTUwtdGVtcGxhdGVcclxuICogLy9cclxuICogLy8ge1xyXG4gKiAvLyAgICAgcm9vdEVsZW1lbnQ6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1VMJyksXHJcbiAqIC8vICAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLSdcclxuICogLy8gICAgIGRlZmF1bHRTdGF0ZTogJ2Nsb3NlZCcsXHJcbiAqIC8vICAgICBzdGF0ZUxhYmVsczoge1xyXG4gKiAvLyAgICAgICAgIG9wZW5lZDogJy0nLFxyXG4gKiAvLyAgICAgICAgIGNsb3NlZDogJysnXHJcbiAqIC8vICAgICB9LFxyXG4gKiAvLyAgICAgY2xhc3NOYW1lczoge1xyXG4gKiAvLyAgICAgICAgIG9wZW5lZENsYXNzOiAndHVpLXRyZWUtb3BlbmVkJyxcclxuICogLy8gICAgICAgICBjbG9zZWRDbGFzczogJ3R1aS10cmVlLWNsb3NlZCcsXHJcbiAqIC8vICAgICAgICAgc2VsZWN0ZWRDbGFzczogJ3R1aS10cmVlLXNlbGVjdGVkJyxcclxuICogLy8gICAgICAgICBzdWJ0cmVlQ2xhc3M6ICd0dWktdHJlZS1zdWJ0cmVlJyxcclxuICogLy8gICAgICAgICB0b2dnbGVCdG5DbGFzczogJ3R1aS10cmVlLXRvZ2dsZUJ0bicsXHJcbiAqIC8vICAgICAgICAgdGV4dENsYXNzOiAndHVpLXRyZWUtdGV4dCcsXHJcbiAqIC8vICAgICAgICAgaXVwdXRDbGFzczogJ3R1aS10cmVlLWlucHV0J1xyXG4gKiAvLyAgICAgfSxcclxuICogLy9cclxuICogLy8gICAgIHRlbXBsYXRlOiB7XHJcbiAqIC8vICAgICAgICAgaW50ZXJuYWxOb2RlOlxyXG4gKiAvLyAgICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInR1aS10cmVlLW5vZGUge3tzdGF0ZUNsYXNzfX1cIiBkYXRhLW5vZGUtaWQ9XCJ7e2lkfX1cIj4nICtcclxuICogLy8gICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3tzdGF0ZUxhYmVsfX08L2J1dHRvbj4nICtcclxuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+JyArXHJcbiAqIC8vICAgICAgICAgJzwvbGk+JyxcclxuICogLy8gICAgICAgICBsZWFmTm9kZTpcclxuICogLy8gICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ0dWktdHJlZS1ub2RlIHR1aS10cmVlLWxlYWZcIiBkYXRhLW5vZGUtaWQ9XCJ7e2lkfX1cIj4nICtcclxuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xyXG4gKiAvLyAgICAgICAgICc8L2xpPidcclxuICogLy8gICAgIH1cclxuICogLy8gfVxyXG4gKiAvL1xyXG4gKlxyXG4gKiB2YXIgZGF0YSA9IFtcclxuICogICAgIHt0aXRsZTogJ3Jvb3RBJywgY2hpbGRyZW46IFtcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTFBJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0xQid9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMUMnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTFEJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0yQScsIGNoaWxkcmVuOiBbXHJcbiAqICAgICAgICAgICAgIHt0aXRsZTonc3ViXzFBJywgY2hpbGRyZW46W1xyXG4gKiAgICAgICAgICAgICAgICAge3RpdGxlOidzdWJfc3ViXzFBJ31cclxuICogICAgICAgICAgICAgXX0sXHJcbiAqICAgICAgICAgICAgIHt0aXRsZTonc3ViXzJBJ31cclxuICogICAgICAgICBdfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTJCJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0yQyd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMkQnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTNBJywgY2hpbGRyZW46IFtcclxuICogICAgICAgICAgICAge3RpdGxlOidzdWIzX2EnfSxcclxuICogICAgICAgICAgICAge3RpdGxlOidzdWIzX2InfVxyXG4gKiAgICAgICAgIF19LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtM0InfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTNDJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0zRCd9XHJcbiAqICAgICBdfSxcclxuICogICAgIHt0aXRsZTogJ3Jvb3RCJywgY2hpbGRyZW46IFtcclxuICogICAgICAgICB7dGl0bGU6J0Jfc3ViMSd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTonQl9zdWIyJ30sXHJcbiAqICAgICAgICAge3RpdGxlOidiJ31cclxuICogICAgIF19XHJcbiAqIF07XHJcbiAqXHJcbiAqIHZhciB0cmVlMSA9IG5ldyB0dWkuY29tcG9uZW50LlRyZWUoZGF0YSwge1xyXG4gKiAgICAgZGVmYXVsdFN0YXRlOiAnb3BlbmVkJ1xyXG4gKiB9KTtcclxuICoqL1xyXG52YXIgVHJlZSA9IHNuaXBwZXQuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXHJcbiAgICBzdGF0aWM6IHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAbWVtYmVyT2YgVHJlZVxyXG4gICAgICAgICAqIEBzdGF0aWNcclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbW9kdWxlTmFtZSAtIE1vZHVsZSBuYW1lXHJcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IG1vZHVsZSAtIE1vZHVsZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHJlZ2lzdGVyRmVhdHVyZTogZnVuY3Rpb24obW9kdWxlTmFtZSwgbW9kdWxlKSB7XHJcbiAgICAgICAgICAgIGlmIChtb2R1bGUpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mZWF0dXJlc1ttb2R1bGVOYW1lXSA9IG1vZHVsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRyZWUgZmVhdHVyZXNcclxuICAgICAgICAgKi9cclxuICAgICAgICBmZWF0dXJlczoge31cclxuICAgIH0sXHJcbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXHJcbiAgICAgICAgdmFyIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kO1xyXG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCBjbGFzcyBuYW1lc1xyXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNsYXNzTmFtZXMgPSBleHRlbmQoe30sIGRlZmF1bHRzLmNsYXNzTmFtZXMsIG9wdGlvbnMuY2xhc3NOYW1lcyk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERlZmF1bHQgdGVtcGxhdGVcclxuICAgICAgICAgKiBAdHlwZSB7e2ludGVybmFsTm9kZTogc3RyaW5nLCBsZWFmTm9kZTogc3RyaW5nfX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRlbXBsYXRlID0gZXh0ZW5kKHt9LCBkZWZhdWx0cy50ZW1wbGF0ZSwgb3B0aW9ucy50ZW1wbGF0ZSk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJvb3QgZWxlbWVudFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gb3B0aW9ucy5yb290RWxlbWVudDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxyXG4gICAgICAgICAqIEB0eXBlIHt7b3BlbmVkOiBzdHJpbmcsIGNsb3NlZDogc3RyaW5nfX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN0YXRlTGFiZWxzID0gb3B0aW9ucy5zdGF0ZUxhYmVscztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogTWFrZSB0cmVlIG1vZGVsXHJcbiAgICAgICAgICogQHR5cGUge1RyZWVNb2RlbH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFRyZWVNb2RlbChkYXRhLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRW5hYmxlZCBmZWF0dXJlc1xyXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgb2JqZWN0Pn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmVuYWJsZWRGZWF0dXJlcyA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLl9zZXRSb290KCk7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKCk7XHJcbiAgICAgICAgdGhpcy5fc2V0RXZlbnRzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHJvb3QgZWxlbWVudCBvZiB0cmVlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc2V0Um9vdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHJvb3RFbCA9IHRoaXMucm9vdEVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmICghc25pcHBldC5pc0hUTUxOb2RlKHJvb3RFbCkpIHtcclxuICAgICAgICAgICAgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1VMJyk7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdEVsKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGV2ZW50IGhhbmRsZXJzXHJcbiAgICAgKi9cclxuICAgIF9zZXRFdmVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwub24oJ3VwZGF0ZScsIHRoaXMuX2RyYXdDaGlsZHJlbiwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5vbignbW92ZScsIHRoaXMuX29uTW92ZSwgdGhpcyk7XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdjbGljaycsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkNsaWNrLCB0aGlzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTW92ZSBldmVudCBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9yaWdpbmFsUGFyZW50SWQgLSBPcmlnaW5hbCBwYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25Nb3ZlOiBmdW5jdGlvbihub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkKSB7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKG9yaWdpbmFsUGFyZW50SWQpO1xyXG4gICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbihuZXdQYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT24gY2xpY2sgZXZlbnQgaGFuZGxlclxyXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIENsaWNrIGV2ZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25DbGljazogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxyXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHV0aWwuaXNSaWdodEJ1dHRvbihldmVudCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzcykpIHtcclxuICAgICAgICAgICAgdGhpcy50b2dnbGUodGhpcy5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jbGlja1RpbWVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnZG91YmxlQ2xpY2snLCBldmVudCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVzZXRDbGlja1RpbWVyKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZmlyZSgnc2luZ2xlQ2xpY2snLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnJlc2V0Q2xpY2tUaW1lcigpO1xyXG4gICAgICAgICAgICB9LCA0MDApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbm9kZSBzdGF0ZSAtIG9wZW5lZCBvciBjbG9zZWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOb2RlIHN0YXRlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc2V0RGlzcGxheUZyb21Ob2RlU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcclxuICAgICAgICB2YXIgc3VidHJlZUVsZW1lbnQgPSB0aGlzLl9nZXRTdWJ0cmVlRWxlbWVudChub2RlSWQpLFxyXG4gICAgICAgICAgICB0b2dnbGVCdG5DbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZXMudG9vZ2xlQnRuQ2xhc3MsXHJcbiAgICAgICAgICAgIGxhYmVsLCBidG5FbGVtZW50LCBub2RlRWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKCFzdWJ0cmVlRWxlbWVudCB8fCBzdWJ0cmVlRWxlbWVudCA9PT0gdGhpcy5yb290RWxlbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxhYmVsID0gdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV07XHJcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xyXG4gICAgICAgIGJ0bkVsZW1lbnQgPSB1dGlsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUobm9kZUVsZW1lbnQsIHRvZ2dsZUJ0bkNsYXNzTmFtZSlbMF07XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbm9kZVN0YXRlcy5PUEVORUQpIHtcclxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGUobm9kZUVsZW1lbnQsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgaWYgKGJ0bkVsZW1lbnQpIHtcclxuICAgICAgICAgICAgYnRuRWxlbWVudC5pbm5lckhUTUwgPSBsYWJlbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IG5vZGUgY2xhc3MgbmFtZSBmcm9tIHByb3ZpZGVkIHN0YXRlXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlRWxlbWVudCAtIFRyZWVOb2RlIGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIE5ldyBjaGFuZ2VkIHN0YXRlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc2V0Tm9kZUNsYXNzTmFtZUZyb21TdGF0ZTogZnVuY3Rpb24obm9kZUVsZW1lbnQsIHN0YXRlKSB7XHJcbiAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXMsXHJcbiAgICAgICAgICAgIG9wZW5lZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5PUEVORUQgKyAnQ2xhc3MnXSxcclxuICAgICAgICAgICAgY2xvc2VkQ2xhc3NOYW1lID0gY2xhc3NOYW1lc1tub2RlU3RhdGVzLkNMT1NFRCArICdDbGFzcyddO1xyXG5cclxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBvcGVuZWRDbGFzc05hbWUpO1xyXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Mobm9kZUVsZW1lbnQsIGNsb3NlZENsYXNzTmFtZSk7XHJcbiAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgY2xhc3NOYW1lc1tzdGF0ZSArICdDbGFzcyddKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIGh0bWxcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG5vZGVJZHMgLSBOb2RlIGlkIGxpc3RcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUxcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9tYWtlSHRtbDogZnVuY3Rpb24obm9kZUlkcykge1xyXG4gICAgICAgIHZhciBtb2RlbCA9IHRoaXMubW9kZWwsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXMsXHJcbiAgICAgICAgICAgIHN0YXRlTGFiZWxzID0gdGhpcy5zdGF0ZUxhYmVscyxcclxuICAgICAgICAgICAgdGVtcGxhdGVTb3VyY2UgPSB0aGlzLnRlbXBsYXRlLFxyXG4gICAgICAgICAgICBodG1sID0gJyc7XHJcblxyXG4gICAgICAgIHNuaXBwZXQuZm9yRWFjaChub2RlSWRzLCBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICAgICAgdmFyIG5vZGUgPSBtb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKSxcclxuICAgICAgICAgICAgICAgIG5vZGVEYXRhID0gbm9kZS5nZXRBbGxEYXRhKCksXHJcbiAgICAgICAgICAgICAgICBwcm9wcyA9IGV4dGVuZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IG5vZGVJZFxyXG4gICAgICAgICAgICAgICAgfSwgY2xhc3NOYW1lcywgbm9kZURhdGEpLFxyXG4gICAgICAgICAgICAgICAgbm9kZVRlbXBsYXRlO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcclxuICAgICAgICAgICAgICAgIG5vZGVUZW1wbGF0ZSA9IHRlbXBsYXRlU291cmNlLmxlYWZOb2RlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbm9kZVRlbXBsYXRlID0gdGVtcGxhdGVTb3VyY2UuaW50ZXJuYWxOb2RlO1xyXG4gICAgICAgICAgICAgICAgcHJvcHMuc3RhdGVDbGFzcyA9IGNsYXNzTmFtZXNbc3RhdGUrJ0NsYXNzJ107XHJcbiAgICAgICAgICAgICAgICBwcm9wcy5zdGF0ZUxhYmVsID0gc3RhdGVMYWJlbHNbc3RhdGVdO1xyXG4gICAgICAgICAgICAgICAgcHJvcHMuY2hpbGRyZW4gPSB0aGlzLl9tYWtlSHRtbChub2RlLmdldENoaWxkSWRzKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGh0bWwgKz0gdXRpbC50ZW1wbGF0ZShub2RlVGVtcGxhdGUsIHByb3BzKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICByZXR1cm4gaHRtbDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEcmF3IHRyZWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gUGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9kcmF3Q2hpbGRyZW46IGZ1bmN0aW9uKHBhcmVudElkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUocGFyZW50SWQpLFxyXG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLm1vZGVsLnJvb3ROb2RlO1xyXG4gICAgICAgICAgICBwYXJlbnRJZCA9IG5vZGUuZ2V0SWQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB0aGlzLl9nZXRTdWJ0cmVlRWxlbWVudChwYXJlbnRJZCk7XHJcbiAgICAgICAgaWYgKCFzdWJ0cmVlRWxlbWVudCkge1xyXG4gICAgICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4obm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3VidHJlZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5fbWFrZUh0bWwobm9kZS5nZXRDaGlsZElkcygpKTtcclxuICAgICAgICB0aGlzLm1vZGVsLmVhY2goZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlLmdldFN0YXRlKCkgPT09IG5vZGVTdGF0ZXMuT1BFTkVEKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4obm9kZUlkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2Uobm9kZUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHBhcmVudElkLCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgc3VidHJlZSBlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVHJlZU5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudHx1bmRlZmluZWR9IFN1YnRyZWUgZWxlbWVudCBvciB1bmRlZmluZWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9nZXRTdWJ0cmVlRWxlbWVudDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgc3VidHJlZUNsYXNzTmFtZSwgbm9kZUVsZW1lbnQsIHN1YnRyZWVFbGVtZW50O1xyXG4gICAgICAgIGlmICghbm9kZSB8fCBub2RlLmlzTGVhZigpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJvb3RFbGVtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3VidHJlZUNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lc1snc3VidHJlZUNsYXNzJ107XHJcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmdldElkKCkpO1xyXG4gICAgICAgIHN1YnRyZWVFbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKG5vZGVFbGVtZW50LCBzdWJ0cmVlQ2xhc3NOYW1lKVswXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN1YnRyZWVFbGVtZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiByb290IG5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJvb3Qgbm9kZSBpZFxyXG4gICAgICovXHJcbiAgICBnZXRSb290Tm9kZUlkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5yb290Tm9kZS5nZXRJZCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBjaGlsZCBpZHNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz58dW5kZWZpbmVkfSBDaGlsZCBpZHNcclxuICAgICAqL1xyXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldENoaWxkSWRzKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIHBhcmVudCBpZCBvZiBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0UGFyZW50SWQobm9kZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNldCBjbGljayB0aW1lclxyXG4gICAgICovXHJcbiAgICByZXNldENsaWNrVGltZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5jbGlja1RpbWVyKTtcclxuICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBub2RlIGlkIGZyb20gZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIEhUTUxFbGVtZW50XHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBOb2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBnZXROb2RlSWRGcm9tRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgIHZhciBpZFByZWZpeCA9IHRoaXMuZ2V0Tm9kZUlkUHJlZml4KCk7XHJcblxyXG4gICAgICAgIHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQuaWQuaW5kZXhPZihpZFByZWZpeCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQuaWQgOiAnJztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgcHJlZml4IG9mIG5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFByZWZpeCBvZiBub2RlIGlkXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Tm9kZUlkUHJlZml4KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IG5vZGUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtvYmplY3R8dW5kZWZpbmVkfSBOb2RlIGRhdGFcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVEYXRhKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFByb3BlcnRpZXNcclxuICAgICAqL1xyXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCwgZGF0YSkge1xyXG4gICAgICAgIHRoaXMubW9kZWwuc2V0Tm9kZURhdGEobm9kZUlkLCBkYXRhKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xyXG4gICAgICovXHJcbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBuYW1lcykge1xyXG4gICAgICAgIHRoaXMubW9kZWwucmVtb3ZlTm9kZURhdGEobm9kZUlkLCBuYW1lcylcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcGVuIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKi9cclxuICAgIG9wZW46IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5PUEVORUQ7XHJcblxyXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xvc2Ugbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgY2xvc2U6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5DTE9TRUQ7XHJcblxyXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG9nZ2xlIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICoqL1xyXG4gICAgdG9nZ2xlOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICBzdGF0ZTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcclxuICAgICAgICAgICAgbm9kZS50b2dnbGVTdGF0ZSgpO1xyXG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNvcnQgYWxsIG5vZGVzXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIC0gQ29tcGFyYXRvciBmb3Igc29ydGluZ1xyXG4gICAgICovXHJcbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5zb3J0KGNvbXBhcmF0b3IpO1xyXG4gICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbigpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZnJlc2ggbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFRyZWVOb2RlIGlkIHRvIHJlZnJlc2hcclxuICAgICAqKi9cclxuICAgIHJlZnJlc2g6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbihub2RlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgbm9kZXMuXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxyXG4gICAgICovXHJcbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgY29udGV4dCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwuZWFjaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZCBub2RlKHMpLlxyXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXHJcbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxyXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxyXG4gICAgICogQHBhcmFtIHsqfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5hZGQoZGF0YSwgcGFyZW50SWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhIG5vZGUgd2l0aCBjaGlsZHJlbi5cclxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZCB0byByZW1vdmVcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZShub2RlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXHJcbiAgICAgKi9cclxuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLm1vdmUobm9kZUlkLCBuZXdQYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlIGZhY2lsaXR5IG9mIHRyZWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtICdTZWxlY3RhYmxlJywgJ0RyYWdnYWJsZSdcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBGZWF0dXJlIG9wdGlvbnNcclxuICAgICAqIEByZXR1cm4ge1RyZWV9IHRoaXNcclxuICAgICAqL1xyXG4gICAgZW5hYmxlRmVhdHVyZTogZnVuY3Rpb24oZmVhdHVyZU5hbWUsIG9wdGlvbnMpIHtcclxuICAgICAgICB2YXIgRmVhdHVyZSA9IFRyZWUuZmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xyXG5cclxuICAgICAgICB0aGlzLmRpc2FibGVGZWF0dXJlKGZlYXR1cmVOYW1lKTtcclxuICAgICAgICBpZiAoRmVhdHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV0gPSBuZXcgRmVhdHVyZSh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzYWJsZSBmYWNpbGl0eSBvZiB0cmVlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnXHJcbiAgICAgKiBAcmV0dXJuIHtUcmVlfSB0aGlzXHJcbiAgICAgKi9cclxuICAgIGRpc2FibGVGZWF0dXJlOiBmdW5jdGlvbihmZWF0dXJlTmFtZSkge1xyXG4gICAgICAgIHZhciBmZWF0dXJlID0gdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xyXG5cclxuICAgICAgICBpZiAoZmVhdHVyZSkge1xyXG4gICAgICAgICAgICBmZWF0dXJlLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufSk7XHJcblxyXG50dWkudXRpbC5mb3JFYWNoKGZlYXR1cmVzLCBmdW5jdGlvbihGZWF0dXJlLCBuYW1lKSB7XHJcbiAgICBUcmVlLnJlZ2lzdGVyRmVhdHVyZShuYW1lLCBGZWF0dXJlKTtcclxufSk7XHJcbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihUcmVlKTtcclxubW9kdWxlLmV4cG9ydHMgPSBUcmVlO1xyXG4iLCIvKipcclxuICogQGZpbGVvdmVydmlldyBVcGRhdGUgdmlldyBhbmQgY29udHJvbCB0cmVlIGRhdGFcclxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFRyZWVOb2RlID0gcmVxdWlyZSgnLi90cmVlTm9kZScpLFxyXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xyXG5cclxudmFyIHNuaXBwZXQgPSB0dWkudXRpbCxcclxuICAgIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kLFxyXG4gICAga2V5cyA9IHNuaXBwZXQua2V5cyxcclxuICAgIGZvckVhY2ggPSBzbmlwcGV0LmZvckVhY2gsXHJcbiAgICBtYXAgPSBzbmlwcGV0Lm1hcCxcclxuICAgIGZpbHRlciA9IHNuaXBwZXQuZmlsdGVyLFxyXG4gICAgaW5BcnJheSA9IHNuaXBwZXQuaW5BcnJheTtcclxuXHJcbi8qKlxyXG4gKiBUcmVlIG1vZGVsXHJcbiAqIEBjb25zdHJ1Y3RvciBUcmVlTW9kZWxcclxuICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIERhdGFcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zIGZvciBkZWZhdWx0U3RhdGUgYW5kIG5vZGVJZFByZWZpeFxyXG4gKiovXHJcbnZhciBUcmVlTW9kZWwgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVNb2RlbC5wcm90b3R5cGUgKi97IC8qIGVzbGludC1kaXNhYmxlICovXHJcbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7Lyplc2xpbnQtZW5hYmxlKi9cclxuICAgICAgICBUcmVlTm9kZS5zZXRJZFByZWZpeChvcHRpb25zLm5vZGVJZFByZWZpeCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERlZmF1bHQgc3RhdGUgb2Ygbm9kZVxyXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5ub2RlRGVmYXVsdFN0YXRlID0gb3B0aW9ucy5ub2RlRGVmYXVsdFN0YXRlO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSb290IG5vZGVcclxuICAgICAgICAgKiBAdHlwZSB7VHJlZU5vZGV9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yb290Tm9kZSA9IG5ldyBUcmVlTm9kZSh7XHJcbiAgICAgICAgICAgIHN0YXRlOiAnb3BlbmVkJ1xyXG4gICAgICAgIH0sIG51bGwpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUcmVlIGhhc2ggaGF2aW5nIGFsbCBub2Rlc1xyXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3QuPHN0cmluZywgVHJlZU5vZGU+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudHJlZUhhc2ggPSB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5fc2V0RGF0YShkYXRhKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0Tm9kZUlkUHJlZml4OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gVHJlZU5vZGUuaWRQcmVmaXg7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IG1vZGVsIHdpdGggdHJlZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXHJcbiAgICAgKi9cclxuICAgIF9zZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLnJvb3ROb2RlLFxyXG4gICAgICAgICAgICByb290SWQgPSByb290LmdldElkKCk7XHJcblxyXG4gICAgICAgIHRoaXMudHJlZUhhc2hbcm9vdElkXSA9IHJvb3Q7XHJcbiAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHJvb3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgdHJlZSBoYXNoIGZyb20gZGF0YSBhbmQgcGFyZW50Tm9kZVxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIFRyZWUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gcGFyZW50IC0gUGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9tYWtlVHJlZUhhc2g6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHBhcmVudC5nZXRJZCgpO1xyXG5cclxuICAgICAgICBmb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKGRhdHVtKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbkRhdGEgPSBkYXR1bS5jaGlsZHJlbixcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9jcmVhdGVOb2RlKGRhdHVtLCBwYXJlbnRJZCksXHJcbiAgICAgICAgICAgICAgICBub2RlSWQgPSBub2RlLmdldElkKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyZWVIYXNoW25vZGVJZF0gPSBub2RlO1xyXG4gICAgICAgICAgICBwYXJlbnQuYWRkQ2hpbGRJZChub2RlSWQpO1xyXG4gICAgICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goY2hpbGRyZW5EYXRhLCBub2RlKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVEYXRhIC0gRGF0dW0gb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHsqfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxyXG4gICAgICogQHJldHVybiB7VHJlZU5vZGV9IFRyZWVOb2RlXHJcbiAgICAgKi9cclxuICAgIF9jcmVhdGVOb2RlOiBmdW5jdGlvbihub2RlRGF0YSwgcGFyZW50SWQpIHtcclxuICAgICAgICB2YXIgbm9kZTtcclxuICAgICAgICBub2RlRGF0YSA9IGV4dGVuZCh7XHJcbiAgICAgICAgICAgIHN0YXRlOiB0aGlzLm5vZGVEZWZhdWx0U3RhdGVcclxuICAgICAgICB9LCBub2RlRGF0YSk7XHJcblxyXG4gICAgICAgIG5vZGUgPSBuZXcgVHJlZU5vZGUobm9kZURhdGEsIHBhcmVudElkKTtcclxuICAgICAgICBub2RlLnJlbW92ZURhdGEoJ2NoaWxkcmVuJyk7XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBjaGlsZHJlblxyXG4gICAgICogQHBhcmFtIHsqfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJuIHtBcnJheS48VHJlZU5vZGU+fHVuZGVmaW5lZH0gY2hpbGRyZW5cclxuICAgICAqL1xyXG4gICAgZ2V0Q2hpbGRyZW46IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcclxuICAgICAgICBpZiAoIWNoaWxkSWRzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtYXAoY2hpbGRJZHMsIGZ1bmN0aW9uKGNoaWxkSWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZShjaGlsZElkKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgY2hpbGQgaWRzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fHVuZGVmaW5lZH0gQ2hpbGQgaWRzXHJcbiAgICAgKi9cclxuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbm9kZS5nZXRDaGlsZElkcygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgbnVtYmVyIG9mIG5vZGVzXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIG5vZGVzXHJcbiAgICAgKi9cclxuICAgIGdldENvdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4ga2V5cyh0aGlzLnRyZWVIYXNoKS5sZW5ndGg7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGxhc3QgZGVwdGhcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBsYXN0IGRlcHRoXHJcbiAgICAgKi9cclxuICAgIGdldExhc3REZXB0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGRlcHRocyA9IG1hcCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldERlcHRoKG5vZGUuZ2V0SWQoKSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShudWxsLCBkZXB0aHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpbmQgbm9kZVxyXG4gICAgICogQHBhcmFtIHsqfSBpZCAtIEEgbm9kZSBpZCB0byBmaW5kXHJcbiAgICAgKiBAcmV0dXJuIHtUcmVlTm9kZXx1bmRlZmluZWR9IE5vZGVcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZTogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmVlSGFzaFtpZF07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGRlcHRoIGZyb20gbm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHsqfSBpZCAtIEEgbm9kZSBpZCB0byBmaW5kXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfSBEZXB0aFxyXG4gICAgICovXHJcbiAgICBnZXREZXB0aDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXHJcbiAgICAgICAgICAgIGRlcHRoID0gMCxcclxuICAgICAgICAgICAgcGFyZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XHJcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xyXG4gICAgICAgICAgICBkZXB0aCArPSAxO1xyXG4gICAgICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50LmdldFBhcmVudElkKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlcHRoO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBwYXJlbnQgaWQgb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBub2RlLmdldFBhcmVudElkKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWQgdG8gcmVtb3ZlXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oaWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxyXG4gICAgICAgICAgICBwYXJlbnQ7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuXHJcbiAgICAgICAgZm9yRWFjaChub2RlLmdldENoaWxkSWRzKCksIGZ1bmN0aW9uKGNoaWxkSWQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoY2hpbGRJZCwgdHJ1ZSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZElkKGlkKTtcclxuICAgICAgICBkZWxldGUgdGhpcy50cmVlSGFzaFtpZF07XHJcblxyXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnQuZ2V0SWQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZCBub2RlKHMpLlxyXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXHJcbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxyXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxyXG4gICAgICogQHBhcmFtIHsqfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShwYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZTtcclxuXHJcbiAgICAgICAgZGF0YSA9IFtdLmNvbmNhdChkYXRhKTtcclxuICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goZGF0YSwgcGFyZW50KTtcclxuICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIHBhcmVudElkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZGF0YSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxyXG4gICAgICogQHBhcmFtIHsqfSBpZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcyAtIFByb3BlcnRpZXNcclxuICAgICAqL1xyXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKGlkLCBwcm9wcykge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlIHx8ICFwcm9wcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBub2RlLnNldERhdGEocHJvcHMpO1xyXG4gICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgbm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0gbmFtZXMgLSBOYW1lcyBvZiBwcm9wZXJ0aWVzXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihpZCwgbmFtZXMpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSB8fCAhbmFtZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR1aS51dGlsLmlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRGF0YS5hcHBseShub2RlLCBuYW1lcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhKG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBub2RlLmdldFBhcmVudElkKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnQncyBjaGlsZFxyXG4gICAgICogQHBhcmFtIHsqfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0geyp9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG5ld1BhcmVudElkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgb3JpZ2luYWxQYXJlbnQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbmV3UGFyZW50ID0gdGhpcy5nZXROb2RlKG5ld1BhcmVudElkKSB8fCB0aGlzLnJvb3ROb2RlO1xyXG4gICAgICAgIG5ld1BhcmVudElkID0gbmV3UGFyZW50LmdldElkKCk7XHJcbiAgICAgICAgb3JpZ2luYWxQYXJlbnRJZCA9IG5vZGUuZ2V0UGFyZW50SWQoKTtcclxuICAgICAgICBvcmlnaW5hbFBhcmVudCA9IHRoaXMuZ2V0Tm9kZShvcmlnaW5hbFBhcmVudElkKTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGVJZCA9PT0gbmV3UGFyZW50SWQgfHwgdGhpcy5jb250YWlucyhub2RlSWQsIG5ld1BhcmVudElkKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9yaWdpbmFsUGFyZW50LnJlbW92ZUNoaWxkSWQobm9kZUlkKTtcclxuICAgICAgICBub2RlLnNldFBhcmVudElkKG5ld1BhcmVudElkKTtcclxuICAgICAgICBuZXdQYXJlbnQuYWRkQ2hpbGRJZChub2RlSWQpO1xyXG5cclxuICAgICAgICB0aGlzLmZpcmUoJ21vdmUnLCBub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayB0byBzZWUgaWYgYSBub2RlIGlzIGEgZGVzY2VuZGFudCBvZiBhbm90aGVyIG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVkSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVGhlIG5vZGUgaXMgY29udGFpbmVkIG9yIG5vdFxyXG4gICAgICovXHJcbiAgICBjb250YWluczogZnVuY3Rpb24oY29udGFpbmVySWQsIGNvbnRhaW5lZElkKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudElkID0gdGhpcy5nZXRQYXJlbnRJZChjb250YWluZWRJZCksXHJcbiAgICAgICAgICAgIGlzQ29udGFpbmVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHdoaWxlICghaXNDb250YWluZWQgJiYgcGFyZW50SWQpIHtcclxuICAgICAgICAgICAgaXNDb250YWluZWQgPSAoY29udGFpbmVySWQgPT09IHBhcmVudElkKTtcclxuICAgICAgICAgICAgcGFyZW50SWQgPSB0aGlzLmdldFBhcmVudElkKHBhcmVudElkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGlzQ29udGFpbmVkO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNvcnQgbm9kZXNcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgLSBDb21wYXJhdG9yIGZ1bmN0aW9uXHJcbiAgICAgKi9cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcclxuICAgICAgICB0aGlzLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZ2V0Q2hpbGRyZW4obm9kZUlkKSxcclxuICAgICAgICAgICAgICAgIGNoaWxkSWRzO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuLnNvcnQoY29tcGFyYXRvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgY2hpbGRJZHMgPSBtYXAoY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkLmdldElkKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIG5vZGUucmVwbGFjZUNoaWxkSWRzKGNoaWxkSWRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBub2RlIGRhdGEgKGFsbClcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R8dW5kZWZpbmVkfSBOb2RlIGRhdGFcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlLmdldEFsbERhdGEoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIG5vZGVzLlxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcclxuICAgICAqL1xyXG4gICAgZWFjaEFsbDogZnVuY3Rpb24oaXRlcmF0ZWUsIGNvbnRleHQpIHtcclxuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xyXG5cclxuICAgICAgICBmb3JFYWNoKHRoaXMudHJlZUhhc2gsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpdGVyYXRlZS5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgZGVzY2VuZGFudHMgb2YgYSBub2RlLlxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXHJcbiAgICAgKi9cclxuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCkge1xyXG4gICAgICAgIHZhciBzdGFjaywgbm9kZUlkLCBub2RlO1xyXG5cclxuICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKHBhcmVudElkKTtcclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGFjayA9IG5vZGUuZ2V0Q2hpbGRJZHMoKTtcclxuXHJcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcclxuICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIG5vZGVJZCA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XHJcbiAgICAgICAgICAgIGl0ZXJhdGVlLmNhbGwoY29udGV4dCwgbm9kZSwgbm9kZUlkKTtcclxuXHJcbiAgICAgICAgICAgIHV0aWwucHVzaEFsbChzdGFjaywgbm9kZS5nZXRDaGlsZElkcygpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWVNb2RlbCk7XHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZU1vZGVsO1xyXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdGF0ZXMgPSByZXF1aXJlKCcuL3N0YXRlcycpLm5vZGUsXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgbGFzdEluZGV4ID0gMCxcbiAgICBnZXROZXh0SW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGFzdEluZGV4O1xuICAgICAgICBsYXN0SW5kZXggKz0gMTtcbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG4gICAgUkVTRVJWRURfUFJPUEVSVElFUyA9IHtcbiAgICAgICAgaWQ6ICcnLFxuICAgICAgICBzdGF0ZTogJ3NldFN0YXRlJ1xuICAgIH0sXG4gICAgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG5cbi8qKlxuICogVHJlZU5vZGVcbiAqIEBDb25zdHJ1Y3RvciBUcmVlTm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG5vZGVEYXRhIC0gTm9kZSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gW3BhcmVudElkXSAtIFBhcmVudCBub2RlIGlkXG4gKi9cbnZhciBUcmVlTm9kZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU5vZGUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgc2V0SWRQcmVmaXg6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICAgICAgdGhpcy5pZFByZWZpeCA9IHByZWZpeCB8fCB0aGlzLmlkUHJlZml4O1xuICAgICAgICB9LFxuICAgICAgICBpZFByZWZpeDogJydcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faWQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXJlbnQgbm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPG51bWJlcj59XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIGRhdGFcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBzdGF0ZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuXG4gICAgICAgIHRoaXMuX3N0YW1wSWQoKTtcbiAgICAgICAgdGhpcy5zZXREYXRhKG5vZGVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhbXAgbm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3N0YW1wSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pZCA9IHRoaXMuY29uc3RydWN0b3IuaWRQcmVmaXggKyBnZXROZXh0SW5kZXgoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJlc2VydmVkIHByb3BlcnRpZXMgZnJvbSBkYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBOb2RlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBOb2RlIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSZXNlcnZlZFByb3BlcnRpZXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaE93blByb3BlcnRpZXMoUkVTRVJWRURfUFJPUEVSVElFUywgZnVuY3Rpb24oc2V0dGVyLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW25hbWVdO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tzZXR0ZXJdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHN0YXRlXG4gICAgICovXG4gICAgdG9nZ2xlU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdGUgPT09IHN0YXRlcy5DTE9TRUQpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLk9QRU5FRDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLkNMT1NFRDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBTdGF0ZSBvZiBub2RlICgnY2xvc2VkJywgJ29wZW5lZCcpXG4gICAgICovXG4gICAgc2V0U3RhdGU6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgIHN0YXRlICs9ICcnO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlc1tzdGF0ZS50b1VwcGVyQ2FzZSgpXSB8fCB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHN0YXRlXG4gICAgICogQHJldHVybnMge3N0cmluZ30gc3RhdGUgKCdvcGVuZWQnIG9yICdjbG9zZWQnKVxuICAgICAqL1xuICAgIGdldFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWRcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBOb2RlIGlkXG4gICAgICovXG4gICAgZ2V0SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwYXJlbnQgaWRcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKi9cbiAgICBzZXRQYXJlbnRJZDogZnVuY3Rpb24ocGFyZW50SWQpIHtcbiAgICAgICAgdmFyIGlzSW52YWxpZCA9IChwYXJlbnRJZCA9PT0gdGhpcy5faWQpIHx8IGluQXJyYXkocGFyZW50SWQsIHRoaXMuX2NoaWxkSWRzKTtcblxuICAgICAgICBpZiAoaXNJbnZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVwbGFjZSBjaGlsZElkc1xuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGNoaWxkSWRzIC0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIHJlcGxhY2VDaGlsZElkczogZnVuY3Rpb24oY2hpbGRJZHMpIHtcbiAgICAgICAgdmFyIGlzSW52YWxpZCA9IChpbkFycmF5KHRoaXMuX2lkLCBjaGlsZElkcykgIT09IC0xKSB8fCAoaW5BcnJheSh0aGlzLl9wYXJlbnRJZCwgY2hpbGRJZHMpICE9PSAtMSlcblxuICAgICAgICBpZiAoaXNJbnZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY2hpbGRJZHMgPSBjaGlsZElkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGlkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj59IElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKi9cbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5zbGljZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICovXG4gICAgYWRkQ2hpbGRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5fY2hpbGRJZHMsXG4gICAgICAgICAgICBpc0ludmFsaWQgPSAoaWQgPT09IHRoaXMuX3BhcmVudElkKSB8fCAoaWQgPT09IHRoaXMuX2lkKTtcblxuICAgICAgICBpZiAoaXNJbnZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHVpLnV0aWwuaW5BcnJheShjaGlsZElkcywgaWQpID09PSAtMSkge1xuICAgICAgICAgICAgY2hpbGRJZHMucHVzaChpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIHJlbW92ZUNoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlSXRlbUZyb21BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGF0YVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gUHJvcGVydHkgbmFtZSBvZiBkYXRhXG4gICAgICogQHJldHVybnMgeyp9IERhdGFcbiAgICAgKi9cbiAgICBnZXREYXRhOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBEYXRhXG4gICAgICovXG4gICAgZ2V0QWxsRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5leHRlbmQoe30sIHRoaXMuX2RhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRGF0YSBmb3IgYWRkaW5nXG4gICAgICovXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkYXRhID0gdGhpcy5fc2V0UmVzZXJ2ZWRQcm9wZXJ0aWVzKGRhdGEpO1xuICAgICAgICB0dWkudXRpbC5leHRlbmQodGhpcy5fZGF0YSwgZGF0YSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGRhdGFcbiAgICAgKiBAcGFyYW0gey4uLnN0cmluZ30gbmFtZXMgLSBOYW1lcyBvZiBkYXRhXG4gICAgICovXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24obmFtZXMpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaEFycmF5KGFyZ3VtZW50cywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIG5vZGUgaGFzIGEgcHJvdmlkZWQgY2hpbGQgaWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqL1xuICAgIGhhc0NoaWxkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gaW5BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpICE9PSAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBub2RlIGlzIGxlYWYuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IE5vZGUgaXMgbGVhZiBvciBub3QuXG4gICAgICovXG4gICAgaXNMZWFmOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkSWRzLmxlbmd0aCA9PT0gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBub2RlIGlzIHJvb3QuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IE5vZGUgaXMgcm9vdCBvciBub3QuXG4gICAgICovXG4gICAgaXNSb290OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHR1aS51dGlsLmlzRmFsc3kodGhpcy5fcGFyZW50SWQpO1xuICAgIH1cbn0pO1xubW9kdWxlLmV4cG9ydHMgPSBUcmVlTm9kZTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBIZWxwZXIgb2JqZWN0IHRvIG1ha2UgZWFzeSB0cmVlIGVsZW1lbnRzXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxudmFyIHV0aWwgPSB7XG4gICAgLyoqXG4gICAgICogUHVzaCBhbGwgZWxlbWVudHMgZnJvbSBuZXcgYXJyYXlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIxIC0gQmFzZSBhcnJheVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycjIgLSBOZXcgYXJyYXlcbiAgICAgKi9cbiAgICBwdXNoQWxsOiBmdW5jdGlvbihhcnIxLCBhcnIyKSB7XG4gICAgICAgIHZhciBsZW5ndGggPSBhcnIyLmxlbmd0aCxcbiAgICAgICAgICAgIGkgPSAwO1xuXG4gICAgICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGFycjEucHVzaChhcnIyW2ldKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlyc3Qgc3BlY2lmaWVkIGl0ZW0gZnJvbSBhcnJheSwgaWYgaXQgZXhpc3RzXG4gICAgICogQHBhcmFtIHsqfSBpdGVtIEl0ZW0gdG8gbG9vayBmb3JcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIgQXJyYXkgdG8gcXVlcnlcbiAgICAgKi9cbiAgICByZW1vdmVJdGVtRnJvbUFycmF5OiBmdW5jdGlvbihpdGVtLCBhcnIpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdHVpLnV0aWwuaW5BcnJheShpdGVtLCBhcnIpO1xuXG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2xhc3NuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSAtIENsYXNzbmFtZVxuICAgICAqL1xuICAgIGFkZENsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NOYW1lID09PSAnJykge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoIXV0aWwuaGFzQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgKz0gJyAnICsgY2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjbGFzc25hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIC0gQ2xhc3NuYW1lXG4gICAgICovXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgb3JpZ2luYWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpLFxuICAgICAgICAgICAgYXJyLCBpbmRleDtcblxuICAgICAgICBpZiAoIW9yaWdpbmFsQ2xhc3NOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnIgPSBvcmlnaW5hbENsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgICAgICBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoY2xhc3NOYW1lLCBhcnIpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gYXJyLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB0byBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50IFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhZGRcbiAgICAgKi9cbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgZnJvbSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmRldGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9IEV2ZW50IHRhcmdldFxuICAgICAqL1xuICAgIGdldFRhcmdldDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0O1xuICAgICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgICAgIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEhUTUxFbGVtZW50XG4gICAgICogQHJldHVybnMge3N0cmluZ30gQ2xhc3MgbmFtZVxuICAgICAqL1xuICAgIGdldENsYXNzOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50ICYmIGVsZW1lbnQuZ2V0QXR0cmlidXRlICYmIChlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCAnJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBlbGVtZW50IGhhcyBzcGVjaWZpYyBjbGFzcyBvciBub3RcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzcyB0byBmaW5kXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZWxlbWVudCBoYXMgdGhlIGNsYXNzXG4gICAgICovXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpO1xuXG4gICAgICAgIHJldHVybiBlbENsYXNzTmFtZS5pbmRleE9mKGNsYXNzTmFtZSkgPiAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBlbGVtZW50IGJ5IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgQSBuYW1lIG9mIGNsYXNzXG4gICAgICogQHJldHVybiB7QXJyYXkuPEhUTUxFbGVtZW50Pn0gRWxlbWVudHNcbiAgICAgKi9cbiAgICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lOiBmdW5jdGlvbih0YXJnZXQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgYWxsLCBmaWx0ZXJlZDtcblxuICAgICAgICBpZiAodGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFsbCA9IHRhcmdldC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpO1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0dWkudXRpbC5maWx0ZXIoYWxsLCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiAoY2xhc3NOYW1lcy5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHdoZXRoZXIgdGhlIGNsaWNrIGV2ZW50IGJ5IHJpZ2h0IGJ1dHRvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICovXG4gICAgaXNSaWdodEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuX2dldEJ1dHRvbihldmVudCkgPT09IDI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0IG9yIG5vdFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIEEgcHJvcGVydHlcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd8Ym9vbGVhbn0gUHJvcGVydHkgbmFtZSBvciBmYWxzZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIHVzZXJTZWxlY3RQcm9wZXJ0eSA9IHV0aWwudGVzdFByb3AoW1xuICAgICAqICAgICAndXNlclNlbGVjdCcsXG4gICAgICogICAgICdXZWJraXRVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ09Vc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ01velVzZXJTZWxlY3QnLFxuICAgICAqICAgICAnbXNVc2VyU2VsZWN0J1xuICAgICAqIF0pO1xuICAgICAqL1xuICAgIHRlc3RQcm9wOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUsXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBmYWxzZTtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHByb3BzLCBmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgICAgICBpZiAocHJvcCBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3A7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHByb3BlcnR5TmFtZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCBkZWZhdWx0IGV2ZW50IFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqL1xuICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbCBmcm9tIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZSAtIFRlbXBsYXRlIGh0bWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUZW1wbGF0ZSBkYXRhXG4gICAgICogQHJldHVybnMge3N0cmluZ30gaHRtbFxuICAgICAqL1xuICAgIHRlbXBsYXRlOiBmdW5jdGlvbihzb3VyY2UsIHByb3BzKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2UucmVwbGFjZSgvXFx7XFx7KFxcdyspfX0vZ2ksIGZ1bmN0aW9uKG1hdGNoLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBwcm9wc1tuYW1lXTtcbiAgICAgICAgICAgIGlmICh0dWkudXRpbC5pc0ZhbHN5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6YXRpb24gZm9yIGV2ZW50IGJ1dHRvbiBwcm9wZXJ0eSBcbiAgICAgKiAwOiBGaXJzdCBtb3VzZSBidXR0b24sIDI6IFNlY29uZCBtb3VzZSBidXR0b24sIDE6IENlbnRlciBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9IGJ1dHRvbiB0eXBlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0QnV0dG9uOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgYnV0dG9uLFxuICAgICAgICAgICAgcHJpbWFyeSA9ICcwLDEsMyw1LDcnLFxuICAgICAgICAgICAgc2Vjb25kYXJ5ID0gJzIsNicsXG4gICAgICAgICAgICB3aGVlbCA9ICc0JztcblxuICAgICAgICBpZiAoZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uaGFzRmVhdHVyZSgnTW91c2VFdmVudHMnLCAnMi4wJykpIHtcbiAgICAgICAgICAgIHJldHVybiBldmVudC5idXR0b247XG4gICAgICAgIH1cblxuICAgICAgICBidXR0b24gPSBldmVudC5idXR0b24gKyAnJztcbiAgICAgICAgaWYgKHByaW1hcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9IGVsc2UgaWYgKHNlY29uZGFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgIH0gZWxzZSBpZiAod2hlZWwuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIl19
