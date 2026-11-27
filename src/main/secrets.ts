import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, safeStorage } from 'electron'

/**
 * Tokens such as a GitHub access token, encrypted with the OS keychain (safeStorage).
 * They are handed to the engine only as environment variables and never written in plain text.
 */
export class Secrets {
  private readonly dir = join(app.getPath('userData'), 'secrets')

  set(name: string, value: string | null): void {
    const file = this.file(name)
    if (value === null || value === '') {
      rmSync(file, { force: true })
      return
    }
    if (!safeStorage.isEncryptionAvailable())
      throw new Error('Secure storage is not available on this system')
    mkdirSync(this.dir, { recursive: true })
    writeFileSync(file, safeStorage.encryptString(value), { mode: 0o600 })
  }

  get(name: string): string | undefined {
    const file = this.file(name)
    if (!existsSync(file) || !safeStorage.isEncryptionAvailable()) return undefined
    try {
      return safeStorage.decryptString(readFileSync(file))
    } catch {
      return undefined
    }
  }

  /** Environment variables for the engine, e.g. `{ GITHUB_TOKEN: '…' }`. */
  env(): Record<string, string> {
    const token = this.get('GITHUB_TOKEN')
    return token ? { GITHUB_TOKEN: token } : {}
  }

  private file(name: string): string {
    if (!/^[A-Z0-9_]+$/.test(name)) throw new Error(`Invalid secret name: ${name}`)
    return join(this.dir, `${name}.bin`)
  }
}
