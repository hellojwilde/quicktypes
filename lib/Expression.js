"use strict";

var _               = require("lodash");
var LiteralUtil     = require("./util/LiteralUtil");
var TypeUtil        = require("./util/TypeUtil");
var AnnoTypes       = require("./AnnoTypes");
var TypeMappingList = AnnoTypes.TypeMappingList;
var TypeMapping     = AnnoTypes.TypeMapping;
var ObjectType      = AnnoTypes.ObjectType;
var TypeList        = AnnoTypes.TypeList;
var ArrayType       = AnnoTypes.ArrayType;
var CompoundType    = AnnoTypes.CompoundType;
var BooleanType     = AnnoTypes.BooleanType;
var NumberType      = AnnoTypes.NumberType;
var StringType      = AnnoTypes.StringType;
var UndefinedType   = AnnoTypes.UndefinedType;
var Context         = require("./Context");

function inferArrayExpression(aCtx, aNode) {
  var types = aNode.elements.map(_.partial(inferExpression, aCtx));
  return new ArrayType(new TypeList(types));
}

function inferObjectExpression(aCtx, aNode) {
  var types = aNode.properties.map(function (aPropNode) {
    var key   = LiteralUtil.getIdentifier(aPropNode.key),
        value = inferExpression(aCtx, aPropNode.value);

    return new TypeMapping(key, value);
  });

  return new ObjectType(new TypeMappingList(types));
}

function inferUnaryExpression(aCtx, aNode) {
  var arg = inferExpression(aCtx, aNode.argument);

  switch (aNode.operator) {
    case "-":
    case "+":
    case "~":
      return new NumberType();

    case "delete":
    case "!":
      return new BooleanType();
    
    case "typeof":
      return new StringType();

    case "void":
      return new UndefinedType();

    default:
      throw new Error("Unary expression operator {op} is not implemented."
                      .replace("{op}", aNode.operator));
      break;
  }
}

function inferBinaryExpression(aCtx, aNode) {
  var left  = inferExpression(aCtx, aNode.left),
      right = inferExpression(aCtx, aNode.right);

  switch (aNode.operator) {
    case "==":
    case "!=":
    case "===":
    case "!==":
    case "<":
    case "<=":
    case ">":
    case ">=":
    case "instanceof":
      return new BooleanType();

    case "+":
      if (left instanceof NumberType && right instanceof NumberType) {
        return new NumberType();
      } else if (left instanceof StringType || right instanceof StringType) {
        return new StringType();
      } else {
        return new CompoundType(new NumberType(), new StringType());
      }
      break;

    case "-":
    case "*":
    case "/":
    case "%":
    case "|":
    case "^":
    case "&":
      return new NumberType();

    case "in":
    case "..":
    default:
      throw new Error("Binary expression operator {op} is not implemented."
                      .replace("{op}", aNode.operator));
      break;
  }
}

function inferUpdateExpression(aCtx, aNode) {
  var argument = inferExpression(aCtx, aNode.argument);
  return new NumberType();
}

function inferLogicalExpression(aCtx, aNode) {
  var left  = inferExpression(aCtx, aNode.left),
      right = inferExpression(aCtx, aNode.right);

  return TypeUtil.combine(left, right);
}

function inferConditionalExpression(aCtx, aNode) {
  var test       = inferExpression(aCtx, aNode.test)
      alternate  = inferExpression(aCtx, aNode.alternate),
      consequent = inferExpression(aCtx, aNode.consequent);

  return TypeUtil.combine(alternate, consequent);
}

function inferFunctionExpression(aCtx, aNode) {
  var name   = LiteralUtil.getIdentifier(aNode.id),
      params = aNode.params.map(LiteralUtil.getIdentifier),
      ctx    = Context.createForFunction(aCtx, params, name);

  var inferStatement = require("./Statement");
  inferStatement(ctx, aNode.body);
  return ctx;
}

function inferAssignmentExpression(aCtx, aNode) {
  var right = inferExpression(aCtx, aNode.right);

  if (aNode.left.type == "Identifier") {
    aCtx.rebind(LiteralUtil.getIdentifier(aNode.left), right);
  } else {
    var left = inferExpression(aCtx, aNode.left)
    TypeUtil.setMapping(left, right);
  }

  return right;
}

function inferCallExpression(aCtx, aNode) {
  var callee = inferExpression(aCtx, aNode.callee);
  // TODO: handle arguments, match against function signature.
  return TypeUtil.call(callee);
}

function inferNewExpression(aCtx, aNode) {
  throw "not implemented";
}

function inferThisExpression(aCtx, aNode) {
  return aCtx.getFunctionThisType();
}

function inferMemberExpression(aCtx, aNode) {
  if (aNode.computed) throw "not implemented";

  var object = inferExpression(aCtx, aNode.object);
  var property = LiteralUtil.getIdentifier(aNode.property);

  return TypeUtil.resolve(object, property);
}

function inferExpression(aCtx, aNode) {
  if (!aNode) return new UndefinedType();

  console.log(aNode);

  switch (aNode.type) {
    case "Literal":
      return LiteralUtil.getLiteralType(aNode);

    case "Identifier":
      return aCtx.get(LiteralUtil.getIdentifier(aNode));

    case "ArrayExpression":
      return inferArrayExpression(aCtx, aNode);

    case "ObjectExpression":
      return inferObjectExpression(aCtx, aNode);

    case "UnaryExpression":
      return inferUnaryExpression(aCtx, aNode);

    case "BinaryExpression":
      return inferBinaryExpression(aCtx, aNode);

    case "UpdateExpression":
      return inferUpdateExpression(aCtx, aNode);

    case "LogicalExpression":
      return inferLogicalExpression(aCtx, aNode);

    case "ConditionalExpression":
      return inferConditionalExpression(aCtx, aNode);

    case "FunctionExpression":
      return inferFunctionExpression(aCtx, aNode);

    case "AssignmentExpression":
      return inferAssignmentExpression(aCtx, aNode);

    case "CallExpression":
      return inferCallExpression(aCtx, aNode);

    case "NewExpression":
      return inferNewExpression(aCtx, aNode);

    case "ThisExpression":
      return inferThisExpression(aCtx, aNode);

    case "MemberExpression":
      return inferMemberExpression(aCtx, aNode);

    default:
      throw new Error("Expression type {type} is not implemented."
                      .replace("{type}", aNode.type));
      break;
  }
}

module.exports = inferExpression;
