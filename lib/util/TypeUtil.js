"use strict";

var _             = require("lodash");
var AnnoTypes     = require("../AnnoTypes");
var TypeMapping   = AnnoTypes.TypeMapping;
var FreeType      = AnnoTypes.FreeType;
var CompoundType  = AnnoTypes.CompoundType;
var UndefinedType = AnnoTypes.UndefinedType;

function getTypeChildren(aType) {
  return aType instanceof CompoundType ? aType.children : [aType];
}

var TypeUtil = {
  combine: function (aA, aB) {
    var childrenA = getTypeChildren(aA),
        childrenB = getTypeChildren(aB),
        children  = childrenA.concat(childrenB);

    return new CompoundType(children);
  },

  equals: function (aA, aB) {
    return _.isEqual(aA, aB);
  },

  contains: function (aA, aB) {
    var childrenA = getTypeChildren(aA),
        childrenB = getTypeChildren(aB);

    return _.insersection(childrenA, childrenB).length > childrenB.length;
  },

  fitsConstraint: function () {

  },

  constrain: function () {

  },

  resolve: function (aType, aName) {
    switch (aType.type) {
      case "FreeType":
        return new FreeType();
      case "ObjectType":
        return TypeUtil.getMapping(aType, aName, true);
      case "UndefinedType":
      default:
        throw "Can't resolve member of this type.";
    }
  },

  call: function (aType, aName) {
    if (aType instanceof FreeType) {
      return new FreeType();
    } 
  },

  setMapping: function (aObjectType, aName, aValue) {
    var mapping = TypeUtil.getMapping(aObjectType, aName, true);
    mapping.child = aValue;
    return aValue;
  },

  getMapping: function (aObjectType, aName, kCreate) {
    var existing = _.find(aObjectType.child.children, function (aMapping) {
      return aName === aMapping.name;
    });

    if (existing !== undefined) return existing.child;
    if (kCreate) {
      var created = new TypeMapping(aName, undefined);
      aObjectType.child.children.push(created);
      return created.child;
    }
  },

  hasMapping: function (aObjectType, aName) {
    return TypeUtil.getMapping(aObjectType, aName) !== undefined;
  }
};

module.exports = TypeUtil;
