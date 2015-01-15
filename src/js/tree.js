ne = ne || {};
ne.component = ne.component || {};
/**
 * @fileoverview 트리컴포넌트의 코어부분
 * 트리에 이벤트를 부여하고 이벤트 발생시, 모델을 조작함
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 */

ne.component.Tree = ne.util.defineClass(/** @lends Tree.prototype */{
    /**
     * 트리의 모델을 생성하고 모델에 데이터를 부여한다.
     * 이름이 변경될 때 사용된 인풋박스를 생성한다.
     * 모델에 뷰를 등록시킨다.
     * 트리의 뷰를 생성하고 이벤트를 부여한다.
     *
     * @param {Object} options 트리의 기본옵션값
     *      @param {Object} options.data 트리에 사용될 데이터
     *      @param {Object} options.config 트리에 사용될 세팅값
     *          @param {String} options.config.viewId 루트 엘리먼트
     *          @param {String} options.config.defaultState 상태 미지정시 기본상태
     *          @param {Array} [options.config.depthLabels] 뷰에만 표시 될 기본 레이블
     *
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

     var tree1 = new Tree({
        data: data,
        config: {
            viewId: 'treeRoot3',
            defaultState: 'open',
            depthLabels:['층', '블록', '열']
        }
    });
     * **/
    init: function(options) {

        /**
         * 트리 모델
         * @type {ne.component.Tree.TreeModel}
         */
        this.model = new ne.component.Tree.TreeModel(options.config);
        this.model.setData(options.data);

        /**
         * 트리 값 변경시 활성화 될 인풋 엘리먼트
         * @type {HTMLElement}
         */
        this.inputElement = document.createElement('input');
        this.inputElement.className = options.config.inputElementClass || '';
        this.inputElement.setAttribute('type', 'text');

        /**
         * 트리 뷰
         * @type {ne.component.Tree.TreeView}
         */
        this.view = new ne.component.Tree.TreeView(options.config, this.model.getFirstChildren());
        /**
         * 트리 이벤트
         * @type {ne.component.Tree.TreeEvent}
         */
        this.event = new ne.component.Tree.TreeEvent();
        /**
         * 이름 변경 모드 활성화 여부
         * @type {Boolean}
         */
        this.isInputEnabled = false;
        /**
         * 에디팅 모드일때 활성화된 엘리먼트 정보 저장
         *
         * @type {Object}
         */
        this.editableObject = null;

        this.model.listen(this.view);

        this._setEvent();

    },
    /**
     * 트리에 이벤트를 설정한다.
     * 전체 클릭이벤트를 부여하여 타겟에 따른 처리를 한다.
     * 이름변경을 위한 더블클릭 이벤트를 부여한다.
     *
     * @private
     *
     * **/
    _setEvent: function() {
        this.event.add(this.view.root, 'click', ne.util.bind(this._onClickEvent, this));
        this.event.add(this.view.root, 'doubleclick', ne.util.bind(this._onDoubleClick, this));
        this.event.add(this.view.root, 'mousedown', ne.util.bind(this._onMouseDown, this));
    },
    /**
     * 트리에 마우스 다운시 이벤트 핸들러.
     * @private
     */
    _onMouseDown: function(e) {
        var tutil = ne.component.Tree.treeUtils;
        var move = ne.util.bind(function() {
            // move effect
        }, this);
        var up = ne.util.bind(function() {
            // 대상 타겟에 따른 e.paths 탐색후, 적용(parent 수정으로 할 것인가, 데이터를 복사헤서 새로 생성할 것인가.
            tutil.removeEventListener(document, 'mousemove', move);
            tutil.removeEventListener(document, 'mouseup', up);
        }, this);
        tutil.addEventListener(document, 'mousemove', move);
        tutil.addEventListener(document, 'mouseup', up);
    },
    /**
     * 트리 클릭시 이벤트핸들
     *
     * @param {Object} data
     * @private
     */
    _onClickEvent: function(data) {
        if (data.isButton) {
            this.model.changeState(data.paths);
        } else if (data.paths) {
            this.model.setBuffer(data.paths);
            this.fire('click', data);
        }
    },
    /**
     * 트리 더블크릭시 이벤트 핸들
     * @param {Object} data
     * @todo 선택 엘리먼트를 바꿔야함
     * @private
     */
    _onDoubleClick: function(data) {

        var target = data.target,
            valueElement = this._getValueElement(data.path),
            input = this.inputElement;

        this.editableObject = {
            element: target,
            path: data.path,
            valueElement: valueElement
        };

        target.insertBefore(input, valueElement);
        valueElement.style.display = 'none';
        input.style.display = '';
        input.value = this.model.findNode(data.path).title;

        input.focus();

        if (!this.isInputEnabled) {
            this._openInputEvent();
        }

    },

    /**
     * 노드의 값을 가지고 있는 엘리먼트를 반환한다.
     * @private
     */
    _getValueElement: function(path) {
        var targetNode = this.model.findNode(path),
            targetElement = document.getElementById(targetNode.id);

        return targetElement;
    },

    /**
     * 이름을 업데이트 한다
     *
     * @private
     * **/
    _updateName: function() {
        var changeText = this.inputElement.value;
        if (changeText) {
            this.rename(this.editableObject.path, changeText);
        }
        this._stopEditable();
    },
    /**
     * 노드의 이름변경 박스에 키다운 이벤트 핸들러
     *
     * @private
     * **/
    _onKeyDownInputElement: function(e) {
        if (e.keyCode === 13) {
            this._updateName();
        }
    },
    /**
     * 노드의 인풋박스에 블러 이벤트 처리 핸들러
     *
     * @private
     * **/
    _onBlurInputElement: function(e) {
        this._updateName();
    },
    /**
     * 노드의 인풋박스에 클릭시 전파방지
     *
     * @private
     * **/
    _onClickInputElement: function(e) {
        ne.component.Tree.treeUtils.stopEvent(e);
    },
    /**
     * 이름변경모드 활성화시, 이벤트를 등록한다
     *
     * @private
     * **/
    _openInputEvent: function() {
        var tutil = ne.component.Tree.treeUtils;
        this.isInputEnabled = true;
        tutil.addEventListener(this.inputElement, 'keyup', ne.util.bind(this._onKeyDownInputElement, this));
        tutil.addEventListener(this.inputElement, 'blur', ne.util.bind(this._onBlurInputElement, this));
        tutil.addEventListener(this.inputElement, 'click', ne.util.bind(this._onClickInputElement, this));
    },
    /**
     * 노드에서 활성화 될 엘리먼트와, 비활성화 되리먼트를 처리한다.
     *
     * @private
     *
     * **/
    _stopEditable: function() {

        this.inputElement.value = '';
        this.inputElement.style.display = 'none';
        this.editableObject.valueElement.style.display = '';

    },
    /**
     * 노드를 추가한다.
     *
     * @example
     * treeInstance.insert('0,0', NodeInfo);
     *
     * @param {String} path 추가될 노드의 위치정보
     * @param {Object} insertObject 추가될 노드의 정보(없을시 모델에서 기본값을 세팅)
     *
     * **/
    insert: function(path, insertObject) {
        var res = this.invoke('insert', { path: path, value: insertObject });
        if (!res) {
            return;
        }
        if (!insertObject) {
            insertObject = path;
            this.model.insertNode(null, insertObject);
        } else {
            path = path.toString();
            this.model.insertNode(path, insertObject);
        }
    },
    /**
     * 노드를 제거한다.
     *
     * @example
     * treeInstance.remove('1,0');
     *
     * @param {String} path 제걸될 노드의 위치정보
     *
     * **/
    remove: function(path) {
        if (!path) {
            return;
        }
        var res = this.invoke('remove', { path: path });
        if (!res) {
            return;
        }
        this.model.removeNode(path);
    },
    /**
     * 노드의 이름을 변경한다.
     *
     * @example
     * treeInstance.rename('0,0', 'changeName');
     *
     * @param {String} path 이름 변경될 노드의 위치정보
     * @param {String} value 변경될 이름
     *
     * **/
    rename: function(path, value) {
        var res = this.invoke('rename', { path: path, value: value });
        if (!res) {
            return;
        }
        this.model.renameNode(path, value);
    },
    sort: function(path, func) {
        this.model.sort(path, func);
    },
    /**
     * 모델에서 추출된 데이터를 가져온다
     *
     **/
    getData: function() {
        return this.model.extractData();
    },
    /**
     * 단위값을 추가한다.
     *
     * @example
     * treeInstance.setDepthLabels(['A','B','C']);
     *
     * @param {Array} depthLabels 각 뎁스별 단위값
     *
     * **/
    setDepthLabels: function(depthLabels) {

        if (!depthLabels || !ne.util.isObject(depthLabels)) {
            throw new TypeError();
        }
        this.view.setDepthLabels(depthLabels);
        this.view.action('refresh', this.model.nodes);

    }
});

ne.util.CustomEvents.mixin(ne.component.Tree);