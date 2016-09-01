'use strict';

var snippet = tui.util;
var API_LIST = [];

/**
 * Set Ajax feature on tree
 * @class Ajax
 * @constructor
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {Object} [command] - Each Ajax request command options
 *  @param {Function} [dataMap] - Function to remake and return the request option "data"
 *  @param {Function} [parseData] - Function to parse and return the response data
 */
var Ajax = tui.util.defineClass(/** @lends Ajax.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberOf Selectable
         * @returns {Array.<string>} API list of Selectable
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },
    init: function(tree, options) { /*eslint-enable*/
        options = tui.util.extend({}, options);

        /**
         * Tree
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Option for each request command
         * @type {Object}
         */
        this.command = options.command || {};

        /**
         * Callback for remake the request option "data"
         * @type {?Function}
         */
        this.dataMap = options.dataMap || null;

        /**
         * Callback for parsing the response data
         * @type {?Function}
         */
        this.parseData = options.parseData || null;

        /**
         * State of loading root data or not
         * @type {boolean}
         */
        this.isLoadRoot = (!snippet.isUndefined(options.isLoadRoot)) ?
                            options.isLoadRoot : true;

        /**
         * Loader element
         * @type {HTMLElement}
         */
        this.loader = null;

        this._createLoader();

        tree.on('initFeature', snippet.bind(this._onInitFeature, this));
    },

    /**
    * Custom event handler "initFeature"
     * @private
     */
    _onInitFeature: function() {
        if (!this.isLoadRoot) {
            return;
        }

        this.tree.resetAllData();
    },

    /**
     * Disable this module
     */
    destroy: function() {
        var tree = this.tree;

        this._removeLoader();

        tree.off(this);

        tui.util.forEach(API_LIST, function(apiName) {
            delete tree[apiName];
        });
    },

    /**
     * Load data to request server
     * @param {string} type - Command type
     * @param {Function} callback - Executed function after response
     * @param {Object} [params] - Values to make "data" property using request
     */
    loadData: function(type, callback, params) {
        var self = this;
        var options = this._getDefaultRequestOptions(type, params);

        if (!options.url) {
            return;
        }

        /**
         * @api
         * @event Tree#beforeRequest
         * @param {string} type - Command type
         * @param {string} [data] - Request data
         * @example
         * tree.on('beforeRequest', function(type, data) {
         *     console.log('before' + type + ' request!');
         * });
         */
        if (!this.tree.invoke('beforeRequest', type, params)) {
            return;
        }

        this._showLoader(true);

        options.success = function(response) {
            self._responseSuccess(type, callback, response);
        };

        options.error = function() {
            self._responseError(type);
        };

        $.ajax(options);
    },

    /**
     * Processing when response is success
     * @param {string} type - Command type
     * @param {Function} callback - Executed function after response
     * @param {Object|boolean} [response] - Response data from server or return value of "parseData"
     * @private
     */
    _responseSuccess: function(type, callback, response) {
        var tree = this.tree;
        var data;

        this._showLoader(false);

        if (this.parseData) {
            response = this.parseData(type, response);
        }

        if (response) {
            data = callback(response);

            /**
             * @api
             * @event Tree#successResponse
             * @param {string} type - Command type
             * @param {string} [data] - Return value of executed command callback
             * @example
             * tree.on('successResponse', function(type, data) {
             *     console.log(type + ' response is success!');
             *     if (data) {
             *           console.log('new add ids :' + data);
             *     }
             * });
             */
            tree.fire('successResponse', type, data);
        } else {
            /**
             * @api
             * @event Tree#failResponse
             * @param {string} type - Command type
             * @example
             * tree.on('failResponse', function(type) {
             *     console.log(type + ' response is fail!');
             * });
             */
            tree.fire('failResponse', type);
        }
    },

    /**
     * Processing when response is error
     * @param {string} type - Command type
     * @private
     */
    _responseError: function(type) {
        this._showLoader(false);

        /**
         * @api
         * @event Tree#errorResponse
         * @param {string} type - Command type
         * @example
         * tree.on('errorResponse', function(type) {
         *     console.log(type + ' response is error!');
         * });
         */
        this.tree.fire('errorResponse', type);
    },

    /**
     * Get default request options
     * @param {string} type - Command type
     * @param {Object} [params] - Value of request option "data"
     * @returns {Object} Default options to request
     * @private
     */
    _getDefaultRequestOptions: function(type, params) {
        var options = this.command[type] || {};

        options.type = (options.type) ? options.type.toLowerCase() : 'get';
        options.dataType = options.dataType || 'json';

        if (this.dataMap) {
            options.data = this.dataMap(type, params);
        }

        return options;
    },

    /**
     * Create loader element
     * @private
     */
    _createLoader: function() {
        var tree = this.tree;
        var loader = document.createElement('span');

        loader.className = tree.classNames.loaderClass;
        loader.style.display = 'none';

        tree.rootElement.parentNode.appendChild(loader);

        this.loader = loader;
    },

    /**
     * Remove loader element
     * @private
     */
    _removeLoader: function() {
        var tree = this.tree;
        var loader = this.loader;

        tree.rootElement.parentNode.removeChild(loader);

        this.loader = null;
    },

    /**
     * Show loader element on tree
     * @param {boolean} state - Loader display state
     * @private
     */
    _showLoader: function(state) {
        this.loader.style.display = state ? 'block' : 'none';
    }
});

module.exports = Ajax;
