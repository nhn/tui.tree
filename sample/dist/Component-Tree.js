(function() {
/**
 * @fileoverview 클래스와 비슷한방식으로 생성자를 만들고 상속을 구현할 수 있는 메소드를 제공하는 모듈
 * @author FE개발팀
 * @dependency inheritance.js, object.js
 */

(function(ne) {
    'use strict';
    if (!ne) {
        ne = window.ne = {};
    }
    if (!ne.util) {
        ne.util = window.ne.util = {};
    }

    /**
     * 객체의 생성및 상속을 편하게 도와주는 메소드
     * @param {*} [parent] 상속받을 생성자.
     * @param {Object} props 생성할 생성자의프로토타입에 들어갈 멤버들
     * @param {Function} props.init 인스턴스가 생성될때 실행됨
     * @param {Object} props.static 생성자의 클래스 맴버형태로 들어갈 멤버들
     * @returns {*}
     * @example
     *
     * var Parent = defineClasss({
     *     init: function() {
     *         this.name = 'made by def';
     *     },
     *     method: function() {
     *         //..can do something with this
     *     },
     *     static: {
     *         staticMethod: function() {
     *              //..do something
     *         }
     *     }
     * });
     *
     * var Child = defineClass(Parent, {
     *     method2: function() {}
     * });
     *
     *
     * Parent.staticMethod();
     *
     * var parentInstance = new Parent();
     * console.log(parentInstance.name); //made by def
     * parentInstance.staticMethod(); // Error
     *
     *
     * var childInstance = new Child();
     * childInstance.method();
     * childInstance.method2();
     *
     *
     */
    var defineClass = function(parent, props) {
        var obj;

        if (!props) {
            props = parent;
            parent = null;
        }

        obj = props.init || function(){};

        parent && ne.util.inherit(obj, parent);

        if (props.hasOwnProperty('static')) {
            ne.util.extend(obj, props.static);
            delete props.static;
        }

        ne.util.extend(obj.prototype, props);

        return obj;
    };

    ne.util.defineClass = defineClass;

})(window.ne);

/**
 * @fileoverview 객체나 배열을 다루기위한 펑션들이 정의 되어있는 모듈
 * @author FE개발팀
 * @dependency type.js, object.js
 */

(function(ne) {
    'use strict';
    if (!ne) {
        ne = window.ne = {};
    }
    if (!ne.util) {
        ne.util = window.ne.util = {};
    }

    /**
     * 배열나 유사배열를 순회하며 콜백함수에 전달한다.
     * 콜백함수가 false를 리턴하면 순회를 종료한다.
     * @param {Array} arr
     * @param {Function} iteratee  값이 전달될 콜백함수
     * @param {*} [context] 콜백함수의 컨텍스트
     * @example
     *
     * var sum = 0;
     *
     * forEachArray([1,2,3], function(value){
     *     sum += value;
     * });
     *
     * => sum == 6
     */
    function forEachArray(arr, iteratee, context) {
        var index = 0,
            len = arr.length;

        for (; index < len; index++) {
            if (iteratee.call(context || null, arr[index], index, arr) === false) {
                break;
            }
        }
    }


    /**
     * obj에 상속된 프로퍼티를 제외한 obj의 고유의 프로퍼티만 순회하며 콜백함수에 전달한다.
     * 콜백함수가 false를 리턴하면 순회를 중료한다.
     * @param {object} obj
     * @param {Function} iteratee  프로퍼티가 전달될 콜백함수
     * @param {*} [context] 콜백함수의 컨텍스트
     * @example
     * var sum = 0;
     *
     * forEachOwnProperties({a:1,b:2,c:3}, function(value){
     *     sum += value;
     * });
     *
     * => sum == 6
     **/
    function forEachOwnProperties(obj, iteratee, context) {
        var key;

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (iteratee.call(context || null, obj[key], key, obj) === false) {
                    break;
                }
            }
        }
    }

    /**
     * 파라메터로 전달된 객체나 배열를 순회하며 데이터를 콜백함수에 전달한다.
     * 유사배열의 경우 배열로 전환후 사용해야함.(ex2 참고)
     * 콜백함수가 false를 리턴하면 순회를 종료한다.
     * @param {*} obj 순회할 객체
     * @param {Function} iteratee 데이터가 전달될 콜백함수
     * @param {*} [context] 콜백함수의 컨텍스트
     * @example
     *
     * //ex1)
     * var sum = 0;
     *
     * forEach([1,2,3], function(value){
     *     sum += value;
     * });
     *
     * => sum == 6
     *
     * //ex2) 유사 배열사용
     * function sum(){
     *     var factors = Array.prototype.slice.call(arguments); //arguments를 배열로 변환, arguments와 같은정보를 가진 새 배열 리턴
     *
     *     forEach(factors, function(value){
     *          ......
     *     });
     * }
     *
     **/
    function forEach(obj, iteratee, context) {
        var key,
            len;

        if (ne.util.isArray(obj)) {
            for (key = 0, len = obj.length; key < len; key++) {
                iteratee.call(context || null, obj[key], key, obj);
            }
        } else {
            ne.util.forEachOwnProperties(obj, iteratee, context);
        }
    }

    /**
     * 파라메터로 전달된 객체나 배열를 순회하며 콜백을 실행한 리턴값을 배열로 만들어 리턴한다.
     * 유사배열의 경우 배열로 전환후 사용해야함.(forEach example참고)
     * @param {*} obj 순회할 객체
     * @param {Function} iteratee 데이터가 전달될 콜백함수
     * @param {*} [context] 콜백함수의 컨텍스트
     * @returns {Array}
     * @example
     * map([0,1,2,3], function(value) {
     *     return value + 1;
     * });
     *
     * => [1,2,3,4];
     */
    function map(obj, iteratee, context) {
        var resultArray = [];

        ne.util.forEach(obj, function() {
            resultArray.push(iteratee.apply(context || null, arguments));
        });

        return resultArray;
    }

    /**
     * 파라메터로 전달된 객체나 배열를 순회하며 콜백을 실행한 리턴값을 다음 콜백의 첫번째 인자로 넘겨준다.
     * 유사배열의 경우 배열로 전환후 사용해야함.(forEach example참고)
     * @param {*} obj 순회할 객체
     * @param {Function} iteratee 데이터가 전달될 콜백함수
     * @param {*} [context] 콜백함수의 컨텍스트
     * @returns {*}
     * @example
     * reduce([0,1,2,3], function(stored, value) {
     *     return stored + value;
     * });
     *
     * => 6;
     */
    function reduce(obj, iteratee, context) {
        var keys,
            index = 0,
            length,
            store;


        if (!ne.util.isArray(obj)) {
            keys = ne.util.keys(obj);
        }

        length = keys ? keys.length : obj.length;

        store = obj[keys ? keys[index++] : index++];

        for (; index < length; index++) {
            store = iteratee.call(context || null, store, obj[keys ? keys[index] : index]);
        }

        return store;
    }
    /**
     * 유사배열을 배열 형태로 변환한다.
     * - IE 8 이하 버전에서 Array.prototype.slice.call 이 오류가 나는 경우가 있어 try-catch 로 예외 처리를 한다.
     * @param {*} arrayLike 유사배열
     * @return {Array}
     * @example


     var arrayLike = {
        0: 'one',
        1: 'two',
        2: 'three',
        3: 'four',
        length: 4
    };
     var result = toArray(arrayLike);

     => ['one', 'two', 'three', 'four'];
     */
    function toArray(arrayLike) {
        var arr;
        try {
            arr = Array.prototype.slice.call(arrayLike);
        } catch (e) {
            arr = [];
            forEachArray(arrayLike, function(value) {
                arr.push(value);
            });
        }
        return arr;
    }

    /**
     * 파라메터로 전달된 객체나 어레이를 순회하며 콜백을 실행한 리턴값을 다음 콜백의 첫번째 인자로 넘겨준다.
     * @param {*} obj 순회할 객체나 배열
     * @param {Function} iteratee 데이터가 전달될 콜백함수
     * @param {*} [context] 콜백함수의 컨텍스트
     * @returns {*}
     * @example
     * filter([0,1,2,3], function(value) {
     *     return (value % 2 === 0);
     * });
     *
     * => [0, 2];
     * filter({a : 1, b: 2, c: 3}, function(value) {
     *     return (value % 2 !== 0);
     * });
     *
     * => {a: 1, c: 3};
     */
    var filter = function(obj, iteratee, context) {
        var result = ne.util.isArray(obj) ? [] : {},
            value,
            key;

        if (!ne.util.isObject(obj) || !ne.util.isFunction(iteratee)) {
            throw new Error('wrong parameter');
        }

        ne.util.forEach(obj, function() {
            if (iteratee.apply(context || null, arguments)) {
                value = arguments[0];
                key = arguments[1];
                if (ne.util.isArray(obj)) {
                    result.push(value);
                } else {
                    result[key] = value;
                }
            }
        }, context);

        return result;
    };

    ne.util.forEachOwnProperties = forEachOwnProperties;
    ne.util.forEachArray = forEachArray;
    ne.util.forEach = forEach;
    ne.util.toArray = toArray;
    ne.util.map = map;
    ne.util.reduce = reduce;
    ne.util.filter = filter;
})(window.ne);

