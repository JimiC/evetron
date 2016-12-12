'use strict';

import { MainWindow } from './mainWindow';
import { SquirrelHandler } from './squirrelHandler';

class Program {

    /**
     * The main entry point.
     *
     * @static
     */
    public static main(): void {

        // Handling Squirrel events
        if (SquirrelHandler.isSquirrelEvent()) {
            return;
        }

        const app = require('electron').app;
        let mainWindow: any;

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.on('ready', () => { mainWindow = new MainWindow(); });

        // Quit when all windows are closed.
        app.on('window-all-closed', () => {
            mainWindow = null;

            // On OS X it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            // On OS X it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) {
                mainWindow = new MainWindow();
            }
        });
    }
}

Program.main();
