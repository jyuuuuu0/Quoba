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
    if (status === 'open') delete this.statuses[id]
    else this.statuses[id] = status
    mkdirSync(dirname(this.path), { recursive: true })
    const temp = `${this.path}.tmp`
    writeFileSync(temp, JSON.stringify(this.statuses))
    renameSync(temp, this.path)
  }
}
