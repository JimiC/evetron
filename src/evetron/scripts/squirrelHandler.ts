'use strict';

export class SquirrelHandler {

    public static isSquirrelEvent(): boolean {

        if (process.argv.length === 1) {
            return false;
        }

        const path = require('path');
        const updateExe: string = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
        const execName: string = path.basename(process.execPath);

        const spawn = require('child_process').spawn;
        const runUpdater = (args: string[], done: any) => {
            return spawn(updateExe, args, { detached: true }).on('close', done);
        };

        const app = require('electron').app;
        switch (process.argv[1]) {
            case '--squirrel-install':
            case '--squirrel-updated':
                // Optionally do things such as: 
                // - Add your .exe to the PATH 
                // - Write to the registry for things like file associations and 
                //   explorer context menus 

                // Install desktop and start menu shortcuts 
                runUpdater(['--createShortcut', execName], app.quit);

                return true;

            case '--squirrel-uninstall':
                // Undo anything you did in the --squirrel-install and 
                // --squirrel-updated handlers 

                // Remove desktop and start menu shortcuts 
                runUpdater(['--removeShortcut', execName], app.quit);

                return true;

            case '--squirrel-obsolete':
                // This is called on the outgoing version of your app before 
                // we update to the new version - it's the opposite of 
                // --squirrel-updated 

                app.quit();
                return true;

            case '--squirrel-firstrun':
                // Delay to give time to the installGif to close
                let delayed = new Date().getTime() + (3 * 1000);
                while (new Date().getTime() <= delayed) {
                    // do events
                }
                return false;
        }
        return false;
    }
}
