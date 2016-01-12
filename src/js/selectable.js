'use strict';

var util = require('./util');

module.exports = {
    tree: null,

    set: function(tree) {
        this.tree = tree;
        this.selectedClassName = tree.classNames.selectedClass;
        this.handler = tui.util.bind(this.onSingleClick, this);
        this.tree.on('singleClick', this.handler);
    },

    unset: function() {
        util.removeClass(this.currentSelectedElement, this.selectedClassName);
        this.tree.off(this.handler);
    },

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
};