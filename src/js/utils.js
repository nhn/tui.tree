/**
 * 트리 컴포넌트에 쓰이는 헬퍼객체
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @namespace
 */
ne.component.Tree.treeUtils = {
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
    }
};
