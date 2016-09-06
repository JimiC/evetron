'use strict';

import { BrowserWindow, Menu } from 'electron';

export class MainWindow {

    private m_mainWindow: Electron.BrowserWindow;

    constructor() {
        this.init();
        this.load();
    }

    /**
     * Initializes a new MainWindow.
     * 
     * @private
     */
    private init(): void {
        let options = {
            height: 600,
            title: 'EVETron',
            width: 800,
        };

        // Create the menu
        Menu.setApplicationMenu(this.getMenu());

        // Create the browser window.
        this.m_mainWindow = new BrowserWindow(options);

        // Emitted when the window is closed.
        this.m_mainWindow.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.m_mainWindow = null;
        });
    }

    /**
     * Loads the window.
     * 
     * @private
     */
    private load(): void {
        // Load the main window of the app.
        this.m_mainWindow.loadURL(`file://${__dirname}/mainWindow.html`);
    }

    /**
     * Gets the menu.
     * 
     * @private
     * @returns {Electron.Menu} ()
     */
    private getMenu(): Electron.Menu {
        const template = [{}];
        return Menu.buildFromTemplate(template);
    }
}
