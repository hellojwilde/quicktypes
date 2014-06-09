"use strict";

var _               = require("lodash");
var StringUtil      = require("./util/StringUtil");
var TypeUtil        = require("./util/TypeUtil");
var AnnoTypes       = require("./AnnoTypes");
var TypeAnnotation  = AnnoTypes.TypeAnnotation;
var TypeMappingList = AnnoTypes.TypeMappingList;
var TypeList        = AnnoTypes.TypeList;
var ConstructorType = AnnoTypes.ConstructorType;
var FunctionType    = AnnoTypes.FunctionType;
var ObjectType      = AnnoTypes.ObjectType;
var FreeType        = AnnoTypes.FreeType;

var Types = {
  PROGRAM:  "program",
  FUNCTION: "function",
  BLOCK:    "block"
};

var SpecialBindings = {
  ANNO:   ":anno",
  THIS:   ":this",
  RETURN: ":return"
};

function callOptMethod(aObj, aProp) {
  var args = Array.prototype.slice.call(arguments, 2);
  return aObj !== undefined ? aObj[aProp].apply(aObj, args) : undefined;
}

function defaultValue(aValue, aDefault) {
  return aValue !== undefined ? aValue : aDefault;
}

function Context(aType, aParent) {
  "type (String, Context | undefined) => Context";
  this.type     = aType;
  this.parent   = aParent;
  this.bindings = {};
}

