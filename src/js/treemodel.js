/**
 * 트리를 구성하는 데이터를 조작함
 * 데이터 변경사한 발생 시 뷰를 갱신함
 *
 * @class
 *
 * **/
var TreeModel = Class.extend(/** @lends TreeModel.prototype */{
    init: function(options) {

        this.nodes = {};
        this.count = 0;
        this.views = [];
        this.nodeDefaultState = options.defaultState || 'close';
        this.buffer = null;
        this.date = new Date().getTime();

    },

    /**
     *
     * 모델에 트리형태의 데이터를 세팅함
     * 모델은 데이터를 받아 노드의 트리형태로 변경
     *
     * @param {Object} data 트리 입력데이터
     *
     * **/

    setModel: function(data) {

        this.data = data;
        this.makeTree(this.data, this.nodes);

    },

    /**
     *
     * 모델이 변경이 일어날경우 갱신할 뷰를 등록함
     *
     * @param {Object} view 트리뷰
     *
     * **/

    listen: function(view) {

        this.views.push(view);

    },

    /**
     *
     * 모델이 뷰에 동작을 요청
     *
     * @private
     * @param {String} type 뷰에 전달될 동작타입
     * @param {Object} target 갱신대상이 될 타겟
     *
     * **/

    _notify: function(type, target) {

        this.views.forEach(function(view) {
            view.action(type, target);
        });

    },

    /**
     *
     * 초기에 뷰에 요청될 최상단 노드들을 리턴해주는 메소드
     *
     *
     * **/

     getFirstChildren: function() {

        return this.nodes.childNodes;

    },
    /**
     *
     * 노드추가
     *
     * @param {String} path 노드가 추가될 부모의 위치값
     * @param {Object} object 추가될 노드의 정보
     *
     * **/
    insertNode: function(path, object) {

        var target = null;

        if (path !== null) {
            target = this.findNode(path);
        }
        if (!object) {
            object = {title: 'no Title'};
        }

        if (!target) {
            target = new Node({
                id: this._getIdentification(),
                title: object.title,
                state: this.nodeDefaultState || 'close'
            });

            this.nodes.childNodes.push(target);
            target.parent = this.nodes;
            if (object.child) {
                this.makeTree(object.child, target);
            }

            target = this.nodes;
        } else {

            if (!target.childNodes) {
                target.childNodes = [];
            }
            this.makeTree(object, target);
        }

        this._notify('refresh', target);
    },
    /**
     *
     * 노드제거
     *
     * @param {String} path 제거될 노드의 위치값
     *
     * **/
    removeNode: function(path) {

        if (!path) {
            throw new Error('must insert target ID');
        }
        var removeTarget = this.findNode(path),
            parent = removeTarget.parent;

        parent.childNodes = parent.childNodes.filter(function(element) {
            return element != removeTarget;
        });
        removeTarget.parent = null;

        this._notify('remove', parent);
    },
    /**
     *
     * 노드를 찾아서 리턴
     *
     * @param {String} path 찾아와야 하는 노드의 패스
     * @return {Object}
     *
     **/
    findNode: function(path) {

        var result = null,
            self = this,
            paths = path.split(',');

        paths.forEach(function(index) {
            if (result) {
                result = result.childNodes[index];
            } else {
                result = self.nodes.childNodes[index];
            }
        });
        return result;

    },
    /**
     *
     * 노드트리 생성
     *
     * @param {Object} data 트리를 만들 기본 데이터
     * @param {Object} parent 이 속성이 있으면 부분트리를 만들어 연결한다.
     *
     **/
    makeTree: function(data, parent) {

        if (!parent.childNodes) {
            parent.childNodes = [];
        }

        if (data && data.constructor !== Array) {
            data = [data];
        }

        //@Todo 정렬, 추후 조건에 따른 변화 필요(내림, 올림)
        data.forEach(function(element, index) {

            var newNode = new Node({
                id: this._getIdentification(),
                title: element.title,
                state: this.nodeDefaultState
            });

            if (parent) {
                newNode.parent = parent;
                parent.childNodes.push(newNode);
            } else {
                newNode.parent = this.nodes;
            }

            if (element.child) {
                this.makeTree(element.child, newNode);
            }

        }.bind(this));
    },
    /**
     *
     * 트리에 부여 될 고유아이디를 만들어 리턴한다
     *
     * @private
     * @return {String}
     *
     **/
    _getIdentification: function() {

        var identification = 'tree_' + this.date;
        return [identification, this.count++].join('_');

    },
    /**
     *
     * 노드 이름을 변경한다.
     *
     * @param {String} path 이름을 변경할 노드의 패스값
     * @param {String} value 해당 노드의 타이틀을 변경하기 위한 값
     *
     **/
    renameNode: function(path, value) {

        var target = this.findNode(path);
        target.set('title', value);
        this._notify('rename', target);

    },
    /**
     *
     * 노드의 상태를 변경한다(여닫힘 상태)
     *
     * @param {String}  path 상태를 변경할 노드의 패스값
     *
     **/
    changeState: function(path) {
        var target = this.findNode(path);

        if (target.get('state') == 'open') {
            target.set('state', 'close');
        } else {
            target.set('state', 'open');
        }
        this._notify('expand', target);

    },
    /**
     *
     * 현재 선택된 노드를 버퍼에 저장한다
     *
     * @param {String} path 선택된 노드 패스값
     *
     *
     * **/
    setBuffer: function(path) {
        this.clearBuffer();
        var target = this.findNode(path);
        this.buffer = target;
        this._notify('select', target);
    },
    /**
     *
     * 버퍼를 비운다
     *
     */
    clearBuffer: function() {
        if (!this.buffer) {
           return void 0;
        }
        var target = this.buffer;
        this.buffer = null;
        this._notify('unselect', target);
    },
    /**
     *
     * 모델의 노드 트리를 데이터를 가져온다
     *
     */
    getData: function() {
        return this.nodes;
    },
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
