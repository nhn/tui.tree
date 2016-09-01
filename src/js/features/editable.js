'use strict';

var util = require('./../util');
var ajaxCommand = require('./../consts/ajaxCommand');
var snippet = tui.util;
var API_LIST = [
    'createChildNode',
    'editNode'
];
var INPUT_TEMPLATE = '<input type="text">';
var WRAPPER_TEMPLATE = '<li class="{{nodeClass}} {{leafClass}}">{{innerTemplate}}</li>';
var EDIT_TYPE = {
    CREATE: 'create',
    UPDATE: 'update'
};

/**
 * Set the tree selectable
 * @class Editable
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {string} options.editableClassName - Classname of editable element
 *  @param {string} options.dataKey - Key of node data to set value
 *  @param {string} [options.dataValue] - Value of node data to set value (Use "createNode" API)
 *  @param {string} [options.inputClassName] - Classname of input element
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
         * Blur event handler
         * @type {Function}
         */
        this.boundOnBlur = tui.util.bind(this._onBlur, this);

        tree.on('doubleClick', this._onDoubleClick, this);

        util.addEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.addEventListener(this.inputElement, 'blur', this.boundOnBlur);

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
        util.removeEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.removeEventListener(this.inputElement, 'blur', this.boundOnBlur);
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

        this.mode = EDIT_TYPE.CREATE;

        if (useAjax) {
            tree.on('successResponse', this._onSuccessResponse, this);
        }

        if (!tree.isLeaf(parentId)) {
            tree.open(parentId);
        } else {
            this._attachInputElement(parentId);
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
        var inputElement;
        var tree = this.tree;
        var target = document.getElementById(nodeId);
        var textElement = util.getElementsByClassName(target, tree.classNames.textClass)[0];

        this.mode = EDIT_TYPE.UPDATE;

        inputElement = this.inputElement;
        inputElement.value = tree.getNodeData(nodeId)[this.dataKey] || '';

        textElement.parentNode.insertBefore(inputElement, textElement);
        textElement.style.display = 'none';

        inputElement.focus();

        util.addEventListener(this.inputElement, 'blur', this.boundOnBlur);
    },

    /**
     * Custom event handler "successResponse"
     * @param {string} type - Ajax command type
     * @param {Array.<string>} newNodeIds - Added node ids on tree
     * @private
     */
    _onSuccessResponse: function(type, newNodeIds) {
        var parentId;
        var tree = this.tree;

        if (type === ajaxCommand.READ && newNodeIds) {
            parentId = tree.getParentId(newNodeIds[0]);

            this._attachInputElement(parentId);
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
        /**
         * To prevent firing blur event after enter event is fired.
         */
        util.removeEventListener(this.inputElement, 'blur', this.boundOnBlur);

        if (event.keyCode === 13) { // keyup "enter"
            if (this.mode === EDIT_TYPE.CREATE) {
                this._addData();
            } else {
                this._setData();
            }
        }
    },

    /**
     * Event handler: blur - input element
     * @private
     */
    _onBlur: function() {
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
        var subtree;

        if (tree.isLeaf(nodeId)) {
            target.innerHTML = this._getOuterTemplate(nodeId);
            util.removeClass(target, tree.classNames.leafClass);
        } else {
            subtree = util.getElementsByClassName(target, tree.classNames.subtreeClass);
            subtree[0].innerHTML = subtree[0].innerHTML + this._getInnerTemplate();
        }

        this.inputElement = target.getElementsByTagName('input')[0];
        this.inputElement.focus();

        util.addEventListener(this.inputElement, 'keyup', this.boundOnKeyup);
        util.addEventListener(this.inputElement, 'blur', this.boundOnBlur);
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
            tree.off(this, 'successResponse');
        }
    },

    /**
     * Add data of input element to node and detach input element on tree
     * @private
     */
    _addData: function() {
        var tree = this.tree;
        var nodeId = tree.getNodeIdFromElement(this.inputElement);
        var data = {};

        if (nodeId) {
            data[this.dataKey] = this.inputElement.value || this.defaultValue;
            tree.add(data, nodeId);
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
        var data = {};

        if (nodeId) {
            data[this.dataKey] = this.inputElement.value;
            tree.setNodeData(nodeId, data);
        }
        this._detachInputElement();
    },

    /**
     * Get inner template to create warpper of input element
     * @returns {HTMLElement} Inner template
     * @private
     */
    _getInnerTemplate: function() {
        var classNames = this.tree.classNames;
        var props = {
            innerTemplate: INPUT_TEMPLATE
        };

        return util.renderTemplate(WRAPPER_TEMPLATE, snippet.extend(props, classNames));
    },

    /**
     * Get outer template to create warpper of input element
     * @param {string} nodeId - Selected node id
     * @returns {HTMLElement} Outer template
     * @private
     */
    _getOuterTemplate: function(nodeId) {
        var tree = this.tree;
        var state = tree.getState(nodeId);
        var nodeData = tree.getNodeData(nodeId);
        var template = tree.template.internalNode;
        var classNames = tree.classNames;
        var props = {
            stateClass: classNames[state + 'Class'],
            stateLabel: tree.stateLabels[state],
            children: this._getInnerTemplate()
        };

        return util.renderTemplate(template, snippet.extend(props, classNames, nodeData));
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
