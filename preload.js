const { contextBridge, ipcRenderer } = require('electron')

// DEMO
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('electronAPI', {
  RCM: (index) => ipcRenderer.send('RCM', index),
  menuClicked: (callback) => ipcRenderer.on('menuClicked', callback),
  readFile: (path) => ipcRenderer.invoke('readfile', path),
  writeFile: (path, content) => ipcRenderer.invoke('writeFile', path, content),
  sqlQuery: (clientConfig, queryString) => ipcRenderer.invoke('sqlQuery', clientConfig, queryString),
  forEachFiles: (path) => ipcRenderer.invoke('forEachFiles', path),
})

