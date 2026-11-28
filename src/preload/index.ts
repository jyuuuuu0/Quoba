import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { EventChannel, InvokeChannel, QuobaEvents, QuobaInvoke } from '@shared/ipc'

function invoke<C extends InvokeChannel>(
  channel: C,
  ...params: QuobaInvoke[C]['params'] extends void ? [] : [QuobaInvoke[C]['params']]
): Promise<QuobaInvoke[C]['result']> {
  return ipcRenderer.invoke(channel, ...params)
}

function on<C extends EventChannel>(channel: C, listener: (payload: QuobaEvents[C]) => void): () => void {
  const wrapped = (_event: IpcRendererEvent, payload: QuobaEvents[C]): void => listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.removeListener(channel, wrapped)
}

const api = {
  platform: process.platform,
  invoke,
  on
}

contextBridge.exposeInMainWorld('quoba', api)

export type QuobaApi = typeof api
