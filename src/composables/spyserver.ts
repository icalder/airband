import { ref, reactive, toRefs } from 'vue'
import { WSClient } from '@/lib/wsclient'
import { HelloCommand } from '@/models/commands/HelloCommand'
import { SpyServerMessageDecoder } from '@/models/protocol/SpyServerMessageDecoder'
import { DeviceInfo } from '@/models/protocol/DeviceInfo'
import { ClientSync } from '@/models/protocol/ClientSync'
import {
  SetCommand,
  SettingType,
  StreamFormat,
  StreamType,
} from '@/models/commands/SetCommand'

export type ErrorHandler = (err: Error) => void
export type SampleRateChangedCallback = (sampleRate: number) => void
export type FrequencyChangedCallback = (frequency: number) => void
export type SamplesHandler = (data: Uint8Array) => void
export type DeviceInfoCallback = (deviceInfo: DeviceInfo) => void
export type ClientSyncCallback = (clientSync: ClientSync) => void

export class SpyServer {
  private client: WSClient
  private messageDecoder: SpyServerMessageDecoder
  private errorHandlers: ErrorHandler[] = []
  private sampleRateChangedCallbacks: SampleRateChangedCallback[] = []
  private frequencyChangedCallbacks: FrequencyChangedCallback[] = []
  private iqSamplesHandlers: SamplesHandler[] = []
  private fftSamplesHandlers: SamplesHandler[] = []
  private deviceInfoCallbacks: DeviceInfoCallback[] = []
  private clientSyncCallbacks: ClientSyncCallback[] = []
  private _connected = ref(false)
  private _state = reactive({
    deviceInfo: undefined as undefined | DeviceInfo,
    clientSync: undefined as undefined | ClientSync,
    frequency: 0,
    fftSampleRate: 0,
    iqSampleRate: 0,
    streaming: false,
    gainSettings: [] as number[],
  })

  private _samples = reactive({
    iq: new Uint8Array(),
    fft: new Uint8Array(),
  })

  constructor(fftSampleRate: number = 37500, iqSampleRate: number = 9375) {
    this.messageDecoder = new SpyServerMessageDecoder()
    this.messageDecoder.watchDeviceInfo((deviceInfo) => {
      this._state.deviceInfo = deviceInfo
      this._state.gainSettings = Array.from(Array(deviceInfo.maxGain).keys())
      // Find the nearest (equal to or higher than desired) available sample rates
      fftSampleRate =
        deviceInfo.availableSampleRates
          .reverse()
          .find((sr) => sr >= fftSampleRate) || fftSampleRate
      iqSampleRate =
        deviceInfo.availableSampleRates
          .reverse()
          .find((sr) => sr >= iqSampleRate) || iqSampleRate
      this.setFFTSampleRate(fftSampleRate)
      this.setIQSampleRate(iqSampleRate)
      this.deviceInfoCallbacks.forEach((c) => c(deviceInfo))
    })
    this.messageDecoder.watchClientSync((clientSync) => {
      this._state.clientSync = clientSync
      this._state.frequency = clientSync.deviceCentreFreq
      this.clientSyncCallbacks.forEach((c) => c(clientSync))
    })
    this.messageDecoder.watchFFTSamples((data) => {
      this._samples.fft = data
      this.fftSamplesHandlers.forEach((h) => h(data))
    })
    this.messageDecoder.watchIQSamples((data) => {
      this._samples.iq = data
      this.iqSamplesHandlers.forEach((h) => h(data))
    })

    this.client = new WSClient()
    this.client.onClose(() => this.close())
    this.client.addMessageHandler((data) => {
      if (data instanceof ArrayBuffer) {
        this.messageDecoder.decodeMessage(data)
      }
    })
    this.client.onError((err: Error) => {
      this.errorHandlers.forEach((h) => h(err))
      this.stopStreaming()
      this.close()
    })
  }

  addErrorHandler(callback: ErrorHandler) {
    this.errorHandlers.push(callback)
  }

  addSampleRateChangedCallback(callback: SampleRateChangedCallback) {
    this.sampleRateChangedCallbacks.push(callback)
  }

  addFrequencyChangedCallback(callback: FrequencyChangedCallback) {
    this.frequencyChangedCallbacks.push(callback)
  }

