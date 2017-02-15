/**
 * @fileoverview Render tree and update tree
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
 * @param {string|HTMLElement|jQueryObject} conatiner - Tree container element or id string value
 * @param {Object} options The options
 *     @param {Object} [options.data] A data to be used on tree
 *     @param {string} [options.nodeIdPrefix] A default prefix of a node
 *     @param {Object} [options.nodeDefaultState] A default state of a node
 *     @param {Object} [options.stateLabels] Toggle button state label
 *         @param {string} [options.stateLabels.opened] State-OPENED label
 *         @param {string} [options.stateLabels.closed] State-CLOSED label
 *     @param {Object} [options.template] A markup set to make element
 *         @param {string} [options.template.internalNode] HTML template
 *         @param {string} [options.template.leafNode] HTML template
 *     @param {Function} [options.renderTemplate] Function for rendering template
 * @example
 * // Default options:
 * // {
 * //     data: [],
 * //     nodeIdPrefix: 'tui-tree-node-',
 * //     nodeDefaultState: 'closed',
 * //     stateLabels: {
 * //         opened: '-',
 * //         closed: '+'
 * //     },
 * //     template: {
 * //         internalNode:
 * //             '<div class="tui-tree-btn">' +
 * //                 '<button type="button" class="tui-tree-toggle-btn tui-js-tree-toggle-btn">' +
 * //                     '<span class="tui-ico-tree"></span>' +
 * //                     '{{stateLabel}}' +
 * //                 '</button>' +
 * //                 '<span class="tui-tree-text tui-js-tree-text">' +
 * //                     '<span class="tui-tree-ico tui-ico-folder"></span>' +
 * //                     '{{text}}' +
 * //                 '</span>' +
 * //             '</div>' +
 * //             '<ul class="tui-tree-subtree tui-js-tree-subtree">' +
 * //                 '{{children}}' +
 * //             '</ul>',
 * //         leafNode:
 * //             '<div class="tui-tree-btn">' +
 * //                 '<span class="tui-tree-text tui-js-tree-text">' +
 * //                     '<span class="tui-tree-ico tui-ico-file"></span>' +
 * //                     '{{text}}' +
 * //                 '</span>' +
 * //             '</div>'
 * //     }
 * // }
 * var container = document.getElementById('tree');
 * var data = [
 *     {text: 'rootA', children: [
 *         {text: 'root-1A'},
 *         {text: 'root-1B'},
 *         {text: 'root-1C'},
 *         {text: 'root-1D'},
 *         {text: 'root-2A', children: [
 *             {text: 'sub_1A', children:[
 *                 {text: 'sub_sub_1A'}
 *             ]},
 *             {text: 'sub_2A'}
 *         ]},
 *         {text: 'root-2B'},
 *         {text: 'root-2C'},
 *         {text: 'root-2D'},
 *         {text: 'root-3A', children: [
 *             {text: 'sub3_a'},
 *             {text: 'sub3_b'}
 *         ]},
 *         {text: 'root-3B'},
 *         {text: 'root-3C'},
 *         {text: 'root-3D'}
 *     ]},
 *     {text: 'rootB', children: [
 *         {text: 'B_sub1'},
 *         {text: 'B_sub2'},
 *         {text: 'b'}
 *     ]}
 * ];
 * var tree = new tui.component.Tree(container, {
 *     data: data,
 *     nodeDefaultState: 'opened',
 *
 *     // ========= Option: Override template renderer ===========
 *
 *     template: { // template for Mustache engine
 *         internalNode:
 *             '<div class="tui-tree-btn">' +
 *                 '<button type="button" class="tui-tree-toggle-btn tui-js-tree-toggle-btn">' +
 *                     '<span class="tui-ico-tree"></span>' +
 *                     '{{stateLabel}}' +
 *                 '</button>' +
 *                 '<span class="tui-tree-text tui-js-tree-text">' +
 *                     '<span class="tui-tree-ico tui-ico-folder"></span>' +
 *                     '{{text}}' +
 *                 '</span>' +
 *             '</div>' +
 *             '<ul class="tui-tree-subtree tui-js-tree-subtree">' +
 *                  '{{{children}}}' +
 *             '</ul>',
 *         leafNode:
 *             '<div class="tui-tree-btn">' +
 *                 '<span class="tui-tree-text tui-js-tree-text">' +
 *                     '<span class="tui-tree-ico tui-ico-file"></span>' +
 *                     '{{text}}' +
 *                 '</span>' +
 *             '</div>'
 *     },
 *     renderTemplate: function(tmpl, props) {
 *         // Mustache template engine
 *         return Mustache.render(tmpl, props);
 *     }
 * });
 */
