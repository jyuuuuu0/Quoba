import { join } from 'node:path'
import { app, shell, utilityProcess, type UtilityProcess } from 'electron'
import type { AnswerEvent, EngineStatus } from '@shared/engine'
import type { EngineEvent, EngineMessage, EngineMethod, EngineMethods } from '../engine/protocol'

interface Pending {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export interface EngineListeners {
  onStatus: (status: EngineStatus) => void
  onAnswer: (requestId: string, event: AnswerEvent) => void
}

/** Owns the AutoRAG utility process and turns its messages into promises and callbacks. */
export class EngineClient {
  private child?: UtilityProcess
  private nextId = 1
  private readonly pending = new Map<number, Pending>()
  private extraEnv: Record<string, string> = {}

  constructor(private readonly listeners: EngineListeners) {}

  start(extraEnv: Record<string, string> = {}): void {
    this.extraEnv = extraEnv
    const child = utilityProcess.fork(join(import.meta.dirname, 'engine.js'), [], {
      serviceName: 'Quoba Engine',
      env: {
        ...process.env,
        ...extraEnv,
        AUTORAG_HOME: join(app.getPath('userData'), 'autorag')
      }
    })
    child.on('message', (message: EngineMessage) => this.handle(message))
    child.on('exit', (code) => {
      for (const pending of this.pending.values()) pending.reject(new Error(`Engine exited (${code})`))
      this.pending.clear()
      if (this.child === child) this.child = undefined
    })
    this.child = child
  }

  /** Restarts the engine, for example after a token changes its environment. */
  async restart(extraEnv: Record<string, string>): Promise<void> {
    this.child?.kill()
    this.child = undefined
    this.start({ ...this.extraEnv, ...extraEnv })
  }

  request<M extends EngineMethod>(
    method: M,
    params: EngineMethods[M]['params']
  ): Promise<EngineMethods[M]['result']> {
    const child = this.child
    if (!child) return Promise.reject(new Error('Engine is not running'))
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject })
      child.postMessage({ kind: 'request', id, method, params })
    })
  }

  stop(): void {
    this.child?.kill()
    this.child = undefined
  }

  private handle(message: EngineMessage): void {
    if (message.kind === 'response') {
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.ok) pending.resolve(message.result)
      else pending.reject(new Error(message.error ?? 'Engine error'))
      return
    }
    this.handleEvent(message)
  }

  private handleEvent(message: EngineEvent): void {
    switch (message.event) {
      case 'status':
        this.listeners.onStatus(message.data)
        break
      case 'answer':
        this.listeners.onAnswer(message.data.requestId, message.data.event)
        break
      case 'open-url':
        // Only the Dazzi sign-in page is opened, and only over https.
        if (message.data.url.startsWith('https://')) void shell.openExternal(message.data.url)
        break
    }
  }
}
