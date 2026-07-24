(function () {
    "use strict";

    function div(className) {
        var value = document.createElement("div");
        value.className = className;
        return value;
    }

    window.SharedLayout = {
        mount: function (options) {
            options = options || {};
            var host = typeof options.container === "string" ? document.querySelector(options.container) : options.container;
            var root = div("sirk-layout");
            var primary = div("sirk-column sirk-column-primary");
            var secondary = div("sirk-column sirk-column-secondary");
            var details = div("sirk-column sirk-column-details");
            var key = options.storageKey || "";
            var collapsed = false;

            try { collapsed = key && window.localStorage.getItem(key) === "collapsed"; } catch (error) {}

            function setCollapsed(value) {
                collapsed = value === true;
                root.classList.toggle("is-collapsed", collapsed);
                root.setAttribute("data-collapsed", collapsed ? "1" : "0");
                try { if (key) window.localStorage.setItem(key, collapsed ? "collapsed" : "expanded"); } catch (error) {}
                return collapsed;
            }

            root.appendChild(primary);
            root.appendChild(secondary);
            root.appendChild(details);
            host.appendChild(root);
            setCollapsed(collapsed);

            return {
                root: root,
                primary: primary,
                secondary: secondary,
                details: details,
                isCollapsed: function () { return collapsed; },
                setCollapsed: setCollapsed,
                toggleCollapsed: function () { return setCollapsed(!collapsed); },
                clear: function () { primary.innerHTML = ""; secondary.innerHTML = ""; details.innerHTML = ""; }
            };
        }
    };
}());
