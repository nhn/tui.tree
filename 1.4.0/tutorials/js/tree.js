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

var API_LIST = [
    'changeContextMenu'
];
var TuiContextMenu = tui && tui.component && tui.component.ContextMenu;
var styleKeys = ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect'];
var enableProp = util.testProp(styleKeys);
var bind = tui.util.bind;

/**
 * Set ContextMenu feature on tree
 * @class ContextMenu
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *     @param {Array.<Object>} options.menuData - Context menu data
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
        options = options || {};

        /**
         * Tree data
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Tree selector for context menu
         */
        this.treeSelector = '#' + this.tree.rootElement.id;

        /**
         * Id of floating layer in tree
         * @type {string}
         */
        this.flId = this.tree.rootElement.id + '-fl';

        /**
         * Info of context menu in tree
         * @type {Object}
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

        this.menu.register(this.treeSelector, bind(this._onSelect, this),
                            options.menuData || {});

        this.tree.on('contextmenu', this._onContextMenu, this);

        this._preventTextSelection();

        this._setAPIs();
    },

    /**
     * Change ContextMenu
     * @param {Array.<Object>} newMenuData - New context menu data
     * @api
     */
    changeContextMenu: function(newMenuData) {
        this.menu.unregister(this.treeSelector);
        this.menu.register(this.treeSelector, bind(this._onSelect, this), newMenuData);
    },

    /**
     * Disable ContextMenu feature
     */
    destroy: function() {
        var tree = this.tree;

        this.menu.destroy();

        this._restoreTextSelection();
        this._removeFloatingLayer();

        tree.off(this);

        tui.util.forEach(API_LIST, function(apiName) {
            delete tree[apiName];
        });
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
     * Event handler on tree item
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    _onContextMenu: function(e) {
        var target = util.getTarget(e);

        this.selectedNodeId = this.tree.getNodeIdFromElement(target);

        /**
         * @api
         * @event Tree#beforeOpenContextMenu
         * @param {string} nodeId
         * @example
         * tree.on('beforeOpenContextMenu', function(nodeId) {
         * 		console.log('nodeId: ' + nodeId);
         * });
         */
        this.tree.fire('beforeOpenContextMenu', this.selectedNodeId);
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
     * Set API of ContextMenu feature
     * @private
     */
    _setAPIs: function() {
        var tree = this.tree;

        tui.util.forEach(API_LIST, function(apiName) {
            tree[apiName] = bind(this[apiName], this);
        }, this);
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

        tree.move(this.currentNodeId, nodeId, index);

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
            util.removeEventListener(document, 'mouseout', onMouseOut);
        }
        function onMouseOut(event) {
            if (event.toElement === null) {
                self.fire('mouseup', event);
            }
        }

        this._mouseMovingFlag = false;
        this.fire('mousedown', downEvent);
        util.addEventListener(document, 'mousemove', onMouseMove);
        util.addEventListener(document, 'mouseup', onMouseUp);
        util.addEventListener(document, 'mouseout', onMouseOut);
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
     * @api
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
        if (!this.invoke('beforeMove', nodeId, newParentId)) {
            return;
        }

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
    /*eslint-disable complexity*/
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMvZGVmYXVsdE9wdGlvbi5qcyIsInNyYy9qcy9jb25zdHMvbWVzc2FnZXMuanMiLCJzcmMvanMvY29uc3RzL291dGVyVGVtcGxhdGUuanMiLCJzcmMvanMvY29uc3RzL3N0YXRlcy5qcyIsInNyYy9qcy9mZWF0dXJlcy9jaGVja2JveC5qcyIsInNyYy9qcy9mZWF0dXJlcy9jb250ZXh0TWVudS5qcyIsInNyYy9qcy9mZWF0dXJlcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvZWRpdGFibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy90cmVlLmpzIiwic3JjL2pzL3RyZWVNb2RlbC5qcyIsInNyYy9qcy90cmVlTm9kZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1ckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnZhciBUcmVlID0gcmVxdWlyZSgnLi9zcmMvanMvdHJlZScpO1xudmFyIGNvbXBvbmVudCA9IHR1aS51dGlsLmRlZmluZU5hbWVzcGFjZSgndHVpLmNvbXBvbmVudCcpO1xuY29tcG9uZW50LlRyZWUgPSBUcmVlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1ha2UgY2xhc3MgbmFtZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgY2xhc3MgbmFtZVxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0ga2V5cyAtIEtleXMgb2YgY2xhc3MgbmFtZXNcbiAqIEByZXR1cm5zIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn0gQ2xhc3MgbmFtZXMgbWFwXG4gKi9cbmZ1bmN0aW9uIG1ha2VDbGFzc05hbWVzKHByZWZpeCwga2V5cykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICB0dWkudXRpbC5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBvYmpba2V5ICsgJ0NsYXNzJ10gPSBwcmVmaXggKyBrZXk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEEgZGVmYXVsdCB2YWx1ZXMgZm9yIHRyZWVcbiAqIEBjb25zdFxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBub2RlRGVmYXVsdFN0YXRlIC0gTm9kZSBzdGF0ZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVJZFByZWZpeCAtIE5vZGUgaWQgcHJlZml4XG4gKiBAcHJvcGVydHkge29iamVjdH0gc3RhdGVMYWJlbCAtIFN0YXRlIGxhYmVsIGluIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5vcGVuZWQgLSAnLSdcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5jbG9zZWQgLSAnKydcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSB0ZW1wbGF0ZSAtIFRlbXBsYXRlIGh0bWwgZm9yIHRoZSBub2Rlcy5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUuaW50ZXJuYWxOb2RlIC0gVGVtcGxhdGUgaHRtbCBmb3IgaW50ZXJuYWwgbm9kZS5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUubGVhZk5vZGUgLSBUZW1wbGF0ZSBodG1sIGZvciBsZWFmIG5vZGUuXG4gKiBAcHJvcGVydHkge29iamVjdH0gY2xhc3NOYW1lcyAtIENsYXNzIG5hbWVzIG9mIGVsZW1lbnRzIGluIHRyZWVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gb3BlbmVkQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBjbG9zZWRDbGFzcyAtIENsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVDbGFzcyAtIENsYXNzIG5hbWUgZm9yIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gbGVhZkNsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgbGVhZiBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN1YnRyZWVDbGFzcyAgLSBDbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdG9nZ2xlQnRuQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGV4dENsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgdGV4dCBlbGVtZW50IGluIGEgbm9kZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcbiAgICBzdGF0ZUxhYmVsczoge1xuICAgICAgICBvcGVuZWQ6ICctJyxcbiAgICAgICAgY2xvc2VkOiAnKydcbiAgICB9LFxuICAgIG5vZGVJZFByZWZpeDogJ3R1aS10cmVlLW5vZGUtJyxcbiAgICBjbGFzc05hbWVzOiBtYWtlQ2xhc3NOYW1lcygndHVpLXRyZWUtJywgW1xuICAgICAgICAnbm9kZScsXG4gICAgICAgICdsZWFmJyxcbiAgICAgICAgJ29wZW5lZCcsXG4gICAgICAgICdjbG9zZWQnLFxuICAgICAgICAnc3VidHJlZScsXG4gICAgICAgICd0b2dnbGVCdG4nLFxuICAgICAgICAndGV4dCdcbiAgICBdKSxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICBpbnRlcm5hbE5vZGU6XG4gICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPicsXG4gICAgICAgIGxlYWZOb2RlOlxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPidcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1lc3NhZ2VzIGZvciB0cmVlXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIElOVkFMSURfUk9PVF9FTEVNRU5UOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogUm9vdCBlbGVtZW50IGlzIGludmFsaWQuJyxcbiAgICBJTlZBTElEX0FQSTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IElOVkFMSURfQVBJJyxcbiAgICBJTlZBTElEX0FQSV9TRUxFQ1RBQkxFOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJTZWxlY3RhYmxlXCIgaXMgbm90IGVuYWJsZWQuJyxcbiAgICBJTlZBTElEX0FQSV9FRElUQUJMRTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiRWRpdGFibGVcIiBpcyBub3QgZW5hYmxlZC4nLFxuICAgIElOVkFMSURfQVBJX0RSQUdHQUJMRTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiRHJhZ2dhYmxlXCIgaXMgbm90IGVuYWJsZWQuJyxcbiAgICBJTlZBTElEX0FQSV9DSEVDS0JPWDogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiQ2hlY2tib3hcIiBpcyBub3QgZW5hYmxlZC4nXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE91dGVyIHRlbXBsYXRlXG4gKiBAdHlwZSB7e2ludGVybmFsTm9kZTogc3RyaW5nLCBsZWFmTm9kZTogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgSU5URVJOQUxfTk9ERTpcbiAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwie3tub2RlQ2xhc3N9fSB7e3N0YXRlQ2xhc3N9fVwiPicgK1xuICAgICAgICAgICAgJ3t7aW5uZXJUZW1wbGF0ZX19JyArXG4gICAgICAgICc8L2xpPicsXG4gICAgTEVBRl9OT0RFOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ7e25vZGVDbGFzc319IHt7bGVhZkNsYXNzfX1cIj4nICtcbiAgICAgICAgICAgICd7e2lubmVyVGVtcGxhdGV9fScgK1xuICAgICAgICAnPC9saT4nXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFN0YXRlcyBpbiB0cmVlXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIFN0YXRlcyBvZiBub2RlXG4gICAgICogQHR5cGUge3tPUEVORUQ6IHN0cmluZywgQ0xPU0VEOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIG5vZGU6IHtcbiAgICAgICAgT1BFTkVEOiAnb3BlbmVkJyxcbiAgICAgICAgQ0xPU0VEOiAnY2xvc2VkJ1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xudmFyIEFQSV9MSVNUID0gW1xuICAgICdjaGVjaycsXG4gICAgJ3VuY2hlY2snLFxuICAgICd0b2dnbGVDaGVjaycsXG4gICAgJ2lzQ2hlY2tlZCcsXG4gICAgJ2lzSW5kZXRlcm1pbmF0ZScsXG4gICAgJ2lzVW5jaGVja2VkJyxcbiAgICAnZ2V0Q2hlY2tlZExpc3QnLFxuICAgICdnZXRUb3BDaGVja2VkTGlzdCcsXG4gICAgJ2dldEJvdHRvbUNoZWNrZWRMaXN0J1xuXTtcblxuLyoqXG4gKiBDaGVja2JveCB0cmktc3RhdGVzXG4gKi9cbnZhciBTVEFURV9DSEVDS0VEID0gMSxcbiAgICBTVEFURV9VTkNIRUNLRUQgPSAyLFxuICAgIFNUQVRFX0lOREVURVJNSU5BVEUgPSAzLFxuICAgIERBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURSA9ICdfX0NoZWNrQm94U3RhdGVfXycsXG4gICAgREFUQSA9IHt9O1xuXG52YXIgZmlsdGVyID0gdHVpLnV0aWwuZmlsdGVyLFxuICAgIGZvckVhY2ggPSB0dWkudXRpbC5mb3JFYWNoO1xuLyoqXG4gKiBTZXQgdGhlIGNoZWNrYm94LWFwaVxuICogQGNsYXNzIENoZWNrYm94XG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb24gLSBPcHRpb25cbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9uLmNoZWNrYm94Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGNoZWNrYm94IGVsZW1lbnRcbiAqL1xudmFyIENoZWNrYm94ID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBDaGVja2JveC5wcm90b3R5cGUgKi97IC8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgQ2hlY2tib3hcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBjaGVja2JveFxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9uKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9uID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBvcHRpb24pO1xuXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuY2hlY2tib3hDbGFzc05hbWUgPSBvcHRpb24uY2hlY2tib3hDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuY2hlY2tlZExpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5yb290Q2hlY2tib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTlBVVCcpO1xuICAgICAgICB0aGlzLnJvb3RDaGVja2JveC50eXBlID0gJ2NoZWNrYm94JztcblxuICAgICAgICB0aGlzLl9zZXRBUElzKCk7XG4gICAgICAgIHRoaXMuX2F0dGFjaEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuXG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuICAgICAgICBmb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdHJlZVthcGlOYW1lXTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBhcGlzIG9mIGNoZWNrYm94IHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRBUElzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBiaW5kID0gdHVpLnV0aWwuYmluZDtcblxuICAgICAgICBmb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICB0cmVlW2FwaU5hbWVdID0gYmluZCh0aGlzW2FwaU5hbWVdLCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBldmVudCB0byB0cmVlIGluc3RhbmNlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXR0YWNoRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmVlLm9uKHtcbiAgICAgICAgICAgIHNpbmdsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJZCwgc3RhdGU7XG5cbiAgICAgICAgICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2hlY2tib3hDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlRnJvbUNoZWNrYm94KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRpbnVlUG9zdHByb2Nlc3Npbmcobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFmdGVyRHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0Q2hhbmdlcyhub2RlSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1vdmU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAvL0B0b2RvIC0gT3B0aW1pemF0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdENoYW5nZXMoZGF0YS5vcmlnaW5hbFBhcmVudElkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0Q2hhbmdlcyhkYXRhLm5ld1BhcmVudElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZmxlY3QgdGhlIGNoYW5nZXMgb24gbm9kZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlZmxlY3RDaGFuZ2VzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdGhpcy50cmVlLmVhY2goZnVuY3Rpb24oZGVzY2VuZGFudCwgZGVzY2VuZGFudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShkZXNjZW5kYW50SWQsIHRoaXMuX2dldFN0YXRlKGRlc2NlbmRhbnRJZCksIHRydWUpO1xuICAgICAgICB9LCBub2RlSWQsIHRoaXMpO1xuICAgICAgICB0aGlzLl9qdWRnZU93blN0YXRlKG5vZGVJZCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjaGVja2JveCBhdHRyaWJ1dGVzIChjaGVja2VkLCBpbmRldGVybWluYXRlKVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gY2hlY2tib3ggLSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0NoZWNrZWQgLSBcImNoZWNrZWRcIlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNJbmRldGVybWluYXRlIC0gXCJpbmRldGVybWluYXRlXCJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDaGVja2JveEF0dHI6IGZ1bmN0aW9uKGNoZWNrYm94LCBpc0NoZWNrZWQsIGlzSW5kZXRlcm1pbmF0ZSkge1xuICAgICAgICBjaGVja2JveC5pbmRldGVybWluYXRlID0gaXNJbmRldGVybWluYXRlO1xuICAgICAgICBjaGVja2JveC5jaGVja2VkID0gaXNDaGVja2VkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tpbmcgc3RhdGUgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gU3RhdGUgZm9yIGNoZWNrYm94XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RvcFByb3BhZ2F0aW9uXSAtIElmIHRydWUsIHN0b3AgY2hhbmdpbmcgc3RhdGUgcHJvcGFnYXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHZhciBjaGVja2JveCA9IHRoaXMuX2dldENoZWNrYm94RWxlbWVudChub2RlSWQpO1xuXG4gICAgICAgIGlmICghY2hlY2tib3gpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfQ0hFQ0tFRDpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfVU5DSEVDS0VEOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldENoZWNrYm94QXR0cihjaGVja2JveCwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfSU5ERVRFUk1JTkFURTpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IC8vIG5vIG1vcmUgcHJvY2VzcyBpZiB0aGUgc3RhdGUgaXMgaW52YWxpZFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbnRpbnVlUG9zdHByb2Nlc3Npbmcobm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNraW5nIHN0YXRlIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IENoZWNraW5nIHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHN0YXRlID0gdHJlZS5nZXROb2RlRGF0YShub2RlSWQpW0RBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURV0sXG4gICAgICAgICAgICBjaGVja2JveDtcblxuICAgICAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgICAgICBjaGVja2JveCA9IHRoaXMuX2dldENoZWNrYm94RWxlbWVudChub2RlSWQpO1xuICAgICAgICAgICAgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZUZyb21DaGVja2JveChjaGVja2JveCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2luZyBzdGF0ZSBvZiBub2RlIGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gY2hlY2tib3ggLSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHJldHVybnMgez9udW1iZXJ9IENoZWNraW5nIHN0YXRlXG4gICAgICovXG4gICAgX2dldFN0YXRlRnJvbUNoZWNrYm94OiBmdW5jdGlvbihjaGVja2JveCkge1xuICAgICAgICB2YXIgc3RhdGU7XG5cbiAgICAgICAgaWYgKCFjaGVja2JveCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tib3guY2hlY2tlZCkge1xuICAgICAgICAgICAgc3RhdGUgPSBTVEFURV9DSEVDS0VEO1xuICAgICAgICB9IGVsc2UgaWYgKGNoZWNrYm94LmluZGV0ZXJtaW5hdGUpIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfSU5ERVRFUk1JTkFURTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfVU5DSEVDS0VEO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb250aW51ZSBwb3N0LXByb2Nlc3NpbmcgZnJvbSBjaGFuZ2luZzpjaGVja2JveC1zdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gQ2hlY2tib3ggc3RhdGVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdG9wUHJvcGFnYXRpb25dIC0gSWYgdHJ1ZSwgc3RvcCB1cGRhdGUtcHJvcGFnYXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb250aW51ZVBvc3Rwcm9jZXNzaW5nOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlLCBzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuY2hlY2tlZExpc3QsXG4gICAgICAgICAgICBldmVudE5hbWU7XG5cbiAgICAgICAgLyogUHJldmVudCBkdXBsaWNhdGVkIG5vZGUgaWQgKi9cbiAgICAgICAgdXRpbC5yZW1vdmVJdGVtRnJvbUFycmF5KG5vZGVJZCwgY2hlY2tlZExpc3QpO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gU1RBVEVfQ0hFQ0tFRCkge1xuICAgICAgICAgICAgY2hlY2tlZExpc3QucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSNjaGVja1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIENoZWNrZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHRyZWUub24oJ2NoZWNrJywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ2NoZWNrZWQ6ICcgKyBub2RlSWQpO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGV2ZW50TmFtZSA9ICdjaGVjayc7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFNUQVRFX1VOQ0hFQ0tFRCkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSN1bmNoZWNrXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVW5jaGVja2VkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlLm9uKCd1bmNoZWNrJywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ3VuY2hlY2tlZDogJyArIG5vZGVJZCk7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZXZlbnROYW1lID0gJ3VuY2hlY2snO1xuICAgICAgICB9XG4gICAgICAgIERBVEFbREFUQV9LRVlfRk9SX0NIRUNLQk9YX1NUQVRFXSA9IHN0YXRlO1xuICAgICAgICB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgREFUQSwgdHJ1ZSk7XG5cbiAgICAgICAgaWYgKCFzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BhZ2F0ZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICAgICAgdHJlZS5maXJlKGV2ZW50TmFtZSwgbm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcm9wYWdhdGUgYSBub2RlIHN0YXRlIHRvIGRlc2NlbmRhbnRzIGFuZCBhbmNlc3RvcnMgZm9yIHVwZGF0aW5nIHRoZWlyIHN0YXRlc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gQ2hlY2tib3ggc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wcm9wYWdhdGVTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUgPT09IFNUQVRFX0lOREVURVJNSU5BVEUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbERlc2NlbmRhbnRzU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBhbGwgZGVzY2VuZGFudHMgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0ZSAtIFN0YXRlIGZvciBjaGVja2JveFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZUFsbERlc2NlbmRhbnRzU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcbiAgICAgICAgdGhpcy50cmVlLmVhY2goZnVuY3Rpb24oZGVzY2VuZGFudCwgZGVzY2VuZGFudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShkZXNjZW5kYW50SWQsIHN0YXRlLCB0cnVlKTtcbiAgICAgICAgfSwgbm9kZUlkLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGFsbCBhbmNlc3RvcnMgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRyZWUuZ2V0UGFyZW50SWQobm9kZUlkKTtcblxuICAgICAgICB3aGlsZSAocGFyZW50SWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2p1ZGdlT3duU3RhdGUocGFyZW50SWQpO1xuICAgICAgICAgICAgcGFyZW50SWQgPSB0cmVlLmdldFBhcmVudElkKHBhcmVudElkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBKdWRnZSBvd24gc3RhdGUgZnJvbSBjaGlsZCBub2RlIGlzIGNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2p1ZGdlT3duU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoaWxkSWRzID0gdHJlZS5nZXRDaGlsZElkcyhub2RlSWQpLFxuICAgICAgICAgICAgY2hlY2tlZCA9IHRydWUsXG4gICAgICAgICAgICB1bmNoZWNrZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICghY2hpbGRJZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjaGVja2VkID0gdGhpcy5pc0NoZWNrZWQobm9kZUlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvckVhY2goY2hpbGRJZHMsIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZShjaGlsZElkKTtcbiAgICAgICAgICAgICAgICBjaGVja2VkID0gKGNoZWNrZWQgJiYgc3RhdGUgPT09IFNUQVRFX0NIRUNLRUQpO1xuICAgICAgICAgICAgICAgIHVuY2hlY2tlZCA9ICh1bmNoZWNrZWQgJiYgc3RhdGUgPT09IFNUQVRFX1VOQ0hFQ0tFRCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY2hlY2tlZCB8fCB1bmNoZWNrZWQ7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGVja2VkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX0NIRUNLRUQsIHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHVuY2hlY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9VTkNIRUNLRUQsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9JTkRFVEVSTUlOQVRFLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tib3ggZWxlbWVudCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P0hUTUxFbGVtZW50fSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0Q2hlY2tib3hFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBlbCwgbm9kZUVsO1xuXG4gICAgICAgIGlmIChub2RlSWQgPT09IHRyZWUuZ2V0Um9vdE5vZGVJZCgpKSB7XG4gICAgICAgICAgICBlbCA9IHRoaXMucm9vdENoZWNrYm94O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZUVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgICAgICBub2RlRWwsXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja2JveENsYXNzTmFtZVxuICAgICAgICAgICAgKVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUuY2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICBjaGVjazogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0NoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9DSEVDS0VEKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbmNoZWNrIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLnVuY2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICB1bmNoZWNrOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVW5jaGVja2VkKG5vZGVJZCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKG5vZGVJZCwgU1RBVEVfVU5DSEVDS0VEKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgbm9kZSBjaGVja2luZ1xuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUudG9nZ2xlQ2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICB0b2dnbGVDaGVjazogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0NoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5jaGVjayhub2RlSWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51bmNoZWNrKG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBjaGVja2VkXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyBpbmRldGVybWluYXRlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS5jaGVjayhub2RlSWQpO1xuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuaXNDaGVja2VkKG5vZGVJZCkpOyAvLyB0cnVlXG4gICAgICovXG4gICAgaXNDaGVja2VkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNUQVRFX0NIRUNLRUQgPT09IHRoaXMuX2dldFN0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIG5vZGUgaXMgaW5kZXRlcm1pbmF0ZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIG5vZGUgaXMgaW5kZXRlcm1pbmF0ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUuY2hlY2sobm9kZUlkKTtcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmlzSW5kZXRlcm1pbmF0ZShub2RlSWQpKTsgLy8gZmFsc2VcbiAgICAgKi9cbiAgICBpc0luZGV0ZXJtaW5hdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gU1RBVEVfSU5ERVRFUk1JTkFURSA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyB1bmNoZWNrZWQgb3Igbm90XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyB1bmNoZWNrZWQuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS51bmNoZWNrKG5vZGVJZCk7XG4gICAgICogY29uc29sZS5sb2codHJlZS5pc1VuY2hlY2tlZChub2RlSWQpKTsgLy8gdHJ1ZVxuICAgICAqL1xuICAgIGlzVW5jaGVja2VkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNUQVRFX1VOQ0hFQ0tFRCA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbENoZWNrZWRMaXN0ID0gdHJlZS5nZXRDaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUxJywgJ25vZGUyJywgJ25vZGUzJyAsLi4uLl1cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNDaGVja2VkTGlzdCA9IHRyZWUuZ2V0Q2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTcnLCAnbm9kZTgnXVxuICAgICAqL1xuICAgIGdldENoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5jaGVja2VkTGlzdDtcblxuICAgICAgICBpZiAoIXBhcmVudElkKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hlY2tlZExpc3Quc2xpY2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXIoY2hlY2tlZExpc3QsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWUuY29udGFpbnMocGFyZW50SWQsIG5vZGVJZCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdG9wIGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbFRvcENoZWNrZWRMaXN0ID0gdHJlZS5nZXRUb3BDaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUxJywgJ25vZGU1JywgJ25vZGU3J11cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNUb3BDaGVja2VkTGlzdCA9IHRyZWUuZ2V0VG9wQ2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTcnXVxuICAgICAqL1xuICAgIGdldFRvcENoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gW10sXG4gICAgICAgICAgICBzdGF0ZTtcblxuICAgICAgICBwYXJlbnRJZCA9IHBhcmVudElkIHx8IHRyZWUuZ2V0Um9vdE5vZGVJZCgpO1xuICAgICAgICBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlKHBhcmVudElkKTtcbiAgICAgICAgaWYgKHN0YXRlID09PSBTVEFURV9DSEVDS0VEKSB7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRyZWUuZ2V0Q2hpbGRJZHMocGFyZW50SWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBTVEFURV9JTkRFVEVSTUlOQVRFKSB7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuZ2V0Q2hlY2tlZExpc3QocGFyZW50SWQpO1xuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSBmaWx0ZXIoY2hlY2tlZExpc3QsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhdGhpcy5pc0NoZWNrZWQodHJlZS5nZXRQYXJlbnRJZChub2RlSWQpKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoZWNrZWRMaXN0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYm90dG9tIGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbEJvdHRvbUNoZWNrZWRMaXN0ID0gdHJlZS5nZXRCb3R0b21DaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUyJywgJ25vZGUzJywgJ25vZGU1JywgJ25vZGU4J11cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNCb3R0b21DaGVja2VkTGlzdCA9IHRyZWUuZ2V0Qm90dG9tQ2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTgnXVxuICAgICAqL1xuICAgIGdldEJvdHRvbUNoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0O1xuXG4gICAgICAgIHBhcmVudElkID0gcGFyZW50SWQgfHwgdHJlZS5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5nZXRDaGVja2VkTGlzdChwYXJlbnRJZCk7XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcihjaGVja2VkTGlzdCwgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZS5pc0xlYWYobm9kZUlkKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihDaGVja2JveCk7XG5tb2R1bGUuZXhwb3J0cyA9IENoZWNrYm94O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIEFQSV9MSVNUID0gW1xuICAgICdjaGFuZ2VDb250ZXh0TWVudSdcbl07XG52YXIgVHVpQ29udGV4dE1lbnUgPSB0dWkgJiYgdHVpLmNvbXBvbmVudCAmJiB0dWkuY29tcG9uZW50LkNvbnRleHRNZW51O1xudmFyIHN0eWxlS2V5cyA9IFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J107XG52YXIgZW5hYmxlUHJvcCA9IHV0aWwudGVzdFByb3Aoc3R5bGVLZXlzKTtcbnZhciBiaW5kID0gdHVpLnV0aWwuYmluZDtcblxuLyoqXG4gKiBTZXQgQ29udGV4dE1lbnUgZmVhdHVyZSBvbiB0cmVlXG4gKiBAY2xhc3MgQ29udGV4dE1lbnVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgICAgQHBhcmFtIHtBcnJheS48T2JqZWN0Pn0gb3B0aW9ucy5tZW51RGF0YSAtIENvbnRleHQgbWVudSBkYXRhXG4gKi9cbnZhciBDb250ZXh0TWVudSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgQ29udGV4dE1lbnUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgQ29udGV4dE1lbnVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBDb250ZXh0TWVudVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJlZSBkYXRhXG4gICAgICAgICAqIEB0eXBlIHtUcmVlfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJlZSBzZWxlY3RvciBmb3IgY29udGV4dCBtZW51XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWVTZWxlY3RvciA9ICcjJyArIHRoaXMudHJlZS5yb290RWxlbWVudC5pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWQgb2YgZmxvYXRpbmcgbGF5ZXIgaW4gdHJlZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mbElkID0gdGhpcy50cmVlLnJvb3RFbGVtZW50LmlkICsgJy1mbCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluZm8gb2YgY29udGV4dCBtZW51IGluIHRyZWVcbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubWVudSA9IHRoaXMuX2dlbmVyYXRlQ29udGV4dE1lbnUoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmxvYXRpbmcgbGF5ZXIgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZsRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuZmxJZCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElkIG9mIHNlbGVjdGVkIHRyZWUgaXRlbVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5tZW51LnJlZ2lzdGVyKHRoaXMudHJlZVNlbGVjdG9yLCBiaW5kKHRoaXMuX29uU2VsZWN0LCB0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm1lbnVEYXRhIHx8IHt9KTtcblxuICAgICAgICB0aGlzLnRyZWUub24oJ2NvbnRleHRtZW51JywgdGhpcy5fb25Db250ZXh0TWVudSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fcHJldmVudFRleHRTZWxlY3Rpb24oKTtcblxuICAgICAgICB0aGlzLl9zZXRBUElzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBDb250ZXh0TWVudVxuICAgICAqIEBwYXJhbSB7QXJyYXkuPE9iamVjdD59IG5ld01lbnVEYXRhIC0gTmV3IGNvbnRleHQgbWVudSBkYXRhXG4gICAgICogQGFwaVxuICAgICAqL1xuICAgIGNoYW5nZUNvbnRleHRNZW51OiBmdW5jdGlvbihuZXdNZW51RGF0YSkge1xuICAgICAgICB0aGlzLm1lbnUudW5yZWdpc3Rlcih0aGlzLnRyZWVTZWxlY3Rvcik7XG4gICAgICAgIHRoaXMubWVudS5yZWdpc3Rlcih0aGlzLnRyZWVTZWxlY3RvciwgYmluZCh0aGlzLl9vblNlbGVjdCwgdGhpcyksIG5ld01lbnVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBDb250ZXh0TWVudSBmZWF0dXJlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuXG4gICAgICAgIHRoaXMubWVudS5kZXN0cm95KCk7XG5cbiAgICAgICAgdGhpcy5fcmVzdG9yZVRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5fcmVtb3ZlRmxvYXRpbmdMYXllcigpO1xuXG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goQVBJX0xJU1QsIGZ1bmN0aW9uKGFwaU5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0cmVlW2FwaU5hbWVdO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZsb2F0aW5nIGxheWVyIGZvciBjb250ZXh0IG1lbnVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVGbG9hdGluZ0xheWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5mbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5mbEVsZW1lbnQuaWQgPSB0aGlzLmZsSWQ7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmZsRWxlbWVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmbG9hdGluZyBsYXllciBmb3IgY29udGV4dCBtZW51XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmxvYXRpbmdMYXllcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGhpcy5mbEVsZW1lbnQpO1xuICAgICAgICB0aGlzLmZsRWxlbWVudCA9IG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGNvbnRleHQgbWVudSBpbiB0cmVlXG4gICAgICogQHJldHVybnMge1R1aUNvbnRleHRNZW51fSBJbnN0YW5jZSBvZiBUdWlDb250ZXh0TWVudVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dlbmVyYXRlQ29udGV4dE1lbnU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuZmxFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVGbG9hdGluZ0xheWVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFR1aUNvbnRleHRNZW51KHRoaXMuZmxFbGVtZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCB0ZXh0IHNlbGVjdGlvbiBvbiBzZWxlY3RlZCB0cmVlIGl0ZW1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wcmV2ZW50VGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChlbmFibGVQcm9wKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQuc3R5bGVbZW5hYmxlUHJvcF0gPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzdG9yZSB0ZXh0IHNlbGVjdGlvbiBvbiBzZWxlY3RlZCB0cmVlIGl0ZW1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZXN0b3JlVGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChlbmFibGVQcm9wKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQuc3R5bGVbZW5hYmxlUHJvcF0gPSAnJztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIG9uIHRyZWUgaXRlbVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIE1vdXNlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Db250ZXh0TWVudTogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XG5cbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2JlZm9yZU9wZW5Db250ZXh0TWVudVxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2JlZm9yZU9wZW5Db250ZXh0TWVudScsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgKiBcdFx0Y29uc29sZS5sb2coJ25vZGVJZDogJyArIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmVlLmZpcmUoJ2JlZm9yZU9wZW5Db250ZXh0TWVudScsIHRoaXMuc2VsZWN0ZWROb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIG9uIGNvbnRleHQgbWVudVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIE1vdXNlIGV2ZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNtZCAtIE9wdGlvbnMgdmFsdWUgb2Ygc2VsZWN0ZWQgY29udGV4dCBtZW51IChcInRpdGxlXCJ8XCJjb21tYW5kXCIpXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25TZWxlY3Q6IGZ1bmN0aW9uKGUsIGNtZCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNzZWxlY3RDb250ZXh0TWVudVxuICAgICAgICAgKiBAcGFyYW0ge3tjbWQ6IHN0cmluZywgbm9kZUlkOiBzdHJpbmd9fSB0cmVlRXZlbnQgLSBUcmVlIGV2ZW50XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ3NlbGVjdENvbnRleHRNZW51JywgZnVuY3Rpb24odHJlZUV2ZW50KSB7XG4gICAgICAgICAqICAgICB2YXIgY21kID0gdHJlZUV2ZW50LmNtZCxcbiAgICAgICAgICogICAgIHZhciBub2RlSWQgPSB0cmVlRXZlbnQubm9kZUlkO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coY21kLCBub2RlSWQpO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZS5maXJlKCdzZWxlY3RDb250ZXh0TWVudScsIHtcbiAgICAgICAgICAgIGNtZDogY21kLFxuICAgICAgICAgICAgbm9kZUlkOiB0aGlzLnNlbGVjdGVkTm9kZUlkXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgQVBJIG9mIENvbnRleHRNZW51IGZlYXR1cmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRBUElzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgdHJlZVthcGlOYW1lXSA9IGJpbmQodGhpc1thcGlOYW1lXSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHRNZW51O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIHVzZUhlbHBlcjogdHJ1ZSxcbiAgICBoZWxwZXJQb3M6IHtcbiAgICAgICAgeTogMixcbiAgICAgICAgeDogNVxuICAgIH0sXG4gICAgYXV0b09wZW5EZWxheTogMTUwMCxcbiAgICBpc1NvcnRhYmxlOiBmYWxzZSxcbiAgICBob3ZlckNsYXNzTmFtZTogJ3R1aS10cmVlLWhvdmVyJyxcbiAgICBsaW5lQ2xhc3NOYW1lOiAndHVpLXRyZWUtbGluZScsXG4gICAgbGluZUJvdW5kYXJ5OiB7XG4gICAgICAgIHRvcDogMixcbiAgICAgICAgYm90dG9tOiAyXG4gICAgfVxufTtcbnZhciByZWplY3RlZFRhZ05hbWVzID0gW1xuICAgICdJTlBVVCcsXG4gICAgJ0JVVFRPTicsXG4gICAgJ1VMJ1xuXTtcbnZhciBzZWxlY3RLZXkgPSB1dGlsLnRlc3RQcm9wKFxuICAgIFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J11cbik7XG52YXIgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG52YXIgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2g7XG52YXIgQVBJX0xJU1QgPSBbXTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgZHJhZ2dhYmxlXG4gKiBAY2xhc3MgRHJhZ2dhYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9uc1xuICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VIZWxwZXIgLSBVc2luZyBoZWxwZXIgZmxhZ1xuICogICAgIEBwYXJhbSB7e3g6IG51bWJlciwgeTpudW1iZXJ9fSBvcHRpb25zLmhlbHBlclBvcyAtIEhlbHBlciBwb3NpdGlvblxuICogICAgIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG9wdGlvbnMucmVqZWN0ZWRUYWdOYW1lcyAtIE5vIGRyYWdnYWJsZSB0YWcgbmFtZXNcbiAqICAgICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkQ2xhc3NOYW1lcyAtIE5vIGRyYWdnYWJsZSBjbGFzcyBuYW1lc1xuICogICAgIEBwYXJhbSB7bnVtYmVyfSBvcHRpb25zLmF1dG9PcGVuRGVsYXkgLSBEZWxheSB0aW1lIHdoaWxlIGRyYWdnaW5nIHRvIGJlIG9wZW5lZFxuICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5pc1NvcnRhYmxlIC0gRmxhZyBvZiB3aGV0aGVyIHVzaW5nIHNvcnRhYmxlIGRyYWdnaW5nXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaG92ZXJDbGFzc05hbWUgLSBDbGFzcyBuYW1lIGZvciBob3ZlcmVkIG5vZGVcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5saW5lQ2xhc3NOYW1lIC0gQ2xhc3MgbmFtZSBmb3IgbW92aW5nIHBvc2l0aW9uIGxpbmVcbiAqICAgICBAcGFyYW0ge3t0b3A6IG51bWJlciwgYm90dG9tOiBudW1iZXJ9fSBvcHRpb25zLmxpbmVCb3VuZGFyeSAtIEJvdW5kYXJ5IHZhbHVlIGZvciB2aXNpYmxlIG1vdmluZyBsaW5lXG4gKi9cbnZhciBEcmFnZ2FibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIERyYWdnYWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBEcmFnZ2FibGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBEcmFnZ2FibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyZWUgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7VHJlZX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERyYWcgaGVscGVyIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VsZWN0YWJsZSBlbGVtZW50J3MgcHJvcGVydHlcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VsZWN0YWJsZSBlbGVtZW50J3MgcHJvcGVydHkgdmFsdWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5VmFsdWUgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEcmFnZ2luZyBlbGVtZW50J3Mgbm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3VycmVudCBtb3VzZSBvdmVyZWQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmhvdmVyZWRFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTW92aW5nIGxpbmUgdHlwZSAoXCJ0b3BcIiBvciBcImJvdHRvbVwiKVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tb3ZpbmdMaW5lVHlwZSA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEludm9raW5nIHRpbWUgZm9yIHNldFRpbWVvdXQoKVxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50aW1lciA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRhZyBsaXN0IGZvciByZWplY3RpbmcgdG8gZHJhZ1xuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWplY3RlZFRhZ05hbWVzID0gcmVqZWN0ZWRUYWdOYW1lcy5jb25jYXQob3B0aW9ucy5yZWplY3RlZFRhZ05hbWVzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xhc3MgbmFtZSBsaXN0IGZvciByZWplY3RpbmcgdG8gZHJhZ1xuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWplY3RlZENsYXNzTmFtZXMgPSBbXS5jb25jYXQob3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVc2luZyBoZWxwZXIgZmxhZ1xuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlSGVscGVyID0gb3B0aW9ucy51c2VIZWxwZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhlbHBlciBwb3NpdGlvblxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oZWxwZXJQb3MgPSBvcHRpb25zLmhlbHBlclBvcztcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVsYXkgdGltZSB3aGlsZSBkcmFnZ2luZyB0byBiZSBvcGVuZWRcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYXV0b09wZW5EZWxheSA9IG9wdGlvbnMuYXV0b09wZW5EZWxheTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmxhZyBvZiB3aGV0aGVyIHVzaW5nIHNvcnRhYmxlIGRyYWdnaW5nXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1NvcnRhYmxlID0gb3B0aW9ucy5pc1NvcnRhYmxlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGFzcyBuYW1lIGZvciBtb3VzZSBvdmVyZWQgbm9kZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5ob3ZlckNsYXNzTmFtZSA9IG9wdGlvbnMuaG92ZXJDbGFzc05hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsYXNzIG5hbWUgZm9yIG1vdmluZyBwb3NpdGlvbiBsaW5lXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxpbmVDbGFzc05hbWUgPSBvcHRpb25zLmxpbmVDbGFzc05hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJvdW5kYXJ5IHZhbHVlIGZvciB2aXNpYmxlIG1vdmluZyBsaW5lXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxpbmVCb3VuZGFyeSA9IG9wdGlvbnMubGluZUJvdW5kYXJ5O1xuXG4gICAgICAgIHRoaXMuX2luaXRIZWxwZXIoKTtcblxuICAgICAgICBpZiAodGhpcy5pc1NvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0TW92aW5nTGluZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYXR0YWNoTW91c2Vkb3duKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVzdG9yZVRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5fZGV0YWNoTW91c2Vkb3duKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBoZWxwZXIgZWxlbWVudCBwb3NpdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtb3VzZVBvcyAtIEN1cnJlbnQgbW91c2UgcG9zaXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jaGFuZ2VIZWxwZXJQb3NpdGlvbjogZnVuY3Rpb24obW91c2VQb3MpIHtcbiAgICAgICAgdmFyIGhlbHBlclN0eWxlID0gdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlO1xuICAgICAgICB2YXIgcG9zID0gdGhpcy50cmVlLnJvb3RFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIGhlbHBlclN0eWxlLnRvcCA9IChtb3VzZVBvcy55IC0gcG9zLnRvcCArIHRoaXMuaGVscGVyUG9zLnkpICsgJ3B4JztcbiAgICAgICAgaGVscGVyU3R5bGUubGVmdCA9IChtb3VzZVBvcy54IC0gcG9zLmxlZnQgKyB0aGlzLmhlbHBlclBvcy54KSArICdweCc7XG4gICAgICAgIGhlbHBlclN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdCBoZWxwZXIgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2luaXRIZWxwZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaGVscGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdmFyIGhlbHBlclN0eWxlID0gaGVscGVyRWxlbWVudC5zdHlsZTtcblxuICAgICAgICBoZWxwZXJTdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIGhlbHBlclN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICAgICAgdGhpcy50cmVlLnJvb3RFbGVtZW50LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoaGVscGVyRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gaGVscGVyRWxlbWVudDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdCBtb3ZpbmcgbGluZSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaW5pdE1vdmluZ0xpbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbGluZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdmFyIGxpbmVTdHlsZSA9IGxpbmVFbGVtZW50LnN0eWxlO1xuXG4gICAgICAgIGxpbmVTdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIGxpbmVTdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cbiAgICAgICAgbGluZUVsZW1lbnQuY2xhc3NOYW1lID0gdGhpcy5saW5lQ2xhc3NOYW1lO1xuXG4gICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGxpbmVFbGVtZW50KTtcblxuICAgICAgICB0aGlzLmxpbmVFbGVtZW50ID0gbGluZUVsZW1lbnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBoZWxwZXIgY29udGVudHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIEhlbHBlciBjb250ZW50c1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEhlbHBlcjogZnVuY3Rpb24odGV4dCkge1xuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuaW5uZXJIVE1MID0gdGV4dDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIG1vdXNlIGRvd24gZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hdHRhY2hNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9wcmV2ZW50VGV4dFNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLnRyZWUub24oJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2Vkb3duLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGV0YWNoIG1vdXNlZG93biBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2RldGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgdGV4dC1zZWxlY3Rpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wcmV2ZW50VGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMudHJlZS5yb290RWxlbWVudC5zdHlsZTtcblxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy50cmVlLnJvb3RFbGVtZW50LCAnc2VsZWN0c3RhcnQnLCB1dGlsLnByZXZlbnREZWZhdWx0KTtcblxuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSA9IHNlbGVjdEtleTtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZSA9IHN0eWxlW3NlbGVjdEtleV07XG5cbiAgICAgICAgc3R5bGVbc2VsZWN0S2V5XSA9ICdub25lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzdG9yZSB0ZXh0LXNlbGVjdGlvblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Jlc3RvcmVUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMudHJlZS5yb290RWxlbWVudCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XG5cbiAgICAgICAgaWYgKHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQuc3R5bGVbdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXldID0gdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgaW4gcmVqZWN0ZWRUYWdOYW1lcyBvciBpbiByZWplY3RlZENsYXNzTmFtZXNcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSB0YXJnZXQgaXMgbm90IGRyYWdnYWJsZSBvciBkcmFnZ2FibGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9pc05vdERyYWdnYWJsZTogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIHZhciB0YWdOYW1lID0gdGFyZ2V0LnRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSB1dGlsLmdldENsYXNzKHRhcmdldCkuc3BsaXQoL1xccysvKTtcbiAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICBpZiAoaW5BcnJheSh0YWdOYW1lLCB0aGlzLnJlamVjdGVkVGFnTmFtZXMpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JFYWNoKGNsYXNzTmFtZXMsIGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gaW5BcnJheShjbGFzc05hbWUsIHRoaXMucmVqZWN0ZWRDbGFzc05hbWVzKSAhPT0gLTE7XG5cbiAgICAgICAgICAgIHJldHVybiAhcmVzdWx0O1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vkb3duXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Nb3VzZWRvd246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpO1xuXG4gICAgICAgIGlmICh1dGlsLmlzUmlnaHRCdXR0b24oZXZlbnQpIHx8IHRoaXMuX2lzTm90RHJhZ2dhYmxlKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWwucHJldmVudERlZmF1bHQoZXZlbnQpO1xuXG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICBpZiAodGhpcy51c2VIZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldEhlbHBlcih0YXJnZXQuaW5uZXJUZXh0IHx8IHRhcmdldC50ZXh0Q29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cmVlLm9uKHtcbiAgICAgICAgICAgIG1vdXNlbW92ZTogdGhpcy5fb25Nb3VzZW1vdmUsXG4gICAgICAgICAgICBtb3VzZXVwOiB0aGlzLl9vbk1vdXNldXBcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZW1vdmVcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbk1vdXNlbW92ZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG1vdXNlUG9zID0gdXRpbC5nZXRNb3VzZVBvcyhldmVudCk7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIHZhciBub2RlSWQ7XG5cbiAgICAgICAgaWYgKCF0aGlzLnVzZUhlbHBlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2hhbmdlSGVscGVyUG9zaXRpb24obW91c2VQb3MpO1xuXG4gICAgICAgIG5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgIGlmIChub2RlSWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2FwcGx5TW92ZUFjdGlvbihub2RlSWQsIG1vdXNlUG9zKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2V1cFxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTW91c2V1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIHZhciBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG4gICAgICAgIHZhciBpbmRleCA9IC0xO1xuXG4gICAgICAgIGlmIChub2RlSWQgJiYgdGhpcy5pc1NvcnRhYmxlICYmIHRoaXMubW92aW5nTGluZVR5cGUpIHtcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5fZ2V0SW5kZXhGb3JJbnNlcnRpbmcobm9kZUlkKTtcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0UGFyZW50SWQobm9kZUlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWUubW92ZSh0aGlzLmN1cnJlbnROb2RlSWQsIG5vZGVJZCwgaW5kZXgpO1xuXG4gICAgICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFwcGx5IG1vdmUgYWN0aW9uIHRoYXQgYXJlIGRlbGF5IGVmZmVjdCBhbmQgc29ydGFibGUgbW92aW5nIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmlnfSBub2RlSWQgLSBTZWxlY3RlZCB0cmVlIG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbW91c2VQb3MgLSBDdXJyZW50IG1vdXNlIHBvc2l0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXBwbHlNb3ZlQWN0aW9uOiBmdW5jdGlvbihub2RlSWQsIG1vdXNlUG9zKSB7XG4gICAgICAgIHZhciBjdXJyZW50RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIHZhciB0YXJnZXRQb3MgPSBjdXJyZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIGhhc0NsYXNzID0gdXRpbC5oYXNDbGFzcyhjdXJyZW50RWxlbWVudCwgdGhpcy5ob3ZlckNsYXNzTmFtZSk7XG4gICAgICAgIHZhciBpc0NvbnRhaW4gPSB0aGlzLl9pc0NvbnRhaW4odGFyZ2V0UG9zLCBtb3VzZVBvcyk7XG4gICAgICAgIHZhciBib3VuZGFyeVR5cGU7XG5cbiAgICAgICAgaWYgKCF0aGlzLmhvdmVyZWRFbGVtZW50ICYmIGlzQ29udGFpbikge1xuICAgICAgICAgICAgdGhpcy5ob3ZlcmVkRWxlbWVudCA9IGN1cnJlbnRFbGVtZW50O1xuICAgICAgICAgICAgdGhpcy5faG92ZXIobm9kZUlkKTtcbiAgICAgICAgfSBlbHNlIGlmICghaGFzQ2xhc3MgfHwgKGhhc0NsYXNzICYmICFpc0NvbnRhaW4pKSB7XG4gICAgICAgICAgICB0aGlzLl91bmhvdmVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc1NvcnRhYmxlKSB7XG4gICAgICAgICAgICBib3VuZGFyeVR5cGUgPSB0aGlzLl9nZXRCb3VuZGFyeVR5cGUodGFyZ2V0UG9zLCBtb3VzZVBvcyk7XG4gICAgICAgICAgICB0aGlzLl9kcmF3Qm91bmRhcnlMaW5lKHRhcmdldFBvcywgYm91bmRhcnlUeXBlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBY3QgdG8gaG92ZXIgb24gdHJlZSBpdGVtXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFRyZWUgbm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2hvdmVyOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdXRpbC5hZGRDbGFzcyh0aGlzLmhvdmVyZWRFbGVtZW50LCB0aGlzLmhvdmVyQ2xhc3NOYW1lKTtcblxuICAgICAgICBpZiAodHJlZS5pc0xlYWYobm9kZUlkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0cmVlLm9wZW4obm9kZUlkKTtcbiAgICAgICAgfSwgdGhpcy5hdXRvT3BlbkRlbGF5KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWN0IHRvIHVuaG92ZXIgb24gdHJlZSBpdGVtXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdW5ob3ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuaG92ZXJlZEVsZW1lbnQsIHRoaXMuaG92ZXJDbGFzc05hbWUpO1xuXG4gICAgICAgIHRoaXMuaG92ZXJlZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLnRpbWVyID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgY29udGFpbmVkIHN0YXRlIG9mIGN1cnJlbnQgdGFyZ2V0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFBvcyAtIFBvc2l0aW9uIG9mIHRyZWUgaXRlbVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtb3VzZVBvcyAtIFBvc2l0aW9uIG9mIG1vdmVkIG1vdXNlXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IENvbnRhaW5lZCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2lzQ29udGFpbjogZnVuY3Rpb24odGFyZ2V0UG9zLCBtb3VzZVBvcykge1xuICAgICAgICB2YXIgdG9wID0gdGFyZ2V0UG9zLnRvcDtcbiAgICAgICAgdmFyIGJvdHRvbSA9IHRhcmdldFBvcy5ib3R0b207XG5cbiAgICAgICAgaWYgKHRoaXMuaXNTb3J0YWJsZSkge1xuICAgICAgICAgICAgdG9wICs9IHRoaXMubGluZUJvdW5kYXJ5LnRvcDtcbiAgICAgICAgICAgIGJvdHRvbSAtPSB0aGlzLmxpbmVCb3VuZGFyeS5ib3R0b207XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0UG9zLmxlZnQgPCBtb3VzZVBvcy54ICYmXG4gICAgICAgICAgICB0YXJnZXRQb3MucmlnaHQgPiBtb3VzZVBvcy54ICYmXG4gICAgICAgICAgICB0b3AgPCBtb3VzZVBvcy55ICYmIGJvdHRvbSA+IG1vdXNlUG9zLnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYm91bmRhcnkgdHlwZSBieSBtb3VzZSBwb3NpdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRQb3MgLSBQb3NpdGlvbiBvZiB0cmVlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbW91c2VQb3MgLSBQb3NpdGlvbiBvZiBtb3ZlZCBtb3VzZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFBvc2l0aW9uIHR5cGUgaW4gYm91bmRhcnlcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRCb3VuZGFyeVR5cGU6IGZ1bmN0aW9uKHRhcmdldFBvcywgbW91c2VQb3MpIHtcbiAgICAgICAgdmFyIHR5cGU7XG5cbiAgICAgICAgaWYgKG1vdXNlUG9zLnkgPCB0YXJnZXRQb3MudG9wICsgdGhpcy5saW5lQm91bmRhcnkudG9wKSB7XG4gICAgICAgICAgICB0eXBlID0gJ3RvcCc7XG4gICAgICAgIH0gZWxzZSBpZiAobW91c2VQb3MueSA+IHRhcmdldFBvcy5ib3R0b20gLSB0aGlzLmxpbmVCb3VuZGFyeS5ib3R0b20pIHtcbiAgICAgICAgICAgIHR5cGUgPSAnYm90dG9tJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEcmF3IGJvdW5kYXJ5IGxpbmUgb24gdHJlZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRQb3MgLSBQb3NpdGlvbiBvZiB0cmVlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYm91bmRhcnlUeXBlIC0gUG9zaXRpb24gdHlwZSBpbiBib3VuZGFyeVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2RyYXdCb3VuZGFyeUxpbmU6IGZ1bmN0aW9uKHRhcmdldFBvcywgYm91bmRhcnlUeXBlKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMubGluZUVsZW1lbnQuc3R5bGU7XG4gICAgICAgIHZhciBsaW5lSGVpZ2h0O1xuICAgICAgICB2YXIgc2Nyb2xsVG9wO1xuXG4gICAgICAgIGlmIChib3VuZGFyeVR5cGUpIHtcbiAgICAgICAgICAgIHNjcm9sbFRvcCA9IHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLnNjcm9sbFRvcCArIHV0aWwuZ2V0V2luZG93U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICBsaW5lSGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLmxpbmVFbGVtZW50Lm9mZnNldEhlaWdodCAvIDIpO1xuXG4gICAgICAgICAgICBzdHlsZS50b3AgPSBNYXRoLnJvdW5kKHRhcmdldFBvc1tib3VuZGFyeVR5cGVdKSAtIGxpbmVIZWlnaHQgKyBzY3JvbGxUb3AgKyAncHgnO1xuICAgICAgICAgICAgc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcbiAgICAgICAgICAgIHRoaXMubW92aW5nTGluZVR5cGUgPSBib3VuZGFyeVR5cGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICB0aGlzLm1vdmluZ0xpbmVUeXBlID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaW5kZXggZm9yIGluc2VydGluZ1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBDdXJyZW50IHNlbGVjdGVkIGhlbHBlciBub2RlIGlkXG4gICAgICogQHJldHVybnMge251bWJlcn0gSW5kZXggbnVtYmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SW5kZXhGb3JJbnNlcnRpbmc6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnRyZWUuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKHRoaXMubW92aW5nTGluZVR5cGUgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBfcmVzZXQgcHJvcGVydGllcyBhbmQgcmVtb3ZlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pc1NvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmxpbmVFbGVtZW50LnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmhvdmVyZWRFbGVtZW50KSB7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuaG92ZXJlZEVsZW1lbnQsIHRoaXMuaG92ZXJDbGFzc05hbWUpO1xuICAgICAgICAgICAgdGhpcy5ob3ZlcmVkRWxlbWVudCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgICAgICB0aGlzLmN1cnJlbnROb2RlSWQgPSBudWxsO1xuICAgICAgICB0aGlzLm1vdmluZ0xpbmVUeXBlID0gbnVsbDtcblxuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMsICdtb3VzZW1vdmUnKTtcbiAgICAgICAgdGhpcy50cmVlLm9mZih0aGlzLCAnbW91c2V1cCcpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdnYWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIEFQSV9MSVNUID0gW107XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjbGFzcyBFZGl0YWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnNcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5lZGl0YWJsZUNsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBlZGl0YWJsZSBlbGVtZW50XG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZGF0YUtleSAtIEtleSBvZiBub2RlIGRhdGEgdG8gc2V0IHZhbHVlXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaW5wdXRDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgaW5wdXQgZWxlbWVudFxuICovXG52YXIgRWRpdGFibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIEVkaXRhYmxlLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIFNlbGVjdGFibGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBFZGl0YWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbnMgPSB0dWkudXRpbC5leHRlbmQoe30sIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLmVkaXRhYmxlQ2xhc3NOYW1lID0gb3B0aW9ucy5lZGl0YWJsZUNsYXNzTmFtZTtcbiAgICAgICAgdGhpcy5kYXRhS2V5ID0gb3B0aW9ucy5kYXRhS2V5O1xuICAgICAgICB0aGlzLmlucHV0RWxlbWVudCA9IHRoaXMuY3JlYXRlSW5wdXRFbGVtZW50KG9wdGlvbnMuaW5wdXRDbGFzc05hbWUpO1xuICAgICAgICB0aGlzLmJvdW5kT25LZXl1cCA9IHR1aS51dGlsLmJpbmQodGhpcy5vbktleXVwLCB0aGlzKTtcbiAgICAgICAgdGhpcy5ib3VuZE9uQmx1ciA9IHR1aS51dGlsLmJpbmQodGhpcy5vbkJsdXIsIHRoaXMpO1xuXG4gICAgICAgIHRyZWUub24oJ2RvdWJsZUNsaWNrJywgdGhpcy5vbkRvdWJsZUNsaWNrLCB0aGlzKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAna2V5dXAnLCB0aGlzLmJvdW5kT25LZXl1cCk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2JsdXInLCB0aGlzLmJvdW5kT25CbHVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGV0YWNoIGlucHV0IGVsZW1lbnQgZnJvbSBkb2N1bWVudFxuICAgICAqL1xuICAgIGRldGFjaElucHV0RnJvbURvY3VtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlucHV0RWwgPSB0aGlzLmlucHV0RWxlbWVudCxcbiAgICAgICAgICAgIHBhcmVudE5vZGUgPSBpbnB1dEVsLnBhcmVudE5vZGU7XG5cbiAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaW5wdXRFbCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSB0aGlzIG1vZHVsZVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmRldGFjaElucHV0RnJvbURvY3VtZW50KCk7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcyk7XG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2tleXVwJywgdGhpcy5ib3VuZE9uS2V5dXApO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdibHVyJywgdGhpcy5ib3VuZE9uQmx1cik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpbnB1dCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlucHV0Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGlucHV0IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IElucHV0IGVsZW1lbnRcbiAgICAgKi9cbiAgICBjcmVhdGVJbnB1dEVsZW1lbnQ6IGZ1bmN0aW9uKGlucHV0Q2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0lOUFVUJyk7XG4gICAgICAgIGlmIChpbnB1dENsYXNzTmFtZSkge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gaW5wdXRDbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwiZG91YmxlQ2xpY2tcIlxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgaW5wdXRFbGVtZW50LCBub2RlSWQ7XG5cbiAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmVkaXRhYmxlQ2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgbm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgICAgICBpbnB1dEVsZW1lbnQgPSB0aGlzLmlucHV0RWxlbWVudDtcbiAgICAgICAgICAgIGlucHV0RWxlbWVudC52YWx1ZSA9IHRyZWUuZ2V0Tm9kZURhdGEobm9kZUlkKVt0aGlzLmRhdGFLZXldIHx8ICcnO1xuICAgICAgICAgICAgdGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGlucHV0RWxlbWVudCwgdGFyZ2V0KTtcbiAgICAgICAgICAgIHRhcmdldC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgaW5wdXRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcjoga2V5dXAgLSBpbnB1dCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBLZXkgZXZlbnRcbiAgICAgKi9cbiAgICBvbktleXVwOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHsgLy8ga2V5dXAgXCJlbnRlclwiXG4gICAgICAgICAgICB0aGlzLnNldERhdGEoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyOiBibHVyIC0gaW5wdXQgZWxlbWVudFxuICAgICAqL1xuICAgIG9uQmx1cjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0RGF0YSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YSBvZiBpbnB1dCBlbGVtZW50IHRvIG5vZGUgYW5kIGRldGFjaCBpbnB1dCBlbGVtZW50IGZyb20gZG9jLlxuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGhpcy5pbnB1dEVsZW1lbnQpLFxuICAgICAgICAgICAgZGF0YSA9IHt9O1xuXG4gICAgICAgIGlmIChub2RlSWQpIHtcbiAgICAgICAgICAgIGRhdGFbdGhpcy5kYXRhS2V5XSA9IHRoaXMuaW5wdXRFbGVtZW50LnZhbHVlO1xuICAgICAgICAgICAgdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGV0YWNoSW5wdXRGcm9tRG9jdW1lbnQoKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0YWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIEFQSV9MSVNUID0gW1xuICAgICAgICAnc2VsZWN0JyxcbiAgICAgICAgJ2dldFNlbGVjdGVkTm9kZUlkJ1xuICAgIF0sXG4gICAgZGVmYXVsdHMgPSB7XG4gICAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lOiAndHVpLXRyZWUtc2VsZWN0ZWQnXG4gICAgfTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgc2VsZWN0YWJsZVxuICogQGNsYXNzIFNlbGVjdGFibGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5zZWxlY3RlZENsYXNzTmFtZSAtIENsYXNzbmFtZSBmb3Igc2VsZWN0ZWQgbm9kZS5cbiAqL1xudmFyIFNlbGVjdGFibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFNlbGVjdGFibGUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgU2VsZWN0YWJsZVxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFQSSBsaXN0IG9mIFNlbGVjdGFibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUgPSBvcHRpb25zLnNlbGVjdGVkQ2xhc3NOYW1lO1xuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZUlkID0gbnVsbDtcblxuICAgICAgICB0cmVlLm9uKHtcbiAgICAgICAgICAgIHNpbmdsZUNsaWNrOiB0aGlzLm9uU2luZ2xlQ2xpY2ssXG4gICAgICAgICAgICBhZnRlckRyYXc6IHRoaXMub25BZnRlckRyYXdcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHRoaXMuX3NldEFQSXMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGFwaXMgb2Ygc2VsZWN0YWJsZSB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0QVBJczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgYmluZCA9IHR1aS51dGlsLmJpbmQ7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgdHJlZVthcGlOYW1lXSA9IGJpbmQodGhpc1thcGlOYW1lXSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgbm9kZUVsZW1lbnQgPSB0aGlzLmdldFByZXZFbGVtZW50KCk7XG5cbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdHJlZVthcGlOYW1lXTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwic2luZ2xlQ2xpY2tcIlxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uU2luZ2xlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0aGlzLnRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICB0aGlzLnNlbGVjdChub2RlSWQsIHRhcmdldCk7XG4gICAgfSxcblxuICAgIC8qIGVzbGludC1kaXNhYmxlIHZhbGlkLWpzZG9jXG4gICAgICAgIElnbm9yZSBcInRhcmdldFwiIHBhcmFtZXRlciBhbm5vdGF0aW9uIGZvciBBUEkgcGFnZVxuICAgICAgICBcInRyZWUuc2VsZWN0KG5vZGVJZClcIlxuICAgICAqL1xuICAgIC8qKlxuICAgICAqIFNlbGVjdCBub2RlIGlmIHRoZSBmZWF0dXJlLVwiU2VsZWN0YWJsZVwiIGlzIGVuYWJsZWQuXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEByZXF1aXJlcyBTZWxlY3RhYmxlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuc2VsZWN0KCd0dWktdHJlZS1ub2RlLTMnKTtcbiAgICAgKi9cbiAgICAvKiBlc2xpbnQtZW5hYmxlIHZhbGlkLWpzZG9jICovXG4gICAgc2VsZWN0OiBmdW5jdGlvbihub2RlSWQsIHRhcmdldCkge1xuICAgICAgICB2YXIgdHJlZSwgcHJldkVsZW1lbnQsIG5vZGVFbGVtZW50LFxuICAgICAgICAgICAgc2VsZWN0ZWRDbGFzc05hbWUsIHByZXZOb2RlSWQ7XG5cbiAgICAgICAgaWYgKCFub2RlSWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHByZXZFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpO1xuICAgICAgICBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lID0gdGhpcy5zZWxlY3RlZENsYXNzTmFtZTtcbiAgICAgICAgcHJldk5vZGVJZCA9IHRoaXMuc2VsZWN0ZWROb2RlSWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlU2VsZWN0XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBTZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmV2Tm9kZUlkIC0gUHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR8dW5kZWZpbmVkfSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlXG4gICAgICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScpXG4gICAgICAgICAqICAub24oJ2JlZm9yZVNlbGVjdCcsIGZ1bmN0aW9uKG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KSB7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3NlbGVjdGVkIG5vZGU6ICcgKyBub2RlSWQpO1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdwcmV2aW91cyBzZWxlY3RlZCBub2RlOiAnICsgcHJldk5vZGVJZCk7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3RhcmdldCBlbGVtZW50OiAnICsgdGFyZ2V0KTtcbiAgICAgICAgICogICAgICByZXR1cm4gZmFsc2U7IC8vIEl0IGNhbmNlbHMgXCJzZWxlY3RcIlxuICAgICAgICAgKiAgICAgIC8vIHJldHVybiB0cnVlOyAvLyBJdCBmaXJlcyBcInNlbGVjdFwiXG4gICAgICAgICAqICB9KTtcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0cmVlLmludm9rZSgnYmVmb3JlU2VsZWN0Jywgbm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpKSB7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHByZXZFbGVtZW50LCBzZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBzZWxlY3RlZENsYXNzTmFtZSk7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFRyZWUjc2VsZWN0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gU2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHByZXZOb2RlSWQgLSBQcmV2aW91cyBzZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR8dW5kZWZpbmVkfSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHRyZWVcbiAgICAgICAgICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScpXG4gICAgICAgICAgICAgKiAgLm9uKCdzZWxlY3QnLCBmdW5jdGlvbihub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCkge1xuICAgICAgICAgICAgICogICAgICBjb25zb2xlLmxvZygnc2VsZWN0ZWQgbm9kZTogJyArIG5vZGVJZCk7XG4gICAgICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdwcmV2aW91cyBzZWxlY3RlZCBub2RlOiAnICsgcHJldk5vZGVJZCk7XG4gICAgICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCd0YXJnZXQgZWxlbWVudDogJyArIHRhcmdldCk7XG4gICAgICAgICAgICAgKiAgfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRyZWUuZmlyZSgnc2VsZWN0Jywgbm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IG5vZGVJZDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBOb2RlIGVsZW1lbnRcbiAgICAgKi9cbiAgICBnZXRQcmV2RWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLnNlbGVjdGVkTm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHJldHVybnMge3N0cmluZ30gc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFNlbGVjdGVkTm9kZUlkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWROb2RlSWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIC0gXCJhZnRlckRyYXdcIlxuICAgICAqL1xuICAgIG9uQWZ0ZXJEcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpO1xuXG4gICAgICAgIGlmIChub2RlRWxlbWVudCkge1xuICAgICAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RhYmxlO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFJlbmRlciB0cmVlIGFuZCB1cGRhdGUgdHJlZS5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXG4gICAgZGVmYXVsdE9wdGlvbiA9IHJlcXVpcmUoJy4vY29uc3RzL2RlZmF1bHRPcHRpb24nKSxcbiAgICBzdGF0ZXMgPSByZXF1aXJlKCcuL2NvbnN0cy9zdGF0ZXMnKSxcbiAgICBtZXNzYWdlcyA9IHJlcXVpcmUoJy4vY29uc3RzL21lc3NhZ2VzJyksXG4gICAgb3V0ZXJUZW1wbGF0ZSA9IHJlcXVpcmUoJy4vY29uc3RzL291dGVyVGVtcGxhdGUnKSxcbiAgICBUcmVlTW9kZWwgPSByZXF1aXJlKCcuL3RyZWVNb2RlbCcpLFxuICAgIFNlbGVjdGFibGUgPSByZXF1aXJlKCcuL2ZlYXR1cmVzL3NlbGVjdGFibGUnKSxcbiAgICBEcmFnZ2FibGUgPSByZXF1aXJlKCcuL2ZlYXR1cmVzL2RyYWdnYWJsZScpLFxuICAgIEVkaXRhYmxlID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9lZGl0YWJsZScpLFxuICAgIENoZWNrYm94ID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9jaGVja2JveCcpLFxuICAgIENvbnRleHRNZW51ID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9jb250ZXh0TWVudScpO1xuXG52YXIgbm9kZVN0YXRlcyA9IHN0YXRlcy5ub2RlLFxuICAgIGZlYXR1cmVzID0ge1xuICAgICAgICBTZWxlY3RhYmxlOiBTZWxlY3RhYmxlLFxuICAgICAgICBEcmFnZ2FibGU6IERyYWdnYWJsZSxcbiAgICAgICAgRWRpdGFibGU6IEVkaXRhYmxlLFxuICAgICAgICBDaGVja2JveDogQ2hlY2tib3gsXG4gICAgICAgIENvbnRleHRNZW51OiBDb250ZXh0TWVudVxuICAgIH0sXG4gICAgc25pcHBldCA9IHR1aS51dGlsLFxuICAgIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kLFxuICAgIFRJTUVPVVRfVE9fRElGRkVSRU5USUFURV9DTElDS19BTkRfREJMQ0xJQ0sgPSAyMDAsXG4gICAgTU9VU0VfTU9WSU5HX1RIUkVTSE9MRCA9IDU7XG4vKipcbiAqIENyZWF0ZSB0cmVlIG1vZGVsIGFuZCBpbmplY3QgZGF0YSB0byBtb2RlbFxuICogQGNsYXNzIFRyZWVcbiAqIEBjb25zdHJ1Y3RvclxuICogQG1peGVzIHR1aS51dGlsLkN1c3RvbUV2ZW50c1xuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgQSBkYXRhIHRvIGJlIHVzZWQgb24gdHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnNcbiAqICAgICBAcGFyYW0ge0hUTUxFbGVtZW50fSBbb3B0aW9ucy5yb290RWxlbWVudF0gUm9vdCBlbGVtZW50IChJdCBzaG91bGQgYmUgJ1VMJyBlbGVtZW50KVxuICogICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5ub2RlSWRQcmVmaXhdIEEgZGVmYXVsdCBwcmVmaXggb2YgYSBub2RlXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLm5vZGVEZWZhdWx0U3RhdGVdIEEgZGVmYXVsdCBzdGF0ZSBvZiBhIG5vZGVcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMudGVtcGxhdGVdIEEgbWFya3VwIHNldCB0byBtYWtlIGVsZW1lbnRcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlLmludGVybmFsTm9kZV0gSFRNTCB0ZW1wbGF0ZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGUubGVhZk5vZGVdIEhUTUwgdGVtcGxhdGVcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuc3RhdGVMYWJlbHNdIFRvZ2dsZSBidXR0b24gc3RhdGUgbGFiZWxcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0YXRlTGFiZWxzLm9wZW5lZF0gU3RhdGUtT1BFTkVEIGxhYmVsIChUZXh0IG9yIEhUTUwpXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5jbG9zZWRdIFN0YXRlLUNMT1NFRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5jbGFzc05hbWVzXSBDbGFzcyBuYW1lcyBmb3IgdHJlZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5ub2RlQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5sZWFmQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgbGVhZiBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLm9wZW5lZENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIG9wZW5lZCBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLmNsb3NlZENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnRleHRDbGFzc10gQSBjbGFzcyBuYW1lIHRoYXQgZm9yIHRleHRFbGVtZW50IGluIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuc3VidHJlZUNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIHN1YnRyZWUgaW4gaW50ZXJuYWwgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzc10gQSBjbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcbiAqICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5yZW5kZXJUZW1wbGF0ZV0gRnVuY3Rpb24gZm9yIHJlbmRlcmluZyB0ZW1wbGF0ZVxuICogQGV4YW1wbGVcbiAqIC8vRGVmYXVsdCBvcHRpb25zOlxuICogLy8ge1xuICogLy8gICAgIG5vZGVJZFByZWZpeDogJ3R1aS10cmVlLW5vZGUtJ1xuICogLy8gICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdjbG9zZWQnLFxuICogLy8gICAgIHN0YXRlTGFiZWxzOiB7XG4gKiAvLyAgICAgICAgIG9wZW5lZDogJy0nLFxuICogLy8gICAgICAgICBjbG9zZWQ6ICcrJ1xuICogLy8gICAgIH0sXG4gKiAvLyAgICAgY2xhc3NOYW1lczoge1xuICogLy8gICAgICAgICBub2RlQ2xhc3M6ICd0dWktdHJlZS1ub2RlJyxcbiAqIC8vICAgICAgICAgbGVhZkNsYXNzOiAndHVpLXRyZWUtbGVhZicsXG4gKiAvLyAgICAgICAgIG9wZW5lZENsYXNzOiAndHVpLXRyZWUtb3BlbmVkJyxcbiAqIC8vICAgICAgICAgY2xvc2VkQ2xhc3M6ICd0dWktdHJlZS1jbG9zZWQnLFxuICogLy8gICAgICAgICBzdWJ0cmVlQ2xhc3M6ICd0dWktdHJlZS1zdWJ0cmVlJyxcbiAqIC8vICAgICAgICAgdG9nZ2xlQnRuQ2xhc3M6ICd0dWktdHJlZS10b2dnbGVCdG4nLFxuICogLy8gICAgICAgICB0ZXh0Q2xhc3M6ICd0dWktdHJlZS10ZXh0JyxcbiAqIC8vICAgICB9LFxuICogLy8gICAgIHRlbXBsYXRlOiB7XG4gKiAvLyAgICAgICAgIGludGVybmFsTm9kZTpcbiAqIC8vICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7c3RhdGVMYWJlbH19PC9idXR0b24+JyArXG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gKiAvLyAgICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+J1xuICogLy8gICAgICAgICBsZWFmTm9kZTpcbiAqIC8vICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAqIC8vICAgICB9XG4gKiAvLyB9XG4gKiAvL1xuICpcbiAqIHZhciBkYXRhID0gW1xuICogICAgIHt0ZXh0OiAncm9vdEEnLCBjaGlsZHJlbjogW1xuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMUEnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFCJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQyd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMUQnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJBJywgY2hpbGRyZW46IFtcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWJfMUEnLCBjaGlsZHJlbjpbXG4gKiAgICAgICAgICAgICAgICAge3RleHQ6J3N1Yl9zdWJfMUEnfVxuICogICAgICAgICAgICAgXX0sXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViXzJBJ31cbiAqICAgICAgICAgXX0sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQid9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkMnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJEJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zQScsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViM19hJ30sXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViM19iJ31cbiAqICAgICAgICAgXX0sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zQid9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0MnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNEJ31cbiAqICAgICBdfSxcbiAqICAgICB7dGV4dDogJ3Jvb3RCJywgY2hpbGRyZW46IFtcbiAqICAgICAgICAge3RleHQ6J0Jfc3ViMSd9LFxuICogICAgICAgICB7dGV4dDonQl9zdWIyJ30sXG4gKiAgICAgICAgIHt0ZXh0OidiJ31cbiAqICAgICBdfVxuICogXTtcbiAqXG4gKiB2YXIgdHJlZTEgPSBuZXcgdHVpLmNvbXBvbmVudC5UcmVlKGRhdGEsIHtcbiAqICAgICByb290RWxlbWVudDogJ3RyZWVSb290JywgLy8gb3IgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyZWVSb290JylcbiAqICAgICBub2RlRGVmYXVsdFN0YXRlOiAnb3BlbmVkJyxcbiAqXG4gKiAgICAgLy8gPT09PT09PT09IE9wdGlvbjogT3ZlcnJpZGUgdGVtcGxhdGUgcmVuZGVyZXIgPT09PT09PT09PT1cbiAqXG4gKiAgICAgdGVtcGxhdGU6IHsgLy8gdGVtcGxhdGUgZm9yIE11c3RhY2hlIGVuZ2luZVxuICogICAgICAgICBpbnRlcm5hbE5vZGU6XG4gKiAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3tzdGF0ZUxhYmVsfX19PC9idXR0b24+JyArXG4gKiAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t7dGV4dH19fTwvc3Bhbj4nICtcbiAqICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e3N1YnRyZWVDbGFzc319XCI+e3t7Y2hpbGRyZW59fX08L3VsPidcbiAqICAgICAgICAgbGVhZk5vZGU6XG4gKiAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t7dGV4dH19fTwvc3Bhbj4nICtcbiAqICAgICB9LFxuICogICAgIHJlbmRlclRlbXBsYXRlOiBmdW5jdGlvbihzb3VyY2UsIHByb3BzKSB7XG4gKiAgICAgICAgIC8vIE11c3RhY2hlIHRlbXBsYXRlIGVuZ2luZVxuICogICAgICAgICByZXR1cm4gTXVzdGFjaGUucmVuZGVyKHRlbXBsYXRlLCBwcm9wcyk7XG4gKiAgICAgfVxuICogfSk7XG4gKiovXG52YXIgVHJlZSA9IHNuaXBwZXQuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCBjbGFzcyBuYW1lc1xuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNsYXNzTmFtZXMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb24uY2xhc3NOYW1lcywgb3B0aW9ucy5jbGFzc05hbWVzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCB0ZW1wbGF0ZVxuICAgICAgICAgKiBAdHlwZSB7e2ludGVybmFsTm9kZTogc3RyaW5nLCBsZWFmTm9kZTogc3RyaW5nfX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb24udGVtcGxhdGUsIG9wdGlvbnMudGVtcGxhdGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSb290IGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IG9wdGlvbnMucm9vdEVsZW1lbnQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRvZ2dsZSBidXR0b24gc3RhdGUgbGFiZWxcbiAgICAgICAgICogQHR5cGUge3tvcGVuZWQ6IHN0cmluZywgY2xvc2VkOiBzdHJpbmd9fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zdGF0ZUxhYmVscyA9IG9wdGlvbnMuc3RhdGVMYWJlbHM7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ha2UgdHJlZSBtb2RlbFxuICAgICAgICAgKiBAdHlwZSB7VHJlZU1vZGVsfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tb2RlbCA9IG5ldyBUcmVlTW9kZWwoZGF0YSwgb3B0aW9ucyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVuYWJsZWQgZmVhdHVyZXNcbiAgICAgICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCBvYmplY3Q+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lbmFibGVkRmVhdHVyZXMgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xpY2sgdGltZXIgdG8gcHJldmVudCBjbGljay1kdXBsaWNhdGlvbiB3aXRoIGRvdWJsZSBjbGlja1xuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVG8gcHJldmVudCBjbGljayBldmVudCBpZiBtb3VzZSBtb3ZlZCBiZWZvcmUgbW91c2V1cC5cbiAgICAgICAgICogQHR5cGUge251bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX21vdXNlTW92aW5nRmxhZyA9IGZhbHNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW5kZXIgdGVtcGxhdGVcbiAgICAgICAgICogSXQgY2FuIGJlIG92ZXJyb2RlIGJ5IHVzZXIncyB0ZW1wbGF0ZSBlbmdpbmUuXG4gICAgICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3JlbmRlclRlbXBsYXRlID0gb3B0aW9ucy5yZW5kZXJUZW1wbGF0ZSB8fCB1dGlsLnJlbmRlclRlbXBsYXRlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcnVlIHdoZW4gYSBub2RlIGlzIG1vdmluZ1xuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKHtcbiAgICAgICAgICogICAgIGJlZm9yZURyYXc6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgKiAgICAgICAgIGlmICh0cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAqICAgICAgICAgfVxuICAgICAgICAgKiAgICAgICAgIC8vLi5cbiAgICAgICAgICogICAgIH0sXG4gICAgICAgICAqICAgICAvLy4uLi5cbiAgICAgICAgICogfSk7XG4gICAgICAgICAqIHRyZWUubW92ZSgndHVpLXRyZWUtbm9kZS0xJywgJ3R1aS10cmVlLW5vZGUtMicpO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc01vdmluZ05vZGUgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9zZXRSb290KCk7XG4gICAgICAgIHRoaXMuX2RyYXcodGhpcy5nZXRSb290Tm9kZUlkKCkpO1xuICAgICAgICB0aGlzLl9zZXRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJvb3QgZWxlbWVudCBvZiB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Um9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByb290RWwgPSB0aGlzLnJvb3RFbGVtZW50O1xuXG4gICAgICAgIGlmIChzbmlwcGV0LmlzU3RyaW5nKHJvb3RFbCkpIHtcbiAgICAgICAgICAgIHJvb3RFbCA9IHRoaXMucm9vdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChyb290RWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzbmlwcGV0LmlzSFRNTE5vZGUocm9vdEVsKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2VzLklOVkFMSURfUk9PVF9FTEVNRU5UKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcmlnaW5hbFBhcmVudElkIC0gT3JpZ2luYWwgcGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4XSAtIFN0YXJ0IGluZGV4IG51bWJlciBmb3IgaW5zZXJ0aW5nXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Nb3ZlOiBmdW5jdGlvbihub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkLCBpbmRleCkge1xuICAgICAgICB0aGlzLl9kcmF3KG9yaWdpbmFsUGFyZW50SWQpO1xuICAgICAgICB0aGlzLl9kcmF3KG5ld1BhcmVudElkKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNtb3ZlXG4gICAgICAgICAqIEBwYXJhbSB7e25vZGVJZDogc3RyaW5nLCBvcmlnaW5hbFBhcmVudElkOiBzdHJpbmcsIG5ld1BhcmVudElkOiBzdHJpbmcsIGluZGV4OiBudW1iZXJ9fSB0cmVlRXZlbnQgLSBFdmVudFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdtb3ZlJywgZnVuY3Rpb24odHJlZUV2ZW50KSB7XG4gICAgICAgICAqICAgICB2YXIgbm9kZUlkID0gdHJlZUV2ZW50Lm5vZGVJZCxcbiAgICAgICAgICogICAgICAgICBvcmlnaW5hbFBhcmVudElkID0gdHJlZUV2ZW50Lm9yaWdpbmFsUGFyZW50SWQsXG4gICAgICAgICAqICAgICAgICAgbmV3UGFyZW50SWQgPSB0cmVlRXZlbnQubmV3UGFyZW50SWQsXG4gICAgICAgICAqICAgICAgICAgaW5kZXggPSB0cmVlRXZlbnQuaW5kZXg7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZyhub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkLCBpbmRleCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywge1xuICAgICAgICAgICAgbm9kZUlkOiBub2RlSWQsXG4gICAgICAgICAgICBvcmlnaW5hbFBhcmVudElkOiBvcmlnaW5hbFBhcmVudElkLFxuICAgICAgICAgICAgbmV3UGFyZW50SWQ6IG5ld1BhcmVudElkLFxuICAgICAgICAgICAgaW5kZXg6IGluZGV4XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZXZlbnQgaGFuZGxlcnNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLm9uKHtcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5fZHJhdyxcbiAgICAgICAgICAgIG1vdmU6IHRoaXMuX29uTW92ZVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdjbGljaycsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkNsaWNrLCB0aGlzKSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnbW91c2Vkb3duJywgc25pcHBldC5iaW5kKHRoaXMuX29uTW91c2Vkb3duLCB0aGlzKSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnZGJsY2xpY2snLCBzbmlwcGV0LmJpbmQodGhpcy5fb25Eb3VibGVDbGljaywgdGhpcykpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290RWxlbWVudCwgJ2NvbnRleHRtZW51Jywgc25pcHBldC5iaW5kKHRoaXMuX29uQ29udGV4dE1lbnUsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGNvbnRleHRtZW51XG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBtb3VzZUV2ZW50IC0gQ29udGV4dG1lbnUgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNvbnRleHRNZW51OiBmdW5jdGlvbihtb3VzZUV2ZW50KSB7XG4gICAgICAgIHRoaXMuZmlyZSgnY29udGV4dG1lbnUnLCBtb3VzZUV2ZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZG93bkV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbk1vdXNlZG93bjogZnVuY3Rpb24oZG93bkV2ZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIGNsaWVudFggPSBkb3duRXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGNsaWVudFkgPSBkb3duRXZlbnQuY2xpZW50WSxcbiAgICAgICAgICAgIGFicyA9IE1hdGguYWJzO1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uTW91c2VNb3ZlKG1vdmVFdmVudCkge1xuICAgICAgICAgICAgdmFyIG5ld0NsaWVudFggPSBtb3ZlRXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICBuZXdDbGllbnRZID0gbW92ZUV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGlmIChhYnMobmV3Q2xpZW50WCAtIGNsaWVudFgpICsgYWJzKG5ld0NsaWVudFkgLSBjbGllbnRZKSA+IE1PVVNFX01PVklOR19USFJFU0hPTEQpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmZpcmUoJ21vdXNlbW92ZScsIG1vdmVFdmVudCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fbW91c2VNb3ZpbmdGbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvbk1vdXNlVXAodXBFdmVudCkge1xuICAgICAgICAgICAgc2VsZi5maXJlKCdtb3VzZXVwJywgdXBFdmVudCk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Nb3VzZU91dChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRvRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNlbGYuZmlyZSgnbW91c2V1cCcsIGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX21vdXNlTW92aW5nRmxhZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZpcmUoJ21vdXNlZG93bicsIGRvd25FdmVudCk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBjbGlja1xuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBDbGljayBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3MpKSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZSh0aGlzLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCkpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuY2xpY2tUaW1lciAmJiAhdGhpcy5fbW91c2VNb3ZpbmdGbGFnKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3NpbmdsZUNsaWNrJywgZXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlc2V0Q2xpY2tUaW1lcigpO1xuICAgICAgICAgICAgfSwgVElNRU9VVF9UT19ESUZGRVJFTlRJQVRFX0NMSUNLX0FORF9EQkxDTElDSyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGRvdWJsZSBjbGljayAoZGJsY2xpY2spXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIERvdWJsZSBjbGljayBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuZmlyZSgnZG91YmxlQ2xpY2snLCBldmVudCk7XG4gICAgICAgIHRoaXMucmVzZXRDbGlja1RpbWVyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBub2RlIHN0YXRlIC0gb3BlbmVkIG9yIGNsb3NlZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTm9kZSBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlKSB7XG4gICAgICAgIHZhciBzdWJ0cmVlRWxlbWVudCA9IHRoaXMuX2dldFN1YnRyZWVFbGVtZW50KG5vZGVJZCksXG4gICAgICAgICAgICBsYWJlbCwgYnRuRWxlbWVudCwgbm9kZUVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCFzdWJ0cmVlRWxlbWVudCB8fCBzdWJ0cmVlRWxlbWVudCA9PT0gdGhpcy5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxhYmVsID0gdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV07XG4gICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgYnRuRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgIG5vZGVFbGVtZW50LFxuICAgICAgICAgICAgdGhpcy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzXG4gICAgICAgIClbMF07XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBub2RlU3RhdGVzLk9QRU5FRCkge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlKG5vZGVFbGVtZW50LCBzdGF0ZSk7XG5cbiAgICAgICAgaWYgKGJ0bkVsZW1lbnQpIHtcbiAgICAgICAgICAgIGJ0bkVsZW1lbnQuaW5uZXJIVE1MID0gbGFiZWw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG5vZGUgY2xhc3MgbmFtZSBmcm9tIHByb3ZpZGVkIHN0YXRlXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZUVsZW1lbnQgLSBUcmVlTm9kZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTmV3IGNoYW5nZWQgc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlOiBmdW5jdGlvbihub2RlRWxlbWVudCwgc3RhdGUpIHtcbiAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXMsXG4gICAgICAgICAgICBvcGVuZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuT1BFTkVEICsgJ0NsYXNzJ10sXG4gICAgICAgICAgICBjbG9zZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuQ0xPU0VEICsgJ0NsYXNzJ107XG5cbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgb3BlbmVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgY2xvc2VkQ2xhc3NOYW1lKTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgY2xhc3NOYW1lc1tzdGF0ZSArICdDbGFzcyddKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGh0bWxcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBub2RlSWRzIC0gTm9kZSBpZCBsaXN0XG4gICAgICogQHJldHVybnMge3N0cmluZ30gSFRNTFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHNlZSBvdXRlclRlbXBsYXRlIHVzZXMgXCJ1dGlsLnJlbmRlclRlbXBsYXRlXCJcbiAgICAgKi9cbiAgICBfbWFrZUh0bWw6IGZ1bmN0aW9uKG5vZGVJZHMpIHtcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbCxcbiAgICAgICAgICAgIGh0bWwgPSAnJztcblxuICAgICAgICBzbmlwcGV0LmZvckVhY2gobm9kZUlkcywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IG1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgICAgICBzb3VyY2VzLCBwcm9wcztcblxuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzb3VyY2VzID0gdGhpcy5fZ2V0VGVtcGxhdGUobm9kZSk7XG4gICAgICAgICAgICBwcm9wcyA9IHRoaXMuX21ha2VUZW1wbGF0ZVByb3BzKG5vZGUpO1xuICAgICAgICAgICAgcHJvcHMuaW5uZXJUZW1wbGF0ZSA9IHRoaXMuX21ha2VJbm5lckhUTUwobm9kZSwge1xuICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlcy5pbm5lcixcbiAgICAgICAgICAgICAgICBwcm9wczogcHJvcHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaHRtbCArPSB1dGlsLnJlbmRlclRlbXBsYXRlKHNvdXJjZXMub3V0ZXIsIHByb3BzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgaW5uZXIgaHRtbCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcGFyYW0ge3tzb3VyY2U6IHN0cmluZywgcHJvcHM6IE9iamVjdH19IFtjYWNoZWRdIC0gQ2FzaGVkIGRhdGEgdG8gbWFrZSBodG1sXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSW5uZXIgaHRtbCBvZiBub2RlXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAc2VlIGlubmVyVGVtcGxhdGUgdXNlcyBcInRoaXMuX3JlbmRlclRlbXBsYXRlXCJcbiAgICAgKi9cbiAgICBfbWFrZUlubmVySFRNTDogZnVuY3Rpb24obm9kZSwgY2FjaGVkKSB7XG4gICAgICAgIHZhciBzb3VyY2UsIHByb3BzO1xuXG4gICAgICAgIGNhY2hlZCA9IGNhY2hlZCB8fCB7fTtcbiAgICAgICAgc291cmNlID0gY2FjaGVkLnNvdXJjZSB8fCB0aGlzLl9nZXRUZW1wbGF0ZShub2RlKS5pbm5lcjtcbiAgICAgICAgcHJvcHMgPSBjYWNoZWQucHJvcHMgfHwgdGhpcy5fbWFrZVRlbXBsYXRlUHJvcHMobm9kZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlclRlbXBsYXRlKHNvdXJjZSwgcHJvcHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGVtcGxhdGUgc291cmNlc1xuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHJldHVybnMge3tpbm5lcjogc3RyaW5nLCBvdXRlcjogc3RyaW5nfX0gVGVtcGxhdGUgc291cmNlc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFRlbXBsYXRlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBzb3VyY2U7XG5cbiAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHNvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICBpbm5lcjogdGhpcy50ZW1wbGF0ZS5sZWFmTm9kZSxcbiAgICAgICAgICAgICAgICBvdXRlcjogb3V0ZXJUZW1wbGF0ZS5MRUFGX05PREVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VyY2UgPSB7XG4gICAgICAgICAgICAgICAgaW5uZXI6IHRoaXMudGVtcGxhdGUuaW50ZXJuYWxOb2RlLFxuICAgICAgICAgICAgICAgIG91dGVyOiBvdXRlclRlbXBsYXRlLklOVEVSTkFMX05PREVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291cmNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRlbXBsYXRlIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBub2RlIC0gTm9kZVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRlbXBsYXRlIHByb3BlcnRpZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlVGVtcGxhdGVQcm9wczogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcbiAgICAgICAgICAgIHByb3BzLCBzdGF0ZTtcblxuICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IG5vZGUuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICBpc0xlYWY6IHRydWUgLy8gZm9yIGN1c3RvbSB0ZW1wbGF0ZSBtZXRob2RcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKTtcbiAgICAgICAgICAgIHByb3BzID0ge1xuICAgICAgICAgICAgICAgIGlkOiBub2RlLmdldElkKCksXG4gICAgICAgICAgICAgICAgc3RhdGVDbGFzczogY2xhc3NOYW1lc1tzdGF0ZSArICdDbGFzcyddLFxuICAgICAgICAgICAgICAgIHN0YXRlTGFiZWw6IHRoaXMuc3RhdGVMYWJlbHNbc3RhdGVdLFxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiB0aGlzLl9tYWtlSHRtbChub2RlLmdldENoaWxkSWRzKCkpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4dGVuZChwcm9wcywgY2xhc3NOYW1lcywgbm9kZS5nZXRBbGxEYXRhKCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEcmF3IGVsZW1lbnQgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXG4gICAgICAgICAgICBlbGVtZW50LCBodG1sO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlRHJhd1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdiZWZvcmVEcmF3JywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAqICAgICBpZiAodHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICogICAgICAgICBjb25zb2xlLmxvZygnaXNNb3ZpbmdOb2RlJyk7XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZygnYmVmb3JlRHJhdzogJyArIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdiZWZvcmVEcmF3Jywgbm9kZUlkKTtcblxuICAgICAgICBpZiAobm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgaHRtbCA9IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5yb290RWxlbWVudDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGh0bWwgPSB0aGlzLl9tYWtlSW5uZXJIVE1MKG5vZGUpO1xuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLl9zZXRDbGFzc1dpdGhEaXNwbGF5KG5vZGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2FmdGVyRHJhd1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdhZnRlckRyYXcnLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgIGlmICh0cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCdpc01vdmluZ05vZGUnKTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCdhZnRlckRyYXc6ICcgKyBub2RlSWQpO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlyZSgnYWZ0ZXJEcmF3Jywgbm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNsYXNzIGFuZCBkaXNwbGF5IG9mIG5vZGUgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q2xhc3NXaXRoRGlzcGxheTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgbm9kZUlkID0gbm9kZS5nZXRJZCgpLFxuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCksXG4gICAgICAgICAgICBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzO1xuXG4gICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZXMub3BlbmVkQ2xhc3MpO1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhlbGVtZW50LCBjbGFzc05hbWVzLmNsb3NlZENsYXNzKTtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5sZWFmQ2xhc3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBub2RlLmdldFN0YXRlKCkpO1xuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0Q2xhc3NXaXRoRGlzcGxheShjaGlsZCk7XG4gICAgICAgICAgICB9LCBub2RlSWQsIHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzdWJ0cmVlIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVHJlZU5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFN1YnRyZWUgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN1YnRyZWVFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50O1xuXG4gICAgICAgIGlmICghbm9kZSB8fCBub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB1dGlsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKSxcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZXMuc3VidHJlZUNsYXNzXG4gICAgICAgICAgICApWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1YnRyZWVFbGVtZW50O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGRlcHRoIG9mIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfHVuZGVmaW5lZH0gRGVwdGhcbiAgICAgKi9cbiAgICBnZXREZXB0aDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldERlcHRoKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgbGFzdCBkZXB0aCBvZiB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IExhc3QgZGVwdGhcbiAgICAgKi9cbiAgICBnZXRMYXN0RGVwdGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRMYXN0RGVwdGgoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHJvb3Qgbm9kZSBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSb290IG5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRSb290Tm9kZUlkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwucm9vdE5vZGUuZ2V0SWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGNoaWxkIGlkc1xuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPnx1bmRlZmluZWR9IENoaWxkIGlkc1xuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHBhcmVudCBpZCBvZiBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFBhcmVudCBpZFxuICAgICAqL1xuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0UGFyZW50SWQobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgY2xpY2sgdGltZXJcbiAgICAgKi9cbiAgICByZXNldENsaWNrVGltZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuY2xpY2tUaW1lcik7XG4gICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIGlkIGZyb20gZWxlbWVudFxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gRWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQoZWxlbWVudEluTm9kZSk7IC8vICd0dWktdHJlZS1ub2RlLTMnXG4gICAgICovXG4gICAgZ2V0Tm9kZUlkRnJvbUVsZW1lbnQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGlkUHJlZml4ID0gdGhpcy5nZXROb2RlSWRQcmVmaXgoKTtcblxuICAgICAgICB3aGlsZSAoZWxlbWVudCAmJiBlbGVtZW50LmlkLmluZGV4T2YoaWRQcmVmaXgpID09PSAtMSkge1xuICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5pZCA6ICcnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcHJlZml4IG9mIG5vZGUgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUHJlZml4IG9mIG5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0Tm9kZUlkUHJlZml4KCk7IC8vICd0dWktdHJlZS1ub2RlLSdcbiAgICAgKi9cbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXROb2RlSWRQcmVmaXgoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtvYmplY3R8dW5kZWZpbmVkfSBOb2RlIGRhdGFcbiAgICAgKi9cbiAgICBnZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVEYXRhKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkYXRhIHByb3BlcnRpZXMgb2YgYSBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBQcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqIEBleG1hcGxlXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIHtmb286ICdiYXInfSk7IC8vIGF1dG8gcmVmcmVzaFxuICAgICAqIHRyZWUuc2V0Tm9kZURhdGEobm9kZUlkLCB7Zm9vOiAnYmFyJ30sIHRydWUpOyAvLyBub3QgcmVmcmVzaFxuICAgICAqL1xuICAgIHNldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIGRhdGEsIGlzU2lsZW50KSB7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0Tm9kZURhdGEobm9kZUlkLCBkYXRhLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0gbmFtZXMgLSBOYW1lcyBvZiBwcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsICdmb28nKTsgLy8gYXV0byByZWZyZXNoXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsICdmb28nLCB0cnVlKTsgLy8gbm90IHJlZnJlc2hcbiAgICAgKi9cbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBuYW1lcywgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmVOb2RlRGF0YShub2RlSWQsIG5hbWVzLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIHN0YXRlLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH0gTm9kZSBzdGF0ZSgoJ29wZW5lZCcsICdjbG9zZWQnLCBudWxsKVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXRTdGF0ZShub2RlSWQpOyAvLyAnb3BlbmVkJywgJ2Nsb3NlZCcsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAvLyB1bmRlZmluZWQgaWYgdGhlIG5vZGUgaXMgbm9uZXhpc3RlbnRcbiAgICAgKi9cbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlLmdldFN0YXRlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE9wZW4gbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqL1xuICAgIG9wZW46IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3RhdGUgPSBub2RlU3RhdGVzLk9QRU5FRDtcblxuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgbm9kZS5zZXRTdGF0ZShzdGF0ZSk7XG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICovXG4gICAgY2xvc2U6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3RhdGUgPSBub2RlU3RhdGVzLkNMT1NFRDtcblxuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgbm9kZS5zZXRTdGF0ZShzdGF0ZSk7XG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqL1xuICAgIHRvZ2dsZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXG4gICAgICAgICAgICBzdGF0ZTtcblxuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgbm9kZS50b2dnbGVTdGF0ZSgpO1xuICAgICAgICAgICAgc3RhdGUgPSBub2RlLmdldFN0YXRlKCk7XG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTb3J0IGFsbCBub2Rlc1xuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIC0gQ29tcGFyYXRvciBmb3Igc29ydGluZ1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IHRyZWVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIFNvcnQgd2l0aCByZWRyYXdpbmcgdHJlZVxuICAgICAqIHRyZWUuc29ydChmdW5jdGlvbihub2RlQSwgbm9kZUIpIHtcbiAgICAgKiAgICAgdmFyIGFWYWx1ZSA9IG5vZGVBLmdldERhdGEoJ3RleHQnKSxcbiAgICAgKiAgICAgICAgIGJWYWx1ZSA9IG5vZGVCLmdldERhdGEoJ3RleHQnKTtcbiAgICAgKlxuICAgICAqICAgICBpZiAoIWJWYWx1ZSB8fCAhYlZhbHVlLmxvY2FsZUNvbXBhcmUpIHtcbiAgICAgKiAgICAgICAgIHJldHVybiAwO1xuICAgICAqICAgICB9XG4gICAgICogICAgIHJldHVybiBiVmFsdWUubG9jYWxlQ29tcGFyZShhVmFsdWUpO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogLy8gU29ydCwgYnV0IG5vdCByZWRyYXcgdHJlZVxuICAgICAqIHRyZWUuc29ydChmdW5jdGlvbihub2RlQSwgbm9kZUIpIHtcbiAgICAgKiAgICAgdmFyIGFWYWx1ZSA9IG5vZGVBLmdldERhdGEoJ3RleHQnKSxcbiAgICAgKiAgICAgICAgIGJWYWx1ZSA9IG5vZGVCLmdldERhdGEoJ3RleHQnKTtcbiAgICAgKlxuICAgICAqICAgICBpZiAoIWJWYWx1ZSB8fCAhYlZhbHVlLmxvY2FsZUNvbXBhcmUpIHtcbiAgICAgKiAgICAgICAgIHJldHVybiAwO1xuICAgICAqICAgICB9XG4gICAgICogICAgIHJldHVybiBiVmFsdWUubG9jYWxlQ29tcGFyZShhVmFsdWUpO1xuICAgICAqIH0sIHRydWUpO1xuICAgICAqL1xuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IsIGlzU2lsZW50KSB7XG4gICAgICAgIHRoaXMubW9kZWwuc29ydChjb21wYXJhdG9yKTtcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVmcmVzaCB0cmVlIG9yIG5vZGUncyBjaGlsZHJlblxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW25vZGVJZF0gLSBUcmVlTm9kZSBpZCB0byByZWZyZXNoXG4gICAgICovXG4gICAgcmVmcmVzaDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIG5vZGVJZCA9IG5vZGVJZCB8fCB0aGlzLmdldFJvb3ROb2RlSWQoKTtcbiAgICAgICAgdGhpcy5fZHJhdyhub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIG5vZGVzLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZWFjaEFsbChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcbiAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZS5nZXRJZCgpID09PSBub2RlSWQpOyAvLyB0cnVlXG4gICAgICogfSk7XG4gICAgICovXG4gICAgZWFjaEFsbDogZnVuY3Rpb24oaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoQWxsKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBkZXNjZW5kYW50cyBvZiBhIG5vZGUuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLmVhY2goZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICogICAgIGNvbnNvbGUubG9nKG5vZGUuZ2V0SWQoKSA9PT0gbm9kZUlkKTsgLy8gdHJ1ZVxuICAgICAqIH0sIHBhcmVudElkKTtcbiAgICAgKlxuICAgICAqL1xuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCkge1xuICAgICAgICB0aGlzLm1vZGVsLmVhY2goaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIG5vZGUocykuXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3LWRhdGFcbiAgICAgKiBAcGFyYW0geyp9IFtwYXJlbnRJZF0gLSBQYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQWRkZWQgbm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIGFkZCBub2RlIHdpdGggcmVkcmF3aW5nXG4gICAgICogdmFyIGZpcnN0QWRkZWRJZHMgPSB0cmVlLmFkZCh7dGV4dDonRkUgZGV2ZWxvcG1lbnQgdGVhbTEnfSwgcGFyZW50SWQpO1xuICAgICAqIGNvbnNvbGUubG9nKGZpcnN0QWRkZWRJZHMpOyAvLyBbXCJ0dWktdHJlZS1ub2RlLTEwXCJdXG4gICAgICpcbiAgICAgKiAvLyBhZGQgbm9kZSB3aXRob3V0IHJlZHJhd2luZ1xuICAgICAqIHZhciBzZWNvbmRBZGRlZElkcyA9IHRyZWUuYWRkKFtcbiAgICAgKiAgICB7dGV4dDogJ0ZFIGRldmVsb3BtZW50IHRlYW0yJ30sXG4gICAgICogICAge3RleHQ6ICdGRSBkZXZlbG9wbWVudCB0ZWFtMyd9XG4gICAgICogXSwgcGFyZW50SWQsIHRydWUpO1xuICAgICAqIGNvbnNvbGUubG9nKHNlY29uZEFkZGVkSWRzKTsgLy8gW1widHVpLXRyZWUtbm9kZS0xMVwiLCBcInR1aS10cmVlLW5vZGUtMTJcIl1cbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5hZGQoZGF0YSwgcGFyZW50SWQsIGlzU2lsZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgYWxsIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXcgZGF0YSBmb3IgYWxsIG5vZGVzXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZXNldEFsbERhdGEoW1xuICAgICAqICB7dGV4dDogJ2hlbGxvJywgY2hpbGRyZW46IFtcbiAgICAgKiAgICAgIHt0ZXh0OiAnZm9vJ30sXG4gICAgICogICAgICB7dGV4dDogJ2Jhcid9XG4gICAgICogIF19LFxuICAgICAqICB7dGV4dDogJ3dvbHJkJ31cbiAgICAgKiBdKTtcbiAgICAgKi9cbiAgICByZXNldEFsbERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxDaGlsZHJlbih0aGlzLmdldFJvb3ROb2RlSWQoKSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYWxsIGNoaWxkcmVuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IHRoZSBub2RlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLnJlbW92ZUFsbENoaWxkcmVuKG5vZGVJZCk7IC8vIFJlZHJhd3MgdGhlIG5vZGVcbiAgICAgKiB0cmVlLnJlbW92ZUFsbENoaWxkcmVuKG5vZElkLCB0cnVlKTsgLy8gRG9lc24ndCByZWRyYXcgdGhlIG5vZGVcbiAgICAgKi9cbiAgICByZW1vdmVBbGxDaGlsZHJlbjogZnVuY3Rpb24obm9kZUlkLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmdldENoaWxkSWRzKG5vZGVJZCk7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGRJZCkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoY2hpbGRJZCwgdHJ1ZSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2RyYXcobm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBub2RlIHdpdGggY2hpbGRyZW4uXG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLnJlbW92ZShteU5vZGVJZCk7IC8vIHJlbW92ZSBub2RlIHdpdGggcmVkcmF3aW5nXG4gICAgICogdHJlZS5yZW1vdmUobXlOb2RlSWQsIHRydWUpOyAvLyByZW1vdmUgbm9kZSB3aXRob3V0IHJlZHJhd2luZ1xuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24obm9kZUlkLCBpc1NpbGVudCkge1xuICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZShub2RlSWQsIGlzU2lsZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTW92ZSBhIG5vZGUgdG8gbmV3IHBhcmVudFxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBJbmRleCBudW1iZXIgb2Ygc2VsZWN0ZWQgbm9kZVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLm1vdmUobXlOb2RlSWQsIG5ld1BhcmVudElkKTsgLy8gbW9kZSBub2RlIHdpdGggcmVkcmF3aW5nXG4gICAgICogdHJlZS5tb3ZlKG15Tm9kZUlkLCBuZXdQYXJlbnRJZCwgdHJ1ZSk7IC8vIG1vdmUgbm9kZSB3aXRob3V0IHJlZHJhd2luZ1xuICAgICAqL1xuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIGluZGV4LCBpc1NpbGVudCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVNb3ZlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBDdXJyZW50IGRyYWdnaW5nIG5vZGUgaWRcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gTmV3IHBhcmVudCBpZFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlXG4gICAgICAgICAqIFx0LmVuYWJsZUZlYXR1cmUoJ0RyYWdnYWJsZScpXG4gICAgICAgICAqIFx0Lm9uKCdiZWZvcmVNb3ZlJywgZnVuY3Rpb24obm9kZUlkLCBwYXJlbnRJZCkge1xuICAgICAgICAgKiAgXHRjb25zb2xlLmxvZygnZHJhZ2dpbmcgbm9kZTogJyArIG5vZGVJZCk7XG4gICAgICAgICAqICBcdGNvbnNvbGUubG9nKCdwYXJlbnQgbm9kZTogJyArIHBhcmVudElkJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICBcdHJldHVybiBmYWxzZTsgLy8gQ2FuY2VsIFwibW92ZVwiIGV2ZW50XG4gICAgICAgICAqICBcdC8vIHJldHVybiB0cnVlOyAvLyBGaXJlIFwibW92ZVwiIGV2ZW50XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCF0aGlzLmludm9rZSgnYmVmb3JlTW92ZScsIG5vZGVJZCwgbmV3UGFyZW50SWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzTW92aW5nTm9kZSA9IHRydWU7XG4gICAgICAgIHRoaXMubW9kZWwubW92ZShub2RlSWQsIG5ld1BhcmVudElkLCBpbmRleCwgaXNTaWxlbnQpO1xuICAgICAgICB0aGlzLmlzTW92aW5nTm9kZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2ggbm9kZSBpZHMgYnkgcGFzc2luZyB0aGUgcHJlZGljYXRlIGNoZWNrIG9yIG1hdGNoaW5nIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R9IHByZWRpY2F0ZSAtIFByZWRpY2F0ZSBvciBkYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgcHJlZGljYXRlXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBOb2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gc2VhcmNoIGZyb20gcHJlZGljYXRlXG4gICAgICogdmFyIGxlYWZOb2RlSWRzID0gdHJlZS5zZWFyY2goZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICogICAgIHJldHVybiBub2RlLmlzTGVhZigpO1xuICAgICAqIH0pO1xuICAgICAqIGNvbnNvbGUubG9nKGxlYWZOb2RlSWRzKTsgLy8gWyd0dWktdHJlZS1ub2RlLTMnLCAndHVpLXRyZWUtbm9kZS01J11cbiAgICAgKlxuICAgICAqIC8vIHNlYXJjaCBmcm9tIGRhdGFcbiAgICAgKiB2YXIgc3BlY2lhbE5vZGVJZHMgPSB0cmVlLnNlYXJjaCh7XG4gICAgICogICAgIGlzU3BlY2lhbDogdHJ1ZSxcbiAgICAgKiAgICAgZm9vOiAnYmFyJ1xuICAgICAqIH0pO1xuICAgICAqIGNvbnNvbGUubG9nKHNwZWNpYWxOb2RlSWRzKTsgLy8gWyd0dWktdHJlZS1ub2RlLTUnLCAndHVpLXRyZWUtbm9kZS0xMCddXG4gICAgICogY29uc29sZS5sb2codHJlZS5nZXROb2RlRGF0YSgndHVpLXRyZWUtbm9kZS01JykuaXNTcGVjaWFsKTsgLy8gdHJ1ZVxuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuZ2V0Tm9kZURhdGEoJ3R1aS10cmVlLW5vZGUtNScpLmZvbyk7IC8vICdiYXInXG4gICAgICovXG4gICAgc2VhcmNoOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKCFzbmlwcGV0LmlzT2JqZWN0KHByZWRpY2F0ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzbmlwcGV0LmlzRnVuY3Rpb24ocHJlZGljYXRlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3doZXJlKHByZWRpY2F0ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlYXJjaCBub2RlIGlkcyBieSBtYXRjaGluZyBkYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gRGF0YVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF93aGVyZTogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcihmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhID0gbm9kZS5nZXRBbGxEYXRhKCk7XG5cbiAgICAgICAgICAgIHNuaXBwZXQuZm9yRWFjaChwcm9wcywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChrZXkgaW4gZGF0YSkgJiYgKGRhdGFba2V5XSA9PT0gdmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIG5vZGUgaWRzIGJ5IHBhc3NpbmcgdGhlIHByZWRpY2F0ZSBjaGVja1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSAtIFByZWRpY2F0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIHByZWRpY2F0ZVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWx0ZXI6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcblxuICAgICAgICB0aGlzLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUsIG5vZGVJZCkpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKG5vZGVJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNvbnRleHQpO1xuXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBsZWFmXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgaXMgbGVhZi5cbiAgICAgKi9cbiAgICBpc0xlYWY6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIHJldHVybiBub2RlICYmIG5vZGUuaXNMZWFmKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgYSBub2RlIGlzIGEgYW5jZXN0b3Igb2YgYW5vdGhlciBub2RlLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVyTm9kZUlkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGNvbnRhaW4gdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVkTm9kZUlkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGJlIGNvbnRhaW5lZCBieSB0aGUgb3RoZXIgbm9kZVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIGEgbm9kZSBjb250YWlucyBhbm90aGVyIG5vZGVcbiAgICAgKi9cbiAgICBjb250YWluczogZnVuY3Rpb24oY29udGFpbmVyTm9kZUlkLCBjb250YWluZWROb2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuY29udGFpbnMoY29udGFpbmVkTm9kZUlkLCBjb250YWluZWROb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZmFjaWxpdHkgb2YgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnLCAnRWRpdGFibGUnLCAnQ29udGV4dE1lbnUnXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIEZlYXR1cmUgb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtUcmVlfSB0aGlzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJywge1xuICAgICAqICAgICAgc2VsZWN0ZWRDbGFzc05hbWU6ICd0dWktdHJlZS1zZWxlY3RlZCdcbiAgICAgKiAgfSlcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJywge1xuICAgICAqICAgICAgZW5hYmxlQ2xhc3NOYW1lOiB0cmVlLmNsYXNzTmFtZXMudGV4dENsYXNzLFxuICAgICAqICAgICAgZGF0YUtleTogJ3RleHQnLFxuICAgICAqICAgICAgaW5wdXRDbGFzc05hbWU6ICdteUlucHV0J1xuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnRHJhZ2dhYmxlJywge1xuICAgICAqICAgICAgdXNlSGVscGVyOiB0cnVlLFxuICAgICAqICAgICAgaGVscGVyUG9zOiB7eDogNSwgeTogMn0sXG4gICAgICogICAgICByZWplY3RlZFRhZ05hbWVzOiBbJ1VMJywgJ0lOUFVUJywgJ0JVVFRPTiddLFxuICAgICAqICAgICAgcmVqZWN0ZWRDbGFzc05hbWVzOiBbJ25vdERyYWdnYWJsZScsICdub3REcmFnZ2FibGUtMiddLFxuICAgICAqICAgICAgYXV0b09wZW5EZWxheTogMTUwMCxcbiAgICAgKiAgICAgIGlzU29ydGFibGU6IHRydWUsXG4gICAgICogICAgICBob3ZlckNsYXNzTmFtZTogJ3R1aS10cmVlLWhvdmVyJ1xuICAgICAqICAgICAgbGluZUNsYXNzTmFtZTogJ3R1aS10cmVlLWxpbmUnLFxuICAgICAqICAgICAgbGluZUJvdW5kYXJ5OiB7XG4gICAgICogICAgICBcdHRvcDogMTAsXG4gICAgICogICAgICAgXHRib3R0b206IDEwXG4gICAgICogICAgICB9XG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdDaGVja2JveCcsIHtcbiAgICAgKiAgICAgIGNoZWNrYm94Q2xhc3NOYW1lOiAndHVpLXRyZWUtY2hlY2tib3gnXG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdDb250ZXh0TWVudSwge1xuICAgICAqICBcdG1lbnVEYXRhOiBbXG4gICAgICogICBcdFx0e3RpdGxlOiAnbWVudTEnLCBjb21tYW5kOiAnY29weSd9LFxuICAgICAqICAgICBcdFx0e3RpdGxlOiAnbWVudTInLCBjb21tYW5kOiAncGFzdGUnfSxcbiAgICAgKiAgICAgICBcdHtzZXBhcmF0b3I6IHRydWV9LFxuICAgICAqICAgICAgICBcdHtcbiAgICAgKiAgICAgICAgIFx0XHR0aXRsZTogJ21lbnUzJyxcbiAgICAgKiAgICAgICAgICAgXHRtZW51OiBbXG4gICAgICogICAgICAgICAgICBcdFx0e3RpdGxlOiAnc3VibWVudTEnfSxcbiAgICAgKiAgICAgICAgICAgICAgXHR7dGl0bGU6ICdzdWJtZW51Mid9XG4gICAgICogICAgICAgICAgICAgIF1cbiAgICAgKiAgICAgICAgICB9XG4gICAgICogICAgICB9XG4gICAgICogIH0pXG4gICAgICovXG4gICAgZW5hYmxlRmVhdHVyZTogZnVuY3Rpb24oZmVhdHVyZU5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIEZlYXR1cmUgPSBmZWF0dXJlc1tmZWF0dXJlTmFtZV07XG5cbiAgICAgICAgdGhpcy5kaXNhYmxlRmVhdHVyZShmZWF0dXJlTmFtZSk7XG4gICAgICAgIGlmIChGZWF0dXJlKSB7XG4gICAgICAgICAgICB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV0gPSBuZXcgRmVhdHVyZSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIGZhY2lsaXR5IG9mIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVOYW1lIC0gJ1NlbGVjdGFibGUnLCAnRHJhZ2dhYmxlJywgJ0VkaXRhYmxlJ1xuICAgICAqIEByZXR1cm5zIHtUcmVlfSB0aGlzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScpXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnRHJhZ2dhYmxlJylcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdFZGl0YWJsZScpXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnQ2hlY2tib3gnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0NvbnRleHRNZW51Jyk7XG4gICAgICovXG4gICAgZGlzYWJsZUZlYXR1cmU6IGZ1bmN0aW9uKGZlYXR1cmVOYW1lKSB7XG4gICAgICAgIHZhciBmZWF0dXJlID0gdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xuXG4gICAgICAgIGlmIChmZWF0dXJlKSB7XG4gICAgICAgICAgICBmZWF0dXJlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGluZGV4IG51bWJlciBvZiBzZWxlY3RlZCBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBJZCBvZiBzZWxlY3RlZCBub2RlXG4gICAgICogQHJldHVybnMge251bWJlcn0gSW5kZXggbnVtYmVyIG9mIGF0dGFjaGVkIG5vZGVcbiAgICAgKi9cbiAgICBnZXROb2RlSW5kZXg6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgcGFyZW50SWQgPSB0aGlzLm1vZGVsLmdldFBhcmVudElkKG5vZGVJZCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Tm9kZShwYXJlbnRJZCkuZ2V0Q2hpbGRJbmRleChub2RlSWQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFNldCBhYnN0cmFjdCBhcGlzIHRvIHRyZWUgcHJvdG90eXBlXG4gKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSBGZWF0dXJlIG5hbWVcbiAqIEBwYXJhbSB7b2JqZWN0fSBmZWF0dXJlIC0gRmVhdHVyZVxuICovXG5mdW5jdGlvbiBzZXRBYnN0cmFjdEFQSXMoZmVhdHVyZU5hbWUsIGZlYXR1cmUpIHtcbiAgICB2YXIgbWVzc2FnZU5hbWUgPSAnSU5WQUxJRF9BUElfJyArIGZlYXR1cmVOYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICAgIGFwaUxpc3QgPSBmZWF0dXJlLmdldEFQSUxpc3QgPyBmZWF0dXJlLmdldEFQSUxpc3QoKSA6IFtdO1xuXG4gICAgc25pcHBldC5mb3JFYWNoKGFwaUxpc3QsIGZ1bmN0aW9uKGFwaSkge1xuICAgICAgICBUcmVlLnByb3RvdHlwZVthcGldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZXNbbWVzc2FnZU5hbWVdIHx8IG1lc3NhZ2VzLklOVkFMSURfQVBJKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn1cbnNuaXBwZXQuZm9yRWFjaChmZWF0dXJlcywgZnVuY3Rpb24oRmVhdHVyZSwgbmFtZSkge1xuICAgIHNldEFic3RyYWN0QVBJcyhuYW1lLCBGZWF0dXJlKTtcbn0pO1xuc25pcHBldC5DdXN0b21FdmVudHMubWl4aW4oVHJlZSk7XG5tb2R1bGUuZXhwb3J0cyA9IFRyZWU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXBkYXRlIHZpZXcgYW5kIGNvbnRyb2wgdHJlZSBkYXRhXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIFRyZWVOb2RlID0gcmVxdWlyZSgnLi90cmVlTm9kZScpO1xuXG52YXIgZXh0ZW5kID0gdHVpLnV0aWwuZXh0ZW5kLFxuICAgIGtleXMgPSB0dWkudXRpbC5rZXlzLFxuICAgIGZvckVhY2ggPSB0dWkudXRpbC5mb3JFYWNoLFxuICAgIG1hcCA9IHR1aS51dGlsLm1hcDtcblxuLyoqXG4gKiBUcmVlIG1vZGVsXG4gKiBAY29uc3RydWN0b3IgVHJlZU1vZGVsXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gRGF0YVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zIGZvciBkZWZhdWx0U3RhdGUgYW5kIG5vZGVJZFByZWZpeFxuICoqL1xudmFyIFRyZWVNb2RlbCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU1vZGVsLnByb3RvdHlwZSAqL3sgLyogZXNsaW50LWRpc2FibGUgKi9cbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgVHJlZU5vZGUuc2V0SWRQcmVmaXgob3B0aW9ucy5ub2RlSWRQcmVmaXgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IHN0YXRlIG9mIG5vZGVcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubm9kZURlZmF1bHRTdGF0ZSA9IG9wdGlvbnMubm9kZURlZmF1bHRTdGF0ZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUm9vdCBub2RlXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTm9kZX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucm9vdE5vZGUgPSBuZXcgVHJlZU5vZGUoe1xuICAgICAgICAgICAgc3RhdGU6ICdvcGVuZWQnXG4gICAgICAgIH0sIG51bGwpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmVlIGhhc2ggaGF2aW5nIGFsbCBub2Rlc1xuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0LjxzdHJpbmcsIFRyZWVOb2RlPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZUhhc2ggPSB7fTtcblxuICAgICAgICB0aGlzLl9zZXREYXRhKGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcHJlZml4IG9mIG5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXhcbiAgICAgKi9cbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gVHJlZU5vZGUuaWRQcmVmaXg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBtb2RlbCB3aXRoIHRyZWUgZGF0YVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBUcmVlIGRhdGFcbiAgICAgKi9cbiAgICBfc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgcm9vdCA9IHRoaXMucm9vdE5vZGUsXG4gICAgICAgICAgICByb290SWQgPSByb290LmdldElkKCk7XG5cbiAgICAgICAgdGhpcy50cmVlSGFzaFtyb290SWRdID0gcm9vdDtcbiAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHJvb3QpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRyZWUgaGFzaCBmcm9tIGRhdGEgYW5kIHBhcmVudE5vZGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gcGFyZW50IC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZVRyZWVIYXNoOiBmdW5jdGlvbihkYXRhLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIHBhcmVudElkID0gcGFyZW50LmdldElkKCksXG4gICAgICAgICAgICBpZHMgPSBbXTtcblxuICAgICAgICBmb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKGRhdHVtKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW5EYXRhID0gZGF0dW0uY2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMuX2NyZWF0ZU5vZGUoZGF0dW0sIHBhcmVudElkKSxcbiAgICAgICAgICAgICAgICBub2RlSWQgPSBub2RlLmdldElkKCk7XG5cbiAgICAgICAgICAgIGlkcy5wdXNoKG5vZGVJZCk7XG4gICAgICAgICAgICB0aGlzLnRyZWVIYXNoW25vZGVJZF0gPSBub2RlO1xuICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcbiAgICAgICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChjaGlsZHJlbkRhdGEsIG5vZGUpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gaWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgbm9kZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlRGF0YSAtIERhdHVtIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgaWRcbiAgICAgKiBAcmV0dXJucyB7VHJlZU5vZGV9IFRyZWVOb2RlXG4gICAgICovXG4gICAgX2NyZWF0ZU5vZGU6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkge1xuICAgICAgICBub2RlRGF0YSA9IGV4dGVuZCh7XG4gICAgICAgICAgICBzdGF0ZTogdGhpcy5ub2RlRGVmYXVsdFN0YXRlXG4gICAgICAgIH0sIG5vZGVEYXRhKTtcblxuICAgICAgICByZXR1cm4gbmV3IFRyZWVOb2RlKG5vZGVEYXRhLCBwYXJlbnRJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGlsZHJlblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMgez9BcnJheS48VHJlZU5vZGU+fSBjaGlsZHJlblxuICAgICAqL1xuICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5nZXRDaGlsZElkcyhub2RlSWQpO1xuXG4gICAgICAgIGlmICghY2hpbGRJZHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hcChjaGlsZElkcywgZnVuY3Rpb24oY2hpbGRJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZShjaGlsZElkKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGlsZCBpZHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/QXJyYXkuPHN0cmluZz59IENoaWxkIGlkc1xuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0Q2hpbGRJZHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBudW1iZXIgb2Ygbm9kZXNcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIG5vZGVzXG4gICAgICovXG4gICAgZ2V0Q291bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ga2V5cyh0aGlzLnRyZWVIYXNoKS5sZW5ndGg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBsYXN0IGRlcHRoXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIGxhc3QgZGVwdGhcbiAgICAgKi9cbiAgICBnZXRMYXN0RGVwdGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGVwdGhzID0gbWFwKHRoaXMudHJlZUhhc2gsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldERlcHRoKG5vZGUuZ2V0SWQoKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShudWxsLCBkZXB0aHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBBIG5vZGUgaWQgdG8gZmluZFxuICAgICAqIEByZXR1cm5zIHs/VHJlZU5vZGV9IE5vZGVcbiAgICAgKi9cbiAgICBnZXROb2RlOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmVlSGFzaFtpZF07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBkZXB0aCBmcm9tIG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBBIG5vZGUgaWQgdG8gZmluZFxuICAgICAqIEByZXR1cm5zIHs/bnVtYmVyfSBEZXB0aFxuICAgICAqL1xuICAgIGdldERlcHRoOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXG4gICAgICAgICAgICBkZXB0aCA9IDAsXG4gICAgICAgICAgICBwYXJlbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShub2RlLmdldFBhcmVudElkKCkpO1xuICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICBkZXB0aCArPSAxO1xuICAgICAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKHBhcmVudC5nZXRQYXJlbnRJZCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXB0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHBhcmVudCBpZCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/c3RyaW5nfSBQYXJlbnQgaWRcbiAgICAgKi9cbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRQYXJlbnRJZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBub2RlIHdpdGggY2hpbGRyZW4uXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKGlkLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXG4gICAgICAgICAgICBwYXJlbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcblxuICAgICAgICBmb3JFYWNoKG5vZGUuZ2V0Q2hpbGRJZHMoKSwgZnVuY3Rpb24oY2hpbGRJZCkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoY2hpbGRJZCwgdHJ1ZSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZElkKGlkKTtcbiAgICAgICAgZGVsZXRlIHRoaXMudHJlZUhhc2hbaWRdO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgcGFyZW50LmdldElkKCkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBub2RlKHMpLlxuICAgICAqIC0gSWYgdGhlIHBhcmVudElkIGlzIGZhbHN5LCB0aGUgbm9kZSB3aWxsIGJlIGFwcGVuZGVkIHRvIHJvb3ROb2RlLlxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5ldyBhZGRlZCBub2RlIGlkc1xuICAgICAqL1xuICAgIGFkZDogZnVuY3Rpb24oZGF0YSwgcGFyZW50SWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGUsXG4gICAgICAgICAgICBpZHM7XG5cbiAgICAgICAgZGF0YSA9IFtdLmNvbmNhdChkYXRhKTtcbiAgICAgICAgaWRzID0gdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHBhcmVudCk7XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnQuZ2V0SWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgLSBQcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqL1xuICAgIHNldE5vZGVEYXRhOiBmdW5jdGlvbihpZCwgcHJvcHMsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcblxuICAgICAgICBpZiAoIW5vZGUgfHwgIXByb3BzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLnNldERhdGEocHJvcHMpO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24oaWQsIG5hbWVzLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8ICFuYW1lcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR1aS51dGlsLmlzQXJyYXkobmFtZXMpKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZURhdGEuYXBwbHkobm9kZSwgbmFtZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhKG5hbWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnQncyBjaGlsZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaW5kZXhdIC0gU3RhcnQgaW5kZXggbnVtYmVyIGZvciBpbnNlcnRpbmdcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgLyplc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5Ki9cbiAgICBtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG5ld1BhcmVudElkLCBpbmRleCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcbiAgICAgICAgdmFyIG9yaWdpbmFsUGFyZW50LCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBuZXdQYXJlbnQgPSB0aGlzLmdldE5vZGUobmV3UGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGU7XG4gICAgICAgIG5ld1BhcmVudElkID0gbmV3UGFyZW50LmdldElkKCk7XG4gICAgICAgIG9yaWdpbmFsUGFyZW50SWQgPSBub2RlLmdldFBhcmVudElkKCk7XG4gICAgICAgIG9yaWdpbmFsUGFyZW50ID0gdGhpcy5nZXROb2RlKG9yaWdpbmFsUGFyZW50SWQpO1xuICAgICAgICBpbmRleCA9IHR1aS51dGlsLmlzVW5kZWZpbmVkKGluZGV4KSA/IC0xIDogaW5kZXg7XG5cbiAgICAgICAgaWYgKG5vZGVJZCA9PT0gbmV3UGFyZW50SWQgfHwgdGhpcy5jb250YWlucyhub2RlSWQsIG5ld1BhcmVudElkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKG5ld1BhcmVudElkID09PSBvcmlnaW5hbFBhcmVudElkKSB7XG4gICAgICAgICAgICAgICAgbmV3UGFyZW50Lm1vdmVDaGlsZElkKG5vZGVJZCwgaW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXdQYXJlbnQuaW5zZXJ0Q2hpbGRJZChub2RlSWQsIGluZGV4KTtcbiAgICAgICAgICAgICAgICBvcmlnaW5hbFBhcmVudC5yZW1vdmVDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXdQYXJlbnQuYWRkQ2hpbGRJZChub2RlSWQpO1xuICAgICAgICAgICAgb3JpZ2luYWxQYXJlbnQucmVtb3ZlQ2hpbGRJZChub2RlSWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5zZXRQYXJlbnRJZChuZXdQYXJlbnRJZCk7XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywgbm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCwgaW5kZXgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgYSBub2RlIGlzIGEgYW5jZXN0b3Igb2YgYW5vdGhlciBub2RlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBjb250YWluIHRoZSBvdGhlciBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lZElkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGJlIGNvbnRhaW5lZCBieSB0aGUgb3RoZXIgbm9kZVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIGEgbm9kZSBjb250YWlucyBhbm90aGVyIG5vZGVcbiAgICAgKi9cbiAgICBjb250YWluczogZnVuY3Rpb24oY29udGFpbmVySWQsIGNvbnRhaW5lZElkKSB7XG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHRoaXMuZ2V0UGFyZW50SWQoY29udGFpbmVkSWQpLFxuICAgICAgICAgICAgaXNDb250YWluZWQgPSBmYWxzZTtcblxuICAgICAgICB3aGlsZSAoIWlzQ29udGFpbmVkICYmIHBhcmVudElkKSB7XG4gICAgICAgICAgICBpc0NvbnRhaW5lZCA9IChjb250YWluZXJJZCA9PT0gcGFyZW50SWQpO1xuICAgICAgICAgICAgcGFyZW50SWQgPSB0aGlzLmdldFBhcmVudElkKHBhcmVudElkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc0NvbnRhaW5lZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU29ydCBub2Rlc1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgLSBDb21wYXJhdG9yIGZ1bmN0aW9uXG4gICAgICovXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvcikge1xuICAgICAgICB0aGlzLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmdldENoaWxkcmVuKG5vZGVJZCksXG4gICAgICAgICAgICAgICAgY2hpbGRJZHM7XG5cbiAgICAgICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW4uc29ydChjb21wYXJhdG9yKTtcblxuICAgICAgICAgICAgICAgIGNoaWxkSWRzID0gbWFwKGNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGQuZ2V0SWQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBub2RlLnJlcGxhY2VDaGlsZElkcyhjaGlsZElkcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBkYXRhIChhbGwpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P29iamVjdH0gTm9kZSBkYXRhXG4gICAgICovXG4gICAgZ2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRBbGxEYXRhKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgbm9kZXMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXG4gICAgICovXG4gICAgZWFjaEFsbDogZnVuY3Rpb24oaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcblxuICAgICAgICBmb3JFYWNoKHRoaXMudHJlZUhhc2gsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaXRlcmF0ZWUuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgZGVzY2VuZGFudHMgb2YgYSBub2RlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXG4gICAgICovXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KSB7IC8vZGVwdGgtZmlyc3RcbiAgICAgICAgdmFyIHN0YWNrLCBub2RlSWQsIG5vZGU7XG5cbiAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShwYXJlbnRJZCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0YWNrID0gbm9kZS5nZXRDaGlsZElkcygpO1xuXG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XG4gICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIG5vZGVJZCA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgbm9kZSA9IHRoaXMuZ2V0Tm9kZShub2RlSWQpO1xuICAgICAgICAgICAgaXRlcmF0ZWUuY2FsbChjb250ZXh0LCBub2RlLCBub2RlSWQpO1xuXG4gICAgICAgICAgICBzdGFjayA9IHN0YWNrLmNvbmNhdChub2RlLmdldENoaWxkSWRzKCkpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihUcmVlTW9kZWwpO1xubW9kdWxlLmV4cG9ydHMgPSBUcmVlTW9kZWw7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdGF0ZXMgPSByZXF1aXJlKCcuL2NvbnN0cy9zdGF0ZXMnKS5ub2RlLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIGxhc3RJbmRleCA9IDAsXG4gICAgZ2V0TmV4dEluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxhc3RJbmRleDtcbiAgICAgICAgbGFzdEluZGV4ICs9IDE7XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG4gICAgUkVTRVJWRURfUFJPUEVSVElFUyA9IHtcbiAgICAgICAgaWQ6ICcnLFxuICAgICAgICBzdGF0ZTogJ3NldFN0YXRlJyxcbiAgICAgICAgY2hpbGRyZW46ICcnXG4gICAgfSxcbiAgICBpbkFycmF5ID0gdHVpLnV0aWwuaW5BcnJheTtcblxuLyoqXG4gKiBUcmVlTm9kZVxuICogQENvbnN0cnVjdG9yIFRyZWVOb2RlXG4gKiBAcGFyYW0ge09iamVjdH0gbm9kZURhdGEgLSBOb2RlIGRhdGFcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gUGFyZW50IG5vZGUgaWRcbiAqL1xudmFyIFRyZWVOb2RlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlTm9kZS5wcm90b3R5cGUgKi97IC8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IHByZWZpeCBvZiBpZFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IC0gUHJlZml4IG9mIGlkXG4gICAgICAgICAqL1xuICAgICAgICBzZXRJZFByZWZpeDogZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgICAgICAgICB0aGlzLmlkUHJlZml4ID0gcHJlZml4IHx8IHRoaXMuaWRQcmVmaXg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByZWZpeCBvZiBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgaWRQcmVmaXg6ICcnXG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbihub2RlRGF0YSwgcGFyZW50SWQpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2lkID0gdGhpcy5jb25zdHJ1Y3Rvci5pZFByZWZpeCArIGdldE5leHRJbmRleCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXJlbnQgbm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPG51bWJlcj59XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIGRhdGFcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBzdGF0ZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuXG4gICAgICAgIHRoaXMuc2V0RGF0YShub2RlRGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByZXNlcnZlZCBwcm9wZXJ0aWVzIGZyb20gZGF0YVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gTm9kZSBkYXRhXG4gICAgICogQHJldHVybnMge29iamVjdH0gTm9kZSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0UmVzZXJ2ZWRQcm9wZXJ0aWVzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2hPd25Qcm9wZXJ0aWVzKFJFU0VSVkVEX1BST1BFUlRJRVMsIGZ1bmN0aW9uKHNldHRlciwgbmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtuYW1lXTtcblxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHNldHRlcikge1xuICAgICAgICAgICAgICAgIHRoaXNbc2V0dGVyXSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgZGF0YVtuYW1lXTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBzdGF0ZVxuICAgICAqIEBhcGlcbiAgICAgKi9cbiAgICB0b2dnbGVTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZSA9PT0gc3RhdGVzLkNMT1NFRCkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuT1BFTkVEO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXMuQ0xPU0VEO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBzdGF0ZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBTdGF0ZSBvZiBub2RlICgnY2xvc2VkJywgJ29wZW5lZCcpXG4gICAgICovXG4gICAgc2V0U3RhdGU6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgIHN0YXRlID0gU3RyaW5nKHN0YXRlKTtcbiAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZXNbc3RhdGUudG9VcHBlckNhc2UoKV0gfHwgdGhpcy5fc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzdGF0ZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzdGF0ZSAoJ29wZW5lZCcgb3IgJ2Nsb3NlZCcpXG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBOb2RlIGlkXG4gICAgICovXG4gICAgZ2V0SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwYXJlbnQgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUGFyZW50IG5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnRJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICovXG4gICAgc2V0UGFyZW50SWQ6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHRoaXMuX3BhcmVudElkID0gcGFyZW50SWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2UgY2hpbGRJZHNcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBjaGlsZElkcyAtIElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKi9cbiAgICByZXBsYWNlQ2hpbGRJZHM6IGZ1bmN0aW9uKGNoaWxkSWRzKSB7XG4gICAgICAgIHRoaXMuX2NoaWxkSWRzID0gY2hpbGRJZHM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48bnVtYmVyPn0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkSWRzLnNsaWNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICBhZGRDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLl9jaGlsZElkcztcblxuICAgICAgICBpZiAodHVpLnV0aWwuaW5BcnJheShjaGlsZElkcywgaWQpID09PSAtMSkge1xuICAgICAgICAgICAgY2hpbGRJZHMucHVzaChpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIHJlbW92ZUNoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlSXRlbUZyb21BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFByb3BlcnR5IG5hbWUgb2YgZGF0YVxuICAgICAqIEByZXR1cm5zIHsqfSBEYXRhXG4gICAgICovXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtuYW1lXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IERhdGFcbiAgICAgKi9cbiAgICBnZXRBbGxEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHR1aS51dGlsLmV4dGVuZCh7fSwgdGhpcy5fZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRGF0YSBmb3IgYWRkaW5nXG4gICAgICovXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkYXRhID0gdGhpcy5fc2V0UmVzZXJ2ZWRQcm9wZXJ0aWVzKGRhdGEpO1xuICAgICAgICB0dWkudXRpbC5leHRlbmQodGhpcy5fZGF0YSwgZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7Li4uc3RyaW5nfSBuYW1lcyAtIE5hbWVzIG9mIGRhdGFcbiAgICAgKi9cbiAgICByZW1vdmVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaEFycmF5KGFyZ3VtZW50cywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIG5vZGUgaGFzIGEgcHJvdmlkZWQgY2hpbGQgaWQuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoaXMgbm9kZSBoYXMgYSBwcm92aWRlZCBjaGlsZCBpZC5cbiAgICAgKi9cbiAgICBoYXNDaGlsZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIGluQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKSAhPT0gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyBsZWFmLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gTm9kZSBpcyBsZWFmIG9yIG5vdC5cbiAgICAgKi9cbiAgICBpc0xlYWY6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRJZHMubGVuZ3RoID09PSAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIG5vZGUgaXMgcm9vdC5cbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IE5vZGUgaXMgcm9vdCBvciBub3QuXG4gICAgICovXG4gICAgaXNSb290OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHR1aS51dGlsLmlzRmFsc3kodGhpcy5fcGFyZW50SWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaW5kZXggb2YgY2hpbGRcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IEluZGV4IG9mIGNoaWxkIGluIGNoaWxkcmVuIGxpc3RcbiAgICAgKi9cbiAgICBnZXRDaGlsZEluZGV4OiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gaW5BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbnNlcnQgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gSW5kZXggbnVtYmVyIG9mIGluc2VydCBwb3NpdGlvblxuICAgICAqL1xuICAgIGluc2VydENoaWxkSWQ6IGZ1bmN0aW9uKGlkLCBpbmRleCkge1xuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLl9jaGlsZElkcztcblxuICAgICAgICBpZiAoaW5BcnJheShpZCwgY2hpbGRJZHMpID09PSAtMSkge1xuICAgICAgICAgICAgY2hpbGRJZHMuc3BsaWNlKGluZGV4LCAwLCBpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTW92ZSBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBJbmRleCBudW1iZXIgb2YgaW5zZXJ0IHBvc2l0aW9uXG4gICAgICovXG4gICAgbW92ZUNoaWxkSWQ6IGZ1bmN0aW9uKGlkLCBpbmRleCkge1xuICAgICAgICB2YXIgY2hpbGRJZHMgPSB0aGlzLl9jaGlsZElkcztcbiAgICAgICAgdmFyIG9yaWdpbklkeCA9IHRoaXMuZ2V0Q2hpbGRJbmRleChpZCk7XG5cbiAgICAgICAgaWYgKGluQXJyYXkoaWQsIGNoaWxkSWRzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChvcmlnaW5JZHggPCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGluZGV4IC09IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNoaWxkSWRzLnNwbGljZShpbmRleCwgMCwgY2hpbGRJZHMuc3BsaWNlKG9yaWdpbklkeCwgMSlbMF0pO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVOb2RlO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEhlbHBlciBvYmplY3QgdG8gbWFrZSBlYXN5IHRyZWUgZWxlbWVudHNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGlzVW5kZWZpbmVkID0gdHVpLnV0aWwuaXNVbmRlZmluZWQsXG4gICAgcGljayA9IHR1aS51dGlsLnBpY2ssXG4gICAgdGVtcGxhdGVNYXNrUmUgPSAvXFx7XFx7KC4rPyl9fS9naSxcbiAgICBpc1ZhbGlkRG90Tm90YXRpb25SZSA9IC9eXFx3Kyg/OlxcLlxcdyspKiQvLFxuICAgIGlzVmFsaWREb3ROb3RhdGlvbiA9IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICByZXR1cm4gaXNWYWxpZERvdE5vdGF0aW9uUmUudGVzdChzdHIpO1xuICAgIH0sXG4gICAgaXNBcnJheSA9IHR1aS51dGlsLmlzQXJyYXlTYWZlLFxuICAgIGlzU3VwcG9ydFBhZ2VPZmZzZXQgPSB0eXBlb2Ygd2luZG93LnBhZ2VYT2Zmc2V0ICE9PSAndW5kZWZpbmVkJyxcbiAgICBpc0NTUzFDb21wYXQgPSBkb2N1bWVudC5jb21wYXRNb2RlID09PSAnQ1NTMUNvbXBhdCc7XG5cbnZhciB1dGlsID0ge1xuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaXJzdCBzcGVjaWZpZWQgaXRlbSBmcm9tIGFycmF5LCBpZiBpdCBleGlzdHNcbiAgICAgKiBAcGFyYW0geyp9IGl0ZW0gSXRlbSB0byBsb29rIGZvclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFyciBBcnJheSB0byBxdWVyeVxuICAgICAqL1xuICAgIHJlbW92ZUl0ZW1Gcm9tQXJyYXk6IGZ1bmN0aW9uKGl0ZW0sIGFycikge1xuICAgICAgICB2YXIgaW5kZXggPSBhcnIubGVuZ3RoIC0gMTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0gPT09IGFycltpbmRleF0pIHtcbiAgICAgICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZGV4IC09IDE7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNsYXNzbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBDbGFzc25hbWVcbiAgICAgKi9cbiAgICBhZGRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NOYW1lID09PSAnJykge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoIXV0aWwuaGFzQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgKz0gJyAnICsgY2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjbGFzc25hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIC0gQ2xhc3NuYW1lXG4gICAgICovXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgb3JpZ2luYWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpLFxuICAgICAgICAgICAgYXJyLCBpbmRleDtcblxuICAgICAgICBpZiAoIW9yaWdpbmFsQ2xhc3NOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnIgPSBvcmlnaW5hbENsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgICAgICBpbmRleCA9IHR1aS51dGlsLmluQXJyYXkoY2xhc3NOYW1lLCBhcnIpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gYXJyLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB0byBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFkZFxuICAgICAqL1xuICAgIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBmcm9tIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVtb3ZlXG4gICAgICovXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IEV2ZW50IHRhcmdldFxuICAgICAqL1xuICAgIGdldFRhcmdldDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0O1xuICAgICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgICAgIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgSFRNTEVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBDbGFzcyBuYW1lXG4gICAgICovXG4gICAgZ2V0Q2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgJiYgZWxlbWVudC5nZXRBdHRyaWJ1dGUgJiZcbiAgICAgICAgICAgIChlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCBlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3NOYW1lJykgfHwgJycpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGUgZWxlbWVudCBoYXMgc3BlY2lmaWMgY2xhc3Mgb3Igbm90XG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3MgdG8gZmluZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSBlbGVtZW50IGhhcyB0aGUgY2xhc3NcbiAgICAgKi9cbiAgICBoYXNDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBlbENsYXNzTmFtZSA9IHV0aWwuZ2V0Q2xhc3MoZWxlbWVudCk7XG5cbiAgICAgICAgcmV0dXJuIGVsQ2xhc3NOYW1lLmluZGV4T2YoY2xhc3NOYW1lKSA+IC0xO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGVsZW1lbnQgYnkgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3NcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPEhUTUxFbGVtZW50Pn0gRWxlbWVudHNcbiAgICAgKi9cbiAgICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lOiBmdW5jdGlvbih0YXJnZXQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgYWxsLCBmaWx0ZXJlZDtcblxuICAgICAgICBpZiAodGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFsbCA9IHR1aS51dGlsLnRvQXJyYXkodGFyZ2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJykpO1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0dWkudXRpbC5maWx0ZXIoYWxsLCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lIHx8ICcnO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIChjbGFzc05hbWVzLmluZGV4T2YoY2xhc3NOYW1lKSAhPT0gLTEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHdoZXRoZXIgdGhlIGNsaWNrIGV2ZW50IGJ5IHJpZ2h0IGJ1dHRvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGNsaWNrIGV2ZW50IGJ5IHJpZ2h0IGJ1dHRvblxuICAgICAqL1xuICAgIGlzUmlnaHRCdXR0b246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB1dGlsLl9nZXRCdXR0b24oZXZlbnQpID09PSAyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBwcm9wZXJ0eSBleGlzdCBvciBub3RcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwcm9wcyBBIHByb3BlcnR5XG4gICAgICogQHJldHVybnMge3N0cmluZ3xib29sZWFufSBQcm9wZXJ0eSBuYW1lIG9yIGZhbHNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgdXNlclNlbGVjdFByb3BlcnR5ID0gdXRpbC50ZXN0UHJvcChbXG4gICAgICogICAgICd1c2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ1dlYmtpdFVzZXJTZWxlY3QnLFxuICAgICAqICAgICAnT1VzZXJTZWxlY3QnLFxuICAgICAqICAgICAnTW96VXNlclNlbGVjdCcsXG4gICAgICogICAgICdtc1VzZXJTZWxlY3QnXG4gICAgICogXSk7XG4gICAgICovXG4gICAgdGVzdFByb3A6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSxcbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IGZhbHNlO1xuXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGNvbnNpc3RlbnQtcmV0dXJuICovXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2gocHJvcHMsIGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgICAgIGlmIChwcm9wIGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgY29uc2lzdGVudC1yZXR1cm4gKi9cblxuICAgICAgICByZXR1cm4gcHJvcGVydHlOYW1lO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IGRlZmF1bHQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGh0bWwgZnJvbSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2UgLSBUZW1wbGF0ZSBodG1sXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gVGVtcGxhdGUgZGF0YVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGh0bWxcbiAgICAgKi9cbiAgICByZW5kZXJUZW1wbGF0ZTogZnVuY3Rpb24oc291cmNlLCBwcm9wcykge1xuICAgICAgICBmdW5jdGlvbiBwaWNrVmFsdWUobmFtZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBwaWNrLmFwcGx5KG51bGwsIFtwcm9wc10uY29uY2F0KG5hbWVzKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291cmNlLnJlcGxhY2UodGVtcGxhdGVNYXNrUmUsIGZ1bmN0aW9uKG1hdGNoLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWU7XG5cbiAgICAgICAgICAgIGlmIChpc1ZhbGlkRG90Tm90YXRpb24obmFtZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBpY2tWYWx1ZShuYW1lLnNwbGl0KCcuJykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4oJyAnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXphdGlvbiBmb3IgZXZlbnQgYnV0dG9uIHByb3BlcnR5XG4gICAgICogMDogRmlyc3QgbW91c2UgYnV0dG9uLCAyOiBTZWNvbmQgbW91c2UgYnV0dG9uLCAxOiBDZW50ZXIgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7P251bWJlcn0gYnV0dG9uIHR5cGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRCdXR0b246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBidXR0b24sXG4gICAgICAgICAgICBwcmltYXJ5ID0gJzAsMSwzLDUsNycsXG4gICAgICAgICAgICBzZWNvbmRhcnkgPSAnMiw2JyxcbiAgICAgICAgICAgIHdoZWVsID0gJzQnO1xuXG4gICAgICAgIGlmIChkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5oYXNGZWF0dXJlKCdNb3VzZUV2ZW50cycsICcyLjAnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGV2ZW50LmJ1dHRvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJ1dHRvbiA9IFN0cmluZyhldmVudC5idXR0b24pO1xuICAgICAgICBpZiAocHJpbWFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0gZWxzZSBpZiAoc2Vjb25kYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMjtcbiAgICAgICAgfSBlbHNlIGlmICh3aGVlbC5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG1vdXNlIHBvc2l0aW9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZXR9IGV2ZW50IC0gRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybnMge29iamVjdH0gWCwgWSBwb3NpdGlvbiBvZiBtb3VzZVxuICAgICAqL1xuICAgIGdldE1vdXNlUG9zOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFlcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHZhbHVlIG9mIHNjcm9sbCB0b3Agb24gZG9jdW1lbnQuYm9keSAoY3Jvc3MgYnJvd3NpbmcpXG4gICAgICogQHJldHVybnMge251bWJlcn0gVmFsdWUgb2Ygc2Nyb2xsIHRvcFxuICAgICAqL1xuICAgIGdldFdpbmRvd1Njcm9sbFRvcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzY3JvbGxUb3A7XG5cbiAgICAgICAgaWYgKGlzU3VwcG9ydFBhZ2VPZmZzZXQpIHtcbiAgICAgICAgICAgIHNjcm9sbFRvcCA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcm9sbFRvcCA9IGlzQ1NTMUNvbXBhdCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgOiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY3JvbGxUb3A7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIl19
