/**
 * @fileoverview Feature that each tree node is possible to drag and drop
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var inArray = require('tui-code-snippet/array/inArray');
var forEachArray = require('tui-code-snippet/collection/forEachArray');
var defineClass = require('tui-code-snippet/defineClass/defineClass');
var getMouseButton = require('tui-code-snippet/domEvent/getMouseButton');
var getMousePosition = require('tui-code-snippet/domEvent/getMousePosition');
var getTarget = require('tui-code-snippet/domEvent/getTarget');
var off = require('tui-code-snippet/domEvent/off');
var on = require('tui-code-snippet/domEvent/on');
var preventDefault = require('tui-code-snippet/domEvent/preventDefault');
var addClass = require('tui-code-snippet/domUtil/addClass');
var disableTextSelection = require('tui-code-snippet/domUtil/disableTextSelection');
var enableTextSelection = require('tui-code-snippet/domUtil/enableTextSelection');
var hasClass = require('tui-code-snippet/domUtil/hasClass');
var removeClass = require('tui-code-snippet/domUtil/removeClass');
var removeElement = require('tui-code-snippet/domUtil/removeElement');
var extend = require('tui-code-snippet/object/extend');

var defaultOptions = {
  useHelper: true,
  helperPos: {
    y: 2,
    x: 5
  },
  helperClassName: 'tui-tree-drop',
  dragItemClassName: 'tui-tree-drag',
  hoverClassName: 'tui-tree-hover',
  lineClassName: 'tui-tree-line',
  lineBoundary: {
    top: 4,
    bottom: 4
  },
  autoOpenDelay: 1500,
  isSortable: false
};
var rejectedTagNames = ['INPUT', 'BUTTON', 'UL'];
var API_LIST = [];

/**
 * Set the tree draggable
 * @class Draggable
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *     @param {boolean} options.useHelper - Using helper flag
 *     @param {{x: number, y:number}} options.helperPos - Helper position (each minimum value is 4)
 *     @param {Array.<string>} options.rejectedTagNames - No draggable tag names
 *     @param {Array.<string>} options.rejectedClassNames - No draggable class names
 *     @param {number} options.autoOpenDelay - Delay time while dragging to be opened
 *     @param {boolean} options.isSortable - Flag of whether using sortable dragging
 *     @param {string} options.hoverClassName - Class name for hovered node
 *     @param {string} options.lineClassName - Class name for moving position line
 *     @param {string} options.helperClassName - Class name for helper's outer element
 *     @param {string} options.helperTemplate - Template string for helper's inner contents
 *     @param {{top: number, bottom: number}} options.lineBoundary - Boundary value for visible moving line
 * @ignore
 */