/**
 * @fileoverview 타입체크 모듈
 * @author FE개발팀
 */

(function(ne) {
    'use strict';
    /* istanbul ignore if */
    if (!ne) {
        ne = window.ne = {};
    }
    if (!ne.util) {
        ne.util = window.ne.util = {};
    }

    /**
     * 값이 정의되어 있는지 확인(null과 undefined가 아니면 true를 반환한다)
     * @param {*} obj
     * @param {(String|Array)} [key]
     * @returns {boolean}
     * @example
     *
     * var obj = {a: {b: {c: 1}}};
     * a 가 존재하는지 확인한다(존재함, true반환)
     * ne.util.isExisty(a);
     * => true;
     * a 에 속성 b 가 존재하는지 확인한다.(존재함, true반환)
     * ne.util.isExisty(a, 'b');
     * => true;
     * a 의 속성 b에 c가 존재하는지 확인한다.(존재함, true반환)
     * ne.util.isExisty(a, 'b.c');
     * => true;
     * a 의 속성 b에 d가 존재하는지 확인한다.(존재하지 않음, false반환)
     * ne.util.isExisty(a, 'b.d');
     * => false;
     */
    function isExisty(obj, key) {
        if (arguments.length < 2) {
            return !isNull(obj) && !isUndefined(obj);
        }
        if (!isObject(obj)) {
            return false;
        }

        key = isString(key) ? key.split('.') : key;

        if (!isArray(key)) {
            return false;
        }
        key.unshift(obj);

        var res = ne.util.reduce(key, function(acc, a) {
            if (!acc) {
                return;
            }
            return acc[a];
        });
        return !isNull(res) && !isUndefined(res);
    }

    /**
     * 인자가 undefiend 인지 체크하는 메서드
     * @param obj
     * @returns {boolean}
     */
    function isUndefined(obj) {
        return obj === undefined;
    }

    /**
     * 인자가 null 인지 체크하는 메서드
     * @param {*} obj
     * @returns {boolean}
     */
    function isNull(obj) {
        return obj === null;
    }

    /**
     * 인자가 null, undefined, false가 아닌지 확인하는 메서드
     * (0도 true로 간주한다)
     *
     * @param {*} obj
     * @return {boolean}
     */
    function isTruthy(obj) {
        return isExisty(obj) && obj !== false;
    }

    /**
     * 인자가 null, undefined, false인지 확인하는 메서드
     * (truthy의 반대값)
     * @param {*} obj
     * @return {boolean}
     */
    function isFalsy(obj) {
        return !isTruthy(obj);
    }


    var toString = Object.prototype.toString;

    /**
     * 인자가 arguments 객체인지 확인
     * @param {*} obj
     * @return {boolean}
     */
    function isArguments(obj) {
        var result = isExisty(obj) &&
            ((toString.call(obj) === '[object Arguments]') || 'callee' in obj);

        return result;
    }

    /**
     * 인자가 배열인지 확인
     * @param {*} obj
     * @return {boolean}
     */
    function isArray(obj) {
        return toString.call(obj) === '[object Array]';
    }

    /**
     * 인자가 객체인지 확인하는 메서드
     * @param {*} obj
     * @return {boolean}
     */
    function isObject(obj) {
        return obj === Object(obj);
    }

    /**
     * 인자가 함수인지 확인하는 메서드
     * @param {*} obj
     * @return {boolean}
     */
    function isFunction(obj) {
        return toString.call(obj) === '[object Function]';
    }

    /**
     * 인자가 숫자인지 확인하는 메서드
     * @param {*} obj
     * @return {boolean}
     */
    function isNumber(obj) {
        return toString.call(obj) === '[object Number]';
    }

    /**
     * 인자가 문자열인지 확인하는 메서드
     * @param obj
     * @return {boolean}
     */
    function isString(obj) {
        return toString.call(obj) === '[object String]';
    }

    /**
     * 인자가 불리언 타입인지 확인하는 메서드
     * @param {*} obj
     * @return {boolean}
     */
    function isBoolean(obj) {
        return toString.call(obj) === '[object Boolean]';
    }

    /**
     * 인자가 HTML Node 인지 검사한다. (Text Node 도 포함)
     * @param {HTMLElement} html
     * @return {Boolean} HTMLElement 인지 여부
     */
    function isHTMLNode(html) {
        if (typeof(HTMLElement) === 'object') {
            return (html && (html instanceof HTMLElement || !!html.nodeType));
        }
        return !!(html && html.nodeType);
    }
    /**
     * 인자가 HTML Tag 인지 검사한다. (Text Node 제외)
     * @param {HTMLElement} html
     * @return {Boolean} HTMLElement 인지 여부
     */
    function isHTMLTag(html) {
        if (typeof(HTMLElement) === 'object') {
            return (html && (html instanceof HTMLElement));
        }
        return !!(html && html.nodeType && html.nodeType === 1);
    }
    /**
     * null, undefined 여부와 순회 가능한 객체의 순회가능 갯수가 0인지 체크한다.
     * @param {*} obj 평가할 대상
     * @return {boolean}
     */
    function isEmpty(obj) {
        var key,
            hasKey = false;

        if (!isExisty(obj)) {
            return true;
        }

        if (isArray(obj) || isArguments(obj)) {
            return obj.length === 0;
        }

        if (isObject(obj) && !isFunction(obj)) {
            ne.util.forEachOwnProperties(obj, function() {
                hasKey = true;
                return false;
            });

            return !hasKey;
        }

        return true;

    }

    /**
     * isEmpty 메서드와 반대로 동작한다.
     * @param {*} obj 평가할 대상
     * @return {boolean}
     */
    function isNotEmpty(obj) {
        return !isEmpty(obj);
    }


    ne.util.isExisty = isExisty;
    ne.util.isUndefined = isUndefined;
    ne.util.isNull = isNull;
    ne.util.isTruthy = isTruthy;
    ne.util.isFalsy = isFalsy;
    ne.util.isArguments = isArguments;
    ne.util.isArray = Array.isArray || isArray;
    ne.util.isObject = isObject;
    ne.util.isFunction = isFunction;
    ne.util.isNumber = isNumber;
    ne.util.isString = isString;
    ne.util.isBoolean = isBoolean;
    ne.util.isHTMLNode = isHTMLNode;
    ne.util.isHTMLTag = isHTMLTag;
    ne.util.isEmpty = isEmpty;
    ne.util.isNotEmpty = isNotEmpty;

})(window.ne);
/**
 * @fileoverview
 * @author FE개발팀
 */

