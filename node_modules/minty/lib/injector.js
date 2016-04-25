'use strict';

const decomment = require('decomment');
const injectionLog = {};
const flattenDeep = require('./tools').flattenDeep;
let scope;
let injectCheck;
let specialVariablesLog;
let specialVariables;
let variables;

/**
* Function finds the scope of an object describing the current line of code
* If it creates a new scope, then it adds an array of the current level to the {@link #specialVariables} object
* If it closes a scope, then it pops the last array off of the {@link #specialVariables} object

* going through all the lines of code and corresponding rules
* if there is rule called scope we push the scope name to the scope array to keep track of scopes
* some lines of code wont have rules because we only care about if something is being declared - so if something like
* var a = 0, b = 1, x = 5;
* a = b + x wont have rule because a is just being reassigned a new value. so it'll just getting monitoring code injected after it
* we loop over the rulesfound array which an array of object(s). the object looks like { action: 'START or END', rule: 'SCOPE', type: 'SwitchCase' }
* if there is a rule called scope and start action, we'll check if lineInfo has a property called scope - if it does we know its some sort of block statement
if there is a block scope we push an empty array into the special variables array
* @param {object} lineInfo - the rules we created for the line of code being analyzed
* @event #specialVariables .push() or .pop()
* @returns {undefined} - undefined - this builds an external value
**/

function findScope(lineInfo) {
  if (!lineInfo) return;
  lineInfo.rulesFound.forEach(rule => {
    // if there is scope, we are creating a new array for it in case there are variables declared inside the block statement
    if (rule.rule === 'SCOPE' && rule.action === 'START') {
      if (lineInfo.scope) {
        scope.push(lineInfo.scope);
      } else {
        scope.push('');
      }
      specialVariables.push([]);
    }
    // if the rule is scope, then we get rid of the last thing in the special variables array like a stack
    if (rule.rule === 'SCOPE' && rule.action === 'END') {
      scope.pop();
      specialVariables.pop();
    }
  });
}

/**
* Function looks at an object describing a line of Javascript
* and adds the variables found there to the scope within which that line executes
* some lines of code dont have rules because all we care about are things being declared. so assignment expressions dont need rules
* this function is being called right after findscope so if there are parameters in the current lineInfo those parameters
* gets added to the special variables array
* scope is an array that keeps track of what scope were in. it will always have mintyglobalscope as 0th index
* if there are global variables we'll be adding them to the variables array
* if there are global variables but scoped, they are added to the special variables array
* @param {object} lineInfo - the rules associated with the line of code being analyzed
* @event add variables to {@link #specialVariables}
* @event add variables to {@link #variables}
* @returns {undefined} - undefined - this builds an external value
**/
function addVars(lineInfo) {
  if (!lineInfo || !lineInfo.variables) return;
  const line = lineInfo.variables;
  const lastIdx = specialVariables.length - 1;
  if (line.parameters) {
    specialVariables[lastIdx] =
      specialVariables[lastIdx].concat(line.parameters);
  }
  if (line.variables) {
    let currentScope;
    scope.forEach(block => {
      if (block) currentScope = block;
    });
    if (line.variables.kind === 'var' && currentScope === '_mintyGlobalScope') {
      variables = variables.concat(line.variables.names);
    } else {
      specialVariables[lastIdx] =
        specialVariables[lastIdx].concat(line.variables.names);
    }
  }
}

/**
* Function looks at an object describing a line of Javascript
* and reviews if it has triggered rules that end a scope.
* If it has triggered those rules, then it updates the {@link #injectCheck} array
* to add a flag to inject watching code; remove a flag; or flag to not inject
* @param {object} lineInfo - the line of code being analyzed
* @event add true or false, or pop the last item from, {@link #specialVariables}
* @returns {undefined} - undefined - this builds an external value
**/
function checkClosingLine(lineInfo, lineText) {
  if (lineInfo) {
    lineInfo.rulesFound.forEach(rule => {
      if (rule.action === 'START' && rule.rule === 'VOID') injectCheck.push(false);
      else if (rule.action === 'START' && rule.rule === 'SCOPE') {
        injectCheck.push(true);
      } else if (rule.action === 'END' && (rule.rule === 'VOID' || rule.rule === 'SCOPE')) {
        injectCheck.pop();
      }
    });
    // checking if a line is closing brace
    return lineText.trim() === lineText.trim().replace(/[A-Za-z0-9]/g, '');
  }
  return undefined;
}

