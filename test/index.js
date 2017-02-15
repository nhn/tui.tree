'use strict';

var testsContext = require.context('.', true, /spec\.js$/);
var srcContexts = require.context('../src', true, /index\.js$/);

testsContext.keys().forEach(testsContext);
srcContexts.keys().forEach(srcContexts);
