'use strict';
var util = require('./../util');

var API_LIST = [];
var TuiContextMenu = tui && tui.component && tui.component.ContextMenu;
var styleKeys = ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect'];
var enableProp = util.testProp(styleKeys);

/**
 * Set context-menu feature on tree
 * @class ContextMenu
 * @constructor
 * @param {Tree} tree - Tree
 * @param {object} options - Options
 *     @param {Array.<object>} options.menuData - Context menu data
 */
var ContextMenu = tui.util.defineClass(/** @lends ContextMenu.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf ContextMenu
         * @returns {Array.<string>} API list of ContextMenu
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },
    init: function(tree, options) { /*eslint-enable*/
        /**
         * Tree data
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Id of floating layer in tree
         * @type {string}
         */
        this.flId = this.tree.rootElement.id + '-fl';

        /**
         * Info of context menu in tree
         * @type {object}
         */
        this.menu = this._generateContextMenu();

        /**
         * Floating layer element
         * @type {HTMLElement}
         */
        this.flElement = document.getElementById(this.flId);

        /**
         * Id of selected tree item
         * @type {string}
         */
        this.selectedNodeId = null;

        this._preventTextSelection();

        this._attachEvent(options.menuData || {});
    },

    /**
     * Disable context-menu feature
     */
    destroy: function() {
        var treeSelector = this._getTreeSelector();

        this.menu.unregister(treeSelector);
        this.tree.off(this);

        this._restoreTextSelection();
        this._removeFloatingLayer();
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
     * @private
     */
    _generateContextMenu: function() {
        if (!this.flElement) {
            this._createFloatingLayer();
        }

        return new TuiContextMenu(this.flElement);
    },

    /**
     * Prevent text selection on selected tree item
     * @private
     */
    _preventTextSelection: function() {
        if (enableProp) {
            this.tree.rootElement.style[enableProp] = 'none';
        }
    },

    /**
     * Restore text selection on selected tree item
     * @private
     */
    _restoreTextSelection: function() {
        if (enableProp) {
            this.tree.rootElement.style[enableProp] = '';
        }
    },

    /**
     * Get selector of tree
     * @returns {string} Selector based on id of root tree element
     * @private
     */
    _getTreeSelector: function() {
        return '#' + this.tree.rootElement.id;
    },

    /**
     * Attach event on tree
     * @param {Array.<object>} menuData - Context menu data
     * @private
     */
    _attachEvent: function(menuData) {
        var treeSelector = this._getTreeSelector();

        this.menu.register(treeSelector, tui.util.bind(this._onSelect, this), menuData);
        this.tree.on('contextmenu', this._onMouseClick, this);
    },

    /**
     * Event handler on context menu
     * @param {MouseEvent} e - Mouse event
     * @param {string} cmd - Options value of selected context menu ("title"|"command")
     * @private
     */
    _onSelect: function(e, cmd) {
        /**
         * @api
         * @event Tree#selectContextMenu
         * @param {{cmd: string, nodeId: string}} treeEvent - Tree event
         * @example
         * tree.on('selectContextMenu', function(treeEvent) {
         *     var cmd = treeEvent.cmd,
         *     var nodeId = treeEvent.nodeId;
         *
         *     console.log(cmd, nodeId);
         * });
         */
        this.tree.fire('selectContextMenu', {
            cmd: cmd,
            nodeId: this.selectedNodeId
        });
    },

    /**
     * Event handler on tree item
     * @param {MouseEvent} e - Mouse event
     */
    _onMouseClick: function(e) {
        var target = util.getTarget(e);

        this.selectedNodeId = this.tree.getNodeIdFromElement(target);
    }
});

module.exports = ContextMenu;
