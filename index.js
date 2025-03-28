const { app, BrowserWindow, ipcMain, nativeImage, Menu, Tray } = require('electron');
const http = require('http');
const path = require('path');

let mainWindow;
let tray = null;
let server = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        //width: 800,
        //height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        transparent: true,
        frame: false,
        skipTaskbar: true, 
        focusable: false, 
        fullscreen:true
    });

    mainWindow.loadFile('index.html'); 

    createTray();

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.setFullScreenable(false);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    setupServer();
}

function createTray(){
    const iconPath = path.join(__dirname, 'data', 'icon.ico');
    let trayIcon = nativeImage.createEmpty();
    trayIcon = nativeImage.createFromPath(iconPath);   
    tray = new Tray(trayIcon.resize({width:16,height:16}));
    tray.setToolTip('Dota2 Overlay');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show',
            click: () => {
                if (mainWindow){
                    mainWindow.show();
                }
            }
        },
        {
            label: 'Hide',
            click: () => {
                if (mainWindow){
                    mainWindow.hide();
                }
            }
        },
        {type: 'separator'},
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                if (server) server.close();
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
    
}

function setupServer() {
    server = http.createServer((req, res) => {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    console.log('Got JSON');
                    if (mainWindow){
                        console.log('Send JSON');
                        mainWindow.webContents.send('json-data', jsonData)
                    }
                    /*
                    if (jsonData && jsonData.items) {
                        for (const [slot, item] of Object.entries(jsonData.items)) {
                            if (item.name === 'item_radiance') {
                                if (mainWindow) {
                                    console.log('radiance');
                                    mainWindow.webContents.send('radik');
                                }
                                break;
                            }
                        }
                    }
                    if(jsonData.hero.respawn_seconds>0){
                        console.log('ymep')
                        mainWindow.webContents.send('died');
                    } 
                    */
                } catch (error) {}
            });
        }
    });

    server.listen(4322, '0.0.0.0', () => {
        console.log('HTTP listening 4322');
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error('Port 4322 is already in use');
        }
    });
}

app.isQuitting = false;

app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (server) server.close();
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

process.on('exit', () => {
    if (server) server.close();
});