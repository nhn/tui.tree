/** polyfill.js
 *
 * Array.prototype.forEach {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach}
 *
 * */
if (!Array.prototype.forEach) {

    Array.prototype.forEach = function(callback, thisArg) {
        var T, k;
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }

        var O = Object(this),
            len = O.length >>> 0;

        if (typeof callback !== "function") {
            throw new TypeError(callback + ' is not a function');
        }

        if (arguments.length > 1) {
            T = thisArg;
        }
        k = 0;

        while (k < len) {

            var kValue;

            if (k in O) {
                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}
/**
 *
 * Array.prototype.filter {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter}
 *
 * */
if (!Array.prototype.filter) {

    Array.prototype.filter = function(fun/*, thisArg*/) {

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;

        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;

        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];

                if (fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
            }
        }

        return res;
    };
}

/**
 *
 * Function.prototype.bind {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind}
 *
 *
 * */
if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }

        var aArgs   = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP    = function() {},
            fBound  = function() {
                return fToBind.apply(this instanceof fNOP && oThis
                        ? this
                        : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}


/**
 *
 * document.getElementsByClassName {@link https://gist.github.com/eikes/2299607}
 *
 * */

if (!document.getElementsByClassName) {
    document.getElementsByClassName = function(search) {
        var d = this, elements, pattern, i, results = [];
        if (d.querySelectorAll) { // IE8
            return d.querySelectorAll('.' + search);
        }
        if (d.evaluate) { // IE6, IE7
            pattern = ".//*[contains(concat(' ', @class, ' '), ' " + search + " ')]";
            elements = d.evaluate(pattern, d, null, 0, null);
            while ((i = elements.iterateNext())) {
                results.push(i);
            }
        } else {
            elements = d.getElementsByTagName('*');
            pattern = new RegExp('(^|\\s)' + search + '(\\s|$)');
            for (i = 0; i < elements.length; i++) {
                if (pattern.test(elements[i].className)) {
                    results.push(elements[i]);
                }
            }
        }
        return results;
    };
}
/** Simple JavaScript Inheritance
* By John Resig http://ejohn.org/
* MIT Licensed.
*/
// Inspired by base2 and Prototype
(function(){
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();
/**
 * 트리 컴포넌트에 쓰이는 헬퍼객체
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
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

/**
 * 트리에 이벤트를 등록한다
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @class
 */

var TreeEvent = Class.extend(/** @lends Event.prototype */{
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

        utils.addEventListener(target, type, function(e) {

            var e = e || window.event,
                eventTarget = e.target || e.srcElement,
                targetTag = eventTarget.tagName.toLowerCase(),
                paths = null;

            if (this._checkRightButton(e.which || e.button)) {
                utils.stopEvent(e);
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

            utils.extend(e, {
                eventType: type,
                isButton: targetTag == 'button',
                target: eventTarget,
                paths: paths
            });
            callback(e);

        }.bind(this));

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
        utils.addEventListener(target, 'click', function(e) {

            var e = e || window.event,
                eventTarget = e.target || e.srcElement,
                path = eventTarget.getAttribute('path'),
                text = eventTarget.innerText;


            if (this._checkRightButton(e.which || e.button)) {
                this.doubleClickTimer = null;
                utils.stopEvent(e);
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
                this.doubleClickTimer = setTimeout(function() {
                    this.doubleClickTimer = null;
                }.bind(this), 500);
            }

        }.bind(this));

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
 * 트리의 노드를 구성한다
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @class
 *
 * **/
var Node = Class.extend(/** @lends Node.prototype */{
    /**
     *
     * 노드의 기본값및 옵션으로 받은 값들을 세팅한다
     *
     * @param {Object} options 노드 옵션
     *
     * **/
    init: function(options) {
        this.id = options.id;
        this.title = options.title;
        this.type = options.type || 'default';
        this.state = options.state || 'close';
        this.childNodes = null;
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
 * 트리컴포넌트의 코어부분
 * 트리에 이벤트를 부여하고 이벤트 발생시, 모델을 조작함
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
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
        this.model.setData(options.data);

        this.inputElement = document.createElement('input');
        this.inputElement.setAttribute('type', 'text');

        this.view = new TreeView(options.config, this.model.getFirstChildren());
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
        utils.stopEvent(e);
    },
    /**
     * 이름변경모드 활성화시, 이벤트를 등록한다
     *
     * @private
     * **/
    _openInputEvent: function() {
        this.isInputEnabled = true;
        utils.addEventListener(this.inputElement, 'keyup', this._onKeyDownInputElement.bind(this));
        utils.addEventListener(this.inputElement, 'blur', this._onBlurInputElement.bind(this));
        utils.addEventListener(this.inputElement, 'click', this._onClickInputElement.bind(this));
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

                utils.addEventListener(elements[i], eventType, events[event]);

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

        if (!depthLabels || !utils.isObject(depthLabels)) {
            throw new TypeError();
        }
        this.view.setDepthLabels(depthLabels);
        this.view.action('refresh', this.model.nodes);

    }
});

/**
 * 트리를 구성하는 데이터를 조작함
 * 데이터 변경사한 발생 시 뷰를 갱신함
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @class
 *
 * **/
var TreeModel = Class.extend(/** @lends TreeModel.prototype */{
    init: function(options) {

        this.nodes = new Node({
            id: options.viewId,
            title: '',
            state: 'open'
        });
        this.count = 0;
        this.views = [];
        this.nodeDefaultState = options.defaultState || 'close';
        this.buffer = null;
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

        this.views.forEach(function(view) {
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


        if (!insertDataList || !insertDataList.length) {
            insertDataList = [{title: 'no Title'}];
        }

        var target = null;
        if (path && !isNaN(path)) {
            target = this.findNode(path);
        }
        target = target || this.nodes;

        this._makeTree(insertDataList, target);




/*        if (!target && insertData) {
            target = new Node({
                id: this._getIdentification(),
                title: object.title,
                state: this.nodeDefaultState || 'close'
            });

            this.nodes.childNodes.push(target);
            target.set('parent', this.nodes);
            if (object.children) {
                this._makeTree(object.children, target);
            }

            target = this.nodes;
        } else {

            if (!target.childNodes) {
                target.childNodes = [];
            }
            this._makeTree(object, target);
        }*/



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

        parent.childNodes = parent.childNodes.filter(function(element) {
            return element != removeTarget;
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
            self = this,
            paths = path.split(',');

        paths.forEach(function(index) {
            if (result) {
                result = result.childNodes[index];
            } else {
                result = self.nodes.childNodes[index];
            }
        });
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
        data.forEach(function(element, index) {

            var newNode = new Node({
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

        }.bind(this));
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
     *
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
     *
     * 모델의 노드 트리를 데이터를 가져온다
     *
     */
    getData: function() {
        return this.nodes;
    },
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
 * 화면에 보여지는 트리를 그리고, 갱신한다.
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
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
    init: function (options, data, template) {

        this.template = template || {
            hasChild: '<li class="hasChild {{State}}">\
                            <button type="button">{{StateLabel}}</button>\
                            <span id="{{NodeID}}" path="{{Path}}" class="depth{{Depth}}">{{Title}}</span><em>{{DepthLabel}}</em>\
                            <ul class="subTree">\
                                {{ChildNodes}}\
                            </ul>\
                        </li>',
            leapNode: '<li class="leapNode">\
                        <span id="{{NodeID}}" path="{{Path}}" class="depth{{Depth}}">{{Title}}</span><em>{{DepthLabel}}</em>\
                    </li>'
        };

        this.root = null;
        this.path = [];
        this.openSet = options.openSet || ['open', '-'];
        this.closeSet = options.closeSet || ['close', '+'];
        this.onSelectClassName = options.onSelectClassName || 'select';
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
            path = '', html;

        data.forEach(function (element, index) {
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

            if (element.childNodes) {
                el = this.template.hasChild;
                replaceMapper.ChildNodes = this._makeHTML(element.childNodes, beforePath);
            } else {
                el = this.template.leapNode;
            }
            el = el.replace(/\{\{([^\}]+)\}\}/g, function callback(matchedString, name) {
                return replaceMapper[name] || '';
            });

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
            parentID = (parent.get && parent.get('id')) || this.root.getAttribute('id'),
            childWrapper = targetElement.lastChild,
            hasChildWrapper = childWrapper.nodeType === 1 && childWrapper.tagName === 'UL',
            /** 부분 갱신에 필요한 상위 path 정보 */
            prePath,
            drawData;

        if (hasChildWrapper && parentID) {
            drawData = parent.childNodes;
            targetElement = document.getElementById(parentID);
            prePath = targetElement.getAttribute('path');
                childWrapper = targetElement.lastChild;
                this._draw(this._makeHTML(drawData, prePath), childWrapper);
        } else {
            drawData = parent.childNodes;
            this._draw(this._makeHTML(drawData));
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
            childWrap = parent.getElementsByTagName('ul')[0];
            button = parent.getElementsByTagName('button')[0];

        var state = this[target.state + 'Set'][0],
            label = this[target.state + 'Set'][1],
            isOpen = target.get('state') === 'open';

        parent.className = parent.className.replace(/(close|open)/g, '') + state;
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
        span.className = span.className.replace(' ' + this.onSelectClassName, '') + ' ' + this.onSelectClassName;

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
        span.className = span.className.replace(' ' + this.onSelectClassName, '');

    }
});