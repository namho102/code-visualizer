/* eslint space-before-blocks: 0, no-multi-spaces: 0 */

const anonFuncHandler = require('./../../lib/tools.js').anonFuncCheck;
const test = require('tape');

test('type of Anonymous Function Handler', t => {
  t.plan(1);
  t.equal(typeof anonFuncHandler, 'function');
});

test('output when passed anonymous function', t => {
  t.plan(2);
  const anonFunc = function(){};
  const anonFunc2 = function     () {};
  const output = anonFuncHandler(anonFunc.toString());
  const output2 = anonFuncHandler(anonFunc2.toString());
  t.equal(output, 'function anonymousFunc(){}');
  t.equal(output2, 'function anonymousFunc() {}');
});

test('output when passed named function', t => {
  t.plan(2);
  const namedFunc = function fn(){};
  const namedFunc2 = function     fn2()  {};
  const output = anonFuncHandler(namedFunc.toString());
  const output2 = anonFuncHandler(namedFunc2.toString());
  t.equal(output, 'function fn(){}');
  t.equal(output2, 'function fn2()  {}');
});
