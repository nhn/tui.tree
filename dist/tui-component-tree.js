/**
 * tui-component-tree
 * @author NHNEnt FE Development Lab <dl_javascript@nhnent.com>
 * @version v1.5.1
 * @license MIT
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var Tree = require('./src/js/tree');
tui.util.defineNamespace('tui.component', {
    Tree: Tree
});

},{"./src/js/tree":13}],2:[function(require,module,exports){
'use strict';

/**
 * Ajax comman in tree
 * @type {Object.<string, string>}
 */
module.exports = {
    READ: 'read',
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'remove',
    DELETE_ALL_CHILDREN: 'removeAllChildren',
    MOVE: 'move'
};

},{}],3:[function(require,module,exports){
'use strict';

/**
 * Make class names
 * @param {string} prefix - Prefix of class name
 * @param {Array.<string>} keys - Keys of class names
 * @returns {object.<string, string>} Class names map
 * @ignore
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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
'use strict';

var snippet = tui.util;
var API_LIST = [];
var LOADER_CLASSNAME = 'tui-tree-loader';

/**
 * Set Ajax feature on tree
 * @class Ajax
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {Object} options.command - Each Ajax request command options
 *  @param {Function} [options.parseData] - Function to parse and return the response data
 *  @param {string} [options.loaderClassName] - Classname of loader element
 *  @param {boolean} [options.isLoadRoot] - Whether load data from root node or not
 * @ignore
 */
var Ajax = tui.util.defineClass(/** @lends Ajax.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf Ajax
         * @returns {Array.<string>} API list of Ajax
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },
    init: function(tree, options) { /*eslint-enable*/
        options = tui.util.extend({}, options);

        /**
         * Tree
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Option for each request command
         * @type {Object}
         */
        this.command = options.command;

        /**
         * Callback for parsing the response data
         * @type {?Function}
         */
        this.parseData = options.parseData || null;

        /**
         * Classname of loader element
         * @type {string}
         */
        this.loaderClassName = options.loaderClassName || LOADER_CLASSNAME;

        /**
         * State of loading root data or not
         * @type {boolean}
         */
        this.isLoadRoot = !snippet.isUndefined(options.isLoadRoot) ?
                            options.isLoadRoot : true;

        /**
         * Loader element
         * @type {HTMLElement}
         */
        this.loader = null;

        this._createLoader();

        tree.on('initFeature', snippet.bind(this._onInitFeature, this));
    },

    /**
    * Custom event handler "initFeature"
     * @private
     */
    _onInitFeature: function() {
        if (!this.isLoadRoot) {
            return;
        }

        this.tree.resetAllData();
    },

    /**
     * Disable this module
     */
    destroy: function() {
        var tree = this.tree;

        this._removeLoader();

        tree.off(this);
    },

    /**
     * Load data to request server
     * @param {string} type - Command type
     * @param {Function} callback - Executed function after response
     * @param {Object} [params] - Values to make "data" property using request
     */
    loadData: function(type, callback, params) {
        var self = this;
        var options;

        if (!this.command || !this.command[type] ||
            !this.command[type].url) {
            return;
        }

        options = this._getDefaultRequestOptions(type, params);

        /**
         * @api
         * @event Tree#beforeAjaxRequest
         * @param {string} command - Command type
         * @param {string} [data] - Request data
         * @example
         * tree.on('beforeAjaxRequest', function(command, data) {
         *     console.log('before ' + command + ' request!');
         *     return false; // It cancels request
         *     // return true; // It fires request
         * });
         */
        if (!this.tree.invoke('beforeAjaxRequest', type, params)) {
            return;
        }

        this._showLoader();

        options.success = function(response) {
            self._responseSuccess(type, callback, response);
        };

        options.error = function() {
            self._responseError(type);
        };

        $.ajax(options);
    },

    /**
     * Processing when response is success
     * @param {string} type - Command type
     * @param {Function} callback - Executed function after response
     * @param {Object|boolean} [response] - Response data from server or return value of "parseData"
     * @private
     */
    _responseSuccess: function(type, callback, response) {
        var tree = this.tree;
        var data;

        this._hideLoader();

        if (this.parseData) {
            response = this.parseData(type, response);
        }

        if (response) {
            data = callback(response);

            /**
             * @api
             * @event Tree#successAjaxResponse
             * @param {string} command - Command type
             * @param {string} [data] - Return value of executed command callback
             * @example
             * tree.on('successAjaxResponse', function(command, data) {
             *     console.log(command + ' response is success!');
             *     if (data) {
             *           console.log('new add ids :' + data);
             *     }
             * });
             */
            tree.fire('successAjaxResponse', type, data);
        } else {
            /**
             * @api
             * @event Tree#failAjaxResponse
             * @param {string} command - Command type
             * @example
             * tree.on('failAjaxResponse', function(command) {
             *     console.log(command + ' response is fail!');
             * });
             */
            tree.fire('failAjaxResponse', type);
        }
    },

    /**
     * Processing when response is error
     * @param {string} type - Command type
     * @private
     */
    _responseError: function(type) {
        this._hideLoader();

        /**
         * @api
         * @event Tree#errorAjaxResponse
         * @param {string} command - Command type
         * @example
         * tree.on('errorAjaxResponse', function(command) {
         *     console.log(command + ' response is error!');
         * });
         */
        this.tree.fire('errorAjaxResponse', type);
    },

    /**
     * Get default request options
     * @param {string} type - Command type
     * @param {Object} [params] - Value of request option "data"
     * @returns {Object} Default options to request
     * @private
     */
    _getDefaultRequestOptions: function(type, params) {
        var options = this.command[type];

        if (snippet.isFunction(options.url)) { // for restful API url
            options.url = options.url(params);
        }

        if (snippet.isFunction(options.data)) { // for custom request data
            options.data = options.data(params);
        }

        options.type = (options.type) ? options.type.toLowerCase() : 'get';
        options.dataType = options.dataType || 'json';

        return options;
    },

    /**
     * Create loader element
     * @private
     */
    _createLoader: function() {
        var tree = this.tree;
        var loader = document.createElement('span');

        loader.className = this.loaderClassName;
        loader.style.display = 'none';

        tree.rootElement.parentNode.appendChild(loader);

        this.loader = loader;
    },

    /**
     * Remove loader element
     * @private
     */
    _removeLoader: function() {
        var tree = this.tree;
        var loader = this.loader;

        tree.rootElement.parentNode.removeChild(loader);

        this.loader = null;
    },

    /**
     * Show loader element on tree
     * @private
     */
    _showLoader: function() {
        this.loader.style.display = 'block';
    },

    /**
     * Hide loader element on tree
     * @private
     */
    _hideLoader: function() {
        this.loader.style.display = 'none';
    }
});

