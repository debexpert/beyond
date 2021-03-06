var async = require('async');

module.exports = function (application, runtime) {

    this.script = async(function *(resolve, reject, language) {
        "use strict";

        if (!language) {
            reject(new Error('language not set'));
            return;
        }

        let Resource = require('path').join(require('main.lib'), 'resource');
        Resource = require(Resource);

        let script = '';

        let hosts = application.hosts(language);
        if (!hosts.application.js) hosts.application.js = './';

        if (runtime.local) {
            let ports = require(require('path').join(require('main.lib'), '/server')).ports;
            hosts.ports = {'http': ports.http, 'ws': ports.rpc};
        }

        hosts = JSON.stringify(hosts);

        let params = application.params;
        params.local = runtime.local;
        params.name = application.name;
        params.language = language;
        params.version = application.version;
        params = JSON.stringify(params);

        let overwrites = {};
        for (let moduleID of application.overwrites.keys) {

            let statics = application.overwrites.items[moduleID].static;
            if (!statics) continue;

            let module = moduleID.split('/');
            let libraryName = module.shift();
            module = module.join('/');
            if (!module) module = 'main';

            if (!overwrites[libraryName]) overwrites[libraryName] = {};
            if (!overwrites[libraryName][module]) overwrites[libraryName][module] = [];

            for (let key of statics.keys) overwrites[libraryName][module].push(key);

        }
        overwrites = JSON.stringify(overwrites);

        let values;
        if (!application.css.values) values = '{}';
        else values = JSON.stringify(application.css.values);

        script += '(function(beyond) {\n';
        script += '    beyond.params = ' + params + ';\n';
        script += '    beyond.hosts = ' + hosts + ';\n';
        script += '    beyond.css = {};\n';
        script += '    beyond.css.values = ' + values + ';\n';
        script += '    beyond.overwrites = ' + overwrites + ';\n';
        script += '})(window.beyond = {});';

        let resource = new Resource({'content': script, 'contentType': '.js'});
        resolve(resource);

    });

};
