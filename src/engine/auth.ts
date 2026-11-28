import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { AuthStatus } from '@shared/engine'

const PROVIDER_ID = 'dazzi'

type StoredCredential = { type: 'oauth'; access: string; refresh: string; expires: number; email?: string }

/**
 * Dazzi Models sign-in. AutoRAG reads the credential from Pi's `auth.json`, the same file its own
 * `/login` writes, so signing in here also works for the `autorag` CLI and the other way around.
 */
export class DazziAuth {
  private abort?: AbortController

  constructor(
    private readonly authPath: string,
    private readonly openUrl: (url: string) => void
  ) {}

  static async create(openUrl: (url: string) => void): Promise<DazziAuth> {
    const { getAgentDir } = await import('@earendil-works/pi-coding-agent')
    return new DazziAuth(join(getAgentDir(), 'auth.json'), openUrl)
  }

  status(): AuthStatus {
    const credential = this.read()[PROVIDER_ID]
    const signedIn = typeof credential?.access === 'string' && credential.access !== ''
    return {
      provider: 'dazzi',
      signedIn,
      ...(signedIn && credential?.email ? { email: credential.email } : {})
    }
  }

  /** Opens the browser for a PKCE sign-in and stores the returned key. */
  async login(): Promise<AuthStatus> {
    this.cancel()
    const abort = new AbortController()
    this.abort = abort
    const { loginDazzi, resolveBaseUrl } = await import('@autorag/librarian')
    try {
      const credentials = await loginDazzi(
        {
          signal: abort.signal,
          onAuth: ({ url }) => this.openUrl(url),
          onDeviceCode: () => undefined,
          onSelect: async () => undefined,
          // The browser callback normally wins. This prompt only settles when the sign-in is cancelled,
          // so an empty answer never races the real callback.
          onPrompt: () =>
            new Promise<string>((_resolve, reject) => {
              abort.signal.addEventListener('abort', () => reject(new Error('Sign-in cancelled')), {
                once: true
              })
            })
        },
        { baseUrl: resolveBaseUrl(process.env) }
      )
      // A logout or a newer sign-in may have cancelled this one while the browser was open.
      if (abort.signal.aborted || this.abort !== abort) throw new Error('Sign-in cancelled')
      this.write({
        type: 'oauth',
        access: credentials.access,
        refresh: credentials.refresh,
        expires: credentials.expires,
        ...(typeof credentials['email'] === 'string' ? { email: credentials['email'] } : {})
      })
      return this.status()
    } finally {
      if (this.abort === abort) this.abort = undefined
    }
  }

  cancel(): void {
    this.abort?.abort()
    this.abort = undefined
  }

  logout(): AuthStatus {
    // Stop a pending sign-in so it cannot write a credential back after logout.
    this.cancel()
    const data = this.read()
    delete data[PROVIDER_ID]
    this.save(data)
    return this.status()
  }

  private read(): Record<string, StoredCredential | undefined> {
    if (!existsSync(this.authPath)) return {}
    try {
      return JSON.parse(readFileSync(this.authPath, 'utf8')) as Record<string, StoredCredential>
    } catch {
      return {}
    }
  }

  private write(credential: StoredCredential): void {
    this.save({ ...this.read(), [PROVIDER_ID]: credential })
  }

  private save(data: Record<string, StoredCredential | undefined>): void {
    mkdirSync(dirname(this.authPath), { recursive: true })
    const temp = `${this.authPath}.${process.pid}.tmp`
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
    renameSync(temp, this.authPath)
    chmodSync(this.authPath, 0o600)
  }
}
