
/**
 * @fileoverview 트리를 구성하는 데이터를 조작, 데이터 변경사한 발생 시 뷰를 갱신함
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 * @todo 데이터파싱이 현재, 계층적 구조, 수평적 매트릭스 구조도 지원을 해야함.
 * @todo 수평적 매트릭스 구조일 경우, 통째로 갈아 없는 방법이 좋으나, 그 경우 상태 저장이 되지 못함
 * @todo 상태 저장과 함께 데이터 구조를 추출할 수 있는 방법이 필요. -> 고유아이디 구성, 아이디부분의 상태데이터를 저장하는 객체를 따로 둠 -. 단 아이디는 변경되지 말아야함.
 * @todo step1 (즉 제일먼저 데이터를 가져와서 할일은 아이디 부여)
 * @todo step2 아이디를 부여한 모델의 상태 데이터를 저장
 * @todo step3 모델갱신시 -> 모델데이터 갱신
 *
 * 모델을 해시 형태로 가져간다.
 *
 * hashTable { node_1532525: {
 *      value: value,
 *      childKeys: [],
 *      parentId: 'node1523',
 *      id: node_1532525
 * }}
 *
 * 찾기시 ID 바로 탐색.
 * function findNode(key) {
 *      return hashTable[key];
 * }
 *
 * 이동시 부모변경
 * function changeParent(node, parent) {
 *      // 이전 부모노드한테서 아이디를 제거한다.
 *      removeChild(node);
 *      node.parent = parent;
 *      // 새로운 부모한테 아이디를 넣어준다.
 *      parent.childKeys.push(node.id);
 * }
 *
 * 노드 제거
 * function removeChild(node) {
 *      var list = node.parent.childKeys;
 *      ne.util.filter(list, function(n) {
 *          return node.id !== n;
 *      });
 * }
 *
 * **/
