'use strict';

var testsContext = require.context('.', true, /test\.js$/);
var srcContexts = require.context('../src', true, /index\.js$/);

testsContext.keys().forEach(testsContext);
srcContexts.keys().forEach(srcContexts);
