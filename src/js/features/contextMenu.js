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

    init: function(tree, menus) { /*eslint-enable*/
        this.tree = tree;
        this.isOpened = false;
        this.layer = document.createElement('DIV');

        this.makeLayer(menus);
        this.attachEvent();
    },

    makeLayer: function() {
        var style = this.layer.style;

        style.position = 'absolute';
        style.backgroundColor = 'white';
        style.border = '1px solid black';
        this.layer.innerHTML = 'test';
    },

    attachEvent: function() {
        var tree = this.tree;

        tree.on('_contextMenu', function(event) {
            var nodeId = tree.getNodeIdFromElement(util.getTarget(event)),
                layer = this.layer,
                self = this;

            event.preventDefault();
            layer.style.top = event.clientY + 10 + 'px';
            layer.style.left = event.clientX + 10 + 'px';

            if (!this.isOpened) {
                this.isOpened = true;
                document.body.appendChild(layer);

                util.addEventListener(document.body, 'click', function closeLayer() {
                    self.isOpened = false;
                    document.body.removeChild(layer);
                    util.removeEventListener(document.body, 'click', closeLayer);
                });
            }

            /**
             * @api
             * @events Tree#contextMenu
             * @param {object} data - Data
             *  @param {data.nodeId} nodeId - selected node id
             */
            tree.fire('openContextMenu', {
                nodeId: nodeId
            });
        }, this);
    },

    destroy: function() {
        this.tree.off(this);
        this.tree.off('_contextMenu');
    }
});

module.exports = ContextMenu;