  addIQSamplesHandler(callback: SamplesHandler) {
    this.iqSamplesHandlers.push(callback)
  }

  addFFTSamplesHandler(callback: SamplesHandler) {
    this.fftSamplesHandlers.push(callback)
  }

  addDeviceInfoCallback(callback: DeviceInfoCallback) {
    this.deviceInfoCallbacks.push(callback)
  }

  addClientSyncCallback(callback: ClientSyncCallback) {
    this.clientSyncCallbacks.push(callback)
  }

  connect(addr: string) {
    this.client
      .connect(addr)
      .then(() => {
        this._connected.value = true
        const command = new HelloCommand('airbandjs')
        command.send(this.client)
        this.setStreamMode(
          StreamType.STREAM_TYPE_FFT | StreamType.STREAM_TYPE_IQ
        )
      })
      .catch((err) => this.errorHandlers.forEach((h) => h(err)))
  }

  setStreamMode(mode: StreamType) {
    const command = new SetCommand(SettingType.STREAMING_MODE, mode.valueOf())
    command.send(this.client)
  }

  startStreaming() {
    const command = new SetCommand(SettingType.STREAMING_ENABLED, 1)
    command.send(this.client)
    this._state.streaming = true
  }

  stopStreaming() {
    const command = new SetCommand(SettingType.STREAMING_ENABLED, 0)
    command.send(this.client)
    this._state.streaming = false
  }

  disconnect() {
    this.client.disconnect()
    this.close()
  }

  private close() {
    this._connected.value = false
    this._state.streaming = false
    // this._state.deviceInfo = undefined
    // this._state.clientSync = undefined
  }

  // https://github.com/miweber67/spyserver_client/blob/master/ss_client_if.cc
  // https://github.com/racerxdl/gr-osmosdr

  setCentreFrequency(frequency: number) {
    if (frequency.toString().includes('.')) {
      // we have a decimal point - assume MHz
      frequency *= 1e6
    }
    let command = new SetCommand(SettingType.FFT_FREQUENCY, frequency)
    command.send(this.client)

    // set the IQ freq too, for now - it needs to be within the FFT band
    command = new SetCommand(SettingType.IQ_FREQUENCY, frequency)
    command.send(this.client)
    this._state.frequency = frequency
    this.sendSyncCommand()
    this.frequencyChangedCallbacks.forEach((cb) => cb(frequency))
  }

  setFFTSampleRate(sampleRate: number) {
    // Given the sample rate, work out the decimation stages required
    const ratio = this.state.deviceInfo.value!.maxSampleRate / sampleRate
    const decimation = Math.log2(ratio)

    const command = new SetCommand(SettingType.FFT_DECIMATION, decimation)
    command.send(this.client)
    this._state.fftSampleRate = sampleRate
    this.sendSyncCommand()
  }

  setIQSampleRate(sampleRate: number) {
    // Given the sample rate, work out the decimation stages required
    const ratio = this.state.deviceInfo.value!.maxSampleRate / sampleRate
    const decimation = Math.log2(ratio)

    const command = new SetCommand(SettingType.IQ_DECIMATION, decimation)
    command.send(this.client)
    this._state.iqSampleRate = sampleRate
    this.sendSyncCommand()
    this.sampleRateChangedCallbacks.forEach((cb) => cb(sampleRate))
  }

  setGain(gain: number) {
    gain = Math.round(gain)
    const command = new SetCommand(SettingType.GAIN, gain)
    command.send(this.client)
    if (this._state.clientSync) {
      this._state.clientSync.gain = gain
    }
    this.sendSyncCommand()
  }

  private sendSyncCommand() {
    // Send something that makes the spyserver
    // issue a new ClientSync message

    let command = new SetCommand(
      SettingType.FFT_FORMAT,
      StreamFormat.STREAM_FORMAT_UINT8
    )
    command.send(this.client)

    command = new SetCommand(
      SettingType.IQ_FORMAT,
      StreamFormat.STREAM_FORMAT_UINT8
    )
    command.send(this.client)
  }

  get connected() {
    return this._connected
  }

  get state() {
    return toRefs(this._state)
  }

  get samples() {
    return toRefs(this._samples)
  }
}
