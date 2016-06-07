'use strict';
var util = require('./../util');

var defaultOptions = {
    useHelper: true,
    helperPos: {
        y: 2,
        x: 5
    },
    autoOpenDelay: 1500,
    isSortable: false,
    hoverClassName: 'tui-tree-hover',
    lineClassName: 'tui-tree-line',
    lineBoundary: {
        top: 2,
        bottom: 2
    }
};
var rejectedTagNames = [
    'INPUT',
    'BUTTON',
    'UL'
];
var selectKey = util.testProp(
    ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']
);
var inArray = tui.util.inArray;
var forEach = tui.util.forEach;
var API_LIST = [];

/**
 * Set the tree draggable
 * @class Draggable
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {boolean} options.useHelper - Using helper flag
 *  @param {{x: number, y:number}} options.helperPos - Helper position
 *  @param {Array.<string>} options.rejectedTagNames - No draggable tag names
 *  @param {Array.<string>} options.rejectedClassNames - No draggable class names
 *  @param {number} options.autoOpenDelay - Delay time while dragging to be opened
 *  @param {boolean} options.isSortable - Flag of whether using sortable dragging
 *  @param {string} options.hoverClassName - Class name for hovered node
 *  @param {string} options.lineClassName - Class name for moving position line
 *  @param {{top: number, bottom: number}} options.lineBoundary - Boundary value for visible moving line
 */
