(function () {
    "use strict";

    function valueAt(row, path, fallback) {
        var current = row;
        var parts = String(path || "").split(".");
        for (var index = 0; index < parts.length; index++) {
            if (current == null) return fallback;
            current = current[parts[index]];
        }
        return current == null || current === "" ? fallback : current;
    }

    function approver(row) {
        if (row.approver && row.approver.name) return row.approver.name;
        var decisions = Array.isArray(row.approvalDecisions)
            ? row.approvalDecisions
            : [];
        for (var index = decisions.length - 1; index >= 0; index--) {
            if (decisions[index].user && decisions[index].user.name) {
                return decisions[index].user.name;
            }
        }
        return "—";
    }

    function resultText(row) {
        var result = row && row.result || {};
        return result.output ||
            result.message ||
            row.output ||
            (row.status === "pending"
                ? "Waiting for approval."
                : row.status === "executing"
                    ? "Executing..."
                    : row.status || "—");
    }

    function defaultColumns(kind) {
        var columns = [
            {
                title: "DateTime",
                value: function (row) {
                    return row.createdAt
                        ? new Date(row.createdAt).toLocaleString()
                        : "—";
                }
            },
            {
                title: kind === "commands" ? "Command" : "Script",
                value: function (row) {
                    return row.title ||
                        valueAt(row, "result.command", "") ||
                        row.summary ||
                        "—";
                }
            }
        ];

        if (kind === "commands") {
            columns.push({
                title: "Device",
                value: function (row) {
                    return valueAt(row, "result.nodeName", "") ||
                        valueAt(row, "result.nodeId", "") ||
                        String(row.summary || "").replace(/^Device:\s*/i, "") ||
                        "—";
                }
            });
        }

        columns.push(
            {
                title: "Requester",
                value: function (row) {
                    return valueAt(row, "requester.name", "—");
                }
            },
            {
                title: "Approver",
                value: approver
            },
            {
                title: "Status",
                value: function (row) {
                    return row.status || "—";
                },
                className: function (row) {
                    return "mc-results-status mc-results-status-" +
                        String(row.status || "unknown").toLowerCase();
                }
            },
            {
                title: "Result",
                value: resultText,
                pre: true
            }
        );

        return columns;
    }

    window.SharedResultsView = {
        mountStatus: function (host, options) {
            options = options || {};
            window.SharedStatusNav.mount(host, {
                selected: options.selected || "",
                counts: options.counts,
                onSelect: options.onSelect
            });
        },

        mountTable: function (host, options) {
            options = options || {};
            var rows = Array.isArray(options.rows) ? options.rows : [];
            var columns = options.columns || defaultColumns(options.kind || "scripts");
            host.innerHTML = "";

            if (options.title) {
                var title = document.createElement("h3");
                title.className = "mc-results-title";
                title.textContent = options.title;
                host.appendChild(title);
            }

            if (!rows.length) {
                var empty = document.createElement("div");
                empty.className = "mc-shared-card";
                var heading = document.createElement("strong");
                heading.textContent = "No results";
                empty.appendChild(heading);
                var message = document.createElement("div");
                message.className = "mc-shared-muted";
                message.textContent = options.emptyText || "No results match the selected status.";
                empty.appendChild(message);
                host.appendChild(empty);
                return;
            }

            var wrapper = document.createElement("div");
            wrapper.className = "mc-results-table-wrap";
            var table = document.createElement("table");
            table.className = "style1 mc-results-table";
            wrapper.appendChild(table);
            host.appendChild(wrapper);

            var header = table.createTHead().insertRow();
            columns.forEach(function (column) {
                var cell = document.createElement("th");
                cell.textContent = column.title;
                header.appendChild(cell);
            });

            var body = table.createTBody();
            rows.forEach(function (row) {
                var tableRow = body.insertRow();
                columns.forEach(function (column) {
                    var cell = tableRow.insertCell();
                    var value = typeof column.value === "function"
                        ? column.value(row)
                        : valueAt(row, column.path, "—");
                    if (typeof column.className === "function") {
                        cell.className = column.className(row) || "";
                    } else if (column.className) {
                        cell.className = column.className;
                    }
                    if (column.pre) {
                        var pre = document.createElement("pre");
                        pre.className = "mc-results-output";
                        pre.textContent = String(value == null ? "" : value);
                        cell.appendChild(pre);
                    } else {
                        cell.textContent = String(value == null ? "" : value);
                    }
                });
            });
        }
    };
}());
