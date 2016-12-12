// An ava test to verify that it opens a window
import ava from 'ava';

let Application = require('spectron').Application;

let pathToApp = `../../../../src/evetron/bin/${(process.platform === 'darwin'
    ? 'Electron.app/Contents/MacOS/'
    : '')}electron${(process.platform === 'win32'
        ? '.exe'
        : '')}`;

ava.beforeEach((test: any) => {
    test.context.app = new Application({
        path: pathToApp,
    });

    return test.context.app.start();
});

ava.afterEach((test: any) => {
    return test.context.app.stop();
});

ava((test: any) => {
    return test.context.app.client.waitUntilWindowLoaded()
        .getWindowCount().then((count: number) => {
            test.is(count, 1);
        }).browserWindow.isMinimized().then((min: boolean) => {
            test.false(min);
        }).browserWindow.isDevToolsOpened().then((opened: boolean) => {
            test.false(opened);
        }).browserWindow.isVisible().then((visible: boolean) => {
            test.true(visible);
        }).browserWindow.getBounds().then((bounds: any) => {
            test.true(bounds.width > 0);
            test.true(bounds.height > 0);
        });
});
