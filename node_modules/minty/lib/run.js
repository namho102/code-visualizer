'use strict';

const _eval = require('eval');
const fs = require('fs');
const appRoot = require('app-root-path');
const stringify = require('json-stringify-safe');

let filename;
let log;


function mintyLog(lineNumber, scope, special, variables) {
  const args = Array.prototype.slice.call(arguments, 4);
  const retObj = {
    file: filename,
    line: lineNumber,
    variables: {
      special: {},
      global: {},
    },
    scope,
  };
  function variableAdd(type, key) {
    const array = type;
    if (key === 'special') {
      for (const el in type) {
        retObj.variables[key][el] = {};
        type[el].forEach(val => {
          retObj.variables[key][el][val] = JSON.stringify(args[0]);
          args.splice(0, 1);
        });
      }
    } else {
      while (array.length) {
        retObj.variables[key][array[0]] = JSON.stringify(args[0]);
        args.splice(0, 1);
        array.splice(0, 1);
      }
    }
  }

  variableAdd(special, 'special');
  variableAdd(variables, 'global');
  // return object into results array
  return log.push(retObj);
}

function errorLineFind(text, finalLog) {
  let finalLine = 0;
  if (finalLog.length) {
    finalLine = finalLog[finalLog.length - 1].line;
  }
  const errInfo = {};
  let completed = false;
  text.log.forEach(line => {
    if (completed) return;
    if (line.indexOf('mintyLog') !== -1) {
      const currLine = parseInt(line.slice(9), 10);
      if (currLine > finalLine) {
        errInfo.line = currLine;
        errInfo.scope = line.split(',')[1];
        completed = true;
      }
    }
  });
  return errInfo;
}

function finalizeOutput(outputObj) {
  return stringify(outputObj, (key, value) => {
    if (value === undefined) return '_mintyUndefined';
    if (value === Function) return value.toString();
    return value;
  });
}


function finalizeRun(output, type) {
  const name = filename;
  const date = new Date();
  fs.mkdir(appRoot + '/minty', () => {
    fs.mkdir(appRoot + `/minty/${type}`, () => {
      const jquery = fs.readFileSync(appRoot + '/node_modules/jquery/dist/jquery.min.js');
      const normalizeCss = fs.readFileSync(appRoot + '/node_modules/minty/lib/mintyTemplates/skeleton/css/normalize.css');
      const skeletonCss = fs.readFileSync(appRoot + '/node_modules/minty/lib/mintyTemplates/skeleton/css/skeleton.css');
      const template = fs.readFileSync(appRoot + '/node_modules/minty/lib/mintyTemplates/mintyVisTemplate.js');
      const beginningHtml = fs.readFileSync(appRoot + '/node_modules/minty/lib/mintyTemplates/beginning.html');
      const endHtml = fs.readFileSync(appRoot + '/node_modules/minty/lib/mintyTemplates/end.html');
      const bodyHtml = fs.readFileSync(appRoot + '/node_modules/minty/lib/mintyTemplates/body.html');
      const viz = fs.readFileSync(appRoot + '/node_modules/minty/lib/mintyTemplates/viz.js');
      const insert = `${beginningHtml} \n <script type="text/javascript"> \n ${jquery} \n </script> \n <style>`
        + `\n ${normalizeCss} \n </style> \n <style> \n ${skeletonCss} \n </style> \n ${bodyHtml} \n`
        + `<script>${viz}</script>\n`
        + `<script type="text/javascript"> \n var data = ${output} \n ${template} \n </script> \n ${endHtml}`;
      fs.writeFile(appRoot + `/minty/${type}/${name}_${date.toString().replace(/\s+/gm, '_').replace(/:+/gm, '-')}.html`, insert, (err3) => {
        if (err3) console.log(err3);
      });
    });
  });
}

function errorHandler(error, text) {
  const errInfo = errorLineFind(text, log);
  const errVars = log.length ? log[log.length - 2].variables : text.globalVars;
  log.push({
    file: filename,
    line: errInfo.line,
    scope: JSON.stringify([errInfo.scope]),
    error: error.message,
    variables: errVars,
  });
}

function runFile(fileText, absPath, originalText) {
  const fileJS = fileText.log.join('\n');
  log = [];
  filename = absPath.slice(absPath.lastIndexOf('/') + 1);
  try {
    _eval(fileJS, filename, {
      mintyLog: mintyLog,
    }, true);
  } catch (err) {
    console.log(`\n\n#################################################################################\nMinty has found an error! Please check the out put of ${filename} for more details\n#################################################################################\n`);
    errorHandler(err, fileText);
  } finally {
    const output = {
      entry: filename,
      log: log,
    };
    output[filename] = originalText;
    const fileOutput = finalizeOutput(output);
    finalizeRun(fileOutput, 'file');
    console.log(`Minty has finished analyzing ${filename}`);
  }
}

function wrap(wrapText, originalText) {
  let returnStatement;
  log = [];
  filename = wrapText.log[1]
    .split(',')[2]
    .replace(/\s+|\]|\'|\"/g, '');
  const wrapJS = wrapText.log.join('\n');
  return function() {
    const args = Array.prototype.slice.call(arguments);
    try {
      const fn = eval(`(${wrapJS})`);
      returnStatement = fn.apply(null, args);
    } catch (err) {
      console.log(`\n\n#################################################################################\nMinty has found an error! Please check the out put of ${filename} for more details\n#################################################################################\n`);
      errorHandler(err, wrapText);
    } finally {
      const output = {
        entry: filename,
        log: log,
      };
      output[filename] = originalText;
      const wrapOutput = finalizeOutput(output);
      finalizeRun(wrapOutput, 'function');
    }
    return returnStatement;
  };
}


const run = {
  runFile: runFile,
  wrap: wrap,
};

module.exports = run;
