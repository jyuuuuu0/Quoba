import { useEffect } from 'react'

const isMac = (): boolean => window.quoba.platform === 'darwin'

/** Turns a keydown into an Electron accelerator such as `CommandOrControl+Shift+K`. */
export function eventToAccelerator(event: KeyboardEvent): string | null {
  const key = event.key
  if (['Meta', 'Control', 'Alt', 'Shift'].includes(key)) return null
  const parts: string[] = []
  const commandOrControl = isMac() ? event.metaKey : event.ctrlKey
  if (commandOrControl) parts.push('CommandOrControl')
  if (isMac() && event.ctrlKey) parts.push('Control')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  const named: Record<string, string> = { ' ': 'Space', Enter: 'Enter', Escape: 'Escape', Tab: 'Tab' }
  // event.code keeps the physical key when Alt or Shift changes event.key (e.g. ⌥K on a Mac).
  const fromCode = event.code.startsWith('Key')
    ? event.code.slice(3)
    : event.code.startsWith('Digit')
      ? event.code.slice(5)
      : null
  parts.push(named[key] ?? fromCode ?? (key.length === 1 ? key.toUpperCase() : key))
  return parts.join('+')
}

/** Runs `handler` when the keydown matches `accelerator`. Ignores unset shortcuts. */
export function useShortcut(accelerator: string | null | undefined, handler: () => void): void {
  useEffect(() => {
    if (!accelerator) return
    const listener = (event: KeyboardEvent): void => {
      if (eventToAccelerator(event) === accelerator) {
        event.preventDefault()
        handler()
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [accelerator, handler])
}