var Tree = snippet.defineClass(/** @lends Tree.prototype */ {
    init: function(container, options) {
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
        this.rootElement = null;

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
        this.model = new TreeModel(options);

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

        this._setRoot(container);
        this._draw(this.getRootNodeId());
        this._setEvents();
    },

    /**
     * Set root element of tree
     * @param {string|HTMLElement|jQueryObject} container - Container element or id selector
     * @private
     */
    _setRoot: function(container) {
        var rootElement = outerTemplate.ROOT;

        if (snippet.isString(container)) {
            container = document.getElementById(container);
        } else if (container.jquery) {
            container = container[0];
        }

        if (!snippet.isHTMLNode(container)) {
            throw new Error(messages.INVALID_CONTAINER_ELEMENT);
        }

        container.innerHTML = rootElement;
        this.rootElement = container.firstChild;
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
         * @param {{nodeId: string, originalParentId: string, newParentId: string, index: number}} evt - Event data
         *     @param {string} evt.nodeId - Current node id to move
         *     @param {string} evt.originalParentId - Original parent node id of moved node
         *     @param {string} evt.newParentId - New parent node id of moved node
         *     @param {number} evt.index - Moved index number
         * @example
         * tree.on('move', function(evt) {
         *     var nodeId = evt.nodeId;
         *     var originalParentId = evt.originalParentId;
         *     var newParentId = evt.newParentId;
         *     var index = evt.index;
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

        /* eslint-disable require-jsdoc */
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
        /* eslint-enable require-jsdoc */

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
        var target = util.getTarget(event);
        var self = this;

        if (util.isRightButton(event)) {
            this.clickTimer = null;

            return;
        }

        if (this._isClickedToggleButton(target)) {
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
     * Whether target element is toggle button or not
     * @param {HTMLElement} target - Tree node element
     * @returns {boolean} State
     * @private
     */
    _isClickedToggleButton: function(target) {
        var nodeId = this.getNodeIdFromElement(target);
        var nodeElement;

        if (!nodeId) {
            return false;
        }

        nodeElement = util.getElementsByClassName(
            document.getElementById(nodeId),
            this.classNames.toggleBtnClass
        )[0];

        return (nodeElement && nodeElement.contains(target));
    },

    /**
     * Set node state - opened or closed
     * @param {string} nodeId - Node id
     * @param {string} state - Node state
     * @private
     */
    _setDisplayFromNodeState: function(nodeId, state) {
        var subtreeElement = this._getSubtreeElement(nodeId),
            label, btnElement, nodeElement, firstTextNode;

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
            firstTextNode = util.getFirstTextNode(btnElement);
            firstTextNode.nodeValue = label;
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
         * @param {{nodeId: string}} evt - Event data
         *     @param {string} evt.nodeId - Node id
         * @example
         * tree.on('beforeDraw', function(evt) {
         *     if (tree.isMovingNode) {
         *         console.log('isMovingNode');
         *     }
         *     console.log('beforeDraw: ' + evt.nodeId);
         * });
         */
        this.fire('beforeDraw', {nodeId: nodeId});

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
         * @param {{nodeId: string}} evt - Event data
         *     @param {string} evt.nodeId - Node id
         * @example
         * tree.on('afterDraw', function(evt) {
         *     if (tree.isMovingNode) {
         *         console.log('isMovingNode');
         *     }
         *     console.log('afterDraw: ' + evt.nodeId);
         * });
         */
        this.fire('afterDraw', {nodeId: nodeId});
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
            this._setNodeData(nodeId, {
                reload: false
            }, true);
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
        this._removeAllChildren(nodeId, {
            isSilent: true
        });

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
                    self.setNodeData(newParentId, {
                        reload: true
                    }, true);
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
         * @param {{nodeId: string, parentId: string}} evt - Event data
         *     @param {string} evt.nodeId - Current dragging node id
         *     @param {string} evt.parentId - New parent id
         * @example
         * tree.on('beforeMove', function(evt) {
         *      console.log('dragging node: ' + evt.nodeId);
         *      console.log('parent node: ' + evt.parentId);
         *
         *      return false; // Cancel "move" event
         *      // return true; // Fire "move" event
         * });
         */
        if (!this.invoke('beforeMove', {
            nodeId: nodeId,
            newParentId: newParentId
        })) {
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
