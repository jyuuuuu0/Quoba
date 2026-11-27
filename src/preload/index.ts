import { contextBridge } from 'electron'

const api = {
  platform: process.platform
}

contextBridge.exposeInMainWorld('quoba', api)

export type QuobaApi = typeof api
