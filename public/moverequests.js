(function () {
    "use strict";

    var selectedStatus = "";
    var hostButtonId = "MainDevMyCompany-MoveRequest";

    function renderRows(shell) {
        return shell.api("requests", {
            status: selectedStatus,
            q: shell.state.search,
            page: 1,
            perPage: 100
        }).then(function (result) {
            shell.state.page.details.innerHTML = "";
            (result.rows || []).forEach(function (request) {
                shell.state.page.details.appendChild(shell.card(
                    request.title || "Move request",
                    (request.requester && request.requester.name || "") +
                        " · " +
                        request.status
                ));
            });
        });
    }

    function nodeName(nodeId) {
        if (window.currentNode && window.currentNode.name) {
            return String(window.currentNode.name);
        }
        if (window.nodes && window.nodes[nodeId] && window.nodes[nodeId].name) {
            return String(window.nodes[nodeId].name);
        }
        return String(nodeId || "Device");
    }

    function closeDialog(dialog) {
        if (dialog && dialog.parentNode) dialog.parentNode.removeChild(dialog);
    }

    function openMoveDialog(nodeId) {
        nodeId = String(nodeId || "");
        if (!nodeId) {
            window.alert("No device is selected.");
            return;
        }

        module.api.api("meshes").then(function (result) {
            var overlay = document.createElement("div");
            overlay.className = "mc-move-dialog-overlay";

            var dialog = document.createElement("div");
            dialog.className = "mc-move-dialog";
            overlay.appendChild(dialog);

            var title = document.createElement("h3");
            title.textContent = "Move Request";
            dialog.appendChild(title);

            var device = document.createElement("div");
            device.className = "mc-move-dialog-device";
            device.textContent = nodeName(nodeId);
            dialog.appendChild(device);

            var groupLabel = document.createElement("label");
            groupLabel.textContent = "Target group";
            dialog.appendChild(groupLabel);

            var select = document.createElement("select");
            select.className = "mc-move-dialog-input";
            (result.meshes || []).forEach(function (mesh) {
                var option = document.createElement("option");
                option.value = mesh.id;
                option.textContent = mesh.name;
                select.appendChild(option);
            });
            dialog.appendChild(select);

            var noteLabel = document.createElement("label");
            noteLabel.textContent = "Requester note";
            dialog.appendChild(noteLabel);

            var note = document.createElement("textarea");
            note.className = "mc-move-dialog-input";
            note.rows = 4;
            dialog.appendChild(note);

            var status = document.createElement("div");
            status.className = "mc-move-dialog-status";
            dialog.appendChild(status);

            var actions = document.createElement("div");
            actions.className = "mc-move-dialog-actions";
            dialog.appendChild(actions);

            var cancel = document.createElement("button");
            cancel.type = "button";
            cancel.textContent = "Cancel";
            cancel.onclick = function () { closeDialog(overlay); };
            actions.appendChild(cancel);

            var submit = document.createElement("button");
            submit.type = "button";
            submit.className = "btn btn-primary";
            submit.textContent = "Submit request";
            submit.onclick = function () {
                var option = select.options[select.selectedIndex];
                if (!option) {
                    status.textContent = "Select a target group.";
                    return;
                }
                submit.disabled = true;
                status.textContent = "Submitting...";
                module.api.post("submit", {
                    nodeId: nodeId,
                    nodeName: nodeName(nodeId),
                    targetMeshId: option.value,
                    targetMeshName: option.textContent,
                    note: note.value || ""
                }).then(function () {
                    closeDialog(overlay);
                    window.alert("Move request was created in Approval Center.");
                }).catch(function (error) {
                    status.textContent = error.message || String(error);
                    submit.disabled = false;
                });
            };
            actions.appendChild(submit);

            overlay.onclick = function (event) {
                if (event.target === overlay) closeDialog(overlay);
            };

            document.body.appendChild(overlay);
        }).catch(function (error) {
            window.alert(error.message || String(error));
        });
    }

    function hostButtonEnabled() {
        var bootstrap = module.api.state.bootstrap || {};
        var config = bootstrap.config || {};
        return config.hostButtonEnabled !== false;
    }

    function removeHostButton() {
        var button = document.getElementById(hostButtonId);
        if (button && button.parentNode) button.parentNode.removeChild(button);
    }

    function syncHostButton() {
        if (!hostButtonEnabled()) {
            removeHostButton();
            return;
        }

        var anchor = document.getElementById("MainDevMyCompany-Commands") ||
            document.getElementById("MainDevTerminal");
        if (!anchor || !anchor.parentNode) return;

        var button = document.getElementById(hostButtonId);
        if (!button) {
            button = document.createElement("td");
            button.id = hostButtonId;
            button.tabIndex = 0;
            button.className = "topbar_td style3x";
            button.textContent = "Move Request";
            button.title = "Create a device move request";
            button.onmouseup = function (event) {
                if (event && ((event.which === 3) || (event.button === 2))) return false;
                openMoveDialog(module.api.state.nodeId);
                return false;
            };
            button.onkeypress = function (event) {
                if (event && event.key === "Enter") {
                    openMoveDialog(module.api.state.nodeId);
                }
            };
            anchor.parentNode.insertBefore(button, anchor.nextSibling);
        }
        button.style.display = "";
    }

    var module = window.MyCompanyModuleShell.create({
        key: "moverequests",
        title: "Move Requests",
        menuTitle: "Move Requests",
        showInMenu: false,
        order: 120,
        preset: "standard",
        buttons: {
            favorites: false,
            manage: false,
            settings: false
        },
        tabs: [
            { key: "requests", title: "Requests" }
        ],
        defaultTab: "requests",
        render: function (shell) {
            shell.nav(
                shell.state.page.primary,
                [{ key: "moverequests", title: "Move Requests", icon: "⇄" }],
                "moverequests",
                function () {}
            );
            window.SharedStatusNav.mount(shell.state.page.secondary, {
                selected: selectedStatus,
                onSelect: function (value) {
                    selectedStatus = value;
                    shell.render();
                }
            });
            return renderRows(shell);
        }
    });

    var baseDeviceRefresh = module.onDeviceRefreshEnd;
    module.onDeviceRefreshEnd = function (nodeId) {
        baseDeviceRefresh(nodeId);
        syncHostButton();
    };

    var basePageEnd = module.onNativePageEnd;
    module.onNativePageEnd = function (view) {
        basePageEnd(view);
        syncHostButton();
    };

    window.MyCompanyModules.moverequests = module;
}());
