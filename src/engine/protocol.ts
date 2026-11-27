import type {
  AnswerEvent,
  AuthStatus,
  EngineStatus,
  PromiseItem,
  SearchRequest,
  SearchResponse,
  SourceProbe
} from '@shared/engine'
import type { Settings } from '@shared/settings'

/** Requests the main process can send to the engine process, with their results. */
export interface EngineMethods {
  configure: { params: { settings: Settings }; result: void }
  refresh: { params: { force?: boolean }; result: EngineStatus }
  status: { params: Record<string, never>; result: EngineStatus }
  search: { params: SearchRequest & { myNames: string[] }; result: SearchResponse }
  answer: { params: SearchRequest & { requestId: string }; result: void }
  cancelAnswer: { params: { requestId: string }; result: void }
  promises: { params: { myNames: string[] }; result: Omit<PromiseItem, 'status'>[] }
  probeSources: { params: Record<string, never>; result: SourceProbe[] }
  authStatus: { params: Record<string, never>; result: AuthStatus }
  login: { params: Record<string, never>; result: AuthStatus }
  cancelLogin: { params: Record<string, never>; result: void }
  logout: { params: Record<string, never>; result: AuthStatus }
}

export type EngineMethod = keyof EngineMethods

export interface EngineRequest<M extends EngineMethod = EngineMethod> {
  kind: 'request'
  id: number
  method: M
  params: EngineMethods[M]['params']
}

export interface EngineResponse {
  kind: 'response'
  id: number
  ok: boolean
  result?: unknown
  error?: string
}

/** Pushed from the engine without a request. */
export type EngineEvent =
  | { kind: 'event'; event: 'status'; data: EngineStatus }
  | { kind: 'event'; event: 'answer'; data: { requestId: string; event: AnswerEvent } }
  | { kind: 'event'; event: 'open-url'; data: { url: string } }

export type EngineMessage = EngineResponse | EngineEvent
