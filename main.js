const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

let win;

function createWindow()
{
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // win.loadURL(url.format({
  //   pathname: path.join(__dirname, 'dist/patrolSQL/index.html'),
  //   protocol: 'file:',
  //   slashes: true
  // }));

  win.loadURL('http://localhost:4200/');

  win.webContents.openDevTools();

  win.on('closed', () =>
  {
    win = null;
  });

  rightClickMenuInit();
  settingFileInit();

  ipcMain.handle('readfile', readFile)
  ipcMain.handle('writeFile', writeFile)
  ipcMain.handle('sqlQuery', sqlQuery)

}

app.on('ready', createWindow);

app.on('window-all-closed', () =>
{
  if (process.platform !== 'darwin')
  {
    app.quit();
  }
});

app.on('activate', () =>
{
  if (win === null)
  {
    createWindow();
  }
});


function rightClickMenuInit()
{
  ipcMain.on('RCM', (event, index) =>
  {
    const template = [
      {
        label: 'Edit Setting',
        click: () => win.webContents.send('menuClicked', 1, index)
      },
      { type: 'separator' },
      {
        label: 'Delete Setting',
        click: () => win.webContents.send('menuClicked', 2, index)
      }
    ]
    const menu = Menu.buildFromTemplate(template)
    menu.popup(BrowserWindow.fromWebContents(event.sender))
  })
}

function settingFileInit()
{
  if (!fs.existsSync('./sqlConfigs.json'))
  {
    // Write
    fs.writeFile('./sqlConfigs.json', '[]', (err) =>
    {
      if (err)
      {
        console.error(err);
        return;
      }
      console.log('File has been written');
    });
  }

}

function readFile(event, path)
{
  return new Promise((resolve, reject) =>
  {
    // Read
    fs.readFile(path, 'utf-8', (err, data) =>
    {
      if (err)
      {
        reject(err);
      }
      resolve(data);
    });
  });
}

function writeFile(event, path, content)
{
  return new Promise((resolve, reject) =>
  {
    // Write
    fs.writeFile(path, content, (err) =>
    {
      if (err)
      {
        reject(err);
      }

      resolve();
    });
  });
}


async function sqlQuery(event, clientConfig, queystring)
{
  const sql = require('mssql')
  const sqlConfig = {
    options: {
      trustServerCertificate: true,
      Encrypt: true
    },
    ...clientConfig
  }

  await sql.connect(sqlConfig);
  var result = await sql.query(queystring);
  sql.close();
  return result;
}