ne.component.Tree.TreeModel = ne.util.defineClass(/** @lends TreeModel.prototype */{
    init: function(options, view) {
        /**
         * 노드 고유아이디를 붙이기 위한 카운트, 갯수를 세는대 사용되진 않는다.
         *
         * @type {number}
         */
        this.count = 0;
        /**
         * 모델의 변화를 구독하는 뷰들
         *
         * @type {Array}
         */
        this.views = [];
        /**
         * 노드의 기본상태
         *
         * @type {String}
         */
        this.nodeDefaultState = options.defaultState || 'close';
        /**
         * 복사및 붙여넣기시에 필요한 노드의 버퍼
         * @todo 복사및 붙여넣기 기능은 추후구현해야함
         *
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

        this.connect(view);
    },

    /**
     *
     * 모델에 트리형태의 데이터를 세팅함
     * 모델은 데이터를 받아 노드의 트리형태로 변경
     *
     * @param {Object} data 트리 입력데이터
     *
     * **/

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

        var childKeys = [];

        this.depth = this.depth + 1;

        ne.util.forEach(data, function(element) {

            // 아이디를 키값으로 가지는 해쉬 추
            var id = this._getId();

            this.treeHash[id] = this.makeNode(this.depth, id, element.value, parentId);

            // 자식노드가 있을 경우 재귀적으로 호출하여, 자식노드의 아이디리스트를 저장
            if (element.children) {
                this.treeHash[id].childKeys = this._makeTreeHash(element.children, id);
            }

            childKeys.push(id);
        }, this);

        this.depth = this.depth - 1;

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
     *
     * 트리에 부여 될 고유아이디를 만들어 리턴한다
     *
     * @private
     * @return {String}
     *
     **/
    _getId: function() {

        return 'node_' + this.date + '_' + this.count++;

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

        this.treeHash[node.id] = node;

        this.notify();
    },

    /**
     * 뷰를 갱신한다.
     */
    notify: function(type, target) {
        if (ne.util.isEmpty(this.views)) {
            return;
        }

        ne.util.forEach(this.views, function(view) {
            view.notify(type, target);
        });
    },

    /**
     * 뷰와 모델을 연결한다. 모델에 변경이 일어날 경우, view의 notify를 호출하여 뷰를 갱신한다.
     * @param view
     */
    connect: function(view) {
        if (!view) {
            return;
        }
        this.views.push(view);
        view.model = this.model;
    },

    /**
     * 노드의 value를 변경한다.
     * @param {stirng} key 변경할 노드의 키값
     * @param {string} value 변경할 값
     */
    rename: function(key, value) {
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
        this.buffer = node;
    },
    /**
     * 버퍼를 비운다
     *
     */
    clearBuffer: function() {
        if (!this.buffer) {
            return;
        }
        this.notify('unselect', this.buffer);
        this.buffer = null;
    },
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    ///**
    // * 모델이 변경이 일어날경우 갱신할 뷰를 등록함
    // *
    // * @param {Object} view 트리뷰
    // *
    // **/
    //
    //listen: function(view) {
    //
    //    this.views.push(view);
    //
    //},
    //
    ///**
    // *
    // * 모델이 뷰에 동작을 요청
    // *
    // * @private
    // * @param {String} type 뷰에 전달될 동작타입
    // * @param {Object} target 갱신대상이 될 타겟
    // *
    // * **/
    //
    //_notify: function(type, target) {
    //
    //    ne.util.forEach(this.views, function(view) {
    //        view.action(type, target);
    //    });
    //
    //},

    ///**
    // *
    // * 초기에 뷰에 요청될 최상단 노드들을 리턴해주는 메소드
    // *
    // *
    // * **/
    //getFirstChildren: function() {
    //    return this.nodes.childNodes;
    //},
    ///**
    // *
    // * 노드추가
    // *
    // * @param {String} path 노드가 추가될 부모의 위치값
    // * @param {Object} insertObject 추가될 노드의 정보
    // *
    // * **/
    //insertNode: function(path, insertDataList) {
    //
    //    if (!insertDataList) {
    //        insertDataList = {title: 'no Title'};
    //    }
    //
    //    if (!ne.util.isArray(insertDataList)) {
    //        insertDataList = [insertDataList];
    //    }
    //
    //    var target = null;
    //
    //    if (path) {
    //        target = this.findNode(path);
    //    }
    //    target = target || this.nodes;
    //    this._makeTree(insertDataList, target);
    //    this._notify('refresh', target);
    //},
    ///**
    // *
    // * 노드제거
    // *
    // * @param {String} path 제거될 노드의 위치값
    // *
    // * **/
    //removeNode: function(path) {
    //
    //    if (!path) {
    //        throw new Error('must insert target ID');
    //    }
    //    var removeTarget = this.findNode(path),
    //        parent = removeTarget.parent;
    //    parent.childNodes = ne.util.filter(parent.childNodes, function(element) {
    //        return element !== removeTarget;
    //    });
    //    removeTarget.parent = null;
    //
    //    this._notify('remove', parent);
    //},
    ///**
    // *
    // * 노드를 찾아서 리턴
    // *
    // * @param {String} path 찾아와야 하는 노드의 패스
    // * @return {Object}
    // *
    // **/
    //findNode: function(path) {
    //    var result = null,
    //        paths = path.split(',');
    //
    //    ne.util.forEach(paths, ne.util.bind(function(index) {
    //        if (result) {
    //            result = result.childNodes && result.childNodes[index];
    //        } else {
    //            result = this.nodes.childNodes && this.nodes.childNodes[index];
    //        }
    //    }, this));
    //    return result;
    //
    //},
    ///**
    // *
    // * 노드트리 생성
    // *
    // * @param {Object} data 트리를 만들 기본 데이터
    // * @param {Object} parent 이 속성이 있으면 부분트리를 만들어 연결한다.
    // * @private
    // *
    // **/
    //_makeTree: function(data, parent) {
    //
    //    if (!parent.childNodes) {
    //        parent.childNodes = [];
    //    }
    //
    //    //@Todo 정렬, 추후 조건에 따른 변화 필요(내림, 올림)
    //    ne.util.forEach(data, ne.util.bind(function(element, index) {
    //        var newNode = new ne.component.Tree.TreeNode({
    //            id: this._getId(),
    //            title: element.title,
    //            state: this.nodeDefaultState
    //        });
    //
    //        if (parent) {
    //            newNode.parent = parent;
    //            parent.childNodes.push(newNode);
    //        } else {
    //            newNode.parent = this.nodes;
    //        }
    //
    //        if (element.children) {
    //            this._makeTree(element.children, newNode);
    //        }
    //
    //    }, this));
    //},
    ///**
    // *
    // * 노드 이름을 변경한다.
    // *
    // * @param {String} path 이름을 변경할 노드의 패스값
    // * @param {String} value 해당 노드의 타이틀을 변경하기 위한 값
    // *
    // **/
    //renameNode: function(path, value) {
    //
    //    var target = this.findNode(path);
    //    target.set('title', value);
    //    this._notify('rename', target);
    //
    //},
    ///**
    // *
    // * 노드의 상태를 변경한다(여닫힘 상태)
    // *
    // * @param {String}  path 상태를 변경할 노드의 패스값
    // *
    // **/
    //changeState: function(path) {
    //    var target = this.findNode(path);
    //
    //    if (target.get('state') === 'open') {
    //        target.set('state', 'close');
    //    } else {
    //        target.set('state', 'open');
    //    }
    //    this._notify('toggle', target);
    //
    //},
    /////**
    //// *
    //// * 현재 선택된 노드를 버퍼에 저장한다
    //// *
    //// * @param {String} path 선택된 노드 패스값
    //// *
    //// *
    //// * **/
    ////setBuffer: function(path) {
    ////    this.clearBuffer();
    ////    var target = this.findNode(path);
    ////    this.buffer = target;
    ////    this._notify('select', target);
    ////},
    /////**
    //// * 버퍼를 비운다
    //// *
    //// */
    ////clearBuffer: function() {
    ////    if (!this.buffer) {
    ////        return;
    ////    }
    ////    var target = this.buffer;
    ////    this.buffer = null;
    ////    this._notify('unselect', target);
    ////},
    ///**
    // *모델의 노드 트리를 데이터를 가져온다
    // *
    // */
    //getData: function() {
    //    return this.nodes;
    //},
    ///**
    // * 타입에 따른 데이터 추출
    // */
    //extractData: function() {
    //    return this.nodes;
    //},
    ///**
    // * 트리 정렬
    // * @param {array} path 정렬할 패스
    // * @param {function} func 정렬 함수
    // */
    sort: function(path, func) {
        var target = this.findNode(path) || this.nodes;
        target.childNodes.sort(func);
        this._notify('refresh', target);
    },
    /**
     * 노드 정렬에 사용
     *
     * @param data
     */
    sortChild: function(data) {

        data.sort(function(a, b) {
            if (a.title < b.title) {
                return -1;
            } else if (a.title > b.title) {
                return 1;
            } else {
                return 0;
            }
        });
    }
});
