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
        var editableFeature = tree.enabledFeatures.Editable;

        if (util.isRightButton(event) || this._isNotDraggable(target) ||
            (editableFeature && editableFeature.inputElement)) {
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
        this.inputElement = this._createInputElement(options.inputClassName);

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
         * Whether invoking custom event or not
         * @type {Boolean}
         */
        this.isInvokingCustomEvent = false;

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
        if (this.isInvokingCustomEvent ||
            !this.inputElement) {
            this.isInvokingCustomEvent = false;

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

        inputElement = this.inputElement;
        inputElement.value = tree.getNodeData(nodeId)[this.dataKey] || '';

        textElement.parentNode.insertBefore(inputElement, textElement);
        textElement.style.display = 'none';

        this.inputElement = target.getElementsByTagName('input')[0];

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

        if (parentNode) {
            parentNode.removeChild(inputEl);
        }

        if (tree.enabledFeatures.Ajax) {
            tree.off(this, 'successAjaxResponse');
        }

        this.isInvokingCustomEvent = false;

        util.removeEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.removeEventListener(this.inputElement, 'blur', this.boundOnBlur);
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
            this.isInvokingCustomEvent = true;
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
            this.isInvokingCustomEvent = true;
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
    deselect: function(nodeId) {
        var nodeElement;
        var tree = this.tree;

        if (!nodeId) {
            return;
        }

        nodeElement = document.getElementById(nodeId);

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

        this._changeOrderOfChildId(nodeId, newParentId, originalParentId, index);
        node.setParentId(newParentId);

        if (!isSilent) {
            this.fire('move', nodeId, originalParentId, newParentId, index);
        }
    }, /*eslint-enable complexity*/

    /**
     * Change order of child id by moving index
     * @param {string} nodeId - Node id
     * @param {string} newParentId - New parent id
     * @param {string} originalParentId - Original parent id
     * @param {number} index - Moving index (When child node is moved on parent node, the value is -1)
     * @private
     */
    _changeOrderOfChildId: function(nodeId, newParentId, originalParentId, index) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMvYWpheENvbW1hbmQuanMiLCJzcmMvanMvY29uc3RzL2RlZmF1bHRPcHRpb24uanMiLCJzcmMvanMvY29uc3RzL21lc3NhZ2VzLmpzIiwic3JjL2pzL2NvbnN0cy9vdXRlclRlbXBsYXRlLmpzIiwic3JjL2pzL2NvbnN0cy9zdGF0ZXMuanMiLCJzcmMvanMvZmVhdHVyZXMvYWpheC5qcyIsInNyYy9qcy9mZWF0dXJlcy9jaGVja2JveC5qcyIsInNyYy9qcy9mZWF0dXJlcy9jb250ZXh0TWVudS5qcyIsInNyYy9qcy9mZWF0dXJlcy9kcmFnZ2FibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvZWRpdGFibGUuanMiLCJzcmMvanMvZmVhdHVyZXMvc2VsZWN0YWJsZS5qcyIsInNyYy9qcy90cmVlLmpzIiwic3JjL2pzL3RyZWVNb2RlbC5qcyIsInNyYy9qcy90cmVlTm9kZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuaUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xudmFyIFRyZWUgPSByZXF1aXJlKCcuL3NyYy9qcy90cmVlJyk7XG50dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQnLCB7XG4gICAgVHJlZTogVHJlZVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQWpheCBjb21tYW4gaW4gdHJlZVxuICogQHR5cGUge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBSRUFEOiAncmVhZCcsXG4gICAgQ1JFQVRFOiAnY3JlYXRlJyxcbiAgICBVUERBVEU6ICd1cGRhdGUnLFxuICAgIERFTEVURTogJ3JlbW92ZScsXG4gICAgREVMRVRFX0FMTF9DSElMRFJFTjogJ3JlbW92ZUFsbENoaWxkcmVuJyxcbiAgICBNT1ZFOiAnbW92ZSdcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWFrZSBjbGFzcyBuYW1lc1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIFByZWZpeCBvZiBjbGFzcyBuYW1lXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBrZXlzIC0gS2V5cyBvZiBjbGFzcyBuYW1lc1xuICogQHJldHVybnMge29iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBDbGFzcyBuYW1lcyBtYXBcbiAqIEBpZ25vcmVcbiAqL1xuZnVuY3Rpb24gbWFrZUNsYXNzTmFtZXMocHJlZml4LCBrZXlzKSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIHR1aS51dGlsLmZvckVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIG9ialtrZXkgKyAnQ2xhc3MnXSA9IHByZWZpeCArIGtleTtcbiAgICB9KTtcblxuICAgIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogQSBkZWZhdWx0IHZhbHVlcyBmb3IgdHJlZVxuICogQGNvbnN0XG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5vZGVEZWZhdWx0U3RhdGUgLSBOb2RlIHN0YXRlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbm9kZUlkUHJlZml4IC0gTm9kZSBpZCBwcmVmaXhcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBzdGF0ZUxhYmVsIC0gU3RhdGUgbGFiZWwgaW4gbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0ZUxhYmVsLm9wZW5lZCAtICctJ1xuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0ZUxhYmVsLmNsb3NlZCAtICcrJ1xuICogQHByb3BlcnR5IHtvYmplY3R9IHRlbXBsYXRlIC0gVGVtcGxhdGUgaHRtbCBmb3IgdGhlIG5vZGVzLlxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZW1wbGF0ZS5pbnRlcm5hbE5vZGUgLSBUZW1wbGF0ZSBodG1sIGZvciBpbnRlcm5hbCBub2RlLlxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZW1wbGF0ZS5sZWFmTm9kZSAtIFRlbXBsYXRlIGh0bWwgZm9yIGxlYWYgbm9kZS5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBjbGFzc05hbWVzIC0gQ2xhc3MgbmFtZXMgb2YgZWxlbWVudHMgaW4gdHJlZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBvcGVuZWRDbGFzcyAtIENsYXNzIG5hbWUgZm9yIG9wZW5lZCBub2RlXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IGNsb3NlZENsYXNzIC0gQ2xhc3MgbmFtZSBmb3IgY2xvc2VkIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gbm9kZUNsYXNzIC0gQ2xhc3MgbmFtZSBmb3Igbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBsZWFmQ2xhc3MgLSBDbGFzcyBuYW1lIGZvciBsZWFmIG5vZGVcbiAqICBAcHJvcGVydHkge3N0cmluZ30gc3VidHJlZUNsYXNzICAtIENsYXNzIG5hbWUgZm9yIHN1YnRyZWUgaW4gaW50ZXJuYWwgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0b2dnbGVCdG5DbGFzcyAtIENsYXNzIG5hbWUgZm9yIHRvZ2dsZSBidXR0b24gaW4gaW50ZXJuYWwgbm9kZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZXh0Q2xhc3MgLSBDbGFzcyBuYW1lIGZvciB0ZXh0IGVsZW1lbnQgaW4gYSBub2RlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdjbG9zZWQnLFxuICAgIHN0YXRlTGFiZWxzOiB7XG4gICAgICAgIG9wZW5lZDogJy0nLFxuICAgICAgICBjbG9zZWQ6ICcrJ1xuICAgIH0sXG4gICAgbm9kZUlkUHJlZml4OiAndHVpLXRyZWUtbm9kZS0nLFxuICAgIGNsYXNzTmFtZXM6IG1ha2VDbGFzc05hbWVzKCd0dWktdHJlZS0nLCBbXG4gICAgICAgICdub2RlJyxcbiAgICAgICAgJ2xlYWYnLFxuICAgICAgICAnb3BlbmVkJyxcbiAgICAgICAgJ2Nsb3NlZCcsXG4gICAgICAgICdzdWJ0cmVlJyxcbiAgICAgICAgJ3RvZ2dsZUJ0bicsXG4gICAgICAgICd0ZXh0J1xuICAgIF0pLFxuICAgIHRlbXBsYXRlOiB7XG4gICAgICAgIGludGVybmFsTm9kZTpcbiAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7c3RhdGVMYWJlbH19PC9idXR0b24+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+JyxcbiAgICAgICAgbGVhZk5vZGU6XG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+J1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWVzc2FnZXMgZm9yIHRyZWVcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgSU5WQUxJRF9ST09UX0VMRU1FTlQ6ICdcInR1aS1jb21wb25lbnQtdHJlZVwiOiBSb290IGVsZW1lbnQgaXMgaW52YWxpZC4nLFxuICAgIElOVkFMSURfQVBJOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogSU5WQUxJRF9BUEknLFxuICAgIElOVkFMSURfQVBJX1NFTEVDVEFCTEU6ICdcInR1aS1jb21wb25lbnQtdHJlZVwiOiBUaGUgZmVhdHVyZS1cIlNlbGVjdGFibGVcIiBpcyBub3QgZW5hYmxlZC4nLFxuICAgIElOVkFMSURfQVBJX0VESVRBQkxFOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJFZGl0YWJsZVwiIGlzIG5vdCBlbmFibGVkLicsXG4gICAgSU5WQUxJRF9BUElfRFJBR0dBQkxFOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJEcmFnZ2FibGVcIiBpcyBub3QgZW5hYmxlZC4nLFxuICAgIElOVkFMSURfQVBJX0NIRUNLQk9YOiAnXCJ0dWktY29tcG9uZW50LXRyZWVcIjogVGhlIGZlYXR1cmUtXCJDaGVja2JveFwiIGlzIG5vdCBlbmFibGVkLidcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogT3V0ZXIgdGVtcGxhdGVcbiAqIEB0eXBlIHt7aW50ZXJuYWxOb2RlOiBzdHJpbmcsIGxlYWZOb2RlOiBzdHJpbmd9fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBJTlRFUk5BTF9OT0RFOlxuICAgICAgICAnPGxpIGlkPVwie3tpZH19XCIgY2xhc3M9XCJ7e25vZGVDbGFzc319IHt7c3RhdGVDbGFzc319XCI+JyArXG4gICAgICAgICAgICAne3tpbm5lclRlbXBsYXRlfX0nICtcbiAgICAgICAgJzwvbGk+JyxcbiAgICBMRUFGX05PREU6XG4gICAgICAgICc8bGkgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cInt7bm9kZUNsYXNzfX0ge3tsZWFmQ2xhc3N9fVwiPicgK1xuICAgICAgICAgICAgJ3t7aW5uZXJUZW1wbGF0ZX19JyArXG4gICAgICAgICc8L2xpPidcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogU3RhdGVzIGluIHRyZWVcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogU3RhdGVzIG9mIG5vZGVcbiAgICAgKiBAdHlwZSB7e09QRU5FRDogc3RyaW5nLCBDTE9TRUQ6IHN0cmluZ319XG4gICAgICovXG4gICAgbm9kZToge1xuICAgICAgICBPUEVORUQ6ICdvcGVuZWQnLFxuICAgICAgICBDTE9TRUQ6ICdjbG9zZWQnXG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNuaXBwZXQgPSB0dWkudXRpbDtcbnZhciBBUElfTElTVCA9IFtdO1xudmFyIExPQURFUl9DTEFTU05BTUUgPSAndHVpLXRyZWUtbG9hZGVyJztcblxuLyoqXG4gKiBTZXQgQWpheCBmZWF0dXJlIG9uIHRyZWVcbiAqIEBjbGFzcyBBamF4XG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnNcbiAqICBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5jb21tYW5kIC0gRWFjaCBBamF4IHJlcXVlc3QgY29tbWFuZCBvcHRpb25zXG4gKiAgQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMucGFyc2VEYXRhXSAtIEZ1bmN0aW9uIHRvIHBhcnNlIGFuZCByZXR1cm4gdGhlIHJlc3BvbnNlIGRhdGFcbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubG9hZGVyQ2xhc3NOYW1lXSAtIENsYXNzbmFtZSBvZiBsb2FkZXIgZWxlbWVudFxuICogIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaXNMb2FkUm9vdF0gLSBXaGV0aGVyIGxvYWQgZGF0YSBmcm9tIHJvb3Qgbm9kZSBvciBub3RcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEFqYXggPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIEFqYXgucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgQWpheFxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFQSSBsaXN0IG9mIEFqYXhcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyZWVcbiAgICAgICAgICogQHR5cGUge1RyZWV9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb24gZm9yIGVhY2ggcmVxdWVzdCBjb21tYW5kXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbW1hbmQgPSBvcHRpb25zLmNvbW1hbmQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxiYWNrIGZvciBwYXJzaW5nIHRoZSByZXNwb25zZSBkYXRhXG4gICAgICAgICAqIEB0eXBlIHs/RnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBhcnNlRGF0YSA9IG9wdGlvbnMucGFyc2VEYXRhIHx8IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsYXNzbmFtZSBvZiBsb2FkZXIgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5sb2FkZXJDbGFzc05hbWUgPSBvcHRpb25zLmxvYWRlckNsYXNzTmFtZSB8fCBMT0FERVJfQ0xBU1NOQU1FO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGF0ZSBvZiBsb2FkaW5nIHJvb3QgZGF0YSBvciBub3RcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzTG9hZFJvb3QgPSAhc25pcHBldC5pc1VuZGVmaW5lZChvcHRpb25zLmlzTG9hZFJvb3QpID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmlzTG9hZFJvb3QgOiB0cnVlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2FkZXIgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxvYWRlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fY3JlYXRlTG9hZGVyKCk7XG5cbiAgICAgICAgdHJlZS5vbignaW5pdEZlYXR1cmUnLCBzbmlwcGV0LmJpbmQodGhpcy5fb25Jbml0RmVhdHVyZSwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwiaW5pdEZlYXR1cmVcIlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uSW5pdEZlYXR1cmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNMb2FkUm9vdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmVlLnJlc2V0QWxsRGF0YSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuXG4gICAgICAgIHRoaXMuX3JlbW92ZUxvYWRlcigpO1xuXG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBMb2FkIGRhdGEgdG8gcmVxdWVzdCBzZXJ2ZXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIENvbW1hbmQgdHlwZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRXhlY3V0ZWQgZnVuY3Rpb24gYWZ0ZXIgcmVzcG9uc2VcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3BhcmFtc10gLSBWYWx1ZXMgdG8gbWFrZSBcImRhdGFcIiBwcm9wZXJ0eSB1c2luZyByZXF1ZXN0XG4gICAgICovXG4gICAgbG9hZERhdGE6IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrLCBwYXJhbXMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgb3B0aW9ucztcblxuICAgICAgICBpZiAoIXRoaXMuY29tbWFuZCB8fCAhdGhpcy5jb21tYW5kW3R5cGVdIHx8XG4gICAgICAgICAgICAhdGhpcy5jb21tYW5kW3R5cGVdLnVybCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucyA9IHRoaXMuX2dldERlZmF1bHRSZXF1ZXN0T3B0aW9ucyh0eXBlLCBwYXJhbXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2JlZm9yZUFqYXhSZXF1ZXN0XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb21tYW5kIC0gQ29tbWFuZCB0eXBlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbZGF0YV0gLSBSZXF1ZXN0IGRhdGFcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbignYmVmb3JlQWpheFJlcXVlc3QnLCBmdW5jdGlvbihjb21tYW5kLCBkYXRhKSB7XG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZygnYmVmb3JlICcgKyBjb21tYW5kICsgJyByZXF1ZXN0IScpO1xuICAgICAgICAgKiAgICAgcmV0dXJuIGZhbHNlOyAvLyBJdCBjYW5jZWxzIHJlcXVlc3RcbiAgICAgICAgICogICAgIC8vIHJldHVybiB0cnVlOyAvLyBJdCBmaXJlcyByZXF1ZXN0XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCF0aGlzLnRyZWUuaW52b2tlKCdiZWZvcmVBamF4UmVxdWVzdCcsIHR5cGUsIHBhcmFtcykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Nob3dMb2FkZXIoKTtcblxuICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgc2VsZi5fcmVzcG9uc2VTdWNjZXNzKHR5cGUsIGNhbGxiYWNrLCByZXNwb25zZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgb3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5fcmVzcG9uc2VFcnJvcih0eXBlKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkLmFqYXgob3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByb2Nlc3Npbmcgd2hlbiByZXNwb25zZSBpcyBzdWNjZXNzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBDb21tYW5kIHR5cGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEV4ZWN1dGVkIGZ1bmN0aW9uIGFmdGVyIHJlc3BvbnNlXG4gICAgICogQHBhcmFtIHtPYmplY3R8Ym9vbGVhbn0gW3Jlc3BvbnNlXSAtIFJlc3BvbnNlIGRhdGEgZnJvbSBzZXJ2ZXIgb3IgcmV0dXJuIHZhbHVlIG9mIFwicGFyc2VEYXRhXCJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZXNwb25zZVN1Y2Nlc3M6IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIGRhdGE7XG5cbiAgICAgICAgdGhpcy5faGlkZUxvYWRlcigpO1xuXG4gICAgICAgIGlmICh0aGlzLnBhcnNlRGF0YSkge1xuICAgICAgICAgICAgcmVzcG9uc2UgPSB0aGlzLnBhcnNlRGF0YSh0eXBlLCByZXNwb25zZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGRhdGEgPSBjYWxsYmFjayhyZXNwb25zZSk7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFRyZWUjc3VjY2Vzc0FqYXhSZXNwb25zZVxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmQgLSBDb21tYW5kIHR5cGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbZGF0YV0gLSBSZXR1cm4gdmFsdWUgb2YgZXhlY3V0ZWQgY29tbWFuZCBjYWxsYmFja1xuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHRyZWUub24oJ3N1Y2Nlc3NBamF4UmVzcG9uc2UnLCBmdW5jdGlvbihjb21tYW5kLCBkYXRhKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coY29tbWFuZCArICcgcmVzcG9uc2UgaXMgc3VjY2VzcyEnKTtcbiAgICAgICAgICAgICAqICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICogICAgICAgICAgIGNvbnNvbGUubG9nKCduZXcgYWRkIGlkcyA6JyArIGRhdGEpO1xuICAgICAgICAgICAgICogICAgIH1cbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cmVlLmZpcmUoJ3N1Y2Nlc3NBamF4UmVzcG9uc2UnLCB0eXBlLCBkYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFRyZWUjZmFpbEFqYXhSZXNwb25zZVxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmQgLSBDb21tYW5kIHR5cGVcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlLm9uKCdmYWlsQWpheFJlc3BvbnNlJywgZnVuY3Rpb24oY29tbWFuZCkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKGNvbW1hbmQgKyAnIHJlc3BvbnNlIGlzIGZhaWwhJyk7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdHJlZS5maXJlKCdmYWlsQWpheFJlc3BvbnNlJywgdHlwZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJvY2Vzc2luZyB3aGVuIHJlc3BvbnNlIGlzIGVycm9yXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBDb21tYW5kIHR5cGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZXNwb25zZUVycm9yOiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHRoaXMuX2hpZGVMb2FkZXIoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNlcnJvckFqYXhSZXNwb25zZVxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29tbWFuZCAtIENvbW1hbmQgdHlwZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdlcnJvckFqYXhSZXNwb25zZScsIGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKGNvbW1hbmQgKyAnIHJlc3BvbnNlIGlzIGVycm9yIScpO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZS5maXJlKCdlcnJvckFqYXhSZXNwb25zZScsIHR5cGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZGVmYXVsdCByZXF1ZXN0IG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIENvbW1hbmQgdHlwZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1zXSAtIFZhbHVlIG9mIHJlcXVlc3Qgb3B0aW9uIFwiZGF0YVwiXG4gICAgICogQHJldHVybnMge09iamVjdH0gRGVmYXVsdCBvcHRpb25zIHRvIHJlcXVlc3RcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXREZWZhdWx0UmVxdWVzdE9wdGlvbnM6IGZ1bmN0aW9uKHR5cGUsIHBhcmFtcykge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuY29tbWFuZFt0eXBlXTtcblxuICAgICAgICBpZiAoc25pcHBldC5pc0Z1bmN0aW9uKG9wdGlvbnMudXJsKSkgeyAvLyBmb3IgcmVzdGZ1bCBBUEkgdXJsXG4gICAgICAgICAgICBvcHRpb25zLnVybCA9IG9wdGlvbnMudXJsKHBhcmFtcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc25pcHBldC5pc0Z1bmN0aW9uKG9wdGlvbnMuZGF0YSkpIHsgLy8gZm9yIGN1c3RvbSByZXF1ZXN0IGRhdGFcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IG9wdGlvbnMuZGF0YShwYXJhbXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucy50eXBlID0gKG9wdGlvbnMudHlwZSkgPyBvcHRpb25zLnR5cGUudG9Mb3dlckNhc2UoKSA6ICdnZXQnO1xuICAgICAgICBvcHRpb25zLmRhdGFUeXBlID0gb3B0aW9ucy5kYXRhVHlwZSB8fCAnanNvbic7XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBsb2FkZXIgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUxvYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgbG9hZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgICAgIGxvYWRlci5jbGFzc05hbWUgPSB0aGlzLmxvYWRlckNsYXNzTmFtZTtcbiAgICAgICAgbG9hZGVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICAgICAgdHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGxvYWRlcik7XG5cbiAgICAgICAgdGhpcy5sb2FkZXIgPSBsb2FkZXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBsb2FkZXIgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUxvYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgbG9hZGVyID0gdGhpcy5sb2FkZXI7XG5cbiAgICAgICAgdHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxvYWRlcik7XG5cbiAgICAgICAgdGhpcy5sb2FkZXIgPSBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaG93IGxvYWRlciBlbGVtZW50IG9uIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zaG93TG9hZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5sb2FkZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhpZGUgbG9hZGVyIGVsZW1lbnQgb24gdHJlZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2hpZGVMb2FkZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmxvYWRlci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFqYXg7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xudmFyIEFQSV9MSVNUID0gW1xuICAgICdjaGVjaycsXG4gICAgJ3VuY2hlY2snLFxuICAgICd0b2dnbGVDaGVjaycsXG4gICAgJ2lzQ2hlY2tlZCcsXG4gICAgJ2lzSW5kZXRlcm1pbmF0ZScsXG4gICAgJ2lzVW5jaGVja2VkJyxcbiAgICAnZ2V0Q2hlY2tlZExpc3QnLFxuICAgICdnZXRUb3BDaGVja2VkTGlzdCcsXG4gICAgJ2dldEJvdHRvbUNoZWNrZWRMaXN0J1xuXTtcblxuLyogQ2hlY2tib3ggdHJpLXN0YXRlcyAqL1xudmFyIFNUQVRFX0NIRUNLRUQgPSAxLFxuICAgIFNUQVRFX1VOQ0hFQ0tFRCA9IDIsXG4gICAgU1RBVEVfSU5ERVRFUk1JTkFURSA9IDMsXG4gICAgREFUQV9LRVlfRk9SX0NIRUNLQk9YX1NUQVRFID0gJ19fQ2hlY2tCb3hTdGF0ZV9fJyxcbiAgICBEQVRBID0ge307XG5cbnZhciBmaWx0ZXIgPSB0dWkudXRpbC5maWx0ZXIsXG4gICAgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2g7XG4vKipcbiAqIFNldCB0aGUgY2hlY2tib3gtYXBpXG4gKiBAY2xhc3MgQ2hlY2tib3hcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb24gLSBPcHRpb25cbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9uLmNoZWNrYm94Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGNoZWNrYm94IGVsZW1lbnRcbiAqIEBpZ25vcmVcbiAqL1xudmFyIENoZWNrYm94ID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBDaGVja2JveC5wcm90b3R5cGUgKi97IC8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgQ2hlY2tib3hcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBjaGVja2JveFxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9uKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9uID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBvcHRpb24pO1xuXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuY2hlY2tib3hDbGFzc05hbWUgPSBvcHRpb24uY2hlY2tib3hDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuY2hlY2tlZExpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5yb290Q2hlY2tib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJTlBVVCcpO1xuICAgICAgICB0aGlzLnJvb3RDaGVja2JveC50eXBlID0gJ2NoZWNrYm94JztcblxuICAgICAgICB0aGlzLl9zZXRBUElzKCk7XG4gICAgICAgIHRoaXMuX2F0dGFjaEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIHRoaXMgbW9kdWxlXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuXG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuICAgICAgICBmb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdHJlZVthcGlOYW1lXTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBhcGlzIG9mIGNoZWNrYm94IHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRBUElzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBiaW5kID0gdHVpLnV0aWwuYmluZDtcblxuICAgICAgICBmb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICB0cmVlW2FwaU5hbWVdID0gYmluZCh0aGlzW2FwaU5hbWVdLCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBldmVudCB0byB0cmVlIGluc3RhbmNlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXR0YWNoRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmVlLm9uKHtcbiAgICAgICAgICAgIHNpbmdsZUNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJZCwgc3RhdGU7XG5cbiAgICAgICAgICAgICAgICBpZiAodXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMuY2hlY2tib3hDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlRnJvbUNoZWNrYm94KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRpbnVlUG9zdHByb2Nlc3Npbmcobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFmdGVyRHJhdzogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJlZS5pc01vdmluZ05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0Q2hhbmdlcyhub2RlSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1vdmU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAvL0B0b2RvIC0gT3B0aW1pemF0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdENoYW5nZXMoZGF0YS5vcmlnaW5hbFBhcmVudElkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0Q2hhbmdlcyhkYXRhLm5ld1BhcmVudElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZmxlY3QgdGhlIGNoYW5nZXMgb24gbm9kZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlZmxlY3RDaGFuZ2VzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdGhpcy50cmVlLmVhY2goZnVuY3Rpb24oZGVzY2VuZGFudCwgZGVzY2VuZGFudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShkZXNjZW5kYW50SWQsIHRoaXMuX2dldFN0YXRlKGRlc2NlbmRhbnRJZCksIHRydWUpO1xuICAgICAgICB9LCBub2RlSWQsIHRoaXMpO1xuICAgICAgICB0aGlzLl9qdWRnZU93blN0YXRlKG5vZGVJZCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFsbEFuY2VzdG9yc1N0YXRlKG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjaGVja2JveCBhdHRyaWJ1dGVzIChjaGVja2VkLCBpbmRldGVybWluYXRlKVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gY2hlY2tib3ggLSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0NoZWNrZWQgLSBcImNoZWNrZWRcIlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNJbmRldGVybWluYXRlIC0gXCJpbmRldGVybWluYXRlXCJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDaGVja2JveEF0dHI6IGZ1bmN0aW9uKGNoZWNrYm94LCBpc0NoZWNrZWQsIGlzSW5kZXRlcm1pbmF0ZSkge1xuICAgICAgICBjaGVja2JveC5pbmRldGVybWluYXRlID0gaXNJbmRldGVybWluYXRlO1xuICAgICAgICBjaGVja2JveC5jaGVja2VkID0gaXNDaGVja2VkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tpbmcgc3RhdGUgb2Ygbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gU3RhdGUgZm9yIGNoZWNrYm94XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RvcFByb3BhZ2F0aW9uXSAtIElmIHRydWUsIHN0b3AgY2hhbmdpbmcgc3RhdGUgcHJvcGFnYXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHZhciBjaGVja2JveCA9IHRoaXMuX2dldENoZWNrYm94RWxlbWVudChub2RlSWQpO1xuXG4gICAgICAgIGlmICghY2hlY2tib3gpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfQ0hFQ0tFRDpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfVU5DSEVDS0VEOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldENoZWNrYm94QXR0cihjaGVja2JveCwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU1RBVEVfSU5ERVRFUk1JTkFURTpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDaGVja2JveEF0dHIoY2hlY2tib3gsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IC8vIG5vIG1vcmUgcHJvY2VzcyBpZiB0aGUgc3RhdGUgaXMgaW52YWxpZFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbnRpbnVlUG9zdHByb2Nlc3Npbmcobm9kZUlkLCBzdGF0ZSwgc3RvcFByb3BhZ2F0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNraW5nIHN0YXRlIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IENoZWNraW5nIHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHN0YXRlID0gdHJlZS5nZXROb2RlRGF0YShub2RlSWQpW0RBVEFfS0VZX0ZPUl9DSEVDS0JPWF9TVEFURV0sXG4gICAgICAgICAgICBjaGVja2JveDtcblxuICAgICAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgICAgICBjaGVja2JveCA9IHRoaXMuX2dldENoZWNrYm94RWxlbWVudChub2RlSWQpO1xuICAgICAgICAgICAgc3RhdGUgPSB0aGlzLl9nZXRTdGF0ZUZyb21DaGVja2JveChjaGVja2JveCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2luZyBzdGF0ZSBvZiBub2RlIGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gY2hlY2tib3ggLSBDaGVja2JveCBlbGVtZW50XG4gICAgICogQHJldHVybnMgez9udW1iZXJ9IENoZWNraW5nIHN0YXRlXG4gICAgICovXG4gICAgX2dldFN0YXRlRnJvbUNoZWNrYm94OiBmdW5jdGlvbihjaGVja2JveCkge1xuICAgICAgICB2YXIgc3RhdGU7XG5cbiAgICAgICAgaWYgKCFjaGVja2JveCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tib3guY2hlY2tlZCkge1xuICAgICAgICAgICAgc3RhdGUgPSBTVEFURV9DSEVDS0VEO1xuICAgICAgICB9IGVsc2UgaWYgKGNoZWNrYm94LmluZGV0ZXJtaW5hdGUpIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfSU5ERVRFUk1JTkFURTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gU1RBVEVfVU5DSEVDS0VEO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb250aW51ZSBwb3N0LXByb2Nlc3NpbmcgZnJvbSBjaGFuZ2luZzpjaGVja2JveC1zdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gQ2hlY2tib3ggc3RhdGVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdG9wUHJvcGFnYXRpb25dIC0gSWYgdHJ1ZSwgc3RvcCB1cGRhdGUtcHJvcGFnYXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb250aW51ZVBvc3Rwcm9jZXNzaW5nOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlLCBzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IHRoaXMuY2hlY2tlZExpc3QsXG4gICAgICAgICAgICBldmVudE5hbWU7XG5cbiAgICAgICAgLyogUHJldmVudCBkdXBsaWNhdGVkIG5vZGUgaWQgKi9cbiAgICAgICAgdXRpbC5yZW1vdmVJdGVtRnJvbUFycmF5KG5vZGVJZCwgY2hlY2tlZExpc3QpO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gU1RBVEVfQ0hFQ0tFRCkge1xuICAgICAgICAgICAgY2hlY2tlZExpc3QucHVzaChub2RlSWQpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSNjaGVja1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIENoZWNrZWQgbm9kZSBpZFxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHRyZWUub24oJ2NoZWNrJywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ2NoZWNrZWQ6ICcgKyBub2RlSWQpO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGV2ZW50TmFtZSA9ICdjaGVjayc7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFNUQVRFX1VOQ0hFQ0tFRCkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSN1bmNoZWNrXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gVW5jaGVja2VkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB0cmVlLm9uKCd1bmNoZWNrJywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ3VuY2hlY2tlZDogJyArIG5vZGVJZCk7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZXZlbnROYW1lID0gJ3VuY2hlY2snO1xuICAgICAgICB9XG4gICAgICAgIERBVEFbREFUQV9LRVlfRk9SX0NIRUNLQk9YX1NUQVRFXSA9IHN0YXRlO1xuXG4gICAgICAgIHRyZWUuc2V0Tm9kZURhdGEobm9kZUlkLCBEQVRBLCB7XG4gICAgICAgICAgICBpc1NpbGVudDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fcHJvcGFnYXRlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG4gICAgICAgICAgICB0cmVlLmZpcmUoZXZlbnROYW1lLCBub2RlSWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByb3BhZ2F0ZSBhIG5vZGUgc3RhdGUgdG8gZGVzY2VuZGFudHMgYW5kIGFuY2VzdG9ycyBmb3IgdXBkYXRpbmcgdGhlaXIgc3RhdGVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhdGUgLSBDaGVja2JveCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Byb3BhZ2F0ZVN0YXRlOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlKSB7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gU1RBVEVfSU5ERVRFUk1JTkFURSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlQWxsRGVzY2VuZGFudHNTdGF0ZShub2RlSWQsIHN0YXRlKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQWxsQW5jZXN0b3JzU3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGFsbCBkZXNjZW5kYW50cyBzdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXRlIC0gU3RhdGUgZm9yIGNoZWNrYm94XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlQWxsRGVzY2VuZGFudHNTdGF0ZTogZnVuY3Rpb24obm9kZUlkLCBzdGF0ZSkge1xuICAgICAgICB0aGlzLnRyZWUuZWFjaChmdW5jdGlvbihkZXNjZW5kYW50LCBkZXNjZW5kYW50SWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKGRlc2NlbmRhbnRJZCwgc3RhdGUsIHRydWUpO1xuICAgICAgICB9LCBub2RlSWQsIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgYWxsIGFuY2VzdG9ycyBzdGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlQWxsQW5jZXN0b3JzU3RhdGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHBhcmVudElkID0gdHJlZS5nZXRQYXJlbnRJZChub2RlSWQpO1xuXG4gICAgICAgIHdoaWxlIChwYXJlbnRJZCkge1xuICAgICAgICAgICAgdGhpcy5fanVkZ2VPd25TdGF0ZShwYXJlbnRJZCk7XG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRyZWUuZ2V0UGFyZW50SWQocGFyZW50SWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEp1ZGdlIG93biBzdGF0ZSBmcm9tIGNoaWxkIG5vZGUgaXMgY2hhbmdlZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfanVkZ2VPd25TdGF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hpbGRJZHMgPSB0cmVlLmdldENoaWxkSWRzKG5vZGVJZCksXG4gICAgICAgICAgICBjaGVja2VkID0gdHJ1ZSxcbiAgICAgICAgICAgIHVuY2hlY2tlZCA9IHRydWU7XG5cbiAgICAgICAgaWYgKCFjaGlsZElkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNoZWNrZWQgPSB0aGlzLmlzQ2hlY2tlZChub2RlSWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yRWFjaChjaGlsZElkcywgZnVuY3Rpb24oY2hpbGRJZCkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlKGNoaWxkSWQpO1xuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAoY2hlY2tlZCAmJiBzdGF0ZSA9PT0gU1RBVEVfQ0hFQ0tFRCk7XG4gICAgICAgICAgICAgICAgdW5jaGVja2VkID0gKHVuY2hlY2tlZCAmJiBzdGF0ZSA9PT0gU1RBVEVfVU5DSEVDS0VEKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBjaGVja2VkIHx8IHVuY2hlY2tlZDtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoZWNrZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKG5vZGVJZCwgU1RBVEVfQ0hFQ0tFRCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodW5jaGVja2VkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX1VOQ0hFQ0tFRCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX0lOREVURVJNSU5BVEUsIHRydWUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGVja2JveCBlbGVtZW50IG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/SFRNTEVsZW1lbnR9IENoZWNrYm94IGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRDaGVja2JveEVsZW1lbnQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICAgIGVsLCBub2RlRWw7XG5cbiAgICAgICAgaWYgKG5vZGVJZCA9PT0gdHJlZS5nZXRSb290Tm9kZUlkKCkpIHtcbiAgICAgICAgICAgIGVsID0gdGhpcy5yb290Q2hlY2tib3g7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlRWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgICAgICAgICAgIG5vZGVFbCxcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrYm94Q2xhc3NOYW1lXG4gICAgICAgICAgICApWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS5jaGVjayhub2RlSWQpO1xuICAgICAqL1xuICAgIGNoZWNrOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQ2hlY2tlZChub2RlSWQpKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZShub2RlSWQsIFNUQVRFX0NIRUNLRUQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVuY2hlY2sgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIG5vZGVJZCA9ICd0dWktdHJlZS1ub2RlLTMnO1xuICAgICAqIHRyZWUudW5jaGVjayhub2RlSWQpO1xuICAgICAqL1xuICAgIHVuY2hlY2s6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNVbmNoZWNrZWQobm9kZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobm9kZUlkLCBTVEFURV9VTkNIRUNLRUQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBub2RlIGNoZWNraW5nXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS50b2dnbGVDaGVjayhub2RlSWQpO1xuICAgICAqL1xuICAgIHRvZ2dsZUNoZWNrOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQ2hlY2tlZChub2RlSWQpKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrKG5vZGVJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnVuY2hlY2sobm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBub2RlIGlzIGNoZWNrZWRcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiBub2RlIGlzIGluZGV0ZXJtaW5hdGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLmNoZWNrKG5vZGVJZCk7XG4gICAgICogY29uc29sZS5sb2codHJlZS5pc0NoZWNrZWQobm9kZUlkKSk7IC8vIHRydWVcbiAgICAgKi9cbiAgICBpc0NoZWNrZWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gU1RBVEVfQ0hFQ0tFRCA9PT0gdGhpcy5fZ2V0U3RhdGUobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBpbmRldGVybWluYXRlXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgbm9kZSBpcyBpbmRldGVybWluYXRlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgbm9kZUlkID0gJ3R1aS10cmVlLW5vZGUtMyc7XG4gICAgICogdHJlZS5jaGVjayhub2RlSWQpO1xuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuaXNJbmRldGVybWluYXRlKG5vZGVJZCkpOyAvLyBmYWxzZVxuICAgICAqL1xuICAgIGlzSW5kZXRlcm1pbmF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHJldHVybiBTVEFURV9JTkRFVEVSTUlOQVRFID09PSB0aGlzLl9nZXRTdGF0ZShub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBub2RlIGlzIHVuY2hlY2tlZCBvciBub3RcbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiBub2RlIGlzIHVuY2hlY2tlZC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBub2RlSWQgPSAndHVpLXRyZWUtbm9kZS0zJztcbiAgICAgKiB0cmVlLnVuY2hlY2sobm9kZUlkKTtcbiAgICAgKiBjb25zb2xlLmxvZyh0cmVlLmlzVW5jaGVja2VkKG5vZGVJZCkpOyAvLyB0cnVlXG4gICAgICovXG4gICAgaXNVbmNoZWNrZWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gU1RBVEVfVU5DSEVDS0VEID09PSB0aGlzLl9nZXRTdGF0ZShub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tlZCBsaXN0XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gTm9kZSBpZCAoZGVmYXVsdDogcm9vdE5vZGUgaWQpXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBDaGVja2VkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvL1xuICAgICAqIC8vIG5vZGUxKHYpXG4gICAgICogLy8gICBub2RlMih2KVxuICAgICAqIC8vICAgbm9kZTModilcbiAgICAgKiAvLyBub2RlNFxuICAgICAqIC8vICAgbm9kZTUodilcbiAgICAgKiAvLyBub2RlNlxuICAgICAqIC8vICAgbm9kZTcodilcbiAgICAgKiAvLyAgICAgbm9kZTgodilcbiAgICAgKiAvLyAgIG5vZGU5XG4gICAgICpcbiAgICAgKiB2YXIgYWxsQ2hlY2tlZExpc3QgPSB0cmVlLmdldENoZWNrZWRMaXN0KCk7IC8vIFsnbm9kZTEnLCAnbm9kZTInLCAnbm9kZTMnICwuLi4uXVxuICAgICAqIHZhciBkZXNjZW5kYW50c0NoZWNrZWRMaXN0ID0gdHJlZS5nZXRDaGVla2VkTGlzdCgnbm9kZTYnKTsgLy8gWydub2RlNycsICdub2RlOCddXG4gICAgICovXG4gICAgZ2V0Q2hlY2tlZExpc3Q6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSB0aGlzLmNoZWNrZWRMaXN0O1xuXG4gICAgICAgIGlmICghcGFyZW50SWQpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGVja2VkTGlzdC5zbGljZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcihjaGVja2VkTGlzdCwgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZS5jb250YWlucyhwYXJlbnRJZCwgbm9kZUlkKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0b3AgY2hlY2tlZCBsaXN0XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gTm9kZSBpZCAoZGVmYXVsdDogcm9vdE5vZGUgaWQpXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBDaGVja2VkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvL1xuICAgICAqIC8vIG5vZGUxKHYpXG4gICAgICogLy8gICBub2RlMih2KVxuICAgICAqIC8vICAgbm9kZTModilcbiAgICAgKiAvLyBub2RlNFxuICAgICAqIC8vICAgbm9kZTUodilcbiAgICAgKiAvLyBub2RlNlxuICAgICAqIC8vICAgbm9kZTcodilcbiAgICAgKiAvLyAgICAgbm9kZTgodilcbiAgICAgKiAvLyAgIG5vZGU5XG4gICAgICpcbiAgICAgKiB2YXIgYWxsVG9wQ2hlY2tlZExpc3QgPSB0cmVlLmdldFRvcENoZWNrZWRMaXN0KCk7IC8vIFsnbm9kZTEnLCAnbm9kZTUnLCAnbm9kZTcnXVxuICAgICAqIHZhciBkZXNjZW5kYW50c1RvcENoZWNrZWRMaXN0ID0gdHJlZS5nZXRUb3BDaGVla2VkTGlzdCgnbm9kZTYnKTsgLy8gWydub2RlNyddXG4gICAgICovXG4gICAgZ2V0VG9wQ2hlY2tlZExpc3Q6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hlY2tlZExpc3QgPSBbXSxcbiAgICAgICAgICAgIHN0YXRlO1xuXG4gICAgICAgIHBhcmVudElkID0gcGFyZW50SWQgfHwgdHJlZS5nZXRSb290Tm9kZUlkKCk7XG4gICAgICAgIHN0YXRlID0gdGhpcy5fZ2V0U3RhdGUocGFyZW50SWQpO1xuICAgICAgICBpZiAoc3RhdGUgPT09IFNUQVRFX0NIRUNLRUQpIHtcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gdHJlZS5nZXRDaGlsZElkcyhwYXJlbnRJZCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFNUQVRFX0lOREVURVJNSU5BVEUpIHtcbiAgICAgICAgICAgIGNoZWNrZWRMaXN0ID0gdGhpcy5nZXRDaGVja2VkTGlzdChwYXJlbnRJZCk7XG4gICAgICAgICAgICBjaGVja2VkTGlzdCA9IGZpbHRlcihjaGVja2VkTGlzdCwgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICF0aGlzLmlzQ2hlY2tlZCh0cmVlLmdldFBhcmVudElkKG5vZGVJZCkpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hlY2tlZExpc3Q7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBib3R0b20gY2hlY2tlZCBsaXN0XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50SWRdIC0gTm9kZSBpZCAoZGVmYXVsdDogcm9vdE5vZGUgaWQpXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBDaGVja2VkIG5vZGUgaWRzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvL1xuICAgICAqIC8vIG5vZGUxKHYpXG4gICAgICogLy8gICBub2RlMih2KVxuICAgICAqIC8vICAgbm9kZTModilcbiAgICAgKiAvLyBub2RlNFxuICAgICAqIC8vICAgbm9kZTUodilcbiAgICAgKiAvLyBub2RlNlxuICAgICAqIC8vICAgbm9kZTcodilcbiAgICAgKiAvLyAgICAgbm9kZTgodilcbiAgICAgKiAvLyAgIG5vZGU5XG4gICAgICpcbiAgICAgKiB2YXIgYWxsQm90dG9tQ2hlY2tlZExpc3QgPSB0cmVlLmdldEJvdHRvbUNoZWNrZWRMaXN0KCk7IC8vIFsnbm9kZTInLCAnbm9kZTMnLCAnbm9kZTUnLCAnbm9kZTgnXVxuICAgICAqIHZhciBkZXNjZW5kYW50c0JvdHRvbUNoZWNrZWRMaXN0ID0gdHJlZS5nZXRCb3R0b21DaGVla2VkTGlzdCgnbm9kZTYnKTsgLy8gWydub2RlOCddXG4gICAgICovXG4gICAgZ2V0Qm90dG9tQ2hlY2tlZExpc3Q6IGZ1bmN0aW9uKHBhcmVudElkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlLFxuICAgICAgICAgICAgY2hlY2tlZExpc3Q7XG5cbiAgICAgICAgcGFyZW50SWQgPSBwYXJlbnRJZCB8fCB0cmVlLmdldFJvb3ROb2RlSWQoKTtcbiAgICAgICAgY2hlY2tlZExpc3QgPSB0aGlzLmdldENoZWNrZWRMaXN0KHBhcmVudElkKTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyKGNoZWNrZWRMaXN0LCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cmVlLmlzTGVhZihub2RlSWQpO1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKENoZWNrYm94KTtcbm1vZHVsZS5leHBvcnRzID0gQ2hlY2tib3g7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vdXRpbCcpO1xuXG52YXIgQVBJX0xJU1QgPSBbXG4gICAgJ2NoYW5nZUNvbnRleHRNZW51J1xuXTtcbnZhciBUdWlDb250ZXh0TWVudSA9IHR1aSAmJiB0dWkuY29tcG9uZW50ICYmIHR1aS5jb21wb25lbnQuQ29udGV4dE1lbnU7XG52YXIgc3R5bGVLZXlzID0gWyd1c2VyU2VsZWN0JywgJ1dlYmtpdFVzZXJTZWxlY3QnLCAnT1VzZXJTZWxlY3QnLCAnTW96VXNlclNlbGVjdCcsICdtc1VzZXJTZWxlY3QnXTtcbnZhciBlbmFibGVQcm9wID0gdXRpbC50ZXN0UHJvcChzdHlsZUtleXMpO1xudmFyIGJpbmQgPSB0dWkudXRpbC5iaW5kO1xuXG4vKipcbiAqIFNldCBDb250ZXh0TWVudSBmZWF0dXJlIG9uIHRyZWVcbiAqIEBjbGFzcyBDb250ZXh0TWVudVxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgICAgQHBhcmFtIHtBcnJheS48T2JqZWN0Pn0gb3B0aW9ucy5tZW51RGF0YSAtIENvbnRleHQgbWVudSBkYXRhXG4gKiBAaWdub3JlXG4gKi9cbnZhciBDb250ZXh0TWVudSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgQ29udGV4dE1lbnUucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIHN0YXRpYzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAbWVtYmVyT2YgQ29udGV4dE1lbnVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBDb250ZXh0TWVudVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJlZSBkYXRhXG4gICAgICAgICAqIEB0eXBlIHtUcmVlfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJlZSBzZWxlY3RvciBmb3IgY29udGV4dCBtZW51XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWVTZWxlY3RvciA9ICcjJyArIHRoaXMudHJlZS5yb290RWxlbWVudC5pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWQgb2YgZmxvYXRpbmcgbGF5ZXIgaW4gdHJlZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mbElkID0gdGhpcy50cmVlLnJvb3RFbGVtZW50LmlkICsgJy1mbCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluZm8gb2YgY29udGV4dCBtZW51IGluIHRyZWVcbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubWVudSA9IHRoaXMuX2dlbmVyYXRlQ29udGV4dE1lbnUoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmxvYXRpbmcgbGF5ZXIgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZsRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuZmxJZCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElkIG9mIHNlbGVjdGVkIHRyZWUgaXRlbVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVJZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5tZW51LnJlZ2lzdGVyKHRoaXMudHJlZVNlbGVjdG9yLCBiaW5kKHRoaXMuX29uU2VsZWN0LCB0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm1lbnVEYXRhIHx8IHt9KTtcblxuICAgICAgICB0aGlzLnRyZWUub24oJ2NvbnRleHRtZW51JywgdGhpcy5fb25Db250ZXh0TWVudSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fcHJldmVudFRleHRTZWxlY3Rpb24oKTtcblxuICAgICAgICB0aGlzLl9zZXRBUElzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBjdXJyZW50IGNvbnRleHQtbWVudSB2aWV3XG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEByZXF1aXJlcyBDb250ZXh0TWVudVxuICAgICAqIEBwYXJhbSB7QXJyYXkuPE9iamVjdD59IG5ld01lbnVEYXRhIC0gTmV3IGNvbnRleHQgbWVudSBkYXRhXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLmNoYW5nZUNvbnRleHRNZW51KFtcbiAgICAgKiAgICAgIHt0aXRsZTogJ21lbnUxJ30sXG4gICAgICogICAgICB7dGl0bGU6ICdtZW51MicsIGRpc2FibGU6IHRydWV9LFxuICAgICAqICAgICAge3RpdGxlOiAnbWVudTMnLCBtZW51OiBbXG4gICAgICogICAgICBcdHt0aXRsZTogJ3N1Ym1lbnUxJywgZGlzYWJsZTogdHJ1ZX0sXG4gICAgICogICAgICBcdHt0aXRsZTogJ3N1Ym1lbnUyJ31cbiAgICAgKiAgICAgIF19XG4gICAgICogXSk7XG4gICAgICovXG4gICAgY2hhbmdlQ29udGV4dE1lbnU6IGZ1bmN0aW9uKG5ld01lbnVEYXRhKSB7XG4gICAgICAgIHRoaXMubWVudS51bnJlZ2lzdGVyKHRoaXMudHJlZVNlbGVjdG9yKTtcbiAgICAgICAgdGhpcy5tZW51LnJlZ2lzdGVyKHRoaXMudHJlZVNlbGVjdG9yLCBiaW5kKHRoaXMuX29uU2VsZWN0LCB0aGlzKSwgbmV3TWVudURhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIENvbnRleHRNZW51IGZlYXR1cmVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdGhpcy5tZW51LmRlc3Ryb3koKTtcblxuICAgICAgICB0aGlzLl9yZXN0b3JlVGV4dFNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLl9yZW1vdmVGbG9hdGluZ0xheWVyKCk7XG5cbiAgICAgICAgdHJlZS5vZmYodGhpcyk7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChBUElfTElTVCwgZnVuY3Rpb24oYXBpTmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRyZWVbYXBpTmFtZV07XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmxvYXRpbmcgbGF5ZXIgZm9yIGNvbnRleHQgbWVudVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUZsb2F0aW5nTGF5ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZsRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmZsRWxlbWVudC5pZCA9IHRoaXMuZmxJZDtcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZmxFbGVtZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZsb2F0aW5nIGxheWVyIGZvciBjb250ZXh0IG1lbnVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVGbG9hdGluZ0xheWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmZsRWxlbWVudCk7XG4gICAgICAgIHRoaXMuZmxFbGVtZW50ID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgY29udGV4dCBtZW51IGluIHRyZWVcbiAgICAgKiBAcmV0dXJucyB7VHVpQ29udGV4dE1lbnV9IEluc3RhbmNlIG9mIFR1aUNvbnRleHRNZW51XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2VuZXJhdGVDb250ZXh0TWVudTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5mbEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUZsb2F0aW5nTGF5ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgVHVpQ29udGV4dE1lbnUodGhpcy5mbEVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IHRleHQgc2VsZWN0aW9uIG9uIHNlbGVjdGVkIHRyZWUgaXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3ByZXZlbnRUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGVuYWJsZVByb3ApIHtcbiAgICAgICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5zdHlsZVtlbmFibGVQcm9wXSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXN0b3JlIHRleHQgc2VsZWN0aW9uIG9uIHNlbGVjdGVkIHRyZWUgaXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Jlc3RvcmVUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGVuYWJsZVByb3ApIHtcbiAgICAgICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5zdHlsZVtlbmFibGVQcm9wXSA9ICcnO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgb24gdHJlZSBpdGVtXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gTW91c2UgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNvbnRleHRNZW51OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChlKTtcblxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZUlkID0gdGhpcy50cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYmVmb3JlT3BlbkNvbnRleHRNZW51XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBDdXJyZW50IHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbignYmVmb3JlT3BlbkNvbnRleHRNZW51JywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZygnbm9kZUlkOiAnICsgbm9kZUlkKTtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWUuZmlyZSgnYmVmb3JlT3BlbkNvbnRleHRNZW51JywgdGhpcy5zZWxlY3RlZE5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgb24gY29udGV4dCBtZW51XG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gTW91c2UgZXZlbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY21kIC0gT3B0aW9ucyB2YWx1ZSBvZiBzZWxlY3RlZCBjb250ZXh0IG1lbnUgKFwidGl0bGVcInxcImNvbW1hbmRcIilcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vblNlbGVjdDogZnVuY3Rpb24oZSwgY21kKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI3NlbGVjdENvbnRleHRNZW51XG4gICAgICAgICAqIEBwYXJhbSB7e2NtZDogc3RyaW5nLCBub2RlSWQ6IHN0cmluZ319IHRyZWVFdmVudCAtIFRyZWUgZXZlbnRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZS5vbignc2VsZWN0Q29udGV4dE1lbnUnLCBmdW5jdGlvbih0cmVlRXZlbnQpIHtcbiAgICAgICAgICogICAgIHZhciBjbWQgPSB0cmVlRXZlbnQuY21kOyAvLyBrZXkgb2YgY29udGV4dCBtZW51J3MgZGF0YVxuICAgICAgICAgKiAgICAgdmFyIG5vZGVJZCA9IHRyZWVFdmVudC5ub2RlSWQ7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZyhjbWQsIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmVlLmZpcmUoJ3NlbGVjdENvbnRleHRNZW51Jywge1xuICAgICAgICAgICAgY21kOiBjbWQsXG4gICAgICAgICAgICBub2RlSWQ6IHRoaXMuc2VsZWN0ZWROb2RlSWRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBBUEkgb2YgQ29udGV4dE1lbnUgZmVhdHVyZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEFQSXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICB0cmVlW2FwaU5hbWVdID0gYmluZCh0aGlzW2FwaU5hbWVdLCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGV4dE1lbnU7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vdXRpbCcpO1xuXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgdXNlSGVscGVyOiB0cnVlLFxuICAgIGhlbHBlclBvczoge1xuICAgICAgICB5OiAyLFxuICAgICAgICB4OiA1XG4gICAgfSxcbiAgICBhdXRvT3BlbkRlbGF5OiAxNTAwLFxuICAgIGlzU29ydGFibGU6IGZhbHNlLFxuICAgIGhvdmVyQ2xhc3NOYW1lOiAndHVpLXRyZWUtaG92ZXInLFxuICAgIGxpbmVDbGFzc05hbWU6ICd0dWktdHJlZS1saW5lJyxcbiAgICBsaW5lQm91bmRhcnk6IHtcbiAgICAgICAgdG9wOiAyLFxuICAgICAgICBib3R0b206IDJcbiAgICB9XG59O1xudmFyIHJlamVjdGVkVGFnTmFtZXMgPSBbXG4gICAgJ0lOUFVUJyxcbiAgICAnQlVUVE9OJyxcbiAgICAnVUwnXG5dO1xudmFyIHNlbGVjdEtleSA9IHV0aWwudGVzdFByb3AoXG4gICAgWyd1c2VyU2VsZWN0JywgJ1dlYmtpdFVzZXJTZWxlY3QnLCAnT1VzZXJTZWxlY3QnLCAnTW96VXNlclNlbGVjdCcsICdtc1VzZXJTZWxlY3QnXVxuKTtcbnZhciBpbkFycmF5ID0gdHVpLnV0aWwuaW5BcnJheTtcbnZhciBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaDtcbnZhciBBUElfTElTVCA9IFtdO1xuXG4vKipcbiAqIFNldCB0aGUgdHJlZSBkcmFnZ2FibGVcbiAqIEBjbGFzcyBEcmFnZ2FibGVcbiAqIEBwYXJhbSB7VHJlZX0gdHJlZSAtIFRyZWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3B0aW9uc1xuICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VIZWxwZXIgLSBVc2luZyBoZWxwZXIgZmxhZ1xuICogICAgIEBwYXJhbSB7e3g6IG51bWJlciwgeTpudW1iZXJ9fSBvcHRpb25zLmhlbHBlclBvcyAtIEhlbHBlciBwb3NpdGlvblxuICogICAgIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG9wdGlvbnMucmVqZWN0ZWRUYWdOYW1lcyAtIE5vIGRyYWdnYWJsZSB0YWcgbmFtZXNcbiAqICAgICBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBvcHRpb25zLnJlamVjdGVkQ2xhc3NOYW1lcyAtIE5vIGRyYWdnYWJsZSBjbGFzcyBuYW1lc1xuICogICAgIEBwYXJhbSB7bnVtYmVyfSBvcHRpb25zLmF1dG9PcGVuRGVsYXkgLSBEZWxheSB0aW1lIHdoaWxlIGRyYWdnaW5nIHRvIGJlIG9wZW5lZFxuICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5pc1NvcnRhYmxlIC0gRmxhZyBvZiB3aGV0aGVyIHVzaW5nIHNvcnRhYmxlIGRyYWdnaW5nXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaG92ZXJDbGFzc05hbWUgLSBDbGFzcyBuYW1lIGZvciBob3ZlcmVkIG5vZGVcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5saW5lQ2xhc3NOYW1lIC0gQ2xhc3MgbmFtZSBmb3IgbW92aW5nIHBvc2l0aW9uIGxpbmVcbiAqICAgICBAcGFyYW0ge3t0b3A6IG51bWJlciwgYm90dG9tOiBudW1iZXJ9fSBvcHRpb25zLmxpbmVCb3VuZGFyeSAtIEJvdW5kYXJ5IHZhbHVlIGZvciB2aXNpYmxlIG1vdmluZyBsaW5lXG4gKiBAaWdub3JlXG4gKi9cbnZhciBEcmFnZ2FibGUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIERyYWdnYWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBEcmFnZ2FibGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBBUEkgbGlzdCBvZiBEcmFnZ2FibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyZWUgZGF0YVxuICAgICAgICAgKiBAdHlwZSB7VHJlZX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERyYWcgaGVscGVyIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VsZWN0YWJsZSBlbGVtZW50J3MgcHJvcGVydHlcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VsZWN0YWJsZSBlbGVtZW50J3MgcHJvcGVydHkgdmFsdWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlclNlbGVjdFByb3BlcnR5VmFsdWUgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEcmFnZ2luZyBlbGVtZW50J3Mgbm9kZSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3VycmVudCBtb3VzZSBvdmVyZWQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmhvdmVyZWRFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTW92aW5nIGxpbmUgdHlwZSAoXCJ0b3BcIiBvciBcImJvdHRvbVwiKVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tb3ZpbmdMaW5lVHlwZSA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEludm9raW5nIHRpbWUgZm9yIHNldFRpbWVvdXQoKVxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50aW1lciA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRhZyBsaXN0IGZvciByZWplY3RpbmcgdG8gZHJhZ1xuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWplY3RlZFRhZ05hbWVzID0gcmVqZWN0ZWRUYWdOYW1lcy5jb25jYXQob3B0aW9ucy5yZWplY3RlZFRhZ05hbWVzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xhc3MgbmFtZSBsaXN0IGZvciByZWplY3RpbmcgdG8gZHJhZ1xuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWplY3RlZENsYXNzTmFtZXMgPSBbXS5jb25jYXQob3B0aW9ucy5yZWplY3RlZENsYXNzTmFtZXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVc2luZyBoZWxwZXIgZmxhZ1xuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlSGVscGVyID0gb3B0aW9ucy51c2VIZWxwZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhlbHBlciBwb3NpdGlvblxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oZWxwZXJQb3MgPSBvcHRpb25zLmhlbHBlclBvcztcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVsYXkgdGltZSB3aGlsZSBkcmFnZ2luZyB0byBiZSBvcGVuZWRcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYXV0b09wZW5EZWxheSA9IG9wdGlvbnMuYXV0b09wZW5EZWxheTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmxhZyBvZiB3aGV0aGVyIHVzaW5nIHNvcnRhYmxlIGRyYWdnaW5nXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1NvcnRhYmxlID0gb3B0aW9ucy5pc1NvcnRhYmxlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGFzcyBuYW1lIGZvciBtb3VzZSBvdmVyZWQgbm9kZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5ob3ZlckNsYXNzTmFtZSA9IG9wdGlvbnMuaG92ZXJDbGFzc05hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsYXNzIG5hbWUgZm9yIG1vdmluZyBwb3NpdGlvbiBsaW5lXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxpbmVDbGFzc05hbWUgPSBvcHRpb25zLmxpbmVDbGFzc05hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJvdW5kYXJ5IHZhbHVlIGZvciB2aXNpYmxlIG1vdmluZyBsaW5lXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxpbmVCb3VuZGFyeSA9IG9wdGlvbnMubGluZUJvdW5kYXJ5O1xuXG4gICAgICAgIHRoaXMuX2luaXRIZWxwZXIoKTtcblxuICAgICAgICBpZiAodGhpcy5pc1NvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0TW92aW5nTGluZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYXR0YWNoTW91c2Vkb3duKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVzdG9yZVRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5fZGV0YWNoTW91c2Vkb3duKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBoZWxwZXIgZWxlbWVudCBwb3NpdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtb3VzZVBvcyAtIEN1cnJlbnQgbW91c2UgcG9zaXRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jaGFuZ2VIZWxwZXJQb3NpdGlvbjogZnVuY3Rpb24obW91c2VQb3MpIHtcbiAgICAgICAgdmFyIGhlbHBlclN0eWxlID0gdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlO1xuICAgICAgICB2YXIgcG9zID0gdGhpcy50cmVlLnJvb3RFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIGhlbHBlclN0eWxlLnRvcCA9IChtb3VzZVBvcy55IC0gcG9zLnRvcCArIHRoaXMuaGVscGVyUG9zLnkpICsgJ3B4JztcbiAgICAgICAgaGVscGVyU3R5bGUubGVmdCA9IChtb3VzZVBvcy54IC0gcG9zLmxlZnQgKyB0aGlzLmhlbHBlclBvcy54KSArICdweCc7XG4gICAgICAgIGhlbHBlclN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdCBoZWxwZXIgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2luaXRIZWxwZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaGVscGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdmFyIGhlbHBlclN0eWxlID0gaGVscGVyRWxlbWVudC5zdHlsZTtcblxuICAgICAgICBoZWxwZXJTdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIGhlbHBlclN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICAgICAgdGhpcy50cmVlLnJvb3RFbGVtZW50LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoaGVscGVyRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gaGVscGVyRWxlbWVudDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdCBtb3ZpbmcgbGluZSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaW5pdE1vdmluZ0xpbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbGluZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdmFyIGxpbmVTdHlsZSA9IGxpbmVFbGVtZW50LnN0eWxlO1xuXG4gICAgICAgIGxpbmVTdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIGxpbmVTdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cbiAgICAgICAgbGluZUVsZW1lbnQuY2xhc3NOYW1lID0gdGhpcy5saW5lQ2xhc3NOYW1lO1xuXG4gICAgICAgIHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGxpbmVFbGVtZW50KTtcblxuICAgICAgICB0aGlzLmxpbmVFbGVtZW50ID0gbGluZUVsZW1lbnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBoZWxwZXIgY29udGVudHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIEhlbHBlciBjb250ZW50c1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEhlbHBlcjogZnVuY3Rpb24odGV4dCkge1xuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuaW5uZXJIVE1MID0gdGV4dDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIG1vdXNlIGRvd24gZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hdHRhY2hNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9wcmV2ZW50VGV4dFNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLnRyZWUub24oJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2Vkb3duLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGV0YWNoIG1vdXNlZG93biBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2RldGFjaE1vdXNlZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJlZS5vZmYodGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgdGV4dC1zZWxlY3Rpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wcmV2ZW50VGV4dFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMudHJlZS5yb290RWxlbWVudC5zdHlsZTtcblxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy50cmVlLnJvb3RFbGVtZW50LCAnc2VsZWN0c3RhcnQnLCB1dGlsLnByZXZlbnREZWZhdWx0KTtcblxuICAgICAgICB0aGlzLnVzZXJTZWxlY3RQcm9wZXJ0eUtleSA9IHNlbGVjdEtleTtcbiAgICAgICAgdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZSA9IHN0eWxlW3NlbGVjdEtleV07XG5cbiAgICAgICAgc3R5bGVbc2VsZWN0S2V5XSA9ICdub25lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzdG9yZSB0ZXh0LXNlbGVjdGlvblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Jlc3RvcmVUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMudHJlZS5yb290RWxlbWVudCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XG5cbiAgICAgICAgaWYgKHRoaXMudXNlclNlbGVjdFByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUucm9vdEVsZW1lbnQuc3R5bGVbdGhpcy51c2VyU2VsZWN0UHJvcGVydHlLZXldID0gdGhpcy51c2VyU2VsZWN0UHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgaW4gcmVqZWN0ZWRUYWdOYW1lcyBvciBpbiByZWplY3RlZENsYXNzTmFtZXNcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSBUYXJnZXQgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSB0YXJnZXQgaXMgbm90IGRyYWdnYWJsZSBvciBkcmFnZ2FibGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9pc05vdERyYWdnYWJsZTogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIHZhciB0YWdOYW1lID0gdGFyZ2V0LnRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSB1dGlsLmdldENsYXNzKHRhcmdldCkuc3BsaXQoL1xccysvKTtcbiAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICBpZiAoaW5BcnJheSh0YWdOYW1lLCB0aGlzLnJlamVjdGVkVGFnTmFtZXMpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JFYWNoKGNsYXNzTmFtZXMsIGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gaW5BcnJheShjbGFzc05hbWUsIHRoaXMucmVqZWN0ZWRDbGFzc05hbWVzKSAhPT0gLTE7XG5cbiAgICAgICAgICAgIHJldHVybiAhcmVzdWx0O1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIC0gbW91c2Vkb3duXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Nb3VzZWRvd246IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZXZlbnQpO1xuICAgICAgICB2YXIgZWRpdGFibGVGZWF0dXJlID0gdHJlZS5lbmFibGVkRmVhdHVyZXMuRWRpdGFibGU7XG5cbiAgICAgICAgaWYgKHV0aWwuaXNSaWdodEJ1dHRvbihldmVudCkgfHwgdGhpcy5faXNOb3REcmFnZ2FibGUodGFyZ2V0KSB8fFxuICAgICAgICAgICAgKGVkaXRhYmxlRmVhdHVyZSAmJiBlZGl0YWJsZUZlYXR1cmUuaW5wdXRFbGVtZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXRpbC5wcmV2ZW50RGVmYXVsdChldmVudCk7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50Tm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgIGlmICh0aGlzLnVzZUhlbHBlcikge1xuICAgICAgICAgICAgdGhpcy5fc2V0SGVscGVyKHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWUub24oe1xuICAgICAgICAgICAgbW91c2Vtb3ZlOiB0aGlzLl9vbk1vdXNlbW92ZSxcbiAgICAgICAgICAgIG1vdXNldXA6IHRoaXMuX29uTW91c2V1cFxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlbW92ZVxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTW91c2Vtb3ZlOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgbW91c2VQb3MgPSB1dGlsLmdldE1vdXNlUG9zKGV2ZW50KTtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICAgICAgdmFyIG5vZGVJZDtcblxuICAgICAgICBpZiAoIXRoaXMudXNlSGVscGVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jaGFuZ2VIZWxwZXJQb3NpdGlvbihtb3VzZVBvcyk7XG5cbiAgICAgICAgbm9kZUlkID0gdGhpcy50cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG5cbiAgICAgICAgaWYgKG5vZGVJZCkge1xuICAgICAgICAgICAgdGhpcy5fYXBwbHlNb3ZlQWN0aW9uKG5vZGVJZCwgbW91c2VQb3MpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBtb3VzZXVwXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Nb3VzZXVwOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICAgICAgdmFyIG5vZGVJZCA9IHRyZWUuZ2V0Tm9kZUlkRnJvbUVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgdmFyIGluZGV4ID0gLTE7XG5cbiAgICAgICAgaWYgKG5vZGVJZCAmJiB0aGlzLmlzU29ydGFibGUgJiYgdGhpcy5tb3ZpbmdMaW5lVHlwZSkge1xuICAgICAgICAgICAgaW5kZXggPSB0aGlzLl9nZXRJbmRleEZvckluc2VydGluZyhub2RlSWQpO1xuICAgICAgICAgICAgbm9kZUlkID0gdHJlZS5nZXRQYXJlbnRJZChub2RlSWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudE5vZGVJZCAhPT0gbm9kZUlkKSB7XG4gICAgICAgICAgICB0cmVlLm1vdmUodGhpcy5jdXJyZW50Tm9kZUlkLCBub2RlSWQsIGluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFwcGx5IG1vdmUgYWN0aW9uIHRoYXQgYXJlIGRlbGF5IGVmZmVjdCBhbmQgc29ydGFibGUgbW92aW5nIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmlnfSBub2RlSWQgLSBTZWxlY3RlZCB0cmVlIG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbW91c2VQb3MgLSBDdXJyZW50IG1vdXNlIHBvc2l0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXBwbHlNb3ZlQWN0aW9uOiBmdW5jdGlvbihub2RlSWQsIG1vdXNlUG9zKSB7XG4gICAgICAgIHZhciBjdXJyZW50RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGVJZCk7XG4gICAgICAgIHZhciB0YXJnZXRQb3MgPSBjdXJyZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIGhhc0NsYXNzID0gdXRpbC5oYXNDbGFzcyhjdXJyZW50RWxlbWVudCwgdGhpcy5ob3ZlckNsYXNzTmFtZSk7XG4gICAgICAgIHZhciBpc0NvbnRhaW4gPSB0aGlzLl9pc0NvbnRhaW4odGFyZ2V0UG9zLCBtb3VzZVBvcyk7XG4gICAgICAgIHZhciBib3VuZGFyeVR5cGU7XG5cbiAgICAgICAgaWYgKCF0aGlzLmhvdmVyZWRFbGVtZW50ICYmIGlzQ29udGFpbikge1xuICAgICAgICAgICAgdGhpcy5ob3ZlcmVkRWxlbWVudCA9IGN1cnJlbnRFbGVtZW50O1xuICAgICAgICAgICAgdGhpcy5faG92ZXIobm9kZUlkKTtcbiAgICAgICAgfSBlbHNlIGlmICghaGFzQ2xhc3MgfHwgKGhhc0NsYXNzICYmICFpc0NvbnRhaW4pKSB7XG4gICAgICAgICAgICB0aGlzLl91bmhvdmVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc1NvcnRhYmxlKSB7XG4gICAgICAgICAgICBib3VuZGFyeVR5cGUgPSB0aGlzLl9nZXRCb3VuZGFyeVR5cGUodGFyZ2V0UG9zLCBtb3VzZVBvcyk7XG4gICAgICAgICAgICB0aGlzLl9kcmF3Qm91bmRhcnlMaW5lKHRhcmdldFBvcywgYm91bmRhcnlUeXBlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBY3QgdG8gaG92ZXIgb24gdHJlZSBpdGVtXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFRyZWUgbm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2hvdmVyOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdXRpbC5hZGRDbGFzcyh0aGlzLmhvdmVyZWRFbGVtZW50LCB0aGlzLmhvdmVyQ2xhc3NOYW1lKTtcblxuICAgICAgICBpZiAodHJlZS5pc0xlYWYobm9kZUlkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0cmVlLm9wZW4obm9kZUlkKTtcbiAgICAgICAgfSwgdGhpcy5hdXRvT3BlbkRlbGF5KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWN0IHRvIHVuaG92ZXIgb24gdHJlZSBpdGVtXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdW5ob3ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuaG92ZXJlZEVsZW1lbnQsIHRoaXMuaG92ZXJDbGFzc05hbWUpO1xuXG4gICAgICAgIHRoaXMuaG92ZXJlZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLnRpbWVyID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgY29udGFpbmVkIHN0YXRlIG9mIGN1cnJlbnQgdGFyZ2V0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFBvcyAtIFBvc2l0aW9uIG9mIHRyZWUgaXRlbVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtb3VzZVBvcyAtIFBvc2l0aW9uIG9mIG1vdmVkIG1vdXNlXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IENvbnRhaW5lZCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2lzQ29udGFpbjogZnVuY3Rpb24odGFyZ2V0UG9zLCBtb3VzZVBvcykge1xuICAgICAgICB2YXIgdG9wID0gdGFyZ2V0UG9zLnRvcDtcbiAgICAgICAgdmFyIGJvdHRvbSA9IHRhcmdldFBvcy5ib3R0b207XG5cbiAgICAgICAgaWYgKHRoaXMuaXNTb3J0YWJsZSkge1xuICAgICAgICAgICAgdG9wICs9IHRoaXMubGluZUJvdW5kYXJ5LnRvcDtcbiAgICAgICAgICAgIGJvdHRvbSAtPSB0aGlzLmxpbmVCb3VuZGFyeS5ib3R0b207XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0UG9zLmxlZnQgPCBtb3VzZVBvcy54ICYmXG4gICAgICAgICAgICB0YXJnZXRQb3MucmlnaHQgPiBtb3VzZVBvcy54ICYmXG4gICAgICAgICAgICB0b3AgPCBtb3VzZVBvcy55ICYmIGJvdHRvbSA+IG1vdXNlUG9zLnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYm91bmRhcnkgdHlwZSBieSBtb3VzZSBwb3NpdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRQb3MgLSBQb3NpdGlvbiBvZiB0cmVlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbW91c2VQb3MgLSBQb3NpdGlvbiBvZiBtb3ZlZCBtb3VzZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFBvc2l0aW9uIHR5cGUgaW4gYm91bmRhcnlcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRCb3VuZGFyeVR5cGU6IGZ1bmN0aW9uKHRhcmdldFBvcywgbW91c2VQb3MpIHtcbiAgICAgICAgdmFyIHR5cGU7XG5cbiAgICAgICAgaWYgKG1vdXNlUG9zLnkgPCB0YXJnZXRQb3MudG9wICsgdGhpcy5saW5lQm91bmRhcnkudG9wKSB7XG4gICAgICAgICAgICB0eXBlID0gJ3RvcCc7XG4gICAgICAgIH0gZWxzZSBpZiAobW91c2VQb3MueSA+IHRhcmdldFBvcy5ib3R0b20gLSB0aGlzLmxpbmVCb3VuZGFyeS5ib3R0b20pIHtcbiAgICAgICAgICAgIHR5cGUgPSAnYm90dG9tJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEcmF3IGJvdW5kYXJ5IGxpbmUgb24gdHJlZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRQb3MgLSBQb3NpdGlvbiBvZiB0cmVlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYm91bmRhcnlUeXBlIC0gUG9zaXRpb24gdHlwZSBpbiBib3VuZGFyeVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2RyYXdCb3VuZGFyeUxpbmU6IGZ1bmN0aW9uKHRhcmdldFBvcywgYm91bmRhcnlUeXBlKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMubGluZUVsZW1lbnQuc3R5bGU7XG4gICAgICAgIHZhciBsaW5lSGVpZ2h0O1xuICAgICAgICB2YXIgc2Nyb2xsVG9wO1xuXG4gICAgICAgIGlmIChib3VuZGFyeVR5cGUpIHtcbiAgICAgICAgICAgIHNjcm9sbFRvcCA9IHRoaXMudHJlZS5yb290RWxlbWVudC5wYXJlbnROb2RlLnNjcm9sbFRvcCArIHV0aWwuZ2V0V2luZG93U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICBsaW5lSGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLmxpbmVFbGVtZW50Lm9mZnNldEhlaWdodCAvIDIpO1xuXG4gICAgICAgICAgICBzdHlsZS50b3AgPSBNYXRoLnJvdW5kKHRhcmdldFBvc1tib3VuZGFyeVR5cGVdKSAtIGxpbmVIZWlnaHQgKyBzY3JvbGxUb3AgKyAncHgnO1xuICAgICAgICAgICAgc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcbiAgICAgICAgICAgIHRoaXMubW92aW5nTGluZVR5cGUgPSBib3VuZGFyeVR5cGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICB0aGlzLm1vdmluZ0xpbmVUeXBlID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaW5kZXggZm9yIGluc2VydGluZ1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBDdXJyZW50IHNlbGVjdGVkIGhlbHBlciBub2RlIGlkXG4gICAgICogQHJldHVybnMge251bWJlcn0gSW5kZXggbnVtYmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SW5kZXhGb3JJbnNlcnRpbmc6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnRyZWUuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKHRoaXMubW92aW5nTGluZVR5cGUgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBfcmVzZXQgcHJvcGVydGllcyBhbmQgcmVtb3ZlIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pc1NvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmxpbmVFbGVtZW50LnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmhvdmVyZWRFbGVtZW50KSB7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuaG92ZXJlZEVsZW1lbnQsIHRoaXMuaG92ZXJDbGFzc05hbWUpO1xuICAgICAgICAgICAgdGhpcy5ob3ZlcmVkRWxlbWVudCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgICAgICB0aGlzLmN1cnJlbnROb2RlSWQgPSBudWxsO1xuICAgICAgICB0aGlzLm1vdmluZ0xpbmVUeXBlID0gbnVsbDtcblxuICAgICAgICB0aGlzLnRyZWUub2ZmKHRoaXMsICdtb3VzZW1vdmUnKTtcbiAgICAgICAgdGhpcy50cmVlLm9mZih0aGlzLCAnbW91c2V1cCcpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdnYWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL3V0aWwnKTtcbnZhciBhamF4Q29tbWFuZCA9IHJlcXVpcmUoJy4vLi4vY29uc3RzL2FqYXhDb21tYW5kJyk7XG52YXIgc3RhdGVzID0gcmVxdWlyZSgnLi8uLi9jb25zdHMvc3RhdGVzJyk7XG5cbnZhciBBUElfTElTVCA9IFtcbiAgICAnY3JlYXRlQ2hpbGROb2RlJyxcbiAgICAnZWRpdE5vZGUnXG5dO1xudmFyIEVESVRfVFlQRSA9IHtcbiAgICBDUkVBVEU6ICdjcmVhdGUnLFxuICAgIFVQREFURTogJ3VwZGF0ZSdcbn07XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjbGFzcyBFZGl0YWJsZVxuICogQHBhcmFtIHtUcmVlfSB0cmVlIC0gVHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWUgLSBDbGFzc25hbWUgb2YgZWRpdGFibGUgZWxlbWVudFxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmRhdGFLZXkgLSBLZXkgb2Ygbm9kZSBkYXRhIHRvIHNldCB2YWx1ZVxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kYXRhVmFsdWVdIC0gVmFsdWUgb2Ygbm9kZSBkYXRhIHRvIHNldCB2YWx1ZSAoVXNlIFwiY3JlYXRlTm9kZVwiIEFQSSlcbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaW5wdXRDbGFzc05hbWVdIC0gQ2xhc3NuYW1lIG9mIGlucHV0IGVsZW1lbnRcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEVkaXRhYmxlID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBFZGl0YWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBTZWxlY3RhYmxlXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgRWRpdGFibGVcbiAgICAgICAgICovXG4gICAgICAgIGdldEFQSUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFQSV9MSVNULnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyZWUsIG9wdGlvbnMpIHsgLyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgb3B0aW9ucyA9IHR1aS51dGlsLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyZWVcbiAgICAgICAgICogQHR5cGUge1RyZWV9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGFzc25hbWUgb2YgZWRpdGFibGUgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lZGl0YWJsZUNsYXNzTmFtZSA9IG9wdGlvbnMuZWRpdGFibGVDbGFzc05hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEtleSBvZiBub2RlIGRhdGEgdG8gc2V0IHZhbHVlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmRhdGFLZXkgPSBvcHRpb25zLmRhdGFLZXk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmF1bHQgdmFsdWUgZm9yIGNyZWF0aW5nIG5vZGVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZGVmYXVsdFZhbHVlID0gb3B0aW9ucy5kZWZhdWx0VmFsdWUgfHwgJyc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElucHV0IGVsZW1lbnQgZm9yIGNyZWF0ZSBvciBlZGl0XG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaW5wdXRFbGVtZW50ID0gdGhpcy5fY3JlYXRlSW5wdXRFbGVtZW50KG9wdGlvbnMuaW5wdXRDbGFzc05hbWUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBY3Rpb24gbW9kZSAtIGNyZWF0ZSBvciBlZGl0XG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1vZGUgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBLZXl1cCBldmVudCBoYW5kbGVyXG4gICAgICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYm91bmRPbktleXVwID0gdHVpLnV0aWwuYmluZCh0aGlzLl9vbktleXVwLCB0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciBpbnZva2luZyBjdXN0b20gZXZlbnQgb3Igbm90XG4gICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0ludm9raW5nQ3VzdG9tRXZlbnQgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQmx1ciBldmVudCBoYW5kbGVyXG4gICAgICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYm91bmRPbkJsdXIgPSB0dWkudXRpbC5iaW5kKHRoaXMuX29uQmx1ciwgdGhpcyk7XG5cbiAgICAgICAgdHJlZS5vbignZG91YmxlQ2xpY2snLCB0aGlzLl9vbkRvdWJsZUNsaWNrLCB0aGlzKTtcblxuICAgICAgICB0aGlzLl9zZXRBUElzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG5cbiAgICAgICAgdGhpcy5fZGV0YWNoSW5wdXRFbGVtZW50KCk7XG4gICAgICAgIHRyZWUub2ZmKHRoaXMpO1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdHJlZVthcGlOYW1lXTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBjaGlsZCBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEByZXF1aXJlcyBFZGl0YWJsZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkIHRvIGNyZWF0ZSBuZXcgbm9kZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5jcmVhdGVDaGlsZE5vZGUoJ3R1aS10cmVlLW5vZGUtMScpO1xuICAgICAqL1xuICAgIGNyZWF0ZUNoaWxkTm9kZTogZnVuY3Rpb24ocGFyZW50SWQpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciB1c2VBamF4ID0gdHJlZS5lbmFibGVkRmVhdHVyZXMuQWpheDtcbiAgICAgICAgdmFyIG5vZGVJZDtcblxuICAgICAgICB0aGlzLm1vZGUgPSBFRElUX1RZUEUuQ1JFQVRFO1xuXG4gICAgICAgIGlmICh1c2VBamF4KSB7XG4gICAgICAgICAgICB0cmVlLm9uKCdzdWNjZXNzQWpheFJlc3BvbnNlJywgdGhpcy5fb25TdWNjZXNzUmVzcG9uc2UsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0cmVlLmlzTGVhZihwYXJlbnRJZCkgJiZcbiAgICAgICAgICAgIHRyZWUuZ2V0U3RhdGUocGFyZW50SWQpID09PSBzdGF0ZXMubm9kZS5DTE9TRUQpIHtcbiAgICAgICAgICAgIHRyZWUub3BlbihwYXJlbnRJZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLl9hZGQoe30sIHBhcmVudElkKVswXTtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaElucHV0RWxlbWVudChub2RlSWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVkaXQgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcmVxdWlyZXMgRWRpdGFibGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5lZGl0Tm9kZSgndHVpLXRyZWUtbm9kZS0xJyk7XG4gICAgICovXG4gICAgZWRpdE5vZGU6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB0aGlzLm1vZGUgPSBFRElUX1RZUEUuVVBEQVRFO1xuICAgICAgICB0aGlzLl9hdHRhY2hJbnB1dEVsZW1lbnQobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgXCJzdWNjZXNzUmVzcG9uc2VcIlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gQWpheCBjb21tYW5kIHR5cGVcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBub2RlSWRzIC0gQWRkZWQgbm9kZSBpZHMgb24gdHJlZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uU3VjY2Vzc1Jlc3BvbnNlOiBmdW5jdGlvbih0eXBlLCBub2RlSWRzKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgcGFyZW50SWQsIG5vZGVJZDtcblxuICAgICAgICBpZiAodHlwZSA9PT0gYWpheENvbW1hbmQuUkVBRCAmJiBub2RlSWRzKSB7XG4gICAgICAgICAgICBwYXJlbnRJZCA9IHRyZWUuZ2V0UGFyZW50SWQobm9kZUlkc1swXSk7XG4gICAgICAgICAgICBub2RlSWQgPSB0cmVlLl9hZGQoe30sIHBhcmVudElkKVswXTtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaElucHV0RWxlbWVudChub2RlSWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBoYW5kbGVyIFwiZG91YmxlQ2xpY2tcIlxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBNb3VzZSBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCk7XG4gICAgICAgIHZhciBub2RlSWQ7XG5cbiAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmVkaXRhYmxlQ2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgbm9kZUlkID0gdGhpcy50cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCk7XG4gICAgICAgICAgICB0aGlzLmVkaXROb2RlKG5vZGVJZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcjoga2V5dXAgLSBpbnB1dCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBLZXkgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbktleXVwOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHsgLy8ga2V5dXAgXCJlbnRlclwiXG4gICAgICAgICAgICB0aGlzLmlucHV0RWxlbWVudC5ibHVyKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcjogYmx1ciAtIGlucHV0IGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkJsdXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pc0ludm9raW5nQ3VzdG9tRXZlbnQgfHxcbiAgICAgICAgICAgICF0aGlzLmlucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5pc0ludm9raW5nQ3VzdG9tRXZlbnQgPSBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gRURJVF9UWVBFLkNSRUFURSkge1xuICAgICAgICAgICAgdGhpcy5fYWRkRGF0YSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0RGF0YSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpbnB1dCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlucHV0Q2xhc3NOYW1lIC0gQ2xhc3NuYW1lIG9mIGlucHV0IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IElucHV0IGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVJbnB1dEVsZW1lbnQ6IGZ1bmN0aW9uKGlucHV0Q2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0lOUFVUJyk7XG4gICAgICAgIGlmIChpbnB1dENsYXNzTmFtZSkge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gaW5wdXRDbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBpbnB1dCBlbGVtZW50IG9uIHRyZWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2F0dGFjaElucHV0RWxlbWVudDogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgdmFyIHRleHRFbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHRhcmdldCwgdHJlZS5jbGFzc05hbWVzLnRleHRDbGFzcylbMF07XG4gICAgICAgIHZhciBpbnB1dEVsZW1lbnQ7XG5cbiAgICAgICAgaW5wdXRFbGVtZW50ID0gdGhpcy5pbnB1dEVsZW1lbnQ7XG4gICAgICAgIGlucHV0RWxlbWVudC52YWx1ZSA9IHRyZWUuZ2V0Tm9kZURhdGEobm9kZUlkKVt0aGlzLmRhdGFLZXldIHx8ICcnO1xuXG4gICAgICAgIHRleHRFbGVtZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGlucHV0RWxlbWVudCwgdGV4dEVsZW1lbnQpO1xuICAgICAgICB0ZXh0RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgICAgIHRoaXMuaW5wdXRFbGVtZW50ID0gdGFyZ2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpWzBdO1xuXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2tleXVwJywgdGhpcy5ib3VuZE9uS2V5dXApO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdibHVyJywgdGhpcy5ib3VuZE9uQmx1cik7XG5cbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQuZm9jdXMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGV0YWNoIGlucHV0IGVsZW1lbnQgb24gdHJlZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2RldGFjaElucHV0RWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgaW5wdXRFbCA9IHRoaXMuaW5wdXRFbGVtZW50O1xuICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGlucHV0RWwucGFyZW50Tm9kZTtcblxuICAgICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpbnB1dEVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cmVlLmVuYWJsZWRGZWF0dXJlcy5BamF4KSB7XG4gICAgICAgICAgICB0cmVlLm9mZih0aGlzLCAnc3VjY2Vzc0FqYXhSZXNwb25zZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pc0ludm9raW5nQ3VzdG9tRXZlbnQgPSBmYWxzZTtcblxuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdrZXl1cCcsIHRoaXMuYm91bmRPbktleXVwKTtcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAnYmx1cicsIHRoaXMuYm91bmRPbkJsdXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZGF0YSBvZiBpbnB1dCBlbGVtZW50IHRvIG5vZGUgYW5kIGRldGFjaCBpbnB1dCBlbGVtZW50IG9uIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBub2RlSWQgPSB0cmVlLmdldE5vZGVJZEZyb21FbGVtZW50KHRoaXMuaW5wdXRFbGVtZW50KTtcbiAgICAgICAgdmFyIHBhcmVudElkID0gdHJlZS5nZXRQYXJlbnRJZChub2RlSWQpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmlucHV0RWxlbWVudC52YWx1ZSB8fCB0aGlzLmRlZmF1bHRWYWx1ZTtcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVDcmVhdGVDaGlsZE5vZGVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gUmV0dXJuIHZhbHVlIG9mIGNyZWF0aW5nIGlucHV0IGVsZW1lbnRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZVxuICAgICAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJylcbiAgICAgICAgICogIC5vbignYmVmb3JlQ3JlYXRlQ2hpbGROb2RlJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZyh2YWx1ZSk7XG4gICAgICAgICAqICAgICAgcmV0dXJuIGZhbHNlOyAvLyBJdCBjYW5jZWxzXG4gICAgICAgICAqICAgICAgLy8gcmV0dXJuIHRydWU7IC8vIEl0IGV4ZWN1dGUgbmV4dFxuICAgICAgICAgKiAgfSk7XG4gICAgICAgICAqL1xuICAgICAgICBpZiAoIXRoaXMudHJlZS5pbnZva2UoJ2JlZm9yZUNyZWF0ZUNoaWxkTm9kZScsIHZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5pc0ludm9raW5nQ3VzdG9tRXZlbnQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQuZm9jdXMoKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vZGVJZCkge1xuICAgICAgICAgICAgZGF0YVt0aGlzLmRhdGFLZXldID0gdmFsdWU7XG4gICAgICAgICAgICB0cmVlLl9yZW1vdmUobm9kZUlkKTtcbiAgICAgICAgICAgIHRyZWUuYWRkKGRhdGEsIHBhcmVudElkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kZXRhY2hJbnB1dEVsZW1lbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgb2YgaW5wdXQgZWxlbWVudCB0byBub2RlIGFuZCBkZXRhY2ggaW5wdXQgZWxlbWVudCBvbiB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgbm9kZUlkID0gdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0aGlzLmlucHV0RWxlbWVudCk7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMuaW5wdXRFbGVtZW50LnZhbHVlO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2JlZm9yZUVkaXROb2RlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIFJldHVybiB2YWx1ZSBvZiBlZGl0aW5nIGlucHV0IGVsZW1lbnRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdHJlZVxuICAgICAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJylcbiAgICAgICAgICogIC5vbignYmVmb3JlRWRpdE5vZGUnLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKHZhbHVlKTtcbiAgICAgICAgICogICAgICByZXR1cm4gZmFsc2U7IC8vIEl0IGNhbmNlbHNcbiAgICAgICAgICogICAgICAvLyByZXR1cm4gdHJ1ZTsgLy8gSXQgZXhlY3V0ZSBuZXh0XG4gICAgICAgICAqICB9KTtcbiAgICAgICAgICovXG4gICAgICAgIGlmICghdGhpcy50cmVlLmludm9rZSgnYmVmb3JlRWRpdE5vZGUnLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuaXNJbnZva2luZ0N1c3RvbUV2ZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRFbGVtZW50LmZvY3VzKCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlSWQpIHtcbiAgICAgICAgICAgIGRhdGFbdGhpcy5kYXRhS2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgdHJlZS5zZXROb2RlRGF0YShub2RlSWQsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RldGFjaElucHV0RWxlbWVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgYXBpcyBvZiBzZWxlY3RhYmxlIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRBUElzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBiaW5kID0gdHVpLnV0aWwuYmluZDtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICB0cmVlW2FwaU5hbWVdID0gYmluZCh0aGlzW2FwaU5hbWVdLCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdGFibGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi91dGlsJyk7XG5cbnZhciBBUElfTElTVCA9IFtcbiAgICAgICAgJ3NlbGVjdCcsXG4gICAgICAgICdnZXRTZWxlY3RlZE5vZGVJZCcsXG4gICAgICAgICdkZXNlbGVjdCdcbiAgICBdLFxuICAgIGRlZmF1bHRzID0ge1xuICAgICAgICBzZWxlY3RlZENsYXNzTmFtZTogJ3R1aS10cmVlLXNlbGVjdGVkJ1xuICAgIH07XG5cbi8qKlxuICogU2V0IHRoZSB0cmVlIHNlbGVjdGFibGVcbiAqIEBjbGFzcyBTZWxlY3RhYmxlXG4gKiBAcGFyYW0ge1RyZWV9IHRyZWUgLSBUcmVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnNlbGVjdGVkQ2xhc3NOYW1lIC0gQ2xhc3NuYW1lIGZvciBzZWxlY3RlZCBub2RlLlxuICogQGlnbm9yZVxuICovXG52YXIgU2VsZWN0YWJsZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgU2VsZWN0YWJsZS5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgc3RhdGljOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBtZW1iZXJPZiBTZWxlY3RhYmxlXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gQVBJIGxpc3Qgb2YgU2VsZWN0YWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QVBJTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQVBJX0xJU1Quc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24odHJlZSwgb3B0aW9ucykgeyAvKmVzbGludC1lbmFibGUqL1xuICAgICAgICBvcHRpb25zID0gdHVpLnV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZENsYXNzTmFtZSA9IG9wdGlvbnMuc2VsZWN0ZWRDbGFzc05hbWU7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2RlSWQgPSBudWxsO1xuXG4gICAgICAgIHRyZWUub24oe1xuICAgICAgICAgICAgc2luZ2xlQ2xpY2s6IHRoaXMub25TaW5nbGVDbGljayxcbiAgICAgICAgICAgIGFmdGVyRHJhdzogdGhpcy5vbkFmdGVyRHJhd1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgdGhpcy5fc2V0QVBJcygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgYXBpcyBvZiBzZWxlY3RhYmxlIHRyZWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRBUElzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBiaW5kID0gdHVpLnV0aWwuYmluZDtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKEFQSV9MSVNULCBmdW5jdGlvbihhcGlOYW1lKSB7XG4gICAgICAgICAgICB0cmVlW2FwaU5hbWVdID0gYmluZCh0aGlzW2FwaU5hbWVdLCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgdGhpcyBtb2R1bGVcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUsXG4gICAgICAgICAgICBub2RlRWxlbWVudCA9IHRoaXMuZ2V0UHJldkVsZW1lbnQoKTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgdHJlZS5vZmYodGhpcyk7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goQVBJX0xJU1QsIGZ1bmN0aW9uKGFwaU5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0cmVlW2FwaU5hbWVdO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGhhbmRsZXIgXCJzaW5nbGVDbGlja1wiXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIE1vdXNlIGV2ZW50XG4gICAgICovXG4gICAgb25TaW5nbGVDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGV2ZW50KSxcbiAgICAgICAgICAgIG5vZGVJZCA9IHRoaXMudHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudCh0YXJnZXQpO1xuXG4gICAgICAgIHRoaXMuc2VsZWN0KG5vZGVJZCwgdGFyZ2V0KTtcbiAgICB9LFxuXG4gICAgLyogZXNsaW50LWRpc2FibGUgdmFsaWQtanNkb2NcbiAgICAgICAgSWdub3JlIFwidGFyZ2V0XCIgcGFyYW1ldGVyIGFubm90YXRpb24gZm9yIEFQSSBwYWdlXG4gICAgICAgIFwidHJlZS5zZWxlY3Qobm9kZUlkKVwiXG4gICAgICovXG4gICAgLyoqXG4gICAgICogU2VsZWN0IG5vZGUgaWYgdGhlIGZlYXR1cmUtXCJTZWxlY3RhYmxlXCIgaXMgZW5hYmxlZC5cbiAgICAgKiBAYXBpXG4gICAgICogQG1lbWJlck9mIFRyZWUucHJvdG90eXBlXG4gICAgICogQHJlcXVpcmVzIFNlbGVjdGFibGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5zZWxlY3QoJ3R1aS10cmVlLW5vZGUtMycpO1xuICAgICAqL1xuICAgIC8qIGVzbGludC1lbmFibGUgdmFsaWQtanNkb2MgKi9cbiAgICBzZWxlY3Q6IGZ1bmN0aW9uKG5vZGVJZCwgdGFyZ2V0KSB7XG4gICAgICAgIHZhciB0cmVlLCBwcmV2RWxlbWVudCwgbm9kZUVsZW1lbnQsXG4gICAgICAgICAgICBzZWxlY3RlZENsYXNzTmFtZSwgcHJldk5vZGVJZDtcblxuICAgICAgICBpZiAoIW5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZSA9IHRoaXMudHJlZTtcbiAgICAgICAgcHJldkVsZW1lbnQgPSB0aGlzLmdldFByZXZFbGVtZW50KCk7XG4gICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgc2VsZWN0ZWRDbGFzc05hbWUgPSB0aGlzLnNlbGVjdGVkQ2xhc3NOYW1lO1xuICAgICAgICBwcmV2Tm9kZUlkID0gdGhpcy5zZWxlY3RlZE5vZGVJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVTZWxlY3RcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHByZXZOb2RlSWQgLSBQcmV2aW91cyBzZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAqIEBwYXJhbSB7RWxlbWVudHx1bmRlZmluZWR9IHRhcmdldCAtIFRhcmdldCBlbGVtZW50XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWVcbiAgICAgICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcbiAgICAgICAgICogIC5vbignYmVmb3JlU2VsZWN0JywgZnVuY3Rpb24obm9kZUlkLCBwcmV2Tm9kZUlkLCB0YXJnZXQpIHtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZygnc2VsZWN0ZWQgbm9kZTogJyArIG5vZGVJZCk7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3ByZXZpb3VzIHNlbGVjdGVkIG5vZGU6ICcgKyBwcmV2Tm9kZUlkKTtcbiAgICAgICAgICogICAgICBjb25zb2xlLmxvZygndGFyZ2V0IGVsZW1lbnQ6ICcgKyB0YXJnZXQpO1xuICAgICAgICAgKiAgICAgIHJldHVybiBmYWxzZTsgLy8gSXQgY2FuY2VscyBcInNlbGVjdFwiXG4gICAgICAgICAqICAgICAgLy8gcmV0dXJuIHRydWU7IC8vIEl0IGZpcmVzIFwic2VsZWN0XCJcbiAgICAgICAgICogIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRyZWUuaW52b2tlKCdiZWZvcmVTZWxlY3QnLCBub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCkpIHtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MocHJldkVsZW1lbnQsIHNlbGVjdGVkQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3Mobm9kZUVsZW1lbnQsIHNlbGVjdGVkQ2xhc3NOYW1lKTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgKiBAZXZlbnQgVHJlZSNzZWxlY3RcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBTZWxlY3RlZCBub2RlIGlkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJldk5vZGVJZCAtIFByZXZpb3VzIHNlbGVjdGVkIG5vZGUgaWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RWxlbWVudHx1bmRlZmluZWR9IHRhcmdldCAtIFRhcmdldCBlbGVtZW50XG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdHJlZVxuICAgICAgICAgICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJylcbiAgICAgICAgICAgICAqICAub24oJ3NlbGVjdCcsIGZ1bmN0aW9uKG5vZGVJZCwgcHJldk5vZGVJZCwgdGFyZ2V0KSB7XG4gICAgICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdzZWxlY3RlZCBub2RlOiAnICsgbm9kZUlkKTtcbiAgICAgICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3ByZXZpb3VzIHNlbGVjdGVkIG5vZGU6ICcgKyBwcmV2Tm9kZUlkKTtcbiAgICAgICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ3RhcmdldCBlbGVtZW50OiAnICsgdGFyZ2V0KTtcbiAgICAgICAgICAgICAqICB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdHJlZS5maXJlKCdzZWxlY3QnLCBub2RlSWQsIHByZXZOb2RlSWQsIHRhcmdldCk7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZUlkID0gbm9kZUlkO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwcmV2aW91cyBzZWxlY3RlZCBub2RlIGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IE5vZGUgZWxlbWVudFxuICAgICAqL1xuICAgIGdldFByZXZFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuc2VsZWN0ZWROb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAbWVtYmVyT2YgVHJlZS5wcm90b3R5cGVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzZWxlY3RlZCBub2RlIGlkXG4gICAgICovXG4gICAgZ2V0U2VsZWN0ZWROb2RlSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZE5vZGVJZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVzZWxlY3Qgbm9kZSBieSBpZFxuICAgICAqIEBtZW1iZXJPZiBUcmVlLnByb3RvdHlwZVxuICAgICAqIEByZXF1aXJlcyBTZWxlY3RhYmxlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZGVzZWxlY3QoJ3R1aS10cmVlLW5vZGUtMycpO1xuICAgICAqL1xuICAgIGRlc2VsZWN0OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGVFbGVtZW50O1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMudHJlZTtcblxuICAgICAgICBpZiAoIW5vZGVJZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpO1xuXG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Mobm9kZUVsZW1lbnQsIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZUlkID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGV2ZW50IFRyZWUjZGVzZWxlY3RcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIERlc2VsZWN0ZWQgbm9kZSBpZFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlXG4gICAgICAgICAqICAuZW5hYmxlRmVhdHVyZSgnU2VsZWN0YWJsZScpXG4gICAgICAgICAqICAub24oJ2Rlc2VsZWN0JywgZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ2Rlc2VsZWN0ZWQgbm9kZTogJyArIG5vZGVJZCk7XG4gICAgICAgICAqICB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRyZWUuZmlyZSgnZGVzZWxlY3QnLCBub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgaGFuZGxlciAtIFwiYWZ0ZXJEcmF3XCJcbiAgICAgKi9cbiAgICBvbkFmdGVyRHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlRWxlbWVudCA9IHRoaXMuZ2V0UHJldkVsZW1lbnQoKTtcblxuICAgICAgICBpZiAobm9kZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3Mobm9kZUVsZW1lbnQsIHRoaXMuc2VsZWN0ZWRDbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0YWJsZTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBSZW5kZXIgdHJlZSBhbmQgdXBkYXRlIHRyZWUuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiBMYWIgPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXG4gICAgZGVmYXVsdE9wdGlvbiA9IHJlcXVpcmUoJy4vY29uc3RzL2RlZmF1bHRPcHRpb24nKSxcbiAgICBzdGF0ZXMgPSByZXF1aXJlKCcuL2NvbnN0cy9zdGF0ZXMnKSxcbiAgICBtZXNzYWdlcyA9IHJlcXVpcmUoJy4vY29uc3RzL21lc3NhZ2VzJyksXG4gICAgb3V0ZXJUZW1wbGF0ZSA9IHJlcXVpcmUoJy4vY29uc3RzL291dGVyVGVtcGxhdGUnKSxcbiAgICBhamF4Q29tbWFuZCA9IHJlcXVpcmUoJy4vY29uc3RzL2FqYXhDb21tYW5kJyksXG4gICAgVHJlZU1vZGVsID0gcmVxdWlyZSgnLi90cmVlTW9kZWwnKSxcbiAgICBTZWxlY3RhYmxlID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9zZWxlY3RhYmxlJyksXG4gICAgRHJhZ2dhYmxlID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9kcmFnZ2FibGUnKSxcbiAgICBFZGl0YWJsZSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvZWRpdGFibGUnKSxcbiAgICBDaGVja2JveCA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvY2hlY2tib3gnKSxcbiAgICBDb250ZXh0TWVudSA9IHJlcXVpcmUoJy4vZmVhdHVyZXMvY29udGV4dE1lbnUnKSxcbiAgICBBamF4ID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9hamF4Jyk7XG5cbnZhciBub2RlU3RhdGVzID0gc3RhdGVzLm5vZGUsXG4gICAgZmVhdHVyZXMgPSB7XG4gICAgICAgIFNlbGVjdGFibGU6IFNlbGVjdGFibGUsXG4gICAgICAgIERyYWdnYWJsZTogRHJhZ2dhYmxlLFxuICAgICAgICBFZGl0YWJsZTogRWRpdGFibGUsXG4gICAgICAgIENoZWNrYm94OiBDaGVja2JveCxcbiAgICAgICAgQ29udGV4dE1lbnU6IENvbnRleHRNZW51LFxuICAgICAgICBBamF4OiBBamF4XG4gICAgfSxcbiAgICBzbmlwcGV0ID0gdHVpLnV0aWwsXG4gICAgZXh0ZW5kID0gc25pcHBldC5leHRlbmQsXG4gICAgVElNRU9VVF9UT19ESUZGRVJFTlRJQVRFX0NMSUNLX0FORF9EQkxDTElDSyA9IDIwMCxcbiAgICBNT1VTRV9NT1ZJTkdfVEhSRVNIT0xEID0gNTtcbi8qKlxuICogQ3JlYXRlIHRyZWUgbW9kZWwgYW5kIGluamVjdCBkYXRhIHRvIG1vZGVsXG4gKiBAY2xhc3MgVHJlZVxuICogQG1peGVzIHR1aS51dGlsLkN1c3RvbUV2ZW50c1xuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgQSBkYXRhIHRvIGJlIHVzZWQgb24gdHJlZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnNcbiAqICAgICBAcGFyYW0ge0hUTUxFbGVtZW50fSBbb3B0aW9ucy5yb290RWxlbWVudF0gUm9vdCBlbGVtZW50IChJdCBzaG91bGQgYmUgJ1VMJyBlbGVtZW50KVxuICogICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5ub2RlSWRQcmVmaXhdIEEgZGVmYXVsdCBwcmVmaXggb2YgYSBub2RlXG4gKiAgICAgQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLm5vZGVEZWZhdWx0U3RhdGVdIEEgZGVmYXVsdCBzdGF0ZSBvZiBhIG5vZGVcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMudGVtcGxhdGVdIEEgbWFya3VwIHNldCB0byBtYWtlIGVsZW1lbnRcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlLmludGVybmFsTm9kZV0gSFRNTCB0ZW1wbGF0ZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGUubGVhZk5vZGVdIEhUTUwgdGVtcGxhdGVcbiAqICAgICBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuc3RhdGVMYWJlbHNdIFRvZ2dsZSBidXR0b24gc3RhdGUgbGFiZWxcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0YXRlTGFiZWxzLm9wZW5lZF0gU3RhdGUtT1BFTkVEIGxhYmVsIChUZXh0IG9yIEhUTUwpXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdGF0ZUxhYmVscy5jbG9zZWRdIFN0YXRlLUNMT1NFRCBsYWJlbCAoVGV4dCBvciBIVE1MKVxuICogICAgIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5jbGFzc05hbWVzXSBDbGFzcyBuYW1lcyBmb3IgdHJlZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5ub2RlQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy5sZWFmQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3IgbGVhZiBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLm9wZW5lZENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIG9wZW5lZCBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLmNsb3NlZENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIGNsb3NlZCBub2RlXG4gKiAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jbGFzc05hbWVzLnRleHRDbGFzc10gQSBjbGFzcyBuYW1lIHRoYXQgZm9yIHRleHRFbGVtZW50IGluIG5vZGVcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNsYXNzTmFtZXMuc3VidHJlZUNsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIHN1YnRyZWUgaW4gaW50ZXJuYWwgbm9kZVxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY2xhc3NOYW1lcy50b2dnbGVCdG5DbGFzc10gQSBjbGFzcyBuYW1lIGZvciB0b2dnbGUgYnV0dG9uIGluIGludGVybmFsIG5vZGVcbiAqICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5yZW5kZXJUZW1wbGF0ZV0gRnVuY3Rpb24gZm9yIHJlbmRlcmluZyB0ZW1wbGF0ZVxuICogQGV4YW1wbGVcbiAqIC8vRGVmYXVsdCBvcHRpb25zOlxuICogLy8ge1xuICogLy8gICAgIG5vZGVJZFByZWZpeDogJ3R1aS10cmVlLW5vZGUtJ1xuICogLy8gICAgIG5vZGVEZWZhdWx0U3RhdGU6ICdjbG9zZWQnLFxuICogLy8gICAgIHN0YXRlTGFiZWxzOiB7XG4gKiAvLyAgICAgICAgIG9wZW5lZDogJy0nLFxuICogLy8gICAgICAgICBjbG9zZWQ6ICcrJ1xuICogLy8gICAgIH0sXG4gKiAvLyAgICAgY2xhc3NOYW1lczoge1xuICogLy8gICAgICAgICBub2RlQ2xhc3M6ICd0dWktdHJlZS1ub2RlJyxcbiAqIC8vICAgICAgICAgbGVhZkNsYXNzOiAndHVpLXRyZWUtbGVhZicsXG4gKiAvLyAgICAgICAgIG9wZW5lZENsYXNzOiAndHVpLXRyZWUtb3BlbmVkJyxcbiAqIC8vICAgICAgICAgY2xvc2VkQ2xhc3M6ICd0dWktdHJlZS1jbG9zZWQnLFxuICogLy8gICAgICAgICBzdWJ0cmVlQ2xhc3M6ICd0dWktdHJlZS1zdWJ0cmVlJyxcbiAqIC8vICAgICAgICAgdG9nZ2xlQnRuQ2xhc3M6ICd0dWktdHJlZS10b2dnbGVCdG4nLFxuICogLy8gICAgICAgICB0ZXh0Q2xhc3M6ICd0dWktdHJlZS10ZXh0JyxcbiAqIC8vICAgICB9LFxuICogLy8gICAgIHRlbXBsYXRlOiB7XG4gKiAvLyAgICAgICAgIGludGVybmFsTm9kZTpcbiAqIC8vICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7dG9nZ2xlQnRuQ2xhc3N9fVwiPnt7c3RhdGVMYWJlbH19PC9idXR0b24+JyArXG4gKiAvLyAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ7e3RleHRDbGFzc319XCI+e3t0ZXh0fX08L3NwYW4+JyArXG4gKiAvLyAgICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tzdWJ0cmVlQ2xhc3N9fVwiPnt7Y2hpbGRyZW59fTwvdWw+J1xuICogLy8gICAgICAgICBsZWFmTm9kZTpcbiAqIC8vICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInt7dGV4dENsYXNzfX1cIj57e3RleHR9fTwvc3Bhbj4nICtcbiAqIC8vICAgICB9XG4gKiAvLyB9XG4gKiAvL1xuICpcbiAqIHZhciBkYXRhID0gW1xuICogICAgIHt0ZXh0OiAncm9vdEEnLCBjaGlsZHJlbjogW1xuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMUEnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTFCJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0xQyd9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMUQnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJBJywgY2hpbGRyZW46IFtcbiAqICAgICAgICAgICAgIHt0ZXh0OidzdWJfMUEnLCBjaGlsZHJlbjpbXG4gKiAgICAgICAgICAgICAgICAge3RleHQ6J3N1Yl9zdWJfMUEnfVxuICogICAgICAgICAgICAgXX0sXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViXzJBJ31cbiAqICAgICAgICAgXX0sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0yQid9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtMkMnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTJEJ30sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zQScsIGNoaWxkcmVuOiBbXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViM19hJ30sXG4gKiAgICAgICAgICAgICB7dGV4dDonc3ViM19iJ31cbiAqICAgICAgICAgXX0sXG4gKiAgICAgICAgIHt0ZXh0OiAncm9vdC0zQid9LFxuICogICAgICAgICB7dGV4dDogJ3Jvb3QtM0MnfSxcbiAqICAgICAgICAge3RleHQ6ICdyb290LTNEJ31cbiAqICAgICBdfSxcbiAqICAgICB7dGV4dDogJ3Jvb3RCJywgY2hpbGRyZW46IFtcbiAqICAgICAgICAge3RleHQ6J0Jfc3ViMSd9LFxuICogICAgICAgICB7dGV4dDonQl9zdWIyJ30sXG4gKiAgICAgICAgIHt0ZXh0OidiJ31cbiAqICAgICBdfVxuICogXTtcbiAqXG4gKiB2YXIgdHJlZTEgPSBuZXcgdHVpLmNvbXBvbmVudC5UcmVlKGRhdGEsIHtcbiAqICAgICByb290RWxlbWVudDogJ3RyZWVSb290JywgLy8gb3IgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyZWVSb290JylcbiAqICAgICBub2RlRGVmYXVsdFN0YXRlOiAnb3BlbmVkJyxcbiAqXG4gKiAgICAgLy8gPT09PT09PT09IE9wdGlvbjogT3ZlcnJpZGUgdGVtcGxhdGUgcmVuZGVyZXIgPT09PT09PT09PT1cbiAqXG4gKiAgICAgdGVtcGxhdGU6IHsgLy8gdGVtcGxhdGUgZm9yIE11c3RhY2hlIGVuZ2luZVxuICogICAgICAgICBpbnRlcm5hbE5vZGU6XG4gKiAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e3RvZ2dsZUJ0bkNsYXNzfX1cIj57e3N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPicgK1xuICogICAgICAgICAgICAgJzx1bCBjbGFzcz1cInt7c3VidHJlZUNsYXNzfX1cIj57e2NoaWxkcmVufX08L3VsPicsXG4gKiAgICAgICAgIGxlYWZOb2RlOlxuICogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwie3t0ZXh0Q2xhc3N9fVwiPnt7dGV4dH19PC9zcGFuPidcbiAqICAgICB9LFxuICogICAgIHJlbmRlclRlbXBsYXRlOiBmdW5jdGlvbih0bXBsLCBwcm9wcykge1xuICogICAgICAgICAvLyBNdXN0YWNoZSB0ZW1wbGF0ZSBlbmdpbmVcbiAqICAgICAgICAgcmV0dXJuIE11c3RhY2hlLnJlbmRlcih0bXBsLCBwcm9wcyk7XG4gKiAgICAgfVxuICogfSk7XG4gKlxuICogQHR1dG9yaWFsIGRlZmF1bHRcbiAqIEB0dXRvcmlhbCBkZXB0aExhYmVsXG4gKiBAdHV0b3JpYWwgc2VsZWN0YWJsZU5vZGVzXG4gKiBAdHV0b3JpYWwgY2hlY2tcbiAqIEB0dXRvcmlhbCBjdHhNZW51XG4gKiBAdHV0b3JpYWwgYWpheEZlYXR1cmVcbiAqKi9cbnZhciBUcmVlID0gc25pcHBldC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IGNsYXNzIG5hbWVzXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3QuPHN0cmluZywgc3RyaW5nPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY2xhc3NOYW1lcyA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbi5jbGFzc05hbWVzLCBvcHRpb25zLmNsYXNzTmFtZXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IHRlbXBsYXRlXG4gICAgICAgICAqIEB0eXBlIHt7aW50ZXJuYWxOb2RlOiBzdHJpbmcsIGxlYWZOb2RlOiBzdHJpbmd9fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbi50ZW1wbGF0ZSwgb3B0aW9ucy50ZW1wbGF0ZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJvb3QgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gb3B0aW9ucy5yb290RWxlbWVudDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVG9nZ2xlIGJ1dHRvbiBzdGF0ZSBsYWJlbFxuICAgICAgICAgKiBAdHlwZSB7e29wZW5lZDogc3RyaW5nLCBjbG9zZWQ6IHN0cmluZ319XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnN0YXRlTGFiZWxzID0gb3B0aW9ucy5zdGF0ZUxhYmVscztcblxuICAgICAgICAvKipcbiAgICAgICAgICogTWFrZSB0cmVlIG1vZGVsXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTW9kZWx9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFRyZWVNb2RlbChkYXRhLCBvcHRpb25zKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRW5hYmxlZCBmZWF0dXJlc1xuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIG9iamVjdD59XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmVuYWJsZWRGZWF0dXJlcyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGljayB0aW1lciB0byBwcmV2ZW50IGNsaWNrLWR1cGxpY2F0aW9uIHdpdGggZG91YmxlIGNsaWNrXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUbyBwcmV2ZW50IGNsaWNrIGV2ZW50IGlmIG1vdXNlIG1vdmVkIGJlZm9yZSBtb3VzZXVwLlxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbW91c2VNb3ZpbmdGbGFnID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbmRlciB0ZW1wbGF0ZVxuICAgICAgICAgKiBJdCBjYW4gYmUgb3ZlcnJvZGUgYnkgdXNlcidzIHRlbXBsYXRlIGVuZ2luZS5cbiAgICAgICAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcmVuZGVyVGVtcGxhdGUgPSBvcHRpb25zLnJlbmRlclRlbXBsYXRlIHx8IHV0aWwucmVuZGVyVGVtcGxhdGU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRydWUgd2hlbiBhIG5vZGUgaXMgbW92aW5nXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKHtcbiAgICAgICAgICogICAgIGJlZm9yZURyYXc6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgKiAgICAgICAgIGlmICh0cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAqICAgICAgICAgfVxuICAgICAgICAgKiAgICAgICAgIC8vLi5cbiAgICAgICAgICogICAgIH0sXG4gICAgICAgICAqICAgICAvLy4uLi5cbiAgICAgICAgICogfSk7XG4gICAgICAgICAqIHRyZWUubW92ZSgndHVpLXRyZWUtbm9kZS0xJywgJ3R1aS10cmVlLW5vZGUtMicpO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc01vdmluZ05vZGUgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9zZXRSb290KCk7XG4gICAgICAgIHRoaXMuX2RyYXcodGhpcy5nZXRSb290Tm9kZUlkKCkpO1xuICAgICAgICB0aGlzLl9zZXRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJvb3QgZWxlbWVudCBvZiB0cmVlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Um9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByb290RWwgPSB0aGlzLnJvb3RFbGVtZW50O1xuXG4gICAgICAgIGlmIChzbmlwcGV0LmlzU3RyaW5nKHJvb3RFbCkpIHtcbiAgICAgICAgICAgIHJvb3RFbCA9IHRoaXMucm9vdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChyb290RWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzbmlwcGV0LmlzSFRNTE5vZGUocm9vdEVsKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2VzLklOVkFMSURfUk9PVF9FTEVNRU5UKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcmlnaW5hbFBhcmVudElkIC0gT3JpZ2luYWwgcGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFyZW50SWQgLSBOZXcgcGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4XSAtIFN0YXJ0IGluZGV4IG51bWJlciBmb3IgaW5zZXJ0aW5nXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Nb3ZlOiBmdW5jdGlvbihub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkLCBpbmRleCkge1xuICAgICAgICB0aGlzLl9kcmF3KG9yaWdpbmFsUGFyZW50SWQpO1xuICAgICAgICB0aGlzLl9kcmF3KG5ld1BhcmVudElkKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNtb3ZlXG4gICAgICAgICAqIEBwYXJhbSB7e25vZGVJZDogc3RyaW5nLCBvcmlnaW5hbFBhcmVudElkOiBzdHJpbmcsIG5ld1BhcmVudElkOiBzdHJpbmcsIGluZGV4OiBudW1iZXJ9fSB0cmVlRXZlbnQgLSBFdmVudFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB0cmVlLm9uKCdtb3ZlJywgZnVuY3Rpb24odHJlZUV2ZW50KSB7XG4gICAgICAgICAqICAgICB2YXIgbm9kZUlkID0gdHJlZUV2ZW50Lm5vZGVJZDtcbiAgICAgICAgICogICAgIHZhciBvcmlnaW5hbFBhcmVudElkID0gdHJlZUV2ZW50Lm9yaWdpbmFsUGFyZW50SWQ7XG4gICAgICAgICAqICAgICB2YXIgbmV3UGFyZW50SWQgPSB0cmVlRXZlbnQubmV3UGFyZW50SWQ7XG4gICAgICAgICAqICAgICB2YXIgaW5kZXggPSB0cmVlRXZlbnQuaW5kZXg7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZyhub2RlSWQsIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudElkLCBpbmRleCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywge1xuICAgICAgICAgICAgbm9kZUlkOiBub2RlSWQsXG4gICAgICAgICAgICBvcmlnaW5hbFBhcmVudElkOiBvcmlnaW5hbFBhcmVudElkLFxuICAgICAgICAgICAgbmV3UGFyZW50SWQ6IG5ld1BhcmVudElkLFxuICAgICAgICAgICAgaW5kZXg6IGluZGV4XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZXZlbnQgaGFuZGxlcnNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLm9uKHtcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5fZHJhdyxcbiAgICAgICAgICAgIG1vdmU6IHRoaXMuX29uTW92ZVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdEVsZW1lbnQsICdjbGljaycsIHNuaXBwZXQuYmluZCh0aGlzLl9vbkNsaWNrLCB0aGlzKSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnbW91c2Vkb3duJywgc25pcHBldC5iaW5kKHRoaXMuX29uTW91c2Vkb3duLCB0aGlzKSk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3RFbGVtZW50LCAnZGJsY2xpY2snLCBzbmlwcGV0LmJpbmQodGhpcy5fb25Eb3VibGVDbGljaywgdGhpcykpO1xuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290RWxlbWVudCwgJ2NvbnRleHRtZW51Jywgc25pcHBldC5iaW5kKHRoaXMuX29uQ29udGV4dE1lbnUsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGNvbnRleHRtZW51XG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBtb3VzZUV2ZW50IC0gQ29udGV4dG1lbnUgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNvbnRleHRNZW51OiBmdW5jdGlvbihtb3VzZUV2ZW50KSB7XG4gICAgICAgIHRoaXMuZmlyZSgnY29udGV4dG1lbnUnLCBtb3VzZUV2ZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIG1vdXNlZG93blxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZG93bkV2ZW50IC0gTW91c2UgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbk1vdXNlZG93bjogZnVuY3Rpb24oZG93bkV2ZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIGNsaWVudFggPSBkb3duRXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGNsaWVudFkgPSBkb3duRXZlbnQuY2xpZW50WSxcbiAgICAgICAgICAgIGFicyA9IE1hdGguYWJzO1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uTW91c2VNb3ZlKG1vdmVFdmVudCkge1xuICAgICAgICAgICAgdmFyIG5ld0NsaWVudFggPSBtb3ZlRXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICBuZXdDbGllbnRZID0gbW92ZUV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGlmIChhYnMobmV3Q2xpZW50WCAtIGNsaWVudFgpICsgYWJzKG5ld0NsaWVudFkgLSBjbGllbnRZKSA+IE1PVVNFX01PVklOR19USFJFU0hPTEQpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmZpcmUoJ21vdXNlbW92ZScsIG1vdmVFdmVudCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fbW91c2VNb3ZpbmdGbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvbk1vdXNlVXAodXBFdmVudCkge1xuICAgICAgICAgICAgc2VsZi5maXJlKCdtb3VzZXVwJywgdXBFdmVudCk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Nb3VzZU91dChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRvRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNlbGYuZmlyZSgnbW91c2V1cCcsIGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX21vdXNlTW92aW5nRmxhZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZpcmUoJ21vdXNlZG93bicsIGRvd25FdmVudCk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgLSBjbGlja1xuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgLSBDbGljayBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChldmVudCksXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAodXRpbC5pc1JpZ2h0QnV0dG9uKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3MpKSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZSh0aGlzLmdldE5vZGVJZEZyb21FbGVtZW50KHRhcmdldCkpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuY2xpY2tUaW1lciAmJiAhdGhpcy5fbW91c2VNb3ZpbmdGbGFnKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3NpbmdsZUNsaWNrJywgZXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlc2V0Q2xpY2tUaW1lcigpO1xuICAgICAgICAgICAgfSwgVElNRU9VVF9UT19ESUZGRVJFTlRJQVRFX0NMSUNLX0FORF9EQkxDTElDSyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciAtIGRvdWJsZSBjbGljayAoZGJsY2xpY2spXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIERvdWJsZSBjbGljayBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuZmlyZSgnZG91YmxlQ2xpY2snLCBldmVudCk7XG4gICAgICAgIHRoaXMucmVzZXRDbGlja1RpbWVyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBub2RlIHN0YXRlIC0gb3BlbmVkIG9yIGNsb3NlZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gTm9kZSBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldERpc3BsYXlGcm9tTm9kZVN0YXRlOiBmdW5jdGlvbihub2RlSWQsIHN0YXRlKSB7XG4gICAgICAgIHZhciBzdWJ0cmVlRWxlbWVudCA9IHRoaXMuX2dldFN1YnRyZWVFbGVtZW50KG5vZGVJZCksXG4gICAgICAgICAgICBsYWJlbCwgYnRuRWxlbWVudCwgbm9kZUVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCFzdWJ0cmVlRWxlbWVudCB8fCBzdWJ0cmVlRWxlbWVudCA9PT0gdGhpcy5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxhYmVsID0gdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV07XG4gICAgICAgIG5vZGVFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcblxuICAgICAgICBidG5FbGVtZW50ID0gdXRpbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgICAgICAgbm9kZUVsZW1lbnQsXG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZXMudG9nZ2xlQnRuQ2xhc3NcbiAgICAgICAgKVswXTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IG5vZGVTdGF0ZXMuT1BFTkVEKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGUobm9kZUVsZW1lbnQsIHN0YXRlKTtcblxuICAgICAgICBpZiAoYnRuRWxlbWVudCkge1xuICAgICAgICAgICAgYnRuRWxlbWVudC5pbm5lckhUTUwgPSBsYWJlbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbm9kZSBjbGFzcyBuYW1lIGZyb20gcHJvdmlkZWQgc3RhdGVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlRWxlbWVudCAtIFRyZWVOb2RlIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUgLSBOZXcgY2hhbmdlZCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldE5vZGVDbGFzc05hbWVGcm9tU3RhdGU6IGZ1bmN0aW9uKG5vZGVFbGVtZW50LCBzdGF0ZSkge1xuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IHRoaXMuY2xhc3NOYW1lcyxcbiAgICAgICAgICAgIG9wZW5lZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5PUEVORUQgKyAnQ2xhc3MnXSxcbiAgICAgICAgICAgIGNsb3NlZENsYXNzTmFtZSA9IGNsYXNzTmFtZXNbbm9kZVN0YXRlcy5DTE9TRUQgKyAnQ2xhc3MnXTtcblxuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBvcGVuZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKG5vZGVFbGVtZW50LCBjbG9zZWRDbGFzc05hbWUpO1xuICAgICAgICB1dGlsLmFkZENsYXNzKG5vZGVFbGVtZW50LCBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIE1ha2UgaHRtbFxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IG5vZGVJZHMgLSBOb2RlIGlkIGxpc3RcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAc2VlIG91dGVyVGVtcGxhdGUgdXNlcyBcInV0aWwucmVuZGVyVGVtcGxhdGVcIlxuICAgICAqL1xuICAgIF9tYWtlSHRtbDogZnVuY3Rpb24obm9kZUlkcykge1xuICAgICAgICB2YXIgbW9kZWwgPSB0aGlzLm1vZGVsLFxuICAgICAgICAgICAgaHRtbCA9ICcnO1xuXG4gICAgICAgIHNuaXBwZXQuZm9yRWFjaChub2RlSWRzLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gbW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgICAgIHNvdXJjZXMsIHByb3BzO1xuXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNvdXJjZXMgPSB0aGlzLl9nZXRUZW1wbGF0ZShub2RlKTtcbiAgICAgICAgICAgIHByb3BzID0gdGhpcy5fbWFrZVRlbXBsYXRlUHJvcHMobm9kZSk7XG4gICAgICAgICAgICBwcm9wcy5pbm5lclRlbXBsYXRlID0gdGhpcy5fbWFrZUlubmVySFRNTChub2RlLCB7XG4gICAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2VzLmlubmVyLFxuICAgICAgICAgICAgICAgIHByb3BzOiBwcm9wc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBodG1sICs9IHV0aWwucmVuZGVyVGVtcGxhdGUoc291cmNlcy5vdXRlciwgcHJvcHMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBpbm5lciBodG1sIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge1RyZWVOb2RlfSBub2RlIC0gTm9kZVxuICAgICAqIEBwYXJhbSB7e3NvdXJjZTogc3RyaW5nLCBwcm9wczogT2JqZWN0fX0gW2NhY2hlZF0gLSBDYXNoZWQgZGF0YSB0byBtYWtlIGh0bWxcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBJbm5lciBodG1sIG9mIG5vZGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBzZWUgaW5uZXJUZW1wbGF0ZSB1c2VzIFwidGhpcy5fcmVuZGVyVGVtcGxhdGVcIlxuICAgICAqL1xuICAgIF9tYWtlSW5uZXJIVE1MOiBmdW5jdGlvbihub2RlLCBjYWNoZWQpIHtcbiAgICAgICAgdmFyIHNvdXJjZSwgcHJvcHM7XG5cbiAgICAgICAgY2FjaGVkID0gY2FjaGVkIHx8IHt9O1xuICAgICAgICBzb3VyY2UgPSBjYWNoZWQuc291cmNlIHx8IHRoaXMuX2dldFRlbXBsYXRlKG5vZGUpLmlubmVyO1xuICAgICAgICBwcm9wcyA9IGNhY2hlZC5wcm9wcyB8fCB0aGlzLl9tYWtlVGVtcGxhdGVQcm9wcyhub2RlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fcmVuZGVyVGVtcGxhdGUoc291cmNlLCBwcm9wcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0ZW1wbGF0ZSBzb3VyY2VzXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcmV0dXJucyB7e2lubmVyOiBzdHJpbmcsIG91dGVyOiBzdHJpbmd9fSBUZW1wbGF0ZSBzb3VyY2VzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHNvdXJjZTtcblxuICAgICAgICBpZiAobm9kZS5pc0xlYWYoKSkge1xuICAgICAgICAgICAgc291cmNlID0ge1xuICAgICAgICAgICAgICAgIGlubmVyOiB0aGlzLnRlbXBsYXRlLmxlYWZOb2RlLFxuICAgICAgICAgICAgICAgIG91dGVyOiBvdXRlclRlbXBsYXRlLkxFQUZfTk9ERVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICBpbm5lcjogdGhpcy50ZW1wbGF0ZS5pbnRlcm5hbE5vZGUsXG4gICAgICAgICAgICAgICAgb3V0ZXI6IG91dGVyVGVtcGxhdGUuSU5URVJOQUxfTk9ERVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgdGVtcGxhdGUgcHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7VHJlZU5vZGV9IG5vZGUgLSBOb2RlXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGVtcGxhdGUgcHJvcGVydGllc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VUZW1wbGF0ZVByb3BzOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBjbGFzc05hbWVzID0gdGhpcy5jbGFzc05hbWVzLFxuICAgICAgICAgICAgcHJvcHMsIHN0YXRlO1xuXG4gICAgICAgIGlmIChub2RlLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBpZDogbm9kZS5nZXRJZCgpLFxuICAgICAgICAgICAgICAgIGlzTGVhZjogdHJ1ZSAvLyBmb3IgY3VzdG9tIHRlbXBsYXRlIG1ldGhvZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gbm9kZS5nZXRTdGF0ZSgpO1xuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IG5vZGUuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICBzdGF0ZUNsYXNzOiBjbGFzc05hbWVzW3N0YXRlICsgJ0NsYXNzJ10sXG4gICAgICAgICAgICAgICAgc3RhdGVMYWJlbDogdGhpcy5zdGF0ZUxhYmVsc1tzdGF0ZV0sXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IHRoaXMuX21ha2VIdG1sKG5vZGUuZ2V0Q2hpbGRJZHMoKSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXh0ZW5kKHByb3BzLCBjbGFzc05hbWVzLCBub2RlLmdldEFsbERhdGEoKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERyYXcgZWxlbWVudCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kcmF3OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmdldE5vZGUobm9kZUlkKSxcbiAgICAgICAgICAgIGVsZW1lbnQsIGh0bWw7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFwaVxuICAgICAgICAgKiBAZXZlbnQgVHJlZSNiZWZvcmVEcmF3XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2JlZm9yZURyYXcnLCBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgICogICAgIGlmICh0cmVlLmlzTW92aW5nTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCdpc01vdmluZ05vZGUnKTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCdiZWZvcmVEcmF3OiAnICsgbm9kZUlkKTtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpcmUoJ2JlZm9yZURyYXcnLCBub2RlSWQpO1xuXG4gICAgICAgIGlmIChub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBodG1sID0gdGhpcy5fbWFrZUh0bWwobm9kZS5nZXRDaGlsZElkcygpKTtcbiAgICAgICAgICAgIGVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaHRtbCA9IHRoaXMuX21ha2VJbm5lckhUTUwobm9kZSk7XG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHRoaXMuX3NldENsYXNzV2l0aERpc3BsYXkobm9kZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFRyZWUjYWZ0ZXJEcmF3XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2FmdGVyRHJhdycsIGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICAgKiAgICAgaWYgKHRyZWUuaXNNb3ZpbmdOb2RlKSB7XG4gICAgICAgICAqICAgICAgICAgY29uc29sZS5sb2coJ2lzTW92aW5nTm9kZScpO1xuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKiAgICAgY29uc29sZS5sb2coJ2FmdGVyRHJhdzogJyArIG5vZGVJZCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJlKCdhZnRlckRyYXcnLCBub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY2xhc3MgYW5kIGRpc3BsYXkgb2Ygbm9kZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gbm9kZSAtIE5vZGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDbGFzc1dpdGhEaXNwbGF5OiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBub2RlSWQgPSBub2RlLmdldElkKCksXG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZUlkKSxcbiAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB0aGlzLmNsYXNzTmFtZXM7XG5cbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhlbGVtZW50LCBjbGFzc05hbWVzLmxlYWZDbGFzcyk7XG5cbiAgICAgICAgaWYgKG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lcy5vcGVuZWRDbGFzcyk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZXMuY2xvc2VkQ2xhc3MpO1xuICAgICAgICAgICAgdXRpbC5hZGRDbGFzcyhlbGVtZW50LCBjbGFzc05hbWVzLmxlYWZDbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIG5vZGUuZ2V0U3RhdGUoKSk7XG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRDbGFzc1dpdGhEaXNwbGF5KGNoaWxkKTtcbiAgICAgICAgICAgIH0sIG5vZGVJZCwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHN1YnRyZWUgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBUcmVlTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gU3VidHJlZSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3VidHJlZUVsZW1lbnQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3VidHJlZUVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUuaXNMZWFmKCkpIHtcbiAgICAgICAgICAgIHN1YnRyZWVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdWJ0cmVlRWxlbWVudCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlSWQpLFxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lcy5zdWJ0cmVlQ2xhc3NcbiAgICAgICAgICAgIClbMF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VidHJlZUVsZW1lbnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgZGVwdGggb2Ygbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ8dW5kZWZpbmVkfSBEZXB0aFxuICAgICAqL1xuICAgIGdldERlcHRoOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0RGVwdGgobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBsYXN0IGRlcHRoIG9mIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge251bWJlcn0gTGFzdCBkZXB0aFxuICAgICAqL1xuICAgIGdldExhc3REZXB0aDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldExhc3REZXB0aCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcm9vdCBub2RlIGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJvb3Qgbm9kZSBpZFxuICAgICAqL1xuICAgIGdldFJvb3ROb2RlSWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5yb290Tm9kZS5nZXRJZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gY2hpbGQgaWRzXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fHVuZGVmaW5lZH0gQ2hpbGQgaWRzXG4gICAgICovXG4gICAgZ2V0Q2hpbGRJZHM6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRDaGlsZElkcyhub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcGFyZW50IGlkIG9mIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gUGFyZW50IGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRQYXJlbnRJZChub2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXNldCBjbGljayB0aW1lclxuICAgICAqL1xuICAgIHJlc2V0Q2xpY2tUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5jbGlja1RpbWVyKTtcbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgaWQgZnJvbSBlbGVtZW50XG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBFbGVtZW50XG4gICAgICogQHJldHVybnMge3N0cmluZ30gTm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXROb2RlSWRGcm9tRWxlbWVudChlbGVtZW50SW5Ob2RlKTsgLy8gJ3R1aS10cmVlLW5vZGUtMydcbiAgICAgKi9cbiAgICBnZXROb2RlSWRGcm9tRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICB2YXIgaWRQcmVmaXggPSB0aGlzLmdldE5vZGVJZFByZWZpeCgpO1xuXG4gICAgICAgIHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQuaWQuaW5kZXhPZihpZFByZWZpeCkgPT09IC0xKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgPyBlbGVtZW50LmlkIDogJyc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBwcmVmaXggb2Ygbm9kZSBpZFxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXggb2Ygbm9kZSBpZFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXROb2RlSWRQcmVmaXgoKTsgLy8gJ3R1aS10cmVlLW5vZGUtJ1xuICAgICAqL1xuICAgIGdldE5vZGVJZFByZWZpeDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGVJZFByZWZpeCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge29iamVjdHx1bmRlZmluZWR9IE5vZGUgZGF0YVxuICAgICAqL1xuICAgIGdldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZ2V0Tm9kZURhdGEobm9kZUlkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFByb3BlcnRpZXNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIC0gT3B0aW9uc1xuICAgICAqICAgICBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmlzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51c2VBamF4XSAtIFN0YXRlIG9mIHVzaW5nIEFqYXhcbiAgICAgKiBAZXhtYXBsZVxuICAgICAqIHRyZWUuc2V0Tm9kZURhdGEobm9kZUlkLCB7Zm9vOiAnYmFyJ30pOyAvLyBhdXRvIHJlZnJlc2hcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwge2ZvbzogJ2Jhcid9LCB0cnVlKTsgLy8gbm90IHJlZnJlc2hcbiAgICAgKi9cbiAgICBzZXROb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRyZWVBamF4ID0gdGhpcy5lbmFibGVkRmVhdHVyZXMuQWpheDtcbiAgICAgICAgdmFyIHVzZUFqYXggPSBvcHRpb25zID8gb3B0aW9ucy51c2VBamF4IDogISF0cmVlQWpheDtcbiAgICAgICAgdmFyIGlzU2lsZW50ID0gb3B0aW9ucyA/IG9wdGlvbnMuaXNTaWxlbnQgOiBmYWxzZTtcblxuICAgICAgICBpZiAodXNlQWpheCkge1xuICAgICAgICAgICAgdHJlZUFqYXgubG9hZERhdGEoYWpheENvbW1hbmQuVVBEQVRFLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zZXROb2RlRGF0YShub2RlSWQsIGRhdGEpO1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIG5vZGVJZDogbm9kZUlkLFxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NldCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0Tm9kZURhdGEobm9kZUlkLCBkYXRhLCBpc1NpbGVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGRhdGEgcHJvcGVydGllcyBvZiBhIG5vZGUgKENvcmUgbWV0aG9kKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBQcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIGRhdGEsIGlzU2lsZW50KSB7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0Tm9kZURhdGEobm9kZUlkLCBkYXRhLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0gbmFtZXMgLSBOYW1lcyBvZiBwcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIE9wdGlvbnNcbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlQWpheF0gLSBTdGF0ZSBvZiB1c2luZyBBamF4XG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgJ2ZvbycpOyAvLyBhdXRvIHJlZnJlc2hcbiAgICAgKiB0cmVlLnNldE5vZGVEYXRhKG5vZGVJZCwgJ2ZvbycsIHRydWUpOyAvLyBub3QgcmVmcmVzaFxuICAgICAqL1xuICAgIHJlbW92ZU5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQsIG5hbWVzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRyZWVBamF4ID0gdGhpcy5lbmFibGVkRmVhdHVyZXMuQWpheDtcbiAgICAgICAgdmFyIHVzZUFqYXggPSBvcHRpb25zID8gb3B0aW9ucy51c2VBamF4IDogISF0cmVlQWpheDtcbiAgICAgICAgdmFyIGlzU2lsZW50ID0gb3B0aW9ucyA/IG9wdGlvbnMuaXNTaWxlbnQgOiBmYWxzZTtcblxuICAgICAgICBpZiAodXNlQWpheCkge1xuICAgICAgICAgICAgdHJlZUFqYXgubG9hZERhdGEoYWpheENvbW1hbmQuVVBEQVRFLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdmVOb2RlRGF0YShub2RlSWQsIG5hbWVzKTtcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBub2RlSWQ6IG5vZGVJZCxcbiAgICAgICAgICAgICAgICBuYW1lczogbmFtZXMsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3JlbW92ZSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlTm9kZURhdGEobm9kZUlkLCBuYW1lcywgaXNTaWxlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBub2RlIGRhdGEgKENvcmUgbWV0aG9kKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24obm9kZUlkLCBuYW1lcywgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmVOb2RlRGF0YShub2RlSWQsIG5hbWVzLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIHN0YXRlLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH0gTm9kZSBzdGF0ZSgoJ29wZW5lZCcsICdjbG9zZWQnLCBudWxsKVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5nZXRTdGF0ZShub2RlSWQpOyAvLyAnb3BlbmVkJywgJ2Nsb3NlZCcsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAvLyB1bmRlZmluZWQgaWYgdGhlIG5vZGUgaXMgbm9uZXhpc3RlbnRcbiAgICAgKi9cbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlLmdldFN0YXRlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE9wZW4gbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqL1xuICAgIG9wZW46IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3RhdGUgPSBub2RlU3RhdGVzLk9QRU5FRDtcblxuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgbm9kZS5zZXRTdGF0ZShzdGF0ZSk7XG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmVuYWJsZWRGZWF0dXJlcy5BamF4KSB7XG4gICAgICAgICAgICB0aGlzLl9yZWxvYWQobm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSBub2RlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICovXG4gICAgY2xvc2U6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpLFxuICAgICAgICAgICAgc3RhdGUgPSBub2RlU3RhdGVzLkNMT1NFRDtcblxuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgbm9kZS5zZXRTdGF0ZShzdGF0ZSk7XG4gICAgICAgICAgICB0aGlzLl9zZXREaXNwbGF5RnJvbU5vZGVTdGF0ZShub2RlSWQsIHN0YXRlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqL1xuICAgIHRvZ2dsZTogZnVuY3Rpb24obm9kZUlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5nZXROb2RlKG5vZGVJZCk7XG4gICAgICAgIHZhciBzdGF0ZTtcblxuICAgICAgICBpZiAoIW5vZGUgfHwgbm9kZS5pc1Jvb3QoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS50b2dnbGVTdGF0ZSgpO1xuICAgICAgICBzdGF0ZSA9IG5vZGUuZ2V0U3RhdGUoKTtcbiAgICAgICAgdGhpcy5fc2V0RGlzcGxheUZyb21Ob2RlU3RhdGUobm9kZUlkLCBzdGF0ZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlZEZlYXR1cmVzLkFqYXgpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbG9hZChub2RlSWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbG9hZCBjaGlsZHJlbiBub2RlcyB3aGlsZSBcInN0YXRlTGFibGVcIiBpcyBjbGlja2VkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZWxvYWQ6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuICAgICAgICB2YXIgc3RhdGUgPSBub2RlLmdldFN0YXRlKCk7XG4gICAgICAgIHZhciBpc1JlbG9hZCA9IHNuaXBwZXQuaXNVbmRlZmluZWQobm9kZS5nZXREYXRhKCdyZWxvYWQnKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuZ2V0RGF0YSgncmVsb2FkJyk7XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBub2RlU3RhdGVzLkNMT1NFRCkgeyAvLyBvcGVuIC0+IGNsb3NlIGFjdGlvblxuICAgICAgICAgICAgdGhpcy5fc2V0Tm9kZURhdGEobm9kZUlkLCB7cmVsb2FkOiBmYWxzZX0sIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBub2RlU3RhdGVzLk9QRU5FRCAmJiBpc1JlbG9hZCkgeyAvLyBjbG9zZSAtPiBvcGVuIGFjdGlvblxuICAgICAgICAgICAgdGhpcy5yZXNldEFsbERhdGEobnVsbCwge1xuICAgICAgICAgICAgICAgIG5vZGVJZDogbm9kZUlkLFxuICAgICAgICAgICAgICAgIHVzZUFqYXg6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNvcnQgYWxsIG5vZGVzXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgLSBDb21wYXJhdG9yIGZvciBzb3J0aW5nXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgdHJlZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gU29ydCB3aXRoIHJlZHJhd2luZyB0cmVlXG4gICAgICogdHJlZS5zb3J0KGZ1bmN0aW9uKG5vZGVBLCBub2RlQikge1xuICAgICAqICAgICB2YXIgYVZhbHVlID0gbm9kZUEuZ2V0RGF0YSgndGV4dCcpLFxuICAgICAqICAgICAgICAgYlZhbHVlID0gbm9kZUIuZ2V0RGF0YSgndGV4dCcpO1xuICAgICAqXG4gICAgICogICAgIGlmICghYlZhbHVlIHx8ICFiVmFsdWUubG9jYWxlQ29tcGFyZSkge1xuICAgICAqICAgICAgICAgcmV0dXJuIDA7XG4gICAgICogICAgIH1cbiAgICAgKiAgICAgcmV0dXJuIGJWYWx1ZS5sb2NhbGVDb21wYXJlKGFWYWx1ZSk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiAvLyBTb3J0LCBidXQgbm90IHJlZHJhdyB0cmVlXG4gICAgICogdHJlZS5zb3J0KGZ1bmN0aW9uKG5vZGVBLCBub2RlQikge1xuICAgICAqICAgICB2YXIgYVZhbHVlID0gbm9kZUEuZ2V0RGF0YSgndGV4dCcpLFxuICAgICAqICAgICAgICAgYlZhbHVlID0gbm9kZUIuZ2V0RGF0YSgndGV4dCcpO1xuICAgICAqXG4gICAgICogICAgIGlmICghYlZhbHVlIHx8ICFiVmFsdWUubG9jYWxlQ29tcGFyZSkge1xuICAgICAqICAgICAgICAgcmV0dXJuIDA7XG4gICAgICogICAgIH1cbiAgICAgKiAgICAgcmV0dXJuIGJWYWx1ZS5sb2NhbGVDb21wYXJlKGFWYWx1ZSk7XG4gICAgICogfSwgdHJ1ZSk7XG4gICAgICovXG4gICAgc29ydDogZnVuY3Rpb24oY29tcGFyYXRvciwgaXNTaWxlbnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zb3J0KGNvbXBhcmF0b3IpO1xuICAgICAgICBpZiAoIWlzU2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZWZyZXNoIHRyZWUgb3Igbm9kZSdzIGNoaWxkcmVuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbm9kZUlkXSAtIFRyZWVOb2RlIGlkIHRvIHJlZnJlc2hcbiAgICAgKi9cbiAgICByZWZyZXNoOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgbm9kZUlkID0gbm9kZUlkIHx8IHRoaXMuZ2V0Um9vdE5vZGVJZCgpO1xuICAgICAgICB0aGlzLl9kcmF3KG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlIHRoaXMgdHJlZSBpdGVyYXRpbmcgb3ZlciBhbGwgbm9kZXMuXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAqICAgICBjb25zb2xlLmxvZyhub2RlLmdldElkKCkgPT09IG5vZGVJZCk7IC8vIHRydWVcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBlYWNoQWxsOiBmdW5jdGlvbihpdGVyYXRlZSwgY29udGV4dCkge1xuICAgICAgICB0aGlzLm1vZGVsLmVhY2hBbGwoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIGRlc2NlbmRhbnRzIG9mIGEgbm9kZS5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgLSBJdGVyYXRlZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgaXRlcmF0ZWVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuZWFjaChmdW5jdGlvbihub2RlLCBub2RlSWQpIHtcbiAgICAgKiAgICAgY29uc29sZS5sb2cobm9kZS5nZXRJZCgpID09PSBub2RlSWQpOyAvLyB0cnVlXG4gICAgICogfSwgcGFyZW50SWQpO1xuICAgICAqXG4gICAgICovXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0ZWUsIHBhcmVudElkLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMubW9kZWwuZWFjaChpdGVyYXRlZSwgcGFyZW50SWQsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgbm9kZShzKS5cbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxuICAgICAqIEBwYXJhbSB7Kn0gW3BhcmVudElkXSAtIFBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zXG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51c2VBamF4XSAtIFN0YXRlIG9mIHVzaW5nIEFqYXhcbiAgICAgKiBAcmV0dXJucyB7P0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gYWRkIG5vZGUgd2l0aCByZWRyYXdpbmdcbiAgICAgKiB2YXIgZmlyc3RBZGRlZElkcyA9IHRyZWUuYWRkKHt0ZXh0OidGRSBkZXZlbG9wbWVudCB0ZWFtMSd9LCBwYXJlbnRJZCk7XG4gICAgICogY29uc29sZS5sb2coZmlyc3RBZGRlZElkcyk7IC8vIFtcInR1aS10cmVlLW5vZGUtMTBcIl1cbiAgICAgKlxuICAgICAqIC8vIGFkZCBub2RlIHdpdGhvdXQgcmVkcmF3aW5nXG4gICAgICogdmFyIHNlY29uZEFkZGVkSWRzID0gdHJlZS5hZGQoW1xuICAgICAqICAgIHt0ZXh0OiAnRkUgZGV2ZWxvcG1lbnQgdGVhbTInfSxcbiAgICAgKiAgICB7dGV4dDogJ0ZFIGRldmVsb3BtZW50IHRlYW0zJ31cbiAgICAgKiBdLCBwYXJlbnRJZCwgdHJ1ZSk7XG4gICAgICogY29uc29sZS5sb2coc2Vjb25kQWRkZWRJZHMpOyAvLyBbXCJ0dWktdHJlZS1ub2RlLTExXCIsIFwidHVpLXRyZWUtbm9kZS0xMlwiXVxuICAgICAqL1xuICAgIGFkZDogZnVuY3Rpb24oZGF0YSwgcGFyZW50SWQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdHJlZUFqYXggPSB0aGlzLmVuYWJsZWRGZWF0dXJlcy5BamF4O1xuICAgICAgICB2YXIgdXNlQWpheCA9IG9wdGlvbnMgPyBvcHRpb25zLnVzZUFqYXggOiAhIXRyZWVBamF4O1xuICAgICAgICB2YXIgaXNTaWxlbnQgPSBvcHRpb25zID8gb3B0aW9ucy5pc1NpbGVudCA6IGZhbHNlO1xuICAgICAgICB2YXIgbmV3Q2hpbGRJZHM7XG5cbiAgICAgICAgaWYgKHVzZUFqYXgpIHtcbiAgICAgICAgICAgIHRyZWVBamF4LmxvYWREYXRhKGFqYXhDb21tYW5kLkNSRUFURSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuX2FkZChkYXRhLCBwYXJlbnRJZCk7XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGFyZW50SWQ6IHBhcmVudElkLFxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3Q2hpbGRJZHMgPSB0aGlzLl9hZGQoZGF0YSwgcGFyZW50SWQsIGlzU2lsZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXdDaGlsZElkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIG5vZGUocykuIChDb3JlIG1ldGhvZClcbiAgICAgKiAtIElmIHRoZSBwYXJlbnRJZCBpcyBmYWxzeSwgdGhlIG5vZGUgd2lsbCBiZSBhcHBlbmRlZCB0byByb290Tm9kZS5cbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAcGFyYW0ge0FycmF5fG9iamVjdH0gZGF0YSAtIFJhdy1kYXRhXG4gICAgICogQHBhcmFtIHsqfSBbcGFyZW50SWRdIC0gUGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCByZWRyYXcgY2hpbGRyZW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCwgaXNTaWxlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuYWRkKGRhdGEsIHBhcmVudElkLCBpc1NpbGVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IGFsbCBkYXRhXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3IGRhdGEgZm9yIGFsbCBub2Rlc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zXG4gICAgICogICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5ub2RlSWRdIC0gUGFyZW50IG5vZGUgaWQgdG8gcmVzZXQgYWxsIGNoaWxkIGRhdGFcbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51c2VBamF4XSAtIFN0YXRlIG9mIHVzaW5nIEFqYXhcbiAgICAgKiBAcmV0dXJucyB7P0FycmF5LjxzdHJpbmc+fSBBZGRlZCBub2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZXNldEFsbERhdGEoW1xuICAgICAqICB7dGV4dDogJ2hlbGxvJywgY2hpbGRyZW46IFtcbiAgICAgKiAgICAgIHt0ZXh0OiAnZm9vJ30sXG4gICAgICogICAgICB7dGV4dDogJ2Jhcid9XG4gICAgICogIF19LFxuICAgICAqICB7dGV4dDogJ3dvcmxkJ31cbiAgICAgKiBdKTtcbiAgICAgKiB0cmVlLnJlc2V0QWxsRGF0YShbXG4gICAgICogIHt0ZXh0OiAnaGVsbG8gd29ybGQnfVxuICAgICAqIF0sIHtcbiAgICAgKiAgbm9kZUlkOiAndHVpLXRyZWUtbm9kZS01JyxcbiAgICAgKiAgdXNlQWpheDogdHJ1ZVxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHJlc2V0QWxsRGF0YTogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0cmVlQWpheCA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzLkFqYXg7XG4gICAgICAgIHZhciBub2RlSWQgPSBvcHRpb25zID8gb3B0aW9ucy5ub2RlSWQgOiB0aGlzLmdldFJvb3ROb2RlSWQoKTtcbiAgICAgICAgdmFyIHVzZUFqYXggPSBvcHRpb25zID8gb3B0aW9ucy51c2VBamF4IDogISF0cmVlQWpheDtcbiAgICAgICAgdmFyIG5ld0NoaWxkSWRzO1xuXG4gICAgICAgIGlmICh1c2VBamF4KSB7XG4gICAgICAgICAgICB0cmVlQWpheC5sb2FkRGF0YShhamF4Q29tbWFuZC5SRUFELCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLl9yZXNldEFsbERhdGEocmVzcG9uc2UsIG5vZGVJZCk7XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgbm9kZUlkOiBub2RlSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3Q2hpbGRJZHMgPSB0aGlzLl9yZXNldEFsbERhdGEoZGF0YSwgbm9kZUlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXdDaGlsZElkcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgYWxsIGRhdGEgKENvcmUgbWV0aG9kKVxuICAgICAqIEBwYXJhbSB7QXJyYXl8b2JqZWN0fSBkYXRhIC0gUmF3IGRhdGEgZm9yIGFsbCBub2Rlc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkIHRvIHJlc2V0IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVzZXRBbGxEYXRhOiBmdW5jdGlvbihkYXRhLCBub2RlSWQpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlQWxsQ2hpbGRyZW4obm9kZUlkLCB7aXNTaWxlbnQ6IHRydWV9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fYWRkKGRhdGEsIG5vZGVJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhbGwgY2hpbGRyZW5cbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIFBhcmVudCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIE9wdGlvbnNcbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyB0aGUgbm9kZVxuICAgICAqICAgICBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnVzZUFqYXhdIC0gU3RhdGUgb2YgdXNpbmcgQWpheFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZW1vdmVBbGxDaGlsZHJlbihub2RlSWQpOyAvLyBSZWRyYXdzIHRoZSBub2RlXG4gICAgICogdHJlZS5yZW1vdmVBbGxDaGlsZHJlbihub2RJZCwgdHJ1ZSk7IC8vIERvZXNuJ3QgcmVkcmF3IHRoZSBub2RlXG4gICAgICovXG4gICAgcmVtb3ZlQWxsQ2hpbGRyZW46IGZ1bmN0aW9uKG5vZGVJZCwgb3B0aW9ucykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0cmVlQWpheCA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzLkFqYXg7XG4gICAgICAgIHZhciB1c2VBamF4ID0gb3B0aW9ucyA/IG9wdGlvbnMudXNlQWpheCA6ICEhdHJlZUFqYXg7XG4gICAgICAgIHZhciBpc1NpbGVudCA9IG9wdGlvbnMgPyBvcHRpb25zLmlzU2lsZW50IDogZmFsc2U7XG5cbiAgICAgICAgaWYgKHVzZUFqYXgpIHtcbiAgICAgICAgICAgIHRyZWVBamF4LmxvYWREYXRhKGFqYXhDb21tYW5kLkRFTEVURV9BTExfQ0hJTERSRU4sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3JlbW92ZUFsbENoaWxkcmVuKG5vZGVJZCk7XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGFyZW50SWQ6IG5vZGVJZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVBbGxDaGlsZHJlbihub2RlSWQsIGlzU2lsZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYWxsIGNoaWxkcmVuIChDb3JlIG1ldGhvZClcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyB0aGUgbm9kZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUFsbENoaWxkcmVuOiBmdW5jdGlvbihub2RlSWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZ2V0Q2hpbGRJZHMobm9kZUlkKTtcblxuICAgICAgICBzbmlwcGV0LmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkSWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZShjaGlsZElkLCB0cnVlKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5fZHJhdyhub2RlSWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIG5vZGUgd2l0aCBjaGlsZHJlbi5cbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIE5vZGUgaWQgdG8gcmVtb3ZlXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIE9wdGlvbnNcbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHJlZHJhdyBjaGlsZHJlblxuICAgICAqICAgICBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnVzZUFqYXhdIC0gU3RhdGUgb2YgdXNpbmcgQWpheFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5yZW1vdmUobXlOb2RlSWQpOyAvLyByZW1vdmUgbm9kZSB3aXRoIHJlZHJhd2luZ1xuICAgICAqIHRyZWUucmVtb3ZlKG15Tm9kZUlkLCB0cnVlKTsgLy8gcmVtb3ZlIG5vZGUgd2l0aG91dCByZWRyYXdpbmdcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgb3B0aW9ucykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0cmVlQWpheCA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzLkFqYXg7XG4gICAgICAgIHZhciB1c2VBamF4ID0gb3B0aW9ucyA/IG9wdGlvbnMudXNlQWpheCA6ICEhdHJlZUFqYXg7XG4gICAgICAgIHZhciBpc1NpbGVudCA9IG9wdGlvbnMgPyBvcHRpb25zLmlzU2lsZW50IDogZmFsc2U7XG5cbiAgICAgICAgaWYgKHVzZUFqYXgpIHtcbiAgICAgICAgICAgIHRyZWVBamF4LmxvYWREYXRhKGFqYXhDb21tYW5kLkRFTEVURSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlKG5vZGVJZCk7XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgbm9kZUlkOiBub2RlSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlKG5vZGVJZCwgaXNTaWxlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIG5vZGUgd2l0aCBjaGlsZHJlbi4gKENvcmUgbWV0aG9kKVxuICAgICAqIC0gSWYgJ2lzU2lsZW50JyBpcyBub3QgdHJ1ZSwgaXQgcmVkcmF3cyB0aGUgdHJlZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlOiBmdW5jdGlvbihub2RlSWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHRoaXMubW9kZWwucmVtb3ZlKG5vZGVJZCwgaXNTaWxlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGEgbm9kZSB0byBuZXcgcGFyZW50XG4gICAgICogLSBJZiAnaXNTaWxlbnQnIGlzIG5vdCB0cnVlLCBpdCByZWRyYXdzIHRoZSB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIEluZGV4IG51bWJlciBvZiBzZWxlY3RlZCBub2RlXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIE9wdGlvbnNcbiAgICAgKiAgICAgQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlQWpheF0gLSBTdGF0ZSBvZiB1c2luZyBBamF4XG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLm1vdmUobXlOb2RlSWQsIG5ld1BhcmVudElkKTsgLy8gbW9kZSBub2RlIHdpdGggcmVkcmF3aW5nXG4gICAgICogdHJlZS5tb3ZlKG15Tm9kZUlkLCBuZXdQYXJlbnRJZCwgdHJ1ZSk7IC8vIG1vdmUgbm9kZSB3aXRob3V0IHJlZHJhd2luZ1xuICAgICAqL1xuICAgIG1vdmU6IGZ1bmN0aW9uKG5vZGVJZCwgbmV3UGFyZW50SWQsIGluZGV4LCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRyZWVBamF4ID0gdGhpcy5lbmFibGVkRmVhdHVyZXMuQWpheDtcbiAgICAgICAgdmFyIHVzZUFqYXggPSBvcHRpb25zID8gb3B0aW9ucy51c2VBamF4IDogISF0cmVlQWpheDtcbiAgICAgICAgdmFyIGlzU2lsZW50ID0gb3B0aW9ucyA/IG9wdGlvbnMuaXNTaWxlbnQgOiBmYWxzZTtcblxuICAgICAgICBpZiAodXNlQWpheCkge1xuICAgICAgICAgICAgdHJlZUFqYXgubG9hZERhdGEoYWpheENvbW1hbmQuTU9WRSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZ2V0UGFyZW50SWQobm9kZUlkKSAhPT0gbmV3UGFyZW50SWQpIHsgLy8ganVzdCBtb3ZlLCBub3Qgc29ydCFcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXROb2RlRGF0YShuZXdQYXJlbnRJZCwge3JlbG9hZDogdHJ1ZX0sIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLl9tb3ZlKG5vZGVJZCwgbmV3UGFyZW50SWQsIGluZGV4KTtcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBub2RlSWQ6IG5vZGVJZCxcbiAgICAgICAgICAgICAgICBuZXdQYXJlbnRJZDogbmV3UGFyZW50SWQsXG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX21vdmUobm9kZUlkLCBuZXdQYXJlbnRJZCwgaW5kZXgsIGlzU2lsZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGEgbm9kZSB0byBuZXcgcGFyZW50IChDb3JlIG1ldGhvZClcbiAgICAgKiAtIElmICdpc1NpbGVudCcgaXMgbm90IHRydWUsIGl0IHJlZHJhd3MgdGhlIHRyZWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXJlbnRJZCAtIE5ldyBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBJbmRleCBudW1iZXIgb2Ygc2VsZWN0ZWQgbm9kZVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgcmVkcmF3IGNoaWxkcmVuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbW92ZTogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCwgaW5kZXgsIGlzU2lsZW50KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBUcmVlI2JlZm9yZU1vdmVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZCAtIEN1cnJlbnQgZHJhZ2dpbmcgbm9kZSBpZFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBOZXcgcGFyZW50IGlkXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHRyZWUub24oJ2JlZm9yZU1vdmUnLCBmdW5jdGlvbihub2RlSWQsIHBhcmVudElkKSB7XG4gICAgICAgICAqICAgICAgY29uc29sZS5sb2coJ2RyYWdnaW5nIG5vZGU6ICcgKyBub2RlSWQpO1xuICAgICAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdwYXJlbnQgbm9kZTogJyArIHBhcmVudElkKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICByZXR1cm4gZmFsc2U7IC8vIENhbmNlbCBcIm1vdmVcIiBldmVudFxuICAgICAgICAgKiAgICAgIC8vIHJldHVybiB0cnVlOyAvLyBGaXJlIFwibW92ZVwiIGV2ZW50XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCF0aGlzLmludm9rZSgnYmVmb3JlTW92ZScsIG5vZGVJZCwgbmV3UGFyZW50SWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzTW92aW5nTm9kZSA9IHRydWU7XG4gICAgICAgIHRoaXMubW9kZWwubW92ZShub2RlSWQsIG5ld1BhcmVudElkLCBpbmRleCwgaXNTaWxlbnQpO1xuICAgICAgICB0aGlzLmlzTW92aW5nTm9kZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2ggbm9kZSBpZHMgYnkgcGFzc2luZyB0aGUgcHJlZGljYXRlIGNoZWNrIG9yIG1hdGNoaW5nIGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R9IHByZWRpY2F0ZSAtIFByZWRpY2F0ZSBvciBkYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIENvbnRleHQgb2YgcHJlZGljYXRlXG4gICAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBOb2RlIGlkc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gc2VhcmNoIGZyb20gcHJlZGljYXRlXG4gICAgICogdmFyIGxlYWZOb2RlSWRzID0gdHJlZS5zZWFyY2goZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICogICAgIHJldHVybiBub2RlLmlzTGVhZigpO1xuICAgICAqIH0pO1xuICAgICAqIGNvbnNvbGUubG9nKGxlYWZOb2RlSWRzKTsgLy8gWyd0dWktdHJlZS1ub2RlLTMnLCAndHVpLXRyZWUtbm9kZS01J11cbiAgICAgKlxuICAgICAqIC8vIHNlYXJjaCBmcm9tIGRhdGFcbiAgICAgKiB2YXIgc3BlY2lhbE5vZGVJZHMgPSB0cmVlLnNlYXJjaCh7XG4gICAgICogICAgIGlzU3BlY2lhbDogdHJ1ZSxcbiAgICAgKiAgICAgZm9vOiAnYmFyJ1xuICAgICAqIH0pO1xuICAgICAqIGNvbnNvbGUubG9nKHNwZWNpYWxOb2RlSWRzKTsgLy8gWyd0dWktdHJlZS1ub2RlLTUnLCAndHVpLXRyZWUtbm9kZS0xMCddXG4gICAgICogY29uc29sZS5sb2codHJlZS5nZXROb2RlRGF0YSgndHVpLXRyZWUtbm9kZS01JykuaXNTcGVjaWFsKTsgLy8gdHJ1ZVxuICAgICAqIGNvbnNvbGUubG9nKHRyZWUuZ2V0Tm9kZURhdGEoJ3R1aS10cmVlLW5vZGUtNScpLmZvbyk7IC8vICdiYXInXG4gICAgICovXG4gICAgc2VhcmNoOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKCFzbmlwcGV0LmlzT2JqZWN0KHByZWRpY2F0ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzbmlwcGV0LmlzRnVuY3Rpb24ocHJlZGljYXRlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3doZXJlKHByZWRpY2F0ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlYXJjaCBub2RlIGlkcyBieSBtYXRjaGluZyBkYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gRGF0YVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF93aGVyZTogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcihmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhID0gbm9kZS5nZXRBbGxEYXRhKCk7XG5cbiAgICAgICAgICAgIHNuaXBwZXQuZm9yRWFjaChwcm9wcywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChrZXkgaW4gZGF0YSkgJiYgKGRhdGFba2V5XSA9PT0gdmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIG5vZGUgaWRzIGJ5IHBhc3NpbmcgdGhlIHByZWRpY2F0ZSBjaGVja1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSAtIFByZWRpY2F0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBDb250ZXh0IG9mIHByZWRpY2F0ZVxuICAgICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gTm9kZSBpZHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWx0ZXI6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcblxuICAgICAgICB0aGlzLmVhY2hBbGwoZnVuY3Rpb24obm9kZSwgbm9kZUlkKSB7XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUsIG5vZGVJZCkpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKG5vZGVJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNvbnRleHQpO1xuXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgbm9kZSBpcyBsZWFmXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgaXMgbGVhZi5cbiAgICAgKi9cbiAgICBpc0xlYWY6IGZ1bmN0aW9uKG5vZGVJZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuZ2V0Tm9kZShub2RlSWQpO1xuXG4gICAgICAgIHJldHVybiBub2RlICYmIG5vZGUuaXNMZWFmKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgYSBub2RlIGlzIGEgYW5jZXN0b3Igb2YgYW5vdGhlciBub2RlLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVyTm9kZUlkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGNvbnRhaW4gdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVkTm9kZUlkIC0gSWQgb2YgYSBub2RlIHRoYXQgbWF5IGJlIGNvbnRhaW5lZCBieSB0aGUgb3RoZXIgbm9kZVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIGEgbm9kZSBjb250YWlucyBhbm90aGVyIG5vZGVcbiAgICAgKi9cbiAgICBjb250YWluczogZnVuY3Rpb24oY29udGFpbmVyTm9kZUlkLCBjb250YWluZWROb2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuY29udGFpbnMoY29udGFpbmVkTm9kZUlkLCBjb250YWluZWROb2RlSWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZmFjaWxpdHkgb2YgdHJlZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZU5hbWUgLSAnU2VsZWN0YWJsZScsICdEcmFnZ2FibGUnLCAnRWRpdGFibGUnLCAnQ29udGV4dE1lbnUnXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIEZlYXR1cmUgb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtUcmVlfSB0aGlzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdTZWxlY3RhYmxlJywge1xuICAgICAqICAgICAgc2VsZWN0ZWRDbGFzc05hbWU6ICd0dWktdHJlZS1zZWxlY3RlZCdcbiAgICAgKiAgfSlcbiAgICAgKiAgLmVuYWJsZUZlYXR1cmUoJ0VkaXRhYmxlJywge1xuICAgICAqICAgICAgZW5hYmxlQ2xhc3NOYW1lOiB0cmVlLmNsYXNzTmFtZXMudGV4dENsYXNzLFxuICAgICAqICAgICAgZGF0YUtleTogJ3RleHQnLFxuICAgICAqICAgICAgZGVmYXVsdFZhbHVlOiAnbmV3IG5vZGUnLFxuICAgICAqICAgICAgaW5wdXRDbGFzc05hbWU6ICdteUlucHV0J1xuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnRHJhZ2dhYmxlJywge1xuICAgICAqICAgICAgdXNlSGVscGVyOiB0cnVlLFxuICAgICAqICAgICAgaGVscGVyUG9zOiB7eDogNSwgeTogMn0sXG4gICAgICogICAgICByZWplY3RlZFRhZ05hbWVzOiBbJ1VMJywgJ0lOUFVUJywgJ0JVVFRPTiddLFxuICAgICAqICAgICAgcmVqZWN0ZWRDbGFzc05hbWVzOiBbJ25vdERyYWdnYWJsZScsICdub3REcmFnZ2FibGUtMiddLFxuICAgICAqICAgICAgYXV0b09wZW5EZWxheTogMTUwMCxcbiAgICAgKiAgICAgIGlzU29ydGFibGU6IHRydWUsXG4gICAgICogICAgICBob3ZlckNsYXNzTmFtZTogJ3R1aS10cmVlLWhvdmVyJ1xuICAgICAqICAgICAgbGluZUNsYXNzTmFtZTogJ3R1aS10cmVlLWxpbmUnLFxuICAgICAqICAgICAgbGluZUJvdW5kYXJ5OiB7XG4gICAgICogICAgICBcdHRvcDogMTAsXG4gICAgICogICAgICAgXHRib3R0b206IDEwXG4gICAgICogICAgICB9XG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdDaGVja2JveCcsIHtcbiAgICAgKiAgICAgIGNoZWNrYm94Q2xhc3NOYW1lOiAndHVpLXRyZWUtY2hlY2tib3gnXG4gICAgICogIH0pXG4gICAgICogIC5lbmFibGVGZWF0dXJlKCdDb250ZXh0TWVudScsIHtcbiAgICAgKiAgXHRtZW51RGF0YTogW1xuICAgICAqICAgXHRcdHt0aXRsZTogJ21lbnUxJywgY29tbWFuZDogJ2NvcHknfSxcbiAgICAgKiAgICAgXHRcdHt0aXRsZTogJ21lbnUyJywgY29tbWFuZDogJ3Bhc3RlJ30sXG4gICAgICogICAgICAgXHR7c2VwYXJhdG9yOiB0cnVlfSxcbiAgICAgKiAgICAgICAgXHR7XG4gICAgICogICAgICAgICBcdFx0dGl0bGU6ICdtZW51MycsXG4gICAgICogICAgICAgICAgIFx0bWVudTogW1xuICAgICAqICAgICAgICAgICAgXHRcdHt0aXRsZTogJ3N1Ym1lbnUxJ30sXG4gICAgICogICAgICAgICAgICAgIFx0e3RpdGxlOiAnc3VibWVudTInfVxuICAgICAqICAgICAgICAgICAgICBdXG4gICAgICogICAgICAgICAgfVxuICAgICAqICAgICAgfVxuICAgICAqICB9KVxuICAgICAqICAuZW5hYmxlRmVhdHVyZSgnQWpheCcsIHtcbiAgICAgKiAgICAgIGNvbW1hbmQ6IHtcbiAgICAgKiAgICAgICAgICByZWFkOiB7XG4gICAgICogICAgICAgICAgICAgIHVybDogJ2FwaS9yZWFkJyxcbiAgICAgKiAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgKiAgICAgICAgICAgICAgdHlwZTogJ2dldCdcbiAgICAgKiAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgIGNyZWF0ZToge1xuICAgICAqICAgICAgICAgICAgICB1cmw6ICdhcGkvY3JlYXRlJyxcbiAgICAgKiAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgKiAgICAgICAgICAgICAgdHlwZTogJ3Bvc3QnXG4gICAgICogICAgICAgICAgfSxcbiAgICAgKiAgICAgICAgICB1cGRhdGU6IHtcbiAgICAgKiAgICAgICAgICAgICAgdXJsOiAnYXBpL3VwZGF0ZScsXG4gICAgICogICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICogICAgICAgICAgICAgIHR5cGU6ICdwb3N0JyxcbiAgICAgKiAgICAgICAgICAgICAgZGF0YToge1xuICAgICAqICAgICAgICAgICAgICAgICAgcGFyYW1BOiAnYScsXG4gICAgICogICAgICAgICAgICAgICAgICBwYXJhbUI6ICdiJ1xuICAgICAqICAgICAgICAgICAgICB9XG4gICAgICogICAgICAgICAgfSxcbiAgICAgKiAgICAgICAgICByZW1vdmU6IHtcbiAgICAgKiAgICAgICAgICAgICAgdXJsOiAnYXBpL3JlbW92ZScsXG4gICAgICogICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICogICAgICAgICAgICAgIHR5cGU6ICdwb3N0JyxcbiAgICAgKiAgICAgICAgICAgICAgZGF0YTogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICogICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgIHBhcmFtQTogcGFyYW1zLmEsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgcGFyYW1COiBwYXJhbXMuYlxuICAgICAqICAgICAgICAgICAgICAgICAgfTtcbiAgICAgKiAgICAgICAgICAgICAgfVxuICAgICAqICAgICAgICAgIH0sXG4gICAgICogICAgICAgICAgcmVtb3ZlQWxsQ2hpbGRyZW46IHtcbiAgICAgKiAgICAgICAgICAgICAgdXJsOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgKiAgICAgICAgICAgICAgICAgIHJldHVybiAnYXBpL3JlbW92ZV9hbGwvJyArIHBhcmFtcy5ub2RlSWQsXG4gICAgICogICAgICAgICAgICAgIH0sXG4gICAgICogICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICogICAgICAgICAgICAgIHR5cGU6ICdwb3N0J1xuICAgICAqICAgICAgICAgIH0sXG4gICAgICogICAgICAgICAgbW92ZToge1xuICAgICAqICAgICAgICAgICAgICB1cmw6ICdhcGkvbW92ZScsXG4gICAgICogICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICogICAgICAgICAgICAgIHR5cGU6ICdwb3N0J1xuICAgICAqICAgICAgICAgIH1cbiAgICAgKiAgICAgIH0sXG4gICAgICogICAgICBwYXJzZURhdGE6IGZ1bmN0aW9uKHR5cGUsIHJlc3BvbnNlKSB7XG4gICAgICogICAgICAgICAgaWYgKHR5cGUgPT09ICdyZWFkJyAmJiByZXNwb25zZS5jb2RlID09PSAnMjAwJykge1xuICAgICAqICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICogICAgICAgICAgfSBlbHNlIHtcbiAgICAgKiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAqICAgICAgICAgIH1cbiAgICAgKiAgICAgIH1cbiAgICAgKiAgfSk7XG4gICAgICovXG4gICAgZW5hYmxlRmVhdHVyZTogZnVuY3Rpb24oZmVhdHVyZU5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIEZlYXR1cmUgPSBmZWF0dXJlc1tmZWF0dXJlTmFtZV07XG4gICAgICAgIHRoaXMuZGlzYWJsZUZlYXR1cmUoZmVhdHVyZU5hbWUpO1xuICAgICAgICBpZiAoRmVhdHVyZSkge1xuICAgICAgICAgICAgdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdID0gbmV3IEZlYXR1cmUodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ2luaXRGZWF0dXJlJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBmYWNpbGl0eSBvZiB0cmVlXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmZWF0dXJlTmFtZSAtICdTZWxlY3RhYmxlJywgJ0RyYWdnYWJsZScsICdFZGl0YWJsZSdcbiAgICAgKiBAcmV0dXJucyB7VHJlZX0gdGhpc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ1NlbGVjdGFibGUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0RyYWdnYWJsZScpXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnRWRpdGFibGUnKVxuICAgICAqICAuZGlzYWJsZUZlYXR1cmUoJ0NoZWNrYm94JylcbiAgICAgKiAgLmRpc2FibGVGZWF0dXJlKCdDb250ZXh0TWVudScpXG4gICAgICogIC5kaXNhYmxlRmVhdHVyZSgnQWpheCcpO1xuICAgICAqL1xuICAgIGRpc2FibGVGZWF0dXJlOiBmdW5jdGlvbihmZWF0dXJlTmFtZSkge1xuICAgICAgICB2YXIgZmVhdHVyZSA9IHRoaXMuZW5hYmxlZEZlYXR1cmVzW2ZlYXR1cmVOYW1lXTtcblxuICAgICAgICBpZiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgZmVhdHVyZS5kZXN0cm95KCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5lbmFibGVkRmVhdHVyZXNbZmVhdHVyZU5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpbmRleCBudW1iZXIgb2Ygc2VsZWN0ZWQgbm9kZVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gSWQgb2Ygc2VsZWN0ZWQgbm9kZVxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IEluZGV4IG51bWJlciBvZiBhdHRhY2hlZCBub2RlXG4gICAgICovXG4gICAgZ2V0Tm9kZUluZGV4OiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIHBhcmVudElkID0gdGhpcy5tb2RlbC5nZXRQYXJlbnRJZChub2RlSWQpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldE5vZGUocGFyZW50SWQpLmdldENoaWxkSW5kZXgobm9kZUlkKTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBTZXQgYWJzdHJhY3QgYXBpcyB0byB0cmVlIHByb3RvdHlwZVxuICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVOYW1lIC0gRmVhdHVyZSBuYW1lXG4gKiBAcGFyYW0ge29iamVjdH0gZmVhdHVyZSAtIEZlYXR1cmVcbiAqIEBpZ25vcmVcbiAqL1xuZnVuY3Rpb24gc2V0QWJzdHJhY3RBUElzKGZlYXR1cmVOYW1lLCBmZWF0dXJlKSB7XG4gICAgdmFyIG1lc3NhZ2VOYW1lID0gJ0lOVkFMSURfQVBJXycgKyBmZWF0dXJlTmFtZS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICBhcGlMaXN0ID0gZmVhdHVyZS5nZXRBUElMaXN0ID8gZmVhdHVyZS5nZXRBUElMaXN0KCkgOiBbXTtcblxuICAgIHNuaXBwZXQuZm9yRWFjaChhcGlMaXN0LCBmdW5jdGlvbihhcGkpIHtcbiAgICAgICAgVHJlZS5wcm90b3R5cGVbYXBpXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2VzW21lc3NhZ2VOYW1lXSB8fCBtZXNzYWdlcy5JTlZBTElEX0FQSSk7XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5zbmlwcGV0LmZvckVhY2goZmVhdHVyZXMsIGZ1bmN0aW9uKEZlYXR1cmUsIG5hbWUpIHtcbiAgICBzZXRBYnN0cmFjdEFQSXMobmFtZSwgRmVhdHVyZSk7XG59KTtcbnNuaXBwZXQuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWUpO1xubW9kdWxlLmV4cG9ydHMgPSBUcmVlO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFVwZGF0ZSB2aWV3IGFuZCBjb250cm9sIHRyZWUgZGF0YVxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgTGFiIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIFRyZWVOb2RlID0gcmVxdWlyZSgnLi90cmVlTm9kZScpO1xuXG52YXIgZXh0ZW5kID0gdHVpLnV0aWwuZXh0ZW5kLFxuICAgIGtleXMgPSB0dWkudXRpbC5rZXlzLFxuICAgIGZvckVhY2ggPSB0dWkudXRpbC5mb3JFYWNoLFxuICAgIG1hcCA9IHR1aS51dGlsLm1hcDtcblxuLyoqXG4gKiBUcmVlIG1vZGVsXG4gKiBAY2xhc3MgVHJlZU1vZGVsXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gRGF0YVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zIGZvciBkZWZhdWx0U3RhdGUgYW5kIG5vZGVJZFByZWZpeFxuICogQGlnbm9yZVxuICoqL1xudmFyIFRyZWVNb2RlbCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU1vZGVsLnByb3RvdHlwZSAqL3sgLyogZXNsaW50LWRpc2FibGUgKi9cbiAgICBpbml0OiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgVHJlZU5vZGUuc2V0SWRQcmVmaXgob3B0aW9ucy5ub2RlSWRQcmVmaXgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IHN0YXRlIG9mIG5vZGVcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubm9kZURlZmF1bHRTdGF0ZSA9IG9wdGlvbnMubm9kZURlZmF1bHRTdGF0ZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUm9vdCBub2RlXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTm9kZX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucm9vdE5vZGUgPSBuZXcgVHJlZU5vZGUoe1xuICAgICAgICAgICAgc3RhdGU6ICdvcGVuZWQnXG4gICAgICAgIH0sIG51bGwpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmVlIGhhc2ggaGF2aW5nIGFsbCBub2Rlc1xuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0LjxzdHJpbmcsIFRyZWVOb2RlPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHJlZUhhc2ggPSB7fTtcblxuICAgICAgICB0aGlzLl9zZXREYXRhKGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcHJlZml4IG9mIG5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVmaXhcbiAgICAgKi9cbiAgICBnZXROb2RlSWRQcmVmaXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gVHJlZU5vZGUuaWRQcmVmaXg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBtb2RlbCB3aXRoIHRyZWUgZGF0YVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBUcmVlIGRhdGFcbiAgICAgKi9cbiAgICBfc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgcm9vdCA9IHRoaXMucm9vdE5vZGUsXG4gICAgICAgICAgICByb290SWQgPSByb290LmdldElkKCk7XG5cbiAgICAgICAgdGhpcy50cmVlSGFzaFtyb290SWRdID0gcm9vdDtcbiAgICAgICAgdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHJvb3QpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRyZWUgaGFzaCBmcm9tIGRhdGEgYW5kIHBhcmVudE5vZGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVHJlZSBkYXRhXG4gICAgICogQHBhcmFtIHtUcmVlTm9kZX0gcGFyZW50IC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IEFkZGVkIG5vZGUgaWRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZVRyZWVIYXNoOiBmdW5jdGlvbihkYXRhLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIHBhcmVudElkID0gcGFyZW50LmdldElkKCksXG4gICAgICAgICAgICBpZHMgPSBbXTtcblxuICAgICAgICBmb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKGRhdHVtKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW5EYXRhID0gZGF0dW0uY2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMuX2NyZWF0ZU5vZGUoZGF0dW0sIHBhcmVudElkKSxcbiAgICAgICAgICAgICAgICBub2RlSWQgPSBub2RlLmdldElkKCk7XG5cbiAgICAgICAgICAgIGlkcy5wdXNoKG5vZGVJZCk7XG4gICAgICAgICAgICB0aGlzLnRyZWVIYXNoW25vZGVJZF0gPSBub2RlO1xuICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcbiAgICAgICAgICAgIHRoaXMuX21ha2VUcmVlSGFzaChjaGlsZHJlbkRhdGEsIG5vZGUpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gaWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgbm9kZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlRGF0YSAtIERhdHVtIG9mIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgaWRcbiAgICAgKiBAcmV0dXJucyB7VHJlZU5vZGV9IFRyZWVOb2RlXG4gICAgICovXG4gICAgX2NyZWF0ZU5vZGU6IGZ1bmN0aW9uKG5vZGVEYXRhLCBwYXJlbnRJZCkge1xuICAgICAgICBub2RlRGF0YSA9IGV4dGVuZCh7XG4gICAgICAgICAgICBzdGF0ZTogdGhpcy5ub2RlRGVmYXVsdFN0YXRlXG4gICAgICAgIH0sIG5vZGVEYXRhKTtcblxuICAgICAgICByZXR1cm4gbmV3IFRyZWVOb2RlKG5vZGVEYXRhLCBwYXJlbnRJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGlsZHJlblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMgez9BcnJheS48VHJlZU5vZGU+fSBjaGlsZHJlblxuICAgICAqL1xuICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5nZXRDaGlsZElkcyhub2RlSWQpO1xuXG4gICAgICAgIGlmICghY2hpbGRJZHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hcChjaGlsZElkcywgZnVuY3Rpb24oY2hpbGRJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZShjaGlsZElkKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjaGlsZCBpZHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/QXJyYXkuPHN0cmluZz59IENoaWxkIGlkc1xuICAgICAqL1xuICAgIGdldENoaWxkSWRzOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0Q2hpbGRJZHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBudW1iZXIgb2Ygbm9kZXNcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIG5vZGVzXG4gICAgICovXG4gICAgZ2V0Q291bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ga2V5cyh0aGlzLnRyZWVIYXNoKS5sZW5ndGg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBsYXN0IGRlcHRoXG4gICAgICogQHJldHVybnMge251bWJlcn0gVGhlIGxhc3QgZGVwdGhcbiAgICAgKi9cbiAgICBnZXRMYXN0RGVwdGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGVwdGhzID0gbWFwKHRoaXMudHJlZUhhc2gsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldERlcHRoKG5vZGUuZ2V0SWQoKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShudWxsLCBkZXB0aHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIG5vZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBBIG5vZGUgaWQgdG8gZmluZFxuICAgICAqIEByZXR1cm5zIHs/VHJlZU5vZGV9IE5vZGVcbiAgICAgKi9cbiAgICBnZXROb2RlOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmVlSGFzaFtpZF07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBkZXB0aCBmcm9tIG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBBIG5vZGUgaWQgdG8gZmluZFxuICAgICAqIEByZXR1cm5zIHs/bnVtYmVyfSBEZXB0aFxuICAgICAqL1xuICAgIGdldERlcHRoOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXG4gICAgICAgICAgICBkZXB0aCA9IDAsXG4gICAgICAgICAgICBwYXJlbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudCA9IHRoaXMuZ2V0Tm9kZShub2RlLmdldFBhcmVudElkKCkpO1xuICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICBkZXB0aCArPSAxO1xuICAgICAgICAgICAgcGFyZW50ID0gdGhpcy5nZXROb2RlKHBhcmVudC5nZXRQYXJlbnRJZCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXB0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHBhcmVudCBpZCBvZiBub2RlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gTm9kZSBpZFxuICAgICAqIEByZXR1cm5zIHs/c3RyaW5nfSBQYXJlbnQgaWRcbiAgICAgKi9cbiAgICBnZXRQYXJlbnRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUoaWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRQYXJlbnRJZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBub2RlIHdpdGggY2hpbGRyZW4uXG4gICAgICogLSBUaGUgdXBkYXRlIGV2ZW50IHdpbGwgYmUgZmlyZWQgd2l0aCBwYXJlbnQgbm9kZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkIHRvIHJlbW92ZVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKGlkLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCksXG4gICAgICAgICAgICBwYXJlbnQ7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnQgPSB0aGlzLmdldE5vZGUobm9kZS5nZXRQYXJlbnRJZCgpKTtcblxuICAgICAgICBmb3JFYWNoKG5vZGUuZ2V0Q2hpbGRJZHMoKSwgZnVuY3Rpb24oY2hpbGRJZCkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoY2hpbGRJZCwgdHJ1ZSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZElkKGlkKTtcbiAgICAgICAgZGVsZXRlIHRoaXMudHJlZUhhc2hbaWRdO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgcGFyZW50LmdldElkKCkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBub2RlKHMpLlxuICAgICAqIC0gSWYgdGhlIHBhcmVudElkIGlzIGZhbHN5LCB0aGUgbm9kZSB3aWxsIGJlIGFwcGVuZGVkIHRvIHJvb3ROb2RlLlxuICAgICAqIC0gVGhlIHVwZGF0ZSBldmVudCB3aWxsIGJlIGZpcmVkIHdpdGggcGFyZW50IG5vZGUuXG4gICAgICogQHBhcmFtIHtBcnJheXxvYmplY3R9IGRhdGEgLSBSYXctZGF0YVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCAtIFBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IE5ldyBhZGRlZCBub2RlIGlkc1xuICAgICAqL1xuICAgIGFkZDogZnVuY3Rpb24oZGF0YSwgcGFyZW50SWQsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpIHx8IHRoaXMucm9vdE5vZGUsXG4gICAgICAgICAgICBpZHM7XG5cbiAgICAgICAgZGF0YSA9IFtdLmNvbmNhdChkYXRhKTtcbiAgICAgICAgaWRzID0gdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEsIHBhcmVudCk7XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBwYXJlbnQuZ2V0SWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgLSBQcm9wZXJ0aWVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaWxlbnRdIC0gSWYgdHJ1ZSwgaXQgZG9lc24ndCB0cmlnZ2VyIHRoZSAndXBkYXRlJyBldmVudFxuICAgICAqL1xuICAgIHNldE5vZGVEYXRhOiBmdW5jdGlvbihpZCwgcHJvcHMsIGlzU2lsZW50KSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKGlkKTtcblxuICAgICAgICBpZiAoIW5vZGUgfHwgIXByb3BzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLnNldERhdGEocHJvcHMpO1xuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBub2RlIGRhdGFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl9IG5hbWVzIC0gTmFtZXMgb2YgcHJvcGVydGllc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2lsZW50XSAtIElmIHRydWUsIGl0IGRvZXNuJ3QgdHJpZ2dlciB0aGUgJ3VwZGF0ZScgZXZlbnRcbiAgICAgKi9cbiAgICByZW1vdmVOb2RlRGF0YTogZnVuY3Rpb24oaWQsIG5hbWVzLCBpc1NpbGVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZShpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8ICFuYW1lcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR1aS51dGlsLmlzQXJyYXkobmFtZXMpKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZURhdGEuYXBwbHkobm9kZSwgbmFtZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVEYXRhKG5hbWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXNTaWxlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgYSBub2RlIHRvIG5ldyBwYXJlbnQncyBjaGlsZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaW5kZXhdIC0gU3RhcnQgaW5kZXggbnVtYmVyIGZvciBpbnNlcnRpbmdcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NpbGVudF0gLSBJZiB0cnVlLCBpdCBkb2Vzbid0IHRyaWdnZXIgdGhlICd1cGRhdGUnIGV2ZW50XG4gICAgICovXG4gICAgLyplc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5Ki9cbiAgICBtb3ZlOiBmdW5jdGlvbihub2RlSWQsIG5ld1BhcmVudElkLCBpbmRleCwgaXNTaWxlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcbiAgICAgICAgdmFyIG9yaWdpbmFsUGFyZW50SWQsIG5ld1BhcmVudDtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ld1BhcmVudCA9IHRoaXMuZ2V0Tm9kZShuZXdQYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZTtcbiAgICAgICAgbmV3UGFyZW50SWQgPSBuZXdQYXJlbnQuZ2V0SWQoKTtcbiAgICAgICAgb3JpZ2luYWxQYXJlbnRJZCA9IG5vZGUuZ2V0UGFyZW50SWQoKTtcbiAgICAgICAgaW5kZXggPSB0dWkudXRpbC5pc1VuZGVmaW5lZChpbmRleCkgPyAtMSA6IGluZGV4O1xuXG4gICAgICAgIGlmIChub2RlSWQgPT09IG5ld1BhcmVudElkIHx8IHRoaXMuY29udGFpbnMobm9kZUlkLCBuZXdQYXJlbnRJZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NoYW5nZU9yZGVyT2ZDaGlsZElkKG5vZGVJZCwgbmV3UGFyZW50SWQsIG9yaWdpbmFsUGFyZW50SWQsIGluZGV4KTtcbiAgICAgICAgbm9kZS5zZXRQYXJlbnRJZChuZXdQYXJlbnRJZCk7XG5cbiAgICAgICAgaWYgKCFpc1NpbGVudCkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCdtb3ZlJywgbm9kZUlkLCBvcmlnaW5hbFBhcmVudElkLCBuZXdQYXJlbnRJZCwgaW5kZXgpO1xuICAgICAgICB9XG4gICAgfSwgLyplc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHkqL1xuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIG9yZGVyIG9mIGNoaWxkIGlkIGJ5IG1vdmluZyBpbmRleFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1BhcmVudElkIC0gTmV3IHBhcmVudCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcmlnaW5hbFBhcmVudElkIC0gT3JpZ2luYWwgcGFyZW50IGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gTW92aW5nIGluZGV4IChXaGVuIGNoaWxkIG5vZGUgaXMgbW92ZWQgb24gcGFyZW50IG5vZGUsIHRoZSB2YWx1ZSBpcyAtMSlcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jaGFuZ2VPcmRlck9mQ2hpbGRJZDogZnVuY3Rpb24obm9kZUlkLCBuZXdQYXJlbnRJZCwgb3JpZ2luYWxQYXJlbnRJZCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIG5ld1BhcmVudCA9IHRoaXMuZ2V0Tm9kZShuZXdQYXJlbnRJZCkgfHwgdGhpcy5yb290Tm9kZTtcbiAgICAgICAgdmFyIG9yaWdpbmFsUGFyZW50ID0gdGhpcy5nZXROb2RlKG9yaWdpbmFsUGFyZW50SWQpO1xuICAgICAgICB2YXIgaXNTYW1lUGFyZW50SWRzID0gKG5ld1BhcmVudElkID09PSBvcmlnaW5hbFBhcmVudElkKTtcblxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAoaXNTYW1lUGFyZW50SWRzKSB7XG4gICAgICAgICAgICAgICAgbmV3UGFyZW50Lm1vdmVDaGlsZElkKG5vZGVJZCwgaW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXdQYXJlbnQuaW5zZXJ0Q2hpbGRJZChub2RlSWQsIGluZGV4KTtcbiAgICAgICAgICAgICAgICBvcmlnaW5hbFBhcmVudC5yZW1vdmVDaGlsZElkKG5vZGVJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWlzU2FtZVBhcmVudElkcykge1xuICAgICAgICAgICAgbmV3UGFyZW50LmFkZENoaWxkSWQobm9kZUlkKTtcbiAgICAgICAgICAgIG9yaWdpbmFsUGFyZW50LnJlbW92ZUNoaWxkSWQobm9kZUlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGEgbm9kZSBpcyBhIGFuY2VzdG9yIG9mIGFub3RoZXIgbm9kZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBJZCBvZiBhIG5vZGUgdGhhdCBtYXkgY29udGFpbiB0aGUgb3RoZXIgbm9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZWRJZCAtIElkIG9mIGEgbm9kZSB0aGF0IG1heSBiZSBjb250YWluZWQgYnkgdGhlIG90aGVyIG5vZGVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciBhIG5vZGUgY29udGFpbnMgYW5vdGhlciBub2RlXG4gICAgICovXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGNvbnRhaW5lcklkLCBjb250YWluZWRJZCkge1xuICAgICAgICB2YXIgcGFyZW50SWQgPSB0aGlzLmdldFBhcmVudElkKGNvbnRhaW5lZElkKSxcbiAgICAgICAgICAgIGlzQ29udGFpbmVkID0gZmFsc2U7XG5cbiAgICAgICAgd2hpbGUgKCFpc0NvbnRhaW5lZCAmJiBwYXJlbnRJZCkge1xuICAgICAgICAgICAgaXNDb250YWluZWQgPSAoY29udGFpbmVySWQgPT09IHBhcmVudElkKTtcbiAgICAgICAgICAgIHBhcmVudElkID0gdGhpcy5nZXRQYXJlbnRJZChwYXJlbnRJZCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXNDb250YWluZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNvcnQgbm9kZXNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIC0gQ29tcGFyYXRvciBmdW5jdGlvblxuICAgICAqL1xuICAgIHNvcnQ6IGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcbiAgICAgICAgdGhpcy5lYWNoQWxsKGZ1bmN0aW9uKG5vZGUsIG5vZGVJZCkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRDaGlsZHJlbihub2RlSWQpLFxuICAgICAgICAgICAgICAgIGNoaWxkSWRzO1xuXG4gICAgICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuLnNvcnQoY29tcGFyYXRvcik7XG5cbiAgICAgICAgICAgICAgICBjaGlsZElkcyA9IG1hcChjaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkLmdldElkKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbm9kZS5yZXBsYWNlQ2hpbGRJZHMoY2hpbGRJZHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgZGF0YSAoYWxsKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMgez9vYmplY3R9IE5vZGUgZGF0YVxuICAgICAqL1xuICAgIGdldE5vZGVEYXRhOiBmdW5jdGlvbihub2RlSWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0QWxsRGF0YSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIG5vZGVzLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIC0gSXRlcmF0ZWUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxuICAgICAqL1xuICAgIGVhY2hBbGw6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XG5cbiAgICAgICAgZm9yRWFjaCh0aGlzLnRyZWVIYXNoLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVlLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZSB0aGlzIHRyZWUgaXRlcmF0aW5nIG92ZXIgYWxsIGRlc2NlbmRhbnRzIG9mIGEgbm9kZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSAtIEl0ZXJhdGVlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIC0gUGFyZW50IG5vZGUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gQ29udGV4dCBvZiBpdGVyYXRlZVxuICAgICAqL1xuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdGVlLCBwYXJlbnRJZCwgY29udGV4dCkgeyAvL2RlcHRoLWZpcnN0XG4gICAgICAgIHZhciBzdGFjaywgbm9kZUlkLCBub2RlO1xuXG4gICAgICAgIG5vZGUgPSB0aGlzLmdldE5vZGUocGFyZW50SWQpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdGFjayA9IG5vZGUuZ2V0Q2hpbGRJZHMoKTtcblxuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xuICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICBub2RlSWQgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLmdldE5vZGUobm9kZUlkKTtcbiAgICAgICAgICAgIGl0ZXJhdGVlLmNhbGwoY29udGV4dCwgbm9kZSwgbm9kZUlkKTtcblxuICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5jb25jYXQobm9kZS5nZXRDaGlsZElkcygpKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVHJlZU1vZGVsKTtcbm1vZHVsZS5leHBvcnRzID0gVHJlZU1vZGVsO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RhdGVzID0gcmVxdWlyZSgnLi9jb25zdHMvc3RhdGVzJykubm9kZSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbnZhciBsYXN0SW5kZXggPSAwLFxuICAgIGdldE5leHRJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5kZXggPSBsYXN0SW5kZXg7XG4gICAgICAgIGxhc3RJbmRleCArPSAxO1xuXG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9LFxuICAgIFJFU0VSVkVEX1BST1BFUlRJRVMgPSB7XG4gICAgICAgIGlkOiAnJyxcbiAgICAgICAgc3RhdGU6ICdzZXRTdGF0ZScsXG4gICAgICAgIGNoaWxkcmVuOiAnJ1xuICAgIH0sXG4gICAgaW5BcnJheSA9IHR1aS51dGlsLmluQXJyYXk7XG5cbi8qKlxuICogVHJlZU5vZGVcbiAqIEBDbGFzcyBUcmVlTm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG5vZGVEYXRhIC0gTm9kZSBkYXRhXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudElkXSAtIFBhcmVudCBub2RlIGlkXG4gKiBAaWdub3JlXG4gKi9cbnZhciBUcmVlTm9kZSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU5vZGUucHJvdG90eXBlICoveyAvKmVzbGludC1kaXNhYmxlKi9cbiAgICBzdGF0aWM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCBwcmVmaXggb2YgaWRcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIFByZWZpeCBvZiBpZFxuICAgICAgICAgKi9cbiAgICAgICAgc2V0SWRQcmVmaXg6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICAgICAgdGhpcy5pZFByZWZpeCA9IHByZWZpeCB8fCB0aGlzLmlkUHJlZml4O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcmVmaXggb2YgaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGlkUHJlZml4OiAnJ1xuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24obm9kZURhdGEsIHBhcmVudElkKSB7IC8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb2RlIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9pZCA9IHRoaXMuY29uc3RydWN0b3IuaWRQcmVmaXggKyBnZXROZXh0SW5kZXgoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFyZW50IG5vZGUgaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3BhcmVudElkID0gcGFyZW50SWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgICAgICogQHR5cGUge0FycmF5LjxudW1iZXI+fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fY2hpbGRJZHMgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9kZSBkYXRhXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9kYXRhID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vZGUgc3RhdGVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLkNMT1NFRDtcblxuICAgICAgICB0aGlzLnNldERhdGEobm9kZURhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcmVzZXJ2ZWQgcHJvcGVydGllcyBmcm9tIGRhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIE5vZGUgZGF0YVxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IE5vZGUgZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJlc2VydmVkUHJvcGVydGllczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoT3duUHJvcGVydGllcyhSRVNFUlZFRF9QUk9QRVJUSUVTLCBmdW5jdGlvbihzZXR0ZXIsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbbmFtZV07XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiBzZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3NldHRlcl0odmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGRhdGFbbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgc3RhdGVcbiAgICAgKiBAYXBpXG4gICAgICovXG4gICAgdG9nZ2xlU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdGUgPT09IHN0YXRlcy5DTE9TRUQpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLk9QRU5FRDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzLkNMT1NFRDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgc3RhdGVcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIC0gU3RhdGUgb2Ygbm9kZSAoJ2Nsb3NlZCcsICdvcGVuZWQnKVxuICAgICAqL1xuICAgIHNldFN0YXRlOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICBzdGF0ZSA9IFN0cmluZyhzdGF0ZSk7XG4gICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGVzW3N0YXRlLnRvVXBwZXJDYXNlKCldIHx8IHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc3RhdGVcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gc3RhdGUgKCdvcGVuZWQnIG9yICdjbG9zZWQnKVxuICAgICAqL1xuICAgIGdldFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWRcbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge3N0cmluZ30gTm9kZSBpZFxuICAgICAqL1xuICAgIGdldElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgcGFyZW50IGlkXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFBhcmVudCBub2RlIGlkXG4gICAgICovXG4gICAgZ2V0UGFyZW50SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50SWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBwYXJlbnQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgLSBQYXJlbnQgbm9kZSBpZFxuICAgICAqL1xuICAgIHNldFBhcmVudElkOiBmdW5jdGlvbihwYXJlbnRJZCkge1xuICAgICAgICB0aGlzLl9wYXJlbnRJZCA9IHBhcmVudElkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXBsYWNlIGNoaWxkSWRzXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gY2hpbGRJZHMgLSBJZCBsaXN0IG9mIGNoaWxkcmVuXG4gICAgICovXG4gICAgcmVwbGFjZUNoaWxkSWRzOiBmdW5jdGlvbihjaGlsZElkcykge1xuICAgICAgICB0aGlzLl9jaGlsZElkcyA9IGNoaWxkSWRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaWQgbGlzdCBvZiBjaGlsZHJlblxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj59IElkIGxpc3Qgb2YgY2hpbGRyZW5cbiAgICAgKi9cbiAgICBnZXRDaGlsZElkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZElkcy5zbGljZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICovXG4gICAgYWRkQ2hpbGRJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5fY2hpbGRJZHM7XG5cbiAgICAgICAgaWYgKHR1aS51dGlsLmluQXJyYXkoY2hpbGRJZHMsIGlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNoaWxkSWRzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjaGlsZCBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIENoaWxkIG5vZGUgaWRcbiAgICAgKi9cbiAgICByZW1vdmVDaGlsZElkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB1dGlsLnJlbW92ZUl0ZW1Gcm9tQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGRhdGFcbiAgICAgKiBAYXBpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBQcm9wZXJ0eSBuYW1lIG9mIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7Kn0gRGF0YVxuICAgICAqL1xuICAgIGdldERhdGE6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhbGwgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBEYXRhXG4gICAgICovXG4gICAgZ2V0QWxsRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5leHRlbmQoe30sIHRoaXMuX2RhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIERhdGEgZm9yIGFkZGluZ1xuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZGF0YSA9IHRoaXMuX3NldFJlc2VydmVkUHJvcGVydGllcyhkYXRhKTtcbiAgICAgICAgdHVpLnV0aWwuZXh0ZW5kKHRoaXMuX2RhdGEsIGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZGF0YVxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0gey4uLnN0cmluZ30gbmFtZXMgLSBOYW1lcyBvZiBkYXRhXG4gICAgICovXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2hBcnJheShhcmd1bWVudHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhpcyBub2RlIGhhcyBhIHByb3ZpZGVkIGNoaWxkIGlkLlxuICAgICAqIEBhcGlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBOb2RlIGlkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IC0gV2hldGhlciB0aGlzIG5vZGUgaGFzIGEgcHJvdmlkZWQgY2hpbGQgaWQuXG4gICAgICovXG4gICAgaGFzQ2hpbGQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiBpbkFycmF5KGlkLCB0aGlzLl9jaGlsZElkcykgIT09IC0xO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIG5vZGUgaXMgbGVhZi5cbiAgICAgKiBAYXBpXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IE5vZGUgaXMgbGVhZiBvciBub3QuXG4gICAgICovXG4gICAgaXNMZWFmOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLl9jaGlsZElkcy5sZW5ndGggJiYgIXRoaXMuZ2V0RGF0YSgnaGFzQ2hpbGQnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBub2RlIGlzIHJvb3QuXG4gICAgICogQGFwaVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBOb2RlIGlzIHJvb3Qgb3Igbm90LlxuICAgICAqL1xuICAgIGlzUm9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5pc0ZhbHN5KHRoaXMuX3BhcmVudElkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGluZGV4IG9mIGNoaWxkXG4gICAgICogQGFwaVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIE5vZGUgaWRcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBJbmRleCBvZiBjaGlsZCBpbiBjaGlsZHJlbiBsaXN0XG4gICAgICovXG4gICAgZ2V0Q2hpbGRJbmRleDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIGluQXJyYXkoaWQsIHRoaXMuX2NoaWxkSWRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5zZXJ0IGNoaWxkIGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gQ2hpbGQgbm9kZSBpZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIEluZGV4IG51bWJlciBvZiBpbnNlcnQgcG9zaXRpb25cbiAgICAgKi9cbiAgICBpbnNlcnRDaGlsZElkOiBmdW5jdGlvbihpZCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5fY2hpbGRJZHM7XG5cbiAgICAgICAgaWYgKGluQXJyYXkoaWQsIGNoaWxkSWRzKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNoaWxkSWRzLnNwbGljZShpbmRleCwgMCwgaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgY2hpbGQgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBDaGlsZCBub2RlIGlkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gSW5kZXggbnVtYmVyIG9mIGluc2VydCBwb3NpdGlvblxuICAgICAqL1xuICAgIG1vdmVDaGlsZElkOiBmdW5jdGlvbihpZCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGNoaWxkSWRzID0gdGhpcy5fY2hpbGRJZHM7XG4gICAgICAgIHZhciBvcmlnaW5JZHggPSB0aGlzLmdldENoaWxkSW5kZXgoaWQpO1xuXG4gICAgICAgIGlmIChpbkFycmF5KGlkLCBjaGlsZElkcykgIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAob3JpZ2luSWR4IDwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpbmRleCAtPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjaGlsZElkcy5zcGxpY2UoaW5kZXgsIDAsIGNoaWxkSWRzLnNwbGljZShvcmlnaW5JZHgsIDEpWzBdKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xubW9kdWxlLmV4cG9ydHMgPSBUcmVlTm9kZTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBIZWxwZXIgb2JqZWN0IHRvIG1ha2UgZWFzeSB0cmVlIGVsZW1lbnRzXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiBMYWIgPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGlzVW5kZWZpbmVkID0gdHVpLnV0aWwuaXNVbmRlZmluZWQsXG4gICAgcGljayA9IHR1aS51dGlsLnBpY2ssXG4gICAgdGVtcGxhdGVNYXNrUmUgPSAvXFx7XFx7KC4rPyl9fS9naSxcbiAgICBpc1ZhbGlkRG90Tm90YXRpb25SZSA9IC9eXFx3Kyg/OlxcLlxcdyspKiQvLFxuICAgIGlzVmFsaWREb3ROb3RhdGlvbiA9IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICByZXR1cm4gaXNWYWxpZERvdE5vdGF0aW9uUmUudGVzdChzdHIpO1xuICAgIH0sXG4gICAgaXNBcnJheSA9IHR1aS51dGlsLmlzQXJyYXlTYWZlLFxuICAgIGlzU3VwcG9ydFBhZ2VPZmZzZXQgPSB0eXBlb2Ygd2luZG93LnBhZ2VYT2Zmc2V0ICE9PSAndW5kZWZpbmVkJyxcbiAgICBpc0NTUzFDb21wYXQgPSBkb2N1bWVudC5jb21wYXRNb2RlID09PSAnQ1NTMUNvbXBhdCc7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG52YXIgdXRpbCA9IHtcbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlyc3Qgc3BlY2lmaWVkIGl0ZW0gZnJvbSBhcnJheSwgaWYgaXQgZXhpc3RzXG4gICAgICogQHBhcmFtIHsqfSBpdGVtIEl0ZW0gdG8gbG9vayBmb3JcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIgQXJyYXkgdG8gcXVlcnlcbiAgICAgKi9cbiAgICByZW1vdmVJdGVtRnJvbUFycmF5OiBmdW5jdGlvbihpdGVtLCBhcnIpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gYXJyLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGlmIChpdGVtID09PSBhcnJbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmRleCAtPSAxO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjbGFzc25hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gVGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIC0gQ2xhc3NuYW1lXG4gICAgICovXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgICAgICB9IGVsc2UgaWYgKCF1dGlsLmhhc0NsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lICs9ICcgJyArIGNsYXNzTmFtZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgY2xhc3NuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSAtIENsYXNzbmFtZVxuICAgICAqL1xuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIG9yaWdpbmFsQ2xhc3NOYW1lID0gdXRpbC5nZXRDbGFzcyhlbGVtZW50KSxcbiAgICAgICAgICAgIGFyciwgaW5kZXg7XG5cbiAgICAgICAgaWYgKCFvcmlnaW5hbENsYXNzTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyID0gb3JpZ2luYWxDbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICAgICAgaW5kZXggPSB0dWkudXRpbC5pbkFycmF5KGNsYXNzTmFtZSwgYXJyKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGFyci5qb2luKCcgJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgdG8gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIEEgbmFtZSBvZiBldmVudFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhZGRcbiAgICAgKi9cbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgZnJvbSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmRldGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBFdmVudCB0YXJnZXRcbiAgICAgKi9cbiAgICBnZXRUYXJnZXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldDtcbiAgICAgICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgICAgICB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEhUTUxFbGVtZW50XG4gICAgICogQHJldHVybnMge3N0cmluZ30gQ2xhc3MgbmFtZVxuICAgICAqL1xuICAgIGdldENsYXNzOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50ICYmIGVsZW1lbnQuZ2V0QXR0cmlidXRlICYmXG4gICAgICAgICAgICAoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgfHwgZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzTmFtZScpIHx8ICcnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgdGhlIGVsZW1lbnQgaGFzIHNwZWNpZmljIGNsYXNzIG9yIG5vdFxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgQSBuYW1lIG9mIGNsYXNzIHRvIGZpbmRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZWxlbWVudCBoYXMgdGhlIGNsYXNzXG4gICAgICovXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgZWxDbGFzc05hbWUgPSB1dGlsLmdldENsYXNzKGVsZW1lbnQpO1xuXG4gICAgICAgIHJldHVybiBlbENsYXNzTmFtZS5pbmRleE9mKGNsYXNzTmFtZSkgPiAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBlbGVtZW50IGJ5IGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgQSBuYW1lIG9mIGNsYXNzXG4gICAgICogQHJldHVybnMge0FycmF5LjxIVE1MRWxlbWVudD59IEVsZW1lbnRzXG4gICAgICovXG4gICAgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZTogZnVuY3Rpb24odGFyZ2V0LCBjbGFzc05hbWUpIHtcbiAgICAgICAgdmFyIGFsbCwgZmlsdGVyZWQ7XG5cbiAgICAgICAgaWYgKHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZCA9IHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbGwgPSB0dWkudXRpbC50b0FycmF5KHRhcmdldC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpKTtcbiAgICAgICAgICAgIGZpbHRlcmVkID0gdHVpLnV0aWwuZmlsdGVyKGFsbCwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZSB8fCAnJztcblxuICAgICAgICAgICAgICAgIHJldHVybiAoY2xhc3NOYW1lcy5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB3aGV0aGVyIHRoZSBjbGljayBldmVudCBieSByaWdodCBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSBjbGljayBldmVudCBieSByaWdodCBidXR0b25cbiAgICAgKi9cbiAgICBpc1JpZ2h0QnV0dG9uOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICByZXR1cm4gdXRpbC5fZ2V0QnV0dG9uKGV2ZW50KSA9PT0gMjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgcHJvcGVydHkgZXhpc3Qgb3Igbm90XG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJvcHMgQSBwcm9wZXJ0eVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8Ym9vbGVhbn0gUHJvcGVydHkgbmFtZSBvciBmYWxzZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIHVzZXJTZWxlY3RQcm9wZXJ0eSA9IHV0aWwudGVzdFByb3AoW1xuICAgICAqICAgICAndXNlclNlbGVjdCcsXG4gICAgICogICAgICdXZWJraXRVc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ09Vc2VyU2VsZWN0JyxcbiAgICAgKiAgICAgJ01velVzZXJTZWxlY3QnLFxuICAgICAqICAgICAnbXNVc2VyU2VsZWN0J1xuICAgICAqIF0pO1xuICAgICAqL1xuICAgIHRlc3RQcm9wOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUsXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBmYWxzZTtcblxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBjb25zaXN0ZW50LXJldHVybiAqL1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHByb3BzLCBmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgICAgICBpZiAocHJvcCBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3A7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGNvbnNpc3RlbnQtcmV0dXJuICovXG5cbiAgICAgICAgcmV0dXJuIHByb3BlcnR5TmFtZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCBkZWZhdWx0IGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBodG1sIGZyb20gdGVtcGxhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc291cmNlIC0gVGVtcGxhdGUgaHRtbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRlbXBsYXRlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBodG1sXG4gICAgICovXG4gICAgcmVuZGVyVGVtcGxhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgcHJvcHMpIHtcbiAgICAgICAgZnVuY3Rpb24gcGlja1ZhbHVlKG5hbWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gcGljay5hcHBseShudWxsLCBbcHJvcHNdLmNvbmNhdChuYW1lcykpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdXJjZS5yZXBsYWNlKHRlbXBsYXRlTWFza1JlLCBmdW5jdGlvbihtYXRjaCwgbmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlO1xuXG4gICAgICAgICAgICBpZiAoaXNWYWxpZERvdE5vdGF0aW9uKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwaWNrVmFsdWUobmFtZS5zcGxpdCgnLicpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luKCcgJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6YXRpb24gZm9yIGV2ZW50IGJ1dHRvbiBwcm9wZXJ0eVxuICAgICAqIDA6IEZpcnN0IG1vdXNlIGJ1dHRvbiwgMjogU2Vjb25kIG1vdXNlIGJ1dHRvbiwgMTogQ2VudGVyIGJ1dHRvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybnMgez9udW1iZXJ9IGJ1dHRvbiB0eXBlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0QnV0dG9uOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgYnV0dG9uLFxuICAgICAgICAgICAgcHJpbWFyeSA9ICcwLDEsMyw1LDcnLFxuICAgICAgICAgICAgc2Vjb25kYXJ5ID0gJzIsNicsXG4gICAgICAgICAgICB3aGVlbCA9ICc0JztcblxuICAgICAgICBpZiAoZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uaGFzRmVhdHVyZSgnTW91c2VFdmVudHMnLCAnMi4wJykpIHtcbiAgICAgICAgICAgIHJldHVybiBldmVudC5idXR0b247XG4gICAgICAgIH1cblxuICAgICAgICBidXR0b24gPSBTdHJpbmcoZXZlbnQuYnV0dG9uKTtcbiAgICAgICAgaWYgKHByaW1hcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9IGVsc2UgaWYgKHNlY29uZGFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgIH0gZWxzZSBpZiAod2hlZWwuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBtb3VzZSBwb3NpdGlvblxuICAgICAqIEBwYXJhbSB7TW91c2VFdmV0fSBldmVudCAtIEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IFgsIFkgcG9zaXRpb24gb2YgbW91c2VcbiAgICAgKi9cbiAgICBnZXRNb3VzZVBvczogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LmNsaWVudFgsXG4gICAgICAgICAgICB5OiBldmVudC5jbGllbnRZXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB2YWx1ZSBvZiBzY3JvbGwgdG9wIG9uIGRvY3VtZW50LmJvZHkgKGNyb3NzIGJyb3dzaW5nKVxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIG9mIHNjcm9sbCB0b3BcbiAgICAgKi9cbiAgICBnZXRXaW5kb3dTY3JvbGxUb3A6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2Nyb2xsVG9wO1xuXG4gICAgICAgIGlmIChpc1N1cHBvcnRQYWdlT2Zmc2V0KSB7XG4gICAgICAgICAgICBzY3JvbGxUb3AgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JvbGxUb3AgPSBpc0NTUzFDb21wYXQgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIDogZG9jdW1lbnQuYm9keS5zY3JvbGxUb3A7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2Nyb2xsVG9wO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiJdfQ==
