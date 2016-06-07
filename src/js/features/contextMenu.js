'use strict';
var util = require('./../util');

var API_LIST = [
    'changeContextMenu'
];
var TuiContextMenu = tui && tui.component && tui.component.ContextMenu;
var styleKeys = ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect'];
var enableProp = util.testProp(styleKeys);
var bind = tui.util.bind;

/**
 * Set ContextMenu feature on tree
 * @class ContextMenu
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *     @param {Array.<Object>} options.menuData - Context menu data
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
        options = options || {};

        /**
         * Tree data
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Tree selector for context menu
         */
        this.treeSelector = '#' + this.tree.rootElement.id;

        /**
         * Id of floating layer in tree
         * @type {string}
         */
        this.flId = this.tree.rootElement.id + '-fl';

        /**
         * Info of context menu in tree
         * @type {Object}
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

        this.menu.register(this.treeSelector, bind(this._onSelect, this),
                            options.menuData || {});

        this.tree.on('contextmenu', this._onMouseClick, this);

        this._preventTextSelection();

        this._setAPIs();
    },

    /**
     * Change ContextMenu
     * @param {Array.<Object>} newMenuData - New context menu data
     * @api
     */
    changeContextMenu: function(newMenuData) {
        this.menu.unregister(this.treeSelector);
        this.menu.register(this.treeSelector, bind(this._onSelect, this), newMenuData);
    },

    /**
     * Disable ContextMenu feature
     * @api
     */
    destroy: function() {
        this.menu.destroy();
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
     * Event handler on tree item
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    _onMouseClick: function(e) {
        var target = util.getTarget(e);

        this.selectedNodeId = this.tree.getNodeIdFromElement(target);

        /**
         * @api
         * @event Tree#beforeOpenContextMenu
         * @param {string} nodeId
         * @example
         * tree.on('beforeOpenContextMenu', function(nodeId) {
         * 		console.log('nodeId: ' + nodeId);
         * });
         */
        this.tree.fire('beforeOpenContextMenu', this.selectedNodeId);
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
     * Set API of ContextMenu feature
     * @private
     */
    _setAPIs: function() {
        var tree = this.tree;

        tui.util.forEach(API_LIST, function(apiName) {
            tree[apiName] = bind(this[apiName], this);
        }, this);
    }
});

module.exports = ContextMenu;
