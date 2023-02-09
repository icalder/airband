export type MessageHandler = (ev: MessageEvent) => void

export class WSClient {
  private ws?: WebSocket
  private messageHandlers: MessageHandler[] = []
  private onCloseHandler?: () => void
  private onErrorHandler?: (ev: Error) => void

  connect(addr: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(addr)
      this.ws.onerror = () => reject(new Error('Connection failed'))
      this.ws.binaryType = 'arraybuffer'
      this.ws.onclose = () => {
        if (this.onCloseHandler) {
          this.onCloseHandler()
        }
      }
      this.ws.onmessage = (ev: MessageEvent) => {
        this.messageHandlers.forEach((h) => h(ev.data))
      }
      this.ws.onopen = (_: Event) => {
        this.ws!.onerror = (ev: Event) => {
          if (this.onErrorHandler) {
            this.onErrorHandler(new Error(ev.type))
          }
        }
        resolve()
      }
    })
  }

  disconnect() {
    this.ws?.close()
    this.ws = undefined
  }

  get socket(): WebSocket {
    return this.ws!
  }

  onClose(callback: () => void) {
    this.onCloseHandler = callback
  }

  onError(callback: (err: Error) => void) {
    this.onErrorHandler = callback
  }

  addMessageHandler(callback: MessageHandler) {
    this.messageHandlers.push(callback)
  }

  send(data: string | ArrayBuffer) {
    this.ws!.send(data)
  }

  sendRPC<T>(data: string | ArrayBuffer): Promise<T> {
    return new Promise((resolve, reject) => {
      this.ws!.onmessage = (ev: MessageEvent) => resolve(ev.data)
      this.ws!.onerror = (ev: Event) => reject(ev)
      this.send(data)
    })
  }
}
