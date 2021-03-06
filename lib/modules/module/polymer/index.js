var async = require('async');

module.exports = async(function *(resolve, reject, module, config, language) {
    "use strict";

    let processors = require('./processors')(module);
    let error = require('./error.js')(module);

    let scope = function (code) {

        // add an extra tab in all lines
        code = code.replace(/\n/g, '\n    ');
        code = '    ' + code + '\n';

        // add script inside its own function
        let output = '';
        output += '<dom-module id="' + config.id + '"';

        if (config.is) output += ' is="' + config.is + '"';

        output += '>\n\n';
        output += code;
        output += '</dom-module>';

        return output;

    };

    let output = {'dom-module': '', 'dependencies': ''};

    let process = {};
    if (config.dependencies) process.dependencies = config.dependencies;
    if (config.css) process.css = config.css;
    if (config.less) process.less = config.less;
    if (config.txt) process.txt = config.txt;
    if (config.html) process.html = config.html;
    if (config.js) process.js = config.js;
    if (config.jsx) process.jsx = config.jsx;

    for (let processorID in process) {

        if (typeof process[processorID] !== 'object' || !process[processorID]) {
            reject(error('configuration is not defined'));
            return;
        }

        let processor = processors[processorID];
        if (!processor) {
            reject(error('processor "' + processorID + '" does not exist'));
            return;
        }

        // process the block of the processor
        let resource = yield processor.process(process[processorID], language);
        if (resource) {
            if (processorID === 'dependencies') {

                output.dependencies += resource;

            }
            else {

                output['dom-module'] += resource;

                if (output['dom-module'].substr(output['dom-module'].length - 1) !== '\n')
                    output['dom-module'] += '\n';

            }

        }

    }

    let code = output.dependencies;
    if (code) code += '\n';
    code += scope(output['dom-module']);

    resolve(code);

});
