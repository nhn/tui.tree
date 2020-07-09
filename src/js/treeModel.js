/**
 * @fileoverview Update view and control tree data
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var forEachArray = require('tui-code-snippet/collection/forEachArray');
var forEachOwnProperties = require('tui-code-snippet/collection/forEachOwnProperties');
var CustomEvents = require('tui-code-snippet/customEvents/customEvents');
var defineClass = require('tui-code-snippet/defineClass/defineClass');
var extend = require('tui-code-snippet/object/extend');
var isArray = require('tui-code-snippet/type/isArray');
var util = require('./util');

var TreeNode = require('./treeNode');

/**
 * Tree model
 * @class TreeModel
 * @param {Array} data - Data
 * @param {Object} options - Options for defaultState and nodeIdPrefix
 * @ignore
 */
var TreeModel = defineClass(
  /** @lends TreeModel.prototype */ {
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
      this.rootNode = new TreeNode(
        {
          state: 'opened'
        },
        null
      );

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
      var root = this.rootNode;
      var rootId = root.getId();

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
      var parentId = parent.getId();
      var ids = [];

      forEachArray(
        data || [],
        function(datum) {
          var childrenData = datum.children;
          var node = this._createNode(datum, parentId);
          var nodeId = node.getId();

          ids.push(nodeId);
          this.treeHash[nodeId] = node;
          parent.addChildId(nodeId);
          this._makeTreeHash(childrenData, node);
        },
        this
      );

      return ids;
    },

    /**
     * Create node
     * @param {object} nodeData - Datum of node
     * @param {string} parentId - Parent id
     * @returns {TreeNode} TreeNode
     */
    _createNode: function(nodeData, parentId) {
      nodeData = extend(
        {
          state: this.nodeDefaultState
        },
        nodeData
      );

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

      return util.map(
        childIds,
        function(childId) {
          return this.getNode(childId);
        },
        this
      );
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
      var treeHash = this.treeHash;
      var length = 0;

      forEachOwnProperties(treeHash, function() {
        length += 1;
      });

      return length;
    },

    /**
     * Get last depth
     * @returns {number} The last depth
     */
    getLastDepth: function() {
      var depths = util.map(
        this.treeHash,
        function(node) {
          return this.getDepth(node.getId());
        },
        this
      );

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
      var node = this.getNode(id);
      var depth = 0;
      var parent;

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

      return util.map(parentsNodeList, function(parentsNode) {
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
      var node = this.getNode(id);
      var parent;

      if (!node) {
        return;
      }

      parent = this.getNode(node.getParentId());

      forEachArray(
        node.getChildIds(),
        function(childId) {
          this.remove(childId, true);
        },
        this
      );

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
      var parent = this.getNode(parentId) || this.rootNode;
      var ids;

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

      if (isArray(names)) {
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
      sameParent = index === -1 && originalParentId === newParentId;

      if (nodeId === newParentId || sameParent || this.contains(nodeId, newParentId)) {
        return;
      }

      this._changeOrderOfIds(nodeId, newParentId, originalParentId, index);

      if (!isSilent) {
        this.fire('move', nodeId, originalParentId, newParentId, index);
      }
    } /* eslint-enable complexity*/,

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
      var isSameParentIds = newParentId === originalParentId;

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
      var parentId = this.getParentId(containedId);
      var isContained = false;

      while (!isContained && parentId) {
        isContained = containerId === parentId;
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

          childIds = util.map(children, function(child) {
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

      forEachOwnProperties(this.treeHash, function() {
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
      // depth-first
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
  }
);

CustomEvents.mixin(TreeModel);
module.exports = TreeModel;
