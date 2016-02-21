var vm = require('vm');
var mockContext = require('./index');

var filename = 'test.js';

var code = 'console.log(global); console.log("---"); console.log(process);';

var script = new vm.Script(code, {
  filename: filename,
  displayErrors: false
});

var context = mockContext({}, { filename: filename });

var module = script.runInContext(context, {
  displayErrors: false
});
