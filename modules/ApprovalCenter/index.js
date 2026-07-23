"use strict";

// Compatibility shim for installations and extensions that still import the
// historical backend path. New code must use server/modules/approval-center.
module.exports = require("../../server/modules/approval-center/index.js");
