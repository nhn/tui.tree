/**
 * @fileoverview Helper object to make easy tree elements
 * @author NHN Ent. FE dev team.<dl_javascript@nhnent.com>
 */

/**
 * @namespace util
 */
var util = {
    removeItemFromArray: function(arr, item) {
        arr.splice(arr.indexOf(item), 1);
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
     * @param {event} e Event object
     * @return {HTMLElement} 
     */
    getTarget: function(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        return target;
    },

    /**
     *
     * @param elem
     * @returns {*|string|string}
     */
    getClass: function(elem) {
        return elem.getAttribute && elem.getAttribute( "class" ) || "";
    },

    /**
     * Check the element has specific class or not
     * @param {HTMLElement} element A target element
     * @param {string} className A name of class to find
     * @return {boolean}
     */
    hasClass: function(element, className) {
        var elClassName = util.getClass(element);

        return elClassName.indexOf(className) > -1;
    },

    /**
     * Find element by class name
     * @param {HTMLElement} target A target element
     * @param {string} className A name of class
     * @return {array}
     */
    getElementsByClass: function(target, className) {
        if (target.querySelectorAll) {
            return target.querySelectorAll('.' + className);
        }
        var all = target.getElementsByTagName('*'),
            filter = [];

        all = tui.util.toArray(all);

        tui.util.forEach(all, function(el) {
            var cls = el.className || '';
            if (cls.indexOf(className) !== -1) {
                filter.push(el);
            }
        });

        return filter;
    },

    /**
     * Check whether the click event by right button or not
     * @param {event} e Event object
     * @return {boolean} 
     */
    isRightButton: function(e) {
        var isRight = util._getButton(e) === 2;
        return isRight;
    },

    /**
     * Whether the property exist or not
     * @param {array} props A property 
     * @return {boolean}
     */
    testProp: function(props) {
        var style = document.documentElement.style,
            i = 0;

        for (; i < props.length; i++) {
            if (props[i] in style) {
                return props[i];
            }
        }
        return false;
    },

    /**
     * Prevent default event 
     * @param {event} e Event object
     */
    preventDefault: function(e) {
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    },

    /**
     * Normalization for event button property 
     * 0: First mouse button, 2: Second mouse button, 1: Center button
     * @param {MouseEvent} event Event object
     * @return {number|undefined} 
     * @private
     */
    _getButton: function(e) {
        var button,
            primary = '0,1,3,5,7',
            secondary = '2,6',
            wheel = '4';

        if (document.implementation.hasFeature('MouseEvents', '2.0')) {
            return e.button;
        } else {
            button = e.button + '';
            if (primary.indexOf(button) > -1) {
                return 0;
            } else if (secondary.indexOf(button) > -1) {
                return 2;
            } else if (wheel.indexOf(button) > -1) {
                return 1;
            }
        }
    }
};

module.exports = util;
