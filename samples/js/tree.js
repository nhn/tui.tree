(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var Tree = require('./src/js/tree');
var component = tui.util.defineNamespace('tui.component');
component.Tree = Tree;

},{"./src/js/tree":11}],2:[function(require,module,exports){
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

},{"../util.js":14}],7:[function(require,module,exports){
'use strict';
var util = require('./../util');

var API_LIST = [];

var ContextMenu = tui.util.defineClass(/** @lends ContextMenu.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf ContextMenu
         * @returns {Array.<string>} API list of ContextMenu
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },

    init: function(tree, menus) { /*eslint-enable*/
        this.tree = tree;
        this.isOpened = false;
        this.layer = document.createElement('DIV');

        this.makeLayer(menus);
        this.attachEvent();
    },

    makeLayer: function() {
        var style = this.layer.style;

        style.position = 'absolute';
        style.backgroundColor = 'white';
        style.border = '1px solid black';
        this.layer.innerHTML = 'test';
    },

    attachEvent: function() {
        var tree = this.tree;

        tree.on('_contextMenu', function(event) {
            var nodeId = tree.getNodeIdFromElement(util.getTarget(event)),
                layer = this.layer,
                self = this;

            event.preventDefault();
            layer.style.top = event.clientY + 10 + 'px';
            layer.style.left = event.clientX + 10 + 'px';

            if (!this.isOpened) {
                this.isOpened = true;
                document.body.appendChild(layer);

                util.addEventListener(document.body, 'click', function closeLayer() {
                    self.isOpened = false;
                    document.body.removeChild(layer);
                    util.removeEventListener(document.body, 'click', closeLayer);
                });
            }

            /**
             * @api
             * @events Tree#contextMenu
             * @param {object} data - Data
             *  @param {data.nodeId} nodeId - selected node id
             */
            tree.fire('openContextMenu', {
                nodeId: nodeId
            });
        }, this);
    },

    destroy: function() {
        this.tree.off(this);
        this.tree.off('_contextMenu');
    }
});

