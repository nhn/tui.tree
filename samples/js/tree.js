(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Tree', require('./src/js/tree'));

},{"./src/js/tree":3}],2:[function(require,module,exports){
/**
 * @fileoverview A default values for tree
 */

var STATE = {
    NORMAL: 0,
    EDITABLE: 1
};

var DEFAULT = {
    OPEN: ['open', '-'],
    CLOSE: ['close', '+'],
    SELECT_CLASS: 'selected',
    SUBTREE_CLASS: 'Subtree',
    VALUE_CLASS: 'valueClass',
    EDITABLE_CLASS: 'editableClass',
    TEMPLATE: {
        EDGE_NODE: '<li class="edge_node {{State}}">' +
                    '<button type="button">{{StateLabel}}</button>' +
                    '<span id="{{NodeID}}" class="depth{{Depth}} {{ValueClass}}">{{Title}}</span><em>{{DepthLabel}}</em>' +
                    '<ul class="{{Subtree}}" style="display:{{Display}}">{{Children}}</ul>' +
                '</li>',
        LEAP_NODE: '<li class="leap_node">' +
                    '<span id="{{NodeID}}" class="depth{{Depth}} {{ValueClass}}">{{Title}}</span><em>{{DepthLabel}}</em>' +
                '</li>'
    },
    USE_DRAG: false,
    USE_HELPER: false,
    HELPER_POS : {
        x: 10,
        y: 10
    }
};

module.exports = {
    STATE: STATE,
    DEFAULT: DEFAULT
};

},{}],3:[function(require,module,exports){
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

},{"./statics":2,"./treemodel":4,"./utils":5}],4:[function(require,module,exports){
/**
 * @fileoverview Update view and control tree data
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

/**
 * @constructor TreeModel
 * **/
var TreeModel = tui.util.defineClass(/** @lends TreeModel.prototype */{
    init: function(options, tree) {

        /**
         * A count for node identity number
         * @type {number}
         */
        this.count = 0;

        /**
         * A view that observe model change
         * @type {tui.component.Tree}
         */
        this.tree = tree;

        /**
         * Default state of node
         * @type {String}
         */
        this.nodeDefaultState = options.defaultState || 'close';

        /**
         * A buffer 
         * @type {null}
         */
        this.buffer = null;

        /**
         * A depth
         * @type {number}
         */
        this.depth = 0;

        /**
         * A milisecon time to make node ID
         * @type {number}
         */
        this.date = new Date().getTime();

        /**
         * Tree hash
         * @type {object}
         */
        this.treeHash = {};

        this.treeHash['root'] = this.makeNode(0, 'root', 'root');
        this.connect(tree);
    },

    /**
     * Set model with tree data
     * @param {array} data  A tree data
     */
    setData: function(data) {
        this.treeHash.root.childKeys = this._makeTreeHash(data);
    },

    /**
     * Change hierarchy data to hash list.
     * @param {array} data A tree data 
     * @param {string} parentId A parent node id
     * @private
     */
    _makeTreeHash: function(data, parentId) {

        var childKeys = [],
            id;

        this.depth = this.depth + 1;

        tui.util.forEach(data, function(element) {

            id = this._getId();

            this.treeHash[id] = this.makeNode(this.depth, id, element.value, parentId);

            if (element.children && tui.util.isNotEmpty(element.children)) {
                this.treeHash[id].childKeys = this._makeTreeHash(element.children, id);
            }

            childKeys.push(id);
        }, this);

        this.depth = this.depth - 1;

        childKeys.sort(tui.util.bind(this.sort, this));

        return childKeys;
    },

    /**
     * Create node
     * @param {number} depth A depth of node
     * @param {string} id A node ID
     * @param {string} value A value of node
     * @param {string} parentId A parent node ID
     * @return {{value: *, parentId: (*|string), id: *}}
     */
    makeNode: function(depth, id, value, parentId) {
        return {
            depth: depth,
            value: value,
            parentId: (depth === 0) ? null : (parentId || 'root'),
            state: this.nodeDefaultState,
            id: id
        };
    },

    /**
     * Make and return node ID
     * @private
     * @return {String}
     */
    _getId: function() {
        this.count = this.count + 1;
        return 'node_' + this.date + '_' + this.count;
    },

    /**
     * Find node 
     * @param {string} key A key to find node
     * @return {object|undefined}
     */
    find: function(key) {
        return this.treeHash[key];
    },

    /**
     * Remove node and child nodes
     * @param {string} key A key to remove
     */
    remove: function(key) {
        var res = this.invoke('remove', { id: key });

        if (!res) {
            return;
        }

        this.removeKey(key);
        this.treeHash[key] = null;

        this.notify();
    },

    /**
     * Remove node key
     * @param {string} key A key to remove
     */
    removeKey: function(key) {
        var node = this.find(key);

        if (!node) {
            return;
        }

        var parent = this.find(node.parentId);

        parent.childKeys = tui.util.filter(parent.childKeys, function(childKey) {
            return childKey !== key;
        });

    },

    /**
     * Move node
     * @param {string} key A key to move node
     * @param {object} node A node object to move
     * @param {string} targetId A target ID to insert
     */
    move: function(key, node, targetId) {

        this.removeKey(key);
        this.treeHash[key] = null;
        this.insert(node, targetId);

    },

    /**
     * Insert node
     * @param {object} node A node object to insert
     * @param {string} [targetId] A target ID to insert
     */
    insert: function(node, targetId) {
        var target = this.find(targetId || 'root');

        if (!target.childKeys) {
            target.childKeys = [];
        }

        target.childKeys.push(node.id);
        node.depth = target.depth + 1;
        node.parentId = targetId;
        target.childKeys.sort(tui.util.bind(this.sort, this));

        this.treeHash[node.id] = node;

        this.notify();
    },

    /**
     * A notify tree
     */
    notify: function(type, target) {
        if (this.tree) {
            this.tree.notify(type, target);
        }
    },

    /**
     * Connect view and model
     * @param {Tree} tree
     */
    connect: function(tree) {
        if (!tree) {
            return;
        }
        this.tree = tree;
    },

    /**
     * Rename node
     * @param {stirng} key A key to rename
     * @param {string} value A value to change
     */
    rename: function(key, value) {
        var res = this.invoke('rename', {id: key, value: value});
        if (!res) {
            return;
        }

        var node = this.find(key);
        node.value = value;

        this.notify('rename', node);
    },

    /**
     * Change node state
     * @param {string} key The key value to change
     */
    changeState: function(key) {
        var node = this.find(key);
        node.state = (node.state === 'open') ? 'close' : 'open';
        this.notify('toggle', node);
    },
    /**
     * Set buffer to save selected node
     * @param {String} key The key of selected node
     **/
    setBuffer: function(key) {

        this.clearBuffer();

        var node = this.find(key);

        this.notify('select', node);
        this.fire('select', {id: key, value: node.value });

        this.buffer = node;
    },

    /**
     * Empty buffer
     */
    clearBuffer: function() {

        if (!this.buffer) {
            return;
        }

        this.notify('unselect', this.buffer);
        this.buffer = null;

    },

    /**
     * Check movable positon
     * @param {object} dest A destination node
     * @param {object} node A target node
     */
    isDisable: function(dest, node) {
        if (dest.depth === node.depth) {
            return false;
        }
        if (dest.parentId) {
            if (dest.id === node.parentId) {
                return true;
            }
            if (dest.parentId === node.id) {
                return true;
            } else {
                return this.isDisable(this.find(dest.parentId), node);
            }
        }
    },

    /**
     * Sort by title
     * @param {string} pid
     * @param {string} nid
     * @return {number}
     */
    sort: function(pid, nid) {
        var p = this.find(pid),
            n = this.find(nid);

        if (!p || !n) {
            return 0;
        }

        if (p.value < n.value) {
            return -1;
        } else if (p.value > n.value) {
            return 1;
        } else {
            return 0;
        }
    }
});
tui.util.CustomEvents.mixin(TreeModel);

module.exports = TreeModel;

},{}],5:[function(require,module,exports){
/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

/**
 * @namespace util
 */
var util = {
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
     * @param {event} e Event object
     * @return {HTMLElement} 
     */
    getTarget: function(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        return target;
    },

    /**
     * Check the element has specific class or not
     * @param {HTMLElement} element A target element
     * @param {string} className A name of class to find
     * @return {boolean}
     */
    hasClass: function(element, className) {
        if (!element || !className) {
            throw new Error('#util.hasClass(element, className) 엘리먼트가 입력되지 않았습니다. \n__element' + element + ',__className' + className);
        }

        var cls = element.className;

        if (cls.indexOf(className) !== -1) {
            return true;
        }

        return false;
    },

    /**
     * Find element by class name
     * @param {HTMLElement} target A target element
     * @param {string} className A name of class
     * @return {array}
     */
    getElementsByClass: function(target, className) {
        if (target.querySelectorAll) {
            return target.querySelectorAll('.' + className);
        }
        var all = target.getElementsByTagName('*'),
            filter = [];

        all = tui.util.toArray(all);

        tui.util.forEach(all, function(el) {
            var cls = el.className || '';
            if (cls.indexOf(className) !== -1) {
                filter.push(el);
            }
        });

        return filter;
    },

    /**
     * Check whether the click event by right button or not
     * @param {event} e Event object
     * @return {boolean} 
     */
    isRightButton: function(e) {
        var isRight = util._getButton(e) === 2;
        return isRight;
    },

    /**
     * Whether the property exist or not
     * @param {array} props A property 
     * @return {boolean}
     */
    testProp: function(props) {
        var style = document.documentElement.style,
            i = 0;

        for (; i < props.length; i++) {
            if (props[i] in style) {
                return props[i];
            }
        }
        return false;
    },

    /**
     * Prevent default event 
     * @param {event} e Event object
     */
    preventDefault: function(e) {
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    },

    /**
     * Normalization for event button property 
     * 0: First mouse button, 2: Second mouse button, 1: Center button
     * @param {MouseEvent} event Event object
     * @return {number|undefined} 
     * @private
     */
    _getButton: function(e) {
        var button,
            primary = '0,1,3,5,7',
            secondary = '2,6',
            wheel = '4';

        if (document.implementation.hasFeature('MouseEvents', '2.0')) {
            return e.button;
        } else {
            button = e.button + '';
            if (primary.indexOf(button) > -1) {
                return 0;
            } else if (secondary.indexOf(button) > -1) {
                return 2;
            } else if (wheel.indexOf(button) > -1) {
                return 1;
            }
        }
    }
};

module.exports = util;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9zdGF0aWNzLmpzIiwic3JjL2pzL3RyZWUuanMiLCJzcmMvanMvdHJlZW1vZGVsLmpzIiwic3JjL2pzL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQuVHJlZScsIHJlcXVpcmUoJy4vc3JjL2pzL3RyZWUnKSk7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBkZWZhdWx0IHZhbHVlcyBmb3IgdHJlZVxuICovXG5cbnZhciBTVEFURSA9IHtcbiAgICBOT1JNQUw6IDAsXG4gICAgRURJVEFCTEU6IDFcbn07XG5cbnZhciBERUZBVUxUID0ge1xuICAgIE9QRU46IFsnb3BlbicsICctJ10sXG4gICAgQ0xPU0U6IFsnY2xvc2UnLCAnKyddLFxuICAgIFNFTEVDVF9DTEFTUzogJ3NlbGVjdGVkJyxcbiAgICBTVUJUUkVFX0NMQVNTOiAnU3VidHJlZScsXG4gICAgVkFMVUVfQ0xBU1M6ICd2YWx1ZUNsYXNzJyxcbiAgICBFRElUQUJMRV9DTEFTUzogJ2VkaXRhYmxlQ2xhc3MnLFxuICAgIFRFTVBMQVRFOiB7XG4gICAgICAgIEVER0VfTk9ERTogJzxsaSBjbGFzcz1cImVkZ2Vfbm9kZSB7e1N0YXRlfX1cIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiPnt7U3RhdGVMYWJlbH19PC9idXR0b24+JyArXG4gICAgICAgICAgICAgICAgICAgICc8c3BhbiBpZD1cInt7Tm9kZUlEfX1cIiBjbGFzcz1cImRlcHRoe3tEZXB0aH19IHt7VmFsdWVDbGFzc319XCI+e3tUaXRsZX19PC9zcGFuPjxlbT57e0RlcHRoTGFiZWx9fTwvZW0+JyArXG4gICAgICAgICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e1N1YnRyZWV9fVwiIHN0eWxlPVwiZGlzcGxheTp7e0Rpc3BsYXl9fVwiPnt7Q2hpbGRyZW59fTwvdWw+JyArXG4gICAgICAgICAgICAgICAgJzwvbGk+JyxcbiAgICAgICAgTEVBUF9OT0RFOiAnPGxpIGNsYXNzPVwibGVhcF9ub2RlXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8c3BhbiBpZD1cInt7Tm9kZUlEfX1cIiBjbGFzcz1cImRlcHRoe3tEZXB0aH19IHt7VmFsdWVDbGFzc319XCI+e3tUaXRsZX19PC9zcGFuPjxlbT57e0RlcHRoTGFiZWx9fTwvZW0+JyArXG4gICAgICAgICAgICAgICAgJzwvbGk+J1xuICAgIH0sXG4gICAgVVNFX0RSQUc6IGZhbHNlLFxuICAgIFVTRV9IRUxQRVI6IGZhbHNlLFxuICAgIEhFTFBFUl9QT1MgOiB7XG4gICAgICAgIHg6IDEwLFxuICAgICAgICB5OiAxMFxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFNUQVRFOiBTVEFURSxcbiAgICBERUZBVUxUOiBERUZBVUxUXG59O1xuIiwiLyoqXHJcbiAqIEBmaWxlb3ZlcnZpZXcgUmVuZGVyIHRyZWUgYW5kIHVwZGF0ZSB0cmVlLlxyXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XHJcbiAqL1xyXG5cclxudmFyIHN0YXRpY3MgPSByZXF1aXJlKCcuL3N0YXRpY3MnKTtcclxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcbnZhciBUcmVlTW9kZWwgPSByZXF1aXJlKCcuL3RyZWVtb2RlbCcpO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSB0cmVlIG1vZGVsIGFuZCBpbmplY3QgZGF0YSB0byBtb2RlbFxyXG4gKiBAY29uc3RydWN0b3IgXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCBBIGlkIGZvciB0cmVlIHJvb3QgZWxlbWVudFxyXG4gKiAgICAgIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEEgZGF0YSB0byBiZSB1c2VkIG9uIHRyZWVcclxuICogICAgICBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9uc1xyXG4gKiAgICAgICAgICBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5tb2RlbE9wdGlvbiBBIGlubmVyIG9wdGlvbiBmb3IgbW9kZWxcclxuICogICAgICAgICAgQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLnRlbXBsYXRlXSBBIG1hcmt1cCBzZXQgdG8gbWFrZSBlbGVtZW50XHJcbiAqICAgICAgICAgIEBwYXJhbSB7QXJyYXl9IFtvcHRpb25zLm9wZW5TZXRdIEEgY2xhc3MgbmFtZSBhbmQgYnV0dG9uIGxhYmVsIHRvIG9wZW4gc3RhdGVcclxuICogICAgICAgICAgQHBhcmFtIHtBcnJheX0gW29wdGlvbnMuY2xvc2VTZXRdIEEgY2xhc3MgbmFtZSBhbmQgYnV0dG9uIGxhYmVsIHRvIGNsb3NlIHN0YXRlXHJcbiAqICAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zZWxlY3RDbGFzc10gQSBjbGFzcyBuYW1lIHRvIHNlbGVjdGVkIG5vZGVcclxuICogICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnZhbHVlQ2xhc3NdIEEgY2xhc3MgbmFtZSB0aGF0IGZvciBzZWxlY3RlZCB6b25lXHJcbiAqICAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5pbnB1dENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIGlucHV0IGVsZW1lbnRcclxuICogICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN1YnRyZWVDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBzdWIgdHJlZVxyXG4gKiAgICAgICAgICBAcGFyYW0ge0FycmF5fSBbb3B0aW9ucy5kZXB0aExhYmVsc10gQSBkZWZhdWx0IGxhYmVsICBlYWNoIGRlcHRoJ3Mgbm9kZXNcclxuICogICAgICAgICAgQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmhlbHBlclBvc10gQSByZWxhdGVkIHBvc2l0aW9uIGZvciBoZWxwZXIgb2JqZWN0XHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBkYXRhID0gW1xyXG4ge3RpdGxlOiAncm9vdEEnLCBjaGlsZHJlbjpcclxuICAgICAgICAgW1xyXG4gICAgICAgICAgICAge3RpdGxlOiAncm9vdC0xQSd9LCB7dGl0bGU6ICdyb290LTFCJ30se3RpdGxlOiAncm9vdC0xQyd9LCB7dGl0bGU6ICdyb290LTFEJ30sXHJcbiAgICAgICAgICAgICB7dGl0bGU6ICdyb290LTJBJywgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgICAgICB7dGl0bGU6J3N1Yl8xQScsIGNoaWxkcmVuOlt7dGl0bGU6J3N1Yl9zdWJfMUEnfV19LCB7dGl0bGU6J3N1Yl8yQSd9XHJcbiAgICAgICAgICAgICBdfSwge3RpdGxlOiAncm9vdC0yQid9LHt0aXRsZTogJ3Jvb3QtMkMnfSwge3RpdGxlOiAncm9vdC0yRCd9LFxyXG4gICAgICAgICAgICAge3RpdGxlOiAncm9vdC0zQScsXHJcbiAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgICAgICAgICAge3RpdGxlOidzdWIzX2EnfSwge3RpdGxlOidzdWIzX2InfVxyXG4gICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgIH0sIHt0aXRsZTogJ3Jvb3QtM0InfSx7dGl0bGU6ICdyb290LTNDJ30sIHt0aXRsZTogJ3Jvb3QtM0QnfVxyXG4gICAgICAgICBdXHJcbiB9LFxyXG4ge3RpdGxlOiAncm9vdEInLCBjaGlsZHJlbjogW1xyXG4gICAgIHt0aXRsZTonQl9zdWIxJ30sIHt0aXRsZTonQl9zdWIyJ30sIHt0aXRsZTonYid9XHJcbiBdfVxyXG4gXTtcclxuXHJcbiB2YXIgdHJlZTEgPSBuZXcgdHVpLmNvbXBvbmVudC5UcmVlKCdpZCcsIGRhdGEgLHtcclxuICAgICAgICBtb2RlbE9wdGlvbjoge1xyXG4gICAgICAgICAgICBkZWZhdWx0U3RhdGU6ICdvcGVuJ1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuICoqL1xyXG5cclxudmFyIFRyZWUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWUucHJvdG90eXBlICove1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIEEgaWQgZm9yIHJvb3QgXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSBBIGluaXRpYWxpemUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMgXHJcbiAgICAgKi9cclxuICAgIGluaXQ6IGZ1bmN0aW9uIChpZCwgZGF0YSwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGRlZmF1bHQgdGVtcGxhdGVcclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSBvcHRpb25zLnRlbXBsYXRlIHx8IHN0YXRpY3MuREVGQVVMVC5URU1QTEFURTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSByb290IGVsZW1lbnRcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yb290ID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjbGFzcyBuYW1lIGFuZCBsZWJlbCB0ZXh0IGZvciBvcGVuIHN0YXRlXHJcbiAgICAgICAgICogQHR5cGUge0FycmF5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMub3BlblNldCA9IG9wdGlvbnMub3BlblNldCB8fCBzdGF0aWNzLkRFRkFVTFQuT1BFTjtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjbGFzcyBuYW1lIGFuZCBsYWJlbCB0ZXh0IGZvciBjbG9zZSBzdGF0ZVxyXG4gICAgICAgICAqIEB0eXBlIHtBcnJheX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNsb3NlU2V0ID0gb3B0aW9ucy5jbG9zZVNldCB8fCBzdGF0aWNzLkRFRkFVTFQuQ0xPU0U7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgY2xhc3MgbmFtZSBmb3Igc2VsZWN0ZWQgbm9kZSBcclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMub25zZWxlY3RDbGFzcyA9IG9wdGlvbnMuc2VsZWN0Q2xhc3MgfHwgc3RhdGljcy5ERUZBVUxULlNFTEVDVF9DTEFTUztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjbGFzcyBuYW1lIGZvciBkb3VibGUgY2xpY2sgYXJlYVxyXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy52YWx1ZUNsYXNzID0gb3B0aW9ucy52YWx1ZUNsYXNzIHx8IHN0YXRpY3MuREVGQVVMVC5WQUxVRV9DTEFTUztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjbGFzcyBuYW1lIGZvciBpbnB1dCBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmVkaXRDbGFzcyA9IG9wdGlvbnMuaW5wdXRDbGFzcyB8fCBzdGF0aWNzLkRFRkFVTFQuRURJVEFCTEVfQ0xBU1M7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgbGFiZWwgZm9yIGVhY2ggZGVwdGhcclxuICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kZXB0aExhYmVscyA9IG9wdGlvbnMuZGVwdGhMYWJlbHMgfHwgW107XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgc3RhdGUgb2YgdHJlZVxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRpY3MuU1RBVEUuTk9STUFMO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGNsYXNzIG5hbWUgZm9yIHN1YnRyZWVcclxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfCp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zdWJ0cmVlQ2xhc3MgPSBvcHRpb25zLnN1YnRyZWVDbGFzcyB8fCBzdGF0aWNzLkRFRkFVTFQuU1VCVFJFRV9DTEFTUztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV2hldGhlciBkcmFnIGFuZCBkcm9wIHVzZSBvciBub3RcclxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbnwqfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudXNlRHJhZyA9IG9wdGlvbnMudXNlRHJhZyB8fCBzdGF0aWNzLkRFRkFVTFQuVVNFX0RSQUc7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFdoZXRoZXIgaGVscGVyIGVsZW1lbnQgdXNlIG9yIG5vdFxyXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufCp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy51c2VIZWxwZXIgPSB0aGlzLnVzZURyYWcgJiYgKG9wdGlvbnMudXNlSGVscGVyIHx8IHN0YXRpY3MuREVGQVVMVC5VU0VfSEVMUEVSKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU2V0IHJlbGF0aXZlIHBvc2l0aW9uIGZvciBoZWxwZXIgb2JqZWN0XHJcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmhlbHBlclBvcyA9IG9wdGlvbnMuaGVscGVyUG9zIHx8IHN0YXRpY3MuREVGQVVMVC5IRUxQRVJfUE9TO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBJbnB1dCBlbGVtZW50IFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmlucHV0RWxlbWVudCA9IHRoaXMuZ2V0RWRpdGFibGVFbGVtZW50KCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIE1ha2UgdHJlZSBtb2RlbFxyXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTW9kZWx9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG5ldyBUcmVlTW9kZWwob3B0aW9ucy5tb2RlbE9wdGlvbiwgdGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWwuc2V0RGF0YShkYXRhKTtcclxuXHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMucm9vdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9kcmF3KHRoaXMuX2dldEh0bWwodGhpcy5tb2RlbC50cmVlSGFzaC5yb290LmNoaWxkS2V5cykpO1xyXG4gICAgICAgIHRoaXMuc2V0RXZlbnRzKCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgaW5wdXQgZWxlbWVudFxyXG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGdldEVkaXRhYmxlRWxlbWVudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuICAgICAgICBpbnB1dC5jbGFzc05hbWUgPSB0aGlzLmVkaXRDbGFzcztcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGV2ZW50IGhhbmRsZXIgXHJcbiAgICAgKi9cclxuICAgIHNldEV2ZW50czogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3QsICdjbGljaycsIHR1aS51dGlsLmJpbmQodGhpcy5fb25DbGljaywgdGhpcykpO1xyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2JsdXInLCB0dWkudXRpbC5iaW5kKHRoaXMuX29uQmx1cklucHV0LCB0aGlzKSk7XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAna2V5dXAnLCB0dWkudXRpbC5iaW5kKHRoaXMuX29uS2V5dXAsIHRoaXMpKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudXNlRHJhZykge1xyXG4gICAgICAgICAgICB0aGlzLl9hZGREcmFnRXZlbnQoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGRyYWcgYW5kIGRyb3AgZXZlbnQgXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfYWRkRHJhZ0V2ZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdXNlclNlbGVjdFByb3BlcnR5ID0gdXRpbC50ZXN0UHJvcChbJ3VzZXJTZWxlY3QnLCAnV2Via2l0VXNlclNlbGVjdCcsICdPVXNlclNlbGVjdCcsICdNb3pVc2VyU2VsZWN0JywgJ21zVXNlclNlbGVjdCddKTtcclxuICAgICAgICB2YXIgaXNTdXBwb3J0U2VsZWN0U3RhcnQgPSAnb25zZWxlY3RzdGFydCcgaW4gZG9jdW1lbnQ7XHJcbiAgICAgICAgaWYgKGlzU3VwcG9ydFNlbGVjdFN0YXJ0KSB7XHJcbiAgICAgICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3QsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcclxuICAgICAgICAgICAgc3R5bGVbdXNlclNlbGVjdFByb3BlcnR5XSA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdCwgJ21vdXNlZG93bicsIHR1aS51dGlsLmJpbmQodGhpcy5fb25Nb3VzZURvd24sIHRoaXMpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbiBrZXkgdXAgZXZlbnQgaGFuZGxlclxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uS2V5dXA6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwucmVuYW1lKHRoaXMuY3VycmVudC5pZCwgdGFyZ2V0LnZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VTdGF0ZSh0aGlzLmN1cnJlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbiBpbnB1dCBibHVyIGV2ZW50IGhhbmRsZXJcclxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbkJsdXJJbnB1dDogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlID09PSBTVEFURS5OT1JNQUwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5yZW5hbWUodGhpcy5jdXJyZW50LmlkLCB0YXJnZXQudmFsdWUpO1xyXG4gICAgICAgIHRoaXMuY2hhbmdlU3RhdGUodGhpcy5jdXJyZW50KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbiBjbGljayBldmVudCBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge2V2ZW50fSBlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25DbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChlKTtcclxuXHJcbiAgICAgICAgaWYgKHV0aWwuaXNSaWdodEJ1dHRvbihlKSkge1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLnZhbHVlQ2xhc3MpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX29uU2luZ2xlQ2xpY2soZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNsaWNrVGltZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5fb25Eb3VibGVDbGljayhlKTtcclxuICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLmNsaWNrVGltZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IHNldFRpbWVvdXQodHVpLnV0aWwuYmluZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX29uU2luZ2xlQ2xpY2soZSk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpLCA0MDApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoYW5kbGUgc2luZ2xlIGNsaWNrIGV2ZW50IFxyXG4gICAgICogQHBhcmFtIHtldmVudH0gZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uU2luZ2xlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGUpLFxyXG4gICAgICAgICAgICB0YWcgPSB0YXJnZXQudGFnTmFtZS50b1VwcGVyQ2FzZSgpLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgdmFsdWVFbCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzKHBhcmVudCwgdGhpcy52YWx1ZUNsYXNzKVswXTtcclxuXHJcbiAgICAgICAgaWYgKHRhZyA9PT0gJ0lOUFVUJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGFnID09PSAnQlVUVE9OJykge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmNoYW5nZVN0YXRlKHZhbHVlRWwuaWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwuc2V0QnVmZmVyKHZhbHVlRWwuaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2Ugc3RhdGUgKFNUQVRFLk5PUk1BTCB8IFNUQVRFLkVESVRBQkxFKVxyXG4gICAgICogQHBhcmFtIHtIVE1MZWxlbWVudH0gdGFyZ2V0IOyXmOumrOuovO2KuFxyXG4gICAgICovXHJcbiAgICBjaGFuZ2VTdGF0ZTogZnVuY3Rpb24odGFyZ2V0KSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlID09PSBTVEFURS5FRElUQUJMRSkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEUuTk9STUFMO1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbigncmVzdG9yZScsIHRhcmdldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFLkVESVRBQkxFO1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbignY29udmVydCcsIHRhcmdldCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoYW5kbGUgRG91YmxlIGNsaWNrIFxyXG4gICAgICogQHBhcmFtIHtldmVudH0gZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XHJcbiAgICAgICAgdGhpcy5jaGFuZ2VTdGF0ZSh0YXJnZXQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIGhhbmRsZSBtb3VzZSBkb3duXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25Nb3VzZURvd246IGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IFNUQVRFLkVESVRBQkxFIHx8IHV0aWwuaXNSaWdodEJ1dHRvbihlKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1dGlsLnByZXZlbnREZWZhdWx0KGUpO1xyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSksXHJcbiAgICAgICAgICAgIHRhZyA9IHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGlmICh0YWcgPT09ICdCVVRUT04nIHx8IHRhZyA9PT0gJ0lOUFVUJyB8fCAhdXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMudmFsdWVDbGFzcykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wb3MgPSB0aGlzLnJvb3QuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnVzZUhlbHBlcikge1xyXG4gICAgICAgICAgICB0aGlzLmVuYWJsZUhlbHBlcih7XHJcbiAgICAgICAgICAgICAgICB4OiBlLmNsaWVudFggLSB0aGlzLnBvcy5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgeTogZS5jbGllbnRZIC0gdGhpcy5wb3MudG9wXHJcbiAgICAgICAgICAgIH0sIHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubW92ZSA9IHR1aS51dGlsLmJpbmQodGhpcy5fb25Nb3VzZU1vdmUsIHRoaXMpO1xyXG4gICAgICAgIHRoaXMudXAgPSB0dWkudXRpbC5iaW5kKHRoaXMuX29uTW91c2VVcCwgdGhpcywgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3ZlKTtcclxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy51cCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGFuZGxlIG1vdXNlIG1vdmUgXHJcbiAgICAgKiBAcGFyYW0ge2V2ZW50fSBtZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uTW91c2VNb3ZlOiBmdW5jdGlvbihtZSkge1xyXG4gICAgICAgIGlmICghdGhpcy51c2VIZWxwZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldEhlbHBlckxvY2F0aW9uKHtcclxuICAgICAgICAgICAgeDogbWUuY2xpZW50WCAtIHRoaXMucG9zLmxlZnQsXHJcbiAgICAgICAgICAgIHk6IG1lLmNsaWVudFkgLSB0aGlzLnBvcy50b3BcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIYW5kbGUgbW91c2UgdXBcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCBBIHRhcmdldCBcclxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IHVlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25Nb3VzZVVwOiBmdW5jdGlvbih0YXJnZXQsIHVlKSB7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlSGVscGVyKCk7XHJcblxyXG4gICAgICAgIHZhciB0b0VsID0gdXRpbC5nZXRUYXJnZXQodWUpLFxyXG4gICAgICAgICAgICBtb2RlbCA9IHRoaXMubW9kZWwsXHJcbiAgICAgICAgICAgIG5vZGUgPSBtb2RlbC5maW5kKHRhcmdldC5pZCksXHJcbiAgICAgICAgICAgIHRvTm9kZSA9IG1vZGVsLmZpbmQodG9FbC5pZCksXHJcbiAgICAgICAgICAgIGlzRGlzYWJsZSA9IG1vZGVsLmlzRGlzYWJsZSh0b05vZGUsIG5vZGUpO1xyXG5cclxuICAgICAgICBpZiAobW9kZWwuZmluZCh0b0VsLmlkKSAmJiB0b0VsLmlkICE9PSB0YXJnZXQuaWQgJiYgIWlzRGlzYWJsZSkge1xyXG4gICAgICAgICAgICBtb2RlbC5tb3ZlKHRhcmdldC5pZCwgbm9kZSwgdG9FbC5pZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdmUpO1xyXG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLnVwKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaG93IHVwIGd1aWRlIGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwb3MgQSBlbGVtZW50IHBvc2l0aW9uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgQSBlbGVtZW50IHRleHQgdmFsdWVcclxuICAgICAqL1xyXG4gICAgZW5hYmxlSGVscGVyOiBmdW5jdGlvbihwb3MsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmhlbHBlckVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgdGhpcy5yb290LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5oZWxwZXJFbGVtZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZ3VpZGUgZWxtZWVudCBsb2NhdGlvblxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBvcyBBIHBvc2l0aW9uIHRvIG1vdmVcclxuICAgICAqL1xyXG4gICAgc2V0SGVscGVyTG9jYXRpb246IGZ1bmN0aW9uKHBvcykge1xyXG5cclxuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUubGVmdCA9IHBvcy54ICsgdGhpcy5oZWxwZXJQb3MueCArICdweCc7XHJcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLnRvcCA9IHBvcy55ICsgdGhpcy5oZWxwZXJQb3MueSArICdweCc7XHJcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIaWRlIGd1aWRlIGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgZGlzYWJsZUhlbHBlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGVscGVyRWxlbWVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWFrZSBodG1sIFxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgQSBkcmF3IGRhdGFcclxuICAgICAqIEBwYXJhbSB7UGF0aH0gYmVmb3JlUGF0aCBBIHBhdGggb2Ygc3VidHJlZVxyXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBodG1sXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfZ2V0SHRtbDogZnVuY3Rpb24oa2V5cykge1xyXG5cclxuICAgICAgICB2YXIgbW9kZWwgPSB0aGlzLm1vZGVsLFxyXG4gICAgICAgICAgICBodG1sLFxyXG4gICAgICAgICAgICBjaGlsZEVsID0gW10sXHJcbiAgICAgICAgICAgIG5vZGUsXHJcbiAgICAgICAgICAgIHRtcGwsXHJcbiAgICAgICAgICAgIGRlcHRoLFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgbGFiZWwsXHJcbiAgICAgICAgICAgIHJhdGUsXHJcbiAgICAgICAgICAgIG1hcDtcclxuXHJcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChrZXlzLCBmdW5jdGlvbihlbCkge1xyXG4gICAgICAgICAgICBub2RlID0gbW9kZWwuZmluZChlbCk7XHJcbiAgICAgICAgICAgIGRlcHRoID0gbm9kZS5kZXB0aDtcclxuICAgICAgICAgICAgc3RhdGUgPSB0aGlzW25vZGUuc3RhdGUgKyAnU2V0J11bMF07XHJcbiAgICAgICAgICAgIGxhYmVsID0gdGhpc1tub2RlLnN0YXRlICsgJ1NldCddWzFdO1xyXG4gICAgICAgICAgICByYXRlID0gdGhpcy5kZXB0aExhYmVsc1tkZXB0aCAtIDFdIHx8ICcnO1xyXG4gICAgICAgICAgICBtYXAgPSB7XHJcbiAgICAgICAgICAgICAgICBTdGF0ZTogc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBTdGF0ZUxhYmVsOiBsYWJlbCxcclxuICAgICAgICAgICAgICAgIE5vZGVJRDogbm9kZS5pZCxcclxuICAgICAgICAgICAgICAgIERlcHRoOiBkZXB0aCxcclxuICAgICAgICAgICAgICAgIFRpdGxlOiBub2RlLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgVmFsdWVDbGFzczogdGhpcy52YWx1ZUNsYXNzLFxyXG4gICAgICAgICAgICAgICAgU3ViVHJlZTogdGhpcy5zdWJ0cmVlQ2xhc3MsXHJcbiAgICAgICAgICAgICAgICBEaXNwbGF5OiAobm9kZS5zdGF0ZSA9PT0gJ29wZW4nKSA/ICcnIDogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgRGVwdGhMYWJlbDogcmF0ZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKHR1aS51dGlsLmlzTm90RW1wdHkobm9kZS5jaGlsZEtleXMpKSB7XHJcbiAgICAgICAgICAgICAgICB0bXBsID0gdGhpcy50ZW1wbGF0ZS5FREdFX05PREU7XHJcbiAgICAgICAgICAgICAgICBtYXAuQ2hpbGRyZW4gPSB0aGlzLl9nZXRIdG1sKG5vZGUuY2hpbGRLZXlzKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRtcGwgPSB0aGlzLnRlbXBsYXRlLkxFQVBfTk9ERTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWwgPSB0bXBsLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBmdW5jdGlvbihtYXRjaGVkU3RyaW5nLCBuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwW25hbWVdIHx8ICcnO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGNoaWxkRWwucHVzaChlbCk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIGh0bWwgPSBjaGlsZEVsLmpvaW4oJycpO1xyXG5cclxuICAgICAgICByZXR1cm4gaHRtbDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgdmlldy5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhY3RcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRcclxuICAgICAqL1xyXG4gICAgbm90aWZ5OiBmdW5jdGlvbihhY3QsIHRhcmdldCkge1xyXG4gICAgICAgIHRoaXMuYWN0aW9uKGFjdCwgdGFyZ2V0KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBY3Rpb24gXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBBIHR5cGUgb2YgYWN0aW9uIFxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHRhcmdldCBBIHRhcmdldFxyXG4gICAgICovXHJcbiAgICBhY3Rpb246IGZ1bmN0aW9uKHR5cGUsIHRhcmdldCkge1xyXG4gICAgICAgIHRoaXMuX2FjdGlvbk1hcCA9IHRoaXMuX2FjdGlvbk1hcCB8fCB7XHJcbiAgICAgICAgICAgIHJlZnJlc2g6IHRoaXMuX3JlZnJlc2gsXHJcbiAgICAgICAgICAgIHJlbmFtZTogdGhpcy5fcmVuYW1lLFxyXG4gICAgICAgICAgICB0b2dnbGU6IHRoaXMuX3RvZ2dsZU5vZGUsXHJcbiAgICAgICAgICAgIHNlbGVjdDogdGhpcy5fc2VsZWN0LFxyXG4gICAgICAgICAgICB1bnNlbGVjdDogdGhpcy5fdW5TZWxlY3QsXHJcbiAgICAgICAgICAgIGNvbnZlcnQ6IHRoaXMuX2NvbnZlcnQsXHJcbiAgICAgICAgICAgIHJlc3RvcmU6IHRoaXMuX3Jlc3RvcmVcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX2FjdGlvbk1hcFt0eXBlIHx8ICdyZWZyZXNoJ10uY2FsbCh0aGlzLCB0YXJnZXQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENoYW5nZSBub2RlIHN0YXRlXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbm9kZSBBIGluZm9ybXRpb24gdG8gbm9kZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2NoYW5nZU5vZGVTdGF0ZTogZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZS5pZCk7XHJcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUsXHJcbiAgICAgICAgICAgIGNscyA9IHBhcmVudC5jbGFzc05hbWU7XHJcblxyXG4gICAgICAgIGlmICh0dWkudXRpbC5pc0VtcHR5KG5vZGUuY2hpbGRLZXlzKSkge1xyXG4gICAgICAgICAgICBjbHMgPSAnbGVhcF9ub2RlICcgKyB0aGlzW25vZGUuc3RhdGUgKyAnU2V0J11bMF07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2xzID0gJ2VkZ2Vfbm9kZSAnICsgdGhpc1tub2RlLnN0YXRlICsgJ1NldCddWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyZW50LmNsYXNzTmFtZSA9IGNscztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2Ugc3RhdGUgdG8gZWRpdCBcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2NvbnZlcnQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgICB2YXIgaWQgPSBlbGVtZW50LmlkLFxyXG4gICAgICAgICAgICBub2RlID0gdGhpcy5tb2RlbC5maW5kKGlkKSxcclxuICAgICAgICAgICAgbGFiZWwgPSBub2RlLnZhbHVlLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICB0aGlzLmlucHV0RWxlbWVudC52YWx1ZSA9IGxhYmVsO1xyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IGVsZW1lbnQ7XHJcbiAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLmlucHV0RWxlbWVudCwgZWxlbWVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuaW5wdXRFbGVtZW50LmZvY3VzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXBwbHkgbm9kZSBuYW1lXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9yZXN0b3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaW5wdXRFbGVtZW50LnZhbHVlID0gJyc7XHJcblxyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLmlucHV0RWxlbWVudCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRHJhdyBlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaHRtbCBBIGh0bWwgbWFkZSBieSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyZW50IEEgcGFyZW50IGVsZW1lbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICBfZHJhdzogZnVuY3Rpb24oaHRtbCwgcGFyZW50KSB7XHJcbiAgICAgICAgdmFyIHJvb3QgPSBwYXJlbnQgfHwgdGhpcy5yb290O1xyXG4gICAgICAgIHJvb3QuaW5uZXJIVE1MID0gaHRtbDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbGFiZWwgYnkgZGVwdGhcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRlcHRoTGFiZWxzIEEgZGVwdGggbGFiZWwgYXJyYXlcclxuICAgICAqL1xyXG4gICAgc2V0RGVwdGhMYWJlbHM6IGZ1bmN0aW9uKGRlcHRoTGFiZWxzKSB7XHJcbiAgICAgICAgdGhpcy5kZXB0aExhYmVscyA9IGRlcHRoTGFiZWxzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZnJlc2ggbm9kZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqKi9cclxuICAgIF9yZWZyZXNoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZGF0YSA9IHRoaXMubW9kZWwudHJlZUhhc2gucm9vdC5jaGlsZEtleXM7XHJcbiAgICAgICAgdGhpcy5fZHJhdyh0aGlzLl9nZXRIdG1sKGRhdGEpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5hbWUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5vZGUgQSBtb2RlbCBpbmZvcm1hdGlvbiBcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9yZW5hbWU6IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGUuaWQpO1xyXG4gICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gbm9kZS52YWx1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAqIFRvZ2dsZSBtb2RlbFxyXG4gICAgKiBAcGFyYW0ge09iamVjdH0gbm9kZSBBIG5vZGUgaW5mb3JtYXRpb25cclxuICAgICogQHByaXZhdGVcclxuICAgICoqL1xyXG4gICAgX3RvZ2dsZU5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHJcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmlkKSxcclxuICAgICAgICAgICAgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlLFxyXG4gICAgICAgICAgICBjaGlsZFdyYXAgPSBwYXJlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3VsJylbMF0sXHJcbiAgICAgICAgICAgIGJ1dHRvbiA9IHBhcmVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYnV0dG9uJylbMF0sXHJcbiAgICAgICAgICAgIHN0YXRlID0gdGhpc1tub2RlLnN0YXRlICsgJ1NldCddWzBdLFxyXG4gICAgICAgICAgICBsYWJlbCA9IHRoaXNbbm9kZS5zdGF0ZSArICdTZXQnXVsxXSxcclxuICAgICAgICAgICAgaXNPcGVuID0gbm9kZS5zdGF0ZSA9PT0gJ29wZW4nO1xyXG5cclxuICAgICAgICBwYXJlbnQuY2xhc3NOYW1lID0gcGFyZW50LmNsYXNzTmFtZS5yZXBsYWNlKHRoaXMub3BlblNldFswXSwgJycpLnJlcGxhY2UodGhpcy5jbG9zZVNldFswXSwgJycpICsgc3RhdGU7XHJcbiAgICAgICAgY2hpbGRXcmFwLnN0eWxlLmRpc3BsYXkgPSBpc09wZW4gPyAnJyA6ICdub25lJztcclxuICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gbGFiZWw7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2VsZWN0IG5vZGVcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBub2RlIEEgdGFyZ2V0IG5vZGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9zZWxlY3Q6IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgdmFsdWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGUuaWQpO1xyXG5cclxuICAgICAgICBpZiAodHVpLnV0aWwuaXNFeGlzdHkodmFsdWVFbCkpIHtcclxuICAgICAgICAgICAgdmFsdWVFbC5jbGFzc05hbWUgPSB2YWx1ZUVsLmNsYXNzTmFtZS5yZXBsYWNlKCcgJyArIHRoaXMub25zZWxlY3RDbGFzcywgJycpICsgJyAnICsgdGhpcy5vbnNlbGVjdENsYXNzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbnNlbGVjdCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbm9kZSBBIHRhcmdldCBub2RlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICoqL1xyXG4gICAgX3VuU2VsZWN0OiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmlkKTtcclxuXHJcbiAgICAgICAgaWYgKHR1aS51dGlsLmlzRXhpc3R5KHZhbHVlRWwpICYmIHV0aWwuaGFzQ2xhc3ModmFsdWVFbCwgdGhpcy5vbnNlbGVjdENsYXNzKSkge1xyXG4gICAgICAgICAgICB2YWx1ZUVsLmNsYXNzTmFtZSA9IHZhbHVlRWwuY2xhc3NOYW1lLnJlcGxhY2UoJyAnICsgdGhpcy5vbnNlbGVjdENsYXNzLCAnJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlb3ZlcnZpZXcgVXBkYXRlIHZpZXcgYW5kIGNvbnRyb2wgdHJlZSBkYXRhXHJcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cclxuICovXHJcblxyXG4vKipcclxuICogQGNvbnN0cnVjdG9yIFRyZWVNb2RlbFxyXG4gKiAqKi9cclxudmFyIFRyZWVNb2RlbCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZU1vZGVsLnByb3RvdHlwZSAqL3tcclxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHRyZWUpIHtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjb3VudCBmb3Igbm9kZSBpZGVudGl0eSBudW1iZXJcclxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIHZpZXcgdGhhdCBvYnNlcnZlIG1vZGVsIGNoYW5nZVxyXG4gICAgICAgICAqIEB0eXBlIHt0dWkuY29tcG9uZW50LlRyZWV9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCBzdGF0ZSBvZiBub2RlXHJcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm5vZGVEZWZhdWx0U3RhdGUgPSBvcHRpb25zLmRlZmF1bHRTdGF0ZSB8fCAnY2xvc2UnO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGJ1ZmZlciBcclxuICAgICAgICAgKiBAdHlwZSB7bnVsbH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgZGVwdGhcclxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZGVwdGggPSAwO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIG1pbGlzZWNvbiB0aW1lIHRvIG1ha2Ugbm9kZSBJRFxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kYXRlID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRyZWUgaGFzaFxyXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50cmVlSGFzaCA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLnRyZWVIYXNoWydyb290J10gPSB0aGlzLm1ha2VOb2RlKDAsICdyb290JywgJ3Jvb3QnKTtcclxuICAgICAgICB0aGlzLmNvbm5lY3QodHJlZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IG1vZGVsIHdpdGggdHJlZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge2FycmF5fSBkYXRhICBBIHRyZWUgZGF0YVxyXG4gICAgICovXHJcbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgdGhpcy50cmVlSGFzaC5yb290LmNoaWxkS2V5cyA9IHRoaXMuX21ha2VUcmVlSGFzaChkYXRhKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2UgaGllcmFyY2h5IGRhdGEgdG8gaGFzaCBsaXN0LlxyXG4gICAgICogQHBhcmFtIHthcnJheX0gZGF0YSBBIHRyZWUgZGF0YSBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCBBIHBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfbWFrZVRyZWVIYXNoOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCkge1xyXG5cclxuICAgICAgICB2YXIgY2hpbGRLZXlzID0gW10sXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICB0aGlzLmRlcHRoID0gdGhpcy5kZXB0aCArIDE7XHJcblxyXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goZGF0YSwgZnVuY3Rpb24oZWxlbWVudCkge1xyXG5cclxuICAgICAgICAgICAgaWQgPSB0aGlzLl9nZXRJZCgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy50cmVlSGFzaFtpZF0gPSB0aGlzLm1ha2VOb2RlKHRoaXMuZGVwdGgsIGlkLCBlbGVtZW50LnZhbHVlLCBwYXJlbnRJZCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5jaGlsZHJlbiAmJiB0dWkudXRpbC5pc05vdEVtcHR5KGVsZW1lbnQuY2hpbGRyZW4pKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWVIYXNoW2lkXS5jaGlsZEtleXMgPSB0aGlzLl9tYWtlVHJlZUhhc2goZWxlbWVudC5jaGlsZHJlbiwgaWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjaGlsZEtleXMucHVzaChpZCk7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMuZGVwdGggPSB0aGlzLmRlcHRoIC0gMTtcclxuXHJcbiAgICAgICAgY2hpbGRLZXlzLnNvcnQodHVpLnV0aWwuYmluZCh0aGlzLnNvcnQsIHRoaXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGNoaWxkS2V5cztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRlcHRoIEEgZGVwdGggb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIEEgbm9kZSBJRFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIEEgdmFsdWUgb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIEEgcGFyZW50IG5vZGUgSURcclxuICAgICAqIEByZXR1cm4ge3t2YWx1ZTogKiwgcGFyZW50SWQ6ICgqfHN0cmluZyksIGlkOiAqfX1cclxuICAgICAqL1xyXG4gICAgbWFrZU5vZGU6IGZ1bmN0aW9uKGRlcHRoLCBpZCwgdmFsdWUsIHBhcmVudElkKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZGVwdGg6IGRlcHRoLFxyXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgICAgICAgIHBhcmVudElkOiAoZGVwdGggPT09IDApID8gbnVsbCA6IChwYXJlbnRJZCB8fCAncm9vdCcpLFxyXG4gICAgICAgICAgICBzdGF0ZTogdGhpcy5ub2RlRGVmYXVsdFN0YXRlLFxyXG4gICAgICAgICAgICBpZDogaWRcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgYW5kIHJldHVybiBub2RlIElEXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICogQHJldHVybiB7U3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBfZ2V0SWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuY291bnQgPSB0aGlzLmNvdW50ICsgMTtcclxuICAgICAgICByZXR1cm4gJ25vZGVfJyArIHRoaXMuZGF0ZSArICdfJyArIHRoaXMuY291bnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmluZCBub2RlIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSB0byBmaW5kIG5vZGVcclxuICAgICAqIEByZXR1cm4ge29iamVjdHx1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIGZpbmQ6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRyZWVIYXNoW2tleV07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIG5vZGUgYW5kIGNoaWxkIG5vZGVzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IHRvIHJlbW92ZVxyXG4gICAgICovXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIHZhciByZXMgPSB0aGlzLmludm9rZSgncmVtb3ZlJywgeyBpZDoga2V5IH0pO1xyXG5cclxuICAgICAgICBpZiAoIXJlcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnJlbW92ZUtleShrZXkpO1xyXG4gICAgICAgIHRoaXMudHJlZUhhc2hba2V5XSA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMubm90aWZ5KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIG5vZGUga2V5XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IHRvIHJlbW92ZVxyXG4gICAgICovXHJcbiAgICByZW1vdmVLZXk6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5maW5kKGtleSk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5maW5kKG5vZGUucGFyZW50SWQpO1xyXG5cclxuICAgICAgICBwYXJlbnQuY2hpbGRLZXlzID0gdHVpLnV0aWwuZmlsdGVyKHBhcmVudC5jaGlsZEtleXMsIGZ1bmN0aW9uKGNoaWxkS2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGlsZEtleSAhPT0ga2V5O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNb3ZlIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgdG8gbW92ZSBub2RlXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZSBBIG5vZGUgb2JqZWN0IHRvIG1vdmVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRJZCBBIHRhcmdldCBJRCB0byBpbnNlcnRcclxuICAgICAqL1xyXG4gICAgbW92ZTogZnVuY3Rpb24oa2V5LCBub2RlLCB0YXJnZXRJZCkge1xyXG5cclxuICAgICAgICB0aGlzLnJlbW92ZUtleShrZXkpO1xyXG4gICAgICAgIHRoaXMudHJlZUhhc2hba2V5XSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5pbnNlcnQobm9kZSwgdGFyZ2V0SWQpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnNlcnQgbm9kZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5vZGUgQSBub2RlIG9iamVjdCB0byBpbnNlcnRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbdGFyZ2V0SWRdIEEgdGFyZ2V0IElEIHRvIGluc2VydFxyXG4gICAgICovXHJcbiAgICBpbnNlcnQ6IGZ1bmN0aW9uKG5vZGUsIHRhcmdldElkKSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMuZmluZCh0YXJnZXRJZCB8fCAncm9vdCcpO1xyXG5cclxuICAgICAgICBpZiAoIXRhcmdldC5jaGlsZEtleXMpIHtcclxuICAgICAgICAgICAgdGFyZ2V0LmNoaWxkS2V5cyA9IFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGFyZ2V0LmNoaWxkS2V5cy5wdXNoKG5vZGUuaWQpO1xyXG4gICAgICAgIG5vZGUuZGVwdGggPSB0YXJnZXQuZGVwdGggKyAxO1xyXG4gICAgICAgIG5vZGUucGFyZW50SWQgPSB0YXJnZXRJZDtcclxuICAgICAgICB0YXJnZXQuY2hpbGRLZXlzLnNvcnQodHVpLnV0aWwuYmluZCh0aGlzLnNvcnQsIHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy50cmVlSGFzaFtub2RlLmlkXSA9IG5vZGU7XHJcblxyXG4gICAgICAgIHRoaXMubm90aWZ5KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQSBub3RpZnkgdHJlZVxyXG4gICAgICovXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uKHR5cGUsIHRhcmdldCkge1xyXG4gICAgICAgIGlmICh0aGlzLnRyZWUpIHtcclxuICAgICAgICAgICAgdGhpcy50cmVlLm5vdGlmeSh0eXBlLCB0YXJnZXQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25uZWN0IHZpZXcgYW5kIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0ge1RyZWV9IHRyZWVcclxuICAgICAqL1xyXG4gICAgY29ubmVjdDogZnVuY3Rpb24odHJlZSkge1xyXG4gICAgICAgIGlmICghdHJlZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudHJlZSA9IHRyZWU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuYW1lIG5vZGVcclxuICAgICAqIEBwYXJhbSB7c3Rpcm5nfSBrZXkgQSBrZXkgdG8gcmVuYW1lXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgQSB2YWx1ZSB0byBjaGFuZ2VcclxuICAgICAqL1xyXG4gICAgcmVuYW1lOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIHJlcyA9IHRoaXMuaW52b2tlKCdyZW5hbWUnLCB7aWQ6IGtleSwgdmFsdWU6IHZhbHVlfSk7XHJcbiAgICAgICAgaWYgKCFyZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmQoa2V5KTtcclxuICAgICAgICBub2RlLnZhbHVlID0gdmFsdWU7XHJcblxyXG4gICAgICAgIHRoaXMubm90aWZ5KCdyZW5hbWUnLCBub2RlKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2Ugbm9kZSBzdGF0ZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHZhbHVlIHRvIGNoYW5nZVxyXG4gICAgICovXHJcbiAgICBjaGFuZ2VTdGF0ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmQoa2V5KTtcclxuICAgICAgICBub2RlLnN0YXRlID0gKG5vZGUuc3RhdGUgPT09ICdvcGVuJykgPyAnY2xvc2UnIDogJ29wZW4nO1xyXG4gICAgICAgIHRoaXMubm90aWZ5KCd0b2dnbGUnLCBub2RlKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFNldCBidWZmZXIgdG8gc2F2ZSBzZWxlY3RlZCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IFRoZSBrZXkgb2Ygc2VsZWN0ZWQgbm9kZVxyXG4gICAgICoqL1xyXG4gICAgc2V0QnVmZmVyOiBmdW5jdGlvbihrZXkpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jbGVhckJ1ZmZlcigpO1xyXG5cclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZmluZChrZXkpO1xyXG5cclxuICAgICAgICB0aGlzLm5vdGlmeSgnc2VsZWN0Jywgbm9kZSk7XHJcbiAgICAgICAgdGhpcy5maXJlKCdzZWxlY3QnLCB7aWQ6IGtleSwgdmFsdWU6IG5vZGUudmFsdWUgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gbm9kZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbXB0eSBidWZmZXJcclxuICAgICAqL1xyXG4gICAgY2xlYXJCdWZmZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuYnVmZmVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubm90aWZ5KCd1bnNlbGVjdCcsIHRoaXMuYnVmZmVyKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIG1vdmFibGUgcG9zaXRvblxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRlc3QgQSBkZXN0aW5hdGlvbiBub2RlXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZSBBIHRhcmdldCBub2RlXHJcbiAgICAgKi9cclxuICAgIGlzRGlzYWJsZTogZnVuY3Rpb24oZGVzdCwgbm9kZSkge1xyXG4gICAgICAgIGlmIChkZXN0LmRlcHRoID09PSBub2RlLmRlcHRoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlc3QucGFyZW50SWQpIHtcclxuICAgICAgICAgICAgaWYgKGRlc3QuaWQgPT09IG5vZGUucGFyZW50SWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChkZXN0LnBhcmVudElkID09PSBub2RlLmlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzRGlzYWJsZSh0aGlzLmZpbmQoZGVzdC5wYXJlbnRJZCksIG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNvcnQgYnkgdGl0bGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwaWRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuaWRcclxuICAgICAqIEByZXR1cm4ge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgc29ydDogZnVuY3Rpb24ocGlkLCBuaWQpIHtcclxuICAgICAgICB2YXIgcCA9IHRoaXMuZmluZChwaWQpLFxyXG4gICAgICAgICAgICBuID0gdGhpcy5maW5kKG5pZCk7XHJcblxyXG4gICAgICAgIGlmICghcCB8fCAhbikge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwLnZhbHVlIDwgbi52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfSBlbHNlIGlmIChwLnZhbHVlID4gbi52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVHJlZU1vZGVsKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZU1vZGVsO1xyXG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogQG5hbWVzcGFjZSB1dGlsXG4gKi9cbnZhciB1dGlsID0ge1xuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB0byBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50IFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhZGRcbiAgICAgKi9cbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgZnJvbSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmRldGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9IFxuICAgICAqL1xuICAgIGdldFRhcmdldDogZnVuY3Rpb24oZSkge1xuICAgICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBlbGVtZW50IGhhcyBzcGVjaWZpYyBjbGFzcyBvciBub3RcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzcyB0byBmaW5kXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBoYXNDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmICghZWxlbWVudCB8fCAhY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJyN1dGlsLmhhc0NsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkg7JeY66as66i87Yq46rCAIOyeheugpeuQmOyngCDslYrslZjsirXri4jri6QuIFxcbl9fZWxlbWVudCcgKyBlbGVtZW50ICsgJyxfX2NsYXNzTmFtZScgKyBjbGFzc05hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNscyA9IGVsZW1lbnQuY2xhc3NOYW1lO1xuXG4gICAgICAgIGlmIChjbHMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgZWxlbWVudCBieSBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzc1xuICAgICAqIEByZXR1cm4ge2FycmF5fVxuICAgICAqL1xuICAgIGdldEVsZW1lbnRzQnlDbGFzczogZnVuY3Rpb24odGFyZ2V0LCBjbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYWxsID0gdGFyZ2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJyksXG4gICAgICAgICAgICBmaWx0ZXIgPSBbXTtcblxuICAgICAgICBhbGwgPSB0dWkudXRpbC50b0FycmF5KGFsbCk7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChhbGwsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICB2YXIgY2xzID0gZWwuY2xhc3NOYW1lIHx8ICcnO1xuICAgICAgICAgICAgaWYgKGNscy5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyLnB1c2goZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB3aGV0aGVyIHRoZSBjbGljayBldmVudCBieSByaWdodCBidXR0b24gb3Igbm90XG4gICAgICogQHBhcmFtIHtldmVudH0gZSBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBcbiAgICAgKi9cbiAgICBpc1JpZ2h0QnV0dG9uOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBpc1JpZ2h0ID0gdXRpbC5fZ2V0QnV0dG9uKGUpID09PSAyO1xuICAgICAgICByZXR1cm4gaXNSaWdodDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgcHJvcGVydHkgZXhpc3Qgb3Igbm90XG4gICAgICogQHBhcmFtIHthcnJheX0gcHJvcHMgQSBwcm9wZXJ0eSBcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgICAqL1xuICAgIHRlc3RQcm9wOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUsXG4gICAgICAgICAgICBpID0gMDtcblxuICAgICAgICBmb3IgKDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocHJvcHNbaV0gaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IGRlZmF1bHQgZXZlbnQgXG4gICAgICogQHBhcmFtIHtldmVudH0gZSBFdmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6YXRpb24gZm9yIGV2ZW50IGJ1dHRvbiBwcm9wZXJ0eSBcbiAgICAgKiAwOiBGaXJzdCBtb3VzZSBidXR0b24sIDI6IFNlY29uZCBtb3VzZSBidXR0b24sIDE6IENlbnRlciBidXR0b25cbiAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9IFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEJ1dHRvbjogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgYnV0dG9uLFxuICAgICAgICAgICAgcHJpbWFyeSA9ICcwLDEsMyw1LDcnLFxuICAgICAgICAgICAgc2Vjb25kYXJ5ID0gJzIsNicsXG4gICAgICAgICAgICB3aGVlbCA9ICc0JztcblxuICAgICAgICBpZiAoZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uaGFzRmVhdHVyZSgnTW91c2VFdmVudHMnLCAnMi4wJykpIHtcbiAgICAgICAgICAgIHJldHVybiBlLmJ1dHRvbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ1dHRvbiA9IGUuYnV0dG9uICsgJyc7XG4gICAgICAgICAgICBpZiAocHJpbWFyeS5pbmRleE9mKGJ1dHRvbikgPiAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzZWNvbmRhcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAod2hlZWwuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiJdfQ==
