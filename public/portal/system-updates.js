(function () {
    "use strict";

    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>\"]/g, function (character) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
        });
    }

    function api(action, method, body) {
        return fetch("/api/system/updates/" + action, {
            method: method || "GET",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined
        }).then(function (response) { return response.json(); }).then(function (payload) {
            if (!payload.ok) throw new Error(payload.error || "Update operation failed.");
            return payload.value;
        });
    }

    function render(host) {
        host.innerHTML = '<section class="sirk-update-page">' +
            '<div class="sirk-update-toolbar"><button type="button" data-update-action="refresh">Odśwież</button><button type="button" data-update-action="backup">Utwórz backup</button><button type="button" class="primary" data-update-action="install">Aktualizuj</button></div>' +
            '<div class="sirk-update-channel"><label>Kanał aktualizacji <select data-update-channel><option value="stable">Normalny — main</option><option value="beta">Beta — beta</option><option value="dev">Developerski — develop</option></select></label></div>' +
            '<div data-update-status>Ładowanie…</div></section>';

        var status = host.querySelector("[data-update-status]");
        var channel = host.querySelector("[data-update-channel]");

        function load() {
            status.textContent = "Ładowanie…";
            return api("status").then(function (value) {
                channel.value = value.current.channel;
                var remote = value.remote || {};
                status.innerHTML = '<div class="sirk-update-grid">' +
                    '<article><h3>Wersja i kanał</h3><p>Aktualna: <b>' + escapeHtml(value.current.version) + '</b></p><p>Dostępna: <b>' + escapeHtml(remote.availableVersion || remote.error || "—") + '</b></p><p>Gałąź: <b>' + escapeHtml(value.current.branch) + '</b></p></article>' +
                    '<article><h3>Health check</h3>' + value.health.checks.map(function (check) { return '<p class="' + (check.ok ? "ok" : "fail") + '">' + (check.ok ? "✓" : "✕") + ' ' + escapeHtml(check.name) + (check.error ? ': ' + escapeHtml(check.error) : '') + '</p>'; }).join("") + '</article>' +
                    '<article><h3>Backupy i cofanie</h3>' + (value.backups.length ? value.backups.map(function (backup) { return '<p><button type="button" data-restore-id="' + escapeHtml(backup.id) + '">Przywróć</button> <b>' + escapeHtml(backup.version || "") + '</b><br><small>' + escapeHtml(backup.createdAt || "") + '</small></p>'; }).join("") : '<p>Brak backupów.</p>') + '</article>' +
                    '<article><h3>Historia</h3>' + (value.history.length ? value.history.slice(0, 10).map(function (entry) { return '<p><b>' + escapeHtml(entry.type) + '</b> · ' + escapeHtml(entry.at || "") + '</p>'; }).join("") : '<p>Brak operacji.</p>') + '</article>' +
                    '</div>';
            });
        }

        host.addEventListener("click", function (event) {
            var action = event.target.getAttribute("data-update-action");
            var restoreId = event.target.getAttribute("data-restore-id");
            if (action === "refresh") load().catch(function (error) { status.textContent = error.message; });
            if (action === "backup") api("backup", "POST", { reason: "manual" }).then(load).catch(function (error) { alert(error.message); });
            if (action === "install" && confirm("Utworzyć backup i zaktualizować SIRK Portal z kanału " + channel.value + "?")) {
                api("update", "POST", { channel: channel.value }).then(function () { alert("Aktualizacja została zainstalowana. Uruchom ponownie proces SIRK Portal lub MeshCentral."); }).catch(function (error) { alert(error.message); });
            }
            if (restoreId && confirm("Przywrócić backup " + restoreId + "?")) {
                api("restore", "POST", { backupId: restoreId }).then(function () { alert("Backup został przywrócony. Uruchom ponownie proces."); }).catch(function (error) { alert(error.message); });
            }
        });

        channel.addEventListener("change", function () {
            api("channel", "POST", { channel: channel.value }).then(load).catch(function (error) { alert(error.message); });
        });

        load().catch(function (error) { status.textContent = error.message; });
    }

    function installNavigation() {
        var navigation = document.querySelector(".sirk-standalone-nav");
        var settings = navigation && navigation.querySelector('[data-view="settings"]');
        if (!navigation || !settings || navigation.querySelector('[data-system-updates]')) return;
        var button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-system-updates", "1");
        button.innerHTML = '<span class="icon-settings"><svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></svg></span><b>Aktualizacje</b>';
        navigation.insertBefore(button, settings);
        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            Array.prototype.forEach.call(navigation.querySelectorAll("button"), function (item) { item.classList.remove("is-active"); });
            button.classList.add("is-active");
            var content = document.getElementById("sirkStandaloneContent");
            var title = document.getElementById("sirkStandaloneTitle");
            content.classList.add("sirk-unified-content");
            content.classList.remove("sirk-device-content");
            content.innerHTML = '<div class="sirk-portal-view-host sirk-portal-view-updates"></div>';
            title.textContent = "Aktualizacje";
            render(content.firstElementChild);
            history.replaceState(null, "", "#updates");
        });
        if (location.hash === "#updates") setTimeout(function () { button.click(); }, 0);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installNavigation);
    else installNavigation();
    window.addEventListener("hashchange", function () {
        if (location.hash === "#updates") {
            var button = document.querySelector("[data-system-updates]");
            if (button) button.click();
        }
    });
}());
