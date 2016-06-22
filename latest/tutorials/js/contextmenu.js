(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _core = require('./src/core');

var core = _interopRequireWildcard(_core);

var _contextmenu = require('./src/contextmenu');

var _contextmenu2 = _interopRequireDefault(_contextmenu);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

tui.util.defineNamespace('tui.component', { ContextMenu: _contextmenu2['default'] });
tui.component.ContextMenu.core = core;

},{"./src/contextmenu":23,"./src/core":24}],2:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlebarsBase = require('./handlebars/base');

var base = _interopRequireWildcard(_handlebarsBase);

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)

var _handlebarsSafeString = require('./handlebars/safe-string');

var _handlebarsSafeString2 = _interopRequireDefault(_handlebarsSafeString);

var _handlebarsException = require('./handlebars/exception');

var _handlebarsException2 = _interopRequireDefault(_handlebarsException);

var _handlebarsUtils = require('./handlebars/utils');

var Utils = _interopRequireWildcard(_handlebarsUtils);

var _handlebarsRuntime = require('./handlebars/runtime');

var runtime = _interopRequireWildcard(_handlebarsRuntime);

var _handlebarsNoConflict = require('./handlebars/no-conflict');

var _handlebarsNoConflict2 = _interopRequireDefault(_handlebarsNoConflict);

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
function create() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = _handlebarsSafeString2['default'];
  hb.Exception = _handlebarsException2['default'];
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function (spec) {
    return runtime.template(spec, hb);
  };

  return hb;
}

var inst = create();
inst.create = create;

_handlebarsNoConflict2['default'](inst);

inst['default'] = inst;

exports['default'] = inst;
module.exports = exports['default'];


},{"./handlebars/base":3,"./handlebars/exception":6,"./handlebars/no-conflict":16,"./handlebars/runtime":17,"./handlebars/safe-string":18,"./handlebars/utils":19}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.HandlebarsEnvironment = HandlebarsEnvironment;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('./utils');

var _exception = require('./exception');

var _exception2 = _interopRequireDefault(_exception);

var _helpers = require('./helpers');

var _decorators = require('./decorators');

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var VERSION = '4.0.5';
exports.VERSION = VERSION;
var COMPILER_REVISION = 7;

exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1',
  7: '>= 4.0.0'
};

exports.REVISION_CHANGES = REVISION_CHANGES;
var objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials, decorators) {
  this.helpers = helpers || {};
  this.partials = partials || {};
  this.decorators = decorators || {};

  _helpers.registerDefaultHelpers(this);
  _decorators.registerDefaultDecorators(this);
}

HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: _logger2['default'],
  log: _logger2['default'].log,

  registerHelper: function registerHelper(name, fn) {
    if (_utils.toString.call(name) === objectType) {
      if (fn) {
        throw new _exception2['default']('Arg not supported with multiple helpers');
      }
      _utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function unregisterHelper(name) {
    delete this.helpers[name];
  },

  registerPartial: function registerPartial(name, partial) {
    if (_utils.toString.call(name) === objectType) {
      _utils.extend(this.partials, name);
    } else {
      if (typeof partial === 'undefined') {
        throw new _exception2['default']('Attempting to register a partial called "' + name + '" as undefined');
      }
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function unregisterPartial(name) {
    delete this.partials[name];
  },

  registerDecorator: function registerDecorator(name, fn) {
    if (_utils.toString.call(name) === objectType) {
      if (fn) {
        throw new _exception2['default']('Arg not supported with multiple decorators');
      }
      _utils.extend(this.decorators, name);
    } else {
      this.decorators[name] = fn;
    }
  },
  unregisterDecorator: function unregisterDecorator(name) {
    delete this.decorators[name];
  }
};

var log = _logger2['default'].log;

exports.log = log;
exports.createFrame = _utils.createFrame;
exports.logger = _logger2['default'];


},{"./decorators":4,"./exception":6,"./helpers":7,"./logger":15,"./utils":19}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.registerDefaultDecorators = registerDefaultDecorators;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _decoratorsInline = require('./decorators/inline');

var _decoratorsInline2 = _interopRequireDefault(_decoratorsInline);

function registerDefaultDecorators(instance) {
  _decoratorsInline2['default'](instance);
}


},{"./decorators/inline":5}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerDecorator('inline', function (fn, props, container, options) {
    var ret = fn;
    if (!props.partials) {
      props.partials = {};
      ret = function (context, options) {
        // Create a new partials stack frame prior to exec.
        var original = container.partials;
        container.partials = _utils.extend({}, original, props.partials);
        var ret = fn(context, options);
        container.partials = original;
        return ret;
      };
    }

    props.partials[options.args[0]] = options.fn;

    return ret;
  });
};