var Draggable = defineClass(
  /** @lends Draggable.prototype */ {
    static: {
      /**
       * @static
       * @memberof Draggable
       * @returns {Array.<string>} API list of Draggable
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },

    init: function(tree, options) {
      options = extend({}, defaultOptions, options);

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
       * Last mouse hovered nodeId
       * @type {string | null}
       */
      this.lastHoverNodeId = null;

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

      /**
       * Helper's outer element class name
       * @type {string}
       */
      this.helperClassName = options.helperClassName;

      this._initHelper();

      if (this.isSortable) {
        this._initMovingLine();
      }

      this._attachMousedown();
    },

    /**
     * Disable this module (remove attached elements and unbind event)
     */
    destroy: function() {
      removeElement(this.helperElement);
      removeElement(this.lineElement);

      this._restoreTextSelection();
      this._detachMousedown();
    },

    /**
     * Change helper element position
     * @param {object} mousePos - Current mouse position
     * @private
     */
    _changeHelperPosition: function(mousePos) {
      var mousePosX = mousePos[0];
      var mousePosY = mousePos[1];
      var helperStyle = this.helperElement.style;

      helperStyle.top = mousePosY + window.pageYOffset + this.helperPos.y + 'px';
      helperStyle.left = mousePosX + window.pageXOffset + this.helperPos.x + 'px';
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

      addClass(helperElement, this.helperClassName);

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
      lineStyle.display = 'none';

      addClass(lineElement, this.lineClassName);

      this.tree.rootElement.parentNode.appendChild(lineElement);

      this.lineElement = lineElement;
    },

    /**
     * Set helper contents
     * @param {string} contents - Helper contents
     * @private
     */
    _setHelper: function(contents) {
      this.helperElement.innerHTML = contents;
      removeElement(this.helperElement.getElementsByTagName('label')[0]);
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
      on(this.tree.rootElement, 'selectstart', preventDefault);
      disableTextSelection(this.tree.rootElement);
    },

    /**
     * Restore text-selection
     * @private
     */
    _restoreTextSelection: function() {
      off(this.tree.rootElement, 'selectstart', preventDefault);
      enableTextSelection(this.tree.rootElement);
    },

    /**
     * Return whether the target element is in rejectedTagNames or in rejectedClassNames
     * @param {HTMLElement} target - Target element
     * @returns {boolean} Whether the target is not draggable or draggable
     * @private
     */
    _isNotDraggable: function(target) {
      var tagName = target.tagName.toUpperCase();
      var classNames = target.className.split(/\s+/);
      var result;

      if (inArray(tagName, this.rejectedTagNames) !== -1) {
        return true;
      }

      forEachArray(
        classNames,
        function(className) {
          result = inArray(className, this.rejectedClassNames) !== -1;

          return !result;
        },
        this
      );

      return result;
    },

    /**
     * Event handler - mousedown
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMousedown: function(event) {
      var tree = this.tree;
      var target = getTarget(event);
      var isRightButton = getMouseButton(event) === 2;
      var isEditing = tree.enabledFeatures.Editable && tree.enabledFeatures.Editable.inputElement;
      var nodeElement;

      if (isRightButton || this._isNotDraggable(target) || isEditing) {
        return;
      }

      preventDefault(event);

      this.currentNodeId = tree.getNodeIdFromElement(target);

      if (this.useHelper) {
        nodeElement = document.querySelector(
          '#' + this.currentNodeId + ' .' + tree.classNames.textClass
        );
        this._setHelper(nodeElement.innerHTML);
      }

      tree.on(
        {
          mousemove: this._onMousemove,
          mouseup: this._onMouseup
        },
        this
      );
    },

    /**
     * Event handler - mousemove
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _onMousemove: function(event) {
      var mousePos = getMousePosition(event);
      var target = getTarget(event);
      var nodeId;

      if (!this.useHelper) {
        return;
      }

      this._setClassNameOnDragItem('add');
      this._changeHelperPosition(mousePos);

      nodeId = this.tree.getNodeIdFromElement(target);
      if (nodeId) {
        this.lastHoverNodeId = nodeId;
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
      var nodeId = this.currentNodeId;
      var target = getTarget(event);
      var targetId = this._getTargetNodeId(target);
      var index = this._getIndexToInsert(targetId);
      var newParentId;

      if (index === -1) {
        // When the node is created as a child after moving
        newParentId = targetId;
      } else {
        newParentId = tree.getParentId(targetId);
      }

      if (nodeId !== newParentId) {
        // Don't fire beforeMove event
        tree.move(nodeId, newParentId, index);
      }

      this.lastHoverNodeId = null;
      this._reset();
    },

    /**
     * Get id of the target element on which the moved item is placed
     * @param {HTMLElement} target - Target element
     * @returns {string} Id of target element
     * @private
     */
    _getTargetNodeId: function(target) {
      var tree = this.tree;
      var movingType = this.movingLineType;
      var nodeId = tree.getNodeIdFromElement(target);
      var childIds;

      if (nodeId) {
        return nodeId;
      }

      childIds = tree.getChildIds(tree.getRootNodeId());

      if (movingType === 'top') {
        nodeId = childIds[0];
      } else {
        nodeId = childIds[childIds.length - 1];
      }

      if (this._isGuideLineElement(target)) {
        nodeId = this.lastHoverNodeId;
      }

      return nodeId;
    },

    /**
     * Get a index number to insert the moved item
     * @param {number} nodeId - Id of moved item
     * @returns {number} Index number
     * @private
     */
    _getIndexToInsert: function(nodeId) {
      var movingType = this.movingLineType;
      var index;

      if (!movingType) {
        return -1;
      }

      index = this.tree.getNodeIndex(nodeId);

      if (movingType === 'bottom') {
        index += 1;
      }

      return index;
    },

    /**
     * Apply move action that are delay effect and sortable moving node
     * @param {string} nodeId - Selected tree node id
     * @param {object} mousePos - Current mouse position
     * @private
     */
    _applyMoveAction: function(nodeId, mousePos) {
      var currentElement = document.getElementById(nodeId);
      var targetPos = currentElement.getBoundingClientRect();
      var isHover = hasClass(currentElement, this.hoverClassName);
      var isContain = this._isContain(targetPos, mousePos);
      var boundaryType;

      if (!this.hoveredElement && isContain) {
        this.hoveredElement = currentElement;
        this._hover(nodeId);
      } else if (!isHover) {
        this._unhover();
      } else if (!isContain) {
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

      addClass(this.hoveredElement, this.hoverClassName);

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

      if (this.hoveredElement) {
        removeClass(this.hoveredElement, this.hoverClassName);
      }

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
      var mousePosX = mousePos[0];
      var mousePosY = mousePos[1];

      if (this.isSortable) {
        top += this.lineBoundary.top;
        bottom -= this.lineBoundary.bottom;
      }

      return (
        targetPos.left < mousePosX &&
        targetPos.right > mousePosX &&
        top < mousePosY &&
        bottom > mousePosY
      );
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

      if (mousePos[1] < targetPos.top + this.lineBoundary.top) {
        type = 'top';
      } else if (mousePos[1] > targetPos.bottom - this.lineBoundary.bottom) {
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
      var parentNodeOfRoot = this.tree.rootElement.parentNode;
      var scrollTop;

      if (boundaryType) {
        scrollTop = parentNodeOfRoot.getBoundingClientRect().top - parentNodeOfRoot.offsetTop;
        style.top = targetPos[boundaryType] - scrollTop + 'px';
        style.display = 'block';
        this.movingLineType = boundaryType;
      } else {
        style.display = 'none';
        this.movingLineType = null;
      }
    },

    /**
     * _reset properties and remove event
     * @private
     */
    _reset: function() {
      if (this.isSortable) {
        this.lineElement.style.display = 'none';
      }

      if (this.hoveredElement) {
        removeClass(this.hoveredElement, this.hoverClassName);
        this.hoveredElement = null;
      }

      this._setClassNameOnDragItem('remove');

      this.helperElement.style.display = 'none';

      this.currentNodeId = null;
      this.movingLineType = null;

      this.tree.off(this, 'mousemove');
      this.tree.off(this, 'mouseup');
    },

    /**
     * Set class name on drag item's element
     * @param {string} type - Set type ('add' or 'remove')
     */
    _setClassNameOnDragItem: function(type) {
      var dragItemElement = document.getElementById(this.currentNodeId);
      var dragItemClassName = defaultOptions.dragItemClassName;

      if (dragItemElement) {
        if (type === 'add') {
          addClass(dragItemElement, dragItemClassName);
        } else {
          removeClass(dragItemElement, dragItemClassName);
        }
      }
    },

    /**
     * Check if an element is a GuideLineElement
     * @param {HTMLElement} element - target element
     * @returns {boolean}
     * @private
     */
    _isGuideLineElement: function(element) {
      return element && hasClass(element, this.lineClassName);
    }
  }
);

module.exports = Draggable;
