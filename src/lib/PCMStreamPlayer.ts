// https://github.com/WebAudio/web-audio-api/issues/1825
// https://github.com/AnthumChris/fetch-stream-audio/blob/master/src/js/modules/audio-stream-player.mjs
// https://github.com/72lions/PlayingChunkedMP3-WebAudioAPI
// https://stackoverflow.com/questions/28440262/web-audio-api-for-live-streaming/62870119#62870119

import { reactive, toRefs } from 'vue'
import { AudioBuffers } from './AudioBuffers'
import { Tuner } from './Tuner'

export class PCMStreamPlayer {
  private context = new AudioContext()
  private buffers?: AudioBuffers

  private _state = reactive({
    playing: false,
    volume: 5,
  })

  constructor(private tuner: Tuner) {
    tuner.addSampleRateChangedCallback((sampleRate: number) => {
      this.buffers = new AudioBuffers(this.context, sampleRate)
    })
    tuner.addDemodulatedSignalHandler((signal) => this.readSignal(signal))
  }

  get state() {
    return toRefs(this._state)
  }

  public get playing() {
    return this._state.playing
  }

  public get volume() {
    return this._state.volume
  }

  public set volume(val: number) {
    this._state.volume = val
  }

  readSignal(signal: Float32Array) {
    if (!this.playing) {
      return
    }
    if (this.volume > 1) {
      for (let i = 0; i !== signal.length; ++i) {
        signal[i] *= this.volume
      }
    }
    if (this.buffers) {
      this.buffers.addSamples(signal)
    }
  }

  start() {
    if (this.buffers) {
      this._state.playing = true
    }
  }

  stop() {
    this._state.playing = false
    this.buffers?.reset()
  }
}
