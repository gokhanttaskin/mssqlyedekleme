const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  testConnection: (payload) => ipcRenderer.invoke('sql:testConnection', payload),
  listDatabases: (payload) => ipcRenderer.invoke('sql:listDatabases', payload),
  backupDatabases: (payload) => ipcRenderer.invoke('sql:backupDatabases', payload),
  selectFolder: () => ipcRenderer.invoke('ui:selectFolder')
});