/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */
var snippet = require('tui-code-snippet');
var isUndefined = snippet.isUndefined,
    pick = snippet.pick,
    templateMaskRe = /\{\{(.+?)}}/gi,
    isValidDotNotationRe = /^\w+(?:\.\w+)*$/,
    isValidDotNotation = function(str) {
        return isValidDotNotationRe.test(str);
    },
    isArray = snippet.isArraySafe,
    forEach = snippet.forEach,
    browser = snippet.browser,
    isSupportPageOffset = typeof window.pageXOffset !== 'undefined',
    isCSS1Compat = document.compatMode === 'CSS1Compat',
    isOlderIE = (browser.msie && browser.version < 9),
    hostnameSent = false;

/**
 * @ignore
 */
var util = {
    /**
     * Remove first specified item from array, if it exists
     * @param {*} item Item to look for
     * @param {Array} arr Array to query
     */
    removeItemFromArray: function(item, arr) {
        var index = arr.length - 1;

        while (index > -1) {
            if (item === arr[index]) {
                arr.splice(index, 1);
            }
            index -= 1;
        }
    },

    /**
     * Add classname
     * @param {HTMLElement} element - Target element
     * @param {string} className - Classname
     */
    addClass: function(element, className) {
        if (!element) {
            return;
        }

        if (element.className === '') {
            element.className = className;
        } else if (!util.hasClass(element, className)) {
            element.className += ' ' + className;
        }
    },

    /**
     * Remove classname
     * @param {HTMLElement} element - Target element
     * @param {string} className - Classname
     */
    removeClass: function(element, className) {
        var originalClassName = util.getClass(element),
            arr, index;

        if (!originalClassName) {
            return;
        }

        arr = originalClassName.split(' ');
        index = snippet.inArray(className, arr);
        if (index !== -1) {
            arr.splice(index, 1);
            element.className = arr.join(' ');
        }
    },

    /**
     * Add event to element
     * @param {Object} element A target element
     * @param {String} eventName A name of event
     * @param {Function} handler A callback function to add
     */
    addEventListener: function(element, eventName, handler) {
        if (element.addEventListener) {
            element.addEventListener(eventName, handler, false);
        } else {
            element.attachEvent('on' + eventName, handler);
        }
    },

    /**
     * Remove event from element
     * @param {Object} element A target element
     * @param {String} eventName A name of event
     * @param {Function} handler A callback function to remove
     */
    removeEventListener: function(element, eventName, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(eventName, handler, false);
        } else {
            element.detachEvent('on' + eventName, handler);
        }
    },

    /**
     * Get target element
     * @param {Event} e Event object
     * @returns {HTMLElement} Event target
     */
    getTarget: function(e) {
        var target;
        e = e || window.event;
        target = e.target || e.srcElement;

        return target;
    },

    /**
     * Get key code from event object
     * @param {Event} e Event object
     * @returns {Number} KeyCode
     */
    getKeyCode: function(e) {
        e = e || window.event;

        return e.which || e.keyCode;
    },

    /**
     * Get class name
     * @param {HTMLElement} element HTMLElement
     * @returns {string} Class name
     */
    getClass: function(element) {
        return element && element.getAttribute &&
            (element.getAttribute('class') || element.getAttribute('className') || '');
    },

    /**
     * Check the element has specific class or not
     * @param {HTMLElement} element A target element
     * @param {string} className A name of class to find
     * @returns {boolean} Whether the element has the class
     */
    hasClass: function(element, className) {
        var elClassName = util.getClass(element);

        return elClassName.indexOf(className) > -1;
    },

    /**
     * Find element by class name
     * @param {HTMLElement} target A target element
     * @param {string} className A name of class
     * @returns {Array.<HTMLElement>} Elements
     */
    getElementsByClassName: function(target, className) {
        var all, filtered;

        if (target.querySelectorAll) {
            filtered = target.querySelectorAll('.' + className);
        } else {
            all = snippet.toArray(target.getElementsByTagName('*'));
            filtered = snippet.filter(all, function(el) {
                var classNames = el.className || '';

                return (classNames.indexOf(className) !== -1);
            });
        }

        if (!filtered) {
            filtered = [];
        }

        return filtered;
    },

    /**
     * Find element by class name among child nodes
     * @param {HTMLElement} target A target element
     * @param {string} className A name of class
     * @returns {Array.<HTMLElement>} Elements
     */
    getChildElementByClassName: function(target, className) {
        var children = target.childNodes;
        var i = 0;
        var length = children.length;
        var child;

        for (; i < length; i += 1) {
            child = children[i];
            if (util.hasClass(child, className)) {
                return child;
            }
        }

        return null;
    },

    /**
     * Check whether the click event by right button
     * @param {MouseEvent} event Event object
     * @returns {boolean} Whether the click event by right button
     */
    isRightButton: function(event) {
        return util._getButton(event) === 2;
    },

    /**
     * Whether the property exist or not
     * @param {Array} props A property
     * @returns {string|boolean} Property name or false
     * @example
     * var userSelectProperty = util.testProp([
     *     'userSelect',
     *     'WebkitUserSelect',
     *     'OUserSelect',
     *     'MozUserSelect',
     *     'msUserSelect'
     * ]);
     */
    testProp: function(props) {
        var style = document.documentElement.style,
            propertyName = false;

        /* eslint-disable consistent-return */
        snippet.forEach(props, function(prop) {
            if (prop in style) {
                propertyName = prop;

                return false;
            }
        });
        /* eslint-enable consistent-return */

        return propertyName;
    },

    /**
     * Prevent default event
     * @param {Event} event Event object
     */
    preventDefault: function(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    },

    /**
     * Make html from template
     * @param {string} source - Template html
     * @param {Object} props - Template data
     * @returns {string} html
     */
    renderTemplate: function(source, props) {
        /* eslint-disable require-jsdoc */
        function pickValue(names) {
            return pick.apply(null, [props].concat(names));
        }
        /* eslint-enable require-jsdoc */

        return source.replace(templateMaskRe, function(match, name) {
            var value;

            if (isValidDotNotation(name)) {
                value = pickValue(name.split('.'));
            }

            if (isArray(value)) {
                value = value.join(' ');
            } else if (isUndefined(value)) {
                value = '';
            }

            return value;
        });
    },

    /**
     * Normalization for event button property
     * 0: First mouse button, 2: Second mouse button, 1: Center button
     * @param {MouseEvent} event Event object
     * @returns {?number} button type
     * @private
     */
    _getButton: function(event) {
        var primary = '0,1,3,5,7';
        var secondary = '2,6';
        var wheel = '4';
        var result = null;
        var button;

        if (document.implementation.hasFeature('MouseEvents', '2.0')) {
            return event.button;
        }

        button = String(event.button);
        if (primary.indexOf(button) > -1) {
            result = 0;
        } else if (secondary.indexOf(button) > -1) {
            result = 2;
        } else if (wheel.indexOf(button) > -1) {
            result = 1;
        }

        return result;
    },

    /**
     * Get mouse position
     * @param {MouseEvet} event - Event object
     * @returns {object} X, Y position of mouse
     */
    getMousePos: function(event) {
        return {
            x: event.clientX,
            y: event.clientY
        };
    },

    /**
     * Get value of scroll top on document.body (cross browsing)
     * @returns {number} Value of scroll top
     */
    getWindowScrollTop: function() {
        var scrollTop;

        if (isSupportPageOffset) {
            scrollTop = window.pageYOffset;
        } else {
            scrollTop = isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
        }

        return scrollTop;
    },

    /**
     * Get top position value of element
     * @param {HTMLElement} element - Target element
     * @returns {number} Top position value
     */
    getElementTop: function(element) {
        var actualTop = 0;
        var scrollTop;

        while (element) {
            if (element.tagName.toLowerCase === 'body') {
                scrollTop = util.getWindowScrollTop();
            } else {
                scrollTop = element.scrollTop;
            }

            actualTop += element.offsetTop - scrollTop + element.clientTop;
            element = element.offsetParent;
        }

        return actualTop;
    },

    /**
     * Get first text node in target element
     * @param {HTMLElement} element - Target element to find
     * @returns {HTMLElement} Text node
     */
    getFirstTextNode: function(element) {
        var childElements = snippet.toArray(element.childNodes);
        var firstTextNode = '';

        forEach(childElements, function(childElement) {
            if (childElement.nodeName === '#text') {
                firstTextNode = childElement;

                return false;
            }

            return true;
        });

        return firstTextNode;
    },

    /**
     * Remove element from parent element
     * @param {HTMLElement} element - Target element to remove
     */
    removeElement: function(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },

    /**
     * Get change event name as browser
     * @returns {string} Event name
     */
    getChangeEventName: function() {
        var changeEventName;

        if (isOlderIE) {
            changeEventName = 'propertychange';
        } else {
            changeEventName = 'change';
        }

        return changeEventName;
    },

    /**
     * send hostname
     */
    sendHostName: function() {
        if (hostnameSent) {
            return;
        }
        hostnameSent = true;

        snippet.sendHostname('tree', 'UA-129987462-1');
    }
};

module.exports = util;
