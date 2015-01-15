/**
 * @fileoverview 화면에 보여지는 트리를 그리고, 갱신한다.
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 */
(function(ne) {

    var STATE = {
        NORMAL: 0,
        EDITABLE: 1
    };

    var DEFAULT = {
        OPEN: ['open', '-'],
        CLOSE: ['close', '+'],
        SELECT_CLASS: 'selected',
        VALUE_CLASS: 'valueClass',
        EDITABLE_CLASS: 'editableClass',
        TEMPLATE: {
            ROD_NODE: '<li class="rod_node {{State}}">' +
                        '<button type="button">{{StateLabel}}</button>' +
                        '<span id="{{NodeID}}" class="depth{{Depth}} {{ValueClass}}">{{Title}}</span><em>{{DepthLabel}}</em>' +
                        '<ul class="subTree">{{Children}}</ul>' +
                    '</li>',
            LEAP_NODE: '<li class="leap_node">' +
                        '<span id="{{NodeID}}" class="depth{{Depth}} {{ValueClass}}">{{Title}}</span><em>{{DepthLabel}}</em>' +
                    '</li>'
        }
    };

    /**
     * 트리 컴포넌트에 쓰이는 헬퍼객체
     *
     * @author FE개발팀 이제인(jein.yi@nhnent.com)
     * @namespace
     */

    var util = {
        /**
         * 엘리먼트에 이벤트를 추가한다
         *
         * @param {Object} element 이벤트를 추가할 엘리먼트
         * @param {String} eventName 추가할 이벤트 명
         * @param {Function} handler 추가할 이벤트 콜백함수
         */
        addEventListener: function(element, eventName, handler) {
            if (element.addEventListener) {
                element.addEventListener(eventName, handler, false);

            } else {
                element.attachEvent('on' + eventName, handler);
            }
        },
        /**
         * 엘리먼트에 이벤트를 제거한다
         *
         * @param {Object} element 이벤트를 제거할 엘리먼트
         * @param {String} eventName 제거할 이벤트 명
         * @param {Function} handler 제거할 이벤트 콜백함수
         */
        removeEventListener: function(element, eventName, handler) {
            if (element.removeEventListener) {
                element.removeEventListener(eventName, handler, false);
            } else {
                element.detachEvent('on' + eventName, handler);
            }
        },
        /**
         * 이벤트 전파를 막는다
         *
         * @param {Object} event 전파를 방지할 이벤트객체
         */
        stopEvent: function(event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            //IE8 and Lower
            else {
                event.cancelBubble = true;
            }
        },
        getTarget: function(event) {
            event = event || window.event;
            var target = event.target || event.srcElement;
            return target;
        },
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
        getElementsByClass: function(target, className) {
            if (target.getElementsByClass) {
                return target.getElementsByClass(className);
            }
            var allChilds = target.getElementsByTagName('*'),
                filter = [];
            ne.util.forEach(allChilds, function(el) {
                var cls = el.className || '';
                if (cls.indexOf(className) !== -1) {
                    filter.push(el);
                }
            });
            return filter;
        },
        isRightButton: function(number) {
            var isRight = (number === 3 || number === 2);
            return isRight;
        }
    };


    window.ne = ne = ne || {};
    ne.component = ne.component || {};

    ne.component.Tree = ne.util.defineClass(/** @lends TreeView.prototype */{

        /**
         * TreeView 초기화한다.
         *
         * @param {String} id 루트의 아이디 값
         * @param {Object} data 트리 초기데이터 값
         * @param {Object} options 트리 초기옵션값
         * @param {String} template 트리에사용되는 기본 태그(자식노드가 있을때와 없을때를 오브젝트 형태로 받는)
         * */
        init: function (id, data, options) {
            /**
             * 노드 기본 템플릿
             * @type {String}
             */
            this.template = options.template || DEFAULT.TEMPLATE;
            /**
             * 노드의 루트 엘리먼트
             * @type {HTMLElement}
             */
            this.root = null;
            /**
             * 노드 생성시 패스를 만들기 위한 배열
             *
             * @type {Array}
             */
            this.path = [];
            /**
             * 트리가 열린 상태일때 부여되는 클래스와, 텍스트
             *
             * @type {Array}
             */
            this.openSet = options.openSet || DEFAULT.OPEN;
            /**
             * 트리가 닫힘 상태일때 부여되는 클래스와, 텍스트
             *
             * @type {Array}
             */
            this.closeSet = options.closeSet || DEFAULT.CLOSE;
            /**
             * 노드가 선택 되었을때 부여되는 클래스명
             *
             * @type {String}
             */
            this.onselectClass = options.onselectClass || DEFAULT.SELECT_CLASS;
            /**
             * 더블클릭이 적용되는 영역에 부여되는 클래스
             * @type {string}
             */
            this.valueClass = options.valueClass || DEFAULT.VALUE_CLASS;
            /**
             * input엘리먼트에 부여되는 클래스
             * @type {string}
             */
            this.editClass = options.inputClass || DEFAULT.EDITABLE_CLASS;
            /**
             * 노드의 뎁스에따른 레이블을 관리한다.(화면에는 표시되지만 모델에는 영향을 끼치지 않는다.)
             *
             * @type {Array}
             */
            this.depthLabels = options.depthLabels || [];
            /**
             * 트리 상태, 일반 출력 상태와 수정가능 상태가 있음.
             * @type {number}
             */
            this.state = STATE.NORMAL;

            if (id) {
                this.root = document.getElementById(id);
            } else {
                this.root = document.createElement('ul');
                document.body.appendChild(this.root);
            }

            /**
             * 트리의 상태가 STATE.EDITABLE 일때, 노드에 붙는 input엘리먼트
             * @type {HTMLElement}
             */
            this.inputElement = this.getEditableElement();
            /**
             * 트리 모델을 생성한다.
             * @type {ne.component.Tree.TreeModel}
             */
            this.model = new ne.component.Tree.TreeModel(options.modelOption, this);

            this.model.setData(data);

            this._draw(this._getHtml(this.model.treeHash.root.childKeys));

            this.setEvents();

        },
        /**
         * STATE.EDITABLE 일때 사용되는  inputElement를 만든다.
         */
        getEditableElement: function() {
            var input = document.createElement('input');
            input.className = this.editClass;
            input.setAttribute('type', 'text');
            return input;
        },
        /**
         * 트리에 걸리는 이벤트 핸들러를 할당한다.
         * #click-버튼 : 트리의 상태를 변경한다.
         * #click-노드 : 노드를 선택한다
         * #doubleclick-노드 : 노드의 이름변경을 활성화 한다.
         * #mousedown : 마우스 무브와 업을 건다
         * #mousemove : 마우스 이동을 체크
         * #mouseup : 마우스를 떼었을 경우, 마우스 move와 다운을 없앤다.
         */
        setEvents: function() {
            util.addEventListener(this.root, 'mousedown', ne.util.bind(this._onMouseDown, this));
            util.addEventListener(this.root, 'click', ne.util.bind(this._onClick, this));
            util.addEventListener(this.inputElement, 'blur', ne.util.bind(this._onBlurInput, this));
        },
        /**
         * 노드명 변경 후, 포커스 아웃 될때 발생되는 이벤트 핸들러
         * @param e
         * @private
         */
        _onBlurInput: function(e) {
            var target = util.getTarget(e);
            this.model.rename(this.current.id, target.value);
            this.changeState(this.current);
        },
        /**
         * 클릭 이벤트가 발생 할 경우, 더블클릭을 발생 시킬지, 클릭을 발생 시킬지 판단한다.
         * @param {event} e
         * @private
         */
        _onClick: function(e) {
            var target = util.getTarget(e);

            // 우클릭은 막는다.
            if (util.isRightButton(e.which || e.button)) {
                this.clickTimer = null;
                util.stopEvent(e);
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
                // value 부분을 클릭 했을시, 더블클릭 타이머를 돌린다.
                this.clickTimer = setTimeout(ne.util.bind(function() {
                    this._onSingleClick(e);
                }, this), 400);
            }
        },
        /**
         * 단일 클릭 처리, 버튼일 경우와 노드일 경우처리를 따로한다.
         * @param {event} e
         * @private
         */
        _onSingleClick: function(e) {
            this.clickTimer = null;
            var target = util.getTarget(e);
            if (!target) {
                return;
            }

            var tag = target.tagName.toUpperCase(),
                parent,
                valueEl;

            parent = target.parentNode;
            valueEl = util.getElementsByClass(parent, this.valueClass)[0];

            if(tag === 'BUTTON') {
                this.model.changeState(valueEl.id)
            } else {
                this.model.setBuffer(valueEl.id);
            }
        },

        /**
         * 상태를 변경한다. STATE.NORMAL | STATE.EDITABLE
         * @param {HTMLelement} target 엘리먼트
         */
        changeState: function(target) {
            this.state = (this.state + 1) % 2;
            if(this.state === STATE.NORMAL) {
                this.action('restore', target);
            } else {
                this.action('convert', target);
            }
        },
        /**
         * 더블 클릭 처리
         * @param e
         * @private
         */
        _onDoubleClick: function(e) {
            var target = util.getTarget(e);
            this.changeState(target);
        },
        /**
         * 트리에 마우스 다운시 이벤트 핸들러.
         * @private
         */
        _onMouseDown: function(e) {
            var target = util.getTarget(e),
                node = this.model.find(target.id);

            if(!target || !node) {
                return;
            }

            this.enableGuide({
                x: e.clientX,
                y: e.clientY
            }, target.innerText || target.textContent);

            var move = ne.util.bind(function(me) {
                // 가이드 이동
                this.setGuideLocation({
                    x: me.clientX,
                    y: me.clientY
                });

            }, this);

            var up = ne.util.bind(function(ue) {
                // 가이드 감춤
                this.disableGuide();

                var toEl = util.getTarget(ue),
                    model = this.model;

                if (model.find(toEl.id)) {
                    model.remove(target.id);
                    model.insert(node, toEl.id);
                }
                util.removeEventListener(document, 'mousemove', move);
                util.removeEventListener(document, 'mouseup', up);
            }, this);
            util.addEventListener(document, 'mousemove', move);
            util.addEventListener(document, 'mouseup', up);
        },
        /**
         * 트리 드래그 앤 드롭하는 엘리먼트의 value값을 보여주는 가이드 엘리먼트를 활성화 한다.
         * @param {object} pos 클릭한 좌표 위치
         * @param {string} value 클릭한 앨리먼트 텍스트 값
         */
        enableGuide: function(pos, value) {
            if (!this.guideElement) {
                this.guideElement = document.createElement('span');
                this.guideElement.style.position = 'absolute';
                this.root.parentNode.appendChild(this.guideElement);
            }
            this.guideElement.innerHTML = value;
            this.setGuideLocation(pos);
            this.guideElement.style.display = 'block';
        },
        /**
         * 가이드의 위치를 변경한다.
         * @param {object} pos 변경할 위치
         */
        setGuideLocation: function(pos) {
            this.guideElement.style.left = pos.x + 10 + 'px';
            this.guideElement.style.top = pos.y + 10 + 'px';
        },
        /**
         * 가이드를 감춘다
         */
        disableGuide: function(pos) {
            this.guideElement.style.display = 'none';
        },
        /**
         * 트리의 전체 혹은 일부 html 을 생성한다.
         *
         * @param {Object} data 화면에 그릴 데이터
         * @param {Path} beforePath 부분트리를 그릴때 상위 패스정보
         * @private
         *
         * @return {String} html
         * */
        _getHtml: function(keys) {

            var model = this.model,
                html,
                childEl = [];

            ne.util.forEach(keys, function(el) {
                var node = model.find(el),
                    tmpl,
                    depth = node.depth,
                    state = this[node.state + 'Set'][0],
                    label = this[node.state + 'Set'][1],
                    rate = this.depthLabels[depth - 1] || '',
                    el = null,
                    map = {
                        State: state,
                        StateLabel: label,
                        NodeID: node.id,
                        Depth: depth,
                        Title: node.value,
                        ValueClass: this.valueClass,
                        DepthLabel: rate
                    };

                if(ne.util.isNotEmpty(node.childKeys)) {
                    tmpl = this.template.ROD_NODE;
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
         * 뷰를 갱신한다.
         * @param {string} act
         * @param {object} target
         */
        notify: function(act, target) {
            this.action(act, target);
        },
        /**
         * 액션을 수행해 트리를 갱신한다.
         *
         * @param {String} type 액션 타입
         * @param {Object} target 부분갱신이라면 그 타겟
         *
         * */
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
         * 노드의 상태를 변경한다.
         * @param {Object} node 상태변경될 노드의 정보
         * @private
         * */
        _changeNodeState: function(node) {
            var element = document.getElementById(node.id);
            if (!element) {
                return;
            }

            var parent = element.parentNode,
                cls = parent.className;

            if (!ne.util.isNotEmpty(node.childKeys)) {
                cls = 'leap_node ' + this[node.state + 'Set'][0];
            } else {
                cls = 'rod_node ' + this[node.state + 'Set'][0];
            }

            parent.className = cls;
        },
        /**
         * 노드의 이름을 변경 할수 있는 상태로 전환시킨다.
         * @param {HTMLElement} element 이름을 변경할 대상 엘리먼트
         * @private
         */
        _convert: function(element) {
            var id = element.id,
                node = this.model.find(id),
                label = node.value,
                parent = element.parentNode;
            //this.current가 존재하면 style none해제
            if(this.current) {
                this.current.style.display = '';
            }

            element.style.display = 'none';
            this.inputElement.value = label;
            this.current = element;
            parent.insertBefore(this.inputElement, element);
        },
        /**
         * 변경된 노드의 이름을 적용시킨다.
         * @param {HTMLElement} element 이름이 변경되는 대상 엘리먼트
         * @private
         */
        _restore: function(element) {

            var parent = element.parentNode;
            if(this.current) {
                this.current.style.display = '';
            }
            this.inputElement.value = '';
            parent.removeChild(this.inputElement);
        },
        /**
         * 생성된 html을 붙인다
         *
         * @param {String} html 데이터에 의해 생성된 html
         * @param {Object} parent 타겟으로 설정된 부모요소, 없을시 내부에서 최상단 노드로 설정
         * @private
         *
         * */
        _draw: function(html, parent) {
            var root = parent || this.root;
            root.innerHTML = html;
        },
        /**
         * 깊이(depth)에 따른 레이블을 설정한다
         * (실제 모델에는 영향을 주지 않으므로, 뷰에서 설정한다.)
         *
         * @param {Array} depthLabels 깊이에 따라 노드 뒤에 붙을 레이블
         * */
        setDepthLabels: function(depthLabels) {
            this.depthLabels = depthLabels;
        },
        /**
         * 노드 갱신 - 타겟 노드 기준으로 노드를 다시 만들어서 붙여줌
         * @private
         **/
        _refresh: function() {
            var data = this.model.treeHash.root.childKeys;
            this._draw(this._getHtml(data));
        },
        /**
         * 엘리먼트 타이틀을 변경한다.
         * @param {object} node 변경할 엘리먼트에 해당하는 모델정보
         * @private
         */
        _rename: function(node) {
            var element = document.getElementById(node.id);
            element.innerHTML = node.value;
        },
        /**
        * 노드 여닫기 상태를 갱신한다.
        * @param {Object} node 갱신할 노드 정보
        * @private
        **/
        _toggleNode: function(node) {

            var element = document.getElementById(node.id),
                parent = element.parentNode,
                childWrap = parent.getElementsByTagName('ul')[0],
                button = parent.getElementsByTagName('button')[0];

            var state = this[node.state + 'Set'][0],
                label = this[node.state + 'Set'][1],
                isOpen = node.state === 'open';

            parent.className = parent.className.replace(this.openSet[0], '').replace(this.closeSet[0], '') + state;
            childWrap.style.display = isOpen ? '' : 'none';
            button.innerHTML = label;
        },
        /**
         * 노드 선택시 표시변경
         * @param {Object} node 선택된 노드정보
         * @private
         * */
        _select: function(node) {
            var valueEl = document.getElementById(node.id);
            if (ne.util.isExisty(valueEl)) {
                valueEl.className = valueEl.className.replace(' ' + this.onselectClass, '') + ' ' + this.onselectClass;
            }
        },
        /**
         * 노드 선택해제시 액션
         * @param {Object} node 선택 해제 된 노드정보
         * @private
         * */
        _unSelect: function(node) {
            var valueEl = document.getElementById(node.id);
            if (ne.util.isExisty(valueEl) && util.hasClass(valueEl, this.onselectClass)) {
                valueEl.className = valueEl.className.replace(' ' + this.onselectClass, '');
            }
        }
    });

    ne.util.CustomEvents.mixin(ne.component.Tree);
})(ne);
