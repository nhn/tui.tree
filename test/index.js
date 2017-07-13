'use strict';

var testsContext = require.context('.', true, /spec\.js$/);
var featureTestsContext = require.context('./features', true, /spec\.js$/);

testsContext.keys().forEach(testsContext);
featureTestsContext.keys().forEach(featureTestsContext);
