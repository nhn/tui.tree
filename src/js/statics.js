/**
 * @fileoverview A default values for tree
 */

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
        EDGE_NODE: '<li class="edge_node {{State}}">' +
                    '<button type="button">{{StateLabel}}</button>' +
                    '<span id="{{NodeID}}" class="depth{{Depth}} {{ValueClass}}">{{Title}}</span><em>{{DepthLabel}}</em>' +
                    '<ul class="{{Subtree}}" style="display:{{Display}}">{{Children}}</ul>' +
                '</li>',
        LEAP_NODE: '<li class="leap_node">' +
                    '<span id="{{NodeID}}" class="depth{{Depth}} {{ValueClass}}">{{Title}}</span><em>{{DepthLabel}}</em>' +
                '</li>'
    },
    USE_DRAG: false,
    USE_HELPER: false,
    HELPER_POS : {
        x: 10,
        y: 10
    }
};

module.exports = {
    STATE: STATE,
    DEFAULT: DEFAULT
};
