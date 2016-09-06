/// <reference path="../../../../typings/index.d.ts" />

// A mocha test to verify that it shows an initial window
import assert = require('assert');

let Application = require('spectron').Application;

let pathToApp = `./src/evetron/bin/${(process.platform === 'darwin'
        ? 'Electron.app/Contents/MacOS/'
        : '')}electron${(process.platform === 'win32'
        ? '.exe'
        : '')}`;

/*********** Mocha tests ***********/

describe('application launch', function () {
  this.timeout(10000);

  beforeEach(() => {
    this.app = new Application({
      path: pathToApp,
    });
    return this.app.start();
  });

  afterEach(() => {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('shows an initial window', () => {
    return this.app.client.getWindowCount()
      .then((count: number) => {
        assert.equal(count, 1);
    });
  });
});
