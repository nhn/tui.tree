/**
 * @fileoverview Feature that each tree node is possible to select as click
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var forEachArray = require('tui-code-snippet/collection/forEachArray');
var defineClass = require('tui-code-snippet/defineClass/defineClass');
var getTarget = require('tui-code-snippet/domEvent/getTarget');
var addClass = require('tui-code-snippet/domUtil/addClass');
var removeClass = require('tui-code-snippet/domUtil/removeClass');
var extend = require('tui-code-snippet/object/extend');
var util = require('./../util');

var API_LIST = ['select', 'getSelectedNodeId', 'deselect'];
var defaults = {
  selectedClassName: 'tui-tree-selected'
};

/**
 * Set the tree selectable
 * @class Selectable
 * @param {Tree} tree - Tree
 * @param {Object} options
 *  @param {string} options.selectedClassName - Classname for selected node.
 * @ignore
 */
var Selectable = defineClass(
  /** @lends Selectable.prototype */ {
    static: {
      /**
       * @static
       * @memberof Selectable
       * @returns {Array.<string>} API list of Selectable
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },
    init: function(tree, options) {
      options = extend({}, defaults, options);

      this.tree = tree;
      this.selectedClassName = options.selectedClassName;
      this.selectedNodeId = null;

      tree.on(
        {
          singleClick: this.onSingleClick,
          afterDraw: this.onAfterDraw
        },
        this
      );
      this._setAPIs();
    },

    /**
     * Set apis of selectable tree
     * @private
     */
    _setAPIs: function() {
      var tree = this.tree;

      forEachArray(
        API_LIST,
        function(apiName) {
          tree[apiName] = util.bind(this[apiName], this);
        },
        this
      );
    },

    /**
     * Disable this module
     */
    destroy: function() {
      var tree = this.tree;
      var nodeElement = this.getPrevElement();

      if (nodeElement) {
        removeClass(nodeElement, this.selectedClassName);
      }
      tree.off(this);
      forEachArray(API_LIST, function(apiName) {
        delete tree[apiName];
      });
    },

    /**
     * Custom event handler "singleClick"
     * @param {MouseEvent} event - Mouse event
     */
    onSingleClick: function(event) {
      var target = getTarget(event);
      var nodeId = this.tree.getNodeIdFromElement(target);

      this._select(nodeId, target);
    },

    /**
     * Select node if the feature-"Selectable" is enabled.
     * @memberof Tree.prototype
     * @requires Selectable
     * @param {string} nodeId - Node id
     * @param {object} [target] - target
     * @private
     */
    _select: function(nodeId, target) {
      var tree, root, prevElement, nodeElement, selectedClassName, prevNodeId, invokeResult;

      if (!nodeId) {
        return;
      }

      tree = this.tree;
      root = tree.rootElement;
      selectedClassName = this.selectedClassName;
      prevNodeId = this.selectedNodeId;

      /**
       * @event Tree#beforeSelect
       * @type {object} evt - Event data
       * @property {string} nodeId - Selected node id
       * @property {string} prevNodeId - Previous selected node id
       * @property {HTMLElement|undefined} target - Target element
       * @example
       * tree
       *  .enableFeature('Selectable')
       *  .on('beforeSelect', function(evt) {
       *      console.log('selected node: ' + evt.nodeId);
       *      console.log('previous selected node: ' + evt.prevNodeId);
       *      console.log('target element: ' + evt.target);
       *      return false; // It cancels "select"
       *      // return true; // It fires "select"
       *  });
       */
      invokeResult = tree.invoke('beforeSelect', {
        nodeId: nodeId,
        prevNodeId: prevNodeId,
        target: target
      });

      prevElement = this.getPrevElement();
      nodeElement = root.querySelector('#' + nodeId);

      if (invokeResult) {
        if (prevElement) {
          removeClass(prevElement, selectedClassName);
        }
        addClass(nodeElement, selectedClassName);
        this.selectedNodeId = nodeId;

        /**
         * @event Tree#select
         * @type {object} evt - Event data
         * @property {string} nodeId - Selected node id
         * @property {string} prevNodeId - Previous selected node id
         * @property {HTMLElement|undefined} target - Target element
         * @example
         * tree
         *  .enableFeature('Selectable')
         *  .on('select', function(evt) {
         *      console.log('selected node: ' + evt.nodeId);
         *      console.log('previous selected node: ' + evt.prevNodeId);
         *      console.log('target element: ' + evt.target);
         *  });
         */
        tree.fire('select', {
          nodeId: nodeId,
          prevNodeId: prevNodeId,
          target: target
        });
      }
    },

    /**
     * Select node if the feature-"Selectable" is enabled.
     * @memberof Tree.prototype
     * @requires Selectable
     * @param {string} nodeId - Node id
     * @example
     * tree.select('tui-tree-node-3');
     */
    select: function(nodeId) {
      this._select(nodeId);
    },

    /**
     * Get previous selected node element
     * @returns {HTMLElement} Node element
     */
    getPrevElement: function() {
      return document.getElementById(this.selectedNodeId);
    },

    /**
     * Get selected node id
     * @memberof Tree.prototype
     * @returns {string} selected node id
     */
    getSelectedNodeId: function() {
      return this.selectedNodeId;
    },

    /**
     * Deselect node by id
     * @memberof Tree.prototype
     * @requires Selectable
     * @param {string} nodeId - Node id
     * @example
     * tree.deselect('tui-tree-node-3');
     */
    deselect: function() {
      var nodeId = this.selectedNodeId;
      var nodeElement = document.getElementById(nodeId);
      var tree = this.tree;

      if (!nodeElement) {
        return;
      }

      removeClass(nodeElement, this.selectedClassName);
      this.selectedNodeId = null;

      /**
       * @event Tree#deselect
       * @type {object} evt - Event data
       * @property {string} nodeId - Deselected node id
       * @example
       * tree
       *  .enableFeature('Selectable')
       *  .on('deselect', function(evt) {
       *      console.log('deselected node: ' + evt.nodeId);
       *  });
       */
      tree.fire('deselect', { nodeId: nodeId });
    },

    /**
     * Custom event handler - "afterDraw"
     */
    onAfterDraw: function() {
      var nodeElement = this.getPrevElement();

      if (nodeElement) {
        addClass(nodeElement, this.selectedClassName);
      }
    }
  }
);

module.exports = Selectable;
