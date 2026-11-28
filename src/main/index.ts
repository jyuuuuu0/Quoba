import { join } from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import { EngineClient } from './engine'
import { broadcast, registerIpc } from './ipc'
import { PromiseStore } from './promise-store'
import { Secrets } from './secrets'
import { SettingsStore } from './settings-store'

let mainWindow: BrowserWindow | undefined

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#050506',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    titleBarOverlay:
      process.platform === 'darwin' ? undefined : { color: '#050506', symbolColor: '#A1A1AA', height: 36 },
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.once('ready-to-show', () => window.show())

  // External links open in the user's browser, never inside the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void window.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  }
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = undefined
  })
  return window
}

app.whenReady().then(async () => {
  const store = new SettingsStore()
  const secrets = new Secrets()
  const engine = new EngineClient({
    onStatus: (status) => broadcast('engine:status', status),
    onAnswer: (requestId, event) => broadcast('answer', { requestId, event })
  })

  engine.start(secrets.env())
  registerIpc({
    store,
    engine,
    secrets,
    promises: new PromiseStore(),
    onSettingsChanged: () => {
      engine
        .request('configure', { settings: store.get() })
        .catch((error: unknown) => console.error('Engine reconfiguration failed', error))
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow()
  })
  app.on('before-quit', () => engine.stop())

  mainWindow = createMainWindow()

  try {
    await engine.request('configure', { settings: store.get() })
    if (store.get().onboarded) {
      engine.request('refresh', {}).catch((error: unknown) => console.error('Startup refresh failed', error))
    }
  } catch (error) {
    // The engine reports its own status; the window stays usable and settings can retry.
    console.error('Engine configuration failed', error)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
