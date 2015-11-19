module.exports = function (application, config) {
    "use strict";

    let check = function (i, path) {

        path = require('path').resolve(application.dirname, path);

        let fs = require('fs');
        if (!fs.existsSync(path)) {

            let message = 'static entry "'.red + (i).red.bold + '" on application "'.red +
                (application.name).red.bold + '" is invalid, directory not found: '.red + (path).bold;
            console.log(message);

            return false;

        }

        return true;

    };

    if (config) {

        if (config instanceof Array) {

            let resources = [];

            for (let i in config) {

                if (typeof config[i] !== 'string' || ['..', '/'].indexOf(config[i].substr(0, 1)) !== -1) {

                    let message = 'static entry "'.red + (i).red.bold + '" on application "'.red +
                        (application.name).red.bold + '" is invalid'.red;
                    console.log(message);
                    continue;

                }

                if (check(i, config[i])) resources.push(config[i]);
                else continue;

            }

            if (resources.length) application.static = resources;

        }
        else {
            let message = 'static specification on application "'.red +
                (application.name).red.bold + '" is invalid'.red;
            console.log(message);
        }

    }

};