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
        console.log('aa');
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
    console.log(name, Feature);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9kZWZhdWx0cy5qcyIsInNyYy9qcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy9zdGF0ZXMuanMiLCJzcmMvanMvdHJlZS5qcyIsInNyYy9qcy90cmVlTW9kZWwuanMiLCJzcmMvanMvdHJlZU5vZGUuanMiLCJzcmMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidHVpLnV0aWwuZGVmaW5lTmFtZXNwYWNlKCd0dWkuY29tcG9uZW50LlRyZWUnLCByZXF1aXJlKCcuL3NyYy9qcy90cmVlJykpO1xuIiwiLyoqXG4gKiBBIGRlZmF1bHQgdmFsdWVzIGZvciB0cmVlXG4gKiBAbW9kdWxlIGRlZmF1bHRzXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNYWtlIGNsYXNzIG5hbWVzXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IC0gUHJlZml4IG9mIGNsYXNzIG5hbWVcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGtleXMgLSBLZXlzIG9mIGNsYXNzIG5hbWVzXG4gKiBAcmV0dXJucyB7b2JqZWN0LjxzdHJpbmcsIHN0cmluZz59IENsYXNzbmFtZXMgbWFwXG4gKi9cbmZ1bmN0aW9uIG1ha2VDbGFzc05hbWVzKHByZWZpeCwga2V5cykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICB0dWkudXRpbC5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBvYmpba2V5ICsgJ0NsYXNzJ10gPSBwcmVmaXggKyBrZXk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBAY29uc3RcbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHVzZURyYWcgLSBEZWZhdWx0OiBmYWxzZVxuICogQHByb3BlcnR5IHtib29sZWFufSB1c2VIZWxwZXIgLSBEZWZhdWx0OiBmYWxzZVxuICogQHByb3BlcnR5IHtvYmplY3R9IHN0YXRlTGFiZWwgLSBTdGF0ZSBsYWJlbCBpbiBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN0YXRlTGFiZWwub3BlbmVkIC0gRGVmYXVsdDogJy0nXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN0YXRlTGFiZWwuY2xvc2VkIC0gRGVmYXVsdDogJysnXG4gKiBAcHJvcGVydHkge29iamVjdH0gdGVtcGxhdGUgLSBUZW1wbGF0ZSBodG1sIGZvciB0aGUgbm9kZXMuXG4gKiBAcHJvcGVydHkge29iamVjdH0gY2xhc3NOYW1lcyAtIENsYXNzIG5hbWVzIG9mIGVsZW1lbnRzIGluIHRyZWVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IG9wZW5lZENsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gY2xvc2VkQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBzZWxlY3RlZENsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciBzZWxlY3RlZCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdWJ0cmVlQ2xhc3MgIC0gQSBjbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IHRvZ2dsZUNsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IHRpdGxlQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIHRpdGxlIGVsZW1lbnQgaW4gYSBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBpbnB1dENsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciBlZGl0YWJsZSBlbGVtZW50IGluIGEgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZW1wbGF0ZS5pbnRlcm5hbE5vZGUgLSBBIHRlbXBsYXRlIGh0bWwgZm9yIGludGVybmFsIG5vZGUuXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHRlbXBsYXRlLmxlYWZOb2RlIC0gQSB0ZW1wbGF0ZSBodG1sIGZvciBsZWFmIG5vZGUuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdjbG9zZWQnLFxuICAgIHN0YXRlTGFiZWxzOiB7XG4gICAgICAgIG9wZW5lZDogJy0nLFxuICAgICAgICBjbG9zZWQ6ICcrJ1xuICAgIH0sXG4gICAgbm9kZUlkUHJlZml4OiAndHVpLXRyZWUtbm9kZS0nLFxuICAgIGNsYXNzTmFtZXM6IG1ha2VDbGFzc05hbWVzKCd0dWktdHJlZS0nLCBbXG4gICAgICAgICdvcGVuZWQnLFxuICAgICAgICAnY2xvc2VkJyxcbiAgICAgICAgJ3NlbGVjdGVkJyxcbiAgICAgICAgJ3N1YnRyZWUnLFxuICAgICAgICAndG9nZ2xlQnRuJyxcbiAgICAgICAgJ3RleHQnLFxuICAgICAgICAnaW5wdXQnXG4gICAgXSksXG4gICAgdGVtcGxhdGU6IHtcbiAgICAgICAgaW50ZXJuYWxOb2RlOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ0dWktdHJlZS1ub2RlIHt7c3RhdGVDbGFzc319XCI+JyArXG4gICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPicgK1xuICAgICAgICAnPC9saT4nLFxuICAgICAgICBsZWFmTm9kZTpcbiAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwidHVpLXRyZWUtbm9kZSB0dWktdHJlZS1sZWFmXCI+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gICAgICAgICc8L2xpPidcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICB1c2VIZWxwZXI6IHRydWUsXG4gICAgICAgIGhlbHBlclBvczoge1xuICAgICAgICAgICAgeTogMTAsXG4gICAgICAgICAgICB4OiAxMFxuICAgICAgICB9XG4gICAgfSxcbiAgICByZWplY3RlZFRhZ05hbWVzID0gW1xuICAgICAgICAnSU5QVVQnLFxuICAgICAgICAnQlVUVE9OJ1xuICAgIF0sXG4gICAgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIGRyYWdnYWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnNcbiAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMudXNlSGVscGVyIC0gVXNpbmcgaGVscGVyIGZsYWdcbiAqICBAcGFyYW0ge3t4OiBudW1iZXIsIHk6bnVtYmVyfX0gb3B0aW9ucy5oZWxwZXJQb3MgLSBIZWxwZXIgcG9zaXRpb25cbiAqICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkVGFnTmFtZXMgLSBObyBkcmFnZ2FibGUgdGFnIG5hbWVzXG4gKiAgQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gb3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMgLSBObyBkcmFnZ2FibGUgY2xhc3MgbmFtZXNcbiAqL1xudmFyIERyYWdnYWJsZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgRHJhZ2dhYmxlLnByb3RvdHlwZSAqL3tcbiAgICAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuc2V0TWVtYmVycyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5hdHRhY2hNb3VzZWRvd24oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG1lbWJlcnMgb2YgdGhpcyBtb2R1bGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGlucHV0IG9wdGlvbnNcbiAgICAgKi9cbiAgICBzZXRNZW1iZXJzOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHZhciBoZWxwZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpLFxuICAgICAgICAgICAgc3R5bGUgPSBoZWxwZXJFbGVtZW50LnN0eWxlO1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy51c2VIZWxwZXIgPSBvcHRpb25zLnVzZUhlbHBlcjtcbiAgICAgICAgdGhpcy5oZWxwZXJQb3MgPSBvcHRpb25zLmhlbHBlclBvcztcbiAgICAgICAgdGhpcy5yZWplY3RlZFRhZ05hbWVzID0gcmVqZWN0ZWRUYWdOYW1lcy5jb25jYXQob3B0aW9ucy5yZWplY3RlZFRhZ05hbWVzKTtcbiAgICAgICAgdGhpcy5yZWplY3RlZENsYXNzTmFtZXMgPSBbXS5jb25jYXQob3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMpO1xuICAgICAgICB0aGlzLmRlZmF1bHRQb3NpdGlvbiA9IHRyZWUucm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudCA9IGhlbHBlckVsZW1lbnQ7XG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5ID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZSA9IG51bGw7XG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICAgICAgICB0aGlzLmhhbmRsZXJzLm1vdXNlZG93biA9IHR1aS51dGlsLmJpbmQodGhpcy5vbk1vdXNlZG93biwgdGhpcyk7XG4gICAgICAgIHRoaXMuaGFuZGxlcnMubW91c2Vtb3ZlID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uTW91c2Vtb3ZlLCB0aGlzKTtcbiAgICAgICAgdGhpcy5oYW5kbGVycy5tb3VzZXVwID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uTW91c2V1cCwgdGhpcyk7XG5cbiAgICAgICAgc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBzdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChoZWxwZXJFbGVtZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIG1vdXNlIGRvd24gZXZlbnRcbiAgICAgKi9cbiAgICBhdHRhY2hNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHNlbGVjdEtleSwgc3R5bGU7XG5cbiAgICAgICAgaWYgKCdvbnNlbGVjdHN0YXJ0JyBpbiBkb2N1bWVudCkge1xuICAgICAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRyZWUucm9vdEVsZW1lbnQsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3R5bGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGU7XG4gICAgICAgICAgICBzZWxlY3RLZXkgPSB1dGlsLnRlc3RQcm9wKFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J10pO1xuXG4gICAgICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSA9IHNlbGVjdEtleTtcbiAgICAgICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5VmFsdWUgPSBzdHlsZVtzZWxlY3RLZXldO1xuICAgICAgICAgICAgc3R5bGVbc2VsZWN0S2V5XSA9ICdub25lJztcbiAgICAgICAgfVxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodHJlZS5yb290RWxlbWVudCwgJ21vdXNlZG93bicsIHRoaXMuaGFuZGxlcnMubW91c2Vkb3duKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhlIHRhcmdldCBlbGVtZW50IGlzIGluIHJlamVjdGVkVGFnTmFtZXMgb3IgaW4gcmVqZWN0ZWRDbGFzc05hbWVzXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdGFyZ2V0IGlzIG5vdCBkcmFnZ2FibGUgb3IgZHJhZ2dhYmxlXG4gICAgICovXG4gICAgaXNOb3REcmFnZ2FibGU6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICB2YXIgdGFnTmFtZSA9IHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICBjbGFzc05hbWVzID0gdXRpbC5nZXRDbGFzcyh0YXJnZXQpLnNwbGl0KCcgJyksXG4gICAgICAgICAgICByZXN1bHQ7XG5cbiAgICAgICAgaWYgKGluQXJyYXkodGFnTmFtZSwgdGhpcy5yZWplY3RlZFRhZ05hbWVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChjbGFzc05hbWVzLCBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGluQXJyYXkoY2xhc3NOYW1lLCB0aGlzLnJlamVjdGVkQ2xhc3NOYW1lcykgIT09IC0xO1xuICAgICAgICAgICAgcmV0dXJuICFyZXN1bHQ7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZWRvd25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbk1vdXNlZG93bjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZDtcblxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSB8fCB0aGlzLmlzTm90RHJhZ2dhYmxlKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1dGlsLnByZXZlbnREZWZhdWx0KGV2ZW50KTtcblxuICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbm9kZUlkO1xuICAgICAgICBpZiAodGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SGVscGVyKHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlcnMubW91c2Vtb3ZlKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2V1cCcsIHRoaXMuaGFuZGxlcnMubW91c2V1cCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZW1vdmVcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbk1vdXNlbW92ZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGhlbHBlckVsID0gdGhpcy5oZWxwZXJFbGVtZW50LFxuICAgICAgICAgICAgcG9zID0gdGhpcy5kZWZhdWx0UG9zaXRpb247XG4gICAgICAgIGlmICghdGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlbHBlckVsLnN0eWxlLmxlZnQgPSBldmVudC5jbGllbnRYIC0gcG9zLmxlZnQgKyB0aGlzLmhlbHBlclBvcy54ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUudG9wID0gZXZlbnQuY2xpZW50WSAtIHBvcy50b3AgKyB0aGlzLmhlbHBlclBvcy55ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2V1cFxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2V1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRyZWUubW92ZSh0aGlzLmN1cnJlbnROb2RlSWQsIG5vZGVJZCk7XG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5oYW5kbGVycy5tb3VzZW1vdmUpO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5oYW5kbGVycy5tb3VzZXVwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGhlbHBlciBjb250ZW50c1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gSGVscGVyIGNvbnRlbnRzXG4gICAgICovXG4gICAgc2V0SGVscGVyOiBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudC5pbm5lckhUTUwgPSB0ZXh0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXRhY2ggbW91c2Vkb3duIGV2ZW50XG4gICAgICovXG4gICAgZGV0YWNoTW91c2Vkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRyZWUucm9vdEVsZW1lbnQsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHJlZS5yb290RWxlbWVudCwgJ21vdXNlZG93bicsIHRoaXMuaGFuZGxlcnMubW91c2Vkb3duKTtcbiAgICAgICAgaWYgKHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGVbdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXldID0gdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZGV0YWNoTW91c2Vkb3duKCk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ2dhYmxlOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBzZWxlY3RhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqL1xudmFyIFNlbGVjdGFibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFNlbGVjdGlvbk1vZHVsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBjb25zb2xlLmxvZygnYWEnKTtcbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSA9IHRyZWUuY2xhc3NOYW1lcy5zZWxlY3RlZENsYXNzO1xuICAgICAgICB0aGlzLmhhbmRsZXIgPSB0dWkudXRpbC5iaW5kKHRoaXMub25TaW5nbGVDbGljaywgdGhpcyk7XG4gICAgICAgIHRoaXMudHJlZS5vbignc2luZ2xlQ2xpY2snLCB0aGlzLmhhbmRsZXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2VsZWN0ZWRFbGVtZW50LCB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdGhpcy50cmVlLm9mZih0aGlzLmhhbmRsZXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciBcInNpbmdsZUNsaWNrXCJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvblNpbmdsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KSxcbiAgICAgICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKSxcbiAgICAgICAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lID0gdGhpcy5zZWxlY3RlZENsYXNzTmFtZTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuY3VycmVudFNlbGVjdGVkRWxlbWVudCwgc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBzZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgIHRoaXMuY3VycmVudFNlbGVjdGVkRWxlbWVudCA9IG5vZGVFbGVtZW50O1xuXG4gICAgICAgIHRyZWUuZmlyZSgnc2VsZWN0Jywgbm9kZUlkKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RhYmxlOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBTdGF0ZXMgaW4gdHJlZVxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBTdGF0ZXMgaW4gdHJlZVxuICogQG1vZHVsZSBzdGF0ZXNcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogU3RhdGVzIG9mIG5vZGVcbiAgICAgKiBAdHlwZSB7e09QRU5FRDogc3RyaW5nLCBDTE9TRUQ6IHN0cmluZ319XG4gICAgICovXG4gICAgbm9kZToge1xuICAgICAgICBPUEVORUQ6ICdvcGVuZWQnLFxuICAgICAgICBDTE9TRUQ6ICdjbG9zZWQnXG4gICAgfVxufTtcbiIsIi8qKlxyXG4gKiBAZmlsZW92ZXJ2aWV3IFJlbmRlciB0cmVlIGFuZCB1cGRhdGUgdHJlZS5cclxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxyXG4gKi9cclxuXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJy4vZGVmYXVsdHMnKSxcclxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKSxcclxuICAgIHN0YXRlcyA9IHJlcXVpcmUoJy4vc3RhdGVzJyksXHJcbiAgICBUcmVlTW9kZWwgPSByZXF1aXJlKCcuL3RyZWVNb2RlbCcpLFxyXG4gICAgU2VsZWN0YWJsZSA9IHJlcXVpcmUoJy4vc2VsZWN0YWJsZScpLFxyXG4gICAgRHJhZ2dhYmxlID0gcmVxdWlyZSgnLi9kcmFnZ2FibGUnKTtcclxuXHJcbnZhciBub2RlU3RhdGVzID0gc3RhdGVzLm5vZGUsXHJcbiAgICBmZWF0dXJlcyA9IHtcclxuICAgICAgICBTZWxlY3RhYmxlOiBTZWxlY3RhYmxlLFxyXG4gICAgICAgIERyYWdnYWJsZTogRHJhZ2dhYmxlXHJcbiAgICB9LFxyXG4gICAgc25pcHBldCA9IHR1aS51dGlsLFxyXG4gICAgZXh0ZW5kID0gc25pcHBldC5leHRlbmQ7XHJcbi8qKlxyXG4gKiBDcmVhdGUgdHJlZSBtb2RlbCBhbmQgaW5qZWN0IGRhdGEgdG8gbW9kZWxcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEEgZGF0YSB0byBiZSB1c2VkIG9uIHRyZWVcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnNcclxuICogICAgIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtvcHRpb25zLnJvb3RFbGVtZW50XSBSb290IGVsZW1lbnQgKEl0IHNob3VsZCBiZSAnVUwnIGVsZW1lbnQpXHJcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubm9kZUlkUHJlZml4XSBBIGRlZmF1bHQgcHJlZml4IG9mIGEgbm9kZVxyXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmRlZmF1bHRTdGF0ZV0gQSBkZWZhdWx0IHN0YXRlIG9mIGEgbm9kZVxyXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnRlbXBsYXRlXSBBIG1hcmt1cCBzZXQgdG8gbWFrZSBlbGVtZW50XHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlLmludGVybmFsTm9kZV0gSFRNTCB0ZW1wbGF0ZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5sZWFmTm9kZV0gSFRNTCB0ZW1wbGF0ZVxyXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnN0YXRlTGFiZWxzXSBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0YXRlTGFiZWxzLm9wZW5lZF0gU3RhdGUtT1BFTkVEIGxhYmVsIChUZXh0IG9yIEhUTUwpXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0YXRlTGFiZWxzLmNsb3NlZF0gU3RhdGUtQ0xPU0VEIGxhYmVsIChUZXh0IG9yIEhUTUwpXHJcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuY2xhc3NOYW1lc10gQ2xhc3MgbmFtZXMgZm9yIHRyZWVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5vcGVuZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLmNsb3NlZENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuc2VsZWN0ZWRDbGFzc10gQSBjbGFzcyBuYW1lIHRvIHNlbGVjdGVkIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy50ZXh0Q2xhc3NdIEEgY2xhc3MgbmFtZSB0aGF0IGZvciB0ZXh0RWxlbWVudCBpbiBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuaW5wdXRDbGFzc10gQSBjbGFzcyBpbnB1dCBlbGVtZW50IGluIGEgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnN1YnRyZWVDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzc10gQSBjbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcclxuICogQGV4YW1wbGVcclxuICogLy9EZWZhdWx0IG9wdGlvbnNcclxuICogLy8gICAtIEhUTUwgVEVNUExBVEVcclxuICogLy8gICAgICAgLSBUaGUgcHJlZml4IFwiZF9cIiByZXByZXNlbnRzIHRoZSBkYXRhIG9mIGVhY2ggbm9kZS5cclxuICogLy8gICAgICAgLSBUaGUgXCJkX2NoaWxkcmVuXCIgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gSFRNTC10ZW1wbGF0ZVxyXG4gKiAvL1xyXG4gKiAvLyB7XHJcbiAqIC8vICAgICByb290RWxlbWVudDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVUwnKSxcclxuICogLy8gICAgIG5vZGVJZFByZWZpeDogJ3R1aS10cmVlLW5vZGUtJ1xyXG4gKiAvLyAgICAgZGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcclxuICogLy8gICAgIHN0YXRlTGFiZWxzOiB7XHJcbiAqIC8vICAgICAgICAgb3BlbmVkOiAnLScsXHJcbiAqIC8vICAgICAgICAgY2xvc2VkOiAnKydcclxuICogLy8gICAgIH0sXHJcbiAqIC8vICAgICBjbGFzc05hbWVzOiB7XHJcbiAqIC8vICAgICAgICAgb3BlbmVkQ2xhc3M6ICd0dWktdHJlZS1vcGVuZWQnLFxyXG4gKiAvLyAgICAgICAgIGNsb3NlZENsYXNzOiAndHVpLXRyZWUtY2xvc2VkJyxcclxuICogLy8gICAgICAgICBzZWxlY3RlZENsYXNzOiAndHVpLXRyZWUtc2VsZWN0ZWQnLFxyXG4gKiAvLyAgICAgICAgIHN1YnRyZWVDbGFzczogJ3R1aS10cmVlLXN1YnRyZWUnLFxyXG4gKiAvLyAgICAgICAgIHRvZ2dsZUJ0bkNsYXNzOiAndHVpLXRyZWUtdG9nZ2xlQnRuJyxcclxuICogLy8gICAgICAgICB0ZXh0Q2xhc3M6ICd0dWktdHJlZS10ZXh0JyxcclxuICogLy8gICAgICAgICBpdXB1dENsYXNzOiAndHVpLXRyZWUtaW5wdXQnXHJcbiAqIC8vICAgICB9LFxyXG4gKiAvL1xyXG4gKiAvLyAgICAgdGVtcGxhdGU6IHtcclxuICogLy8gICAgICAgICBpbnRlcm5hbE5vZGU6XHJcbiAqIC8vICAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwidHVpLXRyZWUtbm9kZSB7e3N0YXRlQ2xhc3N9fVwiIGRhdGEtbm9kZS1pZD1cInt7aWR9fVwiPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXHJcbiAqIC8vICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e3N1YnRyZWVDbGFzc319XCI+e3tjaGlsZHJlbn19PC91bD4nICtcclxuICogLy8gICAgICAgICAnPC9saT4nLFxyXG4gKiAvLyAgICAgICAgIGxlYWZOb2RlOlxyXG4gKiAvLyAgICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInR1aS10cmVlLW5vZGUgdHVpLXRyZWUtbGVhZlwiIGRhdGEtbm9kZS1pZD1cInt7aWR9fVwiPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXHJcbiAqIC8vICAgICAgICAgJzwvbGk+J1xyXG4gKiAvLyAgICAgfVxyXG4gKiAvLyB9XHJcbiAqIC8vXHJcbiAqXHJcbiAqIHZhciBkYXRhID0gW1xyXG4gKiAgICAge3RpdGxlOiAncm9vdEEnLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMUEnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTFCJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0xQyd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMUQnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTJBJywgY2hpbGRyZW46IFtcclxuICogICAgICAgICAgICAge3RpdGxlOidzdWJfMUEnLCBjaGlsZHJlbjpbXHJcbiAqICAgICAgICAgICAgICAgICB7dGl0bGU6J3N1Yl9zdWJfMUEnfVxyXG4gKiAgICAgICAgICAgICBdfSxcclxuICogICAgICAgICAgICAge3RpdGxlOidzdWJfMkEnfVxyXG4gKiAgICAgICAgIF19LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMkInfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTJDJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0yRCd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtM0EnLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgICAgICB7dGl0bGU6J3N1YjNfYSd9LFxyXG4gKiAgICAgICAgICAgICB7dGl0bGU6J3N1YjNfYid9XHJcbiAqICAgICAgICAgXX0sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0zQid9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtM0MnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTNEJ31cclxuICogICAgIF19LFxyXG4gKiAgICAge3RpdGxlOiAncm9vdEInLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgIHt0aXRsZTonQl9zdWIxJ30sXHJcbiAqICAgICAgICAge3RpdGxlOidCX3N1YjInfSxcclxuICogICAgICAgICB7dGl0bGU6J2InfVxyXG4gKiAgICAgXX1cclxuICogXTtcclxuICpcclxuICogdmFyIHRyZWUxID0gbmV3IHR1aS5jb21wb25lbnQuVHJlZShkYXRhLCB7XHJcbiAqICAgICBkZWZhdWx0U3RhdGU6ICdvcGVuZWQnXHJcbiAqIH0pO1xyXG4gKiovXHJcbnZhciBUcmVlID0gc25pcHBldC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cclxuICAgIHN0YXRpYzoge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBtZW1iZXJPZiBUcmVlXHJcbiAgICAgICAgICogQHN0YXRpY1xyXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVOYW1lIC0gTW9kdWxlIG5hbWVcclxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gbW9kdWxlIC0gTW9kdWxlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcmVnaXN0ZXJGZWF0dXJlOiBmdW5jdGlvbihtb2R1bGVOYW1lLCBtb2R1bGUpIHtcclxuICAgICAgICAgICAgaWYgKG1vZHVsZSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZlYXR1cmVzW21vZHVsZU5hbWVdID0gbW9kdWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVHJlZSBmZWF0dXJlc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZlYXR1cmVzOiB7fVxyXG4gICAgfSxcclxuICAgIGluaXQ6IGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cclxuICAgICAgICB2YXIgZXh0ZW5kID0gc25pcHBldC5leHRlbmQ7XHJcbiAgICAgICAgb3B0aW9ucyA9IGV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWZhdWx0IGNsYXNzIG5hbWVzXHJcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY2xhc3NOYW1lcyA9IGV4dGVuZCh7fSwgZGVmYXVsdHMuY2xhc3NOYW1lcywgb3B0aW9ucy5jbGFzc05hbWVzKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCB0ZW1wbGF0ZVxyXG4gICAgICAgICAqIEB0eXBlIHt7aW50ZXJuYWxOb2RlOiBzdHJpbmcsIGxlYWZOb2RlOiBzdHJpbmd9fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSBleHRlbmQoe30sIGRlZmF1bHRzLnRlbXBsYXRlLCBvcHRpb25zLnRlbXBsYXRlKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUm9vdCBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBvcHRpb25zLnJvb3RFbGVtZW50O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXHJcbiAgICAgICAgICogQHR5cGUge3tvcGVuZWQ6IHN0cmluZywgY2xvc2VkOiBzdHJpbmd9fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuc3RhdGVMYWJlbHMgPSBvcHRpb25zLnN0YXRlTGFiZWxzO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBNYWtlIHRyZWUgbW9kZWxcclxuICAgICAgICAgKiBAdHlwZSB7VHJlZU1vZGVsfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVHJlZU1vZGVsKGRhdGEsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBFbmFibGVkIGZlYXR1cmVzXHJcbiAgICAgICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCBvYmplY3Q+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzID0ge307XHJcblxyXG4gICAgICAgIHRoaXMuX3NldFJvb3QoKTtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4oKTtcclxuICAgICAgICB0aGlzLl9zZXRFdmVudHMoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgcm9vdCBlbGVtZW50IG9mIHRyZWVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZXRSb290OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKCFzbmlwcGV0LmlzSFRNTE5vZGUocm9vdEVsKSkge1xyXG4gICAgICAgICAgICByb290RWwgPSB0aGlzLnJvb3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVUwnKTtcclxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyb290RWwpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZXZlbnQgaGFuZGxlcnNcclxuICAgICAqL1xyXG4gICAgX3NldEV2ZW50czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5vbigndXBkYXRlJywgdGhpcy5fZHJhd0NoaWxkcmVuLCB0aGlzKTtcclxuICAgICAgICB0aGlzLm1vZGVsLm9uKCdtb3ZlJywgdGhpcy5fb25Nb3ZlLCB0aGlzKTtcclxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290RWxlbWVudCwgJ2NsaWNrJywgc25pcHBldC5iaW5kKHRoaXMuX29uQ2xpY2ssIHRoaXMpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNb3ZlIGV2ZW50IGhhbmRsZXJcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3JpZ2luYWxQYXJlbnRJZCAtIE9yaWdpbmFsIHBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbk1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgb3JpZ2luYWxQYXJlbnRJZCwgbmV3UGFyZW50SWQpIHtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4ob3JpZ2luYWxQYXJlbnRJZCk7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKG5ld1BhcmVudElkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbiBjbGljayBldmVudCBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gQ2xpY2sgZXZlbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbkNsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXHJcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSkge1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzKSkge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZSh0aGlzLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmNsaWNrVGltZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCdkb3VibGVDbGljaycsIGV2ZW50KTtcclxuICAgICAgICAgICAgdGhpcy5yZXNldENsaWNrVGltZXIoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5maXJlKCdzaW5nbGVDbGljaycsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIHNlbGYucmVzZXRDbGlja1RpbWVyKCk7XHJcbiAgICAgICAgICAgIH0sIDQwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBub2RlIHN0YXRlIC0gb3BlbmVkIG9yIGNsb3NlZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIE5vZGUgc3RhdGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSkge1xyXG4gICAgICAgIHZhciBzdWJ0cmVlRWxlbWVudCA9IHRoaXMuX2dldFN1YnRyZWVFbGVtZW50KG5vZGVJZCksXHJcbiAgICAgICAgICAgIHRvZ2dsZUJ0bkNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lcy50b29nbGVCdG5DbGFzcyxcclxuICAgICAgICAgICAgbGFiZWwsIGJ0bkVsZW1lbnQsIG5vZGVFbGVtZW50O1xyXG5cclxuICAgICAgICBpZiAoIXN1YnRyZWVFbGVtZW50IHx8IHN1YnRyZWVFbGVtZW50ID09PSB0aGlzLnJvb3RFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGFiZWwgPSB0aGlzLnN0YXRlTGFiZWxzW3N0YXRlXTtcclxuICAgICAgICBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XHJcbiAgICAgICAgYnRuRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShub2RlRWxlbWVudCwgdG9nZ2xlQnRuQ2xhc3NOYW1lKVswXTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlID09PSBub2RlU3RhdGVzLk9QRU5FRCkge1xyXG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fc2V0Tm9kZUNsYXNzTmFtZUZyb21TdGF0ZShub2RlRWxlbWVudCwgc3RhdGUpO1xyXG5cclxuICAgICAgICBpZiAoYnRuRWxlbWVudCkge1xyXG4gICAgICAgICAgICBidG5FbGVtZW50LmlubmVySFRNTCA9IGxhYmVsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbm9kZSBjbGFzcyBuYW1lIGZyb20gcHJvdmlkZWQgc3RhdGVcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVFbGVtZW50IC0gVHJlZU5vZGUgZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTmV3IGNoYW5nZWQgc3RhdGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlOiBmdW5jdGlvbihub2RlRWxlbWVudCwgc3RhdGUpIHtcclxuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcclxuICAgICAgICAgICAgb3BlbmVkQ2xhc3NOYW1lID0gY2xhc3NOYW1lc1tub2RlU3RhdGVzLk9QRU5FRCArICdDbGFzcyddLFxyXG4gICAgICAgICAgICBjbG9zZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuQ0xPU0VEICsgJ0NsYXNzJ107XHJcblxyXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Mobm9kZUVsZW1lbnQsIG9wZW5lZENsYXNzTmFtZSk7XHJcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgY2xvc2VkQ2xhc3NOYW1lKTtcclxuICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgaHRtbFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gbm9kZUlkcyAtIE5vZGUgaWQgbGlzdFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSFRNTFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX21ha2VIdG1sOiBmdW5jdGlvbihub2RlSWRzKSB7XHJcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcclxuICAgICAgICAgICAgc3RhdGVMYWJlbHMgPSB0aGlzLnN0YXRlTGFiZWxzLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVNvdXJjZSA9IHRoaXMudGVtcGxhdGUsXHJcbiAgICAgICAgICAgIGh0bWwgPSAnJztcclxuXHJcbiAgICAgICAgc25pcHBldC5mb3JFYWNoKG5vZGVJZHMsIGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IG1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpLFxyXG4gICAgICAgICAgICAgICAgbm9kZURhdGEgPSBub2RlLmdldEFsbERhdGEoKSxcclxuICAgICAgICAgICAgICAgIHByb3BzID0gZXh0ZW5kKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbm9kZUlkXHJcbiAgICAgICAgICAgICAgICB9LCBjbGFzc05hbWVzLCBub2RlRGF0YSksXHJcbiAgICAgICAgICAgICAgICBub2RlVGVtcGxhdGU7XHJcblxyXG4gICAgICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZVRlbXBsYXRlID0gdGVtcGxhdGVTb3VyY2UubGVhZk5vZGU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlVGVtcGxhdGUgPSB0ZW1wbGF0ZVNvdXJjZS5pbnRlcm5hbE5vZGU7XHJcbiAgICAgICAgICAgICAgICBwcm9wcy5zdGF0ZUNsYXNzID0gY2xhc3NOYW1lc1tzdGF0ZSsnQ2xhc3MnXTtcclxuICAgICAgICAgICAgICAgIHByb3BzLnN0YXRlTGFiZWwgPSBzdGF0ZUxhYmVsc1tzdGF0ZV07XHJcbiAgICAgICAgICAgICAgICBwcm9wcy5jaGlsZHJlbiA9IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaHRtbCArPSB1dGlsLnRlbXBsYXRlKG5vZGVUZW1wbGF0ZSwgcHJvcHMpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIHJldHVybiBodG1sO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERyYXcgdHJlZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBQYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2RyYXdDaGlsZHJlbjogZnVuY3Rpb24ocGFyZW50SWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShwYXJlbnRJZCksXHJcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgbm9kZSA9IHRoaXMubW9kZWwucm9vdE5vZGU7XHJcbiAgICAgICAgICAgIHBhcmVudElkID0gbm9kZS5nZXRJZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHRoaXMuX2dldFN1YnRyZWVFbGVtZW50KHBhcmVudElkKTtcclxuICAgICAgICBpZiAoIXN1YnRyZWVFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbihub2RlLmdldFBhcmVudElkKCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdWJ0cmVlRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLl9tYWtlSHRtbChub2RlLmdldENoaWxkSWRzKCkpO1xyXG4gICAgICAgIHRoaXMubW9kZWwuZWFjaChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGUuZ2V0U3RhdGUoKSA9PT0gbm9kZVN0YXRlcy5PUEVORUQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3Blbihub2RlSWQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZShub2RlSWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgcGFyZW50SWQsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBzdWJ0cmVlIGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBUcmVlTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fHVuZGVmaW5lZH0gU3VidHJlZSBlbGVtZW50IG9yIHVuZGVmaW5lZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2dldFN1YnRyZWVFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICBzdWJ0cmVlQ2xhc3NOYW1lLCBub2RlRWxlbWVudCwgc3VidHJlZUVsZW1lbnQ7XHJcbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUuaXNMZWFmKCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG5vZGUuaXNSb290KCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucm9vdEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdWJ0cmVlQ2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWVzWydzdWJ0cmVlQ2xhc3MnXTtcclxuICAgICAgICBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGUuZ2V0SWQoKSk7XHJcbiAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB1dGlsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUobm9kZUVsZW1lbnQsIHN1YnRyZWVDbGFzc05hbWUpWzBdO1xyXG5cclxuICAgICAgICByZXR1cm4gc3VidHJlZUVsZW1lbnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIHJvb3Qgbm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUm9vdCBub2RlIGlkXHJcbiAgICAgKi9cclxuICAgIGdldFJvb3ROb2RlSWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLnJvb3ROb2RlLmdldElkKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIGNoaWxkIGlkc1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPnx1bmRlZmluZWR9IENoaWxkIGlkc1xyXG4gICAgICovXHJcbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gcGFyZW50IGlkIG9mIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gUGFyZW50IGlkXHJcbiAgICAgKi9cclxuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRQYXJlbnRJZChub2RlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc2V0IGNsaWNrIHRpbWVyXHJcbiAgICAgKi9cclxuICAgIHJlc2V0Q2xpY2tUaW1lcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLmNsaWNrVGltZXIpO1xyXG4gICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IG5vZGUgaWQgZnJvbSBlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gSFRNTEVsZW1lbnRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGVJZEZyb21FbGVtZW50OiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIGlkUHJlZml4ID0gdGhpcy5nZXROb2RlSWRQcmVmaXgoKTtcclxuXHJcbiAgICAgICAgd2hpbGUgKGVsZW1lbnQgJiYgZWxlbWVudC5pZC5pbmRleE9mKGlkUHJlZml4KSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5pZCA6ICcnO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBwcmVmaXggb2Ygbm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUHJlZml4IG9mIG5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZUlkUHJlZml4OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXROb2RlSWRQcmVmaXgoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgbm9kZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge29iamVjdHx1bmRlZmluZWR9IE5vZGUgZGF0YVxyXG4gICAgICovXHJcbiAgICBnZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Tm9kZURhdGEobm9kZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZGF0YSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gUHJvcGVydGllc1xyXG4gICAgICovXHJcbiAgICBzZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0gbmFtZXMgLSBOYW1lcyBvZiBwcm9wZXJ0aWVzXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIG5hbWVzKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmVOb2RlRGF0YShub2RlSWQsIG5hbWVzKVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9wZW4gbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgb3BlbjogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgc3RhdGUgPSBub2RlU3RhdGVzLk9QRU5FRDtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcclxuICAgICAgICAgICAgbm9kZS5zZXRTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDbG9zZSBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICovXHJcbiAgICBjbG9zZTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgc3RhdGUgPSBub2RlU3RhdGVzLkNMT1NFRDtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcclxuICAgICAgICAgICAgbm9kZS5zZXRTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiovXHJcbiAgICB0b2dnbGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIHN0YXRlO1xyXG5cclxuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc1Jvb3QoKSkge1xyXG4gICAgICAgICAgICBub2RlLnRvZ2dsZVN0YXRlKCk7XHJcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU29ydCBhbGwgbm9kZXNcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgLSBDb21wYXJhdG9yIGZvciBzb3J0aW5nXHJcbiAgICAgKi9cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLnNvcnQoY29tcGFyYXRvcik7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVmcmVzaCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVHJlZU5vZGUgaWQgdG8gcmVmcmVzaFxyXG4gICAgICoqL1xyXG4gICAgcmVmcmVzaDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXHJcbiAgICAgKi9cclxuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIG5vZGUocykuXHJcbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cclxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdy1kYXRhXHJcbiAgICAgKiBAcGFyYW0geyp9IHBhcmVudElkIC0gUGFyZW50IGlkXHJcbiAgICAgKi9cclxuICAgIGFkZDogZnVuY3Rpb24oZGF0YSwgcGFyZW50SWQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLmFkZChkYXRhLCBwYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxyXG4gICAgICovXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwucmVtb3ZlKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTW92ZSBhIG5vZGUgdG8gbmV3IHBhcmVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcclxuICAgICAqL1xyXG4gICAgbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwubW92ZShub2RlSWQsIG5ld1BhcmVudElkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGUgZmFjaWxpdHkgb2YgdHJlZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVOYW1lIC0gJ1NlbGVjdGFibGUnLCAnRHJhZ2dhYmxlJ1xyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIEZlYXR1cmUgb3B0aW9uc1xyXG4gICAgICogQHJldHVybiB7VHJlZX0gdGhpc1xyXG4gICAgICovXHJcbiAgICBlbmFibGVGZWF0dXJlOiBmdW5jdGlvbihmZWF0dXJlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgICAgIHZhciBGZWF0dXJlID0gVHJlZS5mZWF0dXJlc1tmZWF0dXJlTmFtZV07XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlRmVhdHVyZShmZWF0dXJlTmFtZSk7XHJcblxyXG4gICAgICAgIGlmIChGZWF0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXSA9IG5ldyBGZWF0dXJlKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNhYmxlIGZhY2lsaXR5IG9mIHRyZWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtICdTZWxlY3RhYmxlJywgJ0RyYWdnYWJsZSdcclxuICAgICAqIEByZXR1cm4ge1RyZWV9IHRoaXNcclxuICAgICAqL1xyXG4gICAgZGlzYWJsZUZlYXR1cmU6IGZ1bmN0aW9uKGZlYXR1cmVOYW1lKSB7XHJcbiAgICAgICAgdmFyIGZlYXR1cmUgPSB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV07XHJcblxyXG4gICAgICAgIGlmIChmZWF0dXJlKSB7XHJcbiAgICAgICAgICAgIGZlYXR1cmUuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnR1aS51dGlsLmZvckVhY2goZmVhdHVyZXMsIGZ1bmN0aW9uKEZlYXR1cmUsIG5hbWUpIHtcclxuICAgIGNvbnNvbGUubG9nKG5hbWUsIEZlYXR1cmUpO1xyXG4gICAgVHJlZS5yZWdpc3RlckZlYXR1cmUobmFtZSwgRmVhdHVyZSk7XHJcbn0pO1xyXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVHJlZSk7XHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlb3ZlcnZpZXcgVXBkYXRlIHZpZXcgYW5kIGNvbnRyb2wgdHJlZSBkYXRhXHJcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBUcmVlTm9kZSA9IHJlcXVpcmUoJy4vdHJlZU5vZGUnKSxcclxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcclxuXHJcbnZhciBzbmlwcGV0ID0gdHVpLnV0aWwsXHJcbiAgICBleHRlbmQgPSBzbmlwcGV0LmV4dGVuZCxcclxuICAgIGtleXMgPSBzbmlwcGV0LmtleXMsXHJcbiAgICBmb3JFYWNoID0gc25pcHBldC5mb3JFYWNoLFxyXG4gICAgbWFwID0gc25pcHBldC5tYXAsXHJcbiAgICBmaWx0ZXIgPSBzbmlwcGV0LmZpbHRlcixcclxuICAgIGluQXJyYXkgPSBzbmlwcGV0LmluQXJyYXk7XHJcblxyXG4vKipcclxuICogVHJlZSBtb2RlbFxyXG4gKiBAY29uc3RydWN0b3IgVHJlZU1vZGVsXHJcbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBEYXRhXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9ucyBmb3IgZGVmYXVsdFN0YXRlIGFuZCBub2RlSWRQcmVmaXhcclxuICoqL1xyXG52YXIgVHJlZU1vZGVsID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlTW9kZWwucHJvdG90eXBlICoveyAvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgey8qZXNsaW50LWVuYWJsZSovXHJcbiAgICAgICAgVHJlZU5vZGUuc2V0SWRQcmVmaXgob3B0aW9ucy5ub2RlSWRQcmVmaXgpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWZhdWx0IHN0YXRlIG9mIG5vZGVcclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubm9kZURlZmF1bHRTdGF0ZSA9IG9wdGlvbnMubm9kZURlZmF1bHRTdGF0ZTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUm9vdCBub2RlXHJcbiAgICAgICAgICogQHR5cGUge1RyZWVOb2RlfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucm9vdE5vZGUgPSBuZXcgVHJlZU5vZGUoe1xyXG4gICAgICAgICAgICBzdGF0ZTogJ29wZW5lZCdcclxuICAgICAgICB9LCBudWxsKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVHJlZSBoYXNoIGhhdmluZyBhbGwgbm9kZXNcclxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0LjxzdHJpbmcsIFRyZWVOb2RlPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRyZWVIYXNoID0ge307XHJcblxyXG4gICAgICAgIHRoaXMuX3NldERhdGEoZGF0YSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIFRyZWVOb2RlLmlkUHJlZml4O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBtb2RlbCB3aXRoIHRyZWUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIFRyZWUgZGF0YVxyXG4gICAgICovXHJcbiAgICBfc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHZhciByb290ID0gdGhpcy5yb290Tm9kZSxcclxuICAgICAgICAgICAgcm9vdElkID0gcm9vdC5nZXRJZCgpO1xyXG5cclxuICAgICAgICB0aGlzLnRyZWVIYXNoW3Jvb3RJZF0gPSByb290O1xyXG4gICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCByb290KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHRyZWUgaGFzaCBmcm9tIGRhdGEgYW5kIHBhcmVudE5vZGVcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBUcmVlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IHBhcmVudCAtIFBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfbWFrZVRyZWVIYXNoOiBmdW5jdGlvbihkYXRhLCBwYXJlbnQpIHtcclxuICAgICAgICB2YXIgcGFyZW50SWQgPSBwYXJlbnQuZ2V0SWQoKTtcclxuXHJcbiAgICAgICAgZm9yRWFjaChkYXRhLCBmdW5jdGlvbihkYXR1bSkge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW5EYXRhID0gZGF0dW0uY2hpbGRyZW4sXHJcbiAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5fY3JlYXRlTm9kZShkYXR1bSwgcGFyZW50SWQpLFxyXG4gICAgICAgICAgICAgICAgbm9kZUlkID0gbm9kZS5nZXRJZCgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy50cmVlSGFzaFtub2RlSWRdID0gbm9kZTtcclxuICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcclxuICAgICAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGNoaWxkcmVuRGF0YSwgbm9kZSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIG5vZGVcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlRGF0YSAtIERhdHVtIG9mIG5vZGVcclxuICAgICAqIEBwYXJhbSB7Kn0gcGFyZW50SWQgLSBQYXJlbnQgaWRcclxuICAgICAqIEByZXR1cm4ge1RyZWVOb2RlfSBUcmVlTm9kZVxyXG4gICAgICovXHJcbiAgICBfY3JlYXRlTm9kZTogZnVuY3Rpb24obm9kZURhdGEsIHBhcmVudElkKSB7XHJcbiAgICAgICAgdmFyIG5vZGU7XHJcbiAgICAgICAgbm9kZURhdGEgPSBleHRlbmQoe1xyXG4gICAgICAgICAgICBzdGF0ZTogdGhpcy5ub2RlRGVmYXVsdFN0YXRlXHJcbiAgICAgICAgfSwgbm9kZURhdGEpO1xyXG5cclxuICAgICAgICBub2RlID0gbmV3IFRyZWVOb2RlKG5vZGVEYXRhLCBwYXJlbnRJZCk7XHJcbiAgICAgICAgbm9kZS5yZW1vdmVEYXRhKCdjaGlsZHJlbicpO1xyXG5cclxuICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgY2hpbGRyZW5cclxuICAgICAqIEBwYXJhbSB7Kn0gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybiB7QXJyYXkuPFRyZWVOb2RlPnx1bmRlZmluZWR9IGNoaWxkcmVuXHJcbiAgICAgKi9cclxuICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLmdldENoaWxkSWRzKG5vZGVJZCk7XHJcbiAgICAgICAgaWYgKCFjaGlsZElkcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbWFwKGNoaWxkSWRzLCBmdW5jdGlvbihjaGlsZElkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE5vZGUoY2hpbGRJZCk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGNoaWxkIGlkc1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPnx1bmRlZmluZWR9IENoaWxkIGlkc1xyXG4gICAgICovXHJcbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0Q2hpbGRJZHMoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIG51bWJlciBvZiBub2Rlc1xyXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIG51bWJlciBvZiBub2Rlc1xyXG4gICAgICovXHJcbiAgICBnZXRDb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGtleXModGhpcy50cmVlSGFzaCkubGVuZ3RoO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBsYXN0IGRlcHRoXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbGFzdCBkZXB0aFxyXG4gICAgICovXHJcbiAgICBnZXRMYXN0RGVwdGg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBkZXB0aHMgPSBtYXAodGhpcy50cmVlSGFzaCwgZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXREZXB0aChub2RlLmdldElkKCkpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgZGVwdGhzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaW5kIG5vZGVcclxuICAgICAqIEBwYXJhbSB7Kn0gaWQgLSBBIG5vZGUgaWQgdG8gZmluZFxyXG4gICAgICogQHJldHVybiB7VHJlZU5vZGV8dW5kZWZpbmVkfSBOb2RlXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGU6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHJlZUhhc2hbaWRdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBkZXB0aCBmcm9tIG5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7Kn0gaWQgLSBBIG5vZGUgaWQgdG8gZmluZFxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH0gRGVwdGhcclxuICAgICAqL1xyXG4gICAgZ2V0RGVwdGg6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxyXG4gICAgICAgICAgICBkZXB0aCA9IDAsXHJcbiAgICAgICAgICAgIHBhcmVudDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShub2RlLmdldFBhcmVudElkKCkpO1xyXG4gICAgICAgIHdoaWxlIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgZGVwdGggKz0gMTtcclxuICAgICAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKHBhcmVudC5nZXRQYXJlbnRJZCgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkZXB0aDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gcGFyZW50IGlkIG9mIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8dW5kZWZpbmVkfSBQYXJlbnQgaWRcclxuICAgICAqL1xyXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbm9kZS5nZXRQYXJlbnRJZCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhIG5vZGUgd2l0aCBjaGlsZHJlbi5cclxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxyXG4gICAgICovXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKGlkLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKSxcclxuICAgICAgICAgICAgcGFyZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XHJcblxyXG4gICAgICAgIGZvckVhY2gobm9kZS5nZXRDaGlsZElkcygpLCBmdW5jdGlvbihjaGlsZElkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNoaWxkSWQsIHRydWUpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGRJZChpZCk7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMudHJlZUhhc2hbaWRdO1xyXG5cclxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgcGFyZW50LmdldElkKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgbm9kZShzKS5cclxuICAgICAqIC0gSWYgdGhlIHBhcmVudElkIGlzIGZhbHN5LCB0aGUgbm9kZSB3aWxsIGJlIGFwcGVuZGVkIHRvIHJvb3ROb2RlLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3LWRhdGFcclxuICAgICAqIEBwYXJhbSB7Kn0gcGFyZW50SWQgLSBQYXJlbnQgaWRcclxuICAgICAqL1xyXG4gICAgYWRkOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGU7XHJcblxyXG4gICAgICAgIGRhdGEgPSBbXS5jb25jYXQoZGF0YSk7XHJcbiAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHBhcmVudCk7XHJcbiAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcclxuICAgICAqIEBwYXJhbSB7Kn0gaWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgLSBQcm9wZXJ0aWVzXHJcbiAgICAgKi9cclxuICAgIHNldE5vZGVEYXRhOiBmdW5jdGlvbihpZCwgcHJvcHMpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSB8fCAhcHJvcHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbm9kZS5zZXREYXRhKHByb3BzKTtcclxuICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIG5vZGUuZ2V0UGFyZW50SWQoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIG5vZGUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xyXG4gICAgICovXHJcbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24oaWQsIG5hbWVzKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUgfHwgIW5hbWVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0dWkudXRpbC5pc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICBub2RlLnJlbW92ZURhdGEuYXBwbHkobm9kZSwgbmFtZXMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRGF0YShuYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgbm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNb3ZlIGEgbm9kZSB0byBuZXcgcGFyZW50J3MgY2hpbGRcclxuICAgICAqIEBwYXJhbSB7Kn0gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHsqfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcclxuICAgICAqL1xyXG4gICAgbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIG9yaWdpbmFsUGFyZW50LCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnQ7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5ld1BhcmVudCA9IHRoaXMuZ2V0Tm9kZShuZXdQYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZTtcclxuICAgICAgICBuZXdQYXJlbnRJZCA9IG5ld1BhcmVudC5nZXRJZCgpO1xyXG4gICAgICAgIG9yaWdpbmFsUGFyZW50SWQgPSBub2RlLmdldFBhcmVudElkKCk7XHJcbiAgICAgICAgb3JpZ2luYWxQYXJlbnQgPSB0aGlzLmdldE5vZGUob3JpZ2luYWxQYXJlbnRJZCk7XHJcblxyXG4gICAgICAgIGlmIChub2RlSWQgPT09IG5ld1BhcmVudElkIHx8IHRoaXMuY29udGFpbnMobm9kZUlkLCBuZXdQYXJlbnRJZCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvcmlnaW5hbFBhcmVudC5yZW1vdmVDaGlsZElkKG5vZGVJZCk7XHJcbiAgICAgICAgbm9kZS5zZXRQYXJlbnRJZChuZXdQYXJlbnRJZCk7XHJcbiAgICAgICAgbmV3UGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcclxuXHJcbiAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywgbm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgdG8gc2VlIGlmIGEgbm9kZSBpcyBhIGRlc2NlbmRhbnQgb2YgYW5vdGhlciBub2RlLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lZElkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRoZSBub2RlIGlzIGNvbnRhaW5lZCBvciBub3RcclxuICAgICAqL1xyXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGNvbnRhaW5lcklkLCBjb250YWluZWRJZCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHRoaXMuZ2V0UGFyZW50SWQoY29udGFpbmVkSWQpLFxyXG4gICAgICAgICAgICBpc0NvbnRhaW5lZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB3aGlsZSAoIWlzQ29udGFpbmVkICYmIHBhcmVudElkKSB7XHJcbiAgICAgICAgICAgIGlzQ29udGFpbmVkID0gKGNvbnRhaW5lcklkID09PSBwYXJlbnRJZCk7XHJcbiAgICAgICAgICAgIHBhcmVudElkID0gdGhpcy5nZXRQYXJlbnRJZChwYXJlbnRJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpc0NvbnRhaW5lZDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTb3J0IG5vZGVzXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIC0gQ29tcGFyYXRvciBmdW5jdGlvblxyXG4gICAgICovXHJcbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XHJcbiAgICAgICAgdGhpcy5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmdldENoaWxkcmVuKG5vZGVJZCksXHJcbiAgICAgICAgICAgICAgICBjaGlsZElkcztcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbi5zb3J0KGNvbXBhcmF0b3IpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNoaWxkSWRzID0gbWFwKGNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZC5nZXRJZCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBub2RlLnJlcGxhY2VDaGlsZElkcyhjaGlsZElkcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgbm9kZSBkYXRhIChhbGwpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybiB7b2JqZWN0fHVuZGVmaW5lZH0gTm9kZSBkYXRhXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbm9kZS5nZXRBbGxEYXRhKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXHJcbiAgICAgKi9cclxuICAgIGVhY2hBbGw6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XHJcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcclxuXHJcbiAgICAgICAgZm9yRWFjaCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaXRlcmF0ZWUuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIGRlc2NlbmRhbnRzIG9mIGEgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxyXG4gICAgICovXHJcbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgc3RhY2ssIG5vZGVJZCwgbm9kZTtcclxuXHJcbiAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShwYXJlbnRJZCk7XHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhY2sgPSBub2RlLmdldENoaWxkSWRzKCk7XHJcblxyXG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBub2RlSWQgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xyXG4gICAgICAgICAgICBpdGVyYXRlZS5jYWxsKGNvbnRleHQsIG5vZGUsIG5vZGVJZCk7XHJcblxyXG4gICAgICAgICAgICB1dGlsLnB1c2hBbGwoc3RhY2ssIG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuXHJcbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihUcmVlTW9kZWwpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVNb2RlbDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RhdGVzID0gcmVxdWlyZSgnLi9zdGF0ZXMnKS5ub2RlLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIGxhc3RJbmRleCA9IDAsXG4gICAgZ2V0TmV4dEluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxhc3RJbmRleDtcbiAgICAgICAgbGFzdEluZGV4ICs9IDE7XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9LFxuICAgIFJFU0VSVkVEX1BST1BFUlRJRVMgPSB7XG4gICAgICAgIGlkOiAnJyxcbiAgICAgICAgc3RhdGU6ICdzZXRTdGF0ZSdcbiAgICB9LFxuICAgIGluQXJyYXkgPSB0dWkudXRpbC5pbkFycmF5O1xuXG4vKipcbiAqIFRyZWVOb2RlXG4gKiBAQ29uc3RydWN0b3IgVHJlZU5vZGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBub2RlRGF0YSAtIE5vZGUgZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IFtwYXJlbnRJZF0gLSBQYXJlbnQgbm9kZSBpZFxuICovXG52YXIgVHJlZU5vZGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVOb2RlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIHNldElkUHJlZml4OiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgICAgIHRoaXMuaWRQcmVmaXggPSBwcmVmaXggfHwgdGhpcy5pZFByZWZpeDtcbiAgICAgICAgfSxcbiAgICAgICAgaWRQcmVmaXg6ICcnXG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbihub2RlRGF0YSwgcGFyZW50SWQpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2lkID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFyZW50IG5vZGUgaWRcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3BhcmVudElkID0gcGFyZW50SWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgICAgICogQHR5cGUge0FycmF5LjxudW1iZXI+fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fY2hpbGRJZHMgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBkYXRhXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9kYXRhID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgc3RhdGVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLkNMT1NFRDtcblxuICAgICAgICB0aGlzLl9zdGFtcElkKCk7XG4gICAgICAgIHRoaXMuc2V0RGF0YShub2RlRGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YW1wIG5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zdGFtcElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5faWQgPSB0aGlzLmNvbnN0cnVjdG9yLmlkUHJlZml4ICsgZ2V0TmV4dEluZGV4KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByZXNlcnZlZCBwcm9wZXJ0aWVzIGZyb20gZGF0YVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gTm9kZSBkYXRhXG4gICAgICogQHJldHVybnMge29iamVjdH0gTm9kZSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0UmVzZXJ2ZWRQcm9wZXJ0aWVzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2hPd25Qcm9wZXJ0aWVzKFJFU0VSVkVEX1BST1BFUlRJRVMsIGZ1bmN0aW9uKHNldHRlciwgbmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtuYW1lXTtcblxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHNldHRlcikge1xuICAgICAgICAgICAgICAgIHRoaXNbc2V0dGVyXSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgZGF0YVtuYW1lXTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBzdGF0ZVxuICAgICAqL1xuICAgIHRvZ2dsZVN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlID09PSBzdGF0ZXMuQ0xPU0VEKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5PUEVORUQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHN0YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gU3RhdGUgb2Ygbm9kZSAoJ2Nsb3NlZCcsICdvcGVuZWQnKVxuICAgICAqL1xuICAgIHNldFN0YXRlOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICBzdGF0ZSArPSAnJztcbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXNbc3RhdGUudG9VcHBlckNhc2UoKV0gfHwgdGhpcy5fc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzdGF0ZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHN0YXRlICgnb3BlbmVkJyBvciAnY2xvc2VkJylcbiAgICAgKi9cbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGlkXG4gICAgICogQHJldHVybnMge251bWJlcn0gTm9kZSBpZFxuICAgICAqL1xuICAgIGdldElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcGFyZW50IGlkXG4gICAgICogQHJldHVybnMge251bWJlcn0gUGFyZW50IG5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnRJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICovXG4gICAgc2V0UGFyZW50SWQ6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHZhciBpc0ludmFsaWQgPSAocGFyZW50SWQgPT09IHRoaXMuX2lkKSB8fCBpbkFycmF5KHBhcmVudElkLCB0aGlzLl9jaGlsZElkcyk7XG5cbiAgICAgICAgaWYgKGlzSW52YWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhcmVudElkID0gcGFyZW50SWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2UgY2hpbGRJZHNcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBjaGlsZElkcyAtIElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKi9cbiAgICByZXBsYWNlQ2hpbGRJZHM6IGZ1bmN0aW9uKGNoaWxkSWRzKSB7XG4gICAgICAgIHZhciBpc0ludmFsaWQgPSAoaW5BcnJheSh0aGlzLl9pZCwgY2hpbGRJZHMpICE9PSAtMSkgfHwgKGluQXJyYXkodGhpcy5fcGFyZW50SWQsIGNoaWxkSWRzKSAhPT0gLTEpXG5cbiAgICAgICAgaWYgKGlzSW52YWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NoaWxkSWRzID0gY2hpbGRJZHM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICogQHJldHVybnMge0FycmF5LjxudW1iZXI+fSBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICovXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRJZHMuc2xpY2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIGFkZENoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuX2NoaWxkSWRzLFxuICAgICAgICAgICAgaXNJbnZhbGlkID0gKGlkID09PSB0aGlzLl9wYXJlbnRJZCkgfHwgKGlkID09PSB0aGlzLl9pZCk7XG5cbiAgICAgICAgaWYgKGlzSW52YWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR1aS51dGlsLmluQXJyYXkoY2hpbGRJZHMsIGlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNoaWxkSWRzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICByZW1vdmVDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB1dGlsLnJlbW92ZUl0ZW1Gcm9tQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGRhdGFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFByb3BlcnR5IG5hbWUgb2YgZGF0YVxuICAgICAqIEByZXR1cm5zIHsqfSBEYXRhXG4gICAgICovXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtuYW1lXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBkYXRhXG4gICAgICogQHJldHVybnMge09iamVjdH0gRGF0YVxuICAgICAqL1xuICAgIGdldEFsbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuZXh0ZW5kKHt9LCB0aGlzLl9kYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGFcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIERhdGEgZm9yIGFkZGluZ1xuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZGF0YSA9IHRoaXMuX3NldFJlc2VydmVkUHJvcGVydGllcyhkYXRhKTtcbiAgICAgICAgdHVpLnV0aWwuZXh0ZW5kKHRoaXMuX2RhdGEsIGRhdGEpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBkYXRhXG4gICAgICogQHBhcmFtIHsuLi5zdHJpbmd9IG5hbWVzIC0gTmFtZXMgb2YgZGF0YVxuICAgICAqL1xuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKG5hbWVzKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2hBcnJheShhcmd1bWVudHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoaXMgbm9kZSBoYXMgYSBwcm92aWRlZCBjaGlsZCBpZC5cbiAgICAgKi9cbiAgICBoYXNDaGlsZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIGluQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKSAhPT0gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyBsZWFmLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIGxlYWYgb3Igbm90LlxuICAgICAqL1xuICAgIGlzTGVhZjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5sZW5ndGggPT09IDA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyByb290LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIHJvb3Qgb3Igbm90LlxuICAgICAqL1xuICAgIGlzUm9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5pc0ZhbHN5KHRoaXMuX3BhcmVudElkKTtcbiAgICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU5vZGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbnZhciB1dGlsID0ge1xuICAgIC8qKlxuICAgICAqIFB1c2ggYWxsIGVsZW1lbnRzIGZyb20gbmV3IGFycmF5XG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyMSAtIEJhc2UgYXJyYXlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIyIC0gTmV3IGFycmF5XG4gICAgICovXG4gICAgcHVzaEFsbDogZnVuY3Rpb24oYXJyMSwgYXJyMikge1xuICAgICAgICB2YXIgbGVuZ3RoID0gYXJyMi5sZW5ndGgsXG4gICAgICAgICAgICBpID0gMDtcblxuICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBhcnIxLnB1c2goYXJyMltpXSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpcnN0IHNwZWNpZmllZCBpdGVtIGZyb20gYXJyYXksIGlmIGl0IGV4aXN0c1xuICAgICAqIEBwYXJhbSB7Kn0gaXRlbSBJdGVtIHRvIGxvb2sgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyIEFycmF5IHRvIHF1ZXJ5XG4gICAgICovXG4gICAgcmVtb3ZlSXRlbUZyb21BcnJheTogZnVuY3Rpb24oaXRlbSwgYXJyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoaXRlbSwgYXJyKTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNsYXNzbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBDbGFzc25hbWVcbiAgICAgKi9cbiAgICBhZGRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgICAgICB9IGVsc2UgaWYgKCF1dGlsLmhhc0NsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lICs9ICcgJyArIGNsYXNzTmFtZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgY2xhc3NuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSAtIENsYXNzbmFtZVxuICAgICAqL1xuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIG9yaWdpbmFsQ2xhc3NOYW1lID0gdXRpbC5nZXRDbGFzcyhlbGVtZW50KSxcbiAgICAgICAgICAgIGFyciwgaW5kZXg7XG5cbiAgICAgICAgaWYgKCFvcmlnaW5hbENsYXNzTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyID0gb3JpZ2luYWxDbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICAgICAgaW5kZXggPSB0dWkudXRpbC5pbkFycmF5KGNsYXNzTmFtZSwgYXJyKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGFyci5qb2luKCcgJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgdG8gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIEEgbmFtZSBvZiBldmVudCBcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYWRkXG4gICAgICovXG4gICAgYWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGZyb20gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIEEgbmFtZSBvZiBldmVudFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZW1vdmVcbiAgICAgKi9cbiAgICByZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5kZXRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSBFdmVudCB0YXJnZXRcbiAgICAgKi9cbiAgICBnZXRUYXJnZXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldDtcbiAgICAgICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgICAgICB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBIVE1MRWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IENsYXNzIG5hbWVcbiAgICAgKi9cbiAgICBnZXRDbGFzczogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZWxlbWVudCAmJiBlbGVtZW50LmdldEF0dHJpYnV0ZSAmJiAoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgfHwgJycpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGUgZWxlbWVudCBoYXMgc3BlY2lmaWMgY2xhc3Mgb3Igbm90XG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3MgdG8gZmluZFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHRoZSBjbGFzc1xuICAgICAqL1xuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGVsQ2xhc3NOYW1lID0gdXRpbC5nZXRDbGFzcyhlbGVtZW50KTtcblxuICAgICAgICByZXR1cm4gZWxDbGFzc05hbWUuaW5kZXhPZihjbGFzc05hbWUpID4gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgZWxlbWVudCBieSBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzc1xuICAgICAqIEByZXR1cm4ge0FycmF5LjxIVE1MRWxlbWVudD59IEVsZW1lbnRzXG4gICAgICovXG4gICAgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZTogZnVuY3Rpb24odGFyZ2V0LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGFsbCwgZmlsdGVyZWQ7XG5cbiAgICAgICAgaWYgKHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZCA9IHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbGwgPSB0YXJnZXQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJyonKTtcbiAgICAgICAgICAgIGZpbHRlcmVkID0gdHVpLnV0aWwuZmlsdGVyKGFsbCwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gKGNsYXNzTmFtZXMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB3aGV0aGVyIHRoZSBjbGljayBldmVudCBieSByaWdodCBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGNsaWNrIGV2ZW50IGJ5IHJpZ2h0IGJ1dHRvblxuICAgICAqL1xuICAgIGlzUmlnaHRCdXR0b246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB1dGlsLl9nZXRCdXR0b24oZXZlbnQpID09PSAyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBwcm9wZXJ0eSBleGlzdCBvciBub3RcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwcm9wcyBBIHByb3BlcnR5XG4gICAgICogQHJldHVybiB7c3RyaW5nfGJvb2xlYW59IFByb3BlcnR5IG5hbWUgb3IgZmFsc2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciB1c2VyU2VsZWN0UHJvcGVydHkgPSB1dGlsLnRlc3RQcm9wKFtcbiAgICAgKiAgICAgJ3VzZXJTZWxlY3QnLFxuICAgICAqICAgICAnV2Via2l0VXNlclNlbGVjdCcsXG4gICAgICogICAgICdPVXNlclNlbGVjdCcsXG4gICAgICogICAgICdNb3pVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ21zVXNlclNlbGVjdCdcbiAgICAgKiBdKTtcbiAgICAgKi9cbiAgICB0ZXN0UHJvcDogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gZmFsc2U7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChwcm9wcywgZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICAgICAgaWYgKHByb3AgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eU5hbWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgZGVmYXVsdCBldmVudCBcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGh0bWwgZnJvbSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2UgLSBUZW1wbGF0ZSBodG1sXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gVGVtcGxhdGUgZGF0YVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGh0bWxcbiAgICAgKi9cbiAgICB0ZW1wbGF0ZTogZnVuY3Rpb24oc291cmNlLCBwcm9wcykge1xuICAgICAgICByZXR1cm4gc291cmNlLnJlcGxhY2UoL1xce1xceyhcXHcrKX19L2dpLCBmdW5jdGlvbihtYXRjaCwgbmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gcHJvcHNbbmFtZV07XG4gICAgICAgICAgICBpZiAodHVpLnV0aWwuaXNGYWxzeSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemF0aW9uIGZvciBldmVudCBidXR0b24gcHJvcGVydHkgXG4gICAgICogMDogRmlyc3QgbW91c2UgYnV0dG9uLCAyOiBTZWNvbmQgbW91c2UgYnV0dG9uLCAxOiBDZW50ZXIgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfSBidXR0b24gdHlwZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGJ1dHRvbixcbiAgICAgICAgICAgIHByaW1hcnkgPSAnMCwxLDMsNSw3JyxcbiAgICAgICAgICAgIHNlY29uZGFyeSA9ICcyLDYnLFxuICAgICAgICAgICAgd2hlZWwgPSAnNCc7XG5cbiAgICAgICAgaWYgKGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoJ01vdXNlRXZlbnRzJywgJzIuMCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXZlbnQuYnV0dG9uO1xuICAgICAgICB9XG5cbiAgICAgICAgYnV0dG9uID0gZXZlbnQuYnV0dG9uICsgJyc7XG4gICAgICAgIGlmIChwcmltYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIGlmIChzZWNvbmRhcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAyO1xuICAgICAgICB9IGVsc2UgaWYgKHdoZWVsLmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiJdfQ==
