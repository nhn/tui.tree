'use strict';
var util = require('./util');

var defaultOptions = {
        useHelper: true,
        helperPos: {
            y: 10,
            x: 10
        }
    },
    rejectedTagNames = [
        'INPUT',
        'BUTTON'
    ],
    inArray = tui.util.inArray;

/**
 * Set the tree draggable
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {boolean} options.useHelper - Using helper flag
 *  @param {{x: number, y:number}} options.helperPos - Helper position
 *  @param {Array.<string>} options.rejectedTagNames - No draggable tag names
 *  @param {Array.<string>} options.rejectedClassNames - No draggable class names
 */
var Draggable = tui.util.defineClass(/** @lends Draggable.prototype */{
    /*eslint-disable*/
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
        this.defaultPosition = tree.rootElement.getBoundingClientRect();
        this.helperElement = helperElement;
        this.userSelectPropertyKey = null;
        this.userSelectPropertyValue = null;
        this.currentNodeId = null;

        this.handlers = {};
        this.handlers.mousedown = tui.util.bind(this.onMousedown, this);
        this.handlers.mousemove = tui.util.bind(this.onMousemove, this);
        this.handlers.mouseup = tui.util.bind(this.onMouseup, this);

        style.position = 'absolute';
        style.display = 'none';
        this.tree.rootElement.parentNode.appendChild(helperElement);
    },

    /**
     * Attach mouse down event
     */
    attachMousedown: function() {
        var tree = this.tree,
            selectKey, style;

        if ('onselectstart' in document) {
            util.addEventListener(tree.rootElement, 'selectstart', util.preventDefault);
        } else {
            style = document.documentElement.style;
            selectKey = util.testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

            this.userSelectPropertyKey = selectKey;
            this.userSelectPropertyValue = style[selectKey];
            style[selectKey] = 'none';
        }
        util.addEventListener(tree.rootElement, 'mousedown', this.handlers.mousedown);
    },

    /**
     * Return whether the target element is in rejectedTagNames or in rejectedClassNames
     * @param {HTMLElement} target - Target element
     * @returns {boolean} Whether the target is not draggable or draggable
     */
    isNotDraggable: function(target) {
        var tagName = target.tagName.toUpperCase(),
            classNames = util.getClass(target).split(' '),
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

        util.addEventListener(document, 'mousemove', this.handlers.mousemove);
        util.addEventListener(document, 'mouseup', this.handlers.mouseup);
    },

    /**
     * Event handler - mousemove
     * @param {MouseEvent} event - Mouse event
     */
    onMousemove: function(event) {
        var helperEl = this.helperElement,
            pos = this.defaultPosition;
        if (!this.useHelper) {
            return;
        }

        helperEl.style.left = event.clientX - pos.left + this.helperPos.x + 'px';
        helperEl.style.top = event.clientY - pos.top + this.helperPos.y + 'px';
        helperEl.style.display = '';
    },

    /**
     * Event handler - mouseup
     * @param {MouseEvent} event - Mouse event
     */
    onMouseup: function(event) {
        var tree = this.tree,
            target = util.getTarget(event),
            nodeId = tree.getNodeIdFromElement(target);

        this.helperElement.style.display = 'none';
        tree.move(this.currentNodeId, nodeId);
        this.currentNodeId = null;

        util.removeEventListener(document, 'mousemove', this.handlers.mousemove);
        util.removeEventListener(document, 'mouseup', this.handlers.mouseup);
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
        var tree = this.tree;

        util.removeEventListener(tree.rootElement, 'selectstart', util.preventDefault);
        util.removeEventListener(tree.rootElement, 'mousedown', this.handlers.mousedown);
        if (this.userSelectPropertyKey) {
            document.documentElement.style[this.userSelectPropertyKey] = this.userSelectPropertyValue;
        }
    },

    /**
     * Disable this module
     */
    destroy: function() {
        this.detachMousedown();
    }
});

module.exports = Draggable;