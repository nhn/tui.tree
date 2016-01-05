/**
 * @fileoverview Update view and control tree data
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

/**
 * @constructor TreeModel
 * **/
var TreeModel = tui.util.defineClass(/** @lends TreeModel.prototype */{
    init: function(options, tree) {

        /**
         * A count for node identity number
         * @type {number}
         */
        this.count = 0;

        /**
         * A view that observe model change
         * @type {tui.component.Tree}
         */
        this.tree = tree;

        /**
         * Default state of node
         * @type {String}
         */
        this.nodeDefaultState = options.defaultState || 'closed';

        /**
         * A buffer 
         * @type {null}
         */
        this.buffer = null;

        /**
         * A depth
         * @type {number}
         */
        this.depth = 0;

        /**
         * A milisecon time to make node ID
         * @type {number}
         */
        this.date = new Date().getTime();

        /**
         * Tree hash
         * @type {object}
         */
        this.treeHash = {};

        this.treeHash['root'] = this.makeNode(0, 'root', 'root');
        this.connect(tree);
    },

    /**
     * Set model with tree data
     * @param {array} data  A tree data
     */
    setData: function(data) {
        this.treeHash.root.childKeys = this._makeTreeHash(data);
    },

    /**
     * Change hierarchy data to hash list.
     * @param {array} data A tree data 
     * @param {string} parentId A parent node id
     * @private
     */
    _makeTreeHash: function(data, parentId) {

        var childKeys = [],
            id;

        this.depth = this.depth + 1;

        tui.util.forEach(data, function(element) {
            id = this._getId();
            this.treeHash[id] = this.makeNode(this.depth, id, element.value, parentId);
            if (element.children && tui.util.isNotEmpty(element.children)) {
                this.treeHash[id].childKeys = this._makeTreeHash(element.children, id);
            }
            childKeys.push(id);
        }, this);

        this.depth = this.depth - 1;
        childKeys.sort(tui.util.bind(this.sort, this));
        return childKeys;
    },

    /**
     * Create node
     * @param {number} depth A depth of node
     * @param {string} id A node ID
     * @param {string} value A value of node
     * @param {string} parentId A parent node ID
     * @return {{value: *, parentId: (*|string), id: *}}
     */
    makeNode: function(depth, id, value, parentId) {
        return {
            depth: depth,
            value: value,
            parentId: (depth === 0) ? null : (parentId || 'root'),
            state: this.nodeDefaultState,
            id: id
        };
    },

    /**
     * Make and return node ID
     * @private
     * @return {String}
     */
    _getId: function() {
        this.count = this.count + 1;
        return 'node_' + this.date + '_' + this.count;
    },

    /**
     * Find node 
     * @param {string} key A key to find node
     * @return {object|undefined}
     */
    find: function(key) {
        return this.treeHash[key];
    },

    /**
     * Remove node and child nodes
     * @param {string} key A key to remove
     */
    remove: function(key) {
        /**
         * @api
         * @event TreeModel#remove
         * @param {{id: string}} removed - id
         * @example
         * tree.model.on('remove', function(data) {
         *     alert('removed -' +  data.id );
         * });
         */
        var res = this.invoke('remove', { id: key });

        if (!res) {
            return;
        }

        this.removeKey(key);
        this.treeHash[key] = null;

        this.notify();
    },

    /**
     * Remove node key
     * @param {string} key A key to remove
     */
    removeKey: function(key) {
        var node = this.find(key);

        if (!node) {
            return;
        }

        var parent = this.find(node.parentId);

        parent.childKeys = tui.util.filter(parent.childKeys, function(childKey) {
            return childKey !== key;
        });

    },

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
     */
    insert: function(node, targetId) {
        var target = this.find(targetId || 'root');

        if (!target.childKeys) {
            target.childKeys = [];
        }

        target.childKeys.push(node.id);
        node.depth = target.depth + 1;
        node.parentId = targetId;
        target.childKeys.sort(tui.util.bind(this.sort, this));

        this.treeHash[node.id] = node;

        this.notify();
    },

    /**
     * A notify tree
     */
    notify: function(type, target) {
        if (this.tree) {
            this.tree.notify(type, target);
        }
    },

    /**
     * Connect view and model
     * @param {Tree} tree
     */
    connect: function(tree) {
        if (!tree) {
            return;
        }
        this.tree = tree;
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

        this.clearBuffer();

        var node = this.find(key);

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
    },

    /**
     * Sort by title
     * @param {string} pid
     * @param {string} nid
     * @return {number}
     */
    sort: function(pid, nid) {
        var p = this.find(pid),
            n = this.find(nid);

        if (!p || !n) {
            return 0;
        }

        if (p.value < n.value) {
            return -1;
        } else if (p.value > n.value) {
            return 1;
        } else {
            return 0;
        }
    }
});
tui.util.CustomEvents.mixin(TreeModel);

module.exports = TreeModel;
