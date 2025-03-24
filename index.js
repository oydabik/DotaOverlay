const { app, BrowserWindow, ipcMain } = require('electron');
const http = require('http');

let mainWindow;

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
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    })
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setFullScreenable(false);
    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.setFullScreenable(false);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const jsonData = JSON.parse(body);
                console.log('Got JSON:', jsonData);
                if (mainWindow){
                    mainWindow.webContents.send('json-data', jsonData)
                }

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

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'OK', data: jsonData }));
            } catch (error) {
                console.error('Error parsing JSON:', error);

                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ERROR', message: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ERROR', message: 'Method Not Allowed' }));
    }
});

server.listen(4322, '0.0.0.0', () => {
    console.log('HTTP listening 4322');
});


