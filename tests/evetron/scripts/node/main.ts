// A simple test to verify a visible window is opened with a title
import assert = require('assert');

let Application = require('spectron').Application;

let pathToApp = `./src/evetron/bin/${(process.platform === 'darwin'
    ? 'Electron.app/Contents/MacOS/'
    : '')}electron${(process.platform === 'win32'
        ? '.exe'
        : '')}`;

/*********** Node tests ***********/

const app = new Application({
    path: pathToApp,
});

console.log('application launch');

app.start().then(() => {
    // Check if the window is visible
    return app.browserWindow.isVisible();
}).then((isVisible: Boolean) => {
    // Verify the window is visible
    assert.equal(isVisible, true);
}).then(() => {
    // Get the window's title
    return app.browserWindow.getTitle();
}).then((title: String) => {
    // Verify the window's title
    assert.equal(title, 'EVETron');
}).catch((error: any) => {
    // Log any failures
    console.error('Test failed', error.message);
}).then(() => {
    console.log('application exit');
    // Stop the application
    return app.stop();
});
