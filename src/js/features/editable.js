/**
 * @fileoverview Feature that each tree node is possible to edit as double click
 * @author NHN Ent. FE dev Lab <dl_javascript@nhnent.com>
 */
var util = require('./../util');
var ajaxCommand = require('./../consts/ajaxCommand');
var states = require('./../consts/states');
var snippet = require('tui-code-snippet');

var API_LIST = [
    'createChildNode',
    'editNode'
];
var EDIT_TYPE = {
    CREATE: 'create',
    UPDATE: 'update'
};
var WRAPPER_CLASSNAME = 'tui-input-wrap';
var INPUT_CLASSNAME = 'tui-tree-input';

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
var Editable = snippet.defineClass(/** @lends Editable.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberof Selectable
         * @returns {Array.<string>} API list of Editable
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },
    init: function(tree, options) {
        options = snippet.extend({}, options);

        /**
         * Tree
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Classname of editable element
         * @type {string}
         */
        this.editableClassName = options.editableClassName || tree.classNames.textClass;

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
         * Whether custom event is ignored or not
         * @type {Boolean}
         */
        this.isCustomEventIgnored = false;

        /**
         * Keyup event handler
         * @type {Function}
         */
        this.boundOnKeyup = snippet.bind(this._onKeyup, this);

        /**
         * Blur event handler
         * @type {Function}
         */
        this.boundOnBlur = snippet.bind(this._onBlur, this);

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
        snippet.forEach(API_LIST, function(apiName) {
            delete tree[apiName];
        });
    },

    /**
     * Create child node
     * @memberof Tree.prototype
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
     * @memberof Tree.prototype
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
        if (util.getKeyCode(event) === 13) {
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
     * @returns {HTMLElement} Input element
     * @private
     */
    _createInputElement: function() {
        var element = document.createElement('INPUT');
        element.setAttribute('type', 'text');
        util.addClass(element, INPUT_CLASSNAME);

        return element;
    },

    /**
     * Attach input element on tree
     * @param {string} nodeId - Node id
     * @private
     */
    _attachInputElement: function(nodeId) {
        var tree = this.tree;
        var target = document.getElementById(nodeId);
        var wrapperElement = document.createElement('DIV');
        var inputElement = this._createInputElement();

        if (!target) {
            return;
        }

        wrapperElement = util.getChildElementByClassName(target, WRAPPER_CLASSNAME);

        if (!wrapperElement) {
            wrapperElement = document.createElement('DIV');
            inputElement = this._createInputElement();

            util.addClass(wrapperElement, WRAPPER_CLASSNAME);
            wrapperElement.style.paddingLeft = tree.getIndentWidth(nodeId) + 'px';

            inputElement.value = tree.getNodeData(nodeId)[this.dataKey] || '';

            wrapperElement.appendChild(inputElement);
            target.appendChild(wrapperElement);

            util.addEventListener(inputElement, 'keyup', this.boundOnKeyup);
            util.addEventListener(inputElement, 'blur', this.boundOnBlur);

            if (this.inputElement) {
                this.inputElement.blur();
            }
            this.inputElement = inputElement;
        }

        this.inputElement.focus();
    },

    /**
     * Detach input element on tree
     * @private
     */
    _detachInputElement: function() {
        var tree = this.tree;
        var inputElement = this.inputElement;

        util.removeEventListener(inputElement, 'keyup', this.boundOnKeyup);
        util.removeEventListener(inputElement, 'blur', this.boundOnBlur);

        util.removeElement(inputElement);

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
         * @event Tree#beforeCreateChildNode
         * @param {{value: string}} evt - Event data
         *     @param {string} evt.value - Return value of creating input element
         * @example
         * tree
         *  .enableFeature('Editable')
         *  .on('beforeCreateChildNode', function(evt) {
         *      console.log(evt.value);
         *      return false; // It cancels
         *      // return true; // It execute next
         *  });
         */
        if (!this.tree.invoke('beforeCreateChildNode', {value: value})) {
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
         * @event Tree#beforeEditNode
         * @param {{value: string}} evt - Event data
         *     @param {string} evt.value - Return value of editing input element
         * @example
         * tree
         *  .enableFeature('Editable')
         *  .on('beforeEditNode', function(evt) {
         *      console.log(evt.value);
         *      return false; // It cancels
         *      // return true; // It execute next
         *  });
         */
        if (!this.tree.invoke('beforeEditNode', {value: value})) {
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
        var bind = snippet.bind;

        snippet.forEach(API_LIST, function(apiName) {
            tree[apiName] = bind(this[apiName], this);
        }, this);
    }
});

module.exports = Editable;
