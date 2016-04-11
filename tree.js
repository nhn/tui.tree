(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var Tree = require('./src/js/tree');
var component = tui.util.defineNamespace('tui.component');
component.Tree = Tree;

},{"./src/js/tree":10}],2:[function(require,module,exports){
'use strict';

/**
 * Make class names
 * @param {string} prefix - Prefix of class name
 * @param {Array.<string>} keys - Keys of class names
 * @returns {object.<string, string>} Class names map
 */
function makeClassNames(prefix, keys) {
    var obj = {};
    tui.util.forEach(keys, function(key) {
        obj[key + 'Class'] = prefix + key;
    });

    return obj;
}

/**
 * A default values for tree
 * @const
 * @type {Object}
 * @property {string} nodeDefaultState - Node state
 * @property {string} nodeIdPrefix - Node id prefix
 * @property {object} stateLabel - State label in node
 *  @property {string} stateLabel.opened - '-'
 *  @property {string} stateLabel.closed - '+'
 * @property {object} template - Template html for the nodes.
 *  @property {string} template.internalNode - Template html for internal node.
 *  @property {string} template.leafNode - Template html for leaf node.
 * @property {object} classNames - Class names of elements in tree
 *  @property {string} openedClass - Class name for opened node
 *  @property {string} closedClass - Class name for closed node
 *  @property {string} nodeClass - Class name for node
 *  @property {string} leafClass - Class name for leaf node
 *  @property {string} subtreeClass  - Class name for subtree in internal node
 *  @property {string} toggleBtnClass - Class name for toggle button in internal node
 *  @property {string} textClass - Class name for text element in a node
 */
module.exports = {
    nodeDefaultState: 'closed',
    stateLabels: {
        opened: '-',
        closed: '+'
    },
    nodeIdPrefix: 'tui-tree-node-',
    classNames: makeClassNames('tui-tree-', [
        'node',
        'leaf',
        'opened',
        'closed',
        'subtree',
        'toggleBtn',
        'text'
    ]),
    template: {
        internalNode:
            '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
            '<span class="{{textClass}}">{{text}}</span>' +
            '<ul class="{{subtreeClass}}">{{children}}</ul>',
        leafNode:
            '<span class="{{textClass}}">{{text}}</span>'
    }
};

},{}],3:[function(require,module,exports){
'use strict';

/**
 * Messages for tree
 * @type {Object.<string, string>}
 */
module.exports = {
    INVALID_ROOT_ELEMENT: '"tui-component-tree": Root element is invalid.',
    INVALID_API: '"tui-component-tree": INVALID_API',
    INVALID_API_SELECTABLE: '"tui-component-tree": The feature-"Selectable" is not enabled.',
    INVALID_API_EDITABLE: '"tui-component-tree": The feature-"Editable" is not enabled.',
    INVALID_API_DRAGGABLE: '"tui-component-tree": The feature-"Draggable" is not enabled.',
    INVALID_API_CHECKBOX: '"tui-component-tree": The feature-"Checkbox" is not enabled.'
};

},{}],4:[function(require,module,exports){
'use strict';

/**
 * Outer template
 * @type {{internalNode: string, leafNode: string}}
 */
module.exports = {
    INTERNAL_NODE:
        '<li id="{{id}}" class="{{nodeClass}} {{stateClass}}">' +
            '{{innerTemplate}}' +
        '</li>',
    LEAF_NODE:
        '<li id="{{id}}" class="{{nodeClass}} {{leafClass}}">' +
            '{{innerTemplate}}' +
        '</li>'
};

},{}],5:[function(require,module,exports){
'use strict';

/**
 * States in tree
 * @type {Object.<string, string>}
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

},{}],6:[function(require,module,exports){
'use strict';

var util = require('../util.js');
var API_LIST = [
    'check',
    'uncheck',
    'toggleCheck',
    'isChecked',
    'isIndeterminate',
    'isUnchecked',
    'getCheckedList',
    'getTopCheckedList',
    'getBottomCheckedList'
];

/**
 * Checkbox tri-states
 */
var STATE_CHECKED = 1,
    STATE_UNCHECKED = 2,
    STATE_INDETERMINATE = 3,
    DATA_KEY_FOR_CHECKBOX_STATE = '__CheckBoxState__',
    DATA = {};

var filter = tui.util.filter,
    forEach = tui.util.forEach;
/**
 * Set the checkbox-api
 * @class Checkbox
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} option - Option
 *  @param {string} option.checkboxClassName - Classname of checkbox element
 */
var Checkbox = tui.util.defineClass(/** @lends Checkbox.prototype */{ /*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf Checkbox
         * @returns {Array.<string>} API list of checkbox
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },
    init: function(tree, option) {/*eslint-enable*/
        option = tui.util.extend({}, option);

        this.tree = tree;
        this.checkboxClassName = option.checkboxClassName;
        this.checkedList = [];
        this.rootCheckbox = document.createElement('INPUT');
        this.rootCheckbox.type = 'checkbox';

        this._setAPIs();
        this._attachEvents();
    },

    /**
     * Disable this module
     */
    destroy: function() {
        var tree = this.tree;

        tree.off(this);
        forEach(API_LIST, function(apiName) {
            delete tree[apiName];
        });
    },

    /**
     * Set apis of checkbox tree
     * @private
     */
    _setAPIs: function() {
        var tree = this.tree,
            bind = tui.util.bind;

        forEach(API_LIST, function(apiName) {
            tree[apiName] = bind(this[apiName], this);
        }, this);
    },

    /**
     * Attach event to tree instance
     * @private
     */
    _attachEvents: function() {
        this.tree.on({
            singleClick: function(event) {
                var target = util.getTarget(event),
                    nodeId, state;

                if (util.hasClass(target, this.checkboxClassName)) {
                    nodeId = this.tree.getNodeIdFromElement(target);
                    state = this._getStateFromCheckbox(target);
                    this._continuePostprocessing(nodeId, state);
                }
            },
            afterDraw: function(nodeId) {
                if (this.tree.isMovingNode) {
                    return;
                }
                this._reflectChanges(nodeId);
            },
            move: function(data) {
                //@todo - Optimization
                this._reflectChanges(data.originalParentId);
                this._reflectChanges(data.newParentId);
            }
        }, this);
    },

    /**
     * Reflect the changes on node.
     * @param {string} nodeId - Node id
     * @private
     */
    _reflectChanges: function(nodeId) {
        this.tree.each(function(descendant, descendantId) {
            this._setState(descendantId, this._getState(descendantId), true);
        }, nodeId, this);
        this._judgeOwnState(nodeId);
        this._updateAllAncestorsState(nodeId);
    },

    /**
     * Set checkbox attributes (checked, indeterminate)
     * @param {Element} checkbox - Checkbox element
     * @param {boolean} isChecked - "checked"
     * @param {boolean} isIndeterminate - "indeterminate"
     * @private
     */
    _setCheckboxAttr: function(checkbox, isChecked, isIndeterminate) {
        checkbox.indeterminate = isIndeterminate;
        checkbox.checked = isChecked;
    },

    /**
     * Get checking state of node
     * @param {string} nodeId - Node id
     * @param {number} state - State for checkbox
     * @param {boolean} [stopPropagation] - If true, stop changing state propagation
     * @private
     */
    _setState: function(nodeId, state, stopPropagation) {
        var checkbox = this._getCheckboxElement(nodeId);

        if (!checkbox) {
            return;
        }

        switch (state) {
            case STATE_CHECKED:
                this._setCheckboxAttr(checkbox, true, false);
                break;
            case STATE_UNCHECKED:
                this._setCheckboxAttr(checkbox, false, false);
                break;
            case STATE_INDETERMINATE:
                this._setCheckboxAttr(checkbox, false, true);
                break;
            default: // no more process if the state is invalid
                return;
        }

        this._continuePostprocessing(nodeId, state, stopPropagation);
    },

    /**
     * Get checking state of node
     * @param {string} nodeId - Node id
     * @returns {number} Checking state
     * @private
     */
    _getState: function(nodeId) {
        var tree = this.tree,
            state = tree.getNodeData(nodeId)[DATA_KEY_FOR_CHECKBOX_STATE],
            checkbox;

        if (!state) {
            checkbox = this._getCheckboxElement(nodeId);
            state = this._getStateFromCheckbox(checkbox);
        }

        return state;
    },

    /**
     * Get checking state of node element
     * @private
     * @param {Element} checkbox - Checkbox element
     * @returns {?number} Checking state
     */
    _getStateFromCheckbox: function(checkbox) {
        var state;

        if (!checkbox) {
            return null;
        }

        if (checkbox.checked) {
            state = STATE_CHECKED;
        } else if (checkbox.indeterminate) {
            state = STATE_INDETERMINATE;
        } else {
            state = STATE_UNCHECKED;
        }

        return state;
    },

    /**
     * Continue post-processing from changing:checkbox-state
     * @param {string} nodeId - Node id
     * @param {number} state - Checkbox state
     * @param {boolean} [stopPropagation] - If true, stop update-propagation
     * @private
     */
    _continuePostprocessing: function(nodeId, state, stopPropagation) {
        var tree = this.tree,
            checkedList = this.checkedList,
            eventName;

        /* Prevent duplicated node id */
        util.removeItemFromArray(nodeId, checkedList);

        if (state === STATE_CHECKED) {
            checkedList.push(nodeId);
            /**
             * @api
             * @event Tree#check
             * @param {string} nodeId - Checked node id
             * @example
             * tree.on('check', function(nodeId) {
             *     console.log('checked: ' + nodeId);
             * });
             */
            eventName = 'check';
        } else if (state === STATE_UNCHECKED) {
            /**
             * @api
             * @event Tree#uncheck
             * @param {string} nodeId - Unchecked node id
             * @example
             * tree.on('uncheck', function(nodeId) {
             *     console.log('unchecked: ' + nodeId);
             * });
             */
            eventName = 'uncheck';
        }
        DATA[DATA_KEY_FOR_CHECKBOX_STATE] = state;
        tree.setNodeData(nodeId, DATA, true);

        if (!stopPropagation) {
            this._propagateState(nodeId, state);
            tree.fire(eventName, nodeId);
        }
    },

    /**
     * Propagate a node state to descendants and ancestors for updating their states
     * @param {string} nodeId - Node id
     * @param {number} state - Checkbox state
     * @private
     */
    _propagateState: function(nodeId, state) {
        if (state === STATE_INDETERMINATE) {
            return;
        }

        this._updateAllDescendantsState(nodeId, state);
        this._updateAllAncestorsState(nodeId);
    },

    /**
     * Update all descendants state
     * @param {string} nodeId - Node id
     * @param {number} state - State for checkbox
     * @private
     */
    _updateAllDescendantsState: function(nodeId, state) {
        this.tree.each(function(descendant, descendantId) {
            this._setState(descendantId, state, true);
        }, nodeId, this);
    },

    /**
     * Update all ancestors state
     * @param {string} nodeId - Node id
     * @private
     */
    _updateAllAncestorsState: function(nodeId) {
        var tree = this.tree,
            parentId = tree.getParentId(nodeId);

        while (parentId) {
            this._judgeOwnState(parentId);
            parentId = tree.getParentId(parentId);
        }
    },

    /**
     * Judge own state from child node is changed
     * @param {string} nodeId - Node id
     * @private
     */
    _judgeOwnState: function(nodeId) {
        var tree = this.tree,
            childIds = tree.getChildIds(nodeId),
            checked = true,
            unchecked = true;

        if (!childIds.length) {
            checked = this.isChecked(nodeId);
        } else {
            forEach(childIds, function(childId) {
                var state = this._getState(childId);
                checked = (checked && state === STATE_CHECKED);
                unchecked = (unchecked && state === STATE_UNCHECKED);

                return checked || unchecked;
            }, this);
        }

        if (checked) {
            this._setState(nodeId, STATE_CHECKED, true);
        } else if (unchecked) {
            this._setState(nodeId, STATE_UNCHECKED, true);
        } else {
            this._setState(nodeId, STATE_INDETERMINATE, true);
        }
    },

    /**
     * Get checkbox element of node
     * @param {string} nodeId - Node id
     * @returns {?HTMLElement} Checkbox element
     * @private
     */
    _getCheckboxElement: function(nodeId) {
        var tree = this.tree,
            el, nodeEl;

        if (nodeId === tree.getRootNodeId()) {
            el = this.rootCheckbox;
        } else {
            nodeEl = document.getElementById(nodeId);
            if (!nodeEl) {
                return null;
            }
            el = util.getElementsByClassName(
                nodeEl,
                this.checkboxClassName
            )[0];
        }

        return el;
    },

    /**
     * Check node
     * @api
     * @memberOf Tree.prototype
     * @param {string} nodeId - Node id
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.check(nodeId);
     */
    check: function(nodeId) {
        if (!this.isChecked(nodeId)) {
            this._setState(nodeId, STATE_CHECKED);
        }
    },

    /**
     * Uncheck node
     * @api
     * @memberOf Tree.prototype
     * @param {string} nodeId - Node id
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.uncheck(nodeId);
     */
    uncheck: function(nodeId) {
        if (!this.isUnchecked(nodeId)) {
            this._setState(nodeId, STATE_UNCHECKED);
        }
    },

    /**
     * Toggle node checking
     * @api
     * @memberOf Tree.prototype
     * @param {string} nodeId - Node id
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.toggleCheck(nodeId);
     */
    toggleCheck: function(nodeId) {
        if (!this.isChecked(nodeId)) {
            this.check(nodeId);
        } else {
            this.uncheck(nodeId);
        }
    },

    /**
     * Whether the node is checked
     * @api
     * @memberOf Tree.prototype
     * @param {string} nodeId - Node id
     * @returns {boolean} True if node is indeterminate
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.check(nodeId);
     * console.log(tree.isChecked(nodeId)); // true
     */
    isChecked: function(nodeId) {
        return STATE_CHECKED === this._getState(nodeId);
    },

    /**
     * Whether the node is indeterminate
     * @api
     * @memberOf Tree.prototype
     * @param {string} nodeId - Node id
     * @returns {boolean} True if node is indeterminate
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.check(nodeId);
     * console.log(tree.isIndeterminate(nodeId)); // false
     */
    isIndeterminate: function(nodeId) {
        return STATE_INDETERMINATE === this._getState(nodeId);
    },

    /**
     * Whether the node is unchecked or not
     * @api
     * @memberOf Tree.prototype
     * @param {string} nodeId - Node id
     * @returns {boolean} True if node is unchecked.
     * @example
     * var nodeId = 'tui-tree-node-3';
     * tree.uncheck(nodeId);
     * console.log(tree.isUnchecked(nodeId)); // true
     */
    isUnchecked: function(nodeId) {
        return STATE_UNCHECKED === this._getState(nodeId);
    },

    /**
     * Get checked list
     * @api
     * @memberOf Tree.prototype
     * @param {string} [parentId] - Node id (default: rootNode id)
     * @returns {Array.<string>} Checked node ids
     * @example
     * //
     * // node1(v)
     * //   node2(v)
     * //   node3(v)
     * // node4
     * //   node5(v)
     * // node6
     * //   node7(v)
     * //     node8(v)
     * //   node9
     *
     * var allCheckedList = tree.getCheckedList(); // ['node1', 'node2', 'node3' ,....]
     * var descendantsCheckedList = tree.getCheekedList('node6'); // ['node7', 'node8']
     */
    getCheckedList: function(parentId) {
        var tree = this.tree,
            checkedList = this.checkedList;

        if (!parentId) {
            return checkedList.slice();
        }

        return filter(checkedList, function(nodeId) {
            return tree.contains(parentId, nodeId);
        });
    },

    /**
     * Get top checked list
     * @api
     * @memberOf Tree.prototype
     * @param {string} [parentId] - Node id (default: rootNode id)
     * @returns {Array.<string>} Checked node ids
     * @example
     * //
     * // node1(v)
     * //   node2(v)
     * //   node3(v)
     * // node4
     * //   node5(v)
     * // node6
     * //   node7(v)
     * //     node8(v)
     * //   node9
     *
     * var allTopCheckedList = tree.getTopCheckedList(); // ['node1', 'node5', 'node7']
     * var descendantsTopCheckedList = tree.getTopCheekedList('node6'); // ['node7']
     */
    getTopCheckedList: function(parentId) {
        var tree = this.tree,
            checkedList = [],
            state;

        parentId = parentId || tree.getRootNodeId();
        state = this._getState(parentId);
        if (state === STATE_CHECKED) {
            checkedList = tree.getChildIds(parentId);
        } else if (state === STATE_INDETERMINATE) {
            checkedList = this.getCheckedList(parentId);
            checkedList = filter(checkedList, function(nodeId) {
                return !this.isChecked(tree.getParentId(nodeId));
            }, this);
        }

        return checkedList;
    },

    /**
     * Get bottom checked list
     * @api
     * @memberOf Tree.prototype
     * @param {string} [parentId] - Node id (default: rootNode id)
     * @returns {Array.<string>} Checked node ids
     * @example
     * //
     * // node1(v)
     * //   node2(v)
     * //   node3(v)
     * // node4
     * //   node5(v)
     * // node6
     * //   node7(v)
     * //     node8(v)
     * //   node9
     *
     * var allBottomCheckedList = tree.getBottomCheckedList(); // ['node2', 'node3', 'node5', 'node8']
     * var descendantsBottomCheckedList = tree.getBottomCheekedList('node6'); // ['node8']
     */
    getBottomCheckedList: function(parentId) {
        var tree = this.tree,
            checkedList;

        parentId = parentId || tree.getRootNodeId();
        checkedList = this.getCheckedList(parentId);

        return filter(checkedList, function(nodeId) {
            return tree.isLeaf(nodeId);
        });
    }
});

tui.util.CustomEvents.mixin(Checkbox);
module.exports = Checkbox;

},{"../util.js":13}],7:[function(require,module,exports){
'use strict';
var util = require('./../util');

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
 */
var Draggable = tui.util.defineClass(/** @lends Draggable.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf Selectable
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

        style.position = 'absolute';
        style.display = 'none';
        this.tree.rootElement.parentNode.appendChild(helperElement);
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
        var tree = this.tree,
            helperEl = this.helperElement,
            pos = tree.rootElement.getBoundingClientRect();
        if (!this.useHelper) {
            return;
        }

        helperEl.style.top = event.clientY - pos.top + this.helperPos.y + 'px';
        helperEl.style.left = event.clientX - pos.left + this.helperPos.x + 'px';
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
    }
});

module.exports = Draggable;

},{"./../util":13}],8:[function(require,module,exports){
'use strict';

var util = require('./../util');

var API_LIST = [];

/**
 * Set the tree selectable
 * @class Editable
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {string} options.editableClassName - Classname of editable element
 *  @param {string} options.dataKey - Key of node data to set value
 *  @param {string} options.inputClassName - Classname of input element
 */
var Editable = tui.util.defineClass(/** @lends Editable.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf Selectable
         * @returns {Array.<string>} API list of Editable
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },

    init: function(tree, options) { /*eslint-enable*/
        options = tui.util.extend({}, options);
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
        if (inputClassName) {
            el.className = inputClassName;
        }
        el.setAttribute('type', 'text');

        return el;
    },

    /**
     * Custom event handler "doubleClick"
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
     * Event handler: keyup - input element
     * @param {Event} event - Key event
     */
    onKeyup: function(event) {
        if (event.keyCode === 13) { // keyup "enter"
            this.setData();
        }
    },

    /**
     * Event handler: blur - input element
     */
    onBlur: function() {
        this.setData();
    },

    /**
     * Set data of input element to node and detach input element from doc.
     */
    setData: function() {
        var tree = this.tree,
            nodeId = tree.getNodeIdFromElement(this.inputElement),
            data = {};

        if (nodeId) {
            data[this.dataKey] = this.inputElement.value;
            tree.setNodeData(nodeId, data);
        }
        this.detachInputFromDocument();
    }
});

module.exports = Editable;

},{"./../util":13}],9:[function(require,module,exports){
'use strict';

var util = require('./../util');

var API_LIST = [
        'select',
        'getSelectedNodeId'
    ],
    defaults = {
        selectedClassName: 'tui-tree-selected'
    };

/**
 * Set the tree selectable
 * @class Selectable
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options
 *  @param {string} options.selectedClassName - Classname for selected node.
 */
var Selectable = tui.util.defineClass(/** @lends Selectable.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf Selectable
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

    /* eslint-disable valid-jsdoc
        Ignore "target" parameter annotation for API page
        "tree.select(nodeId)"
     */
    /**
     * Select node if the feature-"Selectable" is enabled.
     * @api
     * @memberOf Tree.prototype
     * @requires Selectable
     * @param {string} nodeId - Node id
     * @example
     * tree.select('tui-tree-node-3');
     */
    /* eslint-enable valid-jsdoc */
    select: function(nodeId, target) {
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
         * @api
         * @event Tree#beforeSelect
         * @param {string} nodeId - Selected node id
         * @param {string} prevNodeId - Previous selected node id
         * @param {Element|undefined} target - Target element
         * @example
         * tree
         *  .enableFeature('Selectable')
         *  .on('beforeSelect', function(nodeId, prevNodeId, target) {
         *      console.log('selected node: ' + nodeId);
         *      console.log('previous selected node: ' + prevNodeId);
         *      console.log('target element: ' + target);
         *      return false; // It cancels "select"
         *      // return true; // It fires "select"
         *  });
         */
        if (tree.invoke('beforeSelect', nodeId, prevNodeId, target)) {
            util.removeClass(prevElement, selectedClassName);
            util.addClass(nodeElement, selectedClassName);

            /**
             * @api
             * @event Tree#select
             * @param {string} nodeId - Selected node id
             * @param {string} prevNodeId - Previous selected node id
             * @param {Element|undefined} target - Target element
             * @example
             * tree
             *  .enableFeature('Selectable')
             *  .on('select', function(nodeId, prevNodeId, target) {
             *      console.log('selected node: ' + nodeId);
             *      console.log('previous selected node: ' + prevNodeId);
             *      console.log('target element: ' + target);
             *  });
             */
            tree.fire('select', nodeId, prevNodeId, target);
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
     * @api
     * @memberOf Tree.prototype
     * @returns {string} selected node id
     */
    getSelectedNodeId: function() {
        return this.selectedNodeId;
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

},{"./../util":13}],10:[function(require,module,exports){
/**
 * @fileoverview Render tree and update tree.
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

'use strict';

var util = require('./util'),
    defaultOption = require('./consts/defaultOption'),
    states = require('./consts/states'),
    messages = require('./consts/messages'),
    outerTemplate = require('./consts/outerTemplate'),
    TreeModel = require('./treeModel'),
    Selectable = require('./features/selectable'),
    Draggable = require('./features/draggable'),
    Editable = require('./features/editable'),
    Checkbox = require('./features/checkbox');

var nodeStates = states.node,
    features = {
        Selectable: Selectable,
        Draggable: Draggable,
        Editable: Editable,
        Checkbox: Checkbox
    },
    snippet = tui.util,
    extend = snippet.extend,
    TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK = 200,
    MOUSE_MOVING_THRESHOLD = 5;
/**
 * Create tree model and inject data to model
 * @class Tree
 * @constructor
 * @mixes tui.util.CustomEvents
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
 *         @param {string} [options.classNames.nodeClass] A class name for node
 *         @param {string} [options.classNames.leafClass] A class name for leaf node
 *         @param {string} [options.classNames.openedClass] A class name for opened node
 *         @param {string} [options.classNames.closedClass] A class name for closed node
 *         @param {string} [options.classNames.textClass] A class name that for textElement in node
 *         @param {string} [options.classNames.subtreeClass] A class name for subtree in internal node
 *         @param {string} [options.classNames.toggleBtnClass] A class name for toggle button in internal node
 *     @param {Function} [options.renderTemplate] Function for rendering template
 * @example
 * //Default options:
 * // {
 * //     nodeIdPrefix: 'tui-tree-node-'
 * //     nodeDefaultState: 'closed',
 * //     stateLabels: {
 * //         opened: '-',
 * //         closed: '+'
 * //     },
 * //     classNames: {
 * //         nodeClass: 'tui-tree-node',
 * //         leafClass: 'tui-tree-leaf',
 * //         openedClass: 'tui-tree-opened',
 * //         closedClass: 'tui-tree-closed',
 * //         subtreeClass: 'tui-tree-subtree',
 * //         toggleBtnClass: 'tui-tree-toggleBtn',
 * //         textClass: 'tui-tree-text',
 * //     },
 * //     template: {
 * //         internalNode:
 * //             '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
 * //             '<span class="{{textClass}}">{{text}}</span>' +
 * //             '<ul class="{{subtreeClass}}">{{children}}</ul>'
 * //         leafNode:
 * //             '<span class="{{textClass}}">{{text}}</span>' +
 * //     }
 * // }
 * //
 *
 * var data = [
 *     {text: 'rootA', children: [
 *         {text: 'root-1A'},
 *         {text: 'root-1B'},
 *         {text: 'root-1C'},
 *         {text: 'root-1D'},
 *         {text: 'root-2A', children: [
 *             {text:'sub_1A', children:[
 *                 {text:'sub_sub_1A'}
 *             ]},
 *             {text:'sub_2A'}
 *         ]},
 *         {text: 'root-2B'},
 *         {text: 'root-2C'},
 *         {text: 'root-2D'},
 *         {text: 'root-3A', children: [
 *             {text:'sub3_a'},
 *             {text:'sub3_b'}
 *         ]},
 *         {text: 'root-3B'},
 *         {text: 'root-3C'},
 *         {text: 'root-3D'}
 *     ]},
 *     {text: 'rootB', children: [
 *         {text:'B_sub1'},
 *         {text:'B_sub2'},
 *         {text:'b'}
 *     ]}
 * ];
 *
 * var tree1 = new tui.component.Tree(data, {
 *     rootElement: 'treeRoot', // or document.getElementById('treeRoot')
 *     nodeDefaultState: 'opened',
 *
 *     // ========= Option: Override template renderer ===========
 *
 *     template: { // template for Mustache engine
 *         internalNode:
 *             '<button type="button" class="{{toggleBtnClass}}">{{{stateLabel}}}</button>' +
 *             '<span class="{{textClass}}">{{{text}}}</span>' +
 *             '<ul class="{{subtreeClass}}">{{{children}}}</ul>'
 *         leafNode:
 *             '<span class="{{textClass}}">{{{text}}}</span>' +
 *     },
 *     renderTemplate: function(source, props) {
 *         // Mustache template engine
 *         return Mustache.render(template, props);
 *     }
 * });
 **/
var Tree = snippet.defineClass(/** @lends Tree.prototype */{ /*eslint-disable*/
    init: function(data, options) { /*eslint-enable*/
        options = extend({}, defaultOption, options);

        /**
         * Default class names
         * @type {object.<string, string>}
         */
        this.classNames = extend({}, defaultOption.classNames, options.classNames);

        /**
         * Default template
         * @type {{internalNode: string, leafNode: string}}
         */
        this.template = extend({}, defaultOption.template, options.template);

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

        /**
         * Click timer to prevent click-duplication with double click
         * @type {number}
         */
        this.clickTimer = null;

        /**
         * To prevent click event if mouse moved before mouseup.
         * @type {number}
         */
        this._mouseMovingFlag = false;

        /**
         * Render template
         * It can be overrode by user's template engine.
         * @type {Function}
         * @private
         */
        this._renderTemplate = options.renderTemplate || util.renderTemplate;

        /**
         * True when a node is moving
         * @api
         * @type {boolean}
         * @example
         * tree.on({
         *     beforeDraw: function(nodeId) {
         *         if (tree.isMovingNode) {
         *             return;
         *         }
         *         //..
         *     },
         *     //....
         * });
         * tree.move('tui-tree-node-1', 'tui-tree-node-2');
         */
        this.isMovingNode = false;

        this._setRoot();
        this._draw(this.getRootNodeId());
        this._setEvents();
    },

    /**
     * Set root element of tree
     * @private
     */
    _setRoot: function() {
        var rootEl = this.rootElement;

        if (snippet.isString(rootEl)) {
            rootEl = this.rootElement = document.getElementById(rootEl);
        }

        if (!snippet.isHTMLNode(rootEl)) {
            throw new Error(messages.INVALID_ROOT_ELEMENT);
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
        this._draw(originalParentId);
        this._draw(newParentId);

        /**
         * @api
         * @event Tree#move
         * @param {{nodeId: string, originalParentId: string, newParentId: string}} treeEvent - Tree event
         * @example
         * tree.on('move', function(treeEvent) {
         *     var nodeId = treeEvent.nodeId,
         *         originalParentId = treeEvent.originalParentId,
         *         newParentId = treeEvent.newParentId;
         *
         *     console.log(nodeId, originalParentId, newParentId);
         * });
         */
        this.fire('move', {
            nodeId: nodeId,
            originalParentId: originalParentId,
            newParentId: newParentId
        });
    },

    /**
     * Set event handlers
     * @private
     */
    _setEvents: function() {
        this.model.on({
            update: this._draw,
            move: this._onMove
        }, this);
        util.addEventListener(this.rootElement, 'click', snippet.bind(this._onClick, this));
        util.addEventListener(this.rootElement, 'mousedown', snippet.bind(this._onMousedown, this));
        util.addEventListener(this.rootElement, 'dblclick', snippet.bind(this._onDoubleClick, this));
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} downEvent - Mouse event
     * @private
     */
    _onMousedown: function(downEvent) {
        var self = this,
            clientX = downEvent.clientX,
            clientY = downEvent.clientY,
            abs = Math.abs;

        function onMouseMove(moveEvent) {
            var newClientX = moveEvent.clientX,
                newClientY = moveEvent.clientY;

            if (abs(newClientX - clientX) + abs(newClientY - clientY) > MOUSE_MOVING_THRESHOLD) {
                self.fire('mousemove', moveEvent);
                self._mouseMovingFlag = true;
            }
        }
        function onMouseUp(upEvent) {
            self.fire('mouseup', upEvent);
            util.removeEventListener(document, 'mousemove', onMouseMove);
            util.removeEventListener(document, 'mouseup', onMouseUp);
        }

        this._mouseMovingFlag = false;
        this.fire('mousedown', downEvent);
        util.addEventListener(document, 'mousemove', onMouseMove);
        util.addEventListener(document, 'mouseup', onMouseUp);
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

        if (!this.clickTimer && !this._mouseMovingFlag) {
            this.fire('singleClick', event);
            this.clickTimer = setTimeout(function() {
                self.resetClickTimer();
            }, TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK);
        }
    },

    /**
     * Event handler - double click (dblclick)
     * @param {MouseEvent} event - Double click event
     * @private
     */
    _onDoubleClick: function(event) {
        this.fire('doubleClick', event);
        this.resetClickTimer();
    },

    /**
     * Set node state - opened or closed
     * @param {string} nodeId - Node id
     * @param {string} state - Node state
     * @private
     */
    _setDisplayFromNodeState: function(nodeId, state) {
        var subtreeElement = this._getSubtreeElement(nodeId),
            label, btnElement, nodeElement;

        if (!subtreeElement || subtreeElement === this.rootElement) {
            return;
        }
        label = this.stateLabels[state];
        nodeElement = document.getElementById(nodeId);
        btnElement = util.getElementsByClassName(
            nodeElement,
            this.classNames.toggleBtnClass
        )[0];

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
     * @see outerTemplate uses "util.renderTemplate"
     */
    _makeHtml: function(nodeIds) {
        var model = this.model,
            html = '';

        snippet.forEach(nodeIds, function(nodeId) {
            var node = model.getNode(nodeId),
                sources, props;

            if (!node) {
                return;
            }

            sources = this._getTemplate(node);
            props = this._makeTemplateProps(node);
            props.innerTemplate = this._makeInnerHTML(node, {
                source: sources.inner,
                props: props
            });
            html += util.renderTemplate(sources.outer, props);
        }, this);

        return html;
    },

    /**
     * Make inner html of node
     * @param {TreeNode} node - Node
     * @param {{source: string, props: Object}} [cached] - Cashed data to make html
     * @returns {string} Inner html of node
     * @private
     * @see innerTemplate uses "this._renderTemplate"
     */
    _makeInnerHTML: function(node, cached) {
        var source, props;

        cached = cached || {};
        source = cached.source || this._getTemplate(node).inner;
        props = cached.props || this._makeTemplateProps(node);

        return this._renderTemplate(source, props);
    },

    /**
     * Get template sources
     * @param {TreeNode} node - Node
     * @returns {{inner: string, outer: string}} Template sources
     * @private
     */
    _getTemplate: function(node) {
        var source;

        if (node.isLeaf()) {
            source = {
                inner: this.template.leafNode,
                outer: outerTemplate.LEAF_NODE
            };
        } else {
            source = {
                inner: this.template.internalNode,
                outer: outerTemplate.INTERNAL_NODE
            };
        }

        return source;
    },

    /**
     * Make template properties
     * @param {TreeNode} node - Node
     * @returns {Object} Template properties
     * @private
     */
    _makeTemplateProps: function(node) {
        var classNames = this.classNames,
            props, state;

        if (node.isLeaf()) {
            props = {
                id: node.getId(),
                isLeaf: true // for custom template method
            };
        } else {
            state = node.getState();
            props = {
                id: node.getId(),
                stateClass: classNames[state + 'Class'],
                stateLabel: this.stateLabels[state],
                children: this._makeHtml(node.getChildIds())
            };
        }

        return extend(props, classNames, node.getAllData());
    },

    /**
     * Draw element of node
     * @param {string} nodeId - Node id
     * @private
     */
    _draw: function(nodeId) {
        var node = this.model.getNode(nodeId),
            element, html;

        if (!node) {
            return;
        }

        /**
         * @api
         * @event Tree#beforeDraw
         * @param {string} nodeId - Node id
         * @example
         * tree.on('beforeDraw', function(nodeId) {
         *     if (tree.isMovingNode) {
         *         console.log('isMovingNode');
         *     }
         *     console.log('beforeDraw: ' + nodeId);
         * });
         */
        this.fire('beforeDraw', nodeId);

        if (node.isRoot()) {
            html = this._makeHtml(node.getChildIds());
            element = this.rootElement;
        } else {
            html = this._makeInnerHTML(node);
            element = document.getElementById(nodeId);
        }
        element.innerHTML = html;
        this._setClassWithDisplay(node);

        /**
         * @api
         * @event Tree#afterDraw
         * @param {string} nodeId - Node id
         * @example
         * tree.on('afterDraw', function(nodeId) {
         *     if (tree.isMovingNode) {
         *         console.log('isMovingNode');
         *     }
         *     console.log('afterDraw: ' + nodeId);
         * });
         */
        this.fire('afterDraw', nodeId);
    },

    /**
     * Set class and display of node element
     * @param {TreeNode} node - Node
     * @private
     */
    _setClassWithDisplay: function(node) {
        var nodeId = node.getId(),
            element = document.getElementById(nodeId),
            classNames = this.classNames;

        if (node.isLeaf()) {
            util.removeClass(element, classNames.openedClass);
            util.removeClass(element, classNames.closedClass);
            util.addClass(element, classNames.leafClass);
        } else {
            this._setDisplayFromNodeState(nodeId, node.getState());
            this.each(function(child) {
                this._setClassWithDisplay(child);
            }, nodeId, this);
        }
    },

    /**
     * Get subtree element
     * @param {string} nodeId - TreeNode id
     * @returns {HTMLElement} Subtree element
     * @private
     */
    _getSubtreeElement: function(nodeId) {
        var node = this.model.getNode(nodeId),
            subtreeElement;

        if (!node || node.isLeaf()) {
            subtreeElement = null;
        } else if (node.isRoot()) {
            subtreeElement = this.rootElement;
        } else {
            subtreeElement = util.getElementsByClassName(
                document.getElementById(nodeId),
                this.classNames.subtreeClass
            )[0];
        }

        return subtreeElement;
    },

    /**
     * Return the depth of node
     * @api
     * @param {string} nodeId - Node id
     * @returns {number|undefined} Depth
     */
    getDepth: function(nodeId) {
        return this.model.getDepth(nodeId);
    },

    /**
     * Return the last depth of tree
     * @api
     * @returns {number} Last depth
     */
    getLastDepth: function() {
        return this.model.getLastDepth();
    },

    /**
     * Return root node id
     * @api
     * @returns {string} Root node id
     */
    getRootNodeId: function() {
        return this.model.rootNode.getId();
    },

    /**
     * Return child ids
     * @api
     * @param {string} nodeId - Node id
     * @returns {Array.<string>|undefined} Child ids
     */
    getChildIds: function(nodeId) {
        return this.model.getChildIds(nodeId);
    },

    /**
     * Return parent id of node
     * @api
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
     * Get node id from element
     * @api
     * @param {HTMLElement} element - Element
     * @returns {string} Node id
     * @example
     * tree.getNodeIdFromElement(elementInNode); // 'tui-tree-node-3'
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
     * @api
     * @returns {string} Prefix of node id
     * @example
     * tree.getNodeIdPrefix(); // 'tui-tree-node-'
     */
    getNodeIdPrefix: function() {
        return this.model.getNodeIdPrefix();
    },

    /**
     * Get node data
     * @api
     * @param {string} nodeId - Node id
     * @returns {object|undefined} Node data
     */
    getNodeData: function(nodeId) {
        return this.model.getNodeData(nodeId);
    },

    /**
     * Set data properties of a node
     * @api
     * @param {string} nodeId - Node id
     * @param {object} data - Properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     * @exmaple
     * tree.setNodeData(nodeId, {foo: 'bar'}); // auto refresh
     * tree.setNodeData(nodeId, {foo: 'bar'}, true); // not refresh
     */
    setNodeData: function(nodeId, data, isSilent) {
        this.model.setNodeData(nodeId, data, isSilent);
    },

    /**
     * Remove node data
     * @api
     * @param {string} nodeId - Node id
     * @param {string|Array} names - Names of properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     * @example
     * tree.setNodeData(nodeId, 'foo'); // auto refresh
     * tree.setNodeData(nodeId, 'foo', true); // not refresh
     */
    removeNodeData: function(nodeId, names, isSilent) {
        this.model.removeNodeData(nodeId, names, isSilent);
    },

    /**
     * Get node state.
     * @param {string} nodeId - Node id
     * @returns {string|null} Node state(('opened', 'closed', null)
     * @example
     * tree.getState(nodeId); // 'opened', 'closed',
     *                        // undefined if the node is nonexistent
     */
    getState: function(nodeId) {
        var node = this.model.getNode(nodeId);

        if (!node) {
            return null;
        }

        return node.getState();
    },

    /**
     * Open node
     * @api
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
     * @api
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
     * @api
     * @param {string} nodeId - Node id
     */
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
     * @api
     * @param {Function} comparator - Comparator for sorting
     * @param {boolean} [isSilent] - If true, it doesn't redraw tree
     * @example
     * // Sort with redrawing tree
     * tree.sort(function(nodeA, nodeB) {
     *     var aValue = nodeA.getData('text'),
     *         bValue = nodeB.getData('text');
     *
     *     if (!bValue || !bValue.localeCompare) {
     *         return 0;
     *     }
     *     return bValue.localeCompare(aValue);
     * });
     *
     * // Sort, but not redraw tree
     * tree.sort(function(nodeA, nodeB) {
     *     var aValue = nodeA.getData('text'),
     *         bValue = nodeB.getData('text');
     *
     *     if (!bValue || !bValue.localeCompare) {
     *         return 0;
     *     }
     *     return bValue.localeCompare(aValue);
     * }, true);
     */
    sort: function(comparator, isSilent) {
        this.model.sort(comparator);
        if (!isSilent) {
            this.refresh();
        }
    },

    /**
     * Refresh tree or node's children
     * @api
     * @param {string} [nodeId] - TreeNode id to refresh
     */
    refresh: function(nodeId) {
        nodeId = nodeId || this.getRootNodeId();
        this._draw(nodeId);
    },

    /**
     * Traverse this tree iterating over all nodes.
     * @api
     * @param {Function} iteratee - Iteratee function
     * @param {object} [context] - Context of iteratee
     * @example
     * tree.eachAll(function(node, nodeId) {
     *     console.log(node.getId() === nodeId); // true
     * });
     */
    eachAll: function(iteratee, context) {
        this.model.eachAll(iteratee, context);
    },

    /**
     * Traverse this tree iterating over all descendants of a node.
     * @api
     * @param {Function} iteratee - Iteratee function
     * @param {string} parentId - Parent node id
     * @param {object} [context] - Context of iteratee
     * @example
     * tree.each(function(node, nodeId) {
     *     console.log(node.getId() === nodeId); // true
     * }, parentId);
     *
     */
    each: function(iteratee, parentId, context) {
        this.model.each(iteratee, parentId, context);
    },

    /**
     * Add node(s).
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - If 'isSilent' is not true, it redraws the tree
     * @api
     * @param {Array|object} data - Raw-data
     * @param {*} [parentId] - Parent id
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @returns {Array.<string>} Added node ids
     * @example
     * // add node with redrawing
     * var firstAddedIds = tree.add({text:'FE development team1'}, parentId);
     * console.log(firstAddedIds); // ["tui-tree-node-10"]
     *
     * // add node without redrawing
     * var secondAddedIds = tree.add([
     *    {text: 'FE development team2'},
     *    {text: 'FE development team3'}
     * ], parentId, true);
     * console.log(secondAddedIds); // ["tui-tree-node-11", "tui-tree-node-12"]
     */
    add: function(data, parentId, isSilent) {
        return this.model.add(data, parentId, isSilent);
    },

    /**
     * Reset all data
     * @api
     * @param {Array|object} data - Raw data for all nodes
     * @returns {Array.<string>} Added node ids
     * @example
     * tree.resetAllData([
     *  {text: 'hello', children: [
     *      {text: 'foo'},
     *      {text: 'bar'}
     *  ]},
     *  {text: 'wolrd'}
     * ]);
     */
    resetAllData: function(data) {
        this.removeAllChildren(this.getRootNodeId(), true);

        return this.add(data);
    },

    /**
     * Remove all children
     * @api
     * @param {string} nodeId - Parent node id
     * @param {boolean} [isSilent] - If true, it doesn't redraw the node
     * @example
     * tree.removeAllChildren(nodeId); // Redraws the node
     * tree.removeAllChildren(nodId, true); // Doesn't redraw the node
     */
    removeAllChildren: function(nodeId, isSilent) {
        var children = this.getChildIds(nodeId);

        tui.util.forEach(children, function(childId) {
            this.remove(childId, true);
        }, this);

        if (!isSilent) {
            this._draw(nodeId);
        }
    },

    /**
     * Remove a node with children.
     * - If 'isSilent' is not true, it redraws the tree
     * @api
     * @param {string} nodeId - Node id to remove
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @example
     * tree.remove(myNodeId); // remove node with redrawing
     * tree.remove(myNodeId, true); // remove node without redrawing
     */
    remove: function(nodeId, isSilent) {
        this.model.remove(nodeId, isSilent);
    },

    /**
     * Move a node to new parent
     * - If 'isSilent' is not true, it redraws the tree
     * @api
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @example
     * tree.move(myNodeId, newParentId); // mode node with redrawing
     * tree.move(myNodeId, newParentId, true); // move node without redrawing
     */
    move: function(nodeId, newParentId, isSilent) {
        this.isMovingNode = true;
        this.model.move(nodeId, newParentId, isSilent);
        this.isMovingNode = false;
    },

    /**
     * Search node ids by passing the predicate check or matching data
     * @api
     * @param {Function|Object} predicate - Predicate or data
     * @param {Object} [context] - Context of predicate
     * @returns {Array.<string>} Node ids
     * @example
     * // search from predicate
     * var leafNodeIds = tree.search(function(node, nodeId) {
     *     return node.isLeaf();
     * });
     * console.log(leafNodeIds); // ['tui-tree-node-3', 'tui-tree-node-5']
     *
     * // search from data
     * var specialNodeIds = tree.search({
     *     isSpecial: true,
     *     foo: 'bar'
     * });
     * console.log(specialNodeIds); // ['tui-tree-node-5', 'tui-tree-node-10']
     * console.log(tree.getNodeData('tui-tree-node-5').isSpecial); // true
     * console.log(tree.getNodeData('tui-tree-node-5').foo); // 'bar'
     */
    search: function(predicate, context) {
        if (!snippet.isObject(predicate)) {
            return [];
        }

        if (snippet.isFunction(predicate)) {
            return this._filter(predicate, context);
        }

        return this._where(predicate);
    },

    /**
     * Search node ids by matching data
     * @param {Object} props - Data
     * @returns {Array.<string>} Node ids
     * @private
     */
    _where: function(props) {
        return this._filter(function(node) {
            var result = true,
                data = node.getAllData();

            snippet.forEach(props, function(value, key) {
                result = (key in data) && (data[key] === value);

                return result;
            });

            return result;
        });
    },

    /**
     * Search node ids by passing the predicate check
     * @param {Function} predicate - Predicate
     * @param {Object} [context] - Context of predicate
     * @returns {Array.<string>} Node ids
     * @private
     */
    _filter: function(predicate, context) {
        var filtered = [];

        this.eachAll(function(node, nodeId) {
            if (predicate(node, nodeId)) {
                filtered.push(nodeId);
            }
        }, context);

        return filtered;
    },

    /**
     * Whether the node is leaf
     * @api
     * @param {string} nodeId - Node id
     * @returns {boolean} True if the node is leaf.
     */
    isLeaf: function(nodeId) {
        var node = this.model.getNode(nodeId);

        return node && node.isLeaf();
    },

    /**
     * Whether a node is a ancestor of another node.
     * @api
     * @param {string} containerNodeId - Id of a node that may contain the other node
     * @param {string} containedNodeId - Id of a node that may be contained by the other node
     * @returns {boolean} Whether a node contains another node
     */
    contains: function(containerNodeId, containedNodeId) {
        return this.model.contains(containedNodeId, containedNodeId);
    },

    /**
     * Enable facility of tree
     * @api
     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable'
     * @param {object} [options] - Feature options
     * @returns {Tree} this
     * @example
     * tree
     *  .enableFeature('Selectable', {
     *      selectedClassName: 'tui-tree-selected'
     *  })
     *  .enableFeature('Editable', {
     *      enableClassName: tree.classNames.textClass,
     *      dataKey: 'text',
     *      inputClassName: 'myInput'
     *  })
     *  .enableFeature('Draggable', {
     *      useHelper: true,
     *      helperPos: {x: 5, y: 2},
     *      rejectedTagNames: ['UL', 'INPUT', 'BUTTON'],
     *      rejectedClassNames: ['notDraggable', 'notDraggable-2']
     *  })
     *  .enableFeature('Checkbox', {
     *      checkboxClassName: 'tui-tree-checkbox'
     *  });
     */
    enableFeature: function(featureName, options) {
        var Feature = features[featureName];

        this.disableFeature(featureName);
        if (Feature) {
            this.enabledFeatures[featureName] = new Feature(this, options);
        }

        return this;
    },

    /**
     * Disable facility of tree
     * @api
     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable'
     * @returns {Tree} this
     * @example
     * tree
     *  .disableFeature('Selectable')
     *  .disableFeature('Draggable')
     *  .disableFeature('Editable')
     *  .disableFeature('Checkbox');
     */
    disableFeature: function(featureName) {
        var feature = this.enabledFeatures[featureName];

        if (feature) {
            feature.destroy();
            delete this.enabledFeatures[featureName];
        }

        return this;
    }
});

/**
 * Set abstract apis to tree prototype
 * @param {string} featureName - Feature name
 * @param {object} feature - Feature
 */
function setAbstractAPIs(featureName, feature) {
    var messageName = 'INVALID_API_' + featureName.toUpperCase(),
        apiList = feature.getAPIList ? feature.getAPIList() : [];

    snippet.forEach(apiList, function(api) {
        Tree.prototype[api] = function() {
            throw new Error(messages[messageName] || messages.INVALID_API);
        };
    });
}
snippet.forEach(features, function(Feature, name) {
    setAbstractAPIs(name, Feature);
});
snippet.CustomEvents.mixin(Tree);
module.exports = Tree;

},{"./consts/defaultOption":2,"./consts/messages":3,"./consts/outerTemplate":4,"./consts/states":5,"./features/checkbox":6,"./features/draggable":7,"./features/editable":8,"./features/selectable":9,"./treeModel":11,"./util":13}],11:[function(require,module,exports){
/**
 * @fileoverview Update view and control tree data
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */
'use strict';

var TreeNode = require('./treeNode');

var extend = tui.util.extend,
    keys = tui.util.keys,
    forEach = tui.util.forEach,
    map = tui.util.map;

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
     * @returns {Array.<string>} Added node ids
     * @private
     */
    _makeTreeHash: function(data, parent) {
        var parentId = parent.getId(),
            ids = [];

        forEach(data, function(datum) {
            var childrenData = datum.children,
                node = this._createNode(datum, parentId),
                nodeId = node.getId();

            ids.push(nodeId);
            this.treeHash[nodeId] = node;
            parent.addChildId(nodeId);
            this._makeTreeHash(childrenData, node);
        }, this);

        return ids;
    },

    /**
     * Create node
     * @param {object} nodeData - Datum of node
     * @param {string} parentId - Parent id
     * @returns {TreeNode} TreeNode
     */
    _createNode: function(nodeData, parentId) {
        nodeData = extend({
            state: this.nodeDefaultState
        }, nodeData);

        return new TreeNode(nodeData, parentId);
    },

    /**
     * Get children
     * @param {string} nodeId - Node id
     * @returns {?Array.<TreeNode>} children
     */
    getChildren: function(nodeId) {
        var childIds = this.getChildIds(nodeId);

        if (!childIds) {
            return null;
        }

        return map(childIds, function(childId) {
            return this.getNode(childId);
        }, this);
    },

    /**
     * Get child ids
     * @param {string} nodeId - Node id
     * @returns {?Array.<string>} Child ids
     */
    getChildIds: function(nodeId) {
        var node = this.getNode(nodeId);

        if (!node) {
            return null;
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
     * @returns {?TreeNode} Node
     */
    getNode: function(id) {
        return this.treeHash[id];
    },

    /**
     * Get depth from node id
     * @param {string} id - A node id to find
     * @returns {?number} Depth
     */
    getDepth: function(id) {
        var node = this.getNode(id),
            depth = 0,
            parent;

        if (!node) {
            return null;
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
     * @returns {?string} Parent id
     */
    getParentId: function(id) {
        var node = this.getNode(id);

        if (!node) {
            return null;
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
     * @returns {Array.<string>} New added node ids
     */
    add: function(data, parentId, isSilent) {
        var parent = this.getNode(parentId) || this.rootNode,
            ids;

        data = [].concat(data);
        ids = this._makeTreeHash(data, parent);

        if (!isSilent) {
            this.fire('update', parent.getId());
        }

        return ids;
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
            this.fire('update', id);
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
            this.fire('update', id);
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
     * Whether a node is a ancestor of another node.
     * @param {string} containerId - Id of a node that may contain the other node
     * @param {string} containedId - Id of a node that may be contained by the other node
     * @returns {boolean} Whether a node contains another node
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
     * @returns {?object} Node data
     */
    getNodeData: function(nodeId) {
        var node = this.getNode(nodeId);

        if (!node) {
            return null;
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
    each: function(iteratee, parentId, context) { //depth-first
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

            stack = stack.concat(node.getChildIds());
        }
    }
});

tui.util.CustomEvents.mixin(TreeModel);
module.exports = TreeModel;

},{"./treeNode":12}],12:[function(require,module,exports){
'use strict';

var states = require('./consts/states').node,
    util = require('./util');

var lastIndex = 0,
    getNextIndex = function() {
        var index = lastIndex;
        lastIndex += 1;

        return index;
    },
    RESERVED_PROPERTIES = {
        id: '',
        state: 'setState',
        children: ''
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
        /**
         * Set prefix of id
         * @param {string} prefix - Prefix of id
         */
        setIdPrefix: function(prefix) {
            this.idPrefix = prefix || this.idPrefix;
        },

        /**
         * Prefix of id
         * @type {string}
         */
        idPrefix: ''
    },
    init: function(nodeData, parentId) { /*eslint-enable*/
        /**
         * Node id
         * @type {string}
         * @private
         */
        this._id = this.constructor.idPrefix + getNextIndex();

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

        this.setData(nodeData);
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
     * @api
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
     * @api
     * @param {string} state - State of node ('closed', 'opened')
     */
    setState: function(state) {
        state = String(state);
        this._state = states[state.toUpperCase()] || this._state;
    },

    /**
     * Get state
     * @api
     * @returns {string} state ('opened' or 'closed')
     */
    getState: function() {
        return this._state;
    },

    /**
     * Get id
     * @api
     * @returns {string} Node id
     */
    getId: function() {
        return this._id;
    },

    /**
     * Get parent id
     * @api
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
     * @api
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
     * @api
     * @param {string} name - Property name of data
     * @returns {*} Data
     */
    getData: function(name) {
        return this._data[name];
    },

    /**
     * Get all data
     * @api
     * @returns {Object} Data
     */
    getAllData: function() {
        return tui.util.extend({}, this._data);
    },

    /**
     * Set data
     * @api
     * @param {Object} data - Data for adding
     */
    setData: function(data) {
        data = this._setReservedProperties(data);
        tui.util.extend(this._data, data);
    },

    /**
     * Remove data
     * @api
     * @param {...string} names - Names of data
     */
    removeData: function() {
        tui.util.forEachArray(arguments, function(name) {
            delete this._data[name];
        }, this);
    },

    /**
     * Return true if this node has a provided child id.
     * @api
     * @param {string} id - Node id
     * @returns {boolean} - Whether this node has a provided child id.
     */
    hasChild: function(id) {
        return inArray(id, this._childIds) !== -1;
    },

    /**
     * Return whether this node is leaf.
     * @api
     * @returns {boolean} Node is leaf or not.
     */
    isLeaf: function() {
        return this._childIds.length === 0;
    },

    /**
     * Return whether this node is root.
     * @api
     * @returns {boolean} Node is root or not.
     */
    isRoot: function() {
        return tui.util.isFalsy(this._parentId);
    }
});
module.exports = TreeNode;

},{"./consts/states":5,"./util":13}],13:[function(require,module,exports){
/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */
'use strict';
var isUndefined = tui.util.isUndefined,
    pick = tui.util.pick,
    templateMaskRe = /\{\{(.+?)}}/gi,
    isValidDotNotationRe = /^\w+(?:\.\w+)*$/,
    isValidDotNotation = function(str) {
        return isValidDotNotationRe.test(str);
    },
    isArray = tui.util.isArraySafe;

var util = {
    /**
     * Remove first specified item from array, if it exists
     * @param {*} item Item to look for
     * @param {Array} arr Array to query
     */
    removeItemFromArray: function(item, arr) {
        var index = arr.length - 1;

        while (index > -1) {
            if (item === arr[index]) {
                arr.splice(index, 1);
            }
            index -= 1;
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
     * @returns {HTMLElement} Event target
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
        return element && element.getAttribute &&
            (element.getAttribute('class') || element.getAttribute('className') || '');
    },

    /**
     * Check the element has specific class or not
     * @param {HTMLElement} element A target element
     * @param {string} className A name of class to find
     * @returns {boolean} Whether the element has the class
     */
    hasClass: function(element, className) {
        var elClassName = util.getClass(element);

        return elClassName.indexOf(className) > -1;
    },

    /**
     * Find element by class name
     * @param {HTMLElement} target A target element
     * @param {string} className A name of class
     * @returns {Array.<HTMLElement>} Elements
     */
    getElementsByClassName: function(target, className) {
        var all, filtered;

        if (target.querySelectorAll) {
            filtered = target.querySelectorAll('.' + className);
        } else {
            all = tui.util.toArray(target.getElementsByTagName('*'));
            filtered = tui.util.filter(all, function(el) {
                var classNames = el.className || '';

                return (classNames.indexOf(className) !== -1);
            });
        }

        return filtered;
    },

    /**
     * Check whether the click event by right button
     * @param {MouseEvent} event Event object
     * @returns {boolean} Whether the click event by right button
     */
    isRightButton: function(event) {
        return util._getButton(event) === 2;
    },

    /**
     * Whether the property exist or not
     * @param {Array} props A property
     * @returns {string|boolean} Property name or false
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

        /* eslint-disable consistent-return */
        tui.util.forEach(props, function(prop) {
            if (prop in style) {
                propertyName = prop;

                return false;
            }
        });
        /* eslint-enable consistent-return */

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
    renderTemplate: function(source, props) {
        function pickValue(names) {
            return pick.apply(null, [props].concat(names));
        }

        return source.replace(templateMaskRe, function(match, name) {
            var value;

            if (isValidDotNotation(name)) {
                value = pickValue(name.split('.'));
            }

            if (isArray(value)) {
                value = value.join(' ');
            } else if (isUndefined(value)) {
                value = '';
            }

            return value;
        });
    },

    /**
     * Normalization for event button property
     * 0: First mouse button, 2: Second mouse button, 1: Center button
     * @param {MouseEvent} event Event object
     * @returns {?number} button type
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

        button = String(event.button);
        if (primary.indexOf(button) > -1) {
            return 0;
        } else if (secondary.indexOf(button) > -1) {
            return 2;
        } else if (wheel.indexOf(button) > -1) {
            return 1;
        }

        return null;
    }
};

module.exports = util;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMvZGVmYXVsdE9wdGlvbi5qcyIsInNyYy9qcy9jb25zdHMvbWVzc2FnZXMuanMiLCJzcmMvanMvY29uc3RzL291dGVyVGVtcGxhdGUuanMiLCJzcmMvanMvY29uc3RzL3N0YXRlcy5qcyIsInNyYy9qcy9mZWF0dXJlcy9jaGVja2JveC5qcyIsInNyYy9qcy9mZWF0dXJlcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvZWRpdGFibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy90cmVlLmpzIiwic3JjL2pzL3RyZWVNb2RlbC5qcyIsInNyYy9qcy90cmVlTm9kZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN21DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnZhciBUcmVlID0gcmVxdWlyZSgnLi9zcmMvanMvdHJlZScpO1xudmFyIGNvbXBvbmVudCA9IHR1aS51dGlsLmRlZmluZU5hbWVzcGFjZSgndHVpLmNvbXBvbmVudCcpO1xuY29tcG9uZW50LlRyZWUgPSBUcmVlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1ha2UgY2xhc3MgbmFtZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgY2xhc3MgbmFtZVxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0ga2V5cyAtIEtleXMgb2YgY2xhc3MgbmFtZXNcbiAqIEByZXR1cm5zIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn0gQ2xhc3MgbmFtZXMgbWFwXG4gKi9cbmZ1bmN0aW9uIG1ha2VDbGFzc05hbWVzKHByZWZpeCwga2V5cykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICB0dWkudXRpbC5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBvYmpba2V5ICsgJ0NsYXNzJ10gPSBwcmVmaXggKyBrZXk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEEgZGVmYXVsdCB2YWx1ZXMgZm9yIHRyZWVcbiAqIEBjb25zdFxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBub2RlRGVmYXVsdFN0YXRlIC0gTm9kZSBzdGF0ZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVJZFByZWZpeCAtIE5vZGUgaWQgcHJlZml4XG4gKiBAcHJvcGVydHkge29iamVjdH0gc3RhdGVMYWJlbCAtIFN0YXRlIGxhYmVsIGluIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5vcGVuZWQgLSAnLSdcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5jbG9zZWQgLSAnKydcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSB0ZW1wbGF0ZSAtIFRlbXBsYXRlIGh0bWwgZm9yIHRoZSBub2Rlcy5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUuaW50ZXJuYWxOb2RlIC0gVGVtcGxhdGUgaHRtbCBmb3IgaW50ZXJuYWwgbm9kZS5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUubGVhZk5vZGUgLSBUZW1wbGF0ZSBodG1sIGZvciBsZWFmIG5vZGUuXG4gKiBAcHJvcGVydHkge29iamVjdH0gY2xhc3NOYW1lcyAtIENsYXNzIG5hbWVzIG9mIGVsZW1lbnRzIGluIHRyZWVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gb3BlbmVkQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBjbG9zZWRDbGFzcyAtIENsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVDbGFzcyAtIENsYXNzIG5hbWUgZm9yIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gbGVhZkNsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgbGVhZiBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN1YnRyZWVDbGFzcyAgLSBDbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdG9nZ2xlQnRuQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGV4dENsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgdGV4dCBlbGVtZW50IGluIGEgbm9kZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcbiAgICBzdGF0ZUxhYmVsczoge1xuICAgICAgICBvcGVuZWQ6ICctJyxcbiAgICAgICAgY2xvc2VkOiAnKydcbiAgICB9LFxuICAgIG5vZGVJZFByZWZpeDogJ3R1aS10cmVlLW5vZGUtJyxcbiAgICBjbGFzc05hbWVzOiBtYWtlQ2xhc3NOYW1lcygndHVpLXRyZWUtJywgW1xuICAgICAgICAnbm9kZScsXG4gICAgICAgICdsZWFmJyxcbiAgICAgICAgJ29wZW5lZCcsXG4gICAgICAgICdjbG9zZWQnLFxuICAgICAgICAnc3VidHJlZScsXG4gICAgICAgICd0b2dnbGVCdG4nLFxuICAgICAgICAndGV4dCdcbiAgICBdKSxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICBpbnRlcm5hbE5vZGU6XG4gICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPicsXG4gICAgICAgIGxlYWZOb2RlOlxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPidcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1lc3NhZ2VzIGZvciB0cmVlXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIElOVkFMSURfUk9PVF9FTEVNRU5UOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogUm9vdCBlbGVtZW50IGlzIGludmFsaWQuJyxcbiAgICBJTlZBTElEX0FQSTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IElOVkFMSURfQVBJJyxcbiAgICBJTlZBTElEX0FQSV9TRUxFQ1RBQkxFOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJTZWxlY3RhYmxlXCIgaXMgbm90IGVuYWJsZWQuJyxcbiAgICBJTlZBTElEX0FQSV9FRElUQUJMRTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiRWRpdGFibGVcIiBpcyBub3QgZW5hYmxlZC4nLFxuICAgIElOVkFMSURfQVBJX0RSQUdHQUJMRTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiRHJhZ2dhYmxlXCIgaXMgbm90IGVuYWJsZWQuJyxcbiAgICBJTlZBTElEX0FQSV9DSEVDS0JPWDogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiQ2hlY2tib3hcIiBpcyBub3QgZW5hYmxlZC4nXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE91dGVyIHRlbXBsYXRlXG4gKiBAdHlwZSB7e2ludGVybmFsTm9kZTogc3RyaW5nLCBsZWFmTm9kZTogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgSU5URVJOQUxfTk9ERTpcbiAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwie3tub2RlQ2xhc3N9fSB7e3N0YXRlQ2xhc3N9fVwiPicgK1xuICAgICAgICAgICAgJ3t7aW5uZXJUZW1wbGF0ZX19JyArXG4gICAgICAgICc8L2xpPicsXG4gICAgTEVBRl9OT0RFOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ7e25vZGVDbGFzc319IHt7bGVhZkNsYXNzfX1cIj4nICtcbiAgICAgICAgICAgICd7e2lubmVyVGVtcGxhdGV9fScgK1xuICAgICAgICAnPC9saT4nXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFN0YXRlcyBpbiB0cmVlXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIFN0YXRlcyBvZiBub2RlXG4gICAgICogQHR5cGUge3tPUEVORUQ6IHN0cmluZywgQ0xPU0VEOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIG5vZGU6IHtcbiAgICAgICAgT1BFTkVEOiAnb3BlbmVkJyxcbiAgICAgICAgQ0xPU0VEOiAnY2xvc2VkJ1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xudmFyIEFQSV9MSVNUID0gW1xuICAgICdjaGVjaycsXG4gICAgJ3VuY2hlY2snLFxuICAgICd0b2dnbGVDaGVjaycsXG4gICAgJ2lzQ2hlY2tlZCcsXG4gICAgJ2lzSW5kZXRlcm1pbmF0ZScsXG4gICAgJ2lzVW5jaGVja2VkJyxcbiAgICAnZ2V0Q2hlY2tlZExpc3QnLFxuICAgICdnZXRUb3BDaGVja2VkTGlzdCcsXG4gICAgJ2dldEJvdHRvbUNoZWNrZWRMaXN0J1xuXTtcblxuLyoqXG4gKiBDaGVja2JveCB0cmktc3RhdGVzXG4gKi9cbnZhciBTVEFURV9DSEVDS0VEID0gMSxcbiAgICBTVEFURV9VTkNIRUNLRUQgPSAyLFxuICAgIFNUQVRFX0lOREVURVJNSU5BVEUgPSAzLFxuICAgIERBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURSA9ICdfX0NoZWNrQm94U3RhdGVfXycsXG4gICAgREFUQSA9IHt9O1xuXG52YXIgZmlsdGVyID0gdHVpLnV0aWwuZmlsdGVyLFxuICAgIGZvckVhY2ggPSB0dWkudXRpbC5mb3JFYWNoO1xuLyoqXG4gKiBTZXQgdGhlIGNoZWNrYm94LWFwaVxuICogQGNsYXNzIENoZWNrYm94XG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb24gLSBPcHRpb25cbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9uLmNoZWNrYm94Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGNoZWNrYm94IGVsZW1lbnRcbiAqL1xudmFyIENoZWNrYm94ID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBDaGVja2JveC5wcm90b3R5cGUgKi97IC8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgQ2hlY2tib3hcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBjaGVja2JveFxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9uKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9uID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBvcHRpb24pO1xuXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuY2hlY2tib3hDbGFzc05hbWUgPSBvcHRpb24uY2hlY2tib3hDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuY2hlY2tlZExpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5yb290Q2hlY2tib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTlBVVCcpO1xuICAgICAgICB0aGlzLnJvb3RDaGVja2JveC50eXBlID0gJ2NoZWNrYm94JztcblxuICAgICAgICB0aGlzLl9zZXRBUElzKCk7XG4gICAgICAgIHRoaXMuX2F0dGFjaEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuXG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuICAgICAgICBmb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdHJlZVthcGlOYW1lXTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBhcGlzIG9mIGNoZWNrYm94IHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRBUElzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBiaW5kID0gdHVpLnV0aWwuYmluZDtcblxuICAgICAgICBmb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICB0cmVlW2FwaU5hbWVdID0gYmluZCh0aGlzW2FwaU5hbWVdLCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBldmVudCB0byB0cmVlIGluc3RhbmNlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXR0YWNoRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmVlLm9uKHtcbiAgICAgICAgICAgIHNpbmdsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJZCwgc3RhdGU7XG5cbiAgICAgICAgICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2hlY2tib3hDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlRnJvbUNoZWNrYm94KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRpbnVlUG9zdHByb2Nlc3Npbmcobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFmdGVyRHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0Q2hhbmdlcyhub2RlSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1vdmU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAvL0B0b2RvIC0gT3B0aW1pemF0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdENoYW5nZXMoZGF0YS5vcmlnaW5hbFBhcmVudElkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0Q2hhbmdlcyhkYXRhLm5ld1BhcmVudElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZmxlY3QgdGhlIGNoYW5nZXMgb24gbm9kZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlZmxlY3RDaGFuZ2VzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdGhpcy50cmVlLmVhY2goZnVuY3Rpb24oZGVzY2VuZGFudCwgZGVzY2VuZGFudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShkZXNjZW5kYW50SWQsIHRoaXMuX2dldFN0YXRlKGRlc2NlbmRhbnRJZCksIHRydWUpO1xuICAgICAgICB9LCBub2RlSWQsIHRoaXMpO1xuICAgICAgICB0aGlzLl9qdWRnZU93blN0YXRlKG5vZGVJZCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjaGVja2JveCBhdHRyaWJ1dGVzIChjaGVja2VkLCBpbmRldGVybWluYXRlKVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gY2hlY2tib3ggLSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0NoZWNrZWQgLSBcImNoZWNrZWRcIlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNJbmRldGVybWluYXRlIC0gXCJpbmRldGVybWluYXRlXCJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDaGVja2JveEF0dHI6IGZ1bmN0aW9uKGNoZWNrYm94LCBpc0NoZWNrZWQsIGlzSW5kZXRlcm1pbmF0ZSkge1xuICAgICAgICBjaGVja2JveC5pbmRldGVybWluYXRlID0gaXNJbmRldGVybWluYXRlO1xuICAgICAgICBjaGVja2JveC5jaGVja2VkID0gaXNDaGVja2VkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tpbmcgc3RhdGUgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gU3RhdGUgZm9yIGNoZWNrYm94XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RvcFByb3BhZ2F0aW9uXSAtIElmIHRydWUsIHN0b3AgY2hhbmdpbmcgc3RhdGUgcHJvcGFnYXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHZhciBjaGVja2JveCA9IHRoaXMuX2dldENoZWNrYm94RWxlbWVudChub2RlSWQpO1xuXG4gICAgICAgIGlmICghY2hlY2tib3gpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfQ0hFQ0tFRDpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfVU5DSEVDS0VEOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldENoZWNrYm94QXR0cihjaGVja2JveCwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfSU5ERVRFUk1JTkFURTpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IC8vIG5vIG1vcmUgcHJvY2VzcyBpZiB0aGUgc3RhdGUgaXMgaW52YWxpZFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbnRpbnVlUG9zdHByb2Nlc3Npbmcobm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNraW5nIHN0YXRlIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IENoZWNraW5nIHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHN0YXRlID0gdHJlZS5nZXROb2RlRGF0YShub2RlSWQpW0RBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURV0sXG4gICAgICAgICAgICBjaGVja2JveDtcblxuICAgICAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgICAgICBjaGVja2JveCA9IHRoaXMuX2dldENoZWNrYm94RWxlbWVudChub2RlSWQpO1xuICAgICAgICAgICAgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZUZyb21DaGVja2JveChjaGVja2JveCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2luZyBzdGF0ZSBvZiBub2RlIGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gY2hlY2tib3ggLSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHJldHVybnMgez9udW1iZXJ9IENoZWNraW5nIHN0YXRlXG4gICAgICovXG4gICAgX2dldFN0YXRlRnJvbUNoZWNrYm94OiBmdW5jdGlvbihjaGVja2JveCkge1xuICAgICAgICB2YXIgc3RhdGU7XG5cbiAgICAgICAgaWYgKCFjaGVja2JveCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tib3guY2hlY2tlZCkge1xuICAgICAgICAgICAgc3RhdGUgPSBTVEFURV9DSEVDS0VEO1xuICAgICAgICB9IGVsc2UgaWYgKGNoZWNrYm94LmluZGV0ZXJtaW5hdGUpIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfSU5ERVRFUk1JTkFURTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfVU5DSEVDS0VEO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb250aW51ZSBwb3N0LXByb2Nlc3NpbmcgZnJvbSBjaGFuZ2luZzpjaGVja2JveC1zdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gQ2hlY2tib3ggc3RhdGVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdG9wUHJvcGFnYXRpb25dIC0gSWYgdHJ1ZSwgc3RvcCB1cGRhdGUtcHJvcGFnYXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb250aW51ZVBvc3Rwcm9jZXNzaW5nOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlLCBzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuY2hlY2tlZExpc3QsXG4gICAgICAgICAgICBldmVudE5hbWU7XG5cbiAgICAgICAgLyogUHJldmVudCBkdXBsaWNhdGVkIG5vZGUgaWQgKi9cbiAgICAgICAgdXRpbC5yZW1vdmVJdGVtRnJvbUFycmF5KG5vZGVJZCwgY2hlY2tlZExpc3QpO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gU1RBVEVfQ0hFQ0tFRCkge1xuICAgICAgICAgICAgY2hlY2tlZExpc3QucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSNjaGVja1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIENoZWNrZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHRyZWUub24oJ2NoZWNrJywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ2NoZWNrZWQ6ICcgKyBub2RlSWQpO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGV2ZW50TmFtZSA9ICdjaGVjayc7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFNUQVRFX1VOQ0hFQ0tFRCkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSN1bmNoZWNrXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVW5jaGVja2VkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlLm9uKCd1bmNoZWNrJywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ3VuY2hlY2tlZDogJyArIG5vZGVJZCk7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZXZlbnROYW1lID0gJ3VuY2hlY2snO1xuICAgICAgICB9XG4gICAgICAgIERBVEFbREFUQV9LRVlfRk9SX0NIRUNLQk9YX1NUQVRFXSA9IHN0YXRlO1xuICAgICAgICB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgREFUQSwgdHJ1ZSk7XG5cbiAgICAgICAgaWYgKCFzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BhZ2F0ZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICAgICAgdHJlZS5maXJlKGV2ZW50TmFtZSwgbm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcm9wYWdhdGUgYSBub2RlIHN0YXRlIHRvIGRlc2NlbmRhbnRzIGFuZCBhbmNlc3RvcnMgZm9yIHVwZGF0aW5nIHRoZWlyIHN0YXRlc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gQ2hlY2tib3ggc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wcm9wYWdhdGVTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUgPT09IFNUQVRFX0lOREVURVJNSU5BVEUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbERlc2NlbmRhbnRzU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBhbGwgZGVzY2VuZGFudHMgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0ZSAtIFN0YXRlIGZvciBjaGVja2JveFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZUFsbERlc2NlbmRhbnRzU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcbiAgICAgICAgdGhpcy50cmVlLmVhY2goZnVuY3Rpb24oZGVzY2VuZGFudCwgZGVzY2VuZGFudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShkZXNjZW5kYW50SWQsIHN0YXRlLCB0cnVlKTtcbiAgICAgICAgfSwgbm9kZUlkLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGFsbCBhbmNlc3RvcnMgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRyZWUuZ2V0UGFyZW50SWQobm9kZUlkKTtcblxuICAgICAgICB3aGlsZSAocGFyZW50SWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2p1ZGdlT3duU3RhdGUocGFyZW50SWQpO1xuICAgICAgICAgICAgcGFyZW50SWQgPSB0cmVlLmdldFBhcmVudElkKHBhcmVudElkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBKdWRnZSBvd24gc3RhdGUgZnJvbSBjaGlsZCBub2RlIGlzIGNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2p1ZGdlT3duU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoaWxkSWRzID0gdHJlZS5nZXRDaGlsZElkcyhub2RlSWQpLFxuICAgICAgICAgICAgY2hlY2tlZCA9IHRydWUsXG4gICAgICAgICAgICB1bmNoZWNrZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICghY2hpbGRJZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjaGVja2VkID0gdGhpcy5pc0NoZWNrZWQobm9kZUlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvckVhY2goY2hpbGRJZHMsIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZShjaGlsZElkKTtcbiAgICAgICAgICAgICAgICBjaGVja2VkID0gKGNoZWNrZWQgJiYgc3RhdGUgPT09IFNUQVRFX0NIRUNLRUQpO1xuICAgICAgICAgICAgICAgIHVuY2hlY2tlZCA9ICh1bmNoZWNrZWQgJiYgc3RhdGUgPT09IFNUQVRFX1VOQ0hFQ0tFRCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY2hlY2tlZCB8fCB1bmNoZWNrZWQ7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGVja2VkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX0NIRUNLRUQsIHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHVuY2hlY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9VTkNIRUNLRUQsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9JTkRFVEVSTUlOQVRFLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tib3ggZWxlbWVudCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P0hUTUxFbGVtZW50fSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0Q2hlY2tib3hFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBlbCwgbm9kZUVsO1xuXG4gICAgICAgIGlmIChub2RlSWQgPT09IHRyZWUuZ2V0Um9vdE5vZGVJZCgpKSB7XG4gICAgICAgICAgICBlbCA9IHRoaXMucm9vdENoZWNrYm94O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZUVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgICAgICBub2RlRWwsXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja2JveENsYXNzTmFtZVxuICAgICAgICAgICAgKVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUuY2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICBjaGVjazogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0NoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9DSEVDS0VEKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbmNoZWNrIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLnVuY2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICB1bmNoZWNrOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVW5jaGVja2VkKG5vZGVJZCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKG5vZGVJZCwgU1RBVEVfVU5DSEVDS0VEKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgbm9kZSBjaGVja2luZ1xuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUudG9nZ2xlQ2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICB0b2dnbGVDaGVjazogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0NoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5jaGVjayhub2RlSWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51bmNoZWNrKG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBjaGVja2VkXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyBpbmRldGVybWluYXRlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS5jaGVjayhub2RlSWQpO1xuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuaXNDaGVja2VkKG5vZGVJZCkpOyAvLyB0cnVlXG4gICAgICovXG4gICAgaXNDaGVja2VkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNUQVRFX0NIRUNLRUQgPT09IHRoaXMuX2dldFN0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIG5vZGUgaXMgaW5kZXRlcm1pbmF0ZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIG5vZGUgaXMgaW5kZXRlcm1pbmF0ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUuY2hlY2sobm9kZUlkKTtcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmlzSW5kZXRlcm1pbmF0ZShub2RlSWQpKTsgLy8gZmFsc2VcbiAgICAgKi9cbiAgICBpc0luZGV0ZXJtaW5hdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gU1RBVEVfSU5ERVRFUk1JTkFURSA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyB1bmNoZWNrZWQgb3Igbm90XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyB1bmNoZWNrZWQuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS51bmNoZWNrKG5vZGVJZCk7XG4gICAgICogY29uc29sZS5sb2codHJlZS5pc1VuY2hlY2tlZChub2RlSWQpKTsgLy8gdHJ1ZVxuICAgICAqL1xuICAgIGlzVW5jaGVja2VkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNUQVRFX1VOQ0hFQ0tFRCA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbENoZWNrZWRMaXN0ID0gdHJlZS5nZXRDaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUxJywgJ25vZGUyJywgJ25vZGUzJyAsLi4uLl1cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNDaGVja2VkTGlzdCA9IHRyZWUuZ2V0Q2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTcnLCAnbm9kZTgnXVxuICAgICAqL1xuICAgIGdldENoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5jaGVja2VkTGlzdDtcblxuICAgICAgICBpZiAoIXBhcmVudElkKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hlY2tlZExpc3Quc2xpY2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXIoY2hlY2tlZExpc3QsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWUuY29udGFpbnMocGFyZW50SWQsIG5vZGVJZCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdG9wIGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbFRvcENoZWNrZWRMaXN0ID0gdHJlZS5nZXRUb3BDaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUxJywgJ25vZGU1JywgJ25vZGU3J11cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNUb3BDaGVja2VkTGlzdCA9IHRyZWUuZ2V0VG9wQ2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTcnXVxuICAgICAqL1xuICAgIGdldFRvcENoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gW10sXG4gICAgICAgICAgICBzdGF0ZTtcblxuICAgICAgICBwYXJlbnRJZCA9IHBhcmVudElkIHx8IHRyZWUuZ2V0Um9vdE5vZGVJZCgpO1xuICAgICAgICBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlKHBhcmVudElkKTtcbiAgICAgICAgaWYgKHN0YXRlID09PSBTVEFURV9DSEVDS0VEKSB7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRyZWUuZ2V0Q2hpbGRJZHMocGFyZW50SWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBTVEFURV9JTkRFVEVSTUlOQVRFKSB7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuZ2V0Q2hlY2tlZExpc3QocGFyZW50SWQpO1xuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSBmaWx0ZXIoY2hlY2tlZExpc3QsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhdGhpcy5pc0NoZWNrZWQodHJlZS5nZXRQYXJlbnRJZChub2RlSWQpKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoZWNrZWRMaXN0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYm90dG9tIGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbEJvdHRvbUNoZWNrZWRMaXN0ID0gdHJlZS5nZXRCb3R0b21DaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUyJywgJ25vZGUzJywgJ25vZGU1JywgJ25vZGU4J11cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNCb3R0b21DaGVja2VkTGlzdCA9IHRyZWUuZ2V0Qm90dG9tQ2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTgnXVxuICAgICAqL1xuICAgIGdldEJvdHRvbUNoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0O1xuXG4gICAgICAgIHBhcmVudElkID0gcGFyZW50SWQgfHwgdHJlZS5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5nZXRDaGVja2VkTGlzdChwYXJlbnRJZCk7XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcihjaGVja2VkTGlzdCwgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZS5pc0xlYWYobm9kZUlkKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihDaGVja2JveCk7XG5tb2R1bGUuZXhwb3J0cyA9IENoZWNrYm94O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICB1c2VIZWxwZXI6IHRydWUsXG4gICAgICAgIGhlbHBlclBvczoge1xuICAgICAgICAgICAgeTogMixcbiAgICAgICAgICAgIHg6IDVcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmVqZWN0ZWRUYWdOYW1lcyA9IFtcbiAgICAgICAgJ0lOUFVUJyxcbiAgICAgICAgJ0JVVFRPTicsXG4gICAgICAgICdVTCdcbiAgICBdLFxuICAgIEFQSV9MSVNUID0gW10sXG4gICAgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIGRyYWdnYWJsZVxuICogQGNsYXNzIERyYWdnYWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnNcbiAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMudXNlSGVscGVyIC0gVXNpbmcgaGVscGVyIGZsYWdcbiAqICBAcGFyYW0ge3t4OiBudW1iZXIsIHk6bnVtYmVyfX0gb3B0aW9ucy5oZWxwZXJQb3MgLSBIZWxwZXIgcG9zaXRpb25cbiAqICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkVGFnTmFtZXMgLSBObyBkcmFnZ2FibGUgdGFnIG5hbWVzXG4gKiAgQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gb3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMgLSBObyBkcmFnZ2FibGUgY2xhc3MgbmFtZXNcbiAqL1xudmFyIERyYWdnYWJsZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgRHJhZ2dhYmxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIFNlbGVjdGFibGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBEcmFnZ2FibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLnNldE1lbWJlcnMob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuYXR0YWNoTW91c2Vkb3duKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBtZW1iZXJzIG9mIHRoaXMgbW9kdWxlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBpbnB1dCBvcHRpb25zXG4gICAgICovXG4gICAgc2V0TWVtYmVyczogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB2YXIgaGVscGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSxcbiAgICAgICAgICAgIHN0eWxlID0gaGVscGVyRWxlbWVudC5zdHlsZTtcbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMudXNlSGVscGVyID0gb3B0aW9ucy51c2VIZWxwZXI7XG4gICAgICAgIHRoaXMuaGVscGVyUG9zID0gb3B0aW9ucy5oZWxwZXJQb3M7XG4gICAgICAgIHRoaXMucmVqZWN0ZWRUYWdOYW1lcyA9IHJlamVjdGVkVGFnTmFtZXMuY29uY2F0KG9wdGlvbnMucmVqZWN0ZWRUYWdOYW1lcyk7XG4gICAgICAgIHRoaXMucmVqZWN0ZWRDbGFzc05hbWVzID0gW10uY29uY2F0KG9wdGlvbnMucmVqZWN0ZWRDbGFzc05hbWVzKTtcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gaGVscGVyRWxlbWVudDtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbnVsbDtcblxuICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGhlbHBlckVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggbW91c2UgZG93biBldmVudFxuICAgICAqL1xuICAgIGF0dGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucHJldmVudFRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy50cmVlLm9uKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2Vkb3duLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCB0ZXh0LXNlbGVjdGlvblxuICAgICAqL1xuICAgIHByZXZlbnRUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBzdHlsZSA9IHRyZWUucm9vdEVsZW1lbnQuc3R5bGUsXG4gICAgICAgICAgICBzZWxlY3RLZXkgPSB1dGlsLnRlc3RQcm9wKFxuICAgICAgICAgICAgICAgIFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J11cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRyZWUucm9vdEVsZW1lbnQsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xuXG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5ID0gc2VsZWN0S2V5O1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlID0gc3R5bGVbc2VsZWN0S2V5XTtcbiAgICAgICAgc3R5bGVbc2VsZWN0S2V5XSA9ICdub25lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhlIHRhcmdldCBlbGVtZW50IGlzIGluIHJlamVjdGVkVGFnTmFtZXMgb3IgaW4gcmVqZWN0ZWRDbGFzc05hbWVzXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdGFyZ2V0IGlzIG5vdCBkcmFnZ2FibGUgb3IgZHJhZ2dhYmxlXG4gICAgICovXG4gICAgaXNOb3REcmFnZ2FibGU6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICB2YXIgdGFnTmFtZSA9IHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICBjbGFzc05hbWVzID0gdXRpbC5nZXRDbGFzcyh0YXJnZXQpLnNwbGl0KC9cXHMrLyksXG4gICAgICAgICAgICByZXN1bHQ7XG5cbiAgICAgICAgaWYgKGluQXJyYXkodGFnTmFtZSwgdGhpcy5yZWplY3RlZFRhZ05hbWVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChjbGFzc05hbWVzLCBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGluQXJyYXkoY2xhc3NOYW1lLCB0aGlzLnJlamVjdGVkQ2xhc3NOYW1lcykgIT09IC0xO1xuXG4gICAgICAgICAgICByZXR1cm4gIXJlc3VsdDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2Vkb3duOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIG5vZGVJZDtcblxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSB8fCB0aGlzLmlzTm90RHJhZ2dhYmxlKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1dGlsLnByZXZlbnREZWZhdWx0KGV2ZW50KTtcblxuICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbm9kZUlkO1xuICAgICAgICBpZiAodGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SGVscGVyKHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWUub24oe1xuICAgICAgICAgICAgbW91c2Vtb3ZlOiB0aGlzLm9uTW91c2Vtb3ZlLFxuICAgICAgICAgICAgbW91c2V1cDogdGhpcy5vbk1vdXNldXBcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZW1vdmVcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbk1vdXNlbW92ZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBoZWxwZXJFbCA9IHRoaXMuaGVscGVyRWxlbWVudCxcbiAgICAgICAgICAgIHBvcyA9IHRyZWUucm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGlmICghdGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlbHBlckVsLnN0eWxlLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBwb3MudG9wICsgdGhpcy5oZWxwZXJQb3MueSArICdweCc7XG4gICAgICAgIGhlbHBlckVsLnN0eWxlLmxlZnQgPSBldmVudC5jbGllbnRYIC0gcG9zLmxlZnQgKyB0aGlzLmhlbHBlclBvcy54ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2V1cFxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2V1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRyZWUubW92ZSh0aGlzLmN1cnJlbnROb2RlSWQsIG5vZGVJZCk7XG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdHJlZS5vZmYodGhpcywgJ21vdXNlbW92ZScpO1xuICAgICAgICB0cmVlLm9mZih0aGlzLCAnbW91c2V1cCcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXN0b3JlIHRleHQtc2VsZWN0aW9uXG4gICAgICovXG4gICAgcmVzdG9yZVRleHRTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRyZWUucm9vdEVsZW1lbnQsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xuICAgICAgICBpZiAodGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIHRyZWUucm9vdEVsZW1lbnQuc3R5bGVbdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXldID0gdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgaGVscGVyIGNvbnRlbnRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBIZWxwZXIgY29udGVudHNcbiAgICAgKi9cbiAgICBzZXRIZWxwZXI6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LmlubmVySFRNTCA9IHRleHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGFjaCBtb3VzZWRvd24gZXZlbnRcbiAgICAgKi9cbiAgICBkZXRhY2hNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZVRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5kZXRhY2hNb3VzZWRvd24oKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnZ2FibGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi91dGlsJyk7XG5cbnZhciBBUElfTElTVCA9IFtdO1xuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBzZWxlY3RhYmxlXG4gKiBAY2xhc3MgRWRpdGFibGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgZWRpdGFibGUgZWxlbWVudFxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmRhdGFLZXkgLSBLZXkgb2Ygbm9kZSBkYXRhIHRvIHNldCB2YWx1ZVxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmlucHV0Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGlucHV0IGVsZW1lbnRcbiAqL1xudmFyIEVkaXRhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBFZGl0YWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBTZWxlY3RhYmxlXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgRWRpdGFibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSA9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuZGF0YUtleSA9IG9wdGlvbnMuZGF0YUtleTtcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQgPSB0aGlzLmNyZWF0ZUlucHV0RWxlbWVudChvcHRpb25zLmlucHV0Q2xhc3NOYW1lKTtcbiAgICAgICAgdGhpcy5ib3VuZE9uS2V5dXAgPSB0dWkudXRpbC5iaW5kKHRoaXMub25LZXl1cCwgdGhpcyk7XG4gICAgICAgIHRoaXMuYm91bmRPbkJsdXIgPSB0dWkudXRpbC5iaW5kKHRoaXMub25CbHVyLCB0aGlzKTtcblxuICAgICAgICB0cmVlLm9uKCdkb3VibGVDbGljaycsIHRoaXMub25Eb3VibGVDbGljaywgdGhpcyk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2tleXVwJywgdGhpcy5ib3VuZE9uS2V5dXApO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdibHVyJywgdGhpcy5ib3VuZE9uQmx1cik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGFjaCBpbnB1dCBlbGVtZW50IGZyb20gZG9jdW1lbnRcbiAgICAgKi9cbiAgICBkZXRhY2hJbnB1dEZyb21Eb2N1bWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dEVsID0gdGhpcy5pbnB1dEVsZW1lbnQsXG4gICAgICAgICAgICBwYXJlbnROb2RlID0gaW5wdXRFbC5wYXJlbnROb2RlO1xuXG4gICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlucHV0RWwpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5kZXRhY2hJbnB1dEZyb21Eb2N1bWVudCgpO1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdrZXl1cCcsIHRoaXMuYm91bmRPbktleXVwKTtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAnYmx1cicsIHRoaXMuYm91bmRPbkJsdXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dENsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBpbnB1dCBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBJbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgY3JlYXRlSW5wdXRFbGVtZW50OiBmdW5jdGlvbihpbnB1dENsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTlBVVCcpO1xuICAgICAgICBpZiAoaW5wdXRDbGFzc05hbWUpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IGlucHV0Q2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciBcImRvdWJsZUNsaWNrXCJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbkRvdWJsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIGlucHV0RWxlbWVudCwgbm9kZUlkO1xuXG4gICAgICAgIGlmICh1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICAgICAgaW5wdXRFbGVtZW50ID0gdGhpcy5pbnB1dEVsZW1lbnQ7XG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQudmFsdWUgPSB0cmVlLmdldE5vZGVEYXRhKG5vZGVJZClbdGhpcy5kYXRhS2V5XSB8fCAnJztcbiAgICAgICAgICAgIHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShpbnB1dEVsZW1lbnQsIHRhcmdldCk7XG4gICAgICAgICAgICB0YXJnZXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIGlucHV0RWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXI6IGtleXVwIC0gaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gS2V5IGV2ZW50XG4gICAgICovXG4gICAgb25LZXl1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7IC8vIGtleXVwIFwiZW50ZXJcIlxuICAgICAgICAgICAgdGhpcy5zZXREYXRhKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcjogYmx1ciAtIGlucHV0IGVsZW1lbnRcbiAgICAgKi9cbiAgICBvbkJsdXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldERhdGEoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgb2YgaW5wdXQgZWxlbWVudCB0byBub2RlIGFuZCBkZXRhY2ggaW5wdXQgZWxlbWVudCBmcm9tIGRvYy5cbiAgICAgKi9cbiAgICBzZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRoaXMuaW5wdXRFbGVtZW50KSxcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcblxuICAgICAgICBpZiAobm9kZUlkKSB7XG4gICAgICAgICAgICBkYXRhW3RoaXMuZGF0YUtleV0gPSB0aGlzLmlucHV0RWxlbWVudC52YWx1ZTtcbiAgICAgICAgICAgIHRyZWUuc2V0Tm9kZURhdGEobm9kZUlkLCBkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRldGFjaElucHV0RnJvbURvY3VtZW50KCk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdGFibGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi91dGlsJyk7XG5cbnZhciBBUElfTElTVCA9IFtcbiAgICAgICAgJ3NlbGVjdCcsXG4gICAgICAgICdnZXRTZWxlY3RlZE5vZGVJZCdcbiAgICBdLFxuICAgIGRlZmF1bHRzID0ge1xuICAgICAgICBzZWxlY3RlZENsYXNzTmFtZTogJ3R1aS10cmVlLXNlbGVjdGVkJ1xuICAgIH07XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjbGFzcyBTZWxlY3RhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuc2VsZWN0ZWRDbGFzc05hbWUgLSBDbGFzc25hbWUgZm9yIHNlbGVjdGVkIG5vZGUuXG4gKi9cbnZhciBTZWxlY3RhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBTZWxlY3RhYmxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIFNlbGVjdGFibGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBTZWxlY3RhYmxlXG4gICAgICAgICAqL1xuICAgICAgICBnZXRBUElMaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBBUElfTElTVC5zbGljZSgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbnMgPSB0dWkudXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lID0gb3B0aW9ucy5zZWxlY3RlZENsYXNzTmFtZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdHJlZS5vbih7XG4gICAgICAgICAgICBzaW5nbGVDbGljazogdGhpcy5vblNpbmdsZUNsaWNrLFxuICAgICAgICAgICAgYWZ0ZXJEcmF3OiB0aGlzLm9uQWZ0ZXJEcmF3XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB0aGlzLl9zZXRBUElzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBhcGlzIG9mIHNlbGVjdGFibGUgdHJlZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEFQSXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGJpbmQgPSB0dWkudXRpbC5iaW5kO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goQVBJX0xJU1QsIGZ1bmN0aW9uKGFwaU5hbWUpIHtcbiAgICAgICAgICAgIHRyZWVbYXBpTmFtZV0gPSBiaW5kKHRoaXNbYXBpTmFtZV0sIHRoaXMpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSB0aGlzIG1vZHVsZVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIG5vZGVFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpO1xuXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Mobm9kZUVsZW1lbnQsIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB0cmVlLm9mZih0aGlzKTtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRyZWVbYXBpTmFtZV07XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciBcInNpbmdsZUNsaWNrXCJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvblNpbmdsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgbm9kZUlkID0gdGhpcy50cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5zZWxlY3Qobm9kZUlkLCB0YXJnZXQpO1xuICAgIH0sXG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSB2YWxpZC1qc2RvY1xuICAgICAgICBJZ25vcmUgXCJ0YXJnZXRcIiBwYXJhbWV0ZXIgYW5ub3RhdGlvbiBmb3IgQVBJIHBhZ2VcbiAgICAgICAgXCJ0cmVlLnNlbGVjdChub2RlSWQpXCJcbiAgICAgKi9cbiAgICAvKipcbiAgICAgKiBTZWxlY3Qgbm9kZSBpZiB0aGUgZmVhdHVyZS1cIlNlbGVjdGFibGVcIiBpcyBlbmFibGVkLlxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcmVxdWlyZXMgU2VsZWN0YWJsZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLnNlbGVjdCgndHVpLXRyZWUtbm9kZS0zJyk7XG4gICAgICovXG4gICAgLyogZXNsaW50LWVuYWJsZSB2YWxpZC1qc2RvYyAqL1xuICAgIHNlbGVjdDogZnVuY3Rpb24obm9kZUlkLCB0YXJnZXQpIHtcbiAgICAgICAgdmFyIHRyZWUsIHByZXZFbGVtZW50LCBub2RlRWxlbWVudCxcbiAgICAgICAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lLCBwcmV2Tm9kZUlkO1xuXG4gICAgICAgIGlmICghbm9kZUlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICBwcmV2RWxlbWVudCA9IHRoaXMuZ2V0UHJldkVsZW1lbnQoKTtcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xuICAgICAgICBzZWxlY3RlZENsYXNzTmFtZSA9IHRoaXMuc2VsZWN0ZWRDbGFzc05hbWU7XG4gICAgICAgIHByZXZOb2RlSWQgPSB0aGlzLnNlbGVjdGVkTm9kZUlkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2JlZm9yZVNlbGVjdFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gU2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJldk5vZGVJZCAtIFByZXZpb3VzIHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICogQHBhcmFtIHtFbGVtZW50fHVuZGVmaW5lZH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZVxuICAgICAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxuICAgICAgICAgKiAgLm9uKCdiZWZvcmVTZWxlY3QnLCBmdW5jdGlvbihub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCkge1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdzZWxlY3RlZCBub2RlOiAnICsgbm9kZUlkKTtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZygncHJldmlvdXMgc2VsZWN0ZWQgbm9kZTogJyArIHByZXZOb2RlSWQpO1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCd0YXJnZXQgZWxlbWVudDogJyArIHRhcmdldCk7XG4gICAgICAgICAqICAgICAgcmV0dXJuIGZhbHNlOyAvLyBJdCBjYW5jZWxzIFwic2VsZWN0XCJcbiAgICAgICAgICogICAgICAvLyByZXR1cm4gdHJ1ZTsgLy8gSXQgZmlyZXMgXCJzZWxlY3RcIlxuICAgICAgICAgKiAgfSk7XG4gICAgICAgICAqL1xuICAgICAgICBpZiAodHJlZS5pbnZva2UoJ2JlZm9yZVNlbGVjdCcsIG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KSkge1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhwcmV2RWxlbWVudCwgc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgc2VsZWN0ZWRDbGFzc05hbWUpO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBhcGlcbiAgICAgICAgICAgICAqIEBldmVudCBUcmVlI3NlbGVjdFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmV2Tm9kZUlkIC0gUHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQHBhcmFtIHtFbGVtZW50fHVuZGVmaW5lZH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlXG4gICAgICAgICAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxuICAgICAgICAgICAgICogIC5vbignc2VsZWN0JywgZnVuY3Rpb24obm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpIHtcbiAgICAgICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3NlbGVjdGVkIG5vZGU6ICcgKyBub2RlSWQpO1xuICAgICAgICAgICAgICogICAgICBjb25zb2xlLmxvZygncHJldmlvdXMgc2VsZWN0ZWQgbm9kZTogJyArIHByZXZOb2RlSWQpO1xuICAgICAgICAgICAgICogICAgICBjb25zb2xlLmxvZygndGFyZ2V0IGVsZW1lbnQ6ICcgKyB0YXJnZXQpO1xuICAgICAgICAgICAgICogIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cmVlLmZpcmUoJ3NlbGVjdCcsIG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWROb2RlSWQgPSBub2RlSWQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHByZXZpb3VzIHNlbGVjdGVkIG5vZGUgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gTm9kZSBlbGVtZW50XG4gICAgICovXG4gICAgZ2V0UHJldkVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5zZWxlY3RlZE5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzZWxlY3RlZCBub2RlIGlkXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRTZWxlY3RlZE5vZGVJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkTm9kZUlkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciAtIFwiYWZ0ZXJEcmF3XCJcbiAgICAgKi9cbiAgICBvbkFmdGVyRHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlRWxlbWVudCA9IHRoaXMuZ2V0UHJldkVsZW1lbnQoKTtcblxuICAgICAgICBpZiAobm9kZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3Mobm9kZUVsZW1lbnQsIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0YWJsZTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBSZW5kZXIgdHJlZSBhbmQgdXBkYXRlIHRyZWUuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIGRlZmF1bHRPcHRpb24gPSByZXF1aXJlKCcuL2NvbnN0cy9kZWZhdWx0T3B0aW9uJyksXG4gICAgc3RhdGVzID0gcmVxdWlyZSgnLi9jb25zdHMvc3RhdGVzJyksXG4gICAgbWVzc2FnZXMgPSByZXF1aXJlKCcuL2NvbnN0cy9tZXNzYWdlcycpLFxuICAgIG91dGVyVGVtcGxhdGUgPSByZXF1aXJlKCcuL2NvbnN0cy9vdXRlclRlbXBsYXRlJyksXG4gICAgVHJlZU1vZGVsID0gcmVxdWlyZSgnLi90cmVlTW9kZWwnKSxcbiAgICBTZWxlY3RhYmxlID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9zZWxlY3RhYmxlJyksXG4gICAgRHJhZ2dhYmxlID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9kcmFnZ2FibGUnKSxcbiAgICBFZGl0YWJsZSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvZWRpdGFibGUnKSxcbiAgICBDaGVja2JveCA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvY2hlY2tib3gnKTtcblxudmFyIG5vZGVTdGF0ZXMgPSBzdGF0ZXMubm9kZSxcbiAgICBmZWF0dXJlcyA9IHtcbiAgICAgICAgU2VsZWN0YWJsZTogU2VsZWN0YWJsZSxcbiAgICAgICAgRHJhZ2dhYmxlOiBEcmFnZ2FibGUsXG4gICAgICAgIEVkaXRhYmxlOiBFZGl0YWJsZSxcbiAgICAgICAgQ2hlY2tib3g6IENoZWNrYm94XG4gICAgfSxcbiAgICBzbmlwcGV0ID0gdHVpLnV0aWwsXG4gICAgZXh0ZW5kID0gc25pcHBldC5leHRlbmQsXG4gICAgVElNRU9VVF9UT19ESUZGRVJFTlRJQVRFX0NMSUNLX0FORF9EQkxDTElDSyA9IDIwMCxcbiAgICBNT1VTRV9NT1ZJTkdfVEhSRVNIT0xEID0gNTtcbi8qKlxuICogQ3JlYXRlIHRyZWUgbW9kZWwgYW5kIGluamVjdCBkYXRhIHRvIG1vZGVsXG4gKiBAY2xhc3MgVHJlZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAbWl4ZXMgdHVpLnV0aWwuQ3VzdG9tRXZlbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBBIGRhdGEgdG8gYmUgdXNlZCBvbiB0cmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9uc1xuICogICAgIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtvcHRpb25zLnJvb3RFbGVtZW50XSBSb290IGVsZW1lbnQgKEl0IHNob3VsZCBiZSAnVUwnIGVsZW1lbnQpXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLm5vZGVJZFByZWZpeF0gQSBkZWZhdWx0IHByZWZpeCBvZiBhIG5vZGVcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMubm9kZURlZmF1bHRTdGF0ZV0gQSBkZWZhdWx0IHN0YXRlIG9mIGEgbm9kZVxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy50ZW1wbGF0ZV0gQSBtYXJrdXAgc2V0IHRvIG1ha2UgZWxlbWVudFxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGUuaW50ZXJuYWxOb2RlXSBIVE1MIHRlbXBsYXRlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5sZWFmTm9kZV0gSFRNTCB0ZW1wbGF0ZVxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5zdGF0ZUxhYmVsc10gVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhdGVMYWJlbHMub3BlbmVkXSBTdGF0ZS1PUEVORUQgbGFiZWwgKFRleHQgb3IgSFRNTClcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0YXRlTGFiZWxzLmNsb3NlZF0gU3RhdGUtQ0xPU0VEIGxhYmVsIChUZXh0IG9yIEhUTUwpXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmNsYXNzTmFtZXNdIENsYXNzIG5hbWVzIGZvciB0cmVlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLm5vZGVDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLmxlYWZDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBsZWFmIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMub3BlbmVkQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igb3BlbmVkIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuY2xvc2VkQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgY2xvc2VkIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudGV4dENsYXNzXSBBIGNsYXNzIG5hbWUgdGhhdCBmb3IgdGV4dEVsZW1lbnQgaW4gbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igc3VidHJlZSBpbiBpbnRlcm5hbCBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIHRvZ2dsZSBidXR0b24gaW4gaW50ZXJuYWwgbm9kZVxuICogICAgIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLnJlbmRlclRlbXBsYXRlXSBGdW5jdGlvbiBmb3IgcmVuZGVyaW5nIHRlbXBsYXRlXG4gKiBAZXhhbXBsZVxuICogLy9EZWZhdWx0IG9wdGlvbnM6XG4gKiAvLyB7XG4gKiAvLyAgICAgbm9kZUlkUHJlZml4OiAndHVpLXRyZWUtbm9kZS0nXG4gKiAvLyAgICAgbm9kZURlZmF1bHRTdGF0ZTogJ2Nsb3NlZCcsXG4gKiAvLyAgICAgc3RhdGVMYWJlbHM6IHtcbiAqIC8vICAgICAgICAgb3BlbmVkOiAnLScsXG4gKiAvLyAgICAgICAgIGNsb3NlZDogJysnXG4gKiAvLyAgICAgfSxcbiAqIC8vICAgICBjbGFzc05hbWVzOiB7XG4gKiAvLyAgICAgICAgIG5vZGVDbGFzczogJ3R1aS10cmVlLW5vZGUnLFxuICogLy8gICAgICAgICBsZWFmQ2xhc3M6ICd0dWktdHJlZS1sZWFmJyxcbiAqIC8vICAgICAgICAgb3BlbmVkQ2xhc3M6ICd0dWktdHJlZS1vcGVuZWQnLFxuICogLy8gICAgICAgICBjbG9zZWRDbGFzczogJ3R1aS10cmVlLWNsb3NlZCcsXG4gKiAvLyAgICAgICAgIHN1YnRyZWVDbGFzczogJ3R1aS10cmVlLXN1YnRyZWUnLFxuICogLy8gICAgICAgICB0b2dnbGVCdG5DbGFzczogJ3R1aS10cmVlLXRvZ2dsZUJ0bicsXG4gKiAvLyAgICAgICAgIHRleHRDbGFzczogJ3R1aS10cmVlLXRleHQnLFxuICogLy8gICAgIH0sXG4gKiAvLyAgICAgdGVtcGxhdGU6IHtcbiAqIC8vICAgICAgICAgaW50ZXJuYWxOb2RlOlxuICogLy8gICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3tzdGF0ZUxhYmVsfX08L2J1dHRvbj4nICtcbiAqIC8vICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAqIC8vICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e3N1YnRyZWVDbGFzc319XCI+e3tjaGlsZHJlbn19PC91bD4nXG4gKiAvLyAgICAgICAgIGxlYWZOb2RlOlxuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICogLy8gICAgIH1cbiAqIC8vIH1cbiAqIC8vXG4gKlxuICogdmFyIGRhdGEgPSBbXG4gKiAgICAge3RleHQ6ICdyb290QScsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQSd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMUInfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFDJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xRCd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkEnLCBjaGlsZHJlbjogW1xuICogICAgICAgICAgICAge3RleHQ6J3N1Yl8xQScsIGNoaWxkcmVuOltcbiAqICAgICAgICAgICAgICAgICB7dGV4dDonc3ViX3N1Yl8xQSd9XG4gKiAgICAgICAgICAgICBdfSxcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWJfMkEnfVxuICogICAgICAgICBdfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJCJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQyd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkQnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNBJywgY2hpbGRyZW46IFtcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWIzX2EnfSxcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWIzX2InfVxuICogICAgICAgICBdfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNCJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zQyd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0QnfVxuICogICAgIF19LFxuICogICAgIHt0ZXh0OiAncm9vdEInLCBjaGlsZHJlbjogW1xuICogICAgICAgICB7dGV4dDonQl9zdWIxJ30sXG4gKiAgICAgICAgIHt0ZXh0OidCX3N1YjInfSxcbiAqICAgICAgICAge3RleHQ6J2InfVxuICogICAgIF19XG4gKiBdO1xuICpcbiAqIHZhciB0cmVlMSA9IG5ldyB0dWkuY29tcG9uZW50LlRyZWUoZGF0YSwge1xuICogICAgIHJvb3RFbGVtZW50OiAndHJlZVJvb3QnLCAvLyBvciBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJlZVJvb3QnKVxuICogICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdvcGVuZWQnLFxuICpcbiAqICAgICAvLyA9PT09PT09PT0gT3B0aW9uOiBPdmVycmlkZSB0ZW1wbGF0ZSByZW5kZXJlciA9PT09PT09PT09PVxuICpcbiAqICAgICB0ZW1wbGF0ZTogeyAvLyB0ZW1wbGF0ZSBmb3IgTXVzdGFjaGUgZW5naW5lXG4gKiAgICAgICAgIGludGVybmFsTm9kZTpcbiAqICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7e3N0YXRlTGFiZWx9fX08L2J1dHRvbj4nICtcbiAqICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3t0ZXh0fX19PC9zcGFuPicgK1xuICogICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e3tjaGlsZHJlbn19fTwvdWw+J1xuICogICAgICAgICBsZWFmTm9kZTpcbiAqICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3t0ZXh0fX19PC9zcGFuPicgK1xuICogICAgIH0sXG4gKiAgICAgcmVuZGVyVGVtcGxhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgcHJvcHMpIHtcbiAqICAgICAgICAgLy8gTXVzdGFjaGUgdGVtcGxhdGUgZW5naW5lXG4gKiAgICAgICAgIHJldHVybiBNdXN0YWNoZS5yZW5kZXIodGVtcGxhdGUsIHByb3BzKTtcbiAqICAgICB9XG4gKiB9KTtcbiAqKi9cbnZhciBUcmVlID0gc25pcHBldC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IGNsYXNzIG5hbWVzXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY2xhc3NOYW1lcyA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbi5jbGFzc05hbWVzLCBvcHRpb25zLmNsYXNzTmFtZXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IHRlbXBsYXRlXG4gICAgICAgICAqIEB0eXBlIHt7aW50ZXJuYWxOb2RlOiBzdHJpbmcsIGxlYWZOb2RlOiBzdHJpbmd9fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbi50ZW1wbGF0ZSwgb3B0aW9ucy50ZW1wbGF0ZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJvb3QgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gb3B0aW9ucy5yb290RWxlbWVudDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxuICAgICAgICAgKiBAdHlwZSB7e29wZW5lZDogc3RyaW5nLCBjbG9zZWQ6IHN0cmluZ319XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnN0YXRlTGFiZWxzID0gb3B0aW9ucy5zdGF0ZUxhYmVscztcblxuICAgICAgICAvKipcbiAgICAgICAgICogTWFrZSB0cmVlIG1vZGVsXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTW9kZWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFRyZWVNb2RlbChkYXRhLCBvcHRpb25zKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRW5hYmxlZCBmZWF0dXJlc1xuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIG9iamVjdD59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmVuYWJsZWRGZWF0dXJlcyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGljayB0aW1lciB0byBwcmV2ZW50IGNsaWNrLWR1cGxpY2F0aW9uIHdpdGggZG91YmxlIGNsaWNrXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUbyBwcmV2ZW50IGNsaWNrIGV2ZW50IGlmIG1vdXNlIG1vdmVkIGJlZm9yZSBtb3VzZXVwLlxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbW91c2VNb3ZpbmdGbGFnID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbmRlciB0ZW1wbGF0ZVxuICAgICAgICAgKiBJdCBjYW4gYmUgb3ZlcnJvZGUgYnkgdXNlcidzIHRlbXBsYXRlIGVuZ2luZS5cbiAgICAgICAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcmVuZGVyVGVtcGxhdGUgPSBvcHRpb25zLnJlbmRlclRlbXBsYXRlIHx8IHV0aWwucmVuZGVyVGVtcGxhdGU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRydWUgd2hlbiBhIG5vZGUgaXMgbW92aW5nXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oe1xuICAgICAgICAgKiAgICAgYmVmb3JlRHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAqICAgICAgICAgaWYgKHRyZWUuaXNNb3ZpbmdOb2RlKSB7XG4gICAgICAgICAqICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICogICAgICAgICB9XG4gICAgICAgICAqICAgICAgICAgLy8uLlxuICAgICAgICAgKiAgICAgfSxcbiAgICAgICAgICogICAgIC8vLi4uLlxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICogdHJlZS5tb3ZlKCd0dWktdHJlZS1ub2RlLTEnLCAndHVpLXRyZWUtbm9kZS0yJyk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzTW92aW5nTm9kZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuX3NldFJvb3QoKTtcbiAgICAgICAgdGhpcy5fZHJhdyh0aGlzLmdldFJvb3ROb2RlSWQoKSk7XG4gICAgICAgIHRoaXMuX3NldEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcm9vdCBlbGVtZW50IG9mIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSb290OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJvb3RFbCA9IHRoaXMucm9vdEVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKHNuaXBwZXQuaXNTdHJpbmcocm9vdEVsKSkge1xuICAgICAgICAgICAgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHJvb3RFbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNuaXBwZXQuaXNIVE1MTm9kZShyb290RWwpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZXMuSU5WQUxJRF9ST09UX0VMRU1FTlQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9yaWdpbmFsUGFyZW50SWQgLSBPcmlnaW5hbCBwYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTW92ZTogZnVuY3Rpb24obm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCkge1xuICAgICAgICB0aGlzLl9kcmF3KG9yaWdpbmFsUGFyZW50SWQpO1xuICAgICAgICB0aGlzLl9kcmF3KG5ld1BhcmVudElkKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNtb3ZlXG4gICAgICAgICAqIEBwYXJhbSB7e25vZGVJZDogc3RyaW5nLCBvcmlnaW5hbFBhcmVudElkOiBzdHJpbmcsIG5ld1BhcmVudElkOiBzdHJpbmd9fSB0cmVlRXZlbnQgLSBUcmVlIGV2ZW50XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ21vdmUnLCBmdW5jdGlvbih0cmVlRXZlbnQpIHtcbiAgICAgICAgICogICAgIHZhciBub2RlSWQgPSB0cmVlRXZlbnQubm9kZUlkLFxuICAgICAgICAgKiAgICAgICAgIG9yaWdpbmFsUGFyZW50SWQgPSB0cmVlRXZlbnQub3JpZ2luYWxQYXJlbnRJZCxcbiAgICAgICAgICogICAgICAgICBuZXdQYXJlbnRJZCA9IHRyZWVFdmVudC5uZXdQYXJlbnRJZDtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKG5vZGVJZCwgb3JpZ2luYWxQYXJlbnRJZCwgbmV3UGFyZW50SWQpO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlyZSgnbW92ZScsIHtcbiAgICAgICAgICAgIG5vZGVJZDogbm9kZUlkLFxuICAgICAgICAgICAgb3JpZ2luYWxQYXJlbnRJZDogb3JpZ2luYWxQYXJlbnRJZCxcbiAgICAgICAgICAgIG5ld1BhcmVudElkOiBuZXdQYXJlbnRJZFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGV2ZW50IGhhbmRsZXJzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0RXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5vbih7XG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuX2RyYXcsXG4gICAgICAgICAgICBtb3ZlOiB0aGlzLl9vbk1vdmVcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnY2xpY2snLCBzbmlwcGV0LmJpbmQodGhpcy5fb25DbGljaywgdGhpcykpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290RWxlbWVudCwgJ21vdXNlZG93bicsIHNuaXBwZXQuYmluZCh0aGlzLl9vbk1vdXNlZG93biwgdGhpcykpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290RWxlbWVudCwgJ2RibGNsaWNrJywgc25pcHBldC5iaW5kKHRoaXMuX29uRG91YmxlQ2xpY2ssIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZG93bkV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbk1vdXNlZG93bjogZnVuY3Rpb24oZG93bkV2ZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIGNsaWVudFggPSBkb3duRXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGNsaWVudFkgPSBkb3duRXZlbnQuY2xpZW50WSxcbiAgICAgICAgICAgIGFicyA9IE1hdGguYWJzO1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uTW91c2VNb3ZlKG1vdmVFdmVudCkge1xuICAgICAgICAgICAgdmFyIG5ld0NsaWVudFggPSBtb3ZlRXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICBuZXdDbGllbnRZID0gbW92ZUV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGlmIChhYnMobmV3Q2xpZW50WCAtIGNsaWVudFgpICsgYWJzKG5ld0NsaWVudFkgLSBjbGllbnRZKSA+IE1PVVNFX01PVklOR19USFJFU0hPTEQpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmZpcmUoJ21vdXNlbW92ZScsIG1vdmVFdmVudCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fbW91c2VNb3ZpbmdGbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvbk1vdXNlVXAodXBFdmVudCkge1xuICAgICAgICAgICAgc2VsZi5maXJlKCdtb3VzZXVwJywgdXBFdmVudCk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX21vdXNlTW92aW5nRmxhZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZpcmUoJ21vdXNlZG93bicsIGRvd25FdmVudCk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBjbGlja1xuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBDbGljayBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3MpKSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZSh0aGlzLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCkpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuY2xpY2tUaW1lciAmJiAhdGhpcy5fbW91c2VNb3ZpbmdGbGFnKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3NpbmdsZUNsaWNrJywgZXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlc2V0Q2xpY2tUaW1lcigpO1xuICAgICAgICAgICAgfSwgVElNRU9VVF9UT19ESUZGRVJFTlRJQVRFX0NMSUNLX0FORF9EQkxDTElDSyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGRvdWJsZSBjbGljayAoZGJsY2xpY2spXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIERvdWJsZSBjbGljayBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuZmlyZSgnZG91YmxlQ2xpY2snLCBldmVudCk7XG4gICAgICAgIHRoaXMucmVzZXRDbGlja1RpbWVyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBub2RlIHN0YXRlIC0gb3BlbmVkIG9yIGNsb3NlZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTm9kZSBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlKSB7XG4gICAgICAgIHZhciBzdWJ0cmVlRWxlbWVudCA9IHRoaXMuX2dldFN1YnRyZWVFbGVtZW50KG5vZGVJZCksXG4gICAgICAgICAgICBsYWJlbCwgYnRuRWxlbWVudCwgbm9kZUVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCFzdWJ0cmVlRWxlbWVudCB8fCBzdWJ0cmVlRWxlbWVudCA9PT0gdGhpcy5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxhYmVsID0gdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV07XG4gICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgYnRuRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgIG5vZGVFbGVtZW50LFxuICAgICAgICAgICAgdGhpcy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzXG4gICAgICAgIClbMF07XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBub2RlU3RhdGVzLk9QRU5FRCkge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlKG5vZGVFbGVtZW50LCBzdGF0ZSk7XG5cbiAgICAgICAgaWYgKGJ0bkVsZW1lbnQpIHtcbiAgICAgICAgICAgIGJ0bkVsZW1lbnQuaW5uZXJIVE1MID0gbGFiZWw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG5vZGUgY2xhc3MgbmFtZSBmcm9tIHByb3ZpZGVkIHN0YXRlXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZUVsZW1lbnQgLSBUcmVlTm9kZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTmV3IGNoYW5nZWQgc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlOiBmdW5jdGlvbihub2RlRWxlbWVudCwgc3RhdGUpIHtcbiAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXMsXG4gICAgICAgICAgICBvcGVuZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuT1BFTkVEICsgJ0NsYXNzJ10sXG4gICAgICAgICAgICBjbG9zZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuQ0xPU0VEICsgJ0NsYXNzJ107XG5cbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgb3BlbmVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgY2xvc2VkQ2xhc3NOYW1lKTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgY2xhc3NOYW1lc1tzdGF0ZSArICdDbGFzcyddKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGh0bWxcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBub2RlSWRzIC0gTm9kZSBpZCBsaXN0XG4gICAgICogQHJldHVybnMge3N0cmluZ30gSFRNTFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHNlZSBvdXRlclRlbXBsYXRlIHVzZXMgXCJ1dGlsLnJlbmRlclRlbXBsYXRlXCJcbiAgICAgKi9cbiAgICBfbWFrZUh0bWw6IGZ1bmN0aW9uKG5vZGVJZHMpIHtcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbCxcbiAgICAgICAgICAgIGh0bWwgPSAnJztcblxuICAgICAgICBzbmlwcGV0LmZvckVhY2gobm9kZUlkcywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IG1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgICAgICBzb3VyY2VzLCBwcm9wcztcblxuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzb3VyY2VzID0gdGhpcy5fZ2V0VGVtcGxhdGUobm9kZSk7XG4gICAgICAgICAgICBwcm9wcyA9IHRoaXMuX21ha2VUZW1wbGF0ZVByb3BzKG5vZGUpO1xuICAgICAgICAgICAgcHJvcHMuaW5uZXJUZW1wbGF0ZSA9IHRoaXMuX21ha2VJbm5lckhUTUwobm9kZSwge1xuICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlcy5pbm5lcixcbiAgICAgICAgICAgICAgICBwcm9wczogcHJvcHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaHRtbCArPSB1dGlsLnJlbmRlclRlbXBsYXRlKHNvdXJjZXMub3V0ZXIsIHByb3BzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgaW5uZXIgaHRtbCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcGFyYW0ge3tzb3VyY2U6IHN0cmluZywgcHJvcHM6IE9iamVjdH19IFtjYWNoZWRdIC0gQ2FzaGVkIGRhdGEgdG8gbWFrZSBodG1sXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSW5uZXIgaHRtbCBvZiBub2RlXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAc2VlIGlubmVyVGVtcGxhdGUgdXNlcyBcInRoaXMuX3JlbmRlclRlbXBsYXRlXCJcbiAgICAgKi9cbiAgICBfbWFrZUlubmVySFRNTDogZnVuY3Rpb24obm9kZSwgY2FjaGVkKSB7XG4gICAgICAgIHZhciBzb3VyY2UsIHByb3BzO1xuXG4gICAgICAgIGNhY2hlZCA9IGNhY2hlZCB8fCB7fTtcbiAgICAgICAgc291cmNlID0gY2FjaGVkLnNvdXJjZSB8fCB0aGlzLl9nZXRUZW1wbGF0ZShub2RlKS5pbm5lcjtcbiAgICAgICAgcHJvcHMgPSBjYWNoZWQucHJvcHMgfHwgdGhpcy5fbWFrZVRlbXBsYXRlUHJvcHMobm9kZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlclRlbXBsYXRlKHNvdXJjZSwgcHJvcHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGVtcGxhdGUgc291cmNlc1xuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHJldHVybnMge3tpbm5lcjogc3RyaW5nLCBvdXRlcjogc3RyaW5nfX0gVGVtcGxhdGUgc291cmNlc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFRlbXBsYXRlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBzb3VyY2U7XG5cbiAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHNvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICBpbm5lcjogdGhpcy50ZW1wbGF0ZS5sZWFmTm9kZSxcbiAgICAgICAgICAgICAgICBvdXRlcjogb3V0ZXJUZW1wbGF0ZS5MRUFGX05PREVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VyY2UgPSB7XG4gICAgICAgICAgICAgICAgaW5uZXI6IHRoaXMudGVtcGxhdGUuaW50ZXJuYWxOb2RlLFxuICAgICAgICAgICAgICAgIG91dGVyOiBvdXRlclRlbXBsYXRlLklOVEVSTkFMX05PREVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291cmNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRlbXBsYXRlIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBub2RlIC0gTm9kZVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRlbXBsYXRlIHByb3BlcnRpZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlVGVtcGxhdGVQcm9wczogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcbiAgICAgICAgICAgIHByb3BzLCBzdGF0ZTtcblxuICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IG5vZGUuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICBpc0xlYWY6IHRydWUgLy8gZm9yIGN1c3RvbSB0ZW1wbGF0ZSBtZXRob2RcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKTtcbiAgICAgICAgICAgIHByb3BzID0ge1xuICAgICAgICAgICAgICAgIGlkOiBub2RlLmdldElkKCksXG4gICAgICAgICAgICAgICAgc3RhdGVDbGFzczogY2xhc3NOYW1lc1tzdGF0ZSArICdDbGFzcyddLFxuICAgICAgICAgICAgICAgIHN0YXRlTGFiZWw6IHRoaXMuc3RhdGVMYWJlbHNbc3RhdGVdLFxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiB0aGlzLl9tYWtlSHRtbChub2RlLmdldENoaWxkSWRzKCkpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4dGVuZChwcm9wcywgY2xhc3NOYW1lcywgbm9kZS5nZXRBbGxEYXRhKCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEcmF3IGVsZW1lbnQgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXG4gICAgICAgICAgICBlbGVtZW50LCBodG1sO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlRHJhd1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdiZWZvcmVEcmF3JywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAqICAgICBpZiAodHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICogICAgICAgICBjb25zb2xlLmxvZygnaXNNb3ZpbmdOb2RlJyk7XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZygnYmVmb3JlRHJhdzogJyArIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdiZWZvcmVEcmF3Jywgbm9kZUlkKTtcblxuICAgICAgICBpZiAobm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgaHRtbCA9IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5yb290RWxlbWVudDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGh0bWwgPSB0aGlzLl9tYWtlSW5uZXJIVE1MKG5vZGUpO1xuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLl9zZXRDbGFzc1dpdGhEaXNwbGF5KG5vZGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2FmdGVyRHJhd1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdhZnRlckRyYXcnLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgIGlmICh0cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCdpc01vdmluZ05vZGUnKTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCdhZnRlckRyYXc6ICcgKyBub2RlSWQpO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlyZSgnYWZ0ZXJEcmF3Jywgbm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNsYXNzIGFuZCBkaXNwbGF5IG9mIG5vZGUgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q2xhc3NXaXRoRGlzcGxheTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgbm9kZUlkID0gbm9kZS5nZXRJZCgpLFxuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCksXG4gICAgICAgICAgICBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzO1xuXG4gICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZXMub3BlbmVkQ2xhc3MpO1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhlbGVtZW50LCBjbGFzc05hbWVzLmNsb3NlZENsYXNzKTtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5sZWFmQ2xhc3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBub2RlLmdldFN0YXRlKCkpO1xuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0Q2xhc3NXaXRoRGlzcGxheShjaGlsZCk7XG4gICAgICAgICAgICB9LCBub2RlSWQsIHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzdWJ0cmVlIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVHJlZU5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFN1YnRyZWUgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN1YnRyZWVFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50O1xuXG4gICAgICAgIGlmICghbm9kZSB8fCBub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB1dGlsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKSxcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZXMuc3VidHJlZUNsYXNzXG4gICAgICAgICAgICApWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1YnRyZWVFbGVtZW50O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGRlcHRoIG9mIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfHVuZGVmaW5lZH0gRGVwdGhcbiAgICAgKi9cbiAgICBnZXREZXB0aDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldERlcHRoKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgbGFzdCBkZXB0aCBvZiB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IExhc3QgZGVwdGhcbiAgICAgKi9cbiAgICBnZXRMYXN0RGVwdGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRMYXN0RGVwdGgoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHJvb3Qgbm9kZSBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSb290IG5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRSb290Tm9kZUlkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwucm9vdE5vZGUuZ2V0SWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGNoaWxkIGlkc1xuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPnx1bmRlZmluZWR9IENoaWxkIGlkc1xuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHBhcmVudCBpZCBvZiBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFBhcmVudCBpZFxuICAgICAqL1xuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0UGFyZW50SWQobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgY2xpY2sgdGltZXJcbiAgICAgKi9cbiAgICByZXNldENsaWNrVGltZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuY2xpY2tUaW1lcik7XG4gICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIGlkIGZyb20gZWxlbWVudFxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gRWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQoZWxlbWVudEluTm9kZSk7IC8vICd0dWktdHJlZS1ub2RlLTMnXG4gICAgICovXG4gICAgZ2V0Tm9kZUlkRnJvbUVsZW1lbnQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGlkUHJlZml4ID0gdGhpcy5nZXROb2RlSWRQcmVmaXgoKTtcblxuICAgICAgICB3aGlsZSAoZWxlbWVudCAmJiBlbGVtZW50LmlkLmluZGV4T2YoaWRQcmVmaXgpID09PSAtMSkge1xuICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5pZCA6ICcnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcHJlZml4IG9mIG5vZGUgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUHJlZml4IG9mIG5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0Tm9kZUlkUHJlZml4KCk7IC8vICd0dWktdHJlZS1ub2RlLSdcbiAgICAgKi9cbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXROb2RlSWRQcmVmaXgoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtvYmplY3R8dW5kZWZpbmVkfSBOb2RlIGRhdGFcbiAgICAgKi9cbiAgICBnZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVEYXRhKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkYXRhIHByb3BlcnRpZXMgb2YgYSBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBQcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqIEBleG1hcGxlXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIHtmb286ICdiYXInfSk7IC8vIGF1dG8gcmVmcmVzaFxuICAgICAqIHRyZWUuc2V0Tm9kZURhdGEobm9kZUlkLCB7Zm9vOiAnYmFyJ30sIHRydWUpOyAvLyBub3QgcmVmcmVzaFxuICAgICAqL1xuICAgIHNldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIGRhdGEsIGlzU2lsZW50KSB7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0Tm9kZURhdGEobm9kZUlkLCBkYXRhLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0gbmFtZXMgLSBOYW1lcyBvZiBwcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsICdmb28nKTsgLy8gYXV0byByZWZyZXNoXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsICdmb28nLCB0cnVlKTsgLy8gbm90IHJlZnJlc2hcbiAgICAgKi9cbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBuYW1lcywgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmVOb2RlRGF0YShub2RlSWQsIG5hbWVzLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIHN0YXRlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge3N0cmluZ3xudWxsfSBOb2RlIHN0YXRlKCgnb3BlbmVkJywgJ2Nsb3NlZCcsIG51bGwpXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLmdldFN0YXRlKG5vZGVJZCk7IC8vICdvcGVuZWQnLCAnY2xvc2VkJyxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVuZGVmaW5lZCBpZiB0aGUgbm9kZSBpcyBub25leGlzdGVudFxuICAgICAqL1xuICAgIGdldFN0YXRlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0U3RhdGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT3BlbiBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICovXG4gICAgb3BlbjogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGVTdGF0ZXMuT1BFTkVEO1xuXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBub2RlLnNldFN0YXRlKHN0YXRlKTtcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsb3NlIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKi9cbiAgICBjbG9zZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGVTdGF0ZXMuQ0xPU0VEO1xuXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBub2RlLnNldFN0YXRlKHN0YXRlKTtcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICovXG4gICAgdG9nZ2xlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN0YXRlO1xuXG4gICAgICAgIGlmIChub2RlICYmICFub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBub2RlLnRvZ2dsZVN0YXRlKCk7XG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNvcnQgYWxsIG5vZGVzXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgLSBDb21wYXJhdG9yIGZvciBzb3J0aW5nXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgdHJlZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gU29ydCB3aXRoIHJlZHJhd2luZyB0cmVlXG4gICAgICogdHJlZS5zb3J0KGZ1bmN0aW9uKG5vZGVBLCBub2RlQikge1xuICAgICAqICAgICB2YXIgYVZhbHVlID0gbm9kZUEuZ2V0RGF0YSgndGV4dCcpLFxuICAgICAqICAgICAgICAgYlZhbHVlID0gbm9kZUIuZ2V0RGF0YSgndGV4dCcpO1xuICAgICAqXG4gICAgICogICAgIGlmICghYlZhbHVlIHx8ICFiVmFsdWUubG9jYWxlQ29tcGFyZSkge1xuICAgICAqICAgICAgICAgcmV0dXJuIDA7XG4gICAgICogICAgIH1cbiAgICAgKiAgICAgcmV0dXJuIGJWYWx1ZS5sb2NhbGVDb21wYXJlKGFWYWx1ZSk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiAvLyBTb3J0LCBidXQgbm90IHJlZHJhdyB0cmVlXG4gICAgICogdHJlZS5zb3J0KGZ1bmN0aW9uKG5vZGVBLCBub2RlQikge1xuICAgICAqICAgICB2YXIgYVZhbHVlID0gbm9kZUEuZ2V0RGF0YSgndGV4dCcpLFxuICAgICAqICAgICAgICAgYlZhbHVlID0gbm9kZUIuZ2V0RGF0YSgndGV4dCcpO1xuICAgICAqXG4gICAgICogICAgIGlmICghYlZhbHVlIHx8ICFiVmFsdWUubG9jYWxlQ29tcGFyZSkge1xuICAgICAqICAgICAgICAgcmV0dXJuIDA7XG4gICAgICogICAgIH1cbiAgICAgKiAgICAgcmV0dXJuIGJWYWx1ZS5sb2NhbGVDb21wYXJlKGFWYWx1ZSk7XG4gICAgICogfSwgdHJ1ZSk7XG4gICAgICovXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvciwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zb3J0KGNvbXBhcmF0b3IpO1xuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZWZyZXNoIHRyZWUgb3Igbm9kZSdzIGNoaWxkcmVuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbm9kZUlkXSAtIFRyZWVOb2RlIGlkIHRvIHJlZnJlc2hcbiAgICAgKi9cbiAgICByZWZyZXNoOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgbm9kZUlkID0gbm9kZUlkIHx8IHRoaXMuZ2V0Um9vdE5vZGVJZCgpO1xuICAgICAgICB0aGlzLl9kcmF3KG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgbm9kZXMuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAqICAgICBjb25zb2xlLmxvZyhub2RlLmdldElkKCkgPT09IG5vZGVJZCk7IC8vIHRydWVcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBlYWNoQWxsOiBmdW5jdGlvbihpdGVyYXRlZSwgY29udGV4dCkge1xuICAgICAgICB0aGlzLm1vZGVsLmVhY2hBbGwoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIGRlc2NlbmRhbnRzIG9mIGEgbm9kZS5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZWFjaChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcbiAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZS5nZXRJZCgpID09PSBub2RlSWQpOyAvLyB0cnVlXG4gICAgICogfSwgcGFyZW50SWQpO1xuICAgICAqXG4gICAgICovXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMubW9kZWwuZWFjaChpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgbm9kZShzKS5cbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxuICAgICAqIEBwYXJhbSB7Kn0gW3BhcmVudElkXSAtIFBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gYWRkIG5vZGUgd2l0aCByZWRyYXdpbmdcbiAgICAgKiB2YXIgZmlyc3RBZGRlZElkcyA9IHRyZWUuYWRkKHt0ZXh0OidGRSBkZXZlbG9wbWVudCB0ZWFtMSd9LCBwYXJlbnRJZCk7XG4gICAgICogY29uc29sZS5sb2coZmlyc3RBZGRlZElkcyk7IC8vIFtcInR1aS10cmVlLW5vZGUtMTBcIl1cbiAgICAgKlxuICAgICAqIC8vIGFkZCBub2RlIHdpdGhvdXQgcmVkcmF3aW5nXG4gICAgICogdmFyIHNlY29uZEFkZGVkSWRzID0gdHJlZS5hZGQoW1xuICAgICAqICAgIHt0ZXh0OiAnRkUgZGV2ZWxvcG1lbnQgdGVhbTInfSxcbiAgICAgKiAgICB7dGV4dDogJ0ZFIGRldmVsb3BtZW50IHRlYW0zJ31cbiAgICAgKiBdLCBwYXJlbnRJZCwgdHJ1ZSk7XG4gICAgICogY29uc29sZS5sb2coc2Vjb25kQWRkZWRJZHMpOyAvLyBbXCJ0dWktdHJlZS1ub2RlLTExXCIsIFwidHVpLXRyZWUtbm9kZS0xMlwiXVxuICAgICAqL1xuICAgIGFkZDogZnVuY3Rpb24oZGF0YSwgcGFyZW50SWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmFkZChkYXRhLCBwYXJlbnRJZCwgaXNTaWxlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXNldCBhbGwgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdyBkYXRhIGZvciBhbGwgbm9kZXNcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLnJlc2V0QWxsRGF0YShbXG4gICAgICogIHt0ZXh0OiAnaGVsbG8nLCBjaGlsZHJlbjogW1xuICAgICAqICAgICAge3RleHQ6ICdmb28nfSxcbiAgICAgKiAgICAgIHt0ZXh0OiAnYmFyJ31cbiAgICAgKiAgXX0sXG4gICAgICogIHt0ZXh0OiAnd29scmQnfVxuICAgICAqIF0pO1xuICAgICAqL1xuICAgIHJlc2V0QWxsRGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLnJlbW92ZUFsbENoaWxkcmVuKHRoaXMuZ2V0Um9vdE5vZGVJZCgpLCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hZGQoZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhbGwgY2hpbGRyZW5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgdGhlIG5vZGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUucmVtb3ZlQWxsQ2hpbGRyZW4obm9kZUlkKTsgLy8gUmVkcmF3cyB0aGUgbm9kZVxuICAgICAqIHRyZWUucmVtb3ZlQWxsQ2hpbGRyZW4obm9kSWQsIHRydWUpOyAvLyBEb2Vzbid0IHJlZHJhdyB0aGUgbm9kZVxuICAgICAqL1xuICAgIHJlbW92ZUFsbENoaWxkcmVuOiBmdW5jdGlvbihub2RlSWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZElkKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShjaGlsZElkLCB0cnVlKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5fZHJhdyhub2RlSWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIG5vZGUgd2l0aCBjaGlsZHJlbi5cbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWQgdG8gcmVtb3ZlXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUucmVtb3ZlKG15Tm9kZUlkKTsgLy8gcmVtb3ZlIG5vZGUgd2l0aCByZWRyYXdpbmdcbiAgICAgKiB0cmVlLnJlbW92ZShteU5vZGVJZCwgdHJ1ZSk7IC8vIHJlbW92ZSBub2RlIHdpdGhvdXQgcmVkcmF3aW5nXG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihub2RlSWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHRoaXMubW9kZWwucmVtb3ZlKG5vZGVJZCwgaXNTaWxlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGEgbm9kZSB0byBuZXcgcGFyZW50XG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLm1vdmUobXlOb2RlSWQsIG5ld1BhcmVudElkKTsgLy8gbW9kZSBub2RlIHdpdGggcmVkcmF3aW5nXG4gICAgICogdHJlZS5tb3ZlKG15Tm9kZUlkLCBuZXdQYXJlbnRJZCwgdHJ1ZSk7IC8vIG1vdmUgbm9kZSB3aXRob3V0IHJlZHJhd2luZ1xuICAgICAqL1xuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHRoaXMuaXNNb3ZpbmdOb2RlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5tb2RlbC5tb3ZlKG5vZGVJZCwgbmV3UGFyZW50SWQsIGlzU2lsZW50KTtcbiAgICAgICAgdGhpcy5pc01vdmluZ05vZGUgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIG5vZGUgaWRzIGJ5IHBhc3NpbmcgdGhlIHByZWRpY2F0ZSBjaGVjayBvciBtYXRjaGluZyBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fSBwcmVkaWNhdGUgLSBQcmVkaWNhdGUgb3IgZGF0YVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIHByZWRpY2F0ZVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIHNlYXJjaCBmcm9tIHByZWRpY2F0ZVxuICAgICAqIHZhciBsZWFmTm9kZUlkcyA9IHRyZWUuc2VhcmNoKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAqICAgICByZXR1cm4gbm9kZS5pc0xlYWYoKTtcbiAgICAgKiB9KTtcbiAgICAgKiBjb25zb2xlLmxvZyhsZWFmTm9kZUlkcyk7IC8vIFsndHVpLXRyZWUtbm9kZS0zJywgJ3R1aS10cmVlLW5vZGUtNSddXG4gICAgICpcbiAgICAgKiAvLyBzZWFyY2ggZnJvbSBkYXRhXG4gICAgICogdmFyIHNwZWNpYWxOb2RlSWRzID0gdHJlZS5zZWFyY2goe1xuICAgICAqICAgICBpc1NwZWNpYWw6IHRydWUsXG4gICAgICogICAgIGZvbzogJ2JhcidcbiAgICAgKiB9KTtcbiAgICAgKiBjb25zb2xlLmxvZyhzcGVjaWFsTm9kZUlkcyk7IC8vIFsndHVpLXRyZWUtbm9kZS01JywgJ3R1aS10cmVlLW5vZGUtMTAnXVxuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuZ2V0Tm9kZURhdGEoJ3R1aS10cmVlLW5vZGUtNScpLmlzU3BlY2lhbCk7IC8vIHRydWVcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmdldE5vZGVEYXRhKCd0dWktdHJlZS1ub2RlLTUnKS5mb28pOyAvLyAnYmFyJ1xuICAgICAqL1xuICAgIHNlYXJjaDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICAgIGlmICghc25pcHBldC5pc09iamVjdChwcmVkaWNhdGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc25pcHBldC5pc0Z1bmN0aW9uKHByZWRpY2F0ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maWx0ZXIocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl93aGVyZShwcmVkaWNhdGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2ggbm9kZSBpZHMgYnkgbWF0Y2hpbmcgZGF0YVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIERhdGFcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfd2hlcmU6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWx0ZXIoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YSA9IG5vZGUuZ2V0QWxsRGF0YSgpO1xuXG4gICAgICAgICAgICBzbmlwcGV0LmZvckVhY2gocHJvcHMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAoa2V5IGluIGRhdGEpICYmIChkYXRhW2tleV0gPT09IHZhbHVlKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlYXJjaCBub2RlIGlkcyBieSBwYXNzaW5nIHRoZSBwcmVkaWNhdGUgY2hlY2tcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgLSBQcmVkaWNhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBwcmVkaWNhdGVcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZmlsdGVyOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGZpbHRlcmVkID0gW107XG5cbiAgICAgICAgdGhpcy5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShub2RlLCBub2RlSWQpKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWQucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBjb250ZXh0KTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIG5vZGUgaXMgbGVhZlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIGlzIGxlYWYuXG4gICAgICovXG4gICAgaXNMZWFmOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKTtcblxuICAgICAgICByZXR1cm4gbm9kZSAmJiBub2RlLmlzTGVhZigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGEgbm9kZSBpcyBhIGFuY2VzdG9yIG9mIGFub3RoZXIgbm9kZS5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lck5vZGVJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBjb250YWluIHRoZSBvdGhlciBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lZE5vZGVJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBiZSBjb250YWluZWQgYnkgdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciBhIG5vZGUgY29udGFpbnMgYW5vdGhlciBub2RlXG4gICAgICovXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGNvbnRhaW5lck5vZGVJZCwgY29udGFpbmVkTm9kZUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmNvbnRhaW5zKGNvbnRhaW5lZE5vZGVJZCwgY29udGFpbmVkTm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW5hYmxlIGZhY2lsaXR5IG9mIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVOYW1lIC0gJ1NlbGVjdGFibGUnLCAnRHJhZ2dhYmxlJywgJ0VkaXRhYmxlJ1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBGZWF0dXJlIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7VHJlZX0gdGhpc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScsIHtcbiAgICAgKiAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lOiAndHVpLXRyZWUtc2VsZWN0ZWQnXG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdFZGl0YWJsZScsIHtcbiAgICAgKiAgICAgIGVuYWJsZUNsYXNzTmFtZTogdHJlZS5jbGFzc05hbWVzLnRleHRDbGFzcyxcbiAgICAgKiAgICAgIGRhdGFLZXk6ICd0ZXh0JyxcbiAgICAgKiAgICAgIGlucHV0Q2xhc3NOYW1lOiAnbXlJbnB1dCdcbiAgICAgKiAgfSlcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0RyYWdnYWJsZScsIHtcbiAgICAgKiAgICAgIHVzZUhlbHBlcjogdHJ1ZSxcbiAgICAgKiAgICAgIGhlbHBlclBvczoge3g6IDUsIHk6IDJ9LFxuICAgICAqICAgICAgcmVqZWN0ZWRUYWdOYW1lczogWydVTCcsICdJTlBVVCcsICdCVVRUT04nXSxcbiAgICAgKiAgICAgIHJlamVjdGVkQ2xhc3NOYW1lczogWydub3REcmFnZ2FibGUnLCAnbm90RHJhZ2dhYmxlLTInXVxuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnQ2hlY2tib3gnLCB7XG4gICAgICogICAgICBjaGVja2JveENsYXNzTmFtZTogJ3R1aS10cmVlLWNoZWNrYm94J1xuICAgICAqICB9KTtcbiAgICAgKi9cbiAgICBlbmFibGVGZWF0dXJlOiBmdW5jdGlvbihmZWF0dXJlTmFtZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgRmVhdHVyZSA9IGZlYXR1cmVzW2ZlYXR1cmVOYW1lXTtcblxuICAgICAgICB0aGlzLmRpc2FibGVGZWF0dXJlKGZlYXR1cmVOYW1lKTtcbiAgICAgICAgaWYgKEZlYXR1cmUpIHtcbiAgICAgICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXSA9IG5ldyBGZWF0dXJlKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgZmFjaWxpdHkgb2YgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnLCAnRWRpdGFibGUnXG4gICAgICogQHJldHVybnMge1RyZWV9IHRoaXNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWVcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdEcmFnZ2FibGUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJylcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdDaGVja2JveCcpO1xuICAgICAqL1xuICAgIGRpc2FibGVGZWF0dXJlOiBmdW5jdGlvbihmZWF0dXJlTmFtZSkge1xuICAgICAgICB2YXIgZmVhdHVyZSA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXTtcblxuICAgICAgICBpZiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgZmVhdHVyZS5kZXN0cm95KCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufSk7XG5cbi8qKlxuICogU2V0IGFic3RyYWN0IGFwaXMgdG8gdHJlZSBwcm90b3R5cGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtIEZlYXR1cmUgbmFtZVxuICogQHBhcmFtIHtvYmplY3R9IGZlYXR1cmUgLSBGZWF0dXJlXG4gKi9cbmZ1bmN0aW9uIHNldEFic3RyYWN0QVBJcyhmZWF0dXJlTmFtZSwgZmVhdHVyZSkge1xuICAgIHZhciBtZXNzYWdlTmFtZSA9ICdJTlZBTElEX0FQSV8nICsgZmVhdHVyZU5hbWUudG9VcHBlckNhc2UoKSxcbiAgICAgICAgYXBpTGlzdCA9IGZlYXR1cmUuZ2V0QVBJTGlzdCA/IGZlYXR1cmUuZ2V0QVBJTGlzdCgpIDogW107XG5cbiAgICBzbmlwcGV0LmZvckVhY2goYXBpTGlzdCwgZnVuY3Rpb24oYXBpKSB7XG4gICAgICAgIFRyZWUucHJvdG90eXBlW2FwaV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlc1ttZXNzYWdlTmFtZV0gfHwgbWVzc2FnZXMuSU5WQUxJRF9BUEkpO1xuICAgICAgICB9O1xuICAgIH0pO1xufVxuc25pcHBldC5mb3JFYWNoKGZlYXR1cmVzLCBmdW5jdGlvbihGZWF0dXJlLCBuYW1lKSB7XG4gICAgc2V0QWJzdHJhY3RBUElzKG5hbWUsIEZlYXR1cmUpO1xufSk7XG5zbmlwcGV0LkN1c3RvbUV2ZW50cy5taXhpbihUcmVlKTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBVcGRhdGUgdmlldyBhbmQgY29udHJvbCB0cmVlIGRhdGFcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVHJlZU5vZGUgPSByZXF1aXJlKCcuL3RyZWVOb2RlJyk7XG5cbnZhciBleHRlbmQgPSB0dWkudXRpbC5leHRlbmQsXG4gICAga2V5cyA9IHR1aS51dGlsLmtleXMsXG4gICAgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2gsXG4gICAgbWFwID0gdHVpLnV0aWwubWFwO1xuXG4vKipcbiAqIFRyZWUgbW9kZWxcbiAqIEBjb25zdHJ1Y3RvciBUcmVlTW9kZWxcbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBEYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnMgZm9yIGRlZmF1bHRTdGF0ZSBhbmQgbm9kZUlkUHJlZml4XG4gKiovXG52YXIgVHJlZU1vZGVsID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlTW9kZWwucHJvdG90eXBlICoveyAvKiBlc2xpbnQtZGlzYWJsZSAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpIHsvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBUcmVlTm9kZS5zZXRJZFByZWZpeChvcHRpb25zLm5vZGVJZFByZWZpeCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmF1bHQgc3RhdGUgb2Ygbm9kZVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5ub2RlRGVmYXVsdFN0YXRlID0gb3B0aW9ucy5ub2RlRGVmYXVsdFN0YXRlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSb290IG5vZGVcbiAgICAgICAgICogQHR5cGUge1RyZWVOb2RlfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yb290Tm9kZSA9IG5ldyBUcmVlTm9kZSh7XG4gICAgICAgICAgICBzdGF0ZTogJ29wZW5lZCdcbiAgICAgICAgfSwgbnVsbCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyZWUgaGFzaCBoYXZpbmcgYWxsIG5vZGVzXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3QuPHN0cmluZywgVHJlZU5vZGU+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmVlSGFzaCA9IHt9O1xuXG4gICAgICAgIHRoaXMuX3NldERhdGEoZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBwcmVmaXggb2Ygbm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFByZWZpeFxuICAgICAqL1xuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBUcmVlTm9kZS5pZFByZWZpeDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG1vZGVsIHdpdGggdHJlZSBkYXRhXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIFRyZWUgZGF0YVxuICAgICAqL1xuICAgIF9zZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciByb290ID0gdGhpcy5yb290Tm9kZSxcbiAgICAgICAgICAgIHJvb3RJZCA9IHJvb3QuZ2V0SWQoKTtcblxuICAgICAgICB0aGlzLnRyZWVIYXNoW3Jvb3RJZF0gPSByb290O1xuICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goZGF0YSwgcm9vdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgdHJlZSBoYXNoIGZyb20gZGF0YSBhbmQgcGFyZW50Tm9kZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBUcmVlIGRhdGFcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBwYXJlbnQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQWRkZWQgbm9kZSBpZHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlVHJlZUhhc2g6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudCkge1xuICAgICAgICB2YXIgcGFyZW50SWQgPSBwYXJlbnQuZ2V0SWQoKSxcbiAgICAgICAgICAgIGlkcyA9IFtdO1xuXG4gICAgICAgIGZvckVhY2goZGF0YSwgZnVuY3Rpb24oZGF0dW0pIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbkRhdGEgPSBkYXR1bS5jaGlsZHJlbixcbiAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5fY3JlYXRlTm9kZShkYXR1bSwgcGFyZW50SWQpLFxuICAgICAgICAgICAgICAgIG5vZGVJZCA9IG5vZGUuZ2V0SWQoKTtcblxuICAgICAgICAgICAgaWRzLnB1c2gobm9kZUlkKTtcbiAgICAgICAgICAgIHRoaXMudHJlZUhhc2hbbm9kZUlkXSA9IG5vZGU7XG4gICAgICAgICAgICBwYXJlbnQuYWRkQ2hpbGRJZChub2RlSWQpO1xuICAgICAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGNoaWxkcmVuRGF0YSwgbm9kZSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBpZHM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBub2RlXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVEYXRhIC0gRGF0dW0gb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxuICAgICAqIEByZXR1cm5zIHtUcmVlTm9kZX0gVHJlZU5vZGVcbiAgICAgKi9cbiAgICBfY3JlYXRlTm9kZTogZnVuY3Rpb24obm9kZURhdGEsIHBhcmVudElkKSB7XG4gICAgICAgIG5vZGVEYXRhID0gZXh0ZW5kKHtcbiAgICAgICAgICAgIHN0YXRlOiB0aGlzLm5vZGVEZWZhdWx0U3RhdGVcbiAgICAgICAgfSwgbm9kZURhdGEpO1xuXG4gICAgICAgIHJldHVybiBuZXcgVHJlZU5vZGUobm9kZURhdGEsIHBhcmVudElkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoaWxkcmVuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P0FycmF5LjxUcmVlTm9kZT59IGNoaWxkcmVuXG4gICAgICovXG4gICAgZ2V0Q2hpbGRyZW46IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLmdldENoaWxkSWRzKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFjaGlsZElkcykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWFwKGNoaWxkSWRzLCBmdW5jdGlvbihjaGlsZElkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXROb2RlKGNoaWxkSWQpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoaWxkIGlkc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMgez9BcnJheS48c3RyaW5nPn0gQ2hpbGQgaWRzXG4gICAgICovXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRDaGlsZElkcygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIG51bWJlciBvZiBub2Rlc1xuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBudW1iZXIgb2Ygbm9kZXNcbiAgICAgKi9cbiAgICBnZXRDb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBrZXlzKHRoaXMudHJlZUhhc2gpLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGxhc3QgZGVwdGhcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbGFzdCBkZXB0aFxuICAgICAqL1xuICAgIGdldExhc3REZXB0aDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkZXB0aHMgPSBtYXAodGhpcy50cmVlSGFzaCwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGVwdGgobm9kZS5nZXRJZCgpKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KG51bGwsIGRlcHRocyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIEEgbm9kZSBpZCB0byBmaW5kXG4gICAgICogQHJldHVybnMgez9UcmVlTm9kZX0gTm9kZVxuICAgICAqL1xuICAgIGdldE5vZGU6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyZWVIYXNoW2lkXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGRlcHRoIGZyb20gbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIEEgbm9kZSBpZCB0byBmaW5kXG4gICAgICogQHJldHVybnMgez9udW1iZXJ9IERlcHRoXG4gICAgICovXG4gICAgZ2V0RGVwdGg6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKSxcbiAgICAgICAgICAgIGRlcHRoID0gMCxcbiAgICAgICAgICAgIHBhcmVudDtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XG4gICAgICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgICAgIGRlcHRoICs9IDE7XG4gICAgICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50LmdldFBhcmVudElkKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlcHRoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcGFyZW50IGlkIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMgez9zdHJpbmd9IFBhcmVudCBpZFxuICAgICAqL1xuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlLmdldFBhcmVudElkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIG5vZGUgd2l0aCBjaGlsZHJlbi5cbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWQgdG8gcmVtb3ZlXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24oaWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKSxcbiAgICAgICAgICAgIHBhcmVudDtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShub2RlLmdldFBhcmVudElkKCkpO1xuXG4gICAgICAgIGZvckVhY2gobm9kZS5nZXRDaGlsZElkcygpLCBmdW5jdGlvbihjaGlsZElkKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShjaGlsZElkLCB0cnVlKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkSWQoaWQpO1xuICAgICAgICBkZWxldGUgdGhpcy50cmVlSGFzaFtpZF07XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnQuZ2V0SWQoKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIG5vZGUocykuXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdy1kYXRhXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTmV3IGFkZGVkIG5vZGUgaWRzXG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShwYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZSxcbiAgICAgICAgICAgIGlkcztcblxuICAgICAgICBkYXRhID0gW10uY29uY2F0KGRhdGEpO1xuICAgICAgICBpZHMgPSB0aGlzLl9tYWtlVHJlZUhhc2goZGF0YSwgcGFyZW50KTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIHBhcmVudC5nZXRJZCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpZHM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkYXRhIHByb3BlcnRpZXMgb2YgYSBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcyAtIFByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKGlkLCBwcm9wcywgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xuXG4gICAgICAgIGlmICghbm9kZSB8fCAhcHJvcHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuc2V0RGF0YShwcm9wcyk7XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIG5vZGUgZGF0YVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0gbmFtZXMgLSBOYW1lcyBvZiBwcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqL1xuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihpZCwgbmFtZXMsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcblxuICAgICAgICBpZiAoIW5vZGUgfHwgIW5hbWVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHVpLnV0aWwuaXNBcnJheShuYW1lcykpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRGF0YS5hcHBseShub2RlLCBuYW1lcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZURhdGEobmFtZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTW92ZSBhIG5vZGUgdG8gbmV3IHBhcmVudCdzIGNoaWxkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqL1xuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCksXG4gICAgICAgICAgICBvcmlnaW5hbFBhcmVudCwgb3JpZ2luYWxQYXJlbnRJZCwgbmV3UGFyZW50O1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG5ld1BhcmVudCA9IHRoaXMuZ2V0Tm9kZShuZXdQYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZTtcbiAgICAgICAgbmV3UGFyZW50SWQgPSBuZXdQYXJlbnQuZ2V0SWQoKTtcbiAgICAgICAgb3JpZ2luYWxQYXJlbnRJZCA9IG5vZGUuZ2V0UGFyZW50SWQoKTtcbiAgICAgICAgb3JpZ2luYWxQYXJlbnQgPSB0aGlzLmdldE5vZGUob3JpZ2luYWxQYXJlbnRJZCk7XG5cbiAgICAgICAgaWYgKG5vZGVJZCA9PT0gbmV3UGFyZW50SWQgfHwgdGhpcy5jb250YWlucyhub2RlSWQsIG5ld1BhcmVudElkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG9yaWdpbmFsUGFyZW50LnJlbW92ZUNoaWxkSWQobm9kZUlkKTtcbiAgICAgICAgbm9kZS5zZXRQYXJlbnRJZChuZXdQYXJlbnRJZCk7XG4gICAgICAgIG5ld1BhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywgbm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBhIG5vZGUgaXMgYSBhbmNlc3RvciBvZiBhbm90aGVyIG5vZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGNvbnRhaW4gdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVkSWQgLSBJZCBvZiBhIG5vZGUgdGhhdCBtYXkgYmUgY29udGFpbmVkIGJ5IHRoZSBvdGhlciBub2RlXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgYSBub2RlIGNvbnRhaW5zIGFub3RoZXIgbm9kZVxuICAgICAqL1xuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihjb250YWluZXJJZCwgY29udGFpbmVkSWQpIHtcbiAgICAgICAgdmFyIHBhcmVudElkID0gdGhpcy5nZXRQYXJlbnRJZChjb250YWluZWRJZCksXG4gICAgICAgICAgICBpc0NvbnRhaW5lZCA9IGZhbHNlO1xuXG4gICAgICAgIHdoaWxlICghaXNDb250YWluZWQgJiYgcGFyZW50SWQpIHtcbiAgICAgICAgICAgIGlzQ29udGFpbmVkID0gKGNvbnRhaW5lcklkID09PSBwYXJlbnRJZCk7XG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRoaXMuZ2V0UGFyZW50SWQocGFyZW50SWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlzQ29udGFpbmVkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTb3J0IG5vZGVzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICAgIHRoaXMuZWFjaEFsbChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZ2V0Q2hpbGRyZW4obm9kZUlkKSxcbiAgICAgICAgICAgICAgICBjaGlsZElkcztcblxuICAgICAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbi5zb3J0KGNvbXBhcmF0b3IpO1xuXG4gICAgICAgICAgICAgICAgY2hpbGRJZHMgPSBtYXAoY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZC5nZXRJZCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG5vZGUucmVwbGFjZUNoaWxkSWRzKGNoaWxkSWRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIGRhdGEgKGFsbClcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/b2JqZWN0fSBOb2RlIGRhdGFcbiAgICAgKi9cbiAgICBnZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlLmdldEFsbERhdGEoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKi9cbiAgICBlYWNoQWxsOiBmdW5jdGlvbihpdGVyYXRlZSwgY29udGV4dCkge1xuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xuXG4gICAgICAgIGZvckVhY2godGhpcy50cmVlSGFzaCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpdGVyYXRlZS5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBkZXNjZW5kYW50cyBvZiBhIG5vZGUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKi9cbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpIHsgLy9kZXB0aC1maXJzdFxuICAgICAgICB2YXIgc3RhY2ssIG5vZGVJZCwgbm9kZTtcblxuICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKHBhcmVudElkKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2sgPSBub2RlLmdldENoaWxkSWRzKCk7XG5cbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgbm9kZUlkID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG4gICAgICAgICAgICBpdGVyYXRlZS5jYWxsKGNvbnRleHQsIG5vZGUsIG5vZGVJZCk7XG5cbiAgICAgICAgICAgIHN0YWNrID0gc3RhY2suY29uY2F0KG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWVNb2RlbCk7XG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVNb2RlbDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN0YXRlcyA9IHJlcXVpcmUoJy4vY29uc3RzL3N0YXRlcycpLm5vZGUsXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgbGFzdEluZGV4ID0gMCxcbiAgICBnZXROZXh0SW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGFzdEluZGV4O1xuICAgICAgICBsYXN0SW5kZXggKz0gMTtcblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfSxcbiAgICBSRVNFUlZFRF9QUk9QRVJUSUVTID0ge1xuICAgICAgICBpZDogJycsXG4gICAgICAgIHN0YXRlOiAnc2V0U3RhdGUnLFxuICAgICAgICBjaGlsZHJlbjogJydcbiAgICB9LFxuICAgIGluQXJyYXkgPSB0dWkudXRpbC5pbkFycmF5O1xuXG4vKipcbiAqIFRyZWVOb2RlXG4gKiBAQ29uc3RydWN0b3IgVHJlZU5vZGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBub2RlRGF0YSAtIE5vZGUgZGF0YVxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBQYXJlbnQgbm9kZSBpZFxuICovXG52YXIgVHJlZU5vZGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVOb2RlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgcHJlZml4IG9mIGlkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgaWRcbiAgICAgICAgICovXG4gICAgICAgIHNldElkUHJlZml4OiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgICAgIHRoaXMuaWRQcmVmaXggPSBwcmVmaXggfHwgdGhpcy5pZFByZWZpeDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJlZml4IG9mIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZFByZWZpeDogJydcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faWQgPSB0aGlzLmNvbnN0cnVjdG9yLmlkUHJlZml4ICsgZ2V0TmV4dEluZGV4KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhcmVudCBub2RlIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2NoaWxkSWRzID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIHN0YXRlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG5cbiAgICAgICAgdGhpcy5zZXREYXRhKG5vZGVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJlc2VydmVkIHByb3BlcnRpZXMgZnJvbSBkYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBOb2RlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBOb2RlIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSZXNlcnZlZFByb3BlcnRpZXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaE93blByb3BlcnRpZXMoUkVTRVJWRURfUFJPUEVSVElFUywgZnVuY3Rpb24oc2V0dGVyLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW25hbWVdO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tzZXR0ZXJdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqL1xuICAgIHRvZ2dsZVN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlID09PSBzdGF0ZXMuQ0xPU0VEKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5PUEVORUQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIFN0YXRlIG9mIG5vZGUgKCdjbG9zZWQnLCAnb3BlbmVkJylcbiAgICAgKi9cbiAgICBzZXRTdGF0ZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgc3RhdGUgPSBTdHJpbmcoc3RhdGUpO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlc1tzdGF0ZS50b1VwcGVyQ2FzZSgpXSB8fCB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHN0YXRlICgnb3BlbmVkJyBvciAnY2xvc2VkJylcbiAgICAgKi9cbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHBhcmVudCBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKi9cbiAgICBzZXRQYXJlbnRJZDogZnVuY3Rpb24ocGFyZW50SWQpIHtcbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVwbGFjZSBjaGlsZElkc1xuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGNoaWxkSWRzIC0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIHJlcGxhY2VDaGlsZElkczogZnVuY3Rpb24oY2hpbGRJZHMpIHtcbiAgICAgICAgdGhpcy5fY2hpbGRJZHMgPSBjaGlsZElkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGlkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge0FycmF5LjxudW1iZXI+fSBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICovXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRJZHMuc2xpY2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIGFkZENoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuX2NoaWxkSWRzO1xuXG4gICAgICAgIGlmICh0dWkudXRpbC5pbkFycmF5KGNoaWxkSWRzLCBpZCkgPT09IC0xKSB7XG4gICAgICAgICAgICBjaGlsZElkcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICovXG4gICAgcmVtb3ZlQ2hpbGRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVJdGVtRnJvbUFycmF5KGlkLCB0aGlzLl9jaGlsZElkcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gUHJvcGVydHkgbmFtZSBvZiBkYXRhXG4gICAgICogQHJldHVybnMgeyp9IERhdGFcbiAgICAgKi9cbiAgICBnZXREYXRhOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge09iamVjdH0gRGF0YVxuICAgICAqL1xuICAgIGdldEFsbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuZXh0ZW5kKHt9LCB0aGlzLl9kYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBEYXRhIGZvciBhZGRpbmdcbiAgICAgKi9cbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGRhdGEgPSB0aGlzLl9zZXRSZXNlcnZlZFByb3BlcnRpZXMoZGF0YSk7XG4gICAgICAgIHR1aS51dGlsLmV4dGVuZCh0aGlzLl9kYXRhLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHsuLi5zdHJpbmd9IG5hbWVzIC0gTmFtZXMgb2YgZGF0YVxuICAgICAqL1xuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoQXJyYXkoYXJndW1lbnRzLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZGF0YVtuYW1lXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoaXMgbm9kZSBoYXMgYSBwcm92aWRlZCBjaGlsZCBpZC5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqL1xuICAgIGhhc0NoaWxkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gaW5BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpICE9PSAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBub2RlIGlzIGxlYWYuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIGxlYWYgb3Igbm90LlxuICAgICAqL1xuICAgIGlzTGVhZjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5sZW5ndGggPT09IDA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyByb290LlxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gTm9kZSBpcyByb290IG9yIG5vdC5cbiAgICAgKi9cbiAgICBpc1Jvb3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuaXNGYWxzeSh0aGlzLl9wYXJlbnRJZCk7XG4gICAgfVxufSk7XG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVOb2RlO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEhlbHBlciBvYmplY3QgdG8gbWFrZSBlYXN5IHRyZWUgZWxlbWVudHNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGlzVW5kZWZpbmVkID0gdHVpLnV0aWwuaXNVbmRlZmluZWQsXG4gICAgcGljayA9IHR1aS51dGlsLnBpY2ssXG4gICAgdGVtcGxhdGVNYXNrUmUgPSAvXFx7XFx7KC4rPyl9fS9naSxcbiAgICBpc1ZhbGlkRG90Tm90YXRpb25SZSA9IC9eXFx3Kyg/OlxcLlxcdyspKiQvLFxuICAgIGlzVmFsaWREb3ROb3RhdGlvbiA9IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICByZXR1cm4gaXNWYWxpZERvdE5vdGF0aW9uUmUudGVzdChzdHIpO1xuICAgIH0sXG4gICAgaXNBcnJheSA9IHR1aS51dGlsLmlzQXJyYXlTYWZlO1xuXG52YXIgdXRpbCA9IHtcbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlyc3Qgc3BlY2lmaWVkIGl0ZW0gZnJvbSBhcnJheSwgaWYgaXQgZXhpc3RzXG4gICAgICogQHBhcmFtIHsqfSBpdGVtIEl0ZW0gdG8gbG9vayBmb3JcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIgQXJyYXkgdG8gcXVlcnlcbiAgICAgKi9cbiAgICByZW1vdmVJdGVtRnJvbUFycmF5OiBmdW5jdGlvbihpdGVtLCBhcnIpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gYXJyLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGlmIChpdGVtID09PSBhcnJbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmRleCAtPSAxO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjbGFzc25hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIC0gQ2xhc3NuYW1lXG4gICAgICovXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgICAgICB9IGVsc2UgaWYgKCF1dGlsLmhhc0NsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lICs9ICcgJyArIGNsYXNzTmFtZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgY2xhc3NuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSAtIENsYXNzbmFtZVxuICAgICAqL1xuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIG9yaWdpbmFsQ2xhc3NOYW1lID0gdXRpbC5nZXRDbGFzcyhlbGVtZW50KSxcbiAgICAgICAgICAgIGFyciwgaW5kZXg7XG5cbiAgICAgICAgaWYgKCFvcmlnaW5hbENsYXNzTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyID0gb3JpZ2luYWxDbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICAgICAgaW5kZXggPSB0dWkudXRpbC5pbkFycmF5KGNsYXNzTmFtZSwgYXJyKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGFyci5qb2luKCcgJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgdG8gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIEEgbmFtZSBvZiBldmVudFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhZGRcbiAgICAgKi9cbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgZnJvbSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmRldGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBFdmVudCB0YXJnZXRcbiAgICAgKi9cbiAgICBnZXRUYXJnZXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldDtcbiAgICAgICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgICAgICB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEhUTUxFbGVtZW50XG4gICAgICogQHJldHVybnMge3N0cmluZ30gQ2xhc3MgbmFtZVxuICAgICAqL1xuICAgIGdldENsYXNzOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50ICYmIGVsZW1lbnQuZ2V0QXR0cmlidXRlICYmXG4gICAgICAgICAgICAoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgfHwgZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzTmFtZScpIHx8ICcnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgdGhlIGVsZW1lbnQgaGFzIHNwZWNpZmljIGNsYXNzIG9yIG5vdFxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgQSBuYW1lIG9mIGNsYXNzIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZWxlbWVudCBoYXMgdGhlIGNsYXNzXG4gICAgICovXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpO1xuXG4gICAgICAgIHJldHVybiBlbENsYXNzTmFtZS5pbmRleE9mKGNsYXNzTmFtZSkgPiAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBlbGVtZW50IGJ5IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgQSBuYW1lIG9mIGNsYXNzXG4gICAgICogQHJldHVybnMge0FycmF5LjxIVE1MRWxlbWVudD59IEVsZW1lbnRzXG4gICAgICovXG4gICAgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZTogZnVuY3Rpb24odGFyZ2V0LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGFsbCwgZmlsdGVyZWQ7XG5cbiAgICAgICAgaWYgKHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZCA9IHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbGwgPSB0dWkudXRpbC50b0FycmF5KHRhcmdldC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpKTtcbiAgICAgICAgICAgIGZpbHRlcmVkID0gdHVpLnV0aWwuZmlsdGVyKGFsbCwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZSB8fCAnJztcblxuICAgICAgICAgICAgICAgIHJldHVybiAoY2xhc3NOYW1lcy5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB3aGV0aGVyIHRoZSBjbGljayBldmVudCBieSByaWdodCBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSBjbGljayBldmVudCBieSByaWdodCBidXR0b25cbiAgICAgKi9cbiAgICBpc1JpZ2h0QnV0dG9uOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICByZXR1cm4gdXRpbC5fZ2V0QnV0dG9uKGV2ZW50KSA9PT0gMjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgcHJvcGVydHkgZXhpc3Qgb3Igbm90XG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJvcHMgQSBwcm9wZXJ0eVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8Ym9vbGVhbn0gUHJvcGVydHkgbmFtZSBvciBmYWxzZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIHVzZXJTZWxlY3RQcm9wZXJ0eSA9IHV0aWwudGVzdFByb3AoW1xuICAgICAqICAgICAndXNlclNlbGVjdCcsXG4gICAgICogICAgICdXZWJraXRVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ09Vc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ01velVzZXJTZWxlY3QnLFxuICAgICAqICAgICAnbXNVc2VyU2VsZWN0J1xuICAgICAqIF0pO1xuICAgICAqL1xuICAgIHRlc3RQcm9wOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUsXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBmYWxzZTtcblxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBjb25zaXN0ZW50LXJldHVybiAqL1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHByb3BzLCBmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgICAgICBpZiAocHJvcCBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3A7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGNvbnNpc3RlbnQtcmV0dXJuICovXG5cbiAgICAgICAgcmV0dXJuIHByb3BlcnR5TmFtZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCBkZWZhdWx0IGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBodG1sIGZyb20gdGVtcGxhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc291cmNlIC0gVGVtcGxhdGUgaHRtbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRlbXBsYXRlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBodG1sXG4gICAgICovXG4gICAgcmVuZGVyVGVtcGxhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgcHJvcHMpIHtcbiAgICAgICAgZnVuY3Rpb24gcGlja1ZhbHVlKG5hbWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gcGljay5hcHBseShudWxsLCBbcHJvcHNdLmNvbmNhdChuYW1lcykpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdXJjZS5yZXBsYWNlKHRlbXBsYXRlTWFza1JlLCBmdW5jdGlvbihtYXRjaCwgbmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlO1xuXG4gICAgICAgICAgICBpZiAoaXNWYWxpZERvdE5vdGF0aW9uKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwaWNrVmFsdWUobmFtZS5zcGxpdCgnLicpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luKCcgJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6YXRpb24gZm9yIGV2ZW50IGJ1dHRvbiBwcm9wZXJ0eVxuICAgICAqIDA6IEZpcnN0IG1vdXNlIGJ1dHRvbiwgMjogU2Vjb25kIG1vdXNlIGJ1dHRvbiwgMTogQ2VudGVyIGJ1dHRvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybnMgez9udW1iZXJ9IGJ1dHRvbiB0eXBlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0QnV0dG9uOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgYnV0dG9uLFxuICAgICAgICAgICAgcHJpbWFyeSA9ICcwLDEsMyw1LDcnLFxuICAgICAgICAgICAgc2Vjb25kYXJ5ID0gJzIsNicsXG4gICAgICAgICAgICB3aGVlbCA9ICc0JztcblxuICAgICAgICBpZiAoZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uaGFzRmVhdHVyZSgnTW91c2VFdmVudHMnLCAnMi4wJykpIHtcbiAgICAgICAgICAgIHJldHVybiBldmVudC5idXR0b247XG4gICAgICAgIH1cblxuICAgICAgICBidXR0b24gPSBTdHJpbmcoZXZlbnQuYnV0dG9uKTtcbiAgICAgICAgaWYgKHByaW1hcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9IGVsc2UgaWYgKHNlY29uZGFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgIH0gZWxzZSBpZiAod2hlZWwuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIl19
