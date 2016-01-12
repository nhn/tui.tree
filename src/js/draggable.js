'use strict';
var util = require('./util');

var defaultOptions = {
        useHelper: true,
        helperPos: {
            y: 10,
            x: 10
        }
    },
    rejectiveTagNames = [
        'INPUT',
        'BUTTON'
    ],
    inArray = tui.util.inArray;

var DNDModule = {
    set: function(tree, options) {
        this.tree = tree;
        this.setMembers(options);
        this.attachMousedown();
    },

    setMembers: function(options) {
        var helperEl;

        options = tui.util.extend({}, defaultOptions, options);
        this.useHelper = options.useHelper;
        this.helperPos = options.helperPos;
        this.rejectedTagNames = rejectiveTagNames.concat(options.rejectedTagNames);
        this.rejectedClassNames = [].concat(options.rejectedClassNames);
        this.defaultPosition = tree.rootElement.getBoundingClientRect();
        this.helperElement = null;
        this.userSelectPropertyKey = null;
        this.userSelectPropertyValue = null;
        this.currentNodeId = null;

        this.handlers = {
            mousedown: tui.util.bind(DNDModule.onMousedown, DNDModule),
            mousemove: tui.util.bind(DNDModule.onMousemove, DNDModule),
            mouseup: tui.util.bind(DNDModule.onMouseup, DNDModule)
        };

        helperEl = this.helperElement = document.createElement('span');
        helperEl.style.position = 'absolute';
        helperEl.style.display = 'none';
        this.tree.rootElement.parentNode.appendChild(helperEl);
    },

    unset: function() {
        this.detachMousedown();
    },

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

    isPrevention: function(target) {
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

    onMousedown: function(event) {
        var target = util.getTarget(event),
            nodeId;

        if (util.isRightButton(event) || this.isPrevention(target)) {
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

    setHelper: function(text) {
        this.helperElement.innerHTML = text;
    },

    detachMousedown: function() {
        var tree = this.tree;

        util.removeEventListener(tree.rootElement, 'selectstart', util.preventDefault);
        util.removeEventListener(tree.rootElement, 'mousedown', this.handlers.mousedown);
        if (this.userSelectPropertyKey) {
            document.documentElement.style[this.userSelectPropertyKey] = this.userSelectPropertyValue;
        }
    }
};

module.exports = DNDModule;