Context.prototype = {
  hasLocal: function (aName) {
    "type (String) -> *";
    return this.bindings.hasOwnProperty(aName);
  },

  getLocal: function (aName) {
    "type (String) -> *";
    return this.bindings[aName];
  },

  bindLocal: function (aName, aVal) {
    "type (String, *) -> *";
    if (!aName) {
      console.trace();
      throw "asdf";
    }
    return this.bindings[aName] = aVal;
  },

  getRoot: function () {
    "type () -> Context";
    var ctx = this;
    while (ctx.parent instanceof Context) ctx = ctx.parent;
    return ctx;
  },

  isAncestor: function (aCtx) {
    "type (Context) -> Boolean";
    var ctx = this.parent;
    while (ctx instanceof Context) {
      if (ctx == aCtx) return true;
      ctx = ctx.parent;
    }
    return false;
  },

  getContextForCriteria: function (aCriteriaFn) {
    "type ((Context) -> Boolean) -> Context | undefined";
    var ctx = this;
    while (ctx instanceof Context) {
      if (aCriteriaFn(ctx)) break;
      ctx = ctx.parent;
    }
    return ctx;
  },

  getContextForBindingName: function (aName) {
    "type (String) -> Context | undefined";
    return this.getContextForCriteria(function (aCtx) {
      return aCtx.hasLocal(aName);
    });
  },

  getContextForFunction: function () {
    "type (String) -> Context | undefined";
    return this.getContextForCriteria(function (aCtx) { 
      return aCtx.type == Types.FUNCTION; 
    });
  },

  get: function (aName) {
    "type (String) -> *";
    var ctx = this.getContextForBindingName(aName);
    return callOptMethod(ctx, "getLocal", aName);
  },

  bindVar: function (aName, aVal) {
    "type (String, *) -> *";
    var varCtx = this.getContextForCriteria(function (aCtx) {
      return aCtx.type == Types.PROGRAM || aCtx.type == Types.FUNCTION;
    });
    return callOptMethod(varCtx, "bindLocal", aName, aVal);
  },

  bindLet: function (aName, aVal) {
    "type (String, *) -> *";
    return this.bindLocal(aName, aVal);
  },

  rebind: function (aName, aVal) {
    "type (String, *) -> *";
    var ctx = this.getContextForBindingName(aName);
    return callOptMethod(ctx, "bindLocal", aName, aVal);
  },

  hasFunctionAnnotation: function () {
    "type () -> Boolean";
    var ctx = this.getContextForFunction();
    return callOptMethod(ctx, "hasLocal", SpecialBindings.ANNO);
  },

  getFunctionAnnotation: function () {
    "type () -> *";
    var ctx = this.getContextForFunction();
    return callOptMethod(ctx, "getLocal", SpecialBindings.ANNO);
  },

  bindFunctionAnnotation: function (aAnno) {
    "type (*) -> *";
    var ctx     = this.getContextForFunction(),
        args    = aAnno.arguments;

    ctx.formals.forEach(function (aFormalName, aIdx) {
      ctx.bindLocal(aFormalName, args.children[aIdx]);
    });
    ctx.bindLocal(SpecialBindings.RETURN, aAnno.ret);

    ctx.isConstructor = aAnno instanceof ConstructorType;
    if (ctx.isConstructor) {
      var proto = new ObjectType(new TypeMappingList([]));
      ctx.bindLocal("prototype", proto);
      ctx.bindLocal(SpecialBindings.THIS, proto);
    }

    return callOptMethod(ctx, "bindLocal", SpecialBindings.ANNO, aAnno);
  },

  getFunctionFormalArguments: function () {
    "type () -> Array";
    return this.getContextForFunction().formals;
  },

  hasFunctionFormalType: function (aFormalName) {
    "type (String) -> Boolean";
    var ctx = this.getContextForFunction();
    return callOptMethod(ctx, "hasLocal", aFormalName);
  },

  getFunctionFormalType: function (aFormalName) {
    "type (String) -> *";
    var ctx        = this.getContextForFunction(),
        formalType = callOptMethod(ctx, "getLocal", aFormalName);

    return defaultValue(formalType, new FreeType());
  },

  bindInferredFunctionFormalType: function (aFormalName, aType) {
    "type (String, *) -> *";
    var ctx           = this.getContextForFunction(),
        hasFormalType = this.hasFunctionFormalType(aFormalName),
        hasAnnotation = this.hasFunctionAnnotation();

    if (hasAnnotation && hasFormalType) {
      throw new Error("Cannot bind inferred formal in annotated function.");
    } else if (hasFormalType) {
      var newType = TypeUtil.combine(this.getLocal(aFormalName), aType);
      return this.bindLocal(aFormalName, newType);
    } else {
      return this.bindLocal(aFormalName, aType);
    }
  },

  hasFunctionReturnType: function () {
    return this.hasFunctionFormalType(SpecialBindings.RETURN);
  },

  getFunctionReturnType: function () {
    return this.getFunctionFormalType(SpecialBindings.RETURN);
  },

  bindInferredFunctionReturnType: function (aType) {
    return this.bindInferredFunctionFormalType(SpecialBindings.RETURN, aType);
  },

  getFunctionThisType: function () {
    return this.getFunctionFormalType(SpecialBindings.THIS);
  },

  isFunctionConstuctor: function () {
    "type () -> Boolean";
    var ctx = this.getContextForFunction(),
        isConstr = callOptMethod(ctx, "getLocal", SpecialBindings.ISCONSTR);

    return defaultValue(isConstr, false);
  },

  getFunctionSignature: function () {
    "type () -> FunctionType | ConstructorType";
    if (this.hasFunctionAnnotation()) {
      return this.getFunctionAnnotation();
    } else {
      var argNames = this.getFunctionFormalArguments(),
          args     = argNames.map(this.getFunctionFormalType.bind(this)),
          argType  = new TypeList(args),
          ret      = this.getFunctionReturnType();

      if (this.isFunctionConstuctor()) {
        return new ConstructorType(argType, ret);
      } else {
        return new FunctionType(argType, ret);
      }
    }
  },

  toString: function (kDebug) {
    if (!kDebug && this.type == Types.FUNCTION) {
      return this.getFunctionSignature().toString();
    }

    var bindings = [];
    for (var name in this.bindings) {
      var value       = this.bindings[name],
          valueString = (value === this) ? "[circular]" : value.toString(kDebug);

      if (StringUtil.isMultiline(valueString)) {
        bindings.push(name + ": \n" + StringUtil.indent(valueString));
      } else {
        bindings.push(name + ": " + valueString);
      }
    }
    bindings.sort();

    if (this.type == Types.FUNCTION) {
      return "function () {\n" + StringUtil.indent(bindings.join("\n")) + "\n}";
    } else {
      return bindings.join("\n");
    }
  }
};

Context.Types = Types;

Context.createForProgram = function (aFileName) {
  var ctx = new Context(Types.PROGRAM);
  ctx.sourceFileName = aFileName;
  return ctx;
};

Context.createForFunction = function (aParent, aArgs, aId) {
  var ctx = new Context(Types.FUNCTION, aParent);

  if (aId) ctx.bindLocal(aId, ctx);

  ctx.formals = aArgs;
  ctx.isConstructor = false;
  ctx.bindLocal(SpecialBindings.THIS, new FreeType());
  aArgs.forEach(function (aArgName) { 
    ctx.bindLocal(aArgName, new FreeType());
  });

  return ctx;
};

Context.createForBlock = function (aParent) {
  return new Context(Types.BLOCK, aParent);
};

module.exports = Context;
