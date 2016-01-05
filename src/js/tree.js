/**
 * @fileoverview Render tree and update tree.
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

var defaults = require('./defaults'),
    util = require('./utils'),
    states = require('./states'),
    TreeModel = require('./treemodel');

var treeStates = states.tree,
    nodeStates = states.node;
/**
 * Create tree model and inject data to model
 * @constructor
 * @param {object} data A data to be used on tree
 * @param {object} options The options
 *     @param {HTMLElement} [options.rootElement] Root element (It should be 'UL' element)
 *     @param {object} [options.defaultState] A default state of a node
 *     @param {object} [options.template] A markup set to make element
 *         @param {string} [options.template.internalNode] HTML template
 *         @param {string} [options.template.leafNode] HTML template
 *     @param {object} [options.stateLabel] Toggle button state label
 *         @param {string} [options.stateLabel.opened] State-'opened' label (Text or HTML)
 *         @param {string} [options.stateLabel.closed] State-'closed' label (Text or HTML)
 *     @param {object} [options.classNames] Class names for tree
 *         @param {string} [options.classNames.openedClass] A class name for opened node
 *         @param {string} [options.classNames.closedClass] A class name for closed node
 *         @param {string} [options.classNames.selectedClass] A class name to selected node
 *         @param {string} [options.classNames.titleClass] A class name that for title element in node
 *         @param {string} [options.classNames.inputClass] A class input element in a node
 *         @param {string} [options.classNames.subtreeClass] A class name for subtree in internal node
 *         @param {string} [options.classNames.toggleClass] A class name for toggle button in internal node
 *     @param {object} [options.helperPos] A related position for helper object
 * @example
 * //Default options
 * // {
 * //     rootElement: document.createElement('UL'),
 * //     useDrag: false,
 * //     useHelper: false,
 * //     defaultState: 'closed',
 * //     stateLabel: {
 * //         opened: '-',
 * //         closed: '+'
 * //     },
 * //     helperPos: {
 * //         y: 10,
 * //         x: 10
 * //     },
 * //     classNames: {
 * //         openedClass: 'tui-tree-opened',
 * //         closedClass: 'tui-tree-closed',
 * //         selectedClass: 'tui-tree-selected',
 * //         subtreeClass: 'tui-tree-subtree',
 * //         toggleClass: 'tui-tree-toggle',
 * //         titleClass: 'tui-tree-title',
 * //         iuputClass: 'tui-tree-input'
 * //     },
 * //
 * // HTML TEMPLATE
 * // - The prefix "d_" represents the data of each node.
 * // - The "d_children" will be converted to HTML-template
 * //     template: {
 * //         internalNode:
 * //         '<li id="{{id}}" class="tui-tree-node {{stateClass}}" data-depth="{{depth}}">' +
 * //             '<button type="button" class="{{toggleClass}}">{{stateLabel}}</button>' +
 * //             '<span class="{{titleClass}}">{{d_title}}</span>' +
 * //             '<ul class="{{subtreeClass}}">{{d_children}}</ul>' +
 * //         '</li>',
 * //         leafNode:
 * //         '<li id="{{id}}" class="tui-tree-node tui-tree-leaf" data-depth="{{depth}}">' +
 * //             '<span class="{{titleClass}}">{{d_title}}</span>' +
 * //         '</li>'
 * //     }
 * // }
 * //
 *
 * var data = [
 *     {title: 'rootA', children: [
 *         {title: 'root-1A'},
 *         {title: 'root-1B'},
 *         {title: 'root-1C'},
 *         {title: 'root-1D'},
 *         {title: 'root-2A', children: [
 *             {title:'sub_1A', children:[
 *                 {title:'sub_sub_1A'}
 *             ]},
 *             {title:'sub_2A'}
 *         ]},
 *         {title: 'root-2B'},
 *         {title: 'root-2C'},
 *         {title: 'root-2D'},
 *         {title: 'root-3A', children: [
 *             {title:'sub3_a'},
 *             {title:'sub3_b'}
 *         ]},
 *         {title: 'root-3B'},
 *         {title: 'root-3C'},
 *         {title: 'root-3D'}
 *     ]},
 *     {title: 'rootB', children: [
 *         {title:'B_sub1'},
 *         {title:'B_sub2'},
 *         {title:'b'}
 *     ]}
 * ];
 *
 * var tree1 = new tui.component.Tree(data, {
 *     defaultState: 'opened'
 * });
 **/
