import type {
  AnswerEvent,
  AuthStatus,
  EngineStatus,
  PromiseItem,
  PromiseStatus,
  SearchRequest,
  SearchResponse,
  SourceProbe
} from './engine'
import type { Settings, SettingsPatch } from './settings'

/** Everything the window can ask the main process for. */
export interface QuobaInvoke {
  'settings:get': { params: void; result: Settings }
  'settings:update': { params: SettingsPatch; result: Settings }
  'engine:status': { params: void; result: EngineStatus }
  'engine:refresh': { params: { force?: boolean }; result: EngineStatus }
  'search:run': { params: SearchRequest; result: SearchResponse }
  'answer:start': { params: SearchRequest; result: { requestId: string } }
  'answer:cancel': { params: { requestId: string }; result: void }
  'promises:list': { params: void; result: PromiseItem[] }
  'promises:setStatus': { params: { id: string; status: PromiseStatus }; result: void }
  'sources:probe': { params: void; result: SourceProbe[] }
  'sources:pickFolder': { params: void; result: string | null }
  'sources:setToken': { params: { sourceId: 'github'; token: string | null }; result: void }
  'auth:status': { params: void; result: AuthStatus }
  'auth:login': { params: void; result: AuthStatus }
  'auth:cancel': { params: void; result: void }
  'auth:logout': { params: void; result: AuthStatus }
  'app:openExternal': { params: { url: string }; result: void }
}

export type InvokeChannel = keyof QuobaInvoke

/** Pushed from the main process to the window. */
export interface QuobaEvents {
  'engine:status': EngineStatus
  answer: { requestId: string; event: AnswerEvent }
  'settings:changed': Settings
  shortcut: { action: string }
}

export type EventChannel = keyof QuobaEvents
