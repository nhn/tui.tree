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
