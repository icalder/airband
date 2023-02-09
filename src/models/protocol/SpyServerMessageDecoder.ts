import { ClientSync } from './ClientSync'
import { DeviceInfo } from './DeviceInfo'
import { MessageHeader, MessageType } from './MessageHeader'

export type DeviceInfoCallback = (msg: DeviceInfo) => void
export type ClientSyncCallback = (msg: ClientSync) => void
export type SamplesCallback = (msg: Uint8Array) => void

export class SpyServerMessageDecoder {
  private deviceInfoWatchers: DeviceInfoCallback[] = []
  private clientSyncWatchers: ClientSyncCallback[] = []
  private fftSamplesWatchers: SamplesCallback[] = []
  private iqSamplesWatchers: SamplesCallback[] = []
  deviceInfo?: DeviceInfo
  clientSync?: ClientSync
  private seenTypes: MessageType[] = []

  public decodeMessage(data: ArrayBuffer): MessageHeader {
    const messageHeader = new MessageHeader(data)
    const body = data.slice(MessageHeader.size)
    switch (messageHeader.messageType) {
      case MessageType.DEVICE_INFO:
        this.deviceInfo = new DeviceInfo(body)
        this.deviceInfoWatchers.forEach((w) => w(this.deviceInfo!))
        break
      case MessageType.CLIENT_SYNC:
        this.clientSync = new ClientSync(body)
        this.clientSyncWatchers.forEach((w) => w(this.clientSync!))
        break
      case MessageType.UINT8_FFT: {
        const samples = new Uint8Array(body)
        this.fftSamplesWatchers.forEach((w) => w(samples))
        break
      }
      case MessageType.UINT8_IQ: {
        const samples = new Uint8Array(body)
        this.iqSamplesWatchers.forEach((w) => w(samples))
        break
      }
      default:
        if (!this.seenTypes.includes(messageHeader.messageType!)) {
          this.seenTypes.push(messageHeader.messageType!)
          console.log(`Got new message type ${messageHeader.messageType}`)
        }
        break
    }
    return messageHeader
  }

  public watchDeviceInfo(watcher: DeviceInfoCallback) {
    this.deviceInfoWatchers.push(watcher)
  }

  public watchClientSync(watcher: ClientSyncCallback) {
    this.clientSyncWatchers.push(watcher)
  }

  public watchFFTSamples(watcher: SamplesCallback) {
    this.fftSamplesWatchers.push(watcher)
  }

  public watchIQSamples(watcher: SamplesCallback) {
    this.iqSamplesWatchers.push(watcher)
  }
}
