var path = require('path');
var fs = require('fs');
var fixturesPath = './fixtures';

global.loadFixtures = function(fileName) {
  var data = '';
  var dir = path.resolve(__dirname, fixturesPath, fileName);

  try {
    data = fs.readFileSync(dir, 'utf8'); // eslint-disable-line no-sync
  } catch (err) {
    // do nothing
  } finally {
    document.body.innerHTML = data;
  }
};

global.xhrMock = {
  open: jest.fn(),
  send: jest.fn().mockImplementation(function() {
    this.readyState = 4;
    this.onreadystatechange();
  }),
  setRequestHeader: jest.fn(),
  getResponseHeader: jest.fn().mockImplementation(function(key) {
    return this.responseHeaders && this.responseHeaders[key];
  }),
  getAllResponseHeaders: jest.fn().mockImplementation(function() {
    var result, i, keys, length;

    if (this.responseHeaders) {
      result = '';
      keys = Object.keys(this.responseHeaders);
      length = keys.length;

      for (i = 0; i < length; i += 1) {
        result += keys[i] + ': ' + this.responseHeaders[keys[i]] + '\r\n';
      }
    }

    return result;
  }),
  setResponse: function(options) {
    this.xhr.status = options.status;
    this.xhr.statusText = options.statusText;
    this.xhr.responseText = options.responseText || '\r\n';
    this.xhr.responseHeaders = options.headers || '\r\n';
  },
  install: function() {
    var xhr = {
      open: this.open,
      send: this.send,
      setRequestHeader: this.setRequestHeader,
      getResponseHeader: this.getResponseHeader,
      getAllResponseHeaders: this.getAllResponseHeaders,
      status: 200
    };
    this.xhr = xhr;

    this.setResponse({});

    this.originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      return xhr;
    };
  },
  uninstall: function() {
    window.XMLHttpRequest = this.originalXHR;
  }
};