module.exports = exports['default'];


},{"../utils":19}],6:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var loc = node && node.loc,
      line = undefined,
      column = undefined;
  if (loc) {
    line = loc.start.line;
    column = loc.start.column;

    message += ' - ' + line + ':' + column;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  /* istanbul ignore else */
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, Exception);
  }

  if (loc) {
    this.lineNumber = line;
    this.column = column;
  }
}

Exception.prototype = new Error();

exports['default'] = Exception;
module.exports = exports['default'];


},{}],7:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.registerDefaultHelpers = registerDefaultHelpers;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _helpersBlockHelperMissing = require('./helpers/block-helper-missing');

var _helpersBlockHelperMissing2 = _interopRequireDefault(_helpersBlockHelperMissing);

var _helpersEach = require('./helpers/each');

var _helpersEach2 = _interopRequireDefault(_helpersEach);

var _helpersHelperMissing = require('./helpers/helper-missing');

var _helpersHelperMissing2 = _interopRequireDefault(_helpersHelperMissing);

var _helpersIf = require('./helpers/if');

var _helpersIf2 = _interopRequireDefault(_helpersIf);

var _helpersLog = require('./helpers/log');

var _helpersLog2 = _interopRequireDefault(_helpersLog);

var _helpersLookup = require('./helpers/lookup');

var _helpersLookup2 = _interopRequireDefault(_helpersLookup);

var _helpersWith = require('./helpers/with');

var _helpersWith2 = _interopRequireDefault(_helpersWith);

function registerDefaultHelpers(instance) {
  _helpersBlockHelperMissing2['default'](instance);
  _helpersEach2['default'](instance);
  _helpersHelperMissing2['default'](instance);
  _helpersIf2['default'](instance);
  _helpersLog2['default'](instance);
  _helpersLookup2['default'](instance);
  _helpersWith2['default'](instance);
}


},{"./helpers/block-helper-missing":8,"./helpers/each":9,"./helpers/helper-missing":10,"./helpers/if":11,"./helpers/log":12,"./helpers/lookup":13,"./helpers/with":14}],8:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerHelper('blockHelperMissing', function (context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if (context === true) {
      return fn(this);
    } else if (context === false || context == null) {
      return inverse(this);
    } else if (_utils.isArray(context)) {
      if (context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = _utils.createFrame(options.data);
        data.contextPath = _utils.appendContextPath(options.data.contextPath, options.name);
        options = { data: data };
      }

      return fn(context, options);
    }
  });
};

module.exports = exports['default'];


},{"../utils":19}],9:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('../utils');

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('each', function (context, options) {
    if (!options) {
      throw new _exception2['default']('Must pass iterator to #each');
    }

    var fn = options.fn,
        inverse = options.inverse,
        i = 0,
        ret = '',
        data = undefined,
        contextPath = undefined;

    if (options.data && options.ids) {
      contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (_utils.isFunction(context)) {
      context = context.call(this);
    }

    if (options.data) {
      data = _utils.createFrame(options.data);
    }

    function execIteration(field, index, last) {
      if (data) {
        data.key = field;
        data.index = index;
        data.first = index === 0;
        data.last = !!last;

        if (contextPath) {
          data.contextPath = contextPath + field;
        }
      }

      ret = ret + fn(context[field], {
        data: data,
        blockParams: _utils.blockParams([context[field], field], [contextPath + field, null])
      });
    }

    if (context && typeof context === 'object') {
      if (_utils.isArray(context)) {
        for (var j = context.length; i < j; i++) {
          if (i in context) {
            execIteration(i, i, i === context.length - 1);
          }
        }
      } else {
        var priorKey = undefined;

        for (var key in context) {
          if (context.hasOwnProperty(key)) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey !== undefined) {
              execIteration(priorKey, i - 1);
            }
            priorKey = key;
            i++;
          }
        }
        if (priorKey !== undefined) {
          execIteration(priorKey, i - 1, true);
        }
      }
    }

    if (i === 0) {
      ret = inverse(this);
    }

    return ret;
  });
};

module.exports = exports['default'];


},{"../exception":6,"../utils":19}],10:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('helperMissing', function () /* [args, ]options */{
    if (arguments.length === 1) {
      // A missing field in a {{foo}} construct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new _exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"');
    }
  });
};

