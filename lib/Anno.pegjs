{
  var TypeUtil            = require("./util/TypeUtil");
  var AnnoTypes           = require("./AnnoTypes");
  var TypeAnnotation      = AnnoTypes.TypeAnnotation;
  var AliasAnnotation     = AnnoTypes.AliasAnnotation;
  var TypeList            = AnnoTypes.TypeList;
  var TypeMappingList     = AnnoTypes.TypeMappingList;
  var TypeMapping         = AnnoTypes.TypeMapping;
  var ConstructorType     = AnnoTypes.ConstructorType;
  var FunctionType        = AnnoTypes.FunctionType;
  var CompoundType        = AnnoTypes.CompoundType;
  var ArrayType           = AnnoTypes.ArrayType;
  var ObjectType          = AnnoTypes.ObjectType;
  var BooleanType         = AnnoTypes.BooleanType;
  var NumberType          = AnnoTypes.NumberType;
  var StringType          = AnnoTypes.StringType;
  var FreeType            = AnnoTypes.FreeType;
  var UndefinedType       = AnnoTypes.UndefinedType;
  var InstanceType        = AnnoTypes.InstanceType;
}

start
  = "type" sep+ ex:callablety 
    { return new TypeAnnotation(ex); } 
  / "alias" sep+ name:name sep+ ex:ty
    { return new AliasAnnotation(name, ex); }

ty
  = callablety / compty / primary

callablety
  = constty / functy

constty
  = "(" sep* args:tylist sep* ")" sep* "=>" sep* ret:ty
    { return new ConstructorType(args, ret); }

functy
  = "(" sep* args:tylist sep* ")" sep* "->" sep* ret:ty?
    { return new FunctionType(args, ret || new UndefinedType()); }

compty
  = first:primary sep* "|" sep* second:ty
    { return TypeUtil.combine(first, second); }

primary
  = arrty
  / objty
  / name:name               
    { 
      switch (name) {
        case "Boolean":
          return new BooleanType();
        case "Number":
          return new NumberType();
        case "String":
          return new StringType();
        case "Undefined":
          return new UndefinedType();
        case "*":
          return new FreeType();
        default:
          return new InstanceType(name);
      }
    }

arrty
 = "[" sep* items:tylist sep* "]" { return new ArrayType(items); }
 / "[*]"                          { return new ArrayType(); }

objty
 = "{" sep* mappings:tymap sep* "}" { return new ObjectType(mappings); }
 / "{*}"                            { return new ObjectType(); }

tylist
  = items:tylistitems
    { 
      var last = items[items.length - 1];
      if (Array.isArray(last)) {
        return new TypeList(items.slice(0, items.length - 1), last[0]); 
      } else {
        return new TypeList(items);
      } 
    }

tylistitems
  = first:ty sep* "," sep* rest:tylistitems { return [first].concat(rest); } 
  / "..." arg:ty                            { return [[arg]]; }
  / arg:ty                                  { return [arg]; }
  /                                         { return []; }

tymaplist
  = first:tymap sep* ":" sep* rest:tymaplist { return [first].concat(rest); }
  / map:tymap                                { return [map]; }
  /                                          { return []; }

tymap 
  = key:name sep* ":" sep* value:ty { return new TypeMapping(key, value); }

name
  = value:[A-Za-z0-9]+ { return value.join(""); }

sep
  = [ \r\t\n]
