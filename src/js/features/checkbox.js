/**
 * @fileoverview Feature that each tree node is possible to check and uncheck
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var inArray = require('tui-code-snippet/array/inArray');
var forEachArray = require('tui-code-snippet/collection/forEachArray');
var CustomEvents = require('tui-code-snippet/customEvents/customEvents');
var defineClass = require('tui-code-snippet/defineClass/defineClass');
var getTarget = require('tui-code-snippet/domEvent/getTarget');
var once = require('tui-code-snippet/domEvent/once');
var addClass = require('tui-code-snippet/domUtil/addClass');
var removeClass = require('tui-code-snippet/domUtil/removeClass');
var extend = require('tui-code-snippet/object/extend');
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
var STATE_CHECKED = 1;
var STATE_UNCHECKED = 2;
var STATE_INDETERMINATE = 3;
var DATA_KEY_FOR_CHECKBOX_STATE = '__CheckBoxState__';
var DATA = {};
var CHECKED_CLASSNAME = 'tui-is-checked';
var INDETERMINATE_CLASSNAME = 'tui-checkbox-root';

/* Checkbox cascade-states */
var CASCADE_UP = 'up';
var CASCADE_DOWN = 'down';
var CASCADE_BOTH = 'both';
var CASCADE_NONE = false;

/**
 * Set the checkbox-api
 * @class Checkbox
 * @param {Tree} tree - Tree
 * @param {Object} option - Option
 *  @param {string} option.checkboxClassName - Classname of checkbox element
 *  @param {string|boolean} [option.checkboxCascade='both'] - 'up', 'down', 'both', false
 * @ignore
 */