module.exports = exports['default'];


},{"../exception":6}],11:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerHelper('if', function (conditional, options) {
    if (_utils.isFunction(conditional)) {
      conditional = conditional.call(this);
    }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if (!options.hash.includeZero && !conditional || _utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function (conditional, options) {
    return instance.helpers['if'].call(this, conditional, { fn: options.inverse, inverse: options.fn, hash: options.hash });
  });
};

module.exports = exports['default'];


},{"../utils":19}],12:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (instance) {
  instance.registerHelper('log', function () /* message, options */{
    var args = [undefined],
        options = arguments[arguments.length - 1];
    for (var i = 0; i < arguments.length - 1; i++) {
      args.push(arguments[i]);
    }

    var level = 1;
    if (options.hash.level != null) {
      level = options.hash.level;
    } else if (options.data && options.data.level != null) {
      level = options.data.level;
    }
    args[0] = level;

    instance.log.apply(instance, args);
  });
};

module.exports = exports['default'];


},{}],13:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (instance) {
  instance.registerHelper('lookup', function (obj, field) {
    return obj && obj[field];
  });
};

module.exports = exports['default'];


},{}],14:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerHelper('with', function (context, options) {
    if (_utils.isFunction(context)) {
      context = context.call(this);
    }

    var fn = options.fn;

    if (!_utils.isEmpty(context)) {
      var data = options.data;
      if (options.data && options.ids) {
        data = _utils.createFrame(options.data);
        data.contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]);
      }

      return fn(context, {
        data: data,
        blockParams: _utils.blockParams([context], [data && data.contextPath])
      });
    } else {
      return options.inverse(this);
    }
  });
};

module.exports = exports['default'];


},{"../utils":19}],15:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('./utils');

var logger = {
  methodMap: ['debug', 'info', 'warn', 'error'],
  level: 'info',

  // Maps a given level value to the `methodMap` indexes above.
  lookupLevel: function lookupLevel(level) {
    if (typeof level === 'string') {
      var levelMap = _utils.indexOf(logger.methodMap, level.toLowerCase());
      if (levelMap >= 0) {
        level = levelMap;
      } else {
        level = parseInt(level, 10);
      }
    }

    return level;
  },

  // Can be overridden in the host environment
  log: function log(level) {
    level = logger.lookupLevel(level);

    if (typeof console !== 'undefined' && logger.lookupLevel(logger.level) <= level) {
      var method = logger.methodMap[level];
      if (!console[method]) {
        // eslint-disable-line no-console
        method = 'log';
      }

      for (var _len = arguments.length, message = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        message[_key - 1] = arguments[_key];
      }

      console[method].apply(console, message); // eslint-disable-line no-console
    }
  }
};

