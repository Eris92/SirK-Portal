(function () {
    "use strict";

    var selectedProvider = "";
    var selectedStatus = "";
    var providers = [];
    var requests = [];
    var providerOrder = ["moverequests", "mycommands", "myscripts"];
    var providerTitles = {
        moverequests: "Move Request",
        mycommands: "Commands",
        myscripts: "Scripts"
    };

    function button(host, title, className, onClick) {
        var value = document.createElement("button");
        value.type = "button";
        value.className = className || "mc-shared-nav-item";
        value.textContent = title;
        value.onclick = onClick;
        host.appendChild(value);
        return value;
    }

    function orderedProviders(rows) {
        var map = Object.create(null);
        (rows || []).forEach(function (item) {
            map[item.type] = item;
        });
        return providerOrder.map(function (type) {
            return map[type];
        }).filter(Boolean);
    }

    function renderNavigation(shell) {
        var host = shell.state.page.primary;
        host.innerHTML = "";

        var overview = button(host, "Overview", "mc-shared-nav-item mc-approval-overview", function () {
            selectedProvider = "";
            selectedStatus = "";
            shell.render();
        });
        overview.classList.toggle("active", !selectedProvider);

        providers.forEach(function (provider) {
            var group = document.createElement("div");
            group.className = "mc-approval-provider-group";
            host.appendChild(group);

            var providerButton = button(
                group,
                providerTitles[provider.type] || provider.tabTitle || provider.title,
                "mc-shared-nav-item mc-approval-provider",
                function () {
                    selectedProvider = provider.type;
                    selectedStatus = "";
                    shell.render();
                }
            );
            providerButton.classList.toggle("active", selectedProvider === provider.type);

            var statuses = document.createElement("div");
            statuses.className = "mc-approval-status-list";
            group.appendChild(statuses);

            window.SharedStatusNav.list().forEach(function (status) {
                var statusButton = button(
                    statuses,
                    status.icon + " " + status.title,
                    "mc-shared-nav-item mc-approval-status",
                    function () {
                        selectedProvider = provider.type;
                        selectedStatus = status.key;
                        shell.render();
                    }
                );
                statusButton.classList.toggle(
                    "active",
                    selectedProvider === provider.type && selectedStatus === status.key
                );
            });
        });
    }

    function renderRequests(shell) {
        var host = shell.state.page.details;
        host.innerHTML = "";

        if (!requests.length) {
            host.appendChild(shell.card(
                "No requests",
                "No requests match the selected provider and status."
            ));
            return;
        }

        requests.forEach(function (request) {
            var card = shell.card(
                request.title || request.type,
                (request.requester && request.requester.name || "") +
                    " · " +
                    request.status
            );
            var meta = shell.element(
                "div",
                "mc-shared-muted",
                new Date(request.createdAt).toLocaleString()
            );
            card.appendChild(meta);

            if (request.summary) {
                card.appendChild(shell.element(
                    "div",
                    "mc-shared-muted",
                    request.summary
                ));
            }

            if (request.canDecide) {
                var approve = shell.element(
                    "button",
                    "btn btn-primary btn-sm",
                    "Approve"
                );
                approve.type = "button";
                approve.onclick = function () {
                    shell.post("decide", {
                        id: request.id,
                        approved: true,
                        note: ""
                    }).then(shell.render);
                };

                var reject = shell.element(
                    "button",
                    "btn btn-secondary btn-sm",
                    "Reject"
                );
                reject.type = "button";
                reject.onclick = function () {
                    shell.post("decide", {
                        id: request.id,
                        approved: false,
                        note: ""
                    }).then(shell.render);
                };

                card.appendChild(approve);
                card.appendChild(reject);
            }

            host.appendChild(card);
        });
    }

    function renderOverview(shell) {
        return shell.api("overview").then(function (result) {
            var byType = Object.create(null);
            (result.cards || []).forEach(function (card) {
                byType[card.type] = card;
            });

            shell.state.page.details.innerHTML = "";
            providers.forEach(function (provider) {
                var card = byType[provider.type] || {
                    title: providerTitles[provider.type] || provider.title,
                    description: provider.description || "",
                    pending: 0,
                    total: 0
                };
                shell.state.page.details.appendChild(shell.card(
                    providerTitles[provider.type] || card.title,
                    (card.description || "") +
                        " · Pending: " +
                        Number(card.pending || 0) +
                        " · Total: " +
                        Number(card.total || 0)
                ));
            });
        });
    }

    var module = window.MyCompanyModuleShell.create({
        key: "approvalcenter",
        title: "Approval Center",
        menuTitle: "Approval Center",
        order: 110,
        preset: "approvalcenter",
        buttons: {
            favorites: false,
            manage: false,
            settings: false
        },
        tabs: [],
        defaultTab: "",
        render: function (shell) {
            shell.state.page.layout.root.classList.add("mc-approval-layout");
            shell.state.page.secondary.innerHTML = "";

            return shell.api("providers").then(function (result) {
                providers = orderedProviders(result.providers || []);
                renderNavigation(shell);

                if (!selectedProvider) {
                    return renderOverview(shell);
                }

                return shell.api("requests", {
                    type: selectedProvider,
                    status: selectedStatus,
                    q: shell.state.search,
                    page: 1,
                    perPage: 100
                }).then(function (requestResult) {
                    requests = requestResult.rows || [];
                    renderRequests(shell);
                });
            });
        }
    });

    window.MyCompanyModules.approvalcenter = module;
}());
