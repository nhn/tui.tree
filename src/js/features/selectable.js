/**
 * @fileoverview Feature that each tree node is possible to select as click
 * @author NHN Ent. FE dev Lab <dl_javascript@nhnent.com>
 */
'use strict';

var util = require('./../util');

var API_LIST = [
        'select',
        'getSelectedNodeId',
        'deselect'
    ],
    defaults = {
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
var Selectable = tui.util.defineClass(/** @lends Selectable.prototype */{/*eslint-disable*/
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
    init: function(tree, options) { /*eslint-enable*/
        options = tui.util.extend({}, defaults, options);

        this.tree = tree;
        this.selectedClassName = options.selectedClassName;
        this.selectedNodeId = null;

        tree.on({
            singleClick: this.onSingleClick,
            afterDraw: this.onAfterDraw
        }, this);
        this._setAPIs();
    },

    /**
     * Set apis of selectable tree
     * @private
     */
    _setAPIs: function() {
        var tree = this.tree,
            bind = tui.util.bind;

        tui.util.forEach(API_LIST, function(apiName) {
            tree[apiName] = bind(this[apiName], this);
        }, this);
    },

    /**
     * Disable this module
     */
    destroy: function() {
        var tree = this.tree,
            nodeElement = this.getPrevElement();

        util.removeClass(nodeElement, this.selectedClassName);
        tree.off(this);
        tui.util.forEach(API_LIST, function(apiName) {
            delete tree[apiName];
        });
    },

    /**
     * Custom event handler "singleClick"
     * @param {MouseEvent} event - Mouse event
     */
    onSingleClick: function(event) {
        var target = util.getTarget(event),
            nodeId = this.tree.getNodeIdFromElement(target);

        this.select(nodeId, target);
    },

    /* eslint-disable valid-jsdoc */
    /* Ignore "target" parameter annotation for API page
       "tree.select(nodeId)"
     */

    /**
     * Select node if the feature-"Selectable" is enabled.
     * @memberof Tree.prototype
     * @requires Selectable
     * @param {string} nodeId - Node id
     * @example
     * tree.select('tui-tree-node-3');
     */
    select: function(nodeId, target) {/* eslint-enable valid-jsdoc */
        var tree, prevElement, nodeElement,
            selectedClassName, prevNodeId;

        if (!nodeId) {
            return;
        }

        tree = this.tree;
        prevElement = this.getPrevElement();
        nodeElement = document.getElementById(nodeId);
        selectedClassName = this.selectedClassName;
        prevNodeId = this.selectedNodeId;

        /**
         * @event Tree#beforeSelect
         * @param {{nodeId: string, prevNodeId: string, target: HTMLElement|undefined}} evt - Event data
         *     @param {string} evt.nodeId - Selected node id
         *     @param {string} evt.prevNodeId - Previous selected node id
         *     @param {HTMLElement|undefined} evt.target - Target element
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
        if (tree.invoke('beforeSelect', {
            nodeId: nodeId,
            prevNodeId: prevNodeId,
            target: target
        })) {
            util.removeClass(prevElement, selectedClassName);
            util.addClass(nodeElement, selectedClassName);

            /**
             * @event Tree#select
             * @param {{nodeId: string, prevNodeId: string, target: HTMLElement|undefined}} evt - Event data
             *     @param {string} evt.nodeId - Selected node id
             *     @param {string} evt.prevNodeId - Previous selected node id
             *     @param {HTMLElement|undefined} evt.target - Target element
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
            this.selectedNodeId = nodeId;
        }
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

        util.removeClass(nodeElement, this.selectedClassName);
        this.selectedNodeId = null;

        /**
         * @event Tree#deselect
         * @param {{nodeId: string}} evt - Event data
         *     @param {string} evt.nodeId - Deselected node id
         * @example
         * tree
         *  .enableFeature('Selectable')
         *  .on('deselect', function(evt) {
         *      console.log('deselected node: ' + evt.nodeId);
         *  });
         */
        tree.fire('deselect', {nodeId: nodeId});
    },

    /**
     * Custom event handler - "afterDraw"
     */
    onAfterDraw: function() {
        var nodeElement = this.getPrevElement();

        if (nodeElement) {
            util.addClass(nodeElement, this.selectedClassName);
        }
    }
});

module.exports = Selectable;