(function(ne) {
    'use strict';
    /* istanbul ignore if */
    if (!ne) {
        ne = window.ne = {};
    }
    if (!ne.util) {
        ne.util = window.ne.util = {};
    }

    /**
     * 데이터 객체를 확장하는 메서드 (deep copy 는 하지 않는다)
     * @param {object} target - 확장될 객체
     * @param {...object} objects - 프로퍼티를 복사할 객체들
     * @return {object}
     */
    function extend(target, objects) {
        var source,
            prop,
            hasOwnProp = Object.prototype.hasOwnProperty,
            i,
            len;

        for (i = 1, len = arguments.length; i < len; i++) {
            source = arguments[i];
            for (prop in source) {
                if (hasOwnProp.call(source, prop)) {
                    target[prop] = source[prop];
                }
            }
        }
        return target;
    }

    /**
     * @type {number}
     */
    var lastId = 0;

    /**
     * 객체에 unique한 ID를 프로퍼티로 할당한다.
     * @param {object} obj - ID를 할당할 객체
     * @return {number}
     */
    function stamp(obj) {
        obj.__fe_id = obj.__fe_id || ++lastId;
        return obj.__fe_id;
    }

    function resetLastId() {
        lastId = 0;
    }

    /**
     * 객체를 전달받아 객체의 키목록을 배열로만들어 리턴해준다.
     * @param obj
     * @returns {Array}
     */
    var keys = function(obj) {
        var keys = [],
            key;

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        return keys;
    };

    ne.util.extend = extend;
    ne.util.stamp = stamp;
    ne.util._resetLastId = resetLastId;
    ne.util.keys = Object.keys || keys;

})(window.ne);
/**
 * @fileoverview 함수관련 메서드 모음
 * @author FE개발팀
 */

(function(ne) {
    'use strict';
    /* istanbul ignore if */
    if (!ne) {
        ne = window.ne = {};
    }
    if (!ne.util) {
        ne.util = window.ne.util = {};
    }

    /**
     * 커링 메서드
     * @param {function()} fn
     * @param {*} obj - this로 사용될 객체
     * @return {function()}
     */
    function bind(fn, obj) {
        var slice = Array.prototype.slice;

        if (fn.bind) {
            return fn.bind.apply(fn, slice.call(arguments, 1));
        }

        /* istanbul ignore next */
        var args = slice.call(arguments, 2);

        /* istanbul ignore next */
        return function() {
            /* istanbul ignore next */
            return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
        };
    }

    ne.util.bind = bind;

})(window.ne);
/**
 * @fileoverview 옵저버 패턴을 이용하여 객체 간 커스텀 이벤트를 전달할 수 있는 기능을 제공하는 모듈
 * @author FE개발팀
 * @dependency type.js, collection.js object.js
 */

