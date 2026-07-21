(function () {
    "use strict";

    if (window.__myCompanyResultLayoutInstalled) return;
    window.__myCompanyResultLayoutInstalled = true;

    function normalize(host) {
        host = host || document;
        host.querySelectorAll(".mc-results-inline-actions").forEach(function (actions) {
            var content = actions.nextElementSibling;
            if (!content || !content.classList.contains("mc-results-inline-content")) return;
            var debug = content.querySelector(":scope > .mc-results-debug");
            if (!debug) return;
            actions.classList.add("mc-results-copy-after-output");
            content.insertBefore(actions, debug);
        });
    }

    var scheduled = false;
    function schedule() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(function () {
            scheduled = false;
            normalize(document);
        });
    }

    new MutationObserver(schedule).observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    normalize(document);
}());