var Checkbox = defineClass(
  /** @lends Checkbox.prototype */ {
    static: {
      /**
       * @static
       * @memberof Checkbox
       * @returns {Array.<string>} API list of checkbox
       */
      getAPIList: function() {
        return API_LIST.slice();
      }
    },
    init: function(tree, option) {
      option = extend({}, option);

      this.tree = tree;
      this.checkboxClassName = option.checkboxClassName;
      this.checkboxCascade = this._initCascadeOption(option.checkboxCascade);
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
      forEachArray(API_LIST, function(apiName) {
        delete tree[apiName];
      });
    },

    /**
     * @param {string|boolean} cascadeOption - Cascade option
     * @returns {string|boolean} Cascade option
     * @private
     */
    _initCascadeOption: function(cascadeOption) {
      var cascadeOptions = [CASCADE_UP, CASCADE_DOWN, CASCADE_BOTH, CASCADE_NONE];
      if (inArray(cascadeOption, cascadeOptions) === -1) {
        cascadeOption = CASCADE_BOTH;
      }

      return cascadeOption;
    },

    /**
     * Set apis of checkbox tree
     * @private
     */
    _setAPIs: function() {
      var tree = this.tree;

      forEachArray(
        API_LIST,
        function(apiName) {
          tree[apiName] = util.bind(this[apiName], this);
        },
        this
      );
    },

    /**
     * Attach event to tree instance
     * @private
     */
    _attachEvents: function() {
      this.tree.on(
        {
          singleClick: function(event) {
            var target = getTarget(event);

            if (target.querySelector('.' + this.checkboxClassName)) {
              this._changeCustomCheckbox(target);
            }
          },
          afterDraw: function(ev) {
            if (this.tree.isMovingNode) {
              return;
            }
            this._reflectChanges(ev.nodeId);
          },
          move: function(data) {
            // @TODO - Optimization
            this._reflectChanges(data.originalParentId);
            this._reflectChanges(data.newParentId);
          }
        },
        this
      );
    },

    /**
     * Change custom checkbox
     * @param {HTMLElement} target - Label element
     */
    _changeCustomCheckbox: function(target) {
      var nodeId = this.tree.getNodeIdFromElement(target);
      var inputElement = target.getElementsByTagName('input')[0];

      once(
        inputElement,
        'change propertychange',
        util.bind(function() {
          var state = this._getStateFromCheckbox(inputElement);
          this._continuePostprocessing(nodeId, state);
        }, this)
      );
    },

    /**
     * Reflect the changes on node.
     * @param {string} nodeId - Node id
     * @private
     */
    _reflectChanges: function(nodeId) {
      this.tree.each(
        function(descendant, descendantId) {
          this._setState(descendantId, this._getState(descendantId), true);
        },
        nodeId,
        this
      );
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
        default:
          // no more process if the state is invalid
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
      var tree = this.tree;
      var state = tree.getNodeData(nodeId)[DATA_KEY_FOR_CHECKBOX_STATE];
      var checkbox;

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
      var tree = this.tree;
      var checkedList = this.checkedList;
      var eventName;

      /* Prevent duplicated node id */
      util.removeItemFromArray(nodeId, checkedList);

      if (state === STATE_CHECKED) {
        checkedList.push(nodeId);
        /**
         * @event Tree#check
         * @type {object} evt - Event data
         * @property {string} nodeId - Checked node id
         * @example
         * tree.on('check', function(evt) {
         *     console.log('checked: ' + evt.nodeId);
         * });
         */
        eventName = 'check';
      } else if (state === STATE_UNCHECKED) {
        /**
         * @event Tree#uncheck
         * @type {object} evt - Event data
         * @property {string} nodeId - Unchecked node id
         * @example
         * tree.on('uncheck', function(evt) {
         *     console.log('unchecked: ' + evt.nodeId);
         * });
         */
        eventName = 'uncheck';
      }
      DATA[DATA_KEY_FOR_CHECKBOX_STATE] = state;

      tree.setNodeData(nodeId, DATA, {
        isSilent: true
      });

      this._setClassName(nodeId, state);

      if (!stopPropagation) {
        this._propagateState(nodeId, state);
        tree.fire(eventName, { nodeId: nodeId });
      }
    },

    /**
     * Set class name on label element
     * @param {string} nodeId - Node id for finding input element
     * @param {number} state - Checked state number
     */
    _setClassName: function(nodeId, state) {
      var parentElement = this._getCheckboxElement(nodeId).parentNode;
      var labelElement;

      if (parentElement && parentElement.parentNode) {
        labelElement = parentElement.parentNode;

        removeClass(labelElement, INDETERMINATE_CLASSNAME);
        removeClass(labelElement, CHECKED_CLASSNAME);

        if (state === 1) {
          addClass(labelElement, CHECKED_CLASSNAME);
        } else if (state === 3) {
          addClass(labelElement, INDETERMINATE_CLASSNAME);
          addClass(labelElement, CHECKED_CLASSNAME);
        }
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
      if (inArray(this.checkboxCascade, [CASCADE_DOWN, CASCADE_BOTH]) > -1) {
        this._updateAllDescendantsState(nodeId, state);
      }
      if (inArray(this.checkboxCascade, [CASCADE_UP, CASCADE_BOTH]) > -1) {
        this._updateAllAncestorsState(nodeId);
      }
    },

    /**
     * Update all descendants state
     * @param {string} nodeId - Node id
     * @param {number} state - State for checkbox
     * @private
     */
    _updateAllDescendantsState: function(nodeId, state) {
      this.tree.each(
        function(descendant, descendantId) {
          this._setState(descendantId, state, true);
        },
        nodeId,
        this
      );
    },

    /**
     * Update all ancestors state
     * @param {string} nodeId - Node id
     * @private
     */
    _updateAllAncestorsState: function(nodeId) {
      var tree = this.tree;
      var parentId = tree.getParentId(nodeId);

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
      var tree = this.tree;
      var childIds = tree.getChildIds(nodeId);
      var checked = true;
      var unchecked = true;

      if (!childIds.length) {
        checked = this.isChecked(nodeId);
      } else {
        forEachArray(
          childIds,
          function(childId) {
            var state = this._getState(childId);
            checked = checked && state === STATE_CHECKED;
            unchecked = unchecked && state === STATE_UNCHECKED;

            return checked || unchecked;
          },
          this
        );
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
      var tree = this.tree;
      var el, nodeEl;

      if (nodeId === tree.getRootNodeId()) {
        el = this.rootCheckbox;
      } else {
        nodeEl = document.getElementById(nodeId);
        if (!nodeEl) {
          return null;
        }
        el = nodeEl.querySelector('.' + this.checkboxClassName);
      }

      return el;
    },

    /**
     * Check node
     * @memberof Tree.prototype
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
     * @memberof Tree.prototype
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
     * @memberof Tree.prototype
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
     * @memberof Tree.prototype
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
     * @memberof Tree.prototype
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
     * @memberof Tree.prototype
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
     * @memberof Tree.prototype
     * @param {string} [parentId] - Node id (default: rootNode id)
     * @returns {Array.<string>} Checked node ids
     * @example
     * // ├─ node1 (v)
     * // │  ├─ node2 (v)
     * // │  └─ node3 (v)
     * // ├─ node4 ( )
     * // │  └─ node5 (v)
     * // └─ node6 ( )
     * //    ├─ node7 (v)
     * //    │  └─ node8 (v)
     * //    └─ node9 ( )
     *
     * var allCheckedList = tree.getCheckedList(); // ['node1', 'node2', 'node3' ,....]
     * var descendantsCheckedList = tree.getCheekedList('node6'); // ['node7', 'node8']
     */
    getCheckedList: function(parentId) {
      var tree = this.tree;
      var checkedList = this.checkedList;

      if (!parentId) {
        return checkedList.slice();
      }

      return util.filter(checkedList, function(nodeId) {
        return tree.contains(parentId, nodeId);
      });
    },

    /**
     * Get top checked list
     * @memberof Tree.prototype
     * @param {string} [parentId] - Node id (default: rootNode id)
     * @returns {Array.<string>} Checked node ids
     * @example
     * // ├─ node1 (v)
     * // │  ├─ node2 (v)
     * // │  └─ node3 (v)
     * // ├─ node4 ( )
     * // │  └─ node5 (v)
     * // └─ node6 ( )
     * //    ├─ node7 (v)
     * //    │  └─ node8 (v)
     * //    └─ node9 ( )
     *
     * var allTopCheckedList = tree.getTopCheckedList(); // ['node1', 'node5', 'node7']
     * var descendantsTopCheckedList = tree.getTopCheekedList('node6'); // ['node7']
     */
    getTopCheckedList: function(parentId) {
      var tree = this.tree;
      var checkedList = [];
      var state;

      parentId = parentId || tree.getRootNodeId();
      state = this._getState(parentId);
      if (state === STATE_CHECKED) {
        checkedList = tree.getChildIds(parentId);
      } else if (state === STATE_INDETERMINATE) {
        checkedList = this.getCheckedList(parentId);
        checkedList = util.filter(
          checkedList,
          function(nodeId) {
            return !this.isChecked(tree.getParentId(nodeId));
          },
          this
        );
      }

      return checkedList;
    },

    /**
     * Get bottom checked list
     * @memberof Tree.prototype
     * @param {string} [parentId] - Node id (default: rootNode id)
     * @returns {Array.<string>} Checked node ids
     * @example
     * var allBottomCheckedList = tree.getBottomCheckedList(); // ['node2', 'node3', 'node5', 'node8']
     * var descendantsBottomCheckedList = tree.getBottomCheekedList('node6'); // ['node8']
     */
    getBottomCheckedList: function(parentId) {
      var tree = this.tree;
      var checkedList;

      parentId = parentId || tree.getRootNodeId();
      checkedList = this.getCheckedList(parentId);

      return util.filter(checkedList, function(nodeId) {
        return tree.isLeaf(nodeId);
      });
    }
  }
);

CustomEvents.mixin(Checkbox);
module.exports = Checkbox;
