(function () {
    "use strict";

    var selectedProvider = "";
    var selectedStatus = "";
    var overviewFilter = "";
    var providers = [];
    var requests = [];

    var order = ["moverequests", "mycommands", "myscripts"];
    var titles = {
        moverequests: "Move Requests",
        mycommands: "Commands",
        myscripts: "Scripts"
    };

    function svg(paths) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths + '</svg>';
    }

    var icons = {
        overview: svg('<path d="M5 4h14v3H5zM5 10h14v3H5zM5 16h14v3H5z"/>'),
        moverequests: svg('<path d="M5 7h12l-3-3m3 3-3 3M19 17H7l3 3m-3-3 3-3"/>'),
        mycommands: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m7 10 3 2-3 2m5 1h5"/>'),
        myscripts: svg('<path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6m-6 4h6"/>'),
        all: svg('<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h8"/>'),
        pending: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
        executing: svg('<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>'),
        approved: svg('<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/>'),
        completed: svg('<path d="M4 5h16v14H4z"/><path d="m8 12 2.5 2.5L16 9"/>'),
        failed: svg('<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>'),
        rejected: svg('<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>')
    };

    function ordered(rows) {
        var map = Object.create(null);
        (rows || []).forEach(function (item) { map[item.type] = item; });
        return order.map(function (key) { return map[key]; }).filter(Boolean);
    }

    function skin(shell) {
        var page = shell.state.page;
        if (!page || !page.root) return;
        // SharedPage owns the complete layout and visual classes. Approval Center
        // adds only its semantic hook so switching views cannot pollute the shell.
        page.root.classList.add("mc-module-approvalcenter");
    }

    function nav(host, options) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "sirk-management-item mc-approval-nav-item " + (options.className || "");
        button.classList.toggle("is-active", options.active === true);
        button.classList.toggle("active", options.active === true);
        button.title = options.title;

        var icon = document.createElement("span");
        icon.className = "sirk-management-item-icon mc-approval-nav-icon";
        if (options.iconKey) icon.classList.add("mc-approval-icon-" + options.iconKey);
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = options.icon || icons.all;

        var label = document.createElement("span");
        label.className = "sirk-script-label mc-approval-nav-label";
        label.textContent = options.title + (options.count == null ? "" : " - " + options.count);

        button.appendChild(icon);
        button.appendChild(label);
        button.onclick = options.onClick;
        host.appendChild(button);
        return button;
    }

    function providerButtons(host, shell) {
        providers.forEach(function (provider) {
            nav(host, {
                title: titles[provider.type] || provider.tabTitle || provider.title,
                icon: icons[provider.type] || icons.all,
                iconKey: provider.type,
                className: "mc-approval-provider",
                active: selectedProvider === provider.type,
                onClick: function () {
                    selectedProvider = provider.type;
                    selectedStatus = "";
                    shell.render();
                }
            });
        });
    }

    function primary(shell) {
        var host = shell.state.page.primary;
        host.innerHTML = "";
        nav(host, {
            title: "Overview",
            icon: icons.overview,
            iconKey: "overview",
            active: !selectedProvider,
            onClick: function () {
                selectedProvider = "";
                selectedStatus = "";
                shell.render();
            }
        });
        providerButtons(host, shell);
    }

    function counts(rows) {
        var result = { all: rows.length, moverequests: 0, mycommands: 0, myscripts: 0 };
        rows.forEach(function (row) {
            if (Object.prototype.hasOwnProperty.call(result, row.type)) result[row.type]++;
        });
        return result;
    }

    function overviewFilters(shell, rows) {
        var host = shell.state.page.secondary;
        var count = counts(rows);
        host.innerHTML = "";
        nav(host, {
            title: "All",
            icon: icons.all,
            iconKey: "all",
            count: count.all,
            active: !overviewFilter,
            onClick: function () { overviewFilter = ""; shell.render(); }
        });
        providers.forEach(function (provider) {
            nav(host, {
                title: titles[provider.type] || provider.title,
                icon: icons[provider.type] || icons.all,
                iconKey: provider.type,
                count: count[provider.type] || 0,
                active: overviewFilter === provider.type,
                onClick: function () { overviewFilter = provider.type; shell.render(); }
            });
        });
    }

    function statuses(shell) {
        var host = shell.state.page.secondary;
        host.innerHTML = "";
        window.SharedStatusNav.list().forEach(function (status) {
            nav(host, {
                title: status.title,
                icon: icons[status.key] || icons.all,
                iconKey: status.key,
                className: "mc-approval-status",
                active: selectedStatus === status.key,
                onClick: function () { selectedStatus = status.key; shell.render(); }
            });
        });
    }

    function decisions(shell, request, host) {
        if (!request.canDecide) return;
        var actions = document.createElement("div");
        actions.className = "sirk-approval-actions mc-approval-request-actions";

        [
            { title: "Approve", approved: true, className: "sirk-primary-button" },
            { title: "Reject", approved: false, className: "sirk-primary-button sirk-danger-button" }
        ].forEach(function (definition) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = definition.className;
            button.textContent = definition.title;
            button.onclick = function () {
                button.disabled = true;
                shell.post("decide", { id: request.id, approved: definition.approved, note: "" })
                    .then(shell.render)
                    .catch(function (error) {
                        button.disabled = false;
                        shell.error(host, error);
                    });
            };
            actions.appendChild(button);
        });
        host.appendChild(actions);
    }

    function cards(shell, title, empty, rows) {
        var host = shell.state.page.details;
        host.innerHTML = "";
        rows = rows || requests;

        if (title) host.appendChild(shell.element("h2", "mc-approval-details-title", title));
        if (!rows.length) {
            host.appendChild(shell.card("No requests", empty || "No requests match the selected provider and status."));
            return;
        }

        var grid = document.createElement("div");
        grid.className = "sirk-approval-card-grid mc-approval-card-grid";
        host.appendChild(grid);

        rows.forEach(function (request) {
            var card = shell.card(request.title || request.type, "");
            card.classList.add("sirk-card", "mc-approval-request-card");

            var meta = shell.element("div", "sirk-muted mc-approval-request-meta");
            meta.textContent = (request.requester && request.requester.name || "—") + " · " + (request.status || "—");
            card.appendChild(meta);

            card.appendChild(shell.element("div", "sirk-muted", new Date(request.createdAt).toLocaleString()));
            if (request.summary) card.appendChild(shell.element("p", "mc-approval-request-summary", request.summary));

            var provider = shell.element("span", "mc-approval-request-provider", titles[request.type] || request.type);
            card.appendChild(provider);
            decisions(shell, request, card);
            grid.appendChild(card);
        });
    }

    function approver(request) {
        if (request.approver && request.approver.name) return request.approver.name;
        var decisionsList = Array.isArray(request.approvalDecisions) ? request.approvalDecisions : [];
        for (var index = decisionsList.length - 1; index >= 0; index--) {
            if (decisionsList[index].user && decisionsList[index].user.name) return decisionsList[index].user.name;
        }
        return "—";
    }

    function table(shell, title, empty, rows) {
        var host = shell.state.page.details;
        host.innerHTML = "";
        window.SharedResultsView.mountTable(host, {
            title: title,
            rows: rows || [],
            filter: true,
            filterPlaceholder: "Filter requests",
            showView: true,
            dialogTitle: "Request details",
            resultValue: function (request) {
                try { return JSON.stringify(request, null, 2); }
                catch (error) { return request.summary || ""; }
            },
            columns: [
                { title: "DateTime", value: function (request) { return request.createdAt ? new Date(request.createdAt).toLocaleString() : "—"; } },
                { title: "Request", value: function (request) { return request.title || request.summary || request.type || "—"; } },
                { title: "Requester", value: function (request) { return request.requester && request.requester.name || "—"; } },
                { title: "Approver", value: approver },
                { title: "Approval", value: function (request) {
                    var progress = request.approvalProgress || {};
                    return progress.text || ((progress.approved || 0) + "/" + (progress.total || 0));
                } },
                { title: "Status", value: function (request) { return request.status || "—"; }, className: function (request) {
                    return "mc-results-status mc-results-status-" + String(request.status || "unknown").toLowerCase();
                } },
                { title: "Summary", value: function (request) { return request.summary || "—"; } }
            ],
            actions: function (cell, request) { decisions(shell, request, cell); },
            emptyText: empty
        });
    }

    function load(shell, options) {
        options = options || {};
        return shell.api("requests", {
            type: options.type || "",
            status: options.status || "",
            q: shell.state.search,
            page: 1,
            perPage: 200
        }).then(function (response) {
            requests = response.rows || [];
            if (options.after) options.after(requests);
            else if (options.table) table(shell, options.title, options.empty, requests);
            else cards(shell, options.title, options.empty, requests);
        });
    }

    var module = window.MyCompanyModuleShell.create({
        key: "approvalcenter",
        title: "Approval Center",
        menuTitle: "Approval Center",
        order: 110,
        preset: "approvalcenter",
        buttons: {
            collapse: { side: "left", order: 10 },
            link: false,
            refresh: { side: "left", order: 50 },
            search: { side: "left", order: 70 },
            clear: false,
            favorites: false,
            manage: false,
            settings: false
        },
        tabs: [],
        defaultTab: "",
        render: function (shell) {
            skin(shell);
            return shell.api("providers").then(function (response) {
                providers = ordered(response.providers || []);
                primary(shell);

                if (!selectedProvider) {
                    return load(shell, {
                        status: "pending",
                        after: function (rows) {
                            overviewFilters(shell, rows);
                            var filtered = overviewFilter
                                ? rows.filter(function (request) { return request.type === overviewFilter; })
                                : rows;
                            cards(
                                shell,
                                overviewFilter ? (titles[overviewFilter] || overviewFilter) + " awaiting approval" : "Requests awaiting approval",
                                "There are no pending requests for the selected filter.",
                                filtered
                            );
                        }
                    });
                }

                statuses(shell);
                return load(shell, {
                    type: selectedProvider,
                    status: selectedStatus,
                    title: titles[selectedProvider] || selectedProvider,
                    empty: "No requests match the selected provider and status.",
                    table: true
                });
            });
        }
    });

    window.MyCompanyModules.approvalcenter = module;
}());
