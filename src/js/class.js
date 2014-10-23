/**
 *
 * 상속을 위한 클래스 모듈
 *
 * @class
 *
 * **/

(function() {
    var initializing = false,
        fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    this.Class = function() {};

    Class.extend = function(prop) {

        var _super = this.prototype;
        initializing = true;

        var prototype = new this();
        initializing = false;

        var name, isOverride;
        for (name in prop) {
            isOverride = utils.isFunction(prop[name]) && utils.isFunction(_super[name]) && fnTest.test(prop[name]);
            if (isOverride) {
                prototype[name] = (function(name, fn) {
                    return function() {
                        var tmp = this._super;
                        this._super = _super[name];
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]);
            } else {
                prototype[name] = prop[name];
            }
        }

        function Class() {
            if (!initializing && this.init)
                this.init.apply(this, arguments);
        }

        Class.prototype = prototype;
        Class.prototype.constructor = Class;
        Class.extend = arguments.callee;

        return Class;
    };
})();