/**
* Function looks at a line, evaluates it against rules, and sees if it contains global variables
* inject check at last index has a value true or false
* specialVariables is the array of nested arrays keeping track of scoped variables - arrays have values of the variables names in them
* specialVariablesLog - adding the vaiebls
* @param {object} lineRules - rules created for each corresponding line of code user provides '25':
   { rulesFound: [ [Object] ],
     variables: { variables: [Object], parameters: [Object] },
     scope: 'ted' },
* @param {string} line - the line of code
* @param {number} index - the 0-based line number, index of the array when findGlobalVars is called
* @event trigger {@link #findScope} on the lineRules
* @event trigger {@link #addVars} on the lineRules
* @event add the special (local to this block) variables to the {@link #specialVariablesLog}
* @returns {undefined} - undefined - this builds an external value
**/
function findGlobalVars(lineRules, line, index) {
  if (injectCheck[injectCheck.length - 1]) {
    findScope(lineRules);
    addVars(lineRules);
    if (specialVariables[0].length >= 1 || specialVariables.length > 1) {
      // slice makes shallow copy of specialVariables array - specialVariables is constantly changing - if we dont use shallow copy, in the end
      specialVariablesLog[index] = specialVariables.slice(0);
    }
  }
}
/**
* Function injects monitoring code into appropriate lines of the source JS
* @param {array} log - Running log of original code + injected code.
* @param {string} line - the original line of code
* @param {number} index - the 0-based line number
* @param {boolean} check - a flag to prevent or allow injection - true false
* @param {object} lineRules - an object of rules, variables names, scope that define where the monitoring code should be injected - values for rulesfound property: [SWAP, START, VOID, SCOPE],
* @param {number} closingLine - the 1-based line number on which the statement closes
* @event trigger adds line to the {@link #log} variable which will be turned back into a file and executed
* @returns {true, false or undefined} - undefined - this builds an external value
**/
function injector(log, line, index, check, lineRules, closingLine) {
  let returnStatement = false;
  let preVoidStatement = false;
  let lineSpecial;
  let globalVariables;
  let mintyLine;
  let lineCheck = check;
  let callExpressionAndCallback;

  if (specialVariablesLog[index] && specialVariablesLog[index].length) {
    lineSpecial = specialVariablesLog[index];
  } else {
    lineSpecial = undefined;
  }
  if (variables.length) {
    globalVariables = variables;
  } else {
    globalVariables = undefined;
  }

  mintyLine = `mintyLog(${index}, '${JSON.stringify(scope)}',`
    + `${JSON.stringify(lineSpecial)}, ${JSON.stringify(variables)}`;

  if (lineSpecial) {
    const flatSpecial = flattenDeep(lineSpecial);
    if (flatSpecial.length) mintyLine += `,${flattenDeep(lineSpecial)}`;
  }

  if (globalVariables) {
    mintyLine += `, ${variables}`;
  }


  mintyLine += ');';
  if (lineRules) {
    lineRules.rulesFound.forEach(rule => {
      if (rule.rule === 'SWAP' && rule.action === 'START') {
        returnStatement = true;
      }
      if (rule.rule === 'VOID' && rule.action === 'START') {
        preVoidStatement = true;
        lineCheck = true;
      }
      if (rule.rule === 'SCOPE' && rule.action === 'START') {
        callExpressionAndCallback = true;
      }
    });
  }
  if ((!lineCheck || closingLine || line === '') && !returnStatement) {
    log.push(`${line}`);
  } else if (preVoidStatement && callExpressionAndCallback) {
    log.push(`${line}`, mintyLine);
  } else if (returnStatement) {
    log.push(mintyLine, `${line}`, mintyLine);
  } else if (preVoidStatement) {
    log.push(mintyLine, `${line}`);
  } else {
    log.push(`${line}`, mintyLine);
  }
}

/**
* Function parses the given text with the given rules
* special variables start out with a nested empty array
* parsing code for all the global variables in the first foreach call
* @param {line activity object we built up in createLineRules.js} rules - The rules the code should be parsed with
* @param {string} text - the original code
* @returns {array} - an array of all of the lines of code, with the necessary
*                    injection code as well, for later execution
**/
function injectionEngine(rules, text) {
  injectionLog.log = [];
  injectionLog.globalVars = [];
  scope = ['_mintyGlobalScope'];
  injectCheck = [true];
  specialVariablesLog = {};
  specialVariables = [[]];
  variables = [];
  // EOL = End of Line - the correct line carriage: \n for Unix and \r\n for Windows
  const EOL = decomment.getEOL(text);
  // textArray is the user's code but formatted as an array - each line is an index of the array
  const textArray = decomment(text, {
    space: true,
  })
    .split(EOL);

  textArray.forEach((line, i) => {
    if (line !== '') {
      // passing in each line of code and its corresponding rule, and the index
      // some rules will be undefined bc some lines are empty
      findGlobalVars(rules[i], line, i);
    }
  });
  textArray.forEach((line, i) => {
    // closingLine will have value true false or undefined
    const closingLine = checkClosingLine(rules[i], line);
    findScope(rules[i]);
    addVars(rules[i]);
    injector(injectionLog.log, line, i, injectCheck[injectCheck.length - 1], rules[i], closingLine);
  });
  injectionLog.globalVars = variables;
  return injectionLog;
}


module.exports = injectionEngine;
