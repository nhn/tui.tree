(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
ne.util.defineNamespace('ne.component.Tree', require('./src/js/tree'));

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

 var tree1 = new ne.component.Tree('id', data ,{
        modelOption: {
            defaultState: 'open'
        }
    });
});
 **/

var Tree = ne.util.defineClass(/** @lends Tree.prototype */{

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

        util.addEventListener(this.root, 'click', ne.util.bind(this._onClick, this));
        util.addEventListener(this.inputElement, 'blur', ne.util.bind(this._onBlurInput, this));
        util.addEventListener(this.inputElement, 'keyup', ne.util.bind(this._onKeyup, this));

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
        util.addEventListener(this.root, 'mousedown', ne.util.bind(this._onMouseDown, this));
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
            this.clickTimer = setTimeout(ne.util.bind(function() {
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

        this.move = ne.util.bind(this._onMouseMove, this);
        this.up = ne.util.bind(this._onMouseUp, this, target);

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

        ne.util.forEach(keys, function(el) {
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

            if (ne.util.isNotEmpty(node.childKeys)) {
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

        if (ne.util.isEmpty(node.childKeys)) {
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

        if (ne.util.isExisty(valueEl)) {
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

        if (ne.util.isExisty(valueEl) && util.hasClass(valueEl, this.onselectClass)) {
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
var TreeModel = ne.util.defineClass(/** @lends TreeModel.prototype */{
    init: function(options, tree) {

        /**
         * A count for node identity number
         * @type {number}
         */
        this.count = 0;

        /**
         * A view that observe model change
         * @type {ne.component.Tree}
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

        ne.util.forEach(data, function(element) {

            id = this._getId();

            this.treeHash[id] = this.makeNode(this.depth, id, element.value, parentId);

            if (element.children && ne.util.isNotEmpty(element.children)) {
                this.treeHash[id].childKeys = this._makeTreeHash(element.children, id);
            }

            childKeys.push(id);
        }, this);

        this.depth = this.depth - 1;

        childKeys.sort(ne.util.bind(this.sort, this));

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

        parent.childKeys = ne.util.filter(parent.childKeys, function(childKey) {
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
        target.childKeys.sort(ne.util.bind(this.sort, this));

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
ne.util.CustomEvents.mixin(TreeModel);

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

        all = ne.util.toArray(all);

        ne.util.forEach(all, function(el) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9zdGF0aWNzLmpzIiwic3JjL2pzL3RyZWUuanMiLCJzcmMvanMvdHJlZW1vZGVsLmpzIiwic3JjL2pzL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJuZS51dGlsLmRlZmluZU5hbWVzcGFjZSgnbmUuY29tcG9uZW50LlRyZWUnLCByZXF1aXJlKCcuL3NyYy9qcy90cmVlJykpO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgZGVmYXVsdCB2YWx1ZXMgZm9yIHRyZWVcbiAqL1xuXG52YXIgU1RBVEUgPSB7XG4gICAgTk9STUFMOiAwLFxuICAgIEVESVRBQkxFOiAxXG59O1xuXG52YXIgREVGQVVMVCA9IHtcbiAgICBPUEVOOiBbJ29wZW4nLCAnLSddLFxuICAgIENMT1NFOiBbJ2Nsb3NlJywgJysnXSxcbiAgICBTRUxFQ1RfQ0xBU1M6ICdzZWxlY3RlZCcsXG4gICAgU1VCVFJFRV9DTEFTUzogJ1N1YnRyZWUnLFxuICAgIFZBTFVFX0NMQVNTOiAndmFsdWVDbGFzcycsXG4gICAgRURJVEFCTEVfQ0xBU1M6ICdlZGl0YWJsZUNsYXNzJyxcbiAgICBURU1QTEFURToge1xuICAgICAgICBFREdFX05PREU6ICc8bGkgY2xhc3M9XCJlZGdlX25vZGUge3tTdGF0ZX19XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIj57e1N0YXRlTGFiZWx9fTwvYnV0dG9uPicgK1xuICAgICAgICAgICAgICAgICAgICAnPHNwYW4gaWQ9XCJ7e05vZGVJRH19XCIgY2xhc3M9XCJkZXB0aHt7RGVwdGh9fSB7e1ZhbHVlQ2xhc3N9fVwiPnt7VGl0bGV9fTwvc3Bhbj48ZW0+e3tEZXB0aExhYmVsfX08L2VtPicgK1xuICAgICAgICAgICAgICAgICAgICAnPHVsIGNsYXNzPVwie3tTdWJ0cmVlfX1cIiBzdHlsZT1cImRpc3BsYXk6e3tEaXNwbGF5fX1cIj57e0NoaWxkcmVufX08L3VsPicgK1xuICAgICAgICAgICAgICAgICc8L2xpPicsXG4gICAgICAgIExFQVBfTk9ERTogJzxsaSBjbGFzcz1cImxlYXBfbm9kZVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPHNwYW4gaWQ9XCJ7e05vZGVJRH19XCIgY2xhc3M9XCJkZXB0aHt7RGVwdGh9fSB7e1ZhbHVlQ2xhc3N9fVwiPnt7VGl0bGV9fTwvc3Bhbj48ZW0+e3tEZXB0aExhYmVsfX08L2VtPicgK1xuICAgICAgICAgICAgICAgICc8L2xpPidcbiAgICB9LFxuICAgIFVTRV9EUkFHOiBmYWxzZSxcbiAgICBVU0VfSEVMUEVSOiBmYWxzZSxcbiAgICBIRUxQRVJfUE9TIDoge1xuICAgICAgICB4OiAxMCxcbiAgICAgICAgeTogMTBcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBTVEFURTogU1RBVEUsXG4gICAgREVGQVVMVDogREVGQVVMVFxufTtcbiIsIi8qKlxyXG4gKiBAZmlsZW92ZXJ2aWV3IFJlbmRlciB0cmVlIGFuZCB1cGRhdGUgdHJlZS5cclxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxyXG4gKi9cclxuXHJcbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi9zdGF0aWNzJyk7XHJcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG52YXIgVHJlZU1vZGVsID0gcmVxdWlyZSgnLi90cmVlbW9kZWwnKTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgdHJlZSBtb2RlbCBhbmQgaW5qZWN0IGRhdGEgdG8gbW9kZWxcclxuICogQGNvbnN0cnVjdG9yIFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgQSBpZCBmb3IgdHJlZSByb290IGVsZW1lbnRcclxuICogICAgICBAcGFyYW0ge09iamVjdH0gZGF0YSBBIGRhdGEgdG8gYmUgdXNlZCBvbiB0cmVlXHJcbiAqICAgICAgQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnNcclxuICogICAgICAgICAgQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMubW9kZWxPcHRpb24gQSBpbm5lciBvcHRpb24gZm9yIG1vZGVsXHJcbiAqICAgICAgICAgIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy50ZW1wbGF0ZV0gQSBtYXJrdXAgc2V0IHRvIG1ha2UgZWxlbWVudFxyXG4gKiAgICAgICAgICBAcGFyYW0ge0FycmF5fSBbb3B0aW9ucy5vcGVuU2V0XSBBIGNsYXNzIG5hbWUgYW5kIGJ1dHRvbiBsYWJlbCB0byBvcGVuIHN0YXRlXHJcbiAqICAgICAgICAgIEBwYXJhbSB7QXJyYXl9IFtvcHRpb25zLmNsb3NlU2V0XSBBIGNsYXNzIG5hbWUgYW5kIGJ1dHRvbiBsYWJlbCB0byBjbG9zZSBzdGF0ZVxyXG4gKiAgICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2VsZWN0Q2xhc3NdIEEgY2xhc3MgbmFtZSB0byBzZWxlY3RlZCBub2RlXHJcbiAqICAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy52YWx1ZUNsYXNzXSBBIGNsYXNzIG5hbWUgdGhhdCBmb3Igc2VsZWN0ZWQgem9uZVxyXG4gKiAgICAgICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaW5wdXRDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBpbnB1dCBlbGVtZW50XHJcbiAqICAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdWJ0cmVlQ2xhc3NdIEEgY2xhc3MgbmFtZSBmb3Igc3ViIHRyZWVcclxuICogICAgICAgICAgQHBhcmFtIHtBcnJheX0gW29wdGlvbnMuZGVwdGhMYWJlbHNdIEEgZGVmYXVsdCBsYWJlbCAgZWFjaCBkZXB0aCdzIG5vZGVzXHJcbiAqICAgICAgICAgIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5oZWxwZXJQb3NdIEEgcmVsYXRlZCBwb3NpdGlvbiBmb3IgaGVscGVyIG9iamVjdFxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgZGF0YSA9IFtcclxuIHt0aXRsZTogJ3Jvb3RBJywgY2hpbGRyZW46XHJcbiAgICAgICAgIFtcclxuICAgICAgICAgICAgIHt0aXRsZTogJ3Jvb3QtMUEnfSwge3RpdGxlOiAncm9vdC0xQid9LHt0aXRsZTogJ3Jvb3QtMUMnfSwge3RpdGxlOiAncm9vdC0xRCd9LFxyXG4gICAgICAgICAgICAge3RpdGxlOiAncm9vdC0yQScsIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICAgICAgICAge3RpdGxlOidzdWJfMUEnLCBjaGlsZHJlbjpbe3RpdGxlOidzdWJfc3ViXzFBJ31dfSwge3RpdGxlOidzdWJfMkEnfVxyXG4gICAgICAgICAgICAgXX0sIHt0aXRsZTogJ3Jvb3QtMkInfSx7dGl0bGU6ICdyb290LTJDJ30sIHt0aXRsZTogJ3Jvb3QtMkQnfSxcclxuICAgICAgICAgICAgIHt0aXRsZTogJ3Jvb3QtM0EnLFxyXG4gICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgIHt0aXRsZTonc3ViM19hJ30sIHt0aXRsZTonc3ViM19iJ31cclxuICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICB9LCB7dGl0bGU6ICdyb290LTNCJ30se3RpdGxlOiAncm9vdC0zQyd9LCB7dGl0bGU6ICdyb290LTNEJ31cclxuICAgICAgICAgXVxyXG4gfSxcclxuIHt0aXRsZTogJ3Jvb3RCJywgY2hpbGRyZW46IFtcclxuICAgICB7dGl0bGU6J0Jfc3ViMSd9LCB7dGl0bGU6J0Jfc3ViMid9LCB7dGl0bGU6J2InfVxyXG4gXX1cclxuIF07XHJcblxyXG4gdmFyIHRyZWUxID0gbmV3IG5lLmNvbXBvbmVudC5UcmVlKCdpZCcsIGRhdGEgLHtcclxuICAgICAgICBtb2RlbE9wdGlvbjoge1xyXG4gICAgICAgICAgICBkZWZhdWx0U3RhdGU6ICdvcGVuJ1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuICoqL1xyXG5cclxudmFyIFRyZWUgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVHJlZS5wcm90b3R5cGUgKi97XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgQSBpZCBmb3Igcm9vdCBcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEEgaW5pdGlhbGl6ZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucyBcclxuICAgICAqL1xyXG4gICAgaW5pdDogZnVuY3Rpb24gKGlkLCBkYXRhLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgZGVmYXVsdCB0ZW1wbGF0ZVxyXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IG9wdGlvbnMudGVtcGxhdGUgfHwgc3RhdGljcy5ERUZBVUxULlRFTVBMQVRFO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIHJvb3QgZWxlbWVudFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJvb3QgPSBudWxsO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGNsYXNzIG5hbWUgYW5kIGxlYmVsIHRleHQgZm9yIG9wZW4gc3RhdGVcclxuICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5vcGVuU2V0ID0gb3B0aW9ucy5vcGVuU2V0IHx8IHN0YXRpY3MuREVGQVVMVC5PUEVOO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGNsYXNzIG5hbWUgYW5kIGxhYmVsIHRleHQgZm9yIGNsb3NlIHN0YXRlXHJcbiAgICAgICAgICogQHR5cGUge0FycmF5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY2xvc2VTZXQgPSBvcHRpb25zLmNsb3NlU2V0IHx8IHN0YXRpY3MuREVGQVVMVC5DTE9TRTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjbGFzcyBuYW1lIGZvciBzZWxlY3RlZCBub2RlIFxyXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5vbnNlbGVjdENsYXNzID0gb3B0aW9ucy5zZWxlY3RDbGFzcyB8fCBzdGF0aWNzLkRFRkFVTFQuU0VMRUNUX0NMQVNTO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGNsYXNzIG5hbWUgZm9yIGRvdWJsZSBjbGljayBhcmVhXHJcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnZhbHVlQ2xhc3MgPSBvcHRpb25zLnZhbHVlQ2xhc3MgfHwgc3RhdGljcy5ERUZBVUxULlZBTFVFX0NMQVNTO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGNsYXNzIG5hbWUgZm9yIGlucHV0IGVsZW1lbnRcclxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZWRpdENsYXNzID0gb3B0aW9ucy5pbnB1dENsYXNzIHx8IHN0YXRpY3MuREVGQVVMVC5FRElUQUJMRV9DTEFTUztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBsYWJlbCBmb3IgZWFjaCBkZXB0aFxyXG4gICAgICAgICAqIEB0eXBlIHtBcnJheX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmRlcHRoTGFiZWxzID0gb3B0aW9ucy5kZXB0aExhYmVscyB8fCBbXTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBzdGF0ZSBvZiB0cmVlXHJcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGljcy5TVEFURS5OT1JNQUw7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgY2xhc3MgbmFtZSBmb3Igc3VidHJlZVxyXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd8Kn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN1YnRyZWVDbGFzcyA9IG9wdGlvbnMuc3VidHJlZUNsYXNzIHx8IHN0YXRpY3MuREVGQVVMVC5TVUJUUkVFX0NMQVNTO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBXaGV0aGVyIGRyYWcgYW5kIGRyb3AgdXNlIG9yIG5vdFxyXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufCp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy51c2VEcmFnID0gb3B0aW9ucy51c2VEcmFnIHx8IHN0YXRpY3MuREVGQVVMVC5VU0VfRFJBRztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV2hldGhlciBoZWxwZXIgZWxlbWVudCB1c2Ugb3Igbm90XHJcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW58Kn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnVzZUhlbHBlciA9IHRoaXMudXNlRHJhZyAmJiAob3B0aW9ucy51c2VIZWxwZXIgfHwgc3RhdGljcy5ERUZBVUxULlVTRV9IRUxQRVIpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTZXQgcmVsYXRpdmUgcG9zaXRpb24gZm9yIGhlbHBlciBvYmplY3RcclxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuaGVscGVyUG9zID0gb3B0aW9ucy5oZWxwZXJQb3MgfHwgc3RhdGljcy5ERUZBVUxULkhFTFBFUl9QT1M7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIElucHV0IGVsZW1lbnQgXHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuaW5wdXRFbGVtZW50ID0gdGhpcy5nZXRFZGl0YWJsZUVsZW1lbnQoKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogTWFrZSB0cmVlIG1vZGVsXHJcbiAgICAgICAgICogQHR5cGUge1RyZWVNb2RlbH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFRyZWVNb2RlbChvcHRpb25zLm1vZGVsT3B0aW9uLCB0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbC5zZXREYXRhKGRhdGEpO1xyXG5cclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgdGhpcy5yb290ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5yb290KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2RyYXcodGhpcy5fZ2V0SHRtbCh0aGlzLm1vZGVsLnRyZWVIYXNoLnJvb3QuY2hpbGRLZXlzKSk7XHJcbiAgICAgICAgdGhpcy5zZXRFdmVudHMoKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFrZSBpbnB1dCBlbGVtZW50XHJcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cclxuICAgICAqL1xyXG4gICAgZ2V0RWRpdGFibGVFbGVtZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gICAgICAgIGlucHV0LmNsYXNzTmFtZSA9IHRoaXMuZWRpdENsYXNzO1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XHJcblxyXG4gICAgICAgIHJldHVybiBpbnB1dDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZXZlbnQgaGFuZGxlciBcclxuICAgICAqL1xyXG4gICAgc2V0RXZlbnRzOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdCwgJ2NsaWNrJywgbmUudXRpbC5iaW5kKHRoaXMuX29uQ2xpY2ssIHRoaXMpKTtcclxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbnB1dEVsZW1lbnQsICdibHVyJywgbmUudXRpbC5iaW5kKHRoaXMuX29uQmx1cklucHV0LCB0aGlzKSk7XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAna2V5dXAnLCBuZS51dGlsLmJpbmQodGhpcy5fb25LZXl1cCwgdGhpcykpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy51c2VEcmFnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2FkZERyYWdFdmVudCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZHJhZyBhbmQgZHJvcCBldmVudCBcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9hZGREcmFnRXZlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB1c2VyU2VsZWN0UHJvcGVydHkgPSB1dGlsLnRlc3RQcm9wKFsndXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ09Vc2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J10pO1xyXG4gICAgICAgIHZhciBpc1N1cHBvcnRTZWxlY3RTdGFydCA9ICdvbnNlbGVjdHN0YXJ0JyBpbiBkb2N1bWVudDtcclxuICAgICAgICBpZiAoaXNTdXBwb3J0U2VsZWN0U3RhcnQpIHtcclxuICAgICAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdCwgJ3NlbGVjdHN0YXJ0JywgdXRpbC5wcmV2ZW50RGVmYXVsdCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlO1xyXG4gICAgICAgICAgICBzdHlsZVt1c2VyU2VsZWN0UHJvcGVydHldID0gJ25vbmUnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5yb290LCAnbW91c2Vkb3duJywgbmUudXRpbC5iaW5kKHRoaXMuX29uTW91c2VEb3duLCB0aGlzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT24ga2V5IHVwIGV2ZW50IGhhbmRsZXJcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbktleXVwOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGUpO1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnJlbmFtZSh0aGlzLmN1cnJlbnQuaWQsIHRhcmdldC52YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU3RhdGUodGhpcy5jdXJyZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT24gaW5wdXQgYmx1ciBldmVudCBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge2V2ZW50fSBlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25CbHVySW5wdXQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PT0gU1RBVEUuTk9STUFMKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGUpO1xyXG4gICAgICAgIHRoaXMubW9kZWwucmVuYW1lKHRoaXMuY3VycmVudC5pZCwgdGFyZ2V0LnZhbHVlKTtcclxuICAgICAgICB0aGlzLmNoYW5nZVN0YXRlKHRoaXMuY3VycmVudCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT24gY2xpY2sgZXZlbnQgaGFuZGxlclxyXG4gICAgICogQHBhcmFtIHtldmVudH0gZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XHJcblxyXG4gICAgICAgIGlmICh1dGlsLmlzUmlnaHRCdXR0b24oZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF1dGlsLmhhc0NsYXNzKHRhcmdldCwgdGhpcy52YWx1ZUNsYXNzKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9vblNpbmdsZUNsaWNrKGUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jbGlja1RpbWVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX29uRG91YmxlQ2xpY2soZSk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5jbGlja1RpbWVyKTtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBzZXRUaW1lb3V0KG5lLnV0aWwuYmluZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX29uU2luZ2xlQ2xpY2soZSk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpLCA0MDApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoYW5kbGUgc2luZ2xlIGNsaWNrIGV2ZW50IFxyXG4gICAgICogQHBhcmFtIHtldmVudH0gZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uU2luZ2xlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGUpLFxyXG4gICAgICAgICAgICB0YWcgPSB0YXJnZXQudGFnTmFtZS50b1VwcGVyQ2FzZSgpLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgdmFsdWVFbCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzKHBhcmVudCwgdGhpcy52YWx1ZUNsYXNzKVswXTtcclxuXHJcbiAgICAgICAgaWYgKHRhZyA9PT0gJ0lOUFVUJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGFnID09PSAnQlVUVE9OJykge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmNoYW5nZVN0YXRlKHZhbHVlRWwuaWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwuc2V0QnVmZmVyKHZhbHVlRWwuaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2Ugc3RhdGUgKFNUQVRFLk5PUk1BTCB8IFNUQVRFLkVESVRBQkxFKVxyXG4gICAgICogQHBhcmFtIHtIVE1MZWxlbWVudH0gdGFyZ2V0IOyXmOumrOuovO2KuFxyXG4gICAgICovXHJcbiAgICBjaGFuZ2VTdGF0ZTogZnVuY3Rpb24odGFyZ2V0KSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlID09PSBTVEFURS5FRElUQUJMRSkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEUuTk9STUFMO1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbigncmVzdG9yZScsIHRhcmdldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFLkVESVRBQkxFO1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbignY29udmVydCcsIHRhcmdldCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoYW5kbGUgRG91YmxlIGNsaWNrIFxyXG4gICAgICogQHBhcmFtIHtldmVudH0gZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XHJcbiAgICAgICAgdGhpcy5jaGFuZ2VTdGF0ZSh0YXJnZXQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIGhhbmRsZSBtb3VzZSBkb3duXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25Nb3VzZURvd246IGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IFNUQVRFLkVESVRBQkxFIHx8IHV0aWwuaXNSaWdodEJ1dHRvbihlKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1dGlsLnByZXZlbnREZWZhdWx0KGUpO1xyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSksXHJcbiAgICAgICAgICAgIHRhZyA9IHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGlmICh0YWcgPT09ICdCVVRUT04nIHx8IHRhZyA9PT0gJ0lOUFVUJyB8fCAhdXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMudmFsdWVDbGFzcykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wb3MgPSB0aGlzLnJvb3QuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnVzZUhlbHBlcikge1xyXG4gICAgICAgICAgICB0aGlzLmVuYWJsZUhlbHBlcih7XHJcbiAgICAgICAgICAgICAgICB4OiBlLmNsaWVudFggLSB0aGlzLnBvcy5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgeTogZS5jbGllbnRZIC0gdGhpcy5wb3MudG9wXHJcbiAgICAgICAgICAgIH0sIHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubW92ZSA9IG5lLnV0aWwuYmluZCh0aGlzLl9vbk1vdXNlTW92ZSwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy51cCA9IG5lLnV0aWwuYmluZCh0aGlzLl9vbk1vdXNlVXAsIHRoaXMsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW92ZSk7XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2V1cCcsIHRoaXMudXApO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEhhbmRsZSBtb3VzZSBtb3ZlIFxyXG4gICAgICogQHBhcmFtIHtldmVudH0gbWVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbk1vdXNlTW92ZTogZnVuY3Rpb24obWUpIHtcclxuICAgICAgICBpZiAoIXRoaXMudXNlSGVscGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRIZWxwZXJMb2NhdGlvbih7XHJcbiAgICAgICAgICAgIHg6IG1lLmNsaWVudFggLSB0aGlzLnBvcy5sZWZ0LFxyXG4gICAgICAgICAgICB5OiBtZS5jbGllbnRZIC0gdGhpcy5wb3MudG9wXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGFuZGxlIG1vdXNlIHVwXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgQSB0YXJnZXQgXHJcbiAgICAgKiBAcGFyYW0ge2V2ZW50fSB1ZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uTW91c2VVcDogZnVuY3Rpb24odGFyZ2V0LCB1ZSkge1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZUhlbHBlcigpO1xyXG5cclxuICAgICAgICB2YXIgdG9FbCA9IHV0aWwuZ2V0VGFyZ2V0KHVlKSxcclxuICAgICAgICAgICAgbW9kZWwgPSB0aGlzLm1vZGVsLFxyXG4gICAgICAgICAgICBub2RlID0gbW9kZWwuZmluZCh0YXJnZXQuaWQpLFxyXG4gICAgICAgICAgICB0b05vZGUgPSBtb2RlbC5maW5kKHRvRWwuaWQpLFxyXG4gICAgICAgICAgICBpc0Rpc2FibGUgPSBtb2RlbC5pc0Rpc2FibGUodG9Ob2RlLCBub2RlKTtcclxuXHJcbiAgICAgICAgaWYgKG1vZGVsLmZpbmQodG9FbC5pZCkgJiYgdG9FbC5pZCAhPT0gdGFyZ2V0LmlkICYmICFpc0Rpc2FibGUpIHtcclxuICAgICAgICAgICAgbW9kZWwubW92ZSh0YXJnZXQuaWQsIG5vZGUsIHRvRWwuaWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXRpbC5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3ZlKTtcclxuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy51cCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvdyB1cCBndWlkZSBlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcG9zIEEgZWxlbWVudCBwb3NpdGlvblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIEEgZWxlbWVudCB0ZXh0IHZhbHVlXHJcbiAgICAgKi9cclxuICAgIGVuYWJsZUhlbHBlcjogZnVuY3Rpb24ocG9zLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICghdGhpcy5oZWxwZXJFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGVscGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuICAgICAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMuaGVscGVyRWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGd1aWRlIGVsbWVlbnQgbG9jYXRpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwb3MgQSBwb3NpdGlvbiB0byBtb3ZlXHJcbiAgICAgKi9cclxuICAgIHNldEhlbHBlckxvY2F0aW9uOiBmdW5jdGlvbihwb3MpIHtcclxuXHJcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmxlZnQgPSBwb3MueCArIHRoaXMuaGVscGVyUG9zLnggKyAncHgnO1xyXG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudC5zdHlsZS50b3AgPSBwb3MueSArIHRoaXMuaGVscGVyUG9zLnkgKyAncHgnO1xyXG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGlkZSBndWlkZSBlbGVtZW50XHJcbiAgICAgKi9cclxuICAgIGRpc2FibGVIZWxwZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmhlbHBlckVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIG1ha2UgaHRtbCBcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEEgZHJhdyBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge1BhdGh9IGJlZm9yZVBhdGggQSBwYXRoIG9mIHN1YnRyZWVcclxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gaHRtbFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2dldEh0bWw6IGZ1bmN0aW9uKGtleXMpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbCxcclxuICAgICAgICAgICAgaHRtbCxcclxuICAgICAgICAgICAgY2hpbGRFbCA9IFtdLFxyXG4gICAgICAgICAgICBub2RlLFxyXG4gICAgICAgICAgICB0bXBsLFxyXG4gICAgICAgICAgICBkZXB0aCxcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGxhYmVsLFxyXG4gICAgICAgICAgICByYXRlLFxyXG4gICAgICAgICAgICBtYXA7XHJcblxyXG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaChrZXlzLCBmdW5jdGlvbihlbCkge1xyXG4gICAgICAgICAgICBub2RlID0gbW9kZWwuZmluZChlbCk7XHJcbiAgICAgICAgICAgIGRlcHRoID0gbm9kZS5kZXB0aDtcclxuICAgICAgICAgICAgc3RhdGUgPSB0aGlzW25vZGUuc3RhdGUgKyAnU2V0J11bMF07XHJcbiAgICAgICAgICAgIGxhYmVsID0gdGhpc1tub2RlLnN0YXRlICsgJ1NldCddWzFdO1xyXG4gICAgICAgICAgICByYXRlID0gdGhpcy5kZXB0aExhYmVsc1tkZXB0aCAtIDFdIHx8ICcnO1xyXG4gICAgICAgICAgICBtYXAgPSB7XHJcbiAgICAgICAgICAgICAgICBTdGF0ZTogc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBTdGF0ZUxhYmVsOiBsYWJlbCxcclxuICAgICAgICAgICAgICAgIE5vZGVJRDogbm9kZS5pZCxcclxuICAgICAgICAgICAgICAgIERlcHRoOiBkZXB0aCxcclxuICAgICAgICAgICAgICAgIFRpdGxlOiBub2RlLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgVmFsdWVDbGFzczogdGhpcy52YWx1ZUNsYXNzLFxyXG4gICAgICAgICAgICAgICAgU3ViVHJlZTogdGhpcy5zdWJ0cmVlQ2xhc3MsXHJcbiAgICAgICAgICAgICAgICBEaXNwbGF5OiAobm9kZS5zdGF0ZSA9PT0gJ29wZW4nKSA/ICcnIDogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgRGVwdGhMYWJlbDogcmF0ZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKG5lLnV0aWwuaXNOb3RFbXB0eShub2RlLmNoaWxkS2V5cykpIHtcclxuICAgICAgICAgICAgICAgIHRtcGwgPSB0aGlzLnRlbXBsYXRlLkVER0VfTk9ERTtcclxuICAgICAgICAgICAgICAgIG1hcC5DaGlsZHJlbiA9IHRoaXMuX2dldEh0bWwobm9kZS5jaGlsZEtleXMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdG1wbCA9IHRoaXMudGVtcGxhdGUuTEVBUF9OT0RFO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbCA9IHRtcGwucmVwbGFjZSgvXFx7XFx7KFteXFx9XSspXFx9XFx9L2csIGZ1bmN0aW9uKG1hdGNoZWRTdHJpbmcsIG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXBbbmFtZV0gfHwgJyc7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY2hpbGRFbC5wdXNoKGVsKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgaHRtbCA9IGNoaWxkRWwuam9pbignJyk7XHJcblxyXG4gICAgICAgIHJldHVybiBodG1sO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZSB2aWV3LlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGFjdFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxyXG4gICAgICovXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uKGFjdCwgdGFyZ2V0KSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24oYWN0LCB0YXJnZXQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFjdGlvbiBcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIEEgdHlwZSBvZiBhY3Rpb24gXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0IEEgdGFyZ2V0XHJcbiAgICAgKi9cclxuICAgIGFjdGlvbjogZnVuY3Rpb24odHlwZSwgdGFyZ2V0KSB7XHJcbiAgICAgICAgdGhpcy5fYWN0aW9uTWFwID0gdGhpcy5fYWN0aW9uTWFwIHx8IHtcclxuICAgICAgICAgICAgcmVmcmVzaDogdGhpcy5fcmVmcmVzaCxcclxuICAgICAgICAgICAgcmVuYW1lOiB0aGlzLl9yZW5hbWUsXHJcbiAgICAgICAgICAgIHRvZ2dsZTogdGhpcy5fdG9nZ2xlTm9kZSxcclxuICAgICAgICAgICAgc2VsZWN0OiB0aGlzLl9zZWxlY3QsXHJcbiAgICAgICAgICAgIHVuc2VsZWN0OiB0aGlzLl91blNlbGVjdCxcclxuICAgICAgICAgICAgY29udmVydDogdGhpcy5fY29udmVydCxcclxuICAgICAgICAgICAgcmVzdG9yZTogdGhpcy5fcmVzdG9yZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fYWN0aW9uTWFwW3R5cGUgfHwgJ3JlZnJlc2gnXS5jYWxsKHRoaXMsIHRhcmdldCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hhbmdlIG5vZGUgc3RhdGVcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBub2RlIEEgaW5mb3JtdGlvbiB0byBub2RlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfY2hhbmdlTm9kZVN0YXRlOiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmlkKTtcclxuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgY2xzID0gcGFyZW50LmNsYXNzTmFtZTtcclxuXHJcbiAgICAgICAgaWYgKG5lLnV0aWwuaXNFbXB0eShub2RlLmNoaWxkS2V5cykpIHtcclxuICAgICAgICAgICAgY2xzID0gJ2xlYXBfbm9kZSAnICsgdGhpc1tub2RlLnN0YXRlICsgJ1NldCddWzBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNscyA9ICdlZGdlX25vZGUgJyArIHRoaXNbbm9kZS5zdGF0ZSArICdTZXQnXVswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhcmVudC5jbGFzc05hbWUgPSBjbHM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hhbmdlIHN0YXRlIHRvIGVkaXQgXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9jb252ZXJ0OiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIGlkID0gZWxlbWVudC5pZCxcclxuICAgICAgICAgICAgbm9kZSA9IHRoaXMubW9kZWwuZmluZChpZCksXHJcbiAgICAgICAgICAgIGxhYmVsID0gbm9kZS52YWx1ZSxcclxuICAgICAgICAgICAgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQudmFsdWUgPSBsYWJlbDtcclxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBlbGVtZW50O1xyXG4gICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcy5pbnB1dEVsZW1lbnQsIGVsZW1lbnQpO1xyXG5cclxuICAgICAgICB0aGlzLmlucHV0RWxlbWVudC5mb2N1cygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFwcGx5IG5vZGUgbmFtZVxyXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfcmVzdG9yZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG5cclxuICAgICAgICB2YXIgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmlucHV0RWxlbWVudC52YWx1ZSA9ICcnO1xyXG5cclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcy5pbnB1dEVsZW1lbnQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERyYXcgZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGh0bWwgQSBodG1sIG1hZGUgYnkgZGF0YVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmVudCBBIHBhcmVudCBlbGVtZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICpcclxuICAgICAqL1xyXG4gICAgX2RyYXc6IGZ1bmN0aW9uKGh0bWwsIHBhcmVudCkge1xyXG4gICAgICAgIHZhciByb290ID0gcGFyZW50IHx8IHRoaXMucm9vdDtcclxuICAgICAgICByb290LmlubmVySFRNTCA9IGh0bWw7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGxhYmVsIGJ5IGRlcHRoXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkZXB0aExhYmVscyBBIGRlcHRoIGxhYmVsIGFycmF5XHJcbiAgICAgKi9cclxuICAgIHNldERlcHRoTGFiZWxzOiBmdW5jdGlvbihkZXB0aExhYmVscykge1xyXG4gICAgICAgIHRoaXMuZGVwdGhMYWJlbHMgPSBkZXB0aExhYmVscztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWZyZXNoIG5vZGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiovXHJcbiAgICBfcmVmcmVzaDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLm1vZGVsLnRyZWVIYXNoLnJvb3QuY2hpbGRLZXlzO1xyXG4gICAgICAgIHRoaXMuX2RyYXcodGhpcy5fZ2V0SHRtbChkYXRhKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuYW1lIG5vZGVcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlIEEgbW9kZWwgaW5mb3JtYXRpb24gXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfcmVuYW1lOiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmlkKTtcclxuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IG5vZGUudmFsdWU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgKiBUb2dnbGUgbW9kZWxcclxuICAgICogQHBhcmFtIHtPYmplY3R9IG5vZGUgQSBub2RlIGluZm9ybWF0aW9uXHJcbiAgICAqIEBwcml2YXRlXHJcbiAgICAqKi9cclxuICAgIF90b2dnbGVOb2RlOiBmdW5jdGlvbihub2RlKSB7XHJcblxyXG4gICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZS5pZCksXHJcbiAgICAgICAgICAgIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgY2hpbGRXcmFwID0gcGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCd1bCcpWzBdLFxyXG4gICAgICAgICAgICBidXR0b24gPSBwYXJlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2J1dHRvbicpWzBdLFxyXG4gICAgICAgICAgICBzdGF0ZSA9IHRoaXNbbm9kZS5zdGF0ZSArICdTZXQnXVswXSxcclxuICAgICAgICAgICAgbGFiZWwgPSB0aGlzW25vZGUuc3RhdGUgKyAnU2V0J11bMV0sXHJcbiAgICAgICAgICAgIGlzT3BlbiA9IG5vZGUuc3RhdGUgPT09ICdvcGVuJztcclxuXHJcbiAgICAgICAgcGFyZW50LmNsYXNzTmFtZSA9IHBhcmVudC5jbGFzc05hbWUucmVwbGFjZSh0aGlzLm9wZW5TZXRbMF0sICcnKS5yZXBsYWNlKHRoaXMuY2xvc2VTZXRbMF0sICcnKSArIHN0YXRlO1xyXG4gICAgICAgIGNoaWxkV3JhcC5zdHlsZS5kaXNwbGF5ID0gaXNPcGVuID8gJycgOiAnbm9uZSc7XHJcbiAgICAgICAgYnV0dG9uLmlubmVySFRNTCA9IGxhYmVsO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNlbGVjdCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbm9kZSBBIHRhcmdldCBub2RlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc2VsZWN0OiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmlkKTtcclxuXHJcbiAgICAgICAgaWYgKG5lLnV0aWwuaXNFeGlzdHkodmFsdWVFbCkpIHtcclxuICAgICAgICAgICAgdmFsdWVFbC5jbGFzc05hbWUgPSB2YWx1ZUVsLmNsYXNzTmFtZS5yZXBsYWNlKCcgJyArIHRoaXMub25zZWxlY3RDbGFzcywgJycpICsgJyAnICsgdGhpcy5vbnNlbGVjdENsYXNzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbnNlbGVjdCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbm9kZSBBIHRhcmdldCBub2RlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICoqL1xyXG4gICAgX3VuU2VsZWN0OiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmlkKTtcclxuXHJcbiAgICAgICAgaWYgKG5lLnV0aWwuaXNFeGlzdHkodmFsdWVFbCkgJiYgdXRpbC5oYXNDbGFzcyh2YWx1ZUVsLCB0aGlzLm9uc2VsZWN0Q2xhc3MpKSB7XHJcbiAgICAgICAgICAgIHZhbHVlRWwuY2xhc3NOYW1lID0gdmFsdWVFbC5jbGFzc05hbWUucmVwbGFjZSgnICcgKyB0aGlzLm9uc2VsZWN0Q2xhc3MsICcnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmVlO1xyXG4iLCIvKipcclxuICogQGZpbGVvdmVydmlldyBVcGRhdGUgdmlldyBhbmQgY29udHJvbCB0cmVlIGRhdGFcclxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBAY29uc3RydWN0b3IgVHJlZU1vZGVsXHJcbiAqICoqL1xyXG52YXIgVHJlZU1vZGVsID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWVNb2RlbC5wcm90b3R5cGUgKi97XHJcbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zLCB0cmVlKSB7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgY291bnQgZm9yIG5vZGUgaWRlbnRpdHkgbnVtYmVyXHJcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNvdW50ID0gMDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSB2aWV3IHRoYXQgb2JzZXJ2ZSBtb2RlbCBjaGFuZ2VcclxuICAgICAgICAgKiBAdHlwZSB7bmUuY29tcG9uZW50LlRyZWV9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCBzdGF0ZSBvZiBub2RlXHJcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm5vZGVEZWZhdWx0U3RhdGUgPSBvcHRpb25zLmRlZmF1bHRTdGF0ZSB8fCAnY2xvc2UnO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGJ1ZmZlciBcclxuICAgICAgICAgKiBAdHlwZSB7bnVsbH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgZGVwdGhcclxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZGVwdGggPSAwO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIG1pbGlzZWNvbiB0aW1lIHRvIG1ha2Ugbm9kZSBJRFxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kYXRlID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRyZWUgaGFzaFxyXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50cmVlSGFzaCA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLnRyZWVIYXNoWydyb290J10gPSB0aGlzLm1ha2VOb2RlKDAsICdyb290JywgJ3Jvb3QnKTtcclxuICAgICAgICB0aGlzLmNvbm5lY3QodHJlZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IG1vZGVsIHdpdGggdHJlZSBkYXRhXHJcbiAgICAgKiBAcGFyYW0ge2FycmF5fSBkYXRhICBBIHRyZWUgZGF0YVxyXG4gICAgICovXHJcbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgdGhpcy50cmVlSGFzaC5yb290LmNoaWxkS2V5cyA9IHRoaXMuX21ha2VUcmVlSGFzaChkYXRhKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2UgaGllcmFyY2h5IGRhdGEgdG8gaGFzaCBsaXN0LlxyXG4gICAgICogQHBhcmFtIHthcnJheX0gZGF0YSBBIHRyZWUgZGF0YSBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRJZCBBIHBhcmVudCBub2RlIGlkXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfbWFrZVRyZWVIYXNoOiBmdW5jdGlvbihkYXRhLCBwYXJlbnRJZCkge1xyXG5cclxuICAgICAgICB2YXIgY2hpbGRLZXlzID0gW10sXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICB0aGlzLmRlcHRoID0gdGhpcy5kZXB0aCArIDE7XHJcblxyXG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaChkYXRhLCBmdW5jdGlvbihlbGVtZW50KSB7XHJcblxyXG4gICAgICAgICAgICBpZCA9IHRoaXMuX2dldElkKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyZWVIYXNoW2lkXSA9IHRoaXMubWFrZU5vZGUodGhpcy5kZXB0aCwgaWQsIGVsZW1lbnQudmFsdWUsIHBhcmVudElkKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmNoaWxkcmVuICYmIG5lLnV0aWwuaXNOb3RFbXB0eShlbGVtZW50LmNoaWxkcmVuKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlSGFzaFtpZF0uY2hpbGRLZXlzID0gdGhpcy5fbWFrZVRyZWVIYXNoKGVsZW1lbnQuY2hpbGRyZW4sIGlkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2hpbGRLZXlzLnB1c2goaWQpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLmRlcHRoID0gdGhpcy5kZXB0aCAtIDE7XHJcblxyXG4gICAgICAgIGNoaWxkS2V5cy5zb3J0KG5lLnV0aWwuYmluZCh0aGlzLnNvcnQsIHRoaXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGNoaWxkS2V5cztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRlcHRoIEEgZGVwdGggb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIEEgbm9kZSBJRFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIEEgdmFsdWUgb2Ygbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIEEgcGFyZW50IG5vZGUgSURcclxuICAgICAqIEByZXR1cm4ge3t2YWx1ZTogKiwgcGFyZW50SWQ6ICgqfHN0cmluZyksIGlkOiAqfX1cclxuICAgICAqL1xyXG4gICAgbWFrZU5vZGU6IGZ1bmN0aW9uKGRlcHRoLCBpZCwgdmFsdWUsIHBhcmVudElkKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZGVwdGg6IGRlcHRoLFxyXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgICAgICAgIHBhcmVudElkOiAoZGVwdGggPT09IDApID8gbnVsbCA6IChwYXJlbnRJZCB8fCAncm9vdCcpLFxyXG4gICAgICAgICAgICBzdGF0ZTogdGhpcy5ub2RlRGVmYXVsdFN0YXRlLFxyXG4gICAgICAgICAgICBpZDogaWRcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgYW5kIHJldHVybiBub2RlIElEXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICogQHJldHVybiB7U3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBfZ2V0SWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuY291bnQgPSB0aGlzLmNvdW50ICsgMTtcclxuICAgICAgICByZXR1cm4gJ25vZGVfJyArIHRoaXMuZGF0ZSArICdfJyArIHRoaXMuY291bnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmluZCBub2RlIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSB0byBmaW5kIG5vZGVcclxuICAgICAqIEByZXR1cm4ge29iamVjdHx1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIGZpbmQ6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRyZWVIYXNoW2tleV07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIG5vZGUgYW5kIGNoaWxkIG5vZGVzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IHRvIHJlbW92ZVxyXG4gICAgICovXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIHZhciByZXMgPSB0aGlzLmludm9rZSgncmVtb3ZlJywgeyBpZDoga2V5IH0pO1xyXG5cclxuICAgICAgICBpZiAoIXJlcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnJlbW92ZUtleShrZXkpO1xyXG4gICAgICAgIHRoaXMudHJlZUhhc2hba2V5XSA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMubm90aWZ5KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIG5vZGUga2V5XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IHRvIHJlbW92ZVxyXG4gICAgICovXHJcbiAgICByZW1vdmVLZXk6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5maW5kKGtleSk7XHJcblxyXG4gICAgICAgIGlmICghbm9kZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5maW5kKG5vZGUucGFyZW50SWQpO1xyXG5cclxuICAgICAgICBwYXJlbnQuY2hpbGRLZXlzID0gbmUudXRpbC5maWx0ZXIocGFyZW50LmNoaWxkS2V5cywgZnVuY3Rpb24oY2hpbGRLZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoaWxkS2V5ICE9PSBrZXk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSB0byBtb3ZlIG5vZGVcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlIEEgbm9kZSBvYmplY3QgdG8gbW92ZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldElkIEEgdGFyZ2V0IElEIHRvIGluc2VydFxyXG4gICAgICovXHJcbiAgICBtb3ZlOiBmdW5jdGlvbihrZXksIG5vZGUsIHRhcmdldElkKSB7XHJcblxyXG4gICAgICAgIHRoaXMucmVtb3ZlS2V5KGtleSk7XHJcbiAgICAgICAgdGhpcy50cmVlSGFzaFtrZXldID0gbnVsbDtcclxuICAgICAgICB0aGlzLmluc2VydChub2RlLCB0YXJnZXRJZCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluc2VydCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZSBBIG5vZGUgb2JqZWN0IHRvIGluc2VydFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFt0YXJnZXRJZF0gQSB0YXJnZXQgSUQgdG8gaW5zZXJ0XHJcbiAgICAgKi9cclxuICAgIGluc2VydDogZnVuY3Rpb24obm9kZSwgdGFyZ2V0SWQpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy5maW5kKHRhcmdldElkIHx8ICdyb290Jyk7XHJcblxyXG4gICAgICAgIGlmICghdGFyZ2V0LmNoaWxkS2V5cykge1xyXG4gICAgICAgICAgICB0YXJnZXQuY2hpbGRLZXlzID0gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0YXJnZXQuY2hpbGRLZXlzLnB1c2gobm9kZS5pZCk7XHJcbiAgICAgICAgbm9kZS5kZXB0aCA9IHRhcmdldC5kZXB0aCArIDE7XHJcbiAgICAgICAgbm9kZS5wYXJlbnRJZCA9IHRhcmdldElkO1xyXG4gICAgICAgIHRhcmdldC5jaGlsZEtleXMuc29ydChuZS51dGlsLmJpbmQodGhpcy5zb3J0LCB0aGlzKSk7XHJcblxyXG4gICAgICAgIHRoaXMudHJlZUhhc2hbbm9kZS5pZF0gPSBub2RlO1xyXG5cclxuICAgICAgICB0aGlzLm5vdGlmeSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEEgbm90aWZ5IHRyZWVcclxuICAgICAqL1xyXG4gICAgbm90aWZ5OiBmdW5jdGlvbih0eXBlLCB0YXJnZXQpIHtcclxuICAgICAgICBpZiAodGhpcy50cmVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5ub3RpZnkodHlwZSwgdGFyZ2V0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29ubmVjdCB2aWV3IGFuZCBtb2RlbFxyXG4gICAgICogQHBhcmFtIHtUcmVlfSB0cmVlXHJcbiAgICAgKi9cclxuICAgIGNvbm5lY3Q6IGZ1bmN0aW9uKHRyZWUpIHtcclxuICAgICAgICBpZiAoIXRyZWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmFtZSBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0aXJuZ30ga2V5IEEga2V5IHRvIHJlbmFtZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIEEgdmFsdWUgdG8gY2hhbmdlXHJcbiAgICAgKi9cclxuICAgIHJlbmFtZTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciByZXMgPSB0aGlzLmludm9rZSgncmVuYW1lJywge2lkOiBrZXksIHZhbHVlOiB2YWx1ZX0pO1xyXG4gICAgICAgIGlmICghcmVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5maW5kKGtleSk7XHJcbiAgICAgICAgbm9kZS52YWx1ZSA9IHZhbHVlO1xyXG5cclxuICAgICAgICB0aGlzLm5vdGlmeSgncmVuYW1lJywgbm9kZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hhbmdlIG5vZGUgc3RhdGVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB2YWx1ZSB0byBjaGFuZ2VcclxuICAgICAqL1xyXG4gICAgY2hhbmdlU3RhdGU6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5maW5kKGtleSk7XHJcbiAgICAgICAgbm9kZS5zdGF0ZSA9IChub2RlLnN0YXRlID09PSAnb3BlbicpID8gJ2Nsb3NlJyA6ICdvcGVuJztcclxuICAgICAgICB0aGlzLm5vdGlmeSgndG9nZ2xlJywgbm9kZSk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgYnVmZmVyIHRvIHNhdmUgc2VsZWN0ZWQgbm9kZVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUga2V5IG9mIHNlbGVjdGVkIG5vZGVcclxuICAgICAqKi9cclxuICAgIHNldEJ1ZmZlcjogZnVuY3Rpb24oa2V5KSB7XHJcblxyXG4gICAgICAgIHRoaXMuY2xlYXJCdWZmZXIoKTtcclxuXHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmQoa2V5KTtcclxuXHJcbiAgICAgICAgdGhpcy5ub3RpZnkoJ3NlbGVjdCcsIG5vZGUpO1xyXG4gICAgICAgIHRoaXMuZmlyZSgnc2VsZWN0Jywge2lkOiBrZXksIHZhbHVlOiBub2RlLnZhbHVlIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW1wdHkgYnVmZmVyXHJcbiAgICAgKi9cclxuICAgIGNsZWFyQnVmZmVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmJ1ZmZlcikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm5vdGlmeSgndW5zZWxlY3QnLCB0aGlzLmJ1ZmZlcik7XHJcbiAgICAgICAgdGhpcy5idWZmZXIgPSBudWxsO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayBtb3ZhYmxlIHBvc2l0b25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkZXN0IEEgZGVzdGluYXRpb24gbm9kZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5vZGUgQSB0YXJnZXQgbm9kZVxyXG4gICAgICovXHJcbiAgICBpc0Rpc2FibGU6IGZ1bmN0aW9uKGRlc3QsIG5vZGUpIHtcclxuICAgICAgICBpZiAoZGVzdC5kZXB0aCA9PT0gbm9kZS5kZXB0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnBhcmVudElkKSB7XHJcbiAgICAgICAgICAgIGlmIChkZXN0LmlkID09PSBub2RlLnBhcmVudElkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZGVzdC5wYXJlbnRJZCA9PT0gbm9kZS5pZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc0Rpc2FibGUodGhpcy5maW5kKGRlc3QucGFyZW50SWQpLCBub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTb3J0IGJ5IHRpdGxlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmlkXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKHBpZCwgbmlkKSB7XHJcbiAgICAgICAgdmFyIHAgPSB0aGlzLmZpbmQocGlkKSxcclxuICAgICAgICAgICAgbiA9IHRoaXMuZmluZChuaWQpO1xyXG5cclxuICAgICAgICBpZiAoIXAgfHwgIW4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocC52YWx1ZSA8IG4udmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocC52YWx1ZSA+IG4udmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVHJlZU1vZGVsKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZU1vZGVsO1xyXG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSGVscGVyIG9iamVjdCB0byBtYWtlIGVhc3kgdHJlZSBlbGVtZW50c1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogQG5hbWVzcGFjZSB1dGlsXG4gKi9cbnZhciB1dGlsID0ge1xuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB0byBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50IFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhZGRcbiAgICAgKi9cbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgZnJvbSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgQSBuYW1lIG9mIGV2ZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LmRldGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0YXJnZXQgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9IFxuICAgICAqL1xuICAgIGdldFRhcmdldDogZnVuY3Rpb24oZSkge1xuICAgICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBlbGVtZW50IGhhcyBzcGVjaWZpYyBjbGFzcyBvciBub3RcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzcyB0byBmaW5kXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBoYXNDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmICghZWxlbWVudCB8fCAhY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJyN1dGlsLmhhc0NsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkg7JeY66as66i87Yq46rCAIOyeheugpeuQmOyngCDslYrslZjsirXri4jri6QuIFxcbl9fZWxlbWVudCcgKyBlbGVtZW50ICsgJyxfX2NsYXNzTmFtZScgKyBjbGFzc05hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNscyA9IGVsZW1lbnQuY2xhc3NOYW1lO1xuXG4gICAgICAgIGlmIChjbHMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgZWxlbWVudCBieSBjbGFzcyBuYW1lXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lIEEgbmFtZSBvZiBjbGFzc1xuICAgICAqIEByZXR1cm4ge2FycmF5fVxuICAgICAqL1xuICAgIGdldEVsZW1lbnRzQnlDbGFzczogZnVuY3Rpb24odGFyZ2V0LCBjbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYWxsID0gdGFyZ2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJyksXG4gICAgICAgICAgICBmaWx0ZXIgPSBbXTtcblxuICAgICAgICBhbGwgPSBuZS51dGlsLnRvQXJyYXkoYWxsKTtcblxuICAgICAgICBuZS51dGlsLmZvckVhY2goYWxsLCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgdmFyIGNscyA9IGVsLmNsYXNzTmFtZSB8fCAnJztcbiAgICAgICAgICAgIGlmIChjbHMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGZpbHRlci5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgd2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uIG9yIG5vdFxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gXG4gICAgICovXG4gICAgaXNSaWdodEJ1dHRvbjogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgaXNSaWdodCA9IHV0aWwuX2dldEJ1dHRvbihlKSA9PT0gMjtcbiAgICAgICAgcmV0dXJuIGlzUmlnaHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0IG9yIG5vdFxuICAgICAqIEBwYXJhbSB7YXJyYXl9IHByb3BzIEEgcHJvcGVydHkgXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB0ZXN0UHJvcDogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuICAgICAgICAgICAgaSA9IDA7XG5cbiAgICAgICAgZm9yICg7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHByb3BzW2ldIGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCBkZWZhdWx0IGV2ZW50IFxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemF0aW9uIGZvciBldmVudCBidXR0b24gcHJvcGVydHkgXG4gICAgICogMDogRmlyc3QgbW91c2UgYnV0dG9uLCAyOiBTZWNvbmQgbW91c2UgYnV0dG9uLCAxOiBDZW50ZXIgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfSBcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRCdXR0b246IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGJ1dHRvbixcbiAgICAgICAgICAgIHByaW1hcnkgPSAnMCwxLDMsNSw3JyxcbiAgICAgICAgICAgIHNlY29uZGFyeSA9ICcyLDYnLFxuICAgICAgICAgICAgd2hlZWwgPSAnNCc7XG5cbiAgICAgICAgaWYgKGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoJ01vdXNlRXZlbnRzJywgJzIuMCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gZS5idXR0b247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidXR0b24gPSBlLmJ1dHRvbiArICcnO1xuICAgICAgICAgICAgaWYgKHByaW1hcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2Vjb25kYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHdoZWVsLmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=
