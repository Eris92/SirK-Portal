(function () {
    "use strict";

    var root = document.getElementById("mycompany-admin");
    var tabs = root && root.querySelector(".mc-admin-tabs");
    var content = document.getElementById("mycompany-admin-content");
    if (!root || !tabs || !content) return;

    var shell = document.createElement("div");
    shell.className = "mc-admin-shell";
    root.insertBefore(shell, tabs);
    shell.appendChild(tabs);
    shell.appendChild(content);

    function activeTab() {
        var button = tabs.querySelector("[data-tab].active");
        return button ? button.getAttribute("data-tab") : "overview";
    }

    function relocateSettingsNavigation() {
        var fresh = content.querySelector(".mc-admin-settings-nav");
        var current = tabs.querySelector(".mc-admin-settings-subnav");

        if (fresh) {
            if (current && current !== fresh && current.parentNode) {
                current.parentNode.removeChild(current);
            }
            fresh.classList.add("mc-admin-settings-subnav");
            var settingsButton = tabs.querySelector('[data-tab="settings"]');
            tabs.insertBefore(fresh, settingsButton.nextSibling);

            var layout = content.querySelector(".mc-admin-settings-layout");
            if (layout) layout.classList.add("mc-admin-settings-layout-single");
            current = fresh;
        }

        if (current) {
            current.style.display = activeTab() === "settings" ? "block" : "none";
        }
    }

    tabs.addEventListener("click", function () {
        window.setTimeout(relocateSettingsNavigation, 0);
    });

    var observer = new MutationObserver(function () {
        relocateSettingsNavigation();
    });
    observer.observe(content, {
        childList: true,
        subtree: true
    });

    relocateSettingsNavigation();
}());
