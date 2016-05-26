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
var TuiContextMenu = tui && tui.component && tui.component.ContextMenu;
var styleKeys = ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect'];
var enableProp = util.testProp(styleKeys);

/**
 * Set context-menu feature on tree
 * @class ContextMenu
 * @constructor
 * @param {Tree} tree - Tree
 * @param {object} options - Options
 *     @param {Array.<object>} options.menuData - Context menu data
 */
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
    init: function(tree, options) { /*eslint-enable*/
        /**
         * Tree data
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Id of floating layer in tree
         * @type {string}
         */
        this.flId = this.tree.rootElement.id + '-fl';

        /**
         * Info of context menu in tree
         * @type {object}
         */
        this.menu = this._generateContextMenu();

        /**
         * Floating layer element
         * @type {HTMLElement}
         */
        this.flElement = document.getElementById(this.flId);

        /**
         * Id of selected tree item
         * @type {string}
         */
        this.selectedNodeId = null;

        this._preventTextSelection();

        this._attachEvent(options.menuData || {});
    },

    /**
     * Disable context-menu feature
     */
    destroy: function() {
        var treeSelector = this._getTreeSelector();

        this.menu.unregister(treeSelector);
        this.tree.off(this);

        this._restoreTextSelection();
        this._removeFloatingLayer();
    },

    /**
     * Create floating layer for context menu
     * @private
     */
    _createFloatingLayer: function() {
        this.flElement = document.createElement('div');
        this.flElement.id = this.flId;

        document.body.appendChild(this.flElement);
    },

    /**
     * Remove floating layer for context menu
     * @private
     */
    _removeFloatingLayer: function() {
        document.body.removeChild(this.flElement);
        this.flElement = null;
    },

    /**
     * Generate context menu in tree
     * @returns {TuiContextMenu} Instance of TuiContextMenu
     * @private
     */
    _generateContextMenu: function() {
        if (!this.flElement) {
            this._createFloatingLayer();
        }

        return new TuiContextMenu(this.flElement);
    },

    /**
     * Prevent text selection on selected tree item
     * @private
     */
    _preventTextSelection: function() {
        if (enableProp) {
            this.tree.rootElement.style[enableProp] = 'none';
        }
    },

    /**
     * Restore text selection on selected tree item
     * @private
     */
    _restoreTextSelection: function() {
        if (enableProp) {
            this.tree.rootElement.style[enableProp] = '';
        }
    },

    /**
     * Get selector of tree
     * @returns {string} Selector based on id of root tree element
     * @private
     */
    _getTreeSelector: function() {
        return '#' + this.tree.rootElement.id;
    },

    /**
     * Attach event on tree
     * @param {Array.<object>} menuData - Context menu data
     * @private
     */
    _attachEvent: function(menuData) {
        var treeSelector = this._getTreeSelector();

        this.menu.register(treeSelector, tui.util.bind(this._onSelect, this), menuData);
        this.tree.on('contextmenu', this._onMouseClick, this);
    },

    /**
     * Event handler on context menu
     * @param {MouseEvent} e - Mouse event
     * @param {string} cmd - Options value of selected context menu ("title"|"command")
     * @private
     */
    _onSelect: function(e, cmd) {
        /**
         * @api
         * @event Tree#selectContextMenu
         * @param {{cmd: string, nodeId: string}} treeEvent - Tree event
         * @example
         * tree.on('selectContextMenu', function(treeEvent) {
         *     var cmd = treeEvent.cmd,
         *     var nodeId = treeEvent.nodeId;
         *
         *     console.log(cmd, nodeId);
         * });
         */
        this.tree.fire('selectContextMenu', {
            cmd: cmd,
            nodeId: this.selectedNodeId
        });
    },

    /**
     * Event handler on tree item
     * @param {MouseEvent} e - Mouse event
     */
    _onMouseClick: function(e) {
        var target = util.getTarget(e);

        this.selectedNodeId = this.tree.getNodeIdFromElement(target);
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
     * @param {number} [index] - Start index number for inserting
     * @private
     */
    _onMove: function(nodeId, originalParentId, newParentId, index) {
        this._draw(originalParentId);
        this._draw(newParentId);

        /**
         * @api
         * @event Tree#move
         * @param {{nodeId: string, originalParentId: string, newParentId: string, index: number}} treeEvent - Event
         * @example
         * tree.on('move', function(treeEvent) {
         *     var nodeId = treeEvent.nodeId,
         *         originalParentId = treeEvent.originalParentId,
         *         newParentId = treeEvent.newParentId,
         *         index = treeEvent.index;
         *
         *     console.log(nodeId, originalParentId, newParentId, index);
         * });
         */
        this.fire('move', {
            nodeId: nodeId,
            originalParentId: originalParentId,
            newParentId: newParentId,
            index: index
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

    /**
     * Event handler - contextmenu
     * @param {MouseEvent} mouseEvent - Contextmenu event
     * @private
     */
    _onContextMenu: function(mouseEvent) {
        this.fire('contextmenu', mouseEvent);
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
     * @param {number} index - Index number of selected node
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @example
     * tree.move(myNodeId, newParentId); // mode node with redrawing
     * tree.move(myNodeId, newParentId, true); // move node without redrawing
     */
    move: function(nodeId, newParentId, index, isSilent) {
        this.isMovingNode = true;
        this.model.move(nodeId, newParentId, index, isSilent);
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
     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable', 'ContextMenu'
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
     *      rejectedClassNames: ['notDraggable', 'notDraggable-2'],
     *      autoOpenDelay: 1500,
     *      isSortable: true,
     *      hoverClassName: 'tui-tree-hover'
     *      lineClassName: 'tui-tree-line',
     *      lineBoundary: {
     *      	top: 10,
     *       	bottom: 10
     *      }
     *  })
     *  .enableFeature('Checkbox', {
     *      checkboxClassName: 'tui-tree-checkbox'
     *  })
     *  .enableFeature('ContextMenu, {
     *  	menuData: [
     *   		{title: 'menu1', command: 'copy'},
     *     		{title: 'menu2', command: 'paste'},
     *       	{separator: true},
     *        	{
     *         		title: 'menu3',
     *           	menu: [
     *            		{title: 'submenu1'},
     *              	{title: 'submenu2'}
     *              ]
     *          }
     *      }
     *  })
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
    },

    /**
     * Get index number of selected node
     * @api
     * @param {string} nodeId - Id of selected node
     * @returns {number} Index number of attached node
     */
    getNodeIndex: function(nodeId) {
        var parentId = this.model.getParentId(nodeId);

        return this.model.getNode(parentId).getChildIndex(nodeId);
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
     * @param {number} [index] - Start index number for inserting
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     */
    move: function(nodeId, newParentId, index, isSilent) {
        var node = this.getNode(nodeId);
        var originalParent, originalParentId, newParent;

        if (!node) {
            return;
        }

        newParent = this.getNode(newParentId) || this.rootNode;
        newParentId = newParent.getId();
        originalParentId = node.getParentId();
        originalParent = this.getNode(originalParentId);
        index = tui.util.isUndefined(index) ? -1 : index;

        if (nodeId === newParentId || this.contains(nodeId, newParentId)) {
            return;
        }

        if (index !== -1) {
            if (newParentId === originalParentId) {
                newParent.moveChildId(nodeId, index);
            } else {
                newParent.insertChildId(nodeId, index);
                originalParent.removeChildId(nodeId);
            }
        } else {
            newParent.addChildId(nodeId);
            originalParent.removeChildId(nodeId);
        }

        node.setParentId(newParentId);

        if (!isSilent) {
            this.fire('move', nodeId, originalParentId, newParentId, index);
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
    },

    /**
     * Get index of child
     * @api
     * @param {string} id - Node id
     * @returns {number} Index of child in children list
     */
    getChildIndex: function(id) {
        return inArray(id, this._childIds);
    },

    /**
     * Insert child id
     * @param {string} id - Child node id
     * @param {number} index - Index number of insert position
     */
    insertChildId: function(id, index) {
        var childIds = this._childIds;

        if (inArray(id, childIds) === -1) {
            childIds.splice(index, 0, id);
        }
    },

    /**
     * Move child id
     * @param {string} id - Child node id
     * @param {number} index - Index number of insert position
     */
    moveChildId: function(id, index) {
        var childIds = this._childIds;
        var originIdx = this.getChildIndex(id);

        if (inArray(id, childIds) !== -1) {
            if (originIdx < index) {
                index -= 1;
            }

            childIds.splice(index, 0, childIds.splice(originIdx, 1)[0]);
        }
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
    isArray = tui.util.isArraySafe,
    isSupportPageOffset = typeof window.pageXOffset !== 'undefined',
    isCSS1Compat = document.compatMode === 'CSS1Compat';

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
    },

    /**
     * Get mouse position
     * @param {MouseEvet} event - Event object
     * @returns {object} X, Y position of mouse
     */
    getMousePos: function(event) {
        return {
            x: event.clientX,
            y: event.clientY
        };
    },

    /**
     * Get value of scroll top on document.body (cross browsing)
     * @returns {number} Value of scroll top
     */
    getWindowScrollTop: function() {
        var scrollTop;

        if (isSupportPageOffset) {
            scrollTop = window.pageYOffset;
        } else {
            scrollTop = isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
        }

        return scrollTop;
    }
};

module.exports = util;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMvZGVmYXVsdE9wdGlvbi5qcyIsInNyYy9qcy9jb25zdHMvbWVzc2FnZXMuanMiLCJzcmMvanMvY29uc3RzL291dGVyVGVtcGxhdGUuanMiLCJzcmMvanMvY29uc3RzL3N0YXRlcy5qcyIsInNyYy9qcy9mZWF0dXJlcy9jaGVja2JveC5qcyIsInNyYy9qcy9mZWF0dXJlcy9jb250ZXh0TWVudS5qcyIsInNyYy9qcy9mZWF0dXJlcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvZWRpdGFibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy90cmVlLmpzIiwic3JjL2pzL3RyZWVNb2RlbC5qcyIsInNyYy9qcy90cmVlTm9kZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnZhciBUcmVlID0gcmVxdWlyZSgnLi9zcmMvanMvdHJlZScpO1xudmFyIGNvbXBvbmVudCA9IHR1aS51dGlsLmRlZmluZU5hbWVzcGFjZSgndHVpLmNvbXBvbmVudCcpO1xuY29tcG9uZW50LlRyZWUgPSBUcmVlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1ha2UgY2xhc3MgbmFtZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgY2xhc3MgbmFtZVxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0ga2V5cyAtIEtleXMgb2YgY2xhc3MgbmFtZXNcbiAqIEByZXR1cm5zIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn0gQ2xhc3MgbmFtZXMgbWFwXG4gKi9cbmZ1bmN0aW9uIG1ha2VDbGFzc05hbWVzKHByZWZpeCwga2V5cykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICB0dWkudXRpbC5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBvYmpba2V5ICsgJ0NsYXNzJ10gPSBwcmVmaXggKyBrZXk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEEgZGVmYXVsdCB2YWx1ZXMgZm9yIHRyZWVcbiAqIEBjb25zdFxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBub2RlRGVmYXVsdFN0YXRlIC0gTm9kZSBzdGF0ZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVJZFByZWZpeCAtIE5vZGUgaWQgcHJlZml4XG4gKiBAcHJvcGVydHkge29iamVjdH0gc3RhdGVMYWJlbCAtIFN0YXRlIGxhYmVsIGluIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5vcGVuZWQgLSAnLSdcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5jbG9zZWQgLSAnKydcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSB0ZW1wbGF0ZSAtIFRlbXBsYXRlIGh0bWwgZm9yIHRoZSBub2Rlcy5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUuaW50ZXJuYWxOb2RlIC0gVGVtcGxhdGUgaHRtbCBmb3IgaW50ZXJuYWwgbm9kZS5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUubGVhZk5vZGUgLSBUZW1wbGF0ZSBodG1sIGZvciBsZWFmIG5vZGUuXG4gKiBAcHJvcGVydHkge29iamVjdH0gY2xhc3NOYW1lcyAtIENsYXNzIG5hbWVzIG9mIGVsZW1lbnRzIGluIHRyZWVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gb3BlbmVkQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBjbG9zZWRDbGFzcyAtIENsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVDbGFzcyAtIENsYXNzIG5hbWUgZm9yIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gbGVhZkNsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgbGVhZiBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN1YnRyZWVDbGFzcyAgLSBDbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdG9nZ2xlQnRuQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGV4dENsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgdGV4dCBlbGVtZW50IGluIGEgbm9kZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcbiAgICBzdGF0ZUxhYmVsczoge1xuICAgICAgICBvcGVuZWQ6ICctJyxcbiAgICAgICAgY2xvc2VkOiAnKydcbiAgICB9LFxuICAgIG5vZGVJZFByZWZpeDogJ3R1aS10cmVlLW5vZGUtJyxcbiAgICBjbGFzc05hbWVzOiBtYWtlQ2xhc3NOYW1lcygndHVpLXRyZWUtJywgW1xuICAgICAgICAnbm9kZScsXG4gICAgICAgICdsZWFmJyxcbiAgICAgICAgJ29wZW5lZCcsXG4gICAgICAgICdjbG9zZWQnLFxuICAgICAgICAnc3VidHJlZScsXG4gICAgICAgICd0b2dnbGVCdG4nLFxuICAgICAgICAndGV4dCdcbiAgICBdKSxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICBpbnRlcm5hbE5vZGU6XG4gICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPicsXG4gICAgICAgIGxlYWZOb2RlOlxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPidcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1lc3NhZ2VzIGZvciB0cmVlXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIElOVkFMSURfUk9PVF9FTEVNRU5UOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogUm9vdCBlbGVtZW50IGlzIGludmFsaWQuJyxcbiAgICBJTlZBTElEX0FQSTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IElOVkFMSURfQVBJJyxcbiAgICBJTlZBTElEX0FQSV9TRUxFQ1RBQkxFOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJTZWxlY3RhYmxlXCIgaXMgbm90IGVuYWJsZWQuJyxcbiAgICBJTlZBTElEX0FQSV9FRElUQUJMRTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiRWRpdGFibGVcIiBpcyBub3QgZW5hYmxlZC4nLFxuICAgIElOVkFMSURfQVBJX0RSQUdHQUJMRTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiRHJhZ2dhYmxlXCIgaXMgbm90IGVuYWJsZWQuJyxcbiAgICBJTlZBTElEX0FQSV9DSEVDS0JPWDogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiQ2hlY2tib3hcIiBpcyBub3QgZW5hYmxlZC4nXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE91dGVyIHRlbXBsYXRlXG4gKiBAdHlwZSB7e2ludGVybmFsTm9kZTogc3RyaW5nLCBsZWFmTm9kZTogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgSU5URVJOQUxfTk9ERTpcbiAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwie3tub2RlQ2xhc3N9fSB7e3N0YXRlQ2xhc3N9fVwiPicgK1xuICAgICAgICAgICAgJ3t7aW5uZXJUZW1wbGF0ZX19JyArXG4gICAgICAgICc8L2xpPicsXG4gICAgTEVBRl9OT0RFOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ7e25vZGVDbGFzc319IHt7bGVhZkNsYXNzfX1cIj4nICtcbiAgICAgICAgICAgICd7e2lubmVyVGVtcGxhdGV9fScgK1xuICAgICAgICAnPC9saT4nXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFN0YXRlcyBpbiB0cmVlXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIFN0YXRlcyBvZiBub2RlXG4gICAgICogQHR5cGUge3tPUEVORUQ6IHN0cmluZywgQ0xPU0VEOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIG5vZGU6IHtcbiAgICAgICAgT1BFTkVEOiAnb3BlbmVkJyxcbiAgICAgICAgQ0xPU0VEOiAnY2xvc2VkJ1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xudmFyIEFQSV9MSVNUID0gW1xuICAgICdjaGVjaycsXG4gICAgJ3VuY2hlY2snLFxuICAgICd0b2dnbGVDaGVjaycsXG4gICAgJ2lzQ2hlY2tlZCcsXG4gICAgJ2lzSW5kZXRlcm1pbmF0ZScsXG4gICAgJ2lzVW5jaGVja2VkJyxcbiAgICAnZ2V0Q2hlY2tlZExpc3QnLFxuICAgICdnZXRUb3BDaGVja2VkTGlzdCcsXG4gICAgJ2dldEJvdHRvbUNoZWNrZWRMaXN0J1xuXTtcblxuLyoqXG4gKiBDaGVja2JveCB0cmktc3RhdGVzXG4gKi9cbnZhciBTVEFURV9DSEVDS0VEID0gMSxcbiAgICBTVEFURV9VTkNIRUNLRUQgPSAyLFxuICAgIFNUQVRFX0lOREVURVJNSU5BVEUgPSAzLFxuICAgIERBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURSA9ICdfX0NoZWNrQm94U3RhdGVfXycsXG4gICAgREFUQSA9IHt9O1xuXG52YXIgZmlsdGVyID0gdHVpLnV0aWwuZmlsdGVyLFxuICAgIGZvckVhY2ggPSB0dWkudXRpbC5mb3JFYWNoO1xuLyoqXG4gKiBTZXQgdGhlIGNoZWNrYm94LWFwaVxuICogQGNsYXNzIENoZWNrYm94XG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb24gLSBPcHRpb25cbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9uLmNoZWNrYm94Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGNoZWNrYm94IGVsZW1lbnRcbiAqL1xudmFyIENoZWNrYm94ID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBDaGVja2JveC5wcm90b3R5cGUgKi97IC8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgQ2hlY2tib3hcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBjaGVja2JveFxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9uKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9uID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBvcHRpb24pO1xuXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuY2hlY2tib3hDbGFzc05hbWUgPSBvcHRpb24uY2hlY2tib3hDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuY2hlY2tlZExpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5yb290Q2hlY2tib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTlBVVCcpO1xuICAgICAgICB0aGlzLnJvb3RDaGVja2JveC50eXBlID0gJ2NoZWNrYm94JztcblxuICAgICAgICB0aGlzLl9zZXRBUElzKCk7XG4gICAgICAgIHRoaXMuX2F0dGFjaEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuXG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuICAgICAgICBmb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdHJlZVthcGlOYW1lXTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBhcGlzIG9mIGNoZWNrYm94IHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRBUElzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBiaW5kID0gdHVpLnV0aWwuYmluZDtcblxuICAgICAgICBmb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICB0cmVlW2FwaU5hbWVdID0gYmluZCh0aGlzW2FwaU5hbWVdLCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBldmVudCB0byB0cmVlIGluc3RhbmNlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXR0YWNoRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmVlLm9uKHtcbiAgICAgICAgICAgIHNpbmdsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJZCwgc3RhdGU7XG5cbiAgICAgICAgICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2hlY2tib3hDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlRnJvbUNoZWNrYm94KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRpbnVlUG9zdHByb2Nlc3Npbmcobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFmdGVyRHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0Q2hhbmdlcyhub2RlSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1vdmU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAvL0B0b2RvIC0gT3B0aW1pemF0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdENoYW5nZXMoZGF0YS5vcmlnaW5hbFBhcmVudElkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0Q2hhbmdlcyhkYXRhLm5ld1BhcmVudElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZmxlY3QgdGhlIGNoYW5nZXMgb24gbm9kZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlZmxlY3RDaGFuZ2VzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdGhpcy50cmVlLmVhY2goZnVuY3Rpb24oZGVzY2VuZGFudCwgZGVzY2VuZGFudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShkZXNjZW5kYW50SWQsIHRoaXMuX2dldFN0YXRlKGRlc2NlbmRhbnRJZCksIHRydWUpO1xuICAgICAgICB9LCBub2RlSWQsIHRoaXMpO1xuICAgICAgICB0aGlzLl9qdWRnZU93blN0YXRlKG5vZGVJZCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjaGVja2JveCBhdHRyaWJ1dGVzIChjaGVja2VkLCBpbmRldGVybWluYXRlKVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gY2hlY2tib3ggLSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0NoZWNrZWQgLSBcImNoZWNrZWRcIlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNJbmRldGVybWluYXRlIC0gXCJpbmRldGVybWluYXRlXCJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDaGVja2JveEF0dHI6IGZ1bmN0aW9uKGNoZWNrYm94LCBpc0NoZWNrZWQsIGlzSW5kZXRlcm1pbmF0ZSkge1xuICAgICAgICBjaGVja2JveC5pbmRldGVybWluYXRlID0gaXNJbmRldGVybWluYXRlO1xuICAgICAgICBjaGVja2JveC5jaGVja2VkID0gaXNDaGVja2VkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tpbmcgc3RhdGUgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gU3RhdGUgZm9yIGNoZWNrYm94XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RvcFByb3BhZ2F0aW9uXSAtIElmIHRydWUsIHN0b3AgY2hhbmdpbmcgc3RhdGUgcHJvcGFnYXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHZhciBjaGVja2JveCA9IHRoaXMuX2dldENoZWNrYm94RWxlbWVudChub2RlSWQpO1xuXG4gICAgICAgIGlmICghY2hlY2tib3gpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfQ0hFQ0tFRDpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfVU5DSEVDS0VEOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldENoZWNrYm94QXR0cihjaGVja2JveCwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfSU5ERVRFUk1JTkFURTpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IC8vIG5vIG1vcmUgcHJvY2VzcyBpZiB0aGUgc3RhdGUgaXMgaW52YWxpZFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbnRpbnVlUG9zdHByb2Nlc3Npbmcobm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNraW5nIHN0YXRlIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IENoZWNraW5nIHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHN0YXRlID0gdHJlZS5nZXROb2RlRGF0YShub2RlSWQpW0RBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURV0sXG4gICAgICAgICAgICBjaGVja2JveDtcblxuICAgICAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgICAgICBjaGVja2JveCA9IHRoaXMuX2dldENoZWNrYm94RWxlbWVudChub2RlSWQpO1xuICAgICAgICAgICAgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZUZyb21DaGVja2JveChjaGVja2JveCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2luZyBzdGF0ZSBvZiBub2RlIGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gY2hlY2tib3ggLSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHJldHVybnMgez9udW1iZXJ9IENoZWNraW5nIHN0YXRlXG4gICAgICovXG4gICAgX2dldFN0YXRlRnJvbUNoZWNrYm94OiBmdW5jdGlvbihjaGVja2JveCkge1xuICAgICAgICB2YXIgc3RhdGU7XG5cbiAgICAgICAgaWYgKCFjaGVja2JveCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tib3guY2hlY2tlZCkge1xuICAgICAgICAgICAgc3RhdGUgPSBTVEFURV9DSEVDS0VEO1xuICAgICAgICB9IGVsc2UgaWYgKGNoZWNrYm94LmluZGV0ZXJtaW5hdGUpIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfSU5ERVRFUk1JTkFURTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfVU5DSEVDS0VEO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb250aW51ZSBwb3N0LXByb2Nlc3NpbmcgZnJvbSBjaGFuZ2luZzpjaGVja2JveC1zdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gQ2hlY2tib3ggc3RhdGVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdG9wUHJvcGFnYXRpb25dIC0gSWYgdHJ1ZSwgc3RvcCB1cGRhdGUtcHJvcGFnYXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb250aW51ZVBvc3Rwcm9jZXNzaW5nOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlLCBzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuY2hlY2tlZExpc3QsXG4gICAgICAgICAgICBldmVudE5hbWU7XG5cbiAgICAgICAgLyogUHJldmVudCBkdXBsaWNhdGVkIG5vZGUgaWQgKi9cbiAgICAgICAgdXRpbC5yZW1vdmVJdGVtRnJvbUFycmF5KG5vZGVJZCwgY2hlY2tlZExpc3QpO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gU1RBVEVfQ0hFQ0tFRCkge1xuICAgICAgICAgICAgY2hlY2tlZExpc3QucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSNjaGVja1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIENoZWNrZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHRyZWUub24oJ2NoZWNrJywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ2NoZWNrZWQ6ICcgKyBub2RlSWQpO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGV2ZW50TmFtZSA9ICdjaGVjayc7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFNUQVRFX1VOQ0hFQ0tFRCkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSN1bmNoZWNrXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVW5jaGVja2VkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlLm9uKCd1bmNoZWNrJywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ3VuY2hlY2tlZDogJyArIG5vZGVJZCk7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZXZlbnROYW1lID0gJ3VuY2hlY2snO1xuICAgICAgICB9XG4gICAgICAgIERBVEFbREFUQV9LRVlfRk9SX0NIRUNLQk9YX1NUQVRFXSA9IHN0YXRlO1xuICAgICAgICB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgREFUQSwgdHJ1ZSk7XG5cbiAgICAgICAgaWYgKCFzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BhZ2F0ZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICAgICAgdHJlZS5maXJlKGV2ZW50TmFtZSwgbm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcm9wYWdhdGUgYSBub2RlIHN0YXRlIHRvIGRlc2NlbmRhbnRzIGFuZCBhbmNlc3RvcnMgZm9yIHVwZGF0aW5nIHRoZWlyIHN0YXRlc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gQ2hlY2tib3ggc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wcm9wYWdhdGVTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUgPT09IFNUQVRFX0lOREVURVJNSU5BVEUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbERlc2NlbmRhbnRzU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBhbGwgZGVzY2VuZGFudHMgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0ZSAtIFN0YXRlIGZvciBjaGVja2JveFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZUFsbERlc2NlbmRhbnRzU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcbiAgICAgICAgdGhpcy50cmVlLmVhY2goZnVuY3Rpb24oZGVzY2VuZGFudCwgZGVzY2VuZGFudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShkZXNjZW5kYW50SWQsIHN0YXRlLCB0cnVlKTtcbiAgICAgICAgfSwgbm9kZUlkLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGFsbCBhbmNlc3RvcnMgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRyZWUuZ2V0UGFyZW50SWQobm9kZUlkKTtcblxuICAgICAgICB3aGlsZSAocGFyZW50SWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2p1ZGdlT3duU3RhdGUocGFyZW50SWQpO1xuICAgICAgICAgICAgcGFyZW50SWQgPSB0cmVlLmdldFBhcmVudElkKHBhcmVudElkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBKdWRnZSBvd24gc3RhdGUgZnJvbSBjaGlsZCBub2RlIGlzIGNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2p1ZGdlT3duU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoaWxkSWRzID0gdHJlZS5nZXRDaGlsZElkcyhub2RlSWQpLFxuICAgICAgICAgICAgY2hlY2tlZCA9IHRydWUsXG4gICAgICAgICAgICB1bmNoZWNrZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICghY2hpbGRJZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjaGVja2VkID0gdGhpcy5pc0NoZWNrZWQobm9kZUlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvckVhY2goY2hpbGRJZHMsIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZShjaGlsZElkKTtcbiAgICAgICAgICAgICAgICBjaGVja2VkID0gKGNoZWNrZWQgJiYgc3RhdGUgPT09IFNUQVRFX0NIRUNLRUQpO1xuICAgICAgICAgICAgICAgIHVuY2hlY2tlZCA9ICh1bmNoZWNrZWQgJiYgc3RhdGUgPT09IFNUQVRFX1VOQ0hFQ0tFRCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY2hlY2tlZCB8fCB1bmNoZWNrZWQ7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGVja2VkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX0NIRUNLRUQsIHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHVuY2hlY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9VTkNIRUNLRUQsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9JTkRFVEVSTUlOQVRFLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tib3ggZWxlbWVudCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P0hUTUxFbGVtZW50fSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0Q2hlY2tib3hFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBlbCwgbm9kZUVsO1xuXG4gICAgICAgIGlmIChub2RlSWQgPT09IHRyZWUuZ2V0Um9vdE5vZGVJZCgpKSB7XG4gICAgICAgICAgICBlbCA9IHRoaXMucm9vdENoZWNrYm94O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZUVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgICAgICBub2RlRWwsXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja2JveENsYXNzTmFtZVxuICAgICAgICAgICAgKVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUuY2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICBjaGVjazogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0NoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9DSEVDS0VEKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbmNoZWNrIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLnVuY2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICB1bmNoZWNrOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVW5jaGVja2VkKG5vZGVJZCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKG5vZGVJZCwgU1RBVEVfVU5DSEVDS0VEKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgbm9kZSBjaGVja2luZ1xuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUudG9nZ2xlQ2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICB0b2dnbGVDaGVjazogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0NoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5jaGVjayhub2RlSWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51bmNoZWNrKG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBjaGVja2VkXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyBpbmRldGVybWluYXRlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS5jaGVjayhub2RlSWQpO1xuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuaXNDaGVja2VkKG5vZGVJZCkpOyAvLyB0cnVlXG4gICAgICovXG4gICAgaXNDaGVja2VkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNUQVRFX0NIRUNLRUQgPT09IHRoaXMuX2dldFN0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIG5vZGUgaXMgaW5kZXRlcm1pbmF0ZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIG5vZGUgaXMgaW5kZXRlcm1pbmF0ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUuY2hlY2sobm9kZUlkKTtcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmlzSW5kZXRlcm1pbmF0ZShub2RlSWQpKTsgLy8gZmFsc2VcbiAgICAgKi9cbiAgICBpc0luZGV0ZXJtaW5hdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gU1RBVEVfSU5ERVRFUk1JTkFURSA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyB1bmNoZWNrZWQgb3Igbm90XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyB1bmNoZWNrZWQuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS51bmNoZWNrKG5vZGVJZCk7XG4gICAgICogY29uc29sZS5sb2codHJlZS5pc1VuY2hlY2tlZChub2RlSWQpKTsgLy8gdHJ1ZVxuICAgICAqL1xuICAgIGlzVW5jaGVja2VkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNUQVRFX1VOQ0hFQ0tFRCA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbENoZWNrZWRMaXN0ID0gdHJlZS5nZXRDaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUxJywgJ25vZGUyJywgJ25vZGUzJyAsLi4uLl1cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNDaGVja2VkTGlzdCA9IHRyZWUuZ2V0Q2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTcnLCAnbm9kZTgnXVxuICAgICAqL1xuICAgIGdldENoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5jaGVja2VkTGlzdDtcblxuICAgICAgICBpZiAoIXBhcmVudElkKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hlY2tlZExpc3Quc2xpY2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXIoY2hlY2tlZExpc3QsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWUuY29udGFpbnMocGFyZW50SWQsIG5vZGVJZCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdG9wIGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbFRvcENoZWNrZWRMaXN0ID0gdHJlZS5nZXRUb3BDaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUxJywgJ25vZGU1JywgJ25vZGU3J11cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNUb3BDaGVja2VkTGlzdCA9IHRyZWUuZ2V0VG9wQ2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTcnXVxuICAgICAqL1xuICAgIGdldFRvcENoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gW10sXG4gICAgICAgICAgICBzdGF0ZTtcblxuICAgICAgICBwYXJlbnRJZCA9IHBhcmVudElkIHx8IHRyZWUuZ2V0Um9vdE5vZGVJZCgpO1xuICAgICAgICBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlKHBhcmVudElkKTtcbiAgICAgICAgaWYgKHN0YXRlID09PSBTVEFURV9DSEVDS0VEKSB7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRyZWUuZ2V0Q2hpbGRJZHMocGFyZW50SWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBTVEFURV9JTkRFVEVSTUlOQVRFKSB7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuZ2V0Q2hlY2tlZExpc3QocGFyZW50SWQpO1xuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSBmaWx0ZXIoY2hlY2tlZExpc3QsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhdGhpcy5pc0NoZWNrZWQodHJlZS5nZXRQYXJlbnRJZChub2RlSWQpKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoZWNrZWRMaXN0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYm90dG9tIGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbEJvdHRvbUNoZWNrZWRMaXN0ID0gdHJlZS5nZXRCb3R0b21DaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUyJywgJ25vZGUzJywgJ25vZGU1JywgJ25vZGU4J11cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNCb3R0b21DaGVja2VkTGlzdCA9IHRyZWUuZ2V0Qm90dG9tQ2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTgnXVxuICAgICAqL1xuICAgIGdldEJvdHRvbUNoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0O1xuXG4gICAgICAgIHBhcmVudElkID0gcGFyZW50SWQgfHwgdHJlZS5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5nZXRDaGVja2VkTGlzdChwYXJlbnRJZCk7XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcihjaGVja2VkTGlzdCwgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZS5pc0xlYWYobm9kZUlkKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihDaGVja2JveCk7XG5tb2R1bGUuZXhwb3J0cyA9IENoZWNrYm94O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIEFQSV9MSVNUID0gW107XG52YXIgVHVpQ29udGV4dE1lbnUgPSB0dWkgJiYgdHVpLmNvbXBvbmVudCAmJiB0dWkuY29tcG9uZW50LkNvbnRleHRNZW51O1xudmFyIHN0eWxlS2V5cyA9IFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J107XG52YXIgZW5hYmxlUHJvcCA9IHV0aWwudGVzdFByb3Aoc3R5bGVLZXlzKTtcblxuLyoqXG4gKiBTZXQgY29udGV4dC1tZW51IGZlYXR1cmUgb24gdHJlZVxuICogQGNsYXNzIENvbnRleHRNZW51XG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIC0gT3B0aW9uc1xuICogICAgIEBwYXJhbSB7QXJyYXkuPG9iamVjdD59IG9wdGlvbnMubWVudURhdGEgLSBDb250ZXh0IG1lbnUgZGF0YVxuICovXG52YXIgQ29udGV4dE1lbnUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIENvbnRleHRNZW51LnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIENvbnRleHRNZW51XG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgQ29udGV4dE1lbnVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyZWUgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7VHJlZX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElkIG9mIGZsb2F0aW5nIGxheWVyIGluIHRyZWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmxJZCA9IHRoaXMudHJlZS5yb290RWxlbWVudC5pZCArICctZmwnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbmZvIG9mIGNvbnRleHQgbWVudSBpbiB0cmVlXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1lbnUgPSB0aGlzLl9nZW5lcmF0ZUNvbnRleHRNZW51KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZsb2F0aW5nIGxheWVyIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mbEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmZsSWQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZCBvZiBzZWxlY3RlZCB0cmVlIGl0ZW1cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2RlSWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3ByZXZlbnRUZXh0U2VsZWN0aW9uKCk7XG5cbiAgICAgICAgdGhpcy5fYXR0YWNoRXZlbnQob3B0aW9ucy5tZW51RGF0YSB8fCB7fSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgY29udGV4dC1tZW51IGZlYXR1cmVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWVTZWxlY3RvciA9IHRoaXMuX2dldFRyZWVTZWxlY3RvcigpO1xuXG4gICAgICAgIHRoaXMubWVudS51bnJlZ2lzdGVyKHRyZWVTZWxlY3Rvcik7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcyk7XG5cbiAgICAgICAgdGhpcy5fcmVzdG9yZVRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5fcmVtb3ZlRmxvYXRpbmdMYXllcigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmxvYXRpbmcgbGF5ZXIgZm9yIGNvbnRleHQgbWVudVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUZsb2F0aW5nTGF5ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZsRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmZsRWxlbWVudC5pZCA9IHRoaXMuZmxJZDtcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZmxFbGVtZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZsb2F0aW5nIGxheWVyIGZvciBjb250ZXh0IG1lbnVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVGbG9hdGluZ0xheWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmZsRWxlbWVudCk7XG4gICAgICAgIHRoaXMuZmxFbGVtZW50ID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgY29udGV4dCBtZW51IGluIHRyZWVcbiAgICAgKiBAcmV0dXJucyB7VHVpQ29udGV4dE1lbnV9IEluc3RhbmNlIG9mIFR1aUNvbnRleHRNZW51XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2VuZXJhdGVDb250ZXh0TWVudTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5mbEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUZsb2F0aW5nTGF5ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgVHVpQ29udGV4dE1lbnUodGhpcy5mbEVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IHRleHQgc2VsZWN0aW9uIG9uIHNlbGVjdGVkIHRyZWUgaXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3ByZXZlbnRUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGVuYWJsZVByb3ApIHtcbiAgICAgICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5zdHlsZVtlbmFibGVQcm9wXSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXN0b3JlIHRleHQgc2VsZWN0aW9uIG9uIHNlbGVjdGVkIHRyZWUgaXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Jlc3RvcmVUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGVuYWJsZVByb3ApIHtcbiAgICAgICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5zdHlsZVtlbmFibGVQcm9wXSA9ICcnO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzZWxlY3RvciBvZiB0cmVlXG4gICAgICogQHJldHVybnMge3N0cmluZ30gU2VsZWN0b3IgYmFzZWQgb24gaWQgb2Ygcm9vdCB0cmVlIGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRUcmVlU2VsZWN0b3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJyMnICsgdGhpcy50cmVlLnJvb3RFbGVtZW50LmlkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggZXZlbnQgb24gdHJlZVxuICAgICAqIEBwYXJhbSB7QXJyYXkuPG9iamVjdD59IG1lbnVEYXRhIC0gQ29udGV4dCBtZW51IGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hdHRhY2hFdmVudDogZnVuY3Rpb24obWVudURhdGEpIHtcbiAgICAgICAgdmFyIHRyZWVTZWxlY3RvciA9IHRoaXMuX2dldFRyZWVTZWxlY3RvcigpO1xuXG4gICAgICAgIHRoaXMubWVudS5yZWdpc3Rlcih0cmVlU2VsZWN0b3IsIHR1aS51dGlsLmJpbmQodGhpcy5fb25TZWxlY3QsIHRoaXMpLCBtZW51RGF0YSk7XG4gICAgICAgIHRoaXMudHJlZS5vbignY29udGV4dG1lbnUnLCB0aGlzLl9vbk1vdXNlQ2xpY2ssIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIG9uIGNvbnRleHQgbWVudVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIE1vdXNlIGV2ZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNtZCAtIE9wdGlvbnMgdmFsdWUgb2Ygc2VsZWN0ZWQgY29udGV4dCBtZW51IChcInRpdGxlXCJ8XCJjb21tYW5kXCIpXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25TZWxlY3Q6IGZ1bmN0aW9uKGUsIGNtZCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNzZWxlY3RDb250ZXh0TWVudVxuICAgICAgICAgKiBAcGFyYW0ge3tjbWQ6IHN0cmluZywgbm9kZUlkOiBzdHJpbmd9fSB0cmVlRXZlbnQgLSBUcmVlIGV2ZW50XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ3NlbGVjdENvbnRleHRNZW51JywgZnVuY3Rpb24odHJlZUV2ZW50KSB7XG4gICAgICAgICAqICAgICB2YXIgY21kID0gdHJlZUV2ZW50LmNtZCxcbiAgICAgICAgICogICAgIHZhciBub2RlSWQgPSB0cmVlRXZlbnQubm9kZUlkO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coY21kLCBub2RlSWQpO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZS5maXJlKCdzZWxlY3RDb250ZXh0TWVudScsIHtcbiAgICAgICAgICAgIGNtZDogY21kLFxuICAgICAgICAgICAgbm9kZUlkOiB0aGlzLnNlbGVjdGVkTm9kZUlkXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIG9uIHRyZWUgaXRlbVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgX29uTW91c2VDbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XG5cbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHRNZW51O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICB1c2VIZWxwZXI6IHRydWUsXG4gICAgICAgIGhlbHBlclBvczoge1xuICAgICAgICAgICAgeTogMixcbiAgICAgICAgICAgIHg6IDVcbiAgICAgICAgfSxcbiAgICAgICAgYXV0b09wZW5EZWxheTogMTUwMCxcbiAgICAgICAgaXNTb3J0YWJsZTogZmFsc2UsXG4gICAgICAgIGhvdmVyQ2xhc3NOYW1lOiAndHVpLXRyZWUtaG92ZXInLFxuICAgICAgICBsaW5lQ2xhc3NOYW1lOiAndHVpLXRyZWUtbGluZScsXG4gICAgICAgIGxpbmVCb3VuZGFyeToge1xuICAgICAgICAgICAgdG9wOiAyLFxuICAgICAgICAgICAgYm90dG9tOiAyXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlamVjdGVkVGFnTmFtZXMgPSBbXG4gICAgICAgICdJTlBVVCcsXG4gICAgICAgICdCVVRUT04nLFxuICAgICAgICAnVUwnXG4gICAgXSxcbiAgICBBUElfTElTVCA9IFtdLFxuICAgIGluQXJyYXkgPSB0dWkudXRpbC5pbkFycmF5O1xuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBkcmFnZ2FibGVcbiAqIEBjbGFzcyBEcmFnZ2FibGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnVzZUhlbHBlciAtIFVzaW5nIGhlbHBlciBmbGFnXG4gKiAgQHBhcmFtIHt7eDogbnVtYmVyLCB5Om51bWJlcn19IG9wdGlvbnMuaGVscGVyUG9zIC0gSGVscGVyIHBvc2l0aW9uXG4gKiAgQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gb3B0aW9ucy5yZWplY3RlZFRhZ05hbWVzIC0gTm8gZHJhZ2dhYmxlIHRhZyBuYW1lc1xuICogIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG9wdGlvbnMucmVqZWN0ZWRDbGFzc05hbWVzIC0gTm8gZHJhZ2dhYmxlIGNsYXNzIG5hbWVzXG4gKiAgQHBhcmFtIHtudW1iZXJ9IG9wdGlvbnMuYXV0b09wZW5EZWxheSAtIERlbGF5IHRpbWUgd2hpbGUgZHJhZ2dpbmcgdG8gYmUgb3BlbmVkXG4gKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmlzU29ydGFibGUgLSBGbGFnIG9mIHdoZXRoZXIgdXNpbmcgc29ydGFibGUgZHJhZ2dpbmdcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5ob3ZlckNsYXNzTmFtZSAtIENsYXNzIG5hbWUgZm9yIGhvdmVyZWQgbm9kZVxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmxpbmVDbGFzc05hbWUgLSBDbGFzcyBuYW1lIGZvciBtb3ZpbmcgcG9zaXRpb24gbGluZVxuICogIEBwYXJhbSB7e3RvcDogbnVtYmVyLCBib3R0b206IG51bWJlcn19IG9wdGlvbnMubGluZUJvdW5kYXJ5IC0gQm91bmRhcnkgdmFsdWUgZm9yIHZpc2libGUgbW92aW5nIGxpbmVcbiAqL1xudmFyIERyYWdnYWJsZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgRHJhZ2dhYmxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIERyYWdnYWJsZVxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFQSSBsaXN0IG9mIERyYWdnYWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuc2V0TWVtYmVycyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5hdHRhY2hNb3VzZWRvd24oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG1lbWJlcnMgb2YgdGhpcyBtb2R1bGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGlucHV0IG9wdGlvbnNcbiAgICAgKi9cbiAgICBzZXRNZW1iZXJzOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHZhciBoZWxwZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpLFxuICAgICAgICAgICAgc3R5bGUgPSBoZWxwZXJFbGVtZW50LnN0eWxlO1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy51c2VIZWxwZXIgPSBvcHRpb25zLnVzZUhlbHBlcjtcbiAgICAgICAgdGhpcy5oZWxwZXJQb3MgPSBvcHRpb25zLmhlbHBlclBvcztcbiAgICAgICAgdGhpcy5yZWplY3RlZFRhZ05hbWVzID0gcmVqZWN0ZWRUYWdOYW1lcy5jb25jYXQob3B0aW9ucy5yZWplY3RlZFRhZ05hbWVzKTtcbiAgICAgICAgdGhpcy5yZWplY3RlZENsYXNzTmFtZXMgPSBbXS5jb25jYXQob3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMpO1xuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQgPSBoZWxwZXJFbGVtZW50O1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5VmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnROb2RlSWQgPSBudWxsO1xuICAgICAgICB0aGlzLmF1dG9PcGVuRGVsYXkgPSBvcHRpb25zLmF1dG9PcGVuRGVsYXk7XG4gICAgICAgIHRoaXMuaXNTb3J0YWJsZSA9IG9wdGlvbnMuaXNTb3J0YWJsZTtcbiAgICAgICAgdGhpcy5ob3ZlckNsYXNzTmFtZSA9IG9wdGlvbnMuaG92ZXJDbGFzc05hbWU7XG4gICAgICAgIHRoaXMubGluZUNsYXNzTmFtZSA9IG9wdGlvbnMubGluZUNsYXNzTmFtZTtcbiAgICAgICAgdGhpcy5saW5lQm91bmRhcnkgPSBvcHRpb25zLmxpbmVCb3VuZGFyeTtcbiAgICAgICAgdGhpcy5ob3ZlcmVkRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMubW92aW5nTGluZVR5cGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRpbWVyID0gbnVsbDtcblxuICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGhlbHBlckVsZW1lbnQpO1xuXG4gICAgICAgIGlmICh0aGlzLmlzU29ydGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldE1vdmluZ0xpbmUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggbW91c2UgZG93biBldmVudFxuICAgICAqL1xuICAgIGF0dGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucHJldmVudFRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy50cmVlLm9uKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2Vkb3duLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCB0ZXh0LXNlbGVjdGlvblxuICAgICAqL1xuICAgIHByZXZlbnRUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBzdHlsZSA9IHRyZWUucm9vdEVsZW1lbnQuc3R5bGUsXG4gICAgICAgICAgICBzZWxlY3RLZXkgPSB1dGlsLnRlc3RQcm9wKFxuICAgICAgICAgICAgICAgIFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J11cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRyZWUucm9vdEVsZW1lbnQsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xuXG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5ID0gc2VsZWN0S2V5O1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlID0gc3R5bGVbc2VsZWN0S2V5XTtcbiAgICAgICAgc3R5bGVbc2VsZWN0S2V5XSA9ICdub25lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhlIHRhcmdldCBlbGVtZW50IGlzIGluIHJlamVjdGVkVGFnTmFtZXMgb3IgaW4gcmVqZWN0ZWRDbGFzc05hbWVzXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdGFyZ2V0IGlzIG5vdCBkcmFnZ2FibGUgb3IgZHJhZ2dhYmxlXG4gICAgICovXG4gICAgaXNOb3REcmFnZ2FibGU6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICB2YXIgdGFnTmFtZSA9IHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICBjbGFzc05hbWVzID0gdXRpbC5nZXRDbGFzcyh0YXJnZXQpLnNwbGl0KC9cXHMrLyksXG4gICAgICAgICAgICByZXN1bHQ7XG5cbiAgICAgICAgaWYgKGluQXJyYXkodGFnTmFtZSwgdGhpcy5yZWplY3RlZFRhZ05hbWVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChjbGFzc05hbWVzLCBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGluQXJyYXkoY2xhc3NOYW1lLCB0aGlzLnJlamVjdGVkQ2xhc3NOYW1lcykgIT09IC0xO1xuXG4gICAgICAgICAgICByZXR1cm4gIXJlc3VsdDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2Vkb3duOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIG5vZGVJZDtcblxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSB8fCB0aGlzLmlzTm90RHJhZ2dhYmxlKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1dGlsLnByZXZlbnREZWZhdWx0KGV2ZW50KTtcblxuICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbm9kZUlkO1xuICAgICAgICBpZiAodGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SGVscGVyKHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWUub24oe1xuICAgICAgICAgICAgbW91c2Vtb3ZlOiB0aGlzLm9uTW91c2Vtb3ZlLFxuICAgICAgICAgICAgbW91c2V1cDogdGhpcy5vbk1vdXNldXBcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZW1vdmVcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKi9cbiAgICBvbk1vdXNlbW92ZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBoZWxwZXJFbCA9IHRoaXMuaGVscGVyRWxlbWVudDtcbiAgICAgICAgdmFyIG1vdXNlUG9zID0gdXRpbC5nZXRNb3VzZVBvcyhldmVudCk7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIHZhciBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG4gICAgICAgIHZhciBwb3MgPSB0cmVlLnJvb3RFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIGlmICghdGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlbHBlckVsLnN0eWxlLnRvcCA9IG1vdXNlUG9zLnkgLSBwb3MudG9wICsgdGhpcy5oZWxwZXJQb3MueSArICdweCc7XG4gICAgICAgIGhlbHBlckVsLnN0eWxlLmxlZnQgPSBtb3VzZVBvcy54IC0gcG9zLmxlZnQgKyB0aGlzLmhlbHBlclBvcy54ICsgJ3B4JztcbiAgICAgICAgaGVscGVyRWwuc3R5bGUuZGlzcGxheSA9ICcnO1xuXG4gICAgICAgIGlmIChub2RlSWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2FwcGx5TW92ZUFjdGlvbihub2RlSWQsIG1vdXNlUG9zKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2V1cFxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uTW91c2V1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIHZhciBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG4gICAgICAgIHZhciBpbmRleCA9IC0xO1xuXG4gICAgICAgIGlmICh0aGlzLmlzU29ydGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMubGluZUVsZW1lbnQuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuXG4gICAgICAgICAgICBpZiAobm9kZUlkICYmIHRoaXMubW92aW5nTGluZVR5cGUpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IHRoaXMuX2dldEluZGV4Rm9ySW5zZXJ0aW5nKG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgbm9kZUlkID0gdHJlZS5nZXRQYXJlbnRJZChub2RlSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRyZWUubW92ZSh0aGlzLmN1cnJlbnROb2RlSWQsIG5vZGVJZCwgaW5kZXgpO1xuICAgICAgICB0aGlzLmN1cnJlbnROb2RlSWQgPSBudWxsO1xuICAgICAgICB0aGlzLm1vdmluZ0xpbmVUeXBlID0gbnVsbDtcblxuICAgICAgICB0cmVlLm9mZih0aGlzLCAnbW91c2Vtb3ZlJyk7XG4gICAgICAgIHRyZWUub2ZmKHRoaXMsICdtb3VzZXVwJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc3RvcmUgdGV4dC1zZWxlY3Rpb25cbiAgICAgKi9cbiAgICByZXN0b3JlVGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHJlZS5yb290RWxlbWVudCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIGlmICh0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgdHJlZS5yb290RWxlbWVudC5zdHlsZVt0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleV0gPSB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBoZWxwZXIgY29udGVudHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIEhlbHBlciBjb250ZW50c1xuICAgICAqL1xuICAgIHNldEhlbHBlcjogZnVuY3Rpb24odGV4dCkge1xuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuaW5uZXJIVE1MID0gdGV4dDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGV0YWNoIG1vdXNlZG93biBldmVudFxuICAgICAqL1xuICAgIGRldGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZXN0b3JlVGV4dFNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLmRldGFjaE1vdXNlZG93bigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbW92aW5nIGxpbmUgZWxlbWVudFxuICAgICAqL1xuICAgIF9zZXRNb3ZpbmdMaW5lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxpbmVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHZhciBsaW5lU3R5bGUgPSBsaW5lRWxlbWVudC5zdHlsZTtcblxuICAgICAgICBsaW5lU3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBsaW5lU3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuXG4gICAgICAgIGxpbmVFbGVtZW50LmNsYXNzTmFtZSA9IHRoaXMubGluZUNsYXNzTmFtZTtcblxuICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChsaW5lRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5saW5lRWxlbWVudCA9IGxpbmVFbGVtZW50O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBcHBseSBtb3ZlIGFjdGlvbiB0aGF0IGFyZSBkZWxheSBlZmZlY3QgYW5kIHNvcnRhYmxlIG1vdmluZyBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpZ30gbm9kZUlkIC0gU2VsZWN0ZWQgdHJlZSBub2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG1vdXNlUG9zIC0gQ3VycmVudCBtb3VzZSBwb3NpdGlvblxuICAgICAqL1xuICAgIF9hcHBseU1vdmVBY3Rpb246IGZ1bmN0aW9uKG5vZGVJZCwgbW91c2VQb3MpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgdmFyIHRhcmdldFBvcyA9IGN1cnJlbnRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB2YXIgaGFzQ2xhc3MgPSB1dGlsLmhhc0NsYXNzKGN1cnJlbnRFbGVtZW50LCB0aGlzLmhvdmVyQ2xhc3NOYW1lKTtcbiAgICAgICAgdmFyIGlzQ29udGFpbiA9IHRoaXMuX2lzQ29udGFpbih0YXJnZXRQb3MsIG1vdXNlUG9zKTtcbiAgICAgICAgdmFyIGJvdW5kYXJ5VHlwZTtcblxuICAgICAgICBpZiAoIXRoaXMuaG92ZXJlZEVsZW1lbnQgJiYgaXNDb250YWluKSB7XG4gICAgICAgICAgICB0aGlzLl9ob3Zlcihub2RlSWQpO1xuICAgICAgICB9IGVsc2UgaWYgKCFoYXNDbGFzcyB8fCAoaGFzQ2xhc3MgJiYgIWlzQ29udGFpbikpIHtcbiAgICAgICAgICAgIHRoaXMuX3VuaG92ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmlzU29ydGFibGUpIHtcbiAgICAgICAgICAgIGJvdW5kYXJ5VHlwZSA9IHRoaXMuX2dldEJvdW5kYXJ5VHlwZSh0YXJnZXRQb3MsIG1vdXNlUG9zKTtcbiAgICAgICAgICAgIHRoaXMuX2RyYXdCb3VuZGFyeUxpbmUodGFyZ2V0UG9zLCBib3VuZGFyeVR5cGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFjdCB0byBob3ZlciBvbiB0cmVlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVHJlZSBub2RlIGlkXG4gICAgICovXG4gICAgX2hvdmVyOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBob3ZlckVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcblxuICAgICAgICB0aGlzLmhvdmVyZWRFbGVtZW50ID0gaG92ZXJFbDtcblxuICAgICAgICB1dGlsLmFkZENsYXNzKGhvdmVyRWwsIHRoaXMuaG92ZXJDbGFzc05hbWUpO1xuXG4gICAgICAgIGlmICghdHJlZS5pc0xlYWYobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQoaG92ZXJFbCkgPT09IG5vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICB0cmVlLm9wZW4obm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzLmF1dG9PcGVuRGVsYXkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFjdCB0byB1bmhvdmVyIG9uIHRyZWUgaXRlbVxuICAgICAqL1xuICAgIF91bmhvdmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO1xuXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5ob3ZlcmVkRWxlbWVudCwgdGhpcy5ob3ZlckNsYXNzTmFtZSk7XG5cbiAgICAgICAgdGhpcy5ob3ZlcmVkRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMudGltZXIgPSBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBjb250YWluZWQgc3RhdGUgb2YgY3VycmVudCB0YXJnZXRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0UG9zIC0gUG9zaXRpb24gb2YgdHJlZSBpdGVtXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG1vdXNlUG9zIC0gUG9zaXRpb24gb2YgbW92ZWQgbW91c2VcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gQ29udGFpbmVkIHN0YXRlXG4gICAgICovXG4gICAgX2lzQ29udGFpbjogZnVuY3Rpb24odGFyZ2V0UG9zLCBtb3VzZVBvcykge1xuICAgICAgICB2YXIgdG9wID0gdGFyZ2V0UG9zLnRvcDtcbiAgICAgICAgdmFyIGJvdHRvbSA9IHRhcmdldFBvcy5ib3R0b207XG5cbiAgICAgICAgaWYgKHRoaXMuaXNTb3J0YWJsZSkge1xuICAgICAgICAgICAgdG9wICs9IHRoaXMubGluZUJvdW5kYXJ5LnRvcDtcbiAgICAgICAgICAgIGJvdHRvbSAtPSB0aGlzLmxpbmVCb3VuZGFyeS5ib3R0b207XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0UG9zLmxlZnQgPCBtb3VzZVBvcy54ICYmIHRhcmdldFBvcy5yaWdodCA+IG1vdXNlUG9zLnggJiZcbiAgICAgICAgICAgIHRvcCA8IG1vdXNlUG9zLnkgJiYgYm90dG9tID4gbW91c2VQb3MueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBib3VuZGFyeSB0eXBlIGJ5IG1vdXNlIHBvc2l0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFBvcyAtIFBvc2l0aW9uIG9mIHRyZWUgaXRlbVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtb3VzZVBvcyAtIFBvc2l0aW9uIG9mIG1vdmVkIG1vdXNlXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUG9zaXRpb24gdHlwZSBpbiBib3VuZGFyeVxuICAgICAqL1xuICAgIF9nZXRCb3VuZGFyeVR5cGU6IGZ1bmN0aW9uKHRhcmdldFBvcywgbW91c2VQb3MpIHtcbiAgICAgICAgdmFyIHR5cGU7XG5cbiAgICAgICAgaWYgKG1vdXNlUG9zLnkgPCB0YXJnZXRQb3MudG9wICsgdGhpcy5saW5lQm91bmRhcnkudG9wKSB7XG4gICAgICAgICAgICB0eXBlID0gJ3RvcCc7XG4gICAgICAgIH0gZWxzZSBpZiAobW91c2VQb3MueSA+IHRhcmdldFBvcy5ib3R0b20gLSB0aGlzLmxpbmVCb3VuZGFyeS5ib3R0b20pIHtcbiAgICAgICAgICAgIHR5cGUgPSAnYm90dG9tJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEcmF3IGJvdW5kYXJ5IGxpbmUgb24gdHJlZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRQb3MgLSBQb3NpdGlvbiBvZiB0cmVlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYm91bmRhcnlUeXBlIC0gUG9zaXRpb24gdHlwZSBpbiBib3VuZGFyeVxuICAgICAqL1xuICAgIF9kcmF3Qm91bmRhcnlMaW5lOiBmdW5jdGlvbih0YXJnZXRQb3MsIGJvdW5kYXJ5VHlwZSkge1xuICAgICAgICB2YXIgc3R5bGUgPSB0aGlzLmxpbmVFbGVtZW50LnN0eWxlO1xuICAgICAgICB2YXIgbGluZUhlaWdodDtcbiAgICAgICAgdmFyIHNjcm9sbFRvcDtcblxuICAgICAgICBpZiAoYm91bmRhcnlUeXBlKSB7XG4gICAgICAgICAgICBzY3JvbGxUb3AgPSB0aGlzLnRyZWUucm9vdEVsZW1lbnQucGFyZW50Tm9kZS5zY3JvbGxUb3AgKyB1dGlsLmdldFdpbmRvd1Njcm9sbFRvcCgpO1xuICAgICAgICAgICAgbGluZUhlaWdodCA9IE1hdGgucm91bmQodGhpcy5saW5lRWxlbWVudC5vZmZzZXRIZWlnaHQgLyAyKTtcblxuICAgICAgICAgICAgc3R5bGUudG9wID0gTWF0aC5yb3VuZCh0YXJnZXRQb3NbYm91bmRhcnlUeXBlXSkgLSBsaW5lSGVpZ2h0ICsgc2Nyb2xsVG9wICsgJ3B4JztcbiAgICAgICAgICAgIHN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgICAgICB0aGlzLm1vdmluZ0xpbmVUeXBlID0gYm91bmRhcnlUeXBlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgdGhpcy5tb3ZpbmdMaW5lVHlwZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGluZGV4IGZvciBpbnNlcnRpbmdcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gQ3VycmVudCBzZWxlY3RlZCBoZWxwZXIgbm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IEluZGV4IG51bWJlclxuICAgICAqL1xuICAgIF9nZXRJbmRleEZvckluc2VydGluZzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMudHJlZS5nZXROb2RlSW5kZXgobm9kZUlkKTtcblxuICAgICAgICBpZiAodGhpcy5tb3ZpbmdMaW5lVHlwZSA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgIGluZGV4ICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ2dhYmxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vdXRpbCcpO1xuXG52YXIgQVBJX0xJU1QgPSBbXTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgc2VsZWN0YWJsZVxuICogQGNsYXNzIEVkaXRhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9uc1xuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmVkaXRhYmxlQ2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGVkaXRhYmxlIGVsZW1lbnRcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5kYXRhS2V5IC0gS2V5IG9mIG5vZGUgZGF0YSB0byBzZXQgdmFsdWVcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5pbnB1dENsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBpbnB1dCBlbGVtZW50XG4gKi9cbnZhciBFZGl0YWJsZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgRWRpdGFibGUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgU2VsZWN0YWJsZVxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFQSSBsaXN0IG9mIEVkaXRhYmxlXG4gICAgICAgICAqL1xuICAgICAgICBnZXRBUElMaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBBUElfTElTVC5zbGljZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuZWRpdGFibGVDbGFzc05hbWUgPSBvcHRpb25zLmVkaXRhYmxlQ2xhc3NOYW1lO1xuICAgICAgICB0aGlzLmRhdGFLZXkgPSBvcHRpb25zLmRhdGFLZXk7XG4gICAgICAgIHRoaXMuaW5wdXRFbGVtZW50ID0gdGhpcy5jcmVhdGVJbnB1dEVsZW1lbnQob3B0aW9ucy5pbnB1dENsYXNzTmFtZSk7XG4gICAgICAgIHRoaXMuYm91bmRPbktleXVwID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uS2V5dXAsIHRoaXMpO1xuICAgICAgICB0aGlzLmJvdW5kT25CbHVyID0gdHVpLnV0aWwuYmluZCh0aGlzLm9uQmx1ciwgdGhpcyk7XG5cbiAgICAgICAgdHJlZS5vbignZG91YmxlQ2xpY2snLCB0aGlzLm9uRG91YmxlQ2xpY2ssIHRoaXMpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdrZXl1cCcsIHRoaXMuYm91bmRPbktleXVwKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAnYmx1cicsIHRoaXMuYm91bmRPbkJsdXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXRhY2ggaW5wdXQgZWxlbWVudCBmcm9tIGRvY3VtZW50XG4gICAgICovXG4gICAgZGV0YWNoSW5wdXRGcm9tRG9jdW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5wdXRFbCA9IHRoaXMuaW5wdXRFbGVtZW50LFxuICAgICAgICAgICAgcGFyZW50Tm9kZSA9IGlucHV0RWwucGFyZW50Tm9kZTtcblxuICAgICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpbnB1dEVsKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZGV0YWNoSW5wdXRGcm9tRG9jdW1lbnQoKTtcbiAgICAgICAgdGhpcy50cmVlLm9mZih0aGlzKTtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAna2V5dXAnLCB0aGlzLmJvdW5kT25LZXl1cCk7XG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2JsdXInLCB0aGlzLmJvdW5kT25CbHVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGlucHV0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgaW5wdXQgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gSW5wdXQgZWxlbWVudFxuICAgICAqL1xuICAgIGNyZWF0ZUlucHV0RWxlbWVudDogZnVuY3Rpb24oaW5wdXRDbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnSU5QVVQnKTtcbiAgICAgICAgaWYgKGlucHV0Q2xhc3NOYW1lKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBpbnB1dENsYXNzTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgXCJkb3VibGVDbGlja1wiXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25Eb3VibGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQsIG5vZGVJZDtcblxuICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuZWRpdGFibGVDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgICAgIGlucHV0RWxlbWVudCA9IHRoaXMuaW5wdXRFbGVtZW50O1xuICAgICAgICAgICAgaW5wdXRFbGVtZW50LnZhbHVlID0gdHJlZS5nZXROb2RlRGF0YShub2RlSWQpW3RoaXMuZGF0YUtleV0gfHwgJyc7XG4gICAgICAgICAgICB0YXJnZXQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoaW5wdXRFbGVtZW50LCB0YXJnZXQpO1xuICAgICAgICAgICAgdGFyZ2V0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyOiBrZXl1cCAtIGlucHV0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIEtleSBldmVudFxuICAgICAqL1xuICAgIG9uS2V5dXA6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMykgeyAvLyBrZXl1cCBcImVudGVyXCJcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXI6IGJsdXIgLSBpbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgb25CbHVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXREYXRhKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkYXRhIG9mIGlucHV0IGVsZW1lbnQgdG8gbm9kZSBhbmQgZGV0YWNoIGlucHV0IGVsZW1lbnQgZnJvbSBkb2MuXG4gICAgICovXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgbm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0aGlzLmlucHV0RWxlbWVudCksXG4gICAgICAgICAgICBkYXRhID0ge307XG5cbiAgICAgICAgaWYgKG5vZGVJZCkge1xuICAgICAgICAgICAgZGF0YVt0aGlzLmRhdGFLZXldID0gdGhpcy5pbnB1dEVsZW1lbnQudmFsdWU7XG4gICAgICAgICAgICB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZXRhY2hJbnB1dEZyb21Eb2N1bWVudCgpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRhYmxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vdXRpbCcpO1xuXG52YXIgQVBJX0xJU1QgPSBbXG4gICAgICAgICdzZWxlY3QnLFxuICAgICAgICAnZ2V0U2VsZWN0ZWROb2RlSWQnXG4gICAgXSxcbiAgICBkZWZhdWx0cyA9IHtcbiAgICAgICAgc2VsZWN0ZWRDbGFzc05hbWU6ICd0dWktdHJlZS1zZWxlY3RlZCdcbiAgICB9O1xuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBzZWxlY3RhYmxlXG4gKiBAY2xhc3MgU2VsZWN0YWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnNlbGVjdGVkQ2xhc3NOYW1lIC0gQ2xhc3NuYW1lIGZvciBzZWxlY3RlZCBub2RlLlxuICovXG52YXIgU2VsZWN0YWJsZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgU2VsZWN0YWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBTZWxlY3RhYmxlXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgU2VsZWN0YWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSA9IG9wdGlvbnMuc2VsZWN0ZWRDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2RlSWQgPSBudWxsO1xuXG4gICAgICAgIHRyZWUub24oe1xuICAgICAgICAgICAgc2luZ2xlQ2xpY2s6IHRoaXMub25TaW5nbGVDbGljayxcbiAgICAgICAgICAgIGFmdGVyRHJhdzogdGhpcy5vbkFmdGVyRHJhd1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgdGhpcy5fc2V0QVBJcygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgYXBpcyBvZiBzZWxlY3RhYmxlIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRBUElzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBiaW5kID0gdHVpLnV0aWwuYmluZDtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICB0cmVlW2FwaU5hbWVdID0gYmluZCh0aGlzW2FwaU5hbWVdLCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBub2RlRWxlbWVudCA9IHRoaXMuZ2V0UHJldkVsZW1lbnQoKTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdHJlZS5vZmYodGhpcyk7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goQVBJX0xJU1QsIGZ1bmN0aW9uKGFwaU5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0cmVlW2FwaU5hbWVdO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgXCJzaW5nbGVDbGlja1wiXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25TaW5nbGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgIHRoaXMuc2VsZWN0KG5vZGVJZCwgdGFyZ2V0KTtcbiAgICB9LFxuXG4gICAgLyogZXNsaW50LWRpc2FibGUgdmFsaWQtanNkb2NcbiAgICAgICAgSWdub3JlIFwidGFyZ2V0XCIgcGFyYW1ldGVyIGFubm90YXRpb24gZm9yIEFQSSBwYWdlXG4gICAgICAgIFwidHJlZS5zZWxlY3Qobm9kZUlkKVwiXG4gICAgICovXG4gICAgLyoqXG4gICAgICogU2VsZWN0IG5vZGUgaWYgdGhlIGZlYXR1cmUtXCJTZWxlY3RhYmxlXCIgaXMgZW5hYmxlZC5cbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHJlcXVpcmVzIFNlbGVjdGFibGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5zZWxlY3QoJ3R1aS10cmVlLW5vZGUtMycpO1xuICAgICAqL1xuICAgIC8qIGVzbGludC1lbmFibGUgdmFsaWQtanNkb2MgKi9cbiAgICBzZWxlY3Q6IGZ1bmN0aW9uKG5vZGVJZCwgdGFyZ2V0KSB7XG4gICAgICAgIHZhciB0cmVlLCBwcmV2RWxlbWVudCwgbm9kZUVsZW1lbnQsXG4gICAgICAgICAgICBzZWxlY3RlZENsYXNzTmFtZSwgcHJldk5vZGVJZDtcblxuICAgICAgICBpZiAoIW5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgcHJldkVsZW1lbnQgPSB0aGlzLmdldFByZXZFbGVtZW50KCk7XG4gICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgc2VsZWN0ZWRDbGFzc05hbWUgPSB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lO1xuICAgICAgICBwcmV2Tm9kZUlkID0gdGhpcy5zZWxlY3RlZE5vZGVJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVTZWxlY3RcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHByZXZOb2RlSWQgLSBQcmV2aW91cyBzZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAqIEBwYXJhbSB7RWxlbWVudHx1bmRlZmluZWR9IHRhcmdldCAtIFRhcmdldCBlbGVtZW50XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWVcbiAgICAgICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcbiAgICAgICAgICogIC5vbignYmVmb3JlU2VsZWN0JywgZnVuY3Rpb24obm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpIHtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZygnc2VsZWN0ZWQgbm9kZTogJyArIG5vZGVJZCk7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3ByZXZpb3VzIHNlbGVjdGVkIG5vZGU6ICcgKyBwcmV2Tm9kZUlkKTtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZygndGFyZ2V0IGVsZW1lbnQ6ICcgKyB0YXJnZXQpO1xuICAgICAgICAgKiAgICAgIHJldHVybiBmYWxzZTsgLy8gSXQgY2FuY2VscyBcInNlbGVjdFwiXG4gICAgICAgICAqICAgICAgLy8gcmV0dXJuIHRydWU7IC8vIEl0IGZpcmVzIFwic2VsZWN0XCJcbiAgICAgICAgICogIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRyZWUuaW52b2tlKCdiZWZvcmVTZWxlY3QnLCBub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCkpIHtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MocHJldkVsZW1lbnQsIHNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3Mobm9kZUVsZW1lbnQsIHNlbGVjdGVkQ2xhc3NOYW1lKTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSNzZWxlY3RcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBTZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJldk5vZGVJZCAtIFByZXZpb3VzIHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RWxlbWVudHx1bmRlZmluZWR9IHRhcmdldCAtIFRhcmdldCBlbGVtZW50XG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdHJlZVxuICAgICAgICAgICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcbiAgICAgICAgICAgICAqICAub24oJ3NlbGVjdCcsIGZ1bmN0aW9uKG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KSB7XG4gICAgICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdzZWxlY3RlZCBub2RlOiAnICsgbm9kZUlkKTtcbiAgICAgICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3ByZXZpb3VzIHNlbGVjdGVkIG5vZGU6ICcgKyBwcmV2Tm9kZUlkKTtcbiAgICAgICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3RhcmdldCBlbGVtZW50OiAnICsgdGFyZ2V0KTtcbiAgICAgICAgICAgICAqICB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdHJlZS5maXJlKCdzZWxlY3QnLCBub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCk7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZUlkID0gbm9kZUlkO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwcmV2aW91cyBzZWxlY3RlZCBub2RlIGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IE5vZGUgZWxlbWVudFxuICAgICAqL1xuICAgIGdldFByZXZFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuc2VsZWN0ZWROb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzZWxlY3RlZCBub2RlIGlkXG4gICAgICovXG4gICAgZ2V0U2VsZWN0ZWROb2RlSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZE5vZGVJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgLSBcImFmdGVyRHJhd1wiXG4gICAgICovXG4gICAgb25BZnRlckRyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZUVsZW1lbnQgPSB0aGlzLmdldFByZXZFbGVtZW50KCk7XG5cbiAgICAgICAgaWYgKG5vZGVFbGVtZW50KSB7XG4gICAgICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdGFibGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgUmVuZGVyIHRyZWUgYW5kIHVwZGF0ZSB0cmVlLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKSxcbiAgICBkZWZhdWx0T3B0aW9uID0gcmVxdWlyZSgnLi9jb25zdHMvZGVmYXVsdE9wdGlvbicpLFxuICAgIHN0YXRlcyA9IHJlcXVpcmUoJy4vY29uc3RzL3N0YXRlcycpLFxuICAgIG1lc3NhZ2VzID0gcmVxdWlyZSgnLi9jb25zdHMvbWVzc2FnZXMnKSxcbiAgICBvdXRlclRlbXBsYXRlID0gcmVxdWlyZSgnLi9jb25zdHMvb3V0ZXJUZW1wbGF0ZScpLFxuICAgIFRyZWVNb2RlbCA9IHJlcXVpcmUoJy4vdHJlZU1vZGVsJyksXG4gICAgU2VsZWN0YWJsZSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvc2VsZWN0YWJsZScpLFxuICAgIERyYWdnYWJsZSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvZHJhZ2dhYmxlJyksXG4gICAgRWRpdGFibGUgPSByZXF1aXJlKCcuL2ZlYXR1cmVzL2VkaXRhYmxlJyksXG4gICAgQ2hlY2tib3ggPSByZXF1aXJlKCcuL2ZlYXR1cmVzL2NoZWNrYm94JyksXG4gICAgQ29udGV4dE1lbnUgPSByZXF1aXJlKCcuL2ZlYXR1cmVzL2NvbnRleHRNZW51Jyk7XG5cbnZhciBub2RlU3RhdGVzID0gc3RhdGVzLm5vZGUsXG4gICAgZmVhdHVyZXMgPSB7XG4gICAgICAgIFNlbGVjdGFibGU6IFNlbGVjdGFibGUsXG4gICAgICAgIERyYWdnYWJsZTogRHJhZ2dhYmxlLFxuICAgICAgICBFZGl0YWJsZTogRWRpdGFibGUsXG4gICAgICAgIENoZWNrYm94OiBDaGVja2JveCxcbiAgICAgICAgQ29udGV4dE1lbnU6IENvbnRleHRNZW51XG4gICAgfSxcbiAgICBzbmlwcGV0ID0gdHVpLnV0aWwsXG4gICAgZXh0ZW5kID0gc25pcHBldC5leHRlbmQsXG4gICAgVElNRU9VVF9UT19ESUZGRVJFTlRJQVRFX0NMSUNLX0FORF9EQkxDTElDSyA9IDIwMCxcbiAgICBNT1VTRV9NT1ZJTkdfVEhSRVNIT0xEID0gNTtcbi8qKlxuICogQ3JlYXRlIHRyZWUgbW9kZWwgYW5kIGluamVjdCBkYXRhIHRvIG1vZGVsXG4gKiBAY2xhc3MgVHJlZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAbWl4ZXMgdHVpLnV0aWwuQ3VzdG9tRXZlbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBBIGRhdGEgdG8gYmUgdXNlZCBvbiB0cmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9uc1xuICogICAgIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtvcHRpb25zLnJvb3RFbGVtZW50XSBSb290IGVsZW1lbnQgKEl0IHNob3VsZCBiZSAnVUwnIGVsZW1lbnQpXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLm5vZGVJZFByZWZpeF0gQSBkZWZhdWx0IHByZWZpeCBvZiBhIG5vZGVcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMubm9kZURlZmF1bHRTdGF0ZV0gQSBkZWZhdWx0IHN0YXRlIG9mIGEgbm9kZVxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy50ZW1wbGF0ZV0gQSBtYXJrdXAgc2V0IHRvIG1ha2UgZWxlbWVudFxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGUuaW50ZXJuYWxOb2RlXSBIVE1MIHRlbXBsYXRlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5sZWFmTm9kZV0gSFRNTCB0ZW1wbGF0ZVxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5zdGF0ZUxhYmVsc10gVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhdGVMYWJlbHMub3BlbmVkXSBTdGF0ZS1PUEVORUQgbGFiZWwgKFRleHQgb3IgSFRNTClcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0YXRlTGFiZWxzLmNsb3NlZF0gU3RhdGUtQ0xPU0VEIGxhYmVsIChUZXh0IG9yIEhUTUwpXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmNsYXNzTmFtZXNdIENsYXNzIG5hbWVzIGZvciB0cmVlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLm5vZGVDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLmxlYWZDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBsZWFmIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMub3BlbmVkQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igb3BlbmVkIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuY2xvc2VkQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgY2xvc2VkIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudGV4dENsYXNzXSBBIGNsYXNzIG5hbWUgdGhhdCBmb3IgdGV4dEVsZW1lbnQgaW4gbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igc3VidHJlZSBpbiBpbnRlcm5hbCBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIHRvZ2dsZSBidXR0b24gaW4gaW50ZXJuYWwgbm9kZVxuICogICAgIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLnJlbmRlclRlbXBsYXRlXSBGdW5jdGlvbiBmb3IgcmVuZGVyaW5nIHRlbXBsYXRlXG4gKiBAZXhhbXBsZVxuICogLy9EZWZhdWx0IG9wdGlvbnM6XG4gKiAvLyB7XG4gKiAvLyAgICAgbm9kZUlkUHJlZml4OiAndHVpLXRyZWUtbm9kZS0nXG4gKiAvLyAgICAgbm9kZURlZmF1bHRTdGF0ZTogJ2Nsb3NlZCcsXG4gKiAvLyAgICAgc3RhdGVMYWJlbHM6IHtcbiAqIC8vICAgICAgICAgb3BlbmVkOiAnLScsXG4gKiAvLyAgICAgICAgIGNsb3NlZDogJysnXG4gKiAvLyAgICAgfSxcbiAqIC8vICAgICBjbGFzc05hbWVzOiB7XG4gKiAvLyAgICAgICAgIG5vZGVDbGFzczogJ3R1aS10cmVlLW5vZGUnLFxuICogLy8gICAgICAgICBsZWFmQ2xhc3M6ICd0dWktdHJlZS1sZWFmJyxcbiAqIC8vICAgICAgICAgb3BlbmVkQ2xhc3M6ICd0dWktdHJlZS1vcGVuZWQnLFxuICogLy8gICAgICAgICBjbG9zZWRDbGFzczogJ3R1aS10cmVlLWNsb3NlZCcsXG4gKiAvLyAgICAgICAgIHN1YnRyZWVDbGFzczogJ3R1aS10cmVlLXN1YnRyZWUnLFxuICogLy8gICAgICAgICB0b2dnbGVCdG5DbGFzczogJ3R1aS10cmVlLXRvZ2dsZUJ0bicsXG4gKiAvLyAgICAgICAgIHRleHRDbGFzczogJ3R1aS10cmVlLXRleHQnLFxuICogLy8gICAgIH0sXG4gKiAvLyAgICAgdGVtcGxhdGU6IHtcbiAqIC8vICAgICAgICAgaW50ZXJuYWxOb2RlOlxuICogLy8gICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3tzdGF0ZUxhYmVsfX08L2J1dHRvbj4nICtcbiAqIC8vICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAqIC8vICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e3N1YnRyZWVDbGFzc319XCI+e3tjaGlsZHJlbn19PC91bD4nXG4gKiAvLyAgICAgICAgIGxlYWZOb2RlOlxuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICogLy8gICAgIH1cbiAqIC8vIH1cbiAqIC8vXG4gKlxuICogdmFyIGRhdGEgPSBbXG4gKiAgICAge3RleHQ6ICdyb290QScsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQSd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMUInfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFDJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xRCd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkEnLCBjaGlsZHJlbjogW1xuICogICAgICAgICAgICAge3RleHQ6J3N1Yl8xQScsIGNoaWxkcmVuOltcbiAqICAgICAgICAgICAgICAgICB7dGV4dDonc3ViX3N1Yl8xQSd9XG4gKiAgICAgICAgICAgICBdfSxcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWJfMkEnfVxuICogICAgICAgICBdfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJCJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQyd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkQnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNBJywgY2hpbGRyZW46IFtcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWIzX2EnfSxcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWIzX2InfVxuICogICAgICAgICBdfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNCJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zQyd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0QnfVxuICogICAgIF19LFxuICogICAgIHt0ZXh0OiAncm9vdEInLCBjaGlsZHJlbjogW1xuICogICAgICAgICB7dGV4dDonQl9zdWIxJ30sXG4gKiAgICAgICAgIHt0ZXh0OidCX3N1YjInfSxcbiAqICAgICAgICAge3RleHQ6J2InfVxuICogICAgIF19XG4gKiBdO1xuICpcbiAqIHZhciB0cmVlMSA9IG5ldyB0dWkuY29tcG9uZW50LlRyZWUoZGF0YSwge1xuICogICAgIHJvb3RFbGVtZW50OiAndHJlZVJvb3QnLCAvLyBvciBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJlZVJvb3QnKVxuICogICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdvcGVuZWQnLFxuICpcbiAqICAgICAvLyA9PT09PT09PT0gT3B0aW9uOiBPdmVycmlkZSB0ZW1wbGF0ZSByZW5kZXJlciA9PT09PT09PT09PVxuICpcbiAqICAgICB0ZW1wbGF0ZTogeyAvLyB0ZW1wbGF0ZSBmb3IgTXVzdGFjaGUgZW5naW5lXG4gKiAgICAgICAgIGludGVybmFsTm9kZTpcbiAqICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7e3N0YXRlTGFiZWx9fX08L2J1dHRvbj4nICtcbiAqICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3t0ZXh0fX19PC9zcGFuPicgK1xuICogICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e3tjaGlsZHJlbn19fTwvdWw+J1xuICogICAgICAgICBsZWFmTm9kZTpcbiAqICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3t0ZXh0fX19PC9zcGFuPicgK1xuICogICAgIH0sXG4gKiAgICAgcmVuZGVyVGVtcGxhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgcHJvcHMpIHtcbiAqICAgICAgICAgLy8gTXVzdGFjaGUgdGVtcGxhdGUgZW5naW5lXG4gKiAgICAgICAgIHJldHVybiBNdXN0YWNoZS5yZW5kZXIodGVtcGxhdGUsIHByb3BzKTtcbiAqICAgICB9XG4gKiB9KTtcbiAqKi9cbnZhciBUcmVlID0gc25pcHBldC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IGNsYXNzIG5hbWVzXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY2xhc3NOYW1lcyA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbi5jbGFzc05hbWVzLCBvcHRpb25zLmNsYXNzTmFtZXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IHRlbXBsYXRlXG4gICAgICAgICAqIEB0eXBlIHt7aW50ZXJuYWxOb2RlOiBzdHJpbmcsIGxlYWZOb2RlOiBzdHJpbmd9fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbi50ZW1wbGF0ZSwgb3B0aW9ucy50ZW1wbGF0ZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJvb3QgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gb3B0aW9ucy5yb290RWxlbWVudDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxuICAgICAgICAgKiBAdHlwZSB7e29wZW5lZDogc3RyaW5nLCBjbG9zZWQ6IHN0cmluZ319XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnN0YXRlTGFiZWxzID0gb3B0aW9ucy5zdGF0ZUxhYmVscztcblxuICAgICAgICAvKipcbiAgICAgICAgICogTWFrZSB0cmVlIG1vZGVsXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTW9kZWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFRyZWVNb2RlbChkYXRhLCBvcHRpb25zKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRW5hYmxlZCBmZWF0dXJlc1xuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIG9iamVjdD59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmVuYWJsZWRGZWF0dXJlcyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGljayB0aW1lciB0byBwcmV2ZW50IGNsaWNrLWR1cGxpY2F0aW9uIHdpdGggZG91YmxlIGNsaWNrXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUbyBwcmV2ZW50IGNsaWNrIGV2ZW50IGlmIG1vdXNlIG1vdmVkIGJlZm9yZSBtb3VzZXVwLlxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbW91c2VNb3ZpbmdGbGFnID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbmRlciB0ZW1wbGF0ZVxuICAgICAgICAgKiBJdCBjYW4gYmUgb3ZlcnJvZGUgYnkgdXNlcidzIHRlbXBsYXRlIGVuZ2luZS5cbiAgICAgICAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcmVuZGVyVGVtcGxhdGUgPSBvcHRpb25zLnJlbmRlclRlbXBsYXRlIHx8IHV0aWwucmVuZGVyVGVtcGxhdGU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRydWUgd2hlbiBhIG5vZGUgaXMgbW92aW5nXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oe1xuICAgICAgICAgKiAgICAgYmVmb3JlRHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAqICAgICAgICAgaWYgKHRyZWUuaXNNb3ZpbmdOb2RlKSB7XG4gICAgICAgICAqICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICogICAgICAgICB9XG4gICAgICAgICAqICAgICAgICAgLy8uLlxuICAgICAgICAgKiAgICAgfSxcbiAgICAgICAgICogICAgIC8vLi4uLlxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICogdHJlZS5tb3ZlKCd0dWktdHJlZS1ub2RlLTEnLCAndHVpLXRyZWUtbm9kZS0yJyk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzTW92aW5nTm9kZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuX3NldFJvb3QoKTtcbiAgICAgICAgdGhpcy5fZHJhdyh0aGlzLmdldFJvb3ROb2RlSWQoKSk7XG4gICAgICAgIHRoaXMuX3NldEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcm9vdCBlbGVtZW50IG9mIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSb290OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJvb3RFbCA9IHRoaXMucm9vdEVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKHNuaXBwZXQuaXNTdHJpbmcocm9vdEVsKSkge1xuICAgICAgICAgICAgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHJvb3RFbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNuaXBwZXQuaXNIVE1MTm9kZShyb290RWwpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZXMuSU5WQUxJRF9ST09UX0VMRU1FTlQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9yaWdpbmFsUGFyZW50SWQgLSBPcmlnaW5hbCBwYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaW5kZXhdIC0gU3RhcnQgaW5kZXggbnVtYmVyIGZvciBpbnNlcnRpbmdcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbk1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgb3JpZ2luYWxQYXJlbnRJZCwgbmV3UGFyZW50SWQsIGluZGV4KSB7XG4gICAgICAgIHRoaXMuX2RyYXcob3JpZ2luYWxQYXJlbnRJZCk7XG4gICAgICAgIHRoaXMuX2RyYXcobmV3UGFyZW50SWQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI21vdmVcbiAgICAgICAgICogQHBhcmFtIHt7bm9kZUlkOiBzdHJpbmcsIG9yaWdpbmFsUGFyZW50SWQ6IHN0cmluZywgbmV3UGFyZW50SWQ6IHN0cmluZywgaW5kZXg6IG51bWJlcn19IHRyZWVFdmVudCAtIEV2ZW50XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ21vdmUnLCBmdW5jdGlvbih0cmVlRXZlbnQpIHtcbiAgICAgICAgICogICAgIHZhciBub2RlSWQgPSB0cmVlRXZlbnQubm9kZUlkLFxuICAgICAgICAgKiAgICAgICAgIG9yaWdpbmFsUGFyZW50SWQgPSB0cmVlRXZlbnQub3JpZ2luYWxQYXJlbnRJZCxcbiAgICAgICAgICogICAgICAgICBuZXdQYXJlbnRJZCA9IHRyZWVFdmVudC5uZXdQYXJlbnRJZCxcbiAgICAgICAgICogICAgICAgICBpbmRleCA9IHRyZWVFdmVudC5pbmRleDtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKG5vZGVJZCwgb3JpZ2luYWxQYXJlbnRJZCwgbmV3UGFyZW50SWQsIGluZGV4KTtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpcmUoJ21vdmUnLCB7XG4gICAgICAgICAgICBub2RlSWQ6IG5vZGVJZCxcbiAgICAgICAgICAgIG9yaWdpbmFsUGFyZW50SWQ6IG9yaWdpbmFsUGFyZW50SWQsXG4gICAgICAgICAgICBuZXdQYXJlbnRJZDogbmV3UGFyZW50SWQsXG4gICAgICAgICAgICBpbmRleDogaW5kZXhcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBldmVudCBoYW5kbGVyc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubW9kZWwub24oe1xuICAgICAgICAgICAgdXBkYXRlOiB0aGlzLl9kcmF3LFxuICAgICAgICAgICAgbW92ZTogdGhpcy5fb25Nb3ZlXG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290RWxlbWVudCwgJ2NsaWNrJywgc25pcHBldC5iaW5kKHRoaXMuX29uQ2xpY2ssIHRoaXMpKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdtb3VzZWRvd24nLCBzbmlwcGV0LmJpbmQodGhpcy5fb25Nb3VzZWRvd24sIHRoaXMpKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdkYmxjbGljaycsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkRvdWJsZUNsaWNrLCB0aGlzKSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnY29udGV4dG1lbnUnLCBzbmlwcGV0LmJpbmQodGhpcy5fb25Db250ZXh0TWVudSwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gY29udGV4dG1lbnVcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IG1vdXNlRXZlbnQgLSBDb250ZXh0bWVudSBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ29udGV4dE1lbnU6IGZ1bmN0aW9uKG1vdXNlRXZlbnQpIHtcbiAgICAgICAgdGhpcy5maXJlKCdjb250ZXh0bWVudScsIG1vdXNlRXZlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vkb3duXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBkb3duRXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTW91c2Vkb3duOiBmdW5jdGlvbihkb3duRXZlbnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgY2xpZW50WCA9IGRvd25FdmVudC5jbGllbnRYLFxuICAgICAgICAgICAgY2xpZW50WSA9IGRvd25FdmVudC5jbGllbnRZLFxuICAgICAgICAgICAgYWJzID0gTWF0aC5hYnM7XG5cbiAgICAgICAgZnVuY3Rpb24gb25Nb3VzZU1vdmUobW92ZUV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgbmV3Q2xpZW50WCA9IG1vdmVFdmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIG5ld0NsaWVudFkgPSBtb3ZlRXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgaWYgKGFicyhuZXdDbGllbnRYIC0gY2xpZW50WCkgKyBhYnMobmV3Q2xpZW50WSAtIGNsaWVudFkpID4gTU9VU0VfTU9WSU5HX1RIUkVTSE9MRCkge1xuICAgICAgICAgICAgICAgIHNlbGYuZmlyZSgnbW91c2Vtb3ZlJywgbW92ZUV2ZW50KTtcbiAgICAgICAgICAgICAgICBzZWxmLl9tb3VzZU1vdmluZ0ZsYWcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uTW91c2VVcCh1cEV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLmZpcmUoJ21vdXNldXAnLCB1cEV2ZW50KTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbW91c2VNb3ZpbmdGbGFnID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZmlyZSgnbW91c2Vkb3duJywgZG93bkV2ZW50KTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGNsaWNrXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIENsaWNrIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25DbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICh1dGlsLmlzUmlnaHRCdXR0b24oZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzcykpIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlKHRoaXMuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KSk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jbGlja1RpbWVyICYmICF0aGlzLl9tb3VzZU1vdmluZ0ZsYWcpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnc2luZ2xlQ2xpY2snLCBldmVudCk7XG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVzZXRDbGlja1RpbWVyKCk7XG4gICAgICAgICAgICB9LCBUSU1FT1VUX1RPX0RJRkZFUkVOVElBVEVfQ0xJQ0tfQU5EX0RCTENMSUNLKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gZG91YmxlIGNsaWNrIChkYmxjbGljaylcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gRG91YmxlIGNsaWNrIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Eb3VibGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5maXJlKCdkb3VibGVDbGljaycsIGV2ZW50KTtcbiAgICAgICAgdGhpcy5yZXNldENsaWNrVGltZXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG5vZGUgc3RhdGUgLSBvcGVuZWQgb3IgY2xvc2VkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOb2RlIHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0RGlzcGxheUZyb21Ob2RlU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcbiAgICAgICAgdmFyIHN1YnRyZWVFbGVtZW50ID0gdGhpcy5fZ2V0U3VidHJlZUVsZW1lbnQobm9kZUlkKSxcbiAgICAgICAgICAgIGxhYmVsLCBidG5FbGVtZW50LCBub2RlRWxlbWVudDtcblxuICAgICAgICBpZiAoIXN1YnRyZWVFbGVtZW50IHx8IHN1YnRyZWVFbGVtZW50ID09PSB0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGFiZWwgPSB0aGlzLnN0YXRlTGFiZWxzW3N0YXRlXTtcbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xuICAgICAgICBidG5FbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgICAgICAgbm9kZUVsZW1lbnQsXG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NcbiAgICAgICAgKVswXTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IG5vZGVTdGF0ZXMuT1BFTkVEKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGUobm9kZUVsZW1lbnQsIHN0YXRlKTtcblxuICAgICAgICBpZiAoYnRuRWxlbWVudCkge1xuICAgICAgICAgICAgYnRuRWxlbWVudC5pbm5lckhUTUwgPSBsYWJlbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbm9kZSBjbGFzcyBuYW1lIGZyb20gcHJvdmlkZWQgc3RhdGVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlRWxlbWVudCAtIFRyZWVOb2RlIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOZXcgY2hhbmdlZCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGU6IGZ1bmN0aW9uKG5vZGVFbGVtZW50LCBzdGF0ZSkge1xuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcbiAgICAgICAgICAgIG9wZW5lZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5PUEVORUQgKyAnQ2xhc3MnXSxcbiAgICAgICAgICAgIGNsb3NlZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5DTE9TRUQgKyAnQ2xhc3MnXTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBvcGVuZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBjbG9zZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbFxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG5vZGVJZHMgLSBOb2RlIGlkIGxpc3RcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAc2VlIG91dGVyVGVtcGxhdGUgdXNlcyBcInV0aWwucmVuZGVyVGVtcGxhdGVcIlxuICAgICAqL1xuICAgIF9tYWtlSHRtbDogZnVuY3Rpb24obm9kZUlkcykge1xuICAgICAgICB2YXIgbW9kZWwgPSB0aGlzLm1vZGVsLFxuICAgICAgICAgICAgaHRtbCA9ICcnO1xuXG4gICAgICAgIHNuaXBwZXQuZm9yRWFjaChub2RlSWRzLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gbW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgICAgIHNvdXJjZXMsIHByb3BzO1xuXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNvdXJjZXMgPSB0aGlzLl9nZXRUZW1wbGF0ZShub2RlKTtcbiAgICAgICAgICAgIHByb3BzID0gdGhpcy5fbWFrZVRlbXBsYXRlUHJvcHMobm9kZSk7XG4gICAgICAgICAgICBwcm9wcy5pbm5lclRlbXBsYXRlID0gdGhpcy5fbWFrZUlubmVySFRNTChub2RlLCB7XG4gICAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2VzLmlubmVyLFxuICAgICAgICAgICAgICAgIHByb3BzOiBwcm9wc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBodG1sICs9IHV0aWwucmVuZGVyVGVtcGxhdGUoc291cmNlcy5vdXRlciwgcHJvcHMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBpbm5lciBodG1sIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBub2RlIC0gTm9kZVxuICAgICAqIEBwYXJhbSB7e3NvdXJjZTogc3RyaW5nLCBwcm9wczogT2JqZWN0fX0gW2NhY2hlZF0gLSBDYXNoZWQgZGF0YSB0byBtYWtlIGh0bWxcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBJbm5lciBodG1sIG9mIG5vZGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBzZWUgaW5uZXJUZW1wbGF0ZSB1c2VzIFwidGhpcy5fcmVuZGVyVGVtcGxhdGVcIlxuICAgICAqL1xuICAgIF9tYWtlSW5uZXJIVE1MOiBmdW5jdGlvbihub2RlLCBjYWNoZWQpIHtcbiAgICAgICAgdmFyIHNvdXJjZSwgcHJvcHM7XG5cbiAgICAgICAgY2FjaGVkID0gY2FjaGVkIHx8IHt9O1xuICAgICAgICBzb3VyY2UgPSBjYWNoZWQuc291cmNlIHx8IHRoaXMuX2dldFRlbXBsYXRlKG5vZGUpLmlubmVyO1xuICAgICAgICBwcm9wcyA9IGNhY2hlZC5wcm9wcyB8fCB0aGlzLl9tYWtlVGVtcGxhdGVQcm9wcyhub2RlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fcmVuZGVyVGVtcGxhdGUoc291cmNlLCBwcm9wcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0ZW1wbGF0ZSBzb3VyY2VzXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcmV0dXJucyB7e2lubmVyOiBzdHJpbmcsIG91dGVyOiBzdHJpbmd9fSBUZW1wbGF0ZSBzb3VyY2VzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHNvdXJjZTtcblxuICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xuICAgICAgICAgICAgc291cmNlID0ge1xuICAgICAgICAgICAgICAgIGlubmVyOiB0aGlzLnRlbXBsYXRlLmxlYWZOb2RlLFxuICAgICAgICAgICAgICAgIG91dGVyOiBvdXRlclRlbXBsYXRlLkxFQUZfTk9ERVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICBpbm5lcjogdGhpcy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGUsXG4gICAgICAgICAgICAgICAgb3V0ZXI6IG91dGVyVGVtcGxhdGUuSU5URVJOQUxfTk9ERVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgdGVtcGxhdGUgcHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGVtcGxhdGUgcHJvcGVydGllc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VUZW1wbGF0ZVByb3BzOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzLFxuICAgICAgICAgICAgcHJvcHMsIHN0YXRlO1xuXG4gICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBpZDogbm9kZS5nZXRJZCgpLFxuICAgICAgICAgICAgICAgIGlzTGVhZjogdHJ1ZSAvLyBmb3IgY3VzdG9tIHRlbXBsYXRlIG1ldGhvZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IG5vZGUuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICBzdGF0ZUNsYXNzOiBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10sXG4gICAgICAgICAgICAgICAgc3RhdGVMYWJlbDogdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV0sXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXh0ZW5kKHByb3BzLCBjbGFzc05hbWVzLCBub2RlLmdldEFsbERhdGEoKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERyYXcgZWxlbWVudCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kcmF3OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIGVsZW1lbnQsIGh0bWw7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVEcmF3XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2JlZm9yZURyYXcnLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgIGlmICh0cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCdpc01vdmluZ05vZGUnKTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCdiZWZvcmVEcmF3OiAnICsgbm9kZUlkKTtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpcmUoJ2JlZm9yZURyYXcnLCBub2RlSWQpO1xuXG4gICAgICAgIGlmIChub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBodG1sID0gdGhpcy5fbWFrZUh0bWwobm9kZS5nZXRDaGlsZElkcygpKTtcbiAgICAgICAgICAgIGVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaHRtbCA9IHRoaXMuX21ha2VJbm5lckhUTUwobm9kZSk7XG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHRoaXMuX3NldENsYXNzV2l0aERpc3BsYXkobm9kZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYWZ0ZXJEcmF3XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2FmdGVyRHJhdycsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgKiAgICAgaWYgKHRyZWUuaXNNb3ZpbmdOb2RlKSB7XG4gICAgICAgICAqICAgICAgICAgY29uc29sZS5sb2coJ2lzTW92aW5nTm9kZScpO1xuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ2FmdGVyRHJhdzogJyArIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdhZnRlckRyYXcnLCBub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY2xhc3MgYW5kIGRpc3BsYXkgb2Ygbm9kZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDbGFzc1dpdGhEaXNwbGF5OiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBub2RlSWQgPSBub2RlLmdldElkKCksXG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKSxcbiAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXM7XG5cbiAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5vcGVuZWRDbGFzcyk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZXMuY2xvc2VkQ2xhc3MpO1xuICAgICAgICAgICAgdXRpbC5hZGRDbGFzcyhlbGVtZW50LCBjbGFzc05hbWVzLmxlYWZDbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIG5vZGUuZ2V0U3RhdGUoKSk7XG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDbGFzc1dpdGhEaXNwbGF5KGNoaWxkKTtcbiAgICAgICAgICAgIH0sIG5vZGVJZCwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHN1YnRyZWUgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBUcmVlTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gU3VidHJlZSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3VidHJlZUVsZW1lbnQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpLFxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3NcbiAgICAgICAgICAgIClbMF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VidHJlZUVsZW1lbnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgZGVwdGggb2Ygbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ8dW5kZWZpbmVkfSBEZXB0aFxuICAgICAqL1xuICAgIGdldERlcHRoOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0RGVwdGgobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBsYXN0IGRlcHRoIG9mIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge251bWJlcn0gTGFzdCBkZXB0aFxuICAgICAqL1xuICAgIGdldExhc3REZXB0aDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldExhc3REZXB0aCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcm9vdCBub2RlIGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJvb3Qgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFJvb3ROb2RlSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5yb290Tm9kZS5nZXRJZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gY2hpbGQgaWRzXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fHVuZGVmaW5lZH0gQ2hpbGQgaWRzXG4gICAgICovXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRDaGlsZElkcyhub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcGFyZW50IGlkIG9mIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gUGFyZW50IGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRQYXJlbnRJZChub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXNldCBjbGljayB0aW1lclxuICAgICAqL1xuICAgIHJlc2V0Q2xpY2tUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5jbGlja1RpbWVyKTtcbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgaWQgZnJvbSBlbGVtZW50XG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBFbGVtZW50XG4gICAgICogQHJldHVybnMge3N0cmluZ30gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudChlbGVtZW50SW5Ob2RlKTsgLy8gJ3R1aS10cmVlLW5vZGUtMydcbiAgICAgKi9cbiAgICBnZXROb2RlSWRGcm9tRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICB2YXIgaWRQcmVmaXggPSB0aGlzLmdldE5vZGVJZFByZWZpeCgpO1xuXG4gICAgICAgIHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQuaWQuaW5kZXhPZihpZFByZWZpeCkgPT09IC0xKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmlkIDogJyc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwcmVmaXggb2Ygbm9kZSBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXggb2Ygbm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXROb2RlSWRQcmVmaXgoKTsgLy8gJ3R1aS10cmVlLW5vZGUtJ1xuICAgICAqL1xuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVJZFByZWZpeCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge29iamVjdHx1bmRlZmluZWR9IE5vZGUgZGF0YVxuICAgICAqL1xuICAgIGdldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Tm9kZURhdGEobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQGV4bWFwbGVcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwge2ZvbzogJ2Jhcid9KTsgLy8gYXV0byByZWZyZXNoXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIHtmb286ICdiYXInfSwgdHJ1ZSk7IC8vIG5vdCByZWZyZXNoXG4gICAgICovXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCwgZGF0YSwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEsIGlzU2lsZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIG5vZGUgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fSBuYW1lcyAtIE5hbWVzIG9mIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgJ2ZvbycpOyAvLyBhdXRvIHJlZnJlc2hcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgJ2ZvbycsIHRydWUpOyAvLyBub3QgcmVmcmVzaFxuICAgICAqL1xuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIG5hbWVzLCBpc1NpbGVudCkge1xuICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZU5vZGVEYXRhKG5vZGVJZCwgbmFtZXMsIGlzU2lsZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgc3RhdGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IE5vZGUgc3RhdGUoKCdvcGVuZWQnLCAnY2xvc2VkJywgbnVsbClcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0U3RhdGUobm9kZUlkKTsgLy8gJ29wZW5lZCcsICdjbG9zZWQnLFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgLy8gdW5kZWZpbmVkIGlmIHRoZSBub2RlIGlzIG5vbmV4aXN0ZW50XG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPcGVuIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKi9cbiAgICBvcGVuOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5PUEVORUQ7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xvc2Ugbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5DTE9TRUQ7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKi9cbiAgICB0b2dnbGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3RhdGU7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUudG9nZ2xlU3RhdGUoKTtcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU29ydCBhbGwgbm9kZXNcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZm9yIHNvcnRpbmdcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyB0cmVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBTb3J0IHdpdGggcmVkcmF3aW5nIHRyZWVcbiAgICAgKiB0cmVlLnNvcnQoZnVuY3Rpb24obm9kZUEsIG5vZGVCKSB7XG4gICAgICogICAgIHZhciBhVmFsdWUgPSBub2RlQS5nZXREYXRhKCd0ZXh0JyksXG4gICAgICogICAgICAgICBiVmFsdWUgPSBub2RlQi5nZXREYXRhKCd0ZXh0Jyk7XG4gICAgICpcbiAgICAgKiAgICAgaWYgKCFiVmFsdWUgfHwgIWJWYWx1ZS5sb2NhbGVDb21wYXJlKSB7XG4gICAgICogICAgICAgICByZXR1cm4gMDtcbiAgICAgKiAgICAgfVxuICAgICAqICAgICByZXR1cm4gYlZhbHVlLmxvY2FsZUNvbXBhcmUoYVZhbHVlKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIC8vIFNvcnQsIGJ1dCBub3QgcmVkcmF3IHRyZWVcbiAgICAgKiB0cmVlLnNvcnQoZnVuY3Rpb24obm9kZUEsIG5vZGVCKSB7XG4gICAgICogICAgIHZhciBhVmFsdWUgPSBub2RlQS5nZXREYXRhKCd0ZXh0JyksXG4gICAgICogICAgICAgICBiVmFsdWUgPSBub2RlQi5nZXREYXRhKCd0ZXh0Jyk7XG4gICAgICpcbiAgICAgKiAgICAgaWYgKCFiVmFsdWUgfHwgIWJWYWx1ZS5sb2NhbGVDb21wYXJlKSB7XG4gICAgICogICAgICAgICByZXR1cm4gMDtcbiAgICAgKiAgICAgfVxuICAgICAqICAgICByZXR1cm4gYlZhbHVlLmxvY2FsZUNvbXBhcmUoYVZhbHVlKTtcbiAgICAgKiB9LCB0cnVlKTtcbiAgICAgKi9cbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yLCBpc1NpbGVudCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNvcnQoY29tcGFyYXRvcik7XG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZnJlc2ggdHJlZSBvciBub2RlJ3MgY2hpbGRyZW5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtub2RlSWRdIC0gVHJlZU5vZGUgaWQgdG8gcmVmcmVzaFxuICAgICAqL1xuICAgIHJlZnJlc2g6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICBub2RlSWQgPSBub2RlSWQgfHwgdGhpcy5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIHRoaXMuX2RyYXcobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICogICAgIGNvbnNvbGUubG9nKG5vZGUuZ2V0SWQoKSA9PT0gbm9kZUlkKTsgLy8gdHJ1ZVxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIGVhY2hBbGw6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMubW9kZWwuZWFjaEFsbChpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgZGVzY2VuZGFudHMgb2YgYSBub2RlLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5lYWNoKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAqICAgICBjb25zb2xlLmxvZyhub2RlLmdldElkKCkgPT09IG5vZGVJZCk7IC8vIHRydWVcbiAgICAgKiB9LCBwYXJlbnRJZCk7XG4gICAgICpcbiAgICAgKi9cbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBub2RlKHMpLlxuICAgICAqIC0gSWYgdGhlIHBhcmVudElkIGlzIGZhbHN5LCB0aGUgbm9kZSB3aWxsIGJlIGFwcGVuZGVkIHRvIHJvb3ROb2RlLlxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdy1kYXRhXG4gICAgICogQHBhcmFtIHsqfSBbcGFyZW50SWRdIC0gUGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBhZGQgbm9kZSB3aXRoIHJlZHJhd2luZ1xuICAgICAqIHZhciBmaXJzdEFkZGVkSWRzID0gdHJlZS5hZGQoe3RleHQ6J0ZFIGRldmVsb3BtZW50IHRlYW0xJ30sIHBhcmVudElkKTtcbiAgICAgKiBjb25zb2xlLmxvZyhmaXJzdEFkZGVkSWRzKTsgLy8gW1widHVpLXRyZWUtbm9kZS0xMFwiXVxuICAgICAqXG4gICAgICogLy8gYWRkIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcbiAgICAgKiB2YXIgc2Vjb25kQWRkZWRJZHMgPSB0cmVlLmFkZChbXG4gICAgICogICAge3RleHQ6ICdGRSBkZXZlbG9wbWVudCB0ZWFtMid9LFxuICAgICAqICAgIHt0ZXh0OiAnRkUgZGV2ZWxvcG1lbnQgdGVhbTMnfVxuICAgICAqIF0sIHBhcmVudElkLCB0cnVlKTtcbiAgICAgKiBjb25zb2xlLmxvZyhzZWNvbmRBZGRlZElkcyk7IC8vIFtcInR1aS10cmVlLW5vZGUtMTFcIiwgXCJ0dWktdHJlZS1ub2RlLTEyXCJdXG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuYWRkKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IGFsbCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3IGRhdGEgZm9yIGFsbCBub2Rlc1xuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQWRkZWQgbm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUucmVzZXRBbGxEYXRhKFtcbiAgICAgKiAge3RleHQ6ICdoZWxsbycsIGNoaWxkcmVuOiBbXG4gICAgICogICAgICB7dGV4dDogJ2Zvbyd9LFxuICAgICAqICAgICAge3RleHQ6ICdiYXInfVxuICAgICAqICBdfSxcbiAgICAgKiAge3RleHQ6ICd3b2xyZCd9XG4gICAgICogXSk7XG4gICAgICovXG4gICAgcmVzZXRBbGxEYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsQ2hpbGRyZW4odGhpcy5nZXRSb290Tm9kZUlkKCksIHRydWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFkZChkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFsbCBjaGlsZHJlblxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyB0aGUgbm9kZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZW1vdmVBbGxDaGlsZHJlbihub2RlSWQpOyAvLyBSZWRyYXdzIHRoZSBub2RlXG4gICAgICogdHJlZS5yZW1vdmVBbGxDaGlsZHJlbihub2RJZCwgdHJ1ZSk7IC8vIERvZXNuJ3QgcmVkcmF3IHRoZSBub2RlXG4gICAgICovXG4gICAgcmVtb3ZlQWxsQ2hpbGRyZW46IGZ1bmN0aW9uKG5vZGVJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRDaGlsZElkcyhub2RlSWQpO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNoaWxkSWQsIHRydWUpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9kcmF3KG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZCB0byByZW1vdmVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZW1vdmUobXlOb2RlSWQpOyAvLyByZW1vdmUgbm9kZSB3aXRoIHJlZHJhd2luZ1xuICAgICAqIHRyZWUucmVtb3ZlKG15Tm9kZUlkLCB0cnVlKTsgLy8gcmVtb3ZlIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmUobm9kZUlkLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnRcbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gSW5kZXggbnVtYmVyIG9mIHNlbGVjdGVkIG5vZGVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5tb3ZlKG15Tm9kZUlkLCBuZXdQYXJlbnRJZCk7IC8vIG1vZGUgbm9kZSB3aXRoIHJlZHJhd2luZ1xuICAgICAqIHRyZWUubW92ZShteU5vZGVJZCwgbmV3UGFyZW50SWQsIHRydWUpOyAvLyBtb3ZlIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcbiAgICAgKi9cbiAgICBtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG5ld1BhcmVudElkLCBpbmRleCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5pc01vdmluZ05vZGUgPSB0cnVlO1xuICAgICAgICB0aGlzLm1vZGVsLm1vdmUobm9kZUlkLCBuZXdQYXJlbnRJZCwgaW5kZXgsIGlzU2lsZW50KTtcbiAgICAgICAgdGhpcy5pc01vdmluZ05vZGUgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIG5vZGUgaWRzIGJ5IHBhc3NpbmcgdGhlIHByZWRpY2F0ZSBjaGVjayBvciBtYXRjaGluZyBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fSBwcmVkaWNhdGUgLSBQcmVkaWNhdGUgb3IgZGF0YVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIHByZWRpY2F0ZVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIHNlYXJjaCBmcm9tIHByZWRpY2F0ZVxuICAgICAqIHZhciBsZWFmTm9kZUlkcyA9IHRyZWUuc2VhcmNoKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAqICAgICByZXR1cm4gbm9kZS5pc0xlYWYoKTtcbiAgICAgKiB9KTtcbiAgICAgKiBjb25zb2xlLmxvZyhsZWFmTm9kZUlkcyk7IC8vIFsndHVpLXRyZWUtbm9kZS0zJywgJ3R1aS10cmVlLW5vZGUtNSddXG4gICAgICpcbiAgICAgKiAvLyBzZWFyY2ggZnJvbSBkYXRhXG4gICAgICogdmFyIHNwZWNpYWxOb2RlSWRzID0gdHJlZS5zZWFyY2goe1xuICAgICAqICAgICBpc1NwZWNpYWw6IHRydWUsXG4gICAgICogICAgIGZvbzogJ2JhcidcbiAgICAgKiB9KTtcbiAgICAgKiBjb25zb2xlLmxvZyhzcGVjaWFsTm9kZUlkcyk7IC8vIFsndHVpLXRyZWUtbm9kZS01JywgJ3R1aS10cmVlLW5vZGUtMTAnXVxuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuZ2V0Tm9kZURhdGEoJ3R1aS10cmVlLW5vZGUtNScpLmlzU3BlY2lhbCk7IC8vIHRydWVcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmdldE5vZGVEYXRhKCd0dWktdHJlZS1ub2RlLTUnKS5mb28pOyAvLyAnYmFyJ1xuICAgICAqL1xuICAgIHNlYXJjaDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICAgIGlmICghc25pcHBldC5pc09iamVjdChwcmVkaWNhdGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc25pcHBldC5pc0Z1bmN0aW9uKHByZWRpY2F0ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maWx0ZXIocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl93aGVyZShwcmVkaWNhdGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2ggbm9kZSBpZHMgYnkgbWF0Y2hpbmcgZGF0YVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIERhdGFcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfd2hlcmU6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWx0ZXIoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YSA9IG5vZGUuZ2V0QWxsRGF0YSgpO1xuXG4gICAgICAgICAgICBzbmlwcGV0LmZvckVhY2gocHJvcHMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAoa2V5IGluIGRhdGEpICYmIChkYXRhW2tleV0gPT09IHZhbHVlKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlYXJjaCBub2RlIGlkcyBieSBwYXNzaW5nIHRoZSBwcmVkaWNhdGUgY2hlY2tcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgLSBQcmVkaWNhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBwcmVkaWNhdGVcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZmlsdGVyOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGZpbHRlcmVkID0gW107XG5cbiAgICAgICAgdGhpcy5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShub2RlLCBub2RlSWQpKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWQucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBjb250ZXh0KTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIG5vZGUgaXMgbGVhZlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIGlzIGxlYWYuXG4gICAgICovXG4gICAgaXNMZWFmOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKTtcblxuICAgICAgICByZXR1cm4gbm9kZSAmJiBub2RlLmlzTGVhZigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGEgbm9kZSBpcyBhIGFuY2VzdG9yIG9mIGFub3RoZXIgbm9kZS5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lck5vZGVJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBjb250YWluIHRoZSBvdGhlciBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lZE5vZGVJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBiZSBjb250YWluZWQgYnkgdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciBhIG5vZGUgY29udGFpbnMgYW5vdGhlciBub2RlXG4gICAgICovXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGNvbnRhaW5lck5vZGVJZCwgY29udGFpbmVkTm9kZUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmNvbnRhaW5zKGNvbnRhaW5lZE5vZGVJZCwgY29udGFpbmVkTm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW5hYmxlIGZhY2lsaXR5IG9mIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVOYW1lIC0gJ1NlbGVjdGFibGUnLCAnRHJhZ2dhYmxlJywgJ0VkaXRhYmxlJywgJ0NvbnRleHRNZW51J1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBGZWF0dXJlIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7VHJlZX0gdGhpc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScsIHtcbiAgICAgKiAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lOiAndHVpLXRyZWUtc2VsZWN0ZWQnXG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdFZGl0YWJsZScsIHtcbiAgICAgKiAgICAgIGVuYWJsZUNsYXNzTmFtZTogdHJlZS5jbGFzc05hbWVzLnRleHRDbGFzcyxcbiAgICAgKiAgICAgIGRhdGFLZXk6ICd0ZXh0JyxcbiAgICAgKiAgICAgIGlucHV0Q2xhc3NOYW1lOiAnbXlJbnB1dCdcbiAgICAgKiAgfSlcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0RyYWdnYWJsZScsIHtcbiAgICAgKiAgICAgIHVzZUhlbHBlcjogdHJ1ZSxcbiAgICAgKiAgICAgIGhlbHBlclBvczoge3g6IDUsIHk6IDJ9LFxuICAgICAqICAgICAgcmVqZWN0ZWRUYWdOYW1lczogWydVTCcsICdJTlBVVCcsICdCVVRUT04nXSxcbiAgICAgKiAgICAgIHJlamVjdGVkQ2xhc3NOYW1lczogWydub3REcmFnZ2FibGUnLCAnbm90RHJhZ2dhYmxlLTInXSxcbiAgICAgKiAgICAgIGF1dG9PcGVuRGVsYXk6IDE1MDAsXG4gICAgICogICAgICBpc1NvcnRhYmxlOiB0cnVlLFxuICAgICAqICAgICAgaG92ZXJDbGFzc05hbWU6ICd0dWktdHJlZS1ob3ZlcidcbiAgICAgKiAgICAgIGxpbmVDbGFzc05hbWU6ICd0dWktdHJlZS1saW5lJyxcbiAgICAgKiAgICAgIGxpbmVCb3VuZGFyeToge1xuICAgICAqICAgICAgXHR0b3A6IDEwLFxuICAgICAqICAgICAgIFx0Ym90dG9tOiAxMFxuICAgICAqICAgICAgfVxuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnQ2hlY2tib3gnLCB7XG4gICAgICogICAgICBjaGVja2JveENsYXNzTmFtZTogJ3R1aS10cmVlLWNoZWNrYm94J1xuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnQ29udGV4dE1lbnUsIHtcbiAgICAgKiAgXHRtZW51RGF0YTogW1xuICAgICAqICAgXHRcdHt0aXRsZTogJ21lbnUxJywgY29tbWFuZDogJ2NvcHknfSxcbiAgICAgKiAgICAgXHRcdHt0aXRsZTogJ21lbnUyJywgY29tbWFuZDogJ3Bhc3RlJ30sXG4gICAgICogICAgICAgXHR7c2VwYXJhdG9yOiB0cnVlfSxcbiAgICAgKiAgICAgICAgXHR7XG4gICAgICogICAgICAgICBcdFx0dGl0bGU6ICdtZW51MycsXG4gICAgICogICAgICAgICAgIFx0bWVudTogW1xuICAgICAqICAgICAgICAgICAgXHRcdHt0aXRsZTogJ3N1Ym1lbnUxJ30sXG4gICAgICogICAgICAgICAgICAgIFx0e3RpdGxlOiAnc3VibWVudTInfVxuICAgICAqICAgICAgICAgICAgICBdXG4gICAgICogICAgICAgICAgfVxuICAgICAqICAgICAgfVxuICAgICAqICB9KVxuICAgICAqL1xuICAgIGVuYWJsZUZlYXR1cmU6IGZ1bmN0aW9uKGZlYXR1cmVOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBGZWF0dXJlID0gZmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xuXG4gICAgICAgIHRoaXMuZGlzYWJsZUZlYXR1cmUoZmVhdHVyZU5hbWUpO1xuICAgICAgICBpZiAoRmVhdHVyZSkge1xuICAgICAgICAgICAgdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdID0gbmV3IEZlYXR1cmUodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBmYWNpbGl0eSBvZiB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtICdTZWxlY3RhYmxlJywgJ0RyYWdnYWJsZScsICdFZGl0YWJsZSdcbiAgICAgKiBAcmV0dXJucyB7VHJlZX0gdGhpc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0RyYWdnYWJsZScpXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnRWRpdGFibGUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0NoZWNrYm94JylcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdDb250ZXh0TWVudScpO1xuICAgICAqL1xuICAgIGRpc2FibGVGZWF0dXJlOiBmdW5jdGlvbihmZWF0dXJlTmFtZSkge1xuICAgICAgICB2YXIgZmVhdHVyZSA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXTtcblxuICAgICAgICBpZiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgZmVhdHVyZS5kZXN0cm95KCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpbmRleCBudW1iZXIgb2Ygc2VsZWN0ZWQgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gSWQgb2Ygc2VsZWN0ZWQgbm9kZVxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IEluZGV4IG51bWJlciBvZiBhdHRhY2hlZCBub2RlXG4gICAgICovXG4gICAgZ2V0Tm9kZUluZGV4OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHBhcmVudElkID0gdGhpcy5tb2RlbC5nZXRQYXJlbnRJZChub2RlSWQpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGUocGFyZW50SWQpLmdldENoaWxkSW5kZXgobm9kZUlkKTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBTZXQgYWJzdHJhY3QgYXBpcyB0byB0cmVlIHByb3RvdHlwZVxuICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVOYW1lIC0gRmVhdHVyZSBuYW1lXG4gKiBAcGFyYW0ge29iamVjdH0gZmVhdHVyZSAtIEZlYXR1cmVcbiAqL1xuZnVuY3Rpb24gc2V0QWJzdHJhY3RBUElzKGZlYXR1cmVOYW1lLCBmZWF0dXJlKSB7XG4gICAgdmFyIG1lc3NhZ2VOYW1lID0gJ0lOVkFMSURfQVBJXycgKyBmZWF0dXJlTmFtZS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICBhcGlMaXN0ID0gZmVhdHVyZS5nZXRBUElMaXN0ID8gZmVhdHVyZS5nZXRBUElMaXN0KCkgOiBbXTtcblxuICAgIHNuaXBwZXQuZm9yRWFjaChhcGlMaXN0LCBmdW5jdGlvbihhcGkpIHtcbiAgICAgICAgVHJlZS5wcm90b3R5cGVbYXBpXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2VzW21lc3NhZ2VOYW1lXSB8fCBtZXNzYWdlcy5JTlZBTElEX0FQSSk7XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5zbmlwcGV0LmZvckVhY2goZmVhdHVyZXMsIGZ1bmN0aW9uKEZlYXR1cmUsIG5hbWUpIHtcbiAgICBzZXRBYnN0cmFjdEFQSXMobmFtZSwgRmVhdHVyZSk7XG59KTtcbnNuaXBwZXQuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWUpO1xubW9kdWxlLmV4cG9ydHMgPSBUcmVlO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFVwZGF0ZSB2aWV3IGFuZCBjb250cm9sIHRyZWUgZGF0YVxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBUcmVlTm9kZSA9IHJlcXVpcmUoJy4vdHJlZU5vZGUnKTtcblxudmFyIGV4dGVuZCA9IHR1aS51dGlsLmV4dGVuZCxcbiAgICBrZXlzID0gdHVpLnV0aWwua2V5cyxcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaCxcbiAgICBtYXAgPSB0dWkudXRpbC5tYXA7XG5cbi8qKlxuICogVHJlZSBtb2RlbFxuICogQGNvbnN0cnVjdG9yIFRyZWVNb2RlbFxuICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIERhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9ucyBmb3IgZGVmYXVsdFN0YXRlIGFuZCBub2RlSWRQcmVmaXhcbiAqKi9cbnZhciBUcmVlTW9kZWwgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVNb2RlbC5wcm90b3R5cGUgKi97IC8qIGVzbGludC1kaXNhYmxlICovXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIFRyZWVOb2RlLnNldElkUHJlZml4KG9wdGlvbnMubm9kZUlkUHJlZml4KTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCBzdGF0ZSBvZiBub2RlXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm5vZGVEZWZhdWx0U3RhdGUgPSBvcHRpb25zLm5vZGVEZWZhdWx0U3RhdGU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJvb3Qgbm9kZVxuICAgICAgICAgKiBAdHlwZSB7VHJlZU5vZGV9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvb3ROb2RlID0gbmV3IFRyZWVOb2RlKHtcbiAgICAgICAgICAgIHN0YXRlOiAnb3BlbmVkJ1xuICAgICAgICB9LCBudWxsKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJlZSBoYXNoIGhhdmluZyBhbGwgbm9kZXNcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBUcmVlTm9kZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWVIYXNoID0ge307XG5cbiAgICAgICAgdGhpcy5fc2V0RGF0YShkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHByZWZpeCBvZiBub2RlIGlkXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUHJlZml4XG4gICAgICovXG4gICAgZ2V0Tm9kZUlkUHJlZml4OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFRyZWVOb2RlLmlkUHJlZml4O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbW9kZWwgd2l0aCB0cmVlIGRhdGFcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXG4gICAgICovXG4gICAgX3NldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLnJvb3ROb2RlLFxuICAgICAgICAgICAgcm9vdElkID0gcm9vdC5nZXRJZCgpO1xuXG4gICAgICAgIHRoaXMudHJlZUhhc2hbcm9vdElkXSA9IHJvb3Q7XG4gICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCByb290KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSB0cmVlIGhhc2ggZnJvbSBkYXRhIGFuZCBwYXJlbnROb2RlXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIFRyZWUgZGF0YVxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IHBhcmVudCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VUcmVlSGFzaDogZnVuY3Rpb24oZGF0YSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHBhcmVudC5nZXRJZCgpLFxuICAgICAgICAgICAgaWRzID0gW107XG5cbiAgICAgICAgZm9yRWFjaChkYXRhLCBmdW5jdGlvbihkYXR1bSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuRGF0YSA9IGRhdHVtLmNoaWxkcmVuLFxuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9jcmVhdGVOb2RlKGRhdHVtLCBwYXJlbnRJZCksXG4gICAgICAgICAgICAgICAgbm9kZUlkID0gbm9kZS5nZXRJZCgpO1xuXG4gICAgICAgICAgICBpZHMucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgdGhpcy50cmVlSGFzaFtub2RlSWRdID0gbm9kZTtcbiAgICAgICAgICAgIHBhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goY2hpbGRyZW5EYXRhLCBub2RlKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGlkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5vZGVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZURhdGEgLSBEYXR1bSBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IGlkXG4gICAgICogQHJldHVybnMge1RyZWVOb2RlfSBUcmVlTm9kZVxuICAgICAqL1xuICAgIF9jcmVhdGVOb2RlOiBmdW5jdGlvbihub2RlRGF0YSwgcGFyZW50SWQpIHtcbiAgICAgICAgbm9kZURhdGEgPSBleHRlbmQoe1xuICAgICAgICAgICAgc3RhdGU6IHRoaXMubm9kZURlZmF1bHRTdGF0ZVxuICAgICAgICB9LCBub2RlRGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBUcmVlTm9kZShub2RlRGF0YSwgcGFyZW50SWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hpbGRyZW5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/QXJyYXkuPFRyZWVOb2RlPn0gY2hpbGRyZW5cbiAgICAgKi9cbiAgICBnZXRDaGlsZHJlbjogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcblxuICAgICAgICBpZiAoIWNoaWxkSWRzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXAoY2hpbGRJZHMsIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE5vZGUoY2hpbGRJZCk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hpbGQgaWRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P0FycmF5LjxzdHJpbmc+fSBDaGlsZCBpZHNcbiAgICAgKi9cbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlLmdldENoaWxkSWRzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbnVtYmVyIG9mIG5vZGVzXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIG51bWJlciBvZiBub2Rlc1xuICAgICAqL1xuICAgIGdldENvdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGtleXModGhpcy50cmVlSGFzaCkubGVuZ3RoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbGFzdCBkZXB0aFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBsYXN0IGRlcHRoXG4gICAgICovXG4gICAgZ2V0TGFzdERlcHRoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRlcHRocyA9IG1hcCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXREZXB0aChub2RlLmdldElkKCkpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgZGVwdGhzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJucyB7P1RyZWVOb2RlfSBOb2RlXG4gICAgICovXG4gICAgZ2V0Tm9kZTogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJlZUhhc2hbaWRdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGVwdGggZnJvbSBub2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJucyB7P251bWJlcn0gRGVwdGhcbiAgICAgKi9cbiAgICBnZXREZXB0aDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxuICAgICAgICAgICAgZGVwdGggPSAwLFxuICAgICAgICAgICAgcGFyZW50O1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgZGVwdGggKz0gMTtcbiAgICAgICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShwYXJlbnQuZ2V0UGFyZW50SWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVwdGg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBwYXJlbnQgaWQgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P3N0cmluZ30gUGFyZW50IGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0UGFyZW50SWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZCB0byByZW1vdmVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihpZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxuICAgICAgICAgICAgcGFyZW50O1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XG5cbiAgICAgICAgZm9yRWFjaChub2RlLmdldENoaWxkSWRzKCksIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNoaWxkSWQsIHRydWUpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGRJZChpZCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnRyZWVIYXNoW2lkXTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIHBhcmVudC5nZXRJZCgpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgbm9kZShzKS5cbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3LWRhdGFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBOZXcgYWRkZWQgbm9kZSBpZHNcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5nZXROb2RlKHBhcmVudElkKSB8fCB0aGlzLnJvb3ROb2RlLFxuICAgICAgICAgICAgaWRzO1xuXG4gICAgICAgIGRhdGEgPSBbXS5jb25jYXQoZGF0YSk7XG4gICAgICAgIGlkcyA9IHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCBwYXJlbnQpO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgcGFyZW50LmdldElkKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHByb3BzIC0gUHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICBzZXROb2RlRGF0YTogZnVuY3Rpb24oaWQsIHByb3BzLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8ICFwcm9wcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5zZXREYXRhKHByb3BzKTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fSBuYW1lcyAtIE5hbWVzIG9mIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgcmVtb3ZlTm9kZURhdGE6IGZ1bmN0aW9uKGlkLCBuYW1lcywgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xuXG4gICAgICAgIGlmICghbm9kZSB8fCAhbmFtZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0dWkudXRpbC5pc0FycmF5KG5hbWVzKSkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhLmFwcGx5KG5vZGUsIG5hbWVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRGF0YShuYW1lcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGEgbm9kZSB0byBuZXcgcGFyZW50J3MgY2hpbGRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4XSAtIFN0YXJ0IGluZGV4IG51bWJlciBmb3IgaW5zZXJ0aW5nXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqL1xuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIGluZGV4LCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xuICAgICAgICB2YXIgb3JpZ2luYWxQYXJlbnQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudDtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ld1BhcmVudCA9IHRoaXMuZ2V0Tm9kZShuZXdQYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZTtcbiAgICAgICAgbmV3UGFyZW50SWQgPSBuZXdQYXJlbnQuZ2V0SWQoKTtcbiAgICAgICAgb3JpZ2luYWxQYXJlbnRJZCA9IG5vZGUuZ2V0UGFyZW50SWQoKTtcbiAgICAgICAgb3JpZ2luYWxQYXJlbnQgPSB0aGlzLmdldE5vZGUob3JpZ2luYWxQYXJlbnRJZCk7XG4gICAgICAgIGluZGV4ID0gdHVpLnV0aWwuaXNVbmRlZmluZWQoaW5kZXgpID8gLTEgOiBpbmRleDtcblxuICAgICAgICBpZiAobm9kZUlkID09PSBuZXdQYXJlbnRJZCB8fCB0aGlzLmNvbnRhaW5zKG5vZGVJZCwgbmV3UGFyZW50SWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAobmV3UGFyZW50SWQgPT09IG9yaWdpbmFsUGFyZW50SWQpIHtcbiAgICAgICAgICAgICAgICBuZXdQYXJlbnQubW92ZUNoaWxkSWQobm9kZUlkLCBpbmRleCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5ld1BhcmVudC5pbnNlcnRDaGlsZElkKG5vZGVJZCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsUGFyZW50LnJlbW92ZUNoaWxkSWQobm9kZUlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld1BhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgICAgICBvcmlnaW5hbFBhcmVudC5yZW1vdmVDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLnNldFBhcmVudElkKG5ld1BhcmVudElkKTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ21vdmUnLCBub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkLCBpbmRleCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBhIG5vZGUgaXMgYSBhbmNlc3RvciBvZiBhbm90aGVyIG5vZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGNvbnRhaW4gdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVkSWQgLSBJZCBvZiBhIG5vZGUgdGhhdCBtYXkgYmUgY29udGFpbmVkIGJ5IHRoZSBvdGhlciBub2RlXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgYSBub2RlIGNvbnRhaW5zIGFub3RoZXIgbm9kZVxuICAgICAqL1xuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihjb250YWluZXJJZCwgY29udGFpbmVkSWQpIHtcbiAgICAgICAgdmFyIHBhcmVudElkID0gdGhpcy5nZXRQYXJlbnRJZChjb250YWluZWRJZCksXG4gICAgICAgICAgICBpc0NvbnRhaW5lZCA9IGZhbHNlO1xuXG4gICAgICAgIHdoaWxlICghaXNDb250YWluZWQgJiYgcGFyZW50SWQpIHtcbiAgICAgICAgICAgIGlzQ29udGFpbmVkID0gKGNvbnRhaW5lcklkID09PSBwYXJlbnRJZCk7XG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRoaXMuZ2V0UGFyZW50SWQocGFyZW50SWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlzQ29udGFpbmVkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTb3J0IG5vZGVzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICAgIHRoaXMuZWFjaEFsbChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZ2V0Q2hpbGRyZW4obm9kZUlkKSxcbiAgICAgICAgICAgICAgICBjaGlsZElkcztcblxuICAgICAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbi5zb3J0KGNvbXBhcmF0b3IpO1xuXG4gICAgICAgICAgICAgICAgY2hpbGRJZHMgPSBtYXAoY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZC5nZXRJZCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG5vZGUucmVwbGFjZUNoaWxkSWRzKGNoaWxkSWRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIGRhdGEgKGFsbClcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/b2JqZWN0fSBOb2RlIGRhdGFcbiAgICAgKi9cbiAgICBnZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlLmdldEFsbERhdGEoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKi9cbiAgICBlYWNoQWxsOiBmdW5jdGlvbihpdGVyYXRlZSwgY29udGV4dCkge1xuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xuXG4gICAgICAgIGZvckVhY2godGhpcy50cmVlSGFzaCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpdGVyYXRlZS5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBkZXNjZW5kYW50cyBvZiBhIG5vZGUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKi9cbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpIHsgLy9kZXB0aC1maXJzdFxuICAgICAgICB2YXIgc3RhY2ssIG5vZGVJZCwgbm9kZTtcblxuICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKHBhcmVudElkKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2sgPSBub2RlLmdldENoaWxkSWRzKCk7XG5cbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgbm9kZUlkID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG4gICAgICAgICAgICBpdGVyYXRlZS5jYWxsKGNvbnRleHQsIG5vZGUsIG5vZGVJZCk7XG5cbiAgICAgICAgICAgIHN0YWNrID0gc3RhY2suY29uY2F0KG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWVNb2RlbCk7XG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVNb2RlbDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN0YXRlcyA9IHJlcXVpcmUoJy4vY29uc3RzL3N0YXRlcycpLm5vZGUsXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgbGFzdEluZGV4ID0gMCxcbiAgICBnZXROZXh0SW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGFzdEluZGV4O1xuICAgICAgICBsYXN0SW5kZXggKz0gMTtcblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfSxcbiAgICBSRVNFUlZFRF9QUk9QRVJUSUVTID0ge1xuICAgICAgICBpZDogJycsXG4gICAgICAgIHN0YXRlOiAnc2V0U3RhdGUnLFxuICAgICAgICBjaGlsZHJlbjogJydcbiAgICB9LFxuICAgIGluQXJyYXkgPSB0dWkudXRpbC5pbkFycmF5O1xuXG4vKipcbiAqIFRyZWVOb2RlXG4gKiBAQ29uc3RydWN0b3IgVHJlZU5vZGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBub2RlRGF0YSAtIE5vZGUgZGF0YVxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBQYXJlbnQgbm9kZSBpZFxuICovXG52YXIgVHJlZU5vZGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVOb2RlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgcHJlZml4IG9mIGlkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgaWRcbiAgICAgICAgICovXG4gICAgICAgIHNldElkUHJlZml4OiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgICAgIHRoaXMuaWRQcmVmaXggPSBwcmVmaXggfHwgdGhpcy5pZFByZWZpeDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJlZml4IG9mIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZFByZWZpeDogJydcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faWQgPSB0aGlzLmNvbnN0cnVjdG9yLmlkUHJlZml4ICsgZ2V0TmV4dEluZGV4KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhcmVudCBub2RlIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2NoaWxkSWRzID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIHN0YXRlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG5cbiAgICAgICAgdGhpcy5zZXREYXRhKG5vZGVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJlc2VydmVkIHByb3BlcnRpZXMgZnJvbSBkYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBOb2RlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBOb2RlIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSZXNlcnZlZFByb3BlcnRpZXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaE93blByb3BlcnRpZXMoUkVTRVJWRURfUFJPUEVSVElFUywgZnVuY3Rpb24oc2V0dGVyLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW25hbWVdO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tzZXR0ZXJdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqL1xuICAgIHRvZ2dsZVN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlID09PSBzdGF0ZXMuQ0xPU0VEKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5PUEVORUQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIFN0YXRlIG9mIG5vZGUgKCdjbG9zZWQnLCAnb3BlbmVkJylcbiAgICAgKi9cbiAgICBzZXRTdGF0ZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgc3RhdGUgPSBTdHJpbmcoc3RhdGUpO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlc1tzdGF0ZS50b1VwcGVyQ2FzZSgpXSB8fCB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHN0YXRlICgnb3BlbmVkJyBvciAnY2xvc2VkJylcbiAgICAgKi9cbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHBhcmVudCBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKi9cbiAgICBzZXRQYXJlbnRJZDogZnVuY3Rpb24ocGFyZW50SWQpIHtcbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVwbGFjZSBjaGlsZElkc1xuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGNoaWxkSWRzIC0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIHJlcGxhY2VDaGlsZElkczogZnVuY3Rpb24oY2hpbGRJZHMpIHtcbiAgICAgICAgdGhpcy5fY2hpbGRJZHMgPSBjaGlsZElkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGlkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge0FycmF5LjxudW1iZXI+fSBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICovXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRJZHMuc2xpY2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIGFkZENoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuX2NoaWxkSWRzO1xuXG4gICAgICAgIGlmICh0dWkudXRpbC5pbkFycmF5KGNoaWxkSWRzLCBpZCkgPT09IC0xKSB7XG4gICAgICAgICAgICBjaGlsZElkcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICovXG4gICAgcmVtb3ZlQ2hpbGRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVJdGVtRnJvbUFycmF5KGlkLCB0aGlzLl9jaGlsZElkcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gUHJvcGVydHkgbmFtZSBvZiBkYXRhXG4gICAgICogQHJldHVybnMgeyp9IERhdGFcbiAgICAgKi9cbiAgICBnZXREYXRhOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge09iamVjdH0gRGF0YVxuICAgICAqL1xuICAgIGdldEFsbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuZXh0ZW5kKHt9LCB0aGlzLl9kYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBEYXRhIGZvciBhZGRpbmdcbiAgICAgKi9cbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGRhdGEgPSB0aGlzLl9zZXRSZXNlcnZlZFByb3BlcnRpZXMoZGF0YSk7XG4gICAgICAgIHR1aS51dGlsLmV4dGVuZCh0aGlzLl9kYXRhLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHsuLi5zdHJpbmd9IG5hbWVzIC0gTmFtZXMgb2YgZGF0YVxuICAgICAqL1xuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoQXJyYXkoYXJndW1lbnRzLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZGF0YVtuYW1lXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoaXMgbm9kZSBoYXMgYSBwcm92aWRlZCBjaGlsZCBpZC5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqL1xuICAgIGhhc0NoaWxkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gaW5BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpICE9PSAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBub2RlIGlzIGxlYWYuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIGxlYWYgb3Igbm90LlxuICAgICAqL1xuICAgIGlzTGVhZjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5sZW5ndGggPT09IDA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyByb290LlxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gTm9kZSBpcyByb290IG9yIG5vdC5cbiAgICAgKi9cbiAgICBpc1Jvb3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuaXNGYWxzeSh0aGlzLl9wYXJlbnRJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpbmRleCBvZiBjaGlsZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge251bWJlcn0gSW5kZXggb2YgY2hpbGQgaW4gY2hpbGRyZW4gbGlzdFxuICAgICAqL1xuICAgIGdldENoaWxkSW5kZXg6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiBpbkFycmF5KGlkLCB0aGlzLl9jaGlsZElkcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluc2VydCBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBJbmRleCBudW1iZXIgb2YgaW5zZXJ0IHBvc2l0aW9uXG4gICAgICovXG4gICAgaW5zZXJ0Q2hpbGRJZDogZnVuY3Rpb24oaWQsIGluZGV4KSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuX2NoaWxkSWRzO1xuXG4gICAgICAgIGlmIChpbkFycmF5KGlkLCBjaGlsZElkcykgPT09IC0xKSB7XG4gICAgICAgICAgICBjaGlsZElkcy5zcGxpY2UoaW5kZXgsIDAsIGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIEluZGV4IG51bWJlciBvZiBpbnNlcnQgcG9zaXRpb25cbiAgICAgKi9cbiAgICBtb3ZlQ2hpbGRJZDogZnVuY3Rpb24oaWQsIGluZGV4KSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuX2NoaWxkSWRzO1xuICAgICAgICB2YXIgb3JpZ2luSWR4ID0gdGhpcy5nZXRDaGlsZEluZGV4KGlkKTtcblxuICAgICAgICBpZiAoaW5BcnJheShpZCwgY2hpbGRJZHMpICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKG9yaWdpbklkeCA8IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaW5kZXggLT0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2hpbGRJZHMuc3BsaWNlKGluZGV4LCAwLCBjaGlsZElkcy5zcGxpY2Uob3JpZ2luSWR4LCAxKVswXSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU5vZGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgaXNVbmRlZmluZWQgPSB0dWkudXRpbC5pc1VuZGVmaW5lZCxcbiAgICBwaWNrID0gdHVpLnV0aWwucGljayxcbiAgICB0ZW1wbGF0ZU1hc2tSZSA9IC9cXHtcXHsoLis/KX19L2dpLFxuICAgIGlzVmFsaWREb3ROb3RhdGlvblJlID0gL15cXHcrKD86XFwuXFx3KykqJC8sXG4gICAgaXNWYWxpZERvdE5vdGF0aW9uID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHJldHVybiBpc1ZhbGlkRG90Tm90YXRpb25SZS50ZXN0KHN0cik7XG4gICAgfSxcbiAgICBpc0FycmF5ID0gdHVpLnV0aWwuaXNBcnJheVNhZmUsXG4gICAgaXNTdXBwb3J0UGFnZU9mZnNldCA9IHR5cGVvZiB3aW5kb3cucGFnZVhPZmZzZXQgIT09ICd1bmRlZmluZWQnLFxuICAgIGlzQ1NTMUNvbXBhdCA9IGRvY3VtZW50LmNvbXBhdE1vZGUgPT09ICdDU1MxQ29tcGF0JztcblxudmFyIHV0aWwgPSB7XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpcnN0IHNwZWNpZmllZCBpdGVtIGZyb20gYXJyYXksIGlmIGl0IGV4aXN0c1xuICAgICAqIEBwYXJhbSB7Kn0gaXRlbSBJdGVtIHRvIGxvb2sgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyIEFycmF5IHRvIHF1ZXJ5XG4gICAgICovXG4gICAgcmVtb3ZlSXRlbUZyb21BcnJheTogZnVuY3Rpb24oaXRlbSwgYXJyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGFyci5sZW5ndGggLSAxO1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBpZiAoaXRlbSA9PT0gYXJyW2luZGV4XSkge1xuICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXggLT0gMTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2xhc3NuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSAtIENsYXNzbmFtZVxuICAgICAqL1xuICAgIGFkZENsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC5jbGFzc05hbWUgPT09ICcnKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICghdXRpbC5oYXNDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSArPSAnICcgKyBjbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNsYXNzbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBDbGFzc25hbWVcbiAgICAgKi9cbiAgICByZW1vdmVDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBvcmlnaW5hbENsYXNzTmFtZSA9IHV0aWwuZ2V0Q2xhc3MoZWxlbWVudCksXG4gICAgICAgICAgICBhcnIsIGluZGV4O1xuXG4gICAgICAgIGlmICghb3JpZ2luYWxDbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyciA9IG9yaWdpbmFsQ2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgICAgIGluZGV4ID0gdHVpLnV0aWwuaW5BcnJheShjbGFzc05hbWUsIGFycik7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBhcnIuam9pbignICcpO1xuICAgICAgICB9XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHRvIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYWRkXG4gICAgICovXG4gICAgYWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGZyb20gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIEEgbmFtZSBvZiBldmVudFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZW1vdmVcbiAgICAgKi9cbiAgICByZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5kZXRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gRXZlbnQgdGFyZ2V0XG4gICAgICovXG4gICAgZ2V0VGFyZ2V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQ7XG4gICAgICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBIVE1MRWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IENsYXNzIG5hbWVcbiAgICAgKi9cbiAgICBnZXRDbGFzczogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZWxlbWVudCAmJiBlbGVtZW50LmdldEF0dHJpYnV0ZSAmJlxuICAgICAgICAgICAgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzc05hbWUnKSB8fCAnJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBlbGVtZW50IGhhcyBzcGVjaWZpYyBjbGFzcyBvciBub3RcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzcyB0byBmaW5kXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHRoZSBjbGFzc1xuICAgICAqL1xuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGVsQ2xhc3NOYW1lID0gdXRpbC5nZXRDbGFzcyhlbGVtZW50KTtcblxuICAgICAgICByZXR1cm4gZWxDbGFzc05hbWUuaW5kZXhPZihjbGFzc05hbWUpID4gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgZWxlbWVudCBieSBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzc1xuICAgICAqIEByZXR1cm5zIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBFbGVtZW50c1xuICAgICAqL1xuICAgIGdldEVsZW1lbnRzQnlDbGFzc05hbWU6IGZ1bmN0aW9uKHRhcmdldCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBhbGwsIGZpbHRlcmVkO1xuXG4gICAgICAgIGlmICh0YXJnZXQucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0YXJnZXQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWxsID0gdHVpLnV0aWwudG9BcnJheSh0YXJnZXQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJyonKSk7XG4gICAgICAgICAgICBmaWx0ZXJlZCA9IHR1aS51dGlsLmZpbHRlcihhbGwsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUgfHwgJyc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKGNsYXNzTmFtZXMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgd2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICovXG4gICAgaXNSaWdodEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuX2dldEJ1dHRvbihldmVudCkgPT09IDI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0IG9yIG5vdFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIEEgcHJvcGVydHlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfGJvb2xlYW59IFByb3BlcnR5IG5hbWUgb3IgZmFsc2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciB1c2VyU2VsZWN0UHJvcGVydHkgPSB1dGlsLnRlc3RQcm9wKFtcbiAgICAgKiAgICAgJ3VzZXJTZWxlY3QnLFxuICAgICAqICAgICAnV2Via2l0VXNlclNlbGVjdCcsXG4gICAgICogICAgICdPVXNlclNlbGVjdCcsXG4gICAgICogICAgICdNb3pVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ21zVXNlclNlbGVjdCdcbiAgICAgKiBdKTtcbiAgICAgKi9cbiAgICB0ZXN0UHJvcDogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gZmFsc2U7XG5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgY29uc2lzdGVudC1yZXR1cm4gKi9cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChwcm9wcywgZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICAgICAgaWYgKHByb3AgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBjb25zaXN0ZW50LXJldHVybiAqL1xuXG4gICAgICAgIHJldHVybiBwcm9wZXJ0eU5hbWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgZGVmYXVsdCBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqL1xuICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbCBmcm9tIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZSAtIFRlbXBsYXRlIGh0bWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUZW1wbGF0ZSBkYXRhXG4gICAgICogQHJldHVybnMge3N0cmluZ30gaHRtbFxuICAgICAqL1xuICAgIHJlbmRlclRlbXBsYXRlOiBmdW5jdGlvbihzb3VyY2UsIHByb3BzKSB7XG4gICAgICAgIGZ1bmN0aW9uIHBpY2tWYWx1ZShuYW1lcykge1xuICAgICAgICAgICAgcmV0dXJuIHBpY2suYXBwbHkobnVsbCwgW3Byb3BzXS5jb25jYXQobmFtZXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VyY2UucmVwbGFjZSh0ZW1wbGF0ZU1hc2tSZSwgZnVuY3Rpb24obWF0Y2gsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZTtcblxuICAgICAgICAgICAgaWYgKGlzVmFsaWREb3ROb3RhdGlvbihuYW1lKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcGlja1ZhbHVlKG5hbWUuc3BsaXQoJy4nKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuam9pbignICcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemF0aW9uIGZvciBldmVudCBidXR0b24gcHJvcGVydHlcbiAgICAgKiAwOiBGaXJzdCBtb3VzZSBidXR0b24sIDI6IFNlY29uZCBtb3VzZSBidXR0b24sIDE6IENlbnRlciBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHs/bnVtYmVyfSBidXR0b24gdHlwZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGJ1dHRvbixcbiAgICAgICAgICAgIHByaW1hcnkgPSAnMCwxLDMsNSw3JyxcbiAgICAgICAgICAgIHNlY29uZGFyeSA9ICcyLDYnLFxuICAgICAgICAgICAgd2hlZWwgPSAnNCc7XG5cbiAgICAgICAgaWYgKGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoJ01vdXNlRXZlbnRzJywgJzIuMCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXZlbnQuYnV0dG9uO1xuICAgICAgICB9XG5cbiAgICAgICAgYnV0dG9uID0gU3RyaW5nKGV2ZW50LmJ1dHRvbik7XG4gICAgICAgIGlmIChwcmltYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIGlmIChzZWNvbmRhcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAyO1xuICAgICAgICB9IGVsc2UgaWYgKHdoZWVsLmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbW91c2UgcG9zaXRpb25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZldH0gZXZlbnQgLSBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBYLCBZIHBvc2l0aW9uIG9mIG1vdXNlXG4gICAgICovXG4gICAgZ2V0TW91c2VQb3M6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgeTogZXZlbnQuY2xpZW50WVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdmFsdWUgb2Ygc2Nyb2xsIHRvcCBvbiBkb2N1bWVudC5ib2R5IChjcm9zcyBicm93c2luZylcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSBvZiBzY3JvbGwgdG9wXG4gICAgICovXG4gICAgZ2V0V2luZG93U2Nyb2xsVG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNjcm9sbFRvcDtcblxuICAgICAgICBpZiAoaXNTdXBwb3J0UGFnZU9mZnNldCkge1xuICAgICAgICAgICAgc2Nyb2xsVG9wID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsVG9wID0gaXNDU1MxQ29tcGF0ID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCA6IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNjcm9sbFRvcDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=
