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
        var idPrefix = this.model.getNodeIdPrefix();

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
        this.setData(nodeData);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9kZWZhdWx0cy5qcyIsInNyYy9qcy9zdGF0ZXMuanMiLCJzcmMvanMvdHJlZS5qcyIsInNyYy9qcy90cmVlTW9kZWwuanMiLCJzcmMvanMvdHJlZU5vZGUuanMiLCJzcmMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidHVpLnV0aWwuZGVmaW5lTmFtZXNwYWNlKCd0dWkuY29tcG9uZW50LlRyZWUnLCByZXF1aXJlKCcuL3NyYy9qcy90cmVlJykpO1xuIiwiLyoqXG4gKiBBIGRlZmF1bHQgdmFsdWVzIGZvciB0cmVlXG4gKiBAbW9kdWxlIGRlZmF1bHRzXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNYWtlIGNsYXNzIG5hbWVzXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IC0gUHJlZml4IG9mIGNsYXNzIG5hbWVcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGtleXMgLSBLZXlzIG9mIGNsYXNzIG5hbWVzXG4gKiBAcmV0dXJucyB7b2JqZWN0LjxzdHJpbmcsIHN0cmluZz59IENsYXNzbmFtZXMgbWFwXG4gKi9cbmZ1bmN0aW9uIG1ha2VDbGFzc05hbWVzKHByZWZpeCwga2V5cykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICB0dWkudXRpbC5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBvYmpba2V5ICsgJ0NsYXNzJ10gPSBwcmVmaXggKyBrZXk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBAY29uc3RcbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHVzZURyYWcgLSBEZWZhdWx0OiBmYWxzZVxuICogQHByb3BlcnR5IHtib29sZWFufSB1c2VIZWxwZXIgLSBEZWZhdWx0OiBmYWxzZVxuICogQHByb3BlcnR5IHtvYmplY3R9IHN0YXRlTGFiZWwgLSBTdGF0ZSBsYWJlbCBpbiBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN0YXRlTGFiZWwub3BlbmVkIC0gRGVmYXVsdDogJy0nXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN0YXRlTGFiZWwuY2xvc2VkIC0gRGVmYXVsdDogJysnXG4gKiBAcHJvcGVydHkge29iamVjdH0gdGVtcGxhdGUgLSBUZW1wbGF0ZSBodG1sIGZvciB0aGUgbm9kZXMuXG4gKiBAcHJvcGVydHkge29iamVjdH0gY2xhc3NOYW1lcyAtIENsYXNzIG5hbWVzIG9mIGVsZW1lbnRzIGluIHRyZWVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IG9wZW5lZENsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gY2xvc2VkQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBzZWxlY3RlZENsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciBzZWxlY3RlZCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdWJ0cmVlQ2xhc3MgIC0gQSBjbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IHRvZ2dsZUNsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IHRpdGxlQ2xhc3MgLSBBIGNsYXNzIG5hbWUgZm9yIHRpdGxlIGVsZW1lbnQgaW4gYSBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBpbnB1dENsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciBlZGl0YWJsZSBlbGVtZW50IGluIGEgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZW1wbGF0ZS5pbnRlcm5hbE5vZGUgLSBBIHRlbXBsYXRlIGh0bWwgZm9yIGludGVybmFsIG5vZGUuXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHRlbXBsYXRlLmxlYWZOb2RlIC0gQSB0ZW1wbGF0ZSBodG1sIGZvciBsZWFmIG5vZGUuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHVzZURyYWc6IGZhbHNlLFxuICAgIHVzZUhlbHBlcjogZmFsc2UsXG4gICAgbm9kZURlZmF1bHRTdGF0ZTogJ2Nsb3NlZCcsXG4gICAgc3RhdGVMYWJlbHM6IHtcbiAgICAgICAgb3BlbmVkOiAnLScsXG4gICAgICAgIGNsb3NlZDogJysnXG4gICAgfSxcbiAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLScsXG4gICAgaGVscGVyUG9zOiB7XG4gICAgICAgIHk6IDEwLFxuICAgICAgICB4OiAxMFxuICAgIH0sXG4gICAgY2xhc3NOYW1lczogbWFrZUNsYXNzTmFtZXMoJ3R1aS10cmVlLScsIFtcbiAgICAgICAgJ29wZW5lZCcsXG4gICAgICAgICdjbG9zZWQnLFxuICAgICAgICAnc2VsZWN0ZWQnLFxuICAgICAgICAnc3VidHJlZScsXG4gICAgICAgICd0b2dnbGVCdG4nLFxuICAgICAgICAndGV4dCcsXG4gICAgICAgICdpbnB1dCdcbiAgICBdKSxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICBpbnRlcm5hbE5vZGU6XG4gICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInR1aS10cmVlLW5vZGUge3tzdGF0ZUNsYXNzfX1cIj4nICtcbiAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7c3RhdGVMYWJlbH19PC9idXR0b24+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+JyArXG4gICAgICAgICc8L2xpPicsXG4gICAgICAgIGxlYWZOb2RlOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ0dWktdHJlZS1ub2RlIHR1aS10cmVlLWxlYWZcIj4nICtcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAgICAgICAgJzwvbGk+J1xuICAgIH1cbn07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgU3RhdGVzIGluIHRyZWVcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogU3RhdGVzIGluIHRyZWVcbiAqIEBtb2R1bGUgc3RhdGVzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIFN0YXRlcyBvZiB0cmVlXG4gICAgICogQHR5cGUge3tOT1JNQUw6IG51bWJlciwgRURJVEFCTEU6IG51bWJlcn19XG4gICAgICovXG4gICAgdHJlZToge1xuICAgICAgICBOT1JNQUw6IDEsXG4gICAgICAgIEVESVRBQkxFOiAyXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YXRlcyBvZiBub2RlXG4gICAgICogQHR5cGUge3tPUEVORUQ6IHN0cmluZywgQ0xPU0VEOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIG5vZGU6IHtcbiAgICAgICAgT1BFTkVEOiAnb3BlbmVkJyxcbiAgICAgICAgQ0xPU0VEOiAnY2xvc2VkJ1xuICAgIH1cbn07XG4iLCIvKipcclxuICogQGZpbGVvdmVydmlldyBSZW5kZXIgdHJlZSBhbmQgdXBkYXRlIHRyZWUuXHJcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuL2RlZmF1bHRzJyksXHJcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXHJcbiAgICBzdGF0ZXMgPSByZXF1aXJlKCcuL3N0YXRlcycpLFxyXG4gICAgVHJlZU1vZGVsID0gcmVxdWlyZSgnLi90cmVlTW9kZWwnKTtcclxuXHJcbnZhciB0cmVlU3RhdGVzID0gc3RhdGVzLnRyZWUsXHJcbiAgICBub2RlU3RhdGVzID0gc3RhdGVzLm5vZGUsXHJcbiAgICBzbmlwcGV0ID0gdHVpLnV0aWwsXHJcbiAgICBleHRlbmQgPSBzbmlwcGV0LmV4dGVuZCxcclxuICAgIHJlZHVjZSA9IHNuaXBwZXQucmVkdWNlO1xyXG4vKipcclxuICogQ3JlYXRlIHRyZWUgbW9kZWwgYW5kIGluamVjdCBkYXRhIHRvIG1vZGVsXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBBIGRhdGEgdG8gYmUgdXNlZCBvbiB0cmVlXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zXHJcbiAqICAgICBAcGFyYW0ge0hUTUxFbGVtZW50fSBbb3B0aW9ucy5yb290RWxlbWVudF0gUm9vdCBlbGVtZW50IChJdCBzaG91bGQgYmUgJ1VMJyBlbGVtZW50KVxyXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLm5vZGVJZFByZWZpeF0gQSBkZWZhdWx0IHByZWZpeCBvZiBhIG5vZGVcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5kZWZhdWx0U3RhdGVdIEEgZGVmYXVsdCBzdGF0ZSBvZiBhIG5vZGVcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy50ZW1wbGF0ZV0gQSBtYXJrdXAgc2V0IHRvIG1ha2UgZWxlbWVudFxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGVdIEhUTUwgdGVtcGxhdGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGUubGVhZk5vZGVdIEhUTUwgdGVtcGxhdGVcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5zdGF0ZUxhYmVsc10gVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5vcGVuZWRdIFN0YXRlLU9QRU5FRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5jbG9zZWRdIFN0YXRlLUNMT1NFRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxyXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmNsYXNzTmFtZXNdIENsYXNzIG5hbWVzIGZvciB0cmVlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMub3BlbmVkQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igb3BlbmVkIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5jbG9zZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBjbG9zZWQgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnNlbGVjdGVkQ2xhc3NdIEEgY2xhc3MgbmFtZSB0byBzZWxlY3RlZCBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudGV4dENsYXNzXSBBIGNsYXNzIG5hbWUgdGhhdCBmb3IgdGV4dEVsZW1lbnQgaW4gbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLmlucHV0Q2xhc3NdIEEgY2xhc3MgaW5wdXQgZWxlbWVudCBpbiBhIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igc3VidHJlZSBpbiBpbnRlcm5hbCBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgdG9nZ2xlIGJ1dHRvbiBpbiBpbnRlcm5hbCBub2RlXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRGVmYXVsdCBvcHRpb25zXHJcbiAqIC8vICAgLSBIVE1MIFRFTVBMQVRFXHJcbiAqIC8vICAgICAgIC0gVGhlIHByZWZpeCBcImRfXCIgcmVwcmVzZW50cyB0aGUgZGF0YSBvZiBlYWNoIG5vZGUuXHJcbiAqIC8vICAgICAgIC0gVGhlIFwiZF9jaGlsZHJlblwiIHdpbGwgYmUgY29udmVydGVkIHRvIEhUTUwtdGVtcGxhdGVcclxuICogLy9cclxuICogLy8ge1xyXG4gKiAvLyAgICAgcm9vdEVsZW1lbnQ6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1VMJyksXHJcbiAqIC8vICAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLSdcclxuICogLy8gICAgIGRlZmF1bHRTdGF0ZTogJ2Nsb3NlZCcsXHJcbiAqIC8vICAgICBzdGF0ZUxhYmVsczoge1xyXG4gKiAvLyAgICAgICAgIG9wZW5lZDogJy0nLFxyXG4gKiAvLyAgICAgICAgIGNsb3NlZDogJysnXHJcbiAqIC8vICAgICB9LFxyXG4gKiAvLyAgICAgY2xhc3NOYW1lczoge1xyXG4gKiAvLyAgICAgICAgIG9wZW5lZENsYXNzOiAndHVpLXRyZWUtb3BlbmVkJyxcclxuICogLy8gICAgICAgICBjbG9zZWRDbGFzczogJ3R1aS10cmVlLWNsb3NlZCcsXHJcbiAqIC8vICAgICAgICAgc2VsZWN0ZWRDbGFzczogJ3R1aS10cmVlLXNlbGVjdGVkJyxcclxuICogLy8gICAgICAgICBzdWJ0cmVlQ2xhc3M6ICd0dWktdHJlZS1zdWJ0cmVlJyxcclxuICogLy8gICAgICAgICB0b2dnbGVCdG5DbGFzczogJ3R1aS10cmVlLXRvZ2dsZUJ0bicsXHJcbiAqIC8vICAgICAgICAgdGV4dENsYXNzOiAndHVpLXRyZWUtdGV4dCcsXHJcbiAqIC8vICAgICAgICAgaXVwdXRDbGFzczogJ3R1aS10cmVlLWlucHV0J1xyXG4gKiAvLyAgICAgfSxcclxuICogLy9cclxuICogLy8gICAgIHRlbXBsYXRlOiB7XHJcbiAqIC8vICAgICAgICAgaW50ZXJuYWxOb2RlOlxyXG4gKiAvLyAgICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInR1aS10cmVlLW5vZGUge3tzdGF0ZUNsYXNzfX1cIiBkYXRhLW5vZGUtaWQ9XCJ7e2lkfX1cIj4nICtcclxuICogLy8gICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3tzdGF0ZUxhYmVsfX08L2J1dHRvbj4nICtcclxuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+JyArXHJcbiAqIC8vICAgICAgICAgJzwvbGk+JyxcclxuICogLy8gICAgICAgICBsZWFmTm9kZTpcclxuICogLy8gICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ0dWktdHJlZS1ub2RlIHR1aS10cmVlLWxlYWZcIiBkYXRhLW5vZGUtaWQ9XCJ7e2lkfX1cIj4nICtcclxuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xyXG4gKiAvLyAgICAgICAgICc8L2xpPidcclxuICogLy8gICAgIH1cclxuICogLy8gfVxyXG4gKiAvL1xyXG4gKlxyXG4gKiB2YXIgZGF0YSA9IFtcclxuICogICAgIHt0aXRsZTogJ3Jvb3RBJywgY2hpbGRyZW46IFtcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTFBJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0xQid9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMUMnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTFEJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0yQScsIGNoaWxkcmVuOiBbXHJcbiAqICAgICAgICAgICAgIHt0aXRsZTonc3ViXzFBJywgY2hpbGRyZW46W1xyXG4gKiAgICAgICAgICAgICAgICAge3RpdGxlOidzdWJfc3ViXzFBJ31cclxuICogICAgICAgICAgICAgXX0sXHJcbiAqICAgICAgICAgICAgIHt0aXRsZTonc3ViXzJBJ31cclxuICogICAgICAgICBdfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTJCJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0yQyd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMkQnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTNBJywgY2hpbGRyZW46IFtcclxuICogICAgICAgICAgICAge3RpdGxlOidzdWIzX2EnfSxcclxuICogICAgICAgICAgICAge3RpdGxlOidzdWIzX2InfVxyXG4gKiAgICAgICAgIF19LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtM0InfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTNDJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0zRCd9XHJcbiAqICAgICBdfSxcclxuICogICAgIHt0aXRsZTogJ3Jvb3RCJywgY2hpbGRyZW46IFtcclxuICogICAgICAgICB7dGl0bGU6J0Jfc3ViMSd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTonQl9zdWIyJ30sXHJcbiAqICAgICAgICAge3RpdGxlOidiJ31cclxuICogICAgIF19XHJcbiAqIF07XHJcbiAqXHJcbiAqIHZhciB0cmVlMSA9IG5ldyB0dWkuY29tcG9uZW50LlRyZWUoZGF0YSwge1xyXG4gKiAgICAgZGVmYXVsdFN0YXRlOiAnb3BlbmVkJ1xyXG4gKiB9KTtcclxuICoqL1xyXG52YXIgVHJlZSA9IHNuaXBwZXQuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXHJcbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXHJcbiAgICAgICAgdmFyIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kO1xyXG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBzdGF0ZSBvZiB0cmVlXHJcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN0YXRlID0gdHJlZVN0YXRlcy5OT1JNQUw7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERlZmF1bHQgY2xhc3MgbmFtZXNcclxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jbGFzc05hbWVzID0gZXh0ZW5kKHt9LCBkZWZhdWx0cy5jbGFzc05hbWVzLCBvcHRpb25zLmNsYXNzTmFtZXMpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWZhdWx0IHRlbXBsYXRlXHJcbiAgICAgICAgICogQHR5cGUge3tpbnRlcm5hbE5vZGU6IHN0cmluZywgbGVhZk5vZGU6IHN0cmluZ319XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IGV4dGVuZCh7fSwgZGVmYXVsdHMudGVtcGxhdGUsIG9wdGlvbnMudGVtcGxhdGUpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSb290IGVsZW1lbnRcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IG9wdGlvbnMucm9vdEVsZW1lbnQ7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRvZ2dsZSBidXR0b24gc3RhdGUgbGFiZWxcclxuICAgICAgICAgKiBAdHlwZSB7e29wZW5lZDogc3RyaW5nLCBjbG9zZWQ6IHN0cmluZ319XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zdGF0ZUxhYmVscyA9IG9wdGlvbnMuc3RhdGVMYWJlbHM7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIE1ha2UgdHJlZSBtb2RlbFxyXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTW9kZWx9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG5ldyBUcmVlTW9kZWwoZGF0YSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NldFJvb3QoKTtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4oKTtcclxuICAgICAgICB0aGlzLl9zZXRFdmVudHMoKTtcclxuICAgIH0sXHJcblxyXG4gICAgX3NldFJvb3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciByb290RWwgPSB0aGlzLnJvb3RFbGVtZW50O1xyXG5cclxuICAgICAgICBpZiAoIXNuaXBwZXQuaXNIVE1MTm9kZShyb290RWwpKSB7XHJcbiAgICAgICAgICAgIHJvb3RFbCA9IHRoaXMucm9vdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdVTCcpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJvb3RFbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBldmVudCBoYW5kbGVyXHJcbiAgICAgKi9cclxuICAgIF9zZXRFdmVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwub24oJ3VwZGF0ZScsIHRoaXMuX2RyYXdDaGlsZHJlbiwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5vbignbW92ZScsIHRoaXMuX29uTW92ZSwgdGhpcyk7XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdjbGljaycsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkNsaWNrLCB0aGlzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9vbk1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgb3JpZ2luYWxQYXJlbnRJZCwgbmV3UGFyZW50SWQpIHtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4ob3JpZ2luYWxQYXJlbnRJZCk7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKG5ld1BhcmVudElkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbiBjbGljayBldmVudCBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gQ2xpY2sgZXZlbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbkNsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXHJcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSkge1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzcykpIHtcclxuICAgICAgICAgICAgdGhpcy50b2dnbGUodGhpcy5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY2xpY2tUaW1lcikge1xyXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ2RvdWJsZUNsaWNrJywgZXZlbnQpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc2V0Q2xpY2tUaW1lcigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmZpcmUoJ3NpbmdsZUNsaWNrJywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5yZXNldENsaWNrVGltZXIoKTtcclxuICAgICAgICAgICAgfSwgNDAwKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IG5vZGUgc3RhdGUgLSBvcGVuZWQgb3IgY2xvc2VkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTm9kZSBzdGF0ZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlKSB7XHJcbiAgICAgICAgdmFyIHN1YnRyZWVFbGVtZW50ID0gdGhpcy5fZ2V0U3VidHJlZUVsZW1lbnQobm9kZUlkKSxcclxuICAgICAgICAgICAgY2xhc3NOYW1lcywgbGFiZWwsIG5vZGVDbGFzc05hbWUsIGRpc3BsYXksIGJ0bkVsZW1lbnQsIG5vZGVFbGVtZW50O1xyXG5cclxuICAgICAgICBpZiAoIXN1YnRyZWVFbGVtZW50IHx8IHN1YnRyZWVFbGVtZW50ID09PSB0aGlzLnJvb3RFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcztcclxuICAgICAgICBsYWJlbCA9IHRoaXMuc3RhdGVMYWJlbHNbc3RhdGVdO1xyXG4gICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcclxuICAgICAgICBidG5FbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKG5vZGVFbGVtZW50LCBjbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzKVswXTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlID09PSBub2RlU3RhdGVzLk9QRU5FRCkge1xyXG4gICAgICAgICAgICBkaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICAgICAgbm9kZUNsYXNzTmFtZSA9IHRoaXMuX2dldE5vZGVDbGFzc05hbWVGcm9tU3RhdGUobm9kZUVsZW1lbnQsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgbm9kZUVsZW1lbnQuY2xhc3NOYW1lID0gbm9kZUNsYXNzTmFtZTtcclxuICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheTtcclxuICAgICAgICBpZiAoYnRuRWxlbWVudCkge1xyXG4gICAgICAgICAgICBidG5FbGVtZW50LmlubmVySFRNTCA9IGxhYmVsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgbm9kZSBjbGFzcyBuYW1lIGZyb20gbmV3IGNoYW5nZWQgc3RhdGVcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVFbGVtZW50IC0gVHJlZU5vZGUgZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTmV3IGNoYW5nZWQgc3RhdGVcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IENsYXNzIG5hbWVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9nZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlOiBmdW5jdGlvbihub2RlRWxlbWVudCwgc3RhdGUpIHtcclxuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcclxuICAgICAgICAgICAgb3BlbmVkQ2xhc3NOYW1lID0gY2xhc3NOYW1lc1tub2RlU3RhdGVzLk9QRU5FRCArICdDbGFzcyddLFxyXG4gICAgICAgICAgICBjbG9zZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuQ0xPU0VEICsgJ0NsYXNzJ10sXHJcbiAgICAgICAgICAgIG5vZGVDbGFzc05hbWUgPSBub2RlRWxlbWVudC5jbGFzc05hbWVcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKCcgJyArIGNsb3NlZENsYXNzTmFtZSwgJycpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgnICcgKyBvcGVuZWRDbGFzc05hbWUsICcnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGVDbGFzc05hbWUgKyAnICcgKyBjbGFzc05hbWVzW3N0YXRlKydDbGFzcyddO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgaHRtbFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gbm9kZUlkcyAtIE5vZGUgaWQgbGlzdFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSFRNTFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX21ha2VIdG1sOiBmdW5jdGlvbihub2RlSWRzKSB7XHJcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcclxuICAgICAgICAgICAgc3RhdGVMYWJlbHMgPSB0aGlzLnN0YXRlTGFiZWxzLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVNvdXJjZSA9IHRoaXMudGVtcGxhdGUsXHJcbiAgICAgICAgICAgIGh0bWwgPSAnJyxcclxuICAgICAgICAgICAgZGVmYXVsdFNldCA9IHtcclxuICAgICAgICAgICAgICAgIHRleHRDbGFzczogY2xhc3NOYW1lcy50ZXh0Q2xhc3MsXHJcbiAgICAgICAgICAgICAgICBzdWJ0cmVlQ2xhc3M6IGNsYXNzTmFtZXMuc3VidHJlZUNsYXNzLFxyXG4gICAgICAgICAgICAgICAgdG9nZ2xlQnRuQ2xhc3M6IGNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc25pcHBldC5mb3JFYWNoKG5vZGVJZHMsIGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IG1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpLFxyXG4gICAgICAgICAgICAgICAgbm9kZURhdGEgPSBub2RlLmdldEFsbERhdGEoKSxcclxuICAgICAgICAgICAgICAgIHByb3BzID0gZXh0ZW5kKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbm9kZUlkXHJcbiAgICAgICAgICAgICAgICB9LCBkZWZhdWx0U2V0LCBub2RlRGF0YSksXHJcbiAgICAgICAgICAgICAgICBub2RlVGVtcGxhdGU7XHJcblxyXG4gICAgICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZVRlbXBsYXRlID0gdGVtcGxhdGVTb3VyY2UubGVhZk5vZGU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlVGVtcGxhdGUgPSB0ZW1wbGF0ZVNvdXJjZS5pbnRlcm5hbE5vZGU7XHJcbiAgICAgICAgICAgICAgICBwcm9wcy5zdGF0ZUNsYXNzID0gY2xhc3NOYW1lc1tzdGF0ZSsnQ2xhc3MnXTtcclxuICAgICAgICAgICAgICAgIHByb3BzLnN0YXRlTGFiZWwgPSBzdGF0ZUxhYmVsc1tzdGF0ZV07XHJcbiAgICAgICAgICAgICAgICBwcm9wcy5jaGlsZHJlbiA9IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaHRtbCArPSB1dGlsLnRlbXBsYXRlKG5vZGVUZW1wbGF0ZSwgcHJvcHMpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIHJldHVybiBodG1sO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERyYXcgdHJlZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBQYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2RyYXdDaGlsZHJlbjogZnVuY3Rpb24ocGFyZW50SWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShwYXJlbnRJZCksXHJcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgbm9kZSA9IHRoaXMubW9kZWwucm9vdE5vZGU7XHJcbiAgICAgICAgICAgIHBhcmVudElkID0gbm9kZS5nZXRJZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHRoaXMuX2dldFN1YnRyZWVFbGVtZW50KHBhcmVudElkKTtcclxuICAgICAgICBzdWJ0cmVlRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLl9tYWtlSHRtbChub2RlLmdldENoaWxkSWRzKCkpO1xyXG5cclxuICAgICAgICB0aGlzLm1vZGVsLmVhY2goZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlLmdldFN0YXRlKCkgPT09IG5vZGVTdGF0ZXMuT1BFTkVEKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4obm9kZUlkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2Uobm9kZUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHBhcmVudElkLCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgc3VidHJlZSBlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVHJlZU5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudHx1bmRlZmluZWR9IFN1YnRyZWUgZWxlbWVudCBvciB1bmRlZmluZWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9nZXRTdWJ0cmVlRWxlbWVudDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgc3VidHJlZUNsYXNzTmFtZSwgbm9kZUVsZW1lbnQsIHN1YnRyZWVFbGVtZW50O1xyXG4gICAgICAgIGlmICghbm9kZSB8fCBub2RlLmlzTGVhZigpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJvb3RFbGVtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3VidHJlZUNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lc1snc3VidHJlZUNsYXNzJ107XHJcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmdldElkKCkpO1xyXG4gICAgICAgIHN1YnRyZWVFbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKG5vZGVFbGVtZW50LCBzdWJ0cmVlQ2xhc3NOYW1lKVswXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN1YnRyZWVFbGVtZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc2V0IGNsaWNrIHRpbWVyXHJcbiAgICAgKi9cclxuICAgIHJlc2V0Q2xpY2tUaW1lcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLmNsaWNrVGltZXIpO1xyXG4gICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IG5vZGUgaWQgZnJvbSBlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gSFRNTEVsZW1lbnRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGVJZEZyb21FbGVtZW50OiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIGlkUHJlZml4ID0gdGhpcy5tb2RlbC5nZXROb2RlSWRQcmVmaXgoKTtcclxuXHJcbiAgICAgICAgd2hpbGUgKGVsZW1lbnQgJiYgZWxlbWVudC5pZC5pbmRleE9mKGlkUHJlZml4KSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5pZCA6ICcnO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBwcmVmaXggb2Ygbm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUHJlZml4IG9mIG5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZUlkUHJlZml4OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXROb2RlSWRQcmVmaXgoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZGF0YSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gUHJvcGVydGllc1xyXG4gICAgICovXHJcbiAgICBzZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0gbmFtZXMgLSBOYW1lcyBvZiBwcm9wZXJ0aWVzXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIG5hbWVzKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmVOb2RlRGF0YShub2RlSWQsIG5hbWVzKVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9wZW4gbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgb3BlbjogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgc3RhdGUgPSBub2RlU3RhdGVzLk9QRU5FRDtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcclxuICAgICAgICAgICAgbm9kZS5zZXRTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDbG9zZSBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICovXHJcbiAgICBjbG9zZTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgc3RhdGUgPSBub2RlU3RhdGVzLkNMT1NFRDtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcclxuICAgICAgICAgICAgbm9kZS5zZXRTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiovXHJcbiAgICB0b2dnbGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgIHN0YXRlO1xyXG5cclxuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc1Jvb3QoKSkge1xyXG4gICAgICAgICAgICBub2RlLnRvZ2dsZVN0YXRlKCk7XHJcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU29ydCBhbGwgbm9kZXNcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgLSBDb21wYXJhdG9yIGZvciBzb3J0aW5nXHJcbiAgICAgKi9cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLnNvcnQoY29tcGFyYXRvcik7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVmcmVzaCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVHJlZU5vZGUgaWQgdG8gcmVmcmVzaFxyXG4gICAgICoqL1xyXG4gICAgcmVmcmVzaDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXHJcbiAgICAgKi9cclxuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIG5vZGUocykuXHJcbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cclxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdy1kYXRhXHJcbiAgICAgKiBAcGFyYW0geyp9IHBhcmVudElkIC0gUGFyZW50IGlkXHJcbiAgICAgKi9cclxuICAgIGFkZDogZnVuY3Rpb24oZGF0YSwgcGFyZW50SWQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLmFkZChkYXRhLCBwYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxyXG4gICAgICovXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwucmVtb3ZlKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLm1vdmUobm9kZUlkLCBuZXdQYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlIGZhY2lsaXR5IG9mIHRyZWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmYWNpbGl0eU5hbWUgLSAnc2VsZWN0aW9uJywgJ2RuZCcsICdlZGl0aW5nJ1xyXG4gICAgICovXHJcbiAgICBlbmFibGU6IGZ1bmN0aW9uKGZhY2lsaXR5TmFtZSkge1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNhYmxlIGZhY2lsaXR5IG9mIHRyZWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmYWNpbGl0eU5hbWUgLSAnc2VsZWN0aW9uJywgJ2RuZCcsICdlZGl0aW5nJ1xyXG4gICAgICovXHJcbiAgICBkaXNhYmxlOiBmdW5jdGlvbihmYWNpbGl0eU5hbWUpIHtcclxuXHJcbiAgICB9XHJcbn0pO1xyXG5cclxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWUpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWU7XHJcbiIsIi8qKlxyXG4gKiBAZmlsZW92ZXJ2aWV3IFVwZGF0ZSB2aWV3IGFuZCBjb250cm9sIHRyZWUgZGF0YVxyXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgVHJlZU5vZGUgPSByZXF1aXJlKCcuL3RyZWVOb2RlJyksXHJcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XHJcblxyXG52YXIgc25pcHBldCA9IHR1aS51dGlsLFxyXG4gICAgZXh0ZW5kID0gc25pcHBldC5leHRlbmQsXHJcbiAgICBrZXlzID0gc25pcHBldC5rZXlzLFxyXG4gICAgZm9yRWFjaCA9IHNuaXBwZXQuZm9yRWFjaCxcclxuICAgIG1hcCA9IHNuaXBwZXQubWFwLFxyXG4gICAgZmlsdGVyID0gc25pcHBldC5maWx0ZXIsXHJcbiAgICBpbkFycmF5ID0gc25pcHBldC5pbkFycmF5O1xyXG5cclxuLyoqXHJcbiAqIFRyZWUgbW9kZWxcclxuICogQGNvbnN0cnVjdG9yIFRyZWVNb2RlbFxyXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gRGF0YVxyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnMgZm9yIGRlZmF1bHRTdGF0ZSBhbmQgbm9kZUlkUHJlZml4XHJcbiAqKi9cclxudmFyIFRyZWVNb2RlbCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU1vZGVsLnByb3RvdHlwZSAqL3sgLyogZXNsaW50LWRpc2FibGUgKi9cclxuICAgIGluaXQ6IGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpIHsvKmVzbGludC1lbmFibGUqL1xyXG4gICAgICAgIFRyZWVOb2RlLnNldElkUHJlZml4KG9wdGlvbnMubm9kZUlkUHJlZml4KTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCBzdGF0ZSBvZiBub2RlXHJcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm5vZGVEZWZhdWx0U3RhdGUgPSBvcHRpb25zLm5vZGVEZWZhdWx0U3RhdGU7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgYnVmZmVyXHJcbiAgICAgICAgICogQHR5cGUge251bGx9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5idWZmZXIgPSBudWxsO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSb290IG5vZGVcclxuICAgICAgICAgKiBAdHlwZSB7VHJlZU5vZGV9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yb290Tm9kZSA9IG5ldyBUcmVlTm9kZSh7XHJcbiAgICAgICAgICAgIHN0YXRlOiAnb3BlbmVkJ1xyXG4gICAgICAgIH0sIG51bGwpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUcmVlIGhhc2ggaGF2aW5nIGFsbCBub2Rlc1xyXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3QuPCosIFRyZWVOb2RlPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRyZWVIYXNoID0ge307XHJcblxyXG4gICAgICAgIHRoaXMuX3NldERhdGEoZGF0YSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIFRyZWVOb2RlLmlkUHJlZml4O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBtb2RlbCB3aXRoIHRyZWUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIFRyZWUgZGF0YVxyXG4gICAgICovXHJcbiAgICBfc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHZhciByb290ID0gdGhpcy5yb290Tm9kZSxcclxuICAgICAgICAgICAgcm9vdElkID0gcm9vdC5nZXRJZCgpO1xyXG5cclxuICAgICAgICB0aGlzLnRyZWVIYXNoW3Jvb3RJZF0gPSByb290O1xyXG4gICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCByb290KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHRyZWUgaGFzaCBmcm9tIGRhdGEgYW5kIHBhcmVudE5vZGVcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBUcmVlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IHBhcmVudCAtIFBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfbWFrZVRyZWVIYXNoOiBmdW5jdGlvbihkYXRhLCBwYXJlbnQpIHtcclxuICAgICAgICB2YXIgcGFyZW50SWQgPSBwYXJlbnQuZ2V0SWQoKTtcclxuXHJcbiAgICAgICAgZm9yRWFjaChkYXRhLCBmdW5jdGlvbihkYXR1bSkge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW5EYXRhID0gZGF0dW0uY2hpbGRyZW4sXHJcbiAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5fY3JlYXRlTm9kZShkYXR1bSwgcGFyZW50SWQpLFxyXG4gICAgICAgICAgICAgICAgbm9kZUlkID0gbm9kZS5nZXRJZCgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy50cmVlSGFzaFtub2RlSWRdID0gbm9kZTtcclxuICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcclxuICAgICAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGNoaWxkcmVuRGF0YSwgbm9kZSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIG5vZGVcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlRGF0YSAtIERhdHVtIG9mIG5vZGVcclxuICAgICAqIEBwYXJhbSB7Kn0gcGFyZW50SWQgLSBQYXJlbnQgaWRcclxuICAgICAqIEByZXR1cm4ge1RyZWVOb2RlfSBUcmVlTm9kZVxyXG4gICAgICovXHJcbiAgICBfY3JlYXRlTm9kZTogZnVuY3Rpb24obm9kZURhdGEsIHBhcmVudElkKSB7XHJcbiAgICAgICAgdmFyIG5vZGU7XHJcbiAgICAgICAgbm9kZURhdGEgPSBleHRlbmQoe1xyXG4gICAgICAgICAgICBzdGF0ZTogdGhpcy5ub2RlRGVmYXVsdFN0YXRlXHJcbiAgICAgICAgfSwgbm9kZURhdGEpO1xyXG5cclxuICAgICAgICBub2RlID0gbmV3IFRyZWVOb2RlKG5vZGVEYXRhLCBwYXJlbnRJZCk7XHJcbiAgICAgICAgbm9kZS5yZW1vdmVEYXRhKCdjaGlsZHJlbicpO1xyXG5cclxuICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgY2hpbGRyZW5cclxuICAgICAqIEBwYXJhbSB7Kn0gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybiB7QXJyYXkuPFRyZWVOb2RlPn0gY2hpbGRyZW5cclxuICAgICAqL1xyXG4gICAgZ2V0Q2hpbGRyZW46IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtYXAobm9kZS5nZXRDaGlsZElkcygpLCBmdW5jdGlvbihjaGlsZElkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE5vZGUoY2hpbGRJZCk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBudW1iZXIgb2Ygbm9kZXNcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBudW1iZXIgb2Ygbm9kZXNcclxuICAgICAqL1xyXG4gICAgZ2V0Q291bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBrZXlzKHRoaXMudHJlZUhhc2gpLmxlbmd0aDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgbGFzdCBkZXB0aFxyXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIGxhc3QgZGVwdGhcclxuICAgICAqL1xyXG4gICAgZ2V0TGFzdERlcHRoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZGVwdGhzID0gbWFwKHRoaXMudHJlZUhhc2gsIGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGVwdGgobm9kZS5nZXRJZCgpKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KG51bGwsIGRlcHRocyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmluZCBub2RlXHJcbiAgICAgKiBAcGFyYW0geyp9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcclxuICAgICAqIEByZXR1cm4ge1RyZWVOb2RlfHVuZGVmaW5lZH0gTm9kZVxyXG4gICAgICovXHJcbiAgICBnZXROb2RlOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRyZWVIYXNoW2lkXTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgZGVwdGggZnJvbSBub2RlIGlkXHJcbiAgICAgKiBAcGFyYW0geyp9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcclxuICAgICAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9IERlcHRoXHJcbiAgICAgKi9cclxuICAgIGdldERlcHRoOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKSxcclxuICAgICAgICAgICAgZGVwdGggPSAwLFxyXG4gICAgICAgICAgICBwYXJlbnQ7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuICAgICAgICB3aGlsZSAocGFyZW50KSB7XHJcbiAgICAgICAgICAgIGRlcHRoICs9IDE7XHJcbiAgICAgICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShwYXJlbnQuZ2V0UGFyZW50SWQoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGVwdGg7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWQgdG8gcmVtb3ZlXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oaWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxyXG4gICAgICAgICAgICBwYXJlbnQ7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuXHJcbiAgICAgICAgZm9yRWFjaChub2RlLmdldENoaWxkSWRzKCksIGZ1bmN0aW9uKGNoaWxkSWQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoY2hpbGRJZCwgdHJ1ZSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZElkKGlkKTtcclxuICAgICAgICBkZWxldGUgdGhpcy50cmVlSGFzaFtpZF07XHJcblxyXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnQuZ2V0SWQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZCBub2RlKHMpLlxyXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXHJcbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxyXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxyXG4gICAgICogQHBhcmFtIHsqfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShwYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZTtcclxuXHJcbiAgICAgICAgZGF0YSA9IFtdLmNvbmNhdChkYXRhKTtcclxuICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goZGF0YSwgcGFyZW50KTtcclxuICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIHBhcmVudElkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZGF0YSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxyXG4gICAgICogQHBhcmFtIHsqfSBpZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcyAtIFByb3BlcnRpZXNcclxuICAgICAqL1xyXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKGlkLCBwcm9wcykge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlIHx8ICFwcm9wcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBub2RlLnNldERhdGEocHJvcHMpO1xyXG4gICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgbm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0gbmFtZXMgLSBOYW1lcyBvZiBwcm9wZXJ0aWVzXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihpZCwgbmFtZXMpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSB8fCAhbmFtZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR1aS51dGlsLmlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRGF0YS5hcHBseShub2RlLCBuYW1lcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhKG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBub2RlLmdldFBhcmVudElkKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnQncyBjaGlsZFxyXG4gICAgICogQHBhcmFtIHsqfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0geyp9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG5ld1BhcmVudElkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgb3JpZ2luYWxQYXJlbnQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbmV3UGFyZW50ID0gdGhpcy5nZXROb2RlKG5ld1BhcmVudElkKSB8fCB0aGlzLnJvb3ROb2RlO1xyXG4gICAgICAgIG5ld1BhcmVudElkID0gbmV3UGFyZW50LmdldElkKCk7XHJcbiAgICAgICAgb3JpZ2luYWxQYXJlbnRJZCA9IG5vZGUuZ2V0UGFyZW50SWQoKTtcclxuICAgICAgICBvcmlnaW5hbFBhcmVudCA9IHRoaXMuZ2V0Tm9kZShvcmlnaW5hbFBhcmVudElkKTtcclxuXHJcbiAgICAgICAgbm9kZS5zZXRQYXJlbnRJZChuZXdQYXJlbnRJZCk7XHJcbiAgICAgICAgb3JpZ2luYWxQYXJlbnQucmVtb3ZlQ2hpbGRJZChub2RlSWQpO1xyXG4gICAgICAgIG5ld1BhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XHJcbiAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywgbm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU29ydCBub2Rlc1xyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZnVuY3Rpb25cclxuICAgICAqL1xyXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvcikge1xyXG4gICAgICAgIHRoaXMuZWFjaEFsbChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRDaGlsZHJlbihub2RlSWQpLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRJZHM7XHJcblxyXG4gICAgICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4uc29ydChjb21wYXJhdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGlsZElkcyA9IG1hcChjaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGQuZ2V0SWQoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgbm9kZS5yZXBsYWNlQ2hpbGRJZHMoY2hpbGRJZHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXHJcbiAgICAgKi9cclxuICAgIGVhY2hBbGw6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XHJcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcclxuXHJcbiAgICAgICAgZm9yRWFjaCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaXRlcmF0ZWUuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIGRlc2NlbmRhbnRzIG9mIGEgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxyXG4gICAgICovXHJcbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgc3RhY2ssIG5vZGVJZCwgbm9kZTtcclxuXHJcbiAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShwYXJlbnRJZCk7XHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhY2sgPSBub2RlLmdldENoaWxkSWRzKCk7XHJcblxyXG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBub2RlSWQgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xyXG4gICAgICAgICAgICBpdGVyYXRlZS5jYWxsKGNvbnRleHQsIG5vZGUsIG5vZGVJZCk7XHJcblxyXG4gICAgICAgICAgICB1dGlsLnB1c2hBbGwoc3RhY2ssIG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuXHJcbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihUcmVlTW9kZWwpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVNb2RlbDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RhdGVzID0gcmVxdWlyZSgnLi9zdGF0ZXMnKS5ub2RlLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIGxhc3RJbmRleCA9IDAsXG4gICAgZ2V0TmV4dEluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxhc3RJbmRleCArPSAxO1xuICAgICAgICByZXR1cm4gbGFzdEluZGV4O1xuICAgIH0sXG4gICAgUkVTRVJWRURfUFJPUEVSVElFUyA9IHtcbiAgICAgICAgaWQ6ICcnLFxuICAgICAgICBzdGF0ZTogJ3NldFN0YXRlJ1xuICAgIH07XG5cbi8qKlxuICogVHJlZU5vZGVcbiAqIEBDb25zdHJ1Y3RvciBUcmVlTm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG5vZGVEYXRhIC0gTm9kZSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gW3BhcmVudElkXSAtIFBhcmVudCBub2RlIGlkXG4gKi9cbnZhciBUcmVlTm9kZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU5vZGUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgc2V0SWRQcmVmaXg6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICAgICAgdGhpcy5pZFByZWZpeCA9IHByZWZpeCB8fCB0aGlzLmlkUHJlZml4O1xuICAgICAgICB9LFxuICAgICAgICBpZFByZWZpeDogJydcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faWQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXJlbnQgbm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPG51bWJlcj59XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIGRhdGFcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBzdGF0ZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuXG4gICAgICAgIHRoaXMuX3N0YW1wSWQoKTtcbiAgICAgICAgdGhpcy5zZXREYXRhKG5vZGVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhbXAgbm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3N0YW1wSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pZCA9IHRoaXMuY29uc3RydWN0b3IuaWRQcmVmaXggKyBnZXROZXh0SW5kZXgoKTtcbiAgICB9LFxuXG4gICAgX3NldFJlc2VydmVkUHJvcGVydGllczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoT3duUHJvcGVydGllcyhSRVNFUlZFRF9QUk9QRVJUSUVTLCBmdW5jdGlvbihzZXR0ZXIsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbbmFtZV07XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiBzZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3NldHRlcl0odmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGRhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgc3RhdGVcbiAgICAgKi9cbiAgICB0b2dnbGVTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZSA9PT0gc3RhdGVzLkNMT1NFRCkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuT1BFTkVEO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBzdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIFN0YXRlIG9mIG5vZGUgKCdjbG9zZWQnLCAnb3BlbmVkJylcbiAgICAgKi9cbiAgICBzZXRTdGF0ZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgc3RhdGUgKz0gJyc7XG4gICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzW3N0YXRlLnRvVXBwZXJDYXNlKCldIHx8IHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc3RhdGVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzdGF0ZSAoJ29wZW5lZCcgb3IgJ2Nsb3NlZCcpXG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IE5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHBhcmVudCBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFBhcmVudCBub2RlIGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50SWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIHNldFBhcmVudElkOiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXBsYWNlIGNoaWxkSWRzXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gY2hpbGRJZHMgLSBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICovXG4gICAgcmVwbGFjZUNoaWxkSWRzOiBmdW5jdGlvbihjaGlsZElkcykge1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IGNoaWxkSWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqIEByZXR1cm5zIHtBcnJheS48bnVtYmVyPn0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkSWRzLnNsaWNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICBhZGRDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLl9jaGlsZElkcztcblxuICAgICAgICBpZiAodHVpLnV0aWwuaW5BcnJheShjaGlsZElkcywgaWQpID09PSAtMSkge1xuICAgICAgICAgICAgY2hpbGRJZHMucHVzaChpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIHJlbW92ZUNoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlSXRlbUZyb21BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGF0YVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gUHJvcGVydHkgbmFtZSBvZiBkYXRhXG4gICAgICogQHJldHVybnMgeyp9IERhdGFcbiAgICAgKi9cbiAgICBnZXREYXRhOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBEYXRhXG4gICAgICovXG4gICAgZ2V0QWxsRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5leHRlbmQoe30sIHRoaXMuX2RhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRGF0YSBmb3IgYWRkaW5nXG4gICAgICovXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkYXRhID0gdGhpcy5fc2V0UmVzZXJ2ZWRQcm9wZXJ0aWVzKGRhdGEpO1xuICAgICAgICB0dWkudXRpbC5leHRlbmQodGhpcy5fZGF0YSwgZGF0YSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGRhdGFcbiAgICAgKiBAcGFyYW0gey4uLnN0cmluZ30gbmFtZXMgLSBOYW1lcyBvZiBkYXRhXG4gICAgICovXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24obmFtZXMpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaEFycmF5KGFyZ3VtZW50cywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIG5vZGUgaXMgbGVhZi5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gTm9kZSBpcyBsZWFmIG9yIG5vdC5cbiAgICAgKi9cbiAgICBpc0xlYWY6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuX2NoaWxkSWRzLmxlbmd0aCA9PT0gMCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyByb290LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIHJvb3Qgb3Igbm90LlxuICAgICAqL1xuICAgIGlzUm9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5pc0ZhbHN5KHRoaXMuX3BhcmVudElkKTtcbiAgICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU5vZGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbnZhciB1dGlsID0ge1xuICAgIC8qKlxuICAgICAqIFB1c2ggYWxsIGVsZW1lbnRzIGZyb20gbmV3IGFycmF5XG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyMSAtIEJhc2UgYXJyYXlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIyIC0gTmV3IGFycmF5XG4gICAgICovXG4gICAgcHVzaEFsbDogZnVuY3Rpb24oYXJyMSwgYXJyMikge1xuICAgICAgICB2YXIgbGVuZ3RoID0gYXJyMi5sZW5ndGgsXG4gICAgICAgICAgICBpID0gMDtcblxuICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBhcnIxLnB1c2goYXJyMltpXSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpcnN0IHNwZWNpZmllZCBpdGVtIGZyb20gYXJyYXksIGlmIGl0IGV4aXN0c1xuICAgICAqIEBwYXJhbSB7Kn0gaXRlbSBJdGVtIHRvIGxvb2sgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyIEFycmF5IHRvIHF1ZXJ5XG4gICAgICovXG4gICAgcmVtb3ZlSXRlbUZyb21BcnJheTogZnVuY3Rpb24oaXRlbSwgYXJyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoaXRlbSwgYXJyKTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHRvIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnQgXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFkZFxuICAgICAqL1xuICAgIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBmcm9tIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVtb3ZlXG4gICAgICovXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gRXZlbnQgdGFyZ2V0XG4gICAgICovXG4gICAgZ2V0VGFyZ2V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQ7XG4gICAgICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgSFRNTEVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBDbGFzcyBuYW1lXG4gICAgICovXG4gICAgZ2V0Q2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgJiYgZWxlbWVudC5nZXRBdHRyaWJ1dGUgJiYgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8ICcnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgdGhlIGVsZW1lbnQgaGFzIHNwZWNpZmljIGNsYXNzIG9yIG5vdFxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgQSBuYW1lIG9mIGNsYXNzIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBlbGVtZW50IGhhcyB0aGUgY2xhc3NcbiAgICAgKi9cbiAgICBoYXNDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBlbENsYXNzTmFtZSA9IHV0aWwuZ2V0Q2xhc3MoZWxlbWVudCk7XG5cbiAgICAgICAgcmV0dXJuIGVsQ2xhc3NOYW1lLmluZGV4T2YoY2xhc3NOYW1lKSA+IC0xO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGVsZW1lbnQgYnkgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3NcbiAgICAgKiBAcmV0dXJuIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBFbGVtZW50c1xuICAgICAqL1xuICAgIGdldEVsZW1lbnRzQnlDbGFzc05hbWU6IGZ1bmN0aW9uKHRhcmdldCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBhbGwsIGZpbHRlcmVkO1xuXG4gICAgICAgIGlmICh0YXJnZXQucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0YXJnZXQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWxsID0gdGFyZ2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJyk7XG4gICAgICAgICAgICBmaWx0ZXJlZCA9IHR1aS51dGlsLmZpbHRlcihhbGwsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChjbGFzc05hbWVzLmluZGV4T2YoY2xhc3NOYW1lKSAhPT0gLTEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgd2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBjbGljayBldmVudCBieSByaWdodCBidXR0b25cbiAgICAgKi9cbiAgICBpc1JpZ2h0QnV0dG9uOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICByZXR1cm4gdXRpbC5fZ2V0QnV0dG9uKGV2ZW50KSA9PT0gMjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgcHJvcGVydHkgZXhpc3Qgb3Igbm90XG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJvcHMgQSBwcm9wZXJ0eVxuICAgICAqIEByZXR1cm4ge3N0cmluZ3xib29sZWFufSBQcm9wZXJ0eSBuYW1lIG9yIGZhbHNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgdXNlclNlbGVjdFByb3BlcnR5ID0gdXRpbC50ZXN0UHJvcChbXG4gICAgICogICAgICd1c2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ1dlYmtpdFVzZXJTZWxlY3QnLFxuICAgICAqICAgICAnT1VzZXJTZWxlY3QnLFxuICAgICAqICAgICAnTW96VXNlclNlbGVjdCcsXG4gICAgICogICAgICdtc1VzZXJTZWxlY3QnXG4gICAgICogXSk7XG4gICAgICovXG4gICAgdGVzdFByb3A6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSxcbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IGZhbHNlO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2gocHJvcHMsIGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgICAgIGlmIChwcm9wIGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcDtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcHJvcGVydHlOYW1lO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IGRlZmF1bHQgZXZlbnQgXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBodG1sIGZyb20gdGVtcGxhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc291cmNlIC0gVGVtcGxhdGUgaHRtbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRlbXBsYXRlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBodG1sXG4gICAgICovXG4gICAgdGVtcGxhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgcHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZS5yZXBsYWNlKC9cXHtcXHsoXFx3Kyl9fS9naSwgZnVuY3Rpb24obWF0Y2gsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHByb3BzW25hbWVdO1xuICAgICAgICAgICAgaWYgKHR1aS51dGlsLmlzRmFsc3kodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXphdGlvbiBmb3IgZXZlbnQgYnV0dG9uIHByb3BlcnR5IFxuICAgICAqIDA6IEZpcnN0IG1vdXNlIGJ1dHRvbiwgMjogU2Vjb25kIG1vdXNlIGJ1dHRvbiwgMTogQ2VudGVyIGJ1dHRvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH0gYnV0dG9uIHR5cGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRCdXR0b246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBidXR0b24sXG4gICAgICAgICAgICBwcmltYXJ5ID0gJzAsMSwzLDUsNycsXG4gICAgICAgICAgICBzZWNvbmRhcnkgPSAnMiw2JyxcbiAgICAgICAgICAgIHdoZWVsID0gJzQnO1xuXG4gICAgICAgIGlmIChkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5oYXNGZWF0dXJlKCdNb3VzZUV2ZW50cycsICcyLjAnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGV2ZW50LmJ1dHRvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJ1dHRvbiA9IGV2ZW50LmJ1dHRvbiArICcnO1xuICAgICAgICBpZiAocHJpbWFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0gZWxzZSBpZiAoc2Vjb25kYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMjtcbiAgICAgICAgfSBlbHNlIGlmICh3aGVlbC5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=
