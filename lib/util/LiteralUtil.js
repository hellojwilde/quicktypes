"use strict";

var AnnoTypes     = require("../AnnoTypes");
var BooleanType   = AnnoTypes.BooleanType;
var NumberType    = AnnoTypes.NumberType;
var StringType    = AnnoTypes.StringType;
var UndefinedType = AnnoTypes.UndefinedType;

function getIdentifier(aNode) {
  return aNode ? aNode.name : undefined;
}

function getLiteralValue(aNode) {
  return aNode ? aNode.value : undefined;
}

function getLiteralType(aNode) {
  switch (typeof aNode.value) {
    case "boolean":
      return new BooleanType();
    case "number":
      return new NumberType();
    case "string":
      return new StringType();
    default:
      throw new Error("Literal type not implemented.");
      break;
  }
}

module.exports = {
  getIdentifier: getIdentifier,
  getLiteralValue: getLiteralValue,
  getLiteralType: getLiteralType
};
