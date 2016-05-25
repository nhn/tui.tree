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
    },
    rejectedTagNames = [
        'INPUT',
        'BUTTON',
        'UL'
    ],
    API_LIST = [],
    inArray = tui.util.inArray;

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
        this.tree = tree;
        this.setMembers(options);
        this.attachMousedown();
    },

    /**
     * Set members of this module
     * @param {Object} options - input options
     */
    setMembers: function(options) {
        var helperElement = document.createElement('span'),
            style = helperElement.style;
        options = tui.util.extend({}, defaultOptions, options);

        this.useHelper = options.useHelper;
        this.helperPos = options.helperPos;
        this.rejectedTagNames = rejectedTagNames.concat(options.rejectedTagNames);
        this.rejectedClassNames = [].concat(options.rejectedClassNames);
        this.helperElement = helperElement;
        this.userSelectPropertyKey = null;
        this.userSelectPropertyValue = null;
        this.currentNodeId = null;
        this.autoOpenDelay = options.autoOpenDelay;
        this.isSortable = options.isSortable;
        this.hoverClassName = options.hoverClassName;
        this.lineClassName = options.lineClassName;
        this.lineBoundary = options.lineBoundary;
        this.hoveredElement = null;
        this.movingLineType = null;
        this.timer = null;

        style.position = 'absolute';
        style.display = 'none';
        this.tree.rootElement.parentNode.appendChild(helperElement);

        if (this.isSortable) {
            this._setMovingLine();
        }
    },

    /**
     * Attach mouse down event
     */
    attachMousedown: function() {
        this.preventTextSelection();
        this.tree.on('mousedown', this.onMousedown, this);
    },

    /**
     * Prevent text-selection
     */
    preventTextSelection: function() {
        var tree = this.tree,
            style = tree.rootElement.style,
            selectKey = util.testProp(
                ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']
            );

        util.addEventListener(tree.rootElement, 'selectstart', util.preventDefault);

        this.userSelectPropertyKey = selectKey;
        this.userSelectPropertyValue = style[selectKey];
        style[selectKey] = 'none';
    },

    /**
     * Return whether the target element is in rejectedTagNames or in rejectedClassNames
     * @param {HTMLElement} target - Target element
     * @returns {boolean} Whether the target is not draggable or draggable
     */
    isNotDraggable: function(target) {
        var tagName = target.tagName.toUpperCase(),
            classNames = util.getClass(target).split(/\s+/),
            result;

        if (inArray(tagName, this.rejectedTagNames) !== -1) {
            return true;
        }

        tui.util.forEach(classNames, function(className) {
            result = inArray(className, this.rejectedClassNames) !== -1;

            return !result;
        }, this);

        return result;
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} event - Mouse event
     */
    onMousedown: function(event) {
        var target = util.getTarget(event),
            tree = this.tree,
            nodeId;

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
     */
    onMousemove: function(event) {
        var tree = this.tree;
        var helperEl = this.helperElement;
        var mousePos = util.getMousePos(event);
        var target = util.getTarget(event);
        var nodeId = tree.getNodeIdFromElement(target);
        var pos = tree.rootElement.getBoundingClientRect();

        if (!this.useHelper) {
            return;
        }

        helperEl.style.top = mousePos.y - pos.top + this.helperPos.y + 'px';
        helperEl.style.left = mousePos.x - pos.left + this.helperPos.x + 'px';
        helperEl.style.display = '';

        if (nodeId) {
            this._applyMoveAction(nodeId, mousePos);
        }
    },

    /**
     * Event handler - mouseup
     * @param {MouseEvent} event - Mouse event
     */
    onMouseup: function(event) {
        var tree = this.tree;
        var target = util.getTarget(event);
        var nodeId = tree.getNodeIdFromElement(target);
        var index = -1;

        if (this.isSortable) {
            this.lineElement.style.visibility = 'hidden';

            if (nodeId && this.movingLineType) {
                index = this._getIndexForInserting(nodeId);
                nodeId = tree.getParentId(nodeId);
            }
        }

        this.helperElement.style.display = 'none';
        tree.move(this.currentNodeId, nodeId, index);
        this.currentNodeId = null;
        this.movingLineType = null;

        tree.off(this, 'mousemove');
        tree.off(this, 'mouseup');
    },

    /**
     * Restore text-selection
     */
    restoreTextSelection: function() {
        var tree = this.tree;
        util.removeEventListener(tree.rootElement, 'selectstart', util.preventDefault);
        if (this.userSelectPropertyKey) {
            tree.rootElement.style[this.userSelectPropertyKey] = this.userSelectPropertyValue;
        }
    },

    /**
     * Set helper contents
     * @param {string} text - Helper contents
     */
    setHelper: function(text) {
        this.helperElement.innerHTML = text;
    },

    /**
     * Detach mousedown event
     */
    detachMousedown: function() {
        this.tree.off(this);
    },

    /**
     * Disable this module
     */
    destroy: function() {
        this.restoreTextSelection();
        this.detachMousedown();
    },

    /**
     * Set moving line element
     */
    _setMovingLine: function() {
        var lineElement = document.createElement('div');
        var lineStyle = lineElement.style;

        lineStyle.position = 'absolute';
        lineStyle.visibility = 'hidden';

        lineElement.className = this.lineClassName;

        this.tree.rootElement.parentNode.appendChild(lineElement);

        this.lineElement = lineElement;
    },

    /**
     * Apply move action that are delay effect and sortable moving node
     * @param {strig} nodeId - Selected tree node id
     * @param {object} mousePos - Current mouse position
     */
    _applyMoveAction: function(nodeId, mousePos) {
        var currentElement = document.getElementById(nodeId);
        var targetPos = currentElement.getBoundingClientRect();
        var hasClass = util.hasClass(currentElement, this.hoverClassName);
        var isContain = this._isContain(targetPos, mousePos);
        var boundaryType;

        if (!this.hoveredElement && isContain) {
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
     */
    _hover: function(nodeId) {
        var tree = this.tree;
        var hoverEl = document.getElementById(nodeId);

        this.hoveredElement = hoverEl;

        util.addClass(hoverEl, this.hoverClassName);

        if (!tree.isLeaf(nodeId)) {
            this.timer = setTimeout(function() {
                if (tree.getNodeIdFromElement(hoverEl) === nodeId) {
                    tree.open(nodeId);
                }
            }, this.autoOpenDelay);
        }
    },

    /**
     * Act to unhover on tree item
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
     */
    _isContain: function(targetPos, mousePos) {
        var top = targetPos.top;
        var bottom = targetPos.bottom;

        if (this.isSortable) {
            top += this.lineBoundary.top;
            bottom -= this.lineBoundary.bottom;
        }

        if (targetPos.left < mousePos.x && targetPos.right > mousePos.x &&
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
     */
    _getIndexForInserting: function(nodeId) {
        var index = this.tree.getNodeIndex(nodeId);

        if (this.movingLineType === 'bottom') {
            index += 1;
        }

        return index;
    }
});

module.exports = Draggable;
