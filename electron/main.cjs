const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const sql = require('mssql');

function parseServer(server) {
  // Supports HOST or HOST\\INSTANCE
  const instanceSep = server.indexOf('\\');
  if (instanceSep !== -1) {
    return {
      host: server.slice(0, instanceSep),
      instanceName: server.slice(instanceSep + 1)
    };
  }
  return { host: server, instanceName: null };
}

function getSqlConfig({ server, user, password }) {
  const { host, instanceName } = parseServer(server);
  const config = {
    server: host,
    user,
    password,
    database: 'master',
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    port: 1433,
    // Increase timeouts to tolerate long-running BACKUP operations
    connectionTimeout: 60000, // 60s to establish connection
    requestTimeout: 600000    // 10 min per request
  };
  if (instanceName) {
    config.options.instanceName = instanceName;
    delete config.port; // instanceName implies dynamic port
  }
  return config;
}

async function testConnection(payload) {
  const config = getSqlConfig(payload);
  try {
    const pool = await sql.connect(config);
    const versionRes = await pool.request().query(
      `SELECT 
         CAST(SERVERPROPERTY('ProductVersion') AS NVARCHAR(100)) AS ProductVersion,
         CAST(SERVERPROPERTY('ProductLevel') AS NVARCHAR(100)) AS ProductLevel,
         CAST(SERVERPROPERTY('Edition') AS NVARCHAR(100)) AS Edition`
    );
    const v = versionRes.recordset?.[0]?.ProductVersion || '';
    const major = parseInt(String(v).split('.')[0] || '0', 10);
    const yearMap = {
      8: '2000', 9: '2005', 10: '2008', 11: '2012', 12: '2014',
      13: '2016', 14: '2017', 15: '2019', 16: '2022'
    };
    const year = yearMap[major] || undefined;
    const info = {
      productVersion: versionRes.recordset?.[0]?.ProductVersion,
      productLevel: versionRes.recordset?.[0]?.ProductLevel,
      edition: versionRes.recordset?.[0]?.Edition,
      year
    };
    pool.close();
    return { ok: true, info };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function listDatabases(payload) {
  const config = getSqlConfig(payload);
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(
      `SELECT name FROM sys.databases WHERE state = 0 AND name NOT IN ('master','model','msdb') ORDER BY name`
    );
    pool.close();
    return { ok: true, databases: result.recordset.map(r => r.name) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '_' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

async function backupDatabases(payload) {
  const { server, user, password, databases, folder } = payload;
  const config = getSqlConfig({ server, user, password });
  const results = [];
  try {
    const pool = await sql.connect(config);
    for (const db of databases) {
      const file = path.join(folder, `${db}_${timestamp()}.bak`);
      try {
        const request = pool.request();
        request.timeout = 600000; // 10 minutes per backup
        await request
          .input('file', sql.NVarChar, file)
          .query(
            `BACKUP DATABASE [${db}] TO DISK = @file WITH INIT`
          );
        results.push({ db, ok: true, file });
      } catch (err) {
        const details = [
          err?.message,
          ...(Array.isArray(err?.precedingErrors) ? err.precedingErrors.map(e => e.message) : []),
          err?.originalError?.message
        ].filter(Boolean).join(' | ');
        results.push({ db, ok: false, error: details });
      }
    }
    pool.close();
    return { ok: true, results };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    // Open DevTools only if explicitly requested
    if (process.env.OPEN_DEVTOOLS === '1') {
      win.webContents.openDevTools();
    }
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('sql:testConnection', async (_e, payload) => testConnection(payload));
  ipcMain.handle('sql:listDatabases', async (_e, payload) => listDatabases(payload));
  ipcMain.handle('sql:backupDatabases', async (_e, payload) => backupDatabases(payload));
  ipcMain.handle('ui:selectFolder', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
    if (res.canceled || !res.filePaths?.[0]) return { ok: false };
    return { ok: true, folder: res.filePaths[0] };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});