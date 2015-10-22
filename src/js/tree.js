/**
 * @fileoverview Render tree and update tree.
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

var statics = require('./statics');
var util = require('./utils');
var TreeModel = require('./treemodel');

/**
 * Create tree model and inject data to model
 * @constructor 
 * @param {string} id A id for tree root element
 *      @param {Object} data A data to be used on tree
 *      @param {Object} options The options
 *          @param {String} options.modelOption A inner option for model
 *          @param {object} [options.template] A markup set to make element
 *          @param {Array} [options.openSet] A class name and button label to open state
 *          @param {Array} [options.closeSet] A class name and button label to close state
 *          @param {string} [options.selectClass] A class name to selected node
 *          @param {string} [options.valueClass] A class name that for selected zone
 *          @param {string} [options.inputClass] A class name for input element
 *          @param {string} [options.subtreeClass] A class name for sub tree
 *          @param {Array} [options.depthLabels] A default label  each depth's nodes
 *          @param {object} [options.helperPos] A related position for helper object
 * @example
 * var data = [
 {title: 'rootA', children:
         [
             {title: 'root-1A'}, {title: 'root-1B'},{title: 'root-1C'}, {title: 'root-1D'},
             {title: 'root-2A', children: [
                 {title:'sub_1A', children:[{title:'sub_sub_1A'}]}, {title:'sub_2A'}
             ]}, {title: 'root-2B'},{title: 'root-2C'}, {title: 'root-2D'},
             {title: 'root-3A',
                 children: [
                     {title:'sub3_a'}, {title:'sub3_b'}
                 ]
             }, {title: 'root-3B'},{title: 'root-3C'}, {title: 'root-3D'}
         ]
 },
 {title: 'rootB', children: [
     {title:'B_sub1'}, {title:'B_sub2'}, {title:'b'}
 ]}
 ];

 var tree1 = new tui.component.Tree('id', data ,{
        modelOption: {
            defaultState: 'open'
        }
    });
});
 **/

var Tree = tui.util.defineClass(/** @lends Tree.prototype */{

    /**
     * Initialize
     * @param {String} id A id for root 
     * @param {Object} data A initialize data
     * @param {Object} options The options 
     */
    init: function (id, data, options) {

        /**
         * A default template
         * @type {String}
         */
        this.template = options.template || statics.DEFAULT.TEMPLATE;

        /**
         * A root element
         * @type {HTMLElement}
         */
        this.root = null;

        /**
         * A class name and lebel text for open state
         * @type {Array}
         */
        this.openSet = options.openSet || statics.DEFAULT.OPEN;

        /**
         * A class name and label text for close state
         * @type {Array}
         */
        this.closeSet = options.closeSet || statics.DEFAULT.CLOSE;

        /**
         * A class name for selected node 
         * @type {String}
         */
        this.onselectClass = options.selectClass || statics.DEFAULT.SELECT_CLASS;

        /**
         * A class name for double click area
         * @type {string}
         */
        this.valueClass = options.valueClass || statics.DEFAULT.VALUE_CLASS;

        /**
         * A class name for input element
         * @type {string}
         */
        this.editClass = options.inputClass || statics.DEFAULT.EDITABLE_CLASS;

        /**
         * A label for each depth
         * @type {Array}
         */
        this.depthLabels = options.depthLabels || [];

        /**
         * A state of tree
         * @type {number}
         */
        this.state = statics.STATE.NORMAL;

        /**
         * A class name for subtree
         * @type {string|*}
         */
        this.subtreeClass = options.subtreeClass || statics.DEFAULT.SUBTREE_CLASS;

        /**
         * Whether drag and drop use or not
         * @type {boolean|*}
         */
        this.useDrag = options.useDrag || statics.DEFAULT.USE_DRAG;

        /**
         * Whether helper element use or not
         * @type {boolean|*}
         */
        this.useHelper = this.useDrag && (options.useHelper || statics.DEFAULT.USE_HELPER);

        /**
         * Set relative position for helper object
         * @type {object}
         */
        this.helperPos = options.helperPos || statics.DEFAULT.HELPER_POS;

        /**
         * Input element 
         * @type {HTMLElement}
         */
        this.inputElement = this.getEditableElement();

        /**
         * Make tree model
         * @type {TreeModel}
         */
        this.model = new TreeModel(options.modelOption, this);

        this.model.setData(data);

        if (id) {
            this.root = document.getElementById(id);
        } else {
            this.root = document.createElement('ul');
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
        var input = document.createElement('input');
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
                StateLabel: label,
                NodeID: node.id,
                Depth: depth,
                Title: node.value,
                ValueClass: this.valueClass,
                SubTree: this.subtreeClass,
                Display: (node.state === 'open') ? '' : 'none',
                DepthLabel: rate
            };

            if (tui.util.isNotEmpty(node.childKeys)) {
                tmpl = this.template.EDGE_NODE;
                map.Children = this._getHtml(node.childKeys);
            } else {
                tmpl = this.template.LEAP_NODE;
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
     * @param {Object} node A informtion to node
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
            cls = 'edge_node ' + this[node.state + 'Set'][0];
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
