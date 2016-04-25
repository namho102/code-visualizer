// minty.js
const minty = require('minty')

// minty.file(require('path').join(__dirname, 'index.js'))

minty.file(require('path').join(__dirname, 'app.js'))

/*function test(a) {
  return a;
}

const newTest = minty.wrap(test);

newTest(1)*/