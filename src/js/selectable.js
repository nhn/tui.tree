'use strict';

var util = require('./util');


/**
 * Set the tree selectable
 * @constructor
 * @param {Tree} tree - Tree
 */
var Selectable = tui.util.defineClass(/** @lends SelectionModule.prototype */{/*eslint-disable*/
    init: function(tree) { /*eslint-enable*/
        this.tree = tree;
        this.selectedClassName = tree.classNames.selectedClass;
        this.handler = tui.util.bind(this.onSingleClick, this);
        this.tree.on('singleClick', this.handler);
    },

    /**
     * Disable this module
     */
    destroy: function() {
        util.removeClass(this.currentSelectedElement, this.selectedClassName);
        this.tree.off(this.handler);
    },

    /**
     * Custom event handler "singleClick"
     * @param {MouseEvent} event - Mouse event
     */
    onSingleClick: function(event) {
        var tree = this.tree,
            target = util.getTarget(event),
            nodeId = tree.getNodeIdFromElement(target),
            nodeElement = document.getElementById(nodeId),
            selectedClassName = this.selectedClassName;

        util.removeClass(this.currentSelectedElement, selectedClassName);
        util.addClass(nodeElement, selectedClassName);
        this.currentSelectedElement = nodeElement;

        tree.fire('select', nodeId);
    }
});

module.exports = Selectable;
