const esprima = require('esprima');
const esquery = require('esquery');
const fs = require('fs');

const largeast = require('./largeAST.js')[0];
const parser = require('../../lib/parser.js');

var foundItems = parser.parseutils.query('[type="HooptyMama"]', largeast);
console.log(JSON.stringify(foundItems));


/* need
ForInStatement
ForOfStatement
BreakStatement
DoWhileStatement
YieldExpression
IfStatement
SwitchStatement
*/
