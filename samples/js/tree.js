(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Tree', require('./src/js/tree'));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMvZGVmYXVsdE9wdGlvbi5qcyIsInNyYy9qcy9jb25zdHMvbWVzc2FnZXMuanMiLCJzcmMvanMvY29uc3RzL291dGVyVGVtcGxhdGUuanMiLCJzcmMvanMvY29uc3RzL3N0YXRlcy5qcyIsInNyYy9qcy9mZWF0dXJlcy9jaGVja2JveC5qcyIsInNyYy9qcy9mZWF0dXJlcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvZWRpdGFibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy90cmVlLmpzIiwic3JjL2pzL3RyZWVNb2RlbC5qcyIsInNyYy9qcy90cmVlTm9kZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdtQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQuVHJlZScsIHJlcXVpcmUoJy4vc3JjL2pzL3RyZWUnKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWFrZSBjbGFzcyBuYW1lc1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIFByZWZpeCBvZiBjbGFzcyBuYW1lXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBrZXlzIC0gS2V5cyBvZiBjbGFzcyBuYW1lc1xuICogQHJldHVybnMge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBDbGFzcyBuYW1lcyBtYXBcbiAqL1xuZnVuY3Rpb24gbWFrZUNsYXNzTmFtZXMocHJlZml4LCBrZXlzKSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIHR1aS51dGlsLmZvckVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIG9ialtrZXkgKyAnQ2xhc3MnXSA9IHByZWZpeCArIGtleTtcbiAgICB9KTtcblxuICAgIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogQSBkZWZhdWx0IHZhbHVlcyBmb3IgdHJlZVxuICogQGNvbnN0XG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVEZWZhdWx0U3RhdGUgLSBOb2RlIHN0YXRlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbm9kZUlkUHJlZml4IC0gTm9kZSBpZCBwcmVmaXhcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBzdGF0ZUxhYmVsIC0gU3RhdGUgbGFiZWwgaW4gbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0ZUxhYmVsLm9wZW5lZCAtICctJ1xuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0ZUxhYmVsLmNsb3NlZCAtICcrJ1xuICogQHByb3BlcnR5IHtvYmplY3R9IHRlbXBsYXRlIC0gVGVtcGxhdGUgaHRtbCBmb3IgdGhlIG5vZGVzLlxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZW1wbGF0ZS5pbnRlcm5hbE5vZGUgLSBUZW1wbGF0ZSBodG1sIGZvciBpbnRlcm5hbCBub2RlLlxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZW1wbGF0ZS5sZWFmTm9kZSAtIFRlbXBsYXRlIGh0bWwgZm9yIGxlYWYgbm9kZS5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBjbGFzc05hbWVzIC0gQ2xhc3MgbmFtZXMgb2YgZWxlbWVudHMgaW4gdHJlZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBvcGVuZWRDbGFzcyAtIENsYXNzIG5hbWUgZm9yIG9wZW5lZCBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IGNsb3NlZENsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgY2xvc2VkIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gbm9kZUNsYXNzIC0gQ2xhc3MgbmFtZSBmb3Igbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBsZWFmQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciBsZWFmIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3VidHJlZUNsYXNzICAtIENsYXNzIG5hbWUgZm9yIHN1YnRyZWUgaW4gaW50ZXJuYWwgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0b2dnbGVCdG5DbGFzcyAtIENsYXNzIG5hbWUgZm9yIHRvZ2dsZSBidXR0b24gaW4gaW50ZXJuYWwgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZXh0Q2xhc3MgLSBDbGFzcyBuYW1lIGZvciB0ZXh0IGVsZW1lbnQgaW4gYSBub2RlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdjbG9zZWQnLFxuICAgIHN0YXRlTGFiZWxzOiB7XG4gICAgICAgIG9wZW5lZDogJy0nLFxuICAgICAgICBjbG9zZWQ6ICcrJ1xuICAgIH0sXG4gICAgbm9kZUlkUHJlZml4OiAndHVpLXRyZWUtbm9kZS0nLFxuICAgIGNsYXNzTmFtZXM6IG1ha2VDbGFzc05hbWVzKCd0dWktdHJlZS0nLCBbXG4gICAgICAgICdub2RlJyxcbiAgICAgICAgJ2xlYWYnLFxuICAgICAgICAnb3BlbmVkJyxcbiAgICAgICAgJ2Nsb3NlZCcsXG4gICAgICAgICdzdWJ0cmVlJyxcbiAgICAgICAgJ3RvZ2dsZUJ0bicsXG4gICAgICAgICd0ZXh0J1xuICAgIF0pLFxuICAgIHRlbXBsYXRlOiB7XG4gICAgICAgIGludGVybmFsTm9kZTpcbiAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7c3RhdGVMYWJlbH19PC9idXR0b24+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+JyxcbiAgICAgICAgbGVhZk5vZGU6XG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+J1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWVzc2FnZXMgZm9yIHRyZWVcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgSU5WQUxJRF9ST09UX0VMRU1FTlQ6ICdcInR1aS1jb21wb25lbnQtdHJlZVwiOiBSb290IGVsZW1lbnQgaXMgaW52YWxpZC4nLFxuICAgIElOVkFMSURfQVBJOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogSU5WQUxJRF9BUEknLFxuICAgIElOVkFMSURfQVBJX1NFTEVDVEFCTEU6ICdcInR1aS1jb21wb25lbnQtdHJlZVwiOiBUaGUgZmVhdHVyZS1cIlNlbGVjdGFibGVcIiBpcyBub3QgZW5hYmxlZC4nLFxuICAgIElOVkFMSURfQVBJX0VESVRBQkxFOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJFZGl0YWJsZVwiIGlzIG5vdCBlbmFibGVkLicsXG4gICAgSU5WQUxJRF9BUElfRFJBR0dBQkxFOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJEcmFnZ2FibGVcIiBpcyBub3QgZW5hYmxlZC4nLFxuICAgIElOVkFMSURfQVBJX0NIRUNLQk9YOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJDaGVja2JveFwiIGlzIG5vdCBlbmFibGVkLidcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogT3V0ZXIgdGVtcGxhdGVcbiAqIEB0eXBlIHt7aW50ZXJuYWxOb2RlOiBzdHJpbmcsIGxlYWZOb2RlOiBzdHJpbmd9fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBJTlRFUk5BTF9OT0RFOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ7e25vZGVDbGFzc319IHt7c3RhdGVDbGFzc319XCI+JyArXG4gICAgICAgICAgICAne3tpbm5lclRlbXBsYXRlfX0nICtcbiAgICAgICAgJzwvbGk+JyxcbiAgICBMRUFGX05PREU6XG4gICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInt7bm9kZUNsYXNzfX0ge3tsZWFmQ2xhc3N9fVwiPicgK1xuICAgICAgICAgICAgJ3t7aW5uZXJUZW1wbGF0ZX19JyArXG4gICAgICAgICc8L2xpPidcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogU3RhdGVzIGluIHRyZWVcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogU3RhdGVzIG9mIG5vZGVcbiAgICAgKiBAdHlwZSB7e09QRU5FRDogc3RyaW5nLCBDTE9TRUQ6IHN0cmluZ319XG4gICAgICovXG4gICAgbm9kZToge1xuICAgICAgICBPUEVORUQ6ICdvcGVuZWQnLFxuICAgICAgICBDTE9TRUQ6ICdjbG9zZWQnXG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG52YXIgQVBJX0xJU1QgPSBbXG4gICAgJ2NoZWNrJyxcbiAgICAndW5jaGVjaycsXG4gICAgJ3RvZ2dsZUNoZWNrJyxcbiAgICAnaXNDaGVja2VkJyxcbiAgICAnaXNJbmRldGVybWluYXRlJyxcbiAgICAnaXNVbmNoZWNrZWQnLFxuICAgICdnZXRDaGVja2VkTGlzdCcsXG4gICAgJ2dldFRvcENoZWNrZWRMaXN0JyxcbiAgICAnZ2V0Qm90dG9tQ2hlY2tlZExpc3QnXG5dO1xuXG4vKipcbiAqIENoZWNrYm94IHRyaS1zdGF0ZXNcbiAqL1xudmFyIFNUQVRFX0NIRUNLRUQgPSAxLFxuICAgIFNUQVRFX1VOQ0hFQ0tFRCA9IDIsXG4gICAgU1RBVEVfSU5ERVRFUk1JTkFURSA9IDMsXG4gICAgREFUQV9LRVlfRk9SX0NIRUNLQk9YX1NUQVRFID0gJ19fQ2hlY2tCb3hTdGF0ZV9fJyxcbiAgICBEQVRBID0ge307XG5cbnZhciBmaWx0ZXIgPSB0dWkudXRpbC5maWx0ZXIsXG4gICAgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2g7XG4vKipcbiAqIFNldCB0aGUgY2hlY2tib3gtYXBpXG4gKiBAY2xhc3MgQ2hlY2tib3hcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbiAtIE9wdGlvblxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb24uY2hlY2tib3hDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgY2hlY2tib3ggZWxlbWVudFxuICovXG52YXIgQ2hlY2tib3ggPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIENoZWNrYm94LnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBDaGVja2JveFxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFQSSBsaXN0IG9mIGNoZWNrYm94XG4gICAgICAgICAqL1xuICAgICAgICBnZXRBUElMaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBBUElfTElTVC5zbGljZSgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb24pIHsvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb24gPSB0dWkudXRpbC5leHRlbmQoe30sIG9wdGlvbik7XG5cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5jaGVja2JveENsYXNzTmFtZSA9IG9wdGlvbi5jaGVja2JveENsYXNzTmFtZTtcbiAgICAgICAgdGhpcy5jaGVja2VkTGlzdCA9IFtdO1xuICAgICAgICB0aGlzLnJvb3RDaGVja2JveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0lOUFVUJyk7XG4gICAgICAgIHRoaXMucm9vdENoZWNrYm94LnR5cGUgPSAnY2hlY2tib3gnO1xuXG4gICAgICAgIHRoaXMuX3NldEFQSXMoKTtcbiAgICAgICAgdGhpcy5fYXR0YWNoRXZlbnRzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdHJlZS5vZmYodGhpcyk7XG4gICAgICAgIGZvckVhY2goQVBJX0xJU1QsIGZ1bmN0aW9uKGFwaU5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0cmVlW2FwaU5hbWVdO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGFwaXMgb2YgY2hlY2tib3ggdHJlZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEFQSXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGJpbmQgPSB0dWkudXRpbC5iaW5kO1xuXG4gICAgICAgIGZvckVhY2goQVBJX0xJU1QsIGZ1bmN0aW9uKGFwaU5hbWUpIHtcbiAgICAgICAgICAgIHRyZWVbYXBpTmFtZV0gPSBiaW5kKHRoaXNbYXBpTmFtZV0sIHRoaXMpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIGV2ZW50IHRvIHRyZWUgaW5zdGFuY2VcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hdHRhY2hFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyZWUub24oe1xuICAgICAgICAgICAgc2luZ2xlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgICAgICAgICAgbm9kZUlkLCBzdGF0ZTtcblxuICAgICAgICAgICAgICAgIGlmICh1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy5jaGVja2JveENsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZUlkID0gdGhpcy50cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gdGhpcy5fZ2V0U3RhdGVGcm9tQ2hlY2tib3godGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY29udGludWVQb3N0cHJvY2Vzc2luZyhub2RlSWQsIHN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWZ0ZXJEcmF3OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX3JlZmxlY3RDaGFuZ2VzKG5vZGVJZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vQHRvZG8gLSBPcHRpbWl6YXRpb25cbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0Q2hhbmdlcyhkYXRhLm9yaWdpbmFsUGFyZW50SWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlZmxlY3RDaGFuZ2VzKGRhdGEubmV3UGFyZW50SWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVmbGVjdCB0aGUgY2hhbmdlcyBvbiBub2RlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVmbGVjdENoYW5nZXM6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB0aGlzLnRyZWUuZWFjaChmdW5jdGlvbihkZXNjZW5kYW50LCBkZXNjZW5kYW50SWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKGRlc2NlbmRhbnRJZCwgdGhpcy5fZ2V0U3RhdGUoZGVzY2VuZGFudElkKSwgdHJ1ZSk7XG4gICAgICAgIH0sIG5vZGVJZCwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2p1ZGdlT3duU3RhdGUobm9kZUlkKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQWxsQW5jZXN0b3JzU3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNoZWNrYm94IGF0dHJpYnV0ZXMgKGNoZWNrZWQsIGluZGV0ZXJtaW5hdGUpXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBjaGVja2JveCAtIENoZWNrYm94IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzQ2hlY2tlZCAtIFwiY2hlY2tlZFwiXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0luZGV0ZXJtaW5hdGUgLSBcImluZGV0ZXJtaW5hdGVcIlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldENoZWNrYm94QXR0cjogZnVuY3Rpb24oY2hlY2tib3gsIGlzQ2hlY2tlZCwgaXNJbmRldGVybWluYXRlKSB7XG4gICAgICAgIGNoZWNrYm94LmluZGV0ZXJtaW5hdGUgPSBpc0luZGV0ZXJtaW5hdGU7XG4gICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSBpc0NoZWNrZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2luZyBzdGF0ZSBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhdGUgLSBTdGF0ZSBmb3IgY2hlY2tib3hcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdG9wUHJvcGFnYXRpb25dIC0gSWYgdHJ1ZSwgc3RvcCBjaGFuZ2luZyBzdGF0ZSBwcm9wYWdhdGlvblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFN0YXRlOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlLCBzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgdmFyIGNoZWNrYm94ID0gdGhpcy5fZ2V0Q2hlY2tib3hFbGVtZW50KG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFjaGVja2JveCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgICAgICAgY2FzZSBTVEFURV9DSEVDS0VEOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldENoZWNrYm94QXR0cihjaGVja2JveCwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTVEFURV9VTkNIRUNLRUQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0Q2hlY2tib3hBdHRyKGNoZWNrYm94LCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTVEFURV9JTkRFVEVSTUlOQVRFOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldENoZWNrYm94QXR0cihjaGVja2JveCwgZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDogLy8gbm8gbW9yZSBwcm9jZXNzIGlmIHRoZSBzdGF0ZSBpcyBpbnZhbGlkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29udGludWVQb3N0cHJvY2Vzc2luZyhub2RlSWQsIHN0YXRlLCBzdG9wUHJvcGFnYXRpb24pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tpbmcgc3RhdGUgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge251bWJlcn0gQ2hlY2tpbmcgc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRTdGF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgc3RhdGUgPSB0cmVlLmdldE5vZGVEYXRhKG5vZGVJZClbREFUQV9LRVlfRk9SX0NIRUNLQk9YX1NUQVRFXSxcbiAgICAgICAgICAgIGNoZWNrYm94O1xuXG4gICAgICAgIGlmICghc3RhdGUpIHtcbiAgICAgICAgICAgIGNoZWNrYm94ID0gdGhpcy5fZ2V0Q2hlY2tib3hFbGVtZW50KG5vZGVJZCk7XG4gICAgICAgICAgICBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlRnJvbUNoZWNrYm94KGNoZWNrYm94KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNraW5nIHN0YXRlIG9mIG5vZGUgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBjaGVja2JveCAtIENoZWNrYm94IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7P251bWJlcn0gQ2hlY2tpbmcgc3RhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3RhdGVGcm9tQ2hlY2tib3g6IGZ1bmN0aW9uKGNoZWNrYm94KSB7XG4gICAgICAgIHZhciBzdGF0ZTtcblxuICAgICAgICBpZiAoIWNoZWNrYm94KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGVja2JveC5jaGVja2VkKSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFX0NIRUNLRUQ7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hlY2tib3guaW5kZXRlcm1pbmF0ZSkge1xuICAgICAgICAgICAgc3RhdGUgPSBTVEFURV9JTkRFVEVSTUlOQVRFO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdGUgPSBTVEFURV9VTkNIRUNLRUQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvbnRpbnVlIHBvc3QtcHJvY2Vzc2luZyBmcm9tIGNoYW5naW5nOmNoZWNrYm94LXN0YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhdGUgLSBDaGVja2JveCBzdGF0ZVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0b3BQcm9wYWdhdGlvbl0gLSBJZiB0cnVlLCBzdG9wIHVwZGF0ZS1wcm9wYWdhdGlvblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NvbnRpbnVlUG9zdHByb2Nlc3Npbmc6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUsIHN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5jaGVja2VkTGlzdCxcbiAgICAgICAgICAgIGV2ZW50TmFtZTtcblxuICAgICAgICAvKiBQcmV2ZW50IGR1cGxpY2F0ZWQgbm9kZSBpZCAqL1xuICAgICAgICB1dGlsLnJlbW92ZUl0ZW1Gcm9tQXJyYXkobm9kZUlkLCBjaGVja2VkTGlzdCk7XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBTVEFURV9DSEVDS0VEKSB7XG4gICAgICAgICAgICBjaGVja2VkTGlzdC5wdXNoKG5vZGVJZCk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBhcGlcbiAgICAgICAgICAgICAqIEBldmVudCBUcmVlI2NoZWNrXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gQ2hlY2tlZCBub2RlIGlkXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdHJlZS5vbignY2hlY2snLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZygnY2hlY2tlZDogJyArIG5vZGVJZCk7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZXZlbnROYW1lID0gJ2NoZWNrJztcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gU1RBVEVfVU5DSEVDS0VEKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBhcGlcbiAgICAgICAgICAgICAqIEBldmVudCBUcmVlI3VuY2hlY2tcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBVbmNoZWNrZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHRyZWUub24oJ3VuY2hlY2snLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZygndW5jaGVja2VkOiAnICsgbm9kZUlkKTtcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBldmVudE5hbWUgPSAndW5jaGVjayc7XG4gICAgICAgIH1cbiAgICAgICAgREFUQVtEQVRBX0tFWV9GT1JfQ0hFQ0tCT1hfU1RBVEVdID0gc3RhdGU7XG4gICAgICAgIHRyZWUuc2V0Tm9kZURhdGEobm9kZUlkLCBEQVRBLCB0cnVlKTtcblxuICAgICAgICBpZiAoIXN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fcHJvcGFnYXRlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgICAgICB0cmVlLmZpcmUoZXZlbnROYW1lLCBub2RlSWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByb3BhZ2F0ZSBhIG5vZGUgc3RhdGUgdG8gZGVzY2VuZGFudHMgYW5kIGFuY2VzdG9ycyBmb3IgdXBkYXRpbmcgdGhlaXIgc3RhdGVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhdGUgLSBDaGVja2JveCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Byb3BhZ2F0ZVN0YXRlOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlKSB7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gU1RBVEVfSU5ERVRFUk1JTkFURSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlQWxsRGVzY2VuZGFudHNTdGF0ZShub2RlSWQsIHN0YXRlKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQWxsQW5jZXN0b3JzU3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGFsbCBkZXNjZW5kYW50cyBzdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gU3RhdGUgZm9yIGNoZWNrYm94XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlQWxsRGVzY2VuZGFudHNTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSkge1xuICAgICAgICB0aGlzLnRyZWUuZWFjaChmdW5jdGlvbihkZXNjZW5kYW50LCBkZXNjZW5kYW50SWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKGRlc2NlbmRhbnRJZCwgc3RhdGUsIHRydWUpO1xuICAgICAgICB9LCBub2RlSWQsIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgYWxsIGFuY2VzdG9ycyBzdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlQWxsQW5jZXN0b3JzU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHBhcmVudElkID0gdHJlZS5nZXRQYXJlbnRJZChub2RlSWQpO1xuXG4gICAgICAgIHdoaWxlIChwYXJlbnRJZCkge1xuICAgICAgICAgICAgdGhpcy5fanVkZ2VPd25TdGF0ZShwYXJlbnRJZCk7XG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRyZWUuZ2V0UGFyZW50SWQocGFyZW50SWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEp1ZGdlIG93biBzdGF0ZSBmcm9tIGNoaWxkIG5vZGUgaXMgY2hhbmdlZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfanVkZ2VPd25TdGF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hpbGRJZHMgPSB0cmVlLmdldENoaWxkSWRzKG5vZGVJZCksXG4gICAgICAgICAgICBjaGVja2VkID0gdHJ1ZSxcbiAgICAgICAgICAgIHVuY2hlY2tlZCA9IHRydWU7XG5cbiAgICAgICAgaWYgKCFjaGlsZElkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNoZWNrZWQgPSB0aGlzLmlzQ2hlY2tlZChub2RlSWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yRWFjaChjaGlsZElkcywgZnVuY3Rpb24oY2hpbGRJZCkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlKGNoaWxkSWQpO1xuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAoY2hlY2tlZCAmJiBzdGF0ZSA9PT0gU1RBVEVfQ0hFQ0tFRCk7XG4gICAgICAgICAgICAgICAgdW5jaGVja2VkID0gKHVuY2hlY2tlZCAmJiBzdGF0ZSA9PT0gU1RBVEVfVU5DSEVDS0VEKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBjaGVja2VkIHx8IHVuY2hlY2tlZDtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoZWNrZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKG5vZGVJZCwgU1RBVEVfQ0hFQ0tFRCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodW5jaGVja2VkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX1VOQ0hFQ0tFRCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX0lOREVURVJNSU5BVEUsIHRydWUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2JveCBlbGVtZW50IG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/SFRNTEVsZW1lbnR9IENoZWNrYm94IGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRDaGVja2JveEVsZW1lbnQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGVsLCBub2RlRWw7XG5cbiAgICAgICAgaWYgKG5vZGVJZCA9PT0gdHJlZS5nZXRSb290Tm9kZUlkKCkpIHtcbiAgICAgICAgICAgIGVsID0gdGhpcy5yb290Q2hlY2tib3g7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlRWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgICAgICAgICAgIG5vZGVFbCxcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrYm94Q2xhc3NOYW1lXG4gICAgICAgICAgICApWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS5jaGVjayhub2RlSWQpO1xuICAgICAqL1xuICAgIGNoZWNrOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQ2hlY2tlZChub2RlSWQpKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX0NIRUNLRUQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVuY2hlY2sgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUudW5jaGVjayhub2RlSWQpO1xuICAgICAqL1xuICAgIHVuY2hlY2s6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNVbmNoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9VTkNIRUNLRUQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBub2RlIGNoZWNraW5nXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS50b2dnbGVDaGVjayhub2RlSWQpO1xuICAgICAqL1xuICAgIHRvZ2dsZUNoZWNrOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQ2hlY2tlZChub2RlSWQpKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrKG5vZGVJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnVuY2hlY2sobm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBub2RlIGlzIGNoZWNrZWRcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiBub2RlIGlzIGluZGV0ZXJtaW5hdGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLmNoZWNrKG5vZGVJZCk7XG4gICAgICogY29uc29sZS5sb2codHJlZS5pc0NoZWNrZWQobm9kZUlkKSk7IC8vIHRydWVcbiAgICAgKi9cbiAgICBpc0NoZWNrZWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gU1RBVEVfQ0hFQ0tFRCA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBpbmRldGVybWluYXRlXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyBpbmRldGVybWluYXRlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS5jaGVjayhub2RlSWQpO1xuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuaXNJbmRldGVybWluYXRlKG5vZGVJZCkpOyAvLyBmYWxzZVxuICAgICAqL1xuICAgIGlzSW5kZXRlcm1pbmF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiBTVEFURV9JTkRFVEVSTUlOQVRFID09PSB0aGlzLl9nZXRTdGF0ZShub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBub2RlIGlzIHVuY2hlY2tlZCBvciBub3RcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiBub2RlIGlzIHVuY2hlY2tlZC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLnVuY2hlY2sobm9kZUlkKTtcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmlzVW5jaGVja2VkKG5vZGVJZCkpOyAvLyB0cnVlXG4gICAgICovXG4gICAgaXNVbmNoZWNrZWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gU1RBVEVfVU5DSEVDS0VEID09PSB0aGlzLl9nZXRTdGF0ZShub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tlZCBsaXN0XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gTm9kZSBpZCAoZGVmYXVsdDogcm9vdE5vZGUgaWQpXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBDaGVja2VkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvL1xuICAgICAqIC8vIG5vZGUxKHYpXG4gICAgICogLy8gICBub2RlMih2KVxuICAgICAqIC8vICAgbm9kZTModilcbiAgICAgKiAvLyBub2RlNFxuICAgICAqIC8vICAgbm9kZTUodilcbiAgICAgKiAvLyBub2RlNlxuICAgICAqIC8vICAgbm9kZTcodilcbiAgICAgKiAvLyAgICAgbm9kZTgodilcbiAgICAgKiAvLyAgIG5vZGU5XG4gICAgICpcbiAgICAgKiB2YXIgYWxsQ2hlY2tlZExpc3QgPSB0cmVlLmdldENoZWNrZWRMaXN0KCk7IC8vIFsnbm9kZTEnLCAnbm9kZTInLCAnbm9kZTMnICwuLi4uXVxuICAgICAqIHZhciBkZXNjZW5kYW50c0NoZWNrZWRMaXN0ID0gdHJlZS5nZXRDaGVla2VkTGlzdCgnbm9kZTYnKTsgLy8gWydub2RlNycsICdub2RlOCddXG4gICAgICovXG4gICAgZ2V0Q2hlY2tlZExpc3Q6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSB0aGlzLmNoZWNrZWRMaXN0O1xuXG4gICAgICAgIGlmICghcGFyZW50SWQpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGVja2VkTGlzdC5zbGljZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcihjaGVja2VkTGlzdCwgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZS5jb250YWlucyhwYXJlbnRJZCwgbm9kZUlkKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0b3AgY2hlY2tlZCBsaXN0XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gTm9kZSBpZCAoZGVmYXVsdDogcm9vdE5vZGUgaWQpXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBDaGVja2VkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvL1xuICAgICAqIC8vIG5vZGUxKHYpXG4gICAgICogLy8gICBub2RlMih2KVxuICAgICAqIC8vICAgbm9kZTModilcbiAgICAgKiAvLyBub2RlNFxuICAgICAqIC8vICAgbm9kZTUodilcbiAgICAgKiAvLyBub2RlNlxuICAgICAqIC8vICAgbm9kZTcodilcbiAgICAgKiAvLyAgICAgbm9kZTgodilcbiAgICAgKiAvLyAgIG5vZGU5XG4gICAgICpcbiAgICAgKiB2YXIgYWxsVG9wQ2hlY2tlZExpc3QgPSB0cmVlLmdldFRvcENoZWNrZWRMaXN0KCk7IC8vIFsnbm9kZTEnLCAnbm9kZTUnLCAnbm9kZTcnXVxuICAgICAqIHZhciBkZXNjZW5kYW50c1RvcENoZWNrZWRMaXN0ID0gdHJlZS5nZXRUb3BDaGVla2VkTGlzdCgnbm9kZTYnKTsgLy8gWydub2RlNyddXG4gICAgICovXG4gICAgZ2V0VG9wQ2hlY2tlZExpc3Q6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSBbXSxcbiAgICAgICAgICAgIHN0YXRlO1xuXG4gICAgICAgIHBhcmVudElkID0gcGFyZW50SWQgfHwgdHJlZS5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIHN0YXRlID0gdGhpcy5fZ2V0U3RhdGUocGFyZW50SWQpO1xuICAgICAgICBpZiAoc3RhdGUgPT09IFNUQVRFX0NIRUNLRUQpIHtcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gdHJlZS5nZXRDaGlsZElkcyhwYXJlbnRJZCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFNUQVRFX0lOREVURVJNSU5BVEUpIHtcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5nZXRDaGVja2VkTGlzdChwYXJlbnRJZCk7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IGZpbHRlcihjaGVja2VkTGlzdCwgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICF0aGlzLmlzQ2hlY2tlZCh0cmVlLmdldFBhcmVudElkKG5vZGVJZCkpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hlY2tlZExpc3Q7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBib3R0b20gY2hlY2tlZCBsaXN0XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gTm9kZSBpZCAoZGVmYXVsdDogcm9vdE5vZGUgaWQpXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBDaGVja2VkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvL1xuICAgICAqIC8vIG5vZGUxKHYpXG4gICAgICogLy8gICBub2RlMih2KVxuICAgICAqIC8vICAgbm9kZTModilcbiAgICAgKiAvLyBub2RlNFxuICAgICAqIC8vICAgbm9kZTUodilcbiAgICAgKiAvLyBub2RlNlxuICAgICAqIC8vICAgbm9kZTcodilcbiAgICAgKiAvLyAgICAgbm9kZTgodilcbiAgICAgKiAvLyAgIG5vZGU5XG4gICAgICpcbiAgICAgKiB2YXIgYWxsQm90dG9tQ2hlY2tlZExpc3QgPSB0cmVlLmdldEJvdHRvbUNoZWNrZWRMaXN0KCk7IC8vIFsnbm9kZTInLCAnbm9kZTMnLCAnbm9kZTUnLCAnbm9kZTgnXVxuICAgICAqIHZhciBkZXNjZW5kYW50c0JvdHRvbUNoZWNrZWRMaXN0ID0gdHJlZS5nZXRCb3R0b21DaGVla2VkTGlzdCgnbm9kZTYnKTsgLy8gWydub2RlOCddXG4gICAgICovXG4gICAgZ2V0Qm90dG9tQ2hlY2tlZExpc3Q6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hlY2tlZExpc3Q7XG5cbiAgICAgICAgcGFyZW50SWQgPSBwYXJlbnRJZCB8fCB0cmVlLmdldFJvb3ROb2RlSWQoKTtcbiAgICAgICAgY2hlY2tlZExpc3QgPSB0aGlzLmdldENoZWNrZWRMaXN0KHBhcmVudElkKTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyKGNoZWNrZWRMaXN0LCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cmVlLmlzTGVhZihub2RlSWQpO1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKENoZWNrYm94KTtcbm1vZHVsZS5leHBvcnRzID0gQ2hlY2tib3g7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vdXRpbCcpO1xuXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgIHVzZUhlbHBlcjogdHJ1ZSxcbiAgICAgICAgaGVscGVyUG9zOiB7XG4gICAgICAgICAgICB5OiAyLFxuICAgICAgICAgICAgeDogNVxuICAgICAgICB9XG4gICAgfSxcbiAgICByZWplY3RlZFRhZ05hbWVzID0gW1xuICAgICAgICAnSU5QVVQnLFxuICAgICAgICAnQlVUVE9OJyxcbiAgICAgICAgJ1VMJ1xuICAgIF0sXG4gICAgQVBJX0xJU1QgPSBbXSxcbiAgICBpbkFycmF5ID0gdHVpLnV0aWwuaW5BcnJheTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgZHJhZ2dhYmxlXG4gKiBAY2xhc3MgRHJhZ2dhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9uc1xuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VIZWxwZXIgLSBVc2luZyBoZWxwZXIgZmxhZ1xuICogIEBwYXJhbSB7e3g6IG51bWJlciwgeTpudW1iZXJ9fSBvcHRpb25zLmhlbHBlclBvcyAtIEhlbHBlciBwb3NpdGlvblxuICogIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG9wdGlvbnMucmVqZWN0ZWRUYWdOYW1lcyAtIE5vIGRyYWdnYWJsZSB0YWcgbmFtZXNcbiAqICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkQ2xhc3NOYW1lcyAtIE5vIGRyYWdnYWJsZSBjbGFzcyBuYW1lc1xuICovXG52YXIgRHJhZ2dhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBEcmFnZ2FibGUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgU2VsZWN0YWJsZVxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFQSSBsaXN0IG9mIERyYWdnYWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuc2V0TWVtYmVycyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5hdHRhY2hNb3VzZWRvd24oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG1lbWJlcnMgb2YgdGhpcyBtb2R1bGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGlucHV0IG9wdGlvbnNcbiAgICAgKi9cbiAgICBzZXRNZW1iZXJzOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHZhciBoZWxwZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpLFxuICAgICAgICAgICAgc3R5bGUgPSBoZWxwZXJFbGVtZW50LnN0eWxlO1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy51c2VIZWxwZXIgPSBvcHRpb25zLnVzZUhlbHBlcjtcbiAgICAgICAgdGhpcy5oZWxwZXJQb3MgPSBvcHRpb25zLmhlbHBlclBvcztcbiAgICAgICAgdGhpcy5yZWplY3RlZFRhZ05hbWVzID0gcmVqZWN0ZWRUYWdOYW1lcy5jb25jYXQob3B0aW9ucy5yZWplY3RlZFRhZ05hbWVzKTtcbiAgICAgICAgdGhpcy5yZWplY3RlZENsYXNzTmFtZXMgPSBbXS5jb25jYXQob3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMpO1xuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQgPSBoZWxwZXJFbGVtZW50O1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5VmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnROb2RlSWQgPSBudWxsO1xuXG4gICAgICAgIHN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdGhpcy50cmVlLnJvb3RFbGVtZW50LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoaGVscGVyRWxlbWVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBtb3VzZSBkb3duIGV2ZW50XG4gICAgICovXG4gICAgYXR0YWNoTW91c2Vkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcmV2ZW50VGV4dFNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLnRyZWUub24oJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZWRvd24sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IHRleHQtc2VsZWN0aW9uXG4gICAgICovXG4gICAgcHJldmVudFRleHRTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHN0eWxlID0gdHJlZS5yb290RWxlbWVudC5zdHlsZSxcbiAgICAgICAgICAgIHNlbGVjdEtleSA9IHV0aWwudGVzdFByb3AoXG4gICAgICAgICAgICAgICAgWyd1c2VyU2VsZWN0JywgJ1dlYmtpdFVzZXJTZWxlY3QnLCAnT1VzZXJTZWxlY3QnLCAnTW96VXNlclNlbGVjdCcsICdtc1VzZXJTZWxlY3QnXVxuICAgICAgICAgICAgKTtcblxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodHJlZS5yb290RWxlbWVudCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XG5cbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkgPSBzZWxlY3RLZXk7XG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5VmFsdWUgPSBzdHlsZVtzZWxlY3RLZXldO1xuICAgICAgICBzdHlsZVtzZWxlY3RLZXldID0gJ25vbmUnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgaW4gcmVqZWN0ZWRUYWdOYW1lcyBvciBpbiByZWplY3RlZENsYXNzTmFtZXNcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSB0YXJnZXQgaXMgbm90IGRyYWdnYWJsZSBvciBkcmFnZ2FibGVcbiAgICAgKi9cbiAgICBpc05vdERyYWdnYWJsZTogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIHZhciB0YWdOYW1lID0gdGFyZ2V0LnRhZ05hbWUudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB1dGlsLmdldENsYXNzKHRhcmdldCkuc3BsaXQoL1xccysvKSxcbiAgICAgICAgICAgIHJlc3VsdDtcblxuICAgICAgICBpZiAoaW5BcnJheSh0YWdOYW1lLCB0aGlzLnJlamVjdGVkVGFnTmFtZXMpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKGNsYXNzTmFtZXMsIGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gaW5BcnJheShjbGFzc05hbWUsIHRoaXMucmVqZWN0ZWRDbGFzc05hbWVzKSAhPT0gLTE7XG5cbiAgICAgICAgICAgIHJldHVybiAhcmVzdWx0O1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vkb3duXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25Nb3VzZWRvd246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgbm9kZUlkO1xuXG4gICAgICAgIGlmICh1dGlsLmlzUmlnaHRCdXR0b24oZXZlbnQpIHx8IHRoaXMuaXNOb3REcmFnZ2FibGUodGFyZ2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHV0aWwucHJldmVudERlZmF1bHQoZXZlbnQpO1xuXG4gICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICAgICAgbm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuICAgICAgICB0aGlzLmN1cnJlbnROb2RlSWQgPSBub2RlSWQ7XG4gICAgICAgIGlmICh0aGlzLnVzZUhlbHBlcikge1xuICAgICAgICAgICAgdGhpcy5zZXRIZWxwZXIodGFyZ2V0LmlubmVyVGV4dCB8fCB0YXJnZXQudGV4dENvbnRlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZS5vbih7XG4gICAgICAgICAgICBtb3VzZW1vdmU6IHRoaXMub25Nb3VzZW1vdmUsXG4gICAgICAgICAgICBtb3VzZXVwOiB0aGlzLm9uTW91c2V1cFxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlbW92ZVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2Vtb3ZlOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGhlbHBlckVsID0gdGhpcy5oZWxwZXJFbGVtZW50LFxuICAgICAgICAgICAgcG9zID0gdHJlZS5yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgaWYgKCF0aGlzLnVzZUhlbHBlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaGVscGVyRWwuc3R5bGUudG9wID0gZXZlbnQuY2xpZW50WSAtIHBvcy50b3AgKyB0aGlzLmhlbHBlclBvcy55ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBwb3MubGVmdCArIHRoaXMuaGVscGVyUG9zLnggKyAncHgnO1xuICAgICAgICBoZWxwZXJFbC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZXVwXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25Nb3VzZXVwOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdHJlZS5tb3ZlKHRoaXMuY3VycmVudE5vZGVJZCwgbm9kZUlkKTtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbnVsbDtcblxuICAgICAgICB0cmVlLm9mZih0aGlzLCAnbW91c2Vtb3ZlJyk7XG4gICAgICAgIHRyZWUub2ZmKHRoaXMsICdtb3VzZXVwJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc3RvcmUgdGV4dC1zZWxlY3Rpb25cbiAgICAgKi9cbiAgICByZXN0b3JlVGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHJlZS5yb290RWxlbWVudCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIGlmICh0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgdHJlZS5yb290RWxlbWVudC5zdHlsZVt0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleV0gPSB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBoZWxwZXIgY29udGVudHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIEhlbHBlciBjb250ZW50c1xuICAgICAqL1xuICAgIHNldEhlbHBlcjogZnVuY3Rpb24odGV4dCkge1xuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuaW5uZXJIVE1MID0gdGV4dDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGV0YWNoIG1vdXNlZG93biBldmVudFxuICAgICAqL1xuICAgIGRldGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZXN0b3JlVGV4dFNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLmRldGFjaE1vdXNlZG93bigpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdnYWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIEFQSV9MSVNUID0gW107XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjbGFzcyBFZGl0YWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnNcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5lZGl0YWJsZUNsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBlZGl0YWJsZSBlbGVtZW50XG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZGF0YUtleSAtIEtleSBvZiBub2RlIGRhdGEgdG8gc2V0IHZhbHVlXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaW5wdXRDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgaW5wdXQgZWxlbWVudFxuICovXG52YXIgRWRpdGFibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIEVkaXRhYmxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIFNlbGVjdGFibGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBFZGl0YWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbnMgPSB0dWkudXRpbC5leHRlbmQoe30sIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLmVkaXRhYmxlQ2xhc3NOYW1lID0gb3B0aW9ucy5lZGl0YWJsZUNsYXNzTmFtZTtcbiAgICAgICAgdGhpcy5kYXRhS2V5ID0gb3B0aW9ucy5kYXRhS2V5O1xuICAgICAgICB0aGlzLmlucHV0RWxlbWVudCA9IHRoaXMuY3JlYXRlSW5wdXRFbGVtZW50KG9wdGlvbnMuaW5wdXRDbGFzc05hbWUpO1xuICAgICAgICB0aGlzLmJvdW5kT25LZXl1cCA9IHR1aS51dGlsLmJpbmQodGhpcy5vbktleXVwLCB0aGlzKTtcbiAgICAgICAgdGhpcy5ib3VuZE9uQmx1ciA9IHR1aS51dGlsLmJpbmQodGhpcy5vbkJsdXIsIHRoaXMpO1xuXG4gICAgICAgIHRyZWUub24oJ2RvdWJsZUNsaWNrJywgdGhpcy5vbkRvdWJsZUNsaWNrLCB0aGlzKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAna2V5dXAnLCB0aGlzLmJvdW5kT25LZXl1cCk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2JsdXInLCB0aGlzLmJvdW5kT25CbHVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGV0YWNoIGlucHV0IGVsZW1lbnQgZnJvbSBkb2N1bWVudFxuICAgICAqL1xuICAgIGRldGFjaElucHV0RnJvbURvY3VtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlucHV0RWwgPSB0aGlzLmlucHV0RWxlbWVudCxcbiAgICAgICAgICAgIHBhcmVudE5vZGUgPSBpbnB1dEVsLnBhcmVudE5vZGU7XG5cbiAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaW5wdXRFbCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSB0aGlzIG1vZHVsZVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmRldGFjaElucHV0RnJvbURvY3VtZW50KCk7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcyk7XG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2tleXVwJywgdGhpcy5ib3VuZE9uS2V5dXApO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdibHVyJywgdGhpcy5ib3VuZE9uQmx1cik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpbnB1dCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlucHV0Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGlucHV0IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IElucHV0IGVsZW1lbnRcbiAgICAgKi9cbiAgICBjcmVhdGVJbnB1dEVsZW1lbnQ6IGZ1bmN0aW9uKGlucHV0Q2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0lOUFVUJyk7XG4gICAgICAgIGlmIChpbnB1dENsYXNzTmFtZSkge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gaW5wdXRDbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwiZG91YmxlQ2xpY2tcIlxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgaW5wdXRFbGVtZW50LCBub2RlSWQ7XG5cbiAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmVkaXRhYmxlQ2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgbm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQgPSB0aGlzLmlucHV0RWxlbWVudDtcbiAgICAgICAgICAgIGlucHV0RWxlbWVudC52YWx1ZSA9IHRyZWUuZ2V0Tm9kZURhdGEobm9kZUlkKVt0aGlzLmRhdGFLZXldIHx8ICcnO1xuICAgICAgICAgICAgdGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGlucHV0RWxlbWVudCwgdGFyZ2V0KTtcbiAgICAgICAgICAgIHRhcmdldC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgaW5wdXRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcjoga2V5dXAgLSBpbnB1dCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBLZXkgZXZlbnRcbiAgICAgKi9cbiAgICBvbktleXVwOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHsgLy8ga2V5dXAgXCJlbnRlclwiXG4gICAgICAgICAgICB0aGlzLnNldERhdGEoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyOiBibHVyIC0gaW5wdXQgZWxlbWVudFxuICAgICAqL1xuICAgIG9uQmx1cjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0RGF0YSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YSBvZiBpbnB1dCBlbGVtZW50IHRvIG5vZGUgYW5kIGRldGFjaCBpbnB1dCBlbGVtZW50IGZyb20gZG9jLlxuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGhpcy5pbnB1dEVsZW1lbnQpLFxuICAgICAgICAgICAgZGF0YSA9IHt9O1xuXG4gICAgICAgIGlmIChub2RlSWQpIHtcbiAgICAgICAgICAgIGRhdGFbdGhpcy5kYXRhS2V5XSA9IHRoaXMuaW5wdXRFbGVtZW50LnZhbHVlO1xuICAgICAgICAgICAgdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGV0YWNoSW5wdXRGcm9tRG9jdW1lbnQoKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0YWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIEFQSV9MSVNUID0gW1xuICAgICAgICAnc2VsZWN0JyxcbiAgICAgICAgJ2dldFNlbGVjdGVkTm9kZUlkJ1xuICAgIF0sXG4gICAgZGVmYXVsdHMgPSB7XG4gICAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lOiAndHVpLXRyZWUtc2VsZWN0ZWQnXG4gICAgfTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgc2VsZWN0YWJsZVxuICogQGNsYXNzIFNlbGVjdGFibGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5zZWxlY3RlZENsYXNzTmFtZSAtIENsYXNzbmFtZSBmb3Igc2VsZWN0ZWQgbm9kZS5cbiAqL1xudmFyIFNlbGVjdGFibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFNlbGVjdGFibGUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgU2VsZWN0YWJsZVxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFQSSBsaXN0IG9mIFNlbGVjdGFibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUgPSBvcHRpb25zLnNlbGVjdGVkQ2xhc3NOYW1lO1xuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZUlkID0gbnVsbDtcblxuICAgICAgICB0cmVlLm9uKHtcbiAgICAgICAgICAgIHNpbmdsZUNsaWNrOiB0aGlzLm9uU2luZ2xlQ2xpY2ssXG4gICAgICAgICAgICBhZnRlckRyYXc6IHRoaXMub25BZnRlckRyYXdcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHRoaXMuX3NldEFQSXMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGFwaXMgb2Ygc2VsZWN0YWJsZSB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0QVBJczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgYmluZCA9IHR1aS51dGlsLmJpbmQ7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgdHJlZVthcGlOYW1lXSA9IGJpbmQodGhpc1thcGlOYW1lXSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgbm9kZUVsZW1lbnQgPSB0aGlzLmdldFByZXZFbGVtZW50KCk7XG5cbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdHJlZVthcGlOYW1lXTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwic2luZ2xlQ2xpY2tcIlxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uU2luZ2xlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0aGlzLnRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICB0aGlzLnNlbGVjdChub2RlSWQsIHRhcmdldCk7XG4gICAgfSxcblxuICAgIC8qIGVzbGludC1kaXNhYmxlIHZhbGlkLWpzZG9jXG4gICAgICAgIElnbm9yZSBcInRhcmdldFwiIHBhcmFtZXRlciBhbm5vdGF0aW9uIGZvciBBUEkgcGFnZVxuICAgICAgICBcInRyZWUuc2VsZWN0KG5vZGVJZClcIlxuICAgICAqL1xuICAgIC8qKlxuICAgICAqIFNlbGVjdCBub2RlIGlmIHRoZSBmZWF0dXJlLVwiU2VsZWN0YWJsZVwiIGlzIGVuYWJsZWQuXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEByZXF1aXJlcyBTZWxlY3RhYmxlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuc2VsZWN0KCd0dWktdHJlZS1ub2RlLTMnKTtcbiAgICAgKi9cbiAgICAvKiBlc2xpbnQtZW5hYmxlIHZhbGlkLWpzZG9jICovXG4gICAgc2VsZWN0OiBmdW5jdGlvbihub2RlSWQsIHRhcmdldCkge1xuICAgICAgICB2YXIgdHJlZSwgcHJldkVsZW1lbnQsIG5vZGVFbGVtZW50LFxuICAgICAgICAgICAgc2VsZWN0ZWRDbGFzc05hbWUsIHByZXZOb2RlSWQ7XG5cbiAgICAgICAgaWYgKCFub2RlSWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHByZXZFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpO1xuICAgICAgICBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lID0gdGhpcy5zZWxlY3RlZENsYXNzTmFtZTtcbiAgICAgICAgcHJldk5vZGVJZCA9IHRoaXMuc2VsZWN0ZWROb2RlSWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlU2VsZWN0XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBTZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmV2Tm9kZUlkIC0gUHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR8dW5kZWZpbmVkfSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlXG4gICAgICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScpXG4gICAgICAgICAqICAub24oJ2JlZm9yZVNlbGVjdCcsIGZ1bmN0aW9uKG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KSB7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3NlbGVjdGVkIG5vZGU6ICcgKyBub2RlSWQpO1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdwcmV2aW91cyBzZWxlY3RlZCBub2RlOiAnICsgcHJldk5vZGVJZCk7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3RhcmdldCBlbGVtZW50OiAnICsgdGFyZ2V0KTtcbiAgICAgICAgICogICAgICByZXR1cm4gZmFsc2U7IC8vIEl0IGNhbmNlbHMgXCJzZWxlY3RcIlxuICAgICAgICAgKiAgICAgIC8vIHJldHVybiB0cnVlOyAvLyBJdCBmaXJlcyBcInNlbGVjdFwiXG4gICAgICAgICAqICB9KTtcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0cmVlLmludm9rZSgnYmVmb3JlU2VsZWN0Jywgbm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpKSB7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHByZXZFbGVtZW50LCBzZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBzZWxlY3RlZENsYXNzTmFtZSk7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFRyZWUjc2VsZWN0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gU2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHByZXZOb2RlSWQgLSBQcmV2aW91cyBzZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR8dW5kZWZpbmVkfSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHRyZWVcbiAgICAgICAgICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScpXG4gICAgICAgICAgICAgKiAgLm9uKCdzZWxlY3QnLCBmdW5jdGlvbihub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCkge1xuICAgICAgICAgICAgICogICAgICBjb25zb2xlLmxvZygnc2VsZWN0ZWQgbm9kZTogJyArIG5vZGVJZCk7XG4gICAgICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdwcmV2aW91cyBzZWxlY3RlZCBub2RlOiAnICsgcHJldk5vZGVJZCk7XG4gICAgICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCd0YXJnZXQgZWxlbWVudDogJyArIHRhcmdldCk7XG4gICAgICAgICAgICAgKiAgfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRyZWUuZmlyZSgnc2VsZWN0Jywgbm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IG5vZGVJZDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBOb2RlIGVsZW1lbnRcbiAgICAgKi9cbiAgICBnZXRQcmV2RWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLnNlbGVjdGVkTm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFNlbGVjdGVkTm9kZUlkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWROb2RlSWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIC0gXCJhZnRlckRyYXdcIlxuICAgICAqL1xuICAgIG9uQWZ0ZXJEcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpO1xuXG4gICAgICAgIGlmIChub2RlRWxlbWVudCkge1xuICAgICAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RhYmxlO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFJlbmRlciB0cmVlIGFuZCB1cGRhdGUgdHJlZS5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXG4gICAgZGVmYXVsdE9wdGlvbiA9IHJlcXVpcmUoJy4vY29uc3RzL2RlZmF1bHRPcHRpb24nKSxcbiAgICBzdGF0ZXMgPSByZXF1aXJlKCcuL2NvbnN0cy9zdGF0ZXMnKSxcbiAgICBtZXNzYWdlcyA9IHJlcXVpcmUoJy4vY29uc3RzL21lc3NhZ2VzJyksXG4gICAgb3V0ZXJUZW1wbGF0ZSA9IHJlcXVpcmUoJy4vY29uc3RzL291dGVyVGVtcGxhdGUnKSxcbiAgICBUcmVlTW9kZWwgPSByZXF1aXJlKCcuL3RyZWVNb2RlbCcpLFxuICAgIFNlbGVjdGFibGUgPSByZXF1aXJlKCcuL2ZlYXR1cmVzL3NlbGVjdGFibGUnKSxcbiAgICBEcmFnZ2FibGUgPSByZXF1aXJlKCcuL2ZlYXR1cmVzL2RyYWdnYWJsZScpLFxuICAgIEVkaXRhYmxlID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9lZGl0YWJsZScpLFxuICAgIENoZWNrYm94ID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9jaGVja2JveCcpO1xuXG52YXIgbm9kZVN0YXRlcyA9IHN0YXRlcy5ub2RlLFxuICAgIGZlYXR1cmVzID0ge1xuICAgICAgICBTZWxlY3RhYmxlOiBTZWxlY3RhYmxlLFxuICAgICAgICBEcmFnZ2FibGU6IERyYWdnYWJsZSxcbiAgICAgICAgRWRpdGFibGU6IEVkaXRhYmxlLFxuICAgICAgICBDaGVja2JveDogQ2hlY2tib3hcbiAgICB9LFxuICAgIHNuaXBwZXQgPSB0dWkudXRpbCxcbiAgICBleHRlbmQgPSBzbmlwcGV0LmV4dGVuZCxcbiAgICBUSU1FT1VUX1RPX0RJRkZFUkVOVElBVEVfQ0xJQ0tfQU5EX0RCTENMSUNLID0gMjAwLFxuICAgIE1PVVNFX01PVklOR19USFJFU0hPTEQgPSA1O1xuLyoqXG4gKiBDcmVhdGUgdHJlZSBtb2RlbCBhbmQgaW5qZWN0IGRhdGEgdG8gbW9kZWxcbiAqIEBjbGFzcyBUcmVlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBtaXhlcyB0dWkudXRpbC5DdXN0b21FdmVudHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEEgZGF0YSB0byBiZSB1c2VkIG9uIHRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zXG4gKiAgICAgQHBhcmFtIHtIVE1MRWxlbWVudH0gW29wdGlvbnMucm9vdEVsZW1lbnRdIFJvb3QgZWxlbWVudCAoSXQgc2hvdWxkIGJlICdVTCcgZWxlbWVudClcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubm9kZUlkUHJlZml4XSBBIGRlZmF1bHQgcHJlZml4IG9mIGEgbm9kZVxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5ub2RlRGVmYXVsdFN0YXRlXSBBIGRlZmF1bHQgc3RhdGUgb2YgYSBub2RlXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnRlbXBsYXRlXSBBIG1hcmt1cCBzZXQgdG8gbWFrZSBlbGVtZW50XG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGVdIEhUTUwgdGVtcGxhdGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlLmxlYWZOb2RlXSBIVE1MIHRlbXBsYXRlXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnN0YXRlTGFiZWxzXSBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5vcGVuZWRdIFN0YXRlLU9QRU5FRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhdGVMYWJlbHMuY2xvc2VkXSBTdGF0ZS1DTE9TRUQgbGFiZWwgKFRleHQgb3IgSFRNTClcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuY2xhc3NOYW1lc10gQ2xhc3MgbmFtZXMgZm9yIHRyZWVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMubm9kZUNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMubGVhZkNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIGxlYWYgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5vcGVuZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5jbG9zZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBjbG9zZWQgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy50ZXh0Q2xhc3NdIEEgY2xhc3MgbmFtZSB0aGF0IGZvciB0ZXh0RWxlbWVudCBpbiBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnN1YnRyZWVDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgdG9nZ2xlIGJ1dHRvbiBpbiBpbnRlcm5hbCBub2RlXG4gKiAgICAgQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMucmVuZGVyVGVtcGxhdGVdIEZ1bmN0aW9uIGZvciByZW5kZXJpbmcgdGVtcGxhdGVcbiAqIEBleGFtcGxlXG4gKiAvL0RlZmF1bHQgb3B0aW9uczpcbiAqIC8vIHtcbiAqIC8vICAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLSdcbiAqIC8vICAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcbiAqIC8vICAgICBzdGF0ZUxhYmVsczoge1xuICogLy8gICAgICAgICBvcGVuZWQ6ICctJyxcbiAqIC8vICAgICAgICAgY2xvc2VkOiAnKydcbiAqIC8vICAgICB9LFxuICogLy8gICAgIGNsYXNzTmFtZXM6IHtcbiAqIC8vICAgICAgICAgbm9kZUNsYXNzOiAndHVpLXRyZWUtbm9kZScsXG4gKiAvLyAgICAgICAgIGxlYWZDbGFzczogJ3R1aS10cmVlLWxlYWYnLFxuICogLy8gICAgICAgICBvcGVuZWRDbGFzczogJ3R1aS10cmVlLW9wZW5lZCcsXG4gKiAvLyAgICAgICAgIGNsb3NlZENsYXNzOiAndHVpLXRyZWUtY2xvc2VkJyxcbiAqIC8vICAgICAgICAgc3VidHJlZUNsYXNzOiAndHVpLXRyZWUtc3VidHJlZScsXG4gKiAvLyAgICAgICAgIHRvZ2dsZUJ0bkNsYXNzOiAndHVpLXRyZWUtdG9nZ2xlQnRuJyxcbiAqIC8vICAgICAgICAgdGV4dENsYXNzOiAndHVpLXRyZWUtdGV4dCcsXG4gKiAvLyAgICAgfSxcbiAqIC8vICAgICB0ZW1wbGF0ZToge1xuICogLy8gICAgICAgICBpbnRlcm5hbE5vZGU6XG4gKiAvLyAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICogLy8gICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPidcbiAqIC8vICAgICAgICAgbGVhZk5vZGU6XG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gKiAvLyAgICAgfVxuICogLy8gfVxuICogLy9cbiAqXG4gKiB2YXIgZGF0YSA9IFtcbiAqICAgICB7dGV4dDogJ3Jvb3RBJywgY2hpbGRyZW46IFtcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFBJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQid9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMUMnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFEJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQScsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViXzFBJywgY2hpbGRyZW46W1xuICogICAgICAgICAgICAgICAgIHt0ZXh0OidzdWJfc3ViXzFBJ31cbiAqICAgICAgICAgICAgIF19LFxuICogICAgICAgICAgICAge3RleHQ6J3N1Yl8yQSd9XG4gKiAgICAgICAgIF19LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkInfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJDJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yRCd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0EnLCBjaGlsZHJlbjogW1xuICogICAgICAgICAgICAge3RleHQ6J3N1YjNfYSd9LFxuICogICAgICAgICAgICAge3RleHQ6J3N1YjNfYid9XG4gKiAgICAgICAgIF19LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0InfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNDJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zRCd9XG4gKiAgICAgXX0sXG4gKiAgICAge3RleHQ6ICdyb290QicsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgIHt0ZXh0OidCX3N1YjEnfSxcbiAqICAgICAgICAge3RleHQ6J0Jfc3ViMid9LFxuICogICAgICAgICB7dGV4dDonYid9XG4gKiAgICAgXX1cbiAqIF07XG4gKlxuICogdmFyIHRyZWUxID0gbmV3IHR1aS5jb21wb25lbnQuVHJlZShkYXRhLCB7XG4gKiAgICAgcm9vdEVsZW1lbnQ6ICd0cmVlUm9vdCcsIC8vIG9yIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmVlUm9vdCcpXG4gKiAgICAgbm9kZURlZmF1bHRTdGF0ZTogJ29wZW5lZCcsXG4gKlxuICogICAgIC8vID09PT09PT09PSBPcHRpb246IE92ZXJyaWRlIHRlbXBsYXRlIHJlbmRlcmVyID09PT09PT09PT09XG4gKlxuICogICAgIHRlbXBsYXRlOiB7IC8vIHRlbXBsYXRlIGZvciBNdXN0YWNoZSBlbmdpbmVcbiAqICAgICAgICAgaW50ZXJuYWxOb2RlOlxuICogICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3t7c3RhdGVMYWJlbH19fTwvYnV0dG9uPicgK1xuICogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7e3RleHR9fX08L3NwYW4+JyArXG4gKiAgICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7e2NoaWxkcmVufX19PC91bD4nXG4gKiAgICAgICAgIGxlYWZOb2RlOlxuICogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7e3RleHR9fX08L3NwYW4+JyArXG4gKiAgICAgfSxcbiAqICAgICByZW5kZXJUZW1wbGF0ZTogZnVuY3Rpb24oc291cmNlLCBwcm9wcykge1xuICogICAgICAgICAvLyBNdXN0YWNoZSB0ZW1wbGF0ZSBlbmdpbmVcbiAqICAgICAgICAgcmV0dXJuIE11c3RhY2hlLnJlbmRlcih0ZW1wbGF0ZSwgcHJvcHMpO1xuICogICAgIH1cbiAqIH0pO1xuICoqL1xudmFyIFRyZWUgPSBzbmlwcGV0LmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZS5wcm90b3R5cGUgKi97IC8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmF1bHQgY2xhc3MgbmFtZXNcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jbGFzc05hbWVzID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9uLmNsYXNzTmFtZXMsIG9wdGlvbnMuY2xhc3NOYW1lcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmF1bHQgdGVtcGxhdGVcbiAgICAgICAgICogQHR5cGUge3tpbnRlcm5hbE5vZGU6IHN0cmluZywgbGVhZk5vZGU6IHN0cmluZ319XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9uLnRlbXBsYXRlLCBvcHRpb25zLnRlbXBsYXRlKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUm9vdCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBvcHRpb25zLnJvb3RFbGVtZW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXG4gICAgICAgICAqIEB0eXBlIHt7b3BlbmVkOiBzdHJpbmcsIGNsb3NlZDogc3RyaW5nfX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc3RhdGVMYWJlbHMgPSBvcHRpb25zLnN0YXRlTGFiZWxzO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWtlIHRyZWUgbW9kZWxcbiAgICAgICAgICogQHR5cGUge1RyZWVNb2RlbH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVHJlZU1vZGVsKGRhdGEsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbmFibGVkIGZlYXR1cmVzXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgb2JqZWN0Pn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsaWNrIHRpbWVyIHRvIHByZXZlbnQgY2xpY2stZHVwbGljYXRpb24gd2l0aCBkb3VibGUgY2xpY2tcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRvIHByZXZlbnQgY2xpY2sgZXZlbnQgaWYgbW91c2UgbW92ZWQgYmVmb3JlIG1vdXNldXAuXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9tb3VzZU1vdmluZ0ZsYWcgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVuZGVyIHRlbXBsYXRlXG4gICAgICAgICAqIEl0IGNhbiBiZSBvdmVycm9kZSBieSB1c2VyJ3MgdGVtcGxhdGUgZW5naW5lLlxuICAgICAgICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9yZW5kZXJUZW1wbGF0ZSA9IG9wdGlvbnMucmVuZGVyVGVtcGxhdGUgfHwgdXRpbC5yZW5kZXJUZW1wbGF0ZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJ1ZSB3aGVuIGEgbm9kZSBpcyBtb3ZpbmdcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbih7XG4gICAgICAgICAqICAgICBiZWZvcmVEcmF3OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgICAgICBpZiAodHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICogICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgKiAgICAgICAgIH1cbiAgICAgICAgICogICAgICAgICAvLy4uXG4gICAgICAgICAqICAgICB9LFxuICAgICAgICAgKiAgICAgLy8uLi4uXG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKiB0cmVlLm1vdmUoJ3R1aS10cmVlLW5vZGUtMScsICd0dWktdHJlZS1ub2RlLTInKTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNNb3ZpbmdOb2RlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5fc2V0Um9vdCgpO1xuICAgICAgICB0aGlzLl9kcmF3KHRoaXMuZ2V0Um9vdE5vZGVJZCgpKTtcbiAgICAgICAgdGhpcy5fc2V0RXZlbnRzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByb290IGVsZW1lbnQgb2YgdHJlZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJvb3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudDtcblxuICAgICAgICBpZiAoc25pcHBldC5pc1N0cmluZyhyb290RWwpKSB7XG4gICAgICAgICAgICByb290RWwgPSB0aGlzLnJvb3RFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocm9vdEVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc25pcHBldC5pc0hUTUxOb2RlKHJvb3RFbCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlcy5JTlZBTElEX1JPT1RfRUxFTUVOVCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTW92ZSBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3JpZ2luYWxQYXJlbnRJZCAtIE9yaWdpbmFsIHBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBub2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Nb3ZlOiBmdW5jdGlvbihub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkKSB7XG4gICAgICAgIHRoaXMuX2RyYXcob3JpZ2luYWxQYXJlbnRJZCk7XG4gICAgICAgIHRoaXMuX2RyYXcobmV3UGFyZW50SWQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI21vdmVcbiAgICAgICAgICogQHBhcmFtIHt7bm9kZUlkOiBzdHJpbmcsIG9yaWdpbmFsUGFyZW50SWQ6IHN0cmluZywgbmV3UGFyZW50SWQ6IHN0cmluZ319IHRyZWVFdmVudCAtIFRyZWUgZXZlbnRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbignbW92ZScsIGZ1bmN0aW9uKHRyZWVFdmVudCkge1xuICAgICAgICAgKiAgICAgdmFyIG5vZGVJZCA9IHRyZWVFdmVudC5ub2RlSWQsXG4gICAgICAgICAqICAgICAgICAgb3JpZ2luYWxQYXJlbnRJZCA9IHRyZWVFdmVudC5vcmlnaW5hbFBhcmVudElkLFxuICAgICAgICAgKiAgICAgICAgIG5ld1BhcmVudElkID0gdHJlZUV2ZW50Lm5ld1BhcmVudElkO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywge1xuICAgICAgICAgICAgbm9kZUlkOiBub2RlSWQsXG4gICAgICAgICAgICBvcmlnaW5hbFBhcmVudElkOiBvcmlnaW5hbFBhcmVudElkLFxuICAgICAgICAgICAgbmV3UGFyZW50SWQ6IG5ld1BhcmVudElkXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZXZlbnQgaGFuZGxlcnNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLm9uKHtcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5fZHJhdyxcbiAgICAgICAgICAgIG1vdmU6IHRoaXMuX29uTW92ZVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdjbGljaycsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkNsaWNrLCB0aGlzKSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnbW91c2Vkb3duJywgc25pcHBldC5iaW5kKHRoaXMuX29uTW91c2Vkb3duLCB0aGlzKSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnZGJsY2xpY2snLCBzbmlwcGV0LmJpbmQodGhpcy5fb25Eb3VibGVDbGljaywgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vkb3duXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBkb3duRXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTW91c2Vkb3duOiBmdW5jdGlvbihkb3duRXZlbnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgY2xpZW50WCA9IGRvd25FdmVudC5jbGllbnRYLFxuICAgICAgICAgICAgY2xpZW50WSA9IGRvd25FdmVudC5jbGllbnRZLFxuICAgICAgICAgICAgYWJzID0gTWF0aC5hYnM7XG5cbiAgICAgICAgZnVuY3Rpb24gb25Nb3VzZU1vdmUobW92ZUV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgbmV3Q2xpZW50WCA9IG1vdmVFdmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIG5ld0NsaWVudFkgPSBtb3ZlRXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgaWYgKGFicyhuZXdDbGllbnRYIC0gY2xpZW50WCkgKyBhYnMobmV3Q2xpZW50WSAtIGNsaWVudFkpID4gTU9VU0VfTU9WSU5HX1RIUkVTSE9MRCkge1xuICAgICAgICAgICAgICAgIHNlbGYuZmlyZSgnbW91c2Vtb3ZlJywgbW92ZUV2ZW50KTtcbiAgICAgICAgICAgICAgICBzZWxmLl9tb3VzZU1vdmluZ0ZsYWcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uTW91c2VVcCh1cEV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLmZpcmUoJ21vdXNldXAnLCB1cEV2ZW50KTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbW91c2VNb3ZpbmdGbGFnID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZmlyZSgnbW91c2Vkb3duJywgZG93bkV2ZW50KTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGNsaWNrXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIENsaWNrIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25DbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICh1dGlsLmlzUmlnaHRCdXR0b24oZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzcykpIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlKHRoaXMuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KSk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jbGlja1RpbWVyICYmICF0aGlzLl9tb3VzZU1vdmluZ0ZsYWcpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnc2luZ2xlQ2xpY2snLCBldmVudCk7XG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVzZXRDbGlja1RpbWVyKCk7XG4gICAgICAgICAgICB9LCBUSU1FT1VUX1RPX0RJRkZFUkVOVElBVEVfQ0xJQ0tfQU5EX0RCTENMSUNLKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gZG91YmxlIGNsaWNrIChkYmxjbGljaylcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gRG91YmxlIGNsaWNrIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Eb3VibGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5maXJlKCdkb3VibGVDbGljaycsIGV2ZW50KTtcbiAgICAgICAgdGhpcy5yZXNldENsaWNrVGltZXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG5vZGUgc3RhdGUgLSBvcGVuZWQgb3IgY2xvc2VkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOb2RlIHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0RGlzcGxheUZyb21Ob2RlU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcbiAgICAgICAgdmFyIHN1YnRyZWVFbGVtZW50ID0gdGhpcy5fZ2V0U3VidHJlZUVsZW1lbnQobm9kZUlkKSxcbiAgICAgICAgICAgIGxhYmVsLCBidG5FbGVtZW50LCBub2RlRWxlbWVudDtcblxuICAgICAgICBpZiAoIXN1YnRyZWVFbGVtZW50IHx8IHN1YnRyZWVFbGVtZW50ID09PSB0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGFiZWwgPSB0aGlzLnN0YXRlTGFiZWxzW3N0YXRlXTtcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xuICAgICAgICBidG5FbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgICAgICAgbm9kZUVsZW1lbnQsXG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NcbiAgICAgICAgKVswXTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IG5vZGVTdGF0ZXMuT1BFTkVEKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGUobm9kZUVsZW1lbnQsIHN0YXRlKTtcblxuICAgICAgICBpZiAoYnRuRWxlbWVudCkge1xuICAgICAgICAgICAgYnRuRWxlbWVudC5pbm5lckhUTUwgPSBsYWJlbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbm9kZSBjbGFzcyBuYW1lIGZyb20gcHJvdmlkZWQgc3RhdGVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlRWxlbWVudCAtIFRyZWVOb2RlIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOZXcgY2hhbmdlZCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGU6IGZ1bmN0aW9uKG5vZGVFbGVtZW50LCBzdGF0ZSkge1xuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcbiAgICAgICAgICAgIG9wZW5lZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5PUEVORUQgKyAnQ2xhc3MnXSxcbiAgICAgICAgICAgIGNsb3NlZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5DTE9TRUQgKyAnQ2xhc3MnXTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBvcGVuZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBjbG9zZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbFxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG5vZGVJZHMgLSBOb2RlIGlkIGxpc3RcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAc2VlIG91dGVyVGVtcGxhdGUgdXNlcyBcInV0aWwucmVuZGVyVGVtcGxhdGVcIlxuICAgICAqL1xuICAgIF9tYWtlSHRtbDogZnVuY3Rpb24obm9kZUlkcykge1xuICAgICAgICB2YXIgbW9kZWwgPSB0aGlzLm1vZGVsLFxuICAgICAgICAgICAgaHRtbCA9ICcnO1xuXG4gICAgICAgIHNuaXBwZXQuZm9yRWFjaChub2RlSWRzLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gbW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgICAgIHNvdXJjZXMsIHByb3BzO1xuXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNvdXJjZXMgPSB0aGlzLl9nZXRUZW1wbGF0ZShub2RlKTtcbiAgICAgICAgICAgIHByb3BzID0gdGhpcy5fbWFrZVRlbXBsYXRlUHJvcHMobm9kZSk7XG4gICAgICAgICAgICBwcm9wcy5pbm5lclRlbXBsYXRlID0gdGhpcy5fbWFrZUlubmVySFRNTChub2RlLCB7XG4gICAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2VzLmlubmVyLFxuICAgICAgICAgICAgICAgIHByb3BzOiBwcm9wc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBodG1sICs9IHV0aWwucmVuZGVyVGVtcGxhdGUoc291cmNlcy5vdXRlciwgcHJvcHMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBpbm5lciBodG1sIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBub2RlIC0gTm9kZVxuICAgICAqIEBwYXJhbSB7e3NvdXJjZTogc3RyaW5nLCBwcm9wczogT2JqZWN0fX0gW2NhY2hlZF0gLSBDYXNoZWQgZGF0YSB0byBtYWtlIGh0bWxcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBJbm5lciBodG1sIG9mIG5vZGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBzZWUgaW5uZXJUZW1wbGF0ZSB1c2VzIFwidGhpcy5fcmVuZGVyVGVtcGxhdGVcIlxuICAgICAqL1xuICAgIF9tYWtlSW5uZXJIVE1MOiBmdW5jdGlvbihub2RlLCBjYWNoZWQpIHtcbiAgICAgICAgdmFyIHNvdXJjZSwgcHJvcHM7XG5cbiAgICAgICAgY2FjaGVkID0gY2FjaGVkIHx8IHt9O1xuICAgICAgICBzb3VyY2UgPSBjYWNoZWQuc291cmNlIHx8IHRoaXMuX2dldFRlbXBsYXRlKG5vZGUpLmlubmVyO1xuICAgICAgICBwcm9wcyA9IGNhY2hlZC5wcm9wcyB8fCB0aGlzLl9tYWtlVGVtcGxhdGVQcm9wcyhub2RlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fcmVuZGVyVGVtcGxhdGUoc291cmNlLCBwcm9wcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0ZW1wbGF0ZSBzb3VyY2VzXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcmV0dXJucyB7e2lubmVyOiBzdHJpbmcsIG91dGVyOiBzdHJpbmd9fSBUZW1wbGF0ZSBzb3VyY2VzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHNvdXJjZTtcblxuICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xuICAgICAgICAgICAgc291cmNlID0ge1xuICAgICAgICAgICAgICAgIGlubmVyOiB0aGlzLnRlbXBsYXRlLmxlYWZOb2RlLFxuICAgICAgICAgICAgICAgIG91dGVyOiBvdXRlclRlbXBsYXRlLkxFQUZfTk9ERVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICBpbm5lcjogdGhpcy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGUsXG4gICAgICAgICAgICAgICAgb3V0ZXI6IG91dGVyVGVtcGxhdGUuSU5URVJOQUxfTk9ERVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgdGVtcGxhdGUgcHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGVtcGxhdGUgcHJvcGVydGllc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VUZW1wbGF0ZVByb3BzOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzLFxuICAgICAgICAgICAgcHJvcHMsIHN0YXRlO1xuXG4gICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBpZDogbm9kZS5nZXRJZCgpLFxuICAgICAgICAgICAgICAgIGlzTGVhZjogdHJ1ZSAvLyBmb3IgY3VzdG9tIHRlbXBsYXRlIG1ldGhvZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IG5vZGUuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICBzdGF0ZUNsYXNzOiBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10sXG4gICAgICAgICAgICAgICAgc3RhdGVMYWJlbDogdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV0sXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXh0ZW5kKHByb3BzLCBjbGFzc05hbWVzLCBub2RlLmdldEFsbERhdGEoKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERyYXcgZWxlbWVudCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kcmF3OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIGVsZW1lbnQsIGh0bWw7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVEcmF3XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2JlZm9yZURyYXcnLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgIGlmICh0cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCdpc01vdmluZ05vZGUnKTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCdiZWZvcmVEcmF3OiAnICsgbm9kZUlkKTtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpcmUoJ2JlZm9yZURyYXcnLCBub2RlSWQpO1xuXG4gICAgICAgIGlmIChub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBodG1sID0gdGhpcy5fbWFrZUh0bWwobm9kZS5nZXRDaGlsZElkcygpKTtcbiAgICAgICAgICAgIGVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaHRtbCA9IHRoaXMuX21ha2VJbm5lckhUTUwobm9kZSk7XG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHRoaXMuX3NldENsYXNzV2l0aERpc3BsYXkobm9kZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYWZ0ZXJEcmF3XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2FmdGVyRHJhdycsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgKiAgICAgaWYgKHRyZWUuaXNNb3ZpbmdOb2RlKSB7XG4gICAgICAgICAqICAgICAgICAgY29uc29sZS5sb2coJ2lzTW92aW5nTm9kZScpO1xuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ2FmdGVyRHJhdzogJyArIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdhZnRlckRyYXcnLCBub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY2xhc3MgYW5kIGRpc3BsYXkgb2Ygbm9kZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDbGFzc1dpdGhEaXNwbGF5OiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBub2RlSWQgPSBub2RlLmdldElkKCksXG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKSxcbiAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXM7XG5cbiAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5vcGVuZWRDbGFzcyk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZXMuY2xvc2VkQ2xhc3MpO1xuICAgICAgICAgICAgdXRpbC5hZGRDbGFzcyhlbGVtZW50LCBjbGFzc05hbWVzLmxlYWZDbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIG5vZGUuZ2V0U3RhdGUoKSk7XG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDbGFzc1dpdGhEaXNwbGF5KGNoaWxkKTtcbiAgICAgICAgICAgIH0sIG5vZGVJZCwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHN1YnRyZWUgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBUcmVlTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gU3VidHJlZSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3VidHJlZUVsZW1lbnQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpLFxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3NcbiAgICAgICAgICAgIClbMF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VidHJlZUVsZW1lbnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgZGVwdGggb2Ygbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ8dW5kZWZpbmVkfSBEZXB0aFxuICAgICAqL1xuICAgIGdldERlcHRoOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0RGVwdGgobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBsYXN0IGRlcHRoIG9mIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge251bWJlcn0gTGFzdCBkZXB0aFxuICAgICAqL1xuICAgIGdldExhc3REZXB0aDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldExhc3REZXB0aCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcm9vdCBub2RlIGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJvb3Qgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFJvb3ROb2RlSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5yb290Tm9kZS5nZXRJZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gY2hpbGQgaWRzXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fHVuZGVmaW5lZH0gQ2hpbGQgaWRzXG4gICAgICovXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRDaGlsZElkcyhub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcGFyZW50IGlkIG9mIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gUGFyZW50IGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRQYXJlbnRJZChub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXNldCBjbGljayB0aW1lclxuICAgICAqL1xuICAgIHJlc2V0Q2xpY2tUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5jbGlja1RpbWVyKTtcbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgaWQgZnJvbSBlbGVtZW50XG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBFbGVtZW50XG4gICAgICogQHJldHVybnMge3N0cmluZ30gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudChlbGVtZW50SW5Ob2RlKTsgLy8gJ3R1aS10cmVlLW5vZGUtMydcbiAgICAgKi9cbiAgICBnZXROb2RlSWRGcm9tRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICB2YXIgaWRQcmVmaXggPSB0aGlzLmdldE5vZGVJZFByZWZpeCgpO1xuXG4gICAgICAgIHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQuaWQuaW5kZXhPZihpZFByZWZpeCkgPT09IC0xKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmlkIDogJyc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwcmVmaXggb2Ygbm9kZSBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXggb2Ygbm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXROb2RlSWRQcmVmaXgoKTsgLy8gJ3R1aS10cmVlLW5vZGUtJ1xuICAgICAqL1xuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVJZFByZWZpeCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge29iamVjdHx1bmRlZmluZWR9IE5vZGUgZGF0YVxuICAgICAqL1xuICAgIGdldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Tm9kZURhdGEobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQGV4bWFwbGVcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwge2ZvbzogJ2Jhcid9KTsgLy8gYXV0byByZWZyZXNoXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIHtmb286ICdiYXInfSwgdHJ1ZSk7IC8vIG5vdCByZWZyZXNoXG4gICAgICovXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCwgZGF0YSwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEsIGlzU2lsZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIG5vZGUgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fSBuYW1lcyAtIE5hbWVzIG9mIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgJ2ZvbycpOyAvLyBhdXRvIHJlZnJlc2hcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgJ2ZvbycsIHRydWUpOyAvLyBub3QgcmVmcmVzaFxuICAgICAqL1xuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIG5hbWVzLCBpc1NpbGVudCkge1xuICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZU5vZGVEYXRhKG5vZGVJZCwgbmFtZXMsIGlzU2lsZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgc3RhdGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IE5vZGUgc3RhdGUoKCdvcGVuZWQnLCAnY2xvc2VkJywgbnVsbClcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0U3RhdGUobm9kZUlkKTsgLy8gJ29wZW5lZCcsICdjbG9zZWQnLFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgLy8gdW5kZWZpbmVkIGlmIHRoZSBub2RlIGlzIG5vbmV4aXN0ZW50XG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPcGVuIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKi9cbiAgICBvcGVuOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5PUEVORUQ7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xvc2Ugbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5DTE9TRUQ7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKi9cbiAgICB0b2dnbGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3RhdGU7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUudG9nZ2xlU3RhdGUoKTtcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU29ydCBhbGwgbm9kZXNcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZm9yIHNvcnRpbmdcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyB0cmVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBTb3J0IHdpdGggcmVkcmF3aW5nIHRyZWVcbiAgICAgKiB0cmVlLnNvcnQoZnVuY3Rpb24obm9kZUEsIG5vZGVCKSB7XG4gICAgICogICAgIHZhciBhVmFsdWUgPSBub2RlQS5nZXREYXRhKCd0ZXh0JyksXG4gICAgICogICAgICAgICBiVmFsdWUgPSBub2RlQi5nZXREYXRhKCd0ZXh0Jyk7XG4gICAgICpcbiAgICAgKiAgICAgaWYgKCFiVmFsdWUgfHwgIWJWYWx1ZS5sb2NhbGVDb21wYXJlKSB7XG4gICAgICogICAgICAgICByZXR1cm4gMDtcbiAgICAgKiAgICAgfVxuICAgICAqICAgICByZXR1cm4gYlZhbHVlLmxvY2FsZUNvbXBhcmUoYVZhbHVlKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIC8vIFNvcnQsIGJ1dCBub3QgcmVkcmF3IHRyZWVcbiAgICAgKiB0cmVlLnNvcnQoZnVuY3Rpb24obm9kZUEsIG5vZGVCKSB7XG4gICAgICogICAgIHZhciBhVmFsdWUgPSBub2RlQS5nZXREYXRhKCd0ZXh0JyksXG4gICAgICogICAgICAgICBiVmFsdWUgPSBub2RlQi5nZXREYXRhKCd0ZXh0Jyk7XG4gICAgICpcbiAgICAgKiAgICAgaWYgKCFiVmFsdWUgfHwgIWJWYWx1ZS5sb2NhbGVDb21wYXJlKSB7XG4gICAgICogICAgICAgICByZXR1cm4gMDtcbiAgICAgKiAgICAgfVxuICAgICAqICAgICByZXR1cm4gYlZhbHVlLmxvY2FsZUNvbXBhcmUoYVZhbHVlKTtcbiAgICAgKiB9LCB0cnVlKTtcbiAgICAgKi9cbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yLCBpc1NpbGVudCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNvcnQoY29tcGFyYXRvcik7XG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZnJlc2ggdHJlZSBvciBub2RlJ3MgY2hpbGRyZW5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtub2RlSWRdIC0gVHJlZU5vZGUgaWQgdG8gcmVmcmVzaFxuICAgICAqL1xuICAgIHJlZnJlc2g6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICBub2RlSWQgPSBub2RlSWQgfHwgdGhpcy5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIHRoaXMuX2RyYXcobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICogICAgIGNvbnNvbGUubG9nKG5vZGUuZ2V0SWQoKSA9PT0gbm9kZUlkKTsgLy8gdHJ1ZVxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIGVhY2hBbGw6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMubW9kZWwuZWFjaEFsbChpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgZGVzY2VuZGFudHMgb2YgYSBub2RlLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5lYWNoKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAqICAgICBjb25zb2xlLmxvZyhub2RlLmdldElkKCkgPT09IG5vZGVJZCk7IC8vIHRydWVcbiAgICAgKiB9LCBwYXJlbnRJZCk7XG4gICAgICpcbiAgICAgKi9cbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBub2RlKHMpLlxuICAgICAqIC0gSWYgdGhlIHBhcmVudElkIGlzIGZhbHN5LCB0aGUgbm9kZSB3aWxsIGJlIGFwcGVuZGVkIHRvIHJvb3ROb2RlLlxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdy1kYXRhXG4gICAgICogQHBhcmFtIHsqfSBbcGFyZW50SWRdIC0gUGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBhZGQgbm9kZSB3aXRoIHJlZHJhd2luZ1xuICAgICAqIHZhciBmaXJzdEFkZGVkSWRzID0gdHJlZS5hZGQoe3RleHQ6J0ZFIGRldmVsb3BtZW50IHRlYW0xJ30sIHBhcmVudElkKTtcbiAgICAgKiBjb25zb2xlLmxvZyhmaXJzdEFkZGVkSWRzKTsgLy8gW1widHVpLXRyZWUtbm9kZS0xMFwiXVxuICAgICAqXG4gICAgICogLy8gYWRkIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcbiAgICAgKiB2YXIgc2Vjb25kQWRkZWRJZHMgPSB0cmVlLmFkZChbXG4gICAgICogICAge3RleHQ6ICdGRSBkZXZlbG9wbWVudCB0ZWFtMid9LFxuICAgICAqICAgIHt0ZXh0OiAnRkUgZGV2ZWxvcG1lbnQgdGVhbTMnfVxuICAgICAqIF0sIHBhcmVudElkLCB0cnVlKTtcbiAgICAgKiBjb25zb2xlLmxvZyhzZWNvbmRBZGRlZElkcyk7IC8vIFtcInR1aS10cmVlLW5vZGUtMTFcIiwgXCJ0dWktdHJlZS1ub2RlLTEyXCJdXG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuYWRkKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IGFsbCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3IGRhdGEgZm9yIGFsbCBub2Rlc1xuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQWRkZWQgbm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUucmVzZXRBbGxEYXRhKFtcbiAgICAgKiAge3RleHQ6ICdoZWxsbycsIGNoaWxkcmVuOiBbXG4gICAgICogICAgICB7dGV4dDogJ2Zvbyd9LFxuICAgICAqICAgICAge3RleHQ6ICdiYXInfVxuICAgICAqICBdfSxcbiAgICAgKiAge3RleHQ6ICd3b2xyZCd9XG4gICAgICogXSk7XG4gICAgICovXG4gICAgcmVzZXRBbGxEYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsQ2hpbGRyZW4odGhpcy5nZXRSb290Tm9kZUlkKCksIHRydWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFkZChkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFsbCBjaGlsZHJlblxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyB0aGUgbm9kZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZW1vdmVBbGxDaGlsZHJlbihub2RlSWQpOyAvLyBSZWRyYXdzIHRoZSBub2RlXG4gICAgICogdHJlZS5yZW1vdmVBbGxDaGlsZHJlbihub2RJZCwgdHJ1ZSk7IC8vIERvZXNuJ3QgcmVkcmF3IHRoZSBub2RlXG4gICAgICovXG4gICAgcmVtb3ZlQWxsQ2hpbGRyZW46IGZ1bmN0aW9uKG5vZGVJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRDaGlsZElkcyhub2RlSWQpO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNoaWxkSWQsIHRydWUpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9kcmF3KG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZCB0byByZW1vdmVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZW1vdmUobXlOb2RlSWQpOyAvLyByZW1vdmUgbm9kZSB3aXRoIHJlZHJhd2luZ1xuICAgICAqIHRyZWUucmVtb3ZlKG15Tm9kZUlkLCB0cnVlKTsgLy8gcmVtb3ZlIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmUobm9kZUlkLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnRcbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUubW92ZShteU5vZGVJZCwgbmV3UGFyZW50SWQpOyAvLyBtb2RlIG5vZGUgd2l0aCByZWRyYXdpbmdcbiAgICAgKiB0cmVlLm1vdmUobXlOb2RlSWQsIG5ld1BhcmVudElkLCB0cnVlKTsgLy8gbW92ZSBub2RlIHdpdGhvdXQgcmVkcmF3aW5nXG4gICAgICovXG4gICAgbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5pc01vdmluZ05vZGUgPSB0cnVlO1xuICAgICAgICB0aGlzLm1vZGVsLm1vdmUobm9kZUlkLCBuZXdQYXJlbnRJZCwgaXNTaWxlbnQpO1xuICAgICAgICB0aGlzLmlzTW92aW5nTm9kZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2ggbm9kZSBpZHMgYnkgcGFzc2luZyB0aGUgcHJlZGljYXRlIGNoZWNrIG9yIG1hdGNoaW5nIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R9IHByZWRpY2F0ZSAtIFByZWRpY2F0ZSBvciBkYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgcHJlZGljYXRlXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBOb2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gc2VhcmNoIGZyb20gcHJlZGljYXRlXG4gICAgICogdmFyIGxlYWZOb2RlSWRzID0gdHJlZS5zZWFyY2goZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICogICAgIHJldHVybiBub2RlLmlzTGVhZigpO1xuICAgICAqIH0pO1xuICAgICAqIGNvbnNvbGUubG9nKGxlYWZOb2RlSWRzKTsgLy8gWyd0dWktdHJlZS1ub2RlLTMnLCAndHVpLXRyZWUtbm9kZS01J11cbiAgICAgKlxuICAgICAqIC8vIHNlYXJjaCBmcm9tIGRhdGFcbiAgICAgKiB2YXIgc3BlY2lhbE5vZGVJZHMgPSB0cmVlLnNlYXJjaCh7XG4gICAgICogICAgIGlzU3BlY2lhbDogdHJ1ZSxcbiAgICAgKiAgICAgZm9vOiAnYmFyJ1xuICAgICAqIH0pO1xuICAgICAqIGNvbnNvbGUubG9nKHNwZWNpYWxOb2RlSWRzKTsgLy8gWyd0dWktdHJlZS1ub2RlLTUnLCAndHVpLXRyZWUtbm9kZS0xMCddXG4gICAgICogY29uc29sZS5sb2codHJlZS5nZXROb2RlRGF0YSgndHVpLXRyZWUtbm9kZS01JykuaXNTcGVjaWFsKTsgLy8gdHJ1ZVxuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuZ2V0Tm9kZURhdGEoJ3R1aS10cmVlLW5vZGUtNScpLmZvbyk7IC8vICdiYXInXG4gICAgICovXG4gICAgc2VhcmNoOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKCFzbmlwcGV0LmlzT2JqZWN0KHByZWRpY2F0ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzbmlwcGV0LmlzRnVuY3Rpb24ocHJlZGljYXRlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3doZXJlKHByZWRpY2F0ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlYXJjaCBub2RlIGlkcyBieSBtYXRjaGluZyBkYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gRGF0YVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF93aGVyZTogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcihmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhID0gbm9kZS5nZXRBbGxEYXRhKCk7XG5cbiAgICAgICAgICAgIHNuaXBwZXQuZm9yRWFjaChwcm9wcywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChrZXkgaW4gZGF0YSkgJiYgKGRhdGFba2V5XSA9PT0gdmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIG5vZGUgaWRzIGJ5IHBhc3NpbmcgdGhlIHByZWRpY2F0ZSBjaGVja1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSAtIFByZWRpY2F0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIHByZWRpY2F0ZVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWx0ZXI6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcblxuICAgICAgICB0aGlzLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUsIG5vZGVJZCkpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKG5vZGVJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNvbnRleHQpO1xuXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBsZWFmXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgaXMgbGVhZi5cbiAgICAgKi9cbiAgICBpc0xlYWY6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIHJldHVybiBub2RlICYmIG5vZGUuaXNMZWFmKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgYSBub2RlIGlzIGEgYW5jZXN0b3Igb2YgYW5vdGhlciBub2RlLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVyTm9kZUlkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGNvbnRhaW4gdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVkTm9kZUlkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGJlIGNvbnRhaW5lZCBieSB0aGUgb3RoZXIgbm9kZVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIGEgbm9kZSBjb250YWlucyBhbm90aGVyIG5vZGVcbiAgICAgKi9cbiAgICBjb250YWluczogZnVuY3Rpb24oY29udGFpbmVyTm9kZUlkLCBjb250YWluZWROb2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuY29udGFpbnMoY29udGFpbmVkTm9kZUlkLCBjb250YWluZWROb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZmFjaWxpdHkgb2YgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnLCAnRWRpdGFibGUnXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIEZlYXR1cmUgb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtUcmVlfSB0aGlzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJywge1xuICAgICAqICAgICAgc2VsZWN0ZWRDbGFzc05hbWU6ICd0dWktdHJlZS1zZWxlY3RlZCdcbiAgICAgKiAgfSlcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJywge1xuICAgICAqICAgICAgZW5hYmxlQ2xhc3NOYW1lOiB0cmVlLmNsYXNzTmFtZXMudGV4dENsYXNzLFxuICAgICAqICAgICAgZGF0YUtleTogJ3RleHQnLFxuICAgICAqICAgICAgaW5wdXRDbGFzc05hbWU6ICdteUlucHV0J1xuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnRHJhZ2dhYmxlJywge1xuICAgICAqICAgICAgdXNlSGVscGVyOiB0cnVlLFxuICAgICAqICAgICAgaGVscGVyUG9zOiB7eDogNSwgeTogMn0sXG4gICAgICogICAgICByZWplY3RlZFRhZ05hbWVzOiBbJ1VMJywgJ0lOUFVUJywgJ0JVVFRPTiddLFxuICAgICAqICAgICAgcmVqZWN0ZWRDbGFzc05hbWVzOiBbJ25vdERyYWdnYWJsZScsICdub3REcmFnZ2FibGUtMiddXG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdDaGVja2JveCcsIHtcbiAgICAgKiAgICAgIGNoZWNrYm94Q2xhc3NOYW1lOiAndHVpLXRyZWUtY2hlY2tib3gnXG4gICAgICogIH0pO1xuICAgICAqL1xuICAgIGVuYWJsZUZlYXR1cmU6IGZ1bmN0aW9uKGZlYXR1cmVOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBGZWF0dXJlID0gZmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xuXG4gICAgICAgIHRoaXMuZGlzYWJsZUZlYXR1cmUoZmVhdHVyZU5hbWUpO1xuICAgICAgICBpZiAoRmVhdHVyZSkge1xuICAgICAgICAgICAgdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdID0gbmV3IEZlYXR1cmUodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBmYWNpbGl0eSBvZiB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtICdTZWxlY3RhYmxlJywgJ0RyYWdnYWJsZScsICdFZGl0YWJsZSdcbiAgICAgKiBAcmV0dXJucyB7VHJlZX0gdGhpc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0RyYWdnYWJsZScpXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnRWRpdGFibGUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0NoZWNrYm94Jyk7XG4gICAgICovXG4gICAgZGlzYWJsZUZlYXR1cmU6IGZ1bmN0aW9uKGZlYXR1cmVOYW1lKSB7XG4gICAgICAgIHZhciBmZWF0dXJlID0gdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xuXG4gICAgICAgIGlmIChmZWF0dXJlKSB7XG4gICAgICAgICAgICBmZWF0dXJlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59KTtcblxuLyoqXG4gKiBTZXQgYWJzdHJhY3QgYXBpcyB0byB0cmVlIHByb3RvdHlwZVxuICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVOYW1lIC0gRmVhdHVyZSBuYW1lXG4gKiBAcGFyYW0ge29iamVjdH0gZmVhdHVyZSAtIEZlYXR1cmVcbiAqL1xuZnVuY3Rpb24gc2V0QWJzdHJhY3RBUElzKGZlYXR1cmVOYW1lLCBmZWF0dXJlKSB7XG4gICAgdmFyIG1lc3NhZ2VOYW1lID0gJ0lOVkFMSURfQVBJXycgKyBmZWF0dXJlTmFtZS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICBhcGlMaXN0ID0gZmVhdHVyZS5nZXRBUElMaXN0ID8gZmVhdHVyZS5nZXRBUElMaXN0KCkgOiBbXTtcblxuICAgIHNuaXBwZXQuZm9yRWFjaChhcGlMaXN0LCBmdW5jdGlvbihhcGkpIHtcbiAgICAgICAgVHJlZS5wcm90b3R5cGVbYXBpXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2VzW21lc3NhZ2VOYW1lXSB8fCBtZXNzYWdlcy5JTlZBTElEX0FQSSk7XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5zbmlwcGV0LmZvckVhY2goZmVhdHVyZXMsIGZ1bmN0aW9uKEZlYXR1cmUsIG5hbWUpIHtcbiAgICBzZXRBYnN0cmFjdEFQSXMobmFtZSwgRmVhdHVyZSk7XG59KTtcbnNuaXBwZXQuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWUpO1xubW9kdWxlLmV4cG9ydHMgPSBUcmVlO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFVwZGF0ZSB2aWV3IGFuZCBjb250cm9sIHRyZWUgZGF0YVxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBUcmVlTm9kZSA9IHJlcXVpcmUoJy4vdHJlZU5vZGUnKTtcblxudmFyIGV4dGVuZCA9IHR1aS51dGlsLmV4dGVuZCxcbiAgICBrZXlzID0gdHVpLnV0aWwua2V5cyxcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaCxcbiAgICBtYXAgPSB0dWkudXRpbC5tYXA7XG5cbi8qKlxuICogVHJlZSBtb2RlbFxuICogQGNvbnN0cnVjdG9yIFRyZWVNb2RlbFxuICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIERhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9ucyBmb3IgZGVmYXVsdFN0YXRlIGFuZCBub2RlSWRQcmVmaXhcbiAqKi9cbnZhciBUcmVlTW9kZWwgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVNb2RlbC5wcm90b3R5cGUgKi97IC8qIGVzbGludC1kaXNhYmxlICovXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIFRyZWVOb2RlLnNldElkUHJlZml4KG9wdGlvbnMubm9kZUlkUHJlZml4KTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCBzdGF0ZSBvZiBub2RlXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm5vZGVEZWZhdWx0U3RhdGUgPSBvcHRpb25zLm5vZGVEZWZhdWx0U3RhdGU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJvb3Qgbm9kZVxuICAgICAgICAgKiBAdHlwZSB7VHJlZU5vZGV9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvb3ROb2RlID0gbmV3IFRyZWVOb2RlKHtcbiAgICAgICAgICAgIHN0YXRlOiAnb3BlbmVkJ1xuICAgICAgICB9LCBudWxsKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJlZSBoYXNoIGhhdmluZyBhbGwgbm9kZXNcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBUcmVlTm9kZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWVIYXNoID0ge307XG5cbiAgICAgICAgdGhpcy5fc2V0RGF0YShkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHByZWZpeCBvZiBub2RlIGlkXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUHJlZml4XG4gICAgICovXG4gICAgZ2V0Tm9kZUlkUHJlZml4OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFRyZWVOb2RlLmlkUHJlZml4O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbW9kZWwgd2l0aCB0cmVlIGRhdGFcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXG4gICAgICovXG4gICAgX3NldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLnJvb3ROb2RlLFxuICAgICAgICAgICAgcm9vdElkID0gcm9vdC5nZXRJZCgpO1xuXG4gICAgICAgIHRoaXMudHJlZUhhc2hbcm9vdElkXSA9IHJvb3Q7XG4gICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCByb290KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSB0cmVlIGhhc2ggZnJvbSBkYXRhIGFuZCBwYXJlbnROb2RlXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIFRyZWUgZGF0YVxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IHBhcmVudCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VUcmVlSGFzaDogZnVuY3Rpb24oZGF0YSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHBhcmVudC5nZXRJZCgpLFxuICAgICAgICAgICAgaWRzID0gW107XG5cbiAgICAgICAgZm9yRWFjaChkYXRhLCBmdW5jdGlvbihkYXR1bSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuRGF0YSA9IGRhdHVtLmNoaWxkcmVuLFxuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9jcmVhdGVOb2RlKGRhdHVtLCBwYXJlbnRJZCksXG4gICAgICAgICAgICAgICAgbm9kZUlkID0gbm9kZS5nZXRJZCgpO1xuXG4gICAgICAgICAgICBpZHMucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgdGhpcy50cmVlSGFzaFtub2RlSWRdID0gbm9kZTtcbiAgICAgICAgICAgIHBhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goY2hpbGRyZW5EYXRhLCBub2RlKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGlkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5vZGVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZURhdGEgLSBEYXR1bSBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IGlkXG4gICAgICogQHJldHVybnMge1RyZWVOb2RlfSBUcmVlTm9kZVxuICAgICAqL1xuICAgIF9jcmVhdGVOb2RlOiBmdW5jdGlvbihub2RlRGF0YSwgcGFyZW50SWQpIHtcbiAgICAgICAgbm9kZURhdGEgPSBleHRlbmQoe1xuICAgICAgICAgICAgc3RhdGU6IHRoaXMubm9kZURlZmF1bHRTdGF0ZVxuICAgICAgICB9LCBub2RlRGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBUcmVlTm9kZShub2RlRGF0YSwgcGFyZW50SWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hpbGRyZW5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/QXJyYXkuPFRyZWVOb2RlPn0gY2hpbGRyZW5cbiAgICAgKi9cbiAgICBnZXRDaGlsZHJlbjogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcblxuICAgICAgICBpZiAoIWNoaWxkSWRzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXAoY2hpbGRJZHMsIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE5vZGUoY2hpbGRJZCk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hpbGQgaWRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P0FycmF5LjxzdHJpbmc+fSBDaGlsZCBpZHNcbiAgICAgKi9cbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlLmdldENoaWxkSWRzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbnVtYmVyIG9mIG5vZGVzXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIG51bWJlciBvZiBub2Rlc1xuICAgICAqL1xuICAgIGdldENvdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGtleXModGhpcy50cmVlSGFzaCkubGVuZ3RoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbGFzdCBkZXB0aFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBsYXN0IGRlcHRoXG4gICAgICovXG4gICAgZ2V0TGFzdERlcHRoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRlcHRocyA9IG1hcCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXREZXB0aChub2RlLmdldElkKCkpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgZGVwdGhzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJucyB7P1RyZWVOb2RlfSBOb2RlXG4gICAgICovXG4gICAgZ2V0Tm9kZTogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJlZUhhc2hbaWRdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGVwdGggZnJvbSBub2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJucyB7P251bWJlcn0gRGVwdGhcbiAgICAgKi9cbiAgICBnZXREZXB0aDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxuICAgICAgICAgICAgZGVwdGggPSAwLFxuICAgICAgICAgICAgcGFyZW50O1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgZGVwdGggKz0gMTtcbiAgICAgICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShwYXJlbnQuZ2V0UGFyZW50SWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVwdGg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBwYXJlbnQgaWQgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P3N0cmluZ30gUGFyZW50IGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0UGFyZW50SWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZCB0byByZW1vdmVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihpZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxuICAgICAgICAgICAgcGFyZW50O1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XG5cbiAgICAgICAgZm9yRWFjaChub2RlLmdldENoaWxkSWRzKCksIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNoaWxkSWQsIHRydWUpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGRJZChpZCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnRyZWVIYXNoW2lkXTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIHBhcmVudC5nZXRJZCgpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgbm9kZShzKS5cbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3LWRhdGFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBOZXcgYWRkZWQgbm9kZSBpZHNcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5nZXROb2RlKHBhcmVudElkKSB8fCB0aGlzLnJvb3ROb2RlLFxuICAgICAgICAgICAgaWRzO1xuXG4gICAgICAgIGRhdGEgPSBbXS5jb25jYXQoZGF0YSk7XG4gICAgICAgIGlkcyA9IHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCBwYXJlbnQpO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgcGFyZW50LmdldElkKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHByb3BzIC0gUHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICBzZXROb2RlRGF0YTogZnVuY3Rpb24oaWQsIHByb3BzLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8ICFwcm9wcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5zZXREYXRhKHByb3BzKTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fSBuYW1lcyAtIE5hbWVzIG9mIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgcmVtb3ZlTm9kZURhdGE6IGZ1bmN0aW9uKGlkLCBuYW1lcywgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xuXG4gICAgICAgIGlmICghbm9kZSB8fCAhbmFtZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0dWkudXRpbC5pc0FycmF5KG5hbWVzKSkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhLmFwcGx5KG5vZGUsIG5hbWVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRGF0YShuYW1lcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGEgbm9kZSB0byBuZXcgcGFyZW50J3MgY2hpbGRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIG9yaWdpbmFsUGFyZW50LCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbmV3UGFyZW50ID0gdGhpcy5nZXROb2RlKG5ld1BhcmVudElkKSB8fCB0aGlzLnJvb3ROb2RlO1xuICAgICAgICBuZXdQYXJlbnRJZCA9IG5ld1BhcmVudC5nZXRJZCgpO1xuICAgICAgICBvcmlnaW5hbFBhcmVudElkID0gbm9kZS5nZXRQYXJlbnRJZCgpO1xuICAgICAgICBvcmlnaW5hbFBhcmVudCA9IHRoaXMuZ2V0Tm9kZShvcmlnaW5hbFBhcmVudElkKTtcblxuICAgICAgICBpZiAobm9kZUlkID09PSBuZXdQYXJlbnRJZCB8fCB0aGlzLmNvbnRhaW5zKG5vZGVJZCwgbmV3UGFyZW50SWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3JpZ2luYWxQYXJlbnQucmVtb3ZlQ2hpbGRJZChub2RlSWQpO1xuICAgICAgICBub2RlLnNldFBhcmVudElkKG5ld1BhcmVudElkKTtcbiAgICAgICAgbmV3UGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ21vdmUnLCBub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGEgbm9kZSBpcyBhIGFuY2VzdG9yIG9mIGFub3RoZXIgbm9kZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBJZCBvZiBhIG5vZGUgdGhhdCBtYXkgY29udGFpbiB0aGUgb3RoZXIgbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZWRJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBiZSBjb250YWluZWQgYnkgdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciBhIG5vZGUgY29udGFpbnMgYW5vdGhlciBub2RlXG4gICAgICovXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGNvbnRhaW5lcklkLCBjb250YWluZWRJZCkge1xuICAgICAgICB2YXIgcGFyZW50SWQgPSB0aGlzLmdldFBhcmVudElkKGNvbnRhaW5lZElkKSxcbiAgICAgICAgICAgIGlzQ29udGFpbmVkID0gZmFsc2U7XG5cbiAgICAgICAgd2hpbGUgKCFpc0NvbnRhaW5lZCAmJiBwYXJlbnRJZCkge1xuICAgICAgICAgICAgaXNDb250YWluZWQgPSAoY29udGFpbmVySWQgPT09IHBhcmVudElkKTtcbiAgICAgICAgICAgIHBhcmVudElkID0gdGhpcy5nZXRQYXJlbnRJZChwYXJlbnRJZCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXNDb250YWluZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNvcnQgbm9kZXNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIC0gQ29tcGFyYXRvciBmdW5jdGlvblxuICAgICAqL1xuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcbiAgICAgICAgdGhpcy5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRDaGlsZHJlbihub2RlSWQpLFxuICAgICAgICAgICAgICAgIGNoaWxkSWRzO1xuXG4gICAgICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuLnNvcnQoY29tcGFyYXRvcik7XG5cbiAgICAgICAgICAgICAgICBjaGlsZElkcyA9IG1hcChjaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkLmdldElkKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbm9kZS5yZXBsYWNlQ2hpbGRJZHMoY2hpbGRJZHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgZGF0YSAoYWxsKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMgez9vYmplY3R9IE5vZGUgZGF0YVxuICAgICAqL1xuICAgIGdldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0QWxsRGF0YSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIG5vZGVzLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxuICAgICAqL1xuICAgIGVhY2hBbGw6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XG5cbiAgICAgICAgZm9yRWFjaCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVlLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIGRlc2NlbmRhbnRzIG9mIGEgbm9kZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxuICAgICAqL1xuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCkgeyAvL2RlcHRoLWZpcnN0XG4gICAgICAgIHZhciBzdGFjaywgbm9kZUlkLCBub2RlO1xuXG4gICAgICAgIG5vZGUgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdGFjayA9IG5vZGUuZ2V0Q2hpbGRJZHMoKTtcblxuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xuICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICBub2RlSWQgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcbiAgICAgICAgICAgIGl0ZXJhdGVlLmNhbGwoY29udGV4dCwgbm9kZSwgbm9kZUlkKTtcblxuICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5jb25jYXQobm9kZS5nZXRDaGlsZElkcygpKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVHJlZU1vZGVsKTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU1vZGVsO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RhdGVzID0gcmVxdWlyZSgnLi9jb25zdHMvc3RhdGVzJykubm9kZSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbnZhciBsYXN0SW5kZXggPSAwLFxuICAgIGdldE5leHRJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5kZXggPSBsYXN0SW5kZXg7XG4gICAgICAgIGxhc3RJbmRleCArPSAxO1xuXG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9LFxuICAgIFJFU0VSVkVEX1BST1BFUlRJRVMgPSB7XG4gICAgICAgIGlkOiAnJyxcbiAgICAgICAgc3RhdGU6ICdzZXRTdGF0ZScsXG4gICAgICAgIGNoaWxkcmVuOiAnJ1xuICAgIH0sXG4gICAgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG5cbi8qKlxuICogVHJlZU5vZGVcbiAqIEBDb25zdHJ1Y3RvciBUcmVlTm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG5vZGVEYXRhIC0gTm9kZSBkYXRhXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIFBhcmVudCBub2RlIGlkXG4gKi9cbnZhciBUcmVlTm9kZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU5vZGUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCBwcmVmaXggb2YgaWRcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIFByZWZpeCBvZiBpZFxuICAgICAgICAgKi9cbiAgICAgICAgc2V0SWRQcmVmaXg6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICAgICAgdGhpcy5pZFByZWZpeCA9IHByZWZpeCB8fCB0aGlzLmlkUHJlZml4O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcmVmaXggb2YgaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGlkUHJlZml4OiAnJ1xuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24obm9kZURhdGEsIHBhcmVudElkKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9pZCA9IHRoaXMuY29uc3RydWN0b3IuaWRQcmVmaXggKyBnZXROZXh0SW5kZXgoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFyZW50IG5vZGUgaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3BhcmVudElkID0gcGFyZW50SWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgICAgICogQHR5cGUge0FycmF5LjxudW1iZXI+fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fY2hpbGRJZHMgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBkYXRhXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9kYXRhID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgc3RhdGVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLkNMT1NFRDtcblxuICAgICAgICB0aGlzLnNldERhdGEobm9kZURhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcmVzZXJ2ZWQgcHJvcGVydGllcyBmcm9tIGRhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIE5vZGUgZGF0YVxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IE5vZGUgZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJlc2VydmVkUHJvcGVydGllczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoT3duUHJvcGVydGllcyhSRVNFUlZFRF9QUk9QRVJUSUVTLCBmdW5jdGlvbihzZXR0ZXIsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbbmFtZV07XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiBzZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3NldHRlcl0odmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGRhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgc3RhdGVcbiAgICAgKiBAYXBpXG4gICAgICovXG4gICAgdG9nZ2xlU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdGUgPT09IHN0YXRlcy5DTE9TRUQpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLk9QRU5FRDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLkNMT1NFRDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgc3RhdGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gU3RhdGUgb2Ygbm9kZSAoJ2Nsb3NlZCcsICdvcGVuZWQnKVxuICAgICAqL1xuICAgIHNldFN0YXRlOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICBzdGF0ZSA9IFN0cmluZyhzdGF0ZSk7XG4gICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzW3N0YXRlLnRvVXBwZXJDYXNlKCldIHx8IHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc3RhdGVcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gc3RhdGUgKCdvcGVuZWQnIG9yICdjbG9zZWQnKVxuICAgICAqL1xuICAgIGdldFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gTm9kZSBpZFxuICAgICAqL1xuICAgIGdldElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcGFyZW50IGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFBhcmVudCBub2RlIGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50SWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIHNldFBhcmVudElkOiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXBsYWNlIGNoaWxkSWRzXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gY2hpbGRJZHMgLSBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICovXG4gICAgcmVwbGFjZUNoaWxkSWRzOiBmdW5jdGlvbihjaGlsZElkcykge1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IGNoaWxkSWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj59IElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKi9cbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5zbGljZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICovXG4gICAgYWRkQ2hpbGRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5fY2hpbGRJZHM7XG5cbiAgICAgICAgaWYgKHR1aS51dGlsLmluQXJyYXkoY2hpbGRJZHMsIGlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNoaWxkSWRzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICByZW1vdmVDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB1dGlsLnJlbW92ZUl0ZW1Gcm9tQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBQcm9wZXJ0eSBuYW1lIG9mIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7Kn0gRGF0YVxuICAgICAqL1xuICAgIGdldERhdGE6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhbGwgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBEYXRhXG4gICAgICovXG4gICAgZ2V0QWxsRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5leHRlbmQoe30sIHRoaXMuX2RhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIERhdGEgZm9yIGFkZGluZ1xuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZGF0YSA9IHRoaXMuX3NldFJlc2VydmVkUHJvcGVydGllcyhkYXRhKTtcbiAgICAgICAgdHVpLnV0aWwuZXh0ZW5kKHRoaXMuX2RhdGEsIGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0gey4uLnN0cmluZ30gbmFtZXMgLSBOYW1lcyBvZiBkYXRhXG4gICAgICovXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2hBcnJheShhcmd1bWVudHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IC0gV2hldGhlciB0aGlzIG5vZGUgaGFzIGEgcHJvdmlkZWQgY2hpbGQgaWQuXG4gICAgICovXG4gICAgaGFzQ2hpbGQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiBpbkFycmF5KGlkLCB0aGlzLl9jaGlsZElkcykgIT09IC0xO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIG5vZGUgaXMgbGVhZi5cbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IE5vZGUgaXMgbGVhZiBvciBub3QuXG4gICAgICovXG4gICAgaXNMZWFmOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkSWRzLmxlbmd0aCA9PT0gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBub2RlIGlzIHJvb3QuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIHJvb3Qgb3Igbm90LlxuICAgICAqL1xuICAgIGlzUm9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5pc0ZhbHN5KHRoaXMuX3BhcmVudElkKTtcbiAgICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU5vZGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgaXNVbmRlZmluZWQgPSB0dWkudXRpbC5pc1VuZGVmaW5lZCxcbiAgICBwaWNrID0gdHVpLnV0aWwucGljayxcbiAgICB0ZW1wbGF0ZU1hc2tSZSA9IC9cXHtcXHsoLis/KX19L2dpLFxuICAgIGlzVmFsaWREb3ROb3RhdGlvblJlID0gL15cXHcrKD86XFwuXFx3KykqJC8sXG4gICAgaXNWYWxpZERvdE5vdGF0aW9uID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHJldHVybiBpc1ZhbGlkRG90Tm90YXRpb25SZS50ZXN0KHN0cik7XG4gICAgfSxcbiAgICBpc0FycmF5ID0gdHVpLnV0aWwuaXNBcnJheVNhZmU7XG5cbnZhciB1dGlsID0ge1xuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaXJzdCBzcGVjaWZpZWQgaXRlbSBmcm9tIGFycmF5LCBpZiBpdCBleGlzdHNcbiAgICAgKiBAcGFyYW0geyp9IGl0ZW0gSXRlbSB0byBsb29rIGZvclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFyciBBcnJheSB0byBxdWVyeVxuICAgICAqL1xuICAgIHJlbW92ZUl0ZW1Gcm9tQXJyYXk6IGZ1bmN0aW9uKGl0ZW0sIGFycikge1xuICAgICAgICB2YXIgaW5kZXggPSBhcnIubGVuZ3RoIC0gMTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0gPT09IGFycltpbmRleF0pIHtcbiAgICAgICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZGV4IC09IDE7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNsYXNzbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBDbGFzc25hbWVcbiAgICAgKi9cbiAgICBhZGRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NOYW1lID09PSAnJykge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoIXV0aWwuaGFzQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgKz0gJyAnICsgY2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjbGFzc25hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIC0gQ2xhc3NuYW1lXG4gICAgICovXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgb3JpZ2luYWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpLFxuICAgICAgICAgICAgYXJyLCBpbmRleDtcblxuICAgICAgICBpZiAoIW9yaWdpbmFsQ2xhc3NOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnIgPSBvcmlnaW5hbENsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgICAgICBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoY2xhc3NOYW1lLCBhcnIpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gYXJyLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB0byBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFkZFxuICAgICAqL1xuICAgIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBmcm9tIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVtb3ZlXG4gICAgICovXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IEV2ZW50IHRhcmdldFxuICAgICAqL1xuICAgIGdldFRhcmdldDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0O1xuICAgICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgICAgIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgSFRNTEVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBDbGFzcyBuYW1lXG4gICAgICovXG4gICAgZ2V0Q2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgJiYgZWxlbWVudC5nZXRBdHRyaWJ1dGUgJiZcbiAgICAgICAgICAgIChlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCBlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3NOYW1lJykgfHwgJycpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGUgZWxlbWVudCBoYXMgc3BlY2lmaWMgY2xhc3Mgb3Igbm90XG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3MgdG8gZmluZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSBlbGVtZW50IGhhcyB0aGUgY2xhc3NcbiAgICAgKi9cbiAgICBoYXNDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBlbENsYXNzTmFtZSA9IHV0aWwuZ2V0Q2xhc3MoZWxlbWVudCk7XG5cbiAgICAgICAgcmV0dXJuIGVsQ2xhc3NOYW1lLmluZGV4T2YoY2xhc3NOYW1lKSA+IC0xO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGVsZW1lbnQgYnkgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3NcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPEhUTUxFbGVtZW50Pn0gRWxlbWVudHNcbiAgICAgKi9cbiAgICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lOiBmdW5jdGlvbih0YXJnZXQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgYWxsLCBmaWx0ZXJlZDtcblxuICAgICAgICBpZiAodGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFsbCA9IHR1aS51dGlsLnRvQXJyYXkodGFyZ2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJykpO1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0dWkudXRpbC5maWx0ZXIoYWxsLCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lIHx8ICcnO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIChjbGFzc05hbWVzLmluZGV4T2YoY2xhc3NOYW1lKSAhPT0gLTEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHdoZXRoZXIgdGhlIGNsaWNrIGV2ZW50IGJ5IHJpZ2h0IGJ1dHRvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGNsaWNrIGV2ZW50IGJ5IHJpZ2h0IGJ1dHRvblxuICAgICAqL1xuICAgIGlzUmlnaHRCdXR0b246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB1dGlsLl9nZXRCdXR0b24oZXZlbnQpID09PSAyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBwcm9wZXJ0eSBleGlzdCBvciBub3RcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwcm9wcyBBIHByb3BlcnR5XG4gICAgICogQHJldHVybnMge3N0cmluZ3xib29sZWFufSBQcm9wZXJ0eSBuYW1lIG9yIGZhbHNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgdXNlclNlbGVjdFByb3BlcnR5ID0gdXRpbC50ZXN0UHJvcChbXG4gICAgICogICAgICd1c2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ1dlYmtpdFVzZXJTZWxlY3QnLFxuICAgICAqICAgICAnT1VzZXJTZWxlY3QnLFxuICAgICAqICAgICAnTW96VXNlclNlbGVjdCcsXG4gICAgICogICAgICdtc1VzZXJTZWxlY3QnXG4gICAgICogXSk7XG4gICAgICovXG4gICAgdGVzdFByb3A6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSxcbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IGZhbHNlO1xuXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGNvbnNpc3RlbnQtcmV0dXJuICovXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2gocHJvcHMsIGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgICAgIGlmIChwcm9wIGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgY29uc2lzdGVudC1yZXR1cm4gKi9cblxuICAgICAgICByZXR1cm4gcHJvcGVydHlOYW1lO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IGRlZmF1bHQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGh0bWwgZnJvbSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2UgLSBUZW1wbGF0ZSBodG1sXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gVGVtcGxhdGUgZGF0YVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGh0bWxcbiAgICAgKi9cbiAgICByZW5kZXJUZW1wbGF0ZTogZnVuY3Rpb24oc291cmNlLCBwcm9wcykge1xuICAgICAgICBmdW5jdGlvbiBwaWNrVmFsdWUobmFtZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBwaWNrLmFwcGx5KG51bGwsIFtwcm9wc10uY29uY2F0KG5hbWVzKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291cmNlLnJlcGxhY2UodGVtcGxhdGVNYXNrUmUsIGZ1bmN0aW9uKG1hdGNoLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWU7XG5cbiAgICAgICAgICAgIGlmIChpc1ZhbGlkRG90Tm90YXRpb24obmFtZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBpY2tWYWx1ZShuYW1lLnNwbGl0KCcuJykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4oJyAnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXphdGlvbiBmb3IgZXZlbnQgYnV0dG9uIHByb3BlcnR5XG4gICAgICogMDogRmlyc3QgbW91c2UgYnV0dG9uLCAyOiBTZWNvbmQgbW91c2UgYnV0dG9uLCAxOiBDZW50ZXIgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7P251bWJlcn0gYnV0dG9uIHR5cGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRCdXR0b246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBidXR0b24sXG4gICAgICAgICAgICBwcmltYXJ5ID0gJzAsMSwzLDUsNycsXG4gICAgICAgICAgICBzZWNvbmRhcnkgPSAnMiw2JyxcbiAgICAgICAgICAgIHdoZWVsID0gJzQnO1xuXG4gICAgICAgIGlmIChkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5oYXNGZWF0dXJlKCdNb3VzZUV2ZW50cycsICcyLjAnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGV2ZW50LmJ1dHRvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJ1dHRvbiA9IFN0cmluZyhldmVudC5idXR0b24pO1xuICAgICAgICBpZiAocHJpbWFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0gZWxzZSBpZiAoc2Vjb25kYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMjtcbiAgICAgICAgfSBlbHNlIGlmICh3aGVlbC5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=
