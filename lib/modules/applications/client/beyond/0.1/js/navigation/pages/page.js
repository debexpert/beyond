/* The Page object is a wrapper to the page object created
 from the Page class exposed by the module.
 The Page object creates the container of the page, and it is inserted in the DOM

 The module that exposes the Page class is loaded when the dependencies is loaded.
 The dependencies are specified in the specs object.
 The specs object is registered in the start.js script by beyond.

 Once the dependencies are loaded, then the Page class is instantiated, and the "prepare" method
 is called. The prepared method is asynchronous, and it is also optional.
 After the "prepare" method is executed (only if exists), then the render method is executed.
 The render method is synchronous, and also optional.
 Finally the show method is executed, only if the page was not hidden before.

 If an error occurs, it is exposed in the "error" attribute.
 */
function Page(pathname, module, specs, parameter) {
    "use strict";

    var events = new Events({'bind': this});

    // showTime indicates when the page has to be shown.
    // It allows to give the time to transition of the page being hidden
    // without interfering with the transition of the active page being shown.
    // showTime is set by the navigation object when calling the .show method.
    // When the .hide method is called, the showTime is set as undefined,
    // meaning that this page is not currently active.
    var showTime;

    // The params to be sent to the page control.
    var params;

    // Is it the page active?
    Object.defineProperty(this, 'active', {
        'get': function () {
            // If the showTime was set, then the page is considered as active
            return !!showTime;
        }
    });

    Object.defineProperty(this, 'pathname', {
        'get': function () {
            return pathname;
        }
    });

    // control is the instance of the Page class exposed by the module
    var control;

    // Create the container of the page
    var $container = $('<div style="display: none; opacity: 0;" class="beyond-page"/>')
        .attr('pathname', pathname);

    $('body > .container').append($container);

    var error;
    Object.defineProperty(this, 'error', {
        'get': function () {
            return error;
        }
    });

    var ready;

    var showing;
    var show = Delegate(this, function () {

        if (!showTime || showing || !ready) return;

        showing = true;
        $container.show();

        if (typeof control.render === 'function') {
            control.render.call(control, params);
        }

        // The container has to be shown 500ms after the .show method was called
        // to let the animation of the previous page to be hidden.
        // But as it is required some time to load the dependencies of this page, and also the prepare
        // method can take extra time, it should probably be started before the 500ms.
        var timer = showTime - Date.now();
        if (timer < 0) timer = 0;

        setTimeout(function () {

            // In case that the page was hidden before it had the time to be executed
            if (!showTime) return;

            if (typeof control.show === 'function') {
                control.show.call(control, params);
            }

            showing = false;

            // In case that the page has navigated another page.
            if (beyond.pathname === pathname) {
                $container.addClass('show');
                $container.css('opacity', '');
            }

            events.trigger('rendered');

        }, timer);

    });

    var prepare = Delegate(this, function () {

        var timer = setTimeout(function () {
            console.warn('Page "' + pathname +
                '" is taking too much time to invoke the callback of the "prepare" function.');
        }, 5000);

        control.prepare.call(control, params, function () {

            clearTimeout(timer);
            ready = true;
            show();

        });

    });

    /* Load the dependencies of the Page class. The module that exposes the Page class is
     automatically included by BeyondJS in the list of dependencies.
     */
    var coordinate = new Coordinate('dependencies', 'react', function () {

        var Control = dependencies.modules.Page;

        if (typeof Control !== 'function') {
            error = 'Invalid control. Module "' + module.ID + '" must expose a function.';
            console.error(error, Control);
            return;
        }

        control = new Control($container, parameter, dependencies.modules);

        // Once the dependencies are loaded, then execute the "prepare" method (optional)
        if (typeof control.prepare === 'function') {
            prepare();
        }
        else {
            ready = true;
            show();
        }

    });
    var dependencies = new Dependencies(module, specs.dependencies);
    dependencies.done(coordinate.dependencies);

    if (module.react.loading) {
        module.react.done(coordinate.react);
    }
    else {
        coordinate.done('react');
    }

    this.show = function (_params, _showTime) {

        if (destroying) {
            console.error('Page is being destroyed.');
            return;
        }

        params = _params;
        showTime = _showTime;
        if (!showTime) showTime = Date.now();

        show();

    };

    this.hide = function (done) {

        showTime = undefined;

        if (!ready) {
            // The show method was never called, so just return
            if (done) done();
            return;
        }

        if (typeof control.hide === 'function') {
            control.hide.call(control);
        }

        setTimeout(function () {

            // In case that the page was shown again before it had the time to be executed
            if (showTime && !destroying) return;

            $container.removeClass('show');
            setTimeout(function () {

                // In case that the page was shown again before it had the time to be executed
                if (showTime && !destroying) return;
                $container.hide();

                if (done) done();

            }, 300);

        }, 200);

    };

    var destroying;
    this.destroy = function () {

        destroying = true;
        this.hide(function () {

            // Give time to the transition to end
            setTimeout(Delegate(this, function () {

                if (typeof control.destroy === 'function') {
                    control.destroy.call(control);
                }

                $container.remove();

            }), 500);

        });

    };

}
