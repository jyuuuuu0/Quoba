import { app, BrowserWindow, globalShortcut } from 'electron'
import type { Settings } from '@shared/settings'
import { broadcast } from './ipc'

let registeredGlobal: string | null = null
let createWindow: (() => BrowserWindow) | undefined

/** Lets the global shortcut open a new window when all windows were closed (macOS keeps the app running). */
export function setWindowFactory(factory: () => BrowserWindow): void {
  createWindow = factory
}

/** Brings the window forward and puts the cursor in the search box. */
function showSearch(): void {
  const existing = BrowserWindow.getAllWindows()[0]
  const window = existing ?? createWindow?.()
  if (!window) return
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
  // A new window has to load before it can receive the focus-search event.
  if (existing && !window.webContents.isLoading()) broadcast('shortcut', { action: 'search' })
  else window.webContents.once('did-finish-load', () => broadcast('shortcut', { action: 'search' }))
}

/**
 * Registers the "open Quoba from anywhere" shortcut. Returns false when another app owns it;
 * the shortcut that was working stays registered in that case.
 */
export function applyGlobalShortcut(accelerator: string | null): boolean {
  if (registeredGlobal === accelerator) return true
  if (accelerator) {
    try {
      if (!globalShortcut.register(accelerator, showSearch)) return false
    } catch {
      return false
    }
  }
  if (registeredGlobal) globalShortcut.unregister(registeredGlobal)
  registeredGlobal = accelerator
  return true
}

/** Applies the settings that live outside the window: login item and global shortcut. */
export function applySystemSettings(settings: Settings): void {
  // Login items are only meaningful for the installed app, not `npm run dev`.
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin })
  applyGlobalShortcut(settings.globalShortcut)
}

app.on('will-quit', () => globalShortcut.unregisterAll())
