/**
 * 트리컴포넌트의 코어부분
 * 트리에 이벤트를 부여하고 이벤트 발생시, 모델을 조작함
 *
 * @class
 */

var Tree = Class.extend(/** @lends Tree.prototype */{
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

        this.model = new TreeModel(options.config);
        this.model.setModel(options.data);

        this.inputElement = document.createElement('input');
        this.inputElement.setAttribute('type', 'text');

        this.view = new TreeView(options.viewId, this.model.getFirstChildren(), options.config);
        this.event = new TreeEvent();

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
        var self = this;

        this.event.add(this.view.root, 'click', function(data) {

            if (data.isButton) {
                self.model.changeState(data.paths);
            } else if (data.paths) {
                self.model.setBuffer(data.paths);
            }

        });

        this.event.add(this.view.root, 'doubleclick', function(data) {

            var targetElement = data.target,
                targetParent = targetElement.parentNode;

            targetParent.insertBefore(self.inputElement, targetElement);
            self.inputElement.style.display = '';
            self.inputElement.value = self.model.findNode(data.path).title;
            self.inputElement.focus();

            function _update() {
                if (this.value) {
                    self.rename(data.path, this.value);
                }
                self.modeSwitch(this, targetElement);
                self.closeInputEvent();
            }
            self.onKeyDown = (function(e) {
                if (e.keyCode == '13') {
                    _update.call(this);
                }
            }).bind(self.inputElement);

            self.onBlur = _update.bind(self.inputElement);

            self.onClick = function(e) {
                utils.stopEvent(e);
            };

            utils.addEventListener(self.inputElement, 'keyup', self.onKeyDown);
            utils.addEventListener(self.inputElement, 'blur', self.onBlur);
            utils.addEventListener(self.inputElement, 'click', self.onClick);
            targetElement.style.display = 'none';

        });

    },
    /**
     * 이름변경시 사용하는 인풋의 이벤트들을 제거한다
     *
     * **/
    closeInputEvent: function() {

        utils.removeEventListener(this.inputElement, 'keyup', this.onKeyDown);
        utils.removeEventListener(this.inputElement, 'blur', this.onBlur);
        utils.removeEventListener(this.inputElement, 'click', this.onClick);

    },
    /**
     * 노드에서 활성화 될 엘리먼트와, 비활성화 되리먼트를 처리한다.
     *
     * @param {Object} offElement 보이지 않게 처리할 엘리먼트
     * @param {Object} onElement 보이도록 처리할 엘리먼트
     *
     * **/
    modeSwitch: function(offElement, onElement) {

        offElement.value = '';
        offElement.className = '';
        offElement.style.display = 'none';

        onElement.style.display = '';

    },
    /**
     * 노드를 추가한다.
     *
     * @example
     * treeInstance.insert('0,0', NodeInfo);
     *
     * @param {String} path 추가될 노드의 위치정보
     * @param {Object} object 추가될 노드의 정보(없을시 모델에서 기본값을 세팅)
     *
     * **/
    insert: function(path, object) {

        if (!arguments[1]) {
            object = path;
            this.model.insertNode(null, object);
        } else {
            path = path.toString();
            this.model.insertNode(path, object);
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
        var event;
        for (event in events) {
            var element = event.split(' ')[1] || this.view.root;
            if (typeof element === 'string') {
                var className = element.replace('.', '');
                element = document.getElementsByClassName(className);
            }
            var eventType = event.split(' ')[0];
            if (element.length === undefined) {
                element = [element];
            }
            for (var i = 0; i < element.length; i++) {

                utils.addEventListener(element[i], eventType, events[event]);

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
        if (!depthLabels || typeof depthLabels != 'object') {
            throw new TypeError();
        }
        this.view.setDepthLabels(depthLabels);
        this.view.action('refresh', this.model.nodes);
    }
});
