/**
 * @fileoverview Update view and control tree data
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */
'use strict';

var util = require('./util'),
    nodeStates = require('./states').node;

var lastId = 0,
    extend = tui.util.extend,
    keys = tui.util.keys;

/**
 * @typedef node
 * @type {object}
 * @property {number} id - Node id
 * @property {number} depth - Node depth
 * @property {number} parentId - Parent id
 * @property {number} state - opened or closed
 * @property {Array.<number>} childIds - Ids of children
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
         * Tree hash
         * @type {object.<number, node>}
         */
        this.treeHash = {};

        /**
         * Root node
         * @type {node}
         */
        this.rootNode = this._makeNode();

        this._setData(data);
    },

    /**
     * Set model with tree data
     * @param {Array} data  A tree data
     */
    _setData: function(data) {
        var root = this.rootNode;

        root.state = nodeStates.OPENED;

        this.treeHash[root.id] = root;
        this._makeTreeHash(data, root);
    },

    /**
     * Change hierarchy data to hash list.
     * @param {Array} data - Tree data
     * @param {node} parent - Parent node
     * @private
     * @todo stack over flow
     */
    _makeTreeHash: function(data, parent) {
        var parentChildIds = parent.childIds,
            parentId = parent.id,
            depth = parent.depth + 1;

        tui.util.forEach(data, function(datum) {
            var node = this._makeNode(datum, parentId, depth),
                id = node.id;

            this.treeHash[id] = node;
            parentChildIds.push(id);
            this._makeTreeHash(node.children, node);

            delete node.children;
        }, this);
    },

    /**
     * Create node
     * @param {object} [datum] A datum of node
     * @param {string|undefined} [parentId] A parent id
     * @param {number} [depth] A depth of node
     * @return {object} A node
     */
    _makeNode: function(datum, parentId, depth) {
        parentId = parentId || null;
        depth = depth || tui.util.pick(this.treeHash, parentId, 'depth') || 0;

        return extend({
            depth: depth,
            state: this.nodeDefaultState,
            id: this._makeId(),
            parentId: parentId,
            childIds: []
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
     * Get the number of nodes
     * @returns {number} The number of nodes
     */
    getCount: function() {
        return keys(this.treeHash).length;
    },

    /**
     * Find node 
     * @param {number} id - A node id to find
     * @return {node|undefined} node
     */
    find: function(id) {
        return this.treeHash[id];
    },

    /**
     * Remove a node with children
     * @param {string} id A node id to remove
     */
    remove: function(id) {
        var node = this.find(id),
            parent = this.find(node.parentId);

        tui.util.forEach(node.childIds, function(childId) {
            this.remove(childId);
        }, this);

        util.removeItemFromArray(parent.childIds, id);
        delete this.treeHash[id];
    },

    /**
     * Add node(s)
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - This method will force to overwrite the data having same id in tree.
     * @param {Array|object} data Raw-data
     * @param {*} parentId Parent id
     */
    add: function(data, parentId) {
        var parent = this.find(parentId) || this.rootNode;
        data = [].concat(data);
        this._makeTreeHash(data, parent);
    },

    /**
     * Traverse this tree iterating over all nodes.
     * @param {Function} iteratee - Iteratee function
     */
    each: function(iteratee) {
        tui.util.forEach(this.treeHash, function(node) {
            iteratee(node);
        });
    },

    /*********************************************************
     *
     * @todo
     *
     *********************************************************/
    /**
     * Move node
     * @param {string} key A key to move node
     * @param {object} node A node object to move
     * @param {string} targetId A target ID to insert
     */
    move: function(key, node, targetId) {
        this.removeKey(key);
        this.treeHash[key] = null;
        this.insert(node, targetId);
    },

    /**
     * Insert node
     * @param {object} node A node object to insert
     * @param {string} [targetId] A target ID to insert
     * @todo
     */
    insert: function(node, targetId) {
        var target = this.find(targetId || 'root');

        if (!target.childIds) {
            target.childIds = [];
        }

        target.childIds.push(node.id);
        node.depth = target.depth + 1;
        node.parentId = targetId;
        target.childIds.sort(tui.util.bind(this.sort, this));

        this.treeHash[node.id] = node;

        this.notify();
    },

    /**
     * Rename node
     * @param {stirng} key A key to rename
     * @param {string} value A value to change
     */
    rename: function(key, value) {
        /**
         * @api
         * @event TreeModel#rename
         * @param {{id: string, value: string}} eventData
         * @example
         * // 노드 이름 변경시 발생
         * tree.model.on('rename', function(object) {
         *     document.getElementById('selectValue').value = object.value + '노드 이름 변경';
         *     return true;
         * });
         */
        var res = this.invoke('rename', {id: key, value: value});
        if (!res) {
            return;
        }

        var node = this.find(key);
        node.value = value;

        this.notify('rename', node);
    },

    /**
     * Change node state
     * @param {string} key The key value to change
     */
    changeState: function(key) {
        var node = this.find(key);
        node.state = (node.state === 'open') ? 'close' : 'open';
        this.notify('toggle', node);
    },

    /**
     * Set buffer to save selected node
     * @param {String} key The key of selected node
     **/
    setBuffer: function(key) {
        var node = this.find(key);
        this.clearBuffer();
        this.notify('select', node);

        /**
         * @api
         * @event TreeModel#select
         * @param {{id: string, value: string}} eventData
         * @example
         * // 노드를 선택시 발생
         * tree.model.on('select', function(object) {
         *     document.getElementById('selectValue').value = object.value;
         * });
         */
        this.fire('select', {id: key, value: node.value });

        this.buffer = node;
    },

    /**
     * Empty buffer
     */
    clearBuffer: function() {
        if (!this.buffer) {
            return;
        }

        this.notify('unselect', this.buffer);
        this.buffer = null;
    },

    /**
     * Check movable positon
     * @param {object} dest A destination node
     * @param {object} node A target node
     */
    isDisable: function(dest, node) {
        if (dest.depth === node.depth) {
            return false;
        }
        if (dest.parentId) {
            if (dest.id === node.parentId) {
                return true;
            }
            if (dest.parentId === node.id) {
                return true;
            } else {
                return this.isDisable(this.find(dest.parentId), node);
            }
        }
    }
});

tui.util.CustomEvents.mixin(TreeModel);
module.exports = TreeModel;
