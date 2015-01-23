/**
 * @fileoverview 트리를 구성하는 데이터를 조작, 데이터 변경사한 발생 시 뷰를 갱신함
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 * **/
ne.component.Tree.TreeModel = ne.util.defineClass(/** @lends TreeModel.prototype */{
    init: function(options, tree) {

        /**
         * 노드 고유아이디를 붙이기 위한 카운트, 갯수를 세는대 사용되진 않는다.
         * @type {number}
         */
        this.count = 0;

        /**
         * 모델의 변화를 구독하는 뷰들
         * @type {ne.component.Tree}
         */
        this.tree = tree;

        /**
         * 노드의 기본상태
         * @type {String}
         */
        this.nodeDefaultState = options.defaultState || 'close';

        /**
         * 이동시에 필요한 노드의 버퍼
         * @type {null}
         */
        this.buffer = null;

        /**
         * 노드의 깊이를 저장하기 위한 변수
         * @type {number}
         */
        this.depth = 0;

        /**
         * 아이디 생성을 위한 date
         * @type {number}
         */
        this.date = new Date().getTime();

        /**
         * 트리해시
         * @type {object}
         * { node_1532525: {
         *      value: value,
         *      childKeys: [],
         *      parentId: 'node1523',
         *      id: node_1532525
         * }}
         */
        this.treeHash = {};

        this.treeHash['root'] = this.makeNode(0, 'root', 'root');
        this.connect(tree);
    },

    /**
     * 모델에 트리형태의 데이터를 세팅함
     * 모델은 데이터를 받아 노드의 트리형태로 변경
     * @param {array} data 트리 입력데이터
     */
    setData: function(data) {
        this.treeHash.root.childKeys = this._makeTreeHash(data);
    },

    /**
     * 계층적 데이터 구조를, 해쉬리스트 형태로 변경한다.
     * @param {array} data 해쉬리스트형태로 변경시킬 트리 데이터
     * @param {string} parentId 새로운 해쉬값으로 입력되는 노드의 부모노드의 id
     * @private
     */
    _makeTreeHash: function(data, parentId) {

        var childKeys = [],
            id;

        this.depth = this.depth + 1;

        ne.util.forEach(data, function(element) {

            // 아이디를 키값으로 가지는 해쉬 추
            id = this._getId();

            this.treeHash[id] = this.makeNode(this.depth, id, element.value, parentId);

            // 자식노드가 있을 경우 재귀적으로 호출하여, 자식노드의 아이디리스트를 저장
            if (element.children) {
                this.treeHash[id].childKeys = this._makeTreeHash(element.children, id);
            }

            childKeys.push(id);
        }, this);

        this.depth = this.depth - 1;

        childKeys.sort(ne.util.bind(this.sort, this));

        return childKeys;
    },

    /**
     * 노드를 생성한다.
     * @param {number} depth 노드의 깊이
     * @param {string} id 노드의 아이디 값
     * @param {string} value 노드의 값
     * @param {string} parentId 부모 노드의 아이디
     * @returns {{value: *, parentId: (*|string), id: *}}
     */
    makeNode: function(depth, id, value, parentId) {
        return {
            depth: depth,
            value: value,
            parentId: depth === 0 ? null : (parentId || 'root'),
            state: this.nodeDefaultState,
            id: id
        };
    },

    /**
     * 트리에 부여 될 고유아이디를 만들어 리턴한다
     * @private
     * @return {String}
     */
    _getId: function() {
        this.count = this.count + 1;
        return 'node_' + this.date + '_' + this.count;
    },
    /**
     * 노드를 찾아서 리턴한다.
     * @param {string} key 찾을 노드의 키 값
     * @returns {object|undefined}
     */
    find: function(key) {
        return this.treeHash[key];
    },
    /**
     * 노드를 제거한다, 노드를 참조하고있는 부모의 자식목록에서도 제거한다.
     * @param {string} key 모델에서 제거할 노드의 키 값
     */
    remove: function(key) {
        // 참조된 값 먼저 제거
        var res = this.invoke('remove', { id: key });

        if (!res) {
            return;
        }

        this.removeKey(key);
        this.treeHash[key] = null;

        this.notify();
    },
    /**
     * 노드의 키값을 제거한다.
     * @param {string} key 제거할 노드의 키 값
     */
    removeKey: function(key) {
        var node = this.find(key);

        if (!node) {
            return;
        }

        // 자식 키 값을 제거한다.
        var parent = this.find(node.parentId);

        parent.childKeys = ne.util.filter(parent.childKeys, function(childKey) {
            return childKey !== key;
        });

    },
    /**
     * 노드를 이동시킨다
     * @param {string} key
     * @param {object} node
     * @param {string} targetId
     */
    move: function(key, node, targetId) {

        this.removeKey(key);
        this.treeHash[key] = null;
        this.insert(node, targetId);

    },
    /**
     * 노드를 삽입한다.
     * @param {object} node 삽입될 노드 값
     * @param {string} [targetId] 삽입할 노드의 부모가 될 타겟 아이디, 없으면 루트
     */
    insert: function(node, targetId) {

        var target = this.find(targetId || 'root');

        if (!target.childKeys) {
            target.childKeys = [];
        }

        target.childKeys.push(node.id);
        node.depth = target.depth + 1;
        node.parentId = targetId;
        // 정렬
        target.childKeys.sort(ne.util.bind(this.sort, this));

        this.treeHash[node.id] = node;

        this.notify();
    },

    /**
     * 트리를 갱신한다.
     */
    notify: function(type, target) {
        if (this.tree) {
            this.tree.notify(type, target);
        }
    },

    /**
     * 뷰와 모델을 연결한다. 모델에 변경이 일어날 경우, tree notify를 호출하여 뷰를 갱신한다.
     * @param {ne.component.Tree} tree
     */
    connect: function(tree) {
        if (!tree) {
            return;
        }
        this.tree = tree;
    },

    /**
     * 노드의 value를 변경한다.
     * @param {stirng} key 변경할 노드의 키값
     * @param {string} value 변경할 값
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
     * 노드의 상태(여닫힘)을 갱신한다.
     * @param {string} key 상태를 변경할 노드의 키값
     */
    changeState: function(key) {
        var node = this.find(key);
        node.state = node.state === 'open' ? 'close' : 'open';
        this.notify('toggle', node);
    },
    /**
     * 현재 선택된 노드를 버퍼에 저장한다
     * @param {String} key 선택된 노드 패스값
     **/
    setBuffer: function(key) {

        this.clearBuffer();

        var node = this.find(key);

        this.notify('select', node);
        this.fire('select', {id: key, value: node.value });

        this.buffer = node;
    },

    /**
     * 버퍼를 비운다
     **/
    clearBuffer: function() {

        if (!this.buffer) {
            return;
        }

        this.notify('unselect', this.buffer);
        this.buffer = null;

    },

    /**
     * 이동할 노드가, 이동할 대상 노드의 부모노드인지 확인한다.
     * @param {object} dest 이동할 대상 노드
     * @param {object} node 이동할 노드
     */
    isDisable: function(dest, node) {
        // 뎁스가 같으면 계층 구조에 있을 가능성이 없으니 바로 false를 리턴한다.
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
     * 타이틀에 따른 정렬
     * @param {string} pid
     * @param {string} nid
     * @returns {number}
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
ne.util.CustomEvents.mixin(ne.component.Tree.TreeModel);