(function(ne) {
    'use strict';
    /* istanbul ignore if */
    if (!ne) {
        ne = window.ne = {};
    }
    if (!ne.util) {
        ne.util = window.ne.util = {};
    }

    /**
     * 이벤트 핸들러에 저장되는 단위
     * @typedef {object} eventItem
     * @property {object.<string, object>} eventObject
     * @property {function()} eventObject.fn 이벤트 핸들러 함수
     * @property {*} [eventObject.ctx] 이벤트 핸들러 실행 시 컨텍스트 지정가능
     */


    /**
     * 커스텀 이벤트 클래스
     * @constructor
     * @exports CustomEvents
     * @class
     */
    function CustomEvents() {

        /**
         * 이벤트 핸들러를 저장하는 객체
         * @type {object.<string, eventItem>}
         * @private
         */
        this._events = {};
    }

    var CustomEventMethod = /** @lends CustomEvents */ {
        /**
         * 인스턴스가 발생하는 이벤트에 핸들러를 등록하는 메서드
         * @param {(object|String)} types - 이벤트 타입 (타입과 함수 쌍으로 된 객체를 전달할 수도 있고 타입만
         * 전달할 수 있다. 후자의 경우 두 번째 인자에 핸들러를 전달해야 한다.)
         * @param {function()=} fn - 이벤트 핸들러 목록
         * @param {*=} context
         * @example
         * // 첫 번째 인자에 이벤트명:핸들러 데이터 객체를 넘긴 경우
         * instance.on({
         *     zoom: function() {},
         *     pan: function() {}
         * }, this);
         *
         * // 여러 이벤트를 한 핸들러로 처리할 수 있도록 함
         * instance.on('zoom pan', function() {});
         */
        on: function(types, fn, context) {
            this._toggle(true, types, fn, context);
        },

        /**
         * 인스턴스에 등록했던 이벤트 핸들러를 해제할 수 있다.
         * @param {(object|string)=} types 등록 해지를 원하는 이벤트 객체 또는 타입명. 아무 인자도 전달하지 않으면 모든 이벤트를 해제한다.
         * @param {Function=} fn
         * @param {*=} context
         * @example
         * // zoom 이벤트만 해제
         * instance.off('zoom', onZoom);
         *
         * // pan 이벤트 해제 (이벤트 바인딩 시에 context를 넘겼으면 그대로 넘겨주어야 한다)
         * instance.off('pan', onPan, this);
         *
         * // 인스턴스 내 모든 이벤트 해제
         * instance.off();
         */
        off: function(types, fn, context) {
            if (!ne.util.isExisty(types)) {
                this._events = null;
                return;
            }

            this._toggle(false, types, fn, context);
        },

        /**
         * on, off 메서드의 중복 코드를 줄이기 위해 만든 on토글 메서드
         * @param {boolean} isOn
         * @param {(Object|String)} types - 이벤트 타입 (타입과 함수 쌍으로 된 객체를 전달할 수도 있고 타입만
         * 전달할 수 있다. 후자의 경우 두 번째 인자에 핸들러를 전달해야 한다.)
         * @param {function()=} fn - 이벤트 핸들러 목록
         * @param {*=} context
         * @private
         */
        _toggle: function(isOn, types, fn, context) {
            var methodName = isOn ? '_on' : '_off',
                method = this[methodName];

            if (ne.util.isObject(types)) {
                ne.util.forEachOwnProperties(types, function(handler, type) {
                    method.call(this, type, handler, fn);
                }, this);
            } else {
                types = types.split(' ');

                ne.util.forEach(types, function(type) {
                    method.call(this, type, fn, context);
                }, this);
            }
        },

        /**
         * 내부적으로 실제로 이벤트를 등록하는 로직을 담는 메서드.
         *
         * 옵션에 따라 이벤트를 배열에 등록하기도 하고 해시에 등록하기도 한다.
         *
         * 두개를 사용하는 기준:
         *
         * 핸들러가 이미 this바인딩이 되어 있고 핸들러를 사용하는 object가 같은 종류가 동시다발적으로 생성/삭제되는 경우에는 context인자를
         * 전달하여 해시의 빠른 접근 속도를 이용하는 것이 좋다.
         *
         * @param {(object.<string, function()>|string)} type - 이벤트 타입 (타입과 함수 쌍으로 된 객체를 전달할 수도 있고 타입만
         * 전달할 수 있다. 후자의 경우 두 번째 인자에 핸들러를 전달해야 한다.)
         * @param {function()} fn - 이벤트 핸들러
         * @param {*=} context
         * @private
         */
        _on: function(type, fn, context) {
            var events = this._events = this._events || {},
                contextId = context && (context !== this) && ne.util.stamp(context);

            if (contextId) {
                /*
                 context가 현재 인스턴스와 다를 때 context의 아이디로 내부의 해시에서 빠르게 해당 핸들러를 컨트롤 하기 위한 로직.
                 이렇게 하면 동시에 많은 이벤트를 발생시키거나 제거할 때 성능면에서 많은 이점을 제공한다.
                 특히 동시에 많은 엘리먼트들이 추가되거나 해제될 때 도움이 될 수 있다.
                 */
                var indexKey = type + '_idx',
                    indexLenKey = type + '_len',
                    typeIndex = events[indexKey] = events[indexKey] || {},
                    id = ne.util.stamp(fn) + '_' + contextId; // 핸들러의 id + context의 id

                if (!typeIndex[id]) {
                    typeIndex[id] = {
                        fn: fn,
                        ctx: context
                    };

                    // 할당된 이벤트의 갯수를 추적해 두고 할당된 핸들러가 없는지 여부를 빠르게 확인하기 위해 사용한다
                    events[indexLenKey] = (events[indexLenKey] || 0) + 1;
                }
            } else {
                // fn이 이미 this 바인딩이 된 상태에서 올 경우 단순하게 처리해준다
                events[type] = events[type] || [];
                events[type].push({fn: fn});
            }
        },

        /**
         * 실제로 구독을 해제하는 메서드
         * @param {(object|string)=} type 등록 해지를 원하는 핸들러명
         * @param {function} fn
         * @param {*} context
         * @private
         */
        _off: function(type, fn, context) {
            var events = this._events,
                indexKey = type + '_idx',
                indexLenKey = type + '_len';

            if (!events) {
                return;
            }

            var contextId = context && (context !== this) && ne.util.stamp(context),
                listeners,
                id;

            if (contextId) {
                id = ne.util.stamp(fn) + '_' + contextId;
                listeners = events[indexKey];

                if (listeners && listeners[id]) {
                    listeners[id] = null;
                    events[indexLenKey] -= 1;
                }

            } else {
                listeners = events[type];

                if (listeners) {
                    ne.util.forEach(listeners, function(listener, index) {
                        if (ne.util.isExisty(listener) && (listener.fn === fn)) {
                            listeners.splice(index, 1);
                            return true;
                        }
                    });
                }
            }
        },

        /**
         * 이벤트를 발생시키는 메서드
         *
         * 등록한 리스너들의 실행 결과를 boolean AND 연산하여
         *
         * 반환한다는 점에서 {@link CustomEvents#fire} 와 차이가 있다
         *
         * 보통 컴포넌트 레벨에서 before 이벤트로 사용자에게
         *
         * 이벤트를 취소할 수 있게 해 주는 기능에서 사용한다.
         * @param {string} type
         * @param {object} data
         * @returns {*}
         * @example
         * // 확대 기능을 지원하는 컴포넌트 내부 코드라 가정
         * if (this.invoke('beforeZoom')) {    // 사용자가 등록한 리스너 결과 체크
         *     // 리스너의 실행결과가 true 일 경우
         *     // doSomething
         * }
         *
         * //
         * // 아래는 사용자의 서비스 코드
         * map.on({
         *     'beforeZoom': function() {
         *         if (that.disabled && this.getState()) {    //서비스 페이지에서 어떤 조건에 의해 이벤트를 취소해야한다
         *             return false;
         *         }
         *         return true;
         *     }
         * });
         */
        invoke: function(type, data) {
            if (!this.hasListener(type)) {
                return this;
            }

            var event = ne.util.extend({}, data, {type: type, target: this}),
                events = this._events;

            if (!events) {
                return;
            }

            var typeIndex = events[type + '_idx'],
                listeners,
                result = true;

            if (events[type]) {
                listeners = events[type].slice();

                ne.util.forEach(listeners, function(listener) {
                    result = result && !!listener.fn.call(this, event);
                }, this);
            }

            ne.util.forEachOwnProperties(typeIndex, function(eventItem) {
                result = result && !!eventItem.fn.call(eventItem.ctx, event);
            });

            return ne.util.isBoolean(result) ? result : false;
        },

        /**
         * 이벤트를 발생시키는 메서드
         * @param {string} type 이벤트 타입명
         * @param {(object|string)=} data 발생과 함께 전달할 이벤트 데이터
         * @return {*}
         * @example
         * instance.fire('move', { direction: 'left' });
         *
         * // 이벤트 핸들러 처리
         * instance.on('move', function(moveEvent) {
         *     var direction = moveEvent.direction;
         * });
         */
        fire: function(type, data) {
            this.invoke(type, data);
            return this;
        },

        /**
         * 이벤트 핸들러 존재 여부 확인
         * @param {string} type 핸들러명
         * @return {boolean}
         */
        hasListener: function(type) {
            var events = this._events,
                existyFunc = ne.util.isExisty;

            return existyFunc(events) && (existyFunc(events[type]) || events[type + '_len']);
        },

        /**
         * 등록된 이벤트 핸들러의 갯수 반환
         * @param {string} type
         * @returns {number}
         */
        getListenerLength: function(type) {
            var events = this._events,
                lenKey = type + '_len',
                length = 0,
                types,
                len;

            if (!ne.util.isExisty(events)) {
                return 0;
            }

            types = events[type];
            len = events[lenKey];

            length += (ne.util.isExisty(types) && ne.util.isArray(types)) ? types.length : 0;
            length += ne.util.isExisty(len) ? len : 0;

            return length;
        },

        /**
         * 단발성 커스텀 이벤트 핸들러 등록 시 사용
         * @param {(object|string)} types 이벤트명:핸들러 객체 또는 이벤트명
         * @param {function()=} fn 핸들러 함수
         * @param {*=} context
         */
        once: function(types, fn, context) {
            var that = this;

            if (ne.util.isObject(types)) {
                ne.util.forEachOwnProperties(types, function(type) {
                    this.once(type, types[type], fn);
                }, this);

                return;
            }

            function onceHandler() {
                fn.apply(context, arguments);
                that.off(types, onceHandler, context);
            }

            this.on(types, onceHandler, context);
        }

    };

    CustomEvents.prototype = CustomEventMethod;
    CustomEvents.prototype.constructor = CustomEvents;

    /**
     * 커스텀 이벤트 기능을 믹스인할 때 사용하는 메서드
     * @param {function()} func 생성자 함수
     * @example
     * // 모델 클래스 변경 시 컨트롤러에게 알림을 주고 싶은데
     * // 그 기능을 모델 클래스 자체에게 주고 싶다
     * function Model() {}
     *
     * // 커스텀 이벤트 믹스인
     * ne.util.CustomEvents.mixin(Model);
     *
     * var model = new Model();
     *
     * model.on('changed', function() {}, this);
     */
    CustomEvents.mixin = function(func) {
        ne.util.extend(func.prototype, CustomEventMethod);
    };

    ne.util.CustomEvents = CustomEvents;

})(window.ne);

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
        SUBTREE_CLASS: 'Subtree',
        VALUE_CLASS: 'valueClass',
        EDITABLE_CLASS: 'editableClass',
        TEMPLATE: {
            ROD_NODE: '<li class="rod_node {{State}}">' +
                        '<button type="button">{{StateLabel}}</button>' +
                        '<span id="{{NodeID}}" class="depth{{Depth}} {{ValueClass}}">{{Title}}</span><em>{{DepthLabel}}</em>' +
                        '<ul class="{{Subtree}}" style="display:{{Display}}">{{Children}}</ul>' +
                    '</li>',
            LEAP_NODE: '<li class="leap_node">' +
                        '<span id="{{NodeID}}" class="depth{{Depth}} {{ValueClass}}">{{Title}}</span><em>{{DepthLabel}}</em>' +
                    '</li>'
        },
        USE_DRAG: false,
        USE_HELPER: false
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
        stopEvent: function(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            //IE8 and Lower
            else {
                e.cancelBubble = true;
            }
        },
        /**
         * 이벤트 객체의 타겟을 반환한다
         * @param e
         * @returns {HTMLElement}
         */
        getTarget: function(e) {
            e = e || window.event;
            var target = e.target || e.srcElement;
            return target;
        },
        /**
         * 엘리먼트가 특정 클래스를 가지고 있는지 확인
         * @param {HTMLElement} element
         * @param {string} className
         * @returns {boolean}
         */
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
        /**
         * 클래스에 따른 엘리먼트 찾기
         * @param {HTMLElement} target
         * @param {string} className
         * @returns {*}
         */
        getElementsByClass: function(target, className) {
            if (target.querySelectorAll) {
                return target.querySelectorAll('.' + className);
            }
            var all = target.getElementsByTagName('*'),
                filter = [];

            all = ne.util.toArray(all);

            ne.util.forEach(all, function(el) {
                var cls = el.className || '';
                if (cls.indexOf(className) !== -1) {
                    filter.push(el);
                }
            });
            return filter;
        },
        /**
         * 우클릭인지 확인
         * @param {number} number 버튼 넘버
         * @returns {boolean}
         */
        isRightButton: function(number) {
            var isRight = (number === 3 || number === 2);
            return isRight;
        },
        testProp: function(props) {
            var style = document.documentElement.style;

            for (var i = 0; i < props.length; i++) {
                if (props[i] in style) {
                    return props[i];
                }
            }
            return false;
        },
        preventDefault: function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            return this;
        }
    };
    /**
     * 트리의 모델을 생성하고 모델에 데이터를 부여한다.
     * 이름이 변경될 때 사용된 인풋박스를 생성한다.
     * 모델에 뷰를 등록시킨다.
     * 트리의 뷰를 생성하고 이벤트를 부여한다.
     *
     * @param {string} id 트리가 붙을 앨리먼트의 아이디
     *      @param {Object} data 트리에 사용될 데이터
     *      @param {Object} options 트리에 사용될 세팅값
     *          @param {String} options.modelOption 모델이 들어갈 옵션 값
     *          @param {object} [options.template] 트리에 사용되는 기본 마크업
     *          @param {Array} [options.openSet] 노드가 열린 상태일때 클래스 명과 버튼 레이블
     *          @param {Array} [options.closeSet] 노드가 닫힌 상태일때 클래스 명과 버튼 레이블
     *          @param {string} [options.selectClass] 선택된 노드에 부여되는 클래스 명
     *          @param {string} [options.valueClass] 더블클릭이 되는 영역에 부여되는 클래스 명
     *          @param {string} [options.inputClass] input엘리먼트에 부여되는 클래스 명
     *          @param {string} [options.subtreeClass] 서브트리에 부여되는 클래스 명
     *          @param {Array} [options.depthLabels] 뷰에만 표시 될 기본 레이블
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

     var tree1 = new ne.component.Tree('id', data ,{
            modelOption: {
                defaultState: 'open'
            }
        });
    });
     * **/
    window.ne = ne = ne || {};
    ne.component = ne.component || {};

    ne.component.Tree = ne.util.defineClass(/** @lends TreeView.prototype */{

        /**
         * TreeView 초기화한다.
         *
         * @param {String} id 루트의 아이디 값
         * @param {Object} data 트리 초기데이터 값
         * @param {Object} options 트리 초기옵션값
         * @param {String} template 트리에 사용되는 기본 태그(자식노드가 있을때와 없을때를 오브젝트 형태로 받는)
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
            this.onselectClass = options.selectClass || DEFAULT.SELECT_CLASS;
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
            /**
             * 트리 서브 클래스
             * @type {string|*}
             */
            this.subtreeClass = options.subtreeClass || DEFAULT.SUBTREE_CLASS;
            /**
             * 드래그앤 드롭 기능을 사용할것인지 여부
             * @type {boolean|*}
             */
            this.useDrag = options.useDrag || DEFAULT.USE_DRAG;
            /**
             * 드래그앤 드롭 기능 동작시 가이드 엘리먼트 활성화 여부
             * @type {boolean|*}
             */
            this.useHelper = this.useDrag && (options.useHelper || DEFAULT.USE_HELPER);

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
            // 모델 데이터를 생성한다.
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

            util.addEventListener(this.root, 'click', ne.util.bind(this._onClick, this));
            util.addEventListener(this.inputElement, 'blur', ne.util.bind(this._onBlurInput, this));
            util.addEventListener(this.inputElement, 'keyup', ne.util.bind(this._onKeyup, this));

            if(this.useDrag) {
                this._addDragEvent();
            }
        },
        /**
         * 드래그앤 드롭 이벤트를 건다.
         * @private
         */
        _addDragEvent: function() {
            var userSelectProperty = util.testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);
            var supportSelectStart = 'onselectstart' in document;
            if (supportSelectStart) {
                util.addEventListener(this.root, 'selectstart', util.preventDefault);
            } else {
                var style = document.documentElement.style;
                style[userSelectProperty] = 'none';
            }
            util.addEventListener(this.root, 'mousedown', ne.util.bind(this._onMouseDown, this));
        },
        /**
         * 엔터키를 입력 할 시, 모드 변경
         * @private
         */
        _onKeyup: function(e) {
            if(e.keyCode === 13) {
                var target = util.getTarget(e);
                this.model.rename(this.current.id, target.value);
                this.changeState(this.current);
            }
        },
        /**
         * 노드명 변경 후, 포커스 아웃 될때 발생되는 이벤트 핸들러
         * @param {event} e
         * @private
         */
        _onBlurInput: function(e) {
            if(this.state === STATE.NORMAL) {
                return;
            }
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

            var tag = target.tagName.toUpperCase(),
                parent,
                valueEl;

            parent = target.parentNode;

            valueEl = util.getElementsByClass(parent, this.valueClass)[0];

            if(tag === 'INPUT') {
                return;
            }

            if(tag === 'BUTTON') {
                this.model.changeState(valueEl.id);
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
         * @param {event} e
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

            if(this.state === STATE.EDITABLE) {
                return;
            }

            util.preventDefault(e);

            var target = util.getTarget(e),
                tag;

            tag = target.tagName.toUpperCase();

            if(tag === 'BUTTON' || tag === 'INPUT' || !util.hasClass(target, this.valueClass)) {
                return;
            }

            this.pos = this.root.getBoundingClientRect();
            // 가이드를 사용하면 가이드 엘리먼트를 띄운다.
            if(this.useHelper) {
                this.enableHelper({
                    x: e.clientX - this.pos.left,
                    y: e.clientY - this.pos.top
                }, target.innerText || target.textContent);
            }

            this.move = ne.util.bind(this._onMouseMove, this);
            this.up = ne.util.bind(this._onMouseUp, this, target);

            util.addEventListener(document, 'mousemove', this.move);
            util.addEventListener(document, 'mouseup', this.up);
        },
        /**
         * 마우스 이동
         * @param {event} me
         * @private
         */
        _onMouseMove: function(me) {
            // 가이드 이동'
            if(!this.useHelper) {
                return;
            }
            this.setHelperLocation({
                x: me.clientX - this.pos.left,
                y: me.clientY - this.pos.top
            });
        },
        /**
         * 마우스 업 이벤트 핸들러
         * @param {HTMLElement} target 마우스 다운의 타겟 엘리먼트
         * @param {event} ue
         * @private
         */
        _onMouseUp: function(target, ue) {
            // 가이드 감춤
            this.disableHelper();

            var toEl = util.getTarget(ue),
                model = this.model,
                node = model.find(target.id),
                toNode = model.find(toEl.id),
                isDisable = model.isDisable(toNode, node);

            if (model.find(toEl.id) && toEl.id !== target.id && !isDisable) {
                model.move(target.id, node, toEl.id);
            }
            util.removeEventListener(document, 'mousemove', this.move);
            util.removeEventListener(document, 'mouseup', this.up);
        },
        /** 
         * 트리 드래그 앤 드롭하는 엘리먼트의 value값을 보여주는 가이드 엘리먼트를 활성화 한다.
         * @param {object} pos 클릭한 좌표 위치
         * @param {string} value 클릭한 앨리먼트 텍스트 값
         */
        enableHelper: function(pos, value) {
            if (!this.helperElement) {
                this.helperElement = document.createElement('span');
                this.helperElement.style.position = 'absolute';
                this.helperElement.style.display = 'none';
                this.root.parentNode.appendChild(this.helperElement);
            }
            this.helperElement.innerHTML = value;
        },
        /**
         * 가이드의 위치를 변경한다.
         * @param {object} pos 변경할 위치
         */
        setHelperLocation: function(pos) {
            this.helperElement.style.left = pos.x + 10 + 'px';
            this.helperElement.style.top = pos.y + 10 + 'px';
            this.helperElement.style.display = 'block';
        },
        /**
         * 가이드를 감춘다
         */
        disableHelper: function() {
            if(this.helperElement) {
                this.helperElement.style.display = 'none';
            }
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
                    map = {
                        State: state,
                        StateLabel: label,
                        NodeID: node.id,
                        Depth: depth,
                        Title: node.value,
                        ValueClass: this.valueClass,
                        SubTree: this.subtreeClass,
                        Display: node.state == 'open' ? '' : 'none',
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

            this.inputElement.focus();
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
         **/
        _unSelect: function(node) {
            var valueEl = document.getElementById(node.id);
            if (ne.util.isExisty(valueEl) && util.hasClass(valueEl, this.onselectClass)) {
                valueEl.className = valueEl.className.replace(' ' + this.onselectClass, '');
            }
        }
    });

})(ne);

