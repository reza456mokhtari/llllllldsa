const { app, BrowserWindow } = require('electron');
const path = require('path');

function create() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#f3f4f6',
    autoHideMenuBar: true,
    title: 'EpicWord',
    webPreferences: { contextIsolation: true, nodeIntegration: false, spellcheck: true },
  });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(() => {
  create();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) create(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