exports['default'] = logger;
module.exports = exports['default'];


},{"./utils":19}],16:[function(require,module,exports){
(function (global){
/* global window */
'use strict';

exports.__esModule = true;

exports['default'] = function (Handlebars) {
  /* istanbul ignore next */
  var root = typeof global !== 'undefined' ? global : window,
      $Handlebars = root.Handlebars;
  /* istanbul ignore next */
  Handlebars.noConflict = function () {
    if (root.Handlebars === Handlebars) {
      root.Handlebars = $Handlebars;
    }
    return Handlebars;
  };
};

module.exports = exports['default'];


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],17:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.checkRevision = checkRevision;
exports.template = template;
exports.wrapProgram = wrapProgram;
exports.resolvePartial = resolvePartial;
exports.invokePartial = invokePartial;
exports.noop = noop;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

var _exception = require('./exception');

var _exception2 = _interopRequireDefault(_exception);

var _base = require('./base');

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = _base.COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = _base.REVISION_CHANGES[currentRevision],
          compilerVersions = _base.REVISION_CHANGES[compilerRevision];
      throw new _exception2['default']('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new _exception2['default']('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');
    }
  }
}

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new _exception2['default']('No environment passed to template');
  }
  if (!templateSpec || !templateSpec.main) {
    throw new _exception2['default']('Unknown template object: ' + typeof templateSpec);
  }

  templateSpec.main.decorator = templateSpec.main_d;

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  function invokePartialWrapper(partial, context, options) {
    if (options.hash) {
      context = Utils.extend({}, context, options.hash);
      if (options.ids) {
        options.ids[0] = true;
      }
    }

    partial = env.VM.resolvePartial.call(this, partial, context, options);
    var result = env.VM.invokePartial.call(this, partial, context, options);

    if (result == null && env.compile) {
      options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
      result = options.partials[options.name](context, options);
    }
    if (result != null) {
      if (options.indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = options.indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new _exception2['default']('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
    }
  }

  // Just add water
  var container = {
    strict: function strict(obj, name) {
      if (!(name in obj)) {
        throw new _exception2['default']('"' + name + '" not defined in ' + obj);
      }
      return obj[name];
    },
    lookup: function lookup(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        if (depths[i] && depths[i][name] != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function lambda(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function fn(i) {
      var ret = templateSpec[i];
      ret.decorator = templateSpec[i + '_d'];
      return ret;
    },

    programs: [],
    program: function program(i, data, declaredBlockParams, blockParams, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths || blockParams || declaredBlockParams) {
        programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = wrapProgram(this, i, fn);
      }
      return programWrapper;
    },

    data: function data(value, depth) {
      while (value && depth--) {
        value = value._parent;
      }
      return value;
    },
    merge: function merge(param, common) {
      var obj = param || common;

      if (param && common && param !== common) {
        obj = Utils.extend({}, common, param);
      }

      return obj;
    },

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  function ret(context) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths = undefined,
        blockParams = templateSpec.useBlockParams ? [] : undefined;
    if (templateSpec.useDepths) {
      if (options.depths) {
        depths = context !== options.depths[0] ? [context].concat(options.depths) : options.depths;
      } else {
        depths = [context];
      }
    }

    function main(context /*, options*/) {
      return '' + templateSpec.main(container, context, container.helpers, container.partials, data, blockParams, depths);
    }
    main = executeDecorators(templateSpec.main, main, container, options.depths || [], data, blockParams);
    return main(context, options);
  }
  ret.isTop = true;

  ret._setup = function (options) {
    if (!options.partial) {
      container.helpers = container.merge(options.helpers, env.helpers);

      if (templateSpec.usePartial) {
        container.partials = container.merge(options.partials, env.partials);
      }
      if (templateSpec.usePartial || templateSpec.useDecorators) {
        container.decorators = container.merge(options.decorators, env.decorators);
      }
    } else {
      container.helpers = options.helpers;
      container.partials = options.partials;
      container.decorators = options.decorators;
    }
  };

  ret._child = function (i, data, blockParams, depths) {
    if (templateSpec.useBlockParams && !blockParams) {
      throw new _exception2['default']('must pass block params');
    }
    if (templateSpec.useDepths && !depths) {
      throw new _exception2['default']('must pass parent depths');
    }

    return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
  };
  return ret;
}

function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
  function prog(context) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var currentDepths = depths;
    if (depths && context !== depths[0]) {
      currentDepths = [context].concat(depths);
    }

    return fn(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), currentDepths);
  }

  prog = executeDecorators(fn, prog, container, depths, data, blockParams);

  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  prog.blockParams = declaredBlockParams || 0;
  return prog;
}

function resolvePartial(partial, context, options) {
  if (!partial) {
    if (options.name === '@partial-block') {
      partial = options.data['partial-block'];
    } else {
      partial = options.partials[options.name];
    }
  } else if (!partial.call && !options.name) {
    // This is a dynamic partial that returned a string
    options.name = partial;
    partial = options.partials[partial];
  }
  return partial;
}

function invokePartial(partial, context, options) {
  options.partial = true;
  if (options.ids) {
    options.data.contextPath = options.ids[0] || options.data.contextPath;
  }

  var partialBlock = undefined;
  if (options.fn && options.fn !== noop) {
    options.data = _base.createFrame(options.data);
    partialBlock = options.data['partial-block'] = options.fn;

    if (partialBlock.partials) {
      options.partials = Utils.extend({}, options.partials, partialBlock.partials);
    }
  }

  if (partial === undefined && partialBlock) {
    partial = partialBlock;
  }

  if (partial === undefined) {
    throw new _exception2['default']('The partial ' + options.name + ' could not be found');
  } else if (partial instanceof Function) {
    return partial(context, options);
  }
}

function noop() {
  return '';
}

function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? _base.createFrame(data) : {};
    data.root = context;
  }
  return data;
}

