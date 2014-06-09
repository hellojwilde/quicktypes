"use strict";

"alias PrimaryType ArrayType | ObjectType | BooleanType | NumberType | \
                   StringType | UndefinedType | FreeType | InstanceType";
"alias Type        ConstructorType | FunctionType | CompoundType | PrimaryType";

function TypeAnnotation(aTyEx) {
  "type (Type) => TypeAnnotation";
  this.type  = "TypeAnnotation";
  this.child = aTyEx;
}

TypeAnnotation.prototype.toString = function () {
  return "type " + this.child.toString();
};

function AliasAnnotation(aTyName, aTyEx) {
  "type (String, Type) => AliasAnnotation";
  this.type  = "AliasAnnotation";
  this.name  = aTyName;
  this.child = aTyEx;
}

AliasAnnotation.prototype.toString = function () {
  return "alias " + this.name + " " + this.child.toString();
};

function TypeList(aTyExArray, aRestTyEx) {
  "type (Array, Type | Undefined) => TypeList";
  this.type     = "TypeList";
  this.children = aTyExArray;
  this.rest     = aRestTyEx;
}

TypeList.prototype.toString = function () {
  var list = this.children.join(", ");
  if (this.rest) {
    list += "..." + this.restChildren.toString();
  }
  return list;
};

function TypeMappingList(aTyMappingArray) {
  "type (Array) => TypeMappingList";
  this.type     = "TypeMappingList";
  this.children = aTyMappingArray;
}

TypeMappingList.prototype.toString = function () {
  return this.children.join(",\n");
};

function TypeMapping(aName, aTyEx) {
  "type (String, Type) => TypeMapping";
  this.type  = "TypeMapping";
  this.name  = aName;
  this.child = aTyEx;
}

TypeMapping.prototype.toString = function () {
  return this.name.toString() + ": " + this.child.toString();
};

function ConstructorType(aArgsTypeList, aRetTyEx) {
  "type (TypeList, Type) => ConstructorType";
  this.type      = "ConstructorType";
  this.arguments = aArgsTypeList;
  this.ret       = aRetTyEx;
}

ConstructorType.prototype.toString = function () {
  return "(" + this.arguments.toString() + ") => " + this.ret.toString();
};

function FunctionType(aArgsTypeList, aRetTyEx) {
  "type (TypeList, Type) => FunctionType";
  this.type      = "FunctionType";
  this.arguments = aArgsTypeList;
  this.ret       = aRetTyEx;
}

FunctionType.prototype.toString = function () {
  return "(" + this.arguments.toString() + ") -> " + this.ret.toString();
};

function CompoundType(aTyExArray) {
  "type (Array) => CompoundType";
  this.type     = "CompoundType";
  this.children = aTyExArray;
}

CompoundType.prototype.toString = function () {
  return this.children.join(" | ");
};

function ArrayType(aTyList) {
  "type (TypeList | Undefined) => ArrayType";
  this.type  = "ArrayType";
  this.child = aTyList;
}

ArrayType.prototype.toString = function () {
  return "[" + this.child.toString() + "]";
};

function ObjectType(aTyMappingList) {
  "type (TypeMappingList | Undefined) => ObjectType";
  this.type  = "ObjectType";
  this.child = aTyMappingList;
}

ObjectType.prototype.toString = function () {
  var StringUtil = require("./util/StringUtil");
  return "{\n" + StringUtil.indent(this.child.toString()) + "\n}";
};

function BooleanType()   { this.type = "BooleanType"; }
function NumberType()    { this.type = "NumberType"; }
function StringType()    { this.type = "StringType"; }
function UndefinedType() { this.type = "UndefinedType"; }
function FreeType()      { this.type = "FreeType"; }

BooleanType.prototype.toString    = function () { return "Boolean"; };
NumberType.prototype.toString     = function () { return "Number"; };
StringType.prototype.toString     = function () { return "String"; };
UndefinedType.prototype.toString  = function () { return "UndefinedType"; };
FreeType.prototype.toString       = function () { return "*"; };

function InstanceType(aTyName) {
  "type (String) => InstanceType";
  this.type = "InstanceType";
  this.name = aTyName;
}

InstanceType.prototype.toString = function () {
  return this.name;
};

var AnnoTypes = {
  TypeAnnotation: TypeAnnotation,
  AliasAnnotation: AliasAnnotation,
  TypeList: TypeList,
  TypeMappingList: TypeMappingList,
  TypeMapping: TypeMapping,
  ConstructorType: ConstructorType,
  FunctionType: FunctionType,
  CompoundType: CompoundType,
  ArrayType: ArrayType,
  ObjectType: ObjectType,
  BooleanType: BooleanType,
  NumberType: NumberType,
  StringType: StringType,
  UndefinedType: UndefinedType,
  FreeType: FreeType,
  InstanceType: InstanceType
};

module.exports = AnnoTypes;
