"use strict";

var _              = require("lodash");
var Context        = require("./Context");
var inferStatement = require("./Statement");

function inferProgram(aSourceFileName, aNode) {
  var ctx = Context.createForProgram(aSourceFileName);
  aNode.body.forEach(_.partial(inferStatement, ctx));
  return ctx;
}

module.exports = inferProgram;