var Draggable = tui.util.defineClass(/** @lends Draggable.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf Draggable
         * @returns {Array.<string>} API list of Draggable
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },

    init: function(tree, options) { /*eslint-enable*/
        options = tui.util.extend({}, defaultOptions, options);

        this.tree = tree;
        this.helperElement = null;
        this.userSelectPropertyKey = null;
        this.userSelectPropertyValue = null;
        this.currentNodeId = null;
        this.hoveredElement = null;
        this.movingLineType = null;
        this.timer = null;

        this.setMembers(options);

        this.initHelper();

        if (this.isSortable) {
            this.initMovingLine();
        }

        this.attachMousedown();
    },

    /**
     * Set members of this module
     * @param {Object} options - input options
     * @private
     */
    setMembers: function(options) {
        forEach(options, function(value, key) {
            if (!(key === 'rejectedTagNames' || key === 'rejectedClassNames')) {
                this[key] = value;
            }
        }, this);

        this.rejectedTagNames = rejectedTagNames.concat(options.rejectedTagNames);
        this.rejectedClassNames = [].concat(options.rejectedClassNames);
    },

    /**
     * Init helper element
     * @private
     */
    initHelper: function() {
        var helperElement = document.createElement('span');
        var helperStyle = helperElement.style;

        helperStyle.position = 'absolute';
        helperStyle.display = 'none';

        this.tree.rootElement.parentNode.appendChild(helperElement);

        this.helperElement = helperElement;
    },

    /**
     * Init moving line element
     * @private
     */
    initMovingLine: function() {
        var lineElement = document.createElement('div');
        var lineStyle = lineElement.style;

        lineStyle.position = 'absolute';
        lineStyle.visibility = 'hidden';

        lineElement.className = this.lineClassName;

        this.tree.rootElement.parentNode.appendChild(lineElement);

        this.lineElement = lineElement;
    },

    /**
     * Attach mouse down event
     * @private
     */
    attachMousedown: function() {
        this.preventTextSelection();
        this.tree.on('mousedown', this.onMousedown, this);
    },

    /**
     * Prevent text-selection
     * @private
     */
    preventTextSelection: function() {
        var style = this.tree.rootElement.style;

        util.addEventListener(this.tree.rootElement, 'selectstart', util.preventDefault);

        this.userSelectPropertyKey = selectKey;
        this.userSelectPropertyValue = style[selectKey];

        style[selectKey] = 'none';
    },

    /**
     * Return whether the target element is in rejectedTagNames or in rejectedClassNames
     * @param {HTMLElement} target - Target element
     * @returns {boolean} Whether the target is not draggable or draggable
     * @private
     */
    isNotDraggable: function(target) {
        var tagName = target.tagName.toUpperCase();
        var classNames = util.getClass(target).split(/\s+/);
        var result;

        if (inArray(tagName, this.rejectedTagNames) !== -1) {
            return true;
        }

        forEach(classNames, function(className) {
            result = inArray(className, this.rejectedClassNames) !== -1;

            return !result;
        }, this);

        return result;
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    onMousedown: function(event) {
        var tree = this.tree;
        var target = util.getTarget(event);
        var nodeId;

        if (util.isRightButton(event) || this.isNotDraggable(target)) {
            return;
        }

        util.preventDefault(event);

        target = util.getTarget(event);
        nodeId = tree.getNodeIdFromElement(target);

        this.currentNodeId = nodeId;

        if (this.useHelper) {
            this.setHelper(target.innerText || target.textContent);
        }

        tree.on({
            mousemove: this.onMousemove,
            mouseup: this.onMouseup
        }, this);
    },

    /**
     * Event handler - mousemove
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    onMousemove: function(event) {
        var mousePos = util.getMousePos(event);
        var target = util.getTarget(event);
        var nodeId = this.tree.getNodeIdFromElement(target);

        if (!this.useHelper) {
            return;
        }

        this.changeHelperPosition(mousePos);

        if (nodeId) {
            this.applyMoveAction(nodeId, mousePos);
        }
    },

    /**
     * Event handler - mouseup
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    onMouseup: function(event) {
        var tree = this.tree;
        var target = util.getTarget(event);
        var nodeId = tree.getNodeIdFromElement(target);
        var index = -1;

        if (nodeId && this.isSortable && this.movingLineType) {
            index = this.getIndexForInserting(nodeId);
            nodeId = tree.getParentId(nodeId);
        }

        /**
         * @api
         * @event Tree#beforeMove
         * @param {string} nodeId - Current dragging node id
         * @param {string} parentId - New parent id
         * @example
         * tree
         * 	.enableFeature('Draggable')
         * 	.on('beforeMove', function(nodeId, parentId) {
         *  	console.log('dragging node: ' + nodeId);
         *  	console.log('parent node: ' + parentId');
         *
         *  	return false; // Cancel "move" event
         *  	// return true; // Fire "move" event
         * });
         */
        if (tree.invoke('beforeMove', this.currentNodeId, nodeId)) {
            tree.move(this.currentNodeId, nodeId, index);
        }

        this.reset();
    },

    /**
     * Restore text-selection
     * @private
     */
    restoreTextSelection: function() {
        util.removeEventListener(this.tree.rootElement, 'selectstart', util.preventDefault);

        if (this.userSelectPropertyKey) {
            this.tree.rootElement.style[this.userSelectPropertyKey] = this.userSelectPropertyValue;
        }
    },

    /**
     * Set helper contents
     * @param {string} text - Helper contents
     * @private
     */
    setHelper: function(text) {
        this.helperElement.innerHTML = text;
    },

    /**
     * Detach mousedown event
     * @private
     */
    detachMousedown: function() {
        this.tree.off(this);
    },

    /**
     * Reset properties and remove event
     * @private
     */
    reset: function() {
        if (this.isSortable) {
            this.lineElement.style.visibility = 'hidden';
        }

        this.helperElement.style.display = 'none';

        this.currentNodeId = null;
        this.movingLineType = null;

        this.tree.off(this, 'mousemove');
        this.tree.off(this, 'mouseup');
    },

    /**
     * Disable this module
     */
    destroy: function() {
        this.restoreTextSelection();
        this.detachMousedown();
    },

    /**
     * Change helper element position
     * @param {object} mousePos - Current mouse position
     * @private
     */
    changeHelperPosition: function(mousePos) {
        var helperEl = this.helperElement;
        var pos = this.tree.rootElement.getBoundingClientRect();

        helperEl.style.top = mousePos.y - pos.top + this.helperPos.y + 'px';
        helperEl.style.left = mousePos.x - pos.left + this.helperPos.x + 'px';
        helperEl.style.display = '';
    },

    /**
     * Apply move action that are delay effect and sortable moving node
     * @param {strig} nodeId - Selected tree node id
     * @param {object} mousePos - Current mouse position
     * @private
     */
    applyMoveAction: function(nodeId, mousePos) {
        var currentElement = document.getElementById(nodeId);
        var targetPos = currentElement.getBoundingClientRect();
        var hasClass = util.hasClass(currentElement, this.hoverClassName);
        var isContain = this.isContain(targetPos, mousePos);
        var boundaryType;

        if (!this.hoveredElement && isContain) {
            this.hoveredElement = currentElement;
            this.hover(nodeId);
        } else if (!hasClass || (hasClass && !isContain)) {
            this.unhover();
        }

        if (this.isSortable) {
            boundaryType = this.getBoundaryType(targetPos, mousePos);
            this.drawBoundaryLine(targetPos, boundaryType);
        }
    },

    /**
     * Act to hover on tree item
     * @param {string} nodeId - Tree node id
     * @private
     */
    hover: function(nodeId) {
        var tree = this.tree;

        util.addClass(this.hoveredElement, this.hoverClassName);

        if (tree.isLeaf(nodeId)) {
            return;
        }

        this.timer = setTimeout(function() {
            tree.open(nodeId);
        }, this.autoOpenDelay);
    },

    /**
     * Act to unhover on tree item
     * @private
     */
    unhover: function() {
        clearTimeout(this.timer);

        util.removeClass(this.hoveredElement, this.hoverClassName);

        this.hoveredElement = null;
        this.timer = null;
    },

    /**
     * Check contained state of current target
     * @param {object} targetPos - Position of tree item
     * @param {object} mousePos - Position of moved mouse
     * @returns {boolean} Contained state
     * @private
     */
    isContain: function(targetPos, mousePos) {
        var top = targetPos.top;
        var bottom = targetPos.bottom;

        if (this.isSortable) {
            top += this.lineBoundary.top;
            bottom -= this.lineBoundary.bottom;
        }

        if (targetPos.left < mousePos.x &&
            targetPos.right > mousePos.x &&
            top < mousePos.y && bottom > mousePos.y) {
            return true;
        }

        return false;
    },

    /**
     * Get boundary type by mouse position
     * @param {object} targetPos - Position of tree item
     * @param {object} mousePos - Position of moved mouse
     * @returns {string} Position type in boundary
     * @private
     */
    getBoundaryType: function(targetPos, mousePos) {
        var type;

        if (mousePos.y < targetPos.top + this.lineBoundary.top) {
            type = 'top';
        } else if (mousePos.y > targetPos.bottom - this.lineBoundary.bottom) {
            type = 'bottom';
        }

        return type;
    },

    /**
     * Draw boundary line on tree
     * @param {object} targetPos - Position of tree item
     * @param {string} boundaryType - Position type in boundary
     * @private
     */
    drawBoundaryLine: function(targetPos, boundaryType) {
        var style = this.lineElement.style;
        var lineHeight;
        var scrollTop;

        if (boundaryType) {
            scrollTop = this.tree.rootElement.parentNode.scrollTop + util.getWindowScrollTop();
            lineHeight = Math.round(this.lineElement.offsetHeight / 2);

            style.top = Math.round(targetPos[boundaryType]) - lineHeight + scrollTop + 'px';
            style.visibility = 'visible';
            this.movingLineType = boundaryType;
        } else {
            style.visibility = 'hidden';
            this.movingLineType = null;
        }
    },

    /**
     * Get index for inserting
     * @param {string} nodeId - Current selected helper node id
     * @returns {number} Index number
     * @private
     */
    getIndexForInserting: function(nodeId) {
        var index = this.tree.getNodeIndex(nodeId);

        if (this.movingLineType === 'bottom') {
            index += 1;
        }

        return index;
    }
});

module.exports = Draggable;
