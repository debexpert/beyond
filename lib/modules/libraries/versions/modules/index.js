var async = require('async');

require('colors');
module.exports = function (library, version, runtime) {
    "use strict";

    let Finder = require('finder');

    Object.defineProperty(this, 'dirname', {
        'get': function () {
            return version.dirname;
        }
    });

    const filename = 'module.json';
    let filter = function (file) {
        if (typeof file === 'string') return (require('path').basename(file) !== filename);
        else return (file.filename !== filename);
    };

    let finder = new Finder(version.dirname, {'search': filter, 'filename': filename});

    let items, keys;
    Object.defineProperty(this, 'processed', {
        'get': function () {
            return !!items;
        }
    });
    Object.defineProperty(this, 'items', {
        'get': function () {
            return items;
        }
    });
    Object.defineProperty(this, 'keys', {
        'get': function () {
            return keys;
        }
    });

    Object.defineProperty(this, 'length', {
        'get': function () {
            if (keys) return keys.length;
        }
    });

    this.process = async(function *(resolve, reject) {

        if (finder.processed) {
            resolve();
            return;
        }

        yield finder.process();

        items = {};
        keys = [];
        for (let key in finder.items) {

            let file = finder.items[key];

            let module;
            try {
                module = yield require('./module')(library, version, file.relative.dirname, runtime);
            }
            catch (exc) {
                console.log('WARNING:'.yellow, exc.message);
                continue;
            }

            keys.push(key);
            items[key] = module;

        }

        resolve();

    });

    this.module = async(function *(resolve, reject, path) {

        let file = require('path').join(path, filename);
        if (filter(file)) {
            resolve();
            return;
        }

        if (items) {
            resolve(items[path]);
            return;
        }

        if (!(yield finder.exists(path))) {
            resolve();
            return;
        }
        else {
            let module = yield require('./module')(library, version, path, runtime);
            resolve(module);
        }

    });

};
