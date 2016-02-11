'use strict';

var util = require('./util');

/**
 * Set the tree selectable
 * @constructor
 * @param {Tree} tree - Tree
 */
var Selectable = tui.util.defineClass(/** @lends Selectable.prototype */{/*eslint-disable*/
    init: function(tree) { /*eslint-enable*/
        this.tree = tree;
        this.selectedClassName = tree.classNames.selectedClass;
        this.tree.on('singleClick', this.onSingleClick, this);
        this.tree.on('doubleClick', this.onSingleClick, this);
        this.tree.on('afterDraw', this.onAfterDraw, this);
    },

    /**
     * Disable this module
     */
    destroy: function() {
        var nodeElement = this.getPrevElement();
        util.removeClass(nodeElement, this.selectedClassName);
        this.tree.off(this);
    },

    /**
     * Custom event handler "singleClick"
     * @param {MouseEvent} event - Mouse event
     */
    onSingleClick: function(event) {
        var tree = this.tree,
            target = util.getTarget(event),
            nodeId = tree.getNodeIdFromElement(target),
            prevElement = this.getPrevElement(),
            nodeElement = document.getElementById(nodeId),
            selectedClassName = this.selectedClassName,
            prevNodeId = this.prevNodeId;

        if (!nodeId) {
            return;
        }

        /**
         * @api
         * @event Tree#beforeSelect
         * @example
         * tree
         *  .enableFeature('Selectable')
         *  .on('beforeSelect', function(nodeId, prevNodeId) {
         *      console.log('selected node: ' + nodeId);
         *      console.log('previous selected node: ' + prevNodeId);
         *      return false; // It cancels "select"
         *      // return true; // It fires "select"
         *  });
         */
        if (tree.invoke('beforeSelect', nodeId, prevNodeId)) {
            util.removeClass(prevElement, selectedClassName);
            util.addClass(nodeElement, selectedClassName);

            /**
             * @api
             * @event Tree#select
             * @example
             * tree
             *  .enableFeature('Selectable')
             *  .on('select', function(nodeId, prevNodeId) {
             *      console.log('selected node: ' + nodeId);
             *      console.log('previous selected node: ' + prevNodeId);
             *  });
             */
            tree.fire('select', nodeId, prevNodeId);
            this.prevNodeId = nodeId;
        }
    },

    /**
     * Get previous selected node element
     * @returns {HTMLElement} Node element
     */
    getPrevElement: function() {
        return document.getElementById(this.prevNodeId);
    },

    /**
     * Custom event handler - "afterDraw"
     */
    onAfterDraw: function() {
        var nodeElement = document.getElementById(this.prevNodeId);

        if (nodeElement) {
            util.addClass(nodeElement, this.selectedClassName);
        }
    }
});

module.exports = Selectable;
