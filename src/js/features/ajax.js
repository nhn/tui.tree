/**
 * @fileoverview Feature that tree action is enable to communicate server
 * @author NHN Ent. FE dev Lab <dl_javascript@nhnent.com>
 */
var snippet = require('tui-code-snippet');
var API_LIST = [];
var LOADER_CLASSNAME = 'tui-tree-loader';

/**
 * Set Ajax feature on tree
 * @class Ajax
 * @param {Tree} tree - Tree
 * @param {Object} options - Options
 *  @param {Object} options.command - Each Ajax request command options
 *  @param {Function} [options.parseData] - Function to parse and return the response data
 *  @param {string} [options.loaderClassName] - Classname of loader element
 *  @param {boolean} [options.isLoadRoot] - Whether load data from root node or not
 * @ignore
 */
var Ajax = snippet.defineClass(/** @lends Ajax.prototype */{/*eslint-disable*/
    static: {
        /**
         * @static
         * @memberof Ajax
         * @returns {Array.<string>} API list of Ajax
         */
        getAPIList: function() {
            return API_LIST.slice();
        }
    },
    init: function(tree, options) { /*eslint-enable*/
        options = snippet.extend({}, options);

        /**
         * Tree
         * @type {Tree}
         */
        this.tree = tree;

        /**
         * Option for each request command
         * @type {Object}
         */
        this.command = options.command;

        /**
         * Callback for parsing the response data
         * @type {?Function}
         */
        this.parseData = options.parseData || null;

        /**
         * Classname of loader element
         * @type {string}
         */
        this.loaderClassName = options.loaderClassName || LOADER_CLASSNAME;

        /**
         * State of loading root data or not
         * @type {boolean}
         */
        this.isLoadRoot = !snippet.isUndefined(options.isLoadRoot) ? options.isLoadRoot : true;

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
    },

    /**
     * Load data to request server
     * @param {string} type - Command type
     * @param {Function} callback - Executed function after response
     * @param {Object} [params] - Values to make "data" property using request
     */
    loadData: function(type, callback, params) {
        var self = this;
        var options;

        if (!this.command || !this.command[type] ||
            !this.command[type].url) {
            return;
        }

        options = this._getDefaultRequestOptions(type, params);

        /**
         * @event Tree#beforeAjaxRequest
         * @param {{command: string, data: object}} evt - Event data
         *     @param {string} evt.command - Command type
         *     @param {object} [evt.data] - Request data
         * @example
         * tree.on('beforeAjaxRequest', function(evt) {
         *     console.log('before ' + evt.command + ' request!');
         *     return false; // It cancels request
         *     // return true; // It fires request
         * });
         */
        if (!this.tree.invoke('beforeAjaxRequest', {
            type: type,
            params: params
        })) {
            return;
        }

        this._showLoader();

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

        this._hideLoader();

        if (this.parseData) {
            response = this.parseData(type, response);
        }

        if (response) {
            data = callback(response);

            /**
             * @event Tree#successAjaxResponse
             * @param {{command: string, data: object}} evt - Event data
             *     @param {string} evt.command - Command type
             *     @param {object} [evt.data] - Return value of executed command callback
             * @example
             * tree.on('successAjaxResponse', function(evt) {
             *     console.log(evt.command + ' response is success!');
             *     if (data) {
             *           console.log('data:' + evt.data);
             *     }
             * });
             */
            tree.fire('successAjaxResponse', {
                type: type,
                data: data
            });
        } else {
            /**
             * @event Tree#failAjaxResponse
             * @param {{command: string}} evt - Event data
             *     @param {string} evt.command - Command type
             * @example
             * tree.on('failAjaxResponse', function(evt) {
             *     console.log(evt.command + ' response is fail!');
             * });
             */
            tree.fire('failAjaxResponse', {type: type});
        }
    },

    /**
     * Processing when response is error
     * @param {string} type - Command type
     * @private
     */
    _responseError: function(type) {
        this._hideLoader();

        /**
         * @event Tree#errorAjaxResponse
         * @param {{command: string}} evt - Event data
         *     @param {string} evt.command - Command type
         * @example
         * tree.on('errorAjaxResponse', function(evt) {
         *     console.log(evt.command + ' response is error!');
         * });
         */
        this.tree.fire('errorAjaxResponse', {type: type});
    },

    /**
     * Get default request options
     * @param {string} type - Command type
     * @param {Object} [params] - Value of request option "data"
     * @returns {Object} Default options to request
     * @private
     */
    _getDefaultRequestOptions: function(type, params) {
        var options = this.command[type];

        if (snippet.isFunction(options.url)) { // for restful API url
            options.url = options.url(params);
        }

        if (snippet.isFunction(options.data)) { // for custom request data
            options.data = options.data(params);
        }

        options.type = (options.type) ? options.type.toLowerCase() : 'get';
        options.dataType = options.dataType || 'json';

        return options;
    },

    /**
     * Create loader element
     * @private
     */
    _createLoader: function() {
        var tree = this.tree;
        var loader = document.createElement('span');

        loader.className = this.loaderClassName;
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
     * @private
     */
    _showLoader: function() {
        this.loader.style.display = 'block';
    },

    /**
     * Hide loader element on tree
     * @private
     */
    _hideLoader: function() {
        this.loader.style.display = 'none';
    }
});

module.exports = Ajax;
