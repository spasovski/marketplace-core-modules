var allTestFiles = ['underscore'];
var TEST_REGEXP = /tests\/.*\.js$/i;

// Automatically clenaup sinon spies and stubs.
var realSinon = sinon;
beforeEach(function() {
    sinon = realSinon.sandbox.create();
});
afterEach(function() {
    sinon.restore();
    sinon = realSinon;
});

function withSettings(changes, test) {
    var settings = require('core/settings');
    var changed = {};
    Object.keys(changes).forEach(function(key) {
        // Remember if it exists so we can delete it if it doesn't.
        if (key in settings) {
            changed[key] = settings[key];
        }
        settings[key] = changes[key];
    });
    test();
    Object.keys(changes).forEach(function(key) {
        if (key in changed) {
            settings[key] = changed[key];
        } else {
            delete settings[key];
        }
    });
}

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        allTestFiles.push(pathToModule(file));
    }
});

require.config({
    // Karma serves files under /base, the basePath from your config file.
    baseUrl: '/base',
    paths: {
        'jquery': 'bower_components/jquery/jquery',
        'underscore': 'bower_components/underscore/underscore',
        'Squire': 'bower_components/squire/src/Squire'
    },
    shim: {
        underscore: {
            exports: '_',
        },
    },
    // Dynamically load all test files.
    deps: allTestFiles,
    // Kick off jasmine since it is asynchronous.
    callback: window.__karma__.start
});

// Using this instead of `deps` and `callback` in the `require.config` seems to
// prevent Squire from causing tests to run twice.
require(allTestFiles, function() {
    window.__karma__.start();
});