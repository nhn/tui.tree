/**
 * @fileoverview Render tree and update tree
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var forEachArray = require('tui-code-snippet/collection/forEachArray');
var forEachOwnProperties = require('tui-code-snippet/collection/forEachOwnProperties');
var CustomEvents = require('tui-code-snippet/customEvents/customEvents');
var defineClass = require('tui-code-snippet/defineClass/defineClass');
var getTarget = require('tui-code-snippet/domEvent/getTarget');
var getMouseButton = require('tui-code-snippet/domEvent/getMouseButton');
var off = require('tui-code-snippet/domEvent/off');
var on = require('tui-code-snippet/domEvent/on');
var addClass = require('tui-code-snippet/domUtil/addClass');
var removeClass = require('tui-code-snippet/domUtil/removeClass');
var template = require('tui-code-snippet/domUtil/template');
var extend = require('tui-code-snippet/object/extend');
var isFunction = require('tui-code-snippet/type/isFunction');
var isHTMLNode = require('tui-code-snippet/type/isHTMLNode');
var isObject = require('tui-code-snippet/type/isObject');
var isString = require('tui-code-snippet/type/isString');
var isUndefined = require('tui-code-snippet/type/isUndefined');
var util = require('./util');

var defaultOption = require('./consts/defaultOption');
var states = require('./consts/states');
var messages = require('./consts/messages');
var outerTemplate = require('./consts/outerTemplate');
var ajaxCommand = require('./consts/ajaxCommand');
var TreeModel = require('./treeModel');
var Selectable = require('./features/selectable');
var Draggable = require('./features/draggable');
var Editable = require('./features/editable');
var Checkbox = require('./features/checkbox');
var ContextMenu = require('./features/contextMenu');
var Ajax = require('./features/ajax');

var nodeStates = states.node;
var features = {
  Selectable: Selectable,
  Draggable: Draggable,
  Editable: Editable,
  Checkbox: Checkbox,
  ContextMenu: ContextMenu,
  Ajax: Ajax
};

var TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK = 200;
var MOUSE_MOVING_THRESHOLD = 5;
var MOUSE_RIGHT_BUTTON = 2;

/**
 * Create tree model and inject data to model
 * @class Tree
 * @param {string|HTMLElement} container - Container element or selector
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
 *     @param {Function} [options.renderTemplate] Function for rendering template. Default is {@link https://nhn.github.io/tui.code-snippet/2.2.0/domUtil#template template in the tui-code-snippet}.
 *     @param {boolean} [options.usageStatistics=true] - Let us know the hostname. If you don't want to send the hostname, please set to false.
 * @example <caption>Get `Tree` module</caption>
 * // * node, commonjs
 * // * Get Tree module from `node_modules/tui-tree`
 * var Tree = require('tui-tree');
 * var instance = new Tree(...);
 * // * distribution file, script
 * // * there is `tui.Tree` as a global variable
 * var Tree = tui.Tree;
 * var instance = new Tree(...);
 * @example <caption>Initialize Tree</caption>
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
 * //             '<div class="tui-tree-content-wrapper">' +
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
 * //             '<div class="tui-tree-content-wrapper">' +
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
 * var tree = new Tree(container, {
 *     data: data,
 *     nodeDefaultState: 'opened',
 *
 *     // ========= Option: Override template renderer ===========
 *
 *     template: { // template for Mustache engine
 *         internalNode:
 *             '<div class="tui-tree-content-wrapper">' +
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
 *             '<div class="tui-tree-content-wrapper">' +
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
var Tree = defineClass(
  /** @lends Tree.prototype */ {
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
       * @type {boolean}
       * @private
       */
      this._mouseMovingFlag = false;

      /**
       * Render template
       * It can be overrode by user's template engine.
       * Default: tui-code-snippet/domUtil/template {@link https://nhn.github.io/tui.code-snippet/2.2.0/domUtil#template}
       * @type {Function}
       * @private
       */
      this._renderTemplate = options.renderTemplate || template;

      /**
       * Send the hostname to google analytics.
       * If you do not want to send the hostname, this option set to false.
       * @type {boolean}
       * @private
       */
      this.usageStatistics = options.usageStatistics;

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

      /**
       * Indentation value
       * @type {number}
       * @private
       */
      this._indent = options.indent;

      this._setRoot(container);
      this._draw(this.getRootNodeId());
      this._setEvents();

      if (this.usageStatistics) {
        util.sendHostName();
      }
    },

    /**
     * Set root element of tree
     * @param {string|HTMLElement} container - Container element or selector
     * @private
     */
    _setRoot: function(container) {
      var rootElement = outerTemplate.ROOT;

      if (isString(container)) {
        container = document.querySelector(container);
      }

      if (!isHTMLNode(container)) {
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
       * @event Tree#move
       * @type {object} evt - Event data
       * @property {string} nodeId - Current node id to move
       * @property {string} originalParentId - Original parent node id of moved node
       * @property {string} newParentId - New parent node id of moved node
       * @property {number} index - Moved index number
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
      this.model.on(
        {
          update: this._draw,
          move: this._onMove
        },
        this
      );

      on(
        this.rootElement,
        {
          click: this._onClick,
          mousedown: this._onMousedown,
          dblclick: this._onDoubleClick,
          contextmenu: this._onContextMenu
        },
        this
      );
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
      var clientX = downEvent.clientX;
      var clientY = downEvent.clientY;
      var abs = Math.abs;

      var onMouseMoveHandler = util.bind(function onMouseMove(moveEvent) {
        var newClientX = moveEvent.clientX;
        var newClientY = moveEvent.clientY;

        if (abs(newClientX - clientX) + abs(newClientY - clientY) > MOUSE_MOVING_THRESHOLD) {
          this.fire('mousemove', moveEvent);
          this._mouseMovingFlag = true;
        }
      }, this);

      var onMouseOutHandler = util.bind(function onMouseOut(event) {
        if (event.toElement === null) {
          this.fire('mouseup', event);
        }
      }, this);

      var onMouseUpHandler = util.bind(function onMouseUp(upEvent) {
        this.fire('mouseup', upEvent);
        off(document, {
          mousemove: onMouseMoveHandler,
          mouseup: onMouseUpHandler,
          mouseout: onMouseOutHandler
        });
      }, this);

      this._mouseMovingFlag = false;
      this.fire('mousedown', downEvent);
      on(document, {
        mousemove: onMouseMoveHandler,
        mouseup: onMouseUpHandler,
        mouseout: onMouseOutHandler
      });
    },

    /**
     * Event handler - click
     * @param {MouseEvent} ev - Click event
     * @private
     */
    _onClick: function(ev) {
      var target = getTarget(ev);
      var isRightButton = getMouseButton(ev) === MOUSE_RIGHT_BUTTON;
      var nodeId;

      if (isRightButton) {
        this.clickTimer = null;

        return;
      }

      if (this._isClickedToggleButton(target)) {
        nodeId = this.getNodeIdFromElement(target);

        this.toggle(nodeId);

        /**
         * @event Tree#clickToggleBtn
         * @type {object} evt - Event data
         * @property {string} nodeId - Node id
         * @property {HTMLElement} target - Element of toggle button
         * @example
         * tree.on('clickToggleBtn', function(evt) {
         *     console.log(evt.target);
         * });
         */
        this.fire('clickToggleBtn', {
          nodeId: nodeId,
          target: target
        });

        return;
      }

      if (!this.clickTimer && !this._mouseMovingFlag) {
        this.fire('singleClick', ev);
        this.clickTimer = setTimeout(
          util.bind(function() {
            this.resetClickTimer();
          }, this),
          TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK
        );
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

      nodeElement = document.querySelector('#' + nodeId + ' .' + this.classNames.toggleBtnClass);

      return nodeElement && nodeElement.contains(target);
    },

    /**
     * Set node state - opened or closed
     * @param {string} nodeId - Node id
     * @param {string} state - Node state
     * @private
     */
    _setDisplayFromNodeState: function(nodeId, state) {
      var subtreeElement = this._getSubtreeElement(nodeId);
      var label, btnElement, nodeElement, firstTextNode;

      if (!subtreeElement || subtreeElement === this.rootElement) {
        return;
      }
      label = this.stateLabels[state];
      nodeElement = document.getElementById(nodeId);

      btnElement = nodeElement.querySelector('.' + this.classNames.toggleBtnClass);

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
      var classNames = this.classNames;
      var openedClassName = classNames[nodeStates.OPENED + 'Class'];
      var closedClassName = classNames[nodeStates.CLOSED + 'Class'];

      removeClass(nodeElement, openedClassName);
      removeClass(nodeElement, closedClassName);
      addClass(nodeElement, classNames[state + 'Class']);
    },

    /**
     * Make html
     * @param {Array.<string>} nodeIds - Node id list
     * @returns {string} HTML
     * @private
     * @see https://nhn.github.io/tui.code-snippet/2.2.0/domUtil#template
     */
    _makeHtml: function(nodeIds) {
      var model = this.model;
      var html = '';

      forEachArray(
        nodeIds,
        function(nodeId) {
          var node = model.getNode(nodeId);
          var sources, props;

          if (!node) {
            return;
          }

          sources = this._getTemplate(node);
          props = this._makeTemplateProps(node);
          props.innerTemplate = this._makeInnerHTML(node, {
            source: sources.inner,
            props: props
          });
          html += template(sources.outer, props);
        },
        this
      );

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
      var classNames = this.classNames;
      var id = node.getId();
      var props = {
        id: id,
        indent: this.getIndentWidth(id)
      };
      var state;

      if (node.isLeaf()) {
        extend(props, {
          isLeaf: true // for custom template method
        });
      } else {
        state = node.getState();
        extend(props, {
          stateClass: classNames[state + 'Class'],
          stateLabel: this.stateLabels[state],
          children: this._makeHtml(node.getChildIds())
        });
      }

      return extend(props, classNames, node.getAllData());
    },

    /**
     * calculate tree node's padding left
     * @param {string} nodeId - Node id
     * @returns {number} - padding left of tree node division
     */
    getIndentWidth: function(nodeId) {
      return this.getDepth(nodeId) * this._indent;
    },

    /**
     * Draw element of node
     * @param {string} nodeId - Node id
     * @private
     */
    _draw: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var element, html;

      if (!node) {
        return;
      }

      /**
       * @event Tree#beforeDraw
       * @type {object} evt - Event data
       * @property {string} nodeId - Node id
       * @example
       * tree.on('beforeDraw', function(evt) {
       *     if (tree.isMovingNode) {
       *         console.log('isMovingNode');
       *     }
       *     console.log('beforeDraw: ' + evt.nodeId);
       * });
       */
      this.fire('beforeDraw', { nodeId: nodeId });

      if (node.isRoot()) {
        html = this._makeHtml(node.getChildIds());
        element = this.rootElement;
      } else {
        html = this._makeInnerHTML(node);
        element = document.getElementById(nodeId);
      }
      element.innerHTML = html;
      this._setClassNameAndVisibilityByFeature(node);

      /**
       * @event Tree#afterDraw
       * @type {object} evt - Event data
       * @property {string} nodeId - Node id
       * @example
       * tree.on('afterDraw', function(evt) {
       *     if (tree.isMovingNode) {
       *         console.log('isMovingNode');
       *     }
       *     console.log('afterDraw: ' + evt.nodeId);
       * });
       */
      this.fire('afterDraw', { nodeId: nodeId });
    },

    /**
     * Update class name and visibility by features on below
     * - leaf node: has classNames.leafClass
     * - internal node + opened: has classNames.openedClass, child is visible
     * - internal node + closed: has classNames.closedClass, child is not visible
     * @param {TreeNode} startNode - (re)drawing starts from this node
     * @private
     */
    _setClassNameAndVisibilityByFeature: function(startNode) {
      this._setNodeClassNameAndVisibility(startNode);

      if (!startNode.isLeaf()) {
        this.each(
          function(child) {
            this._setNodeClassNameAndVisibility(child);
          },
          startNode.getId(),
          this
        );
      }
    },

    /**
     * Update class name and visibility by features on below
     * - leaf node: has classNames.leafClass
     * - internal node + opened: has classNames.openedClass, child is visible
     * - internal node + closed: has classNames.closedClass, child is not visible
     * @param {TreeNode} node - (re)drawing this node
     * @private
     */
    _setNodeClassNameAndVisibility: function(node) {
      var nodeId = node.getId();
      var element = document.getElementById(nodeId);
      var classNames = this.classNames;
      var isLeaf = node.isLeaf();

      if (!isLeaf) {
        this._setDisplayFromNodeState(nodeId, node.getState());
      }

      if (element) {
        if (isLeaf) {
          removeClass(element, classNames.openedClass);
          removeClass(element, classNames.closedClass);
          addClass(element, classNames.leafClass);
        } else {
          removeClass(element, classNames.leafClass);
        }
      }
    },

    /**
     * Get subtree element
     * @param {string} nodeId - TreeNode id
     * @returns {HTMLElement} Subtree element
     * @private
     */
    _getSubtreeElement: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var subtreeElement;

      if (!node || node.isLeaf()) {
        subtreeElement = null;
      } else if (node.isRoot()) {
        subtreeElement = this.rootElement;
      } else {
        subtreeElement = document.querySelector('#' + nodeId + ' .' + this.classNames.subtreeClass);
      }

      return subtreeElement;
    },

    /**
     * Return the depth of node
     * @param {string} nodeId - Node id
     * @returns {number|undefined} Depth
     */
    getDepth: function(nodeId) {
      return this.model.getDepth(nodeId);
    },

    /**
     * Return the last depth of tree
     * @returns {number} Last depth
     */
    getLastDepth: function() {
      return this.model.getLastDepth();
    },

    /**
     * Return root node id
     * @returns {string} Root node id
     */
    getRootNodeId: function() {
      return this.model.rootNode.getId();
    },

    /**
     * Return child ids
     * @param {string} nodeId - Node id
     * @returns {Array.<string>|undefined} Child ids
     */
    getChildIds: function(nodeId) {
      return this.model.getChildIds(nodeId);
    },

    /**
     * Return parent id of node
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
     * @returns {string} Prefix of node id
     * @example
     * tree.getNodeIdPrefix(); // 'tui-tree-node-'
     */
    getNodeIdPrefix: function() {
      return this.model.getNodeIdPrefix();
    },

    /**
     * Get node data
     * @param {string} nodeId - Node id
     * @returns {object|undefined} Node data
     */
    getNodeData: function(nodeId) {
      return this.model.getNodeData(nodeId);
    },

    /**
     * Set data properties of a node
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
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.UPDATE,
          util.bind(function() {
            this._setNodeData(nodeId, data);
          }, this),
          {
            nodeId: nodeId,
            data: data,
            type: 'set'
          }
        );
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
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.UPDATE,
          util.bind(function() {
            this._removeNodeData(nodeId, names);
          }, this),
          {
            nodeId: nodeId,
            names: names,
            type: 'remove'
          }
        );
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
     * @param {string} nodeId - Node id
     * @param {boolean} recursive - If true, it open all parent (default: false)
     * @example
     * tree.open(nodeId ,true);
     */
    open: function(nodeId, recursive) {
      if (recursive) {
        this._openRecursiveNode(nodeId);
      } else {
        this._openNode(nodeId);
      }
    },
    /**
     * Open all parent node
     * @param {string} nodeId - Node id
     * @private
     */
    _openRecursiveNode: function(nodeId) {
      var parentIds = this.model.getParentIds(nodeId);
      parentIds.push(nodeId);
      forEachArray(
        parentIds,
        function(parentId) {
          this._openNode(parentId);
        },
        this
      );
    },
    /**
     * Open one target node
     * @param {string} nodeId - Node id
     * @private
     */
    _openNode: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var state = nodeStates.OPENED;
      var isAllowStateChange = node && !node.isRoot() && node.getState() === nodeStates.CLOSED;

      if (isAllowStateChange) {
        node.setState(state);
        this._setDisplayFromNodeState(nodeId, state);
      }

      if (this.enabledFeatures.Ajax) {
        this._reload(nodeId);
      }
    },

    /**
     * Close node
     * @param {string} nodeId - Node id
     * @param {boolean} recursive - If true, it close all child node (default: false)
     * @example
     * tree.close(nodeId, true);
     */
    close: function(nodeId, recursive) {
      if (recursive) {
        this._closeRecursiveNode(nodeId);
      } else {
        this._closeNode(nodeId);
      }
    },

    /**
     * Close all child node
     * @param {string} nodeId - Node id
     * @private
     */
    _closeRecursiveNode: function(nodeId) {
      this._closeNode(nodeId);
      this.model.each(
        function(searchNode, searchNodeId) {
          if (!searchNode.isLeaf()) {
            this._closeNode(searchNodeId);
          }
        },
        nodeId,
        this
      );
    },

    /**
     * Close one target node
     * @param {string} nodeId - Node id
     * @private
     */
    _closeNode: function(nodeId) {
      var node = this.model.getNode(nodeId);
      var state = nodeStates.CLOSED;
      var isAllowStateChange = node && !node.isRoot() && node.getState() === nodeStates.OPENED;
      if (isAllowStateChange) {
        node.setState(state);
        this._setDisplayFromNodeState(nodeId, state);
      }
    },

    /**
     * Toggle node
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
      var isReload = isUndefined(node.getData('reload')) || node.getData('reload');

      if (state === nodeStates.CLOSED) {
        // open -> close action
        this._setNodeData(
          nodeId,
          {
            reload: false
          },
          true
        );
      }

      if (state === nodeStates.OPENED && isReload) {
        // close -> open action
        this.resetAllData(null, {
          nodeId: nodeId,
          useAjax: true
        });
      }
    },

    /**
     * Sort all nodes
     * @param {Function} comparator - Comparator for sorting
     * @param {boolean} [isSilent] - If true, it doesn't redraw tree
     * @param {string} [parentId] - Id of a node to sort partially
     * @example
     * var comparator = function(nodeA, nodeB) {
     *     var aValue = nodeA.getData('text'),
     *         bValue = nodeB.getData('text');
     *
     *     if (!bValue || !bValue.localeCompare) {
     *         return 0;
     *     }
     *     return bValue.localeCompare(aValue);
     * };
     *
     * // Sort with redrawing tree
     * tree.sort(comparator);
     *
     * // Sort, but not redraw tree
     * tree.sort(comparator, true);
     *
     * // Sort partially
     * tree.sort(comparator, false, parentId)
     */
    sort: function(comparator, isSilent, parentId) {
      this.model.sort(comparator, parentId);

      if (!isSilent) {
        this.refresh(parentId);
      }
    },

    /**
     * Refresh tree or node's children
     * @param {string} [nodeId] - TreeNode id to refresh
     */
    refresh: function(nodeId) {
      nodeId = nodeId || this.getRootNodeId();
      this._draw(nodeId);
    },

    /**
     * Traverse this tree iterating over all nodes.
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
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;
      var newChildIds;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.CREATE,
          util.bind(function() {
            return this._add(data, parentId);
          }, this),
          {
            parentId: parentId,
            data: data
          }
        );
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
      var treeAjax = this.enabledFeatures.Ajax;
      var nodeId = options ? options.nodeId : this.getRootNodeId();
      var useAjax = options ? options.useAjax : !!treeAjax;
      var newChildIds;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.READ,
          util.bind(function(response) {
            return this._resetAllData(response, nodeId);
          }, this),
          {
            nodeId: nodeId
          }
        );
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
     * @param {string} nodeId - Parent node id
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't redraw the node
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.removeAllChildren(nodeId); // Redraws the node
     * tree.removeAllChildren(nodId, true); // Doesn't redraw the node
     */
    removeAllChildren: function(nodeId, options) {
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.DELETE_ALL_CHILDREN,
          util.bind(function() {
            this._removeAllChildren(nodeId);
          }, this),
          {
            parentId: nodeId
          }
        );
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

      forEachArray(
        children || [],
        function(childId) {
          this._remove(childId, true);
        },
        this
      );

      if (!isSilent) {
        this._draw(nodeId);
      }
    },

    /**
     * Remove a node with children.
     * - If 'isSilent' is not true, it redraws the tree
     * @param {string} nodeId - Node id to remove
     * @param {object} [options] - Options
     *     @param {boolean} [options.isSilent] - If true, it doesn't redraw children
     *     @param {boolean} [options.useAjax] - State of using Ajax
     * @example
     * tree.remove(myNodeId); // remove node with redrawing
     * tree.remove(myNodeId, true); // remove node without redrawing
     */
    remove: function(nodeId, options) {
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.DELETE,
          util.bind(function() {
            this._remove(nodeId);
          }, this),
          {
            nodeId: nodeId
          }
        );
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
      var treeAjax = this.enabledFeatures.Ajax;
      var useAjax = options ? options.useAjax : !!treeAjax;
      var isSilent = options ? options.isSilent : false;

      if (useAjax) {
        treeAjax.loadData(
          ajaxCommand.MOVE,
          util.bind(function() {
            if (this.getParentId(nodeId) !== newParentId) {
              // just move, not sort!
              this.setNodeData(
                newParentId,
                {
                  reload: true
                },
                true
              );
            }
            this._move(nodeId, newParentId, index);
          }, this),
          {
            nodeId: nodeId,
            newParentId: newParentId,
            index: index
          }
        );
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
       * @event Tree#beforeMove
       * @type {object} evt - Event data
       * @property {string} nodeId - Current dragging node id
       * @property {string} newParentId - New parent id
       * @example
       * tree.on('beforeMove', function(evt) {
       *      console.log('dragging node: ' + evt.nodeId);
       *      console.log('new parent node: ' + evt.newParentId);
       *      console.log('original parent node: ' + tree.getParentId(evt.nodeId));
       *
       *      return false; // Cancel "move" event
       *      // return true; // Fire "move" event
       * });
       */
      if (
        !this.invoke('beforeMove', {
          nodeId: nodeId,
          newParentId: newParentId
        })
      ) {
        return;
      }

      this.isMovingNode = true;
      this.model.move(nodeId, newParentId, index, isSilent);
      this.isMovingNode = false;
    },

    /**
     * Search node ids by passing the predicate check or matching data
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
      if (!isObject(predicate)) {
        return [];
      }

      if (isFunction(predicate)) {
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
        var result = true;
        var data = node.getAllData();

        forEachOwnProperties(props, function(value, key) {
          result = key in data && data[key] === value;

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
     * @param {string} nodeId - Node id
     * @returns {boolean} True if the node is leaf.
     */
    isLeaf: function(nodeId) {
      var node = this.model.getNode(nodeId);

      return node && node.isLeaf();
    },

    /**
     * Whether a node is a ancestor of another node.
     * @param {string} containerNodeId - Id of a node that may contain the other node
     * @param {string} containedNodeId - Id of a node that may be contained by the other node
     * @returns {boolean} Whether a node contains another node
     */
    contains: function(containerNodeId, containedNodeId) {
      return this.model.contains(containerNodeId, containedNodeId);
    },

    /**
     * Enable facility of tree
     * Ajax feature options: https://github.com/nhn/tui.tree/blob/master/docs/ajax-feature.md
     * @param {string} featureName - 'Selectable', 'Editable', 'Draggable', 'Checkbox', 'ContextMenu', 'Ajax'
     * @param {object} [options] - Feature options
     * @returns {Tree} this
     * @example
     * tree
     *  .enableFeature('Selectable', {
     *      selectedClassName: 'tui-tree-selected'
     *  })
     *  .enableFeature('Editable', {
     *      editableClassName: tree.classNames.textClass,
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
     *          top: 10,
     *          bottom: 10
     *      }
     *  })
     *  .enableFeature('Checkbox', {
     *      checkboxClassName: 'tui-tree-checkbox'
     *  })
     *  .enableFeature('ContextMenu', {
     *      menuData: [
     *          {title: 'menu1', command: 'copy'},
     *          {title: 'menu2', command: 'paste'},
     *          {separator: true},
     *          {
     *              title: 'menu3',
     *              menu: [
     *                  {title: 'submenu1'},
     *                  {title: 'submenu2'}
     *              ]
     *          }
     *      }
     *  })
     *  .enableFeature('Ajax', {
     *      command: {
     *          read: {
     *              url: 'api/read',
     *              contentType: 'application/json',
     *              method: 'GET'
     *          },
     *          create: {
     *              url: 'api/create',
     *              contentType: 'application/json',
     *              method: 'POST'
     *          },
     *          update: {
     *              url: 'api/update',
     *              contentType: 'application/json',
     *              method: 'POST',
     *              params: {
     *                  paramA: 'a',
     *                  paramB: 'b'
     *              }
     *          },
     *          remove: {
     *              url: 'api/remove',
     *              contentType: 'application/json',
     *              method: 'POST',
     *              params: function(evt) {
     *                  return {
     *                      paramA: evt.a,
     *                      paramB: evt.b
     *                  };
     *              }
     *          },
     *          removeAllChildren: {
     *              url: function(evt) {
     *                  return 'api/remove_all/' + evt.nodeId,
     *              },
     *              contentType: 'application/json',
     *              method: 'POST'
     *          },
     *          move: {
     *              url: 'api/move',
     *              contentType: 'application/json',
     *              method: 'POST'
     *          }
     *      },
     *      parseData: function(command, responseData) {
     *          if (responseData) {
     *              return responseData;
     *          } else {
     *              return false;
     *          }
     *      }
     *  });
     */
    enableFeature: function(featureName, options) {
      var Feature = features[featureName];

      if (!Feature) {
        return this;
      }

      this.disableFeature(featureName);

      if (isObject(options)) {
        options.usageStatistics = this.usageStatistics;
      } else {
        options = {
          usageStatistics: this.usageStatistics
        };
      }

      this.enabledFeatures[featureName] = new Feature(this, options);
      this.fire('initFeature');

      return this;
    },

    /**
     * Disable facility of tree
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
     * @param {string} nodeId - Id of selected node
     * @returns {number} Index number of attached node
     */
    getNodeIndex: function(nodeId) {
      var parentId = this.model.getParentId(nodeId);

      return this.model.getNode(parentId).getChildIndex(nodeId);
    }
  }
);

/**
 * Set abstract apis to tree prototype
 * @param {string} featureName - Feature name
 * @param {object} feature - Feature
 * @ignore
 */
function setAbstractAPIs(featureName, feature) {
  var messageName = 'INVALID_API_' + featureName.toUpperCase();
  var apiList = feature.getAPIList ? feature.getAPIList() : [];

  forEachArray(apiList, function(api) {
    Tree.prototype[api] = function() {
      throw new Error(messages[messageName] || messages.INVALID_API);
    };
  });
}
forEachOwnProperties(features, function(Feature, name) {
  setAbstractAPIs(name, Feature);
});
CustomEvents.mixin(Tree);

module.exports = Tree;
