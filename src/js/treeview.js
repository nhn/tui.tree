/**
 * 화면에 보여지는 트리를 그리고, 갱신한다.
 *
 * @class
 */
var TreeView = Class.extend(/** @lends TreeView.prototype */{
    /**
     * TreeView 초기화한다.
     *
     * @param {String} id 루트의 아이디 값
     * @param {Object} data 트리 초기데이터 값
     * @param {Object} options 트리 초기옵션값
     * @param {String} template 트리에사용되는 기본 태그(자식노드가 있을때와 없을때를 오브젝트 형태로 받는)
     * */
    init: function (id, data, options, template) {

        this.template = template || {
            hasChild: '<li class="hasChild {{State}}">\
                        <button type="button">{{StateLabel}}</button>\
                        <span id="{{NodeID}}" path="{{Path}}" class="depth{{Depth}}">{{Title}}</span><em>{{DepthLabel}}</em>\
                        <ul class="subTree">\
                            {{ChildNodes}}\
                        </ul>\
                    </li>',
            leapNode: '<li class="leapNode">\
                    <button type="button">{{StateLabel}}</button>\
                    <span id="{{NodeID}}" path="{{Path}}" class="depth{{Depth}}">{{Title}}</span><em>{{DepthLabel}}</em>\
                </li>'
        };
        this.root = null;
        this.path = [];
        this.openSet = ['open', '-'];
        this.closeSet = ['close', '+'];
        this.depthLabels = options.depthLabels || [];

        if (id) {
            this.root = document.getElementById(id);
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
     * */
    _makeTree: function (drawData) {

        this._draw(this._makeHTML(drawData));

    },
    /**
     * 트리의 전체 혹은 일부 html 을 생성한다.
     *
     * @param {Object} data 화면에 그릴 데이터
     * @param {Path} beforePath 부분트리를 그릴때 상위 패스정보
     * @return {String} html
     * */
    _makeHTML: function (data, beforePath) {

        var childEl = [],
            beforePath = beforePath || null,
            path = '', html;

        data.forEach(function (element, index) {
            this.path.push(index);

            if (beforePath !== null) {
                path = [beforePath, this.path.join()].join();
            } else {
                path = this.path.join();
            }

            var depth = path.split(',').length,
                rate = this.depthLabels[depth - 1] || '';
            if (element.childNodes) {
                var state = this[element.state + 'Set'][0],
                    label = this[element.state + 'Set'][1],
                    el = this.template.hasChild.replace(/\{\{State\}\}/g, state);
                el = el.replace(/\{\{StateLabel\}\}/g, label),
                    el = el.replace(/\{\{NodeID\}\}/g, element.id),
                    el = el.replace(/\{\{Path\}\}/g, path),
                    el = el.replace(/\{\{Depth\}\}/g, depth),
                    el = el.replace(/\{\{Title\}\}/g, element.title),
                    el = el.replace(/\{\{DepthLabel\}\}/g, rate),
                    el = el.replace(/\{\{ChildNodes\}\}/g, this._makeHTML(element.childNodes, beforePath));
            } else {
                var el = this.template.leapNode.replace(/\{\{State\}\}/g, state);
                el = el.replace(/\{\{StateLabel\}\}/g, ''),
                    el = el.replace(/\{\{NodeID\}\}/g, element.id),
                    el = el.replace(/\{\{Path\}\}/g, path),
                    el = el.replace(/\{\{Depth\}\}/g, depth),
                    el = el.replace(/\{\{Title\}\}/g, element.title),
                    el = el.replace(/\{\{DepthLabel\}\}/g, rate);
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
     * */
    _changeTargetClass: function(nodeInfo) {

        var target = document.getElementById(nodeInfo.id);

        if (!target) {
            return void 0;
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
        if (type == 'remove') {
            this._remove(target);
        } else if (type == 'refresh') {
            this._refresh(target);
        } else if (type == 'rename') {
            this._rename(target);
        } else if (type == 'expand') {
            this._expand(target);
        } else if (type == 'select') {
            this._select(target);
        } else if (type == 'unselect') {
            this._unSelect(target);
        }
    },
    /**
     * 생성된 html을 붙인다
     *
     * @param {String} html 데이터에 의해 생성된 html
     * @param {Object} parent 타겟으로 설정된 부모요소, 없을시 내부에서 최상단 노드로 설정
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
     * */
    _refresh: function(target) {

        this._changeTargetClass(target);

        var drawData = target.childNodes;

        if (!target.id) {
            this._draw(this._makeHTML(drawData));
        } else {
            var targetElement = document.getElementById(target.id),
                childWrap = targetElement.lastChild;

            if (childWrap.nodeType != 1) {
                if (target.parent.id) {
                    targetElement = document.getElementById(target.parent.id);
                    childWrap = targetElement.lastChild;
                    drawData = target.parent.childNodes;
                    var prefix = targetElement.getAttribute('path');
                    this._draw(this._makeHTML(drawData, prefix), childWrap);
                } else {
                    drawData = target.parent.childNodes;
                    this._draw(this._makeHTML(drawData));
                }
            }
        }

    },
    /**
     * 노드 이름 변경
     *
     * @param {Object} target 이름변경된 노드정보
     * */
    _rename: function(target) {

        var targetElement = document.getElementById(target.id);
        targetElement.innerHTML = target.title;

    },
    /**
     * 노드 여닫기 상태를 갱신한다.
     *
     * @param {Object} target 갱신할 노드 정보
     * */
    _expand: function(target) {
        var targetElement = document.getElementById(target.id),
            parent = targetElement.parentNode,
            button = parent.getElementsByTagName('button')[0];

        if (target.state == 'open') {
            parent.className = parent.className.replace('close', 'open');
            button.innerHTML = '-';
        } else {
            parent.className = parent.className.replace('open', 'close');
            button.innerHTML = '+';
        }
    },
    /**
     * 노드 선택시 표시변경
     *
     * @param {Object} target 선택된 노드정보
     * */
    _select: function(target) {
        var span = document.getElementById(target.id);
        span.className = span.className.replace(' select', '');
        span.className += ' select';
    },
    /**
     * 노드 선택해제시 액션
     *
     * @param {Object} target 선택 해제 된 노드정보
     * */
    _unSelect: function(target) {
        var span = document.getElementById(target.id);
        span.className = span.className.replace(' select', '');
    }
});