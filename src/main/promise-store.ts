import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import type { PromiseStatus } from '@shared/engine'

/** Remembers which promises the user ticked off or dismissed. Promises themselves are found fresh each time. */
export class PromiseStore {
  private readonly path = join(app.getPath('userData'), 'promises.json')
  private statuses: Record<string, PromiseStatus>

  constructor() {
    try {
      this.statuses = existsSync(this.path) ? JSON.parse(readFileSync(this.path, 'utf8')) : {}
    } catch {
      this.statuses = {}
    }
  }

  status(id: string): PromiseStatus {
    return this.statuses[id] ?? 'open'
  }

  set(id: string, status: PromiseStatus): void {
    const next = { ...this.statuses }
    if (status === 'open') delete next[id]
    else next[id] = status
    // Write first: memory only changes once the file holds the new status.
    mkdirSync(dirname(this.path), { recursive: true })
    const temp = `${this.path}.tmp`
    writeFileSync(temp, JSON.stringify(next))
    renameSync(temp, this.path)
    this.statuses = next
  }
}
