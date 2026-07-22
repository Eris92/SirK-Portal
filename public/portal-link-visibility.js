(function () {
    "use strict";

    var link = document.querySelector(".sirk-standalone-native");
    if (!link) return;

    function apply(config) {
        var visible = !config || config.showNativeLink !== false;
        link.hidden = !visible;
        link.style.display = visible ? "" : "none";
        link.setAttribute("aria-hidden", visible ? "false" : "true");
        if (!visible) link.setAttribute("tabindex", "-1");
        else link.removeAttribute("tabindex");
    }

    function currentConfig() {
        var runtime = window.MyCompanyRuntime;
        var bootstrap = runtime && runtime.state && runtime.state.bootstrap;
        return bootstrap && bootstrap.modules && bootstrap.modules.portal && bootstrap.modules.portal.config;
    }

    var config = currentConfig();
    if (config) {
        apply(config);
        return;
    }

    var attempts = 0;
    var timer = window.setInterval(function () {
        attempts += 1;
        var value = currentConfig();
        if (value || attempts >= 50) {
            window.clearInterval(timer);
            apply(value || {});
        }
    }, 100);
}());