var Tree = tui.util.defineClass(/** @lends Tree.prototype */{

    /**
     * Initialize
     * @param {object} data - Data of nodes
     * @param {object} options - The options
     */
    init: function (data, options) {
        var extend = tui.util.extend;
        options = extend({}, defaults, options);

        /**
         * A state of tree
         * @type {number}
         */
        this.state = treeStates.NORMAL;

        /**
         * Default class names
         * @type {object.<string, string>}
         */
        this.classNames = extend({}, defaults.classNames, options.classNames);

        /**
         * Default template
         * @type {{internalNode: string, leafNode: string}}
         */
        this.template = extend({}, defaults.template, options.template);

        /**
         * Root element
         * @type {HTMLElement}
         */
        this.rootElement = options.rootElement;

        /**
         * Toggle button state label
         * @type {{opened: string, closed: string}}
         */
        this.stateLabel = options.stateLabel;

        /**
         * Whether drag and drop use or not
         * @type {boolean}
         */
        this.useDrag = options.useDrag;

        /**
         * Whether helper element use or not
         * @type {boolean}
         */
        this.useHelper = this.useDrag && options.useHelper;

        /**
         * Set relative position for helper object
         * @type {object}
         */
        this.helperPos = options.helperPos;

        /**
         * Input element 
         * @type {HTMLElement}
         */
        this.inputElement = this.getEditableElement();

        /**
         * Make tree model
         * @type {TreeModel}
         */
        this.model = new TreeModel(options.defaultState, this);
        this.model.setData(data);

        if (!tui.util.isHTMLNode(this.rootElement)) {
            this.root = document.createElement('UL');
            document.body.appendChild(this.root);
        }

        this._draw(this._getHtml(this.model.treeHash.root.childKeys));

        this.setEvents();
    },

    /**
     * Make input element
     * @return {HTMLElement}
     */
    getEditableElement: function() {
        var input = document.createElement('INPUT');
        input.className = this.editClass;
        input.setAttribute('type', 'text');

        return input;
    },

    /**
     * Set event handler 
     */
    setEvents: function() {

        util.addEventListener(this.root, 'click', tui.util.bind(this._onClick, this));
        util.addEventListener(this.inputElement, 'blur', tui.util.bind(this._onBlurInput, this));
        util.addEventListener(this.inputElement, 'keyup', tui.util.bind(this._onKeyup, this));

        if (this.useDrag) {
            this._addDragEvent();
        }
    },

    /**
     * Set drag and drop event 
     * @private
     */
    _addDragEvent: function() {
        var userSelectProperty = util.testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);
        var isSupportSelectStart = 'onselectstart' in document;
        if (isSupportSelectStart) {
            util.addEventListener(this.root, 'selectstart', util.preventDefault);
        } else {
            var style = document.documentElement.style;
            style[userSelectProperty] = 'none';
        }
        util.addEventListener(this.root, 'mousedown', tui.util.bind(this._onMouseDown, this));
    },

    /**
     * On key up event handler
     * @private
     */
    _onKeyup: function(e) {
        if (e.keyCode === 13) {
            var target = util.getTarget(e);
            this.model.rename(this.current.id, target.value);
            this.changeState(this.current);
        }
    },

    /**
     * On input blur event handler
     * @param {event} e
     * @private
     */
    _onBlurInput: function(e) {
        if (this.state === STATE.NORMAL) {
            return;
        }
        var target = util.getTarget(e);
        this.model.rename(this.current.id, target.value);
        this.changeState(this.current);
    },

    /**
     * On click event handler
     * @param {event} e
     * @private
     */
    _onClick: function(e) {
        var target = util.getTarget(e);

        if (util.isRightButton(e)) {
            this.clickTimer = null;
            return;
        }

        if (!util.hasClass(target, this.valueClass)) {
            this._onSingleClick(e);
            return;
        }

        if (this.clickTimer) {
            this._onDoubleClick(e);
            window.clearTimeout(this.clickTimer);
            this.clickTimer = null;
        } else {
            this.clickTimer = setTimeout(tui.util.bind(function() {
                this._onSingleClick(e);
            }, this), 400);
        }
    },

    /**
     * handle single click event 
     * @param {event} e
     * @private
     */
    _onSingleClick: function(e) {

        this.clickTimer = null;

        var target = util.getTarget(e),
            tag = target.tagName.toUpperCase(),
            parent = target.parentNode,
            valueEl = util.getElementsByClass(parent, this.valueClass)[0];

        if (tag === 'INPUT') {
            return;
        }

        if (tag === 'BUTTON') {
            this.model.changeState(valueEl.id);
        } else {
            this.model.setBuffer(valueEl.id);
        }
    },

    /**
     * Change state (STATE.NORMAL | STATE.EDITABLE)
     * @param {HTMLelement} target 엘리먼트
     */
    changeState: function(target) {

        if (this.state === STATE.EDITABLE) {
            this.state = STATE.NORMAL;
            this.action('restore', target);
        } else {
            this.state = STATE.EDITABLE;
            this.action('convert', target);
        }

    },

    /**
     * handle Double click 
     * @param {event} e
     * @private
     */
    _onDoubleClick: function(e) {
        var target = util.getTarget(e);
        this.changeState(target);
    },

    /**
     * handle mouse down
     * @private
     */
    _onMouseDown: function(e) {

        if (this.state === STATE.EDITABLE || util.isRightButton(e)) {
            return;
        }

        util.preventDefault(e);

        var target = util.getTarget(e),
            tag = target.tagName.toUpperCase();

        if (tag === 'BUTTON' || tag === 'INPUT' || !util.hasClass(target, this.valueClass)) {
            return;
        }

        this.pos = this.root.getBoundingClientRect();

        if (this.useHelper) {
            this.enableHelper({
                x: e.clientX - this.pos.left,
                y: e.clientY - this.pos.top
            }, target.innerText || target.textContent);
        }

        this.move = tui.util.bind(this._onMouseMove, this);
        this.up = tui.util.bind(this._onMouseUp, this, target);

        util.addEventListener(document, 'mousemove', this.move);
        util.addEventListener(document, 'mouseup', this.up);
    },

    /**
     * Handle mouse move 
     * @param {event} me
     * @private
     */
    _onMouseMove: function(me) {
        if (!this.useHelper) {
            return;
        }
        this.setHelperLocation({
            x: me.clientX - this.pos.left,
            y: me.clientY - this.pos.top
        });
    },

    /**
     * Handle mouse up
     * @param {HTMLElement} target A target 
     * @param {event} ue
     * @private
     */
    _onMouseUp: function(target, ue) {
        this.disableHelper();

        var toEl = util.getTarget(ue),
            model = this.model,
            node = model.find(target.id),
            toNode = model.find(toEl.id),
            isDisable = model.isDisable(toNode, node);

        if (model.find(toEl.id) && toEl.id !== target.id && !isDisable) {
            model.move(target.id, node, toEl.id);
        }

        util.removeEventListener(document, 'mousemove', this.move);
        util.removeEventListener(document, 'mouseup', this.up);
    },

    /**
     * Show up guide element
     * @param {object} pos A element position
     * @param {string} value A element text value
     */
    enableHelper: function(pos, value) {
        if (!this.helperElement) {
            this.helperElement = document.createElement('span');
            this.helperElement.style.position = 'absolute';
            this.helperElement.style.display = 'none';
            this.root.parentNode.appendChild(this.helperElement);
        }

        this.helperElement.innerHTML = value;
    },

    /**
     * Set guide elmeent location
     * @param {object} pos A position to move
     */
    setHelperLocation: function(pos) {
        this.helperElement.style.left = pos.x + this.helperPos.x + 'px';
        this.helperElement.style.top = pos.y + this.helperPos.y + 'px';
        this.helperElement.style.display = 'block';
    },

    /**
     * Hide guide element
     */
    disableHelper: function() {
        if (this.helperElement) {
            this.helperElement.style.display = 'none';
        }
    },

    /**
     * make html 
     * @param {Object} data A draw data
     * @param {Path} beforePath A path of subtree
     * @return {String} html
     * @private
     */
    _getHtml: function(keys) {
        var model = this.model,
            template = this.template,
            display = {
                opend: 'block',
                closed: 'none'
            },
            html,
            childEl = [],
            node,
            tmpl,
            depth,
            state,
            label,
            rate,
            map;

        tui.util.forEach(keys, function(el) {
            node = model.find(el);
            depth = node.depth;
            state = this[node.state + 'Set'][0];
            label = this[node.state + 'Set'][1];
            rate = this.depthLabels[depth - 1] || '';
            map = {
                State: state,
                //NodeID: node.id,
                //Depth: depth,
                //title: node.title,
                titleClass: this.titleClass,
                subtreeClass: this.subtreeClass,
                stateLabel: this.stateLabel[node.state],
                display: display[node.state]
            };

            if (tui.util.isNotEmpty(node.childKeys)) {
                tmpl = template.internalNode;
                map.Children = this._getHtml(node.childKeys);
            } else {
                tmpl = template.leafNode;
            }

            el = tmpl.replace(/\{\{([^\}]+)\}\}/g, function(matchedString, name) {
                return map[name] || '';
            });

            childEl.push(el);
        }, this);

        html = childEl.join('');

        return html;
    },

    /**
     * Update view.
     * @param {string} act
     * @param {object} target
     */
    notify: function(act, target) {
        this.action(act, target);
    },

    /**
     * Action 
     * @param {String} type A type of action 
     * @param {Object} target A target
     */
    action: function(type, target) {
        this._actionMap = this._actionMap || {
            refresh: this._refresh,
            rename: this._rename,
            toggle: this._toggleNode,
            select: this._select,
            unselect: this._unSelect,
            convert: this._convert,
            restore: this._restore
        };
        this._actionMap[type || 'refresh'].call(this, target);
    },

    /**
     * Change node state
     * @param {Object} node A information to node
     * @private
     */
    _changeNodeState: function(node) {
        var element = document.getElementById(node.id);
        if (!element) {
            return;
        }

        var parent = element.parentNode,
            cls = parent.className;

        if (tui.util.isEmpty(node.childKeys)) {
            cls = 'leap_node ' + this[node.state + 'Set'][0];
        } else {
            cls = 'internal_node ' + this[node.state + 'Set'][0];
        }

        parent.className = cls;
    },

    /**
     * Change state to edit 
     * @param {HTMLElement} element A target element
     * @private
     */
    _convert: function(element) {
        var id = element.id,
            node = this.model.find(id),
            label = node.value,
            parent = element.parentNode;

        if (this.current) {
            this.current.style.display = '';
        }

        element.style.display = 'none';
        this.inputElement.value = label;
        this.current = element;
        parent.insertBefore(this.inputElement, element);

        this.inputElement.focus();
    },

    /**
     * Apply node name
     * @param {HTMLElement} element A target element
     * @private
     */
    _restore: function(element) {

        var parent = element.parentNode;

        if (this.current) {
            this.current.style.display = '';
        }

        this.inputElement.value = '';

        parent.removeChild(this.inputElement);
    },

    /**
     * Draw element
     * @param {String} html A html made by data
     * @param {Object} parent A parent element
     * @private
     *
     */
    _draw: function(html, parent) {
        var root = parent || this.root;
        root.innerHTML = html;
    },

    /**
     * Set label by depth
     * @api
     * @param {Array} depthLabels A depth label array
     */
    setDepthLabels: function(depthLabels) {
        this.depthLabels = depthLabels;
    },

    /**
     * Refresh node
     * @private
     **/
    _refresh: function() {
        var data = this.model.treeHash.root.childKeys;
        this._draw(this._getHtml(data));
    },

    /**
     * Rename node
     * @param {object} node A model information 
     * @private
     */
    _rename: function(node) {
        var element = document.getElementById(node.id);
        element.innerHTML = node.value;
    },

    /**
    * Toggle model
    * @param {Object} node A node information
    * @private
    **/
    _toggleNode: function(node) {

        var element = document.getElementById(node.id),
            parent = element.parentNode,
            childWrap = parent.getElementsByTagName('ul')[0],
            button = parent.getElementsByTagName('button')[0],
            state = this[node.state + 'Set'][0],
            label = this[node.state + 'Set'][1],
            isOpen = node.state === 'open';

        parent.className = parent.className.replace(this.openSet[0], '').replace(this.closeSet[0], '') + state;
        childWrap.style.display = isOpen ? '' : 'none';
        button.innerHTML = label;
    },

    /**
     * Select node
     * @param {Object} node A target node
     * @private
     */
    _select: function(node) {
        var valueEl = document.getElementById(node.id);

        if (tui.util.isExisty(valueEl)) {
            valueEl.className = valueEl.className.replace(' ' + this.onselectClass, '') + ' ' + this.onselectClass;
        }
    },

    /**
     * Unselect node
     * @param {Object} node A target node
     * @private
     **/
    _unSelect: function(node) {
        var valueEl = document.getElementById(node.id);

        if (tui.util.isExisty(valueEl) && util.hasClass(valueEl, this.onselectClass)) {
            valueEl.className = valueEl.className.replace(' ' + this.onselectClass, '');
        }
    }
});

module.exports = Tree;
