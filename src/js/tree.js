var ne = ne || {};
ne.Component = ne.Component || {};
/**
 * @fileoverview 트리컴포넌트의 코어부분<br />트리에 이벤트를 부여하고 이벤트 발생시, 모델을 조작함
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 */

ne.Component.Tree = Class.extend(/** @lends Tree.prototype */{
    /**
     * 트리의 모델을 생성하고 모델에 데이터를 부여한다.
     * 이름이 변경될 때 사용된 인풋박스를 생성한다.
     * 모델에 뷰를 등록시킨다.
     * 트리의 뷰를 생성하고 이벤트를 부여한다.
     *
     * @param {Object} options 트리의 기본옵션값
     *
     * **/
    init: function(options) {

        this.model = new ne.Component.TreeModel(options.config);
        this.model.setData(options.data);

        this.inputElement = document.createElement('input');
        this.inputElement.setAttribute('type', 'text');

        this.view = new ne.Component.TreeView(options.config, this.model.getFirstChildren());
        this.event = new ne.Component.TreeEvent();

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

        this.event.add(this.view.root, 'click', function(data) {

            if (data.isButton) {
                this.model.changeState(data.paths);
            } else if (data.paths) {
                this.model.setBuffer(data.paths);
            }

        }.bind(this));

        this.event.add(this.view.root, 'doubleclick', function(data) {

            this.editableObject = {
                element: data.target,
                path: data.path
            };

            var targetParent = this.editableObject.element.parentNode;
            targetParent.insertBefore(this.inputElement, this.editableObject.element);

            this.editableObject.element.style.display = 'none';

            this.inputElement.style.display = '';
            this.inputElement.value = this.model.findNode(data.path).title;
            this.inputElement.focus();

            if (!this.isInputEnabled) {
                this._openInputEvent();
            }

        }.bind(this));

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
        if (e.keyCode == '13') {
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
        ne.Component.treeUtils.stopEvent(e);
    },
    /**
     * 이름변경모드 활성화시, 이벤트를 등록한다
     *
     * @private
     * **/
    _openInputEvent: function() {
        this.isInputEnabled = true;
        ne.Component.treeUtils.addEventListener(this.inputElement, 'keyup', this._onKeyDownInputElement.bind(this));
        ne.Component.treeUtils.addEventListener(this.inputElement, 'blur', this._onBlurInputElement.bind(this));
        ne.Component.treeUtils.addEventListener(this.inputElement, 'click', this._onClickInputElement.bind(this));
    },
    /**
     * 노드에서 활성화 될 엘리먼트와, 비활성화 되리먼트를 처리한다.
     *
     * @param {Object} offElement 보이지 않게 처리할 엘리먼트
     * @param {Object} onElement 보이도록 처리할 엘리먼트
     * @parivate
     *
     * **/
    _stopEditable: function(offElement, onElement) {

        this.inputElement.value = '';
        this.inputElement.className = '';
        this.inputElement.style.display = 'none';
        this.editableObject.element.style.display = '';

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

        this.model.renameNode(path, value);

    },
    /**
     * 모델의 데이터를 가져온다
     *
     * **/
    getModelData: function() {
        return this.model.getData();
    },
    /**
     * 트리에 이벤트를 추가한다
     *
     * @example
     * treeInstance.attach({
     *      'click': function(data) {
     *          console.log(data);
     *      }
     * });
     *
     * @param {Object} events 추가될 이벤트 정보
     *
     * **/
    attach: function(events) {

        if (!events) {
            throw new Error('attach method must be used with events object.');
        }

        var event,
            element,
            elements,
            eventType;
        for (event in events) {

            eventType = event.split(' ')[0];
            element = event.split(' ')[1] || this.view.root;

            if (typeof element === 'string') {
                var className = element.replace('.', '');
                elements = document.getElementsByClassName(className);
            }

            if (!elements.length) {
                elements = [elements];
            }

            for (var i = 0, len = elements.length; i < len; i++) {

                ne.Component.treeUtils.addEventListener(elements[i], eventType, events[event]);

            }
        }

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

        if (!depthLabels || !ne.Component.treeUtils.isObject(depthLabels)) {
            throw new TypeError();
        }
        this.view.setDepthLabels(depthLabels);
        this.view.action('refresh', this.model.nodes);

    }
});
