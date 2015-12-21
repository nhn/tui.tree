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

var STATE = statics.STATE;
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
        /**
         * @api
         * @event TreeModel#remove
         * @param {{id: string}} removed - id
         * @example
         * tree.model.on('remove', function(data) {
         *     alert('removed -' +  data.id );
         * });
         */
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

        /**
         * @api
         * @event TreeModel#rename
         * @param {{id: string, value: string}} eventData
         * @example
         * // 노드 이름 변경시 발생
         * tree.model.on('rename', function(object) {
         *     document.getElementById('selectValue').value = object.value + '노드 이름 변경';
         *     return true;
         * });
         */
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

        /**
         * @api
         * @event TreeModel#select
         * @param {{id: string, value: string}} eventData
         * @example
         * // 노드를 선택시 발생
         * tree.model.on('select', function(object) {
         *     document.getElementById('selectValue').value = object.value;
         * });
         */
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9zdGF0aWNzLmpzIiwic3JjL2pzL3RyZWUuanMiLCJzcmMvanMvdHJlZW1vZGVsLmpzIiwic3JjL2pzL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcnBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQuVHJlZScsIHJlcXVpcmUoJy4vc3JjL2pzL3RyZWUnKSk7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBkZWZhdWx0IHZhbHVlcyBmb3IgdHJlZVxuICovXG5cbnZhciBTVEFURSA9IHtcbiAgICBOT1JNQUw6IDAsXG4gICAgRURJVEFCTEU6IDFcbn07XG5cbnZhciBERUZBVUxUID0ge1xuICAgIE9QRU46IFsnb3BlbicsICctJ10sXG4gICAgQ0xPU0U6IFsnY2xvc2UnLCAnKyddLFxuICAgIFNFTEVDVF9DTEFTUzogJ3NlbGVjdGVkJyxcbiAgICBTVUJUUkVFX0NMQVNTOiAnU3VidHJlZScsXG4gICAgVkFMVUVfQ0xBU1M6ICd2YWx1ZUNsYXNzJyxcbiAgICBFRElUQUJMRV9DTEFTUzogJ2VkaXRhYmxlQ2xhc3MnLFxuICAgIFRFTVBMQVRFOiB7XG4gICAgICAgIEVER0VfTk9ERTogJzxsaSBjbGFzcz1cImVkZ2Vfbm9kZSB7e1N0YXRlfX1cIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiPnt7U3RhdGVMYWJlbH19PC9idXR0b24+JyArXG4gICAgICAgICAgICAgICAgICAgICc8c3BhbiBpZD1cInt7Tm9kZUlEfX1cIiBjbGFzcz1cImRlcHRoe3tEZXB0aH19IHt7VmFsdWVDbGFzc319XCI+e3tUaXRsZX19PC9zcGFuPjxlbT57e0RlcHRoTGFiZWx9fTwvZW0+JyArXG4gICAgICAgICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ7e1N1YnRyZWV9fVwiIHN0eWxlPVwiZGlzcGxheTp7e0Rpc3BsYXl9fVwiPnt7Q2hpbGRyZW59fTwvdWw+JyArXG4gICAgICAgICAgICAgICAgJzwvbGk+JyxcbiAgICAgICAgTEVBUF9OT0RFOiAnPGxpIGNsYXNzPVwibGVhcF9ub2RlXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8c3BhbiBpZD1cInt7Tm9kZUlEfX1cIiBjbGFzcz1cImRlcHRoe3tEZXB0aH19IHt7VmFsdWVDbGFzc319XCI+e3tUaXRsZX19PC9zcGFuPjxlbT57e0RlcHRoTGFiZWx9fTwvZW0+JyArXG4gICAgICAgICAgICAgICAgJzwvbGk+J1xuICAgIH0sXG4gICAgVVNFX0RSQUc6IGZhbHNlLFxuICAgIFVTRV9IRUxQRVI6IGZhbHNlLFxuICAgIEhFTFBFUl9QT1MgOiB7XG4gICAgICAgIHg6IDEwLFxuICAgICAgICB5OiAxMFxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFNUQVRFOiBTVEFURSxcbiAgICBERUZBVUxUOiBERUZBVUxUXG59O1xuIiwiLyoqXHJcbiAqIEBmaWxlb3ZlcnZpZXcgUmVuZGVyIHRyZWUgYW5kIHVwZGF0ZSB0cmVlLlxyXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIGRldiB0ZWFtLjxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XHJcbiAqL1xyXG5cclxudmFyIHN0YXRpY3MgPSByZXF1aXJlKCcuL3N0YXRpY3MnKTtcclxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcbnZhciBUcmVlTW9kZWwgPSByZXF1aXJlKCcuL3RyZWVtb2RlbCcpO1xyXG5cclxudmFyIFNUQVRFID0gc3RhdGljcy5TVEFURTtcclxuLyoqXHJcbiAqIENyZWF0ZSB0cmVlIG1vZGVsIGFuZCBpbmplY3QgZGF0YSB0byBtb2RlbFxyXG4gKiBAY29uc3RydWN0b3IgXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCBBIGlkIGZvciB0cmVlIHJvb3QgZWxlbWVudFxyXG4gKiAgICAgIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEEgZGF0YSB0byBiZSB1c2VkIG9uIHRyZWVcclxuICogICAgICBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9uc1xyXG4gKiAgICAgICAgICBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5tb2RlbE9wdGlvbiBBIGlubmVyIG9wdGlvbiBmb3IgbW9kZWxcclxuICogICAgICAgICAgQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLnRlbXBsYXRlXSBBIG1hcmt1cCBzZXQgdG8gbWFrZSBlbGVtZW50XHJcbiAqICAgICAgICAgIEBwYXJhbSB7QXJyYXl9IFtvcHRpb25zLm9wZW5TZXRdIEEgY2xhc3MgbmFtZSBhbmQgYnV0dG9uIGxhYmVsIHRvIG9wZW4gc3RhdGVcclxuICogICAgICAgICAgQHBhcmFtIHtBcnJheX0gW29wdGlvbnMuY2xvc2VTZXRdIEEgY2xhc3MgbmFtZSBhbmQgYnV0dG9uIGxhYmVsIHRvIGNsb3NlIHN0YXRlXHJcbiAqICAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zZWxlY3RDbGFzc10gQSBjbGFzcyBuYW1lIHRvIHNlbGVjdGVkIG5vZGVcclxuICogICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnZhbHVlQ2xhc3NdIEEgY2xhc3MgbmFtZSB0aGF0IGZvciBzZWxlY3RlZCB6b25lXHJcbiAqICAgICAgICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5pbnB1dENsYXNzXSBBIGNsYXNzIG5hbWUgZm9yIGlucHV0IGVsZW1lbnRcclxuICogICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN1YnRyZWVDbGFzc10gQSBjbGFzcyBuYW1lIGZvciBzdWIgdHJlZVxyXG4gKiAgICAgICAgICBAcGFyYW0ge0FycmF5fSBbb3B0aW9ucy5kZXB0aExhYmVsc10gQSBkZWZhdWx0IGxhYmVsICBlYWNoIGRlcHRoJ3Mgbm9kZXNcclxuICogICAgICAgICAgQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmhlbHBlclBvc10gQSByZWxhdGVkIHBvc2l0aW9uIGZvciBoZWxwZXIgb2JqZWN0XHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBkYXRhID0gW1xyXG4ge3RpdGxlOiAncm9vdEEnLCBjaGlsZHJlbjpcclxuICAgICAgICAgW1xyXG4gICAgICAgICAgICAge3RpdGxlOiAncm9vdC0xQSd9LCB7dGl0bGU6ICdyb290LTFCJ30se3RpdGxlOiAncm9vdC0xQyd9LCB7dGl0bGU6ICdyb290LTFEJ30sXHJcbiAgICAgICAgICAgICB7dGl0bGU6ICdyb290LTJBJywgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgICAgICB7dGl0bGU6J3N1Yl8xQScsIGNoaWxkcmVuOlt7dGl0bGU6J3N1Yl9zdWJfMUEnfV19LCB7dGl0bGU6J3N1Yl8yQSd9XHJcbiAgICAgICAgICAgICBdfSwge3RpdGxlOiAncm9vdC0yQid9LHt0aXRsZTogJ3Jvb3QtMkMnfSwge3RpdGxlOiAncm9vdC0yRCd9LFxyXG4gICAgICAgICAgICAge3RpdGxlOiAncm9vdC0zQScsXHJcbiAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgICAgICAgICAge3RpdGxlOidzdWIzX2EnfSwge3RpdGxlOidzdWIzX2InfVxyXG4gICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgIH0sIHt0aXRsZTogJ3Jvb3QtM0InfSx7dGl0bGU6ICdyb290LTNDJ30sIHt0aXRsZTogJ3Jvb3QtM0QnfVxyXG4gICAgICAgICBdXHJcbiB9LFxyXG4ge3RpdGxlOiAncm9vdEInLCBjaGlsZHJlbjogW1xyXG4gICAgIHt0aXRsZTonQl9zdWIxJ30sIHt0aXRsZTonQl9zdWIyJ30sIHt0aXRsZTonYid9XHJcbiBdfVxyXG4gXTtcclxuXHJcbiB2YXIgdHJlZTEgPSBuZXcgdHVpLmNvbXBvbmVudC5UcmVlKCdpZCcsIGRhdGEgLHtcclxuICAgICAgICBtb2RlbE9wdGlvbjoge1xyXG4gICAgICAgICAgICBkZWZhdWx0U3RhdGU6ICdvcGVuJ1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuICoqL1xyXG5cclxudmFyIFRyZWUgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFRyZWUucHJvdG90eXBlICove1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIEEgaWQgZm9yIHJvb3QgXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSBBIGluaXRpYWxpemUgZGF0YVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMgXHJcbiAgICAgKi9cclxuICAgIGluaXQ6IGZ1bmN0aW9uIChpZCwgZGF0YSwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGRlZmF1bHQgdGVtcGxhdGVcclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSBvcHRpb25zLnRlbXBsYXRlIHx8IHN0YXRpY3MuREVGQVVMVC5URU1QTEFURTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSByb290IGVsZW1lbnRcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yb290ID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjbGFzcyBuYW1lIGFuZCBsZWJlbCB0ZXh0IGZvciBvcGVuIHN0YXRlXHJcbiAgICAgICAgICogQHR5cGUge0FycmF5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMub3BlblNldCA9IG9wdGlvbnMub3BlblNldCB8fCBzdGF0aWNzLkRFRkFVTFQuT1BFTjtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjbGFzcyBuYW1lIGFuZCBsYWJlbCB0ZXh0IGZvciBjbG9zZSBzdGF0ZVxyXG4gICAgICAgICAqIEB0eXBlIHtBcnJheX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNsb3NlU2V0ID0gb3B0aW9ucy5jbG9zZVNldCB8fCBzdGF0aWNzLkRFRkFVTFQuQ0xPU0U7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgY2xhc3MgbmFtZSBmb3Igc2VsZWN0ZWQgbm9kZSBcclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMub25zZWxlY3RDbGFzcyA9IG9wdGlvbnMuc2VsZWN0Q2xhc3MgfHwgc3RhdGljcy5ERUZBVUxULlNFTEVDVF9DTEFTUztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjbGFzcyBuYW1lIGZvciBkb3VibGUgY2xpY2sgYXJlYVxyXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy52YWx1ZUNsYXNzID0gb3B0aW9ucy52YWx1ZUNsYXNzIHx8IHN0YXRpY3MuREVGQVVMVC5WQUxVRV9DTEFTUztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBjbGFzcyBuYW1lIGZvciBpbnB1dCBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmVkaXRDbGFzcyA9IG9wdGlvbnMuaW5wdXRDbGFzcyB8fCBzdGF0aWNzLkRFRkFVTFQuRURJVEFCTEVfQ0xBU1M7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgbGFiZWwgZm9yIGVhY2ggZGVwdGhcclxuICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kZXB0aExhYmVscyA9IG9wdGlvbnMuZGVwdGhMYWJlbHMgfHwgW107XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgc3RhdGUgb2YgdHJlZVxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRpY3MuU1RBVEUuTk9STUFMO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGNsYXNzIG5hbWUgZm9yIHN1YnRyZWVcclxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfCp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zdWJ0cmVlQ2xhc3MgPSBvcHRpb25zLnN1YnRyZWVDbGFzcyB8fCBzdGF0aWNzLkRFRkFVTFQuU1VCVFJFRV9DTEFTUztcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV2hldGhlciBkcmFnIGFuZCBkcm9wIHVzZSBvciBub3RcclxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbnwqfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudXNlRHJhZyA9IG9wdGlvbnMudXNlRHJhZyB8fCBzdGF0aWNzLkRFRkFVTFQuVVNFX0RSQUc7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFdoZXRoZXIgaGVscGVyIGVsZW1lbnQgdXNlIG9yIG5vdFxyXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufCp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy51c2VIZWxwZXIgPSB0aGlzLnVzZURyYWcgJiYgKG9wdGlvbnMudXNlSGVscGVyIHx8IHN0YXRpY3MuREVGQVVMVC5VU0VfSEVMUEVSKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU2V0IHJlbGF0aXZlIHBvc2l0aW9uIGZvciBoZWxwZXIgb2JqZWN0XHJcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmhlbHBlclBvcyA9IG9wdGlvbnMuaGVscGVyUG9zIHx8IHN0YXRpY3MuREVGQVVMVC5IRUxQRVJfUE9TO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBJbnB1dCBlbGVtZW50IFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmlucHV0RWxlbWVudCA9IHRoaXMuZ2V0RWRpdGFibGVFbGVtZW50KCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIE1ha2UgdHJlZSBtb2RlbFxyXG4gICAgICAgICAqIEB0eXBlIHtUcmVlTW9kZWx9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG5ldyBUcmVlTW9kZWwob3B0aW9ucy5tb2RlbE9wdGlvbiwgdGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWwuc2V0RGF0YShkYXRhKTtcclxuXHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMucm9vdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9kcmF3KHRoaXMuX2dldEh0bWwodGhpcy5tb2RlbC50cmVlSGFzaC5yb290LmNoaWxkS2V5cykpO1xyXG4gICAgICAgIHRoaXMuc2V0RXZlbnRzKCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgaW5wdXQgZWxlbWVudFxyXG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGdldEVkaXRhYmxlRWxlbWVudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuICAgICAgICBpbnB1dC5jbGFzc05hbWUgPSB0aGlzLmVkaXRDbGFzcztcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGV2ZW50IGhhbmRsZXIgXHJcbiAgICAgKi9cclxuICAgIHNldEV2ZW50czogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3QsICdjbGljaycsIHR1aS51dGlsLmJpbmQodGhpcy5fb25DbGljaywgdGhpcykpO1xyXG4gICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlucHV0RWxlbWVudCwgJ2JsdXInLCB0dWkudXRpbC5iaW5kKHRoaXMuX29uQmx1cklucHV0LCB0aGlzKSk7XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5wdXRFbGVtZW50LCAna2V5dXAnLCB0dWkudXRpbC5iaW5kKHRoaXMuX29uS2V5dXAsIHRoaXMpKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudXNlRHJhZykge1xyXG4gICAgICAgICAgICB0aGlzLl9hZGREcmFnRXZlbnQoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGRyYWcgYW5kIGRyb3AgZXZlbnQgXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfYWRkRHJhZ0V2ZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdXNlclNlbGVjdFByb3BlcnR5ID0gdXRpbC50ZXN0UHJvcChbJ3VzZXJTZWxlY3QnLCAnV2Via2l0VXNlclNlbGVjdCcsICdPVXNlclNlbGVjdCcsICdNb3pVc2VyU2VsZWN0JywgJ21zVXNlclNlbGVjdCddKTtcclxuICAgICAgICB2YXIgaXNTdXBwb3J0U2VsZWN0U3RhcnQgPSAnb25zZWxlY3RzdGFydCcgaW4gZG9jdW1lbnQ7XHJcbiAgICAgICAgaWYgKGlzU3VwcG9ydFNlbGVjdFN0YXJ0KSB7XHJcbiAgICAgICAgICAgIHV0aWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnJvb3QsICdzZWxlY3RzdGFydCcsIHV0aWwucHJldmVudERlZmF1bHQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcclxuICAgICAgICAgICAgc3R5bGVbdXNlclNlbGVjdFByb3BlcnR5XSA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKHRoaXMucm9vdCwgJ21vdXNlZG93bicsIHR1aS51dGlsLmJpbmQodGhpcy5fb25Nb3VzZURvd24sIHRoaXMpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbiBrZXkgdXAgZXZlbnQgaGFuZGxlclxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uS2V5dXA6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwucmVuYW1lKHRoaXMuY3VycmVudC5pZCwgdGFyZ2V0LnZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VTdGF0ZSh0aGlzLmN1cnJlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbiBpbnB1dCBibHVyIGV2ZW50IGhhbmRsZXJcclxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9vbkJsdXJJbnB1dDogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlID09PSBTVEFURS5OT1JNQUwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XHJcbiAgICAgICAgdGhpcy5tb2RlbC5yZW5hbWUodGhpcy5jdXJyZW50LmlkLCB0YXJnZXQudmFsdWUpO1xyXG4gICAgICAgIHRoaXMuY2hhbmdlU3RhdGUodGhpcy5jdXJyZW50KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbiBjbGljayBldmVudCBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge2V2ZW50fSBlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25DbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSB1dGlsLmdldFRhcmdldChlKTtcclxuXHJcbiAgICAgICAgaWYgKHV0aWwuaXNSaWdodEJ1dHRvbihlKSkge1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXV0aWwuaGFzQ2xhc3ModGFyZ2V0LCB0aGlzLnZhbHVlQ2xhc3MpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX29uU2luZ2xlQ2xpY2soZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNsaWNrVGltZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5fb25Eb3VibGVDbGljayhlKTtcclxuICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLmNsaWNrVGltZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IHNldFRpbWVvdXQodHVpLnV0aWwuYmluZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX29uU2luZ2xlQ2xpY2soZSk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpLCA0MDApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoYW5kbGUgc2luZ2xlIGNsaWNrIGV2ZW50IFxyXG4gICAgICogQHBhcmFtIHtldmVudH0gZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uU2luZ2xlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jbGlja1RpbWVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHV0aWwuZ2V0VGFyZ2V0KGUpLFxyXG4gICAgICAgICAgICB0YWcgPSB0YXJnZXQudGFnTmFtZS50b1VwcGVyQ2FzZSgpLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgdmFsdWVFbCA9IHV0aWwuZ2V0RWxlbWVudHNCeUNsYXNzKHBhcmVudCwgdGhpcy52YWx1ZUNsYXNzKVswXTtcclxuXHJcbiAgICAgICAgaWYgKHRhZyA9PT0gJ0lOUFVUJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGFnID09PSAnQlVUVE9OJykge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmNoYW5nZVN0YXRlKHZhbHVlRWwuaWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwuc2V0QnVmZmVyKHZhbHVlRWwuaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2Ugc3RhdGUgKFNUQVRFLk5PUk1BTCB8IFNUQVRFLkVESVRBQkxFKVxyXG4gICAgICogQHBhcmFtIHtIVE1MZWxlbWVudH0gdGFyZ2V0IOyXmOumrOuovO2KuFxyXG4gICAgICovXHJcbiAgICBjaGFuZ2VTdGF0ZTogZnVuY3Rpb24odGFyZ2V0KSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlID09PSBTVEFURS5FRElUQUJMRSkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEUuTk9STUFMO1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbigncmVzdG9yZScsIHRhcmdldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFLkVESVRBQkxFO1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbignY29udmVydCcsIHRhcmdldCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoYW5kbGUgRG91YmxlIGNsaWNrIFxyXG4gICAgICogQHBhcmFtIHtldmVudH0gZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSk7XHJcbiAgICAgICAgdGhpcy5jaGFuZ2VTdGF0ZSh0YXJnZXQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIGhhbmRsZSBtb3VzZSBkb3duXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25Nb3VzZURvd246IGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IFNUQVRFLkVESVRBQkxFIHx8IHV0aWwuaXNSaWdodEJ1dHRvbihlKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1dGlsLnByZXZlbnREZWZhdWx0KGUpO1xyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdXRpbC5nZXRUYXJnZXQoZSksXHJcbiAgICAgICAgICAgIHRhZyA9IHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGlmICh0YWcgPT09ICdCVVRUT04nIHx8IHRhZyA9PT0gJ0lOUFVUJyB8fCAhdXRpbC5oYXNDbGFzcyh0YXJnZXQsIHRoaXMudmFsdWVDbGFzcykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wb3MgPSB0aGlzLnJvb3QuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnVzZUhlbHBlcikge1xyXG4gICAgICAgICAgICB0aGlzLmVuYWJsZUhlbHBlcih7XHJcbiAgICAgICAgICAgICAgICB4OiBlLmNsaWVudFggLSB0aGlzLnBvcy5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgeTogZS5jbGllbnRZIC0gdGhpcy5wb3MudG9wXHJcbiAgICAgICAgICAgIH0sIHRhcmdldC5pbm5lclRleHQgfHwgdGFyZ2V0LnRleHRDb250ZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubW92ZSA9IHR1aS51dGlsLmJpbmQodGhpcy5fb25Nb3VzZU1vdmUsIHRoaXMpO1xyXG4gICAgICAgIHRoaXMudXAgPSB0dWkudXRpbC5iaW5kKHRoaXMuX29uTW91c2VVcCwgdGhpcywgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgdXRpbC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3ZlKTtcclxuICAgICAgICB1dGlsLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy51cCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGFuZGxlIG1vdXNlIG1vdmUgXHJcbiAgICAgKiBAcGFyYW0ge2V2ZW50fSBtZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX29uTW91c2VNb3ZlOiBmdW5jdGlvbihtZSkge1xyXG4gICAgICAgIGlmICghdGhpcy51c2VIZWxwZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldEhlbHBlckxvY2F0aW9uKHtcclxuICAgICAgICAgICAgeDogbWUuY2xpZW50WCAtIHRoaXMucG9zLmxlZnQsXHJcbiAgICAgICAgICAgIHk6IG1lLmNsaWVudFkgLSB0aGlzLnBvcy50b3BcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIYW5kbGUgbW91c2UgdXBcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCBBIHRhcmdldCBcclxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IHVlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfb25Nb3VzZVVwOiBmdW5jdGlvbih0YXJnZXQsIHVlKSB7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlSGVscGVyKCk7XHJcblxyXG4gICAgICAgIHZhciB0b0VsID0gdXRpbC5nZXRUYXJnZXQodWUpLFxyXG4gICAgICAgICAgICBtb2RlbCA9IHRoaXMubW9kZWwsXHJcbiAgICAgICAgICAgIG5vZGUgPSBtb2RlbC5maW5kKHRhcmdldC5pZCksXHJcbiAgICAgICAgICAgIHRvTm9kZSA9IG1vZGVsLmZpbmQodG9FbC5pZCksXHJcbiAgICAgICAgICAgIGlzRGlzYWJsZSA9IG1vZGVsLmlzRGlzYWJsZSh0b05vZGUsIG5vZGUpO1xyXG5cclxuICAgICAgICBpZiAobW9kZWwuZmluZCh0b0VsLmlkKSAmJiB0b0VsLmlkICE9PSB0YXJnZXQuaWQgJiYgIWlzRGlzYWJsZSkge1xyXG4gICAgICAgICAgICBtb2RlbC5tb3ZlKHRhcmdldC5pZCwgbm9kZSwgdG9FbC5pZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1dGlsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdmUpO1xyXG4gICAgICAgIHV0aWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLnVwKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaG93IHVwIGd1aWRlIGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwb3MgQSBlbGVtZW50IHBvc2l0aW9uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgQSBlbGVtZW50IHRleHQgdmFsdWVcclxuICAgICAqL1xyXG4gICAgZW5hYmxlSGVscGVyOiBmdW5jdGlvbihwb3MsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmhlbHBlckVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgdGhpcy5yb290LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5oZWxwZXJFbGVtZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaGVscGVyRWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgZ3VpZGUgZWxtZWVudCBsb2NhdGlvblxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBvcyBBIHBvc2l0aW9uIHRvIG1vdmVcclxuICAgICAqL1xyXG4gICAgc2V0SGVscGVyTG9jYXRpb246IGZ1bmN0aW9uKHBvcykge1xyXG5cclxuICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUubGVmdCA9IHBvcy54ICsgdGhpcy5oZWxwZXJQb3MueCArICdweCc7XHJcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLnRvcCA9IHBvcy55ICsgdGhpcy5oZWxwZXJQb3MueSArICdweCc7XHJcbiAgICAgICAgdGhpcy5oZWxwZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIaWRlIGd1aWRlIGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgZGlzYWJsZUhlbHBlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGVscGVyRWxlbWVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmhlbHBlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWFrZSBodG1sIFxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgQSBkcmF3IGRhdGFcclxuICAgICAqIEBwYXJhbSB7UGF0aH0gYmVmb3JlUGF0aCBBIHBhdGggb2Ygc3VidHJlZVxyXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBodG1sXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfZ2V0SHRtbDogZnVuY3Rpb24oa2V5cykge1xyXG4gICAgICAgIHZhciBtb2RlbCA9IHRoaXMubW9kZWwsXHJcbiAgICAgICAgICAgIGh0bWwsXHJcbiAgICAgICAgICAgIGNoaWxkRWwgPSBbXSxcclxuICAgICAgICAgICAgbm9kZSxcclxuICAgICAgICAgICAgdG1wbCxcclxuICAgICAgICAgICAgZGVwdGgsXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBsYWJlbCxcclxuICAgICAgICAgICAgcmF0ZSxcclxuICAgICAgICAgICAgbWFwO1xyXG5cclxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGVsKSB7XHJcbiAgICAgICAgICAgIG5vZGUgPSBtb2RlbC5maW5kKGVsKTtcclxuICAgICAgICAgICAgZGVwdGggPSBub2RlLmRlcHRoO1xyXG4gICAgICAgICAgICBzdGF0ZSA9IHRoaXNbbm9kZS5zdGF0ZSArICdTZXQnXVswXTtcclxuICAgICAgICAgICAgbGFiZWwgPSB0aGlzW25vZGUuc3RhdGUgKyAnU2V0J11bMV07XHJcbiAgICAgICAgICAgIHJhdGUgPSB0aGlzLmRlcHRoTGFiZWxzW2RlcHRoIC0gMV0gfHwgJyc7XHJcbiAgICAgICAgICAgIG1hcCA9IHtcclxuICAgICAgICAgICAgICAgIFN0YXRlOiBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIFN0YXRlTGFiZWw6IGxhYmVsLFxyXG4gICAgICAgICAgICAgICAgTm9kZUlEOiBub2RlLmlkLFxyXG4gICAgICAgICAgICAgICAgRGVwdGg6IGRlcHRoLFxyXG4gICAgICAgICAgICAgICAgVGl0bGU6IG5vZGUudmFsdWUsXHJcbiAgICAgICAgICAgICAgICBWYWx1ZUNsYXNzOiB0aGlzLnZhbHVlQ2xhc3MsXHJcbiAgICAgICAgICAgICAgICBTdWJUcmVlOiB0aGlzLnN1YnRyZWVDbGFzcyxcclxuICAgICAgICAgICAgICAgIERpc3BsYXk6IChub2RlLnN0YXRlID09PSAnb3BlbicpID8gJycgOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICBEZXB0aExhYmVsOiByYXRlXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAodHVpLnV0aWwuaXNOb3RFbXB0eShub2RlLmNoaWxkS2V5cykpIHtcclxuICAgICAgICAgICAgICAgIHRtcGwgPSB0aGlzLnRlbXBsYXRlLkVER0VfTk9ERTtcclxuICAgICAgICAgICAgICAgIG1hcC5DaGlsZHJlbiA9IHRoaXMuX2dldEh0bWwobm9kZS5jaGlsZEtleXMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdG1wbCA9IHRoaXMudGVtcGxhdGUuTEVBUF9OT0RFO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbCA9IHRtcGwucmVwbGFjZSgvXFx7XFx7KFteXFx9XSspXFx9XFx9L2csIGZ1bmN0aW9uKG1hdGNoZWRTdHJpbmcsIG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXBbbmFtZV0gfHwgJyc7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY2hpbGRFbC5wdXNoKGVsKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgaHRtbCA9IGNoaWxkRWwuam9pbignJyk7XHJcblxyXG4gICAgICAgIHJldHVybiBodG1sO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZSB2aWV3LlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGFjdFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxyXG4gICAgICovXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uKGFjdCwgdGFyZ2V0KSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24oYWN0LCB0YXJnZXQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFjdGlvbiBcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIEEgdHlwZSBvZiBhY3Rpb24gXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0IEEgdGFyZ2V0XHJcbiAgICAgKi9cclxuICAgIGFjdGlvbjogZnVuY3Rpb24odHlwZSwgdGFyZ2V0KSB7XHJcbiAgICAgICAgdGhpcy5fYWN0aW9uTWFwID0gdGhpcy5fYWN0aW9uTWFwIHx8IHtcclxuICAgICAgICAgICAgcmVmcmVzaDogdGhpcy5fcmVmcmVzaCxcclxuICAgICAgICAgICAgcmVuYW1lOiB0aGlzLl9yZW5hbWUsXHJcbiAgICAgICAgICAgIHRvZ2dsZTogdGhpcy5fdG9nZ2xlTm9kZSxcclxuICAgICAgICAgICAgc2VsZWN0OiB0aGlzLl9zZWxlY3QsXHJcbiAgICAgICAgICAgIHVuc2VsZWN0OiB0aGlzLl91blNlbGVjdCxcclxuICAgICAgICAgICAgY29udmVydDogdGhpcy5fY29udmVydCxcclxuICAgICAgICAgICAgcmVzdG9yZTogdGhpcy5fcmVzdG9yZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fYWN0aW9uTWFwW3R5cGUgfHwgJ3JlZnJlc2gnXS5jYWxsKHRoaXMsIHRhcmdldCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hhbmdlIG5vZGUgc3RhdGVcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBub2RlIEEgaW5mb3JtdGlvbiB0byBub2RlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfY2hhbmdlTm9kZVN0YXRlOiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChub2RlLmlkKTtcclxuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgY2xzID0gcGFyZW50LmNsYXNzTmFtZTtcclxuXHJcbiAgICAgICAgaWYgKHR1aS51dGlsLmlzRW1wdHkobm9kZS5jaGlsZEtleXMpKSB7XHJcbiAgICAgICAgICAgIGNscyA9ICdsZWFwX25vZGUgJyArIHRoaXNbbm9kZS5zdGF0ZSArICdTZXQnXVswXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjbHMgPSAnZWRnZV9ub2RlICcgKyB0aGlzW25vZGUuc3RhdGUgKyAnU2V0J11bMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJlbnQuY2xhc3NOYW1lID0gY2xzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENoYW5nZSBzdGF0ZSB0byBlZGl0IFxyXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfY29udmVydDogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgIHZhciBpZCA9IGVsZW1lbnQuaWQsXHJcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLm1vZGVsLmZpbmQoaWQpLFxyXG4gICAgICAgICAgICBsYWJlbCA9IG5vZGUudmFsdWUsXHJcbiAgICAgICAgICAgIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgIHRoaXMuaW5wdXRFbGVtZW50LnZhbHVlID0gbGFiZWw7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gZWxlbWVudDtcclxuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMuaW5wdXRFbGVtZW50LCBlbGVtZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQuZm9jdXMoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBcHBseSBub2RlIG5hbWVcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgQSB0YXJnZXQgZWxlbWVudFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX3Jlc3RvcmU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQudmFsdWUgPSAnJztcclxuXHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMuaW5wdXRFbGVtZW50KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEcmF3IGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIEEgaHRtbCBtYWRlIGJ5IGRhdGFcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJlbnQgQSBwYXJlbnQgZWxlbWVudFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqXHJcbiAgICAgKi9cclxuICAgIF9kcmF3OiBmdW5jdGlvbihodG1sLCBwYXJlbnQpIHtcclxuICAgICAgICB2YXIgcm9vdCA9IHBhcmVudCB8fCB0aGlzLnJvb3Q7XHJcbiAgICAgICAgcm9vdC5pbm5lckhUTUwgPSBodG1sO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBsYWJlbCBieSBkZXB0aFxyXG4gICAgICogQGFwaVxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGVwdGhMYWJlbHMgQSBkZXB0aCBsYWJlbCBhcnJheVxyXG4gICAgICovXHJcbiAgICBzZXREZXB0aExhYmVsczogZnVuY3Rpb24oZGVwdGhMYWJlbHMpIHtcclxuICAgICAgICB0aGlzLmRlcHRoTGFiZWxzID0gZGVwdGhMYWJlbHM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVmcmVzaCBub2RlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICoqL1xyXG4gICAgX3JlZnJlc2g6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5tb2RlbC50cmVlSGFzaC5yb290LmNoaWxkS2V5cztcclxuICAgICAgICB0aGlzLl9kcmF3KHRoaXMuX2dldEh0bWwoZGF0YSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmFtZSBub2RlXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZSBBIG1vZGVsIGluZm9ybWF0aW9uIFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX3JlbmFtZTogZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZS5pZCk7XHJcbiAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSBub2RlLnZhbHVlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICogVG9nZ2xlIG1vZGVsXHJcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBub2RlIEEgbm9kZSBpbmZvcm1hdGlvblxyXG4gICAgKiBAcHJpdmF0ZVxyXG4gICAgKiovXHJcbiAgICBfdG9nZ2xlTm9kZTogZnVuY3Rpb24obm9kZSkge1xyXG5cclxuICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGUuaWQpLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUsXHJcbiAgICAgICAgICAgIGNoaWxkV3JhcCA9IHBhcmVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndWwnKVswXSxcclxuICAgICAgICAgICAgYnV0dG9uID0gcGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdidXR0b24nKVswXSxcclxuICAgICAgICAgICAgc3RhdGUgPSB0aGlzW25vZGUuc3RhdGUgKyAnU2V0J11bMF0sXHJcbiAgICAgICAgICAgIGxhYmVsID0gdGhpc1tub2RlLnN0YXRlICsgJ1NldCddWzFdLFxyXG4gICAgICAgICAgICBpc09wZW4gPSBub2RlLnN0YXRlID09PSAnb3Blbic7XHJcblxyXG4gICAgICAgIHBhcmVudC5jbGFzc05hbWUgPSBwYXJlbnQuY2xhc3NOYW1lLnJlcGxhY2UodGhpcy5vcGVuU2V0WzBdLCAnJykucmVwbGFjZSh0aGlzLmNsb3NlU2V0WzBdLCAnJykgKyBzdGF0ZTtcclxuICAgICAgICBjaGlsZFdyYXAuc3R5bGUuZGlzcGxheSA9IGlzT3BlbiA/ICcnIDogJ25vbmUnO1xyXG4gICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBsYWJlbDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZWxlY3Qgbm9kZVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG5vZGUgQSB0YXJnZXQgbm9kZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX3NlbGVjdDogZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciB2YWx1ZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobm9kZS5pZCk7XHJcblxyXG4gICAgICAgIGlmICh0dWkudXRpbC5pc0V4aXN0eSh2YWx1ZUVsKSkge1xyXG4gICAgICAgICAgICB2YWx1ZUVsLmNsYXNzTmFtZSA9IHZhbHVlRWwuY2xhc3NOYW1lLnJlcGxhY2UoJyAnICsgdGhpcy5vbnNlbGVjdENsYXNzLCAnJykgKyAnICcgKyB0aGlzLm9uc2VsZWN0Q2xhc3M7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVuc2VsZWN0IG5vZGVcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBub2RlIEEgdGFyZ2V0IG5vZGVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiovXHJcbiAgICBfdW5TZWxlY3Q6IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgdmFsdWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5vZGUuaWQpO1xyXG5cclxuICAgICAgICBpZiAodHVpLnV0aWwuaXNFeGlzdHkodmFsdWVFbCkgJiYgdXRpbC5oYXNDbGFzcyh2YWx1ZUVsLCB0aGlzLm9uc2VsZWN0Q2xhc3MpKSB7XHJcbiAgICAgICAgICAgIHZhbHVlRWwuY2xhc3NOYW1lID0gdmFsdWVFbC5jbGFzc05hbWUucmVwbGFjZSgnICcgKyB0aGlzLm9uc2VsZWN0Q2xhc3MsICcnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmVlO1xyXG4iLCIvKipcclxuICogQGZpbGVvdmVydmlldyBVcGRhdGUgdmlldyBhbmQgY29udHJvbCB0cmVlIGRhdGFcclxuICogQGF1dGhvciBOSE4gRW50LiBGRSBkZXYgdGVhbS48ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBAY29uc3RydWN0b3IgVHJlZU1vZGVsXHJcbiAqICoqL1xyXG52YXIgVHJlZU1vZGVsID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBUcmVlTW9kZWwucHJvdG90eXBlICove1xyXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucywgdHJlZSkge1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBIGNvdW50IGZvciBub2RlIGlkZW50aXR5IG51bWJlclxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgdmlldyB0aGF0IG9ic2VydmUgbW9kZWwgY2hhbmdlXHJcbiAgICAgICAgICogQHR5cGUge3R1aS5jb21wb25lbnQuVHJlZX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRyZWUgPSB0cmVlO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWZhdWx0IHN0YXRlIG9mIG5vZGVcclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubm9kZURlZmF1bHRTdGF0ZSA9IG9wdGlvbnMuZGVmYXVsdFN0YXRlIHx8ICdjbG9zZSc7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgYnVmZmVyIFxyXG4gICAgICAgICAqIEB0eXBlIHtudWxsfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQSBkZXB0aFxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kZXB0aCA9IDA7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEEgbWlsaXNlY29uIHRpbWUgdG8gbWFrZSBub2RlIElEXHJcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVHJlZSBoYXNoXHJcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRyZWVIYXNoID0ge307XHJcblxyXG4gICAgICAgIHRoaXMudHJlZUhhc2hbJ3Jvb3QnXSA9IHRoaXMubWFrZU5vZGUoMCwgJ3Jvb3QnLCAncm9vdCcpO1xyXG4gICAgICAgIHRoaXMuY29ubmVjdCh0cmVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgbW9kZWwgd2l0aCB0cmVlIGRhdGFcclxuICAgICAqIEBwYXJhbSB7YXJyYXl9IGRhdGEgIEEgdHJlZSBkYXRhXHJcbiAgICAgKi9cclxuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICB0aGlzLnRyZWVIYXNoLnJvb3QuY2hpbGRLZXlzID0gdGhpcy5fbWFrZVRyZWVIYXNoKGRhdGEpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENoYW5nZSBoaWVyYXJjaHkgZGF0YSB0byBoYXNoIGxpc3QuXHJcbiAgICAgKiBAcGFyYW0ge2FycmF5fSBkYXRhIEEgdHJlZSBkYXRhIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudElkIEEgcGFyZW50IG5vZGUgaWRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9tYWtlVHJlZUhhc2g6IGZ1bmN0aW9uKGRhdGEsIHBhcmVudElkKSB7XHJcblxyXG4gICAgICAgIHZhciBjaGlsZEtleXMgPSBbXSxcclxuICAgICAgICAgICAgaWQ7XHJcblxyXG4gICAgICAgIHRoaXMuZGVwdGggPSB0aGlzLmRlcHRoICsgMTtcclxuXHJcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChkYXRhLCBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIGlkID0gdGhpcy5fZ2V0SWQoKTtcclxuICAgICAgICAgICAgdGhpcy50cmVlSGFzaFtpZF0gPSB0aGlzLm1ha2VOb2RlKHRoaXMuZGVwdGgsIGlkLCBlbGVtZW50LnZhbHVlLCBwYXJlbnRJZCk7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmNoaWxkcmVuICYmIHR1aS51dGlsLmlzTm90RW1wdHkoZWxlbWVudC5jaGlsZHJlbikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZUhhc2hbaWRdLmNoaWxkS2V5cyA9IHRoaXMuX21ha2VUcmVlSGFzaChlbGVtZW50LmNoaWxkcmVuLCBpZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2hpbGRLZXlzLnB1c2goaWQpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLmRlcHRoID0gdGhpcy5kZXB0aCAtIDE7XHJcbiAgICAgICAgY2hpbGRLZXlzLnNvcnQodHVpLnV0aWwuYmluZCh0aGlzLnNvcnQsIHRoaXMpKTtcclxuICAgICAgICByZXR1cm4gY2hpbGRLZXlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBub2RlXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVwdGggQSBkZXB0aCBvZiBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgQSBub2RlIElEXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgQSB2YWx1ZSBvZiBub2RlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50SWQgQSBwYXJlbnQgbm9kZSBJRFxyXG4gICAgICogQHJldHVybiB7e3ZhbHVlOiAqLCBwYXJlbnRJZDogKCp8c3RyaW5nKSwgaWQ6ICp9fVxyXG4gICAgICovXHJcbiAgICBtYWtlTm9kZTogZnVuY3Rpb24oZGVwdGgsIGlkLCB2YWx1ZSwgcGFyZW50SWQpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBkZXB0aDogZGVwdGgsXHJcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcclxuICAgICAgICAgICAgcGFyZW50SWQ6IChkZXB0aCA9PT0gMCkgPyBudWxsIDogKHBhcmVudElkIHx8ICdyb290JyksXHJcbiAgICAgICAgICAgIHN0YXRlOiB0aGlzLm5vZGVEZWZhdWx0U3RhdGUsXHJcbiAgICAgICAgICAgIGlkOiBpZFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFrZSBhbmQgcmV0dXJuIG5vZGUgSURcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIF9nZXRJZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5jb3VudCA9IHRoaXMuY291bnQgKyAxO1xyXG4gICAgICAgIHJldHVybiAnbm9kZV8nICsgdGhpcy5kYXRlICsgJ18nICsgdGhpcy5jb3VudDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaW5kIG5vZGUgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IHRvIGZpbmQgbm9kZVxyXG4gICAgICogQHJldHVybiB7b2JqZWN0fHVuZGVmaW5lZH1cclxuICAgICAqL1xyXG4gICAgZmluZDogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHJlZUhhc2hba2V5XTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgbm9kZSBhbmQgY2hpbGQgbm9kZXNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgdG8gcmVtb3ZlXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQGFwaVxyXG4gICAgICAgICAqIEBldmVudCBUcmVlTW9kZWwjcmVtb3ZlXHJcbiAgICAgICAgICogQHBhcmFtIHt7aWQ6IHN0cmluZ319IHJlbW92ZWQgLSBpZFxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogdHJlZS5tb2RlbC5vbigncmVtb3ZlJywgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAqICAgICBhbGVydCgncmVtb3ZlZCAtJyArICBkYXRhLmlkICk7XHJcbiAgICAgICAgICogfSk7XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIHJlcyA9IHRoaXMuaW52b2tlKCdyZW1vdmUnLCB7IGlkOiBrZXkgfSk7XHJcblxyXG4gICAgICAgIGlmICghcmVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucmVtb3ZlS2V5KGtleSk7XHJcbiAgICAgICAgdGhpcy50cmVlSGFzaFtrZXldID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5ub3RpZnkoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgbm9kZSBrZXlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgdG8gcmVtb3ZlXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUtleTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmQoa2V5KTtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmZpbmQobm9kZS5wYXJlbnRJZCk7XHJcblxyXG4gICAgICAgIHBhcmVudC5jaGlsZEtleXMgPSB0dWkudXRpbC5maWx0ZXIocGFyZW50LmNoaWxkS2V5cywgZnVuY3Rpb24oY2hpbGRLZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoaWxkS2V5ICE9PSBrZXk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSB0byBtb3ZlIG5vZGVcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlIEEgbm9kZSBvYmplY3QgdG8gbW92ZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldElkIEEgdGFyZ2V0IElEIHRvIGluc2VydFxyXG4gICAgICovXHJcbiAgICBtb3ZlOiBmdW5jdGlvbihrZXksIG5vZGUsIHRhcmdldElkKSB7XHJcblxyXG4gICAgICAgIHRoaXMucmVtb3ZlS2V5KGtleSk7XHJcbiAgICAgICAgdGhpcy50cmVlSGFzaFtrZXldID0gbnVsbDtcclxuICAgICAgICB0aGlzLmluc2VydChub2RlLCB0YXJnZXRJZCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluc2VydCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZSBBIG5vZGUgb2JqZWN0IHRvIGluc2VydFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFt0YXJnZXRJZF0gQSB0YXJnZXQgSUQgdG8gaW5zZXJ0XHJcbiAgICAgKi9cclxuICAgIGluc2VydDogZnVuY3Rpb24obm9kZSwgdGFyZ2V0SWQpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy5maW5kKHRhcmdldElkIHx8ICdyb290Jyk7XHJcblxyXG4gICAgICAgIGlmICghdGFyZ2V0LmNoaWxkS2V5cykge1xyXG4gICAgICAgICAgICB0YXJnZXQuY2hpbGRLZXlzID0gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0YXJnZXQuY2hpbGRLZXlzLnB1c2gobm9kZS5pZCk7XHJcbiAgICAgICAgbm9kZS5kZXB0aCA9IHRhcmdldC5kZXB0aCArIDE7XHJcbiAgICAgICAgbm9kZS5wYXJlbnRJZCA9IHRhcmdldElkO1xyXG4gICAgICAgIHRhcmdldC5jaGlsZEtleXMuc29ydCh0dWkudXRpbC5iaW5kKHRoaXMuc29ydCwgdGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLnRyZWVIYXNoW25vZGUuaWRdID0gbm9kZTtcclxuXHJcbiAgICAgICAgdGhpcy5ub3RpZnkoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBIG5vdGlmeSB0cmVlXHJcbiAgICAgKi9cclxuICAgIG5vdGlmeTogZnVuY3Rpb24odHlwZSwgdGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKHRoaXMudHJlZSkge1xyXG4gICAgICAgICAgICB0aGlzLnRyZWUubm90aWZ5KHR5cGUsIHRhcmdldCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbm5lY3QgdmlldyBhbmQgbW9kZWxcclxuICAgICAqIEBwYXJhbSB7VHJlZX0gdHJlZVxyXG4gICAgICovXHJcbiAgICBjb25uZWN0OiBmdW5jdGlvbih0cmVlKSB7XHJcbiAgICAgICAgaWYgKCF0cmVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50cmVlID0gdHJlZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5hbWUgbm9kZVxyXG4gICAgICogQHBhcmFtIHtzdGlybmd9IGtleSBBIGtleSB0byByZW5hbWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBBIHZhbHVlIHRvIGNoYW5nZVxyXG4gICAgICovXHJcbiAgICByZW5hbWU6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQGFwaVxyXG4gICAgICAgICAqIEBldmVudCBUcmVlTW9kZWwjcmVuYW1lXHJcbiAgICAgICAgICogQHBhcmFtIHt7aWQ6IHN0cmluZywgdmFsdWU6IHN0cmluZ319IGV2ZW50RGF0YVxyXG4gICAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAgICogLy8g64W465OcIOydtOumhCDrs4Dqsr3si5wg67Cc7IOdXHJcbiAgICAgICAgICogdHJlZS5tb2RlbC5vbigncmVuYW1lJywgZnVuY3Rpb24ob2JqZWN0KSB7XHJcbiAgICAgICAgICogICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWxlY3RWYWx1ZScpLnZhbHVlID0gb2JqZWN0LnZhbHVlICsgJ+uFuOuTnCDsnbTrpoQg67OA6rK9JztcclxuICAgICAgICAgKiAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICogfSk7XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIHJlcyA9IHRoaXMuaW52b2tlKCdyZW5hbWUnLCB7aWQ6IGtleSwgdmFsdWU6IHZhbHVlfSk7XHJcbiAgICAgICAgaWYgKCFyZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmQoa2V5KTtcclxuICAgICAgICBub2RlLnZhbHVlID0gdmFsdWU7XHJcblxyXG4gICAgICAgIHRoaXMubm90aWZ5KCdyZW5hbWUnLCBub2RlKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2Ugbm9kZSBzdGF0ZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHZhbHVlIHRvIGNoYW5nZVxyXG4gICAgICovXHJcbiAgICBjaGFuZ2VTdGF0ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmQoa2V5KTtcclxuICAgICAgICBub2RlLnN0YXRlID0gKG5vZGUuc3RhdGUgPT09ICdvcGVuJykgPyAnY2xvc2UnIDogJ29wZW4nO1xyXG4gICAgICAgIHRoaXMubm90aWZ5KCd0b2dnbGUnLCBub2RlKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFNldCBidWZmZXIgdG8gc2F2ZSBzZWxlY3RlZCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IFRoZSBrZXkgb2Ygc2VsZWN0ZWQgbm9kZVxyXG4gICAgICoqL1xyXG4gICAgc2V0QnVmZmVyOiBmdW5jdGlvbihrZXkpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jbGVhckJ1ZmZlcigpO1xyXG5cclxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZmluZChrZXkpO1xyXG5cclxuICAgICAgICB0aGlzLm5vdGlmeSgnc2VsZWN0Jywgbm9kZSk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBhcGlcclxuICAgICAgICAgKiBAZXZlbnQgVHJlZU1vZGVsI3NlbGVjdFxyXG4gICAgICAgICAqIEBwYXJhbSB7e2lkOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd9fSBldmVudERhdGFcclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIC8vIOuFuOuTnOulvCDshKDtg53si5wg67Cc7IOdXHJcbiAgICAgICAgICogdHJlZS5tb2RlbC5vbignc2VsZWN0JywgZnVuY3Rpb24ob2JqZWN0KSB7XHJcbiAgICAgICAgICogICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWxlY3RWYWx1ZScpLnZhbHVlID0gb2JqZWN0LnZhbHVlO1xyXG4gICAgICAgICAqIH0pO1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZmlyZSgnc2VsZWN0Jywge2lkOiBrZXksIHZhbHVlOiBub2RlLnZhbHVlIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW1wdHkgYnVmZmVyXHJcbiAgICAgKi9cclxuICAgIGNsZWFyQnVmZmVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmJ1ZmZlcikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm5vdGlmeSgndW5zZWxlY3QnLCB0aGlzLmJ1ZmZlcik7XHJcbiAgICAgICAgdGhpcy5idWZmZXIgPSBudWxsO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayBtb3ZhYmxlIHBvc2l0b25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkZXN0IEEgZGVzdGluYXRpb24gbm9kZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5vZGUgQSB0YXJnZXQgbm9kZVxyXG4gICAgICovXHJcbiAgICBpc0Rpc2FibGU6IGZ1bmN0aW9uKGRlc3QsIG5vZGUpIHtcclxuICAgICAgICBpZiAoZGVzdC5kZXB0aCA9PT0gbm9kZS5kZXB0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnBhcmVudElkKSB7XHJcbiAgICAgICAgICAgIGlmIChkZXN0LmlkID09PSBub2RlLnBhcmVudElkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZGVzdC5wYXJlbnRJZCA9PT0gbm9kZS5pZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc0Rpc2FibGUodGhpcy5maW5kKGRlc3QucGFyZW50SWQpLCBub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTb3J0IGJ5IHRpdGxlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGlkXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmlkXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKHBpZCwgbmlkKSB7XHJcbiAgICAgICAgdmFyIHAgPSB0aGlzLmZpbmQocGlkKSxcclxuICAgICAgICAgICAgbiA9IHRoaXMuZmluZChuaWQpO1xyXG5cclxuICAgICAgICBpZiAoIXAgfHwgIW4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocC52YWx1ZSA8IG4udmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocC52YWx1ZSA+IG4udmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFRyZWVNb2RlbCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVNb2RlbDtcclxuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEhlbHBlciBvYmplY3QgdG8gbWFrZSBlYXN5IHRyZWUgZWxlbWVudHNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgdXRpbFxuICovXG52YXIgdXRpbCA9IHtcbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgdG8gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIEEgbmFtZSBvZiBldmVudCBcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYWRkXG4gICAgICovXG4gICAgYWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGZyb20gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IEEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIEEgbmFtZSBvZiBldmVudFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZW1vdmVcbiAgICAgKi9cbiAgICByZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5kZXRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGFyZ2V0IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge2V2ZW50fSBlIEV2ZW50IG9iamVjdFxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSBcbiAgICAgKi9cbiAgICBnZXRUYXJnZXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGUgZWxlbWVudCBoYXMgc3BlY2lmaWMgY2xhc3Mgb3Igbm90XG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3MgdG8gZmluZFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICovXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgICBpZiAoIWVsZW1lbnQgfHwgIWNsYXNzTmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCcjdXRpbC5oYXNDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpIOyXmOumrOuovO2KuOqwgCDsnoXroKXrkJjsp4Ag7JWK7JWY7Iq164uI64ukLiBcXG5fX2VsZW1lbnQnICsgZWxlbWVudCArICcsX19jbGFzc05hbWUnICsgY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjbHMgPSBlbGVtZW50LmNsYXNzTmFtZTtcblxuICAgICAgICBpZiAoY2xzLmluZGV4T2YoY2xhc3NOYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGVsZW1lbnQgYnkgY2xhc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCBBIHRhcmdldCBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSBBIG5hbWUgb2YgY2xhc3NcbiAgICAgKiBAcmV0dXJuIHthcnJheX1cbiAgICAgKi9cbiAgICBnZXRFbGVtZW50c0J5Q2xhc3M6IGZ1bmN0aW9uKHRhcmdldCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmICh0YXJnZXQucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNsYXNzTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFsbCA9IHRhcmdldC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpLFxuICAgICAgICAgICAgZmlsdGVyID0gW107XG5cbiAgICAgICAgYWxsID0gdHVpLnV0aWwudG9BcnJheShhbGwpO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goYWxsLCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgdmFyIGNscyA9IGVsLmNsYXNzTmFtZSB8fCAnJztcbiAgICAgICAgICAgIGlmIChjbHMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGZpbHRlci5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgd2hldGhlciB0aGUgY2xpY2sgZXZlbnQgYnkgcmlnaHQgYnV0dG9uIG9yIG5vdFxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gXG4gICAgICovXG4gICAgaXNSaWdodEJ1dHRvbjogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgaXNSaWdodCA9IHV0aWwuX2dldEJ1dHRvbihlKSA9PT0gMjtcbiAgICAgICAgcmV0dXJuIGlzUmlnaHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0IG9yIG5vdFxuICAgICAqIEBwYXJhbSB7YXJyYXl9IHByb3BzIEEgcHJvcGVydHkgXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB0ZXN0UHJvcDogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuICAgICAgICAgICAgaSA9IDA7XG5cbiAgICAgICAgZm9yICg7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHByb3BzW2ldIGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCBkZWZhdWx0IGV2ZW50IFxuICAgICAqIEBwYXJhbSB7ZXZlbnR9IGUgRXZlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemF0aW9uIGZvciBldmVudCBidXR0b24gcHJvcGVydHkgXG4gICAgICogMDogRmlyc3QgbW91c2UgYnV0dG9uLCAyOiBTZWNvbmQgbW91c2UgYnV0dG9uLCAxOiBDZW50ZXIgYnV0dG9uXG4gICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBFdmVudCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfSBcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRCdXR0b246IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGJ1dHRvbixcbiAgICAgICAgICAgIHByaW1hcnkgPSAnMCwxLDMsNSw3JyxcbiAgICAgICAgICAgIHNlY29uZGFyeSA9ICcyLDYnLFxuICAgICAgICAgICAgd2hlZWwgPSAnNCc7XG5cbiAgICAgICAgaWYgKGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoJ01vdXNlRXZlbnRzJywgJzIuMCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gZS5idXR0b247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidXR0b24gPSBlLmJ1dHRvbiArICcnO1xuICAgICAgICAgICAgaWYgKHByaW1hcnkuaW5kZXhPZihidXR0b24pID4gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2Vjb25kYXJ5LmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHdoZWVsLmluZGV4T2YoYnV0dG9uKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=
