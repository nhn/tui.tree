(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Tree', require('./src/js/tree'));

},{"./src/js/tree":4}],2:[function(require,module,exports){
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
    useDrag: false,
    useHelper: false,
    nodeDefaultState: 'closed',
    stateLabels: {
        opened: '-',
        closed: '+'
    },
    nodeIdPrefix: 'tui-tree-node-',
    helperPos: {
        y: 10,
        x: 10
    },
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
     * States of tree
     * @type {{NORMAL: number, EDITABLE: number}}
     */
    tree: {
        NORMAL: 1,
        EDITABLE: 2
    },

    /**
     * States of node
     * @type {{OPENED: string, CLOSED: string}}
     */
    node: {
        OPENED: 'opened',
        CLOSED: 'closed'
    }
};

},{}],4:[function(require,module,exports){
/**
 * @fileoverview Render tree and update tree.
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

'use strict';

var defaults = require('./defaults'),
    util = require('./util'),
    states = require('./states'),
    TreeModel = require('./treeModel');

var treeStates = states.tree,
    nodeStates = states.node,
    snippet = tui.util,
    extend = snippet.extend,
    reduce = snippet.reduce;
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
    init: function(data, options) { /*eslint-enable*/
        var extend = snippet.extend;
        options = extend({}, defaults, options);

        /**
         * A state of tree
         * @type {number}
         */
        this.state = treeStates.NORMAL;

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

        this._setRoot();
        this._drawChildren();
        this._setEvents();
    },

    _setRoot: function() {
        var rootEl = this.rootElement;

        if (!snippet.isHTMLNode(rootEl)) {
            rootEl = this.rootElement = document.createElement('UL');
            document.body.appendChild(rootEl);
        }
    },

    /**
     * Set event handler
     */
    _setEvents: function() {
        this.model.on('update', this._drawChildren, this);
        this.model.on('move', this._onMove, this);
        util.addEventListener(this.rootElement, 'click', snippet.bind(this._onClick, this));
    },

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
            this.toggleNode(this.getNodeIdFromElement(target));
            return;
        }

        if (this.clickTimer) {
            window.clearTimeout(this.clickTimer);
            this.clickTimer = null;
            this.fire('doubleClick', event);
        } else {
            this.clickTimer = setTimeout(function() {
                self.fire('singleClick', event);
                self.clickTimer = null;
            }, 400);
        }
    },

    /**
     * Set node state - opened or closed
     * @param {string} nodeId - Node id
     * @param {string} state - Node state
     * @private
     */
    _setNodeState: function(nodeId, state) {
        var subtreeElement = this._getSubtreeElement(nodeId),
            classNames, label, nodeClassName, display, btnElement, nodeElement;

        if (!subtreeElement || subtreeElement === this.rootElement) {
            return;
        }
        classNames = this.classNames;
        label = this.stateLabels[state];
        nodeElement = document.getElementById(nodeId);
        btnElement = util.getElementsByClassName(nodeElement, classNames.toggleBtnClass)[0];

        if (state === nodeStates.OPENED) {
            display = '';
        } else {
            display = 'none';
        }
        nodeClassName = this._getNodeClassNameFromState(nodeElement, state);

        nodeElement.className = nodeClassName;
        subtreeElement.style.display = display;
        if (btnElement) {
            btnElement.innerHTML = label;
        }
    },

    /**
     * Get node class name from new changed state
     * @param {HTMLElement} nodeElement - TreeNode element
     * @param {string} state - New changed state
     * @returns {string} Class name
     * @private
     */
    _getNodeClassNameFromState: function(nodeElement, state) {
        var classNames = this.classNames,
            openedClassName = classNames[nodeStates.OPENED + 'Class'],
            closedClassName = classNames[nodeStates.CLOSED + 'Class'],
            nodeClassName = nodeElement.className
                .replace(' ' + closedClassName, '')
                .replace(' ' + openedClassName, '');

        return nodeClassName + ' ' + classNames[state+'Class'];
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
            html = '',
            defaultSet = {
                textClass: classNames.textClass,
                subtreeClass: classNames.subtreeClass,
                toggleBtnClass: classNames.toggleBtnClass
            };

        snippet.forEach(nodeIds, function(nodeId) {
            var node = model.getNode(nodeId),
                state = node.getState(),
                nodeData = node.getAllData(),
                props = extend({
                    id: nodeId
                }, defaultSet, nodeData),
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
        if (!nodeId || (node && node.isLeaf())) {
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
     * Get node id from element
     * @param {HTMLElement} element - HTMLElement
     * @returns {string} Node id
     * @private
     */
    getNodeIdFromElement: function(element) {
        var idPrefix = this.model.getNodeIdPrefix();

        while (element && element.id.indexOf(idPrefix) === -1) {
            element = element.parentElement;
        }

        return element ? element.id : '';
    },

    /**
     * Get root node(or element) id
     * @returns {string} Root node id
     */
    getRootId: function() {
        return this.model.rootNode.getId();
    },

    getNodeIdPrefix: function() {
        return this.model.getNodeIdPrefix();
    },

    /**
     * Open node
     * @param {string} nodeId - Node id
     */
    open: function(nodeId) {
        this._setNodeState(nodeId, nodeStates.OPENED);
    },

    /**
     * Close node
     * @param {string} nodeId - Node id
     */
    close: function(nodeId) {
        this._setNodeState(nodeId, nodeStates.CLOSED);
    },

    /**
     * Toggle node
     * @param {string} nodeId - Node id
     * @private
     **/
    toggleNode: function(nodeId) {
        var node = this.model.getNode(nodeId),
            state;

        if (node) {
            node.toggleState();
            state = node.getState();
            this._setNodeState(nodeId, state);
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

    move: function(nodeId, newParentId) {
        this.model.move(nodeId, newParentId);
    },

    /**
     * Enable facility of tree
     * @param {string} facilityName - 'selection', 'dnd', 'editing'
     */
    enable: function(facilityName) {

    },

    /**
     * Disable facility of tree
     * @param {string} facilityName - 'selection', 'dnd', 'editing'
     */
    disable: function(facilityName) {

    }
});

tui.util.CustomEvents.mixin(Tree);
module.exports = Tree;

// Legacy helper
// *     @param {Object} [options.helperPos] A related position for helper object
//--------------------------------------------------------------------------------
//
///**
// * Whether drag and drop use or not
// * @type {boolean}
// */
//this.useDrag = options.useDrag;
//
///**
// * Whether helper element use or not
// * @type {boolean}
// */
//this.useHelper = this.useDrag && options.useHelper;
//
///**
// * Set relative position for helper object
// * @type {object}
// */
//this.helperPos = options.helperPos;
//
//
///**
// * Set drag and drop event
// * @private
// */
//_addDragEvent: function() {
//    var userSelectProperty = util.testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']),
//        isSupportSelectStart = 'onselectstart' in document;
//
//    if (isSupportSelectStart) {
//        util.addEventListener(this.rootElement, 'selectstart', util.preventDefault);
//    } else {
//        document.documentElement.style[userSelectProperty] = 'none';
//    }
//    util.addEventListener(this.rootElement, 'mousedown', snippet.bind(this._onMouseDown, this));
//},
//
///**
// * Show up guide element
// * @param {object} pos A element position
// * @param {string} value A element text value
// */
//enableHelper: function(pos, value) {
//    if (!this.helperElement) {
//        this.helperElement = document.createElement('span');
//        this.helperElement.style.position = 'absolute';
//        this.helperElement.style.display = 'none';
//        this.root.parentNode.appendChild(this.helperElement);
//    }
//
//    this.helperElement.innerHTML = value;
//},
//
///**
// * Set guide element location
// * @param {object} pos A position to move
// */
//setHelperLocation: function(pos) {
//    this.helperElement.style.left = pos.x + this.helperPos.x + 'px';
//    this.helperElement.style.top = pos.y + this.helperPos.y + 'px';
//    this.helperElement.style.display = '';
//},
//
///**
// * Hide guide element
// */
//disableHelper: function() {
//    if (this.helperElement) {
//        this.helperElement.style.display = 'none';
//    }
//},
},{"./defaults":2,"./states":3,"./treeModel":5,"./util":7}],5:[function(require,module,exports){
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
         * A buffer
         * @type {null}
         */
        this.buffer = null;

        /**
         * Root node
         * @type {TreeNode}
         */
        this.rootNode = new TreeNode({
            state: 'opened'
        }, null);

        /**
         * Tree hash having all nodes
         * @type {object.<*, TreeNode>}
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
     * @return {Array.<TreeNode>} children
     */
    getChildren: function(nodeId) {
        var node = this.getNode(nodeId);
        if (!node) {
            return [];
        }

        return map(node.getChildIds(), function(childId) {
            return this.getNode(childId);
        }, this);
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
     * Set properties of a node
     * @param {*} id Node id
     * @param {object} props Properties
     */
    set: function(id, props) {
        var node = this.getNode(id);

        if (!node || !props) {
            return;
        }

        node.addData(props);
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

        node.setParentId(newParentId);
        originalParent.removeChildId(nodeId);
        newParent.addChildId(nodeId);
        this.fire('move', nodeId, originalParentId, newParentId);
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

},{"./treeNode":6,"./util":7}],6:[function(require,module,exports){
'use strict';

var states = require('./states').node,
    util = require('./util');

var lastIndex = 0,
    getNextIndex = function() {
        lastIndex += 1;
        return lastIndex;
    },
    RESERVED_PROPERTIES = {
        id: '',
        state: 'setState'
    };

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
        this.addData(nodeData);
    },

    /**
     * Stamp node id
     * @private
     */
    _stampId: function() {
        this._id = this.constructor.idPrefix + getNextIndex();
    },

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
     * @param {number} id - Child node id
     */
    addChildId: function(id) {
        var childIds = this._childIds;

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
     * Add data
     * @param {Object} data - Data for adding
     */
    addData: function(data) {
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
     * Return whether this node is leaf.
     * @returns {boolean} Node is leaf or not.
     */
    isLeaf: function() {
        return (this._childIds.length === 0);
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

},{"./states":3,"./util":7}],7:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9kZWZhdWx0cy5qcyIsInNyYy9qcy9zdGF0ZXMuanMiLCJzcmMvanMvdHJlZS5qcyIsInNyYy9qcy90cmVlTW9kZWwuanMiLCJzcmMvanMvdHJlZU5vZGUuanMiLCJzcmMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6aUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInR1aS51dGlsLmRlZmluZU5hbWVzcGFjZSgndHVpLmNvbXBvbmVudC5UcmVlJywgcmVxdWlyZSgnLi9zcmMvanMvdHJlZScpKTtcbiIsIi8qKlxuICogQSBkZWZhdWx0IHZhbHVlcyBmb3IgdHJlZVxuICogQG1vZHVsZSBkZWZhdWx0c1xuICovXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWFrZSBjbGFzcyBuYW1lc1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIFByZWZpeCBvZiBjbGFzcyBuYW1lXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBrZXlzIC0gS2V5cyBvZiBjbGFzcyBuYW1lc1xuICogQHJldHVybnMge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBDbGFzc25hbWVzIG1hcFxuICovXG5mdW5jdGlvbiBtYWtlQ2xhc3NOYW1lcyhwcmVmaXgsIGtleXMpIHtcbiAgICB2YXIgb2JqID0ge307XG4gICAgdHVpLnV0aWwuZm9yRWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgb2JqW2tleSArICdDbGFzcyddID0gcHJlZml4ICsga2V5O1xuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogQGNvbnN0XG4gKiBAdHlwZSB7b2JqZWN0fVxuICogQHByb3BlcnR5IHtib29sZWFufSB1c2VEcmFnIC0gRGVmYXVsdDogZmFsc2VcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdXNlSGVscGVyIC0gRGVmYXVsdDogZmFsc2VcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBzdGF0ZUxhYmVsIC0gU3RhdGUgbGFiZWwgaW4gbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0ZUxhYmVsLm9wZW5lZCAtIERlZmF1bHQ6ICctJ1xuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0ZUxhYmVsLmNsb3NlZCAtIERlZmF1bHQ6ICcrJ1xuICogQHByb3BlcnR5IHtvYmplY3R9IHRlbXBsYXRlIC0gVGVtcGxhdGUgaHRtbCBmb3IgdGhlIG5vZGVzLlxuICogQHByb3BlcnR5IHtvYmplY3R9IGNsYXNzTmFtZXMgLSBDbGFzcyBuYW1lcyBvZiBlbGVtZW50cyBpbiB0cmVlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBvcGVuZWRDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3Igb3BlbmVkIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IGNsb3NlZENsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciBjbG9zZWQgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gc2VsZWN0ZWRDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3Igc2VsZWN0ZWQgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gc3VidHJlZUNsYXNzICAtIEEgY2xhc3MgbmFtZSBmb3Igc3VidHJlZSBpbiBpbnRlcm5hbCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSB0b2dnbGVDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3IgdG9nZ2xlIGJ1dHRvbiBpbiBpbnRlcm5hbCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSB0aXRsZUNsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciB0aXRsZSBlbGVtZW50IGluIGEgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gaW5wdXRDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3IgZWRpdGFibGUgZWxlbWVudCBpbiBhIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUuaW50ZXJuYWxOb2RlIC0gQSB0ZW1wbGF0ZSBodG1sIGZvciBpbnRlcm5hbCBub2RlLlxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZW1wbGF0ZS5sZWFmTm9kZSAtIEEgdGVtcGxhdGUgaHRtbCBmb3IgbGVhZiBub2RlLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB1c2VEcmFnOiBmYWxzZSxcbiAgICB1c2VIZWxwZXI6IGZhbHNlLFxuICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdjbG9zZWQnLFxuICAgIHN0YXRlTGFiZWxzOiB7XG4gICAgICAgIG9wZW5lZDogJy0nLFxuICAgICAgICBjbG9zZWQ6ICcrJ1xuICAgIH0sXG4gICAgbm9kZUlkUHJlZml4OiAndHVpLXRyZWUtbm9kZS0nLFxuICAgIGhlbHBlclBvczoge1xuICAgICAgICB5OiAxMCxcbiAgICAgICAgeDogMTBcbiAgICB9LFxuICAgIGNsYXNzTmFtZXM6IG1ha2VDbGFzc05hbWVzKCd0dWktdHJlZS0nLCBbXG4gICAgICAgICdvcGVuZWQnLFxuICAgICAgICAnY2xvc2VkJyxcbiAgICAgICAgJ3NlbGVjdGVkJyxcbiAgICAgICAgJ3N1YnRyZWUnLFxuICAgICAgICAndG9nZ2xlQnRuJyxcbiAgICAgICAgJ3RleHQnLFxuICAgICAgICAnaW5wdXQnXG4gICAgXSksXG4gICAgdGVtcGxhdGU6IHtcbiAgICAgICAgaW50ZXJuYWxOb2RlOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ0dWktdHJlZS1ub2RlIHt7c3RhdGVDbGFzc319XCI+JyArXG4gICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPicgK1xuICAgICAgICAnPC9saT4nLFxuICAgICAgICBsZWFmTm9kZTpcbiAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwidHVpLXRyZWUtbm9kZSB0dWktdHJlZS1sZWFmXCI+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gICAgICAgICc8L2xpPidcbiAgICB9XG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFN0YXRlcyBpbiB0cmVlXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFN0YXRlcyBpbiB0cmVlXG4gKiBAbW9kdWxlIHN0YXRlc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvKipcbiAgICAgKiBTdGF0ZXMgb2YgdHJlZVxuICAgICAqIEB0eXBlIHt7Tk9STUFMOiBudW1iZXIsIEVESVRBQkxFOiBudW1iZXJ9fVxuICAgICAqL1xuICAgIHRyZWU6IHtcbiAgICAgICAgTk9STUFMOiAxLFxuICAgICAgICBFRElUQUJMRTogMlxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdGF0ZXMgb2Ygbm9kZVxuICAgICAqIEB0eXBlIHt7T1BFTkVEOiBzdHJpbmcsIENMT1NFRDogc3RyaW5nfX1cbiAgICAgKi9cbiAgICBub2RlOiB7XG4gICAgICAgIE9QRU5FRDogJ29wZW5lZCcsXG4gICAgICAgIENMT1NFRDogJ2Nsb3NlZCdcbiAgICB9XG59O1xuIiwiLyoqXHJcbiAqIEBmaWxlb3ZlcnZpZXcgUmVuZGVyIHRyZWUgYW5kIHVwZGF0ZSB0cmVlLlxyXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnLi9kZWZhdWx0cycpLFxyXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxyXG4gICAgc3RhdGVzID0gcmVxdWlyZSgnLi9zdGF0ZXMnKSxcclxuICAgIFRyZWVNb2RlbCA9IHJlcXVpcmUoJy4vdHJlZU1vZGVsJyk7XHJcblxyXG52YXIgdHJlZVN0YXRlcyA9IHN0YXRlcy50cmVlLFxyXG4gICAgbm9kZVN0YXRlcyA9IHN0YXRlcy5ub2RlLFxyXG4gICAgc25pcHBldCA9IHR1aS51dGlsLFxyXG4gICAgZXh0ZW5kID0gc25pcHBldC5leHRlbmQsXHJcbiAgICByZWR1Y2UgPSBzbmlwcGV0LnJlZHVjZTtcclxuLyoqXHJcbiAqIENyZWF0ZSB0cmVlIG1vZGVsIGFuZCBpbmplY3QgZGF0YSB0byBtb2RlbFxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgQSBkYXRhIHRvIGJlIHVzZWQgb24gdHJlZVxyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9uc1xyXG4gKiAgICAgQHBhcmFtIHtIVE1MRWxlbWVudH0gW29wdGlvbnMucm9vdEVsZW1lbnRdIFJvb3QgZWxlbWVudCAoSXQgc2hvdWxkIGJlICdVTCcgZWxlbWVudClcclxuICogICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5ub2RlSWRQcmVmaXhdIEEgZGVmYXVsdCBwcmVmaXggb2YgYSBub2RlXHJcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuZGVmYXVsdFN0YXRlXSBBIGRlZmF1bHQgc3RhdGUgb2YgYSBub2RlXHJcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMudGVtcGxhdGVdIEEgbWFya3VwIHNldCB0byBtYWtlIGVsZW1lbnRcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGUuaW50ZXJuYWxOb2RlXSBIVE1MIHRlbXBsYXRlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlLmxlYWZOb2RlXSBIVE1MIHRlbXBsYXRlXHJcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuc3RhdGVMYWJlbHNdIFRvZ2dsZSBidXR0b24gc3RhdGUgbGFiZWxcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhdGVMYWJlbHMub3BlbmVkXSBTdGF0ZS1PUEVORUQgbGFiZWwgKFRleHQgb3IgSFRNTClcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhdGVMYWJlbHMuY2xvc2VkXSBTdGF0ZS1DTE9TRUQgbGFiZWwgKFRleHQgb3IgSFRNTClcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5jbGFzc05hbWVzXSBDbGFzcyBuYW1lcyBmb3IgdHJlZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLm9wZW5lZENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIG9wZW5lZCBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuY2xvc2VkQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgY2xvc2VkIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5zZWxlY3RlZENsYXNzXSBBIGNsYXNzIG5hbWUgdG8gc2VsZWN0ZWQgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnRleHRDbGFzc10gQSBjbGFzcyBuYW1lIHRoYXQgZm9yIHRleHRFbGVtZW50IGluIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5pbnB1dENsYXNzXSBBIGNsYXNzIGlucHV0IGVsZW1lbnQgaW4gYSBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuc3VidHJlZUNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIHN1YnRyZWUgaW4gaW50ZXJuYWwgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIHRvZ2dsZSBidXR0b24gaW4gaW50ZXJuYWwgbm9kZVxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL0RlZmF1bHQgb3B0aW9uc1xyXG4gKiAvLyAgIC0gSFRNTCBURU1QTEFURVxyXG4gKiAvLyAgICAgICAtIFRoZSBwcmVmaXggXCJkX1wiIHJlcHJlc2VudHMgdGhlIGRhdGEgb2YgZWFjaCBub2RlLlxyXG4gKiAvLyAgICAgICAtIFRoZSBcImRfY2hpbGRyZW5cIiB3aWxsIGJlIGNvbnZlcnRlZCB0byBIVE1MLXRlbXBsYXRlXHJcbiAqIC8vXHJcbiAqIC8vIHtcclxuICogLy8gICAgIHJvb3RFbGVtZW50OiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdVTCcpLFxyXG4gKiAvLyAgICAgbm9kZUlkUHJlZml4OiAndHVpLXRyZWUtbm9kZS0nXHJcbiAqIC8vICAgICBkZWZhdWx0U3RhdGU6ICdjbG9zZWQnLFxyXG4gKiAvLyAgICAgc3RhdGVMYWJlbHM6IHtcclxuICogLy8gICAgICAgICBvcGVuZWQ6ICctJyxcclxuICogLy8gICAgICAgICBjbG9zZWQ6ICcrJ1xyXG4gKiAvLyAgICAgfSxcclxuICogLy8gICAgIGNsYXNzTmFtZXM6IHtcclxuICogLy8gICAgICAgICBvcGVuZWRDbGFzczogJ3R1aS10cmVlLW9wZW5lZCcsXHJcbiAqIC8vICAgICAgICAgY2xvc2VkQ2xhc3M6ICd0dWktdHJlZS1jbG9zZWQnLFxyXG4gKiAvLyAgICAgICAgIHNlbGVjdGVkQ2xhc3M6ICd0dWktdHJlZS1zZWxlY3RlZCcsXHJcbiAqIC8vICAgICAgICAgc3VidHJlZUNsYXNzOiAndHVpLXRyZWUtc3VidHJlZScsXHJcbiAqIC8vICAgICAgICAgdG9nZ2xlQnRuQ2xhc3M6ICd0dWktdHJlZS10b2dnbGVCdG4nLFxyXG4gKiAvLyAgICAgICAgIHRleHRDbGFzczogJ3R1aS10cmVlLXRleHQnLFxyXG4gKiAvLyAgICAgICAgIGl1cHV0Q2xhc3M6ICd0dWktdHJlZS1pbnB1dCdcclxuICogLy8gICAgIH0sXHJcbiAqIC8vXHJcbiAqIC8vICAgICB0ZW1wbGF0ZToge1xyXG4gKiAvLyAgICAgICAgIGludGVybmFsTm9kZTpcclxuICogLy8gICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ0dWktdHJlZS1ub2RlIHt7c3RhdGVDbGFzc319XCIgZGF0YS1ub2RlLWlkPVwie3tpZH19XCI+JyArXHJcbiAqIC8vICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7c3RhdGVMYWJlbH19PC9idXR0b24+JyArXHJcbiAqIC8vICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcclxuICogLy8gICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPicgK1xyXG4gKiAvLyAgICAgICAgICc8L2xpPicsXHJcbiAqIC8vICAgICAgICAgbGVhZk5vZGU6XHJcbiAqIC8vICAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwidHVpLXRyZWUtbm9kZSB0dWktdHJlZS1sZWFmXCIgZGF0YS1ub2RlLWlkPVwie3tpZH19XCI+JyArXHJcbiAqIC8vICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcclxuICogLy8gICAgICAgICAnPC9saT4nXHJcbiAqIC8vICAgICB9XHJcbiAqIC8vIH1cclxuICogLy9cclxuICpcclxuICogdmFyIGRhdGEgPSBbXHJcbiAqICAgICB7dGl0bGU6ICdyb290QScsIGNoaWxkcmVuOiBbXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0xQSd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMUInfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTFDJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0xRCd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMkEnLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgICAgICB7dGl0bGU6J3N1Yl8xQScsIGNoaWxkcmVuOltcclxuICogICAgICAgICAgICAgICAgIHt0aXRsZTonc3ViX3N1Yl8xQSd9XHJcbiAqICAgICAgICAgICAgIF19LFxyXG4gKiAgICAgICAgICAgICB7dGl0bGU6J3N1Yl8yQSd9XHJcbiAqICAgICAgICAgXX0sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0yQid9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMkMnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTJEJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0zQScsIGNoaWxkcmVuOiBbXHJcbiAqICAgICAgICAgICAgIHt0aXRsZTonc3ViM19hJ30sXHJcbiAqICAgICAgICAgICAgIHt0aXRsZTonc3ViM19iJ31cclxuICogICAgICAgICBdfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTNCJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0zQyd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtM0QnfVxyXG4gKiAgICAgXX0sXHJcbiAqICAgICB7dGl0bGU6ICdyb290QicsIGNoaWxkcmVuOiBbXHJcbiAqICAgICAgICAge3RpdGxlOidCX3N1YjEnfSxcclxuICogICAgICAgICB7dGl0bGU6J0Jfc3ViMid9LFxyXG4gKiAgICAgICAgIHt0aXRsZTonYid9XHJcbiAqICAgICBdfVxyXG4gKiBdO1xyXG4gKlxyXG4gKiB2YXIgdHJlZTEgPSBuZXcgdHVpLmNvbXBvbmVudC5UcmVlKGRhdGEsIHtcclxuICogICAgIGRlZmF1bHRTdGF0ZTogJ29wZW5lZCdcclxuICogfSk7XHJcbiAqKi9cclxudmFyIFRyZWUgPSBzbmlwcGV0LmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZS5wcm90b3R5cGUgKi97IC8qZXNsaW50LWRpc2FibGUqL1xyXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xyXG4gICAgICAgIHZhciBleHRlbmQgPSBzbmlwcGV0LmV4dGVuZDtcclxuICAgICAgICBvcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgc3RhdGUgb2YgdHJlZVxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHRyZWVTdGF0ZXMuTk9STUFMO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWZhdWx0IGNsYXNzIG5hbWVzXHJcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY2xhc3NOYW1lcyA9IGV4dGVuZCh7fSwgZGVmYXVsdHMuY2xhc3NOYW1lcywgb3B0aW9ucy5jbGFzc05hbWVzKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCB0ZW1wbGF0ZVxyXG4gICAgICAgICAqIEB0eXBlIHt7aW50ZXJuYWxOb2RlOiBzdHJpbmcsIGxlYWZOb2RlOiBzdHJpbmd9fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSBleHRlbmQoe30sIGRlZmF1bHRzLnRlbXBsYXRlLCBvcHRpb25zLnRlbXBsYXRlKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUm9vdCBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBvcHRpb25zLnJvb3RFbGVtZW50O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXHJcbiAgICAgICAgICogQHR5cGUge3tvcGVuZWQ6IHN0cmluZywgY2xvc2VkOiBzdHJpbmd9fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuc3RhdGVMYWJlbHMgPSBvcHRpb25zLnN0YXRlTGFiZWxzO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBNYWtlIHRyZWUgbW9kZWxcclxuICAgICAgICAgKiBAdHlwZSB7VHJlZU1vZGVsfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVHJlZU1vZGVsKGRhdGEsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICB0aGlzLl9zZXRSb290KCk7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKCk7XHJcbiAgICAgICAgdGhpcy5fc2V0RXZlbnRzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9zZXRSb290OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKCFzbmlwcGV0LmlzSFRNTE5vZGUocm9vdEVsKSkge1xyXG4gICAgICAgICAgICByb290RWwgPSB0aGlzLnJvb3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVUwnKTtcclxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyb290RWwpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZXZlbnQgaGFuZGxlclxyXG4gICAgICovXHJcbiAgICBfc2V0RXZlbnRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLm9uKCd1cGRhdGUnLCB0aGlzLl9kcmF3Q2hpbGRyZW4sIHRoaXMpO1xyXG4gICAgICAgIHRoaXMubW9kZWwub24oJ21vdmUnLCB0aGlzLl9vbk1vdmUsIHRoaXMpO1xyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnY2xpY2snLCBzbmlwcGV0LmJpbmQodGhpcy5fb25DbGljaywgdGhpcykpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfb25Nb3ZlOiBmdW5jdGlvbihub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkKSB7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKG9yaWdpbmFsUGFyZW50SWQpO1xyXG4gICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbihuZXdQYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT24gY2xpY2sgZXZlbnQgaGFuZGxlclxyXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIENsaWNrIGV2ZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25DbGljazogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxyXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHV0aWwuaXNSaWdodEJ1dHRvbihldmVudCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3MpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlTm9kZSh0aGlzLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jbGlja1RpbWVyKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5jbGlja1RpbWVyKTtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCdkb3VibGVDbGljaycsIGV2ZW50KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5maXJlKCdzaW5nbGVDbGljaycsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIHNlbGYuY2xpY2tUaW1lciA9IG51bGw7XHJcbiAgICAgICAgICAgIH0sIDQwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBub2RlIHN0YXRlIC0gb3BlbmVkIG9yIGNsb3NlZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIE5vZGUgc3RhdGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZXROb2RlU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcclxuICAgICAgICB2YXIgc3VidHJlZUVsZW1lbnQgPSB0aGlzLl9nZXRTdWJ0cmVlRWxlbWVudChub2RlSWQpLFxyXG4gICAgICAgICAgICBjbGFzc05hbWVzLCBsYWJlbCwgbm9kZUNsYXNzTmFtZSwgZGlzcGxheSwgYnRuRWxlbWVudCwgbm9kZUVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmICghc3VidHJlZUVsZW1lbnQgfHwgc3VidHJlZUVsZW1lbnQgPT09IHRoaXMucm9vdEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzO1xyXG4gICAgICAgIGxhYmVsID0gdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV07XHJcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xyXG4gICAgICAgIGJ0bkVsZW1lbnQgPSB1dGlsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUobm9kZUVsZW1lbnQsIGNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3MpWzBdO1xyXG5cclxuICAgICAgICBpZiAoc3RhdGUgPT09IG5vZGVTdGF0ZXMuT1BFTkVEKSB7XHJcbiAgICAgICAgICAgIGRpc3BsYXkgPSAnJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBub2RlQ2xhc3NOYW1lID0gdGhpcy5fZ2V0Tm9kZUNsYXNzTmFtZUZyb21TdGF0ZShub2RlRWxlbWVudCwgc3RhdGUpO1xyXG5cclxuICAgICAgICBub2RlRWxlbWVudC5jbGFzc05hbWUgPSBub2RlQ2xhc3NOYW1lO1xyXG4gICAgICAgIHN1YnRyZWVFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5O1xyXG4gICAgICAgIGlmIChidG5FbGVtZW50KSB7XHJcbiAgICAgICAgICAgIGJ0bkVsZW1lbnQuaW5uZXJIVE1MID0gbGFiZWw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBub2RlIGNsYXNzIG5hbWUgZnJvbSBuZXcgY2hhbmdlZCBzdGF0ZVxyXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZUVsZW1lbnQgLSBUcmVlTm9kZSBlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOZXcgY2hhbmdlZCBzdGF0ZVxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gQ2xhc3MgbmFtZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2dldE5vZGVDbGFzc05hbWVGcm9tU3RhdGU6IGZ1bmN0aW9uKG5vZGVFbGVtZW50LCBzdGF0ZSkge1xyXG4gICAgICAgIHZhciBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzLFxyXG4gICAgICAgICAgICBvcGVuZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuT1BFTkVEICsgJ0NsYXNzJ10sXHJcbiAgICAgICAgICAgIGNsb3NlZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5DTE9TRUQgKyAnQ2xhc3MnXSxcclxuICAgICAgICAgICAgbm9kZUNsYXNzTmFtZSA9IG5vZGVFbGVtZW50LmNsYXNzTmFtZVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoJyAnICsgY2xvc2VkQ2xhc3NOYW1lLCAnJylcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKCcgJyArIG9wZW5lZENsYXNzTmFtZSwgJycpO1xyXG5cclxuICAgICAgICByZXR1cm4gbm9kZUNsYXNzTmFtZSArICcgJyArIGNsYXNzTmFtZXNbc3RhdGUrJ0NsYXNzJ107XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFrZSBodG1sXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBub2RlSWRzIC0gTm9kZSBpZCBsaXN0XHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfbWFrZUh0bWw6IGZ1bmN0aW9uKG5vZGVJZHMpIHtcclxuICAgICAgICB2YXIgbW9kZWwgPSB0aGlzLm1vZGVsLFxyXG4gICAgICAgICAgICBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzLFxyXG4gICAgICAgICAgICBzdGF0ZUxhYmVscyA9IHRoaXMuc3RhdGVMYWJlbHMsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlU291cmNlID0gdGhpcy50ZW1wbGF0ZSxcclxuICAgICAgICAgICAgaHRtbCA9ICcnLFxyXG4gICAgICAgICAgICBkZWZhdWx0U2V0ID0ge1xyXG4gICAgICAgICAgICAgICAgdGV4dENsYXNzOiBjbGFzc05hbWVzLnRleHRDbGFzcyxcclxuICAgICAgICAgICAgICAgIHN1YnRyZWVDbGFzczogY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3MsXHJcbiAgICAgICAgICAgICAgICB0b2dnbGVCdG5DbGFzczogY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzc1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBzbmlwcGV0LmZvckVhY2gobm9kZUlkcywgZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgICAgIHZhciBub2RlID0gbW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICAgICAgc3RhdGUgPSBub2RlLmdldFN0YXRlKCksXHJcbiAgICAgICAgICAgICAgICBub2RlRGF0YSA9IG5vZGUuZ2V0QWxsRGF0YSgpLFxyXG4gICAgICAgICAgICAgICAgcHJvcHMgPSBleHRlbmQoe1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBub2RlSWRcclxuICAgICAgICAgICAgICAgIH0sIGRlZmF1bHRTZXQsIG5vZGVEYXRhKSxcclxuICAgICAgICAgICAgICAgIG5vZGVUZW1wbGF0ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlVGVtcGxhdGUgPSB0ZW1wbGF0ZVNvdXJjZS5sZWFmTm9kZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vZGVUZW1wbGF0ZSA9IHRlbXBsYXRlU291cmNlLmludGVybmFsTm9kZTtcclxuICAgICAgICAgICAgICAgIHByb3BzLnN0YXRlQ2xhc3MgPSBjbGFzc05hbWVzW3N0YXRlKydDbGFzcyddO1xyXG4gICAgICAgICAgICAgICAgcHJvcHMuc3RhdGVMYWJlbCA9IHN0YXRlTGFiZWxzW3N0YXRlXTtcclxuICAgICAgICAgICAgICAgIHByb3BzLmNoaWxkcmVuID0gdGhpcy5fbWFrZUh0bWwobm9kZS5nZXRDaGlsZElkcygpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBodG1sICs9IHV0aWwudGVtcGxhdGUobm9kZVRlbXBsYXRlLCBwcm9wcyk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIGh0bWw7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRHJhdyB0cmVlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIFBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfZHJhd0NoaWxkcmVuOiBmdW5jdGlvbihwYXJlbnRJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKHBhcmVudElkKSxcclxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICBub2RlID0gdGhpcy5tb2RlbC5yb290Tm9kZTtcclxuICAgICAgICAgICAgcGFyZW50SWQgPSBub2RlLmdldElkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN1YnRyZWVFbGVtZW50ID0gdGhpcy5fZ2V0U3VidHJlZUVsZW1lbnQocGFyZW50SWQpO1xyXG4gICAgICAgIHN1YnRyZWVFbGVtZW50LmlubmVySFRNTCA9IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWwuZWFjaChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGUuZ2V0U3RhdGUoKSA9PT0gbm9kZVN0YXRlcy5PUEVORUQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3Blbihub2RlSWQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZShub2RlSWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgcGFyZW50SWQsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBzdWJ0cmVlIGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBUcmVlTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fHVuZGVmaW5lZH0gU3VidHJlZSBlbGVtZW50IG9yIHVuZGVmaW5lZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2dldFN1YnRyZWVFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICBzdWJ0cmVlQ2xhc3NOYW1lLCBub2RlRWxlbWVudCwgc3VidHJlZUVsZW1lbnQ7XHJcbiAgICAgICAgaWYgKCFub2RlSWQgfHwgKG5vZGUgJiYgbm9kZS5pc0xlYWYoKSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG5vZGUuaXNSb290KCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucm9vdEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdWJ0cmVlQ2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWVzWydzdWJ0cmVlQ2xhc3MnXTtcclxuICAgICAgICBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGUuZ2V0SWQoKSk7XHJcbiAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB1dGlsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUobm9kZUVsZW1lbnQsIHN1YnRyZWVDbGFzc05hbWUpWzBdO1xyXG5cclxuICAgICAgICByZXR1cm4gc3VidHJlZUVsZW1lbnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IG5vZGUgaWQgZnJvbSBlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gSFRNTEVsZW1lbnRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGVJZEZyb21FbGVtZW50OiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIGlkUHJlZml4ID0gdGhpcy5tb2RlbC5nZXROb2RlSWRQcmVmaXgoKTtcclxuXHJcbiAgICAgICAgd2hpbGUgKGVsZW1lbnQgJiYgZWxlbWVudC5pZC5pbmRleE9mKGlkUHJlZml4KSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5pZCA6ICcnO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCByb290IG5vZGUob3IgZWxlbWVudCkgaWRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJvb3Qgbm9kZSBpZFxyXG4gICAgICovXHJcbiAgICBnZXRSb290SWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLnJvb3ROb2RlLmdldElkKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Tm9kZUlkUHJlZml4KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3BlbiBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICovXHJcbiAgICBvcGVuOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB0aGlzLl9zZXROb2RlU3RhdGUobm9kZUlkLCBub2RlU3RhdGVzLk9QRU5FRCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xvc2Ugbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgY2xvc2U6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHRoaXMuX3NldE5vZGVTdGF0ZShub2RlSWQsIG5vZGVTdGF0ZXMuQ0xPU0VEKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiovXHJcbiAgICB0b2dnbGVOb2RlOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICBzdGF0ZTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUpIHtcclxuICAgICAgICAgICAgbm9kZS50b2dnbGVTdGF0ZSgpO1xyXG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0Tm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTb3J0IGFsbCBub2Rlc1xyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZm9yIHNvcnRpbmdcclxuICAgICAqL1xyXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvcikge1xyXG4gICAgICAgIHRoaXMubW9kZWwuc29ydChjb21wYXJhdG9yKTtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4oKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWZyZXNoIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBUcmVlTm9kZSBpZCB0byByZWZyZXNoXHJcbiAgICAgKiovXHJcbiAgICByZWZyZXNoOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4obm9kZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIG5vZGVzLlxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcclxuICAgICAqL1xyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0ZWUsIGNvbnRleHQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLmVhY2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgbm9kZShzKS5cclxuICAgICAqIC0gSWYgdGhlIHBhcmVudElkIGlzIGZhbHN5LCB0aGUgbm9kZSB3aWxsIGJlIGFwcGVuZGVkIHRvIHJvb3ROb2RlLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3LWRhdGFcclxuICAgICAqIEBwYXJhbSB7Kn0gcGFyZW50SWQgLSBQYXJlbnQgaWRcclxuICAgICAqL1xyXG4gICAgYWRkOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwuYWRkKGRhdGEsIHBhcmVudElkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgYSBub2RlIHdpdGggY2hpbGRyZW4uXHJcbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWQgdG8gcmVtb3ZlXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmUobm9kZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwubW92ZShub2RlSWQsIG5ld1BhcmVudElkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGUgZmFjaWxpdHkgb2YgdHJlZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZhY2lsaXR5TmFtZSAtICdzZWxlY3Rpb24nLCAnZG5kJywgJ2VkaXRpbmcnXHJcbiAgICAgKi9cclxuICAgIGVuYWJsZTogZnVuY3Rpb24oZmFjaWxpdHlOYW1lKSB7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERpc2FibGUgZmFjaWxpdHkgb2YgdHJlZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZhY2lsaXR5TmFtZSAtICdzZWxlY3Rpb24nLCAnZG5kJywgJ2VkaXRpbmcnXHJcbiAgICAgKi9cclxuICAgIGRpc2FibGU6IGZ1bmN0aW9uKGZhY2lsaXR5TmFtZSkge1xyXG5cclxuICAgIH1cclxufSk7XHJcblxyXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVHJlZSk7XHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZTtcclxuXHJcbi8vIExlZ2FjeSBoZWxwZXJcclxuLy8gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmhlbHBlclBvc10gQSByZWxhdGVkIHBvc2l0aW9uIGZvciBoZWxwZXIgb2JqZWN0XHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy9cclxuLy8vKipcclxuLy8gKiBXaGV0aGVyIGRyYWcgYW5kIGRyb3AgdXNlIG9yIG5vdFxyXG4vLyAqIEB0eXBlIHtib29sZWFufVxyXG4vLyAqL1xyXG4vL3RoaXMudXNlRHJhZyA9IG9wdGlvbnMudXNlRHJhZztcclxuLy9cclxuLy8vKipcclxuLy8gKiBXaGV0aGVyIGhlbHBlciBlbGVtZW50IHVzZSBvciBub3RcclxuLy8gKiBAdHlwZSB7Ym9vbGVhbn1cclxuLy8gKi9cclxuLy90aGlzLnVzZUhlbHBlciA9IHRoaXMudXNlRHJhZyAmJiBvcHRpb25zLnVzZUhlbHBlcjtcclxuLy9cclxuLy8vKipcclxuLy8gKiBTZXQgcmVsYXRpdmUgcG9zaXRpb24gZm9yIGhlbHBlciBvYmplY3RcclxuLy8gKiBAdHlwZSB7b2JqZWN0fVxyXG4vLyAqL1xyXG4vL3RoaXMuaGVscGVyUG9zID0gb3B0aW9ucy5oZWxwZXJQb3M7XHJcbi8vXHJcbi8vXHJcbi8vLyoqXHJcbi8vICogU2V0IGRyYWcgYW5kIGRyb3AgZXZlbnRcclxuLy8gKiBAcHJpdmF0ZVxyXG4vLyAqL1xyXG4vL19hZGREcmFnRXZlbnQ6IGZ1bmN0aW9uKCkge1xyXG4vLyAgICB2YXIgdXNlclNlbGVjdFByb3BlcnR5ID0gdXRpbC50ZXN0UHJvcChbJ3VzZXJTZWxlY3QnLCAnV2Via2l0VXNlclNlbGVjdCcsICdPVXNlclNlbGVjdCcsICdNb3pVc2VyU2VsZWN0JywgJ21zVXNlclNlbGVjdCddKSxcclxuLy8gICAgICAgIGlzU3VwcG9ydFNlbGVjdFN0YXJ0ID0gJ29uc2VsZWN0c3RhcnQnIGluIGRvY3VtZW50O1xyXG4vL1xyXG4vLyAgICBpZiAoaXNTdXBwb3J0U2VsZWN0U3RhcnQpIHtcclxuLy8gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnc2VsZWN0c3RhcnQnLCB1dGlsLnByZXZlbnREZWZhdWx0KTtcclxuLy8gICAgfSBlbHNlIHtcclxuLy8gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZVt1c2VyU2VsZWN0UHJvcGVydHldID0gJ25vbmUnO1xyXG4vLyAgICB9XHJcbi8vICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnbW91c2Vkb3duJywgc25pcHBldC5iaW5kKHRoaXMuX29uTW91c2VEb3duLCB0aGlzKSk7XHJcbi8vfSxcclxuLy9cclxuLy8vKipcclxuLy8gKiBTaG93IHVwIGd1aWRlIGVsZW1lbnRcclxuLy8gKiBAcGFyYW0ge29iamVjdH0gcG9zIEEgZWxlbWVudCBwb3NpdGlvblxyXG4vLyAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBBIGVsZW1lbnQgdGV4dCB2YWx1ZVxyXG4vLyAqL1xyXG4vL2VuYWJsZUhlbHBlcjogZnVuY3Rpb24ocG9zLCB2YWx1ZSkge1xyXG4vLyAgICBpZiAoIXRoaXMuaGVscGVyRWxlbWVudCkge1xyXG4vLyAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4vLyAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuLy8gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4vLyAgICAgICAgdGhpcy5yb290LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5oZWxwZXJFbGVtZW50KTtcclxuLy8gICAgfVxyXG4vL1xyXG4vLyAgICB0aGlzLmhlbHBlckVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XHJcbi8vfSxcclxuLy9cclxuLy8vKipcclxuLy8gKiBTZXQgZ3VpZGUgZWxlbWVudCBsb2NhdGlvblxyXG4vLyAqIEBwYXJhbSB7b2JqZWN0fSBwb3MgQSBwb3NpdGlvbiB0byBtb3ZlXHJcbi8vICovXHJcbi8vc2V0SGVscGVyTG9jYXRpb246IGZ1bmN0aW9uKHBvcykge1xyXG4vLyAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUubGVmdCA9IHBvcy54ICsgdGhpcy5oZWxwZXJQb3MueCArICdweCc7XHJcbi8vICAgIHRoaXMuaGVscGVyRWxlbWVudC5zdHlsZS50b3AgPSBwb3MueSArIHRoaXMuaGVscGVyUG9zLnkgKyAncHgnO1xyXG4vLyAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4vL30sXHJcbi8vXHJcbi8vLyoqXHJcbi8vICogSGlkZSBndWlkZSBlbGVtZW50XHJcbi8vICovXHJcbi8vZGlzYWJsZUhlbHBlcjogZnVuY3Rpb24oKSB7XHJcbi8vICAgIGlmICh0aGlzLmhlbHBlckVsZW1lbnQpIHtcclxuLy8gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4vLyAgICB9XHJcbi8vfSwiLCIvKipcclxuICogQGZpbGVvdmVydmlldyBVcGRhdGUgdmlldyBhbmQgY29udHJvbCB0cmVlIGRhdGFcclxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFRyZWVOb2RlID0gcmVxdWlyZSgnLi90cmVlTm9kZScpLFxyXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xyXG5cclxudmFyIHNuaXBwZXQgPSB0dWkudXRpbCxcclxuICAgIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kLFxyXG4gICAga2V5cyA9IHNuaXBwZXQua2V5cyxcclxuICAgIGZvckVhY2ggPSBzbmlwcGV0LmZvckVhY2gsXHJcbiAgICBtYXAgPSBzbmlwcGV0Lm1hcCxcclxuICAgIGZpbHRlciA9IHNuaXBwZXQuZmlsdGVyLFxyXG4gICAgaW5BcnJheSA9IHNuaXBwZXQuaW5BcnJheTtcclxuXHJcbi8qKlxyXG4gKiBUcmVlIG1vZGVsXHJcbiAqIEBjb25zdHJ1Y3RvciBUcmVlTW9kZWxcclxuICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIERhdGFcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zIGZvciBkZWZhdWx0U3RhdGUgYW5kIG5vZGVJZFByZWZpeFxyXG4gKiovXHJcbnZhciBUcmVlTW9kZWwgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVNb2RlbC5wcm90b3R5cGUgKi97IC8qIGVzbGludC1kaXNhYmxlICovXHJcbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7Lyplc2xpbnQtZW5hYmxlKi9cclxuICAgICAgICBUcmVlTm9kZS5zZXRJZFByZWZpeChvcHRpb25zLm5vZGVJZFByZWZpeCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERlZmF1bHQgc3RhdGUgb2Ygbm9kZVxyXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5ub2RlRGVmYXVsdFN0YXRlID0gb3B0aW9ucy5ub2RlRGVmYXVsdFN0YXRlO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGJ1ZmZlclxyXG4gICAgICAgICAqIEB0eXBlIHtudWxsfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUm9vdCBub2RlXHJcbiAgICAgICAgICogQHR5cGUge1RyZWVOb2RlfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucm9vdE5vZGUgPSBuZXcgVHJlZU5vZGUoe1xyXG4gICAgICAgICAgICBzdGF0ZTogJ29wZW5lZCdcclxuICAgICAgICB9LCBudWxsKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVHJlZSBoYXNoIGhhdmluZyBhbGwgbm9kZXNcclxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0LjwqLCBUcmVlTm9kZT59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50cmVlSGFzaCA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLl9zZXREYXRhKGRhdGEpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBUcmVlTm9kZS5pZFByZWZpeDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbW9kZWwgd2l0aCB0cmVlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBUcmVlIGRhdGFcclxuICAgICAqL1xyXG4gICAgX3NldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICB2YXIgcm9vdCA9IHRoaXMucm9vdE5vZGUsXHJcbiAgICAgICAgICAgIHJvb3RJZCA9IHJvb3QuZ2V0SWQoKTtcclxuXHJcbiAgICAgICAgdGhpcy50cmVlSGFzaFtyb290SWRdID0gcm9vdDtcclxuICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goZGF0YSwgcm9vdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFrZSB0cmVlIGhhc2ggZnJvbSBkYXRhIGFuZCBwYXJlbnROb2RlXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBwYXJlbnQgLSBQYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX21ha2VUcmVlSGFzaDogZnVuY3Rpb24oZGF0YSwgcGFyZW50KSB7XHJcbiAgICAgICAgdmFyIHBhcmVudElkID0gcGFyZW50LmdldElkKCk7XHJcblxyXG4gICAgICAgIGZvckVhY2goZGF0YSwgZnVuY3Rpb24oZGF0dW0pIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuRGF0YSA9IGRhdHVtLmNoaWxkcmVuLFxyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMuX2NyZWF0ZU5vZGUoZGF0dW0sIHBhcmVudElkKSxcclxuICAgICAgICAgICAgICAgIG5vZGVJZCA9IG5vZGUuZ2V0SWQoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudHJlZUhhc2hbbm9kZUlkXSA9IG5vZGU7XHJcbiAgICAgICAgICAgIHBhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XHJcbiAgICAgICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChjaGlsZHJlbkRhdGEsIG5vZGUpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBub2RlXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZURhdGEgLSBEYXR1bSBvZiBub2RlXHJcbiAgICAgKiBAcGFyYW0geyp9IHBhcmVudElkIC0gUGFyZW50IGlkXHJcbiAgICAgKiBAcmV0dXJuIHtUcmVlTm9kZX0gVHJlZU5vZGVcclxuICAgICAqL1xyXG4gICAgX2NyZWF0ZU5vZGU6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkge1xyXG4gICAgICAgIHZhciBub2RlO1xyXG4gICAgICAgIG5vZGVEYXRhID0gZXh0ZW5kKHtcclxuICAgICAgICAgICAgc3RhdGU6IHRoaXMubm9kZURlZmF1bHRTdGF0ZVxyXG4gICAgICAgIH0sIG5vZGVEYXRhKTtcclxuXHJcbiAgICAgICAgbm9kZSA9IG5ldyBUcmVlTm9kZShub2RlRGF0YSwgcGFyZW50SWQpO1xyXG4gICAgICAgIG5vZGUucmVtb3ZlRGF0YSgnY2hpbGRyZW4nKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGNoaWxkcmVuXHJcbiAgICAgKiBAcGFyYW0geyp9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm4ge0FycmF5LjxUcmVlTm9kZT59IGNoaWxkcmVuXHJcbiAgICAgKi9cclxuICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbWFwKG5vZGUuZ2V0Q2hpbGRJZHMoKSwgZnVuY3Rpb24oY2hpbGRJZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXROb2RlKGNoaWxkSWQpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgbnVtYmVyIG9mIG5vZGVzXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIG5vZGVzXHJcbiAgICAgKi9cclxuICAgIGdldENvdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4ga2V5cyh0aGlzLnRyZWVIYXNoKS5sZW5ndGg7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGxhc3QgZGVwdGhcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBsYXN0IGRlcHRoXHJcbiAgICAgKi9cclxuICAgIGdldExhc3REZXB0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGRlcHRocyA9IG1hcCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldERlcHRoKG5vZGUuZ2V0SWQoKSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShudWxsLCBkZXB0aHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpbmQgbm9kZVxyXG4gICAgICogQHBhcmFtIHsqfSBpZCAtIEEgbm9kZSBpZCB0byBmaW5kXHJcbiAgICAgKiBAcmV0dXJuIHtUcmVlTm9kZXx1bmRlZmluZWR9IE5vZGVcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZTogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmVlSGFzaFtpZF07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGRlcHRoIGZyb20gbm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHsqfSBpZCAtIEEgbm9kZSBpZCB0byBmaW5kXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfSBEZXB0aFxyXG4gICAgICovXHJcbiAgICBnZXREZXB0aDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXHJcbiAgICAgICAgICAgIGRlcHRoID0gMCxcclxuICAgICAgICAgICAgcGFyZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XHJcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xyXG4gICAgICAgICAgICBkZXB0aCArPSAxO1xyXG4gICAgICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50LmdldFBhcmVudElkKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlcHRoO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhIG5vZGUgd2l0aCBjaGlsZHJlbi5cclxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxyXG4gICAgICovXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKGlkLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKSxcclxuICAgICAgICAgICAgcGFyZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XHJcblxyXG4gICAgICAgIGZvckVhY2gobm9kZS5nZXRDaGlsZElkcygpLCBmdW5jdGlvbihjaGlsZElkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNoaWxkSWQsIHRydWUpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGRJZChpZCk7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMudHJlZUhhc2hbaWRdO1xyXG5cclxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgcGFyZW50LmdldElkKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgbm9kZShzKS5cclxuICAgICAqIC0gSWYgdGhlIHBhcmVudElkIGlzIGZhbHN5LCB0aGUgbm9kZSB3aWxsIGJlIGFwcGVuZGVkIHRvIHJvb3ROb2RlLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3LWRhdGFcclxuICAgICAqIEBwYXJhbSB7Kn0gcGFyZW50SWQgLSBQYXJlbnQgaWRcclxuICAgICAqL1xyXG4gICAgYWRkOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGU7XHJcblxyXG4gICAgICAgIGRhdGEgPSBbXS5jb25jYXQoZGF0YSk7XHJcbiAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHBhcmVudCk7XHJcbiAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHByb3BlcnRpZXMgb2YgYSBub2RlXHJcbiAgICAgKiBAcGFyYW0geyp9IGlkIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcyBQcm9wZXJ0aWVzXHJcbiAgICAgKi9cclxuICAgIHNldDogZnVuY3Rpb24oaWQsIHByb3BzKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUgfHwgIXByb3BzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vZGUuYWRkRGF0YShwcm9wcyk7XHJcbiAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBub2RlLmdldFBhcmVudElkKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnQncyBjaGlsZFxyXG4gICAgICogQHBhcmFtIHsqfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0geyp9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG5ld1BhcmVudElkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgb3JpZ2luYWxQYXJlbnQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbmV3UGFyZW50ID0gdGhpcy5nZXROb2RlKG5ld1BhcmVudElkKSB8fCB0aGlzLnJvb3ROb2RlO1xyXG4gICAgICAgIG5ld1BhcmVudElkID0gbmV3UGFyZW50LmdldElkKCk7XHJcbiAgICAgICAgb3JpZ2luYWxQYXJlbnRJZCA9IG5vZGUuZ2V0UGFyZW50SWQoKTtcclxuICAgICAgICBvcmlnaW5hbFBhcmVudCA9IHRoaXMuZ2V0Tm9kZShvcmlnaW5hbFBhcmVudElkKTtcclxuXHJcbiAgICAgICAgbm9kZS5zZXRQYXJlbnRJZChuZXdQYXJlbnRJZCk7XHJcbiAgICAgICAgb3JpZ2luYWxQYXJlbnQucmVtb3ZlQ2hpbGRJZChub2RlSWQpO1xyXG4gICAgICAgIG5ld1BhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XHJcbiAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywgbm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU29ydCBub2Rlc1xyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZnVuY3Rpb25cclxuICAgICAqL1xyXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvcikge1xyXG4gICAgICAgIHRoaXMuZWFjaEFsbChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRDaGlsZHJlbihub2RlSWQpLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRJZHM7XHJcblxyXG4gICAgICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4uc29ydChjb21wYXJhdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGlsZElkcyA9IG1hcChjaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGQuZ2V0SWQoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgbm9kZS5yZXBsYWNlQ2hpbGRJZHMoY2hpbGRJZHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXHJcbiAgICAgKi9cclxuICAgIGVhY2hBbGw6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XHJcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcclxuXHJcbiAgICAgICAgZm9yRWFjaCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaXRlcmF0ZWUuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIGRlc2NlbmRhbnRzIG9mIGEgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxyXG4gICAgICovXHJcbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgc3RhY2ssIG5vZGVJZCwgbm9kZTtcclxuXHJcbiAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShwYXJlbnRJZCk7XHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhY2sgPSBub2RlLmdldENoaWxkSWRzKCk7XHJcblxyXG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBub2RlSWQgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xyXG4gICAgICAgICAgICBpdGVyYXRlZS5jYWxsKGNvbnRleHQsIG5vZGUsIG5vZGVJZCk7XHJcblxyXG4gICAgICAgICAgICB1dGlsLnB1c2hBbGwoc3RhY2ssIG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuXHJcbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihUcmVlTW9kZWwpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVNb2RlbDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RhdGVzID0gcmVxdWlyZSgnLi9zdGF0ZXMnKS5ub2RlLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIGxhc3RJbmRleCA9IDAsXG4gICAgZ2V0TmV4dEluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxhc3RJbmRleCArPSAxO1xuICAgICAgICByZXR1cm4gbGFzdEluZGV4O1xuICAgIH0sXG4gICAgUkVTRVJWRURfUFJPUEVSVElFUyA9IHtcbiAgICAgICAgaWQ6ICcnLFxuICAgICAgICBzdGF0ZTogJ3NldFN0YXRlJ1xuICAgIH07XG5cbi8qKlxuICogVHJlZU5vZGVcbiAqIEBDb25zdHJ1Y3RvciBUcmVlTm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG5vZGVEYXRhIC0gTm9kZSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gW3BhcmVudElkXSAtIFBhcmVudCBub2RlIGlkXG4gKi9cbnZhciBUcmVlTm9kZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU5vZGUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgc2V0SWRQcmVmaXg6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICAgICAgdGhpcy5pZFByZWZpeCA9IHByZWZpeCB8fCB0aGlzLmlkUHJlZml4O1xuICAgICAgICB9LFxuICAgICAgICBpZFByZWZpeDogJydcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faWQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXJlbnQgbm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPG51bWJlcj59XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIGRhdGFcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBzdGF0ZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuXG4gICAgICAgIHRoaXMuX3N0YW1wSWQoKTtcbiAgICAgICAgdGhpcy5hZGREYXRhKG5vZGVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhbXAgbm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3N0YW1wSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pZCA9IHRoaXMuY29uc3RydWN0b3IuaWRQcmVmaXggKyBnZXROZXh0SW5kZXgoKTtcbiAgICB9LFxuXG4gICAgX3NldFJlc2VydmVkUHJvcGVydGllczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoT3duUHJvcGVydGllcyhSRVNFUlZFRF9QUk9QRVJUSUVTLCBmdW5jdGlvbihzZXR0ZXIsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbbmFtZV07XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiBzZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3NldHRlcl0odmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGRhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgc3RhdGVcbiAgICAgKi9cbiAgICB0b2dnbGVTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZSA9PT0gc3RhdGVzLkNMT1NFRCkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuT1BFTkVEO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBzdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIFN0YXRlIG9mIG5vZGUgKCdjbG9zZWQnLCAnb3BlbmVkJylcbiAgICAgKi9cbiAgICBzZXRTdGF0ZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgc3RhdGUgKz0gJyc7XG4gICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzW3N0YXRlLnRvVXBwZXJDYXNlKCldIHx8IHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc3RhdGVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzdGF0ZSAoJ29wZW5lZCcgb3IgJ2Nsb3NlZCcpXG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IE5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHBhcmVudCBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFBhcmVudCBub2RlIGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50SWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIHNldFBhcmVudElkOiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXBsYWNlIGNoaWxkSWRzXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gY2hpbGRJZHMgLSBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICovXG4gICAgcmVwbGFjZUNoaWxkSWRzOiBmdW5jdGlvbihjaGlsZElkcykge1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IGNoaWxkSWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqIEByZXR1cm5zIHtBcnJheS48bnVtYmVyPn0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkSWRzLnNsaWNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICBhZGRDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLl9jaGlsZElkcztcblxuICAgICAgICBpZiAodHVpLnV0aWwuaW5BcnJheShjaGlsZElkcywgaWQpID09PSAtMSkge1xuICAgICAgICAgICAgY2hpbGRJZHMucHVzaChpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIHJlbW92ZUNoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlSXRlbUZyb21BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGF0YVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gUHJvcGVydHkgbmFtZSBvZiBkYXRhXG4gICAgICogQHJldHVybnMgeyp9IERhdGFcbiAgICAgKi9cbiAgICBnZXREYXRhOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBEYXRhXG4gICAgICovXG4gICAgZ2V0QWxsRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5leHRlbmQoe30sIHRoaXMuX2RhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZGF0YVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRGF0YSBmb3IgYWRkaW5nXG4gICAgICovXG4gICAgYWRkRGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkYXRhID0gdGhpcy5fc2V0UmVzZXJ2ZWRQcm9wZXJ0aWVzKGRhdGEpO1xuICAgICAgICB0dWkudXRpbC5leHRlbmQodGhpcy5fZGF0YSwgZGF0YSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGRhdGFcbiAgICAgKiBAcGFyYW0gey4uLnN0cmluZ30gbmFtZXMgLSBOYW1lcyBvZiBkYXRhXG4gICAgICovXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24obmFtZXMpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaEFycmF5KGFyZ3VtZW50cywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIG5vZGUgaXMgbGVhZi5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gTm9kZSBpcyBsZWFmIG9yIG5vdC5cbiAgICAgKi9cbiAgICBpc0xlYWY6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuX2NoaWxkSWRzLmxlbmd0aCA9PT0gMCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyByb290LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIHJvb3Qgb3Igbm90LlxuICAgICAqL1xuICAgIGlzUm9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5pc0ZhbHN5KHRoaXMuX3BhcmVudElkKTtcbiAgICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU5vZGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbnZhciB1dGlsID0ge1xuICAgIC8qKlxuICAgICAqIFB1c2ggYWxsIGVsZW1lbnRzIGZyb20gbmV3IGFycmF5XG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyMSAtIEJhc2UgYXJyYXlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIyIC0gTmV3IGFycmF5XG4gICAgICovXG4gICAgcHVzaEFsbDogZnVuY3Rpb24oYXJyMSwgYXJyMikge1xuICAgICAgICB2YXIgbGVuZ3RoID0gYXJyMi5sZW5ndGgsXG4gICAgICAgICAgICBpID0gMDtcblxuICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBhcnIxLnB1c2goYXJyMltpXSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpcnN0IHNwZWNpZmllZCBpdGVtIGZyb20gYXJyYXksIGlmIGl0IGV4aXN0c1xuICAgICAqIEBwYXJhbSB7Kn0gaXRlbSBJdGVtIHRvIGxvb2sgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyIEFycmF5IHRvIHF1ZXJ5XG4gICAgICovXG4gICAgcmVtb3ZlSXRlbUZyb21BcnJheTogZnVuY3Rpb24oaXRlbSwgYXJyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoaXRlbSwgYXJyKTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHRvIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnQgXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFkZFxuICAgICAqL1xuICAgIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBmcm9tIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVtb3ZlXG4gICAgICovXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gRXZlbnQgdGFyZ2V0XG4gICAgICovXG4gICAgZ2V0VGFyZ2V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQ7XG4gICAgICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgSFRNTEVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBDbGFzcyBuYW1lXG4gICAgICovXG4gICAgZ2V0Q2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgJiYgZWxlbWVudC5nZXRBdHRyaWJ1dGUgJiYgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8ICcnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgdGhlIGVsZW1lbnQgaGFzIHNwZWNpZmljIGNsYXNzIG9yIG5vdFxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgQSBuYW1lIG9mIGNsYXNzIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBlbGVtZW50IGhhcyB0aGUgY2xhc3NcbiAgICAgKi9cbiAgICBoYXNDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBlbENsYXNzTmFtZSA9IHV0aWwuZ2V0Q2xhc3MoZWxlbWVudCk7XG5cbiAgICAgICAgcmV0dXJuIGVsQ2xhc3NOYW1lLmluZGV4T2YoY2xhc3NOYW1lKSA+IC0xO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGVsZW1lbnQgYnkgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3NcbiAgICAgKiBAcmV0dXJuIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBFbGVtZW50c1xuICAgICAqL1xuICAgIGdldEVsZW1lbnRzQnlDbGFzc05hbWU6IGZ1bmN0aW9uKHRhcmdldCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBhbGwsIGZpbHRlcmVkO1xuXG4gICAgICAgIGlmICh0YXJnZXQucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0YXJnZXQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWxsID0gdGFyZ2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJyk7XG4gICAgICAgICAgICBmaWx0ZXJlZCA9IHR1aS51dGlsLmZpbHRlcihhbGwsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChjbGFzc05hbWVzLmluZGV4T2YoY2xhc3NOYW1lKSAhPT0gLTEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgd2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBjbGljayBldmVudCBieSByaWdodCBidXR0b25cbiAgICAgKi9cbiAgICBpc1JpZ2h0QnV0dG9uOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICByZXR1cm4gdXRpbC5fZ2V0QnV0dG9uKGV2ZW50KSA9PT0gMjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgcHJvcGVydHkgZXhpc3Qgb3Igbm90XG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJvcHMgQSBwcm9wZXJ0eVxuICAgICAqIEByZXR1cm4ge3N0cmluZ3xib29sZWFufSBQcm9wZXJ0eSBuYW1lIG9yIGZhbHNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgdXNlclNlbGVjdFByb3BlcnR5ID0gdXRpbC50ZXN0UHJvcChbXG4gICAgICogICAgICd1c2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ1dlYmtpdFVzZXJTZWxlY3QnLFxuICAgICAqICAgICAnT1VzZXJTZWxlY3QnLFxuICAgICAqICAgICAnTW96VXNlclNlbGVjdCcsXG4gICAgICogICAgICdtc1VzZXJTZWxlY3QnXG4gICAgICogXSk7XG4gICAgICovXG4gICAgdGVzdFByb3A6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSxcbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IGZhbHNlO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2gocHJvcHMsIGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgICAgIGlmIChwcm9wIGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcDtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcHJvcGVydHlOYW1lO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IGRlZmF1bHQgZXZlbnQgXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBodG1sIGZyb20gdGVtcGxhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc291cmNlIC0gVGVtcGxhdGUgaHRtbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRlbXBsYXRlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBodG1sXG4gICAgICovXG4gICAgdGVtcGxhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgcHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZS5yZXBsYWNlKC9cXHtcXHsoXFx3Kyl9fS9naSwgZnVuY3Rpb24obWF0Y2gsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHByb3BzW25hbWVdO1xuICAgICAgICAgICAgaWYgKHR1aS51dGlsLmlzRmFsc3kodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXphdGlvbiBmb3IgZXZlbnQgYnV0dG9uIHByb3BlcnR5IFxuICAgICAqIDA6IEZpcnN0IG1vdXNlIGJ1dHRvbiwgMjogU2Vjb25kIG1vdXNlIGJ1dHRvbiwgMTogQ2VudGVyIGJ1dHRvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH0gYnV0dG9uIHR5cGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRCdXR0b246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBidXR0b24sXG4gICAgICAgICAgICBwcmltYXJ5ID0gJzAsMSwzLDUsNycsXG4gICAgICAgICAgICBzZWNvbmRhcnkgPSAnMiw2JyxcbiAgICAgICAgICAgIHdoZWVsID0gJzQnO1xuXG4gICAgICAgIGlmIChkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5oYXNGZWF0dXJlKCdNb3VzZUV2ZW50cycsICcyLjAnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGV2ZW50LmJ1dHRvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJ1dHRvbiA9IGV2ZW50LmJ1dHRvbiArICcnO1xuICAgICAgICBpZiAocHJpbWFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0gZWxzZSBpZiAoc2Vjb25kYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMjtcbiAgICAgICAgfSBlbHNlIGlmICh3aGVlbC5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=
