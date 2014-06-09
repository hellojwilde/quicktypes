"use strict";

var _           = require("lodash");
var LiteralUtil = require("./LiteralUtil");

var LINEBREAK = "\n";

function indent(aStr) {
  var prefix = "  ";
  return aStr.split(LINEBREAK).map(function (aLine) { 
    return prefix + aLine;
  }).join(LINEBREAK);
}

function isMultiline(aStr) {
  return aStr.indexOf(LINEBREAK) !== -1;
}

function dumpAnnoError(aProgramCtx, aAnnoNode, aError) {
  var anno    = LiteralUtil.getLiteralValue(aAnnoNode.expression),
      line    = anno.split(LINEBREAK)[aError.line - 1],
      loc     = aAnnoNode.loc.start.line + ":" + aAnnoNode.loc.start.column,
      pointer = "^";

  _.times(aError.offset, function () { pointer = " " + pointer; });

  console.error("\n" + aProgramCtx.sourceFileName + ":" + loc + ":");
  console.error(StringUtil.indent([
      line,
      pointer,
      aError.toString()
    ].join(LINEBREAK)));
}

var StringUtil = {
  LINEBREAK: LINEBREAK,
  indent: indent,
  isMultiline: isMultiline,
  dumpAnnoError: dumpAnnoError
};

module.exports = StringUtil;
