"use strict";

var _               = require("lodash");
var LiteralUtil     = require("./util/LiteralUtil");
var StringUtil      = require("./util/StringUtil");
var Anno            = require("./Anno");
var AnnoTypes       = require("./AnnoTypes");
var TypeAnnotation  = AnnoTypes.TypeAnnotation;
var Context         = require("./Context");
var inferExpression = require("./Expression");

function isAnnotationStatement(aNode) {
  return aNode.type == "ExpressionStatement" &&
         aNode.expression.type == "Literal";
}

function getStatementAnnotation(aCtx, aNode) {
  var val = LiteralUtil.getLiteralValue(aNode.expression);
  if (val == "use strict") return;

  try {
    return Anno.parse(val);
  } catch (e) {
    StringUtil.dumpAnnoError(aCtx.getRoot(), aNode, e);
  }
}

function inferBlockStatement(aCtx, aNode) {
  var ctx = Context.createForBlock(aCtx);
  aNode.body.forEach(_.partial(inferStatement, ctx));
}

function inferVariableDeclaration(aCtx, aNode) {
  var bindingMethod = aNode.kind == "let" ? "bindLet" : "bindVar";

  aNode.declarations.forEach(function (aDeclarator) {
    var name = LiteralUtil.getIdentifier(aDeclarator.id),
        type = inferExpression(aCtx, aDeclarator.init);

    aCtx[bindingMethod](name, type);
  });
}

function inferIfStatement(aCtx, aNode) {
  var test       = inferExpression(aCtx, aNode.test),
      consequent = inferStatement(aCtx, aNode.consequent),
      alternate  = inferStatement(aCtx, aNode.alternate);
}

function inferFunctionDeclaration(aCtx, aNode) {
  var name   = LiteralUtil.getIdentifier(aNode.id),
      params = aNode.params.map(LiteralUtil.getIdentifier),
      ctx    = Context.createForFunction(aCtx, params, name);

  aCtx.bindVar(name, ctx);
  inferStatement(ctx, aNode.body);
  return ctx;
}

function inferReturnStatement(aCtx, aNode) {
  var argument = inferExpression(aCtx, aNode.argument);

  //
  // TODO: check to see whether this fits the constraint of the current function signature.
  //       if we're inferring types, then we need to 
  //       
}

function inferStatement(aCtx, aNode) {
  if (!aNode) return;

  console.log(aNode);

  if (isAnnotationStatement(aNode)) {
    var anno = getStatementAnnotation(aCtx, aNode);
    if (anno instanceof TypeAnnotation) {
      aCtx.bindFunctionAnnotation(anno.child);
    }
    return;
  }

  switch (aNode.type) {
    case "EmptyStatement":
      break;

    case "BlockStatement":
      inferBlockStatement(aCtx, aNode);
      break;

    case "VariableDeclaration":
      inferVariableDeclaration(aCtx, aNode);
      break;

    case "ExpressionStatement":
      inferExpression(aCtx, aNode.expression);
      break;

    case "IfStatement":
      inferIfStatement(aCtx, aNode);
      break;

    case "FunctionDeclaration":
      inferFunctionDeclaration(aCtx, aNode);
      break;

    case "ReturnStatement":
      inferReturnStatement(aCtx, aNode);
      break;

    case "LabeledStatement":
    case "BreakStatement":
    case "ContinueStatement":
    case "WithStatement":
    case "SwitchStatement":
    case "ThrowStatement":
    case "TryStatement":
    case "WhileStatement":
    case "DoWhileStatement":
    case "ForStatement":
    case "ForInStatement":
    default:
      throw new Error("Statement type {type} is not implemented."
                      .replace("{type}", aNode.type));
      break;
  }
}

module.exports = inferStatement;
