import { app, BrowserWindow, globalShortcut } from 'electron'
import type { Settings } from '@shared/settings'
import { broadcast } from './ipc'

let registeredGlobal: string | null = null

/** Brings the window forward and puts the cursor in the search box. */
function showSearch(): void {
  const window = BrowserWindow.getAllWindows()[0]
  if (!window) return
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
  broadcast('shortcut', { action: 'search' })
}

/** Registers the "open Quoba from anywhere" shortcut. Returns false when another app owns it. */
export function applyGlobalShortcut(accelerator: string | null): boolean {
  if (registeredGlobal === accelerator) return true
  if (registeredGlobal) globalShortcut.unregister(registeredGlobal)
  registeredGlobal = null
  if (!accelerator) return true
  try {
    if (!globalShortcut.register(accelerator, showSearch)) return false
    registeredGlobal = accelerator
    return true
  } catch {
    return false
  }
}

/** Applies the settings that live outside the window: login item and global shortcut. */
export function applySystemSettings(settings: Settings): void {
  // Login items are only meaningful for the installed app, not `npm run dev`.
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin })
  applyGlobalShortcut(settings.globalShortcut)
}

app.on('will-quit', () => globalShortcut.unregisterAll())