module.exports = Ajax;

},{}],8:[function(require,module,exports){
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

/* Checkbox tri-states */
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
 * @param {Tree} tree - Tree
 * @param {Object} option - Option
 *  @param {string} option.checkboxClassName - Classname of checkbox element
 * @ignore
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

        tree.setNodeData(nodeId, DATA, {
            isSilent: true
        });

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

},{"../util.js":16}],9:[function(require,module,exports){
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
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *     @param {Array.<Object>} options.menuData - Context menu data
 * @ignore
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
     * Change current context-menu view
     * @api
     * @memberOf Tree.prototype
     * @requires ContextMenu
     * @param {Array.<Object>} newMenuData - New context menu data
     * @example
     * tree.changeContextMenu([
     *      {title: 'menu1'},
     *      {title: 'menu2', disable: true},
     *      {title: 'menu3', menu: [
     *      	{title: 'submenu1', disable: true},
     *      	{title: 'submenu2'}
     *      ]}
     * ]);
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
         * @param {string} nodeId - Current selected node id
         * @example
         * tree.on('beforeOpenContextMenu', function(nodeId) {
         *     console.log('nodeId: ' + nodeId);
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
         *     var cmd = treeEvent.cmd; // key of context menu's data
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

},{"./../util":16}],10:[function(require,module,exports){
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
 * @ignore
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
        var hasEditableElement = (tree.enabledFeatures.Editable &&
                                tree.enabledFeatures.Editable.inputElement);

        if (util.isRightButton(event) || this._isNotDraggable(target) ||
            hasEditableElement) {
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

},{"./../util":16}],11:[function(require,module,exports){
'use strict';

var util = require('./../util');
var ajaxCommand = require('./../consts/ajaxCommand');
var states = require('./../consts/states');

var API_LIST = [
    'createChildNode',
    'editNode'
];
var EDIT_TYPE = {
    CREATE: 'create',
    UPDATE: 'update'
};

/**
 * Set the tree selectable
 * @class Editable
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {string} options.editableClassName - Classname of editable element
 *  @param {string} options.dataKey - Key of node data to set value
 *  @param {string} [options.dataValue] - Value of node data to set value (Use "createNode" API)
 *  @param {string} [options.inputClassName] - Classname of input element
 * @ignore
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

        /**
         * Tree
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Classname of editable element
         * @type {string}
         */
        this.editableClassName = options.editableClassName;

        /**
         * Classname of input element
         * @type {string}
         */
        this.inputClassName = options.inputClassName;

        /**
         * Key of node data to set value
         * @type {string}
         */
        this.dataKey = options.dataKey;

        /**
         * Default value for creating node
         * @type {string}
         */
        this.defaultValue = options.defaultValue || '';

        /**
         * Input element for create or edit
         * @type {HTMLElement}
         */
        this.inputElement = null;

        /**
         * Action mode - create or edit
         * @type {string}
         */
        this.mode = null;

        /**
         * Keyup event handler
         * @type {Function}
         */
        this.boundOnKeyup = tui.util.bind(this._onKeyup, this);

        /**
         * Whether custom event is ignored or not
         * @type {Boolean}
         */
        this.isCustomEventIgnored = false;

        /**
         * Blur event handler
         * @type {Function}
         */
        this.boundOnBlur = tui.util.bind(this._onBlur, this);

        tree.on('doubleClick', this._onDoubleClick, this);

        this._setAPIs();
    },

    /**
     * Disable this module
     */
    destroy: function() {
        var tree = this.tree;

        this._detachInputElement();
        tree.off(this);
        tui.util.forEach(API_LIST, function(apiName) {
            delete tree[apiName];
        });
    },

    /**
     * Create child node
     * @api
     * @memberOf Tree.prototype
     * @requires Editable
     * @param {string} parentId - Parent node id to create new node
     * @example
     * tree.createChildNode('tui-tree-node-1');
     */
    createChildNode: function(parentId) {
        var tree = this.tree;
        var useAjax = tree.enabledFeatures.Ajax;
        var nodeId;

        this.mode = EDIT_TYPE.CREATE;

        if (useAjax) {
            tree.on('successAjaxResponse', this._onSuccessResponse, this);
        }

        if (!tree.isLeaf(parentId) &&
            tree.getState(parentId) === states.node.CLOSED) {
            tree.open(parentId);
        } else {
            nodeId = tree._add({}, parentId)[0];
            this._attachInputElement(nodeId);
        }
    },

    /**
     * Edit node
     * @api
     * @memberOf Tree.prototype
     * @requires Editable
     * @param {string} nodeId - Node id
     * @example
     * tree.editNode('tui-tree-node-1');
     */
    editNode: function(nodeId) {
        this.mode = EDIT_TYPE.UPDATE;
        this._attachInputElement(nodeId);
    },

    /**
     * Custom event handler "successResponse"
     * @param {string} type - Ajax command type
     * @param {Array.<string>} nodeIds - Added node ids on tree
     * @private
     */
    _onSuccessResponse: function(type, nodeIds) {
        var tree = this.tree;
        var parentId, nodeId;

        if (type === ajaxCommand.READ && nodeIds) {
            parentId = tree.getParentId(nodeIds[0]);
            nodeId = tree._add({}, parentId)[0];
            this._attachInputElement(nodeId);
        }
    },

    /**
     * Custom event handler "doubleClick"
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onDoubleClick: function(event) {
        var target = util.getTarget(event);
        var nodeId;

        if (util.hasClass(target, this.editableClassName)) {
            nodeId = this.tree.getNodeIdFromElement(target);
            this.editNode(nodeId);
        }
    },

    /**
     * Event handler: keyup - input element
     * @param {Event} event - Key event
     * @private
     */
    _onKeyup: function(event) {
        if (event.keyCode === 13) { // keyup "enter"
            this.inputElement.blur();
        }
    },

    /**
     * Event handler: blur - input element
     * @private
     */
    _onBlur: function() {
        if (this.isCustomEventIgnored || !this.inputElement) {
            this.isCustomEventIgnored = false;

            return;
        }

        if (this.mode === EDIT_TYPE.CREATE) {
            this._addData();
        } else {
            this._setData();
        }
    },

    /**
     * Create input element
     * @param {string} inputClassName - Classname of input element
     * @returns {HTMLElement} Input element
     * @private
     */
    _createInputElement: function(inputClassName) {
        var el = document.createElement('INPUT');
        if (inputClassName) {
            el.className = inputClassName;
        }
        el.setAttribute('type', 'text');

        return el;
    },

    /**
     * Attach input element on tree
     * @param {string} nodeId - Node id
     * @private
     */
    _attachInputElement: function(nodeId) {
        var tree = this.tree;
        var target = document.getElementById(nodeId);
        var textElement = util.getElementsByClassName(target, tree.classNames.textClass)[0];
        var inputElement;

        inputElement = this._createInputElement(this.inputClassName);
        inputElement.value = tree.getNodeData(nodeId)[this.dataKey] || '';

        textElement.parentNode.insertBefore(inputElement, textElement);
        textElement.style.display = 'none';

        this.inputElement = inputElement;

        util.addEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.addEventListener(this.inputElement, 'blur', this.boundOnBlur);

        this.inputElement.focus();
    },

    /**
     * Detach input element on tree
     * @private
     */
    _detachInputElement: function() {
        var tree = this.tree;
        var inputEl = this.inputElement;
        var parentNode = inputEl.parentNode;

        util.removeEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.removeEventListener(this.inputElement, 'blur', this.boundOnBlur);

        if (parentNode) {
            parentNode.removeChild(inputEl);
        }

        if (tree.enabledFeatures.Ajax) {
            tree.off(this, 'successAjaxResponse');
        }

        this.isCustomEventIgnored = false;
        this.inputElement = null;
    },

    /**
     * Add data of input element to node and detach input element on tree
     * @private
     */
    _addData: function() {
        var tree = this.tree;
        var nodeId = tree.getNodeIdFromElement(this.inputElement);
        var parentId = tree.getParentId(nodeId);
        var value = this.inputElement.value || this.defaultValue;
        var data = {};

        /**
         * @api
         * @event Tree#beforeCreateChildNode
         * @param {string} value - Return value of creating input element
         * @example
         * tree
         *  .enableFeature('Editable')
         *  .on('beforeCreateChildNode', function(value) {
         *      console.log(value);
         *      return false; // It cancels
         *      // return true; // It execute next
         *  });
         */
        if (!this.tree.invoke('beforeCreateChildNode', value)) {
            this.isCustomEventIgnored = true;
            this.inputElement.focus();

            return;
        }

        if (nodeId) {
            data[this.dataKey] = value;
            tree._remove(nodeId);
            tree.add(data, parentId);
        }
        this._detachInputElement();
    },

    /**
     * Set data of input element to node and detach input element on tree
     * @private
     */
    _setData: function() {
        var tree = this.tree;
        var nodeId = tree.getNodeIdFromElement(this.inputElement);
        var value = this.inputElement.value;
        var data = {};

        /**
         * @api
         * @event Tree#beforeEditNode
         * @param {string} value - Return value of editing input element
         * @example
         * tree
         *  .enableFeature('Editable')
         *  .on('beforeEditNode', function(value) {
         *      console.log(value);
         *      return false; // It cancels
         *      // return true; // It execute next
         *  });
         */
        if (!this.tree.invoke('beforeEditNode', value)) {
            this.isCustomEventIgnored = true;
            this.inputElement.focus();

            return;
        }

        if (nodeId) {
            data[this.dataKey] = value;
            tree.setNodeData(nodeId, data);
        }
        this._detachInputElement();
    },

    /**
     * Set apis of selectable tree
     * @private
     */
    _setAPIs: function() {
        var tree = this.tree;
        var bind = tui.util.bind;

        tui.util.forEach(API_LIST, function(apiName) {
            tree[apiName] = bind(this[apiName], this);
        }, this);
    }
});

module.exports = Editable;

},{"./../consts/ajaxCommand":2,"./../consts/states":6,"./../util":16}],12:[function(require,module,exports){
'use strict';

var util = require('./../util');

var API_LIST = [
        'select',
        'getSelectedNodeId',
        'deselect'
    ],
    defaults = {
        selectedClassName: 'tui-tree-selected'
    };

/**
 * Set the tree selectable
 * @class Selectable
 * @param {Tree} tree - Tree
 * @param {Object} options
 *  @param {string} options.selectedClassName - Classname for selected node.
 * @ignore
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
     * Deselect node by id
     * @memberOf Tree.prototype
     * @requires Selectable
     * @param {string} nodeId - Node id
     * @example
     * tree.deselect('tui-tree-node-3');
     */
    deselect: function() {
        var nodeId = this.selectedNodeId;
        var nodeElement = document.getElementById(nodeId);
        var tree = this.tree;

        if (!nodeElement) {
            return;
        }

        util.removeClass(nodeElement, this.selectedClassName);
        this.selectedNodeId = null;

        /**
         * @event Tree#deselect
         * @param {string} nodeId - Deselected node id
         * @example
         * tree
         *  .enableFeature('Selectable')
         *  .on('deselect', function(nodeId) {
         *      console.log('deselected node: ' + nodeId);
         *  });
         */
        tree.fire('deselect', nodeId);
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

},{"./../util":16}],13:[function(require,module,exports){
/**
 * @fileoverview Render tree and update tree.
 * @author NHN Ent. FE dev Lab <dl_javascript@nhnent.com>
 */

'use strict';

var util = require('./util'),
    defaultOption = require('./consts/defaultOption'),
    states = require('./consts/states'),
    messages = require('./consts/messages'),
    outerTemplate = require('./consts/outerTemplate'),
    ajaxCommand = require('./consts/ajaxCommand'),
    TreeModel = require('./treeModel'),
    Selectable = require('./features/selectable'),
    Draggable = require('./features/draggable'),
    Editable = require('./features/editable'),
    Checkbox = require('./features/checkbox'),
    ContextMenu = require('./features/contextMenu'),
    Ajax = require('./features/ajax');

var nodeStates = states.node,
    features = {
        Selectable: Selectable,
        Draggable: Draggable,
        Editable: Editable,
        Checkbox: Checkbox,
        ContextMenu: ContextMenu,
        Ajax: Ajax
    },
    snippet = tui.util,
    extend = snippet.extend,
    TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK = 200,
    MOUSE_MOVING_THRESHOLD = 5;
/**
 * Create tree model and inject data to model
 * @class Tree
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
 *             '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
 *             '<span class="{{textClass}}">{{text}}</span>' +
 *             '<ul class="{{subtreeClass}}">{{children}}</ul>',
 *         leafNode:
 *             '<span class="{{textClass}}">{{text}}</span>'
 *     },
 *     renderTemplate: function(tmpl, props) {
 *         // Mustache template engine
 *         return Mustache.render(tmpl, props);
 *     }
 * });
 *
 * @tutorial default
 * @tutorial depthLabel
 * @tutorial selectableNodes
 * @tutorial check
 * @tutorial ctxMenu
 * @tutorial ajaxFeature
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
         * @private
         */
        this.model = new TreeModel(data, options);

        /**
         * Enabled features
         * @type {Object.<string, object>}
         * @private
         */
        this.enabledFeatures = {};

        /**
         * Click timer to prevent click-duplication with double click
         * @type {number}
         * @private
         */
        this.clickTimer = null;

        /**
         * To prevent click event if mouse moved before mouseup.
         * @type {number}
         * @private
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
         *     var nodeId = treeEvent.nodeId;
         *     var originalParentId = treeEvent.originalParentId;
         *     var newParentId = treeEvent.newParentId;
         *     var index = treeEvent.index;
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

        util.removeClass(element, classNames.leafClass);

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
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't trigger the 'update' event
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @exmaple
     * tree.setNodeData(nodeId, {foo: 'bar'}); // auto refresh
     * tree.setNodeData(nodeId, {foo: 'bar'}, true); // not refresh
     */
    setNodeData: function(nodeId, data, options) {
        var self = this;
        var treeAjax = this.enabledFeatures.Ajax;
        var useAjax = options ? options.useAjax : !!treeAjax;
        var isSilent = options ? options.isSilent : false;

        if (useAjax) {
            treeAjax.loadData(ajaxCommand.UPDATE, function() {
                self._setNodeData(nodeId, data);
            }, {
                nodeId: nodeId,
                data: data,
                type: 'set'
            });
        } else {
            this._setNodeData(nodeId, data, isSilent);
        }
    },

    /**
     * Set data properties of a node (Core method)
     * @param {string} nodeId - Node id
     * @param {object} data - Properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     * @private
     */
    _setNodeData: function(nodeId, data, isSilent) {
        this.model.setNodeData(nodeId, data, isSilent);
    },

    /**
     * Remove node data
     * @api
     * @param {string} nodeId - Node id
     * @param {string|Array} names - Names of properties
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't trigger the 'update' event
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.setNodeData(nodeId, 'foo'); // auto refresh
     * tree.setNodeData(nodeId, 'foo', true); // not refresh
     */
    removeNodeData: function(nodeId, names, options) {
        var self = this;
        var treeAjax = this.enabledFeatures.Ajax;
        var useAjax = options ? options.useAjax : !!treeAjax;
        var isSilent = options ? options.isSilent : false;

        if (useAjax) {
            treeAjax.loadData(ajaxCommand.UPDATE, function() {
                self._removeNodeData(nodeId, names);
            }, {
                nodeId: nodeId,
                names: names,
                type: 'remove'
            });
        } else {
            this._removeNodeData(nodeId, names, isSilent);
        }
    },

    /**
     * Remove node data (Core method)
     * @param {string} nodeId - Node id
     * @param {string|Array} names - Names of properties
     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event
     * @private
     */
    _removeNodeData: function(nodeId, names, isSilent) {
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

        if (this.enabledFeatures.Ajax) {
            this._reload(nodeId);
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
        var node = this.model.getNode(nodeId);
        var state;

        if (!node || node.isRoot()) {
            return;
        }

        node.toggleState();
        state = node.getState();
        this._setDisplayFromNodeState(nodeId, state);

        if (this.enabledFeatures.Ajax) {
            this._reload(nodeId);
        }
    },

    /**
     * Reload children nodes while "stateLable" is clicked
     * @param {string} nodeId - Node id
     * @private
     */
    _reload: function(nodeId) {
        var node = this.model.getNode(nodeId);
        var state = node.getState();
        var isReload = snippet.isUndefined(node.getData('reload')) ||
                        node.getData('reload');

        if (state === nodeStates.CLOSED) { // open -> close action
            this._setNodeData(nodeId, {reload: false}, true);
        }

        if (state === nodeStates.OPENED && isReload) { // close -> open action
            this.resetAllData(null, {
                nodeId: nodeId,
                useAjax: true
            });
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
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't redraw children
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @returns {?Array.<string>} Added node ids
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
    add: function(data, parentId, options) {
        var self = this;
        var treeAjax = this.enabledFeatures.Ajax;
        var useAjax = options ? options.useAjax : !!treeAjax;
        var isSilent = options ? options.isSilent : false;
        var newChildIds;

        if (useAjax) {
            treeAjax.loadData(ajaxCommand.CREATE, function() {
                return self._add(data, parentId);
            }, {
                parentId: parentId,
                data: data
            });
        } else {
            newChildIds = this._add(data, parentId, isSilent);
        }

        return newChildIds;
    },

    /**
     * Add node(s). (Core method)
     * - If the parentId is falsy, the node will be appended to rootNode.
     * - If 'isSilent' is not true, it redraws the tree
     * @param {Array|object} data - Raw-data
     * @param {*} [parentId] - Parent id
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @returns {Array.<string>} Added node ids
     * @private
     */
    _add: function(data, parentId, isSilent) {
        return this.model.add(data, parentId, isSilent);
    },

    /**
     * Reset all data
     * @api
     * @param {Array|object} data - Raw data for all nodes
     * @param {object} [options] - Options
     *     @param {string} [options.nodeId] - Parent node id to reset all child data
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @returns {?Array.<string>} Added node ids
     * @example
     * tree.resetAllData([
     *  {text: 'hello', children: [
     *      {text: 'foo'},
     *      {text: 'bar'}
     *  ]},
     *  {text: 'world'}
     * ]);
     * tree.resetAllData([
     *  {text: 'hello world'}
     * ], {
     *  nodeId: 'tui-tree-node-5',
     *  useAjax: true
     * });
     */
    resetAllData: function(data, options) {
        var self = this;
        var treeAjax = this.enabledFeatures.Ajax;
        var nodeId = options ? options.nodeId : this.getRootNodeId();
        var useAjax = options ? options.useAjax : !!treeAjax;
        var newChildIds;

        if (useAjax) {
            treeAjax.loadData(ajaxCommand.READ, function(response) {
                return self._resetAllData(response, nodeId);
            }, {
                nodeId: nodeId
            });
        } else {
            newChildIds = this._resetAllData(data, nodeId);
        }

        return newChildIds;
    },

    /**
     * Reset all data (Core method)
     * @param {Array|object} data - Raw data for all nodes
     * @param {string} nodeId - Node id to reset data
     * @returns {Array.<string>} Added node ids
     * @private
     */
    _resetAllData: function(data, nodeId) {
        this._removeAllChildren(nodeId, {isSilent: true});

        return this._add(data, nodeId);
    },

    /**
     * Remove all children
     * @api
     * @param {string} nodeId - Parent node id
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't redraw the node
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.removeAllChildren(nodeId); // Redraws the node
     * tree.removeAllChildren(nodId, true); // Doesn't redraw the node
     */
    removeAllChildren: function(nodeId, options) {
        var self = this;
        var treeAjax = this.enabledFeatures.Ajax;
        var useAjax = options ? options.useAjax : !!treeAjax;
        var isSilent = options ? options.isSilent : false;

        if (useAjax) {
            treeAjax.loadData(ajaxCommand.DELETE_ALL_CHILDREN, function() {
                self._removeAllChildren(nodeId);
            }, {
                parentId: nodeId
            });
        } else {
            this._removeAllChildren(nodeId, isSilent);
        }
    },

    /**
     * Remove all children (Core method)
     * @param {string} nodeId - Parent node id
     * @param {boolean} [isSilent] - If true, it doesn't redraw the node
     * @private
     */
    _removeAllChildren: function(nodeId, isSilent) {
        var children = this.getChildIds(nodeId);

        snippet.forEach(children, function(childId) {
            this._remove(childId, true);
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
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't redraw children
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.remove(myNodeId); // remove node with redrawing
     * tree.remove(myNodeId, true); // remove node without redrawing
     */
    remove: function(nodeId, options) {
        var self = this;
        var treeAjax = this.enabledFeatures.Ajax;
        var useAjax = options ? options.useAjax : !!treeAjax;
        var isSilent = options ? options.isSilent : false;

        if (useAjax) {
            treeAjax.loadData(ajaxCommand.DELETE, function() {
                self._remove(nodeId);
            }, {
                nodeId: nodeId
            });
        } else {
            this._remove(nodeId, isSilent);
        }
    },

    /**
     * Remove a node with children. (Core method)
     * - If 'isSilent' is not true, it redraws the tree
     * @param {string} nodeId - Node id to remove
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @private
     */
    _remove: function(nodeId, isSilent) {
        this.model.remove(nodeId, isSilent);
    },

    /**
     * Move a node to new parent
     * - If 'isSilent' is not true, it redraws the tree
     * @api
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {number} index - Index number of selected node
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't trigger the 'update' event
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.move(myNodeId, newParentId); // mode node with redrawing
     * tree.move(myNodeId, newParentId, true); // move node without redrawing
     */
    move: function(nodeId, newParentId, index, options) {
        var self = this;
        var treeAjax = this.enabledFeatures.Ajax;
        var useAjax = options ? options.useAjax : !!treeAjax;
        var isSilent = options ? options.isSilent : false;

        if (useAjax) {
            treeAjax.loadData(ajaxCommand.MOVE, function() {
                if (self.getParentId(nodeId) !== newParentId) { // just move, not sort!
                    self.setNodeData(newParentId, {reload: true}, true);
                }
                self._move(nodeId, newParentId, index);
            }, {
                nodeId: nodeId,
                newParentId: newParentId,
                index: index
            });
        } else {
            this._move(nodeId, newParentId, index, isSilent);
        }
    },

    /**
     * Move a node to new parent (Core method)
     * - If 'isSilent' is not true, it redraws the tree
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {number} index - Index number of selected node
     * @param {boolean} [isSilent] - If true, it doesn't redraw children
     * @private
     */
    _move: function(nodeId, newParentId, index, isSilent) {
        /**
         * @api
         * @event Tree#beforeMove
         * @param {string} nodeId - Current dragging node id
         * @param {string} parentId - New parent id
         * @example
         * tree.on('beforeMove', function(nodeId, parentId) {
         *      console.log('dragging node: ' + nodeId);
         *      console.log('parent node: ' + parentId);
         *
         *      return false; // Cancel "move" event
         *      // return true; // Fire "move" event
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
     *      defaultValue: 'new node',
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
     *  .enableFeature('ContextMenu', {
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
     *  .enableFeature('Ajax', {
     *      command: {
     *          read: {
     *              url: 'api/read',
     *              dataType: 'json',
     *              type: 'get'
     *          },
     *          create: {
     *              url: 'api/create',
     *              dataType: 'json',
     *              type: 'post'
     *          },
     *          update: {
     *              url: 'api/update',
     *              dataType: 'json',
     *              type: 'post',
     *              data: {
     *                  paramA: 'a',
     *                  paramB: 'b'
     *              }
     *          },
     *          remove: {
     *              url: 'api/remove',
     *              dataType: 'json',
     *              type: 'post',
     *              data: function(params) {
     *                  return {
     *                      paramA: params.a,
     *                      paramB: params.b
     *                  };
     *              }
     *          },
     *          removeAllChildren: {
     *              url: function(params) {
     *                  return 'api/remove_all/' + params.nodeId,
     *              },
     *              dataType: 'json',
     *              type: 'post'
     *          },
     *          move: {
     *              url: 'api/move',
     *              dataType: 'json',
     *              type: 'post'
     *          }
     *      },
     *      parseData: function(type, response) {
     *          if (type === 'read' && response.code === '200') {
     *              return response;
     *          } else {
     *              return false;
     *          }
     *      }
     *  });
     */
    enableFeature: function(featureName, options) {
        var Feature = features[featureName];
        this.disableFeature(featureName);
        if (Feature) {
            this.enabledFeatures[featureName] = new Feature(this, options);
            this.fire('initFeature');
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
     *  .disableFeature('ContextMenu')
     *  .disableFeature('Ajax');
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
 * @ignore
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

},{"./consts/ajaxCommand":2,"./consts/defaultOption":3,"./consts/messages":4,"./consts/outerTemplate":5,"./consts/states":6,"./features/ajax":7,"./features/checkbox":8,"./features/contextMenu":9,"./features/draggable":10,"./features/editable":11,"./features/selectable":12,"./treeModel":14,"./util":16}],14:[function(require,module,exports){
/**
 * @fileoverview Update view and control tree data
 * @author NHN Ent. FE dev Lab <dl_javascript@nhnent.com>
 */
'use strict';

var TreeNode = require('./treeNode');

var extend = tui.util.extend,
    keys = tui.util.keys,
    forEach = tui.util.forEach,
    map = tui.util.map;

/**
 * Tree model
 * @class TreeModel
 * @param {Array} data - Data
 * @param {Object} options - Options for defaultState and nodeIdPrefix
 * @ignore
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
        var originalParentId, newParent;

        if (!node) {
            return;
        }

        newParent = this.getNode(newParentId) || this.rootNode;
        newParentId = newParent.getId();
        originalParentId = node.getParentId();
        index = tui.util.isUndefined(index) ? -1 : index;

        if (nodeId === newParentId || this.contains(nodeId, newParentId)) {
            return;
        }

        this._changeOrderOfIds(nodeId, newParentId, originalParentId, index);

        if (!isSilent) {
            this.fire('move', nodeId, originalParentId, newParentId, index);
        }
    }, /*eslint-enable complexity*/

    /**
     * Change order of ids
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {string} originalParentId - Original parent id
     * @param {number} index - Moving index (When child node is moved on parent node, the value is -1)
     * @private
     */
    _changeOrderOfIds: function(nodeId, newParentId, originalParentId, index) {
        var node = this.getNode(nodeId);
        var newParent = this.getNode(newParentId) || this.rootNode;
        var originalParent = this.getNode(originalParentId);
        var isSameParentIds = (newParentId === originalParentId);

        if (index !== -1) {
            if (isSameParentIds) {
                newParent.moveChildId(nodeId, index);
            } else {
                newParent.insertChildId(nodeId, index);
                originalParent.removeChildId(nodeId);
            }
        } else if (!isSameParentIds) {
            newParent.addChildId(nodeId);
            originalParent.removeChildId(nodeId);
        }

        node.setParentId(newParentId);
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

},{"./treeNode":15}],15:[function(require,module,exports){
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
 * @Class TreeNode
 * @param {Object} nodeData - Node data
 * @param {string} [parentId] - Parent node id
 * @ignore
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
        return !this._childIds.length && !this.getData('hasChild');
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

},{"./consts/states":6,"./util":16}],16:[function(require,module,exports){
/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN Ent. FE dev Lab <dl_javascript@nhnent.com>
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

/**
 * @ignore
 */
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMvYWpheENvbW1hbmQuanMiLCJzcmMvanMvY29uc3RzL2RlZmF1bHRPcHRpb24uanMiLCJzcmMvanMvY29uc3RzL21lc3NhZ2VzLmpzIiwic3JjL2pzL2NvbnN0cy9vdXRlclRlbXBsYXRlLmpzIiwic3JjL2pzL2NvbnN0cy9zdGF0ZXMuanMiLCJzcmMvanMvZmVhdHVyZXMvYWpheC5qcyIsInNyYy9qcy9mZWF0dXJlcy9jaGVja2JveC5qcyIsInNyYy9qcy9mZWF0dXJlcy9jb250ZXh0TWVudS5qcyIsInNyYy9qcy9mZWF0dXJlcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvZWRpdGFibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy90cmVlLmpzIiwic3JjL2pzL3RyZWVNb2RlbC5qcyIsInNyYy9qcy90cmVlTm9kZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Y0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnZhciBUcmVlID0gcmVxdWlyZSgnLi9zcmMvanMvdHJlZScpO1xudHVpLnV0aWwuZGVmaW5lTmFtZXNwYWNlKCd0dWkuY29tcG9uZW50Jywge1xuICAgIFRyZWU6IFRyZWVcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEFqYXggY29tbWFuIGluIHRyZWVcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgUkVBRDogJ3JlYWQnLFxuICAgIENSRUFURTogJ2NyZWF0ZScsXG4gICAgVVBEQVRFOiAndXBkYXRlJyxcbiAgICBERUxFVEU6ICdyZW1vdmUnLFxuICAgIERFTEVURV9BTExfQ0hJTERSRU46ICdyZW1vdmVBbGxDaGlsZHJlbicsXG4gICAgTU9WRTogJ21vdmUnXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1ha2UgY2xhc3MgbmFtZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgY2xhc3MgbmFtZVxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0ga2V5cyAtIEtleXMgb2YgY2xhc3MgbmFtZXNcbiAqIEByZXR1cm5zIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn0gQ2xhc3MgbmFtZXMgbWFwXG4gKiBAaWdub3JlXG4gKi9cbmZ1bmN0aW9uIG1ha2VDbGFzc05hbWVzKHByZWZpeCwga2V5cykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICB0dWkudXRpbC5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBvYmpba2V5ICsgJ0NsYXNzJ10gPSBwcmVmaXggKyBrZXk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEEgZGVmYXVsdCB2YWx1ZXMgZm9yIHRyZWVcbiAqIEBjb25zdFxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBub2RlRGVmYXVsdFN0YXRlIC0gTm9kZSBzdGF0ZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVJZFByZWZpeCAtIE5vZGUgaWQgcHJlZml4XG4gKiBAcHJvcGVydHkge29iamVjdH0gc3RhdGVMYWJlbCAtIFN0YXRlIGxhYmVsIGluIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5vcGVuZWQgLSAnLSdcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3RhdGVMYWJlbC5jbG9zZWQgLSAnKydcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSB0ZW1wbGF0ZSAtIFRlbXBsYXRlIGh0bWwgZm9yIHRoZSBub2Rlcy5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUuaW50ZXJuYWxOb2RlIC0gVGVtcGxhdGUgaHRtbCBmb3IgaW50ZXJuYWwgbm9kZS5cbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGVtcGxhdGUubGVhZk5vZGUgLSBUZW1wbGF0ZSBodG1sIGZvciBsZWFmIG5vZGUuXG4gKiBAcHJvcGVydHkge29iamVjdH0gY2xhc3NOYW1lcyAtIENsYXNzIG5hbWVzIG9mIGVsZW1lbnRzIGluIHRyZWVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gb3BlbmVkQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBjbG9zZWRDbGFzcyAtIENsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVDbGFzcyAtIENsYXNzIG5hbWUgZm9yIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gbGVhZkNsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgbGVhZiBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN1YnRyZWVDbGFzcyAgLSBDbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdG9nZ2xlQnRuQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gdGV4dENsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgdGV4dCBlbGVtZW50IGluIGEgbm9kZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcbiAgICBzdGF0ZUxhYmVsczoge1xuICAgICAgICBvcGVuZWQ6ICctJyxcbiAgICAgICAgY2xvc2VkOiAnKydcbiAgICB9LFxuICAgIG5vZGVJZFByZWZpeDogJ3R1aS10cmVlLW5vZGUtJyxcbiAgICBjbGFzc05hbWVzOiBtYWtlQ2xhc3NOYW1lcygndHVpLXRyZWUtJywgW1xuICAgICAgICAnbm9kZScsXG4gICAgICAgICdsZWFmJyxcbiAgICAgICAgJ29wZW5lZCcsXG4gICAgICAgICdjbG9zZWQnLFxuICAgICAgICAnc3VidHJlZScsXG4gICAgICAgICd0b2dnbGVCdG4nLFxuICAgICAgICAndGV4dCdcbiAgICBdKSxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICBpbnRlcm5hbE5vZGU6XG4gICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPicsXG4gICAgICAgIGxlYWZOb2RlOlxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPidcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1lc3NhZ2VzIGZvciB0cmVlXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIElOVkFMSURfUk9PVF9FTEVNRU5UOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogUm9vdCBlbGVtZW50IGlzIGludmFsaWQuJyxcbiAgICBJTlZBTElEX0FQSTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IElOVkFMSURfQVBJJyxcbiAgICBJTlZBTElEX0FQSV9TRUxFQ1RBQkxFOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJTZWxlY3RhYmxlXCIgaXMgbm90IGVuYWJsZWQuJyxcbiAgICBJTlZBTElEX0FQSV9FRElUQUJMRTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiRWRpdGFibGVcIiBpcyBub3QgZW5hYmxlZC4nLFxuICAgIElOVkFMSURfQVBJX0RSQUdHQUJMRTogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiRHJhZ2dhYmxlXCIgaXMgbm90IGVuYWJsZWQuJyxcbiAgICBJTlZBTElEX0FQSV9DSEVDS0JPWDogJ1widHVpLWNvbXBvbmVudC10cmVlXCI6IFRoZSBmZWF0dXJlLVwiQ2hlY2tib3hcIiBpcyBub3QgZW5hYmxlZC4nXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE91dGVyIHRlbXBsYXRlXG4gKiBAdHlwZSB7e2ludGVybmFsTm9kZTogc3RyaW5nLCBsZWFmTm9kZTogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgSU5URVJOQUxfTk9ERTpcbiAgICAgICAgJzxsaSBpZD1cInt7aWR9fVwiIGNsYXNzPVwie3tub2RlQ2xhc3N9fSB7e3N0YXRlQ2xhc3N9fVwiPicgK1xuICAgICAgICAgICAgJ3t7aW5uZXJUZW1wbGF0ZX19JyArXG4gICAgICAgICc8L2xpPicsXG4gICAgTEVBRl9OT0RFOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ7e25vZGVDbGFzc319IHt7bGVhZkNsYXNzfX1cIj4nICtcbiAgICAgICAgICAgICd7e2lubmVyVGVtcGxhdGV9fScgK1xuICAgICAgICAnPC9saT4nXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFN0YXRlcyBpbiB0cmVlXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIFN0YXRlcyBvZiBub2RlXG4gICAgICogQHR5cGUge3tPUEVORUQ6IHN0cmluZywgQ0xPU0VEOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIG5vZGU6IHtcbiAgICAgICAgT1BFTkVEOiAnb3BlbmVkJyxcbiAgICAgICAgQ0xPU0VEOiAnY2xvc2VkJ1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzbmlwcGV0ID0gdHVpLnV0aWw7XG52YXIgQVBJX0xJU1QgPSBbXTtcbnZhciBMT0FERVJfQ0xBU1NOQU1FID0gJ3R1aS10cmVlLWxvYWRlcic7XG5cbi8qKlxuICogU2V0IEFqYXggZmVhdHVyZSBvbiB0cmVlXG4gKiBAY2xhc3MgQWpheFxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMuY29tbWFuZCAtIEVhY2ggQWpheCByZXF1ZXN0IGNvbW1hbmQgb3B0aW9uc1xuICogIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLnBhcnNlRGF0YV0gLSBGdW5jdGlvbiB0byBwYXJzZSBhbmQgcmV0dXJuIHRoZSByZXNwb25zZSBkYXRhXG4gKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmxvYWRlckNsYXNzTmFtZV0gLSBDbGFzc25hbWUgb2YgbG9hZGVyIGVsZW1lbnRcbiAqICBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmlzTG9hZFJvb3RdIC0gV2hldGhlciBsb2FkIGRhdGEgZnJvbSByb290IG5vZGUgb3Igbm90XG4gKiBAaWdub3JlXG4gKi9cbnZhciBBamF4ID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBBamF4LnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIEFqYXhcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBBamF4XG4gICAgICAgICAqL1xuICAgICAgICBnZXRBUElMaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBBUElfTElTVC5zbGljZSgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbih0cmVlLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbnMgPSB0dWkudXRpbC5leHRlbmQoe30sIG9wdGlvbnMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmVlXG4gICAgICAgICAqIEB0eXBlIHtUcmVlfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9uIGZvciBlYWNoIHJlcXVlc3QgY29tbWFuZFxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb21tYW5kID0gb3B0aW9ucy5jb21tYW5kO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsYmFjayBmb3IgcGFyc2luZyB0aGUgcmVzcG9uc2UgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7P0Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wYXJzZURhdGEgPSBvcHRpb25zLnBhcnNlRGF0YSB8fCBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGFzc25hbWUgb2YgbG9hZGVyIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubG9hZGVyQ2xhc3NOYW1lID0gb3B0aW9ucy5sb2FkZXJDbGFzc05hbWUgfHwgTE9BREVSX0NMQVNTTkFNRTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhdGUgb2YgbG9hZGluZyByb290IGRhdGEgb3Igbm90XG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0xvYWRSb290ID0gIXNuaXBwZXQuaXNVbmRlZmluZWQob3B0aW9ucy5pc0xvYWRSb290KSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5pc0xvYWRSb290IDogdHJ1ZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9hZGVyIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5sb2FkZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX2NyZWF0ZUxvYWRlcigpO1xuXG4gICAgICAgIHRyZWUub24oJ2luaXRGZWF0dXJlJywgc25pcHBldC5iaW5kKHRoaXMuX29uSW5pdEZlYXR1cmUsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciBcImluaXRGZWF0dXJlXCJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkluaXRGZWF0dXJlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzTG9hZFJvb3QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudHJlZS5yZXNldEFsbERhdGEoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSB0aGlzIG1vZHVsZVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcblxuICAgICAgICB0aGlzLl9yZW1vdmVMb2FkZXIoKTtcblxuICAgICAgICB0cmVlLm9mZih0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTG9hZCBkYXRhIHRvIHJlcXVlc3Qgc2VydmVyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBDb21tYW5kIHR5cGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEV4ZWN1dGVkIGZ1bmN0aW9uIGFmdGVyIHJlc3BvbnNlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbXNdIC0gVmFsdWVzIHRvIG1ha2UgXCJkYXRhXCIgcHJvcGVydHkgdXNpbmcgcmVxdWVzdFxuICAgICAqL1xuICAgIGxvYWREYXRhOiBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgcGFyYW1zKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG9wdGlvbnM7XG5cbiAgICAgICAgaWYgKCF0aGlzLmNvbW1hbmQgfHwgIXRoaXMuY29tbWFuZFt0eXBlXSB8fFxuICAgICAgICAgICAgIXRoaXMuY29tbWFuZFt0eXBlXS51cmwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLl9nZXREZWZhdWx0UmVxdWVzdE9wdGlvbnModHlwZSwgcGFyYW1zKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVBamF4UmVxdWVzdFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29tbWFuZCAtIENvbW1hbmQgdHlwZVxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2RhdGFdIC0gUmVxdWVzdCBkYXRhXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2JlZm9yZUFqYXhSZXF1ZXN0JywgZnVuY3Rpb24oY29tbWFuZCwgZGF0YSkge1xuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ2JlZm9yZSAnICsgY29tbWFuZCArICcgcmVxdWVzdCEnKTtcbiAgICAgICAgICogICAgIHJldHVybiBmYWxzZTsgLy8gSXQgY2FuY2VscyByZXF1ZXN0XG4gICAgICAgICAqICAgICAvLyByZXR1cm4gdHJ1ZTsgLy8gSXQgZmlyZXMgcmVxdWVzdFxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIGlmICghdGhpcy50cmVlLmludm9rZSgnYmVmb3JlQWpheFJlcXVlc3QnLCB0eXBlLCBwYXJhbXMpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zaG93TG9hZGVyKCk7XG5cbiAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHNlbGYuX3Jlc3BvbnNlU3VjY2Vzcyh0eXBlLCBjYWxsYmFjaywgcmVzcG9uc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX3Jlc3BvbnNlRXJyb3IodHlwZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJC5hamF4KG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcm9jZXNzaW5nIHdoZW4gcmVzcG9uc2UgaXMgc3VjY2Vzc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gQ29tbWFuZCB0eXBlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBFeGVjdXRlZCBmdW5jdGlvbiBhZnRlciByZXNwb25zZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fGJvb2xlYW59IFtyZXNwb25zZV0gLSBSZXNwb25zZSBkYXRhIGZyb20gc2VydmVyIG9yIHJldHVybiB2YWx1ZSBvZiBcInBhcnNlRGF0YVwiXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVzcG9uc2VTdWNjZXNzOiBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBkYXRhO1xuXG4gICAgICAgIHRoaXMuX2hpZGVMb2FkZXIoKTtcblxuICAgICAgICBpZiAodGhpcy5wYXJzZURhdGEpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlID0gdGhpcy5wYXJzZURhdGEodHlwZSwgcmVzcG9uc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBkYXRhID0gY2FsbGJhY2socmVzcG9uc2UpO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBhcGlcbiAgICAgICAgICAgICAqIEBldmVudCBUcmVlI3N1Y2Nlc3NBamF4UmVzcG9uc2VcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb21tYW5kIC0gQ29tbWFuZCB0eXBlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2RhdGFdIC0gUmV0dXJuIHZhbHVlIG9mIGV4ZWN1dGVkIGNvbW1hbmQgY2FsbGJhY2tcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlLm9uKCdzdWNjZXNzQWpheFJlc3BvbnNlJywgZnVuY3Rpb24oY29tbWFuZCwgZGF0YSkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKGNvbW1hbmQgKyAnIHJlc3BvbnNlIGlzIHN1Y2Nlc3MhJyk7XG4gICAgICAgICAgICAgKiAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAqICAgICAgICAgICBjb25zb2xlLmxvZygnbmV3IGFkZCBpZHMgOicgKyBkYXRhKTtcbiAgICAgICAgICAgICAqICAgICB9XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdHJlZS5maXJlKCdzdWNjZXNzQWpheFJlc3BvbnNlJywgdHlwZSwgZGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBhcGlcbiAgICAgICAgICAgICAqIEBldmVudCBUcmVlI2ZhaWxBamF4UmVzcG9uc2VcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb21tYW5kIC0gQ29tbWFuZCB0eXBlXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdHJlZS5vbignZmFpbEFqYXhSZXNwb25zZScsIGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyhjb21tYW5kICsgJyByZXNwb25zZSBpcyBmYWlsIScpO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRyZWUuZmlyZSgnZmFpbEFqYXhSZXNwb25zZScsIHR5cGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByb2Nlc3Npbmcgd2hlbiByZXNwb25zZSBpcyBlcnJvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gQ29tbWFuZCB0eXBlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB0aGlzLl9oaWRlTG9hZGVyKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjZXJyb3JBamF4UmVzcG9uc2VcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmQgLSBDb21tYW5kIHR5cGVcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbignZXJyb3JBamF4UmVzcG9uc2UnLCBmdW5jdGlvbihjb21tYW5kKSB7XG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZyhjb21tYW5kICsgJyByZXNwb25zZSBpcyBlcnJvciEnKTtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWUuZmlyZSgnZXJyb3JBamF4UmVzcG9uc2UnLCB0eXBlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGRlZmF1bHQgcmVxdWVzdCBvcHRpb25zXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBDb21tYW5kIHR5cGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3BhcmFtc10gLSBWYWx1ZSBvZiByZXF1ZXN0IG9wdGlvbiBcImRhdGFcIlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IERlZmF1bHQgb3B0aW9ucyB0byByZXF1ZXN0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0RGVmYXVsdFJlcXVlc3RPcHRpb25zOiBmdW5jdGlvbih0eXBlLCBwYXJhbXMpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLmNvbW1hbmRbdHlwZV07XG5cbiAgICAgICAgaWYgKHNuaXBwZXQuaXNGdW5jdGlvbihvcHRpb25zLnVybCkpIHsgLy8gZm9yIHJlc3RmdWwgQVBJIHVybFxuICAgICAgICAgICAgb3B0aW9ucy51cmwgPSBvcHRpb25zLnVybChwYXJhbXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNuaXBwZXQuaXNGdW5jdGlvbihvcHRpb25zLmRhdGEpKSB7IC8vIGZvciBjdXN0b20gcmVxdWVzdCBkYXRhXG4gICAgICAgICAgICBvcHRpb25zLmRhdGEgPSBvcHRpb25zLmRhdGEocGFyYW1zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdGlvbnMudHlwZSA9IChvcHRpb25zLnR5cGUpID8gb3B0aW9ucy50eXBlLnRvTG93ZXJDYXNlKCkgOiAnZ2V0JztcbiAgICAgICAgb3B0aW9ucy5kYXRhVHlwZSA9IG9wdGlvbnMuZGF0YVR5cGUgfHwgJ2pzb24nO1xuXG4gICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgbG9hZGVyIGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVMb2FkZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIGxvYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgICAgICBsb2FkZXIuY2xhc3NOYW1lID0gdGhpcy5sb2FkZXJDbGFzc05hbWU7XG4gICAgICAgIGxvYWRlci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgICAgIHRyZWUucm9vdEVsZW1lbnQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChsb2FkZXIpO1xuXG4gICAgICAgIHRoaXMubG9hZGVyID0gbG9hZGVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgbG9hZGVyIGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVMb2FkZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIGxvYWRlciA9IHRoaXMubG9hZGVyO1xuXG4gICAgICAgIHRyZWUucm9vdEVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChsb2FkZXIpO1xuXG4gICAgICAgIHRoaXMubG9hZGVyID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2hvdyBsb2FkZXIgZWxlbWVudCBvbiB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2hvd0xvYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubG9hZGVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIaWRlIGxvYWRlciBlbGVtZW50IG9uIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9oaWRlTG9hZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5sb2FkZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBamF4O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcbnZhciBBUElfTElTVCA9IFtcbiAgICAnY2hlY2snLFxuICAgICd1bmNoZWNrJyxcbiAgICAndG9nZ2xlQ2hlY2snLFxuICAgICdpc0NoZWNrZWQnLFxuICAgICdpc0luZGV0ZXJtaW5hdGUnLFxuICAgICdpc1VuY2hlY2tlZCcsXG4gICAgJ2dldENoZWNrZWRMaXN0JyxcbiAgICAnZ2V0VG9wQ2hlY2tlZExpc3QnLFxuICAgICdnZXRCb3R0b21DaGVja2VkTGlzdCdcbl07XG5cbi8qIENoZWNrYm94IHRyaS1zdGF0ZXMgKi9cbnZhciBTVEFURV9DSEVDS0VEID0gMSxcbiAgICBTVEFURV9VTkNIRUNLRUQgPSAyLFxuICAgIFNUQVRFX0lOREVURVJNSU5BVEUgPSAzLFxuICAgIERBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURSA9ICdfX0NoZWNrQm94U3RhdGVfXycsXG4gICAgREFUQSA9IHt9O1xuXG52YXIgZmlsdGVyID0gdHVpLnV0aWwuZmlsdGVyLFxuICAgIGZvckVhY2ggPSB0dWkudXRpbC5mb3JFYWNoO1xuLyoqXG4gKiBTZXQgdGhlIGNoZWNrYm94LWFwaVxuICogQGNsYXNzIENoZWNrYm94XG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uIC0gT3B0aW9uXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbi5jaGVja2JveENsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBjaGVja2JveCBlbGVtZW50XG4gKiBAaWdub3JlXG4gKi9cbnZhciBDaGVja2JveCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgQ2hlY2tib3gucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIENoZWNrYm94XG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgY2hlY2tib3hcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbikgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbiA9IHR1aS51dGlsLmV4dGVuZCh7fSwgb3B0aW9uKTtcblxuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLmNoZWNrYm94Q2xhc3NOYW1lID0gb3B0aW9uLmNoZWNrYm94Q2xhc3NOYW1lO1xuICAgICAgICB0aGlzLmNoZWNrZWRMaXN0ID0gW107XG4gICAgICAgIHRoaXMucm9vdENoZWNrYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnSU5QVVQnKTtcbiAgICAgICAgdGhpcy5yb290Q2hlY2tib3gudHlwZSA9ICdjaGVja2JveCc7XG5cbiAgICAgICAgdGhpcy5fc2V0QVBJcygpO1xuICAgICAgICB0aGlzLl9hdHRhY2hFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSB0aGlzIG1vZHVsZVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcblxuICAgICAgICB0cmVlLm9mZih0aGlzKTtcbiAgICAgICAgZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRyZWVbYXBpTmFtZV07XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgYXBpcyBvZiBjaGVja2JveCB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0QVBJczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgYmluZCA9IHR1aS51dGlsLmJpbmQ7XG5cbiAgICAgICAgZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgdHJlZVthcGlOYW1lXSA9IGJpbmQodGhpc1thcGlOYW1lXSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggZXZlbnQgdG8gdHJlZSBpbnN0YW5jZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2F0dGFjaEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJlZS5vbih7XG4gICAgICAgICAgICBzaW5nbGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgICAgICAgICBub2RlSWQsIHN0YXRlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmNoZWNrYm94Q2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlSWQgPSB0aGlzLnRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZUZyb21DaGVja2JveCh0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb250aW51ZVBvc3Rwcm9jZXNzaW5nKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZnRlckRyYXc6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyZWUuaXNNb3ZpbmdOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdENoYW5nZXMobm9kZUlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtb3ZlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy9AdG9kbyAtIE9wdGltaXphdGlvblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlZmxlY3RDaGFuZ2VzKGRhdGEub3JpZ2luYWxQYXJlbnRJZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdENoYW5nZXMoZGF0YS5uZXdQYXJlbnRJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZWZsZWN0IHRoZSBjaGFuZ2VzIG9uIG5vZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZWZsZWN0Q2hhbmdlczogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHRoaXMudHJlZS5lYWNoKGZ1bmN0aW9uKGRlc2NlbmRhbnQsIGRlc2NlbmRhbnRJZCkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUoZGVzY2VuZGFudElkLCB0aGlzLl9nZXRTdGF0ZShkZXNjZW5kYW50SWQpLCB0cnVlKTtcbiAgICAgICAgfSwgbm9kZUlkLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fanVkZ2VPd25TdGF0ZShub2RlSWQpO1xuICAgICAgICB0aGlzLl91cGRhdGVBbGxBbmNlc3RvcnNTdGF0ZShub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY2hlY2tib3ggYXR0cmlidXRlcyAoY2hlY2tlZCwgaW5kZXRlcm1pbmF0ZSlcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGNoZWNrYm94IC0gQ2hlY2tib3ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNDaGVja2VkIC0gXCJjaGVja2VkXCJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzSW5kZXRlcm1pbmF0ZSAtIFwiaW5kZXRlcm1pbmF0ZVwiXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q2hlY2tib3hBdHRyOiBmdW5jdGlvbihjaGVja2JveCwgaXNDaGVja2VkLCBpc0luZGV0ZXJtaW5hdGUpIHtcbiAgICAgICAgY2hlY2tib3guaW5kZXRlcm1pbmF0ZSA9IGlzSW5kZXRlcm1pbmF0ZTtcbiAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IGlzQ2hlY2tlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNraW5nIHN0YXRlIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0ZSAtIFN0YXRlIGZvciBjaGVja2JveFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0b3BQcm9wYWdhdGlvbl0gLSBJZiB0cnVlLCBzdG9wIGNoYW5naW5nIHN0YXRlIHByb3BhZ2F0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUsIHN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICB2YXIgY2hlY2tib3ggPSB0aGlzLl9nZXRDaGVja2JveEVsZW1lbnQobm9kZUlkKTtcblxuICAgICAgICBpZiAoIWNoZWNrYm94KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIFNUQVRFX0NIRUNLRUQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0Q2hlY2tib3hBdHRyKGNoZWNrYm94LCB0cnVlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNUQVRFX1VOQ0hFQ0tFRDpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNUQVRFX0lOREVURVJNSU5BVEU6XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0Q2hlY2tib3hBdHRyKGNoZWNrYm94LCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OiAvLyBubyBtb3JlIHByb2Nlc3MgaWYgdGhlIHN0YXRlIGlzIGludmFsaWRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb250aW51ZVBvc3Rwcm9jZXNzaW5nKG5vZGVJZCwgc3RhdGUsIHN0b3BQcm9wYWdhdGlvbik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2luZyBzdGF0ZSBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBDaGVja2luZyBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN0YXRlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBzdGF0ZSA9IHRyZWUuZ2V0Tm9kZURhdGEobm9kZUlkKVtEQVRBX0tFWV9GT1JfQ0hFQ0tCT1hfU1RBVEVdLFxuICAgICAgICAgICAgY2hlY2tib3g7XG5cbiAgICAgICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICAgICAgY2hlY2tib3ggPSB0aGlzLl9nZXRDaGVja2JveEVsZW1lbnQobm9kZUlkKTtcbiAgICAgICAgICAgIHN0YXRlID0gdGhpcy5fZ2V0U3RhdGVGcm9tQ2hlY2tib3goY2hlY2tib3gpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tpbmcgc3RhdGUgb2Ygbm9kZSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGNoZWNrYm94IC0gQ2hlY2tib3ggZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHs/bnVtYmVyfSBDaGVja2luZyBzdGF0ZVxuICAgICAqL1xuICAgIF9nZXRTdGF0ZUZyb21DaGVja2JveDogZnVuY3Rpb24oY2hlY2tib3gpIHtcbiAgICAgICAgdmFyIHN0YXRlO1xuXG4gICAgICAgIGlmICghY2hlY2tib3gpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoZWNrYm94LmNoZWNrZWQpIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfQ0hFQ0tFRDtcbiAgICAgICAgfSBlbHNlIGlmIChjaGVja2JveC5pbmRldGVybWluYXRlKSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFX0lOREVURVJNSU5BVEU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFNUQVRFX1VOQ0hFQ0tFRDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ29udGludWUgcG9zdC1wcm9jZXNzaW5nIGZyb20gY2hhbmdpbmc6Y2hlY2tib3gtc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0ZSAtIENoZWNrYm94IHN0YXRlXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RvcFByb3BhZ2F0aW9uXSAtIElmIHRydWUsIHN0b3AgdXBkYXRlLXByb3BhZ2F0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29udGludWVQb3N0cHJvY2Vzc2luZzogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSB0aGlzLmNoZWNrZWRMaXN0LFxuICAgICAgICAgICAgZXZlbnROYW1lO1xuXG4gICAgICAgIC8qIFByZXZlbnQgZHVwbGljYXRlZCBub2RlIGlkICovXG4gICAgICAgIHV0aWwucmVtb3ZlSXRlbUZyb21BcnJheShub2RlSWQsIGNoZWNrZWRMaXN0KTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IFNUQVRFX0NIRUNLRUQpIHtcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0LnB1c2gobm9kZUlkKTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFRyZWUjY2hlY2tcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBDaGVja2VkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlLm9uKCdjaGVjaycsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCdjaGVja2VkOiAnICsgbm9kZUlkKTtcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBldmVudE5hbWUgPSAnY2hlY2snO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBTVEFURV9VTkNIRUNLRUQpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFRyZWUjdW5jaGVja1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFVuY2hlY2tlZCBub2RlIGlkXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdHJlZS5vbigndW5jaGVjaycsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCd1bmNoZWNrZWQ6ICcgKyBub2RlSWQpO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGV2ZW50TmFtZSA9ICd1bmNoZWNrJztcbiAgICAgICAgfVxuICAgICAgICBEQVRBW0RBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURV0gPSBzdGF0ZTtcblxuICAgICAgICB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgREFUQSwge1xuICAgICAgICAgICAgaXNTaWxlbnQ6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BhZ2F0ZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xuICAgICAgICAgICAgdHJlZS5maXJlKGV2ZW50TmFtZSwgbm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcm9wYWdhdGUgYSBub2RlIHN0YXRlIHRvIGRlc2NlbmRhbnRzIGFuZCBhbmNlc3RvcnMgZm9yIHVwZGF0aW5nIHRoZWlyIHN0YXRlc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gQ2hlY2tib3ggc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wcm9wYWdhdGVTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUgPT09IFNUQVRFX0lOREVURVJNSU5BVEUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbERlc2NlbmRhbnRzU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBhbGwgZGVzY2VuZGFudHMgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0ZSAtIFN0YXRlIGZvciBjaGVja2JveFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZUFsbERlc2NlbmRhbnRzU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCwgc3RhdGUpIHtcbiAgICAgICAgdGhpcy50cmVlLmVhY2goZnVuY3Rpb24oZGVzY2VuZGFudCwgZGVzY2VuZGFudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShkZXNjZW5kYW50SWQsIHN0YXRlLCB0cnVlKTtcbiAgICAgICAgfSwgbm9kZUlkLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGFsbCBhbmNlc3RvcnMgc3RhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRyZWUuZ2V0UGFyZW50SWQobm9kZUlkKTtcblxuICAgICAgICB3aGlsZSAocGFyZW50SWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2p1ZGdlT3duU3RhdGUocGFyZW50SWQpO1xuICAgICAgICAgICAgcGFyZW50SWQgPSB0cmVlLmdldFBhcmVudElkKHBhcmVudElkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBKdWRnZSBvd24gc3RhdGUgZnJvbSBjaGlsZCBub2RlIGlzIGNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2p1ZGdlT3duU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoaWxkSWRzID0gdHJlZS5nZXRDaGlsZElkcyhub2RlSWQpLFxuICAgICAgICAgICAgY2hlY2tlZCA9IHRydWUsXG4gICAgICAgICAgICB1bmNoZWNrZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICghY2hpbGRJZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjaGVja2VkID0gdGhpcy5pc0NoZWNrZWQobm9kZUlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvckVhY2goY2hpbGRJZHMsIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZShjaGlsZElkKTtcbiAgICAgICAgICAgICAgICBjaGVja2VkID0gKGNoZWNrZWQgJiYgc3RhdGUgPT09IFNUQVRFX0NIRUNLRUQpO1xuICAgICAgICAgICAgICAgIHVuY2hlY2tlZCA9ICh1bmNoZWNrZWQgJiYgc3RhdGUgPT09IFNUQVRFX1VOQ0hFQ0tFRCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY2hlY2tlZCB8fCB1bmNoZWNrZWQ7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGVja2VkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX0NIRUNLRUQsIHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHVuY2hlY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9VTkNIRUNLRUQsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9JTkRFVEVSTUlOQVRFLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tib3ggZWxlbWVudCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P0hUTUxFbGVtZW50fSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0Q2hlY2tib3hFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBlbCwgbm9kZUVsO1xuXG4gICAgICAgIGlmIChub2RlSWQgPT09IHRyZWUuZ2V0Um9vdE5vZGVJZCgpKSB7XG4gICAgICAgICAgICBlbCA9IHRoaXMucm9vdENoZWNrYm94O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZUVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgICAgICBub2RlRWwsXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja2JveENsYXNzTmFtZVxuICAgICAgICAgICAgKVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUuY2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICBjaGVjazogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0NoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9DSEVDS0VEKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbmNoZWNrIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLnVuY2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICB1bmNoZWNrOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVW5jaGVja2VkKG5vZGVJZCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKG5vZGVJZCwgU1RBVEVfVU5DSEVDS0VEKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgbm9kZSBjaGVja2luZ1xuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUudG9nZ2xlQ2hlY2sobm9kZUlkKTtcbiAgICAgKi9cbiAgICB0b2dnbGVDaGVjazogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0NoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5jaGVjayhub2RlSWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51bmNoZWNrKG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBjaGVja2VkXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyBpbmRldGVybWluYXRlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS5jaGVjayhub2RlSWQpO1xuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuaXNDaGVja2VkKG5vZGVJZCkpOyAvLyB0cnVlXG4gICAgICovXG4gICAgaXNDaGVja2VkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNUQVRFX0NIRUNLRUQgPT09IHRoaXMuX2dldFN0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIG5vZGUgaXMgaW5kZXRlcm1pbmF0ZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIG5vZGUgaXMgaW5kZXRlcm1pbmF0ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUuY2hlY2sobm9kZUlkKTtcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmlzSW5kZXRlcm1pbmF0ZShub2RlSWQpKTsgLy8gZmFsc2VcbiAgICAgKi9cbiAgICBpc0luZGV0ZXJtaW5hdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gU1RBVEVfSU5ERVRFUk1JTkFURSA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyB1bmNoZWNrZWQgb3Igbm90XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyB1bmNoZWNrZWQuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS51bmNoZWNrKG5vZGVJZCk7XG4gICAgICogY29uc29sZS5sb2codHJlZS5pc1VuY2hlY2tlZChub2RlSWQpKTsgLy8gdHJ1ZVxuICAgICAqL1xuICAgIGlzVW5jaGVja2VkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNUQVRFX1VOQ0hFQ0tFRCA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbENoZWNrZWRMaXN0ID0gdHJlZS5nZXRDaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUxJywgJ25vZGUyJywgJ25vZGUzJyAsLi4uLl1cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNDaGVja2VkTGlzdCA9IHRyZWUuZ2V0Q2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTcnLCAnbm9kZTgnXVxuICAgICAqL1xuICAgIGdldENoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5jaGVja2VkTGlzdDtcblxuICAgICAgICBpZiAoIXBhcmVudElkKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hlY2tlZExpc3Quc2xpY2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXIoY2hlY2tlZExpc3QsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWUuY29udGFpbnMocGFyZW50SWQsIG5vZGVJZCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdG9wIGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbFRvcENoZWNrZWRMaXN0ID0gdHJlZS5nZXRUb3BDaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUxJywgJ25vZGU1JywgJ25vZGU3J11cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNUb3BDaGVja2VkTGlzdCA9IHRyZWUuZ2V0VG9wQ2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTcnXVxuICAgICAqL1xuICAgIGdldFRvcENoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gW10sXG4gICAgICAgICAgICBzdGF0ZTtcblxuICAgICAgICBwYXJlbnRJZCA9IHBhcmVudElkIHx8IHRyZWUuZ2V0Um9vdE5vZGVJZCgpO1xuICAgICAgICBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlKHBhcmVudElkKTtcbiAgICAgICAgaWYgKHN0YXRlID09PSBTVEFURV9DSEVDS0VEKSB7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRyZWUuZ2V0Q2hpbGRJZHMocGFyZW50SWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBTVEFURV9JTkRFVEVSTUlOQVRFKSB7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuZ2V0Q2hlY2tlZExpc3QocGFyZW50SWQpO1xuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSBmaWx0ZXIoY2hlY2tlZExpc3QsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhdGhpcy5pc0NoZWNrZWQodHJlZS5nZXRQYXJlbnRJZChub2RlSWQpKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoZWNrZWRMaXN0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYm90dG9tIGNoZWNrZWQgbGlzdFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIE5vZGUgaWQgKGRlZmF1bHQ6IHJvb3ROb2RlIGlkKVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQ2hlY2tlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy9cbiAgICAgKiAvLyBub2RlMSh2KVxuICAgICAqIC8vICAgbm9kZTIodilcbiAgICAgKiAvLyAgIG5vZGUzKHYpXG4gICAgICogLy8gbm9kZTRcbiAgICAgKiAvLyAgIG5vZGU1KHYpXG4gICAgICogLy8gbm9kZTZcbiAgICAgKiAvLyAgIG5vZGU3KHYpXG4gICAgICogLy8gICAgIG5vZGU4KHYpXG4gICAgICogLy8gICBub2RlOVxuICAgICAqXG4gICAgICogdmFyIGFsbEJvdHRvbUNoZWNrZWRMaXN0ID0gdHJlZS5nZXRCb3R0b21DaGVja2VkTGlzdCgpOyAvLyBbJ25vZGUyJywgJ25vZGUzJywgJ25vZGU1JywgJ25vZGU4J11cbiAgICAgKiB2YXIgZGVzY2VuZGFudHNCb3R0b21DaGVja2VkTGlzdCA9IHRyZWUuZ2V0Qm90dG9tQ2hlZWtlZExpc3QoJ25vZGU2Jyk7IC8vIFsnbm9kZTgnXVxuICAgICAqL1xuICAgIGdldEJvdHRvbUNoZWNrZWRMaXN0OiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0O1xuXG4gICAgICAgIHBhcmVudElkID0gcGFyZW50SWQgfHwgdHJlZS5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5nZXRDaGVja2VkTGlzdChwYXJlbnRJZCk7XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcihjaGVja2VkTGlzdCwgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZS5pc0xlYWYobm9kZUlkKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihDaGVja2JveCk7XG5tb2R1bGUuZXhwb3J0cyA9IENoZWNrYm94O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIEFQSV9MSVNUID0gW1xuICAgICdjaGFuZ2VDb250ZXh0TWVudSdcbl07XG52YXIgVHVpQ29udGV4dE1lbnUgPSB0dWkgJiYgdHVpLmNvbXBvbmVudCAmJiB0dWkuY29tcG9uZW50LkNvbnRleHRNZW51O1xudmFyIHN0eWxlS2V5cyA9IFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J107XG52YXIgZW5hYmxlUHJvcCA9IHV0aWwudGVzdFByb3Aoc3R5bGVLZXlzKTtcbnZhciBiaW5kID0gdHVpLnV0aWwuYmluZDtcblxuLyoqXG4gKiBTZXQgQ29udGV4dE1lbnUgZmVhdHVyZSBvbiB0cmVlXG4gKiBAY2xhc3MgQ29udGV4dE1lbnVcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9uc1xuICogICAgIEBwYXJhbSB7QXJyYXkuPE9iamVjdD59IG9wdGlvbnMubWVudURhdGEgLSBDb250ZXh0IG1lbnUgZGF0YVxuICogQGlnbm9yZVxuICovXG52YXIgQ29udGV4dE1lbnUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIENvbnRleHRNZW51LnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQG1lbWJlck9mIENvbnRleHRNZW51XG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgQ29udGV4dE1lbnVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyZWUgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7VHJlZX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyZWUgc2VsZWN0b3IgZm9yIGNvbnRleHQgbWVudVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmVlU2VsZWN0b3IgPSAnIycgKyB0aGlzLnRyZWUucm9vdEVsZW1lbnQuaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElkIG9mIGZsb2F0aW5nIGxheWVyIGluIHRyZWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmxJZCA9IHRoaXMudHJlZS5yb290RWxlbWVudC5pZCArICctZmwnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbmZvIG9mIGNvbnRleHQgbWVudSBpbiB0cmVlXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1lbnUgPSB0aGlzLl9nZW5lcmF0ZUNvbnRleHRNZW51KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZsb2F0aW5nIGxheWVyIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mbEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmZsSWQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZCBvZiBzZWxlY3RlZCB0cmVlIGl0ZW1cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2RlSWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMubWVudS5yZWdpc3Rlcih0aGlzLnRyZWVTZWxlY3RvciwgYmluZCh0aGlzLl9vblNlbGVjdCwgdGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5tZW51RGF0YSB8fCB7fSk7XG5cbiAgICAgICAgdGhpcy50cmVlLm9uKCdjb250ZXh0bWVudScsIHRoaXMuX29uQ29udGV4dE1lbnUsIHRoaXMpO1xuXG4gICAgICAgIHRoaXMuX3ByZXZlbnRUZXh0U2VsZWN0aW9uKCk7XG5cbiAgICAgICAgdGhpcy5fc2V0QVBJcygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgY3VycmVudCBjb250ZXh0LW1lbnUgdmlld1xuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcmVxdWlyZXMgQ29udGV4dE1lbnVcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxPYmplY3Q+fSBuZXdNZW51RGF0YSAtIE5ldyBjb250ZXh0IG1lbnUgZGF0YVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5jaGFuZ2VDb250ZXh0TWVudShbXG4gICAgICogICAgICB7dGl0bGU6ICdtZW51MSd9LFxuICAgICAqICAgICAge3RpdGxlOiAnbWVudTInLCBkaXNhYmxlOiB0cnVlfSxcbiAgICAgKiAgICAgIHt0aXRsZTogJ21lbnUzJywgbWVudTogW1xuICAgICAqICAgICAgXHR7dGl0bGU6ICdzdWJtZW51MScsIGRpc2FibGU6IHRydWV9LFxuICAgICAqICAgICAgXHR7dGl0bGU6ICdzdWJtZW51Mid9XG4gICAgICogICAgICBdfVxuICAgICAqIF0pO1xuICAgICAqL1xuICAgIGNoYW5nZUNvbnRleHRNZW51OiBmdW5jdGlvbihuZXdNZW51RGF0YSkge1xuICAgICAgICB0aGlzLm1lbnUudW5yZWdpc3Rlcih0aGlzLnRyZWVTZWxlY3Rvcik7XG4gICAgICAgIHRoaXMubWVudS5yZWdpc3Rlcih0aGlzLnRyZWVTZWxlY3RvciwgYmluZCh0aGlzLl9vblNlbGVjdCwgdGhpcyksIG5ld01lbnVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBDb250ZXh0TWVudSBmZWF0dXJlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuXG4gICAgICAgIHRoaXMubWVudS5kZXN0cm95KCk7XG5cbiAgICAgICAgdGhpcy5fcmVzdG9yZVRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5fcmVtb3ZlRmxvYXRpbmdMYXllcigpO1xuXG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goQVBJX0xJU1QsIGZ1bmN0aW9uKGFwaU5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0cmVlW2FwaU5hbWVdO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZsb2F0aW5nIGxheWVyIGZvciBjb250ZXh0IG1lbnVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVGbG9hdGluZ0xheWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5mbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5mbEVsZW1lbnQuaWQgPSB0aGlzLmZsSWQ7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmZsRWxlbWVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmbG9hdGluZyBsYXllciBmb3IgY29udGV4dCBtZW51XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmxvYXRpbmdMYXllcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGhpcy5mbEVsZW1lbnQpO1xuICAgICAgICB0aGlzLmZsRWxlbWVudCA9IG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGNvbnRleHQgbWVudSBpbiB0cmVlXG4gICAgICogQHJldHVybnMge1R1aUNvbnRleHRNZW51fSBJbnN0YW5jZSBvZiBUdWlDb250ZXh0TWVudVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dlbmVyYXRlQ29udGV4dE1lbnU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuZmxFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVGbG9hdGluZ0xheWVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFR1aUNvbnRleHRNZW51KHRoaXMuZmxFbGVtZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCB0ZXh0IHNlbGVjdGlvbiBvbiBzZWxlY3RlZCB0cmVlIGl0ZW1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wcmV2ZW50VGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChlbmFibGVQcm9wKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQuc3R5bGVbZW5hYmxlUHJvcF0gPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzdG9yZSB0ZXh0IHNlbGVjdGlvbiBvbiBzZWxlY3RlZCB0cmVlIGl0ZW1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZXN0b3JlVGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChlbmFibGVQcm9wKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQuc3R5bGVbZW5hYmxlUHJvcF0gPSAnJztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIG9uIHRyZWUgaXRlbVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIE1vdXNlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Db250ZXh0TWVudTogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XG5cbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2JlZm9yZU9wZW5Db250ZXh0TWVudVxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gQ3VycmVudCBzZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2JlZm9yZU9wZW5Db250ZXh0TWVudScsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ25vZGVJZDogJyArIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmVlLmZpcmUoJ2JlZm9yZU9wZW5Db250ZXh0TWVudScsIHRoaXMuc2VsZWN0ZWROb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIG9uIGNvbnRleHQgbWVudVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIE1vdXNlIGV2ZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNtZCAtIE9wdGlvbnMgdmFsdWUgb2Ygc2VsZWN0ZWQgY29udGV4dCBtZW51IChcInRpdGxlXCJ8XCJjb21tYW5kXCIpXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25TZWxlY3Q6IGZ1bmN0aW9uKGUsIGNtZCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNzZWxlY3RDb250ZXh0TWVudVxuICAgICAgICAgKiBAcGFyYW0ge3tjbWQ6IHN0cmluZywgbm9kZUlkOiBzdHJpbmd9fSB0cmVlRXZlbnQgLSBUcmVlIGV2ZW50XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ3NlbGVjdENvbnRleHRNZW51JywgZnVuY3Rpb24odHJlZUV2ZW50KSB7XG4gICAgICAgICAqICAgICB2YXIgY21kID0gdHJlZUV2ZW50LmNtZDsgLy8ga2V5IG9mIGNvbnRleHQgbWVudSdzIGRhdGFcbiAgICAgICAgICogICAgIHZhciBub2RlSWQgPSB0cmVlRXZlbnQubm9kZUlkO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coY21kLCBub2RlSWQpO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZS5maXJlKCdzZWxlY3RDb250ZXh0TWVudScsIHtcbiAgICAgICAgICAgIGNtZDogY21kLFxuICAgICAgICAgICAgbm9kZUlkOiB0aGlzLnNlbGVjdGVkTm9kZUlkXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgQVBJIG9mIENvbnRleHRNZW51IGZlYXR1cmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRBUElzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgdHJlZVthcGlOYW1lXSA9IGJpbmQodGhpc1thcGlOYW1lXSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHRNZW51O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIHVzZUhlbHBlcjogdHJ1ZSxcbiAgICBoZWxwZXJQb3M6IHtcbiAgICAgICAgeTogMixcbiAgICAgICAgeDogNVxuICAgIH0sXG4gICAgYXV0b09wZW5EZWxheTogMTUwMCxcbiAgICBpc1NvcnRhYmxlOiBmYWxzZSxcbiAgICBob3ZlckNsYXNzTmFtZTogJ3R1aS10cmVlLWhvdmVyJyxcbiAgICBsaW5lQ2xhc3NOYW1lOiAndHVpLXRyZWUtbGluZScsXG4gICAgbGluZUJvdW5kYXJ5OiB7XG4gICAgICAgIHRvcDogMixcbiAgICAgICAgYm90dG9tOiAyXG4gICAgfVxufTtcbnZhciByZWplY3RlZFRhZ05hbWVzID0gW1xuICAgICdJTlBVVCcsXG4gICAgJ0JVVFRPTicsXG4gICAgJ1VMJ1xuXTtcbnZhciBzZWxlY3RLZXkgPSB1dGlsLnRlc3RQcm9wKFxuICAgIFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J11cbik7XG52YXIgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG52YXIgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2g7XG52YXIgQVBJX0xJU1QgPSBbXTtcblxuLyoqXG4gKiBTZXQgdGhlIHRyZWUgZHJhZ2dhYmxlXG4gKiBAY2xhc3MgRHJhZ2dhYmxlXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnNcbiAqICAgICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMudXNlSGVscGVyIC0gVXNpbmcgaGVscGVyIGZsYWdcbiAqICAgICBAcGFyYW0ge3t4OiBudW1iZXIsIHk6bnVtYmVyfX0gb3B0aW9ucy5oZWxwZXJQb3MgLSBIZWxwZXIgcG9zaXRpb25cbiAqICAgICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkVGFnTmFtZXMgLSBObyBkcmFnZ2FibGUgdGFnIG5hbWVzXG4gKiAgICAgQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gb3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMgLSBObyBkcmFnZ2FibGUgY2xhc3MgbmFtZXNcbiAqICAgICBAcGFyYW0ge251bWJlcn0gb3B0aW9ucy5hdXRvT3BlbkRlbGF5IC0gRGVsYXkgdGltZSB3aGlsZSBkcmFnZ2luZyB0byBiZSBvcGVuZWRcbiAqICAgICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuaXNTb3J0YWJsZSAtIEZsYWcgb2Ygd2hldGhlciB1c2luZyBzb3J0YWJsZSBkcmFnZ2luZ1xuICogICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhvdmVyQ2xhc3NOYW1lIC0gQ2xhc3MgbmFtZSBmb3IgaG92ZXJlZCBub2RlXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMubGluZUNsYXNzTmFtZSAtIENsYXNzIG5hbWUgZm9yIG1vdmluZyBwb3NpdGlvbiBsaW5lXG4gKiAgICAgQHBhcmFtIHt7dG9wOiBudW1iZXIsIGJvdHRvbTogbnVtYmVyfX0gb3B0aW9ucy5saW5lQm91bmRhcnkgLSBCb3VuZGFyeSB2YWx1ZSBmb3IgdmlzaWJsZSBtb3ZpbmcgbGluZVxuICogQGlnbm9yZVxuICovXG52YXIgRHJhZ2dhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBEcmFnZ2FibGUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgRHJhZ2dhYmxlXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgRHJhZ2dhYmxlXG4gICAgICAgICAqL1xuICAgICAgICBnZXRBUElMaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBBUElfTElTVC5zbGljZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmVlIGRhdGFcbiAgICAgICAgICogQHR5cGUge1RyZWV9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEcmFnIGhlbHBlciBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbGVjdGFibGUgZWxlbWVudCdzIHByb3BlcnR5XG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbGVjdGFibGUgZWxlbWVudCdzIHByb3BlcnR5IHZhbHVlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eVZhbHVlID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRHJhZ2dpbmcgZWxlbWVudCdzIG5vZGUgaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY3VycmVudE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEN1cnJlbnQgbW91c2Ugb3ZlcmVkIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5ob3ZlcmVkRWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1vdmluZyBsaW5lIHR5cGUgKFwidG9wXCIgb3IgXCJib3R0b21cIilcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubW92aW5nTGluZVR5cGUgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbnZva2luZyB0aW1lIGZvciBzZXRUaW1lb3V0KClcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudGltZXIgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUYWcgbGlzdCBmb3IgcmVqZWN0aW5nIHRvIGRyYWdcbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVqZWN0ZWRUYWdOYW1lcyA9IHJlamVjdGVkVGFnTmFtZXMuY29uY2F0KG9wdGlvbnMucmVqZWN0ZWRUYWdOYW1lcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsYXNzIG5hbWUgbGlzdCBmb3IgcmVqZWN0aW5nIHRvIGRyYWdcbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVqZWN0ZWRDbGFzc05hbWVzID0gW10uY29uY2F0KG9wdGlvbnMucmVqZWN0ZWRDbGFzc05hbWVzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVXNpbmcgaGVscGVyIGZsYWdcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVzZUhlbHBlciA9IG9wdGlvbnMudXNlSGVscGVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIZWxwZXIgcG9zaXRpb25cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaGVscGVyUG9zID0gb3B0aW9ucy5oZWxwZXJQb3M7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlbGF5IHRpbWUgd2hpbGUgZHJhZ2dpbmcgdG8gYmUgb3BlbmVkXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmF1dG9PcGVuRGVsYXkgPSBvcHRpb25zLmF1dG9PcGVuRGVsYXk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZsYWcgb2Ygd2hldGhlciB1c2luZyBzb3J0YWJsZSBkcmFnZ2luZ1xuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNTb3J0YWJsZSA9IG9wdGlvbnMuaXNTb3J0YWJsZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xhc3MgbmFtZSBmb3IgbW91c2Ugb3ZlcmVkIG5vZGVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaG92ZXJDbGFzc05hbWUgPSBvcHRpb25zLmhvdmVyQ2xhc3NOYW1lO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGFzcyBuYW1lIGZvciBtb3ZpbmcgcG9zaXRpb24gbGluZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5saW5lQ2xhc3NOYW1lID0gb3B0aW9ucy5saW5lQ2xhc3NOYW1lO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCb3VuZGFyeSB2YWx1ZSBmb3IgdmlzaWJsZSBtb3ZpbmcgbGluZVxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5saW5lQm91bmRhcnkgPSBvcHRpb25zLmxpbmVCb3VuZGFyeTtcblxuICAgICAgICB0aGlzLl9pbml0SGVscGVyKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNTb3J0YWJsZSkge1xuICAgICAgICAgICAgdGhpcy5faW5pdE1vdmluZ0xpbmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2F0dGFjaE1vdXNlZG93bigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3Jlc3RvcmVUZXh0U2VsZWN0aW9uKCk7XG4gICAgICAgIHRoaXMuX2RldGFjaE1vdXNlZG93bigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgaGVscGVyIGVsZW1lbnQgcG9zaXRpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbW91c2VQb3MgLSBDdXJyZW50IG1vdXNlIHBvc2l0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2hhbmdlSGVscGVyUG9zaXRpb246IGZ1bmN0aW9uKG1vdXNlUG9zKSB7XG4gICAgICAgIHZhciBoZWxwZXJTdHlsZSA9IHRoaXMuaGVscGVyRWxlbWVudC5zdHlsZTtcbiAgICAgICAgdmFyIHBvcyA9IHRoaXMudHJlZS5yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICBoZWxwZXJTdHlsZS50b3AgPSAobW91c2VQb3MueSAtIHBvcy50b3AgKyB0aGlzLmhlbHBlclBvcy55KSArICdweCc7XG4gICAgICAgIGhlbHBlclN0eWxlLmxlZnQgPSAobW91c2VQb3MueCAtIHBvcy5sZWZ0ICsgdGhpcy5oZWxwZXJQb3MueCkgKyAncHgnO1xuICAgICAgICBoZWxwZXJTdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXQgaGVscGVyIGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9pbml0SGVscGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGhlbHBlckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHZhciBoZWxwZXJTdHlsZSA9IGhlbHBlckVsZW1lbnQuc3R5bGU7XG5cbiAgICAgICAgaGVscGVyU3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBoZWxwZXJTdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGhlbHBlckVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudCA9IGhlbHBlckVsZW1lbnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXQgbW92aW5nIGxpbmUgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2luaXRNb3ZpbmdMaW5lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxpbmVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHZhciBsaW5lU3R5bGUgPSBsaW5lRWxlbWVudC5zdHlsZTtcblxuICAgICAgICBsaW5lU3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBsaW5lU3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuXG4gICAgICAgIGxpbmVFbGVtZW50LmNsYXNzTmFtZSA9IHRoaXMubGluZUNsYXNzTmFtZTtcblxuICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChsaW5lRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5saW5lRWxlbWVudCA9IGxpbmVFbGVtZW50O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgaGVscGVyIGNvbnRlbnRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBIZWxwZXIgY29udGVudHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRIZWxwZXI6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LmlubmVySFRNTCA9IHRleHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBtb3VzZSBkb3duIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXR0YWNoTW91c2Vkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcHJldmVudFRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy50cmVlLm9uKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlZG93biwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGFjaCBtb3VzZWRvd24gZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kZXRhY2hNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IHRleHQtc2VsZWN0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcHJldmVudFRleHRTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3R5bGUgPSB0aGlzLnRyZWUucm9vdEVsZW1lbnQuc3R5bGU7XG5cbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMudHJlZS5yb290RWxlbWVudCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XG5cbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXkgPSBzZWxlY3RLZXk7XG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5VmFsdWUgPSBzdHlsZVtzZWxlY3RLZXldO1xuXG4gICAgICAgIHN0eWxlW3NlbGVjdEtleV0gPSAnbm9uZSc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc3RvcmUgdGV4dC1zZWxlY3Rpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZXN0b3JlVGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLnRyZWUucm9vdEVsZW1lbnQsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xuXG4gICAgICAgIGlmICh0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgdGhpcy50cmVlLnJvb3RFbGVtZW50LnN0eWxlW3RoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5XSA9IHRoaXMudXNlclNlbGVjdFByb3BlcnR5VmFsdWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhlIHRhcmdldCBlbGVtZW50IGlzIGluIHJlamVjdGVkVGFnTmFtZXMgb3IgaW4gcmVqZWN0ZWRDbGFzc05hbWVzXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdGFyZ2V0IGlzIG5vdCBkcmFnZ2FibGUgb3IgZHJhZ2dhYmxlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaXNOb3REcmFnZ2FibGU6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICB2YXIgdGFnTmFtZSA9IHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIHZhciBjbGFzc05hbWVzID0gdXRpbC5nZXRDbGFzcyh0YXJnZXQpLnNwbGl0KC9cXHMrLyk7XG4gICAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgICAgaWYgKGluQXJyYXkodGFnTmFtZSwgdGhpcy5yZWplY3RlZFRhZ05hbWVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yRWFjaChjbGFzc05hbWVzLCBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGluQXJyYXkoY2xhc3NOYW1lLCB0aGlzLnJlamVjdGVkQ2xhc3NOYW1lcykgIT09IC0xO1xuXG4gICAgICAgICAgICByZXR1cm4gIXJlc3VsdDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTW91c2Vkb3duOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICAgICAgdmFyIGhhc0VkaXRhYmxlRWxlbWVudCA9ICh0cmVlLmVuYWJsZWRGZWF0dXJlcy5FZGl0YWJsZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmVlLmVuYWJsZWRGZWF0dXJlcy5FZGl0YWJsZS5pbnB1dEVsZW1lbnQpO1xuXG4gICAgICAgIGlmICh1dGlsLmlzUmlnaHRCdXR0b24oZXZlbnQpIHx8IHRoaXMuX2lzTm90RHJhZ2dhYmxlKHRhcmdldCkgfHxcbiAgICAgICAgICAgIGhhc0VkaXRhYmxlRWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXRpbC5wcmV2ZW50RGVmYXVsdChldmVudCk7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgIGlmICh0aGlzLnVzZUhlbHBlcikge1xuICAgICAgICAgICAgdGhpcy5fc2V0SGVscGVyKHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWUub24oe1xuICAgICAgICAgICAgbW91c2Vtb3ZlOiB0aGlzLl9vbk1vdXNlbW92ZSxcbiAgICAgICAgICAgIG1vdXNldXA6IHRoaXMuX29uTW91c2V1cFxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlbW92ZVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTW91c2Vtb3ZlOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgbW91c2VQb3MgPSB1dGlsLmdldE1vdXNlUG9zKGV2ZW50KTtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICAgICAgdmFyIG5vZGVJZDtcblxuICAgICAgICBpZiAoIXRoaXMudXNlSGVscGVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jaGFuZ2VIZWxwZXJQb3NpdGlvbihtb3VzZVBvcyk7XG5cbiAgICAgICAgbm9kZUlkID0gdGhpcy50cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgaWYgKG5vZGVJZCkge1xuICAgICAgICAgICAgdGhpcy5fYXBwbHlNb3ZlQWN0aW9uKG5vZGVJZCwgbW91c2VQb3MpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZXVwXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Nb3VzZXVwOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICAgICAgdmFyIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgdmFyIGluZGV4ID0gLTE7XG5cbiAgICAgICAgaWYgKG5vZGVJZCAmJiB0aGlzLmlzU29ydGFibGUgJiYgdGhpcy5tb3ZpbmdMaW5lVHlwZSkge1xuICAgICAgICAgICAgaW5kZXggPSB0aGlzLl9nZXRJbmRleEZvckluc2VydGluZyhub2RlSWQpO1xuICAgICAgICAgICAgbm9kZUlkID0gdHJlZS5nZXRQYXJlbnRJZChub2RlSWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudE5vZGVJZCAhPT0gbm9kZUlkKSB7XG4gICAgICAgICAgICB0cmVlLm1vdmUodGhpcy5jdXJyZW50Tm9kZUlkLCBub2RlSWQsIGluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFwcGx5IG1vdmUgYWN0aW9uIHRoYXQgYXJlIGRlbGF5IGVmZmVjdCBhbmQgc29ydGFibGUgbW92aW5nIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmlnfSBub2RlSWQgLSBTZWxlY3RlZCB0cmVlIG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbW91c2VQb3MgLSBDdXJyZW50IG1vdXNlIHBvc2l0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXBwbHlNb3ZlQWN0aW9uOiBmdW5jdGlvbihub2RlSWQsIG1vdXNlUG9zKSB7XG4gICAgICAgIHZhciBjdXJyZW50RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIHZhciB0YXJnZXRQb3MgPSBjdXJyZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIGhhc0NsYXNzID0gdXRpbC5oYXNDbGFzcyhjdXJyZW50RWxlbWVudCwgdGhpcy5ob3ZlckNsYXNzTmFtZSk7XG4gICAgICAgIHZhciBpc0NvbnRhaW4gPSB0aGlzLl9pc0NvbnRhaW4odGFyZ2V0UG9zLCBtb3VzZVBvcyk7XG4gICAgICAgIHZhciBib3VuZGFyeVR5cGU7XG5cbiAgICAgICAgaWYgKCF0aGlzLmhvdmVyZWRFbGVtZW50ICYmIGlzQ29udGFpbikge1xuICAgICAgICAgICAgdGhpcy5ob3ZlcmVkRWxlbWVudCA9IGN1cnJlbnRFbGVtZW50O1xuICAgICAgICAgICAgdGhpcy5faG92ZXIobm9kZUlkKTtcbiAgICAgICAgfSBlbHNlIGlmICghaGFzQ2xhc3MgfHwgKGhhc0NsYXNzICYmICFpc0NvbnRhaW4pKSB7XG4gICAgICAgICAgICB0aGlzLl91bmhvdmVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc1NvcnRhYmxlKSB7XG4gICAgICAgICAgICBib3VuZGFyeVR5cGUgPSB0aGlzLl9nZXRCb3VuZGFyeVR5cGUodGFyZ2V0UG9zLCBtb3VzZVBvcyk7XG4gICAgICAgICAgICB0aGlzLl9kcmF3Qm91bmRhcnlMaW5lKHRhcmdldFBvcywgYm91bmRhcnlUeXBlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBY3QgdG8gaG92ZXIgb24gdHJlZSBpdGVtXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFRyZWUgbm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2hvdmVyOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdXRpbC5hZGRDbGFzcyh0aGlzLmhvdmVyZWRFbGVtZW50LCB0aGlzLmhvdmVyQ2xhc3NOYW1lKTtcblxuICAgICAgICBpZiAodHJlZS5pc0xlYWYobm9kZUlkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0cmVlLm9wZW4obm9kZUlkKTtcbiAgICAgICAgfSwgdGhpcy5hdXRvT3BlbkRlbGF5KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWN0IHRvIHVuaG92ZXIgb24gdHJlZSBpdGVtXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdW5ob3ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuaG92ZXJlZEVsZW1lbnQsIHRoaXMuaG92ZXJDbGFzc05hbWUpO1xuXG4gICAgICAgIHRoaXMuaG92ZXJlZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLnRpbWVyID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgY29udGFpbmVkIHN0YXRlIG9mIGN1cnJlbnQgdGFyZ2V0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFBvcyAtIFBvc2l0aW9uIG9mIHRyZWUgaXRlbVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtb3VzZVBvcyAtIFBvc2l0aW9uIG9mIG1vdmVkIG1vdXNlXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IENvbnRhaW5lZCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2lzQ29udGFpbjogZnVuY3Rpb24odGFyZ2V0UG9zLCBtb3VzZVBvcykge1xuICAgICAgICB2YXIgdG9wID0gdGFyZ2V0UG9zLnRvcDtcbiAgICAgICAgdmFyIGJvdHRvbSA9IHRhcmdldFBvcy5ib3R0b207XG5cbiAgICAgICAgaWYgKHRoaXMuaXNTb3J0YWJsZSkge1xuICAgICAgICAgICAgdG9wICs9IHRoaXMubGluZUJvdW5kYXJ5LnRvcDtcbiAgICAgICAgICAgIGJvdHRvbSAtPSB0aGlzLmxpbmVCb3VuZGFyeS5ib3R0b207XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0UG9zLmxlZnQgPCBtb3VzZVBvcy54ICYmXG4gICAgICAgICAgICB0YXJnZXRQb3MucmlnaHQgPiBtb3VzZVBvcy54ICYmXG4gICAgICAgICAgICB0b3AgPCBtb3VzZVBvcy55ICYmIGJvdHRvbSA+IG1vdXNlUG9zLnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYm91bmRhcnkgdHlwZSBieSBtb3VzZSBwb3NpdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRQb3MgLSBQb3NpdGlvbiBvZiB0cmVlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbW91c2VQb3MgLSBQb3NpdGlvbiBvZiBtb3ZlZCBtb3VzZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFBvc2l0aW9uIHR5cGUgaW4gYm91bmRhcnlcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRCb3VuZGFyeVR5cGU6IGZ1bmN0aW9uKHRhcmdldFBvcywgbW91c2VQb3MpIHtcbiAgICAgICAgdmFyIHR5cGU7XG5cbiAgICAgICAgaWYgKG1vdXNlUG9zLnkgPCB0YXJnZXRQb3MudG9wICsgdGhpcy5saW5lQm91bmRhcnkudG9wKSB7XG4gICAgICAgICAgICB0eXBlID0gJ3RvcCc7XG4gICAgICAgIH0gZWxzZSBpZiAobW91c2VQb3MueSA+IHRhcmdldFBvcy5ib3R0b20gLSB0aGlzLmxpbmVCb3VuZGFyeS5ib3R0b20pIHtcbiAgICAgICAgICAgIHR5cGUgPSAnYm90dG9tJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEcmF3IGJvdW5kYXJ5IGxpbmUgb24gdHJlZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRQb3MgLSBQb3NpdGlvbiBvZiB0cmVlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYm91bmRhcnlUeXBlIC0gUG9zaXRpb24gdHlwZSBpbiBib3VuZGFyeVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2RyYXdCb3VuZGFyeUxpbmU6IGZ1bmN0aW9uKHRhcmdldFBvcywgYm91bmRhcnlUeXBlKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMubGluZUVsZW1lbnQuc3R5bGU7XG4gICAgICAgIHZhciBsaW5lSGVpZ2h0O1xuICAgICAgICB2YXIgc2Nyb2xsVG9wO1xuXG4gICAgICAgIGlmIChib3VuZGFyeVR5cGUpIHtcbiAgICAgICAgICAgIHNjcm9sbFRvcCA9IHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLnNjcm9sbFRvcCArIHV0aWwuZ2V0V2luZG93U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICBsaW5lSGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLmxpbmVFbGVtZW50Lm9mZnNldEhlaWdodCAvIDIpO1xuXG4gICAgICAgICAgICBzdHlsZS50b3AgPSBNYXRoLnJvdW5kKHRhcmdldFBvc1tib3VuZGFyeVR5cGVdKSAtIGxpbmVIZWlnaHQgKyBzY3JvbGxUb3AgKyAncHgnO1xuICAgICAgICAgICAgc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcbiAgICAgICAgICAgIHRoaXMubW92aW5nTGluZVR5cGUgPSBib3VuZGFyeVR5cGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICB0aGlzLm1vdmluZ0xpbmVUeXBlID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaW5kZXggZm9yIGluc2VydGluZ1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBDdXJyZW50IHNlbGVjdGVkIGhlbHBlciBub2RlIGlkXG4gICAgICogQHJldHVybnMge251bWJlcn0gSW5kZXggbnVtYmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SW5kZXhGb3JJbnNlcnRpbmc6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnRyZWUuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKHRoaXMubW92aW5nTGluZVR5cGUgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBfcmVzZXQgcHJvcGVydGllcyBhbmQgcmVtb3ZlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pc1NvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmxpbmVFbGVtZW50LnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmhvdmVyZWRFbGVtZW50KSB7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuaG92ZXJlZEVsZW1lbnQsIHRoaXMuaG92ZXJDbGFzc05hbWUpO1xuICAgICAgICAgICAgdGhpcy5ob3ZlcmVkRWxlbWVudCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgICAgICB0aGlzLmN1cnJlbnROb2RlSWQgPSBudWxsO1xuICAgICAgICB0aGlzLm1vdmluZ0xpbmVUeXBlID0gbnVsbDtcblxuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMsICdtb3VzZW1vdmUnKTtcbiAgICAgICAgdGhpcy50cmVlLm9mZih0aGlzLCAnbW91c2V1cCcpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdnYWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcbnZhciBhamF4Q29tbWFuZCA9IHJlcXVpcmUoJy4vLi4vY29uc3RzL2FqYXhDb21tYW5kJyk7XG52YXIgc3RhdGVzID0gcmVxdWlyZSgnLi8uLi9jb25zdHMvc3RhdGVzJyk7XG5cbnZhciBBUElfTElTVCA9IFtcbiAgICAnY3JlYXRlQ2hpbGROb2RlJyxcbiAgICAnZWRpdE5vZGUnXG5dO1xudmFyIEVESVRfVFlQRSA9IHtcbiAgICBDUkVBVEU6ICdjcmVhdGUnLFxuICAgIFVQREFURTogJ3VwZGF0ZSdcbn07XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjbGFzcyBFZGl0YWJsZVxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgZWRpdGFibGUgZWxlbWVudFxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmRhdGFLZXkgLSBLZXkgb2Ygbm9kZSBkYXRhIHRvIHNldCB2YWx1ZVxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kYXRhVmFsdWVdIC0gVmFsdWUgb2Ygbm9kZSBkYXRhIHRvIHNldCB2YWx1ZSAoVXNlIFwiY3JlYXRlTm9kZVwiIEFQSSlcbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaW5wdXRDbGFzc05hbWVdIC0gQ2xhc3NuYW1lIG9mIGlucHV0IGVsZW1lbnRcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEVkaXRhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBFZGl0YWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBTZWxlY3RhYmxlXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgRWRpdGFibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyZWVcbiAgICAgICAgICogQHR5cGUge1RyZWV9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGFzc25hbWUgb2YgZWRpdGFibGUgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSA9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsYXNzbmFtZSBvZiBpbnB1dCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlucHV0Q2xhc3NOYW1lID0gb3B0aW9ucy5pbnB1dENsYXNzTmFtZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogS2V5IG9mIG5vZGUgZGF0YSB0byBzZXQgdmFsdWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZGF0YUtleSA9IG9wdGlvbnMuZGF0YUtleTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCB2YWx1ZSBmb3IgY3JlYXRpbmcgbm9kZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZWZhdWx0VmFsdWUgPSBvcHRpb25zLmRlZmF1bHRWYWx1ZSB8fCAnJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogSW5wdXQgZWxlbWVudCBmb3IgY3JlYXRlIG9yIGVkaXRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBY3Rpb24gbW9kZSAtIGNyZWF0ZSBvciBlZGl0XG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1vZGUgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBLZXl1cCBldmVudCBoYW5kbGVyXG4gICAgICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYm91bmRPbktleXVwID0gdHVpLnV0aWwuYmluZCh0aGlzLl9vbktleXVwLCB0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciBjdXN0b20gZXZlbnQgaXMgaWdub3JlZCBvciBub3RcbiAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzQ3VzdG9tRXZlbnRJZ25vcmVkID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJsdXIgZXZlbnQgaGFuZGxlclxuICAgICAgICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmJvdW5kT25CbHVyID0gdHVpLnV0aWwuYmluZCh0aGlzLl9vbkJsdXIsIHRoaXMpO1xuXG4gICAgICAgIHRyZWUub24oJ2RvdWJsZUNsaWNrJywgdGhpcy5fb25Eb3VibGVDbGljaywgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fc2V0QVBJcygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuXG4gICAgICAgIHRoaXMuX2RldGFjaElucHV0RWxlbWVudCgpO1xuICAgICAgICB0cmVlLm9mZih0aGlzKTtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRyZWVbYXBpTmFtZV07XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgY2hpbGQgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcmVxdWlyZXMgRWRpdGFibGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZCB0byBjcmVhdGUgbmV3IG5vZGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuY3JlYXRlQ2hpbGROb2RlKCd0dWktdHJlZS1ub2RlLTEnKTtcbiAgICAgKi9cbiAgICBjcmVhdGVDaGlsZE5vZGU6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgdXNlQWpheCA9IHRyZWUuZW5hYmxlZEZlYXR1cmVzLkFqYXg7XG4gICAgICAgIHZhciBub2RlSWQ7XG5cbiAgICAgICAgdGhpcy5tb2RlID0gRURJVF9UWVBFLkNSRUFURTtcblxuICAgICAgICBpZiAodXNlQWpheCkge1xuICAgICAgICAgICAgdHJlZS5vbignc3VjY2Vzc0FqYXhSZXNwb25zZScsIHRoaXMuX29uU3VjY2Vzc1Jlc3BvbnNlLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdHJlZS5pc0xlYWYocGFyZW50SWQpICYmXG4gICAgICAgICAgICB0cmVlLmdldFN0YXRlKHBhcmVudElkKSA9PT0gc3RhdGVzLm5vZGUuQ0xPU0VEKSB7XG4gICAgICAgICAgICB0cmVlLm9wZW4ocGFyZW50SWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZUlkID0gdHJlZS5fYWRkKHt9LCBwYXJlbnRJZClbMF07XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2hJbnB1dEVsZW1lbnQobm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFZGl0IG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHJlcXVpcmVzIEVkaXRhYmxlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZWRpdE5vZGUoJ3R1aS10cmVlLW5vZGUtMScpO1xuICAgICAqL1xuICAgIGVkaXROb2RlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdGhpcy5tb2RlID0gRURJVF9UWVBFLlVQREFURTtcbiAgICAgICAgdGhpcy5fYXR0YWNoSW5wdXRFbGVtZW50KG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwic3VjY2Vzc1Jlc3BvbnNlXCJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIEFqYXggY29tbWFuZCB0eXBlXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gbm9kZUlkcyAtIEFkZGVkIG5vZGUgaWRzIG9uIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vblN1Y2Nlc3NSZXNwb25zZTogZnVuY3Rpb24odHlwZSwgbm9kZUlkcykge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIHBhcmVudElkLCBub2RlSWQ7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IGFqYXhDb21tYW5kLlJFQUQgJiYgbm9kZUlkcykge1xuICAgICAgICAgICAgcGFyZW50SWQgPSB0cmVlLmdldFBhcmVudElkKG5vZGVJZHNbMF0pO1xuICAgICAgICAgICAgbm9kZUlkID0gdHJlZS5fYWRkKHt9LCBwYXJlbnRJZClbMF07XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2hJbnB1dEVsZW1lbnQobm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciBcImRvdWJsZUNsaWNrXCJcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkRvdWJsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpO1xuICAgICAgICB2YXIgbm9kZUlkO1xuXG4gICAgICAgIGlmICh1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgIG5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuICAgICAgICAgICAgdGhpcy5lZGl0Tm9kZShub2RlSWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXI6IGtleXVwIC0gaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gS2V5IGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25LZXl1cDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7IC8vIGtleXVwIFwiZW50ZXJcIlxuICAgICAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQuYmx1cigpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXI6IGJsdXIgLSBpbnB1dCBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25CbHVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNDdXN0b21FdmVudElnbm9yZWQgfHwgIXRoaXMuaW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmlzQ3VzdG9tRXZlbnRJZ25vcmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IEVESVRfVFlQRS5DUkVBVEUpIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZERhdGEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NldERhdGEoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaW5wdXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dENsYXNzTmFtZSAtIENsYXNzbmFtZSBvZiBpbnB1dCBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBJbnB1dCBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlSW5wdXRFbGVtZW50OiBmdW5jdGlvbihpbnB1dENsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTlBVVCcpO1xuICAgICAgICBpZiAoaW5wdXRDbGFzc05hbWUpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IGlucHV0Q2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggaW5wdXQgZWxlbWVudCBvbiB0cmVlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hdHRhY2hJbnB1dEVsZW1lbnQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIHZhciB0ZXh0RWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSh0YXJnZXQsIHRyZWUuY2xhc3NOYW1lcy50ZXh0Q2xhc3MpWzBdO1xuICAgICAgICB2YXIgaW5wdXRFbGVtZW50O1xuXG4gICAgICAgIGlucHV0RWxlbWVudCA9IHRoaXMuX2NyZWF0ZUlucHV0RWxlbWVudCh0aGlzLmlucHV0Q2xhc3NOYW1lKTtcbiAgICAgICAgaW5wdXRFbGVtZW50LnZhbHVlID0gdHJlZS5nZXROb2RlRGF0YShub2RlSWQpW3RoaXMuZGF0YUtleV0gfHwgJyc7XG5cbiAgICAgICAgdGV4dEVsZW1lbnQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoaW5wdXRFbGVtZW50LCB0ZXh0RWxlbWVudCk7XG4gICAgICAgIHRleHRFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQgPSBpbnB1dEVsZW1lbnQ7XG5cbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAna2V5dXAnLCB0aGlzLmJvdW5kT25LZXl1cCk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2JsdXInLCB0aGlzLmJvdW5kT25CbHVyKTtcblxuICAgICAgICB0aGlzLmlucHV0RWxlbWVudC5mb2N1cygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXRhY2ggaW5wdXQgZWxlbWVudCBvbiB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZGV0YWNoSW5wdXRFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBpbnB1dEVsID0gdGhpcy5pbnB1dEVsZW1lbnQ7XG4gICAgICAgIHZhciBwYXJlbnROb2RlID0gaW5wdXRFbC5wYXJlbnROb2RlO1xuXG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2tleXVwJywgdGhpcy5ib3VuZE9uS2V5dXApO1xuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdibHVyJywgdGhpcy5ib3VuZE9uQmx1cik7XG5cbiAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaW5wdXRFbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHJlZS5lbmFibGVkRmVhdHVyZXMuQWpheCkge1xuICAgICAgICAgICAgdHJlZS5vZmYodGhpcywgJ3N1Y2Nlc3NBamF4UmVzcG9uc2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaXNDdXN0b21FdmVudElnbm9yZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQgPSBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZGF0YSBvZiBpbnB1dCBlbGVtZW50IHRvIG5vZGUgYW5kIGRldGFjaCBpbnB1dCBlbGVtZW50IG9uIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRoaXMuaW5wdXRFbGVtZW50KTtcbiAgICAgICAgdmFyIHBhcmVudElkID0gdHJlZS5nZXRQYXJlbnRJZChub2RlSWQpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmlucHV0RWxlbWVudC52YWx1ZSB8fCB0aGlzLmRlZmF1bHRWYWx1ZTtcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVDcmVhdGVDaGlsZE5vZGVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gUmV0dXJuIHZhbHVlIG9mIGNyZWF0aW5nIGlucHV0IGVsZW1lbnRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZVxuICAgICAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJylcbiAgICAgICAgICogIC5vbignYmVmb3JlQ3JlYXRlQ2hpbGROb2RlJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZyh2YWx1ZSk7XG4gICAgICAgICAqICAgICAgcmV0dXJuIGZhbHNlOyAvLyBJdCBjYW5jZWxzXG4gICAgICAgICAqICAgICAgLy8gcmV0dXJuIHRydWU7IC8vIEl0IGV4ZWN1dGUgbmV4dFxuICAgICAgICAgKiAgfSk7XG4gICAgICAgICAqL1xuICAgICAgICBpZiAoIXRoaXMudHJlZS5pbnZva2UoJ2JlZm9yZUNyZWF0ZUNoaWxkTm9kZScsIHZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5pc0N1c3RvbUV2ZW50SWdub3JlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmlucHV0RWxlbWVudC5mb2N1cygpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZUlkKSB7XG4gICAgICAgICAgICBkYXRhW3RoaXMuZGF0YUtleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHRyZWUuX3JlbW92ZShub2RlSWQpO1xuICAgICAgICAgICAgdHJlZS5hZGQoZGF0YSwgcGFyZW50SWQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RldGFjaElucHV0RWxlbWVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YSBvZiBpbnB1dCBlbGVtZW50IHRvIG5vZGUgYW5kIGRldGFjaCBpbnB1dCBlbGVtZW50IG9uIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRoaXMuaW5wdXRFbGVtZW50KTtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5pbnB1dEVsZW1lbnQudmFsdWU7XG4gICAgICAgIHZhciBkYXRhID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlRWRpdE5vZGVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gUmV0dXJuIHZhbHVlIG9mIGVkaXRpbmcgaW5wdXQgZWxlbWVudFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlXG4gICAgICAgICAqICAuZW5hYmxlRmVhdHVyZSgnRWRpdGFibGUnKVxuICAgICAgICAgKiAgLm9uKCdiZWZvcmVFZGl0Tm9kZScsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2codmFsdWUpO1xuICAgICAgICAgKiAgICAgIHJldHVybiBmYWxzZTsgLy8gSXQgY2FuY2Vsc1xuICAgICAgICAgKiAgICAgIC8vIHJldHVybiB0cnVlOyAvLyBJdCBleGVjdXRlIG5leHRcbiAgICAgICAgICogIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCF0aGlzLnRyZWUuaW52b2tlKCdiZWZvcmVFZGl0Tm9kZScsIHZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5pc0N1c3RvbUV2ZW50SWdub3JlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmlucHV0RWxlbWVudC5mb2N1cygpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZUlkKSB7XG4gICAgICAgICAgICBkYXRhW3RoaXMuZGF0YUtleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHRyZWUuc2V0Tm9kZURhdGEobm9kZUlkLCBkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kZXRhY2hJbnB1dEVsZW1lbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGFwaXMgb2Ygc2VsZWN0YWJsZSB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0QVBJczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgYmluZCA9IHR1aS51dGlsLmJpbmQ7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgdHJlZVthcGlOYW1lXSA9IGJpbmQodGhpc1thcGlOYW1lXSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRhYmxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vdXRpbCcpO1xuXG52YXIgQVBJX0xJU1QgPSBbXG4gICAgICAgICdzZWxlY3QnLFxuICAgICAgICAnZ2V0U2VsZWN0ZWROb2RlSWQnLFxuICAgICAgICAnZGVzZWxlY3QnXG4gICAgXSxcbiAgICBkZWZhdWx0cyA9IHtcbiAgICAgICAgc2VsZWN0ZWRDbGFzc05hbWU6ICd0dWktdHJlZS1zZWxlY3RlZCdcbiAgICB9O1xuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBzZWxlY3RhYmxlXG4gKiBAY2xhc3MgU2VsZWN0YWJsZVxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5zZWxlY3RlZENsYXNzTmFtZSAtIENsYXNzbmFtZSBmb3Igc2VsZWN0ZWQgbm9kZS5cbiAqIEBpZ25vcmVcbiAqL1xudmFyIFNlbGVjdGFibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFNlbGVjdGFibGUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgU2VsZWN0YWJsZVxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFQSSBsaXN0IG9mIFNlbGVjdGFibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUgPSBvcHRpb25zLnNlbGVjdGVkQ2xhc3NOYW1lO1xuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZUlkID0gbnVsbDtcblxuICAgICAgICB0cmVlLm9uKHtcbiAgICAgICAgICAgIHNpbmdsZUNsaWNrOiB0aGlzLm9uU2luZ2xlQ2xpY2ssXG4gICAgICAgICAgICBhZnRlckRyYXc6IHRoaXMub25BZnRlckRyYXdcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHRoaXMuX3NldEFQSXMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGFwaXMgb2Ygc2VsZWN0YWJsZSB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0QVBJczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgYmluZCA9IHR1aS51dGlsLmJpbmQ7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgdHJlZVthcGlOYW1lXSA9IGJpbmQodGhpc1thcGlOYW1lXSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgbm9kZUVsZW1lbnQgPSB0aGlzLmdldFByZXZFbGVtZW50KCk7XG5cbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdHJlZVthcGlOYW1lXTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwic2luZ2xlQ2xpY2tcIlxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqL1xuICAgIG9uU2luZ2xlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBub2RlSWQgPSB0aGlzLnRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcblxuICAgICAgICB0aGlzLnNlbGVjdChub2RlSWQsIHRhcmdldCk7XG4gICAgfSxcblxuICAgIC8qIGVzbGludC1kaXNhYmxlIHZhbGlkLWpzZG9jXG4gICAgICAgIElnbm9yZSBcInRhcmdldFwiIHBhcmFtZXRlciBhbm5vdGF0aW9uIGZvciBBUEkgcGFnZVxuICAgICAgICBcInRyZWUuc2VsZWN0KG5vZGVJZClcIlxuICAgICAqL1xuICAgIC8qKlxuICAgICAqIFNlbGVjdCBub2RlIGlmIHRoZSBmZWF0dXJlLVwiU2VsZWN0YWJsZVwiIGlzIGVuYWJsZWQuXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEByZXF1aXJlcyBTZWxlY3RhYmxlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuc2VsZWN0KCd0dWktdHJlZS1ub2RlLTMnKTtcbiAgICAgKi9cbiAgICAvKiBlc2xpbnQtZW5hYmxlIHZhbGlkLWpzZG9jICovXG4gICAgc2VsZWN0OiBmdW5jdGlvbihub2RlSWQsIHRhcmdldCkge1xuICAgICAgICB2YXIgdHJlZSwgcHJldkVsZW1lbnQsIG5vZGVFbGVtZW50LFxuICAgICAgICAgICAgc2VsZWN0ZWRDbGFzc05hbWUsIHByZXZOb2RlSWQ7XG5cbiAgICAgICAgaWYgKCFub2RlSWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHByZXZFbGVtZW50ID0gdGhpcy5nZXRQcmV2RWxlbWVudCgpO1xuICAgICAgICBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lID0gdGhpcy5zZWxlY3RlZENsYXNzTmFtZTtcbiAgICAgICAgcHJldk5vZGVJZCA9IHRoaXMuc2VsZWN0ZWROb2RlSWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlU2VsZWN0XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBTZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmV2Tm9kZUlkIC0gUHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR8dW5kZWZpbmVkfSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlXG4gICAgICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScpXG4gICAgICAgICAqICAub24oJ2JlZm9yZVNlbGVjdCcsIGZ1bmN0aW9uKG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KSB7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3NlbGVjdGVkIG5vZGU6ICcgKyBub2RlSWQpO1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdwcmV2aW91cyBzZWxlY3RlZCBub2RlOiAnICsgcHJldk5vZGVJZCk7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3RhcmdldCBlbGVtZW50OiAnICsgdGFyZ2V0KTtcbiAgICAgICAgICogICAgICByZXR1cm4gZmFsc2U7IC8vIEl0IGNhbmNlbHMgXCJzZWxlY3RcIlxuICAgICAgICAgKiAgICAgIC8vIHJldHVybiB0cnVlOyAvLyBJdCBmaXJlcyBcInNlbGVjdFwiXG4gICAgICAgICAqICB9KTtcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0cmVlLmludm9rZSgnYmVmb3JlU2VsZWN0Jywgbm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpKSB7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHByZXZFbGVtZW50LCBzZWxlY3RlZENsYXNzTmFtZSk7XG4gICAgICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBzZWxlY3RlZENsYXNzTmFtZSk7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFRyZWUjc2VsZWN0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gU2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHByZXZOb2RlSWQgLSBQcmV2aW91cyBzZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR8dW5kZWZpbmVkfSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHRyZWVcbiAgICAgICAgICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScpXG4gICAgICAgICAgICAgKiAgLm9uKCdzZWxlY3QnLCBmdW5jdGlvbihub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCkge1xuICAgICAgICAgICAgICogICAgICBjb25zb2xlLmxvZygnc2VsZWN0ZWQgbm9kZTogJyArIG5vZGVJZCk7XG4gICAgICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdwcmV2aW91cyBzZWxlY3RlZCBub2RlOiAnICsgcHJldk5vZGVJZCk7XG4gICAgICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCd0YXJnZXQgZWxlbWVudDogJyArIHRhcmdldCk7XG4gICAgICAgICAgICAgKiAgfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRyZWUuZmlyZSgnc2VsZWN0Jywgbm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IG5vZGVJZDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcHJldmlvdXMgc2VsZWN0ZWQgbm9kZSBlbGVtZW50XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBOb2RlIGVsZW1lbnRcbiAgICAgKi9cbiAgICBnZXRQcmV2RWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLnNlbGVjdGVkTm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHJldHVybnMge3N0cmluZ30gc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFNlbGVjdGVkTm9kZUlkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWROb2RlSWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlc2VsZWN0IG5vZGUgYnkgaWRcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcmVxdWlyZXMgU2VsZWN0YWJsZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLmRlc2VsZWN0KCd0dWktdHJlZS1ub2RlLTMnKTtcbiAgICAgKi9cbiAgICBkZXNlbGVjdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlSWQgPSB0aGlzLnNlbGVjdGVkTm9kZUlkO1xuICAgICAgICB2YXIgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcblxuICAgICAgICBpZiAoIW5vZGVFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBldmVudCBUcmVlI2Rlc2VsZWN0XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBEZXNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZVxuICAgICAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxuICAgICAgICAgKiAgLm9uKCdkZXNlbGVjdCcsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdkZXNlbGVjdGVkIG5vZGU6ICcgKyBub2RlSWQpO1xuICAgICAgICAgKiAgfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0cmVlLmZpcmUoJ2Rlc2VsZWN0Jywgbm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgLSBcImFmdGVyRHJhd1wiXG4gICAgICovXG4gICAgb25BZnRlckRyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZUVsZW1lbnQgPSB0aGlzLmdldFByZXZFbGVtZW50KCk7XG5cbiAgICAgICAgaWYgKG5vZGVFbGVtZW50KSB7XG4gICAgICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdGFibGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgUmVuZGVyIHRyZWUgYW5kIHVwZGF0ZSB0cmVlLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgTGFiIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIGRlZmF1bHRPcHRpb24gPSByZXF1aXJlKCcuL2NvbnN0cy9kZWZhdWx0T3B0aW9uJyksXG4gICAgc3RhdGVzID0gcmVxdWlyZSgnLi9jb25zdHMvc3RhdGVzJyksXG4gICAgbWVzc2FnZXMgPSByZXF1aXJlKCcuL2NvbnN0cy9tZXNzYWdlcycpLFxuICAgIG91dGVyVGVtcGxhdGUgPSByZXF1aXJlKCcuL2NvbnN0cy9vdXRlclRlbXBsYXRlJyksXG4gICAgYWpheENvbW1hbmQgPSByZXF1aXJlKCcuL2NvbnN0cy9hamF4Q29tbWFuZCcpLFxuICAgIFRyZWVNb2RlbCA9IHJlcXVpcmUoJy4vdHJlZU1vZGVsJyksXG4gICAgU2VsZWN0YWJsZSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvc2VsZWN0YWJsZScpLFxuICAgIERyYWdnYWJsZSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvZHJhZ2dhYmxlJyksXG4gICAgRWRpdGFibGUgPSByZXF1aXJlKCcuL2ZlYXR1cmVzL2VkaXRhYmxlJyksXG4gICAgQ2hlY2tib3ggPSByZXF1aXJlKCcuL2ZlYXR1cmVzL2NoZWNrYm94JyksXG4gICAgQ29udGV4dE1lbnUgPSByZXF1aXJlKCcuL2ZlYXR1cmVzL2NvbnRleHRNZW51JyksXG4gICAgQWpheCA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvYWpheCcpO1xuXG52YXIgbm9kZVN0YXRlcyA9IHN0YXRlcy5ub2RlLFxuICAgIGZlYXR1cmVzID0ge1xuICAgICAgICBTZWxlY3RhYmxlOiBTZWxlY3RhYmxlLFxuICAgICAgICBEcmFnZ2FibGU6IERyYWdnYWJsZSxcbiAgICAgICAgRWRpdGFibGU6IEVkaXRhYmxlLFxuICAgICAgICBDaGVja2JveDogQ2hlY2tib3gsXG4gICAgICAgIENvbnRleHRNZW51OiBDb250ZXh0TWVudSxcbiAgICAgICAgQWpheDogQWpheFxuICAgIH0sXG4gICAgc25pcHBldCA9IHR1aS51dGlsLFxuICAgIGV4dGVuZCA9IHNuaXBwZXQuZXh0ZW5kLFxuICAgIFRJTUVPVVRfVE9fRElGRkVSRU5USUFURV9DTElDS19BTkRfREJMQ0xJQ0sgPSAyMDAsXG4gICAgTU9VU0VfTU9WSU5HX1RIUkVTSE9MRCA9IDU7XG4vKipcbiAqIENyZWF0ZSB0cmVlIG1vZGVsIGFuZCBpbmplY3QgZGF0YSB0byBtb2RlbFxuICogQGNsYXNzIFRyZWVcbiAqIEBtaXhlcyB0dWkudXRpbC5DdXN0b21FdmVudHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEEgZGF0YSB0byBiZSB1c2VkIG9uIHRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zXG4gKiAgICAgQHBhcmFtIHtIVE1MRWxlbWVudH0gW29wdGlvbnMucm9vdEVsZW1lbnRdIFJvb3QgZWxlbWVudCAoSXQgc2hvdWxkIGJlICdVTCcgZWxlbWVudClcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubm9kZUlkUHJlZml4XSBBIGRlZmF1bHQgcHJlZml4IG9mIGEgbm9kZVxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5ub2RlRGVmYXVsdFN0YXRlXSBBIGRlZmF1bHQgc3RhdGUgb2YgYSBub2RlXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnRlbXBsYXRlXSBBIG1hcmt1cCBzZXQgdG8gbWFrZSBlbGVtZW50XG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGVdIEhUTUwgdGVtcGxhdGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlLmxlYWZOb2RlXSBIVE1MIHRlbXBsYXRlXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnN0YXRlTGFiZWxzXSBUb2dnbGUgYnV0dG9uIHN0YXRlIGxhYmVsXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5vcGVuZWRdIFN0YXRlLU9QRU5FRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhdGVMYWJlbHMuY2xvc2VkXSBTdGF0ZS1DTE9TRUQgbGFiZWwgKFRleHQgb3IgSFRNTClcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuY2xhc3NOYW1lc10gQ2xhc3MgbmFtZXMgZm9yIHRyZWVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMubm9kZUNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMubGVhZkNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIGxlYWYgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5vcGVuZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBvcGVuZWQgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5jbG9zZWRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBjbG9zZWQgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy50ZXh0Q2xhc3NdIEEgY2xhc3MgbmFtZSB0aGF0IGZvciB0ZXh0RWxlbWVudCBpbiBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnN1YnRyZWVDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBzdWJ0cmVlIGluIGludGVybmFsIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgdG9nZ2xlIGJ1dHRvbiBpbiBpbnRlcm5hbCBub2RlXG4gKiAgICAgQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMucmVuZGVyVGVtcGxhdGVdIEZ1bmN0aW9uIGZvciByZW5kZXJpbmcgdGVtcGxhdGVcbiAqIEBleGFtcGxlXG4gKiAvL0RlZmF1bHQgb3B0aW9uczpcbiAqIC8vIHtcbiAqIC8vICAgICBub2RlSWRQcmVmaXg6ICd0dWktdHJlZS1ub2RlLSdcbiAqIC8vICAgICBub2RlRGVmYXVsdFN0YXRlOiAnY2xvc2VkJyxcbiAqIC8vICAgICBzdGF0ZUxhYmVsczoge1xuICogLy8gICAgICAgICBvcGVuZWQ6ICctJyxcbiAqIC8vICAgICAgICAgY2xvc2VkOiAnKydcbiAqIC8vICAgICB9LFxuICogLy8gICAgIGNsYXNzTmFtZXM6IHtcbiAqIC8vICAgICAgICAgbm9kZUNsYXNzOiAndHVpLXRyZWUtbm9kZScsXG4gKiAvLyAgICAgICAgIGxlYWZDbGFzczogJ3R1aS10cmVlLWxlYWYnLFxuICogLy8gICAgICAgICBvcGVuZWRDbGFzczogJ3R1aS10cmVlLW9wZW5lZCcsXG4gKiAvLyAgICAgICAgIGNsb3NlZENsYXNzOiAndHVpLXRyZWUtY2xvc2VkJyxcbiAqIC8vICAgICAgICAgc3VidHJlZUNsYXNzOiAndHVpLXRyZWUtc3VidHJlZScsXG4gKiAvLyAgICAgICAgIHRvZ2dsZUJ0bkNsYXNzOiAndHVpLXRyZWUtdG9nZ2xlQnRuJyxcbiAqIC8vICAgICAgICAgdGV4dENsYXNzOiAndHVpLXRyZWUtdGV4dCcsXG4gKiAvLyAgICAgfSxcbiAqIC8vICAgICB0ZW1wbGF0ZToge1xuICogLy8gICAgICAgICBpbnRlcm5hbE5vZGU6XG4gKiAvLyAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICogLy8gICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICogLy8gICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPidcbiAqIC8vICAgICAgICAgbGVhZk5vZGU6XG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gKiAvLyAgICAgfVxuICogLy8gfVxuICogLy9cbiAqXG4gKiB2YXIgZGF0YSA9IFtcbiAqICAgICB7dGV4dDogJ3Jvb3RBJywgY2hpbGRyZW46IFtcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFBJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQid9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMUMnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFEJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQScsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViXzFBJywgY2hpbGRyZW46W1xuICogICAgICAgICAgICAgICAgIHt0ZXh0OidzdWJfc3ViXzFBJ31cbiAqICAgICAgICAgICAgIF19LFxuICogICAgICAgICAgICAge3RleHQ6J3N1Yl8yQSd9XG4gKiAgICAgICAgIF19LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkInfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJDJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yRCd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0EnLCBjaGlsZHJlbjogW1xuICogICAgICAgICAgICAge3RleHQ6J3N1YjNfYSd9LFxuICogICAgICAgICAgICAge3RleHQ6J3N1YjNfYid9XG4gKiAgICAgICAgIF19LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0InfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNDJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zRCd9XG4gKiAgICAgXX0sXG4gKiAgICAge3RleHQ6ICdyb290QicsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgIHt0ZXh0OidCX3N1YjEnfSxcbiAqICAgICAgICAge3RleHQ6J0Jfc3ViMid9LFxuICogICAgICAgICB7dGV4dDonYid9XG4gKiAgICAgXX1cbiAqIF07XG4gKlxuICogdmFyIHRyZWUxID0gbmV3IHR1aS5jb21wb25lbnQuVHJlZShkYXRhLCB7XG4gKiAgICAgcm9vdEVsZW1lbnQ6ICd0cmVlUm9vdCcsIC8vIG9yIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmVlUm9vdCcpXG4gKiAgICAgbm9kZURlZmF1bHRTdGF0ZTogJ29wZW5lZCcsXG4gKlxuICogICAgIC8vID09PT09PT09PSBPcHRpb246IE92ZXJyaWRlIHRlbXBsYXRlIHJlbmRlcmVyID09PT09PT09PT09XG4gKlxuICogICAgIHRlbXBsYXRlOiB7IC8vIHRlbXBsYXRlIGZvciBNdXN0YWNoZSBlbmdpbmVcbiAqICAgICAgICAgaW50ZXJuYWxOb2RlOlxuICogICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3t0b2dnbGVCdG5DbGFzc319XCI+e3tzdGF0ZUxhYmVsfX08L2J1dHRvbj4nICtcbiAqICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAqICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e3N1YnRyZWVDbGFzc319XCI+e3tjaGlsZHJlbn19PC91bD4nLFxuICogICAgICAgICBsZWFmTm9kZTpcbiAqICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nXG4gKiAgICAgfSxcbiAqICAgICByZW5kZXJUZW1wbGF0ZTogZnVuY3Rpb24odG1wbCwgcHJvcHMpIHtcbiAqICAgICAgICAgLy8gTXVzdGFjaGUgdGVtcGxhdGUgZW5naW5lXG4gKiAgICAgICAgIHJldHVybiBNdXN0YWNoZS5yZW5kZXIodG1wbCwgcHJvcHMpO1xuICogICAgIH1cbiAqIH0pO1xuICpcbiAqIEB0dXRvcmlhbCBkZWZhdWx0XG4gKiBAdHV0b3JpYWwgZGVwdGhMYWJlbFxuICogQHR1dG9yaWFsIHNlbGVjdGFibGVOb2Rlc1xuICogQHR1dG9yaWFsIGNoZWNrXG4gKiBAdHV0b3JpYWwgY3R4TWVudVxuICogQHR1dG9yaWFsIGFqYXhGZWF0dXJlXG4gKiovXG52YXIgVHJlZSA9IHNuaXBwZXQuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCBjbGFzcyBuYW1lc1xuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNsYXNzTmFtZXMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb24uY2xhc3NOYW1lcywgb3B0aW9ucy5jbGFzc05hbWVzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCB0ZW1wbGF0ZVxuICAgICAgICAgKiBAdHlwZSB7e2ludGVybmFsTm9kZTogc3RyaW5nLCBsZWFmTm9kZTogc3RyaW5nfX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb24udGVtcGxhdGUsIG9wdGlvbnMudGVtcGxhdGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSb290IGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IG9wdGlvbnMucm9vdEVsZW1lbnQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRvZ2dsZSBidXR0b24gc3RhdGUgbGFiZWxcbiAgICAgICAgICogQHR5cGUge3tvcGVuZWQ6IHN0cmluZywgY2xvc2VkOiBzdHJpbmd9fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zdGF0ZUxhYmVscyA9IG9wdGlvbnMuc3RhdGVMYWJlbHM7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ha2UgdHJlZSBtb2RlbFxuICAgICAgICAgKiBAdHlwZSB7VHJlZU1vZGVsfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tb2RlbCA9IG5ldyBUcmVlTW9kZWwoZGF0YSwgb3B0aW9ucyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVuYWJsZWQgZmVhdHVyZXNcbiAgICAgICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCBvYmplY3Q+fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lbmFibGVkRmVhdHVyZXMgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xpY2sgdGltZXIgdG8gcHJldmVudCBjbGljay1kdXBsaWNhdGlvbiB3aXRoIGRvdWJsZSBjbGlja1xuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVG8gcHJldmVudCBjbGljayBldmVudCBpZiBtb3VzZSBtb3ZlZCBiZWZvcmUgbW91c2V1cC5cbiAgICAgICAgICogQHR5cGUge251bWJlcn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX21vdXNlTW92aW5nRmxhZyA9IGZhbHNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW5kZXIgdGVtcGxhdGVcbiAgICAgICAgICogSXQgY2FuIGJlIG92ZXJyb2RlIGJ5IHVzZXIncyB0ZW1wbGF0ZSBlbmdpbmUuXG4gICAgICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3JlbmRlclRlbXBsYXRlID0gb3B0aW9ucy5yZW5kZXJUZW1wbGF0ZSB8fCB1dGlsLnJlbmRlclRlbXBsYXRlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcnVlIHdoZW4gYSBub2RlIGlzIG1vdmluZ1xuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbih7XG4gICAgICAgICAqICAgICBiZWZvcmVEcmF3OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgICAgICBpZiAodHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICogICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgKiAgICAgICAgIH1cbiAgICAgICAgICogICAgICAgICAvLy4uXG4gICAgICAgICAqICAgICB9LFxuICAgICAgICAgKiAgICAgLy8uLi4uXG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKiB0cmVlLm1vdmUoJ3R1aS10cmVlLW5vZGUtMScsICd0dWktdHJlZS1ub2RlLTInKTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNNb3ZpbmdOb2RlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5fc2V0Um9vdCgpO1xuICAgICAgICB0aGlzLl9kcmF3KHRoaXMuZ2V0Um9vdE5vZGVJZCgpKTtcbiAgICAgICAgdGhpcy5fc2V0RXZlbnRzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByb290IGVsZW1lbnQgb2YgdHJlZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJvb3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcm9vdEVsID0gdGhpcy5yb290RWxlbWVudDtcblxuICAgICAgICBpZiAoc25pcHBldC5pc1N0cmluZyhyb290RWwpKSB7XG4gICAgICAgICAgICByb290RWwgPSB0aGlzLnJvb3RFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocm9vdEVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc25pcHBldC5pc0hUTUxOb2RlKHJvb3RFbCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlcy5JTlZBTElEX1JPT1RfRUxFTUVOVCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTW92ZSBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3JpZ2luYWxQYXJlbnRJZCAtIE9yaWdpbmFsIHBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtpbmRleF0gLSBTdGFydCBpbmRleCBudW1iZXIgZm9yIGluc2VydGluZ1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTW92ZTogZnVuY3Rpb24obm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCwgaW5kZXgpIHtcbiAgICAgICAgdGhpcy5fZHJhdyhvcmlnaW5hbFBhcmVudElkKTtcbiAgICAgICAgdGhpcy5fZHJhdyhuZXdQYXJlbnRJZCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjbW92ZVxuICAgICAgICAgKiBAcGFyYW0ge3tub2RlSWQ6IHN0cmluZywgb3JpZ2luYWxQYXJlbnRJZDogc3RyaW5nLCBuZXdQYXJlbnRJZDogc3RyaW5nLCBpbmRleDogbnVtYmVyfX0gdHJlZUV2ZW50IC0gRXZlbnRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbignbW92ZScsIGZ1bmN0aW9uKHRyZWVFdmVudCkge1xuICAgICAgICAgKiAgICAgdmFyIG5vZGVJZCA9IHRyZWVFdmVudC5ub2RlSWQ7XG4gICAgICAgICAqICAgICB2YXIgb3JpZ2luYWxQYXJlbnRJZCA9IHRyZWVFdmVudC5vcmlnaW5hbFBhcmVudElkO1xuICAgICAgICAgKiAgICAgdmFyIG5ld1BhcmVudElkID0gdHJlZUV2ZW50Lm5ld1BhcmVudElkO1xuICAgICAgICAgKiAgICAgdmFyIGluZGV4ID0gdHJlZUV2ZW50LmluZGV4O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCwgaW5kZXgpO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlyZSgnbW92ZScsIHtcbiAgICAgICAgICAgIG5vZGVJZDogbm9kZUlkLFxuICAgICAgICAgICAgb3JpZ2luYWxQYXJlbnRJZDogb3JpZ2luYWxQYXJlbnRJZCxcbiAgICAgICAgICAgIG5ld1BhcmVudElkOiBuZXdQYXJlbnRJZCxcbiAgICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGV2ZW50IGhhbmRsZXJzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0RXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5vbih7XG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuX2RyYXcsXG4gICAgICAgICAgICBtb3ZlOiB0aGlzLl9vbk1vdmVcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnY2xpY2snLCBzbmlwcGV0LmJpbmQodGhpcy5fb25DbGljaywgdGhpcykpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290RWxlbWVudCwgJ21vdXNlZG93bicsIHNuaXBwZXQuYmluZCh0aGlzLl9vbk1vdXNlZG93biwgdGhpcykpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290RWxlbWVudCwgJ2RibGNsaWNrJywgc25pcHBldC5iaW5kKHRoaXMuX29uRG91YmxlQ2xpY2ssIHRoaXMpKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdjb250ZXh0bWVudScsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkNvbnRleHRNZW51LCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBjb250ZXh0bWVudVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gbW91c2VFdmVudCAtIENvbnRleHRtZW51IGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Db250ZXh0TWVudTogZnVuY3Rpb24obW91c2VFdmVudCkge1xuICAgICAgICB0aGlzLmZpcmUoJ2NvbnRleHRtZW51JywgbW91c2VFdmVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZWRvd25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGRvd25FdmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Nb3VzZWRvd246IGZ1bmN0aW9uKGRvd25FdmVudCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICBjbGllbnRYID0gZG93bkV2ZW50LmNsaWVudFgsXG4gICAgICAgICAgICBjbGllbnRZID0gZG93bkV2ZW50LmNsaWVudFksXG4gICAgICAgICAgICBhYnMgPSBNYXRoLmFicztcblxuICAgICAgICBmdW5jdGlvbiBvbk1vdXNlTW92ZShtb3ZlRXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBuZXdDbGllbnRYID0gbW92ZUV2ZW50LmNsaWVudFgsXG4gICAgICAgICAgICAgICAgbmV3Q2xpZW50WSA9IG1vdmVFdmVudC5jbGllbnRZO1xuXG4gICAgICAgICAgICBpZiAoYWJzKG5ld0NsaWVudFggLSBjbGllbnRYKSArIGFicyhuZXdDbGllbnRZIC0gY2xpZW50WSkgPiBNT1VTRV9NT1ZJTkdfVEhSRVNIT0xEKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5maXJlKCdtb3VzZW1vdmUnLCBtb3ZlRXZlbnQpO1xuICAgICAgICAgICAgICAgIHNlbGYuX21vdXNlTW92aW5nRmxhZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Nb3VzZVVwKHVwRXZlbnQpIHtcbiAgICAgICAgICAgIHNlbGYuZmlyZSgnbW91c2V1cCcsIHVwRXZlbnQpO1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW91dCcsIG9uTW91c2VPdXQpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uTW91c2VPdXQoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC50b0VsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmZpcmUoJ21vdXNldXAnLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9tb3VzZU1vdmluZ0ZsYWcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5maXJlKCdtb3VzZWRvd24nLCBkb3duRXZlbnQpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW91dCcsIG9uTW91c2VPdXQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gY2xpY2tcbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IC0gQ2xpY2sgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpLFxuICAgICAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHV0aWwuaXNSaWdodEJ1dHRvbihldmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzKSkge1xuICAgICAgICAgICAgdGhpcy50b2dnbGUodGhpcy5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmNsaWNrVGltZXIgJiYgIXRoaXMuX21vdXNlTW92aW5nRmxhZykge1xuICAgICAgICAgICAgdGhpcy5maXJlKCdzaW5nbGVDbGljaycsIGV2ZW50KTtcbiAgICAgICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5yZXNldENsaWNrVGltZXIoKTtcbiAgICAgICAgICAgIH0sIFRJTUVPVVRfVE9fRElGRkVSRU5USUFURV9DTElDS19BTkRfREJMQ0xJQ0spO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBkb3VibGUgY2xpY2sgKGRibGNsaWNrKVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBEb3VibGUgY2xpY2sgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkRvdWJsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLmZpcmUoJ2RvdWJsZUNsaWNrJywgZXZlbnQpO1xuICAgICAgICB0aGlzLnJlc2V0Q2xpY2tUaW1lcigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbm9kZSBzdGF0ZSAtIG9wZW5lZCBvciBjbG9zZWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIE5vZGUgc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSkge1xuICAgICAgICB2YXIgc3VidHJlZUVsZW1lbnQgPSB0aGlzLl9nZXRTdWJ0cmVlRWxlbWVudChub2RlSWQpLFxuICAgICAgICAgICAgbGFiZWwsIGJ0bkVsZW1lbnQsIG5vZGVFbGVtZW50O1xuXG4gICAgICAgIGlmICghc3VidHJlZUVsZW1lbnQgfHwgc3VidHJlZUVsZW1lbnQgPT09IHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsYWJlbCA9IHRoaXMuc3RhdGVMYWJlbHNbc3RhdGVdO1xuICAgICAgICBub2RlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG5cbiAgICAgICAgYnRuRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgIG5vZGVFbGVtZW50LFxuICAgICAgICAgICAgdGhpcy5jbGFzc05hbWVzLnRvZ2dsZUJ0bkNsYXNzXG4gICAgICAgIClbMF07XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBub2RlU3RhdGVzLk9QRU5FRCkge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlKG5vZGVFbGVtZW50LCBzdGF0ZSk7XG5cbiAgICAgICAgaWYgKGJ0bkVsZW1lbnQpIHtcbiAgICAgICAgICAgIGJ0bkVsZW1lbnQuaW5uZXJIVE1MID0gbGFiZWw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG5vZGUgY2xhc3MgbmFtZSBmcm9tIHByb3ZpZGVkIHN0YXRlXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZUVsZW1lbnQgLSBUcmVlTm9kZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTmV3IGNoYW5nZWQgc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXROb2RlQ2xhc3NOYW1lRnJvbVN0YXRlOiBmdW5jdGlvbihub2RlRWxlbWVudCwgc3RhdGUpIHtcbiAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXMsXG4gICAgICAgICAgICBvcGVuZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuT1BFTkVEICsgJ0NsYXNzJ10sXG4gICAgICAgICAgICBjbG9zZWRDbGFzc05hbWUgPSBjbGFzc05hbWVzW25vZGVTdGF0ZXMuQ0xPU0VEICsgJ0NsYXNzJ107XG5cbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgb3BlbmVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhub2RlRWxlbWVudCwgY2xvc2VkQ2xhc3NOYW1lKTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyhub2RlRWxlbWVudCwgY2xhc3NOYW1lc1tzdGF0ZSArICdDbGFzcyddKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGh0bWxcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBub2RlSWRzIC0gTm9kZSBpZCBsaXN0XG4gICAgICogQHJldHVybnMge3N0cmluZ30gSFRNTFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHNlZSBvdXRlclRlbXBsYXRlIHVzZXMgXCJ1dGlsLnJlbmRlclRlbXBsYXRlXCJcbiAgICAgKi9cbiAgICBfbWFrZUh0bWw6IGZ1bmN0aW9uKG5vZGVJZHMpIHtcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbCxcbiAgICAgICAgICAgIGh0bWwgPSAnJztcblxuICAgICAgICBzbmlwcGV0LmZvckVhY2gobm9kZUlkcywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IG1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgICAgICBzb3VyY2VzLCBwcm9wcztcblxuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzb3VyY2VzID0gdGhpcy5fZ2V0VGVtcGxhdGUobm9kZSk7XG4gICAgICAgICAgICBwcm9wcyA9IHRoaXMuX21ha2VUZW1wbGF0ZVByb3BzKG5vZGUpO1xuICAgICAgICAgICAgcHJvcHMuaW5uZXJUZW1wbGF0ZSA9IHRoaXMuX21ha2VJbm5lckhUTUwobm9kZSwge1xuICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlcy5pbm5lcixcbiAgICAgICAgICAgICAgICBwcm9wczogcHJvcHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaHRtbCArPSB1dGlsLnJlbmRlclRlbXBsYXRlKHNvdXJjZXMub3V0ZXIsIHByb3BzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgaW5uZXIgaHRtbCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcGFyYW0ge3tzb3VyY2U6IHN0cmluZywgcHJvcHM6IE9iamVjdH19IFtjYWNoZWRdIC0gQ2FzaGVkIGRhdGEgdG8gbWFrZSBodG1sXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSW5uZXIgaHRtbCBvZiBub2RlXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAc2VlIGlubmVyVGVtcGxhdGUgdXNlcyBcInRoaXMuX3JlbmRlclRlbXBsYXRlXCJcbiAgICAgKi9cbiAgICBfbWFrZUlubmVySFRNTDogZnVuY3Rpb24obm9kZSwgY2FjaGVkKSB7XG4gICAgICAgIHZhciBzb3VyY2UsIHByb3BzO1xuXG4gICAgICAgIGNhY2hlZCA9IGNhY2hlZCB8fCB7fTtcbiAgICAgICAgc291cmNlID0gY2FjaGVkLnNvdXJjZSB8fCB0aGlzLl9nZXRUZW1wbGF0ZShub2RlKS5pbm5lcjtcbiAgICAgICAgcHJvcHMgPSBjYWNoZWQucHJvcHMgfHwgdGhpcy5fbWFrZVRlbXBsYXRlUHJvcHMobm9kZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlclRlbXBsYXRlKHNvdXJjZSwgcHJvcHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGVtcGxhdGUgc291cmNlc1xuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHJldHVybnMge3tpbm5lcjogc3RyaW5nLCBvdXRlcjogc3RyaW5nfX0gVGVtcGxhdGUgc291cmNlc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFRlbXBsYXRlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBzb3VyY2U7XG5cbiAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHNvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICBpbm5lcjogdGhpcy50ZW1wbGF0ZS5sZWFmTm9kZSxcbiAgICAgICAgICAgICAgICBvdXRlcjogb3V0ZXJUZW1wbGF0ZS5MRUFGX05PREVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VyY2UgPSB7XG4gICAgICAgICAgICAgICAgaW5uZXI6IHRoaXMudGVtcGxhdGUuaW50ZXJuYWxOb2RlLFxuICAgICAgICAgICAgICAgIG91dGVyOiBvdXRlclRlbXBsYXRlLklOVEVSTkFMX05PREVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291cmNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRlbXBsYXRlIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBub2RlIC0gTm9kZVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRlbXBsYXRlIHByb3BlcnRpZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlVGVtcGxhdGVQcm9wczogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcbiAgICAgICAgICAgIHByb3BzLCBzdGF0ZTtcblxuICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IG5vZGUuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICBpc0xlYWY6IHRydWUgLy8gZm9yIGN1c3RvbSB0ZW1wbGF0ZSBtZXRob2RcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKTtcbiAgICAgICAgICAgIHByb3BzID0ge1xuICAgICAgICAgICAgICAgIGlkOiBub2RlLmdldElkKCksXG4gICAgICAgICAgICAgICAgc3RhdGVDbGFzczogY2xhc3NOYW1lc1tzdGF0ZSArICdDbGFzcyddLFxuICAgICAgICAgICAgICAgIHN0YXRlTGFiZWw6IHRoaXMuc3RhdGVMYWJlbHNbc3RhdGVdLFxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiB0aGlzLl9tYWtlSHRtbChub2RlLmdldENoaWxkSWRzKCkpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4dGVuZChwcm9wcywgY2xhc3NOYW1lcywgbm9kZS5nZXRBbGxEYXRhKCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEcmF3IGVsZW1lbnQgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCksXG4gICAgICAgICAgICBlbGVtZW50LCBodG1sO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlRHJhd1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdiZWZvcmVEcmF3JywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAqICAgICBpZiAodHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICogICAgICAgICBjb25zb2xlLmxvZygnaXNNb3ZpbmdOb2RlJyk7XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZygnYmVmb3JlRHJhdzogJyArIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdiZWZvcmVEcmF3Jywgbm9kZUlkKTtcblxuICAgICAgICBpZiAobm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgaHRtbCA9IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5yb290RWxlbWVudDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGh0bWwgPSB0aGlzLl9tYWtlSW5uZXJIVE1MKG5vZGUpO1xuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLl9zZXRDbGFzc1dpdGhEaXNwbGF5KG5vZGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2FmdGVyRHJhd1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdhZnRlckRyYXcnLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgIGlmICh0cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCdpc01vdmluZ05vZGUnKTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCdhZnRlckRyYXc6ICcgKyBub2RlSWQpO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlyZSgnYWZ0ZXJEcmF3Jywgbm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNsYXNzIGFuZCBkaXNwbGF5IG9mIG5vZGUgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q2xhc3NXaXRoRGlzcGxheTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgbm9kZUlkID0gbm9kZS5nZXRJZCgpLFxuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCksXG4gICAgICAgICAgICBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzO1xuXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5sZWFmQ2xhc3MpO1xuXG4gICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZXMub3BlbmVkQ2xhc3MpO1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhlbGVtZW50LCBjbGFzc05hbWVzLmNsb3NlZENsYXNzKTtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5sZWFmQ2xhc3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBub2RlLmdldFN0YXRlKCkpO1xuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0Q2xhc3NXaXRoRGlzcGxheShjaGlsZCk7XG4gICAgICAgICAgICB9LCBub2RlSWQsIHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzdWJ0cmVlIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVHJlZU5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFN1YnRyZWUgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN1YnRyZWVFbGVtZW50OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50O1xuXG4gICAgICAgIGlmICghbm9kZSB8fCBub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQgPSB1dGlsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKSxcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZXMuc3VidHJlZUNsYXNzXG4gICAgICAgICAgICApWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1YnRyZWVFbGVtZW50O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGRlcHRoIG9mIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfHVuZGVmaW5lZH0gRGVwdGhcbiAgICAgKi9cbiAgICBnZXREZXB0aDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldERlcHRoKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgbGFzdCBkZXB0aCBvZiB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IExhc3QgZGVwdGhcbiAgICAgKi9cbiAgICBnZXRMYXN0RGVwdGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRMYXN0RGVwdGgoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHJvb3Qgbm9kZSBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSb290IG5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRSb290Tm9kZUlkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwucm9vdE5vZGUuZ2V0SWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGNoaWxkIGlkc1xuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPnx1bmRlZmluZWR9IENoaWxkIGlkc1xuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHBhcmVudCBpZCBvZiBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFBhcmVudCBpZFxuICAgICAqL1xuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0UGFyZW50SWQobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgY2xpY2sgdGltZXJcbiAgICAgKi9cbiAgICByZXNldENsaWNrVGltZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuY2xpY2tUaW1lcik7XG4gICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIGlkIGZyb20gZWxlbWVudFxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gRWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQoZWxlbWVudEluTm9kZSk7IC8vICd0dWktdHJlZS1ub2RlLTMnXG4gICAgICovXG4gICAgZ2V0Tm9kZUlkRnJvbUVsZW1lbnQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGlkUHJlZml4ID0gdGhpcy5nZXROb2RlSWRQcmVmaXgoKTtcblxuICAgICAgICB3aGlsZSAoZWxlbWVudCAmJiBlbGVtZW50LmlkLmluZGV4T2YoaWRQcmVmaXgpID09PSAtMSkge1xuICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50ID8gZWxlbWVudC5pZCA6ICcnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcHJlZml4IG9mIG5vZGUgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUHJlZml4IG9mIG5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0Tm9kZUlkUHJlZml4KCk7IC8vICd0dWktdHJlZS1ub2RlLSdcbiAgICAgKi9cbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXROb2RlSWRQcmVmaXgoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtvYmplY3R8dW5kZWZpbmVkfSBOb2RlIGRhdGFcbiAgICAgKi9cbiAgICBnZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVEYXRhKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkYXRhIHByb3BlcnRpZXMgb2YgYSBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBQcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIE9wdGlvbnNcbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlQWpheF0gLSBTdGF0ZSBvZiB1c2luZyBBamF4XG4gICAgICogQGV4bWFwbGVcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwge2ZvbzogJ2Jhcid9KTsgLy8gYXV0byByZWZyZXNoXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIHtmb286ICdiYXInfSwgdHJ1ZSk7IC8vIG5vdCByZWZyZXNoXG4gICAgICovXG4gICAgc2V0Tm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCwgZGF0YSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0cmVlQWpheCA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzLkFqYXg7XG4gICAgICAgIHZhciB1c2VBamF4ID0gb3B0aW9ucyA/IG9wdGlvbnMudXNlQWpheCA6ICEhdHJlZUFqYXg7XG4gICAgICAgIHZhciBpc1NpbGVudCA9IG9wdGlvbnMgPyBvcHRpb25zLmlzU2lsZW50IDogZmFsc2U7XG5cbiAgICAgICAgaWYgKHVzZUFqYXgpIHtcbiAgICAgICAgICAgIHRyZWVBamF4LmxvYWREYXRhKGFqYXhDb21tYW5kLlVQREFURSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2V0Tm9kZURhdGEobm9kZUlkLCBkYXRhKTtcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBub2RlSWQ6IG5vZGVJZCxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdzZXQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NldE5vZGVEYXRhKG5vZGVJZCwgZGF0YSwgaXNTaWxlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkYXRhIHByb3BlcnRpZXMgb2YgYSBub2RlIChDb3JlIG1ldGhvZClcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gUHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBkYXRhLCBpc1NpbGVudCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldE5vZGVEYXRhKG5vZGVJZCwgZGF0YSwgaXNTaWxlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zXG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqICAgICBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnVzZUFqYXhdIC0gU3RhdGUgb2YgdXNpbmcgQWpheFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsICdmb28nKTsgLy8gYXV0byByZWZyZXNoXG4gICAgICogdHJlZS5zZXROb2RlRGF0YShub2RlSWQsICdmb28nLCB0cnVlKTsgLy8gbm90IHJlZnJlc2hcbiAgICAgKi9cbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBuYW1lcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0cmVlQWpheCA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzLkFqYXg7XG4gICAgICAgIHZhciB1c2VBamF4ID0gb3B0aW9ucyA/IG9wdGlvbnMudXNlQWpheCA6ICEhdHJlZUFqYXg7XG4gICAgICAgIHZhciBpc1NpbGVudCA9IG9wdGlvbnMgPyBvcHRpb25zLmlzU2lsZW50IDogZmFsc2U7XG5cbiAgICAgICAgaWYgKHVzZUFqYXgpIHtcbiAgICAgICAgICAgIHRyZWVBamF4LmxvYWREYXRhKGFqYXhDb21tYW5kLlVQREFURSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlTm9kZURhdGEobm9kZUlkLCBuYW1lcyk7XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgbm9kZUlkOiBub2RlSWQsXG4gICAgICAgICAgICAgICAgbmFtZXM6IG5hbWVzLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZU5vZGVEYXRhKG5vZGVJZCwgbmFtZXMsIGlzU2lsZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhIChDb3JlIG1ldGhvZClcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fSBuYW1lcyAtIE5hbWVzIG9mIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlTm9kZURhdGE6IGZ1bmN0aW9uKG5vZGVJZCwgbmFtZXMsIGlzU2lsZW50KSB7XG4gICAgICAgIHRoaXMubW9kZWwucmVtb3ZlTm9kZURhdGEobm9kZUlkLCBuYW1lcywgaXNTaWxlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBzdGF0ZS5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IE5vZGUgc3RhdGUoKCdvcGVuZWQnLCAnY2xvc2VkJywgbnVsbClcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZ2V0U3RhdGUobm9kZUlkKTsgLy8gJ29wZW5lZCcsICdjbG9zZWQnLFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgLy8gdW5kZWZpbmVkIGlmIHRoZSBub2RlIGlzIG5vbmV4aXN0ZW50XG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPcGVuIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKi9cbiAgICBvcGVuOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5PUEVORUQ7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5lbmFibGVkRmVhdHVyZXMuQWpheCkge1xuICAgICAgICAgICAgdGhpcy5fcmVsb2FkKG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xvc2Ugbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZVN0YXRlcy5DTE9TRUQ7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKi9cbiAgICB0b2dnbGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuICAgICAgICB2YXIgc3RhdGU7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUuaXNSb290KCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUudG9nZ2xlU3RhdGUoKTtcbiAgICAgICAgc3RhdGUgPSBub2RlLmdldFN0YXRlKCk7XG4gICAgICAgIHRoaXMuX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlKG5vZGVJZCwgc3RhdGUpO1xuXG4gICAgICAgIGlmICh0aGlzLmVuYWJsZWRGZWF0dXJlcy5BamF4KSB7XG4gICAgICAgICAgICB0aGlzLl9yZWxvYWQobm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZWxvYWQgY2hpbGRyZW4gbm9kZXMgd2hpbGUgXCJzdGF0ZUxhYmxlXCIgaXMgY2xpY2tlZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVsb2FkOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKTtcbiAgICAgICAgdmFyIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xuICAgICAgICB2YXIgaXNSZWxvYWQgPSBzbmlwcGV0LmlzVW5kZWZpbmVkKG5vZGUuZ2V0RGF0YSgncmVsb2FkJykpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmdldERhdGEoJ3JlbG9hZCcpO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbm9kZVN0YXRlcy5DTE9TRUQpIHsgLy8gb3BlbiAtPiBjbG9zZSBhY3Rpb25cbiAgICAgICAgICAgIHRoaXMuX3NldE5vZGVEYXRhKG5vZGVJZCwge3JlbG9hZDogZmFsc2V9LCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbm9kZVN0YXRlcy5PUEVORUQgJiYgaXNSZWxvYWQpIHsgLy8gY2xvc2UgLT4gb3BlbiBhY3Rpb25cbiAgICAgICAgICAgIHRoaXMucmVzZXRBbGxEYXRhKG51bGwsIHtcbiAgICAgICAgICAgICAgICBub2RlSWQ6IG5vZGVJZCxcbiAgICAgICAgICAgICAgICB1c2VBamF4OiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTb3J0IGFsbCBub2Rlc1xuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIC0gQ29tcGFyYXRvciBmb3Igc29ydGluZ1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IHRyZWVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIFNvcnQgd2l0aCByZWRyYXdpbmcgdHJlZVxuICAgICAqIHRyZWUuc29ydChmdW5jdGlvbihub2RlQSwgbm9kZUIpIHtcbiAgICAgKiAgICAgdmFyIGFWYWx1ZSA9IG5vZGVBLmdldERhdGEoJ3RleHQnKSxcbiAgICAgKiAgICAgICAgIGJWYWx1ZSA9IG5vZGVCLmdldERhdGEoJ3RleHQnKTtcbiAgICAgKlxuICAgICAqICAgICBpZiAoIWJWYWx1ZSB8fCAhYlZhbHVlLmxvY2FsZUNvbXBhcmUpIHtcbiAgICAgKiAgICAgICAgIHJldHVybiAwO1xuICAgICAqICAgICB9XG4gICAgICogICAgIHJldHVybiBiVmFsdWUubG9jYWxlQ29tcGFyZShhVmFsdWUpO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogLy8gU29ydCwgYnV0IG5vdCByZWRyYXcgdHJlZVxuICAgICAqIHRyZWUuc29ydChmdW5jdGlvbihub2RlQSwgbm9kZUIpIHtcbiAgICAgKiAgICAgdmFyIGFWYWx1ZSA9IG5vZGVBLmdldERhdGEoJ3RleHQnKSxcbiAgICAgKiAgICAgICAgIGJWYWx1ZSA9IG5vZGVCLmdldERhdGEoJ3RleHQnKTtcbiAgICAgKlxuICAgICAqICAgICBpZiAoIWJWYWx1ZSB8fCAhYlZhbHVlLmxvY2FsZUNvbXBhcmUpIHtcbiAgICAgKiAgICAgICAgIHJldHVybiAwO1xuICAgICAqICAgICB9XG4gICAgICogICAgIHJldHVybiBiVmFsdWUubG9jYWxlQ29tcGFyZShhVmFsdWUpO1xuICAgICAqIH0sIHRydWUpO1xuICAgICAqL1xuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IsIGlzU2lsZW50KSB7XG4gICAgICAgIHRoaXMubW9kZWwuc29ydChjb21wYXJhdG9yKTtcbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVmcmVzaCB0cmVlIG9yIG5vZGUncyBjaGlsZHJlblxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW25vZGVJZF0gLSBUcmVlTm9kZSBpZCB0byByZWZyZXNoXG4gICAgICovXG4gICAgcmVmcmVzaDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIG5vZGVJZCA9IG5vZGVJZCB8fCB0aGlzLmdldFJvb3ROb2RlSWQoKTtcbiAgICAgICAgdGhpcy5fZHJhdyhub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIG5vZGVzLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZWFjaEFsbChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcbiAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZS5nZXRJZCgpID09PSBub2RlSWQpOyAvLyB0cnVlXG4gICAgICogfSk7XG4gICAgICovXG4gICAgZWFjaEFsbDogZnVuY3Rpb24oaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5lYWNoQWxsKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBkZXNjZW5kYW50cyBvZiBhIG5vZGUuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIGl0ZXJhdGVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLmVhY2goZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICogICAgIGNvbnNvbGUubG9nKG5vZGUuZ2V0SWQoKSA9PT0gbm9kZUlkKTsgLy8gdHJ1ZVxuICAgICAqIH0sIHBhcmVudElkKTtcbiAgICAgKlxuICAgICAqL1xuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCkge1xuICAgICAgICB0aGlzLm1vZGVsLmVhY2goaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIG5vZGUocykuXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3LWRhdGFcbiAgICAgKiBAcGFyYW0geyp9IFtwYXJlbnRJZF0gLSBQYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIC0gT3B0aW9uc1xuICAgICAqICAgICBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmlzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlQWpheF0gLSBTdGF0ZSBvZiB1c2luZyBBamF4XG4gICAgICogQHJldHVybnMgez9BcnJheS48c3RyaW5nPn0gQWRkZWQgbm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIGFkZCBub2RlIHdpdGggcmVkcmF3aW5nXG4gICAgICogdmFyIGZpcnN0QWRkZWRJZHMgPSB0cmVlLmFkZCh7dGV4dDonRkUgZGV2ZWxvcG1lbnQgdGVhbTEnfSwgcGFyZW50SWQpO1xuICAgICAqIGNvbnNvbGUubG9nKGZpcnN0QWRkZWRJZHMpOyAvLyBbXCJ0dWktdHJlZS1ub2RlLTEwXCJdXG4gICAgICpcbiAgICAgKiAvLyBhZGQgbm9kZSB3aXRob3V0IHJlZHJhd2luZ1xuICAgICAqIHZhciBzZWNvbmRBZGRlZElkcyA9IHRyZWUuYWRkKFtcbiAgICAgKiAgICB7dGV4dDogJ0ZFIGRldmVsb3BtZW50IHRlYW0yJ30sXG4gICAgICogICAge3RleHQ6ICdGRSBkZXZlbG9wbWVudCB0ZWFtMyd9XG4gICAgICogXSwgcGFyZW50SWQsIHRydWUpO1xuICAgICAqIGNvbnNvbGUubG9nKHNlY29uZEFkZGVkSWRzKTsgLy8gW1widHVpLXRyZWUtbm9kZS0xMVwiLCBcInR1aS10cmVlLW5vZGUtMTJcIl1cbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRyZWVBamF4ID0gdGhpcy5lbmFibGVkRmVhdHVyZXMuQWpheDtcbiAgICAgICAgdmFyIHVzZUFqYXggPSBvcHRpb25zID8gb3B0aW9ucy51c2VBamF4IDogISF0cmVlQWpheDtcbiAgICAgICAgdmFyIGlzU2lsZW50ID0gb3B0aW9ucyA/IG9wdGlvbnMuaXNTaWxlbnQgOiBmYWxzZTtcbiAgICAgICAgdmFyIG5ld0NoaWxkSWRzO1xuXG4gICAgICAgIGlmICh1c2VBamF4KSB7XG4gICAgICAgICAgICB0cmVlQWpheC5sb2FkRGF0YShhamF4Q29tbWFuZC5DUkVBVEUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLl9hZGQoZGF0YSwgcGFyZW50SWQpO1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhcmVudElkOiBwYXJlbnRJZCxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld0NoaWxkSWRzID0gdGhpcy5fYWRkKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3Q2hpbGRJZHM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBub2RlKHMpLiAoQ29yZSBtZXRob2QpXG4gICAgICogLSBJZiB0aGUgcGFyZW50SWQgaXMgZmFsc3ksIHRoZSBub2RlIHdpbGwgYmUgYXBwZW5kZWQgdG8gcm9vdE5vZGUuXG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxuICAgICAqIEBwYXJhbSB7Kn0gW3BhcmVudElkXSAtIFBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZDogZnVuY3Rpb24oZGF0YSwgcGFyZW50SWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmFkZChkYXRhLCBwYXJlbnRJZCwgaXNTaWxlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXNldCBhbGwgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdyBkYXRhIGZvciBhbGwgbm9kZXNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIC0gT3B0aW9uc1xuICAgICAqICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubm9kZUlkXSAtIFBhcmVudCBub2RlIGlkIHRvIHJlc2V0IGFsbCBjaGlsZCBkYXRhXG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlQWpheF0gLSBTdGF0ZSBvZiB1c2luZyBBamF4XG4gICAgICogQHJldHVybnMgez9BcnJheS48c3RyaW5nPn0gQWRkZWQgbm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUucmVzZXRBbGxEYXRhKFtcbiAgICAgKiAge3RleHQ6ICdoZWxsbycsIGNoaWxkcmVuOiBbXG4gICAgICogICAgICB7dGV4dDogJ2Zvbyd9LFxuICAgICAqICAgICAge3RleHQ6ICdiYXInfVxuICAgICAqICBdfSxcbiAgICAgKiAge3RleHQ6ICd3b3JsZCd9XG4gICAgICogXSk7XG4gICAgICogdHJlZS5yZXNldEFsbERhdGEoW1xuICAgICAqICB7dGV4dDogJ2hlbGxvIHdvcmxkJ31cbiAgICAgKiBdLCB7XG4gICAgICogIG5vZGVJZDogJ3R1aS10cmVlLW5vZGUtNScsXG4gICAgICogIHVzZUFqYXg6IHRydWVcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICByZXNldEFsbERhdGE6IGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdHJlZUFqYXggPSB0aGlzLmVuYWJsZWRGZWF0dXJlcy5BamF4O1xuICAgICAgICB2YXIgbm9kZUlkID0gb3B0aW9ucyA/IG9wdGlvbnMubm9kZUlkIDogdGhpcy5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIHZhciB1c2VBamF4ID0gb3B0aW9ucyA/IG9wdGlvbnMudXNlQWpheCA6ICEhdHJlZUFqYXg7XG4gICAgICAgIHZhciBuZXdDaGlsZElkcztcblxuICAgICAgICBpZiAodXNlQWpheCkge1xuICAgICAgICAgICAgdHJlZUFqYXgubG9hZERhdGEoYWpheENvbW1hbmQuUkVBRCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5fcmVzZXRBbGxEYXRhKHJlc3BvbnNlLCBub2RlSWQpO1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIG5vZGVJZDogbm9kZUlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld0NoaWxkSWRzID0gdGhpcy5fcmVzZXRBbGxEYXRhKGRhdGEsIG5vZGVJZCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3Q2hpbGRJZHM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IGFsbCBkYXRhIChDb3JlIG1ldGhvZClcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdyBkYXRhIGZvciBhbGwgbm9kZXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZCB0byByZXNldCBkYXRhXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Jlc2V0QWxsRGF0YTogZnVuY3Rpb24oZGF0YSwgbm9kZUlkKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZUFsbENoaWxkcmVuKG5vZGVJZCwge2lzU2lsZW50OiB0cnVlfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZChkYXRhLCBub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYWxsIGNoaWxkcmVuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zXG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgdGhlIG5vZGVcbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51c2VBamF4XSAtIFN0YXRlIG9mIHVzaW5nIEFqYXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUucmVtb3ZlQWxsQ2hpbGRyZW4obm9kZUlkKTsgLy8gUmVkcmF3cyB0aGUgbm9kZVxuICAgICAqIHRyZWUucmVtb3ZlQWxsQ2hpbGRyZW4obm9kSWQsIHRydWUpOyAvLyBEb2Vzbid0IHJlZHJhdyB0aGUgbm9kZVxuICAgICAqL1xuICAgIHJlbW92ZUFsbENoaWxkcmVuOiBmdW5jdGlvbihub2RlSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdHJlZUFqYXggPSB0aGlzLmVuYWJsZWRGZWF0dXJlcy5BamF4O1xuICAgICAgICB2YXIgdXNlQWpheCA9IG9wdGlvbnMgPyBvcHRpb25zLnVzZUFqYXggOiAhIXRyZWVBamF4O1xuICAgICAgICB2YXIgaXNTaWxlbnQgPSBvcHRpb25zID8gb3B0aW9ucy5pc1NpbGVudCA6IGZhbHNlO1xuXG4gICAgICAgIGlmICh1c2VBamF4KSB7XG4gICAgICAgICAgICB0cmVlQWpheC5sb2FkRGF0YShhamF4Q29tbWFuZC5ERUxFVEVfQUxMX0NISUxEUkVOLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdmVBbGxDaGlsZHJlbihub2RlSWQpO1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhcmVudElkOiBub2RlSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQWxsQ2hpbGRyZW4obm9kZUlkLCBpc1NpbGVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFsbCBjaGlsZHJlbiAoQ29yZSBtZXRob2QpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgdGhlIG5vZGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVBbGxDaGlsZHJlbjogZnVuY3Rpb24obm9kZUlkLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmdldENoaWxkSWRzKG5vZGVJZCk7XG5cbiAgICAgICAgc25pcHBldC5mb3JFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZElkKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmUoY2hpbGRJZCwgdHJ1ZSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2RyYXcobm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBub2RlIHdpdGggY2hpbGRyZW4uXG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zXG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51c2VBamF4XSAtIFN0YXRlIG9mIHVzaW5nIEFqYXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUucmVtb3ZlKG15Tm9kZUlkKTsgLy8gcmVtb3ZlIG5vZGUgd2l0aCByZWRyYXdpbmdcbiAgICAgKiB0cmVlLnJlbW92ZShteU5vZGVJZCwgdHJ1ZSk7IC8vIHJlbW92ZSBub2RlIHdpdGhvdXQgcmVkcmF3aW5nXG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdHJlZUFqYXggPSB0aGlzLmVuYWJsZWRGZWF0dXJlcy5BamF4O1xuICAgICAgICB2YXIgdXNlQWpheCA9IG9wdGlvbnMgPyBvcHRpb25zLnVzZUFqYXggOiAhIXRyZWVBamF4O1xuICAgICAgICB2YXIgaXNTaWxlbnQgPSBvcHRpb25zID8gb3B0aW9ucy5pc1NpbGVudCA6IGZhbHNlO1xuXG4gICAgICAgIGlmICh1c2VBamF4KSB7XG4gICAgICAgICAgICB0cmVlQWpheC5sb2FkRGF0YShhamF4Q29tbWFuZC5ERUxFVEUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3JlbW92ZShub2RlSWQpO1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIG5vZGVJZDogbm9kZUlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZShub2RlSWQsIGlzU2lsZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBub2RlIHdpdGggY2hpbGRyZW4uIChDb3JlIG1ldGhvZClcbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZCB0byByZW1vdmVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZTogZnVuY3Rpb24obm9kZUlkLCBpc1NpbGVudCkge1xuICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZShub2RlSWQsIGlzU2lsZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTW92ZSBhIG5vZGUgdG8gbmV3IHBhcmVudFxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBJbmRleCBudW1iZXIgb2Ygc2VsZWN0ZWQgbm9kZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zXG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqICAgICBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnVzZUFqYXhdIC0gU3RhdGUgb2YgdXNpbmcgQWpheFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5tb3ZlKG15Tm9kZUlkLCBuZXdQYXJlbnRJZCk7IC8vIG1vZGUgbm9kZSB3aXRoIHJlZHJhd2luZ1xuICAgICAqIHRyZWUubW92ZShteU5vZGVJZCwgbmV3UGFyZW50SWQsIHRydWUpOyAvLyBtb3ZlIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcbiAgICAgKi9cbiAgICBtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG5ld1BhcmVudElkLCBpbmRleCwgb3B0aW9ucykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0cmVlQWpheCA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzLkFqYXg7XG4gICAgICAgIHZhciB1c2VBamF4ID0gb3B0aW9ucyA/IG9wdGlvbnMudXNlQWpheCA6ICEhdHJlZUFqYXg7XG4gICAgICAgIHZhciBpc1NpbGVudCA9IG9wdGlvbnMgPyBvcHRpb25zLmlzU2lsZW50IDogZmFsc2U7XG5cbiAgICAgICAgaWYgKHVzZUFqYXgpIHtcbiAgICAgICAgICAgIHRyZWVBamF4LmxvYWREYXRhKGFqYXhDb21tYW5kLk1PVkUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmdldFBhcmVudElkKG5vZGVJZCkgIT09IG5ld1BhcmVudElkKSB7IC8vIGp1c3QgbW92ZSwgbm90IHNvcnQhXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0Tm9kZURhdGEobmV3UGFyZW50SWQsIHtyZWxvYWQ6IHRydWV9LCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5fbW92ZShub2RlSWQsIG5ld1BhcmVudElkLCBpbmRleCk7XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgbm9kZUlkOiBub2RlSWQsXG4gICAgICAgICAgICAgICAgbmV3UGFyZW50SWQ6IG5ld1BhcmVudElkLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9tb3ZlKG5vZGVJZCwgbmV3UGFyZW50SWQsIGluZGV4LCBpc1NpbGVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTW92ZSBhIG5vZGUgdG8gbmV3IHBhcmVudCAoQ29yZSBtZXRob2QpXG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gSW5kZXggbnVtYmVyIG9mIHNlbGVjdGVkIG5vZGVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIGluZGV4LCBpc1NpbGVudCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVNb3ZlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBDdXJyZW50IGRyYWdnaW5nIG5vZGUgaWRcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gTmV3IHBhcmVudCBpZFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdiZWZvcmVNb3ZlJywgZnVuY3Rpb24obm9kZUlkLCBwYXJlbnRJZCkge1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdkcmFnZ2luZyBub2RlOiAnICsgbm9kZUlkKTtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZygncGFyZW50IG5vZGU6ICcgKyBwYXJlbnRJZCk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgcmV0dXJuIGZhbHNlOyAvLyBDYW5jZWwgXCJtb3ZlXCIgZXZlbnRcbiAgICAgICAgICogICAgICAvLyByZXR1cm4gdHJ1ZTsgLy8gRmlyZSBcIm1vdmVcIiBldmVudFxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIGlmICghdGhpcy5pbnZva2UoJ2JlZm9yZU1vdmUnLCBub2RlSWQsIG5ld1BhcmVudElkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pc01vdmluZ05vZGUgPSB0cnVlO1xuICAgICAgICB0aGlzLm1vZGVsLm1vdmUobm9kZUlkLCBuZXdQYXJlbnRJZCwgaW5kZXgsIGlzU2lsZW50KTtcbiAgICAgICAgdGhpcy5pc01vdmluZ05vZGUgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIG5vZGUgaWRzIGJ5IHBhc3NpbmcgdGhlIHByZWRpY2F0ZSBjaGVjayBvciBtYXRjaGluZyBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fSBwcmVkaWNhdGUgLSBQcmVkaWNhdGUgb3IgZGF0YVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIHByZWRpY2F0ZVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIHNlYXJjaCBmcm9tIHByZWRpY2F0ZVxuICAgICAqIHZhciBsZWFmTm9kZUlkcyA9IHRyZWUuc2VhcmNoKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAqICAgICByZXR1cm4gbm9kZS5pc0xlYWYoKTtcbiAgICAgKiB9KTtcbiAgICAgKiBjb25zb2xlLmxvZyhsZWFmTm9kZUlkcyk7IC8vIFsndHVpLXRyZWUtbm9kZS0zJywgJ3R1aS10cmVlLW5vZGUtNSddXG4gICAgICpcbiAgICAgKiAvLyBzZWFyY2ggZnJvbSBkYXRhXG4gICAgICogdmFyIHNwZWNpYWxOb2RlSWRzID0gdHJlZS5zZWFyY2goe1xuICAgICAqICAgICBpc1NwZWNpYWw6IHRydWUsXG4gICAgICogICAgIGZvbzogJ2JhcidcbiAgICAgKiB9KTtcbiAgICAgKiBjb25zb2xlLmxvZyhzcGVjaWFsTm9kZUlkcyk7IC8vIFsndHVpLXRyZWUtbm9kZS01JywgJ3R1aS10cmVlLW5vZGUtMTAnXVxuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuZ2V0Tm9kZURhdGEoJ3R1aS10cmVlLW5vZGUtNScpLmlzU3BlY2lhbCk7IC8vIHRydWVcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmdldE5vZGVEYXRhKCd0dWktdHJlZS1ub2RlLTUnKS5mb28pOyAvLyAnYmFyJ1xuICAgICAqL1xuICAgIHNlYXJjaDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICAgIGlmICghc25pcHBldC5pc09iamVjdChwcmVkaWNhdGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc25pcHBldC5pc0Z1bmN0aW9uKHByZWRpY2F0ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maWx0ZXIocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl93aGVyZShwcmVkaWNhdGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2ggbm9kZSBpZHMgYnkgbWF0Y2hpbmcgZGF0YVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIERhdGFcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfd2hlcmU6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWx0ZXIoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YSA9IG5vZGUuZ2V0QWxsRGF0YSgpO1xuXG4gICAgICAgICAgICBzbmlwcGV0LmZvckVhY2gocHJvcHMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAoa2V5IGluIGRhdGEpICYmIChkYXRhW2tleV0gPT09IHZhbHVlKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlYXJjaCBub2RlIGlkcyBieSBwYXNzaW5nIHRoZSBwcmVkaWNhdGUgY2hlY2tcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgLSBQcmVkaWNhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBwcmVkaWNhdGVcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZmlsdGVyOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGZpbHRlcmVkID0gW107XG5cbiAgICAgICAgdGhpcy5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShub2RlLCBub2RlSWQpKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWQucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBjb250ZXh0KTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIG5vZGUgaXMgbGVhZlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIGlzIGxlYWYuXG4gICAgICovXG4gICAgaXNMZWFmOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKTtcblxuICAgICAgICByZXR1cm4gbm9kZSAmJiBub2RlLmlzTGVhZigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGEgbm9kZSBpcyBhIGFuY2VzdG9yIG9mIGFub3RoZXIgbm9kZS5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lck5vZGVJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBjb250YWluIHRoZSBvdGhlciBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lZE5vZGVJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBiZSBjb250YWluZWQgYnkgdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciBhIG5vZGUgY29udGFpbnMgYW5vdGhlciBub2RlXG4gICAgICovXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGNvbnRhaW5lck5vZGVJZCwgY29udGFpbmVkTm9kZUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmNvbnRhaW5zKGNvbnRhaW5lZE5vZGVJZCwgY29udGFpbmVkTm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW5hYmxlIGZhY2lsaXR5IG9mIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVOYW1lIC0gJ1NlbGVjdGFibGUnLCAnRHJhZ2dhYmxlJywgJ0VkaXRhYmxlJywgJ0NvbnRleHRNZW51J1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBGZWF0dXJlIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7VHJlZX0gdGhpc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScsIHtcbiAgICAgKiAgICAgIHNlbGVjdGVkQ2xhc3NOYW1lOiAndHVpLXRyZWUtc2VsZWN0ZWQnXG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdFZGl0YWJsZScsIHtcbiAgICAgKiAgICAgIGVuYWJsZUNsYXNzTmFtZTogdHJlZS5jbGFzc05hbWVzLnRleHRDbGFzcyxcbiAgICAgKiAgICAgIGRhdGFLZXk6ICd0ZXh0JyxcbiAgICAgKiAgICAgIGRlZmF1bHRWYWx1ZTogJ25ldyBub2RlJyxcbiAgICAgKiAgICAgIGlucHV0Q2xhc3NOYW1lOiAnbXlJbnB1dCdcbiAgICAgKiAgfSlcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0RyYWdnYWJsZScsIHtcbiAgICAgKiAgICAgIHVzZUhlbHBlcjogdHJ1ZSxcbiAgICAgKiAgICAgIGhlbHBlclBvczoge3g6IDUsIHk6IDJ9LFxuICAgICAqICAgICAgcmVqZWN0ZWRUYWdOYW1lczogWydVTCcsICdJTlBVVCcsICdCVVRUT04nXSxcbiAgICAgKiAgICAgIHJlamVjdGVkQ2xhc3NOYW1lczogWydub3REcmFnZ2FibGUnLCAnbm90RHJhZ2dhYmxlLTInXSxcbiAgICAgKiAgICAgIGF1dG9PcGVuRGVsYXk6IDE1MDAsXG4gICAgICogICAgICBpc1NvcnRhYmxlOiB0cnVlLFxuICAgICAqICAgICAgaG92ZXJDbGFzc05hbWU6ICd0dWktdHJlZS1ob3ZlcidcbiAgICAgKiAgICAgIGxpbmVDbGFzc05hbWU6ICd0dWktdHJlZS1saW5lJyxcbiAgICAgKiAgICAgIGxpbmVCb3VuZGFyeToge1xuICAgICAqICAgICAgXHR0b3A6IDEwLFxuICAgICAqICAgICAgIFx0Ym90dG9tOiAxMFxuICAgICAqICAgICAgfVxuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnQ2hlY2tib3gnLCB7XG4gICAgICogICAgICBjaGVja2JveENsYXNzTmFtZTogJ3R1aS10cmVlLWNoZWNrYm94J1xuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnQ29udGV4dE1lbnUnLCB7XG4gICAgICogIFx0bWVudURhdGE6IFtcbiAgICAgKiAgIFx0XHR7dGl0bGU6ICdtZW51MScsIGNvbW1hbmQ6ICdjb3B5J30sXG4gICAgICogICAgIFx0XHR7dGl0bGU6ICdtZW51MicsIGNvbW1hbmQ6ICdwYXN0ZSd9LFxuICAgICAqICAgICAgIFx0e3NlcGFyYXRvcjogdHJ1ZX0sXG4gICAgICogICAgICAgIFx0e1xuICAgICAqICAgICAgICAgXHRcdHRpdGxlOiAnbWVudTMnLFxuICAgICAqICAgICAgICAgICBcdG1lbnU6IFtcbiAgICAgKiAgICAgICAgICAgIFx0XHR7dGl0bGU6ICdzdWJtZW51MSd9LFxuICAgICAqICAgICAgICAgICAgICBcdHt0aXRsZTogJ3N1Ym1lbnUyJ31cbiAgICAgKiAgICAgICAgICAgICAgXVxuICAgICAqICAgICAgICAgIH1cbiAgICAgKiAgICAgIH1cbiAgICAgKiAgfSlcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0FqYXgnLCB7XG4gICAgICogICAgICBjb21tYW5kOiB7XG4gICAgICogICAgICAgICAgcmVhZDoge1xuICAgICAqICAgICAgICAgICAgICB1cmw6ICdhcGkvcmVhZCcsXG4gICAgICogICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICogICAgICAgICAgICAgIHR5cGU6ICdnZXQnXG4gICAgICogICAgICAgICAgfSxcbiAgICAgKiAgICAgICAgICBjcmVhdGU6IHtcbiAgICAgKiAgICAgICAgICAgICAgdXJsOiAnYXBpL2NyZWF0ZScsXG4gICAgICogICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICogICAgICAgICAgICAgIHR5cGU6ICdwb3N0J1xuICAgICAqICAgICAgICAgIH0sXG4gICAgICogICAgICAgICAgdXBkYXRlOiB7XG4gICAgICogICAgICAgICAgICAgIHVybDogJ2FwaS91cGRhdGUnLFxuICAgICAqICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAqICAgICAgICAgICAgICB0eXBlOiAncG9zdCcsXG4gICAgICogICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgKiAgICAgICAgICAgICAgICAgIHBhcmFtQTogJ2EnLFxuICAgICAqICAgICAgICAgICAgICAgICAgcGFyYW1COiAnYidcbiAgICAgKiAgICAgICAgICAgICAgfVxuICAgICAqICAgICAgICAgIH0sXG4gICAgICogICAgICAgICAgcmVtb3ZlOiB7XG4gICAgICogICAgICAgICAgICAgIHVybDogJ2FwaS9yZW1vdmUnLFxuICAgICAqICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAqICAgICAgICAgICAgICB0eXBlOiAncG9zdCcsXG4gICAgICogICAgICAgICAgICAgIGRhdGE6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAqICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICBwYXJhbUE6IHBhcmFtcy5hLFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgIHBhcmFtQjogcGFyYW1zLmJcbiAgICAgKiAgICAgICAgICAgICAgICAgIH07XG4gICAgICogICAgICAgICAgICAgIH1cbiAgICAgKiAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgIHJlbW92ZUFsbENoaWxkcmVuOiB7XG4gICAgICogICAgICAgICAgICAgIHVybDogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICogICAgICAgICAgICAgICAgICByZXR1cm4gJ2FwaS9yZW1vdmVfYWxsLycgKyBwYXJhbXMubm9kZUlkLFxuICAgICAqICAgICAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAqICAgICAgICAgICAgICB0eXBlOiAncG9zdCdcbiAgICAgKiAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgIG1vdmU6IHtcbiAgICAgKiAgICAgICAgICAgICAgdXJsOiAnYXBpL21vdmUnLFxuICAgICAqICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAqICAgICAgICAgICAgICB0eXBlOiAncG9zdCdcbiAgICAgKiAgICAgICAgICB9XG4gICAgICogICAgICB9LFxuICAgICAqICAgICAgcGFyc2VEYXRhOiBmdW5jdGlvbih0eXBlLCByZXNwb25zZSkge1xuICAgICAqICAgICAgICAgIGlmICh0eXBlID09PSAncmVhZCcgJiYgcmVzcG9uc2UuY29kZSA9PT0gJzIwMCcpIHtcbiAgICAgKiAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAqICAgICAgICAgIH0gZWxzZSB7XG4gICAgICogICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgKiAgICAgICAgICB9XG4gICAgICogICAgICB9XG4gICAgICogIH0pO1xuICAgICAqL1xuICAgIGVuYWJsZUZlYXR1cmU6IGZ1bmN0aW9uKGZlYXR1cmVOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBGZWF0dXJlID0gZmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xuICAgICAgICB0aGlzLmRpc2FibGVGZWF0dXJlKGZlYXR1cmVOYW1lKTtcbiAgICAgICAgaWYgKEZlYXR1cmUpIHtcbiAgICAgICAgICAgIHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXSA9IG5ldyBGZWF0dXJlKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5maXJlKCdpbml0RmVhdHVyZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgZmFjaWxpdHkgb2YgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnLCAnRWRpdGFibGUnXG4gICAgICogQHJldHVybnMge1RyZWV9IHRoaXNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWVcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdEcmFnZ2FibGUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJylcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdDaGVja2JveCcpXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnQ29udGV4dE1lbnUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0FqYXgnKTtcbiAgICAgKi9cbiAgICBkaXNhYmxlRmVhdHVyZTogZnVuY3Rpb24oZmVhdHVyZU5hbWUpIHtcbiAgICAgICAgdmFyIGZlYXR1cmUgPSB0aGlzLmVuYWJsZWRGZWF0dXJlc1tmZWF0dXJlTmFtZV07XG5cbiAgICAgICAgaWYgKGZlYXR1cmUpIHtcbiAgICAgICAgICAgIGZlYXR1cmUuZGVzdHJveSgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaW5kZXggbnVtYmVyIG9mIHNlbGVjdGVkIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIElkIG9mIHNlbGVjdGVkIG5vZGVcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBJbmRleCBudW1iZXIgb2YgYXR0YWNoZWQgbm9kZVxuICAgICAqL1xuICAgIGdldE5vZGVJbmRleDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHRoaXMubW9kZWwuZ2V0UGFyZW50SWQobm9kZUlkKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXROb2RlKHBhcmVudElkKS5nZXRDaGlsZEluZGV4KG5vZGVJZCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogU2V0IGFic3RyYWN0IGFwaXMgdG8gdHJlZSBwcm90b3R5cGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtIEZlYXR1cmUgbmFtZVxuICogQHBhcmFtIHtvYmplY3R9IGZlYXR1cmUgLSBGZWF0dXJlXG4gKiBAaWdub3JlXG4gKi9cbmZ1bmN0aW9uIHNldEFic3RyYWN0QVBJcyhmZWF0dXJlTmFtZSwgZmVhdHVyZSkge1xuICAgIHZhciBtZXNzYWdlTmFtZSA9ICdJTlZBTElEX0FQSV8nICsgZmVhdHVyZU5hbWUudG9VcHBlckNhc2UoKSxcbiAgICAgICAgYXBpTGlzdCA9IGZlYXR1cmUuZ2V0QVBJTGlzdCA/IGZlYXR1cmUuZ2V0QVBJTGlzdCgpIDogW107XG5cbiAgICBzbmlwcGV0LmZvckVhY2goYXBpTGlzdCwgZnVuY3Rpb24oYXBpKSB7XG4gICAgICAgIFRyZWUucHJvdG90eXBlW2FwaV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlc1ttZXNzYWdlTmFtZV0gfHwgbWVzc2FnZXMuSU5WQUxJRF9BUEkpO1xuICAgICAgICB9O1xuICAgIH0pO1xufVxuc25pcHBldC5mb3JFYWNoKGZlYXR1cmVzLCBmdW5jdGlvbihGZWF0dXJlLCBuYW1lKSB7XG4gICAgc2V0QWJzdHJhY3RBUElzKG5hbWUsIEZlYXR1cmUpO1xufSk7XG5zbmlwcGV0LkN1c3RvbUV2ZW50cy5taXhpbihUcmVlKTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBVcGRhdGUgdmlldyBhbmQgY29udHJvbCB0cmVlIGRhdGFcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IExhYiA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBUcmVlTm9kZSA9IHJlcXVpcmUoJy4vdHJlZU5vZGUnKTtcblxudmFyIGV4dGVuZCA9IHR1aS51dGlsLmV4dGVuZCxcbiAgICBrZXlzID0gdHVpLnV0aWwua2V5cyxcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaCxcbiAgICBtYXAgPSB0dWkudXRpbC5tYXA7XG5cbi8qKlxuICogVHJlZSBtb2RlbFxuICogQGNsYXNzIFRyZWVNb2RlbFxuICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIERhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9ucyBmb3IgZGVmYXVsdFN0YXRlIGFuZCBub2RlSWRQcmVmaXhcbiAqIEBpZ25vcmVcbiAqKi9cbnZhciBUcmVlTW9kZWwgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVNb2RlbC5wcm90b3R5cGUgKi97IC8qIGVzbGludC1kaXNhYmxlICovXG4gICAgaW5pdDogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIFRyZWVOb2RlLnNldElkUHJlZml4KG9wdGlvbnMubm9kZUlkUHJlZml4KTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCBzdGF0ZSBvZiBub2RlXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm5vZGVEZWZhdWx0U3RhdGUgPSBvcHRpb25zLm5vZGVEZWZhdWx0U3RhdGU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJvb3Qgbm9kZVxuICAgICAgICAgKiBAdHlwZSB7VHJlZU5vZGV9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvb3ROb2RlID0gbmV3IFRyZWVOb2RlKHtcbiAgICAgICAgICAgIHN0YXRlOiAnb3BlbmVkJ1xuICAgICAgICB9LCBudWxsKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJlZSBoYXNoIGhhdmluZyBhbGwgbm9kZXNcbiAgICAgICAgICogQHR5cGUge29iamVjdC48c3RyaW5nLCBUcmVlTm9kZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWVIYXNoID0ge307XG5cbiAgICAgICAgdGhpcy5fc2V0RGF0YShkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHByZWZpeCBvZiBub2RlIGlkXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUHJlZml4XG4gICAgICovXG4gICAgZ2V0Tm9kZUlkUHJlZml4OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFRyZWVOb2RlLmlkUHJlZml4O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbW9kZWwgd2l0aCB0cmVlIGRhdGFcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXG4gICAgICovXG4gICAgX3NldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLnJvb3ROb2RlLFxuICAgICAgICAgICAgcm9vdElkID0gcm9vdC5nZXRJZCgpO1xuXG4gICAgICAgIHRoaXMudHJlZUhhc2hbcm9vdElkXSA9IHJvb3Q7XG4gICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCByb290KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSB0cmVlIGhhc2ggZnJvbSBkYXRhIGFuZCBwYXJlbnROb2RlXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSAtIFRyZWUgZGF0YVxuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IHBhcmVudCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VUcmVlSGFzaDogZnVuY3Rpb24oZGF0YSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHBhcmVudC5nZXRJZCgpLFxuICAgICAgICAgICAgaWRzID0gW107XG5cbiAgICAgICAgZm9yRWFjaChkYXRhLCBmdW5jdGlvbihkYXR1bSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuRGF0YSA9IGRhdHVtLmNoaWxkcmVuLFxuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9jcmVhdGVOb2RlKGRhdHVtLCBwYXJlbnRJZCksXG4gICAgICAgICAgICAgICAgbm9kZUlkID0gbm9kZS5nZXRJZCgpO1xuXG4gICAgICAgICAgICBpZHMucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgdGhpcy50cmVlSGFzaFtub2RlSWRdID0gbm9kZTtcbiAgICAgICAgICAgIHBhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgICAgICB0aGlzLl9tYWtlVHJlZUhhc2goY2hpbGRyZW5EYXRhLCBub2RlKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGlkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5vZGVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZURhdGEgLSBEYXR1bSBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IGlkXG4gICAgICogQHJldHVybnMge1RyZWVOb2RlfSBUcmVlTm9kZVxuICAgICAqL1xuICAgIF9jcmVhdGVOb2RlOiBmdW5jdGlvbihub2RlRGF0YSwgcGFyZW50SWQpIHtcbiAgICAgICAgbm9kZURhdGEgPSBleHRlbmQoe1xuICAgICAgICAgICAgc3RhdGU6IHRoaXMubm9kZURlZmF1bHRTdGF0ZVxuICAgICAgICB9LCBub2RlRGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBUcmVlTm9kZShub2RlRGF0YSwgcGFyZW50SWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hpbGRyZW5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/QXJyYXkuPFRyZWVOb2RlPn0gY2hpbGRyZW5cbiAgICAgKi9cbiAgICBnZXRDaGlsZHJlbjogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcblxuICAgICAgICBpZiAoIWNoaWxkSWRzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXAoY2hpbGRJZHMsIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE5vZGUoY2hpbGRJZCk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hpbGQgaWRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P0FycmF5LjxzdHJpbmc+fSBDaGlsZCBpZHNcbiAgICAgKi9cbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlLmdldENoaWxkSWRzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbnVtYmVyIG9mIG5vZGVzXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIG51bWJlciBvZiBub2Rlc1xuICAgICAqL1xuICAgIGdldENvdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGtleXModGhpcy50cmVlSGFzaCkubGVuZ3RoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbGFzdCBkZXB0aFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBsYXN0IGRlcHRoXG4gICAgICovXG4gICAgZ2V0TGFzdERlcHRoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRlcHRocyA9IG1hcCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXREZXB0aChub2RlLmdldElkKCkpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgZGVwdGhzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJucyB7P1RyZWVOb2RlfSBOb2RlXG4gICAgICovXG4gICAgZ2V0Tm9kZTogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJlZUhhc2hbaWRdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGVwdGggZnJvbSBub2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQSBub2RlIGlkIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJucyB7P251bWJlcn0gRGVwdGhcbiAgICAgKi9cbiAgICBnZXREZXB0aDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxuICAgICAgICAgICAgZGVwdGggPSAwLFxuICAgICAgICAgICAgcGFyZW50O1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgZGVwdGggKz0gMTtcbiAgICAgICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShwYXJlbnQuZ2V0UGFyZW50SWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVwdGg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBwYXJlbnQgaWQgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7P3N0cmluZ30gUGFyZW50IGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0UGFyZW50SWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgbm9kZSB3aXRoIGNoaWxkcmVuLlxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZCB0byByZW1vdmVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihpZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpLFxuICAgICAgICAgICAgcGFyZW50O1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKG5vZGUuZ2V0UGFyZW50SWQoKSk7XG5cbiAgICAgICAgZm9yRWFjaChub2RlLmdldENoaWxkSWRzKCksIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNoaWxkSWQsIHRydWUpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGRJZChpZCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnRyZWVIYXNoW2lkXTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIHBhcmVudC5nZXRJZCgpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgbm9kZShzKS5cbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cbiAgICAgKiAtIFRoZSB1cGRhdGUgZXZlbnQgd2lsbCBiZSBmaXJlZCB3aXRoIHBhcmVudCBub2RlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3LWRhdGFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBOZXcgYWRkZWQgbm9kZSBpZHNcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5nZXROb2RlKHBhcmVudElkKSB8fCB0aGlzLnJvb3ROb2RlLFxuICAgICAgICAgICAgaWRzO1xuXG4gICAgICAgIGRhdGEgPSBbXS5jb25jYXQoZGF0YSk7XG4gICAgICAgIGlkcyA9IHRoaXMuX21ha2VUcmVlSGFzaChkYXRhLCBwYXJlbnQpO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgcGFyZW50LmdldElkKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHByb3BzIC0gUHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICBzZXROb2RlRGF0YTogZnVuY3Rpb24oaWQsIHByb3BzLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8ICFwcm9wcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5zZXREYXRhKHByb3BzKTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgbm9kZSBkYXRhXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fSBuYW1lcyAtIE5hbWVzIG9mIHByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgcmVtb3ZlTm9kZURhdGE6IGZ1bmN0aW9uKGlkLCBuYW1lcywgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xuXG4gICAgICAgIGlmICghbm9kZSB8fCAhbmFtZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0dWkudXRpbC5pc0FycmF5KG5hbWVzKSkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhLmFwcGx5KG5vZGUsIG5hbWVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRGF0YShuYW1lcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGEgbm9kZSB0byBuZXcgcGFyZW50J3MgY2hpbGRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4XSAtIFN0YXJ0IGluZGV4IG51bWJlciBmb3IgaW5zZXJ0aW5nXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqL1xuICAgIC8qZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSovXG4gICAgbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCwgaW5kZXgsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG4gICAgICAgIHZhciBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBuZXdQYXJlbnQgPSB0aGlzLmdldE5vZGUobmV3UGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGU7XG4gICAgICAgIG5ld1BhcmVudElkID0gbmV3UGFyZW50LmdldElkKCk7XG4gICAgICAgIG9yaWdpbmFsUGFyZW50SWQgPSBub2RlLmdldFBhcmVudElkKCk7XG4gICAgICAgIGluZGV4ID0gdHVpLnV0aWwuaXNVbmRlZmluZWQoaW5kZXgpID8gLTEgOiBpbmRleDtcblxuICAgICAgICBpZiAobm9kZUlkID09PSBuZXdQYXJlbnRJZCB8fCB0aGlzLmNvbnRhaW5zKG5vZGVJZCwgbmV3UGFyZW50SWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jaGFuZ2VPcmRlck9mSWRzKG5vZGVJZCwgbmV3UGFyZW50SWQsIG9yaWdpbmFsUGFyZW50SWQsIGluZGV4KTtcblxuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ21vdmUnLCBub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkLCBpbmRleCk7XG4gICAgICAgIH1cbiAgICB9LCAvKmVzbGludC1lbmFibGUgY29tcGxleGl0eSovXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2Ugb3JkZXIgb2YgaWRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9yaWdpbmFsUGFyZW50SWQgLSBPcmlnaW5hbCBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBNb3ZpbmcgaW5kZXggKFdoZW4gY2hpbGQgbm9kZSBpcyBtb3ZlZCBvbiBwYXJlbnQgbm9kZSwgdGhlIHZhbHVlIGlzIC0xKVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NoYW5nZU9yZGVyT2ZJZHM6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIG9yaWdpbmFsUGFyZW50SWQsIGluZGV4KSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG4gICAgICAgIHZhciBuZXdQYXJlbnQgPSB0aGlzLmdldE5vZGUobmV3UGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGU7XG4gICAgICAgIHZhciBvcmlnaW5hbFBhcmVudCA9IHRoaXMuZ2V0Tm9kZShvcmlnaW5hbFBhcmVudElkKTtcbiAgICAgICAgdmFyIGlzU2FtZVBhcmVudElkcyA9IChuZXdQYXJlbnRJZCA9PT0gb3JpZ2luYWxQYXJlbnRJZCk7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKGlzU2FtZVBhcmVudElkcykge1xuICAgICAgICAgICAgICAgIG5ld1BhcmVudC5tb3ZlQ2hpbGRJZChub2RlSWQsIGluZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV3UGFyZW50Lmluc2VydENoaWxkSWQobm9kZUlkLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgb3JpZ2luYWxQYXJlbnQucmVtb3ZlQ2hpbGRJZChub2RlSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFpc1NhbWVQYXJlbnRJZHMpIHtcbiAgICAgICAgICAgIG5ld1BhcmVudC5hZGRDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgICAgICBvcmlnaW5hbFBhcmVudC5yZW1vdmVDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLnNldFBhcmVudElkKG5ld1BhcmVudElkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBhIG5vZGUgaXMgYSBhbmNlc3RvciBvZiBhbm90aGVyIG5vZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGNvbnRhaW4gdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVkSWQgLSBJZCBvZiBhIG5vZGUgdGhhdCBtYXkgYmUgY29udGFpbmVkIGJ5IHRoZSBvdGhlciBub2RlXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgYSBub2RlIGNvbnRhaW5zIGFub3RoZXIgbm9kZVxuICAgICAqL1xuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihjb250YWluZXJJZCwgY29udGFpbmVkSWQpIHtcbiAgICAgICAgdmFyIHBhcmVudElkID0gdGhpcy5nZXRQYXJlbnRJZChjb250YWluZWRJZCksXG4gICAgICAgICAgICBpc0NvbnRhaW5lZCA9IGZhbHNlO1xuXG4gICAgICAgIHdoaWxlICghaXNDb250YWluZWQgJiYgcGFyZW50SWQpIHtcbiAgICAgICAgICAgIGlzQ29udGFpbmVkID0gKGNvbnRhaW5lcklkID09PSBwYXJlbnRJZCk7XG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRoaXMuZ2V0UGFyZW50SWQocGFyZW50SWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlzQ29udGFpbmVkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTb3J0IG5vZGVzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciAtIENvbXBhcmF0b3IgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICAgIHRoaXMuZWFjaEFsbChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZ2V0Q2hpbGRyZW4obm9kZUlkKSxcbiAgICAgICAgICAgICAgICBjaGlsZElkcztcblxuICAgICAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbi5zb3J0KGNvbXBhcmF0b3IpO1xuXG4gICAgICAgICAgICAgICAgY2hpbGRJZHMgPSBtYXAoY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZC5nZXRJZCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG5vZGUucmVwbGFjZUNoaWxkSWRzKGNoaWxkSWRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIGRhdGEgKGFsbClcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/b2JqZWN0fSBOb2RlIGRhdGFcbiAgICAgKi9cbiAgICBnZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlLmdldEFsbERhdGEoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBub2Rlcy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKi9cbiAgICBlYWNoQWxsOiBmdW5jdGlvbihpdGVyYXRlZSwgY29udGV4dCkge1xuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xuXG4gICAgICAgIGZvckVhY2godGhpcy50cmVlSGFzaCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpdGVyYXRlZS5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhpcyB0cmVlIGl0ZXJhdGluZyBvdmVyIGFsbCBkZXNjZW5kYW50cyBvZiBhIG5vZGUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKi9cbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpIHsgLy9kZXB0aC1maXJzdFxuICAgICAgICB2YXIgc3RhY2ssIG5vZGVJZCwgbm9kZTtcblxuICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKHBhcmVudElkKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2sgPSBub2RlLmdldENoaWxkSWRzKCk7XG5cbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgbm9kZUlkID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5nZXROb2RlKG5vZGVJZCk7XG4gICAgICAgICAgICBpdGVyYXRlZS5jYWxsKGNvbnRleHQsIG5vZGUsIG5vZGVJZCk7XG5cbiAgICAgICAgICAgIHN0YWNrID0gc3RhY2suY29uY2F0KG5vZGUuZ2V0Q2hpbGRJZHMoKSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWVNb2RlbCk7XG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVNb2RlbDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN0YXRlcyA9IHJlcXVpcmUoJy4vY29uc3RzL3N0YXRlcycpLm5vZGUsXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgbGFzdEluZGV4ID0gMCxcbiAgICBnZXROZXh0SW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGFzdEluZGV4O1xuICAgICAgICBsYXN0SW5kZXggKz0gMTtcblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfSxcbiAgICBSRVNFUlZFRF9QUk9QRVJUSUVTID0ge1xuICAgICAgICBpZDogJycsXG4gICAgICAgIHN0YXRlOiAnc2V0U3RhdGUnLFxuICAgICAgICBjaGlsZHJlbjogJydcbiAgICB9LFxuICAgIGluQXJyYXkgPSB0dWkudXRpbC5pbkFycmF5O1xuXG4vKipcbiAqIFRyZWVOb2RlXG4gKiBAQ2xhc3MgVHJlZU5vZGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBub2RlRGF0YSAtIE5vZGUgZGF0YVxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnRJZF0gLSBQYXJlbnQgbm9kZSBpZFxuICogQGlnbm9yZVxuICovXG52YXIgVHJlZU5vZGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVOb2RlLnByb3RvdHlwZSAqL3sgLyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgcHJlZml4IG9mIGlkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBQcmVmaXggb2YgaWRcbiAgICAgICAgICovXG4gICAgICAgIHNldElkUHJlZml4OiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgICAgIHRoaXMuaWRQcmVmaXggPSBwcmVmaXggfHwgdGhpcy5pZFByZWZpeDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJlZml4IG9mIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZFByZWZpeDogJydcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faWQgPSB0aGlzLmNvbnN0cnVjdG9yLmlkUHJlZml4ICsgZ2V0TmV4dEluZGV4KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhcmVudCBub2RlIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2NoaWxkSWRzID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIHN0YXRlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG5cbiAgICAgICAgdGhpcy5zZXREYXRhKG5vZGVEYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJlc2VydmVkIHByb3BlcnRpZXMgZnJvbSBkYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBOb2RlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBOb2RlIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSZXNlcnZlZFByb3BlcnRpZXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaE93blByb3BlcnRpZXMoUkVTRVJWRURfUFJPUEVSVElFUywgZnVuY3Rpb24oc2V0dGVyLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW25hbWVdO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tzZXR0ZXJdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqL1xuICAgIHRvZ2dsZVN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlID09PSBzdGF0ZXMuQ0xPU0VEKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5PUEVORUQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlcy5DTE9TRUQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSAtIFN0YXRlIG9mIG5vZGUgKCdjbG9zZWQnLCAnb3BlbmVkJylcbiAgICAgKi9cbiAgICBzZXRTdGF0ZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgc3RhdGUgPSBTdHJpbmcoc3RhdGUpO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlc1tzdGF0ZS50b1VwcGVyQ2FzZSgpXSB8fCB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHN0YXRlXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHN0YXRlICgnb3BlbmVkJyBvciAnY2xvc2VkJylcbiAgICAgKi9cbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IE5vZGUgaWRcbiAgICAgKi9cbiAgICBnZXRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHBhcmVudCBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFBhcmVudElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKi9cbiAgICBzZXRQYXJlbnRJZDogZnVuY3Rpb24ocGFyZW50SWQpIHtcbiAgICAgICAgdGhpcy5fcGFyZW50SWQgPSBwYXJlbnRJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVwbGFjZSBjaGlsZElkc1xuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGNoaWxkSWRzIC0gSWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqL1xuICAgIHJlcGxhY2VDaGlsZElkczogZnVuY3Rpb24oY2hpbGRJZHMpIHtcbiAgICAgICAgdGhpcy5fY2hpbGRJZHMgPSBjaGlsZElkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGlkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge0FycmF5LjxudW1iZXI+fSBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICovXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRJZHMuc2xpY2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqL1xuICAgIGFkZENoaWxkSWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuX2NoaWxkSWRzO1xuXG4gICAgICAgIGlmICh0dWkudXRpbC5pbkFycmF5KGNoaWxkSWRzLCBpZCkgPT09IC0xKSB7XG4gICAgICAgICAgICBjaGlsZElkcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICovXG4gICAgcmVtb3ZlQ2hpbGRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVJdGVtRnJvbUFycmF5KGlkLCB0aGlzLl9jaGlsZElkcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gUHJvcGVydHkgbmFtZSBvZiBkYXRhXG4gICAgICogQHJldHVybnMgeyp9IERhdGFcbiAgICAgKi9cbiAgICBnZXREYXRhOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge09iamVjdH0gRGF0YVxuICAgICAqL1xuICAgIGdldEFsbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuZXh0ZW5kKHt9LCB0aGlzLl9kYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBEYXRhIGZvciBhZGRpbmdcbiAgICAgKi9cbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGRhdGEgPSB0aGlzLl9zZXRSZXNlcnZlZFByb3BlcnRpZXMoZGF0YSk7XG4gICAgICAgIHR1aS51dGlsLmV4dGVuZCh0aGlzLl9kYXRhLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHsuLi5zdHJpbmd9IG5hbWVzIC0gTmFtZXMgb2YgZGF0YVxuICAgICAqL1xuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoQXJyYXkoYXJndW1lbnRzLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZGF0YVtuYW1lXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoaXMgbm9kZSBoYXMgYSBwcm92aWRlZCBjaGlsZCBpZC5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqL1xuICAgIGhhc0NoaWxkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gaW5BcnJheShpZCwgdGhpcy5fY2hpbGRJZHMpICE9PSAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBub2RlIGlzIGxlYWYuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIGxlYWYgb3Igbm90LlxuICAgICAqL1xuICAgIGlzTGVhZjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5fY2hpbGRJZHMubGVuZ3RoICYmICF0aGlzLmdldERhdGEoJ2hhc0NoaWxkJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB3aGV0aGVyIHRoaXMgbm9kZSBpcyByb290LlxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gTm9kZSBpcyByb290IG9yIG5vdC5cbiAgICAgKi9cbiAgICBpc1Jvb3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuaXNGYWxzeSh0aGlzLl9wYXJlbnRJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpbmRleCBvZiBjaGlsZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge251bWJlcn0gSW5kZXggb2YgY2hpbGQgaW4gY2hpbGRyZW4gbGlzdFxuICAgICAqL1xuICAgIGdldENoaWxkSW5kZXg6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiBpbkFycmF5KGlkLCB0aGlzLl9jaGlsZElkcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluc2VydCBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBJbmRleCBudW1iZXIgb2YgaW5zZXJ0IHBvc2l0aW9uXG4gICAgICovXG4gICAgaW5zZXJ0Q2hpbGRJZDogZnVuY3Rpb24oaWQsIGluZGV4KSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuX2NoaWxkSWRzO1xuXG4gICAgICAgIGlmIChpbkFycmF5KGlkLCBjaGlsZElkcykgPT09IC0xKSB7XG4gICAgICAgICAgICBjaGlsZElkcy5zcGxpY2UoaW5kZXgsIDAsIGlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIEluZGV4IG51bWJlciBvZiBpbnNlcnQgcG9zaXRpb25cbiAgICAgKi9cbiAgICBtb3ZlQ2hpbGRJZDogZnVuY3Rpb24oaWQsIGluZGV4KSB7XG4gICAgICAgIHZhciBjaGlsZElkcyA9IHRoaXMuX2NoaWxkSWRzO1xuICAgICAgICB2YXIgb3JpZ2luSWR4ID0gdGhpcy5nZXRDaGlsZEluZGV4KGlkKTtcblxuICAgICAgICBpZiAoaW5BcnJheShpZCwgY2hpbGRJZHMpICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKG9yaWdpbklkeCA8IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaW5kZXggLT0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2hpbGRJZHMuc3BsaWNlKGluZGV4LCAwLCBjaGlsZElkcy5zcGxpY2Uob3JpZ2luSWR4LCAxKVswXSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU5vZGU7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgTGFiIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBpc1VuZGVmaW5lZCA9IHR1aS51dGlsLmlzVW5kZWZpbmVkLFxuICAgIHBpY2sgPSB0dWkudXRpbC5waWNrLFxuICAgIHRlbXBsYXRlTWFza1JlID0gL1xce1xceyguKz8pfX0vZ2ksXG4gICAgaXNWYWxpZERvdE5vdGF0aW9uUmUgPSAvXlxcdysoPzpcXC5cXHcrKSokLyxcbiAgICBpc1ZhbGlkRG90Tm90YXRpb24gPSBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgcmV0dXJuIGlzVmFsaWREb3ROb3RhdGlvblJlLnRlc3Qoc3RyKTtcbiAgICB9LFxuICAgIGlzQXJyYXkgPSB0dWkudXRpbC5pc0FycmF5U2FmZSxcbiAgICBpc1N1cHBvcnRQYWdlT2Zmc2V0ID0gdHlwZW9mIHdpbmRvdy5wYWdlWE9mZnNldCAhPT0gJ3VuZGVmaW5lZCcsXG4gICAgaXNDU1MxQ29tcGF0ID0gZG9jdW1lbnQuY29tcGF0TW9kZSA9PT0gJ0NTUzFDb21wYXQnO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xudmFyIHV0aWwgPSB7XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpcnN0IHNwZWNpZmllZCBpdGVtIGZyb20gYXJyYXksIGlmIGl0IGV4aXN0c1xuICAgICAqIEBwYXJhbSB7Kn0gaXRlbSBJdGVtIHRvIGxvb2sgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyIEFycmF5IHRvIHF1ZXJ5XG4gICAgICovXG4gICAgcmVtb3ZlSXRlbUZyb21BcnJheTogZnVuY3Rpb24oaXRlbSwgYXJyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGFyci5sZW5ndGggLSAxO1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBpZiAoaXRlbSA9PT0gYXJyW2luZGV4XSkge1xuICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXggLT0gMTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2xhc3NuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSAtIENsYXNzbmFtZVxuICAgICAqL1xuICAgIGFkZENsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC5jbGFzc05hbWUgPT09ICcnKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICghdXRpbC5oYXNDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSArPSAnICcgKyBjbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNsYXNzbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBDbGFzc25hbWVcbiAgICAgKi9cbiAgICByZW1vdmVDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBvcmlnaW5hbENsYXNzTmFtZSA9IHV0aWwuZ2V0Q2xhc3MoZWxlbWVudCksXG4gICAgICAgICAgICBhcnIsIGluZGV4O1xuXG4gICAgICAgIGlmICghb3JpZ2luYWxDbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyciA9IG9yaWdpbmFsQ2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgICAgIGluZGV4ID0gdHVpLnV0aWwuaW5BcnJheShjbGFzc05hbWUsIGFycik7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBhcnIuam9pbignICcpO1xuICAgICAgICB9XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHRvIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSBBIG5hbWUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYWRkXG4gICAgICovXG4gICAgYWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGZyb20gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIEEgbmFtZSBvZiBldmVudFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZW1vdmVcbiAgICAgKi9cbiAgICByZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5kZXRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gRXZlbnQgdGFyZ2V0XG4gICAgICovXG4gICAgZ2V0VGFyZ2V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQ7XG4gICAgICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBIVE1MRWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IENsYXNzIG5hbWVcbiAgICAgKi9cbiAgICBnZXRDbGFzczogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZWxlbWVudCAmJiBlbGVtZW50LmdldEF0dHJpYnV0ZSAmJlxuICAgICAgICAgICAgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzc05hbWUnKSB8fCAnJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBlbGVtZW50IGhhcyBzcGVjaWZpYyBjbGFzcyBvciBub3RcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzcyB0byBmaW5kXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHRoZSBjbGFzc1xuICAgICAqL1xuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGVsQ2xhc3NOYW1lID0gdXRpbC5nZXRDbGFzcyhlbGVtZW50KTtcblxuICAgICAgICByZXR1cm4gZWxDbGFzc05hbWUuaW5kZXhPZihjbGFzc05hbWUpID4gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgZWxlbWVudCBieSBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzc1xuICAgICAqIEByZXR1cm5zIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBFbGVtZW50c1xuICAgICAqL1xuICAgIGdldEVsZW1lbnRzQnlDbGFzc05hbWU6IGZ1bmN0aW9uKHRhcmdldCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBhbGwsIGZpbHRlcmVkO1xuXG4gICAgICAgIGlmICh0YXJnZXQucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgICAgICAgZmlsdGVyZWQgPSB0YXJnZXQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWxsID0gdHVpLnV0aWwudG9BcnJheSh0YXJnZXQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJyonKSk7XG4gICAgICAgICAgICBmaWx0ZXJlZCA9IHR1aS51dGlsLmZpbHRlcihhbGwsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUgfHwgJyc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKGNsYXNzTmFtZXMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgd2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uXG4gICAgICovXG4gICAgaXNSaWdodEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuX2dldEJ1dHRvbihldmVudCkgPT09IDI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0IG9yIG5vdFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIEEgcHJvcGVydHlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfGJvb2xlYW59IFByb3BlcnR5IG5hbWUgb3IgZmFsc2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciB1c2VyU2VsZWN0UHJvcGVydHkgPSB1dGlsLnRlc3RQcm9wKFtcbiAgICAgKiAgICAgJ3VzZXJTZWxlY3QnLFxuICAgICAqICAgICAnV2Via2l0VXNlclNlbGVjdCcsXG4gICAgICogICAgICdPVXNlclNlbGVjdCcsXG4gICAgICogICAgICdNb3pVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ21zVXNlclNlbGVjdCdcbiAgICAgKiBdKTtcbiAgICAgKi9cbiAgICB0ZXN0UHJvcDogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gZmFsc2U7XG5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgY29uc2lzdGVudC1yZXR1cm4gKi9cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChwcm9wcywgZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICAgICAgaWYgKHByb3AgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBjb25zaXN0ZW50LXJldHVybiAqL1xuXG4gICAgICAgIHJldHVybiBwcm9wZXJ0eU5hbWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgZGVmYXVsdCBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqL1xuICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbCBmcm9tIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZSAtIFRlbXBsYXRlIGh0bWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUZW1wbGF0ZSBkYXRhXG4gICAgICogQHJldHVybnMge3N0cmluZ30gaHRtbFxuICAgICAqL1xuICAgIHJlbmRlclRlbXBsYXRlOiBmdW5jdGlvbihzb3VyY2UsIHByb3BzKSB7XG4gICAgICAgIGZ1bmN0aW9uIHBpY2tWYWx1ZShuYW1lcykge1xuICAgICAgICAgICAgcmV0dXJuIHBpY2suYXBwbHkobnVsbCwgW3Byb3BzXS5jb25jYXQobmFtZXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VyY2UucmVwbGFjZSh0ZW1wbGF0ZU1hc2tSZSwgZnVuY3Rpb24obWF0Y2gsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZTtcblxuICAgICAgICAgICAgaWYgKGlzVmFsaWREb3ROb3RhdGlvbihuYW1lKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcGlja1ZhbHVlKG5hbWUuc3BsaXQoJy4nKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuam9pbignICcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemF0aW9uIGZvciBldmVudCBidXR0b24gcHJvcGVydHlcbiAgICAgKiAwOiBGaXJzdCBtb3VzZSBidXR0b24sIDI6IFNlY29uZCBtb3VzZSBidXR0b24sIDE6IENlbnRlciBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHs/bnVtYmVyfSBidXR0b24gdHlwZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEJ1dHRvbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGJ1dHRvbixcbiAgICAgICAgICAgIHByaW1hcnkgPSAnMCwxLDMsNSw3JyxcbiAgICAgICAgICAgIHNlY29uZGFyeSA9ICcyLDYnLFxuICAgICAgICAgICAgd2hlZWwgPSAnNCc7XG5cbiAgICAgICAgaWYgKGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoJ01vdXNlRXZlbnRzJywgJzIuMCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXZlbnQuYnV0dG9uO1xuICAgICAgICB9XG5cbiAgICAgICAgYnV0dG9uID0gU3RyaW5nKGV2ZW50LmJ1dHRvbik7XG4gICAgICAgIGlmIChwcmltYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIGlmIChzZWNvbmRhcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAyO1xuICAgICAgICB9IGVsc2UgaWYgKHdoZWVsLmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbW91c2UgcG9zaXRpb25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZldH0gZXZlbnQgLSBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBYLCBZIHBvc2l0aW9uIG9mIG1vdXNlXG4gICAgICovXG4gICAgZ2V0TW91c2VQb3M6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgeTogZXZlbnQuY2xpZW50WVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdmFsdWUgb2Ygc2Nyb2xsIHRvcCBvbiBkb2N1bWVudC5ib2R5IChjcm9zcyBicm93c2luZylcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSBvZiBzY3JvbGwgdG9wXG4gICAgICovXG4gICAgZ2V0V2luZG93U2Nyb2xsVG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNjcm9sbFRvcDtcblxuICAgICAgICBpZiAoaXNTdXBwb3J0UGFnZU9mZnNldCkge1xuICAgICAgICAgICAgc2Nyb2xsVG9wID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsVG9wID0gaXNDU1MxQ29tcGF0ID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCA6IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNjcm9sbFRvcDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=
