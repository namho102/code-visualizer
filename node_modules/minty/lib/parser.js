'use strict';

const esprima = require('esprima');
const esquery = require('esquery');
const parseutils = {};
// const fs = require('fs');

parseutils.cache = {};
parseutils.tokens = [];

let ast;

/**
 * function to parse through ast and return desired information based off search parameter
 * @param {string} string - search term, i.e. '[attr="foo"]'
 * @param {object} AST - AST that will be searched. Did not call param 'ast' as
 *              that variable has been used already
 * @returns {array} - array of matching AST nodes, each of which is an Object
 **/
parseutils.query = function (string, AST) {
  const parseInformation = esquery.parse(string);
  return esquery.match(AST, parseInformation);
};

/**
* function parses ast and finds all function declarations, adding parameters
* @param {object} node - an AST node, representing a function, whose parameters we want to grab
* @returns {array} - function parameters
**/
parseutils.functionParameterParse = function (node) {
  return node.params.map(paramsObj => paramsObj.name);
};

/**
* function parses ast and finds all function declarations, adding names
* @param {object} node - an AST node, representing a function, whose name we want to grab
* @returns {string} - function name
**/
parseutils.functionNameParse = function (node) {
  return node.id.name;
};

/**
* function parses ast and finds all variable declarations, determining how they were declared (let, var, const)
* @param {object} node - an AST node, representing a varable, whose declaration we want to grab
* @returns {string} - variable declaration of let, var, or const
**/
parseutils.variableKindParse = function (node) {
  return node.kind;
};

/**
* function parses ast and finds all variable names
* @param {object} node - an AST node, representing a variable, whose name we want to grab
* @returns {string} - variable name
**/
parseutils.variableNameParse = function (node) {
  return node.declarations.map(dec => dec.id.name);
};
const types = [
  { type: 'BreakStatement', callbacks: null },
  { type: 'ReturnStatement', callbacks: null },
  { type: 'YieldExpression', callbacks: null },
  {
    type: 'FunctionDeclaration',
    callbacks: [[parseutils.functionParameterParse, 'parameters'],
      [parseutils.functionNameParse, 'name']],
  },
  {
    type: 'FunctionExpression',
    callbacks: [[parseutils.functionParameterParse, 'parameters']],
  },
  {
    type: 'ArrowFunctionExpression',
    callbacks: [[parseutils.functionParameterParse, 'parameters']],
  },
  { type: 'SwitchCase', callbacks: null },
  {
    type: 'VariableDeclaration',
    callbacks: [[parseutils.variableKindParse, 'kind'],
      [parseutils.variableNameParse, 'variables']],
  },
  { type: 'CallExpression', callbacks: null },
  { type: 'SwitchStatement', callbacks: null },
  { type: 'ForStatement', callbacks: null },
  { type: 'ForInStatement', callbacks: null },
  { type: 'ForOfStatement', callbacks: null },
  { type: 'WhileStatement', callbacks: null },
  { type: 'DoWhileStatement', callbacks: null },
  { type: 'IfStatement', callbacks: null },
];


/**
* function parses ast and finds all global variables not declared with let, var, or const
* @param {object} node - an AST node, representing a program, whose globals we want to grab
* @deprecated since 0.1.5, force 'use strict';
* @returns {string} - variable name
**/
// parseutils.assignmentExpParse = function (node) {
//   return node.left.name;
// };

/**
* Object contains all of the AST node types we parse. To add a new node type:
* @param {string} type - selector for the node type. See https://www.npmjs.com/package/esquery.
* @param {array} callbacks - an array of callbacks, containing the following:
* @param {array} - A single array containing a single callback, with
* @param (function} - the callback function to run, in the 0th index of the array
* @param {string} - the key in which you want to store the callback's return, in the 1st index of the array)
*/
/**
 * function parses ast and finds all searchString nodes, runs callbacks after
 * @param searchString - finds all nodes with this string via esquery
 * @param callbacks - array with nested arrays [[function, logName], ...], logs extra parameters
 **/
parseutils.parseFunction = function (searchString, callbacks) {
  if (!parseutils.cache[searchString]) {
    parseutils.cache[searchString] = [];
  }

  const output = parseutils.query(`[type=${searchString}]`, ast);

  // Tempting to use map and concat but seems like push is faster
  //  http://jsperf.com/multi-array-concat/7
  output.forEach(node => {
    parseutils.cache[searchString].push({
      startLine: node.loc.start.line,
      endLine: node.loc.end.line,
    });
    if (callbacks) {
      callbacks.forEach(cbArray => {
        const name = cbArray[1];
        const func = cbArray[0];
        const extraOutput = func(node);
        parseutils.cache[searchString][parseutils.cache[searchString].length - 1][name]
          = extraOutput;
      });
    }
  });
};

/**
* function loops through the types object and returns an array of callbacks to be run, when the AST is parsed
**/
parseutils.asyncTasks = types.map(function (el) {
  return parseutils.parseFunction.bind(this, el.type, (el.callbacks || null));
});

/**
* function parses a Javascript file and returns an object containing interesting nodes and their details,
* by looping through it with the {@link #parseutils.asyncTasks} array
* @param {string} text - the text of the file to analyze
* @returns {object} - cache object
**/
function parser(text) {
  parseutils.cache = {};

  ast = esprima.parse(text, {
    loc: true,
  });

  parseutils.asyncTasks.forEach(func => {
    func();
  });
  return parseutils.cache;
}

module.exports = {
  parser,
  parseutils,
  types,
};
