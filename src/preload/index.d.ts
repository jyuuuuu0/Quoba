import type { QuobaApi } from './index'

declare global {
  interface Window {
    quoba: QuobaApi
  }
}

export {}
