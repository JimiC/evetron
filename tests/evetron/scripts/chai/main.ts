// A mocha and chai test to verify that it opens a window
import chai = require('chai');

let chaiAsPromised = require('chai-as-promised');
let Application = require('spectron').Application;

let pathToApp = `./src/evetron/bin/${(process.platform === 'darwin'
    ? 'Electron.app/Contents/MacOS/'
    : '')}electron${(process.platform === 'win32'
        ? '.exe'
        : '')}`;

chai.should();
chai.use(chaiAsPromised);

describe('application launch', function () {
    this.timeout(10000);

    beforeEach(() => {
        this.app = new Application({
            path: pathToApp,
        });
        return this.app.start();
    });

    beforeEach(() => {
        chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
    });

    afterEach(() => {
        if (this.app && this.app.isRunning()) {
            return this.app.stop();
        }
    });

    it('opens a window', () => {
        return this.app.client.waitUntilWindowLoaded()
            .getWindowCount().should.eventually.equal(1)
            .browserWindow.isMinimized().should.eventually.be.false
            .browserWindow.isDevToolsOpened().should.eventually.be.false
            .browserWindow.isVisible().should.eventually.be.true
            .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
            .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0);
    });
});
