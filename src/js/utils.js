/**
 * 트리 컴포넌트에 쓰이는 헬퍼객체
 *
 * @namespace
 */
var utils = {
    /**
     * 객체를 합친다.
     *
     * @param {Object} obj 확장할 객체
     * @return {Object}
     */
    extend: function(obj) {
        if (!utils.isObject(obj)) return obj;
        var source, prop;
        for (var i = 1, length = arguments.length; i < length; i++) {
            source = arguments[i];
            for (prop in source) {
                if (Object.prototype.hasOwnProperty.call(source, prop)) {
                    obj[prop] = source[prop];
                }
            }
        }
        return obj;
    },
    /**
     * 객체인지 판별.
     *
     * @param {Object} obj 객체인지 판별한 대상 오브젝트
     * @return {Boolean}
     */
    isObject: function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    },
    /**
     * 함수인지 판별.
     *
     * @param {Object} obj 함수인지 판별한 대상 오브젝트
     * @return {Boolean}
     */
    isFunction: function(obj) {
        var type = typeof obj;
        return type === 'function';
    },
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
            element.detachEvent(ieeventName, handler);
        }
    },
    /**
     * 이벤트 전파를 막는다
     *
     * @param {Object} event 전파를 방지할 이벤트객체
     */
    stopEvent: function(event) {
        if (!event.stopPropagation) {
            event.stopPropagation = function() { event.cancelBubble = true; };
            event.preventDefault = function() { event.returnValue = false; };
        }
        event.preventDefault();
        event.stopPropagation();
    }
};
