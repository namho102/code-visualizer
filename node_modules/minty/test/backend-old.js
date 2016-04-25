const utils = require('../lib/utils.js');
const expect = require('expect');

describe('Backend', () => {
  describe('#read', () => {
    xit('read should exist', () => {
      expect(utils.read).toBeA(Function);
    });
  });
  describe('#multiLineVarsCheck', () => {
    xit('multiLineVarsCheck should exist', () => {
      expect(utils.multiLineVarsCheck).toBeA(Function);
    });
    xit('multiLineVarsCheck should convert multiliine variables into single line variables', () => {
      expect(utils.multiLineVarsCheck([
          'var one = {',
          '  a: 1,',
          '  b: 2',
          '};',
          '',
          'var two = [',
          '  "a",', '  "b"',
          ']',
          '',
        ]))
        .toEqual([
          'var one = {  a: 1,  b: 2};',
          '\n',
          '\n',
          '\n',
          '\n',
          'var two = [  "a",  "b"]',
          '\n',
          '\n',
          '\n',
          '\n',
        ]);
    });
  });
  describe('#functionLineSwap', () => {
    xit('functionLineSwap should exist', () => {
      expect(utils.functionLineSwap).toBeA(Function);
    });
    xit('functionLineSwap should place check code injection before function call when function is called after declaration', () => {
      expect(utils.functionLineSwap(['function hello(a, b, c) {\n',
          'minty.variableLog(0, file, log, ["a","b","c"], a, b, c);\n',
          '  console.log(a + b + c);\n',
          'minty.variableLog(1, file, log, ["a","b","c"], a, b, c);\n',
          '}\n',
          '\n',
          'hello(1, 2, 3);\n',
          "minty.variableLog(4, file, log, [], '_mintyUndefined')",
          '\n',
        ]))
        .toEqual(
          [
            'function hello(a, b, c) {\n',
            'minty.variableLog(0, file, log, ["a","b","c"], a, b, c);\n',
            '  console.log(a + b + c);\n',
            'minty.variableLog(1, file, log, ["a","b","c"], a, b, c);\n',
            '}\n',
            '\n',
            "minty.variableLog(4, file, log, [], '_mintyUndefined')",
            'hello(1, 2, 3);\n',
            '\n',
          ]
        );
    });
    xit('functionLineSwap should place check code injection before function call when function is called before declaration', () => {
      expect(utils.functionLineSwap([
          'hello(1, 2, 3);\n',
          'minty.variableLog(4, file, log, [], \'_mintyUndefined\')',
          '\n',
          'function hello(a, b, c) {\n',
          'minty.variableLog(0, file, log, ["a","b","c"], a, b, c);\n',
          '  console.log(a + b + c);\n',
          'minty.variableLog(1, file, log, ["a","b","c"], a, b, c);\n',
          '}\n',
          '\n',
        ]))
        .toEqual([
          'minty.variableLog(4, file, log, [], \'_mintyUndefined\')',
          'hello(1, 2, 3);\n',
          '\n',
          'function hello(a, b, c) {\n',
          'minty.variableLog(0, file, log, ["a","b","c"], a, b, c);\n',
          '  console.log(a + b + c);\n',
          'minty.variableLog(1, file, log, ["a","b","c"], a, b, c);\n',
          '}\n',
          '\n',
        ]);
    });
  });
  describe('#createLine', () => {
    xit('createLine should exist', () => {
      expect(utils.createLine).toBeA(Function);
    });
    xit('should return blank line when no text exists on line', () => {
      const runCreateLine = [];
      utils.createLine('minty.js', runCreateLine, [], '', 2);
      expect(runCreateLine)
        .toEqual(['\n', '\n']);
    });
    xit('should return a minty.variable function with "minty undefined" when there are no variables or parameters are declared', () => {
      const runCreateLine = [];
      utils.createLine('minty.js', runCreateLine, [], 'console.log("minty is awesome")', 2);
      expect(runCreateLine)
        .toEqual([
          'console.log("minty is awesome")\n',
          'minty.variableLog(2, file, log, [], \'_mintyUndefined\');\n',
        ]);
    });
    xit('should return a minty.variable function after each line with active variables and parameters', () => {
      const runCreateLine = [];
      utils.createLine('minty.js', runCreateLine, ['a', 'b', 'c'], 'console.log("minty is awesome")', 2);
      expect(runCreateLine)
        .toEqual([
          'console.log("minty is awesome")\n',
          'minty.variableLog(2, file, log, ["a","b","c"], a, b, c);\n',
        ]);
    });
  });
  describe('#variableLog', () => {
    xit('should add a log of the line with correct variable names and values', () => {
      const log = [];
      utils.variableLog(123, 'minty.js', log, ['a', 'b'], 2, 'hello');
      expect(log).toEqual([{
        file: 'minty.js',
        line: 123,
        variables: {
          a: 2,
          b: 'hello',
        },
      }]);
    });
    xit('should add a log of  the line when there is a previously established log', () => {
      const log = [{
        file: 'minty.js',
        line: 123,
        variables: {
          a: 2,
          b: 'hello',
        },
      }];
      utils.variableLog(124, 'minty.js', log, ['a', 'b'], 3, 'hello');
      expect(log).toEqual([{
        file: 'minty.js',
        line: 123,
        variables: {
          a: 2,
          b: 'hello',
        },
      }, {
        file: 'minty.js',
        line: 124,
        variables: {
          a: 3,
          b: 'hello',
        },
      }]);
    });
    xit('should handle when no variables/parameters have been declared', () => {
      const log = [];
      utils.variableLog(2, 'minty.js', log, [], '_mintyUndefined');
      expect(log).toEqual([{
        file: 'minty.js',
        line: 2,
        variables: {}
      }]);
    });
  });
  describe('#errorLineFind', () => {
    xit('should exist', () => {
      expect(utils.errorLineFind).toBeA(Function);
    });
    xit('find appropriate error line from a given set of data', () => {

    });
  });
  describe('#returnLineSwap', () => {
    xit('should exist', () => {
      expect(utils.returnLineSwap).toBeA(Function);
    });
    xit('should add "return" to end of variable array, as well as the appropriate value at the end of the check function', () => {
      const returnArray = [
        '  return minty+awesome;\n',
        'minty.variableLog(4, file, log, ["a","b","c","d"], a, b, c, d);\n',
      ];
      utils.returnLineSwap(returnArray);
      expect(returnArray).toEqual([
        'minty.variableLog(4, file, log, ["a","b","c","d","return"], a, b, c, d, minty+awesome);\n',
        '  return minty+awesome;\n',
      ]);
    });
    xit('should swap check code to execute before function returns value', () => {
      const returnArray = [
          'function hello(a,b,c) {\n',
          'minty.variableLog(0, file, log, ["a","b","c"], a, b, c);\n',
          '  console.log(a);\n',
          'minty.variableLog(1, file, log, ["a","b","c"], a, b, c);\n',
          '  var d = b + c;\n',
          'minty.variableLog(2, file, log, ["a","b","c","d"], a, b, c, d);\n',
          '  console.log(d);\n',
          'minty.variableLog(3, file, log, ["a","b","c","d"], a, b, c, d);\n',
          '  return a;\n',
          'minty.variableLog(4, file, log, ["a","b","c","d"], a, b, c, d);\n',
          '}\n'
        ];
        utils.returnLineSwap(returnArray);
        expect(returnArray).toEqual([
          'function hello(a,b,c) {\n',
          'minty.variableLog(0, file, log, ["a","b","c"], a, b, c);\n',
          '  console.log(a);\n',
          'minty.variableLog(1, file, log, ["a","b","c"], a, b, c);\n',
          '  var d = b + c;\n',
          'minty.variableLog(2, file, log, ["a","b","c","d"], a, b, c, d);\n',
          '  console.log(d);\n',
          'minty.variableLog(3, file, log, ["a","b","c","d"], a, b, c, d);\n',
          'minty.variableLog(4, file, log, ["a","b","c","d","return"], a, b, c, d, a);\n',
          '  return a;\n',
          '}\n'
        ]);
    });
    xit('should show undefined when function has blank return', () => {
      const returnArray = [
          'function hello(a,b,c) {\n',
          'minty.variableLog(0, file, log, ["a","b","c"], a, b, c);\n',
          '  console.log(a);\n',
          'minty.variableLog(1, file, log, ["a","b","c"], a, b, c);\n',
          '  var d = b + c;\n',
          'minty.variableLog(2, file, log, ["a","b","c","d"], a, b, c, d);\n',
          '  console.log(d);\n',
          'minty.variableLog(3, file, log, ["a","b","c","d"], a, b, c, d);\n',
          '  return;\n',
          'minty.variableLog(4, file, log, ["a","b","c","d"], a, b, c, d);\n',
          '}\n'
        ];
        utils.returnLineSwap(returnArray);
        expect(returnArray).toEqual([
          'function hello(a,b,c) {\n',
          'minty.variableLog(0, file, log, ["a","b","c"], a, b, c);\n',
          '  console.log(a);\n',
          'minty.variableLog(1, file, log, ["a","b","c"], a, b, c);\n',
          '  var d = b + c;\n',
          'minty.variableLog(2, file, log, ["a","b","c","d"], a, b, c, d);\n',
          '  console.log(d);\n',
          'minty.variableLog(3, file, log, ["a","b","c","d"], a, b, c, d);\n',
          'minty.variableLog(4, file, log, ["a","b","c","d","return"], a, b, c, d, undefined);\n',
          '  return;\n',
          '}\n'
        ]);
    });
  });
});
