/**
 * @fileoverview Feature that tree action is enable to communicate server
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

var ajax = require('tui-code-snippet/ajax/index.js');
var defineClass = require('tui-code-snippet/defineClass/defineClass');
var extend = require('tui-code-snippet/object/extend');
var isFunction = require('tui-code-snippet/type/isFunction');
var isUndefined = require('tui-code-snippet/type/isUndefined');
var bind = require('../util').bind;

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
var Ajax = defineClass(
  /** @lends Ajax.prototype */ {
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
    init: function(tree, options) {
      options = extend({}, options);

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
      this.isLoadRoot = !isUndefined(options.isLoadRoot) ? options.isLoadRoot : true;

      /**
       * Loader element
       * @type {HTMLElement}
       */
      this.loader = null;

      this._createLoader();

      tree.on('initFeature', bind(this._onInitFeature, this));
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
     * @param {string} command - Command type
     * @param {Function} callback - Executed function after response
     * @param {Object} [data] - Values to make "data" property using request
     */
    loadData: function(command, callback, data) {
      var options;

      if (!this.command || !this.command[command] || !this.command[command].url) {
        return;
      }

      options = this._getDefaultRequestOptions(command, data);

      /**
       * @event Tree#beforeAjaxRequest
       * @type {object} evt - Event data
       * @property {string} command - Command type
       * @property {object} [data] - Request data
       * @example
       * tree.on('beforeAjaxRequest', function(evt) {
       *     console.log('before ' + evt.command + ' request!');
       *     return false; // It cancels request
       *     // return true; // It fires request
       * });
       */
      if (
        !this.tree.invoke('beforeAjaxRequest', {
          command: command,
          data: data
        })
      ) {
        return;
      }

      this._showLoader();

      options.success = bind(function(response) {
        this._responseSuccess(command, callback, response.data);
      }, this);

      options.error = bind(function(error) {
        this._responseError(command, error);
      }, this);

      ajax(options);
    },

    /**
     * Processing when response is success
     * @param {string} command - Command type
     * @param {Function} callback - Executed function after response
     * @param {Object|boolean} [responseData] - Response data from server or return value of "parseData"
     * @private
     */
    _responseSuccess: function(command, callback, responseData) {
      var tree = this.tree;
      var data;

      this._hideLoader();

      if (this.parseData) {
        responseData = this.parseData(command, responseData);
      }

      if (responseData) {
        data = callback(responseData);

        /**
         * @event Tree#successAjaxResponse
         * @type {object} evt - Event data
         * @property {string} command - Command type
         * @property {object} [data] - Return value of executed command callback
         * @example
         * tree.on('successAjaxResponse', function(evt) {
         *     console.log(evt.command + ' response is success!');
         *     if (data) {
         *           console.log('data:' + evt.data);
         *     }
         * });
         */
        tree.fire('successAjaxResponse', {
          command: command,
          data: data
        });
      } else {
        /**
         * @event Tree#failAjaxResponse
         * @type {object} evt - Event data
         * @property {string} command - Command type
         * @example
         * tree.on('failAjaxResponse', function(evt) {
         *     console.log(evt.command + ' response is fail!');
         * });
         */
        tree.fire('failAjaxResponse', {
          command: command
        });
      }
    },

    /**
     * Processing when response is error
     * @param {string} command - Command type
     * @private
     */
    _responseError: function(command, error) {
      this._hideLoader();

      /**
       * @event Tree#errorAjaxResponse
       * @type {object} evt - Event data
       * @property {string} command - Command type
       * @property {number} status - Error status code
       * @property {string} statusText - Error status text
       * @example
       * tree.on('errorAjaxResponse', function(evt) {
       *     console.log(evt.command + ' response is error!');
       * });
       */
      this.tree.fire('errorAjaxResponse', {
        command: command,
        status: error.status,
        statusText: error.statusText
      });
    },

    /**
     * Get default request options
     * @param {string} type - Command type
     * @param {Object} [data] - Value of request option "data"
     * @returns {Object} Default options to request
     * @private
     */
    _getDefaultRequestOptions: function(type, data) {
      var options = extend({}, this.command[type]);

      if (isFunction(options.url)) {
        // for restful API url
        options.url = options.url(data);
      }

      if (isFunction(options.params)) {
        // for custom request data
        options.params = options.params(data);
      }

      options.method = options.method || 'GET';
      options.contentType = options.contentType || 'application/json';

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
  }
);

module.exports = Ajax;
