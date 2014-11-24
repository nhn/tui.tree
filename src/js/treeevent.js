/**
 * @fileoverview 트리에 이벤트를 등록한다
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 */

ne.component.Tree.TreeEvent = ne.defineClass(/** @lends Event.prototype */{
    /**
     * 더블클릭을 판별하는 필드를 세팅한다.
     *
     * **/
    init: function() {

        this.doubleClickTimer = null;

    },
    /**
     * 이벤트를 추가한다, 이벤트가 더블클릭인지 아닌지에 따라 다르게 처리한다.
     *
     * @param {Object} target 이벤트가 등록되고 이벤트 핸들러의 컨텍스트가 될 객체
     * @param {String} type 이벤트 명
     * @param {Function} callback 이벤트 핸들러
     * @private
     *
     * **/
    add: function(target, type, callback) {

        if (type === 'doubleclick') {
            this._addDoubleClickEvent(target, type, callback);
        } else {
            this._addEventListener(target, type, callback);
        }

    },
    /**
     * 더블클릭이 아닌 일반적인 이벤트를 추가한다.
     *
     * @param {Object} target 이벤트가 등록되고 이벤트 핸들러의 컨텍스트가 될 객체
     * @param {String} type 이벤트 명
     * @param {Function} callback 이벤트 핸들러
     * @private
     *
     * **/
    _addEventListener: function(target, type, callback) {

        ne.component.Tree.treeUtils.addEventListener(target, type, ne.bind(this._onClick, this, callback, type));

    },
    /**
     * 일반 클릭에 대한 핸들러 추가
     *
     * @param {Object} e 이벤트 객체
     * @private
     */
    _onClick: function(callback, type, e) {
        var e = e || window.event,
            eventTarget = e.target || e.srcElement,
            targetTag = eventTarget.tagName.toLowerCase(),
            paths = null;

        if (this._checkRightButton(e.which || e.button)) {
            ne.component.Tree.treeUtils.stopEvent(e);
            return;
        }

        if (targetTag == 'button') {
            var parent = eventTarget.parentNode;
            var pathElement = parent.getElementsByTagName('span')[0];
            paths = pathElement.getAttribute('path');
        }
        else {
            paths = eventTarget.getAttribute('path');
        }

        ne.extend(e, {
            eventType: type,
            isButton: targetTag == 'button',
            target: eventTarget,
            paths: paths
        });
        callback(e);
    },
    /**
     * 더블클릭 이벤트를 추가한다.
     *
     * @param {Object} target 이벤트가 등록되고 이벤트 핸들러의 컨텍스트가 될 객체
     * @param {String} type 이벤트 명
     * @param {Function} callback 이벤트 핸들러
     * @private
     *
     * **/
    _addDoubleClickEvent: function(target, type, callback) {
        ne.component.Tree.treeUtils.addEventListener(target, 'click', ne.bind(this._onDeobleClick, this, callback, type));

    },
    _onDeobleClick: function(callback, type, e) {

        var e = e || window.event,
            eventTarget = e.target || e.srcElement,
            path = eventTarget.getAttribute('path'),
            text = eventTarget.innerText;


        if (this._checkRightButton(e.which || e.button)) {
            this.doubleClickTimer = null;
            ne.component.Tree.treeUtils.stopEvent(e);
            return;
        }

        if (!(path || isNaN(path))) {
            this.doubleClickTimer = null;
            return;
        }

        if (this.doubleClickTimer) {
            callback({
                eventType: type,
                target: eventTarget,
                path: path,
                text: text
            });
            this.doubleClickTimer = null;
        } else {
            this.doubleClickTimer = setTimeout(ne.bind(function() {
                this.doubleClickTimer = null;
            }, this), 500);
        }
    },
    /**
     * 마우스 우클릭인지 확인한다.
     *
     * @param {Number} btnNumber 마우스 버튼 값
     * @private
     *
     * **/
    _checkRightButton: function(btnNumber) {

        var isRightButton = (btnNumber == 3 || btnNumber == 2);
        return isRightButton;

    }
});
