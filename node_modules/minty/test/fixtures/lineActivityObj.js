module.exports = { '1':
   { rulesFound: [],
     variables: { variables: { names: [ 'b' ], kind: 'const' } } },
  '2':
   { rulesFound: [],
     variables: { variables: { names: [ 'one', 'two', 'three' ], kind: 'var' } } },
  '3':
   { rulesFound: [],
     variables: { variables: { names: [ 'four', 'five' ], kind: 'var' } } },
  '4':
   { rulesFound: [],
     variables: { variables: { names: [ 'seven' ], kind: 'var' } } },
  '5':
   { rulesFound: [],
     variables: { variables: { names: [ 'six' ], kind: 'var' } } },
  '7':
   { rulesFound: [],
     variables: { variables: { names: [ 'expr' ], kind: 'var' } } },
  '9':
   { rulesFound: [ { action: 'START', rule: 'SCOPE', type: 'ForStatement' } ],
     variables: { variables: { names: [ 'j' ], kind: 'let' } } },
  '11': { rulesFound: [ { action: 'END', rule: 'SCOPE', type: 'ForStatement' } ] },
  '13':
   { rulesFound: [ { action: 'START', rule: 'SCOPE', type: 'FunctionExpression' } ],
     variables:
      { variables: { names: [ 'test2' ], kind: 'var' },
        parameters: [] },
     scope: 'test2' },
  '14':
   { rulesFound:
      [ { action: 'START', rule: 'VOID', type: 'CallExpression' },
        { action: 'END', rule: 'VOID', type: 'CallExpression' } ] },
  '15': { rulesFound: [ { action: 'END', rule: 'SCOPE', type: 'FunctionExpression' } ] },
  '18':
   { rulesFound: [],
     variables: { variables: { names: [ 'regexstr' ], kind: 'var' } } },
  '20':
   { rulesFound:
      [ { action: 'START', rule: 'VOID', type: 'CallExpression' },
        { action: 'END', rule: 'VOID', type: 'CallExpression' } ] },
  '23':
   { rulesFound: [ { action: 'START', rule: 'SCOPE', type: 'ForInStatement' } ],
     variables: { variables: { names: [ 'keys' ], kind: 'var' } } },
  '25': { rulesFound: [ { action: 'END', rule: 'SCOPE', type: 'ForInStatement' } ] },
  '40': { rulesFound: [ { action: 'START', rule: 'VOID', type: 'CallExpression' } ] },
  '41': { rulesFound: [ { action: 'END', rule: 'VOID', type: 'CallExpression' } ] },
  '43':
   { rulesFound: [ { action: 'START', rule: 'SCOPE', type: 'FunctionDeclaration' } ],
     variables: { parameters: [] },
     scope: 'fn' },
  '44': { rulesFound: [ { action: 'START', rule: 'SCOPE', type: 'IfStatement' } ] },
  '45':
   { rulesFound:
      [ { action: 'START', rule: 'VOID', type: 'CallExpression' },
        { action: 'END', rule: 'VOID', type: 'CallExpression' } ] },
  '46': { rulesFound: [ { action: 'END', rule: 'SCOPE', type: 'IfStatement' } ] },
  '48':
   { rulesFound: [ { action: 'START', rule: 'SCOPE', type: 'FunctionDeclaration' } ],
     variables: { parameters: [ 'd', 'e', 'f' ] },
     scope: 'fn2' },
  '49':
   { rulesFound:
      [ { action: 'START', rule: 'VOID', type: 'CallExpression' },
        { action: 'END', rule: 'VOID', type: 'CallExpression' } ] },
  '50':
   { rulesFound: [],
     variables: { variables: { names: [ 'bus' ], kind: 'var' } } },
  '51': { rulesFound: [ { action: 'END', rule: 'SCOPE', type: 'FunctionDeclaration' } ] },
  '52':
   { rulesFound:
      [ { action: 'START', rule: 'VOID', type: 'CallExpression' },
        { action: 'END', rule: 'VOID', type: 'CallExpression' } ] },
  '53':
   { rulesFound: [],
     variables: { variables: { names: [ 'car' ], kind: 'var' } } },
  '54': { rulesFound: [ { action: 'END', rule: 'SCOPE', type: 'FunctionDeclaration' } ] },
  '56':
   { rulesFound: [],
     variables: { variables: { names: [ 'expr' ], kind: 'var' } } },
  '58': { rulesFound: [ { action: 'START', rule: 'VOID', type: 'SwitchStatement' } ] },
  '60':
   { rulesFound: [ { action: 'START', rule: 'SCOPE', type: 'SwitchCase' } ],
     variables: {} },
  '62':
   { rulesFound:
      [ { action: 'END', rule: 'SCOPE', type: 'SwitchCase' },
        { action: 'START', rule: 'SWAP', type: 'BreakStatement' },
        { action: 'END', rule: 'SWAP', type: 'BreakStatement' } ] },
  '63':
   { rulesFound: [ { action: 'START', rule: 'SCOPE', type: 'SwitchCase' } ],
     variables: {} },
  '65':
   { rulesFound:
      [ { action: 'END', rule: 'SCOPE', type: 'SwitchCase' },
        { action: 'START', rule: 'SWAP', type: 'BreakStatement' },
        { action: 'END', rule: 'SWAP', type: 'BreakStatement' } ] },
  '66':
   { rulesFound: [ { action: 'START', rule: 'SCOPE', type: 'SwitchCase' } ],
     variables: {} },
  '67': { rulesFound: [ { action: 'END', rule: 'SCOPE', type: 'SwitchCase' } ] },
  '68': { rulesFound: [ { action: 'END', rule: 'VOID', type: 'SwitchStatement' } ] },
  '70':
   { rulesFound:
      [ { action: 'START', rule: 'VOID', type: 'CallExpression' },
        { action: 'END', rule: 'VOID', type: 'CallExpression' } ] } }