module.exports = ContextMenu;

},{"./../util":14}],8:[function(require,module,exports){
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

},{"./../util":14}],9:[function(require,module,exports){
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

},{"./../util":14}],10:[function(require,module,exports){
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

},{"./../util":14}],11:[function(require,module,exports){
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
    Checkbox = require('./features/checkbox'),
    ContextMenu = require('./features/contextMenu');

var nodeStates = states.node,
    features = {
        Selectable: Selectable,
        Draggable: Draggable,
        Editable: Editable,
        Checkbox: Checkbox,
        ContextMenu: ContextMenu
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
        util.addEventListener(this.rootElement, 'contextmenu', snippet.bind(this._onContextMenu, this));
    },

    _onContextMenu: function(event) {
        this.fire('_contextMenu', event);
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
     *  })
     *  .enableFeature('ContextMenu, {
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
     *  .disableFeature('Checkbox')
     *  .disableFeature('ContextMenu');
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

},{"./consts/defaultOption":2,"./consts/messages":3,"./consts/outerTemplate":4,"./consts/states":5,"./features/checkbox":6,"./features/contextMenu":7,"./features/draggable":8,"./features/editable":9,"./features/selectable":10,"./treeModel":12,"./util":14}],12:[function(require,module,exports){
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

},{"./treeNode":13}],13:[function(require,module,exports){
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

},{"./consts/states":5,"./util":14}],14:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMvZGVmYXVsdE9wdGlvbi5qcyIsInNyYy9qcy9jb25zdHMvbWVzc2FnZXMuanMiLCJzcmMvanMvY29uc3RzL291dGVyVGVtcGxhdGUuanMiLCJzcmMvanMvY29uc3RzL3N0YXRlcy5qcyIsInNyYy9qcy9mZWF0dXJlcy9jaGVja2JveC5qcyIsInNyYy9qcy9mZWF0dXJlcy9jb250ZXh0TWVudS5qcyIsInNyYy9qcy9mZWF0dXJlcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvZWRpdGFibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy90cmVlLmpzIiwic3JjL2pzL3RyZWVNb2RlbC5qcyIsInNyYy9qcy90cmVlTm9kZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG52YXIgVHJlZSA9IHJlcXVpcmUoJy4vc3JjL2pzL3RyZWUnKTtcbnZhciBjb21wb25lbnQgPSB0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQnKTtcbmNvbXBvbmVudC5UcmVlID0gVHJlZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNYWtlIGNsYXNzIG5hbWVzXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IC0gUHJlZml4IG9mIGNsYXNzIG5hbWVcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGtleXMgLSBLZXlzIG9mIGNsYXNzIG5hbWVzXG4gKiBAcmV0dXJucyB7b2JqZWN0LjxzdHJpbmcsIHN0cmluZz59IENsYXNzIG5hbWVzIG1hcFxuICovXG5mdW5jdGlvbiBtYWtlQ2xhc3NOYW1lcyhwcmVmaXgsIGtleXMpIHtcbiAgICB2YXIgb2JqID0ge307XG4gICAgdHVpLnV0aWwuZm9yRWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgb2JqW2tleSArICdDbGFzcyddID0gcHJlZml4ICsga2V5O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBBIGRlZmF1bHQgdmFsdWVzIGZvciB0cmVlXG4gKiBAY29uc3RcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJvcGVydHkge3N0cmluZ30gbm9kZURlZmF1bHRTdGF0ZSAtIE5vZGUgc3RhdGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBub2RlSWRQcmVmaXggLSBOb2RlIGlkIHByZWZpeFxuICogQHByb3BlcnR5IHtvYmplY3R9IHN0YXRlTGFiZWwgLSBTdGF0ZSBsYWJlbCBpbiBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN0YXRlTGFiZWwub3BlbmVkIC0gJy0nXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN0YXRlTGFiZWwuY2xvc2VkIC0gJysnXG4gKiBAcHJvcGVydHkge29iamVjdH0gdGVtcGxhdGUgLSBUZW1wbGF0ZSBodG1sIGZvciB0aGUgbm9kZXMuXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHRlbXBsYXRlLmludGVybmFsTm9kZSAtIFRlbXBsYXRlIGh0bWwgZm9yIGludGVybmFsIG5vZGUuXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHRlbXBsYXRlLmxlYWZOb2RlIC0gVGVtcGxhdGUgaHRtbCBmb3IgbGVhZiBub2RlLlxuICogQHByb3BlcnR5IHtvYmplY3R9IGNsYXNzTmFtZXMgLSBDbGFzcyBuYW1lcyBvZiBlbGVtZW50cyBpbiB0cmVlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IG9wZW5lZENsYXNzIC0gQ2xhc3MgbmFtZSBmb3Igb3BlbmVkIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gY2xvc2VkQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciBjbG9zZWQgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBub2RlQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IGxlYWZDbGFzcyAtIENsYXNzIG5hbWUgZm9yIGxlYWYgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdWJ0cmVlQ2xhc3MgIC0gQ2xhc3MgbmFtZSBmb3Igc3VidHJlZSBpbiBpbnRlcm5hbCBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHRvZ2dsZUJ0bkNsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgdG9nZ2xlIGJ1dHRvbiBpbiBpbnRlcm5hbCBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHRleHRDbGFzcyAtIENsYXNzIG5hbWUgZm9yIHRleHQgZWxlbWVudCBpbiBhIG5vZGVcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbm9kZURlZmF1bHRTdGF0ZTogJ2Nsb3NlZCcsXG4gICAgc3RhdGVMYWJlbHM6IHtcbiAgICAgICAgb3BlbmVkOiAnLScsXG4gICAgICAgIGNsb3NlZDogJysnXG4gICAgfSxcbiAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLScsXG4gICAgY2xhc3NOYW1lczogbWFrZUNsYXNzTmFtZXMoJ3R1aS10cmVlLScsIFtcbiAgICAgICAgJ25vZGUnLFxuICAgICAgICAnbGVhZicsXG4gICAgICAgICdvcGVuZWQnLFxuICAgICAgICAnY2xvc2VkJyxcbiAgICAgICAgJ3N1YnRyZWUnLFxuICAgICAgICAndG9nZ2xlQnRuJyxcbiAgICAgICAgJ3RleHQnXG4gICAgXSksXG4gICAgdGVtcGxhdGU6IHtcbiAgICAgICAgaW50ZXJuYWxOb2RlOlxuICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3tzdGF0ZUxhYmVsfX08L2J1dHRvbj4nICtcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e3N1YnRyZWVDbGFzc319XCI+e3tjaGlsZHJlbn19PC91bD4nLFxuICAgICAgICBsZWFmTm9kZTpcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nXG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNZXNzYWdlcyBmb3IgdHJlZVxuICogQHR5cGUge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBJTlZBTElEX1JPT1RfRUxFTUVOVDogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFJvb3QgZWxlbWVudCBpcyBpbnZhbGlkLicsXG4gICAgSU5WQUxJRF9BUEk6ICdcInR1aS1jb21wb25lbnQtdHJlZVwiOiBJTlZBTElEX0FQSScsXG4gICAgSU5WQUxJRF9BUElfU0VMRUNUQUJMRTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiU2VsZWN0YWJsZVwiIGlzIG5vdCBlbmFibGVkLicsXG4gICAgSU5WQUxJRF9BUElfRURJVEFCTEU6ICdcInR1aS1jb21wb25lbnQtdHJlZVwiOiBUaGUgZmVhdHVyZS1cIkVkaXRhYmxlXCIgaXMgbm90IGVuYWJsZWQuJyxcbiAgICBJTlZBTElEX0FQSV9EUkFHR0FCTEU6ICdcInR1aS1jb21wb25lbnQtdHJlZVwiOiBUaGUgZmVhdHVyZS1cIkRyYWdnYWJsZVwiIGlzIG5vdCBlbmFibGVkLicsXG4gICAgSU5WQUxJRF9BUElfQ0hFQ0tCT1g6ICdcInR1aS1jb21wb25lbnQtdHJlZVwiOiBUaGUgZmVhdHVyZS1cIkNoZWNrYm94XCIgaXMgbm90IGVuYWJsZWQuJ1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBPdXRlciB0ZW1wbGF0ZVxuICogQHR5cGUge3tpbnRlcm5hbE5vZGU6IHN0cmluZywgbGVhZk5vZGU6IHN0cmluZ319XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIElOVEVSTkFMX05PREU6XG4gICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInt7bm9kZUNsYXNzfX0ge3tzdGF0ZUNsYXNzfX1cIj4nICtcbiAgICAgICAgICAgICd7e2lubmVyVGVtcGxhdGV9fScgK1xuICAgICAgICAnPC9saT4nLFxuICAgIExFQUZfTk9ERTpcbiAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwie3tub2RlQ2xhc3N9fSB7e2xlYWZDbGFzc319XCI+JyArXG4gICAgICAgICAgICAne3tpbm5lclRlbXBsYXRlfX0nICtcbiAgICAgICAgJzwvbGk+J1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBTdGF0ZXMgaW4gdHJlZVxuICogQHR5cGUge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvKipcbiAgICAgKiBTdGF0ZXMgb2Ygbm9kZVxuICAgICAqIEB0eXBlIHt7T1BFTkVEOiBzdHJpbmcsIENMT1NFRDogc3RyaW5nfX1cbiAgICAgKi9cbiAgICBub2RlOiB7XG4gICAgICAgIE9QRU5FRDogJ29wZW5lZCcsXG4gICAgICAgIENMT1NFRDogJ2Nsb3NlZCdcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcbnZhciBBUElfTElTVCA9IFtcbiAgICAnY2hlY2snLFxuICAgICd1bmNoZWNrJyxcbiAgICAndG9nZ2xlQ2hlY2snLFxuICAgICdpc0NoZWNrZWQnLFxuICAgICdpc0luZGV0ZXJtaW5hdGUnLFxuICAgICdpc1VuY2hlY2tlZCcsXG4gICAgJ2dldENoZWNrZWRMaXN0JyxcbiAgICAnZ2V0VG9wQ2hlY2tlZExpc3QnLFxuICAgICdnZXRCb3R0b21DaGVja2VkTGlzdCdcbl07XG5cbi8qKlxuICogQ2hlY2tib3ggdHJpLXN0YXRlc1xuICovXG52YXIgU1RBVEVfQ0hFQ0tFRCA9IDEsXG4gICAgU1RBVEVfVU5DSEVDS0VEID0gMixcbiAgICBTVEFURV9JTkRFVEVSTUlOQVRFID0gMyxcbiAgICBEQVRBX0tFWV9GT1JfQ0hFQ0tCT1hfU1RBVEUgPSAnX19DaGVja0JveFN0YXRlX18nLFxuICAgIERBVEEgPSB7fTtcblxudmFyIGZpbHRlciA9IHR1aS51dGlsLmZpbHRlcixcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaDtcbi8qKlxuICogU2V0IHRoZSBjaGVja2JveC1hcGlcbiAqIEBjbGFzcyBDaGVja2JveFxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uIC0gT3B0aW9uXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbi5jaGVja2JveENsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBjaGVja2JveCBlbGVtZW50XG4gKi9cbnZhciBDaGVja2JveCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgQ2hlY2tib3gucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIENoZWNrYm94XG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgY2hlY2tib3hcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbikgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbiA9IHR1aS51dGlsLmV4dGVuZCh7fSwgb3B0aW9uKTtcblxuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLmNoZWNrYm94Q2xhc3NOYW1lID0gb3B0aW9uLmNoZWNrYm94Q2xhc3NOYW1lO1xuICAgICAgICB0aGlzLmNoZWNrZWRMaXN0ID0gW107XG4gICAgICAgIHRoaXMucm9vdENoZWNrYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnSU5QVVQnKTtcbiAgICAgICAgdGhpcy5yb290Q2hlY2tib3gudHlwZSA9ICdjaGVja2JveCc7XG5cbiAgICAgICAgdGhpcy5fc2V0QVBJcygpO1xuICAgICAgICB0aGlzLl9hdHRhY2hFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSB0aGlzIG1vZHVsZVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcblxuICAgICAgICB0cmVlLm9mZih0aGlzKTtcbiAgICAgICAgZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRyZWVbYXBpTmFtZV07XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgYXBpcyBvZiBjaGVja2JveCB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0QVBJczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgYmluZCA9IHR1aS51dGlsLmJpbmQ7XG5cbiAgICAgICAgZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgdHJlZVthcGlOYW1lXSA9IGJpbmQodGhpc1thcGlOYW1lXSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggZXZlbnQgdG8gdHJlZSBpbnN0YW5jZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2F0dGFjaEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJlZS5vbih7XG4gICAgICAgICAgICBzaW5nbGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgICAgICAgICBub2RlSWQsIHN0YXRlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmNoZWNrYm94Q2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlSWQgPSB0aGlzLnRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZUZyb21DaGVja2JveCh0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb250aW51ZVBvc3Rwcm9jZXNzaW5nKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZnRlckRyYXc6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyZWUuaXNNb3ZpbmdOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdENoYW5nZXMobm9kZUlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtb3ZlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy9AdG9kbyAtIE9wdGltaXphdGlvblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlZmxlY3RDaGFuZ2VzKGRhdGEub3JpZ2luYWxQYXJlbnRJZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdENoYW5nZXMoZGF0YS5uZXdQYXJlbnRJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZWZsZWN0IHRoZSBjaGFuZ2VzIG9uIG5vZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZWZsZWN0Q2hhbmdlczogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHRoaXMudHJlZS5lYWNoKGZ1bmN0aW9uKGRlc2NlbmRhbnQsIGRlc2NlbmRhbnRJZCkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUoZGVzY2VuZGFudElkLCB0aGlzLl9nZXRTdGF0ZShkZXNjZW5kYW50SWQpLCB0cnVlKTtcbiAgICAgICAgfSwgbm9kZUlkLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fanVkZ2VPd25TdGF0ZShub2RlSWQpO1xuICAgICAgICB0aGlzLl91cGRhdGVBbGxBbmNlc3RvcnNTdGF0ZShub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY2hlY2tib3ggYXR0cmlidXRlcyAoY2hlY2tlZCwgaW5kZXRlcm1pbmF0ZSlcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGNoZWNrYm94IC0gQ2hlY2tib3ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNDaGVja2VkIC0gXCJjaGVja2VkXCJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzSW5kZXRlcm1pbmF0ZSAtIFwiaW5kZXRlcm1pbmF0ZVwiXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q2hlY2tib3hBdHRyOiBmdW5jdGlvbihjaGVja2JveCwgaXNDaGVja2VkLCBpc0luZGV0ZXJtaW5hdGUpIHtcbiAgICAgICAgY2hlY2tib3guaW5kZXRlcm1pbmF0ZSA9IGlzSW5kZXRlcm1pbmF0ZTtcbiAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IGlzQ2hlY2tlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNraW5nIHN0YXRlIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0ZSAtIFN0YXRlIGZvciBjaGVja2JveFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0b3BQcm9wYWdhdGlvbl0gLSBJZiB0cnVlLCBzdG9wIGNoYW5naW5nIHN0YXRlIHByb3BhZ2F0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUsIHN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICB2YXIgY2hlY2tib3ggPSB0aGlzLl9nZXRDaGVja2JveEVsZW1lbnQobm9kZUlkKTtcblxuICAgICAgICBpZiAoIWNoZWNrYm94KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIFNUQVRFX0NIRUNLRUQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0Q2hlY2tib3hBdHRyKGNoZWNrYm94LCB0cnVlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNUQVRFX1VOQ0hFQ0tFRDpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNUQVRFX0lOREVURVJNSU5BVEU6XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0Q2hlY2tib3hBdHRyKGNoZWNrYm94LCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OiAvLyBubyBtb3JlIHByb2Nlc3MgaWYgdGhlIHN0YXRlIGlzIGludmFsaWRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb250aW51ZVBvc3Rwcm9jZXNzaW5nKG5vZGVJZCwgc3RhdGUsIHN0b3BQcm9wYWdhdGlvbik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2luZyBzdGF0ZSBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBDaGVja2luZyBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN0YXRlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBzdGF0ZSA9IHRyZWUuZ2V0Tm9kZURhdGEobm9kZUlkKVtEQVRBX0tFWV9GT1JfQ0hFQ0tCT1hfU1RBVEVdLFxuICAgICAgICAgICAgY2hlY2tib3g7XG5cbiAgICAgICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICAgICAgY2hlY2tib3ggPSB0aGlzLl9nZXRDaGVja2JveEVsZW1lbnQobm9kZUlkKTtcbiAgICAgICAgICAgIHN0YXRlID0gdGhpcy5fZ2V0U3RhdGVGcm9tQ2hlY2tib3goY2hlY2tib3gpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tpbmcgc3RhdGUgb2Ygbm9kZSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGNoZWNrYm94IC0gQ2hlY2tib3ggZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHs/bnVtYmVyfSBDaGVja2luZyBzdGF0ZVxuICAgICAqL1xuICAgIF9nZXRTdGF0ZUZyb21DaGVja2JveDogZnVuY3Rpb24oY2hlY2tib3gpIHtcbiAgICAgICAgdmFyIHN0YXRlO1xuXG4gICAgICAgIGlmICghY2hlY2tib3gpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoZWNrYm94LmNoZWNrZWQpIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfQ0hFQ0tFRDtcbiAgICAgICAgfSBlbHNlIGlmIChjaGVja2JveC5pbmRldGVybWluYXRlKSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFX0lOREVURVJNSU5BVEU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFX1VOQ0hFQ0tFRDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ29udGludWUgcG9zdC1wcm9jZXNzaW5nIGZyb20gY2hhbmdpbmc6Y2hlY2tib3gtc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0ZSAtIENoZWNrYm94IHN0YXRlXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RvcFByb3BhZ2F0aW9uXSAtIElmIHRydWUsIHN0b3AgdXBkYXRlLXByb3BhZ2F0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29udGludWVQb3N0cHJvY2Vzc2luZzogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSB0aGlzLmNoZWNrZWRMaXN0LFxuICAgICAgICAgICAgZXZlbnROYW1lO1xuXG4gICAgICAgIC8qIFByZXZlbnQgZHVwbGljYXRlZCBub2RlIGlkICovXG4gICAgICAgIHV0aWwucmVtb3ZlSXRlbUZyb21BcnJheShub2RlSWQsIGNoZWNrZWRMaXN0KTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IFNUQVRFX0NIRUNLRUQpIHtcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0LnB1c2gobm9kZUlkKTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFRyZWUjY2hlY2tcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBDaGVja2VkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlLm9uKCdjaGVjaycsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCdjaGVja2VkOiAnICsgbm9kZUlkKTtcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBldmVudE5hbWUgPSAnY2hlY2snO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBTVEFURV9VTkNIRUNLRUQpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFRyZWUjdW5jaGVja1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFVuY2hlY2tlZCBub2RlIGlkXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdHJlZS5vbigndW5jaGVjaycsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCd1bmNoZWNrZWQ6ICcgKyBub2RlSWQpO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGV2ZW50TmFtZSA9ICd1bmNoZWNrJztcbiAgICAgICAgfVxuICAgICAgICBEQVRBW0RBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURV0gPSBzdGF0ZTtcbiAgICAgICAgdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIERBVEEsIHRydWUpO1xuXG4gICAgICAgIGlmICghc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9wYWdhdGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcbiAgICAgICAgICAgIHRyZWUuZmlyZShldmVudE5hbWUsIG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJvcGFnYXRlIGEgbm9kZSBzdGF0ZSB0byBkZXNjZW5kYW50cyBhbmQgYW5jZXN0b3JzIGZvciB1cGRhdGluZyB0aGVpciBzdGF0ZXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0ZSAtIENoZWNrYm94IHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcHJvcGFnYXRlU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcbiAgICAgICAgaWYgKHN0YXRlID09PSBTVEFURV9JTkRFVEVSTUlOQVRFKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl91cGRhdGVBbGxEZXNjZW5kYW50c1N0YXRlKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICB0aGlzLl91cGRhdGVBbGxBbmNlc3RvcnNTdGF0ZShub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgYWxsIGRlc2NlbmRhbnRzIHN0YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhdGUgLSBTdGF0ZSBmb3IgY2hlY2tib3hcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVBbGxEZXNjZW5kYW50c1N0YXRlOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlKSB7XG4gICAgICAgIHRoaXMudHJlZS5lYWNoKGZ1bmN0aW9uKGRlc2NlbmRhbnQsIGRlc2NlbmRhbnRJZCkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUoZGVzY2VuZGFudElkLCBzdGF0ZSwgdHJ1ZSk7XG4gICAgICAgIH0sIG5vZGVJZCwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBhbGwgYW5jZXN0b3JzIHN0YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVBbGxBbmNlc3RvcnNTdGF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgcGFyZW50SWQgPSB0cmVlLmdldFBhcmVudElkKG5vZGVJZCk7XG5cbiAgICAgICAgd2hpbGUgKHBhcmVudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9qdWRnZU93blN0YXRlKHBhcmVudElkKTtcbiAgICAgICAgICAgIHBhcmVudElkID0gdHJlZS5nZXRQYXJlbnRJZChwYXJlbnRJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSnVkZ2Ugb3duIHN0YXRlIGZyb20gY2hpbGQgbm9kZSBpcyBjaGFuZ2VkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9qdWRnZU93blN0YXRlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBjaGlsZElkcyA9IHRyZWUuZ2V0Q2hpbGRJZHMobm9kZUlkKSxcbiAgICAgICAgICAgIGNoZWNrZWQgPSB0cnVlLFxuICAgICAgICAgICAgdW5jaGVja2VkID0gdHJ1ZTtcblxuICAgICAgICBpZiAoIWNoaWxkSWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2hlY2tlZCA9IHRoaXMuaXNDaGVja2VkKG5vZGVJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JFYWNoKGNoaWxkSWRzLCBmdW5jdGlvbihjaGlsZElkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5fZ2V0U3RhdGUoY2hpbGRJZCk7XG4gICAgICAgICAgICAgICAgY2hlY2tlZCA9IChjaGVja2VkICYmIHN0YXRlID09PSBTVEFURV9DSEVDS0VEKTtcbiAgICAgICAgICAgICAgICB1bmNoZWNrZWQgPSAodW5jaGVja2VkICYmIHN0YXRlID09PSBTVEFURV9VTkNIRUNLRUQpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNoZWNrZWQgfHwgdW5jaGVja2VkO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9DSEVDS0VELCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIGlmICh1bmNoZWNrZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKG5vZGVJZCwgU1RBVEVfVU5DSEVDS0VELCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKG5vZGVJZCwgU1RBVEVfSU5ERVRFUk1JTkFURSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNrYm94IGVsZW1lbnQgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMgez9IVE1MRWxlbWVudH0gQ2hlY2tib3ggZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldENoZWNrYm94RWxlbWVudDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgZWwsIG5vZGVFbDtcblxuICAgICAgICBpZiAobm9kZUlkID09PSB0cmVlLmdldFJvb3ROb2RlSWQoKSkge1xuICAgICAgICAgICAgZWwgPSB0aGlzLnJvb3RDaGVja2JveDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGVFbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWwgPSB1dGlsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICAgICAgICAgICAgbm9kZUVsLFxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tib3hDbGFzc05hbWVcbiAgICAgICAgICAgIClbMF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLmNoZWNrKG5vZGVJZCk7XG4gICAgICovXG4gICAgY2hlY2s6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNDaGVja2VkKG5vZGVJZCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKG5vZGVJZCwgU1RBVEVfQ0hFQ0tFRCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVW5jaGVjayBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS51bmNoZWNrKG5vZGVJZCk7XG4gICAgICovXG4gICAgdW5jaGVjazogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1VuY2hlY2tlZChub2RlSWQpKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX1VOQ0hFQ0tFRCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIG5vZGUgY2hlY2tpbmdcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLnRvZ2dsZUNoZWNrKG5vZGVJZCk7XG4gICAgICovXG4gICAgdG9nZ2xlQ2hlY2s6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNDaGVja2VkKG5vZGVJZCkpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2sobm9kZUlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudW5jaGVjayhub2RlSWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIG5vZGUgaXMgY2hlY2tlZFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIG5vZGUgaXMgaW5kZXRlcm1pbmF0ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUuY2hlY2sobm9kZUlkKTtcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmlzQ2hlY2tlZChub2RlSWQpKTsgLy8gdHJ1ZVxuICAgICAqL1xuICAgIGlzQ2hlY2tlZDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiBTVEFURV9DSEVDS0VEID09PSB0aGlzLl9nZXRTdGF0ZShub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBub2RlIGlzIGluZGV0ZXJtaW5hdGVcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiBub2RlIGlzIGluZGV0ZXJtaW5hdGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLmNoZWNrKG5vZGVJZCk7XG4gICAgICogY29uc29sZS5sb2codHJlZS5pc0luZGV0ZXJtaW5hdGUobm9kZUlkKSk7IC8vIGZhbHNlXG4gICAgICovXG4gICAgaXNJbmRldGVybWluYXRlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNUQVRFX0lOREVURVJNSU5BVEUgPT09IHRoaXMuX2dldFN0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIG5vZGUgaXMgdW5jaGVja2VkIG9yIG5vdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIG5vZGUgaXMgdW5jaGVja2VkLlxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUudW5jaGVjayhub2RlSWQpO1xuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuaXNVbmNoZWNrZWQobm9kZUlkKSk7IC8vIHRydWVcbiAgICAgKi9cbiAgICBpc1VuY2hlY2tlZDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiBTVEFURV9VTkNIRUNLRUQgPT09IHRoaXMuX2dldFN0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2VkIGxpc3RcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBOb2RlIGlkIChkZWZhdWx0OiByb290Tm9kZSBpZClcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IENoZWNrZWQgbm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vXG4gICAgICogLy8gbm9kZTEodilcbiAgICAgKiAvLyAgIG5vZGUyKHYpXG4gICAgICogLy8gICBub2RlMyh2KVxuICAgICAqIC8vIG5vZGU0XG4gICAgICogLy8gICBub2RlNSh2KVxuICAgICAqIC8vIG5vZGU2XG4gICAgICogLy8gICBub2RlNyh2KVxuICAgICAqIC8vICAgICBub2RlOCh2KVxuICAgICAqIC8vICAgbm9kZTlcbiAgICAgKlxuICAgICAqIHZhciBhbGxDaGVja2VkTGlzdCA9IHRyZWUuZ2V0Q2hlY2tlZExpc3QoKTsgLy8gWydub2RlMScsICdub2RlMicsICdub2RlMycgLC4uLi5dXG4gICAgICogdmFyIGRlc2NlbmRhbnRzQ2hlY2tlZExpc3QgPSB0cmVlLmdldENoZWVrZWRMaXN0KCdub2RlNicpOyAvLyBbJ25vZGU3JywgJ25vZGU4J11cbiAgICAgKi9cbiAgICBnZXRDaGVja2VkTGlzdDogZnVuY3Rpb24ocGFyZW50SWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuY2hlY2tlZExpc3Q7XG5cbiAgICAgICAgaWYgKCFwYXJlbnRJZCkge1xuICAgICAgICAgICAgcmV0dXJuIGNoZWNrZWRMaXN0LnNsaWNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsdGVyKGNoZWNrZWRMaXN0LCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cmVlLmNvbnRhaW5zKHBhcmVudElkLCBub2RlSWQpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRvcCBjaGVja2VkIGxpc3RcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBOb2RlIGlkIChkZWZhdWx0OiByb290Tm9kZSBpZClcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IENoZWNrZWQgbm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vXG4gICAgICogLy8gbm9kZTEodilcbiAgICAgKiAvLyAgIG5vZGUyKHYpXG4gICAgICogLy8gICBub2RlMyh2KVxuICAgICAqIC8vIG5vZGU0XG4gICAgICogLy8gICBub2RlNSh2KVxuICAgICAqIC8vIG5vZGU2XG4gICAgICogLy8gICBub2RlNyh2KVxuICAgICAqIC8vICAgICBub2RlOCh2KVxuICAgICAqIC8vICAgbm9kZTlcbiAgICAgKlxuICAgICAqIHZhciBhbGxUb3BDaGVja2VkTGlzdCA9IHRyZWUuZ2V0VG9wQ2hlY2tlZExpc3QoKTsgLy8gWydub2RlMScsICdub2RlNScsICdub2RlNyddXG4gICAgICogdmFyIGRlc2NlbmRhbnRzVG9wQ2hlY2tlZExpc3QgPSB0cmVlLmdldFRvcENoZWVrZWRMaXN0KCdub2RlNicpOyAvLyBbJ25vZGU3J11cbiAgICAgKi9cbiAgICBnZXRUb3BDaGVja2VkTGlzdDogZnVuY3Rpb24ocGFyZW50SWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IFtdLFxuICAgICAgICAgICAgc3RhdGU7XG5cbiAgICAgICAgcGFyZW50SWQgPSBwYXJlbnRJZCB8fCB0cmVlLmdldFJvb3ROb2RlSWQoKTtcbiAgICAgICAgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZShwYXJlbnRJZCk7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gU1RBVEVfQ0hFQ0tFRCkge1xuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSB0cmVlLmdldENoaWxkSWRzKHBhcmVudElkKTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gU1RBVEVfSU5ERVRFUk1JTkFURSkge1xuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSB0aGlzLmdldENoZWNrZWRMaXN0KHBhcmVudElkKTtcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gZmlsdGVyKGNoZWNrZWRMaXN0LCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIXRoaXMuaXNDaGVja2VkKHRyZWUuZ2V0UGFyZW50SWQobm9kZUlkKSk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGVja2VkTGlzdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGJvdHRvbSBjaGVja2VkIGxpc3RcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBOb2RlIGlkIChkZWZhdWx0OiByb290Tm9kZSBpZClcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IENoZWNrZWQgbm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vXG4gICAgICogLy8gbm9kZTEodilcbiAgICAgKiAvLyAgIG5vZGUyKHYpXG4gICAgICogLy8gICBub2RlMyh2KVxuICAgICAqIC8vIG5vZGU0XG4gICAgICogLy8gICBub2RlNSh2KVxuICAgICAqIC8vIG5vZGU2XG4gICAgICogLy8gICBub2RlNyh2KVxuICAgICAqIC8vICAgICBub2RlOCh2KVxuICAgICAqIC8vICAgbm9kZTlcbiAgICAgKlxuICAgICAqIHZhciBhbGxCb3R0b21DaGVja2VkTGlzdCA9IHRyZWUuZ2V0Qm90dG9tQ2hlY2tlZExpc3QoKTsgLy8gWydub2RlMicsICdub2RlMycsICdub2RlNScsICdub2RlOCddXG4gICAgICogdmFyIGRlc2NlbmRhbnRzQm90dG9tQ2hlY2tlZExpc3QgPSB0cmVlLmdldEJvdHRvbUNoZWVrZWRMaXN0KCdub2RlNicpOyAvLyBbJ25vZGU4J11cbiAgICAgKi9cbiAgICBnZXRCb3R0b21DaGVja2VkTGlzdDogZnVuY3Rpb24ocGFyZW50SWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBjaGVja2VkTGlzdDtcblxuICAgICAgICBwYXJlbnRJZCA9IHBhcmVudElkIHx8IHRyZWUuZ2V0Um9vdE5vZGVJZCgpO1xuICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuZ2V0Q2hlY2tlZExpc3QocGFyZW50SWQpO1xuXG4gICAgICAgIHJldHVybiBmaWx0ZXIoY2hlY2tlZExpc3QsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWUuaXNMZWFmKG5vZGVJZCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oQ2hlY2tib3gpO1xubW9kdWxlLmV4cG9ydHMgPSBDaGVja2JveDtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi91dGlsJyk7XG5cbnZhciBBUElfTElTVCA9IFtdO1xuXG52YXIgQ29udGV4dE1lbnUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIENvbnRleHRNZW51LnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIENvbnRleHRNZW51XG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgQ29udGV4dE1lbnVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgbWVudXMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5pc09wZW5lZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnRElWJyk7XG5cbiAgICAgICAgdGhpcy5tYWtlTGF5ZXIobWVudXMpO1xuICAgICAgICB0aGlzLmF0dGFjaEV2ZW50KCk7XG4gICAgfSxcblxuICAgIG1ha2VMYXllcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMubGF5ZXIuc3R5bGU7XG5cbiAgICAgICAgc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBzdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnd2hpdGUnO1xuICAgICAgICBzdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkIGJsYWNrJztcbiAgICAgICAgdGhpcy5sYXllci5pbm5lckhUTUwgPSAndGVzdCc7XG4gICAgfSxcblxuICAgIGF0dGFjaEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdHJlZS5vbignX2NvbnRleHRNZW51JywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSksXG4gICAgICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmxheWVyLFxuICAgICAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgbGF5ZXIuc3R5bGUudG9wID0gZXZlbnQuY2xpZW50WSArIDEwICsgJ3B4JztcbiAgICAgICAgICAgIGxheWVyLnN0eWxlLmxlZnQgPSBldmVudC5jbGllbnRYICsgMTAgKyAncHgnO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNPcGVuZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzT3BlbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxheWVyKTtcblxuICAgICAgICAgICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5ib2R5LCAnY2xpY2snLCBmdW5jdGlvbiBjbG9zZUxheWVyKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmlzT3BlbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobGF5ZXIpO1xuICAgICAgICAgICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuYm9keSwgJ2NsaWNrJywgY2xvc2VMYXllcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50cyBUcmVlI2NvbnRleHRNZW51XG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIERhdGFcbiAgICAgICAgICAgICAqICBAcGFyYW0ge2RhdGEubm9kZUlkfSBub2RlSWQgLSBzZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRyZWUuZmlyZSgnb3BlbkNvbnRleHRNZW51Jywge1xuICAgICAgICAgICAgICAgIG5vZGVJZDogbm9kZUlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgICAgICB0aGlzLnRyZWUub2ZmKCdfY29udGV4dE1lbnUnKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZXh0TWVudTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi91dGlsJyk7XG5cbnZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgdXNlSGVscGVyOiB0cnVlLFxuICAgICAgICBoZWxwZXJQb3M6IHtcbiAgICAgICAgICAgIHk6IDIsXG4gICAgICAgICAgICB4OiA1XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlamVjdGVkVGFnTmFtZXMgPSBbXG4gICAgICAgICdJTlBVVCcsXG4gICAgICAgICdCVVRUT04nLFxuICAgICAgICAnVUwnXG4gICAgXSxcbiAgICBBUElfTElTVCA9IFtdLFxuICAgIGluQXJyYXkgPSB0dWkudXRpbC5pbkFycmF5O1xuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBkcmFnZ2FibGVcbiAqIEBjbGFzcyBEcmFnZ2FibGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnVzZUhlbHBlciAtIFVzaW5nIGhlbHBlciBmbGFnXG4gKiAgQHBhcmFtIHt7eDogbnVtYmVyLCB5Om51bWJlcn19IG9wdGlvbnMuaGVscGVyUG9zIC0gSGVscGVyIHBvc2l0aW9uXG4gKiAgQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gb3B0aW9ucy5yZWplY3RlZFRhZ05hbWVzIC0gTm8gZHJhZ2dhYmxlIHRhZyBuYW1lc1xuICogIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG9wdGlvbnMucmVqZWN0ZWRDbGFzc05hbWVzIC0gTm8gZHJhZ2dhYmxlIGNsYXNzIG5hbWVzXG4gKi9cbnZhciBEcmFnZ2FibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIERyYWdnYWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBEcmFnZ2FibGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBEcmFnZ2FibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLnNldE1lbWJlcnMob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuYXR0YWNoTW91c2Vkb3duKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBtZW1iZXJzIG9mIHRoaXMgbW9kdWxlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBpbnB1dCBvcHRpb25zXG4gICAgICovXG4gICAgc2V0TWVtYmVyczogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB2YXIgaGVscGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSxcbiAgICAgICAgICAgIHN0eWxlID0gaGVscGVyRWxlbWVudC5zdHlsZTtcbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMudXNlSGVscGVyID0gb3B0aW9ucy51c2VIZWxwZXI7XG4gICAgICAgIHRoaXMuaGVscGVyUG9zID0gb3B0aW9ucy5oZWxwZXJQb3M7XG4gICAgICAgIHRoaXMucmVqZWN0ZWRUYWdOYW1lcyA9IHJlamVjdGVkVGFnTmFtZXMuY29uY2F0KG9wdGlvbnMucmVqZWN0ZWRUYWdOYW1lcyk7XG4gICAgICAgIHRoaXMucmVqZWN0ZWRDbGFzc05hbWVzID0gW10uY29uY2F0KG9wdGlvbnMucmVqZWN0ZWRDbGFzc05hbWVzKTtcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gaGVscGVyRWxlbWVudDtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbnVsbDtcblxuICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGhlbHBlckVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggbW91c2UgZG93biBldmVudFxuICAgICAqL1xuICAgIGF0dGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucHJldmVudFRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy50cmVlLm9uKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2Vkb3duLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCB0ZXh0LXNlbGVjdGlvblxuICAgICAqL1xuICAgIHByZXZlbnRUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBzdHlsZSA9IHRyZWUucm9vdEVsZW1lbnQuc3R5bGUsXG4gICAgICAgICAgICBzZWxlY3RLZXkgPSB1dGlsLnRlc3RQcm9wKFxuICAgICAgICAgICAgICAgIFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J11cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRyZWUucm9vdEVsZW1lbnQsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xuXG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5ID0gc2VsZWN0S2V5O1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlID0gc3R5bGVbc2VsZWN0S2V5XTtcbiAgICAgICAgc3R5bGVbc2VsZWN0S2V5XSA9ICdub25lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhlIHRhcmdldCBlbGVtZW50IGlzIGluIHJlamVjdGVkVGFnTmFtZXMgb3IgaW4gcmVqZWN0ZWRDbGFzc05hbWVzXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdGFyZ2V0IGlzIG5vdCBkcmFnZ2FibGUgb3IgZHJhZ2dhYmxlXG4gICAgICovXG4gICAgaXNOb3REcmFnZ2FibGU6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICB2YXIgdGFnTmFtZSA9IHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICBjbGFzc05hbWVzID0gdXRpbC5nZXRDbGFzcyh0YXJnZXQpLnNwbGl0KC9cXHMrLyksXG4gICAgICAgICAgICByZXN1bHQ7XG5cbiAgICAgICAgaWYgKGluQXJyYXkodGFnTmFtZSwgdGhpcy5yZWplY3RlZFRhZ05hbWVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChjbGFzc05hbWVzLCBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGluQXJyYXkoY2xhc3NOYW1lLCB0aGlzLnJlamVjdGVkQ2xhc3NOYW1lcykgIT09IC0xO1xuXG4gICAgICAgICAgICByZXR1cm4gIXJlc3VsdDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2Vkb3duOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIG5vZGVJZDtcblxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSB8fCB0aGlzLmlzTm90RHJhZ2dhYmxlKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1dGlsLnByZXZlbnREZWZhdWx0KGV2ZW50KTtcblxuICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbm9kZUlkO1xuICAgICAgICBpZiAodGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SGVscGVyKHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWUub24oe1xuICAgICAgICAgICAgbW91c2Vtb3ZlOiB0aGlzLm9uTW91c2Vtb3ZlLFxuICAgICAgICAgICAgbW91c2V1cDogdGhpcy5vbk1vdXNldXBcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZW1vdmVcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbk1vdXNlbW92ZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBoZWxwZXJFbCA9IHRoaXMuaGVscGVyRWxlbWVudCxcbiAgICAgICAgICAgIHBvcyA9IHRyZWUucm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGlmICghdGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlbHBlckVsLnN0eWxlLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBwb3MudG9wICsgdGhpcy5oZWxwZXJQb3MueSArICdweCc7XG4gICAgICAgIGhlbHBlckVsLnN0eWxlLmxlZnQgPSBldmVudC5jbGllbnRYIC0gcG9zLmxlZnQgKyB0aGlzLmhlbHBlclBvcy54ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2V1cFxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2V1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRyZWUubW92ZSh0aGlzLmN1cnJlbnROb2RlSWQsIG5vZGVJZCk7XG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdHJlZS5vZmYodGhpcywgJ21vdXNlbW92ZScpO1xuICAgICAgICB0cmVlLm9mZih0aGlzLCAnbW91c2V1cCcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXN0b3JlIHRleHQtc2VsZWN0aW9uXG4gICAgICovXG4gICAgcmVzdG9yZVRleHRTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRyZWUucm9vdEVsZW1lbnQsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xuICAgICAgICBpZiAodGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIHRyZWUucm9vdEVsZW1lbnQuc3R5bGVbdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXldID0gdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgaGVscGVyIGNvbnRlbnRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBIZWxwZXIgY29udGVudHNcbiAgICAgKi9cbiAgICBzZXRIZWxwZXI6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LmlubmVySFRNTCA9IHRleHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGFjaCBtb3VzZWRvd24gZXZlbnRcbiAgICAgKi9cbiAgICBkZXRhY2hNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZVRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5kZXRhY2hNb3VzZWRvd24oKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnZ2FibGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi91dGlsJyk7XG5cbnZhciBBUElfTElTVCA9IFtdO1xuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBzZWxlY3RhYmxlXG4gKiBAY2xhc3MgRWRpdGFibGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgZWRpdGFibGUgZWxlbWVudFxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmRhdGFLZXkgLSBLZXkgb2Ygbm9kZSBkYXRhIHRvIHNldCB2YWx1ZVxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmlucHV0Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGlucHV0IGVsZW1lbnRcbiAqL1xudmFyIEVkaXRhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBFZGl0YWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBTZWxlY3RhYmxlXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgRWRpdGFibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSA9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuZGF0YUtleSA9IG9wdGlvbnMuZGF0YUtleTtcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQgPSB0aGlzLmNyZWF0ZUlucHV0RWxlbWVudChvcHRpb25zLmlucHV0Q2xhc3NOYW1lKTtcbiAgICAgICAgdGhpcy5ib3VuZE9uS2V5dXAgPSB0dWkudXRpbC5iaW5kKHRoaXMub25LZXl1cCwgdGhpcyk7XG4gICAgICAgIHRoaXMuYm91bmRPbkJsdXIgPSB0dWkudXRpbC5iaW5kKHRoaXMub25CbHVyLCB0aGlzKTtcblxuICAgICAgICB0cmVlLm9uKCdkb3VibGVDbGljaycsIHRoaXMub25Eb3VibGVDbGljaywgdGhpcyk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2tleXVwJywgdGhpcy5ib3VuZE9uS2V5dXApO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdibHVyJywgdGhpcy5ib3VuZE9uQmx1cik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGFjaCBpbnB1dCBlbGVtZW50IGZyb20gZG9jdW1lbnRcbiAgICAgKi9cbiAgICBkZXRhY2hJbnB1dEZyb21Eb2N1bWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dEVsID0gdGhpcy5pbnB1dEVsZW1lbnQsXG4gICAgICAgICAgICBwYXJlbnROb2RlID0gaW5wdXRFbC5wYXJlbnROb2RlO1xuXG4gICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlucHV0RWwpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5kZXRhY2hJbnB1dEZyb21Eb2N1bWVudCgpO1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdrZXl1cCcsIHRoaXMuYm91bmRPbktleXVwKTtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAnYmx1cicsIHRoaXMuYm91bmRPbkJsdXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dENsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBpbnB1dCBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBJbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgY3JlYXRlSW5wdXRFbGVtZW50OiBmdW5jdGlvbihpbnB1dENsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTlBVVCcpO1xuICAgICAgICBpZiAoaW5wdXRDbGFzc05hbWUpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IGlucHV0Q2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciBcImRvdWJsZUNsaWNrXCJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbkRvdWJsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIGlucHV0RWxlbWVudCwgbm9kZUlkO1xuXG4gICAgICAgIGlmICh1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICAgICAgaW5wdXRFbGVtZW50ID0gdGhpcy5pbnB1dEVsZW1lbnQ7XG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQudmFsdWUgPSB0cmVlLmdldE5vZGVEYXRhKG5vZGVJZClbdGhpcy5kYXRhS2V5XSB8fCAnJztcbiAgICAgICAgICAgIHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShpbnB1dEVsZW1lbnQsIHRhcmdldCk7XG4gICAgICAgICAgICB0YXJnZXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIGlucHV0RWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXI6IGtleXVwIC0gaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gS2V5IGV2ZW50XG4gICAgICovXG4gICAgb25LZXl1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7IC8vIGtleXVwIFwiZW50ZXJcIlxuICAgICAgICAgICAgdGhpcy5zZXREYXRhKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcjogYmx1ciAtIGlucHV0IGVsZW1lbnRcbiAgICAgKi9cbiAgICBvbkJsdXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldERhdGEoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgb2YgaW5wdXQgZWxlbWVudCB0byBub2RlIGFuZCBkZXRhY2ggaW5wdXQgZWxlbWVudCBmcm9tIGRvYy5cbiAgICAgKi9cbiAgICBzZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRoaXMuaW5wdXRFbGVtZW50KSxcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcblxuICAgICAgICBpZiAobm9kZUlkKSB7XG4gICAgICAgICAgICBkYXRhW3RoaXMuZGF0YUtleV0gPSB0aGlzLmlucHV0RWxlbWVudC52YWx1ZTtcbiAgICAgICAgICAgIHRyZWUuc2V0Tm9kZURhdGEobm9kZUlkLCBkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRldGFjaElucHV0RnJvbURvY3VtZW50KCk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdGFibGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi91dGlsJyk7XG5cbnZhciBBUElfTElTVCA9IFtcbiAgICAgICAgJ3NlbGVjdCcsXG4gICAgICAgICdnZXRTZWxlY3RlZE5vZGVJZCdcbiAgICBdLFxuICAgIGRlZmF1bHRzID0ge1xuICAgICAgICBzZWxlY3RlZENsYXNzTmFtZTogJ3R1aS10cmVlLXNlbGVjdGVkJ1xuICAgIH07XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjbGFzcyBTZWxlY3RhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuc2VsZWN0ZWRDbGFzc05hbWUgLSBDbGFzc25hbWUgZm9yIHNlbGVjdGVkIG5vZGUuXG4gKi9cbnZhciBTZWxlY3RhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBTZWxlY3RhYmxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIFNlbGVjdGFibGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBTZWxlY3RhYmxlXG4gICAgICAgICAqL1xuICAgICAgICBnZXRBUElMaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBBUElfTElTVC5zbGljZSgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbnMgPSB0dWkudXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lID0gb3B0aW9ucy5zZWxlY3RlZENsYXNzTmFtZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdHJlZS5vbih7XG4gICAgICAgICAgICBzaW5nbGVDbGljazogdGhpcy5vblNpbmdsZUNsaWNrLFxuICAgICAgICAgICAgYWZ0ZXJEcmF3OiB0aGlzLm9uQWZ0ZXJEcmF3XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB0aGlzLl9zZXRBUElzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBhcGlzIG9mIHNlbGVjdGFibGUgdHJlZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEFQSXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGJpbmQgPSB0dWkudXRpbC5iaW5kO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goQVBJX0xJU1QsIGZ1bmN0aW9uKGFwaU5hbWUpIHtcbiAgICAgICAgICAgIHRyZWVbYXBpTmFtZV0gPSBiaW5kKHRoaXNbYXBpTmFtZV0sIHRoaXMpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSB0aGlzIG1vZHVsZVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIG5vZGVFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpO1xuXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Mobm9kZUVsZW1lbnQsIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB0cmVlLm9mZih0aGlzKTtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRyZWVbYXBpTmFtZV07XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciBcInNpbmdsZUNsaWNrXCJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvblNpbmdsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgbm9kZUlkID0gdGhpcy50cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5zZWxlY3Qobm9kZUlkLCB0YXJnZXQpO1xuICAgIH0sXG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSB2YWxpZC1qc2RvY1xuICAgICAgICBJZ25vcmUgXCJ0YXJnZXRcIiBwYXJhbWV0ZXIgYW5ub3RhdGlvbiBmb3IgQVBJIHBhZ2VcbiAgICAgICAgXCJ0cmVlLnNlbGVjdChub2RlSWQpXCJcbiAgICAgKi9cbiAgICAvKipcbiAgICAgKiBTZWxlY3Qgbm9kZSBpZiB0aGUgZmVhdHVyZS1cIlNlbGVjdGFibGVcIiBpcyBlbmFibGVkLlxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcmVxdWlyZXMgU2VsZWN0YWJsZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLnNlbGVjdCgndHVpLXRyZWUtbm9kZS0zJyk7XG4gICAgICovXG4gICAgLyogZXNsaW50LWVuYWJsZSB2YWxpZC1qc2RvYyAqL1xuICAgIHNlbGVjdDogZnVuY3Rpb24obm9kZUlkLCB0YXJnZXQpIHtcbiAgICAgICAgdmFyIHRyZWUsIHByZXZFbGVtZW50LCBub2RlRWxlbWVudCxcbiAgICAgICAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lLCBwcmV2Tm9kZUlkO1xuXG4gICAgICAgIGlmICghbm9kZUlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICBwcmV2RWxlbWVudCA9IHRoaXMuZ2V0UHJldkVsZW1lbnQoKTtcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xuICAgICAgICBzZWxlY3RlZENsYXNzTmFtZSA9IHRoaXMuc2VsZWN0ZWRDbGFzc05hbWU7XG4gICAgICAgIHByZXZOb2RlSWQgPSB0aGlzLnNlbGVjdGVkTm9kZUlkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2JlZm9yZVNlbGVjdFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gU2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJldk5vZGVJZCAtIFByZXZpb3VzIHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICogQHBhcmFtIHtFbGVtZW50fHVuZGVmaW5lZH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZVxuICAgICAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxuICAgICAgICAgKiAgLm9uKCdiZWZvcmVTZWxlY3QnLCBmdW5jdGlvbihub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCkge1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdzZWxlY3RlZCBub2RlOiAnICsgbm9kZUlkKTtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZygncHJldmlvdXMgc2VsZWN0ZWQgbm9kZTogJyArIHByZXZOb2RlSWQpO1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCd0YXJnZXQgZWxlbWVudDogJyArIHRhcmdldCk7XG4gICAgICAgICAqICAgICAgcmV0dXJuIGZhbHNlOyAvLyBJdCBjYW5jZWxzIFwic2VsZWN0XCJcbiAgICAgICAgICogICAgICAvLyByZXR1cm4gdHJ1ZTsgLy8gSXQgZmlyZXMgXCJzZWxlY3RcIlxuICAgICAgICAgKiAgfSk7XG4gICAgICAgICAqL1xuICAgICAgICBpZiAodHJlZS5pbnZva2UoJ2JlZm9yZVNlbGVjdCcsIG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KSkge1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhwcmV2RWxlbWVudCwgc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgc2VsZWN0ZWRDbGFzc05hbWUpO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBhcGlcbiAgICAgICAgICAgICAqIEBldmVudCBUcmVlI3NlbGVjdFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmV2Tm9kZUlkIC0gUHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQHBhcmFtIHtFbGVtZW50fHVuZGVmaW5lZH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlXG4gICAgICAgICAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxuICAgICAgICAgICAgICogIC5vbignc2VsZWN0JywgZnVuY3Rpb24obm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpIHtcbiAgICAgICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3NlbGVjdGVkIG5vZGU6ICcgKyBub2RlSWQpO1xuICAgICAgICAgICAgICogICAgICBjb25zb2xlLmxvZygncHJldmlvdXMgc2VsZWN0ZWQgbm9kZTogJyArIHByZXZOb2RlSWQpO1xuICAgICAgICAgICAgICogICAgICBjb25zb2xlLmxvZygndGFyZ2V0IGVsZW1lbnQ6ICcgKyB0YXJnZXQpO1xuICAgICAgICAgICAgICogIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cmVlLmZpcmUoJ3NlbGVjdCcsIG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWROb2RlSWQgPSBub2RlSWQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHByZXZpb3VzIHNlbGVjdGVkIG5vZGUgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gTm9kZSBlbGVtZW50XG4gICAgICovXG4gICAgZ2V0UHJldkVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5zZWxlY3RlZE5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzZWxlY3RlZCBub2RlIGlkXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRTZWxlY3RlZE5vZGVJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkTm9kZUlkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciAtIFwiYWZ0ZXJEcmF3XCJcbiAgICAgKi9cbiAgICBvbkFmdGVyRHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlRWxlbWVudCA9IHRoaXMuZ2V0UHJldkVsZW1lbnQoKTtcblxuICAgICAgICBpZiAobm9kZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3Mobm9kZUVsZW1lbnQsIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0YWJsZTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBSZW5kZXIgdHJlZSBhbmQgdXBkYXRlIHRyZWUuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIGRlZmF1bHRPcHRpb24gPSByZXF1aXJlKCcuL2NvbnN0cy9kZWZhdWx0T3B0aW9uJyksXG4gICAgc3RhdGVzID0gcmVxdWlyZSgnLi9jb25zdHMvc3RhdGVzJyksXG4gICAgbWVzc2FnZXMgPSByZXF1aXJlKCcuL2NvbnN0cy9tZXNzYWdlcycpLFxuICAgIG91dGVyVGVtcGxhdGUgPSByZXF1aXJlKCcuL2NvbnN0cy9vdXRlclRlbXBsYXRlJyksXG4gICAgVHJlZU1vZGVsID0gcmVxdWlyZSgnLi90cmVlTW9kZWwnKSxcbiAgICBTZWxlY3RhYmxlID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9zZWxlY3RhYmxlJyksXG4gICAgRHJhZ2dhYmxlID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9kcmFnZ2FibGUnKSxcbiAgICBFZGl0YWJsZSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvZWRpdGFibGUnKSxcbiAgICBDaGVja2JveCA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvY2hlY2tib3gnKSxcbiAgICBDb250ZXh0TWVudSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvY29udGV4dE1lbnUnKTtcblxudmFyIG5vZGVTdGF0ZXMgPSBzdGF0ZXMubm9kZSxcbiAgICBmZWF0dXJlcyA9IHtcbiAgICAgICAgU2VsZWN0YWJsZTogU2VsZWN0YWJsZSxcbiAgICAgICAgRHJhZ2dhYmxlOiBEcmFnZ2FibGUsXG4gICAgICAgIEVkaXRhYmxlOiBFZGl0YWJsZSxcbiAgICAgICAgQ2hlY2tib3g6IENoZWNrYm94LFxuICAgICAgICBDb250ZXh0TWVudTogQ29udGV4dE1lbnVcbiAgICB9LFxuICAgIHNuaXBwZXQgPSB0dWkudXRpbCxcbiAgICBleHRlbmQgPSBzbmlwcGV0LmV4dGVuZCxcbiAgICBUSU1FT1VUX1RPX0RJRkZFUkVOVElBVEVfQ0xJQ0tfQU5EX0RCTENMSUNLID0gMjAwLFxuICAgIE1PVVNFX01PVklOR19USFJFU0hPTEQgPSA1O1xuLyoqXG4gKiBDcmVhdGUgdHJlZSBtb2RlbCBhbmQgaW5qZWN0IGRhdGEgdG8gbW9kZWxcbiAqIEBjbGFzcyBUcmVlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBtaXhlcyB0dWkudXRpbC5DdXN0b21FdmVudHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEEgZGF0YSB0byBiZSB1c2VkIG9uIHRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zXG4gKiAgICAgQHBhcmFtIHtIVE1MRWxlbWVudH0gW29wdGlvbnMucm9vdEVsZW1lbnRdIFJvb3QgZWxlbWVudCAoSXQgc2hvdWxkIGJlICdVTCcgZWxlbWVudClcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubm9kZUlkUHJlZml4XSBBIGRlZmF1bHQgcHJlZml4IG9mIGEgbm9kZVxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5ub2RlRGVmYXVsdFN0YXRlXSBBIGRlZmF1bHQgc3RhdGUgb2YgYSBub2RlXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnRlbXBsYXRlXSBBIG1hcmt1cCBzZXQgdG8gbWFrZSBlbGVtZW50XG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGVdIEhUTUwgdGVtcGxhdGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlLmxlYWZOb2RlXSBIVE1MIHRlbXBsYXRlXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnN0YXRlTGFiZWxzXSBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5vcGVuZWRdIFN0YXRlLU9QRU5FRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhdGVMYWJlbHMuY2xvc2VkXSBTdGF0ZS1DTE9TRUQgbGFiZWwgKFRleHQgb3IgSFRNTClcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuY2xhc3NOYW1lc10gQ2xhc3MgbmFtZXMgZm9yIHRyZWVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMubm9kZUNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMubGVhZkNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIGxlYWYgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5vcGVuZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5jbG9zZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBjbG9zZWQgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy50ZXh0Q2xhc3NdIEEgY2xhc3MgbmFtZSB0aGF0IGZvciB0ZXh0RWxlbWVudCBpbiBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnN1YnRyZWVDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgdG9nZ2xlIGJ1dHRvbiBpbiBpbnRlcm5hbCBub2RlXG4gKiAgICAgQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMucmVuZGVyVGVtcGxhdGVdIEZ1bmN0aW9uIGZvciByZW5kZXJpbmcgdGVtcGxhdGVcbiAqIEBleGFtcGxlXG4gKiAvL0RlZmF1bHQgb3B0aW9uczpcbiAqIC8vIHtcbiAqIC8vICAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLSdcbiAqIC8vICAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcbiAqIC8vICAgICBzdGF0ZUxhYmVsczoge1xuICogLy8gICAgICAgICBvcGVuZWQ6ICctJyxcbiAqIC8vICAgICAgICAgY2xvc2VkOiAnKydcbiAqIC8vICAgICB9LFxuICogLy8gICAgIGNsYXNzTmFtZXM6IHtcbiAqIC8vICAgICAgICAgbm9kZUNsYXNzOiAndHVpLXRyZWUtbm9kZScsXG4gKiAvLyAgICAgICAgIGxlYWZDbGFzczogJ3R1aS10cmVlLWxlYWYnLFxuICogLy8gICAgICAgICBvcGVuZWRDbGFzczogJ3R1aS10cmVlLW9wZW5lZCcsXG4gKiAvLyAgICAgICAgIGNsb3NlZENsYXNzOiAndHVpLXRyZWUtY2xvc2VkJyxcbiAqIC8vICAgICAgICAgc3VidHJlZUNsYXNzOiAndHVpLXRyZWUtc3VidHJlZScsXG4gKiAvLyAgICAgICAgIHRvZ2dsZUJ0bkNsYXNzOiAndHVpLXRyZWUtdG9nZ2xlQnRuJyxcbiAqIC8vICAgICAgICAgdGV4dENsYXNzOiAndHVpLXRyZWUtdGV4dCcsXG4gKiAvLyAgICAgfSxcbiAqIC8vICAgICB0ZW1wbGF0ZToge1xuICogLy8gICAgICAgICBpbnRlcm5hbE5vZGU6XG4gKiAvLyAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICogLy8gICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPidcbiAqIC8vICAgICAgICAgbGVhZk5vZGU6XG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gKiAvLyAgICAgfVxuICogLy8gfVxuICogLy9cbiAqXG4gKiB2YXIgZGF0YSA9IFtcbiAqICAgICB7dGV4dDogJ3Jvb3RBJywgY2hpbGRyZW46IFtcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFBJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQid9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMUMnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFEJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQScsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViXzFBJywgY2hpbGRyZW46W1xuICogICAgICAgICAgICAgICAgIHt0ZXh0OidzdWJfc3ViXzFBJ31cbiAqICAgICAgICAgICAgIF19LFxuICogICAgICAgICAgICAge3RleHQ6J3N1Yl8yQSd9XG4gKiAgICAgICAgIF19LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkInfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJDJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yRCd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0EnLCBjaGlsZHJlbjogW1xuICogICAgICAgICAgICAge3RleHQ6J3N1YjNfYSd9LFxuICogICAgICAgICAgICAge3RleHQ6J3N1YjNfYid9XG4gKiAgICAgICAgIF19LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0InfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNDJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zRCd9XG4gKiAgICAgXX0sXG4gKiAgICAge3RleHQ6ICdyb290QicsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgIHt0ZXh0OidCX3N1YjEnfSxcbiAqICAgICAgICAge3RleHQ6J0Jfc3ViMid9LFxuICogICAgICAgICB7dGV4dDonYid9XG4gKiAgICAgXX1cbiAqIF07XG4gKlxuICogdmFyIHRyZWUxID0gbmV3IHR1aS5jb21wb25lbnQuVHJlZShkYXRhLCB7XG4gKiAgICAgcm9vdEVsZW1lbnQ6ICd0cmVlUm9vdCcsIC8vIG9yIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmVlUm9vdCcpXG4gKiAgICAgbm9kZURlZmF1bHRTdGF0ZTogJ29wZW5lZCcsXG4gKlxuICogICAgIC8vID09PT09PT09PSBPcHRpb246IE92ZXJyaWRlIHRlbXBsYXRlIHJlbmRlcmVyID09PT09PT09PT09XG4gKlxuICogICAgIHRlbXBsYXRlOiB7IC8vIHRlbXBsYXRlIGZvciBNdXN0YWNoZSBlbmdpbmVcbiAqICAgICAgICAgaW50ZXJuYWxOb2RlOlxuICogICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3t7c3RhdGVMYWJlbH19fTwvYnV0dG9uPicgK1xuICogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7e3RleHR9fX08L3NwYW4+JyArXG4gKiAgICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7e2NoaWxkcmVufX19PC91bD4nXG4gKiAgICAgICAgIGxlYWZOb2RlOlxuICogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7e3RleHR9fX08L3NwYW4+JyArXG4gKiAgICAgfSxcbiAqICAgICByZW5kZXJUZW1wbGF0ZTogZnVuY3Rpb24oc291cmNlLCBwcm9wcykge1xuICogICAgICAgICAvLyBNdXN0YWNoZSB0ZW1wbGF0ZSBlbmdpbmVcbiAqICAgICAgICAgcmV0dXJuIE11c3RhY2hlLnJlbmRlcih0ZW1wbGF0ZSwgcHJvcHMpO1xuICogICAgIH1cbiAqIH0pO1xuICoqL1xudmFyIFRyZWUgPSBzbmlwcGV0LmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZS5wcm90b3R5cGUgKi97IC8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmF1bHQgY2xhc3MgbmFtZXNcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jbGFzc05hbWVzID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9uLmNsYXNzTmFtZXMsIG9wdGlvbnMuY2xhc3NOYW1lcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmF1bHQgdGVtcGxhdGVcbiAgICAgICAgICogQHR5cGUge3tpbnRlcm5hbE5vZGU6IHN0cmluZywgbGVhZk5vZGU6IHN0cmluZ319XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9uLnRlbXBsYXRlLCBvcHRpb25zLnRlbXBsYXRlKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUm9vdCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBvcHRpb25zLnJvb3RFbGVtZW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXG4gICAgICAgICAqIEB0eXBlIHt7b3BlbmVkOiBzdHJpbmcsIGNsb3NlZDogc3RyaW5nfX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc3RhdGVMYWJlbHMgPSBvcHRpb25zLnN0YXRlTGFiZWxzO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWtlIHRyZWUgbW9kZWxcbiAgICAgICAgICogQHR5cGUge1RyZWVNb2RlbH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVHJlZU1vZGVsKGRhdGEsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbmFibGVkIGZlYXR1cmVzXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgb2JqZWN0Pn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsaWNrIHRpbWVyIHRvIHByZXZlbnQgY2xpY2stZHVwbGljYXRpb24gd2l0aCBkb3VibGUgY2xpY2tcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRvIHByZXZlbnQgY2xpY2sgZXZlbnQgaWYgbW91c2UgbW92ZWQgYmVmb3JlIG1vdXNldXAuXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9tb3VzZU1vdmluZ0ZsYWcgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVuZGVyIHRlbXBsYXRlXG4gICAgICAgICAqIEl0IGNhbiBiZSBvdmVycm9kZSBieSB1c2VyJ3MgdGVtcGxhdGUgZW5naW5lLlxuICAgICAgICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9yZW5kZXJUZW1wbGF0ZSA9IG9wdGlvbnMucmVuZGVyVGVtcGxhdGUgfHwgdXRpbC5yZW5kZXJUZW1wbGF0ZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJ1ZSB3aGVuIGEgbm9kZSBpcyBtb3ZpbmdcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbih7XG4gICAgICAgICAqICAgICBiZWZvcmVEcmF3OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgICAgICBpZiAodHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICogICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgKiAgICAgICAgIH1cbiAgICAgICAgICogICAgICAgICAvLy4uXG4gICAgICAgICAqICAgICB9LFxuICAgICAgICAgKiAgICAgLy8uLi4uXG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKiB0cmVlLm1vdmUoJ3R1aS10cmVlLW5vZGUtMScsICd0dWktdHJlZS1ub2RlLTInKTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNNb3ZpbmdOb2RlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5fc2V0Um9vdCgpO1xuICAgICAgICB0aGlzLl9kcmF3KHRoaXMuZ2V0Um9vdE5vZGVJZCgpKTtcbiAgICAgICAgdGhpcy5fc2V0RXZlbnRzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByb290IGVsZW1lbnQgb2YgdHJlZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJvb3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudDtcblxuICAgICAgICBpZiAoc25pcHBldC5pc1N0cmluZyhyb290RWwpKSB7XG4gICAgICAgICAgICByb290RWwgPSB0aGlzLnJvb3RFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocm9vdEVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc25pcHBldC5pc0hUTUxOb2RlKHJvb3RFbCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlcy5JTlZBTElEX1JPT1RfRUxFTUVOVCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTW92ZSBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3JpZ2luYWxQYXJlbnRJZCAtIE9yaWdpbmFsIHBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBub2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Nb3ZlOiBmdW5jdGlvbihub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkKSB7XG4gICAgICAgIHRoaXMuX2RyYXcob3JpZ2luYWxQYXJlbnRJZCk7XG4gICAgICAgIHRoaXMuX2RyYXcobmV3UGFyZW50SWQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI21vdmVcbiAgICAgICAgICogQHBhcmFtIHt7bm9kZUlkOiBzdHJpbmcsIG9yaWdpbmFsUGFyZW50SWQ6IHN0cmluZywgbmV3UGFyZW50SWQ6IHN0cmluZ319IHRyZWVFdmVudCAtIFRyZWUgZXZlbnRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbignbW92ZScsIGZ1bmN0aW9uKHRyZWVFdmVudCkge1xuICAgICAgICAgKiAgICAgdmFyIG5vZGVJZCA9IHRyZWVFdmVudC5ub2RlSWQsXG4gICAgICAgICAqICAgICAgICAgb3JpZ2luYWxQYXJlbnRJZCA9IHRyZWVFdmVudC5vcmlnaW5hbFBhcmVudElkLFxuICAgICAgICAgKiAgICAgICAgIG5ld1BhcmVudElkID0gdHJlZUV2ZW50Lm5ld1BhcmVudElkO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywge1xuICAgICAgICAgICAgbm9kZUlkOiBub2RlSWQsXG4gICAgICAgICAgICBvcmlnaW5hbFBhcmVudElkOiBvcmlnaW5hbFBhcmVudElkLFxuICAgICAgICAgICAgbmV3UGFyZW50SWQ6IG5ld1BhcmVudElkXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZXZlbnQgaGFuZGxlcnNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLm9uKHtcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5fZHJhdyxcbiAgICAgICAgICAgIG1vdmU6IHRoaXMuX29uTW92ZVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdjbGljaycsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkNsaWNrLCB0aGlzKSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnbW91c2Vkb3duJywgc25pcHBldC5iaW5kKHRoaXMuX29uTW91c2Vkb3duLCB0aGlzKSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnZGJsY2xpY2snLCBzbmlwcGV0LmJpbmQodGhpcy5fb25Eb3VibGVDbGljaywgdGhpcykpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290RWxlbWVudCwgJ2NvbnRleHRtZW51Jywgc25pcHBldC5iaW5kKHRoaXMuX29uQ29udGV4dE1lbnUsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgX29uQ29udGV4dE1lbnU6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuZmlyZSgnX2NvbnRleHRNZW51JywgZXZlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vkb3duXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBkb3duRXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTW91c2Vkb3duOiBmdW5jdGlvbihkb3duRXZlbnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgY2xpZW50WCA9IGRvd25FdmVudC5jbGllbnRYLFxuICAgICAgICAgICAgY2xpZW50WSA9IGRvd25FdmVudC5jbGllbnRZLFxuICAgICAgICAgICAgYWJzID0gTWF0aC5hYnM7XG5cbiAgICAgICAgZnVuY3Rpb24gb25Nb3VzZU1vdmUobW92ZUV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgbmV3Q2xpZW50WCA9IG1vdmVFdmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIG5ld0NsaWVudFkgPSBtb3ZlRXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgaWYgKGFicyhuZXdDbGllbnRYIC0gY2xpZW50WCkgKyBhYnMobmV3Q2xpZW50WSAtIGNsaWVudFkpID4gTU9VU0VfTU9WSU5HX1RIUkVTSE9MRCkge1xuICAgICAgICAgICAgICAgIHNlbGYuZmlyZSgnbW91c2Vtb3ZlJywgbW92ZUV2ZW50KTtcbiAgICAgICAgICAgICAgICBzZWxmLl9tb3VzZU1vdmluZ0ZsYWcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uTW91c2VVcCh1cEV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLmZpcmUoJ21vdXNldXAnLCB1cEV2ZW50KTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbW91c2VNb3ZpbmdGbGFnID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZmlyZSgnbW91c2Vkb3duJywgZG93bkV2ZW50KTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGNsaWNrXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIENsaWNrIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25DbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICh1dGlsLmlzUmlnaHRCdXR0b24oZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzcykpIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlKHRoaXMuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KSk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jbGlja1RpbWVyICYmICF0aGlzLl9tb3VzZU1vdmluZ0ZsYWcpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnc2luZ2xlQ2xpY2snLCBldmVudCk7XG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVzZXRDbGlja1RpbWVyKCk7XG4gICAgICAgICAgICB9LCBUSU1FT1VUX1RPX0RJRkZFUkVOVElBVEVfQ0xJQ0tfQU5EX0RCTENMSUNLKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gZG91YmxlIGNsaWNrIChkYmxjbGljaylcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gRG91YmxlIGNsaWNrIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Eb3VibGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5maXJlKCdkb3VibGVDbGljaycsIGV2ZW50KTtcbiAgICAgICAgdGhpcy5yZXNldENsaWNrVGltZXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG5vZGUgc3RhdGUgLSBvcGVuZWQgb3IgY2xvc2VkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOb2RlIHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0RGlzcGxheUZyb21Ob2RlU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcbiAgICAgICAgdmFyIHN1YnRyZWVFbGVtZW50ID0gdGhpcy5fZ2V0U3VidHJlZUVsZW1lbnQobm9kZUlkKSxcbiAgICAgICAgICAgIGxhYmVsLCBidG5FbGVtZW50LCBub2RlRWxlbWVudDtcblxuICAgICAgICBpZiAoIXN1YnRyZWVFbGVtZW50IHx8IHN1YnRyZWVFbGVtZW50ID09PSB0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGFiZWwgPSB0aGlzLnN0YXRlTGFiZWxzW3N0YXRlXTtcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xuICAgICAgICBidG5FbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgICAgICAgbm9kZUVsZW1lbnQsXG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NcbiAgICAgICAgKVswXTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IG5vZGVTdGF0ZXMuT1BFTkVEKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGUobm9kZUVsZW1lbnQsIHN0YXRlKTtcblxuICAgICAgICBpZiAoYnRuRWxlbWVudCkge1xuICAgICAgICAgICAgYnRuRWxlbWVudC5pbm5lckhUTUwgPSBsYWJlbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbm9kZSBjbGFzcyBuYW1lIGZyb20gcHJvdmlkZWQgc3RhdGVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlRWxlbWVudCAtIFRyZWVOb2RlIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOZXcgY2hhbmdlZCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGU6IGZ1bmN0aW9uKG5vZGVFbGVtZW50LCBzdGF0ZSkge1xuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcbiAgICAgICAgICAgIG9wZW5lZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5PUEVORUQgKyAnQ2xhc3MnXSxcbiAgICAgICAgICAgIGNsb3NlZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5DTE9TRUQgKyAnQ2xhc3MnXTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBvcGVuZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBjbG9zZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbFxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG5vZGVJZHMgLSBOb2RlIGlkIGxpc3RcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAc2VlIG91dGVyVGVtcGxhdGUgdXNlcyBcInV0aWwucmVuZGVyVGVtcGxhdGVcIlxuICAgICAqL1xuICAgIF9tYWtlSHRtbDogZnVuY3Rpb24obm9kZUlkcykge1xuICAgICAgICB2YXIgbW9kZWwgPSB0aGlzLm1vZGVsLFxuICAgICAgICAgICAgaHRtbCA9ICcnO1xuXG4gICAgICAgIHNuaXBwZXQuZm9yRWFjaChub2RlSWRzLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gbW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgICAgIHNvdXJjZXMsIHByb3BzO1xuXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNvdXJjZXMgPSB0aGlzLl9nZXRUZW1wbGF0ZShub2RlKTtcbiAgICAgICAgICAgIHByb3BzID0gdGhpcy5fbWFrZVRlbXBsYXRlUHJvcHMobm9kZSk7XG4gICAgICAgICAgICBwcm9wcy5pbm5lclRlbXBsYXRlID0gdGhpcy5fbWFrZUlubmVySFRNTChub2RlLCB7XG4gICAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2VzLmlubmVyLFxuICAgICAgICAgICAgICAgIHByb3BzOiBwcm9wc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBodG1sICs9IHV0aWwucmVuZGVyVGVtcGxhdGUoc291cmNlcy5vdXRlciwgcHJvcHMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBpbm5lciBodG1sIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBub2RlIC0gTm9kZVxuICAgICAqIEBwYXJhbSB7e3NvdXJjZTogc3RyaW5nLCBwcm9wczogT2JqZWN0fX0gW2NhY2hlZF0gLSBDYXNoZWQgZGF0YSB0byBtYWtlIGh0bWxcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBJbm5lciBodG1sIG9mIG5vZGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBzZWUgaW5uZXJUZW1wbGF0ZSB1c2VzIFwidGhpcy5fcmVuZGVyVGVtcGxhdGVcIlxuICAgICAqL1xuICAgIF9tYWtlSW5uZXJIVE1MOiBmdW5jdGlvbihub2RlLCBjYWNoZWQpIHtcbiAgICAgICAgdmFyIHNvdXJjZSwgcHJvcHM7XG5cbiAgICAgICAgY2FjaGVkID0gY2FjaGVkIHx8IHt9O1xuICAgICAgICBzb3VyY2UgPSBjYWNoZWQuc291cmNlIHx8IHRoaXMuX2dldFRlbXBsYXRlKG5vZGUpLmlubmVyO1xuICAgICAgICBwcm9wcyA9IGNhY2hlZC5wcm9wcyB8fCB0aGlzLl9tYWtlVGVtcGxhdGVQcm9wcyhub2RlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fcmVuZGVyVGVtcGxhdGUoc291cmNlLCBwcm9wcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0ZW1wbGF0ZSBzb3VyY2VzXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcmV0dXJucyB7e2lubmVyOiBzdHJpbmcsIG91dGVyOiBzdHJpbmd9fSBUZW1wbGF0ZSBzb3VyY2VzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHNvdXJjZTtcblxuICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xuICAgICAgICAgICAgc291cmNlID0ge1xuICAgICAgICAgICAgICAgIGlubmVyOiB0aGlzLnRlbXBsYXRlLmxlYWZOb2RlLFxuICAgICAgICAgICAgICAgIG91dGVyOiBvdXRlclRlbXBsYXRlLkxFQUZfTk9ERVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICBpbm5lcjogdGhpcy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGUsXG4gICAgICAgICAgICAgICAgb3V0ZXI6IG91dGVyVGVtcGxhdGUuSU5URVJOQUxfTk9ERVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgdGVtcGxhdGUgcHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGVtcGxhdGUgcHJvcGVydGllc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VUZW1wbGF0ZVByb3BzOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzLFxuICAgICAgICAgICAgcHJvcHMsIHN0YXRlO1xuXG4gICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBpZDogbm9kZS5nZXRJZCgpLFxuICAgICAgICAgICAgICAgIGlzTGVhZjogdHJ1ZSAvLyBmb3IgY3VzdG9tIHRlbXBsYXRlIG1ldGhvZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IG5vZGUuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICBzdGF0ZUNsYXNzOiBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10sXG4gICAgICAgICAgICAgICAgc3RhdGVMYWJlbDogdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV0sXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXh0ZW5kKHByb3BzLCBjbGFzc05hbWVzLCBub2RlLmdldEFsbERhdGEoKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERyYXcgZWxlbWVudCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kcmF3OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIGVsZW1lbnQsIGh0bWw7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVEcmF3XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2JlZm9yZURyYXcnLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgIGlmICh0cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCdpc01vdmluZ05vZGUnKTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCdiZWZvcmVEcmF3OiAnICsgbm9kZUlkKTtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpcmUoJ2JlZm9yZURyYXcnLCBub2RlSWQpO1xuXG4gICAgICAgIGlmIChub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBodG1sID0gdGhpcy5fbWFrZUh0bWwobm9kZS5nZXRDaGlsZElkcygpKTtcbiAgICAgICAgICAgIGVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaHRtbCA9IHRoaXMuX21ha2VJbm5lckhUTUwobm9kZSk7XG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHRoaXMuX3NldENsYXNzV2l0aERpc3BsYXkobm9kZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYWZ0ZXJEcmF3XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2FmdGVyRHJhdycsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgKiAgICAgaWYgKHRyZWUuaXNNb3ZpbmdOb2RlKSB7XG4gICAgICAgICAqICAgICAgICAgY29uc29sZS5sb2coJ2lzTW92aW5nTm9kZScpO1xuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ2FmdGVyRHJhdzogJyArIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdhZnRlckRyYXcnLCBub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY2xhc3MgYW5kIGRpc3BsYXkgb2Ygbm9kZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDbGFzc1dpdGhEaXNwbGF5OiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBub2RlSWQgPSBub2RlLmdldElkKCksXG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKSxcbiAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXM7XG5cbiAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5vcGVuZWRDbGFzcyk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZXMuY2xvc2VkQ2xhc3MpO1xuICAgICAgICAgICAgdXRpbC5hZGRDbGFzcyhlbGVtZW50LCBjbGFzc05hbWVzLmxlYWZDbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIG5vZGUuZ2V0U3RhdGUoKSk7XG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDbGFzc1dpdGhEaXNwbGF5KGNoaWxkKTtcbiAgICAgICAgICAgIH0sIG5vZGVJZCwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHN1YnRyZWUgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBUcmVlTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gU3VidHJlZSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3VidHJlZUVsZW1lbnQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpLFxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3NcbiAgICAgICAgICAgIClbMF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VidHJlZUVsZW1lbnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgZGVwdGggb2Ygbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ8dW5kZWZpbmVkfSBEZXB0aFxuICAgICAqL1xuICAgIGdldERlcHRoOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0RGVwdGgobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBsYXN0IGRlcHRoIG9mIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge251bWJlcn0gTGFzdCBkZXB0aFxuICAgICAqL1xuICAgIGdldExhc3REZXB0aDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldExhc3REZXB0aCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcm9vdCBub2RlIGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJvb3Qgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFJvb3ROb2RlSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5yb290Tm9kZS5nZXRJZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gY2hpbGQgaWRzXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fHVuZGVmaW5lZH0gQ2hpbGQgaWRzXG4gICAgICovXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRDaGlsZElkcyhub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcGFyZW50IGlkIG9mIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gUGFyZW50IGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRQYXJlbnRJZChub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXNldCBjbGljayB0aW1lclxuICAgICAqL1xuICAgIHJlc2V0Q2xpY2tUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5jbGlja1RpbWVyKTtcbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgaWQgZnJvbSBlbGVtZW50XG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBFbGVtZW50XG4gICAgICogQHJldHVybnMge3N0cmluZ30gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudChlbGVtZW50SW5Ob2RlKTsgLy8gJ3R1aS10cmVlLW5vZGUtMydcbiAgICAgKi9cbiAgICBnZXROb2RlSWRGcm9tRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICB2YXIgaWRQcmVmaXggPSB0aGlzLmdldE5vZGVJZFByZWZpeCgpO1xuXG4gICAgICAgIHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQuaWQuaW5kZXhPZihpZFByZWZpeCkgPT09IC0xKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmlkIDogJyc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwcmVmaXggb2Ygbm9kZSBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXggb2Ygbm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXROb2RlSWRQcmVmaXgoKTsgLy8gJ3R1aS10cmVlLW5vZGUtJ1xuICAgICAqL1xuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVJZFByZWZpeCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge29iamVjdHx1bmRlZmluZWR9IE5vZGUgZGF0YVxuICAgICAqL1xuICAgIGdldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Tm9kZURhdGEobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQGV4bWFwbGVcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwge2ZvbzogJ2Jhcid9KTsgLy8gYXV0byByZWZyZXNoXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIHtmb286ICdiYXInfSwgdHJ1ZSk7IC8vIG5vdCByZWZyZXNoXG4gICAgICovXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCwgZGF0YSwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEsIGlzU2lsZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIG5vZGUgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fSBuYW1lcyAtIE5hbWVzIG9mIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgJ2ZvbycpOyAvLyBhdXRvIHJlZnJlc2hcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgJ2ZvbycsIHRydWUpOyAvLyBub3QgcmVmcmVzaFxuICAgICAqL1xuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIG5hbWVzLCBpc1NpbGVudCkge1xuICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZU5vZGVEYXRhKG5vZGVJZCwgbmFtZXMsIGlzU2lsZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgc3RhdGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IE5vZGUgc3RhdGUoKCdvcGVuZWQnLCAnY2xvc2VkJywgbnVsbClcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0U3RhdGUobm9kZUlkKTsgLy8gJ29wZW5lZCcsICdjbG9zZWQnLFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgLy8gdW5kZWZpbmVkIGlmIHRoZSBub2RlIGlzIG5vbmV4aXN0ZW50XG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPcGVuIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKi9cbiAgICBvcGVuOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5PUEVORUQ7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xvc2Ugbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5DTE9TRUQ7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKi9cbiAgICB0b2dnbGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3RhdGU7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUudG9nZ2xlU3RhdGUoKTtcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU29ydCBhbGwgbm9kZXNcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZm9yIHNvcnRpbmdcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyB0cmVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBTb3J0IHdpdGggcmVkcmF3aW5nIHRyZWVcbiAgICAgKiB0cmVlLnNvcnQoZnVuY3Rpb24obm9kZUEsIG5vZGVCKSB7XG4gICAgICogICAgIHZhciBhVmFsdWUgPSBub2RlQS5nZXREYXRhKCd0ZXh0JyksXG4gICAgICogICAgICAgICBiVmFsdWUgPSBub2RlQi5nZXREYXRhKCd0ZXh0Jyk7XG4gICAgICpcbiAgICAgKiAgICAgaWYgKCFiVmFsdWUgfHwgIWJWYWx1ZS5sb2NhbGVDb21wYXJlKSB7XG4gICAgICogICAgICAgICByZXR1cm4gMDtcbiAgICAgKiAgICAgfVxuICAgICAqICAgICByZXR1cm4gYlZhbHVlLmxvY2FsZUNvbXBhcmUoYVZhbHVlKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIC8vIFNvcnQsIGJ1dCBub3QgcmVkcmF3IHRyZWVcbiAgICAgKiB0cmVlLnNvcnQoZnVuY3Rpb24obm9kZUEsIG5vZGVCKSB7XG4gICAgICogICAgIHZhciBhVmFsdWUgPSBub2RlQS5nZXREYXRhKCd0ZXh0JyksXG4gICAgICogICAgICAgICBiVmFsdWUgPSBub2RlQi5nZXREYXRhKCd0ZXh0Jyk7XG4gICAgICpcbiAgICAgKiAgICAgaWYgKCFiVmFsdWUgfHwgIWJWYWx1ZS5sb2NhbGVDb21wYXJlKSB7XG4gICAgICogICAgICAgICByZXR1cm4gMDtcbiAgICAgKiAgICAgfVxuICAgICAqICAgICByZXR1cm4gYlZhbHVlLmxvY2FsZUNvbXBhcmUoYVZhbHVlKTtcbiAgICAgKiB9LCB0cnVlKTtcbiAgICAgKi9cbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yLCBpc1NpbGVudCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNvcnQoY29tcGFyYXRvcik7XG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZnJlc2ggdHJlZSBvciBub2RlJ3MgY2hpbGRyZW5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtub2RlSWRdIC0gVHJlZU5vZGUgaWQgdG8gcmVmcmVzaFxuICAgICAqL1xuICAgIHJlZnJlc2g6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICBub2RlSWQgPSBub2RlSWQgfHwgdGhpcy5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIHRoaXMuX2RyYXcobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICogICAgIGNvbnNvbGUubG9nKG5vZGUuZ2V0SWQoKSA9PT0gbm9kZUlkKTsgLy8gdHJ1ZVxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIGVhY2hBbGw6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMubW9kZWwuZWFjaEFsbChpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgZGVzY2VuZGFudHMgb2YgYSBub2RlLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5lYWNoKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAqICAgICBjb25zb2xlLmxvZyhub2RlLmdldElkKCkgPT09IG5vZGVJZCk7IC8vIHRydWVcbiAgICAgKiB9LCBwYXJlbnRJZCk7XG4gICAgICpcbiAgICAgKi9cbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBub2RlKHMpLlxuICAgICAqIC0gSWYgdGhlIHBhcmVudElkIGlzIGZhbHN5LCB0aGUgbm9kZSB3aWxsIGJlIGFwcGVuZGVkIHRvIHJvb3ROb2RlLlxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdy1kYXRhXG4gICAgICogQHBhcmFtIHsqfSBbcGFyZW50SWRdIC0gUGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBhZGQgbm9kZSB3aXRoIHJlZHJhd2luZ1xuICAgICAqIHZhciBmaXJzdEFkZGVkSWRzID0gdHJlZS5hZGQoe3RleHQ6J0ZFIGRldmVsb3BtZW50IHRlYW0xJ30sIHBhcmVudElkKTtcbiAgICAgKiBjb25zb2xlLmxvZyhmaXJzdEFkZGVkSWRzKTsgLy8gW1widHVpLXRyZWUtbm9kZS0xMFwiXVxuICAgICAqXG4gICAgICogLy8gYWRkIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcbiAgICAgKiB2YXIgc2Vjb25kQWRkZWRJZHMgPSB0cmVlLmFkZChbXG4gICAgICogICAge3RleHQ6ICdGRSBkZXZlbG9wbWVudCB0ZWFtMid9LFxuICAgICAqICAgIHt0ZXh0OiAnRkUgZGV2ZWxvcG1lbnQgdGVhbTMnfVxuICAgICAqIF0sIHBhcmVudElkLCB0cnVlKTtcbiAgICAgKiBjb25zb2xlLmxvZyhzZWNvbmRBZGRlZElkcyk7IC8vIFtcInR1aS10cmVlLW5vZGUtMTFcIiwgXCJ0dWktdHJlZS1ub2RlLTEyXCJdXG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuYWRkKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IGFsbCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3IGRhdGEgZm9yIGFsbCBub2Rlc1xuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQWRkZWQgbm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUucmVzZXRBbGxEYXRhKFtcbiAgICAgKiAge3RleHQ6ICdoZWxsbycsIGNoaWxkcmVuOiBbXG4gICAgICogICAgICB7dGV4dDogJ2Zvbyd9LFxuICAgICAqICAgICAge3RleHQ6ICdiYXInfVxuICAgICAqICBdfSxcbiAgICAgKiAge3RleHQ6ICd3b2xyZCd9XG4gICAgICogXSk7XG4gICAgICovXG4gICAgcmVzZXRBbGxEYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsQ2hpbGRyZW4odGhpcy5nZXRSb290Tm9kZUlkKCksIHRydWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFkZChkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFsbCBjaGlsZHJlblxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyB0aGUgbm9kZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZW1vdmVBbGxDaGlsZHJlbihub2RlSWQpOyAvLyBSZWRyYXdzIHRoZSBub2RlXG4gICAgICogdHJlZS5yZW1vdmVBbGxDaGlsZHJlbihub2RJZCwgdHJ1ZSk7IC8vIERvZXNuJ3QgcmVkcmF3IHRoZSBub2RlXG4gICAgICovXG4gICAgcmVtb3ZlQWxsQ2hpbGRyZW46IGZ1bmN0aW9uKG5vZGVJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRDaGlsZElkcyhub2RlSWQpO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNoaWxkSWQsIHRydWUpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9kcmF3KG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZCB0byByZW1vdmVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZW1vdmUobXlOb2RlSWQpOyAvLyByZW1vdmUgbm9kZSB3aXRoIHJlZHJhd2luZ1xuICAgICAqIHRyZWUucmVtb3ZlKG15Tm9kZUlkLCB0cnVlKTsgLy8gcmVtb3ZlIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmUobm9kZUlkLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnRcbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUubW92ZShteU5vZGVJZCwgbmV3UGFyZW50SWQpOyAvLyBtb2RlIG5vZGUgd2l0aCByZWRyYXdpbmdcbiAgICAgKiB0cmVlLm1vdmUobXlOb2RlSWQsIG5ld1BhcmVudElkLCB0cnVlKTsgLy8gbW92ZSBub2RlIHdpdGhvdXQgcmVkcmF3aW5nXG4gICAgICovXG4gICAgbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5pc01vdmluZ05vZGUgPSB0cnVlO1xuICAgICAgICB0aGlzLm1vZGVsLm1vdmUobm9kZUlkLCBuZXdQYXJlbnRJZCwgaXNTaWxlbnQpO1xuICAgICAgICB0aGlzLmlzTW92aW5nTm9kZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2ggbm9kZSBpZHMgYnkgcGFzc2luZyB0aGUgcHJlZGljYXRlIGNoZWNrIG9yIG1hdGNoaW5nIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R9IHByZWRpY2F0ZSAtIFByZWRpY2F0ZSBvciBkYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgcHJlZGljYXRlXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBOb2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gc2VhcmNoIGZyb20gcHJlZGljYXRlXG4gICAgICogdmFyIGxlYWZOb2RlSWRzID0gdHJlZS5zZWFyY2goZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICogICAgIHJldHVybiBub2RlLmlzTGVhZigpO1xuICAgICAqIH0pO1xuICAgICAqIGNvbnNvbGUubG9nKGxlYWZOb2RlSWRzKTsgLy8gWyd0dWktdHJlZS1ub2RlLTMnLCAndHVpLXRyZWUtbm9kZS01J11cbiAgICAgKlxuICAgICAqIC8vIHNlYXJjaCBmcm9tIGRhdGFcbiAgICAgKiB2YXIgc3BlY2lhbE5vZGVJZHMgPSB0cmVlLnNlYXJjaCh7XG4gICAgICogICAgIGlzU3BlY2lhbDogdHJ1ZSxcbiAgICAgKiAgICAgZm9vOiAnYmFyJ1xuICAgICAqIH0pO1xuICAgICAqIGNvbnNvbGUubG9nKHNwZWNpYWxOb2RlSWRzKTsgLy8gWyd0dWktdHJlZS1ub2RlLTUnLCAndHVpLXRyZWUtbm9kZS0xMCddXG4gICAgICogY29uc29sZS5sb2codHJlZS5nZXROb2RlRGF0YSgndHVpLXRyZWUtbm9kZS01JykuaXNTcGVjaWFsKTsgLy8gdHJ1ZVxuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuZ2V0Tm9kZURhdGEoJ3R1aS10cmVlLW5vZGUtNScpLmZvbyk7IC8vICdiYXInXG4gICAgICovXG4gICAgc2VhcmNoOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKCFzbmlwcGV0LmlzT2JqZWN0KHByZWRpY2F0ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzbmlwcGV0LmlzRnVuY3Rpb24ocHJlZGljYXRlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3doZXJlKHByZWRpY2F0ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlYXJjaCBub2RlIGlkcyBieSBtYXRjaGluZyBkYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gRGF0YVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF93aGVyZTogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcihmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhID0gbm9kZS5nZXRBbGxEYXRhKCk7XG5cbiAgICAgICAgICAgIHNuaXBwZXQuZm9yRWFjaChwcm9wcywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChrZXkgaW4gZGF0YSkgJiYgKGRhdGFba2V5XSA9PT0gdmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIG5vZGUgaWRzIGJ5IHBhc3NpbmcgdGhlIHByZWRpY2F0ZSBjaGVja1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSAtIFByZWRpY2F0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIHByZWRpY2F0ZVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWx0ZXI6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcblxuICAgICAgICB0aGlzLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUsIG5vZGVJZCkpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKG5vZGVJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNvbnRleHQpO1xuXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBsZWFmXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgaXMgbGVhZi5cbiAgICAgKi9cbiAgICBpc0xlYWY6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIHJldHVybiBub2RlICYmIG5vZGUuaXNMZWFmKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgYSBub2RlIGlzIGEgYW5jZXN0b3Igb2YgYW5vdGhlciBub2RlLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVyTm9kZUlkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGNvbnRhaW4gdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVkTm9kZUlkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGJlIGNvbnRhaW5lZCBieSB0aGUgb3RoZXIgbm9kZVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIGEgbm9kZSBjb250YWlucyBhbm90aGVyIG5vZGVcbiAgICAgKi9cbiAgICBjb250YWluczogZnVuY3Rpb24oY29udGFpbmVyTm9kZUlkLCBjb250YWluZWROb2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuY29udGFpbnMoY29udGFpbmVkTm9kZUlkLCBjb250YWluZWROb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZmFjaWxpdHkgb2YgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnLCAnRWRpdGFibGUnXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIEZlYXR1cmUgb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtUcmVlfSB0aGlzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJywge1xuICAgICAqICAgICAgc2VsZWN0ZWRDbGFzc05hbWU6ICd0dWktdHJlZS1zZWxlY3RlZCdcbiAgICAgKiAgfSlcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJywge1xuICAgICAqICAgICAgZW5hYmxlQ2xhc3NOYW1lOiB0cmVlLmNsYXNzTmFtZXMudGV4dENsYXNzLFxuICAgICAqICAgICAgZGF0YUtleTogJ3RleHQnLFxuICAgICAqICAgICAgaW5wdXRDbGFzc05hbWU6ICdteUlucHV0J1xuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnRHJhZ2dhYmxlJywge1xuICAgICAqICAgICAgdXNlSGVscGVyOiB0cnVlLFxuICAgICAqICAgICAgaGVscGVyUG9zOiB7eDogNSwgeTogMn0sXG4gICAgICogICAgICByZWplY3RlZFRhZ05hbWVzOiBbJ1VMJywgJ0lOUFVUJywgJ0JVVFRPTiddLFxuICAgICAqICAgICAgcmVqZWN0ZWRDbGFzc05hbWVzOiBbJ25vdERyYWdnYWJsZScsICdub3REcmFnZ2FibGUtMiddXG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdDaGVja2JveCcsIHtcbiAgICAgKiAgICAgIGNoZWNrYm94Q2xhc3NOYW1lOiAndHVpLXRyZWUtY2hlY2tib3gnXG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdDb250ZXh0TWVudSwge1xuICAgICAqICB9KTtcbiAgICAgKi9cbiAgICBlbmFibGVGZWF0dXJlOiBmdW5jdGlvbihmZWF0dXJlTmFtZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgRmVhdHVyZSA9IGZlYXR1cmVzW2ZlYXR1cmVOYW1lXTtcblxuICAgICAgICB0aGlzLmRpc2FibGVGZWF0dXJlKGZlYXR1cmVOYW1lKTtcbiAgICAgICAgaWYgKEZlYXR1cmUpIHtcbiAgICAgICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXSA9IG5ldyBGZWF0dXJlKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgZmFjaWxpdHkgb2YgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnLCAnRWRpdGFibGUnXG4gICAgICogQHJldHVybnMge1RyZWV9IHRoaXNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWVcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdEcmFnZ2FibGUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJylcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdDaGVja2JveCcpXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnQ29udGV4dE1lbnUnKTtcbiAgICAgKi9cbiAgICBkaXNhYmxlRmVhdHVyZTogZnVuY3Rpb24oZmVhdHVyZU5hbWUpIHtcbiAgICAgICAgdmFyIGZlYXR1cmUgPSB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV07XG5cbiAgICAgICAgaWYgKGZlYXR1cmUpIHtcbiAgICAgICAgICAgIGZlYXR1cmUuZGVzdHJveSgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFNldCBhYnN0cmFjdCBhcGlzIHRvIHRyZWUgcHJvdG90eXBlXG4gKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSBGZWF0dXJlIG5hbWVcbiAqIEBwYXJhbSB7b2JqZWN0fSBmZWF0dXJlIC0gRmVhdHVyZVxuICovXG5mdW5jdGlvbiBzZXRBYnN0cmFjdEFQSXMoZmVhdHVyZU5hbWUsIGZlYXR1cmUpIHtcbiAgICB2YXIgbWVzc2FnZU5hbWUgPSAnSU5WQUxJRF9BUElfJyArIGZlYXR1cmVOYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICAgIGFwaUxpc3QgPSBmZWF0dXJlLmdldEFQSUxpc3QgPyBmZWF0dXJlLmdldEFQSUxpc3QoKSA6IFtdO1xuXG4gICAgc25pcHBldC5mb3JFYWNoKGFwaUxpc3QsIGZ1bmN0aW9uKGFwaSkge1xuICAgICAgICBUcmVlLnByb3RvdHlwZVthcGldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZXNbbWVzc2FnZU5hbWVdIHx8IG1lc3NhZ2VzLklOVkFMSURfQVBJKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn1cbnNuaXBwZXQuZm9yRWFjaChmZWF0dXJlcywgZnVuY3Rpb24oRmVhdHVyZSwgbmFtZSkge1xuICAgIHNldEFic3RyYWN0QVBJcyhuYW1lLCBGZWF0dXJlKTtcbn0pO1xuc25pcHBldC5DdXN0b21FdmVudHMubWl4aW4oVHJlZSk7XG5tb2R1bGUuZXhwb3J0cyA9IFRyZWU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXBkYXRlIHZpZXcgYW5kIGNvbnRyb2wgdHJlZSBkYXRhXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIFRyZWVOb2RlID0gcmVxdWlyZSgnLi90cmVlTm9kZScpO1xuXG52YXIgZXh0ZW5kID0gdHVpLnV0aWwuZXh0ZW5kLFxuICAgIGtleXMgPSB0dWkudXRpbC5rZXlzLFxuICAgIGZvckVhY2ggPSB0dWkudXRpbC5mb3JFYWNoLFxuICAgIG1hcCA9IHR1aS51dGlsLm1hcDtcblxuLyoqXG4gKiBUcmVlIG1vZGVsXG4gKiBAY29uc3RydWN0b3IgVHJlZU1vZGVsXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gRGF0YVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zIGZvciBkZWZhdWx0U3RhdGUgYW5kIG5vZGVJZFByZWZpeFxuICoqL1xudmFyIFRyZWVNb2RlbCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU1vZGVsLnByb3RvdHlwZSAqL3sgLyogZXNsaW50LWRpc2FibGUgKi9cbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgVHJlZU5vZGUuc2V0SWRQcmVmaXgob3B0aW9ucy5ub2RlSWRQcmVmaXgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IHN0YXRlIG9mIG5vZGVcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubm9kZURlZmF1bHRTdGF0ZSA9IG9wdGlvbnMubm9kZURlZmF1bHRTdGF0ZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUm9vdCBub2RlXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTm9kZX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucm9vdE5vZGUgPSBuZXcgVHJlZU5vZGUoe1xuICAgICAgICAgICAgc3RhdGU6ICdvcGVuZWQnXG4gICAgICAgIH0sIG51bGwpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmVlIGhhc2ggaGF2aW5nIGFsbCBub2Rlc1xuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0LjxzdHJpbmcsIFRyZWVOb2RlPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZUhhc2ggPSB7fTtcblxuICAgICAgICB0aGlzLl9zZXREYXRhKGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcHJlZml4IG9mIG5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXhcbiAgICAgKi9cbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gVHJlZU5vZGUuaWRQcmVmaXg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBtb2RlbCB3aXRoIHRyZWUgZGF0YVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBUcmVlIGRhdGFcbiAgICAgKi9cbiAgICBfc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgcm9vdCA9IHRoaXMucm9vdE5vZGUsXG4gICAgICAgICAgICByb290SWQgPSByb290LmdldElkKCk7XG5cbiAgICAgICAgdGhpcy50cmVlSGFzaFtyb290SWRdID0gcm9vdDtcbiAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHJvb3QpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRyZWUgaGFzaCBmcm9tIGRhdGEgYW5kIHBhcmVudE5vZGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gcGFyZW50IC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZVRyZWVIYXNoOiBmdW5jdGlvbihkYXRhLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIHBhcmVudElkID0gcGFyZW50LmdldElkKCksXG4gICAgICAgICAgICBpZHMgPSBbXTtcblxuICAgICAgICBmb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKGRhdHVtKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW5EYXRhID0gZGF0dW0uY2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMuX2NyZWF0ZU5vZGUoZGF0dW0sIHBhcmVudElkKSxcbiAgICAgICAgICAgICAgICBub2RlSWQgPSBub2RlLmdldElkKCk7XG5cbiAgICAgICAgICAgIGlkcy5wdXNoKG5vZGVJZCk7XG4gICAgICAgICAgICB0aGlzLnRyZWVIYXNoW25vZGVJZF0gPSBub2RlO1xuICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcbiAgICAgICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChjaGlsZHJlbkRhdGEsIG5vZGUpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gaWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgbm9kZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlRGF0YSAtIERhdHVtIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgaWRcbiAgICAgKiBAcmV0dXJucyB7VHJlZU5vZGV9IFRyZWVOb2RlXG4gICAgICovXG4gICAgX2NyZWF0ZU5vZGU6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkge1xuICAgICAgICBub2RlRGF0YSA9IGV4dGVuZCh7XG4gICAgICAgICAgICBzdGF0ZTogdGhpcy5ub2RlRGVmYXVsdFN0YXRlXG4gICAgICAgIH0sIG5vZGVEYXRhKTtcblxuICAgICAgICByZXR1cm4gbmV3IFRyZWVOb2RlKG5vZGVEYXRhLCBwYXJlbnRJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGlsZHJlblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMgez9BcnJheS48VHJlZU5vZGU+fSBjaGlsZHJlblxuICAgICAqL1xuICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5nZXRDaGlsZElkcyhub2RlSWQpO1xuXG4gICAgICAgIGlmICghY2hpbGRJZHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hcChjaGlsZElkcywgZnVuY3Rpb24oY2hpbGRJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZShjaGlsZElkKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGlsZCBpZHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/QXJyYXkuPHN0cmluZz59IENoaWxkIGlkc1xuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0Q2hpbGRJZHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBudW1iZXIgb2Ygbm9kZXNcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIG5vZGVzXG4gICAgICovXG4gICAgZ2V0Q291bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ga2V5cyh0aGlzLnRyZWVIYXNoKS5sZW5ndGg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBsYXN0IGRlcHRoXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIGxhc3QgZGVwdGhcbiAgICAgKi9cbiAgICBnZXRMYXN0RGVwdGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGVwdGhzID0gbWFwKHRoaXMudHJlZUhhc2gsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldERlcHRoKG5vZGUuZ2V0SWQoKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShudWxsLCBkZXB0aHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBBIG5vZGUgaWQgdG8gZmluZFxuICAgICAqIEByZXR1cm5zIHs/VHJlZU5vZGV9IE5vZGVcbiAgICAgKi9cbiAgICBnZXROb2RlOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmVlSGFzaFtpZF07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBkZXB0aCBmcm9tIG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBBIG5vZGUgaWQgdG8gZmluZFxuICAgICAqIEByZXR1cm5zIHs/bnVtYmVyfSBEZXB0aFxuICAgICAqL1xuICAgIGdldERlcHRoOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXG4gICAgICAgICAgICBkZXB0aCA9IDAsXG4gICAgICAgICAgICBwYXJlbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShub2RlLmdldFBhcmVudElkKCkpO1xuICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICBkZXB0aCArPSAxO1xuICAgICAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKHBhcmVudC5nZXRQYXJlbnRJZCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXB0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHBhcmVudCBpZCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/c3RyaW5nfSBQYXJlbnQgaWRcbiAgICAgKi9cbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRQYXJlbnRJZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBub2RlIHdpdGggY2hpbGRyZW4uXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKGlkLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXG4gICAgICAgICAgICBwYXJlbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcblxuICAgICAgICBmb3JFYWNoKG5vZGUuZ2V0Q2hpbGRJZHMoKSwgZnVuY3Rpb24oY2hpbGRJZCkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoY2hpbGRJZCwgdHJ1ZSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZElkKGlkKTtcbiAgICAgICAgZGVsZXRlIHRoaXMudHJlZUhhc2hbaWRdO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgcGFyZW50LmdldElkKCkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBub2RlKHMpLlxuICAgICAqIC0gSWYgdGhlIHBhcmVudElkIGlzIGZhbHN5LCB0aGUgbm9kZSB3aWxsIGJlIGFwcGVuZGVkIHRvIHJvb3ROb2RlLlxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5ldyBhZGRlZCBub2RlIGlkc1xuICAgICAqL1xuICAgIGFkZDogZnVuY3Rpb24oZGF0YSwgcGFyZW50SWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGUsXG4gICAgICAgICAgICBpZHM7XG5cbiAgICAgICAgZGF0YSA9IFtdLmNvbmNhdChkYXRhKTtcbiAgICAgICAgaWRzID0gdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHBhcmVudCk7XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnQuZ2V0SWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgLSBQcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqL1xuICAgIHNldE5vZGVEYXRhOiBmdW5jdGlvbihpZCwgcHJvcHMsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcblxuICAgICAgICBpZiAoIW5vZGUgfHwgIXByb3BzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLnNldERhdGEocHJvcHMpO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24oaWQsIG5hbWVzLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8ICFuYW1lcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR1aS51dGlsLmlzQXJyYXkobmFtZXMpKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZURhdGEuYXBwbHkobm9kZSwgbmFtZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhKG5hbWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnQncyBjaGlsZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICBtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG5ld1BhcmVudElkLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgb3JpZ2luYWxQYXJlbnQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudDtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBuZXdQYXJlbnQgPSB0aGlzLmdldE5vZGUobmV3UGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGU7XG4gICAgICAgIG5ld1BhcmVudElkID0gbmV3UGFyZW50LmdldElkKCk7XG4gICAgICAgIG9yaWdpbmFsUGFyZW50SWQgPSBub2RlLmdldFBhcmVudElkKCk7XG4gICAgICAgIG9yaWdpbmFsUGFyZW50ID0gdGhpcy5nZXROb2RlKG9yaWdpbmFsUGFyZW50SWQpO1xuXG4gICAgICAgIGlmIChub2RlSWQgPT09IG5ld1BhcmVudElkIHx8IHRoaXMuY29udGFpbnMobm9kZUlkLCBuZXdQYXJlbnRJZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvcmlnaW5hbFBhcmVudC5yZW1vdmVDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgIG5vZGUuc2V0UGFyZW50SWQobmV3UGFyZW50SWQpO1xuICAgICAgICBuZXdQYXJlbnQuYWRkQ2hpbGRJZChub2RlSWQpO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnbW92ZScsIG5vZGVJZCwgb3JpZ2luYWxQYXJlbnRJZCwgbmV3UGFyZW50SWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgYSBub2RlIGlzIGEgYW5jZXN0b3Igb2YgYW5vdGhlciBub2RlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBjb250YWluIHRoZSBvdGhlciBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lZElkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGJlIGNvbnRhaW5lZCBieSB0aGUgb3RoZXIgbm9kZVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIGEgbm9kZSBjb250YWlucyBhbm90aGVyIG5vZGVcbiAgICAgKi9cbiAgICBjb250YWluczogZnVuY3Rpb24oY29udGFpbmVySWQsIGNvbnRhaW5lZElkKSB7XG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHRoaXMuZ2V0UGFyZW50SWQoY29udGFpbmVkSWQpLFxuICAgICAgICAgICAgaXNDb250YWluZWQgPSBmYWxzZTtcblxuICAgICAgICB3aGlsZSAoIWlzQ29udGFpbmVkICYmIHBhcmVudElkKSB7XG4gICAgICAgICAgICBpc0NvbnRhaW5lZCA9IChjb250YWluZXJJZCA9PT0gcGFyZW50SWQpO1xuICAgICAgICAgICAgcGFyZW50SWQgPSB0aGlzLmdldFBhcmVudElkKHBhcmVudElkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc0NvbnRhaW5lZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU29ydCBub2Rlc1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgLSBDb21wYXJhdG9yIGZ1bmN0aW9uXG4gICAgICovXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvcikge1xuICAgICAgICB0aGlzLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmdldENoaWxkcmVuKG5vZGVJZCksXG4gICAgICAgICAgICAgICAgY2hpbGRJZHM7XG5cbiAgICAgICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW4uc29ydChjb21wYXJhdG9yKTtcblxuICAgICAgICAgICAgICAgIGNoaWxkSWRzID0gbWFwKGNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGQuZ2V0SWQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBub2RlLnJlcGxhY2VDaGlsZElkcyhjaGlsZElkcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBkYXRhIChhbGwpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P29iamVjdH0gTm9kZSBkYXRhXG4gICAgICovXG4gICAgZ2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRBbGxEYXRhKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgbm9kZXMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXG4gICAgICovXG4gICAgZWFjaEFsbDogZnVuY3Rpb24oaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcblxuICAgICAgICBmb3JFYWNoKHRoaXMudHJlZUhhc2gsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaXRlcmF0ZWUuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgZGVzY2VuZGFudHMgb2YgYSBub2RlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXG4gICAgICovXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KSB7IC8vZGVwdGgtZmlyc3RcbiAgICAgICAgdmFyIHN0YWNrLCBub2RlSWQsIG5vZGU7XG5cbiAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShwYXJlbnRJZCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0YWNrID0gbm9kZS5nZXRDaGlsZElkcygpO1xuXG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XG4gICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIG5vZGVJZCA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xuICAgICAgICAgICAgaXRlcmF0ZWUuY2FsbChjb250ZXh0LCBub2RlLCBub2RlSWQpO1xuXG4gICAgICAgICAgICBzdGFjayA9IHN0YWNrLmNvbmNhdChub2RlLmdldENoaWxkSWRzKCkpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihUcmVlTW9kZWwpO1xubW9kdWxlLmV4cG9ydHMgPSBUcmVlTW9kZWw7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdGF0ZXMgPSByZXF1aXJlKCcuL2NvbnN0cy9zdGF0ZXMnKS5ub2RlLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIGxhc3RJbmRleCA9IDAsXG4gICAgZ2V0TmV4dEluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxhc3RJbmRleDtcbiAgICAgICAgbGFzdEluZGV4ICs9IDE7XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG4gICAgUkVTRVJWRURfUFJPUEVSVElFUyA9IHtcbiAgICAgICAgaWQ6ICcnLFxuICAgICAgICBzdGF0ZTogJ3NldFN0YXRlJyxcbiAgICAgICAgY2hpbGRyZW46ICcnXG4gICAgfSxcbiAgICBpbkFycmF5ID0gdHVpLnV0aWwuaW5BcnJheTtcblxuLyoqXG4gKiBUcmVlTm9kZVxuICogQENvbnN0cnVjdG9yIFRyZWVOb2RlXG4gKiBAcGFyYW0ge09iamVjdH0gbm9kZURhdGEgLSBOb2RlIGRhdGFcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gUGFyZW50IG5vZGUgaWRcbiAqL1xudmFyIFRyZWVOb2RlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlTm9kZS5wcm90b3R5cGUgKi97IC8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IHByZWZpeCBvZiBpZFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IC0gUHJlZml4IG9mIGlkXG4gICAgICAgICAqL1xuICAgICAgICBzZXRJZFByZWZpeDogZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgICAgICAgICB0aGlzLmlkUHJlZml4ID0gcHJlZml4IHx8IHRoaXMuaWRQcmVmaXg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByZWZpeCBvZiBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgaWRQcmVmaXg6ICcnXG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbihub2RlRGF0YSwgcGFyZW50SWQpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2lkID0gdGhpcy5jb25zdHJ1Y3Rvci5pZFByZWZpeCArIGdldE5leHRJbmRleCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXJlbnQgbm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPG51bWJlcj59XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIGRhdGFcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBzdGF0ZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuXG4gICAgICAgIHRoaXMuc2V0RGF0YShub2RlRGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByZXNlcnZlZCBwcm9wZXJ0aWVzIGZyb20gZGF0YVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gTm9kZSBkYXRhXG4gICAgICogQHJldHVybnMge29iamVjdH0gTm9kZSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0UmVzZXJ2ZWRQcm9wZXJ0aWVzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2hPd25Qcm9wZXJ0aWVzKFJFU0VSVkVEX1BST1BFUlRJRVMsIGZ1bmN0aW9uKHNldHRlciwgbmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtuYW1lXTtcblxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHNldHRlcikge1xuICAgICAgICAgICAgICAgIHRoaXNbc2V0dGVyXSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgZGF0YVtuYW1lXTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBzdGF0ZVxuICAgICAqIEBhcGlcbiAgICAgKi9cbiAgICB0b2dnbGVTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZSA9PT0gc3RhdGVzLkNMT1NFRCkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuT1BFTkVEO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBzdGF0ZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBTdGF0ZSBvZiBub2RlICgnY2xvc2VkJywgJ29wZW5lZCcpXG4gICAgICovXG4gICAgc2V0U3RhdGU6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgIHN0YXRlID0gU3RyaW5nKHN0YXRlKTtcbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXNbc3RhdGUudG9VcHBlckNhc2UoKV0gfHwgdGhpcy5fc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzdGF0ZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzdGF0ZSAoJ29wZW5lZCcgb3IgJ2Nsb3NlZCcpXG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBOb2RlIGlkXG4gICAgICovXG4gICAgZ2V0SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwYXJlbnQgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUGFyZW50IG5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnRJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICovXG4gICAgc2V0UGFyZW50SWQ6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHRoaXMuX3BhcmVudElkID0gcGFyZW50SWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2UgY2hpbGRJZHNcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBjaGlsZElkcyAtIElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKi9cbiAgICByZXBsYWNlQ2hpbGRJZHM6IGZ1bmN0aW9uKGNoaWxkSWRzKSB7XG4gICAgICAgIHRoaXMuX2NoaWxkSWRzID0gY2hpbGRJZHM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48bnVtYmVyPn0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkSWRzLnNsaWNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICBhZGRDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLl9jaGlsZElkcztcblxuICAgICAgICBpZiAodHVpLnV0aWwuaW5BcnJheShjaGlsZElkcywgaWQpID09PSAtMSkge1xuICAgICAgICAgICAgY2hpbGRJZHMucHVzaChpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIHJlbW92ZUNoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlSXRlbUZyb21BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFByb3BlcnR5IG5hbWUgb2YgZGF0YVxuICAgICAqIEByZXR1cm5zIHsqfSBEYXRhXG4gICAgICovXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtuYW1lXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IERhdGFcbiAgICAgKi9cbiAgICBnZXRBbGxEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHR1aS51dGlsLmV4dGVuZCh7fSwgdGhpcy5fZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRGF0YSBmb3IgYWRkaW5nXG4gICAgICovXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkYXRhID0gdGhpcy5fc2V0UmVzZXJ2ZWRQcm9wZXJ0aWVzKGRhdGEpO1xuICAgICAgICB0dWkudXRpbC5leHRlbmQodGhpcy5fZGF0YSwgZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7Li4uc3RyaW5nfSBuYW1lcyAtIE5hbWVzIG9mIGRhdGFcbiAgICAgKi9cbiAgICByZW1vdmVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaEFycmF5KGFyZ3VtZW50cywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIG5vZGUgaGFzIGEgcHJvdmlkZWQgY2hpbGQgaWQuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoaXMgbm9kZSBoYXMgYSBwcm92aWRlZCBjaGlsZCBpZC5cbiAgICAgKi9cbiAgICBoYXNDaGlsZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIGluQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKSAhPT0gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyBsZWFmLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gTm9kZSBpcyBsZWFmIG9yIG5vdC5cbiAgICAgKi9cbiAgICBpc0xlYWY6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRJZHMubGVuZ3RoID09PSAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIG5vZGUgaXMgcm9vdC5cbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IE5vZGUgaXMgcm9vdCBvciBub3QuXG4gICAgICovXG4gICAgaXNSb290OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHR1aS51dGlsLmlzRmFsc3kodGhpcy5fcGFyZW50SWQpO1xuICAgIH1cbn0pO1xubW9kdWxlLmV4cG9ydHMgPSBUcmVlTm9kZTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBIZWxwZXIgb2JqZWN0IHRvIG1ha2UgZWFzeSB0cmVlIGVsZW1lbnRzXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBpc1VuZGVmaW5lZCA9IHR1aS51dGlsLmlzVW5kZWZpbmVkLFxuICAgIHBpY2sgPSB0dWkudXRpbC5waWNrLFxuICAgIHRlbXBsYXRlTWFza1JlID0gL1xce1xceyguKz8pfX0vZ2ksXG4gICAgaXNWYWxpZERvdE5vdGF0aW9uUmUgPSAvXlxcdysoPzpcXC5cXHcrKSokLyxcbiAgICBpc1ZhbGlkRG90Tm90YXRpb24gPSBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgcmV0dXJuIGlzVmFsaWREb3ROb3RhdGlvblJlLnRlc3Qoc3RyKTtcbiAgICB9LFxuICAgIGlzQXJyYXkgPSB0dWkudXRpbC5pc0FycmF5U2FmZTtcblxudmFyIHV0aWwgPSB7XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpcnN0IHNwZWNpZmllZCBpdGVtIGZyb20gYXJyYXksIGlmIGl0IGV4aXN0c1xuICAgICAqIEBwYXJhbSB7Kn0gaXRlbSBJdGVtIHRvIGxvb2sgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyIEFycmF5IHRvIHF1ZXJ5XG4gICAgICovXG4gICAgcmVtb3ZlSXRlbUZyb21BcnJheTogZnVuY3Rpb24oaXRlbSwgYXJyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGFyci5sZW5ndGggLSAxO1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBpZiAoaXRlbSA9PT0gYXJyW2luZGV4XSkge1xuICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXggLT0gMTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2xhc3NuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSAtIENsYXNzbmFtZVxuICAgICAqL1xuICAgIGFkZENsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC5jbGFzc05hbWUgPT09ICcnKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICghdXRpbC5oYXNDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSArPSAnICcgKyBjbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNsYXNzbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBDbGFzc25hbWVcbiAgICAgKi9cbiAgICByZW1vdmVDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBvcmlnaW5hbENsYXNzTmFtZSA9IHV0aWwuZ2V0Q2xhc3MoZWxlbWVudCksXG4gICAgICAgICAgICBhcnIsIGluZGV4O1xuXG4gICAgICAgIGlmICghb3JpZ2luYWxDbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyciA9IG9yaWdpbmFsQ2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgICAgIGluZGV4ID0gdHVpLnV0aWwuaW5BcnJheShjbGFzc05hbWUsIGFycik7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBhcnIuam9pbignICcpO1xuICAgICAgICB9XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHRvIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYWRkXG4gICAgICovXG4gICAgYWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGZyb20gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIEEgbmFtZSBvZiBldmVudFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZW1vdmVcbiAgICAgKi9cbiAgICByZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5kZXRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gRXZlbnQgdGFyZ2V0XG4gICAgICovXG4gICAgZ2V0VGFyZ2V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQ7XG4gICAgICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBIVE1MRWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IENsYXNzIG5hbWVcbiAgICAgKi9cbiAgICBnZXRDbGFzczogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZWxlbWVudCAmJiBlbGVtZW50LmdldEF0dHJpYnV0ZSAmJlxuICAgICAgICAgICAgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzc05hbWUnKSB8fCAnJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBlbGVtZW50IGhhcyBzcGVjaWZpYyBjbGFzcyBvciBub3RcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzcyB0byBmaW5kXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHRoZSBjbGFzc1xuICAgICAqL1xuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGVsQ2xhc3NOYW1lID0gdXRpbC5nZXRDbGFzcyhlbGVtZW50KTtcblxuICAgICAgICByZXR1cm4gZWxDbGFzc05hbWUuaW5kZXhPZihjbGFzc05hbWUpID4gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgZWxlbWVudCBieSBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzc1xuICAgICAqIEByZXR1cm5zIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBFbGVtZW50c1xuICAgICAqL1xuICAgIGdldEVsZW1lbnRzQnlDbGFzc05hbWU6IGZ1bmN0aW9uKHRhcmdldCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBhbGwsIGZpbHRlcmVkO1xuXG4gICAgICAgIGlmICh0YXJnZXQucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0YXJnZXQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWxsID0gdHVpLnV0aWwudG9BcnJheSh0YXJnZXQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJyonKSk7XG4gICAgICAgICAgICBmaWx0ZXJlZCA9IHR1aS51dGlsLmZpbHRlcihhbGwsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUgfHwgJyc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKGNsYXNzTmFtZXMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgd2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICovXG4gICAgaXNSaWdodEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuX2dldEJ1dHRvbihldmVudCkgPT09IDI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0IG9yIG5vdFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIEEgcHJvcGVydHlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfGJvb2xlYW59IFByb3BlcnR5IG5hbWUgb3IgZmFsc2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciB1c2VyU2VsZWN0UHJvcGVydHkgPSB1dGlsLnRlc3RQcm9wKFtcbiAgICAgKiAgICAgJ3VzZXJTZWxlY3QnLFxuICAgICAqICAgICAnV2Via2l0VXNlclNlbGVjdCcsXG4gICAgICogICAgICdPVXNlclNlbGVjdCcsXG4gICAgICogICAgICdNb3pVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ21zVXNlclNlbGVjdCdcbiAgICAgKiBdKTtcbiAgICAgKi9cbiAgICB0ZXN0UHJvcDogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gZmFsc2U7XG5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgY29uc2lzdGVudC1yZXR1cm4gKi9cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChwcm9wcywgZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICAgICAgaWYgKHByb3AgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBjb25zaXN0ZW50LXJldHVybiAqL1xuXG4gICAgICAgIHJldHVybiBwcm9wZXJ0eU5hbWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgZGVmYXVsdCBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqL1xuICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbCBmcm9tIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZSAtIFRlbXBsYXRlIGh0bWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUZW1wbGF0ZSBkYXRhXG4gICAgICogQHJldHVybnMge3N0cmluZ30gaHRtbFxuICAgICAqL1xuICAgIHJlbmRlclRlbXBsYXRlOiBmdW5jdGlvbihzb3VyY2UsIHByb3BzKSB7XG4gICAgICAgIGZ1bmN0aW9uIHBpY2tWYWx1ZShuYW1lcykge1xuICAgICAgICAgICAgcmV0dXJuIHBpY2suYXBwbHkobnVsbCwgW3Byb3BzXS5jb25jYXQobmFtZXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VyY2UucmVwbGFjZSh0ZW1wbGF0ZU1hc2tSZSwgZnVuY3Rpb24obWF0Y2gsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZTtcblxuICAgICAgICAgICAgaWYgKGlzVmFsaWREb3ROb3RhdGlvbihuYW1lKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcGlja1ZhbHVlKG5hbWUuc3BsaXQoJy4nKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuam9pbignICcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemF0aW9uIGZvciBldmVudCBidXR0b24gcHJvcGVydHlcbiAgICAgKiAwOiBGaXJzdCBtb3VzZSBidXR0b24sIDI6IFNlY29uZCBtb3VzZSBidXR0b24sIDE6IENlbnRlciBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHs/bnVtYmVyfSBidXR0b24gdHlwZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGJ1dHRvbixcbiAgICAgICAgICAgIHByaW1hcnkgPSAnMCwxLDMsNSw3JyxcbiAgICAgICAgICAgIHNlY29uZGFyeSA9ICcyLDYnLFxuICAgICAgICAgICAgd2hlZWwgPSAnNCc7XG5cbiAgICAgICAgaWYgKGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoJ01vdXNlRXZlbnRzJywgJzIuMCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXZlbnQuYnV0dG9uO1xuICAgICAgICB9XG5cbiAgICAgICAgYnV0dG9uID0gU3RyaW5nKGV2ZW50LmJ1dHRvbik7XG4gICAgICAgIGlmIChwcmltYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIGlmIChzZWNvbmRhcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAyO1xuICAgICAgICB9IGVsc2UgaWYgKHdoZWVsLmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiJdfQ==
