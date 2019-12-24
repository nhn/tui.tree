var testsContext = require.context('.', true, /spec\.js$/);
var featureTestsContext = require.context('./features', true, /specx\.js$/);

testsContext.keys().forEach(testsContext);
featureTestsContext.keys().forEach(featureTestsContext);
