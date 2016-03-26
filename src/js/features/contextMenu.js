'use strict';
var util = require('./../util');

var API_LIST = [];

var ContextMenu = tui.util.defineClass(/** @lends ContextMenu.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf ContextMenu
         * @returns {Array.<string>} API list of ContextMenu
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },

    init: function(tree, options) { /*eslint-enable*/
        this.tree = tree;

        this.attachEvent();
    },

    attachEvent: function() {
        var tree = this.tree;

        tree.on('_contextMenu', function(event) {
            var nodeId = tree.getNodeIdFromElement(util.getTarget(event));

            event.preventDefault();
            console.log('contextMenu: ', nodeId);
            /**
             * @api
             * @events Tree#contextMenu
             * @param {object} data - Data
             *  @param {data.nodeId} nodeId - selected node id
             */
            tree.fire('contextMenu', {
                nodeId: nodeId
            });
        });
    },

    destroy: function() {
        this.tree.off(this);
        this.tree.off('_contextMenu');
    }
});

module.exports = ContextMenu;
