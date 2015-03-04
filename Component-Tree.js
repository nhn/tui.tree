(function() {
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
     * 모델의 데이터를 가져온다
     *
     * **/
    getModelData: function() {
        return this.model.getData();
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
 * @fileoverview 트리의 노드를 구성한다
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 *
 * **/
ne.component.Tree.TreeNode = ne.util.defineClass(/** @lends Node.prototype */{
    /**
     *
     * 노드의 기본값및 옵션으로 받은 값들을 세팅한다
     *
     * @param {Object} options 노드 옵션
     *
     * **/
    init: function(options) {
        /**
         * 노드의 아이디값
         * @type {String}
         */
        this.id = options.id;
        /**
         * 노드의 타이틀
         * @type {String}
         */
        this.title = options.title;
        /**
         * 노드 타입(폴더인지 아닌지)
         * @type {String}
         */
        this.type = options.type || 'default';
        /**
         * 노드의 상태(닫혔는지 열렸는지)
         * @type {String}
         */
        this.state = options.state || 'close';
        /**
         * 노드의 차일드 노드
         *
         * @type {Array}
         */
        this.childNodes = null;
        /**
         * 부모 노드
         * @type {component.Tree.TreeNode}
         */
        this.parent = null;
        this.siblings = null;
    },
    /**
     *
     * 노드의 상태변경
     *
     * @param {String} type 변경할 노드의 필드값
     * @param {String} value 노드 옵션
     *
     * **/
    set: function(type, value) {
        this[type] = value;
    },
    /**
     * 노드의 상태를 받아오기
     *
     * @param {String} type 값을 가져올 노드의 필드값
     * @return {String}
     */
    get: function(type) {
        return this[type];
    }
});
/**
 * @fileoverview 트리에 이벤트를 등록한다
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 */

ne.component.Tree.TreeEvent = ne.util.defineClass(/** @lends Event.prototype */{
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

        ne.component.Tree.treeUtils.addEventListener(target, type, ne.util.bind(this._onClick, this, callback, type));

    },
    /**
     * 일반 클릭에 대한 핸들러 추가
     *
     * @param {Object} e 이벤트 객체
     * @private
     */
    _onClick: function(callback, type, e) {
        e = e || window.event;
        var eventTarget = e.target || e.srcElement,
            targetTag = eventTarget.tagName.toLowerCase(),
            paths = null;

        if (this._checkRightButton(e.which || e.button)) {
            ne.component.Tree.treeUtils.stopEvent(e);
            return;
        }

        if (targetTag === 'button') {
            var parent = eventTarget.parentNode;
            var valueElement = parent;
            paths = valueElement.getAttribute('path');
        }
        else {
            paths = eventTarget.getAttribute('path');
            if (!paths) {
                paths = eventTarget.parentNode.getAttribute('path');
            }
        }

        ne.util.extend(e, {
            eventType: type,
            isButton: targetTag === 'button',
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
        ne.component.Tree.treeUtils.addEventListener(target, 'click', ne.util.bind(this._onDoubleClick, this, callback, type));

    },
    /**
     * 더블클릭 핸들러
     * @param {Function} callback 이벤트 콜백
     * @param {String} type 이벤트 타입
     * @param {Event} e 이벤트객체
     * @private
     */
    _onDoubleClick: function(callback, type, e) {

        e = e || window.event;
        var eventTarget = e.target || e.srcElement,
            isButton = e.target.tagName.toUpperCase() === 'BUTTON',
            path = eventTarget.getAttribute('path') || eventTarget.parentNode.getAttribute('path'),
            eventTarget = eventTarget.parentNode.getAttribute('path') ? eventTarget.parentNode : eventTarget,
            text = eventTarget.innerText;

        if (isButton) {
            this.doubleClickTimer = null;
            return;
        }

        if (this._checkRightButton(e.which || e.button)) {
            this.doubleClickTimer = null;
            ne.component.Tree.treeUtils.stopEvent(e);
            return;
        }

        if (!(path || isNaN(path))) {
            this.doubleClickTimer = null;
            return;
        }

        if (this.targetPath && this.targetPath !== path) {
            this.doubleClickTimer = null;
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
            this.doubleClickTimer = setTimeout(ne.util.bind(function() {
                this.doubleClickTimer = null;
            }, this), 500);
        }

        this.targetPath = path;
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

/**
 * @fileoverview 트리를 구성하는 데이터를 조작함<br />데이터 변경사한 발생 시 뷰를 갱신함
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 *
 * **/
ne.component.Tree.TreeModel = ne.util.defineClass(/** @lends TreeModel.prototype */{
    init: function(options) {
        /**
         * 트리노드
         *
         * @type {component.Tree.TreeNode}
         */
        this.nodes = new ne.component.Tree.TreeNode({
            id: options.viewId,
            title: '',
            state: 'open'
        });
        /**
         * 노드 고유아이디를 붙이기 위한 카운트
         *
         * @type {number}
         */
        this.count = 0;
        /**
         * 모델의 변화를 구독하는 뷰들
         *
         * @type {Array}
         */
        this.views = [];
        /**
         * 노드의 기본상태
         *
         * @type {String}
         */
        this.nodeDefaultState = options.defaultState || 'close';
        /**
         * 복사및 붙여넣기시에 필요한 노드의 버퍼
         * @todo 복사및 붙여넣기 기능은 추후구현해야함
         *
         * @type {null}
         */
        this.buffer = null;
        /**
         * 아이디 생성을 위한 date
         * @type {number}
         */
        this.date = new Date().getTime();

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

        this.data = data;
        this._makeTree(this.data, this.nodes);

    },

    /**
     *
     * 모델이 변경이 일어날경우 갱신할 뷰를 등록함
     *
     * @param {Object} view 트리뷰
     *
     * **/

    listen: function(view) {

        this.views.push(view);

    },

    /**
     *
     * 모델이 뷰에 동작을 요청
     *
     * @private
     * @param {String} type 뷰에 전달될 동작타입
     * @param {Object} target 갱신대상이 될 타겟
     *
     * **/

    _notify: function(type, target) {

        ne.util.forEach(this.views, function(view) {
            view.action(type, target);
        });

    },

    /**
     *
     * 초기에 뷰에 요청될 최상단 노드들을 리턴해주는 메소드
     *
     *
     * **/

    getFirstChildren: function() {

        return this.nodes.childNodes;

    },
    /**
     *
     * 노드추가
     *
     * @param {String} path 노드가 추가될 부모의 위치값
     * @param {Object} insertObject 추가될 노드의 정보
     *
     * **/
    insertNode: function(path, insertDataList) {

        if (!insertDataList) {
            insertDataList = {title: 'no Title'};
        }

        if (!ne.util.isArray(insertDataList)) {
            insertDataList = [insertDataList];
        }

        var target = null;

        if (path) {
            target = this.findNode(path);
        }
        target = target || this.nodes;
        this._makeTree(insertDataList, target);
        this._notify('refresh', target);
    },
    /**
     *
     * 노드제거
     *
     * @param {String} path 제거될 노드의 위치값
     *
     * **/
    removeNode: function(path) {

        if (!path) {
            throw new Error('must insert target ID');
        }
        var removeTarget = this.findNode(path),
            parent = removeTarget.parent;
        parent.childNodes = ne.util.filter(parent.childNodes, function(element) {
            return element !== removeTarget;
        });
        removeTarget.parent = null;

        this._notify('remove', parent);
    },
    /**
     *
     * 노드를 찾아서 리턴
     *
     * @param {String} path 찾아와야 하는 노드의 패스
     * @return {Object}
     *
     **/
    findNode: function(path) {
        var result = null,
            paths = path.split(',');

        ne.util.forEach(paths, ne.util.bind(function(index) {
            if (result) {
                result = result.childNodes && result.childNodes[index];
            } else {
                result = this.nodes.childNodes && this.nodes.childNodes[index];
            }
        }, this));
        return result;

    },
    /**
     *
     * 노드트리 생성
     *
     * @param {Object} data 트리를 만들 기본 데이터
     * @param {Object} parent 이 속성이 있으면 부분트리를 만들어 연결한다.
     * @private
     *
     **/
    _makeTree: function(data, parent) {

        if (!parent.childNodes) {
            parent.childNodes = [];
        }

        //@Todo 정렬, 추후 조건에 따른 변화 필요(내림, 올림)
        ne.util.forEach(data, ne.util.bind(function(element, index) {
            var newNode = new ne.component.Tree.TreeNode({
                id: this._getIdentification(),
                title: element.title,
                state: this.nodeDefaultState
            });

            if (parent) {
                newNode.parent = parent;
                parent.childNodes.push(newNode);
            } else {
                newNode.parent = this.nodes;
            }

            if (element.children) {
                this._makeTree(element.children, newNode);
            }

        }, this));
    },
    /**
     *
     * 트리에 부여 될 고유아이디를 만들어 리턴한다
     *
     * @private
     * @return {String}
     *
     **/
    _getIdentification: function() {

        var identification = 'tree_' + this.date;
        return identification + '_' + this.count++;

    },
    /**
     *
     * 노드 이름을 변경한다.
     *
     * @param {String} path 이름을 변경할 노드의 패스값
     * @param {String} value 해당 노드의 타이틀을 변경하기 위한 값
     *
     **/
    renameNode: function(path, value) {

        var target = this.findNode(path);
        target.set('title', value);
        this._notify('rename', target);

    },
    /**
     *
     * 노드의 상태를 변경한다(여닫힘 상태)
     *
     * @param {String}  path 상태를 변경할 노드의 패스값
     *
     **/
    changeState: function(path) {
        var target = this.findNode(path);

        if (target.get('state') === 'open') {
            target.set('state', 'close');
        } else {
            target.set('state', 'open');
        }
        this._notify('toggle', target);

    },
    /**
     *
     * 현재 선택된 노드를 버퍼에 저장한다
     *
     * @param {String} path 선택된 노드 패스값
     *
     *
     * **/
    setBuffer: function(path) {
        this.clearBuffer();
        var target = this.findNode(path);
        this.buffer = target;
        this._notify('select', target);
    },
    /**
     * 버퍼를 비운다
     *
     */
    clearBuffer: function() {
        if (!this.buffer) {
            return;
        }
        var target = this.buffer;
        this.buffer = null;
        this._notify('unselect', target);
    },
    /**
     *모델의 노드 트리를 데이터를 가져온다
     *
     */
    getData: function() {
        return this.nodes;
    },
    /**
     * 트리 정렬
     * @param {array} path 정렬할 패스
     * @param {function} func 정렬 함수
     */
    sort: function(path, func) {
        var target = this.findNode(path) || this.nodes;
        target.childNodes.sort(func);
        this._notify('refresh', target);
    },
    /**
     * 노드 정렬에 사용
     *
     * @param data
     */
    sortChild: function(data) {

        data.sort(function(a, b) {
            if (a.title < b.title) {
                return -1;
            } else if (a.title > b.title) {
                return 1;
            } else {
                return 0;
            }
        });
    }
});

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

})();