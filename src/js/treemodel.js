/**
 * @fileoverview Update view and control tree data
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */
'use strict';

var util = require('./util'),
    nodeStates = require('./states').node;

var lastId = 0,
    extend = tui.util.extend,
    keys = tui.util.keys,
    forEach = tui.util.forEach,
    map = tui.util.map,
    RESERVED_PROPERTIES = [
        'id',
        'parentId',
        'childIds'
    ];

/**
 * @typedef node
 * @type {object}
 * @property {*} id - Node id
 * @property {*} parentId - Parent id
 * @property {Array.<*>} childIds - Child Ids
 * @property {number} state - opened or closed
 */

/**
 * Tree model
 * @constructor TreeModel
 * @param {string} defaultState - Default state of node
 * @param {Array} data - Data
 **/
var TreeModel = tui.util.defineClass(/** @lends TreeModel.prototype */{ /* eslint-disable */
    init: function(nodeDefaultState, data) {/*eslint-enable*/
        /**
         * Default state of node
         * @type {String}
         */
        this.nodeDefaultState = nodeDefaultState;

        /**
         * A buffer 
         * @type {null}
         */
        this.buffer = null;

        /**
         * Root node
         * @type {node}
         */
        this.rootNode = this._makeNode({
            state: nodeStates.OPENED
        }, null);

        /**
         * Node container
         * - Nodes are grouped by depth same as index in this container.
         * @type {object.<*, node>}
         */
        this.treeHash = {};

        this._setData(data);
    },

    /**
     * Set model with tree data
     * @param {Array} data - Tree data
     */
    _setData: function(data) {
        var root = this.rootNode,
            rootId = root.id;

        this.treeHash[rootId] = root;
        this._makeTreeHash(data, root);
    },

    /**
     * Change hierarchy data to hash list.
     * @param {Array} data - Tree data
     * @param {node} parent - Parent node id
     * @private
     */
    _makeTreeHash: function(data, parent) {
        var parentId = parent.id,
            childIds = parent.childIds;

        forEach(data, function(datum) {
            var node = this._makeNode(datum, parentId),
                nodeId = node.id;

            childIds.push(nodeId);
            this.treeHash[nodeId] = node;

            this._makeTreeHash(node.children, node);
            delete node.children;
        }, this);
    },

    /**
     * Create node
     * @param {object} datum - Datum of node
     * @param {*} parentId - Parent id
     * @return {node} Node
     */
    _makeNode: function(datum, parentId) {
        return extend({
            id: this._makeId(),
            parentId: parentId,
            childIds: [],
            state: this.nodeDefaultState
        }, datum);
    },

    /**
     * Make and return node ID
     * @private
     * @return {number} id
     */
    _makeId: function() {
        lastId += 1;
        return lastId;
    },

    /**
     * Get children
     * @param {*} nodeId - Node id
     * @return {Array.<node>} children
     */
    getChildren: function(nodeId) {
        var node = this.getNode(nodeId);
        if (!node) {
            return;
        }

        return map(node.childIds, function(childId) {
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
            return this.getDepth(node.id);
        }, this);

        return Math.max.apply(null, depths);
    },

    /**
     * Find node 
     * @param {*} id - A node id to find
     * @return {node|undefined} Node
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
            parent = this.getNode(node.parentId),
            depth = 0;

        while (parent) {
            depth += 1;
            parent = this.getNode(parent.parentId);
        }

        return depth;
    },

    /**
     * Remove a node with children
     * - The update event will be fired.
     * @param {*} id - Node id to remove
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    remove: function(id, isSilent) {
        var node = this.getNode(id),
            parent;

        if (!node) {
            return;
        }

        parent = this.getNode(node.parentId);
        forEach(node.childIds, function(childId) {
            this.remove(childId, true);
        }, this);

        util.removeItemFromArray(parent.childIds, id);
        delete this.treeHash[id];

        if (!isSilent) {
            this.fire('update', parent);
        }
    },

    /**
     * Add node(s)
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - The update event will be fired
     * @param {Array|object} data Raw-data
     * @param {*} parentId Parent id
     */
    add: function(data, parentId) {
        var parent = this.getNode(parentId) || this.rootNode;

        data = [].concat(data);
        this._makeTreeHash(data, parent);
        this.fire('update', parent);
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

        forEach(RESERVED_PROPERTIES, function(propName) { // Delete properties in props
            delete props[propName];
        });

        extend(node, props); // Update properties
        this.fire('update', node);
    },

    /**
     * Move a node to new parent's child
     * @param {*} nodeId - Node id
     * @param {*} newParentId - New parent id
     */
    move: function(nodeId, newParentId) {
        var getNode = this.getNode,
            node = getNode(id),
            originalParent = getNode(node.parentId),
            newParent = getNode(newParentId) || this.rootNode;

        if (!node) {
            return;
        }

        util.removeItemFromArray(originalParent.childIds, nodeId);
        newParent.childIds.push(nodeId);

        this.fire('move', node, originalParent, newParent);
    },

    /**
     * Sort nodes
     * @param {Function} comparator - Comparator function
     */
    sort: function(comparator) {
        this.each(function(node) {
            var children = this.getChildren(node.id);

            if (children.length > 1) {
                children.sort(comparator);

                node.childIds = map(children, function(child) {
                    return child.id;
                });
            }
        });
    },

    /**
     * Traverse this tree iterating over all nodes.
     * @param {Function} iteratee - Iteratee function
     * @param {object} [context] - Context of iteratee
     */
    each: function(iteratee, context) {
        context = context || this;

        forEach(this.treeHash, function() {
            iteratee.apply(context, arguments);
        });
    }
});

tui.util.CustomEvents.mixin(TreeModel);
module.exports = TreeModel;
