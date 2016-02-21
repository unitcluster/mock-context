var vm = require('vm');
var deep = require('deep');

var mocks = {
  process: {
    env: { PATH: '/', PWD: '/' },
    title: 'script',
    version: process.version,
    arch: process.arch,
    platform: process.platform,
    argv: [ 'node' ],
    execArgv: [],
    pid: 555,
    features: {},
    config: {},
    moduleLoadList: process.moduleLoadList
  },
  module: {},
  exports: {},
  __filename: '',
  __dirname: '/',
};

var proxyMethod = function(ctx, func, inject) {
  return function() {
    var args = Array.prototype.slice.apply(arguments);
    if (inject) {
      inject.apply(ctx, args);
    }
    func.apply(ctx, args);
  }
};

var globalFunc = {
  Buffer: Buffer,
  setTimeout: setTimeout,
  setInterval: setInterval,
  setImmediate: setImmediate,
  clearTimeout: clearTimeout,
  clearInterval: clearInterval,
  clearImmediate: clearImmediate
};

var processFunc = {
  memoryUsage: process.memoryUsage,
  nextTick: process.nextTick,
};

var requireMock = {
  resolve: require.resolve,
  registerExtension: require.registerExtension
};

var makeConsoleProxy = function() {
  var proxy = {};
  var methods = ['log', 'error', 'info', 'warn', 'assert', 'trace'];
  for (var i=0; i<methods.length; i++) {
    var method = methods[i];
    proxy[method] = proxyMethod(console, console[method]);
  }
  return proxy;
};

module.exports = function(custom, options) {
  var sandbox = deep.clone(mocks);
  var filename = sandbox.__filename = options.options || 'index.js';

  sandbox.global = sandbox.GLOBAL = sandbox;

  var moduleMock = {
    module: { id: filename.replace('.js', '') , filename: filename, loaded: true, children: [], paths: ['/'] },
    exports: {},
  };

  for (var k in moduleMock) {
    sandbox[k] = moduleMock[k];
  }
  for (var k in globalFunc) {
    sandbox[k] = proxyMethod(sandbox, globalFunc[k]);
  }
  sandbox.require = function(name) {
    if (sandbox.require.cache[name]) {
      return sandbox.require.cache[name];
    }
    var path = require.resolve(name);
    sandbox.require.cache[name] = require(path);
    return sandbox.require.cache[name];
  };

  for (var k in requireMock) {
    sandbox.require[k] = proxyMethod(sandbox.require, requireMock[k]);
  }
  for (var k in processFunc) {
    sandbox.process[k] = proxyMethod(sandbox.process, processFunc[k]);
  }
  sandbox.module.exports = sandbox.exports;
  sandbox.require.cache = {};
  sandbox.console = makeConsoleProxy();

  if (custom && Object.keys(custom).length) {
    sandbox = deep.extend(sandbox, custom)
  }

  return vm.createContext(sandbox);
};
