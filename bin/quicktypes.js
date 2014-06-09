#!/usr/bin/env node

"use strict";

var cli          = require("commander");
var fs           = require("fs");
var esprima      = require("esprima");
var inferProgram = require("../lib/Program");
var StringUtil   = require("../lib/util/StringUtil");

cli.version("0.0.1");

cli
  .command("lint")
  .description("checks given javascript module for clear type mismatches")
  .action(function (aFileName) {
    var ast = esprima.parse(fs.readFileSync(aFileName), { loc: true });
    var ctx = inferProgram(aFileName, ast);

    console.log("\n" + aFileName + ":");
    console.log(StringUtil.indent(ctx.toString(true)));
  });

cli.parse(process.argv);