/**
 * @fileoverview 트리를 구성하는 데이터를 조작, 데이터 변경사한 발생 시 뷰를 갱신함
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 * **/
ne.component.Tree.TreeModel = ne.util.defineClass(/** @lends TreeModel.prototype */{
    init: function(options, tree) {
        /**
         * 노드 고유아이디를 붙이기 위한 카운트, 갯수를 세는대 사용되진 않는다.
         *
         * @type {number}
         */
        this.count = 0;
        /**
         * 모델의 변화를 구독하는 뷰들
         *
         * @type {ne.component.Tree}
         */
        this.tree = tree;
        /**
         * 노드의 기본상태
         *
         * @type {String}
         */
        this.nodeDefaultState = options.defaultState || 'close';
        /**
         * 이동시에 필요한 노드의 버퍼
         * @type {null}
         */
        this.buffer = null;
        /**
         * 노드의 깊이를 저장하기 위한 변수
         * @type {number}
         */
        this.depth = 0;
        /**
         * 아이디 생성을 위한 date
         * @type {number}
         */
        this.date = new Date().getTime();
        /**
         * 트리해시
         * @type {object}
         * { node_1532525: {
         *      value: value,
         *      childKeys: [],
         *      parentId: 'node1523',
         *      id: node_1532525
         * }}
         */
        this.treeHash = {};
        this.treeHash['root'] = this.makeNode(0, 'root', 'root');

        this.connect(tree);
    },

    /**
     *
     * 모델에 트리형태의 데이터를 세팅함
     * 모델은 데이터를 받아 노드의 트리형태로 변경
     *
     * @param {Object} data 트리 입력데이터
     *
     * **/

    setData: function(data) {
        this.treeHash.root.childKeys = this._makeTreeHash(data);
    },

    /**
     * 계층적 데이터 구조를, 해쉬리스트 형태로 변경한다.
     * @param {array} data 해쉬리스트형태로 변경시킬 트리 데이터
     * @param {string} parentId 새로운 해쉬값으로 입력되는 노드의 부모노드의 id
     * @private
     */
    _makeTreeHash: function(data, parentId) {

        var childKeys = [];

        this.depth = this.depth + 1;

        ne.util.forEach(data, function(element) {

            // 아이디를 키값으로 가지는 해쉬 추
            var id = this._getId();

            this.treeHash[id] = this.makeNode(this.depth, id, element.value, parentId);

            // 자식노드가 있을 경우 재귀적으로 호출하여, 자식노드의 아이디리스트를 저장
            if (element.children) {
                this.treeHash[id].childKeys = this._makeTreeHash(element.children, id);
            }

            childKeys.push(id);
        }, this);

        this.depth = this.depth - 1;

        childKeys.sort(ne.util.bind(this.sort, this));

        return childKeys;
    },

    /**
     * 노드를 생성한다.
     * @param {number} depth 노드의 깊이
     * @param {string} id 노드의 아이디 값
     * @param {string} value 노드의 값
     * @param {string} parentId 부모 노드의 아이디
     * @returns {{value: *, parentId: (*|string), id: *}}
     */
    makeNode: function(depth, id, value, parentId) {
        return {
            depth: depth,
            value: value,
            parentId: depth === 0 ? null : (parentId || 'root'),
            state: this.nodeDefaultState,
            id: id
        };
    },

    /**
     *
     * 트리에 부여 될 고유아이디를 만들어 리턴한다
     *
     * @private
     * @return {String}
     *
     **/
    _getId: function() {

        return 'node_' + this.date + '_' + this.count++;

    },
    /**
     * 노드를 찾아서 리턴한다.
     * @param {string} key 찾을 노드의 키 값
     * @returns {object|undefined}
     */
    find: function(key) {
        return this.treeHash[key];
    },
    /**
     * 노드를 제거한다, 노드를 참조하고있는 부모의 자식목록에서도 제거한다.
     * @param {string} key 모델에서 제거할 노드의 키 값
     */
    remove: function(key) {
        // 참조된 값 먼저 제거
        var res = this.invoke('remove', { id: key});
        if(!res) {
            return;
        }
        this.removeKey(key);
        this.treeHash[key] = null;

        this.notify();
    },
    /**
     * 노드의 키값을 제거한다.
     * @param {string} key 제거할 노드의 키 값
     */
    removeKey: function(key) {
        var node = this.find(key);

        if (!node) {
            return;
        }

        // 자식 키 값을 제거한다.
        var parent = this.find(node.parentId);
        parent.childKeys = ne.util.filter(parent.childKeys, function(childKey) {
            return childKey !== key;
        });
    },
    /**
     * 노드를 이동시킨다
     * @param {string} key
     * @param {object} node
     * @param {string} targetId
     */
    move: function(key, node, targetId) {
        this.removeKey(key);
        this.treeHash[key] = null;
        this.insert(node, targetId);
    },
    /**
     * 노드를 삽입한다.
     * @param {object} node 삽입될 노드 값
     * @param {string} [targetId] 삽입할 노드의 부모가 될 타겟 아이디, 없으면 루트
     */
    insert: function(node, targetId) {

        var target = this.find(targetId || 'root');

        if (!target.childKeys) {
            target.childKeys = [];
        }

        target.childKeys.push(node.id);
        node.depth = target.depth + 1;
        node.parentId = targetId;
        // 정렬
        target.childKeys.sort(ne.util.bind(this.sort, this));

        this.treeHash[node.id] = node;

        this.notify();
    },

    /**
     * 트리를 갱신한다.
     */
    notify: function(type, target) {
        if (this.tree) {
            this.tree.notify(type, target);
        }
    },

    /**
     * 뷰와 모델을 연결한다. 모델에 변경이 일어날 경우, tree notify를 호출하여 뷰를 갱신한다.
     * @param {ne.component.Tree} tree
     */
    connect: function(tree) {
        if (!tree) {
            return;
        }
        this.tree = tree;
    },

    /**
     * 노드의 value를 변경한다.
     * @param {stirng} key 변경할 노드의 키값
     * @param {string} value 변경할 값
     */
    rename: function(key, value) {
        var res = this.invoke('rename', {id: key, value: value});
        if(!res) {
            return;
        }

        var node = this.find(key);
        node.value = value;

        this.notify('rename', node);
    },

    /**
     * 노드의 상태(여닫힘)을 갱신한다.
     * @param {string} key 상태를 변경할 노드의 키값
     */
    changeState: function(key) {
        var node = this.find(key);
        node.state = node.state === 'open' ? 'close' : 'open';
        this.notify('toggle', node);
    },
    /**
     * 현재 선택된 노드를 버퍼에 저장한다
     * @param {String} key 선택된 노드 패스값
     **/
    setBuffer: function(key) {
        this.clearBuffer();
        var node = this.find(key);
        this.notify('select', node);
        this.fire('select', {id: key, value: node.value });
        this.buffer = node;
    },
    /**
     * 버퍼를 비운다
     **/
    clearBuffer: function() {
        if (!this.buffer) {
            return;
        }
        this.notify('unselect', this.buffer);
        this.buffer = null;
    },
    /**
     * 이동할 노드가, 이동할 대상 노드의 부모노드인지 확인한다.
     * @param {object} dest 이동할 대상 노드
     * @param {object} node 이동할 노드
     */
    isDisable: function(dest, node) {
        // 뎁스가 같으면 계층 구조에 있을 가능성이 없으니 바로 false를 리턴한다.
        if(dest.depth === node.depth) {
            return false;
        }
        if(dest.parentId) {
            if(dest.id === node.parentId) {
                return true;
            }
            if(dest.parentId === node.id) {
                return true;
            } else {
                return this.isDisable(this.find(dest.parentId), node);
            }
        }
    },
    /**
     * 타이틀에 따른 정렬
     * @param {string} pid
     * @param {string} nid
     * @returns {number}
     */
    sort: function(pid, nid) {

        var p = this.find(pid),
            n = this.find(nid);

        if(!p || !n) {
            return 0;
        }
        if(p.value < n.value) {
            return -1;
        } else if(p.value > n.value) {
            return 1;
        } else {
            return 0;
        }
    }
});
ne.util.CustomEvents.mixin(ne.component.Tree.TreeModel);

})();