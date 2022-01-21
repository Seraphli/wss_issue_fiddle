// Modules to control application life and create native browser window
const { app, BrowserWindow, netLog } = require('electron');
const path = require('path');
const fs = require('fs');
let options = {
  flags: 'w', //
  encoding: 'utf8', // utf8编码
};
let file = fs.createWriteStream('./wss_issue.log', options);

// 创建logger
let logger = new console.Console(file, file);

app.commandLine.appendSwitch('ignore-certificate-errors');
// app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
logger.log('start', app.commandLine.hasSwitch('ignore-certificate-errors'));

function simpleStringify (object){
  var simpleObject = {};
  for (var prop in object ){
      if (!object.hasOwnProperty(prop)){
          continue;
      }
      if (typeof(object[prop]) == 'object'){
          continue;
      }
      if (typeof(object[prop]) == 'function'){
          continue;
      }
      simpleObject[prop] = object[prop];
  }
  return JSON.stringify(simpleObject); // returns cleaned up JSON
};

async function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  function UpsertKeyValue(obj, keyToChange, value) {
    const keyToChangeLower = keyToChange.toLowerCase();
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase() === keyToChangeLower) {
        // Reassign old key
        obj[key] = value;
        // Done
        return;
      }
    }
    // Insert at end instead
    obj[keyToChange] = value;
  }

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      const { requestHeaders } = details;
      // if (details.url.indexOf('localhost.newworldminimap.com') > -1) {
      //   UpsertKeyValue(requestHeaders, 'Access-Control-Allow-Origin', ['*.newworldminimap.com']);
      // }
      logger.log('onBeforeSendHeaders', simpleStringify(details));
      callback({ requestHeaders });
    }
  );
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      const { responseHeaders } = details;
      logger.log('onHeadersReceived', simpleStringify(details));
      callback({
        responseHeaders,
      });
    }
  );

  // Open the DevTools.
  await mainWindow.webContents.openDevTools();

  // and load the index.html of the app.
  // mainWindow.loadFile('index.html')

  await mainWindow.loadURL(
    'https://www.newworldminimap.com/map?coords=11458.02,2267.64,0'
  );
  // await mainWindow.loadURL(
  //   'https://localhost.newworldminimap.com:42224/Location'
  // );

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await netLog.startLogging('./http-net-log.json')
  await createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  // const path = await netLog.stopLogging()
  // console.log('Net-logs written to', path)
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
