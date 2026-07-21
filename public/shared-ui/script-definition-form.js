(function () {
    "use strict";

    if (!window.SharedScriptTools || window.SharedScriptTools.__definitionFormInstalled) return;
    window.SharedScriptTools.__definitionFormInstalled = true;

    var originalCreate = window.SharedScriptTools.create;

    function text(value) {
        return String(value == null ? "" : value);
    }

    function element(tag, className, value) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (value != null) node.textContent = value;
        return node;
    }

    function field(labelText, control) {
        var row = element("label", "mc-definition-field");
        row.appendChild(element("span", "mc-definition-label", labelText));
        row.appendChild(control);
        return row;
    }

    function splitDirective(item) {
        item = item || {};
        var raw = text(item.value).trim();
        var pieces = raw.split(",");
        var name = text(pieces.shift()).trim().replace(/^[\s$%]+/, "");
        return {
            directive: text(item.directive || "Variable"),
            name: name,
            value: pieces.join(",").trim()
        };
    }

    function directiveValue(row) {
        var name = text(row.name.value).trim().replace(/^[\s$%]+/, "");
        var value = text(row.value.value).trim();
        if (!name) return "";
        return "$" + name + (value ? ", " + value : "");
    }

    function createSelect(values, selected) {
        var select = element("select", "mc-definition-input mc-definition-type");
        values.forEach(function (value) {
            var option = element("option", "", value);
            option.value = value;
            option.selected = value === selected;
            select.appendChild(option);
        });
        return select;
    }

    function createDirectiveTable(title, rows, types, emptyType) {
        var section = element("section", "mc-definition-section");
        var header = element("div", "mc-definition-section-header");
        header.appendChild(element("h4", "", title));
        var add = element("button", "btn btn-secondary btn-sm", "Add variable");
        add.type = "button";
        header.appendChild(add);
        section.appendChild(header);

        var wrapper = element("div", "mc-definition-table-wrap");
        var table = element("table", "style1 mc-definition-table");
        var head = table.createTHead().insertRow();
        ["Type", "Variable name", "Value / label / options", ""].forEach(function (name) {
            head.appendChild(element("th", "", name));
        });
        var body = table.createTBody();
        wrapper.appendChild(table);
        section.appendChild(wrapper);

        var controls = [];

        function addRow(value) {
            value = value || { directive: emptyType, name: "", value: "" };
            var tr = body.insertRow();
            var type = createSelect(types, types.indexOf(value.directive) >= 0 ? value.directive : emptyType);
            var name = element("input", "mc-definition-input");
            name.type = "text";
            name.value = value.name || "";
            name.placeholder = "ApiToken";
            var description = element("input", "mc-definition-input");
            description.type = "text";
            description.value = value.value || "";
            description.placeholder = "API token";
            var remove = element("button", "btn btn-secondary btn-sm mc-definition-remove", "×");
            remove.type = "button";
            tr.insertCell().appendChild(type);
            tr.insertCell().appendChild(name);
            tr.insertCell().appendChild(description);
            tr.insertCell().appendChild(remove);
            var record = { row: tr, type: type, name: name, value: description };
            controls.push(record);
            remove.onclick = function () {
                var index = controls.indexOf(record);
                if (index >= 0) controls.splice(index, 1);
                tr.remove();
            };
            return record;
        }

        (rows || []).map(splitDirective).forEach(addRow);
        add.onclick = function () { addRow(); };

        return {
            element: section,
            values: function () {
                return controls.map(function (row) {
                    var value = directiveValue(row);
                    return value ? { directive: row.type.value, value: value } : null;
                }).filter(Boolean);
            }
        };
    }

    function installDefinitionEditor(tool) {
        tool.openDefinitionEditor = function (shell, script, onSaved) {
            Promise.all([
                shell.api("definition", { path: script.path }),
                shell.api("script-secrets", { path: script.path }).catch(function () { return { secrets: { variables: [] } }; })
            ]).then(function (responses) {
                var value = responses[0].definition || {};
                var secretState = responses[1].secrets || { variables: [] };
                var host = shell.state.page.details;
                host.innerHTML = "";

                var card = shell.card("Edit: " + (value.label || script.label || script.name), value.path || script.path);
                card.classList.add("mc-script-definition-card", "mc-script-definition-form");

                var name = element("input", "mc-definition-input");
                name.type = "text";
                name.value = value.label || script.label || script.name || "";

                var description = element("textarea", "mc-definition-input");
                description.rows = 3;
                description.value = value.description || "";

                var top = element("div", "mc-definition-top-grid");
                top.appendChild(field("Name", name));
                top.appendChild(field("Description", description));
                card.appendChild(top);

                var approval = element("section", "mc-definition-section mc-definition-approval");
                approval.appendChild(element("h4", "", "Approval"));
                var approvalBoxes = element("div", "mc-script-approval-levels");
                [1, 2, 3].forEach(function (level) {
                    var item = element("label", "mc-definition-check");
                    var box = element("input");
                    box.type = "checkbox";
                    box.value = String(level);
                    box.checked = (value.approvalLevels || []).map(Number).indexOf(level) >= 0;
                    item.appendChild(box);
                    item.appendChild(document.createTextNode(" Level " + level));
                    approvalBoxes.appendChild(item);
                });
                approval.appendChild(approvalBoxes);
                card.appendChild(approval);

                var variables = createDirectiveTable(
                    "Variables",
                    value.variables || [],
                    ["Variable", "VariableRequired", "VariableSelect", "VariableSelectRequired", "VariableSwitch", "VariableSwitchRequired", "VariableUser", "VariableUserRequired", "VariableAsset", "VariableAssetRequired"],
                    "Variable"
                );
                card.appendChild(variables.element);

                var secrets = createDirectiveTable(
                    "Credentials / secrets",
                    value.secretVariables || [],
                    ["SaveSecret", "SaveSecretRequired"],
                    "SaveSecretRequired"
                );
                card.appendChild(secrets.element);

                var execution = element("section", "mc-definition-section");
                execution.appendChild(element("h4", "", "Execution"));
                var runAs = createSelect(["0", "1", "2"], String(value.runAsUser || 0));
                Array.prototype.forEach.call(runAs.options, function (option) {
                    option.textContent = option.value === "1" ? "Logged-on user" : option.value === "2" ? "SYSTEM" : "Default";
                });
                execution.appendChild(field("Run as", runAs));
                var multiLabel = element("label", "mc-definition-check");
                var multi = element("input");
                multi.type = "checkbox";
                multi.checked = value.multiHost === true;
                multiLabel.appendChild(multi);
                multiLabel.appendChild(document.createTextNode(" Allow multi-device execution"));
                execution.appendChild(multiLabel);
                card.appendChild(execution);

                var sourceDetails = element("details", "mc-definition-source");
                sourceDetails.open = true;
                sourceDetails.appendChild(element("summary", "", "Script code"));
                var source = element("textarea", "mc-script-editor mc-definition-source-editor");
                source.spellcheck = false;
                source.value = text(value.body);
                sourceDetails.appendChild(source);
                card.appendChild(sourceDetails);

                if ((secretState.variables || []).length) {
                    var hint = element("div", "mc-definition-secret-state");
                    hint.appendChild(element("strong", "", "Credential status: "));
                    hint.appendChild(document.createTextNode(secretState.variables.map(function (item) {
                        return item.name + " — " + (item.configured ? "configured" : item.required ? "required" : "not configured");
                    }).join(" | ")));
                    card.appendChild(hint);
                }

                var actions = element("div", "mc-script-manage-actions");
                var save = shell.element("button", "btn btn-primary btn-sm", "Save");
                var credentials = shell.element("button", "btn btn-secondary btn-sm", "Credentials");
                var cancel = shell.element("button", "btn btn-secondary btn-sm", "Cancel");
                save.type = credentials.type = cancel.type = "button";

                save.onclick = function () {
                    save.disabled = true;
                    shell.post("definition", {
                        path: script.path,
                        definition: {
                            label: name.value,
                            description: description.value,
                            approvalLevels: Array.prototype.map.call(approvalBoxes.querySelectorAll("input:checked"), function (box) { return Number(box.value); }),
                            variables: variables.values(),
                            secretVariables: secrets.values(),
                            runAsUser: Number(runAs.value) || 0,
                            multiHost: multi.checked,
                            body: source.value
                        }
                    }).then(function (result) {
                        tool.state.editMode = false;
                        if (typeof onSaved === "function") onSaved(result);
                    }).catch(function (error) {
                        save.disabled = false;
                        var note = element("div", "mc-shared-error", error.message || String(error));
                        card.appendChild(note);
                    });
                };

                credentials.onclick = function () {
                    tool.openCredentialsEditor(shell, script, function (result) {
                        if (typeof onSaved === "function") onSaved(result || null);
                    });
                };
                cancel.onclick = function () {
                    tool.state.editMode = false;
                    if (typeof onSaved === "function") onSaved(null);
                };

                actions.appendChild(save);
                actions.appendChild(credentials);
                actions.appendChild(cancel);
                card.appendChild(actions);
                host.appendChild(card);
                name.focus();
            }).catch(function (error) {
                shell.error(shell.state.page.details, error);
            });
        };
    }

    window.SharedScriptTools.create = function (options) {
        var tool = originalCreate.call(window.SharedScriptTools, options);
        installDefinitionEditor(tool);
        return tool;
    };
}());