const { app, BrowserWindow, ipcMain } = require('electron');
const http = require('http');

let mainWindow;


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile('index.html');
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
                console.log('Получен JSON:', jsonData);

                // Отправляем данные в рендерер (окно Electron)
                if (mainWindow) {
                    mainWindow.webContents.send('json-data', jsonData);
                }


                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'OK', data: jsonData }));
            } catch (error) {
                console.error('Ошибка при парсинге JSON:', error);

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
    console.log('HTTP сервер слушает порт 4322');
});



