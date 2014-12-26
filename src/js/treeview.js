/**
 * @fileoverview 화면에 보여지는 트리를 그리고, 갱신한다.
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 */
ne.component.Tree.TreeView = ne.util.defineClass(/** @lends TreeView.prototype */{
    /**
     * TreeView 초기화한다.
     *
     * @param {String} id 루트의 아이디 값
     * @param {Object} data 트리 초기데이터 값
     * @param {Object} options 트리 초기옵션값
     * @param {String} template 트리에사용되는 기본 태그(자식노드가 있을때와 없을때를 오브젝트 형태로 받는)
     * */
    init: function (options, data) {
        /**
         * 노드 기본 템플릿
         * @type {String}
         */
        this.template = options.template || {
            hasChild: '<li class="hasChild {{State}}" path="{{Path}}">\
                            <button type="button">{{StateLabel}}</button>\
                            <span id="{{NodeID}}" class="depth{{Depth}}">{{Title}}</span><em>{{DepthLabel}}</em>\
                            <ul class="subTree">\
                                {{ChildNodes}}\
                            </ul>\
                        </li>',
            leapNode: '<li class="leapNode" path="{{Path}}">\
                        <span id="{{NodeID}}" class="depth{{Depth}}">{{Title}}</span><em>{{DepthLabel}}</em>\
                    </li>'
        };
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
        this.openSet = options.openSet || ['open', '-'];
        /**
         * 트리가 닫힘 상태일때 부여되는 클래스와, 텍스트
         *
         * @type {Array}
         */
        this.closeSet = options.closeSet || ['close', '+'];
        /**
         * 노드가 선택 되었을때 부여되는 클래스명
         *
         * @type {String}
         */
        this.onSelectClassName = options.onSelectClassName || 'select';
        /**
         * 노드의 뎁스에따른 레이블을 관리한다.(화면에는 표시되지만 모델에는 영향을 끼치지 않는다.)
         *
         * @type {Array}
         */
        this.depthLabels = options.depthLabels || [];

        if (options.viewId) {
            this.root = document.getElementById(options.viewId);
        } else {
            this.root = document.createElement('ul');
            document.body.appendChild(this.root);
        }

        this._makeTree(data);

    },
    /**
     * 트리 데이터를 받아 html 생성을 요청한다.
     *
     * @param {Object} drawData 화면에 그릴 데이터
     * @private
     * */
    _makeTree: function (drawData) {

        this._draw(this._makeHTML(drawData));

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
    _makeHTML: function (data, beforePath) {

        var childEl = [],
            beforePath = beforePath || null,
            path = '', html,
            len = data.length;

        ne.util.forEach(data, function (element, index) {
            this.path.push(index);

            if (beforePath !== null) {
                path = [beforePath, this.path.join()].join();
            } else {
                path = this.path.join();
            }

            // 스타일 제어 방식으로 변경
            var depth = path.split(',').length,
                rate = this.depthLabels[depth - 1] || '',
                state = this[element.state + 'Set'][0],
                label = this[element.state + 'Set'][1],
                el = null, replaceMapper = {
                    State: state,
                    StateLabel: label,
                    NodeID: element.id,
                    Path: path,
                    Depth: depth,
                    Title: element.title,
                    DepthLabel: rate
                };

            if (ne.util.isNotEmpty(element.childNodes)) {
                el = this.template.hasChild;
                replaceMapper.ChildNodes = this._makeHTML(element.childNodes, beforePath);
            } else {
                el = this.template.leapNode;
            }
            el = el.replace(/\{\{([^\}]+)\}\}/g, function(matchedString, name) {
                return replaceMapper[name] || '';
            });
            if (index === (len - 1) && depth !== 1) {
                el = el.replace('class="', 'class="last ');
            }
            var isChildHide = element.get('state') === 'close';
            if (isChildHide) {
                el = el.replace('<ul ', '<ul style="display:none"');
            }

            childEl.push(el);
            this.path.pop();

        }, this);
        html = childEl.join('');
        return html;

    },
    /**
     * 노드의 상태를 변경한다.
     *
     * @param {Object} nodeInfo 클래스변경(상태변경)될 노드의 정보
     * @private
     *
     * */
    _changeTargetClass: function(nodeInfo) {

        var target = document.getElementById(nodeInfo.id);

        if (!target) {
            return;
        }

        var parent = target.parentNode,
            nodeClassName = parent.className;

        if (nodeInfo.childNodes && !nodeInfo.childNodes.length) {
            nodeClassName = 'leapNode ' + this[nodeInfo.state + 'Set'][0];
        } else {
            nodeClassName = 'hasChild ' + this[nodeInfo.state + 'Set'][0];
        }

        parent.className = nodeClassName;
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
            remove: this._remove,
            refresh: this._refresh,
            rename: this._rename,
            toggle: this._toggle,
            select: this._select,
            unselect: this._unSelect
        };
        this._actionMap[type].call(this, target);
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
     * 노드 삭제 - 타겟 노드를 제거하고 상위노드에서 한번 갱신해줌(패스유지를 위해)
     *
     * @param {Object} target 삭제 대상 노드
     * @private
     *
     * */
    _remove: function(target) {
        var targetElement = document.getElementById(target.id);
        if (targetElement) {
            targetElement = targetElement.parentNode.getElementsByTagName('ul')[0];
        }
        this._changeTargetClass(target);
        var drawData = target.childNodes;
        this._draw(this._makeHTML(drawData), targetElement);
    },
    /**
     * 노드 갱신 - 타겟 노드 기준으로 노드를 다시 만들어서 붙여줌
     *
     * @param {Object} target 갱신 대상 노드
     * @private
     *
     * */
    _refresh: function(target) {
        this._changeTargetClass(target);

        var drawData = target.childNodes,
            targetId = target.get('id');

        if (targetId && targetId !== this.root.getAttribute('id')) {
            this._refreshPartOfTree(target);
        } else {
            this._draw(this._makeHTML(drawData));
        }

    },
    /**
     * 노드 부분 갱신 - 타겟노드가 최상위 노드가 아닐 경우 부분갱신한다.
     *
     * @param {Object} target 갱신 대상 노드
     * @private
     *
     * */
    _refreshPartOfTree: function(target) {
        var targetId = target.get('id'),
            targetElement = document.getElementById(targetId),
            parent = target.parent,
            parentId = parent.get('id'),
            childWrapper = targetElement.getElementsByTagName('ul') && targetElement.getElementsByTagName('ul')[0],
            hasChildWrapper = !!childWrapper,
            drawData,
            prePath;

        // 갱신 대상으로 지정된 타겟이 자식노드를 가지고 있는지에 따라 갱신대상을 바꾼다.
        if (hasChildWrapper) {
            drawData = target.childNodes;
        } else {
            // 갱신대상이 자식노드를 가지고 있지 않으면 더 윗노드로 이동하여 갱신한다.
            targetElement = document.getElementById(parentId);
            childWrapper = targetElement.parentNode.getElementsByTagName('ul')[0];
            drawData = parent.childNodes;
        }

        // 더위의 노드가 최상위 노드일경우 prePath를 갖지 않는다.
        prePath = targetElement.parentNode.getAttribute('path');
        if (!prePath) {
            this._draw(this._makeHTML(drawData));
        } else {
            this._draw(this._makeHTML(drawData, prePath), childWrapper);
        }
    },
    /**
     * 노드 이름 변경
     *
     * @param {Object} target 이름변경된 노드정보
     * @private
     *
     * */
    _rename: function(target) {
        var targetId = target.get('id'),
            targetElement = document.getElementById(targetId);
        targetElement.innerHTML = target.title;
    },
    /**
     * 노드 여닫기 상태를 갱신한다.
     *
     * @param {Object} target 갱신할 노드 정보
     * @private
     *
     * */
    _toggle: function(target) {

        var targetElement = document.getElementById(target.get('id')),
            parent = targetElement.parentNode,
            childWrap = parent.getElementsByTagName('ul')[0],
            button = parent.getElementsByTagName('button')[0];

        var state = this[target.state + 'Set'][0],
            label = this[target.state + 'Set'][1],
            isOpen = target.get('state') === 'open';

        parent.className = parent.className.replace(this.openSet[0], '').replace(this.closeSet[0], '') + state;
        childWrap.style.display = isOpen ? '' : 'none';
        button.innerHTML = label;

    },
    /**
     * 노드 선택시 표시변경
     *
     * @param {Object} target 선택된 노드정보
     * @private
     *
     * */
    _select: function(target) {

        var span = document.getElementById(target.id);
        if (ne.util.isExisty(span)) {
            span.className = span.className.replace(' ' + this.onSelectClassName, '') + ' ' + this.onSelectClassName;
        }
    },
    /**
     * 노드 선택해제시 액션
     *
     * @param {Object} target 선택 해제 된 노드정보
     * @private
     *
     * */
    _unSelect: function(target) {

        var span = document.getElementById(target.id);
        if (ne.util.isExisty(span, 'className') && span.className.indexOf(this.onSelectClassName) !== -1) {
            span.className = span.className.replace(' ' + this.onSelectClassName, '');
        }

    }
});