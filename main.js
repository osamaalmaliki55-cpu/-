const { app, BrowserWindow, dialog, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

let server;
const htmlPath = path.join(__dirname, 'index.html');
const PORT = 8765;

function startLocalServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const pathname = new URL(req.url, `http://localhost:${PORT}`).pathname;
      if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        fs.createReadStream(htmlPath).pipe(res);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    });
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve());
  });
}

async function createWindow() {
  await startLocalServer();
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    title: 'دفتر الإيرادات والمصروفات',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://accounts.google.com/') || url.startsWith('https://daftar-accounts-osama.firebaseapp.com/')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  await win.loadURL(`http://localhost:${PORT}/`);
  win.on('closed', () => {});
}

app.whenReady().then(createWindow).catch(err => {
  dialog.showErrorBox('تعذر تشغيل دفتر الحسابات', String(err.message || err));
  app.quit();
});

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (server) server.close(); });
