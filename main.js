const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// Base
let win;
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

/**
 * Create Window function
 */
function createWindow()
{
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'dist/patrolSQL/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // win.loadURL('http://localhost:4200/');

  // win.webContents.openDevTools();

  win.on('closed', () =>
  {
    win = null;
  });

  rightClickMenuInit();
  settingFileInit();

  ipcMain.handle('readfile', readFile);
  ipcMain.handle('writeFile', writeFile);
  ipcMain.handle('sqlQuery', sqlQuery);
  ipcMain.handle('forEachFiles', forEachFiles)
}

/**
 * Init RCM
 */
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

/**
 * Init base config file
 */
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

  if (!fs.existsSync('./logs'))
  {
    fs.mkdir('./logs', { recursive: true }, (err) =>
    {
      if (err)
      {
        console.error(err);
        return;
      }
    });
    console.log('Logs Folder exists!');
  }

}

/**
 * Read file helper
 * @param {*} event 
 * @param {*} path 
 * @returns 
 */
function readFile(event, path)
{
  return new Promise((resolve, reject) =>
  {
    // Read
    fs.readFile(path, (err, data) =>
    {
      if (err)
      {
        reject(err);
      }
      const hasBOM = data.slice(0, 3).toString('hex') === 'efbbbf';
      const content = hasBOM ? data.slice(3).toString('utf-8') : data.toString('utf-8');
      resolve(content);
    });
  });
}

/**
 * Write file helper
 * @param {*} event 
 * @param {*} path 
 * @param {*} content 
 * @returns 
 */
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


/**
 * Sql query helper
 * @param {*} event 
 * @param {*} clientConfig 
 * @param {*} queystring 
 * @returns 
 */
async function sqlQuery(event, clientConfig, queystring)
{
  const sql = require('mssql')
  const sqlConfig = {
    options: {
      trustServerCertificate: true,
      Encrypt: true
    },
    user: clientConfig.username,
    password: clientConfig.password,
    server: clientConfig.host === '.' ? 'localhost' : clientConfig.host,
    database: clientConfig.database,
  }

  await sql.connect(sqlConfig);
  var result = await sql.query(queystring);
  sql.close();
  return result;
}

async function forEachFiles(event, folderPath)
{
  let result = [];
  // Get all files
  const files = fs.readdirSync(folderPath);

  function insert(result, item)
  {
    if (item.fileName.indexOf('.sql') > -1)
    {
      result.push(item);
    }
  }

  function getFileInfo(filePath)
  {
    pathSplitList = filePath.split('\\');
    return {
      folderName: pathSplitList[pathSplitList.length - 2],
      fileName: pathSplitList[pathSplitList.length - 1],
      fullPath: filePath
    }
  }

  // Loop files
  await files.forEach(async file =>
  {
    const filePath = `${folderPath}\\${file}`;

    // Check is directory
    if (fs.statSync(filePath).isDirectory())
    {
      const value = await forEachFiles(event, filePath);
      value.forEach(scriptFile =>
      {
        insert(result, scriptFile);
      });
    }
    else
    {
      insert(result, getFileInfo(filePath));
    }
  });

  return result;
}


