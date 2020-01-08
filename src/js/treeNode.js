/**
 * @fileoverview Control each tree node's data
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var inArray = require('tui-code-snippet/array/inArray');
var forEachArray = require('tui-code-snippet/collection/forEachArray');
var forEachOwnProperties = require('tui-code-snippet/collection/forEachOwnProperties');
var defineClass = require('tui-code-snippet/defineClass/defineClass');
var extend = require('tui-code-snippet/object/extend');
var isFalsy = require('tui-code-snippet/type/isFalsy');

var states = require('./consts/states').node;
var util = require('./util');

var lastIndex = 0;
var getNextIndex = function() {
  var index = lastIndex;
  lastIndex += 1;

  return index;
};
var RESERVED_PROPERTIES = {
  id: '',
  state: 'setState',
  children: ''
};

/**
 * TreeNode
 * @Class TreeNode
 * @param {Object} nodeData - Node data
 * @param {string} [parentId] - Parent node id
 * @ignore
 */
var TreeNode = defineClass(
  /** @lends TreeNode.prototype */ {
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
    init: function(nodeData, parentId) {
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
      forEachOwnProperties(
        RESERVED_PROPERTIES,
        function(setter, name) {
          var value = data[name];

          if (value && setter) {
            this[setter](value);
          }
          delete data[name];
        },
        this
      );

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
      state = String(state);
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
     * @returns {string} Node id
     */
    getId: function() {
      return this._id;
    },

    /**
     * Get parent id
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

      if (inArray(childIds, id) === -1) {
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
      return extend({}, this._data);
    },

    /**
     * Set data
     * @param {Object} data - Data for adding
     */
    setData: function(data) {
      data = this._setReservedProperties(data);
      extend(this._data, data);
    },

    /**
     * Remove data
     * @param {...string} names - Names of data
     */
    removeData: function() {
      forEachArray(
        arguments,
        function(name) {
          delete this._data[name];
        },
        this
      );
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
      return !this._childIds.length && !this.getData('hasChild');
    },

    /**
     * Return whether this node is root.
     * @returns {boolean} Node is root or not.
     */
    isRoot: function() {
      return isFalsy(this._parentId);
    },

    /**
     * Get index of child
     * @param {string} id - Node id
     * @returns {number} Index of child in children list
     */
    getChildIndex: function(id) {
      return inArray(id, this._childIds);
    },

    /**
     * Insert child id
     * @param {string} id - Child node id
     * @param {number} index - Index number of insert position
     */
    insertChildId: function(id, index) {
      var childIds = this._childIds;

      if (inArray(id, childIds) === -1) {
        childIds.splice(index, 0, id);
      }
    },

    /**
     * Move child id
     * @param {string} id - Child node id
     * @param {number} index - Index number of insert position
     */
    moveChildId: function(id, index) {
      var childIds = this._childIds;
      var originIdx = this.getChildIndex(id);

      if (inArray(id, childIds) !== -1) {
        if (originIdx < index) {
          index -= 1;
        }

        childIds.splice(index, 0, childIds.splice(originIdx, 1)[0]);
      }
    }
  }
);
module.exports = TreeNode;