function executeDecorators(fn, prog, container, depths, data, blockParams) {
  if (fn.decorator) {
    var props = {};
    prog = fn.decorator(prog, props, container, depths && depths[0], data, blockParams, depths);
    Utils.extend(prog, props);
  }
  return prog;
}


},{"./base":3,"./exception":6,"./utils":19}],18:[function(require,module,exports){
// Build out our basic SafeString type
'use strict';

exports.__esModule = true;
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
  return '' + this.string;
};

exports['default'] = SafeString;
module.exports = exports['default'];


},{}],19:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.extend = extend;
exports.indexOf = indexOf;
exports.escapeExpression = escapeExpression;
exports.isEmpty = isEmpty;
exports.createFrame = createFrame;
exports.blockParams = blockParams;
exports.appendContextPath = appendContextPath;
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

var badChars = /[&<>"'`=]/g,
    possible = /[&<>"'`=]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

var toString = Object.prototype.toString;

exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/* eslint-disable func-style */
var isFunction = function isFunction(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  exports.isFunction = isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
exports.isFunction = isFunction;

/* eslint-enable func-style */

/* istanbul ignore next */
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};

exports.isArray = isArray;
// Older IE versions do not directly support indexOf so we must implement our own, sadly.

function indexOf(array, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string == null) {
      return '';
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = '' + string;
  }

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

function createFrame(object) {
  var frame = extend({}, object);
  frame._parent = object;
  return frame;
}

function blockParams(params, ids) {
  params.path = ids;
  return params;
}

function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}


},{}],20:[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = require('./dist/cjs/handlebars.runtime')['default'];

},{"./dist/cjs/handlebars.runtime":2}],21:[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":20}],22:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"js-menu-wrap\">\n"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : {},depth0,{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"js-menu-item\">\n"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.separator : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <div class=\"js-menu-separator\"></div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.menu : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(11, data, 0),"data":data})) != null ? stack1 : "");
},"6":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.disable : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"data":data})) != null ? stack1 : "");
},"7":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "        <div class=\"js-menu-disable\" data-command=\""
    + alias4(((helper = (helper = helpers.command || (depth0 != null ? depth0.command : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"command","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</div>\n";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "        <div class=\"js-menu-button js-menu-has-submenu\" data-command=\""
    + alias4(((helper = (helper = helpers.command || (depth0 != null ? depth0.command : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"command","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</div>\n        <div class=\"js-menu js-menu-submenu\" style=\"display:none\">\n"
    + ((stack1 = container.invokePartial(partials.menuItem,(depth0 != null ? depth0.menu : depth0),{"name":"menuItem","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.disable : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(12, data, 0),"data":data})) != null ? stack1 : "");
},"12":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "        <div class=\"js-menu-button\" data-command=\""
    + alias4(((helper = (helper = helpers.command || (depth0 != null ? depth0.command : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"command","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1;

  return "<div class=\"js-menu js-menu-root\">\n"
    + ((stack1 = container.invokePartial(partials.menuItem,depth0,{"name":"menuItem","data":data,"indent":"    ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "</div>\n";
},"main_d":  function(fn, props, container, depth0, data, blockParams, depths) {

  var decorators = container.decorators;

  fn = decorators.inline(fn,props,container,{"name":"inline","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"args":["menuItem"],"data":data}) || fn;
  return fn;
  }

,"useDecorators":true,"usePartial":true,"useData":true,"useDepths":true});

},{"hbsfy/runtime":21}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _core = require('./core');

var core = _interopRequireWildcard(_core);

var _contextmenu = require('./contextmenu.hbs');

var _contextmenu2 = _interopRequireDefault(_contextmenu);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @fileoverview Context menu component
 * @author NHN Ent. FE Development team <dl_javascript@nhnent.com>
 */
var util = tui.util;

var MODALESS = { modaless: true };

/**
 * @typedef ContextMenu~MenuItem
 * @property {string} title - title of menu item
 * @property {string} [command] - string for alternative of using title to command
 * @property {boolean} [separator=false] - set true then this menu will use
 *  separator
 * @property {MenuItem[]} [menu] - you can define submenu recursivly
 */

/**
 * ContextMenu
 */

var ContextMenu = function () {
    /**
     * Constructor
     * @param {HTMLElement} container - container for placing context menu
     *  floating layers
     * @param {object} options - options for context menu
     *   @param {number} [options.delay=100] - delay for displaying submenu
     * @example
     * var menu = new tui.component.ContextMenu(document.querySelector('#fl'));
     */

    function ContextMenu(container) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {
            delay: 130
        } : arguments[1];

        _classCallCheck(this, ContextMenu);

        /**
         * @type {object}
         */
        this.options = Object.assign({}, options);
        /**
         * @type {HTMLElement}
         */
        this.container = container;

        /**
         * @type {Map}
         */
        this.layerMap = new Map();

        /**
         * @type {FloatingLayer}
         */
        this.activeLayer = null;

        /**
         * @type {boolean}
         */
        this.pageScrolled = false;

        /**
         * @type {function}
         */
        this.cloneMouseMoveEvent = null;

        dom.on(document, 'contextmenu', this._onContextMenu, this);
    }

    /**
     * Destructor
     * @api
     */


    ContextMenu.prototype.destroy = function destroy() {
        dom.off(document, 'contextmenu', this._onContextMenu, this);

        this._hideContextMenu();

        this.container = this.layerMap = this.activeLayer = this.pageScolled = this.cloneMouseMoveEvent = null;
    };

    /**
     * Hide activated context menu and unbind related DOM events
     * @private
     */


    ContextMenu.prototype._hideContextMenu = function _hideContextMenu() {
        var layer = this.activeLayer;

        if (!layer) {
            return;
        }

        dom.off(layer.container, 'mousemove', this.cloneMouseMoveEvent, this);
        dom.off(document, 'mousedown', this._onMouseDown, this);
        dom.off(document, 'click', this._onMouseClick, this);
        dom.off(document, 'scroll', this._onPageScroll, this);

        layer.hide();

        var hideElement = function hideElement(menu) {
            dom.css(menu, {
                display: 'none',
                marginTop: ''
            });
        };

        dom.findAll(layer.container, '.js-menu-root').forEach(hideElement);
        dom.findAll(layer.container, '.js-menu-submenu').forEach(hideElement);

        this.pageScrolled = false;
        this.activeLayer = this.cloneMouseMoveEvent = null;
    };

    /**
     * Mouse down event handler for close context menu
     * @param {MouseEvent} mouseDownEvent - mouseDown event object
     * @private
     */


    ContextMenu.prototype._onMouseDown = function _onMouseDown(mouseDownEvent) {
        var target = mouseDownEvent.target || mouseDownEvent.srcElement;

        if (!dom.closest(target, '.js-menu-root')) {
            this._hideContextMenu();
        }
    };

    /**
     * Mouse click event handler for invoking callback when click menu item
     * @param {MouseEvent} clickEvent - click MouseEvent object
     * @private
     */


    ContextMenu.prototype._onMouseClick = function _onMouseClick(clickEvent) {
        var target = clickEvent.target || clickEvent.srcElement;
        var title = dom.textContent(target).trim();
        var command = dom.getData(target, 'command');
        var container = dom.closest(target, '.floating-layer');
        var isMenuButton = dom.hasClass(target, 'js-menu-button');
        var isSeparator = dom.hasClass(target, 'js-menu-separator');
        var hasSubmenu = dom.hasClass(target, 'js-menu-has-submenu');
        var isDisableButton = dom.hasClass(target, 'js-menu-disable');

        if (isDisableButton) {
            this._hideContextMenu();

            return;
        }

        if (!(container && isMenuButton)) {
            return;
        }

        if (isSeparator || hasSubmenu) {
            return;
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = this.layerMap.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var layer = _step.value;

                if (container === layer.container) {
                    layer.callback(clickEvent, command || title);
                    this._hideContextMenu();

                    return;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    };

    /**
     * Show menu element without veil browser viewport
     * @param {HTMLElement} element - menu element
     * @param {object} [strategy] - methods for handle situations that
     *  menu veil by browser viewports
     * @param {object} [initialStyle] - initial style before
     *  calculating new bound
     * @private
     */


    ContextMenu.prototype._showWithoutOverflow = function _showWithoutOverflow(element) {
        var strategy = arguments.length <= 1 || arguments[1] === undefined ? { rightOverflow: core.noop, bottomOverflow: core.noop } : arguments[1];
        var initialStyle = arguments.length <= 2 || arguments[2] === undefined ? { marginTop: '', marginLeft: '' } : arguments[2];

        dom.css(element, 'visibility', 'hidden');
        dom.css(element, initialStyle);
        dom.css(element, 'display', 'block');

        var _dom$getRect = dom.getRect(element);

        var menuRight = _dom$getRect.right;
        var menuBottom = _dom$getRect.bottom;


        var menuDoc = (element.document || element.ownerDocument).documentElement;
        var viewportWidth = menuDoc.clientWidth;
        var viewportHeight = menuDoc.clientHeight;


        var isRightOverflowed = menuRight > viewportWidth;
        var isBottomOverflowed = menuBottom > viewportHeight;

        if (isRightOverflowed) {
            strategy.rightOverflow(element, menuRight, viewportWidth);
        }

        if (isBottomOverflowed) {
            strategy.bottomOverflow(element, menuBottom, viewportHeight);
        }

        dom.css(element, 'visibility', '');
    };

    /**
     * Show root menu element
     * @param {number} left - left pixel position
     * @param {number} top - top pixel position
     * @private
     */


    ContextMenu.prototype._showRootMenu = function _showRootMenu(left, top) {
        var layer = this.activeLayer;

        if (!layer) {
            return;
        }

        var rootMenuElement = dom.find(layer.container, '.js-menu-root');

        layer.setBound({ left: left, top: top });
        layer.show();

        this._showWithoutOverflow(rootMenuElement, {
            rightOverflow: function rightOverflow(el, right, viewportWidth) {
                dom.css(el, 'marginLeft', viewportWidth - right + 'px');
            },
            bottomOverflow: function bottomOverflow(el, bottom, viewportHeight) {
                dom.css(el, 'marginTop', viewportHeight - bottom + 'px');
            }
        });
    };

    /**
     * Show sub menu element
     * @param {HTMLElement} element - submenu root element
     * @private
     */


    ContextMenu.prototype._showSubMenu = function _showSubMenu(element) {
        this._showWithoutOverflow(element, {
            rightOverflow: function rightOverflow(el, right, viewportWidth) {
                dom.css(el, 'marginLeft', viewportWidth - right + el.clientWidth + 'px');
            },
            bottomOverflow: function bottomOverflow(el, bottom, viewportHeight) {
                dom.css(el, 'marginTop', viewportHeight - bottom + 'px');
            }
        }, {
            marginTop: '',
            marginLeft: '100%'
        });
    };

    /**
     * Refresh all submenu element
     *
     * Hide elements that no related with mouse event and show others
     * @param {HTMLElement} layerOnCursor - layer element on cursor
     * @private
     */


    ContextMenu.prototype._refreshMenuDisplay = function _refreshMenuDisplay(layerOnCursor) {
        var container = this.activeLayer.container;
        var allSubmenus = dom.findAll(container, '.js-menu-submenu');
        var layersUntilRoot = [];

        while (layerOnCursor && container !== layerOnCursor) {
            if (dom.hasClass(layerOnCursor, 'js-menu-submenu')) {
                layersUntilRoot.push(layerOnCursor);
            }

            layerOnCursor = layerOnCursor.parentNode;
        }

        allSubmenus.forEach(function (menuElement) {
            if (layersUntilRoot.indexOf(menuElement) < 0) {
                dom.css(menuElement, 'display', 'none');
            }
        });

        layersUntilRoot.forEach(util.bind(this._showSubMenu, this));
    };

    /**
     * Mouse move event handler for reveal context menus
     * @param {MouseEvent} mouseMoveEvent - mouse move event object
     * @private
     */


    ContextMenu.prototype._onMouseMove = function _onMouseMove(mouseMoveEvent) {
        if (this.pageScrolled) {
            this.pageScrolled = false;

            return;
        }

        var target = mouseMoveEvent.target || mouseMoveEvent.srcElement;
        var activeLayer = this.activeLayer;

        if (!(activeLayer && dom.closest(target, '.js-menu-root'))) {
            return;
        }

        var layerOnCursor = void 0;

        if (dom.hasClass(target, 'js-menu-has-submenu')) {
            layerOnCursor = dom.find(target.parentNode, '.js-menu-submenu');
        } else {
            layerOnCursor = dom.closest(target, '.js-menu-submenu');
        }

        this._refreshMenuDisplay(layerOnCursor);
    };

    /**
     * Scroll handle for prevent break position after scrolling
     * @private
     */


    ContextMenu.prototype._onPageScroll = function _onPageScroll() {
        this.pageScrolled = true;
    };

    /**
     * Event handler
     * @param {MouseEvent} clickEvent - mouse event object
     * @private
     */


    ContextMenu.prototype._onContextMenu = function _onContextMenu(clickEvent) {
        var opt = this.options;

        var target = clickEvent.target || clickEvent.srcElement;
        var relatedLayer = void 0;

        while (target.parentNode) {
            var findElement = this.layerMap.get(target);

            if (findElement) {
                relatedLayer = findElement;
                break;
            }

            target = target.parentNode;
        }

        if (!relatedLayer) {
            return;
        }

        dom.preventDefault(clickEvent);

        this.activeLayer = relatedLayer;

        var position = dom.getMousePosition(clickEvent, document.body || document.documentElement);

        var left = position[0]; //clickEvent.clientX;
        var top = position[1]; //clickEvent.clientY;
        var debouncedMouseMove = util.debounce(util.bind(this._onMouseMove, this), opt.delay);

        this.cloneMouseMoveEvent = function (mouseMoveEvent) {
            var virtualMouseEvent = {
                target: mouseMoveEvent.target || mouseMoveEvent.srcElement
            };

            debouncedMouseMove(virtualMouseEvent);
        };

        this._showRootMenu(left, top);

        dom.on(relatedLayer.container, 'mousemove', this.cloneMouseMoveEvent, this);
        dom.on(document, 'mousedown', this._onMouseDown, this);
        dom.on(document, 'click', this._onMouseClick, this);
        dom.on(document, 'scroll', this._onPageScroll, this);
    };

    /**
     * Register context menu
     * @param {string} selector - css selector for displaying contextmenu at
     *  secondary mouse button click
     * @param {function} callback - callback for each menu item clicked
     * @param {MenuItem[]} menuItems - menu item schema
     * @api
     */


    ContextMenu.prototype.register = function register(selector, callback, menuItems) {
        var target = dom.find(selector);

        if (!target) {
            return;
        }

        var layer = new tui.component.FloatingLayer(this.container, MODALESS);

        layer.callback = callback;
        layer.setBound({ width: 'auto', height: 'auto' });
        layer.setContent((0, _contextmenu2['default'])(menuItems));

        this.layerMap.set(target, layer);
    };

    /**
     * Unregister context menu
     * @param {string} selector - css selector used for register context menu
     * @returns {boolean} whether unregister is successful?
     * @api
     */


    ContextMenu.prototype.unregister = function unregister(selector) {
        var layerMap = this.layerMap;
        var target = dom.find(selector);

        if (!target) {
            return false;
        }

        var layer = layerMap.get(target);

        if (!layer) {
            return false;
        }

        layer.destroy();

        layerMap['delete'](target);

        return true;
    };

    return ContextMenu;
}();

exports['default'] = ContextMenu;

},{"./contextmenu.hbs":22,"./core":24}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.noop = noop;
exports.uniq = uniq;
exports.reduce = reduce;
exports.remove = remove;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * @fileoverview Core utility methods module
 * @author NHN Ent. FE Development team <dl_javascript@nhnent.com>
 */
var util = tui.util;

/**
 * A no-operation function that returns undefined regardless of the arguments
 *  it receives.
 */
function noop() {}

/**
 * Create a duplicate-free version of an array
 * @param {Array} array - The array to inspect.
 * @returns {Array} Returns the new duplicate free array.
 */
function uniq(array) {
    return [].concat(_toConsumableArray(new Set(array)));
}

/**
 * @param {Collection} collection - The collection to iterate over.
 * @param {function} [iteratee] - The function invoked per iteration.
 * @param {*} accumulator - The initial value.
 * @returns {*} Returns the accumulated value.
 */
function reduce(collection, iteratee, accumulator) {
    if (util.isArray(collection)) {
        if (accumulator) {
            return collection.reduce(iteratee, accumulator);
        }

        return collection.reduce(iteratee);
    }

    util.forEach(collection, function (value, index) {
        if (typeof accumulator === 'undefined') {
            accumulator = value;
        } else {
            accumulator = iteratee(accumulator, value, index);
        }
    });

    return accumulator;
}

/**
 * Removes all elements from array that predicate returns truthy for and
 *  returns an array of the removed elements. The predicate is invoked with
 *  three arguments: (value, index, array).
 * @param {Array} array - The array to modify.
 * @param {(Function|String|Number)} predicate - The function invoked per
 *  iteration.
 * @returns {Array} Returns the new array of removed elements.
 */
function remove(array, predicate) {
    var match = void 0;

    if (util.isFunction(predicate)) {
        match = function match(v) {
            return predicate(v);
        };
    } else {
        match = function match(v) {
            return predicate === v;
        };
    }

    var removed = [];

    for (var idx = 0, len = array.length; idx < len; idx += 1) {
        var value = array[idx];
        if (match(value, idx, array)) {
            removed.push(value);
            array.splice(idx, 1);
            len -= 1;
            idx -= 1;
        }
    }

    return removed;
}

},{}]},{},[1]);
