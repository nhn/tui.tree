(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Tree', require('./src/js/tree'));

},{"./src/js/tree":7}],2:[function(require,module,exports){
/**
 * A default values for tree
 * @module defaults
 */
'use strict';

/**
 * Make class names
 * @param {string} prefix - Prefix of class name
 * @param {Array.<string>} keys - Keys of class names
 * @returns {object.<string, string>} Classnames map
 */
function makeClassNames(prefix, keys) {
    var obj = {};
    tui.util.forEach(keys, function(key) {
        obj[key + 'Class'] = prefix + key;
    });
    return obj;
}

/**
 * @const
 * @type {object}
 * @property {boolean} useDrag - Default: false
 * @property {boolean} useHelper - Default: false
 * @property {object} stateLabel - State label in node
 *  @property {string} stateLabel.opened - Default: '-'
 *  @property {string} stateLabel.closed - Default: '+'
 * @property {object} template - Template html for the nodes.
 * @property {object} classNames - Class names of elements in tree
 *      @property {string} openedClass - A class name for opened node
 *      @property {string} closedClass - A class name for closed node
 *      @property {string} selectedClass - A class name for selected node
 *      @property {string} subtreeClass  - A class name for subtree in internal node
 *      @property {string} toggleClass - A class name for toggle button in internal node
 *      @property {string} titleClass - A class name for title element in a node
 *      @property {string} inputClass - A class name for editable element in a node
 *  @property {string} template.internalNode - A template html for internal node.
 *  @property {string} template.leafNode - A template html for leaf node.
 */
module.exports = {
    nodeDefaultState: 'closed',
    stateLabels: {
        opened: '-',
        closed: '+'
    },
    nodeIdPrefix: 'tui-tree-node-',
    classNames: makeClassNames('tui-tree-', [
        'opened',
        'closed',
        'selected',
        'subtree',
        'toggleBtn',
        'text',
        'input'
    ]),
    template: {
        internalNode:
        '<li id="{{id}}" class="tui-tree-node {{stateClass}}">' +
            '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
            '<span class="{{textClass}}">{{text}}</span>' +
            '<ul class="{{subtreeClass}}">{{children}}</ul>' +
        '</li>',
        leafNode:
        '<li id="{{id}}" class="tui-tree-node tui-tree-leaf">' +
            '<span class="{{textClass}}">{{text}}</span>' +
        '</li>'
    }
};

},{}],3:[function(require,module,exports){
'use strict';
var util = require('./util');

var defaultOptions = {
        useHelper: true,
        helperPos: {
            y: 2,
            x: 5
        }
    },
    rejectedTagNames = [
        'INPUT',
        'BUTTON',
        'UL'
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
        var tree = this.tree,
            helperElement = document.createElement('span'),
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

        tree.on('mousedown', this.onMousedown, this);
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

        tree.off(this);
        util.removeEventListener(tree.rootElement, 'selectstart', util.preventDefault);
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

},{"./util":10}],4:[function(require,module,exports){
'use strict';

var util = require('./util');


/**
 * Set the tree selectable
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {string} options.editableClassName - Classname of editable element
 *  @param {string} options.dataKey - Key of node data to set value
 *  @param {string} options.inputClassName - Classname of input element
 */
var Editable = tui.util.defineClass(/** @lends SelectionModule.prototype */{/*eslint-disable*/
    init: function(tree, options) { /*eslint-enable*/
        this.tree = tree;
        this.editableClassName = options.editableClassName;
        this.dataKey = options.dataKey;
        this.inputElement = this.createInputElement(options.inputClassName);
        this.boundOnKeyup = tui.util.bind(this.onKeyup, this);
        this.boundOnBlur = tui.util.bind(this.onBlur, this);

        tree.on('doubleClick', this.onDoubleClick, this);
        util.addEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.addEventListener(this.inputElement, 'blur', this.boundOnBlur);
    },

    /**
     * Detach input element from document
     */
    detachInputFromDocument: function() {
        var inputEl = this.inputElement,
            parentNode = inputEl.parentNode;

        if (parentNode) {
            parentNode.removeChild(inputEl);
        }
    },

    /**
     * Disable this module
     */
    destroy: function() {
        this.detachInputFromDocument();
        this.tree.off(this);
        util.removeEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.removeEventListener(this.inputElement, 'blur', this.boundOnBlur);
    },

    /**
     * Create input element
     * @param {string} inputClassName - Classname of input element
     * @returns {HTMLElement} Input element
     */
    createInputElement: function(inputClassName) {
        var el = document.createElement('INPUT');
        el.className = inputClassName;
        el.setAttribute('type', 'text');

        return el;
    },

    /**
     * Custom event handler "singleClick"
     * @param {MouseEvent} event - Mouse event
     */
    onDoubleClick: function(event) {
        var tree = this.tree,
            target = util.getTarget(event),
            inputElement, nodeId;

        if (util.hasClass(target, this.editableClassName)) {
            nodeId = tree.getNodeIdFromElement(target);

            inputElement = this.inputElement;
            inputElement.value = tree.getNodeData(nodeId)[this.dataKey] || '';
            target.parentNode.insertBefore(inputElement, target);
            target.style.display = 'none';
            inputElement.focus();
        }
    },

    /**
     * Event handler - keyup - input element
     * @param {Event} event - Key event
     */
    onKeyup: function(event) {
        if (event.keyCode !== 13) { // If not enter
            return;
        }
        this.setData();
    },

    /**
     * Event handler - blur - input element
     */
    onBlur: function() {
        this.setData();
    },

    /**
     * Set data of input element to node and detach input element from doc.
     */
    setData: function() {
        var nodeId = tree.getNodeIdFromElement(this.inputElement),
            data = {};

        if (nodeId) {
            data[this.dataKey] = this.inputElement.value;
            tree.setNodeData(nodeId, data);
        }
        this.detachInputFromDocument();
    }
});

module.exports = Editable;

},{"./util":10}],5:[function(require,module,exports){
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
            selectedClassName = this.selectedClassName;

        util.removeClass(prevElement, selectedClassName);
        util.addClass(nodeElement, selectedClassName);

        tree.fire('select', nodeId);
        this.prevNodeId = nodeId;
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

},{"./util":10}],6:[function(require,module,exports){
/**
 * @fileoverview States in tree
 */

'use strict';

/**
 * States in tree
 * @module states
 */
module.exports = {
    /**
     * States of node
     * @type {{OPENED: string, CLOSED: string}}
     */
    node: {
        OPENED: 'opened',
        CLOSED: 'closed'
    }
};

},{}],7:[function(require,module,exports){
/**
 * @fileoverview Render tree and update tree.
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

'use strict';

var defaults = require('./defaults'),
    util = require('./util'),
    states = require('./states'),
    TreeModel = require('./treeModel'),
    Selectable = require('./selectable'),
    Draggable = require('./draggable'),
    Editable = require('./editable');

var nodeStates = states.node,
    features = {
        Selectable: Selectable,
        Draggable: Draggable,
        Editable: Editable
    },
    snippet = tui.util,
    extend = snippet.extend;
/**
 * Create tree model and inject data to model
 * @constructor
 * @param {Object} data A data to be used on tree
 * @param {Object} options The options
 *     @param {HTMLElement} [options.rootElement] Root element (It should be 'UL' element)
 *     @param {string} [options.nodeIdPrefix] A default prefix of a node
 *     @param {Object} [options.nodeDefaultState] A default state of a node
 *     @param {Object} [options.template] A markup set to make element
 *         @param {string} [options.template.internalNode] HTML template
 *         @param {string} [options.template.leafNode] HTML template
 *     @param {Object} [options.stateLabels] Toggle button state label
 *         @param {string} [options.stateLabels.opened] State-OPENED label (Text or HTML)
 *         @param {string} [options.stateLabels.closed] State-CLOSED label (Text or HTML)
 *     @param {Object} [options.classNames] Class names for tree
 *         @param {string} [options.classNames.openedClass] A class name for opened node
 *         @param {string} [options.classNames.closedClass] A class name for closed node
 *         @param {string} [options.classNames.selectedClass] A class name to selected node
 *         @param {string} [options.classNames.textClass] A class name that for textElement in node
 *         @param {string} [options.classNames.inputClass] A class input element in a node
 *         @param {string} [options.classNames.subtreeClass] A class name for subtree in internal node
 *         @param {string} [options.classNames.toggleBtnClass] A class name for toggle button in internal node
 * @example
 * //Default options
 * //   - HTML TEMPLATE
 * //       - The prefix "d_" represents the data of each node.
 * //       - The "d_children" will be converted to HTML-template
 * //
 * // {
 * //     rootElement: document.createElement('UL'),
 * //     nodeIdPrefix: 'tui-tree-node-'
 * //     nodeDefaultState: 'closed',
 * //     stateLabels: {
 * //         opened: '-',
 * //         closed: '+'
 * //     },
 * //     classNames: {
 * //         openedClass: 'tui-tree-opened',
 * //         closedClass: 'tui-tree-closed',
 * //         selectedClass: 'tui-tree-selected',
 * //         subtreeClass: 'tui-tree-subtree',
 * //         toggleBtnClass: 'tui-tree-toggleBtn',
 * //         textClass: 'tui-tree-text',
 * //         iuputClass: 'tui-tree-input'
 * //     },
 * //
 * //     template: {
 * //         internalNode:
 * //         '<li id="{{id}}" class="tui-tree-node {{stateClass}}" data-node-id="{{id}}">' +
 * //             '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
 * //             '<span class="{{textClass}}">{{text}}</span>' +
 * //             '<ul class="{{subtreeClass}}">{{children}}</ul>' +
 * //         '</li>',
 * //         leafNode:
 * //         '<li id="{{id}}" class="tui-tree-node tui-tree-leaf" data-node-id="{{id}}">' +
 * //             '<span class="{{textClass}}">{{text}}</span>' +
 * //         '</li>'
 * //     }
 * // }
 * //
 *
 * var data = [
 *     {title: 'rootA', children: [
 *         {title: 'root-1A'},
 *         {title: 'root-1B'},
 *         {title: 'root-1C'},
 *         {title: 'root-1D'},
 *         {title: 'root-2A', children: [
 *             {title:'sub_1A', children:[
 *                 {title:'sub_sub_1A'}
 *             ]},
 *             {title:'sub_2A'}
 *         ]},
 *         {title: 'root-2B'},
 *         {title: 'root-2C'},
 *         {title: 'root-2D'},
 *         {title: 'root-3A', children: [
 *             {title:'sub3_a'},
 *             {title:'sub3_b'}
 *         ]},
 *         {title: 'root-3B'},
 *         {title: 'root-3C'},
 *         {title: 'root-3D'}
 *     ]},
 *     {title: 'rootB', children: [
 *         {title:'B_sub1'},
 *         {title:'B_sub2'},
 *         {title:'b'}
 *     ]}
 * ];
 *
 * var tree1 = new tui.component.Tree(data, {
 *     rootElement: document.getElementById('treeRoot'),
 *     nodeDefaultState: 'opened'
 * });
 **/
var Tree = snippet.defineClass(/** @lends Tree.prototype */{ /*eslint-disable*/
    static: {
        /**
         * @memberOf Tree
         * @static
         * @param {string} moduleName - Module name
         * @param {object} module - Module
         */
        registerFeature: function(moduleName, module) {
            if (module){
                this.features[moduleName] = module;
            }
        },

        /**
         * Tree features
         */
        features: {}
    },
    init: function(data, options) { /*eslint-enable*/
        var extend = snippet.extend;
        options = extend({}, defaults, options);

        /**
         * Default class names
         * @type {object.<string, string>}
         */
        this.classNames = extend({}, defaults.classNames, options.classNames);

        /**
         * Default template
         * @type {{internalNode: string, leafNode: string}}
         */
        this.template = extend({}, defaults.template, options.template);

        /**
         * Root element
         * @type {HTMLElement}
         */
        this.rootElement = options.rootElement;

        /**
         * Toggle button state label
         * @type {{opened: string, closed: string}}
         */
        this.stateLabels = options.stateLabels;

        /**
         * Make tree model
         * @type {TreeModel}
         */
        this.model = new TreeModel(data, options);

        /**
         * Enabled features
         * @type {Object.<string, object>}
         */
        this.enabledFeatures = {};

        this._setRoot();
        this._drawChildren();
        this._setEvents();
    },

    /**
     * Set root element of tree
     * @private
     */
    _setRoot: function() {
        var rootEl = this.rootElement;

        if (!snippet.isHTMLNode(rootEl)) {
            rootEl = this.rootElement = document.createElement('UL');
            document.body.appendChild(rootEl);
        }
    },

    /**
     * Move event handler
     * @param {string} nodeId - Node id
     * @param {string} originalParentId - Original parent node id
     * @param {string} newParentId - New parent node id
     * @private
     */
    _onMove: function(nodeId, originalParentId, newParentId) {
        this._drawChildren(originalParentId);
        this._drawChildren(newParentId);
    },

    /**
     * Set event handlers
     */
    _setEvents: function() {
        this.model.on('update', this._drawChildren, this);
        this.model.on('move', this._onMove, this);
        util.addEventListener(this.rootElement, 'click', snippet.bind(this._onClick, this));
        util.addEventListener(this.rootElement, 'mousedown', snippet.bind(this._onMousedown, this));
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMousedown: function(event) {
        var self = this;

        this.mousedownTimer = setTimeout(function() {
            self.fire('mousedown', event);
        }, 200);

        util.addEventListener(document, 'mouseup', function mouseupHandler() {
            self.resetMousedownTimer();
            util.removeEventListener(document, 'mouseup', mouseupHandler);
        });
    },

    /**
     * Event handler - click
     * @param {MouseEvent} event - Click event
     * @private
     */
    _onClick: function(event) {
        var target = util.getTarget(event),
            self = this;

        if (util.isRightButton(event)) {
            this.clickTimer = null;
            return;
        }
        if (util.hasClass(target, this.classNames.toggleBtnClass)) {
            this.toggle(this.getNodeIdFromElement(target));
            return;
        }
        if (this.clickTimer) {
            this.fire('doubleClick', event);
            this.resetClickTimer();
        } else {
            this.clickTimer = setTimeout(function() {
                self.fire('singleClick', event);
                self.resetClickTimer();
            }, 300);
        }
    },

    /**
     * Set node state - opened or closed
     * @param {string} nodeId - Node id
     * @param {string} state - Node state
     * @private
     */
    _setDisplayFromNodeState: function(nodeId, state) {
        var subtreeElement = this._getSubtreeElement(nodeId),
            toggleBtnClassName = this.classNames.toogleBtnClass,
            label, btnElement, nodeElement;

        if (!subtreeElement || subtreeElement === this.rootElement) {
            return;
        }
        label = this.stateLabels[state];
        nodeElement = document.getElementById(nodeId);
        btnElement = util.getElementsByClassName(nodeElement, toggleBtnClassName)[0];

        if (state === nodeStates.OPENED) {
            subtreeElement.style.display = '';
        } else {
            subtreeElement.style.display = 'none';
        }
        this._setNodeClassNameFromState(nodeElement, state);

        if (btnElement) {
            btnElement.innerHTML = label;
        }
    },

    /**
     * Set node class name from provided state
     * @param {HTMLElement} nodeElement - TreeNode element
     * @param {string} state - New changed state
     * @private
     */
    _setNodeClassNameFromState: function(nodeElement, state) {
        var classNames = this.classNames,
            openedClassName = classNames[nodeStates.OPENED + 'Class'],
            closedClassName = classNames[nodeStates.CLOSED + 'Class'];

        util.removeClass(nodeElement, openedClassName);
        util.removeClass(nodeElement, closedClassName);
        util.addClass(nodeElement, classNames[state + 'Class']);
    },

    /**
     * Make html
     * @param {Array.<string>} nodeIds - Node id list
     * @returns {string} HTML
     * @private
     */
    _makeHtml: function(nodeIds) {
        var model = this.model,
            classNames = this.classNames,
            stateLabels = this.stateLabels,
            templateSource = this.template,
            html = '';

        snippet.forEach(nodeIds, function(nodeId) {
            var node = model.getNode(nodeId),
                state = node.getState(),
                nodeData = node.getAllData(),
                props = extend({
                    id: nodeId
                }, classNames, nodeData),
                nodeTemplate;

            if (node.isLeaf()) {
                nodeTemplate = templateSource.leafNode;
            } else {
                nodeTemplate = templateSource.internalNode;
                props.stateClass = classNames[state+'Class'];
                props.stateLabel = stateLabels[state];
                props.children = this._makeHtml(node.getChildIds());
            }
            html += util.template(nodeTemplate, props);
        }, this);
        return html;
    },

    /**
     * Draw tree
     * @param {string} [parentId] - Parent node id
     * @private
     */
    _drawChildren: function(parentId) {
        var node = this.model.getNode(parentId),
            subtreeElement;

        if (!node) {
            node = this.model.rootNode;
            parentId = node.getId();
        }
        subtreeElement = this._getSubtreeElement(parentId);
        if (!subtreeElement) {
            this._drawChildren(node.getParentId());
            return;
        }

        this.fire('beforeDraw', parentId);
        subtreeElement.innerHTML = this._makeHtml(node.getChildIds());
        this.model.each(function(node, nodeId) {
            if (node.getState() === nodeStates.OPENED) {
                this.open(nodeId);
            } else {
                this.close(nodeId);
            }
        }, parentId, this);
        this.fire('afterDraw', parentId);
    },

    /**
     * Get subtree element
     * @param {string} nodeId - TreeNode id
     * @returns {Element|undefined} Subtree element or undefined
     * @private
     */
    _getSubtreeElement: function(nodeId) {
        var node = this.model.getNode(nodeId),
            subtreeClassName, nodeElement, subtreeElement;
        if (!node || node.isLeaf()) {
            return;
        }

        if (node.isRoot()) {
            return this.rootElement;
        }

        subtreeClassName = this.classNames['subtreeClass'];
        nodeElement = document.getElementById(node.getId());
        subtreeElement = util.getElementsByClassName(nodeElement, subtreeClassName)[0];

        return subtreeElement;
    },

    /**
     * Return the depth of node
     * @param {string} nodeId - Node id
     * @return {number|undefined} Depth
     */
    getDepth: function(nodeId) {
        return this.model.getDepth(nodeId);
    },

    /**
     * Return the last depth of tree
     * @return {number} Last depth
     */
    getLastDepth: function() {
        return this.model.getLastDepth();
    },

    /**
     * Return root node id
     * @returns {string} Root node id
     */
    getRootNodeId: function() {
        return this.model.rootNode.getId();
    },

    /**
     * Return child ids
     * @param {string} nodeId - Node id
     * @returns {Array.<string>|undefined} Child ids
     */
    getChildIds: function(nodeId) {
        return this.model.getChildIds(nodeId);
    },

    /**
     * Return parent id of node
     * @param {string} nodeId - Node id
     * @returns {string|undefined} Parent id
     */
    getParentId: function(nodeId) {
        return this.model.getParentId(nodeId);
    },

    /**
     * Reset click timer
     */
    resetClickTimer: function() {
        window.clearTimeout(this.clickTimer);
        this.clickTimer = null;
    },

    /**
     * Reset mousedown timer
     */
    resetMousedownTimer: function() {
        window.clearTimeout(this.mousedownTimer);
        this.mousedownTimer = null;
    },

    /**
     * Get node id from element
     * @param {HTMLElement} element - Element
     * @returns {string} Node id
     * @private
     */
    getNodeIdFromElement: function(element) {
        var idPrefix = this.getNodeIdPrefix();

        while (element && element.id.indexOf(idPrefix) === -1) {
            element = element.parentElement;
        }

        return element ? element.id : '';
    },

    /**
     * Get prefix of node id
     * @returns {string} Prefix of node id
     */
    getNodeIdPrefix: function() {
        return this.model.getNodeIdPrefix();
    },

    /**
     * Get node data
     * @param {string} nodeId - Node id
     * @returns {object|undefined} Node data
     */
    getNodeData: function(nodeId) {
        return this.model.getNodeData(nodeId);
    },

    /**
     * Set data properties of a node
     * @param {string} nodeId - Node id
     * @param {object} data - Properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    setNodeData: function(nodeId, data, isSilent) {
        this.model.setNodeData(nodeId, data, isSilent);
    },

    /**
     * Remove node data
     * @param {string} nodeId - Node id
     * @param {string|Array} names - Names of properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    removeNodeData: function(nodeId, names, isSilent) {
        this.model.removeNodeData(nodeId, names, isSilent)
    },

    /**
     * Open node
     * @param {string} nodeId - Node id
     */
    open: function(nodeId) {
        var node = this.model.getNode(nodeId),
            state = nodeStates.OPENED;

        if (node && !node.isRoot()) {
            node.setState(state);
            this._setDisplayFromNodeState(nodeId, state);
        }
    },

    /**
     * Close node
     * @param {string} nodeId - Node id
     */
    close: function(nodeId) {
        var node = this.model.getNode(nodeId),
            state = nodeStates.CLOSED;

        if (node && !node.isRoot()) {
            node.setState(state);
            this._setDisplayFromNodeState(nodeId, state);
        }
    },

    /**
     * Toggle node
     * @param {string} nodeId - Node id
     * @private
     **/
    toggle: function(nodeId) {
        var node = this.model.getNode(nodeId),
            state;

        if (node && !node.isRoot()) {
            node.toggleState();
            state = node.getState();
            this._setDisplayFromNodeState(nodeId, state);
        }
    },

    /**
     * Sort all nodes
     * @param {Function} comparator - Comparator for sorting
     */
    sort: function(comparator) {
        this.model.sort(comparator);
        this._drawChildren();
    },

    /**
     * Refresh node
     * @param {string} [nodeId] - TreeNode id to refresh
     **/
    refresh: function(nodeId) {
        this._drawChildren(nodeId);
    },

    /**
     * Traverse this tree iterating over all nodes.
     * @param {Function} iteratee - Iteratee function
     * @param {object} [context] - Context of iteratee
     */
    eachAll: function(iteratee, context) {
        this.model.eachAll(iteratee, context);
    },

    /**
     * Traverse this tree iterating over all descendants of a node.
     * @param {Function} iteratee - Iteratee function
     * @param {string} parentId - Parent node id
     * @param {object} [context] - Context of iteratee
     */
    each: function(iteratee, parentId, context) {
        this.model.each(iteratee, parentId, context);
    },

    /**
     * Add node(s).
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - The update event will be fired with parent node.
     * @param {Array|object} data - Raw-data
     * @param {*} parentId - Parent id
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     */
    add: function(data, parentId, isSilent) {
        this.model.add(data, parentId, isSilent);
    },

    /**
     * Remove a node with children.
     * - The update event will be fired with parent node.
     * @param {string} nodeId - Node id to remove
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     */
    remove: function(nodeId, isSilent) {
        this.model.remove(nodeId, isSilent);
    },

    /**
     * Move a node to new parent
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     */
    move: function(nodeId, newParentId, isSilent) {
        this.model.move(nodeId, newParentId, isSilent);
    },

    /**
     * Enable facility of tree
     * @param {string} featureName - 'Selectable', 'Draggable'
     * @param {object} [options] - Feature options
     * @return {Tree} this
     */
    enableFeature: function(featureName, options) {
        var Feature = Tree.features[featureName];

        this.disableFeature(featureName);
        if (Feature) {
            this.enabledFeatures[featureName] = new Feature(this, options);
        }
        return this;
    },

    /**
     * Disable facility of tree
     * @param {string} featureName - 'Selectable', 'Draggable'
     * @return {Tree} this
     */
    disableFeature: function(featureName) {
        var feature = this.enabledFeatures[featureName];

        if (feature) {
            feature.destroy();
            delete this.enabledFeatures[featureName]
        }
        return this;
    }
});

tui.util.forEach(features, function(Feature, name) {
    Tree.registerFeature(name, Feature);
});
tui.util.CustomEvents.mixin(Tree);
module.exports = Tree;

},{"./defaults":2,"./draggable":3,"./editable":4,"./selectable":5,"./states":6,"./treeModel":8,"./util":10}],8:[function(require,module,exports){
/**
 * @fileoverview Update view and control tree data
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */
'use strict';

var TreeNode = require('./treeNode'),
    util = require('./util');

var snippet = tui.util,
    extend = snippet.extend,
    keys = snippet.keys,
    forEach = snippet.forEach,
    map = snippet.map,
    filter = snippet.filter,
    inArray = snippet.inArray;

/**
 * Tree model
 * @constructor TreeModel
 * @param {Array} data - Data
 * @param {Object} options - Options for defaultState and nodeIdPrefix
 **/
var TreeModel = tui.util.defineClass(/** @lends TreeModel.prototype */{ /* eslint-disable */
    init: function(data, options) {/*eslint-enable*/
        TreeNode.setIdPrefix(options.nodeIdPrefix);

        /**
         * Default state of node
         * @type {String}
         */
        this.nodeDefaultState = options.nodeDefaultState;

        /**
         * Root node
         * @type {TreeNode}
         */
        this.rootNode = new TreeNode({
            state: 'opened'
        }, null);

        /**
         * Tree hash having all nodes
         * @type {object.<string, TreeNode>}
         */
        this.treeHash = {};

        this._setData(data);
    },

    /**
     * Return prefix of node id
     * @returns {string} Prefix
     */
    getNodeIdPrefix: function() {
        return TreeNode.idPrefix;
    },

    /**
     * Set model with tree data
     * @param {Array} data - Tree data
     */
    _setData: function(data) {
        var root = this.rootNode,
            rootId = root.getId();

        this.treeHash[rootId] = root;
        this._makeTreeHash(data, root);
    },

    /**
     * Make tree hash from data and parentNode
     * @param {Array} data - Tree data
     * @param {TreeNode} parent - Parent node id
     * @private
     */
    _makeTreeHash: function(data, parent) {
        var parentId = parent.getId();

        forEach(data, function(datum) {
            var childrenData = datum.children,
                node = this._createNode(datum, parentId),
                nodeId = node.getId();

            this.treeHash[nodeId] = node;
            parent.addChildId(nodeId);
            this._makeTreeHash(childrenData, node);
        }, this);
    },

    /**
     * Create node
     * @param {object} nodeData - Datum of node
     * @param {string} parentId - Parent id
     * @return {TreeNode} TreeNode
     */
    _createNode: function(nodeData, parentId) {
        var node;
        nodeData = extend({
            state: this.nodeDefaultState
        }, nodeData);

        node = new TreeNode(nodeData, parentId);
        node.removeData('children');

        return node;
    },

    /**
     * Get children
     * @param {string} nodeId - Node id
     * @return {Array.<TreeNode>|undefined} children
     */
    getChildren: function(nodeId) {
        var childIds = this.getChildIds(nodeId);
        if (!childIds) {
            return;
        }

        return map(childIds, function(childId) {
            return this.getNode(childId);
        }, this);
    },

    /**
     * Get child ids
     * @param {string} nodeId - Node id
     * @returns {Array.<string>|undefined} Child ids
     */
    getChildIds: function(nodeId) {
        var node = this.getNode(nodeId);
        if (!node) {
            return;
        }

        return node.getChildIds();
    },

    /**
     * Get the number of nodes
     * @returns {number} The number of nodes
     */
    getCount: function() {
        return keys(this.treeHash).length;
    },

    /**
     * Get last depth
     * @returns {number} The last depth
     */
    getLastDepth: function() {
        var depths = map(this.treeHash, function(node) {
            return this.getDepth(node.getId());
        }, this);

        return Math.max.apply(null, depths);
    },

    /**
     * Find node
     * @param {string} id - A node id to find
     * @return {TreeNode|undefined} Node
     */
    getNode: function(id) {
        return this.treeHash[id];
    },

    /**
     * Get depth from node id
     * @param {string} id - A node id to find
     * @return {number|undefined} Depth
     */
    getDepth: function(id) {
        var node = this.getNode(id),
            depth = 0,
            parent;

        if (!node) {
            return;
        }

        parent = this.getNode(node.getParentId());
        while (parent) {
            depth += 1;
            parent = this.getNode(parent.getParentId());
        }

        return depth;
    },

    /**
     * Return parent id of node
     * @param {string} id - Node id
     * @returns {string|undefined} Parent id
     */
    getParentId: function(id) {
        var node = this.getNode(id);

        if (!node) {
            return;
        }
        return node.getParentId();
    },

    /**
     * Remove a node with children.
     * - The update event will be fired with parent node.
     * @param {string} id - Node id to remove
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    remove: function(id, isSilent) {
        var node = this.getNode(id),
            parent;

        if (!node) {
            return;
        }

        parent = this.getNode(node.getParentId());

        forEach(node.getChildIds(), function(childId) {
            this.remove(childId, true);
        }, this);

        parent.removeChildId(id);
        delete this.treeHash[id];

        if (!isSilent) {
            this.fire('update', parent.getId());
        }
    },

    /**
     * Add node(s).
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - The update event will be fired with parent node.
     * @param {Array|object} data - Raw-data
     * @param {string} parentId - Parent id
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    add: function(data, parentId, isSilent) {
        var parent = this.getNode(parentId) || this.rootNode;

        data = [].concat(data);
        this._makeTreeHash(data, parent);

        if (!isSilent) {
            this.fire('update', parentId);
        }
    },

    /**
     * Set data properties of a node
     * @param {string} id - Node id
     * @param {object} props - Properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    setNodeData: function(id, props, isSilent) {
        var node = this.getNode(id);

        if (!node || !props) {
            return;
        }

        node.setData(props);

        if (!isSilent) {
            this.fire('update', node.getParentId());
        }
    },

    /**
     * Remove node data
     * @param {string} id - Node id
     * @param {string|Array} names - Names of properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    removeNodeData: function(id, names, isSilent) {
        var node = this.getNode(id);

        if (!node || !names) {
            return;
        }

        if (tui.util.isArray(names)) {
            node.removeData.apply(node, names);
        } else {
            node.removeData(names);
        }

        if (!isSilent) {
            this.fire('update', node.getParentId());
        }
    },

    /**
     * Move a node to new parent's child
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    move: function(nodeId, newParentId, isSilent) {
        var node = this.getNode(nodeId),
            originalParent, originalParentId, newParent;

        if (!node) {
            return;
        }
        newParent = this.getNode(newParentId) || this.rootNode;
        newParentId = newParent.getId();
        originalParentId = node.getParentId();
        originalParent = this.getNode(originalParentId);

        if (nodeId === newParentId || this.contains(nodeId, newParentId)) {
            return;
        }
        originalParent.removeChildId(nodeId);
        node.setParentId(newParentId);
        newParent.addChildId(nodeId);

        if (!isSilent) {
            this.fire('move', nodeId, originalParentId, newParentId);
        }
    },

    /**
     * Check to see if a node is a descendant of another node.
     * @param {string} containerId - Node id
     * @param {string} containedId - Node id
     * @returns {boolean} The node is contained or not
     */
    contains: function(containerId, containedId) {
        var parentId = this.getParentId(containedId),
            isContained = false;

        while (!isContained && parentId) {
            isContained = (containerId === parentId);
            parentId = this.getParentId(parentId);
        }
        return isContained;
    },

    /**
     * Sort nodes
     * @param {Function} comparator - Comparator function
     */
    sort: function(comparator) {
        this.eachAll(function(node, nodeId) {
            var children = this.getChildren(nodeId),
                childIds;

            if (children.length > 1) {
                children.sort(comparator);

                childIds = map(children, function(child) {
                    return child.getId();
                });
                node.replaceChildIds(childIds);
            }
        });
    },

    /**
     * Get node data (all)
     * @param {string} nodeId - Node id
     * @return {object|undefined} Node data
     */
    getNodeData: function(nodeId) {
        var node = this.getNode(nodeId);
        if (!node) {
            return;
        }

        return node.getAllData();
    },

    /**
     * Traverse this tree iterating over all nodes.
     * @param {Function} iteratee - Iteratee function
     * @param {object} [context] - Context of iteratee
     */
    eachAll: function(iteratee, context) {
        context = context || this;

        forEach(this.treeHash, function() {
            iteratee.apply(context, arguments);
        });
    },

    /**
     * Traverse this tree iterating over all descendants of a node.
     * @param {Function} iteratee - Iteratee function
     * @param {string} parentId - Parent node id
     * @param {object} [context] - Context of iteratee
     */
    each: function(iteratee, parentId, context) {
        var stack, nodeId, node;

        node = this.getNode(parentId);
        if (!node) {
            return;
        }
        stack = node.getChildIds();

        context = context || this;
        while (stack.length) {
            nodeId = stack.pop();
            node = this.getNode(nodeId);
            iteratee.call(context, node, nodeId);

            util.pushAll(stack, node.getChildIds());
        }
    }
});

tui.util.CustomEvents.mixin(TreeModel);
module.exports = TreeModel;

},{"./treeNode":9,"./util":10}],9:[function(require,module,exports){
'use strict';

var states = require('./states').node,
    util = require('./util');

var lastIndex = 0,
    getNextIndex = function() {
        var index = lastIndex;
        lastIndex += 1;
        return index;
    },
    RESERVED_PROPERTIES = {
        id: '',
        state: 'setState'
    },
    inArray = tui.util.inArray;

/**
 * TreeNode
 * @Constructor TreeNode
 * @param {Object} nodeData - Node data
 * @param {string} [parentId] - Parent node id
 */
var TreeNode = tui.util.defineClass(/** @lends TreeNode.prototype */{ /*eslint-disable*/
    static: {
        setIdPrefix: function(prefix) {
            this.idPrefix = prefix || this.idPrefix;
        },
        idPrefix: ''
    },
    init: function(nodeData, parentId) { /*eslint-enable*/
        /**
         * Node id
         * @type {string}
         * @private
         */
        this._id = null;

        /**
         * Parent node id
         * @type {string}
         * @private
         */
        this._parentId = parentId;

        /**
         * Id list of children
         * @type {Array.<number>}
         * @private
         */
        this._childIds = [];

        /**
         * Node data
         * @type {object}
         * @private
         */
        this._data = {};

        /**
         * Node state
         * @type {string}
         * @private
         */
        this._state = states.CLOSED;

        this._stampId();
        this.setData(nodeData);
    },

    /**
     * Stamp node id
     * @private
     */
    _stampId: function() {
        this._id = this.constructor.idPrefix + getNextIndex();
    },

    /**
     * Set reserved properties from data
     * @param {object} data - Node data
     * @returns {object} Node data
     * @private
     */
    _setReservedProperties: function(data) {
        tui.util.forEachOwnProperties(RESERVED_PROPERTIES, function(setter, name) {
            var value = data[name];

            if (value && setter) {
                this[setter](value);
            }
            delete data[name];
        }, this);

        return data;
    },

    /**
     * Toggle state
     */
    toggleState: function() {
        if (this._state === states.CLOSED) {
            this._state = states.OPENED;
        } else {
            this._state = states.CLOSED;
        }
    },

    /**
     * Set state
     * @param {string} state - State of node ('closed', 'opened')
     */
    setState: function(state) {
        state += '';
        this._state = states[state.toUpperCase()] || this._state;
    },

    /**
     * Get state
     * @returns {string} state ('opened' or 'closed')
     */
    getState: function() {
        return this._state;
    },

    /**
     * Get id
     * @returns {string} Node id
     */
    getId: function() {
        return this._id;
    },

    /**
     * Get parent id
     * @returns {string} Parent node id
     */
    getParentId: function() {
        return this._parentId;
    },

    /**
     * Set parent id
     * @param {string} parentId - Parent node id
     */
    setParentId: function(parentId) {
        this._parentId = parentId;
    },

    /**
     * Replace childIds
     * @param {Array.<number>} childIds - Id list of children
     */
    replaceChildIds: function(childIds) {
        this._childIds = childIds;
    },

    /**
     * Get id list of children
     * @returns {Array.<number>} Id list of children
     */
    getChildIds: function() {
        return this._childIds.slice();
    },

    /**
     * Add child id
     * @param {string} id - Child node id
     */
    addChildId: function(id) {
        var childIds = this._childIds;

        if (tui.util.inArray(childIds, id) === -1) {
            childIds.push(id);
        }
    },

    /**
     * Remove child id
     * @param {string} id - Child node id
     */
    removeChildId: function(id) {
        util.removeItemFromArray(id, this._childIds);
    },

    /**
     * Get data
     * @param {string} name - Property name of data
     * @returns {*} Data
     */
    getData: function(name) {
        return this._data[name];
    },

    /**
     * Get all data
     * @returns {Object} Data
     */
    getAllData: function() {
        return tui.util.extend({}, this._data);
    },

    /**
     * Set data
     * @param {Object} data - Data for adding
     */
    setData: function(data) {
        data = this._setReservedProperties(data);
        tui.util.extend(this._data, data)
    },

    /**
     * Remove data
     * @param {...string} names - Names of data
     */
    removeData: function(names) {
        tui.util.forEachArray(arguments, function(name) {
            delete this._data[name];
        }, this);
    },

    /**
     * Return true if this node has a provided child id.
     * @param {string} id - Node id
     * @returns {boolean} - Whether this node has a provided child id.
     */
    hasChild: function(id) {
        return inArray(id, this._childIds) !== -1;
    },

    /**
     * Return whether this node is leaf.
     * @returns {boolean} Node is leaf or not.
     */
    isLeaf: function() {
        return this._childIds.length === 0;
    },

    /**
     * Return whether this node is root.
     * @returns {boolean} Node is root or not.
     */
    isRoot: function() {
        return tui.util.isFalsy(this._parentId);
    }
});
module.exports = TreeNode;

},{"./states":6,"./util":10}],10:[function(require,module,exports){
/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */
'use strict';
var div = document.createElement('div');

var util = {
    /**
     * Push all elements from new array
     * @param {Array} arr1 - Base array
     * @param {Array} arr2 - New array
     */
    pushAll: function(arr1, arr2) {
        var length = arr2.length,
            i = 0;

        for (; i < length; i += 1) {
            arr1.push(arr2[i]);
        }
    },

    /**
     * Remove first specified item from array, if it exists
     * @param {*} item Item to look for
     * @param {Array} arr Array to query
     */
    removeItemFromArray: function(item, arr) {
        var index = tui.util.inArray(item, arr);

        if (index > -1) {
            arr.splice(index, 1);
        }
    },

    /**
     * Add classname
     * @param {HTMLElement} element - Target element
     * @param {string} className - Classname
     */
    addClass: function(element, className) {
        if (!element) {
            return;
        }

        if (element.className === '') {
            element.className = className;
        } else if (!util.hasClass(element, className)) {
            element.className += ' ' + className;
        }
    },

    /**
     * Remove classname
     * @param {HTMLElement} element - Target element
     * @param {string} className - Classname
     */
    removeClass: function(element, className) {
        var originalClassName = util.getClass(element),
            arr, index;

        if (!originalClassName) {
            return;
        }

        arr = originalClassName.split(' ');
        index = tui.util.inArray(className, arr);
        if (index !== -1) {
            arr.splice(index, 1);
            element.className = arr.join(' ');
        }
    },


    /**
     * Add event to element
     * @param {Object} element A target element
     * @param {String} eventName A name of event 
     * @param {Function} handler A callback function to add
     */
    addEventListener: function(element, eventName, handler) {
        if (element.addEventListener) {
            element.addEventListener(eventName, handler, false);
        } else {
            element.attachEvent('on' + eventName, handler);
        }
    },

    /**
     * Remove event from element
     * @param {Object} element A target element
     * @param {String} eventName A name of event
     * @param {Function} handler A callback function to remove
     */
    removeEventListener: function(element, eventName, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(eventName, handler, false);
        } else {
            element.detachEvent('on' + eventName, handler);
        }
    },

    /**
     * Get target element
     * @param {Event} e Event object
     * @return {HTMLElement} Event target
     */
    getTarget: function(e) {
        var target;
        e = e || window.event;
        target = e.target || e.srcElement;
        return target;
    },

    /**
     * Get class name
     * @param {HTMLElement} element HTMLElement
     * @returns {string} Class name
     */
    getClass: function(element) {
        return element && element.getAttribute && (element.getAttribute('class') || '');
    },

    /**
     * Check the element has specific class or not
     * @param {HTMLElement} element A target element
     * @param {string} className A name of class to find
     * @return {boolean} Whether the element has the class
     */
    hasClass: function(element, className) {
        var elClassName = util.getClass(element);

        return elClassName.indexOf(className) > -1;
    },

    /**
     * Find element by class name
     * @param {HTMLElement} target A target element
     * @param {string} className A name of class
     * @return {Array.<HTMLElement>} Elements
     */
    getElementsByClassName: function(target, className) {
        var all, filtered;

        if (target.querySelectorAll) {
            filtered = target.querySelectorAll('.' + className);
        } else {
            all = target.getElementsByTagName('*');
            filtered = tui.util.filter(all, function(el) {
                var classNames = el.className || '';
                return (classNames.indexOf(className) !== -1)
            });
        }

        return filtered;
    },

    /**
     * Check whether the click event by right button
     * @param {MouseEvent} event Event object
     * @return {boolean} Whether the click event by right button
     */
    isRightButton: function(event) {
        return util._getButton(event) === 2;
    },

    /**
     * Whether the property exist or not
     * @param {Array} props A property
     * @return {string|boolean} Property name or false
     * @example
     * var userSelectProperty = util.testProp([
     *     'userSelect',
     *     'WebkitUserSelect',
     *     'OUserSelect',
     *     'MozUserSelect',
     *     'msUserSelect'
     * ]);
     */
    testProp: function(props) {
        var style = document.documentElement.style,
            propertyName = false;

        tui.util.forEach(props, function(prop) {
            if (prop in style) {
                propertyName = prop;
                return false;
            }
        });
        return propertyName;
    },

    /**
     * Prevent default event 
     * @param {Event} event Event object
     */
    preventDefault: function(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    },

    /**
     * Make html from template
     * @param {string} source - Template html
     * @param {Object} props - Template data
     * @returns {string} html
     */
    template: function(source, props) {
        return source.replace(/\{\{(\w+)}}/gi, function(match, name) {
            var value = props[name];
            if (tui.util.isFalsy(value)) {
                return '';
            }
            return value;
        });
    },

    /**
     * Normalization for event button property 
     * 0: First mouse button, 2: Second mouse button, 1: Center button
     * @param {MouseEvent} event Event object
     * @return {number|undefined} button type
     * @private
     */
    _getButton: function(event) {
        var button,
            primary = '0,1,3,5,7',
            secondary = '2,6',
            wheel = '4';

        if (document.implementation.hasFeature('MouseEvents', '2.0')) {
            return event.button;
        }

        button = event.button + '';
        if (primary.indexOf(button) > -1) {
            return 0;
        } else if (secondary.indexOf(button) > -1) {
            return 2;
        } else if (wheel.indexOf(button) > -1) {
            return 1;
        }
    }
};

module.exports = util;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9kZWZhdWx0cy5qcyIsInNyYy9qcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZWRpdGFibGUuanMiLCJzcmMvanMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy9zdGF0ZXMuanMiLCJzcmMvanMvdHJlZS5qcyIsInNyYy9qcy90cmVlTW9kZWwuanMiLCJzcmMvanMvdHJlZU5vZGUuanMiLCJzcmMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInR1aS51dGlsLmRlZmluZU5hbWVzcGFjZSgndHVpLmNvbXBvbmVudC5UcmVlJywgcmVxdWlyZSgnLi9zcmMvanMvdHJlZScpKTtcbiIsIi8qKlxuICogQSBkZWZhdWx0IHZhbHVlcyBmb3IgdHJlZVxuICogQG1vZHVsZSBkZWZhdWx0c1xuICovXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWFrZSBjbGFzcyBuYW1lc1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIFByZWZpeCBvZiBjbGFzcyBuYW1lXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBrZXlzIC0gS2V5cyBvZiBjbGFzcyBuYW1lc1xuICogQHJldHVybnMge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBDbGFzc25hbWVzIG1hcFxuICovXG5mdW5jdGlvbiBtYWtlQ2xhc3NOYW1lcyhwcmVmaXgsIGtleXMpIHtcbiAgICB2YXIgb2JqID0ge307XG4gICAgdHVpLnV0aWwuZm9yRWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgb2JqW2tleSArICdDbGFzcyddID0gcHJlZml4ICsga2V5O1xuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogQGNvbnN0XG4gKiBAdHlwZSB7b2JqZWN0fVxuICogQHByb3BlcnR5IHtib29sZWFufSB1c2VEcmFnIC0gRGVmYXVsdDogZmFsc2VcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdXNlSGVscGVyIC0gRGVmYXVsdDogZmFsc2VcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBzdGF0ZUxhYmVsIC0gU3RhdGUgbGFiZWwgaW4gbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0ZUxhYmVsLm9wZW5lZCAtIERlZmF1bHQ6ICctJ1xuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0ZUxhYmVsLmNsb3NlZCAtIERlZmF1bHQ6ICcrJ1xuICogQHByb3BlcnR5IHtvYmplY3R9IHRlbXBsYXRlIC0gVGVtcGxhdGUgaHRtbCBmb3IgdGhlIG5vZGVzLlxuICogQHByb3BlcnR5IHtvYmplY3R9IGNsYXNzTmFtZXMgLSBDbGFzcyBuYW1lcyBvZiBlbGVtZW50cyBpbiB0cmVlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBvcGVuZWRDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3Igb3BlbmVkIG5vZGVcbiAqICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IGNsb3NlZENsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciBjbG9zZWQgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gc2VsZWN0ZWRDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3Igc2VsZWN0ZWQgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gc3VidHJlZUNsYXNzICAtIEEgY2xhc3MgbmFtZSBmb3Igc3VidHJlZSBpbiBpbnRlcm5hbCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSB0b2dnbGVDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3IgdG9nZ2xlIGJ1dHRvbiBpbiBpbnRlcm5hbCBub2RlXG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSB0aXRsZUNsYXNzIC0gQSBjbGFzcyBuYW1lIGZvciB0aXRsZSBlbGVtZW50IGluIGEgbm9kZVxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gaW5wdXRDbGFzcyAtIEEgY2xhc3MgbmFtZSBmb3IgZWRpdGFibGUgZWxlbWVudCBpbiBhIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUuaW50ZXJuYWxOb2RlIC0gQSB0ZW1wbGF0ZSBodG1sIGZvciBpbnRlcm5hbCBub2RlLlxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZW1wbGF0ZS5sZWFmTm9kZSAtIEEgdGVtcGxhdGUgaHRtbCBmb3IgbGVhZiBub2RlLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcbiAgICBzdGF0ZUxhYmVsczoge1xuICAgICAgICBvcGVuZWQ6ICctJyxcbiAgICAgICAgY2xvc2VkOiAnKydcbiAgICB9LFxuICAgIG5vZGVJZFByZWZpeDogJ3R1aS10cmVlLW5vZGUtJyxcbiAgICBjbGFzc05hbWVzOiBtYWtlQ2xhc3NOYW1lcygndHVpLXRyZWUtJywgW1xuICAgICAgICAnb3BlbmVkJyxcbiAgICAgICAgJ2Nsb3NlZCcsXG4gICAgICAgICdzZWxlY3RlZCcsXG4gICAgICAgICdzdWJ0cmVlJyxcbiAgICAgICAgJ3RvZ2dsZUJ0bicsXG4gICAgICAgICd0ZXh0JyxcbiAgICAgICAgJ2lucHV0J1xuICAgIF0pLFxuICAgIHRlbXBsYXRlOiB7XG4gICAgICAgIGludGVybmFsTm9kZTpcbiAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwidHVpLXRyZWUtbm9kZSB7e3N0YXRlQ2xhc3N9fVwiPicgK1xuICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3tzdGF0ZUxhYmVsfX08L2J1dHRvbj4nICtcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e3N1YnRyZWVDbGFzc319XCI+e3tjaGlsZHJlbn19PC91bD4nICtcbiAgICAgICAgJzwvbGk+JyxcbiAgICAgICAgbGVhZk5vZGU6XG4gICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInR1aS10cmVlLW5vZGUgdHVpLXRyZWUtbGVhZlwiPicgK1xuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICAgICAgICAnPC9saT4nXG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbnZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgdXNlSGVscGVyOiB0cnVlLFxuICAgICAgICBoZWxwZXJQb3M6IHtcbiAgICAgICAgICAgIHk6IDIsXG4gICAgICAgICAgICB4OiA1XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlamVjdGVkVGFnTmFtZXMgPSBbXG4gICAgICAgICdJTlBVVCcsXG4gICAgICAgICdCVVRUT04nLFxuICAgICAgICAnVUwnXG4gICAgXSxcbiAgICBpbkFycmF5ID0gdHVpLnV0aWwuaW5BcnJheTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgZHJhZ2dhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9uc1xuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VIZWxwZXIgLSBVc2luZyBoZWxwZXIgZmxhZ1xuICogIEBwYXJhbSB7e3g6IG51bWJlciwgeTpudW1iZXJ9fSBvcHRpb25zLmhlbHBlclBvcyAtIEhlbHBlciBwb3NpdGlvblxuICogIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG9wdGlvbnMucmVqZWN0ZWRUYWdOYW1lcyAtIE5vIGRyYWdnYWJsZSB0YWcgbmFtZXNcbiAqICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkQ2xhc3NOYW1lcyAtIE5vIGRyYWdnYWJsZSBjbGFzcyBuYW1lc1xuICovXG52YXIgRHJhZ2dhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBEcmFnZ2FibGUucHJvdG90eXBlICove1xuICAgIC8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5zZXRNZW1iZXJzKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmF0dGFjaE1vdXNlZG93bigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbWVtYmVycyBvZiB0aGlzIG1vZHVsZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gaW5wdXQgb3B0aW9uc1xuICAgICAqL1xuICAgIHNldE1lbWJlcnM6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBoZWxwZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpLFxuICAgICAgICAgICAgc3R5bGUgPSBoZWxwZXJFbGVtZW50LnN0eWxlO1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy51c2VIZWxwZXIgPSBvcHRpb25zLnVzZUhlbHBlcjtcbiAgICAgICAgdGhpcy5oZWxwZXJQb3MgPSBvcHRpb25zLmhlbHBlclBvcztcbiAgICAgICAgdGhpcy5yZWplY3RlZFRhZ05hbWVzID0gcmVqZWN0ZWRUYWdOYW1lcy5jb25jYXQob3B0aW9ucy5yZWplY3RlZFRhZ05hbWVzKTtcbiAgICAgICAgdGhpcy5yZWplY3RlZENsYXNzTmFtZXMgPSBbXS5jb25jYXQob3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMpO1xuICAgICAgICB0aGlzLmRlZmF1bHRQb3NpdGlvbiA9IHRyZWUucm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudCA9IGhlbHBlckVsZW1lbnQ7XG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5ID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZSA9IG51bGw7XG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICAgICAgICB0aGlzLmhhbmRsZXJzLm1vdXNlbW92ZSA9IHR1aS51dGlsLmJpbmQodGhpcy5vbk1vdXNlbW92ZSwgdGhpcyk7XG4gICAgICAgIHRoaXMuaGFuZGxlcnMubW91c2V1cCA9IHR1aS51dGlsLmJpbmQodGhpcy5vbk1vdXNldXAsIHRoaXMpO1xuXG4gICAgICAgIHN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdGhpcy50cmVlLnJvb3RFbGVtZW50LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoaGVscGVyRWxlbWVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBtb3VzZSBkb3duIGV2ZW50XG4gICAgICovXG4gICAgYXR0YWNoTW91c2Vkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBzZWxlY3RLZXksIHN0eWxlO1xuXG4gICAgICAgIGlmICgnb25zZWxlY3RzdGFydCcgaW4gZG9jdW1lbnQpIHtcbiAgICAgICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0cmVlLnJvb3RFbGVtZW50LCAnc2VsZWN0c3RhcnQnLCB1dGlsLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlO1xuICAgICAgICAgICAgc2VsZWN0S2V5ID0gdXRpbC50ZXN0UHJvcChbJ3VzZXJTZWxlY3QnLCAnV2Via2l0VXNlclNlbGVjdCcsICdPVXNlclNlbGVjdCcsICdNb3pVc2VyU2VsZWN0JywgJ21zVXNlclNlbGVjdCddKTtcblxuICAgICAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkgPSBzZWxlY3RLZXk7XG4gICAgICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlID0gc3R5bGVbc2VsZWN0S2V5XTtcbiAgICAgICAgICAgIHN0eWxlW3NlbGVjdEtleV0gPSAnbm9uZSc7XG4gICAgICAgIH1cblxuICAgICAgICB0cmVlLm9uKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2Vkb3duLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhlIHRhcmdldCBlbGVtZW50IGlzIGluIHJlamVjdGVkVGFnTmFtZXMgb3IgaW4gcmVqZWN0ZWRDbGFzc05hbWVzXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdGFyZ2V0IGlzIG5vdCBkcmFnZ2FibGUgb3IgZHJhZ2dhYmxlXG4gICAgICovXG4gICAgaXNOb3REcmFnZ2FibGU6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICB2YXIgdGFnTmFtZSA9IHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICBjbGFzc05hbWVzID0gdXRpbC5nZXRDbGFzcyh0YXJnZXQpLnNwbGl0KCcgJyksXG4gICAgICAgICAgICByZXN1bHQ7XG5cbiAgICAgICAgaWYgKGluQXJyYXkodGFnTmFtZSwgdGhpcy5yZWplY3RlZFRhZ05hbWVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChjbGFzc05hbWVzLCBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGluQXJyYXkoY2xhc3NOYW1lLCB0aGlzLnJlamVjdGVkQ2xhc3NOYW1lcykgIT09IC0xO1xuICAgICAgICAgICAgcmV0dXJuICFyZXN1bHQ7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZWRvd25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbk1vdXNlZG93bjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZDtcblxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSB8fCB0aGlzLmlzTm90RHJhZ2dhYmxlKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1dGlsLnByZXZlbnREZWZhdWx0KGV2ZW50KTtcblxuICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbm9kZUlkO1xuICAgICAgICBpZiAodGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SGVscGVyKHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlcnMubW91c2Vtb3ZlKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2V1cCcsIHRoaXMuaGFuZGxlcnMubW91c2V1cCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZW1vdmVcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbk1vdXNlbW92ZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGhlbHBlckVsID0gdGhpcy5oZWxwZXJFbGVtZW50LFxuICAgICAgICAgICAgcG9zID0gdGhpcy5kZWZhdWx0UG9zaXRpb247XG4gICAgICAgIGlmICghdGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlbHBlckVsLnN0eWxlLmxlZnQgPSBldmVudC5jbGllbnRYIC0gcG9zLmxlZnQgKyB0aGlzLmhlbHBlclBvcy54ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUudG9wID0gZXZlbnQuY2xpZW50WSAtIHBvcy50b3AgKyB0aGlzLmhlbHBlclBvcy55ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2V1cFxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2V1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRyZWUubW92ZSh0aGlzLmN1cnJlbnROb2RlSWQsIG5vZGVJZCk7XG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5oYW5kbGVycy5tb3VzZW1vdmUpO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5oYW5kbGVycy5tb3VzZXVwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGhlbHBlciBjb250ZW50c1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gSGVscGVyIGNvbnRlbnRzXG4gICAgICovXG4gICAgc2V0SGVscGVyOiBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudC5pbm5lckhUTUwgPSB0ZXh0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXRhY2ggbW91c2Vkb3duIGV2ZW50XG4gICAgICovXG4gICAgZGV0YWNoTW91c2Vkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdHJlZS5vZmYodGhpcyk7XG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0cmVlLnJvb3RFbGVtZW50LCAnc2VsZWN0c3RhcnQnLCB1dGlsLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgaWYgKHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGVbdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXldID0gdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZGV0YWNoTW91c2Vkb3duKCk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ2dhYmxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgZWRpdGFibGUgZWxlbWVudFxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmRhdGFLZXkgLSBLZXkgb2Ygbm9kZSBkYXRhIHRvIHNldCB2YWx1ZVxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmlucHV0Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGlucHV0IGVsZW1lbnRcbiAqL1xudmFyIEVkaXRhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBTZWxlY3Rpb25Nb2R1bGUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSA9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuZGF0YUtleSA9IG9wdGlvbnMuZGF0YUtleTtcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQgPSB0aGlzLmNyZWF0ZUlucHV0RWxlbWVudChvcHRpb25zLmlucHV0Q2xhc3NOYW1lKTtcbiAgICAgICAgdGhpcy5ib3VuZE9uS2V5dXAgPSB0dWkudXRpbC5iaW5kKHRoaXMub25LZXl1cCwgdGhpcyk7XG4gICAgICAgIHRoaXMuYm91bmRPbkJsdXIgPSB0dWkudXRpbC5iaW5kKHRoaXMub25CbHVyLCB0aGlzKTtcblxuICAgICAgICB0cmVlLm9uKCdkb3VibGVDbGljaycsIHRoaXMub25Eb3VibGVDbGljaywgdGhpcyk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2tleXVwJywgdGhpcy5ib3VuZE9uS2V5dXApO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdibHVyJywgdGhpcy5ib3VuZE9uQmx1cik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGFjaCBpbnB1dCBlbGVtZW50IGZyb20gZG9jdW1lbnRcbiAgICAgKi9cbiAgICBkZXRhY2hJbnB1dEZyb21Eb2N1bWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dEVsID0gdGhpcy5pbnB1dEVsZW1lbnQsXG4gICAgICAgICAgICBwYXJlbnROb2RlID0gaW5wdXRFbC5wYXJlbnROb2RlO1xuXG4gICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlucHV0RWwpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5kZXRhY2hJbnB1dEZyb21Eb2N1bWVudCgpO1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdrZXl1cCcsIHRoaXMuYm91bmRPbktleXVwKTtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAnYmx1cicsIHRoaXMuYm91bmRPbkJsdXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dENsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBpbnB1dCBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBJbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgY3JlYXRlSW5wdXRFbGVtZW50OiBmdW5jdGlvbihpbnB1dENsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTlBVVCcpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBpbnB1dENsYXNzTmFtZTtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwic2luZ2xlQ2xpY2tcIlxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgaW5wdXRFbGVtZW50LCBub2RlSWQ7XG5cbiAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmVkaXRhYmxlQ2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgbm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQgPSB0aGlzLmlucHV0RWxlbWVudDtcbiAgICAgICAgICAgIGlucHV0RWxlbWVudC52YWx1ZSA9IHRyZWUuZ2V0Tm9kZURhdGEobm9kZUlkKVt0aGlzLmRhdGFLZXldIHx8ICcnO1xuICAgICAgICAgICAgdGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGlucHV0RWxlbWVudCwgdGFyZ2V0KTtcbiAgICAgICAgICAgIHRhcmdldC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgaW5wdXRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGtleXVwIC0gaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gS2V5IGV2ZW50XG4gICAgICovXG4gICAgb25LZXl1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgIT09IDEzKSB7IC8vIElmIG5vdCBlbnRlclxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0RGF0YSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gYmx1ciAtIGlucHV0IGVsZW1lbnRcbiAgICAgKi9cbiAgICBvbkJsdXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldERhdGEoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgb2YgaW5wdXQgZWxlbWVudCB0byBub2RlIGFuZCBkZXRhY2ggaW5wdXQgZWxlbWVudCBmcm9tIGRvYy5cbiAgICAgKi9cbiAgICBzZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGhpcy5pbnB1dEVsZW1lbnQpLFxuICAgICAgICAgICAgZGF0YSA9IHt9O1xuXG4gICAgICAgIGlmIChub2RlSWQpIHtcbiAgICAgICAgICAgIGRhdGFbdGhpcy5kYXRhS2V5XSA9IHRoaXMuaW5wdXRFbGVtZW50LnZhbHVlO1xuICAgICAgICAgICAgdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGV0YWNoSW5wdXRGcm9tRG9jdW1lbnQoKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0YWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBzZWxlY3RhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqL1xudmFyIFNlbGVjdGFibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFNlbGVjdGlvbk1vZHVsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lID0gdHJlZS5jbGFzc05hbWVzLnNlbGVjdGVkQ2xhc3M7XG4gICAgICAgIHRoaXMudHJlZS5vbignc2luZ2xlQ2xpY2snLCB0aGlzLm9uU2luZ2xlQ2xpY2ssIHRoaXMpO1xuICAgICAgICB0aGlzLnRyZWUub24oJ2RvdWJsZUNsaWNrJywgdGhpcy5vblNpbmdsZUNsaWNrLCB0aGlzKTtcbiAgICAgICAgdGhpcy50cmVlLm9uKCdhZnRlckRyYXcnLCB0aGlzLm9uQWZ0ZXJEcmF3LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSB0aGlzIG1vZHVsZVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZUVsZW1lbnQgPSB0aGlzLmdldFByZXZFbGVtZW50KCk7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Mobm9kZUVsZW1lbnQsIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciBcInNpbmdsZUNsaWNrXCJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvblNpbmdsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KSxcbiAgICAgICAgICAgIHByZXZFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpLFxuICAgICAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpLFxuICAgICAgICAgICAgc2VsZWN0ZWRDbGFzc05hbWUgPSB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lO1xuXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MocHJldkVsZW1lbnQsIHNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgc2VsZWN0ZWRDbGFzc05hbWUpO1xuXG4gICAgICAgIHRyZWUuZmlyZSgnc2VsZWN0Jywgbm9kZUlkKTtcbiAgICAgICAgdGhpcy5wcmV2Tm9kZUlkID0gbm9kZUlkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBOb2RlIGVsZW1lbnRcbiAgICAgKi9cbiAgICBnZXRQcmV2RWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLnByZXZOb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciAtIFwiYWZ0ZXJEcmF3XCJcbiAgICAgKi9cbiAgICBvbkFmdGVyRHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMucHJldk5vZGVJZCk7XG5cbiAgICAgICAgaWYgKG5vZGVFbGVtZW50KSB7XG4gICAgICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdGFibGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgU3RhdGVzIGluIHRyZWVcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogU3RhdGVzIGluIHRyZWVcbiAqIEBtb2R1bGUgc3RhdGVzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIFN0YXRlcyBvZiBub2RlXG4gICAgICogQHR5cGUge3tPUEVORUQ6IHN0cmluZywgQ0xPU0VEOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIG5vZGU6IHtcbiAgICAgICAgT1BFTkVEOiAnb3BlbmVkJyxcbiAgICAgICAgQ0xPU0VEOiAnY2xvc2VkJ1xuICAgIH1cbn07XG4iLCIvKipcclxuICogQGZpbGVvdmVydmlldyBSZW5kZXIgdHJlZSBhbmQgdXBkYXRlIHRyZWUuXHJcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuL2RlZmF1bHRzJyksXHJcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXHJcbiAgICBzdGF0ZXMgPSByZXF1aXJlKCcuL3N0YXRlcycpLFxyXG4gICAgVHJlZU1vZGVsID0gcmVxdWlyZSgnLi90cmVlTW9kZWwnKSxcclxuICAgIFNlbGVjdGFibGUgPSByZXF1aXJlKCcuL3NlbGVjdGFibGUnKSxcclxuICAgIERyYWdnYWJsZSA9IHJlcXVpcmUoJy4vZHJhZ2dhYmxlJyksXHJcbiAgICBFZGl0YWJsZSA9IHJlcXVpcmUoJy4vZWRpdGFibGUnKTtcclxuXHJcbnZhciBub2RlU3RhdGVzID0gc3RhdGVzLm5vZGUsXHJcbiAgICBmZWF0dXJlcyA9IHtcclxuICAgICAgICBTZWxlY3RhYmxlOiBTZWxlY3RhYmxlLFxyXG4gICAgICAgIERyYWdnYWJsZTogRHJhZ2dhYmxlLFxyXG4gICAgICAgIEVkaXRhYmxlOiBFZGl0YWJsZVxyXG4gICAgfSxcclxuICAgIHNuaXBwZXQgPSB0dWkudXRpbCxcclxuICAgIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kO1xyXG4vKipcclxuICogQ3JlYXRlIHRyZWUgbW9kZWwgYW5kIGluamVjdCBkYXRhIHRvIG1vZGVsXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBBIGRhdGEgdG8gYmUgdXNlZCBvbiB0cmVlXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zXHJcbiAqICAgICBAcGFyYW0ge0hUTUxFbGVtZW50fSBbb3B0aW9ucy5yb290RWxlbWVudF0gUm9vdCBlbGVtZW50IChJdCBzaG91bGQgYmUgJ1VMJyBlbGVtZW50KVxyXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLm5vZGVJZFByZWZpeF0gQSBkZWZhdWx0IHByZWZpeCBvZiBhIG5vZGVcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5ub2RlRGVmYXVsdFN0YXRlXSBBIGRlZmF1bHQgc3RhdGUgb2YgYSBub2RlXHJcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMudGVtcGxhdGVdIEEgbWFya3VwIHNldCB0byBtYWtlIGVsZW1lbnRcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGUuaW50ZXJuYWxOb2RlXSBIVE1MIHRlbXBsYXRlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlLmxlYWZOb2RlXSBIVE1MIHRlbXBsYXRlXHJcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuc3RhdGVMYWJlbHNdIFRvZ2dsZSBidXR0b24gc3RhdGUgbGFiZWxcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhdGVMYWJlbHMub3BlbmVkXSBTdGF0ZS1PUEVORUQgbGFiZWwgKFRleHQgb3IgSFRNTClcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhdGVMYWJlbHMuY2xvc2VkXSBTdGF0ZS1DTE9TRUQgbGFiZWwgKFRleHQgb3IgSFRNTClcclxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5jbGFzc05hbWVzXSBDbGFzcyBuYW1lcyBmb3IgdHJlZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLm9wZW5lZENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIG9wZW5lZCBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuY2xvc2VkQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgY2xvc2VkIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5zZWxlY3RlZENsYXNzXSBBIGNsYXNzIG5hbWUgdG8gc2VsZWN0ZWQgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnRleHRDbGFzc10gQSBjbGFzcyBuYW1lIHRoYXQgZm9yIHRleHRFbGVtZW50IGluIG5vZGVcclxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5pbnB1dENsYXNzXSBBIGNsYXNzIGlucHV0IGVsZW1lbnQgaW4gYSBub2RlXHJcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuc3VidHJlZUNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIHN1YnRyZWUgaW4gaW50ZXJuYWwgbm9kZVxyXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIHRvZ2dsZSBidXR0b24gaW4gaW50ZXJuYWwgbm9kZVxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL0RlZmF1bHQgb3B0aW9uc1xyXG4gKiAvLyAgIC0gSFRNTCBURU1QTEFURVxyXG4gKiAvLyAgICAgICAtIFRoZSBwcmVmaXggXCJkX1wiIHJlcHJlc2VudHMgdGhlIGRhdGEgb2YgZWFjaCBub2RlLlxyXG4gKiAvLyAgICAgICAtIFRoZSBcImRfY2hpbGRyZW5cIiB3aWxsIGJlIGNvbnZlcnRlZCB0byBIVE1MLXRlbXBsYXRlXHJcbiAqIC8vXHJcbiAqIC8vIHtcclxuICogLy8gICAgIHJvb3RFbGVtZW50OiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdVTCcpLFxyXG4gKiAvLyAgICAgbm9kZUlkUHJlZml4OiAndHVpLXRyZWUtbm9kZS0nXHJcbiAqIC8vICAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcclxuICogLy8gICAgIHN0YXRlTGFiZWxzOiB7XHJcbiAqIC8vICAgICAgICAgb3BlbmVkOiAnLScsXHJcbiAqIC8vICAgICAgICAgY2xvc2VkOiAnKydcclxuICogLy8gICAgIH0sXHJcbiAqIC8vICAgICBjbGFzc05hbWVzOiB7XHJcbiAqIC8vICAgICAgICAgb3BlbmVkQ2xhc3M6ICd0dWktdHJlZS1vcGVuZWQnLFxyXG4gKiAvLyAgICAgICAgIGNsb3NlZENsYXNzOiAndHVpLXRyZWUtY2xvc2VkJyxcclxuICogLy8gICAgICAgICBzZWxlY3RlZENsYXNzOiAndHVpLXRyZWUtc2VsZWN0ZWQnLFxyXG4gKiAvLyAgICAgICAgIHN1YnRyZWVDbGFzczogJ3R1aS10cmVlLXN1YnRyZWUnLFxyXG4gKiAvLyAgICAgICAgIHRvZ2dsZUJ0bkNsYXNzOiAndHVpLXRyZWUtdG9nZ2xlQnRuJyxcclxuICogLy8gICAgICAgICB0ZXh0Q2xhc3M6ICd0dWktdHJlZS10ZXh0JyxcclxuICogLy8gICAgICAgICBpdXB1dENsYXNzOiAndHVpLXRyZWUtaW5wdXQnXHJcbiAqIC8vICAgICB9LFxyXG4gKiAvL1xyXG4gKiAvLyAgICAgdGVtcGxhdGU6IHtcclxuICogLy8gICAgICAgICBpbnRlcm5hbE5vZGU6XHJcbiAqIC8vICAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwidHVpLXRyZWUtbm9kZSB7e3N0YXRlQ2xhc3N9fVwiIGRhdGEtbm9kZS1pZD1cInt7aWR9fVwiPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXHJcbiAqIC8vICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e3N1YnRyZWVDbGFzc319XCI+e3tjaGlsZHJlbn19PC91bD4nICtcclxuICogLy8gICAgICAgICAnPC9saT4nLFxyXG4gKiAvLyAgICAgICAgIGxlYWZOb2RlOlxyXG4gKiAvLyAgICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInR1aS10cmVlLW5vZGUgdHVpLXRyZWUtbGVhZlwiIGRhdGEtbm9kZS1pZD1cInt7aWR9fVwiPicgK1xyXG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXHJcbiAqIC8vICAgICAgICAgJzwvbGk+J1xyXG4gKiAvLyAgICAgfVxyXG4gKiAvLyB9XHJcbiAqIC8vXHJcbiAqXHJcbiAqIHZhciBkYXRhID0gW1xyXG4gKiAgICAge3RpdGxlOiAncm9vdEEnLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMUEnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTFCJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0xQyd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMUQnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTJBJywgY2hpbGRyZW46IFtcclxuICogICAgICAgICAgICAge3RpdGxlOidzdWJfMUEnLCBjaGlsZHJlbjpbXHJcbiAqICAgICAgICAgICAgICAgICB7dGl0bGU6J3N1Yl9zdWJfMUEnfVxyXG4gKiAgICAgICAgICAgICBdfSxcclxuICogICAgICAgICAgICAge3RpdGxlOidzdWJfMkEnfVxyXG4gKiAgICAgICAgIF19LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMkInfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTJDJ30sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0yRCd9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtM0EnLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgICAgICB7dGl0bGU6J3N1YjNfYSd9LFxyXG4gKiAgICAgICAgICAgICB7dGl0bGU6J3N1YjNfYid9XHJcbiAqICAgICAgICAgXX0sXHJcbiAqICAgICAgICAge3RpdGxlOiAncm9vdC0zQid9LFxyXG4gKiAgICAgICAgIHt0aXRsZTogJ3Jvb3QtM0MnfSxcclxuICogICAgICAgICB7dGl0bGU6ICdyb290LTNEJ31cclxuICogICAgIF19LFxyXG4gKiAgICAge3RpdGxlOiAncm9vdEInLCBjaGlsZHJlbjogW1xyXG4gKiAgICAgICAgIHt0aXRsZTonQl9zdWIxJ30sXHJcbiAqICAgICAgICAge3RpdGxlOidCX3N1YjInfSxcclxuICogICAgICAgICB7dGl0bGU6J2InfVxyXG4gKiAgICAgXX1cclxuICogXTtcclxuICpcclxuICogdmFyIHRyZWUxID0gbmV3IHR1aS5jb21wb25lbnQuVHJlZShkYXRhLCB7XHJcbiAqICAgICByb290RWxlbWVudDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyZWVSb290JyksXHJcbiAqICAgICBub2RlRGVmYXVsdFN0YXRlOiAnb3BlbmVkJ1xyXG4gKiB9KTtcclxuICoqL1xyXG52YXIgVHJlZSA9IHNuaXBwZXQuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXHJcbiAgICBzdGF0aWM6IHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAbWVtYmVyT2YgVHJlZVxyXG4gICAgICAgICAqIEBzdGF0aWNcclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbW9kdWxlTmFtZSAtIE1vZHVsZSBuYW1lXHJcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IG1vZHVsZSAtIE1vZHVsZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHJlZ2lzdGVyRmVhdHVyZTogZnVuY3Rpb24obW9kdWxlTmFtZSwgbW9kdWxlKSB7XHJcbiAgICAgICAgICAgIGlmIChtb2R1bGUpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mZWF0dXJlc1ttb2R1bGVOYW1lXSA9IG1vZHVsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRyZWUgZmVhdHVyZXNcclxuICAgICAgICAgKi9cclxuICAgICAgICBmZWF0dXJlczoge31cclxuICAgIH0sXHJcbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXHJcbiAgICAgICAgdmFyIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kO1xyXG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCBjbGFzcyBuYW1lc1xyXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNsYXNzTmFtZXMgPSBleHRlbmQoe30sIGRlZmF1bHRzLmNsYXNzTmFtZXMsIG9wdGlvbnMuY2xhc3NOYW1lcyk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERlZmF1bHQgdGVtcGxhdGVcclxuICAgICAgICAgKiBAdHlwZSB7e2ludGVybmFsTm9kZTogc3RyaW5nLCBsZWFmTm9kZTogc3RyaW5nfX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRlbXBsYXRlID0gZXh0ZW5kKHt9LCBkZWZhdWx0cy50ZW1wbGF0ZSwgb3B0aW9ucy50ZW1wbGF0ZSk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJvb3QgZWxlbWVudFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gb3B0aW9ucy5yb290RWxlbWVudDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxyXG4gICAgICAgICAqIEB0eXBlIHt7b3BlbmVkOiBzdHJpbmcsIGNsb3NlZDogc3RyaW5nfX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN0YXRlTGFiZWxzID0gb3B0aW9ucy5zdGF0ZUxhYmVscztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogTWFrZSB0cmVlIG1vZGVsXHJcbiAgICAgICAgICogQHR5cGUge1RyZWVNb2RlbH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFRyZWVNb2RlbChkYXRhLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRW5hYmxlZCBmZWF0dXJlc1xyXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgb2JqZWN0Pn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmVuYWJsZWRGZWF0dXJlcyA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLl9zZXRSb290KCk7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKCk7XHJcbiAgICAgICAgdGhpcy5fc2V0RXZlbnRzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHJvb3QgZWxlbWVudCBvZiB0cmVlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc2V0Um9vdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHJvb3RFbCA9IHRoaXMucm9vdEVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmICghc25pcHBldC5pc0hUTUxOb2RlKHJvb3RFbCkpIHtcclxuICAgICAgICAgICAgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1VMJyk7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdEVsKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTW92ZSBldmVudCBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9yaWdpbmFsUGFyZW50SWQgLSBPcmlnaW5hbCBwYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25Nb3ZlOiBmdW5jdGlvbihub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkKSB7XHJcbiAgICAgICAgdGhpcy5fZHJhd0NoaWxkcmVuKG9yaWdpbmFsUGFyZW50SWQpO1xyXG4gICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbihuZXdQYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGV2ZW50IGhhbmRsZXJzXHJcbiAgICAgKi9cclxuICAgIF9zZXRFdmVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwub24oJ3VwZGF0ZScsIHRoaXMuX2RyYXdDaGlsZHJlbiwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5vbignbW92ZScsIHRoaXMuX29uTW92ZSwgdGhpcyk7XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdjbGljaycsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkNsaWNrLCB0aGlzKSk7XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdtb3VzZWRvd24nLCBzbmlwcGV0LmJpbmQodGhpcy5fb25Nb3VzZWRvd24sIHRoaXMpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vkb3duXHJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbk1vdXNlZG93bjogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMubW91c2Vkb3duVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBzZWxmLmZpcmUoJ21vdXNlZG93bicsIGV2ZW50KTtcclxuICAgICAgICB9LCAyMDApO1xyXG5cclxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgZnVuY3Rpb24gbW91c2V1cEhhbmRsZXIoKSB7XHJcbiAgICAgICAgICAgIHNlbGYucmVzZXRNb3VzZWRvd25UaW1lcigpO1xyXG4gICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgbW91c2V1cEhhbmRsZXIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBjbGlja1xyXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIENsaWNrIGV2ZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25DbGljazogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxyXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHV0aWwuaXNSaWdodEJ1dHRvbihldmVudCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzcykpIHtcclxuICAgICAgICAgICAgdGhpcy50b2dnbGUodGhpcy5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jbGlja1RpbWVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnZG91YmxlQ2xpY2snLCBldmVudCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVzZXRDbGlja1RpbWVyKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZmlyZSgnc2luZ2xlQ2xpY2snLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnJlc2V0Q2xpY2tUaW1lcigpO1xyXG4gICAgICAgICAgICB9LCAzMDApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbm9kZSBzdGF0ZSAtIG9wZW5lZCBvciBjbG9zZWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOb2RlIHN0YXRlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc2V0RGlzcGxheUZyb21Ob2RlU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcclxuICAgICAgICB2YXIgc3VidHJlZUVsZW1lbnQgPSB0aGlzLl9nZXRTdWJ0cmVlRWxlbWVudChub2RlSWQpLFxyXG4gICAgICAgICAgICB0b2dnbGVCdG5DbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZXMudG9vZ2xlQnRuQ2xhc3MsXHJcbiAgICAgICAgICAgIGxhYmVsLCBidG5FbGVtZW50LCBub2RlRWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKCFzdWJ0cmVlRWxlbWVudCB8fCBzdWJ0cmVlRWxlbWVudCA9PT0gdGhpcy5yb290RWxlbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxhYmVsID0gdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV07XHJcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xyXG4gICAgICAgIGJ0bkVsZW1lbnQgPSB1dGlsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUobm9kZUVsZW1lbnQsIHRvZ2dsZUJ0bkNsYXNzTmFtZSlbMF07XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbm9kZVN0YXRlcy5PUEVORUQpIHtcclxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGUobm9kZUVsZW1lbnQsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgaWYgKGJ0bkVsZW1lbnQpIHtcclxuICAgICAgICAgICAgYnRuRWxlbWVudC5pbm5lckhUTUwgPSBsYWJlbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IG5vZGUgY2xhc3MgbmFtZSBmcm9tIHByb3ZpZGVkIHN0YXRlXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlRWxlbWVudCAtIFRyZWVOb2RlIGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIE5ldyBjaGFuZ2VkIHN0YXRlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc2V0Tm9kZUNsYXNzTmFtZUZyb21TdGF0ZTogZnVuY3Rpb24obm9kZUVsZW1lbnQsIHN0YXRlKSB7XHJcbiAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXMsXHJcbiAgICAgICAgICAgIG9wZW5lZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5PUEVORUQgKyAnQ2xhc3MnXSxcclxuICAgICAgICAgICAgY2xvc2VkQ2xhc3NOYW1lID0gY2xhc3NOYW1lc1tub2RlU3RhdGVzLkNMT1NFRCArICdDbGFzcyddO1xyXG5cclxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBvcGVuZWRDbGFzc05hbWUpO1xyXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Mobm9kZUVsZW1lbnQsIGNsb3NlZENsYXNzTmFtZSk7XHJcbiAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgY2xhc3NOYW1lc1tzdGF0ZSArICdDbGFzcyddKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIGh0bWxcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG5vZGVJZHMgLSBOb2RlIGlkIGxpc3RcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUxcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9tYWtlSHRtbDogZnVuY3Rpb24obm9kZUlkcykge1xyXG4gICAgICAgIHZhciBtb2RlbCA9IHRoaXMubW9kZWwsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXMsXHJcbiAgICAgICAgICAgIHN0YXRlTGFiZWxzID0gdGhpcy5zdGF0ZUxhYmVscyxcclxuICAgICAgICAgICAgdGVtcGxhdGVTb3VyY2UgPSB0aGlzLnRlbXBsYXRlLFxyXG4gICAgICAgICAgICBodG1sID0gJyc7XHJcblxyXG4gICAgICAgIHNuaXBwZXQuZm9yRWFjaChub2RlSWRzLCBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICAgICAgdmFyIG5vZGUgPSBtb2RlbC5nZXROb2RlKG5vZGVJZCksXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKSxcclxuICAgICAgICAgICAgICAgIG5vZGVEYXRhID0gbm9kZS5nZXRBbGxEYXRhKCksXHJcbiAgICAgICAgICAgICAgICBwcm9wcyA9IGV4dGVuZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IG5vZGVJZFxyXG4gICAgICAgICAgICAgICAgfSwgY2xhc3NOYW1lcywgbm9kZURhdGEpLFxyXG4gICAgICAgICAgICAgICAgbm9kZVRlbXBsYXRlO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcclxuICAgICAgICAgICAgICAgIG5vZGVUZW1wbGF0ZSA9IHRlbXBsYXRlU291cmNlLmxlYWZOb2RlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbm9kZVRlbXBsYXRlID0gdGVtcGxhdGVTb3VyY2UuaW50ZXJuYWxOb2RlO1xyXG4gICAgICAgICAgICAgICAgcHJvcHMuc3RhdGVDbGFzcyA9IGNsYXNzTmFtZXNbc3RhdGUrJ0NsYXNzJ107XHJcbiAgICAgICAgICAgICAgICBwcm9wcy5zdGF0ZUxhYmVsID0gc3RhdGVMYWJlbHNbc3RhdGVdO1xyXG4gICAgICAgICAgICAgICAgcHJvcHMuY2hpbGRyZW4gPSB0aGlzLl9tYWtlSHRtbChub2RlLmdldENoaWxkSWRzKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGh0bWwgKz0gdXRpbC50ZW1wbGF0ZShub2RlVGVtcGxhdGUsIHByb3BzKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICByZXR1cm4gaHRtbDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEcmF3IHRyZWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gUGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9kcmF3Q2hpbGRyZW46IGZ1bmN0aW9uKHBhcmVudElkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUocGFyZW50SWQpLFxyXG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLm1vZGVsLnJvb3ROb2RlO1xyXG4gICAgICAgICAgICBwYXJlbnRJZCA9IG5vZGUuZ2V0SWQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB0aGlzLl9nZXRTdWJ0cmVlRWxlbWVudChwYXJlbnRJZCk7XHJcbiAgICAgICAgaWYgKCFzdWJ0cmVlRWxlbWVudCkge1xyXG4gICAgICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4obm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5maXJlKCdiZWZvcmVEcmF3JywgcGFyZW50SWQpO1xyXG4gICAgICAgIHN1YnRyZWVFbGVtZW50LmlubmVySFRNTCA9IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xyXG4gICAgICAgICAgICBpZiAobm9kZS5nZXRTdGF0ZSgpID09PSBub2RlU3RhdGVzLk9QRU5FRCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuKG5vZGVJZCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlKG5vZGVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCBwYXJlbnRJZCwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy5maXJlKCdhZnRlckRyYXcnLCBwYXJlbnRJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHN1YnRyZWUgZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFRyZWVOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7RWxlbWVudHx1bmRlZmluZWR9IFN1YnRyZWUgZWxlbWVudCBvciB1bmRlZmluZWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9nZXRTdWJ0cmVlRWxlbWVudDogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgc3VidHJlZUNsYXNzTmFtZSwgbm9kZUVsZW1lbnQsIHN1YnRyZWVFbGVtZW50O1xyXG4gICAgICAgIGlmICghbm9kZSB8fCBub2RlLmlzTGVhZigpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJvb3RFbGVtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3VidHJlZUNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lc1snc3VidHJlZUNsYXNzJ107XHJcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmdldElkKCkpO1xyXG4gICAgICAgIHN1YnRyZWVFbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKG5vZGVFbGVtZW50LCBzdWJ0cmVlQ2xhc3NOYW1lKVswXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN1YnRyZWVFbGVtZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiB0aGUgZGVwdGggb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9IERlcHRoXHJcbiAgICAgKi9cclxuICAgIGdldERlcHRoOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXREZXB0aChub2RlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiB0aGUgbGFzdCBkZXB0aCBvZiB0cmVlXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IExhc3QgZGVwdGhcclxuICAgICAqL1xyXG4gICAgZ2V0TGFzdERlcHRoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRMYXN0RGVwdGgoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gcm9vdCBub2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSb290IG5vZGUgaWRcclxuICAgICAqL1xyXG4gICAgZ2V0Um9vdE5vZGVJZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwucm9vdE5vZGUuZ2V0SWQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gY2hpbGQgaWRzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fHVuZGVmaW5lZH0gQ2hpbGQgaWRzXHJcbiAgICAgKi9cclxuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRDaGlsZElkcyhub2RlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBwYXJlbnQgaWQgb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8dW5kZWZpbmVkfSBQYXJlbnQgaWRcclxuICAgICAqL1xyXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldFBhcmVudElkKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzZXQgY2xpY2sgdGltZXJcclxuICAgICAqL1xyXG4gICAgcmVzZXRDbGlja1RpbWVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuY2xpY2tUaW1lcik7XHJcbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNldCBtb3VzZWRvd24gdGltZXJcclxuICAgICAqL1xyXG4gICAgcmVzZXRNb3VzZWRvd25UaW1lcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLm1vdXNlZG93blRpbWVyKTtcclxuICAgICAgICB0aGlzLm1vdXNlZG93blRpbWVyID0gbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgbm9kZSBpZCBmcm9tIGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBFbGVtZW50XHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBOb2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBnZXROb2RlSWRGcm9tRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgIHZhciBpZFByZWZpeCA9IHRoaXMuZ2V0Tm9kZUlkUHJlZml4KCk7XHJcblxyXG4gICAgICAgIHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQuaWQuaW5kZXhPZihpZFByZWZpeCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQuaWQgOiAnJztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgcHJlZml4IG9mIG5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFByZWZpeCBvZiBub2RlIGlkXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Tm9kZUlkUHJlZml4KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IG5vZGUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm5zIHtvYmplY3R8dW5kZWZpbmVkfSBOb2RlIGRhdGFcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVEYXRhKG5vZGVJZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFByb3BlcnRpZXNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcclxuICAgICAqL1xyXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCwgZGF0YSwgaXNTaWxlbnQpIHtcclxuICAgICAgICB0aGlzLm1vZGVsLnNldE5vZGVEYXRhKG5vZGVJZCwgZGF0YSwgaXNTaWxlbnQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0gbmFtZXMgLSBOYW1lcyBvZiBwcm9wZXJ0aWVzXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIG5hbWVzLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwucmVtb3ZlTm9kZURhdGEobm9kZUlkLCBuYW1lcywgaXNTaWxlbnQpXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3BlbiBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICovXHJcbiAgICBvcGVuOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGVTdGF0ZXMuT1BFTkVEO1xyXG5cclxuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc1Jvb3QoKSkge1xyXG4gICAgICAgICAgICBub2RlLnNldFN0YXRlKHN0YXRlKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENsb3NlIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKi9cclxuICAgIGNsb3NlOiBmdW5jdGlvbihub2RlSWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxyXG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGVTdGF0ZXMuQ0xPU0VEO1xyXG5cclxuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc1Jvb3QoKSkge1xyXG4gICAgICAgICAgICBub2RlLnNldFN0YXRlKHN0YXRlKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRvZ2dsZSBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqKi9cclxuICAgIHRvZ2dsZTogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgc3RhdGU7XHJcblxyXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIG5vZGUudG9nZ2xlU3RhdGUoKTtcclxuICAgICAgICAgICAgc3RhdGUgPSBub2RlLmdldFN0YXRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTb3J0IGFsbCBub2Rlc1xyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZm9yIHNvcnRpbmdcclxuICAgICAqL1xyXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvcikge1xyXG4gICAgICAgIHRoaXMubW9kZWwuc29ydChjb21wYXJhdG9yKTtcclxuICAgICAgICB0aGlzLl9kcmF3Q2hpbGRyZW4oKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWZyZXNoIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbm9kZUlkXSAtIFRyZWVOb2RlIGlkIHRvIHJlZnJlc2hcclxuICAgICAqKi9cclxuICAgIHJlZnJlc2g6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHRoaXMuX2RyYXdDaGlsZHJlbihub2RlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgbm9kZXMuXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxyXG4gICAgICovXHJcbiAgICBlYWNoQWxsOiBmdW5jdGlvbihpdGVyYXRlZSwgY29udGV4dCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwuZWFjaEFsbChpdGVyYXRlZSwgY29udGV4dCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBkZXNjZW5kYW50cyBvZiBhIG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcclxuICAgICAqL1xyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIG5vZGUocykuXHJcbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cclxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdy1kYXRhXHJcbiAgICAgKiBAcGFyYW0geyp9IHBhcmVudElkIC0gUGFyZW50IGlkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxyXG4gICAgICovXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwuYWRkKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cclxuICAgICAqL1xyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihub2RlSWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmUobm9kZUlkLCBpc1NpbGVudCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTW92ZSBhIG5vZGUgdG8gbmV3IHBhcmVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXHJcbiAgICAgKi9cclxuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5tb3ZlKG5vZGVJZCwgbmV3UGFyZW50SWQsIGlzU2lsZW50KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGUgZmFjaWxpdHkgb2YgdHJlZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVOYW1lIC0gJ1NlbGVjdGFibGUnLCAnRHJhZ2dhYmxlJ1xyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIEZlYXR1cmUgb3B0aW9uc1xyXG4gICAgICogQHJldHVybiB7VHJlZX0gdGhpc1xyXG4gICAgICovXHJcbiAgICBlbmFibGVGZWF0dXJlOiBmdW5jdGlvbihmZWF0dXJlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgICAgIHZhciBGZWF0dXJlID0gVHJlZS5mZWF0dXJlc1tmZWF0dXJlTmFtZV07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzYWJsZUZlYXR1cmUoZmVhdHVyZU5hbWUpO1xyXG4gICAgICAgIGlmIChGZWF0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXSA9IG5ldyBGZWF0dXJlKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNhYmxlIGZhY2lsaXR5IG9mIHRyZWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtICdTZWxlY3RhYmxlJywgJ0RyYWdnYWJsZSdcclxuICAgICAqIEByZXR1cm4ge1RyZWV9IHRoaXNcclxuICAgICAqL1xyXG4gICAgZGlzYWJsZUZlYXR1cmU6IGZ1bmN0aW9uKGZlYXR1cmVOYW1lKSB7XHJcbiAgICAgICAgdmFyIGZlYXR1cmUgPSB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV07XHJcblxyXG4gICAgICAgIGlmIChmZWF0dXJlKSB7XHJcbiAgICAgICAgICAgIGZlYXR1cmUuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnR1aS51dGlsLmZvckVhY2goZmVhdHVyZXMsIGZ1bmN0aW9uKEZlYXR1cmUsIG5hbWUpIHtcclxuICAgIFRyZWUucmVnaXN0ZXJGZWF0dXJlKG5hbWUsIEZlYXR1cmUpO1xyXG59KTtcclxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWUpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWU7XHJcbiIsIi8qKlxyXG4gKiBAZmlsZW92ZXJ2aWV3IFVwZGF0ZSB2aWV3IGFuZCBjb250cm9sIHRyZWUgZGF0YVxyXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgVHJlZU5vZGUgPSByZXF1aXJlKCcuL3RyZWVOb2RlJyksXHJcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XHJcblxyXG52YXIgc25pcHBldCA9IHR1aS51dGlsLFxyXG4gICAgZXh0ZW5kID0gc25pcHBldC5leHRlbmQsXHJcbiAgICBrZXlzID0gc25pcHBldC5rZXlzLFxyXG4gICAgZm9yRWFjaCA9IHNuaXBwZXQuZm9yRWFjaCxcclxuICAgIG1hcCA9IHNuaXBwZXQubWFwLFxyXG4gICAgZmlsdGVyID0gc25pcHBldC5maWx0ZXIsXHJcbiAgICBpbkFycmF5ID0gc25pcHBldC5pbkFycmF5O1xyXG5cclxuLyoqXHJcbiAqIFRyZWUgbW9kZWxcclxuICogQGNvbnN0cnVjdG9yIFRyZWVNb2RlbFxyXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gRGF0YVxyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnMgZm9yIGRlZmF1bHRTdGF0ZSBhbmQgbm9kZUlkUHJlZml4XHJcbiAqKi9cclxudmFyIFRyZWVNb2RlbCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU1vZGVsLnByb3RvdHlwZSAqL3sgLyogZXNsaW50LWRpc2FibGUgKi9cclxuICAgIGluaXQ6IGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpIHsvKmVzbGludC1lbmFibGUqL1xyXG4gICAgICAgIFRyZWVOb2RlLnNldElkUHJlZml4KG9wdGlvbnMubm9kZUlkUHJlZml4KTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCBzdGF0ZSBvZiBub2RlXHJcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm5vZGVEZWZhdWx0U3RhdGUgPSBvcHRpb25zLm5vZGVEZWZhdWx0U3RhdGU7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJvb3Qgbm9kZVxyXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTm9kZX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJvb3ROb2RlID0gbmV3IFRyZWVOb2RlKHtcclxuICAgICAgICAgICAgc3RhdGU6ICdvcGVuZWQnXHJcbiAgICAgICAgfSwgbnVsbCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRyZWUgaGFzaCBoYXZpbmcgYWxsIG5vZGVzXHJcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBUcmVlTm9kZT59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50cmVlSGFzaCA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLl9zZXREYXRhKGRhdGEpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBwcmVmaXggb2Ygbm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUHJlZml4XHJcbiAgICAgKi9cclxuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIFRyZWVOb2RlLmlkUHJlZml4O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBtb2RlbCB3aXRoIHRyZWUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIFRyZWUgZGF0YVxyXG4gICAgICovXHJcbiAgICBfc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHZhciByb290ID0gdGhpcy5yb290Tm9kZSxcclxuICAgICAgICAgICAgcm9vdElkID0gcm9vdC5nZXRJZCgpO1xyXG5cclxuICAgICAgICB0aGlzLnRyZWVIYXNoW3Jvb3RJZF0gPSByb290O1xyXG4gICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCByb290KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHRyZWUgaGFzaCBmcm9tIGRhdGEgYW5kIHBhcmVudE5vZGVcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBUcmVlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IHBhcmVudCAtIFBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfbWFrZVRyZWVIYXNoOiBmdW5jdGlvbihkYXRhLCBwYXJlbnQpIHtcclxuICAgICAgICB2YXIgcGFyZW50SWQgPSBwYXJlbnQuZ2V0SWQoKTtcclxuXHJcbiAgICAgICAgZm9yRWFjaChkYXRhLCBmdW5jdGlvbihkYXR1bSkge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW5EYXRhID0gZGF0dW0uY2hpbGRyZW4sXHJcbiAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5fY3JlYXRlTm9kZShkYXR1bSwgcGFyZW50SWQpLFxyXG4gICAgICAgICAgICAgICAgbm9kZUlkID0gbm9kZS5nZXRJZCgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy50cmVlSGFzaFtub2RlSWRdID0gbm9kZTtcclxuICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcclxuICAgICAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGNoaWxkcmVuRGF0YSwgbm9kZSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIG5vZGVcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlRGF0YSAtIERhdHVtIG9mIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxyXG4gICAgICogQHJldHVybiB7VHJlZU5vZGV9IFRyZWVOb2RlXHJcbiAgICAgKi9cclxuICAgIF9jcmVhdGVOb2RlOiBmdW5jdGlvbihub2RlRGF0YSwgcGFyZW50SWQpIHtcclxuICAgICAgICB2YXIgbm9kZTtcclxuICAgICAgICBub2RlRGF0YSA9IGV4dGVuZCh7XHJcbiAgICAgICAgICAgIHN0YXRlOiB0aGlzLm5vZGVEZWZhdWx0U3RhdGVcclxuICAgICAgICB9LCBub2RlRGF0YSk7XHJcblxyXG4gICAgICAgIG5vZGUgPSBuZXcgVHJlZU5vZGUobm9kZURhdGEsIHBhcmVudElkKTtcclxuICAgICAgICBub2RlLnJlbW92ZURhdGEoJ2NoaWxkcmVuJyk7XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBjaGlsZHJlblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcclxuICAgICAqIEByZXR1cm4ge0FycmF5LjxUcmVlTm9kZT58dW5kZWZpbmVkfSBjaGlsZHJlblxyXG4gICAgICovXHJcbiAgICBnZXRDaGlsZHJlbjogZnVuY3Rpb24obm9kZUlkKSB7XHJcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5nZXRDaGlsZElkcyhub2RlSWQpO1xyXG4gICAgICAgIGlmICghY2hpbGRJZHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG1hcChjaGlsZElkcywgZnVuY3Rpb24oY2hpbGRJZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXROb2RlKGNoaWxkSWQpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBjaGlsZCBpZHNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz58dW5kZWZpbmVkfSBDaGlsZCBpZHNcclxuICAgICAqL1xyXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlLmdldENoaWxkSWRzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBudW1iZXIgb2Ygbm9kZXNcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBudW1iZXIgb2Ygbm9kZXNcclxuICAgICAqL1xyXG4gICAgZ2V0Q291bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBrZXlzKHRoaXMudHJlZUhhc2gpLmxlbmd0aDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgbGFzdCBkZXB0aFxyXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIGxhc3QgZGVwdGhcclxuICAgICAqL1xyXG4gICAgZ2V0TGFzdERlcHRoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZGVwdGhzID0gbWFwKHRoaXMudHJlZUhhc2gsIGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGVwdGgobm9kZS5nZXRJZCgpKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KG51bGwsIGRlcHRocyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmluZCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBBIG5vZGUgaWQgdG8gZmluZFxyXG4gICAgICogQHJldHVybiB7VHJlZU5vZGV8dW5kZWZpbmVkfSBOb2RlXHJcbiAgICAgKi9cclxuICAgIGdldE5vZGU6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHJlZUhhc2hbaWRdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBkZXB0aCBmcm9tIG5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIEEgbm9kZSBpZCB0byBmaW5kXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfSBEZXB0aFxyXG4gICAgICovXHJcbiAgICBnZXREZXB0aDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXHJcbiAgICAgICAgICAgIGRlcHRoID0gMCxcclxuICAgICAgICAgICAgcGFyZW50O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XHJcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xyXG4gICAgICAgICAgICBkZXB0aCArPSAxO1xyXG4gICAgICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50LmdldFBhcmVudElkKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlcHRoO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBwYXJlbnQgaWQgb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFBhcmVudCBpZFxyXG4gICAgICovXHJcbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBub2RlLmdldFBhcmVudElkKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxyXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWQgdG8gcmVtb3ZlXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oaWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxyXG4gICAgICAgICAgICBwYXJlbnQ7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcclxuXHJcbiAgICAgICAgZm9yRWFjaChub2RlLmdldENoaWxkSWRzKCksIGZ1bmN0aW9uKGNoaWxkSWQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoY2hpbGRJZCwgdHJ1ZSk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZElkKGlkKTtcclxuICAgICAgICBkZWxldGUgdGhpcy50cmVlSGFzaFtpZF07XHJcblxyXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnQuZ2V0SWQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZCBub2RlKHMpLlxyXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXHJcbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxyXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IGlkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIGFkZDogZnVuY3Rpb24oZGF0YSwgcGFyZW50SWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShwYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZTtcclxuXHJcbiAgICAgICAgZGF0YSA9IFtdLmNvbmNhdChkYXRhKTtcclxuICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goZGF0YSwgcGFyZW50KTtcclxuXHJcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIHBhcmVudElkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcyAtIFByb3BlcnRpZXNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcclxuICAgICAqL1xyXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKGlkLCBwcm9wcywgaXNTaWxlbnQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSB8fCAhcHJvcHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbm9kZS5zZXREYXRhKHByb3BzKTtcclxuXHJcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIG5vZGUuZ2V0UGFyZW50SWQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fSBuYW1lcyAtIE5hbWVzIG9mIHByb3BlcnRpZXNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlTm9kZURhdGE6IGZ1bmN0aW9uKGlkLCBuYW1lcywgaXNTaWxlbnQpIHtcclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSB8fCAhbmFtZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR1aS51dGlsLmlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRGF0YS5hcHBseShub2RlLCBuYW1lcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhKG5hbWVzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBub2RlLmdldFBhcmVudElkKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNb3ZlIGEgbm9kZSB0byBuZXcgcGFyZW50J3MgY2hpbGRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIGlzU2lsZW50KSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKSxcclxuICAgICAgICAgICAgb3JpZ2luYWxQYXJlbnQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudDtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbmV3UGFyZW50ID0gdGhpcy5nZXROb2RlKG5ld1BhcmVudElkKSB8fCB0aGlzLnJvb3ROb2RlO1xyXG4gICAgICAgIG5ld1BhcmVudElkID0gbmV3UGFyZW50LmdldElkKCk7XHJcbiAgICAgICAgb3JpZ2luYWxQYXJlbnRJZCA9IG5vZGUuZ2V0UGFyZW50SWQoKTtcclxuICAgICAgICBvcmlnaW5hbFBhcmVudCA9IHRoaXMuZ2V0Tm9kZShvcmlnaW5hbFBhcmVudElkKTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGVJZCA9PT0gbmV3UGFyZW50SWQgfHwgdGhpcy5jb250YWlucyhub2RlSWQsIG5ld1BhcmVudElkKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9yaWdpbmFsUGFyZW50LnJlbW92ZUNoaWxkSWQobm9kZUlkKTtcclxuICAgICAgICBub2RlLnNldFBhcmVudElkKG5ld1BhcmVudElkKTtcclxuICAgICAgICBuZXdQYXJlbnQuYWRkQ2hpbGRJZChub2RlSWQpO1xyXG5cclxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnbW92ZScsIG5vZGVJZCwgb3JpZ2luYWxQYXJlbnRJZCwgbmV3UGFyZW50SWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayB0byBzZWUgaWYgYSBub2RlIGlzIGEgZGVzY2VuZGFudCBvZiBhbm90aGVyIG5vZGUuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVkSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVGhlIG5vZGUgaXMgY29udGFpbmVkIG9yIG5vdFxyXG4gICAgICovXHJcbiAgICBjb250YWluczogZnVuY3Rpb24oY29udGFpbmVySWQsIGNvbnRhaW5lZElkKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudElkID0gdGhpcy5nZXRQYXJlbnRJZChjb250YWluZWRJZCksXHJcbiAgICAgICAgICAgIGlzQ29udGFpbmVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHdoaWxlICghaXNDb250YWluZWQgJiYgcGFyZW50SWQpIHtcclxuICAgICAgICAgICAgaXNDb250YWluZWQgPSAoY29udGFpbmVySWQgPT09IHBhcmVudElkKTtcclxuICAgICAgICAgICAgcGFyZW50SWQgPSB0aGlzLmdldFBhcmVudElkKHBhcmVudElkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGlzQ29udGFpbmVkO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNvcnQgbm9kZXNcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgLSBDb21wYXJhdG9yIGZ1bmN0aW9uXHJcbiAgICAgKi9cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcclxuICAgICAgICB0aGlzLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZ2V0Q2hpbGRyZW4obm9kZUlkKSxcclxuICAgICAgICAgICAgICAgIGNoaWxkSWRzO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuLnNvcnQoY29tcGFyYXRvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgY2hpbGRJZHMgPSBtYXAoY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkLmdldElkKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIG5vZGUucmVwbGFjZUNoaWxkSWRzKGNoaWxkSWRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBub2RlIGRhdGEgKGFsbClcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R8dW5kZWZpbmVkfSBOb2RlIGRhdGFcclxuICAgICAqL1xyXG4gICAgZ2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlLmdldEFsbERhdGEoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIG5vZGVzLlxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcclxuICAgICAqL1xyXG4gICAgZWFjaEFsbDogZnVuY3Rpb24oaXRlcmF0ZWUsIGNvbnRleHQpIHtcclxuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xyXG5cclxuICAgICAgICBmb3JFYWNoKHRoaXMudHJlZUhhc2gsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpdGVyYXRlZS5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgZGVzY2VuZGFudHMgb2YgYSBub2RlLlxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXHJcbiAgICAgKi9cclxuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCkge1xyXG4gICAgICAgIHZhciBzdGFjaywgbm9kZUlkLCBub2RlO1xyXG5cclxuICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKHBhcmVudElkKTtcclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGFjayA9IG5vZGUuZ2V0Q2hpbGRJZHMoKTtcclxuXHJcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcclxuICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIG5vZGVJZCA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XHJcbiAgICAgICAgICAgIGl0ZXJhdGVlLmNhbGwoY29udGV4dCwgbm9kZSwgbm9kZUlkKTtcclxuXHJcbiAgICAgICAgICAgIHV0aWwucHVzaEFsbChzdGFjaywgbm9kZS5nZXRDaGlsZElkcygpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWVNb2RlbCk7XHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZU1vZGVsO1xyXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdGF0ZXMgPSByZXF1aXJlKCcuL3N0YXRlcycpLm5vZGUsXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgbGFzdEluZGV4ID0gMCxcbiAgICBnZXROZXh0SW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGFzdEluZGV4O1xuICAgICAgICBsYXN0SW5kZXggKz0gMTtcbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG4gICAgUkVTRVJWRURfUFJPUEVSVElFUyA9IHtcbiAgICAgICAgaWQ6ICcnLFxuICAgICAgICBzdGF0ZTogJ3NldFN0YXRlJ1xuICAgIH0sXG4gICAgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG5cbi8qKlxuICogVHJlZU5vZGVcbiAqIEBDb25zdHJ1Y3RvciBUcmVlTm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG5vZGVEYXRhIC0gTm9kZSBkYXRhXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIFBhcmVudCBub2RlIGlkXG4gKi9cbnZhciBUcmVlTm9kZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU5vZGUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgc2V0SWRQcmVmaXg6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICAgICAgdGhpcy5pZFByZWZpeCA9IHByZWZpeCB8fCB0aGlzLmlkUHJlZml4O1xuICAgICAgICB9LFxuICAgICAgICBpZFByZWZpeDogJydcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faWQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXJlbnQgbm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPG51bWJlcj59XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIGRhdGFcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBzdGF0ZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuXG4gICAgICAgIHRoaXMuX3N0YW1wSWQoKTtcbiAgICAgICAgdGhpcy5zZXREYXRhKG5vZGVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhbXAgbm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3N0YW1wSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pZCA9IHRoaXMuY29uc3RydWN0b3IuaWRQcmVmaXggKyBnZXROZXh0SW5kZXgoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJlc2VydmVkIHByb3BlcnRpZXMgZnJvbSBkYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBOb2RlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBOb2RlIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSZXNlcnZlZFByb3BlcnRpZXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaE93blByb3BlcnRpZXMoUkVTRVJWRURfUFJPUEVSVElFUywgZnVuY3Rpb24oc2V0dGVyLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW25hbWVdO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tzZXR0ZXJdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHN0YXRlXG4gICAgICovXG4gICAgdG9nZ2xlU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdGUgPT09IHN0YXRlcy5DTE9TRUQpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLk9QRU5FRDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLkNMT1NFRDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBTdGF0ZSBvZiBub2RlICgnY2xvc2VkJywgJ29wZW5lZCcpXG4gICAgICovXG4gICAgc2V0U3RhdGU6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgIHN0YXRlICs9ICcnO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlc1tzdGF0ZS50b1VwcGVyQ2FzZSgpXSB8fCB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHN0YXRlXG4gICAgICogQHJldHVybnMge3N0cmluZ30gc3RhdGUgKCdvcGVuZWQnIG9yICdjbG9zZWQnKVxuICAgICAqL1xuICAgIGdldFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBOb2RlIGlkXG4gICAgICovXG4gICAgZ2V0SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwYXJlbnQgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKi9cbiAgICBzZXRQYXJlbnRJZDogZnVuY3Rpb24ocGFyZW50SWQpIHtcbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVwbGFjZSBjaGlsZElkc1xuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGNoaWxkSWRzIC0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIHJlcGxhY2VDaGlsZElkczogZnVuY3Rpb24oY2hpbGRJZHMpIHtcbiAgICAgICAgdGhpcy5fY2hpbGRJZHMgPSBjaGlsZElkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGlkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj59IElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKi9cbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5zbGljZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICovXG4gICAgYWRkQ2hpbGRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5fY2hpbGRJZHM7XG5cbiAgICAgICAgaWYgKHR1aS51dGlsLmluQXJyYXkoY2hpbGRJZHMsIGlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNoaWxkSWRzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICByZW1vdmVDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB1dGlsLnJlbW92ZUl0ZW1Gcm9tQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGRhdGFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFByb3BlcnR5IG5hbWUgb2YgZGF0YVxuICAgICAqIEByZXR1cm5zIHsqfSBEYXRhXG4gICAgICovXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtuYW1lXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBkYXRhXG4gICAgICogQHJldHVybnMge09iamVjdH0gRGF0YVxuICAgICAqL1xuICAgIGdldEFsbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuZXh0ZW5kKHt9LCB0aGlzLl9kYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGFcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIERhdGEgZm9yIGFkZGluZ1xuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZGF0YSA9IHRoaXMuX3NldFJlc2VydmVkUHJvcGVydGllcyhkYXRhKTtcbiAgICAgICAgdHVpLnV0aWwuZXh0ZW5kKHRoaXMuX2RhdGEsIGRhdGEpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBkYXRhXG4gICAgICogQHBhcmFtIHsuLi5zdHJpbmd9IG5hbWVzIC0gTmFtZXMgb2YgZGF0YVxuICAgICAqL1xuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKG5hbWVzKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2hBcnJheShhcmd1bWVudHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoaXMgbm9kZSBoYXMgYSBwcm92aWRlZCBjaGlsZCBpZC5cbiAgICAgKi9cbiAgICBoYXNDaGlsZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIGluQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKSAhPT0gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyBsZWFmLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIGxlYWYgb3Igbm90LlxuICAgICAqL1xuICAgIGlzTGVhZjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5sZW5ndGggPT09IDA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyByb290LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIHJvb3Qgb3Igbm90LlxuICAgICAqL1xuICAgIGlzUm9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5pc0ZhbHN5KHRoaXMuX3BhcmVudElkKTtcbiAgICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU5vZGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbnZhciB1dGlsID0ge1xuICAgIC8qKlxuICAgICAqIFB1c2ggYWxsIGVsZW1lbnRzIGZyb20gbmV3IGFycmF5XG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyMSAtIEJhc2UgYXJyYXlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIyIC0gTmV3IGFycmF5XG4gICAgICovXG4gICAgcHVzaEFsbDogZnVuY3Rpb24oYXJyMSwgYXJyMikge1xuICAgICAgICB2YXIgbGVuZ3RoID0gYXJyMi5sZW5ndGgsXG4gICAgICAgICAgICBpID0gMDtcblxuICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBhcnIxLnB1c2goYXJyMltpXSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpcnN0IHNwZWNpZmllZCBpdGVtIGZyb20gYXJyYXksIGlmIGl0IGV4aXN0c1xuICAgICAqIEBwYXJhbSB7Kn0gaXRlbSBJdGVtIHRvIGxvb2sgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyIEFycmF5IHRvIHF1ZXJ5XG4gICAgICovXG4gICAgcmVtb3ZlSXRlbUZyb21BcnJheTogZnVuY3Rpb24oaXRlbSwgYXJyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoaXRlbSwgYXJyKTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNsYXNzbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBDbGFzc25hbWVcbiAgICAgKi9cbiAgICBhZGRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NOYW1lID09PSAnJykge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoIXV0aWwuaGFzQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgKz0gJyAnICsgY2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjbGFzc25hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIC0gQ2xhc3NuYW1lXG4gICAgICovXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgb3JpZ2luYWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpLFxuICAgICAgICAgICAgYXJyLCBpbmRleDtcblxuICAgICAgICBpZiAoIW9yaWdpbmFsQ2xhc3NOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnIgPSBvcmlnaW5hbENsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgICAgICBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoY2xhc3NOYW1lLCBhcnIpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gYXJyLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB0byBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50IFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhZGRcbiAgICAgKi9cbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgZnJvbSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmRldGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9IEV2ZW50IHRhcmdldFxuICAgICAqL1xuICAgIGdldFRhcmdldDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0O1xuICAgICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgICAgIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEhUTUxFbGVtZW50XG4gICAgICogQHJldHVybnMge3N0cmluZ30gQ2xhc3MgbmFtZVxuICAgICAqL1xuICAgIGdldENsYXNzOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50ICYmIGVsZW1lbnQuZ2V0QXR0cmlidXRlICYmIChlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCAnJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBlbGVtZW50IGhhcyBzcGVjaWZpYyBjbGFzcyBvciBub3RcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzcyB0byBmaW5kXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZWxlbWVudCBoYXMgdGhlIGNsYXNzXG4gICAgICovXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpO1xuXG4gICAgICAgIHJldHVybiBlbENsYXNzTmFtZS5pbmRleE9mKGNsYXNzTmFtZSkgPiAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBlbGVtZW50IGJ5IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgQSBuYW1lIG9mIGNsYXNzXG4gICAgICogQHJldHVybiB7QXJyYXkuPEhUTUxFbGVtZW50Pn0gRWxlbWVudHNcbiAgICAgKi9cbiAgICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lOiBmdW5jdGlvbih0YXJnZXQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgYWxsLCBmaWx0ZXJlZDtcblxuICAgICAgICBpZiAodGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFsbCA9IHRhcmdldC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpO1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0dWkudXRpbC5maWx0ZXIoYWxsLCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiAoY2xhc3NOYW1lcy5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHdoZXRoZXIgdGhlIGNsaWNrIGV2ZW50IGJ5IHJpZ2h0IGJ1dHRvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICovXG4gICAgaXNSaWdodEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuX2dldEJ1dHRvbihldmVudCkgPT09IDI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0IG9yIG5vdFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIEEgcHJvcGVydHlcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd8Ym9vbGVhbn0gUHJvcGVydHkgbmFtZSBvciBmYWxzZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIHVzZXJTZWxlY3RQcm9wZXJ0eSA9IHV0aWwudGVzdFByb3AoW1xuICAgICAqICAgICAndXNlclNlbGVjdCcsXG4gICAgICogICAgICdXZWJraXRVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ09Vc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ01velVzZXJTZWxlY3QnLFxuICAgICAqICAgICAnbXNVc2VyU2VsZWN0J1xuICAgICAqIF0pO1xuICAgICAqL1xuICAgIHRlc3RQcm9wOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUsXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBmYWxzZTtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHByb3BzLCBmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgICAgICBpZiAocHJvcCBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3A7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHByb3BlcnR5TmFtZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCBkZWZhdWx0IGV2ZW50IFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqL1xuICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbCBmcm9tIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZSAtIFRlbXBsYXRlIGh0bWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUZW1wbGF0ZSBkYXRhXG4gICAgICogQHJldHVybnMge3N0cmluZ30gaHRtbFxuICAgICAqL1xuICAgIHRlbXBsYXRlOiBmdW5jdGlvbihzb3VyY2UsIHByb3BzKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2UucmVwbGFjZSgvXFx7XFx7KFxcdyspfX0vZ2ksIGZ1bmN0aW9uKG1hdGNoLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBwcm9wc1tuYW1lXTtcbiAgICAgICAgICAgIGlmICh0dWkudXRpbC5pc0ZhbHN5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6YXRpb24gZm9yIGV2ZW50IGJ1dHRvbiBwcm9wZXJ0eSBcbiAgICAgKiAwOiBGaXJzdCBtb3VzZSBidXR0b24sIDI6IFNlY29uZCBtb3VzZSBidXR0b24sIDE6IENlbnRlciBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9IGJ1dHRvbiB0eXBlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0QnV0dG9uOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgYnV0dG9uLFxuICAgICAgICAgICAgcHJpbWFyeSA9ICcwLDEsMyw1LDcnLFxuICAgICAgICAgICAgc2Vjb25kYXJ5ID0gJzIsNicsXG4gICAgICAgICAgICB3aGVlbCA9ICc0JztcblxuICAgICAgICBpZiAoZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uaGFzRmVhdHVyZSgnTW91c2VFdmVudHMnLCAnMi4wJykpIHtcbiAgICAgICAgICAgIHJldHVybiBldmVudC5idXR0b247XG4gICAgICAgIH1cblxuICAgICAgICBidXR0b24gPSBldmVudC5idXR0b24gKyAnJztcbiAgICAgICAgaWYgKHByaW1hcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9IGVsc2UgaWYgKHNlY29uZGFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgIH0gZWxzZSBpZiAod2hlZWwuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIl19
