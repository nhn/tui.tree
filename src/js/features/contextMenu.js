/**
 * @fileoverview Feature that each tree node is possible to have context-menu
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var forEachArray = require('tui-code-snippet/collection/forEachArray');
var defineClass = require('tui-code-snippet/defineClass/defineClass');
var getTarget = require('tui-code-snippet/domEvent/getTarget');
var disableTextSelection = require('tui-code-snippet/domUtil/disableTextSelection');
var enableTextSelection = require('tui-code-snippet/domUtil/enableTextSelection');

var util = require('./../util');
var TuiContextMenu = require('tui-context-menu');
var API_LIST = ['changeContextMenu'];

/**
 * Set ContextMenu feature on tree
 * @class ContextMenu
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *     @param {Array.<Object>} options.menuData - Context menu data
 *     @param {boolean} options.usageStatistics - Whether to send the hostname to GA
 * @ignore
 */
var ContextMenu = defineClass(
  /** @lends ContextMenu.prototype */ {
    static: {
      /**
       * @static
       * @memberof ContextMenu
       * @returns {Array.<string>} API list of ContextMenu
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },

    init: function(tree, options) {
      var containerId = tree.rootElement.parentNode.id;

      options = options || {};

      /**
       * Tree data
       * @type {Tree}
       */
      this.tree = tree;

      /**
       * Tree selector for context menu
       */
      this.treeSelector = '#' + containerId;

      /**
       * Id of floating layer in tree
       * @type {string}
       */
      this.flId = containerId + '-fl';

      /**
       * Floating layer element
       * @type {HTMLElement}
       */
      this.flElement = document.getElementById(this.flId);

      /**
       * Info of context menu in tree
       * @type {Object}
       */
      this.menu = this._generateContextMenu(options.usageStatistics);

      /**
       * Id of selected tree item
       * @type {string}
       */
      this.selectedNodeId = null;

      this.menu.register(this.treeSelector, util.bind(this._onSelect, this), options.menuData);

      this.tree.on('contextmenu', this._onContextMenu, this);

      this._preventTextSelection();

      this._setAPIs();
    },

    /**
     * Change current context-menu view
     * @memberof Tree.prototype
     * @requires ContextMenu
     * @param {Array.<Object>} newMenuData - New context menu data
     * @example
     * tree.changeContextMenu([
     *      {title: 'menu1'},
     *      {title: 'menu2', disable: true},
     *      {title: 'menu3', menu: [
     *          {title: 'submenu1', disable: true},
     *          {title: 'submenu2'}
     *      ]}
     * ]);
     */
    changeContextMenu: function(newMenuData) {
      this.menu.unregister(this.treeSelector);
      this.menu.register(this.treeSelector, util.bind(this._onSelect, this), newMenuData);
    },

    /**
     * Disable ContextMenu feature
     */
    destroy: function() {
      var tree = this.tree;

      this.menu.destroy();

      this._restoreTextSelection();
      this._removeFloatingLayer();

      tree.off(this);

      forEachArray(API_LIST, function(apiName) {
        delete tree[apiName];
      });
    },

    /**
     * Create floating layer for context menu
     * @private
     */
    _createFloatingLayer: function() {
      this.flElement = document.createElement('div');
      this.flElement.id = this.flId;

      document.body.appendChild(this.flElement);
    },

    /**
     * Remove floating layer for context menu
     * @private
     */
    _removeFloatingLayer: function() {
      document.body.removeChild(this.flElement);
      this.flElement = null;
    },

    /**
     * Generate context menu in tree
     * @returns {TuiContextMenu} Instance of TuiContextMenu
     * @param {boolean} usageStatistics - Let us know the hostname.
     * @private
     */
    _generateContextMenu: function(usageStatistics) {
      if (!this.flElement) {
        this._createFloatingLayer();
      }

      return new TuiContextMenu(this.flElement, {
        usageStatistics: usageStatistics
      });
    },

    /**
     * Prevent text selection on selected tree item
     * @private
     */
    _preventTextSelection: function() {
      disableTextSelection(this.tree.rootElement);
    },

    /**
     * Restore text selection on selected tree item
     * @private
     */
    _restoreTextSelection: function() {
      enableTextSelection(this.tree.rootElement);
    },

    /**
     * Event handler on tree item
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    _onContextMenu: function(e) {
      var target = getTarget(e);

      this.selectedNodeId = this.tree.getNodeIdFromElement(target);

      /**
       * @event Tree#beforeOpenContextMenu
       * @type {object} evt - Event data
       * @property {string} nodeId - Current selected node id
       * @example
       * tree.on('beforeOpenContextMenu', function(evt) {
       *     console.log('nodeId: ' + evt.nodeId);
       * });
       */
      this.tree.fire('beforeOpenContextMenu', {
        nodeId: this.selectedNodeId
      });
    },

    /**
     * Event handler on context menu
     * @param {MouseEvent} e - Mouse event
     * @param {string} command - Options value of selected context menu ("title"|"command")
     * @private
     */
    _onSelect: function(e, command) {
      /**
       * @event Tree#selectContextMenu
       * @type {object} evt - Event data
       * @property {string} command - Command type
       * @property {string} nodeId - Node id
       * @example
       * tree.on('selectContextMenu', function(evt) {
       *     var command = treeEvent.command; // key of context menu's data
       *     var nodeId = treeEvent.nodeId;
       *
       *     console.log(evt.command, evt.nodeId);
       * });
       */
      this.tree.fire('selectContextMenu', {
        command: command,
        nodeId: this.selectedNodeId
      });
    },

    /**
     * Set API of ContextMenu feature
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
    }
  }
);

module.exports = ContextMenu;
