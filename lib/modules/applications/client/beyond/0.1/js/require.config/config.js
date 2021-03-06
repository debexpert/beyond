var RequireConfig = function (events) {
    "use strict";

    onError(events);

    // register the paths of the imported libraries by the application
    var hosts = beyond.hosts;
    var paths = {};
    var host;

    if (hosts.application && hosts.application.js) {

        if (beyond.params.local)
            host = location.origin + hosts.application.js;
        else
            host = hosts.application.js;

        if (host.substr(host.length - 1) === '/') {
            host = host.substr(0, host.length - 1);
        }

        paths.application = host;

    }

    for (var name in hosts.libraries) {

        var library = hosts.libraries[name];

        if (beyond.params.local)
            host = location.origin + library.js;
        else
            host = library.js;

        if (host.substr(host.length - 1) === '/') {
            host = host.substr(0, host.length - 1);
        }

        paths['libraries/' + name] = host;

    }

    requirejs.config({'paths': paths});

    Object.defineProperty(this, 'paths', {
        'get': function () {
            return requirejs.s.contexts._.config.paths;
        }
    });

};
