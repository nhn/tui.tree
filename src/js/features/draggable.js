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
 *     @param {boolean} options.useHelper - Using helper flag
 *     @param {{x: number, y:number}} options.helperPos - Helper position
 *     @param {Array.<string>} options.rejectedTagNames - No draggable tag names
 *     @param {Array.<string>} options.rejectedClassNames - No draggable class names
 *     @param {number} options.autoOpenDelay - Delay time while dragging to be opened
 *     @param {boolean} options.isSortable - Flag of whether using sortable dragging
 *     @param {string} options.hoverClassName - Class name for hovered node
 *     @param {string} options.lineClassName - Class name for moving position line
 *     @param {{top: number, bottom: number}} options.lineBoundary - Boundary value for visible moving line
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

        /**
         * Tree data
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Drag helper element
         * @type {HTMLElement}
         */
        this.helperElement = null;

        /**
         * Selectable element's property
         * @type {string}
         */
        this.userSelectPropertyKey = null;

        /**
         * Selectable element's property value
         * @type {string}
         */
        this.userSelectPropertyValue = null;

        /**
         * Dragging element's node id
         * @type {string}
         */
        this.currentNodeId = null;

        /**
         * Current mouse overed element
         * @type {HTMLElement}
         */
        this.hoveredElement = null;

        /**
         * Moving line type ("top" or "bottom")
         * @type {string}
         */
        this.movingLineType = null;

        /**
         * Invoking time for setTimeout()
         * @type {number}
         */
        this.timer = null;

        /**
         * Tag list for rejecting to drag
         * @param {Array.<string>}
         */
        this.rejectedTagNames = rejectedTagNames.concat(options.rejectedTagNames);

        /**
         * Class name list for rejecting to drag
         * @param {Array.<string>}
         */
        this.rejectedClassNames = [].concat(options.rejectedClassNames);

        /**
         * Using helper flag
         * @type {boolean}
         */
        this.useHelper = options.useHelper;

        /**
         * Helper position
         * @type {Object}
         */
        this.helperPos = options.helperPos;

        /**
         * Delay time while dragging to be opened
         * @type {number}
         */
        this.autoOpenDelay = options.autoOpenDelay;

        /**
         * Flag of whether using sortable dragging
         * @type {boolean}
         */
        this.isSortable = options.isSortable;

        /**
         * Class name for mouse overed node
         * @type {string}
         */
        this.hoverClassName = options.hoverClassName;

        /**
         * Class name for moving position line
         * @type {string}
         */
        this.lineClassName = options.lineClassName;

        /**
         * Boundary value for visible moving line
         * @type {Object}
         */
        this.lineBoundary = options.lineBoundary;

        this._initHelper();

        if (this.isSortable) {
            this._initMovingLine();
        }

        this._attachMousedown();
    },

    /**
     * Disable this module
     */
    destroy: function() {
        this._restoreTextSelection();
        this._detachMousedown();
    },

    /**
     * Change helper element position
     * @param {object} mousePos - Current mouse position
     * @private
     */
    _changeHelperPosition: function(mousePos) {
        var helperStyle = this.helperElement.style;
        var pos = this.tree.rootElement.getBoundingClientRect();

        helperStyle.top = (mousePos.y - pos.top + this.helperPos.y) + 'px';
        helperStyle.left = (mousePos.x - pos.left + this.helperPos.x) + 'px';
        helperStyle.display = '';
    },

    /**
     * Init helper element
     * @private
     */
    _initHelper: function() {
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
    _initMovingLine: function() {
        var lineElement = document.createElement('div');
        var lineStyle = lineElement.style;

        lineStyle.position = 'absolute';
        lineStyle.visibility = 'hidden';

        lineElement.className = this.lineClassName;

        this.tree.rootElement.parentNode.appendChild(lineElement);

        this.lineElement = lineElement;
    },

    /**
     * Set helper contents
     * @param {string} text - Helper contents
     * @private
     */
    _setHelper: function(text) {
        this.helperElement.innerHTML = text;
    },

    /**
     * Attach mouse down event
     * @private
     */
    _attachMousedown: function() {
        this._preventTextSelection();
        this.tree.on('mousedown', this._onMousedown, this);
    },

    /**
     * Detach mousedown event
     * @private
     */
    _detachMousedown: function() {
        this.tree.off(this);
    },

    /**
     * Prevent text-selection
     * @private
     */
    _preventTextSelection: function() {
        var style = this.tree.rootElement.style;

        util.addEventListener(this.tree.rootElement, 'selectstart', util.preventDefault);

        this.userSelectPropertyKey = selectKey;
        this.userSelectPropertyValue = style[selectKey];

        style[selectKey] = 'none';
    },

    /**
     * Restore text-selection
     * @private
     */
    _restoreTextSelection: function() {
        util.removeEventListener(this.tree.rootElement, 'selectstart', util.preventDefault);

        if (this.userSelectPropertyKey) {
            this.tree.rootElement.style[this.userSelectPropertyKey] = this.userSelectPropertyValue;
        }
    },

    /**
     * Return whether the target element is in rejectedTagNames or in rejectedClassNames
     * @param {HTMLElement} target - Target element
     * @returns {boolean} Whether the target is not draggable or draggable
     * @private
     */
    _isNotDraggable: function(target) {
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
    _onMousedown: function(event) {
        var tree = this.tree;
        var target = util.getTarget(event);

        if (util.isRightButton(event) || this._isNotDraggable(target)) {
            return;
        }

        util.preventDefault(event);

        this.currentNodeId = tree.getNodeIdFromElement(target);

        if (this.useHelper) {
            this._setHelper(target.innerText || target.textContent);
        }

        tree.on({
            mousemove: this._onMousemove,
            mouseup: this._onMouseup
        }, this);
    },

    /**
     * Event handler - mousemove
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMousemove: function(event) {
        var mousePos = util.getMousePos(event);
        var target = util.getTarget(event);
        var nodeId;

        if (!this.useHelper) {
            return;
        }

        this._changeHelperPosition(mousePos);

        nodeId = this.tree.getNodeIdFromElement(target);

        if (nodeId) {
            this._applyMoveAction(nodeId, mousePos);
        }
    },

    /**
     * Event handler - mouseup
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMouseup: function(event) {
        var tree = this.tree;
        var target = util.getTarget(event);
        var nodeId = tree.getNodeIdFromElement(target);
        var index = -1;

        if (nodeId && this.isSortable && this.movingLineType) {
            index = this._getIndexForInserting(nodeId);
            nodeId = tree.getParentId(nodeId);
        }

        if (this.currentNodeId !== nodeId) {
            tree.move(this.currentNodeId, nodeId, index);
        }

        this._reset();
    },

    /**
     * Apply move action that are delay effect and sortable moving node
     * @param {strig} nodeId - Selected tree node id
     * @param {object} mousePos - Current mouse position
     * @private
     */
    _applyMoveAction: function(nodeId, mousePos) {
        var currentElement = document.getElementById(nodeId);
        var targetPos = currentElement.getBoundingClientRect();
        var hasClass = util.hasClass(currentElement, this.hoverClassName);
        var isContain = this._isContain(targetPos, mousePos);
        var boundaryType;

        if (!this.hoveredElement && isContain) {
            this.hoveredElement = currentElement;
            this._hover(nodeId);
        } else if (!hasClass || (hasClass && !isContain)) {
            this._unhover();
        }

        if (this.isSortable) {
            boundaryType = this._getBoundaryType(targetPos, mousePos);
            this._drawBoundaryLine(targetPos, boundaryType);
        }
    },

    /**
     * Act to hover on tree item
     * @param {string} nodeId - Tree node id
     * @private
     */
    _hover: function(nodeId) {
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
    _unhover: function() {
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
    _isContain: function(targetPos, mousePos) {
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
    _getBoundaryType: function(targetPos, mousePos) {
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
    _drawBoundaryLine: function(targetPos, boundaryType) {
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
    _getIndexForInserting: function(nodeId) {
        var index = this.tree.getNodeIndex(nodeId);

        if (this.movingLineType === 'bottom') {
            index += 1;
        }

        return index;
    },

    /**
     * _reset properties and remove event
     * @private
     */
    _reset: function() {
        if (this.isSortable) {
            this.lineElement.style.visibility = 'hidden';
        }

        if (this.hoveredElement) {
            util.removeClass(this.hoveredElement, this.hoverClassName);
            this.hoveredElement = null;
        }

        this.helperElement.style.display = 'none';

        this.currentNodeId = null;
        this.movingLineType = null;

        this.tree.off(this, 'mousemove');
        this.tree.off(this, 'mouseup');
    }
});

module.exports = Draggable;
