//1. are buttons appended
//2. is codemirror appended
//3. do tds start as undefined
//4. how to test if last button and first does what its supposed to
//5. need dummmy data
//6. test if file loads
//7. test if buttons are disabled

const Browser = require('zombie');
const expect = require('expect');
const mockData = require('./dummyfiles/front-end-dummy');


describe('Minty Tests', () => {
  const browser = new Browser({waitDuration: 1000});

  beforeEach(done => {
    browser.reload(done);
  });

  before(done => {
    browser.visit(`file://${__dirname.slice(0, -4)}minty/file/minty.html`, done);
  });

  it('has a button called first', () => {
    browser.assert.element('button#first');
  });

  it('has a button called last', () => {
    browser.assert.element('button#last');
  });

  it('has a button called forward', () => {
    browser.assert.element('button#forward');
  });

  it('has a button called back', () => {
    browser.assert.element('button#back');
  });

  it('has ace editor', () => {
    browser.assert.element('.ace_editor');
  });


  it ('press forward appends correct data to table', () => {
    var counter = 0;
    return browser.fire('#forward', 'click')
      .then(() => {
        counter++;
        return browser.fire('#forward', 'click');
      })
      .then(() => {
        counter++;
        return browser.fire('#forward', 'click');
      })
      .then(() => {
        counter++;
        return browser.fire('#forward', 'click');
      })
      .then(() => {
        counter++;
        const variables = browser.queryAll('.variables');
        const tdVarVal = parseInt(variables[1].textContent);
        const varNames = Object.keys(mockData.log[counter].variables);
        const mockVarVal = mockData.log[counter].variables[varNames[1]];
        return expect(tdVarVal).toEqual(mockVarVal);
      });
  });

  it ('press back button appends correct data to table', () => {
    var counter = 0;
    return browser.fire('#forward', 'click')
      .then(() => {
        counter++;
        return browser.fire('#forward', 'click');
      })
      .then(() => {
        counter++;
        return browser.fire('#forward', 'click');
      })
      .then(() => {
        counter++;
        return browser.fire('#forward', 'click');
      })
      .then(() => {
        counter++;
        return browser.fire('#back', 'click');
      })
      .then(() => {
      counter--;
       return browser.fire('#back', 'click');
      })
      .then(() => {
        counter--;
        const variables = browser.queryAll('.variables');
        const tdVarVal = parseInt(variables[2].textContent);
        const varNames = Object.keys(mockData.log[counter].variables);
        const mockVarVal = mockData.log[counter].variables[varNames[2]];
        return expect(tdVarVal).toEqual(mockVarVal);
      });
  });

  it ('press last button appends variables from last line of data', () => {
    var counter = 0;
    return browser.pressButton('#last')
      .then(() => {
        counter = mockData.log.length - 1;
        const variables = browser.queryAll('.variables');
        const tdVarVal = parseInt(variables[3].textContent);
        const varNames = Object.keys(mockData.log[counter].variables);
        const mockVarVal = mockData.log[counter].variables[varNames[3]];
        return expect(tdVarVal).toEqual(mockVarVal);
      });
  });

  it ('press first button makes .variable values undefined', () => {
    var counter = 0;
    return browser.fire('#forward', 'click')
      .then(() => {
        return browser.fire('#first', 'click');
      })
      .then(() => {
        const variable = browser.queryAll('.variables');

        expect(variable[0].textContent).toEqual('undefined');
        expect(variable[1].textContent).toEqual('undefined');
        expect(variable[2].textContent).toEqual('undefined');
        expect(variable[3].textContent).toEqual('undefined');
      });
  });


  it ('page first loads, first and back buttons are disabled', () => {


  });


});
